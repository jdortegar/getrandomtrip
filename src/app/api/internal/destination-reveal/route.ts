import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendDestinationAssignmentReminder,
  sendDestinationRevealed,
} from "@/lib/email";

// ─── Auth guard ───────────────────────────────────────────────────────────────

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

// ─── Pass 1: T-72h admin assignment reminder ──────────────────────────────────

interface Pass1Result {
  reminded: number;
  escalated: number;
}

export async function runPass1(now: Date): Promise<Pass1Result> {
  const threshold72 = new Date(now.getTime() + 72 * 60 * 60 * 1000);
  const threshold48 = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Find CONFIRMED trips within T-72h that have NOT been notified yet
  const candidates = await prisma.tripRequest.findMany({
    where: {
      status: "CONFIRMED",
      startDate: { lte: threshold72, gte: now },
      destinationAssignmentNotifiedAt: null,
    },
    select: {
      id: true,
      startDate: true,
      experienceId: true,
      user: { select: { name: true } },
    },
  });

  // Also find already-notified trips inside T-48h with NO experience (re-escalation)
  const reEscalationCandidates = await prisma.tripRequest.findMany({
    where: {
      status: "CONFIRMED",
      startDate: { lte: threshold48, gte: now },
      experienceId: null,
      destinationAssignmentNotifiedAt: { not: null },
    },
    select: {
      id: true,
      startDate: true,
      experienceId: true,
      user: { select: { name: true } },
    },
  });

  // Get all admin users
  const admins = await prisma.user.findMany({
    where: { roles: { has: "ADMIN" } },
    select: { id: true },
  });

  let reminded = 0;
  let escalated = 0;

  // Process first-time notifications
  for (const trip of candidates) {
    try {
      // Create one Notification per admin
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "BOOKING_CONFIRMED",
            audience: "ADMIN",
            title: "Asignación de destino pendiente",
            body: `El viaje ${trip.id} sale en menos de 72 horas y no tiene experiencia asignada.`,
            metadata: { tripRequestId: trip.id },
          },
        });
      }

      sendDestinationAssignmentReminder(trip.id);

      await prisma.tripRequest.update({
        where: { id: trip.id },
        data: { destinationAssignmentNotifiedAt: now },
      });

      reminded++;
    } catch (err) {
      console.error(
        `[destination-reveal] Pass 1 error for trip ${trip.id}:`,
        err,
      );
    }
  }

  // Re-escalation: already-notified trips inside T-48h with no experience
  for (const trip of reEscalationCandidates) {
    try {
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "BOOKING_CONFIRMED",
            audience: "ADMIN",
            title: "URGENTE: Destino sin asignar — salida en menos de 48h",
            body: `El viaje ${trip.id} sale en menos de 48 horas y AÚN no tiene experiencia asignada.`,
            metadata: { tripRequestId: trip.id, escalation: true },
          },
        });
      }

      sendDestinationAssignmentReminder(trip.id);

      // Re-stamp so this re-escalation fires only once per 72h window
      await prisma.tripRequest.update({
        where: { id: trip.id },
        data: { destinationAssignmentNotifiedAt: now },
      });

      escalated++;
    } catch (err) {
      console.error(
        `[destination-reveal] Pass 1 re-escalation error for trip ${trip.id}:`,
        err,
      );
    }
  }

  return { reminded, escalated };
}

// ─── Pass 2: T-48h auto-reveal ────────────────────────────────────────────────

interface Pass2Result {
  revealed: number;
}

export async function runPass2(now: Date): Promise<Pass2Result> {
  const threshold48 = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Find CONFIRMED trips within T-48h that have an experience assigned
  const revealable = await prisma.tripRequest.findMany({
    where: {
      status: "CONFIRMED",
      startDate: { lte: threshold48, gte: now },
      experienceId: { not: null },
    },
    select: {
      id: true,
      userId: true,
      experienceId: true,
      actualDestination: true,
    },
  });

  let revealed = 0;

  for (const trip of revealable) {
    try {
      // Resolve destination from the assigned experience
      const experience = await prisma.experience.findUnique({
        where: { id: trip.experienceId! },
        select: { destinationCity: true, destinationCountry: true },
      });

      const actualDestination =
        trip.actualDestination ??
        (experience
          ? `${experience.destinationCity}, ${experience.destinationCountry}`
          : null);

      if (!actualDestination) {
        console.error(
          `[destination-reveal] Pass 2: no destination for trip ${trip.id}, skipping`,
        );
        continue;
      }

      // Guarded update — status guard ensures idempotency
      const updated = await prisma.tripRequest.updateMany({
        where: { id: trip.id, status: "CONFIRMED" },
        data: {
          status: "REVEALED",
          destinationRevealedAt: now,
          actualDestination,
        },
      });

      if (updated.count === 0) {
        // Already revealed by another process
        continue;
      }

      sendDestinationRevealed(trip.id, trip.userId);
      revealed++;
    } catch (err) {
      console.error(
        `[destination-reveal] Pass 2 error for trip ${trip.id}:`,
        err,
      );
    }
  }

  return { revealed };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const errors: string[] = [];

    let pass1Result: Pass1Result = { reminded: 0, escalated: 0 };
    let pass2Result: Pass2Result = { revealed: 0 };

    try {
      pass1Result = await runPass1(now);
    } catch (err) {
      const msg = `Pass 1 failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[destination-reveal] ${msg}`);
      errors.push(msg);
    }

    try {
      pass2Result = await runPass2(now);
    } catch (err) {
      const msg = `Pass 2 failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[destination-reveal] ${msg}`);
      errors.push(msg);
    }

    console.log(
      `[destination-reveal] pass1=${JSON.stringify(pass1Result)} pass2=${JSON.stringify(pass2Result)} errors=${errors.length}`,
    );

    return NextResponse.json({
      pass1: pass1Result,
      pass2: pass2Result,
      errors,
    });
  } catch (err) {
    console.error("[destination-reveal] Unhandled error:", err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 },
    );
  }
}
