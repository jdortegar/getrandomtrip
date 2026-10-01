/**
 * One-off backfill: send the companion invite email to ADULT travelers who were
 * added before invites went out automatically.
 *
 * Candidates: ADULT rows with a non-empty email, `invitedAt` null, `userId`
 * null, on a trip with an APPROVED payment that is not cancelled and has not
 * ended yet.
 *
 * DRY RUN BY DEFAULT: prints the candidate table (masked emails) and sends
 * nothing. `--send` issues a token and sends the email, one row at a time, and
 * is refused unless RT_DEPLOY_ENV=production (outside production `sendMail`
 * throws). Review the dry-run list with the owner before using `--send`.
 *
 *   npx tsx scripts/backfill-companion-invites.ts            # dry run
 *   RT_DEPLOY_ENV=production npx tsx scripts/backfill-companion-invites.ts --send
 *
 * A row whose token was issued but whose email failed no longer matches
 * (`invitedAt` is set): the report lists it; resend it from the buyer roster.
 */
import { isTripEnded } from "../src/lib/travelers/travelerPolicy";
import { maskEmail } from "../src/lib/travelers/travelerEmail";
import { withPrisma } from "./lib/withPrisma";

export interface BackfillRow {
  id: string;
  kind: string;
  status: string;
  email: string | null;
  invitedAt: Date | null;
  userId: string | null;
  tripRequest: {
    id: string;
    type: string;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    user: { name: string | null };
    payment: { status: string } | null;
  };
}

export interface BackfillCandidate {
  travelerId: string;
  tripRequestId: string;
  status: string;
  buyerName: string;
  maskedEmail: string;
  startDate: Date | null;
  endDate: Date | null;
  tripType: string;
}

export interface BackfillClient {
  tripTraveler: {
    findMany: (args: Record<string, unknown>) => Promise<BackfillRow[]>;
  };
}

export interface BackfillDeps {
  issueInvite: (travelerId: string, status: string) => Promise<string>;
  deliver: (travelerId: string, plaintextToken: string) => Promise<void>;
  log: (line: string) => void;
}

export interface BackfillSendResult {
  travelerId: string;
  ok: boolean;
  error?: string;
}

/** Pure selection — re-applies every criterion so it is safe on any row set. */
export function selectBackfillCandidates(
  rows: BackfillRow[],
  now: number = Date.now(),
): BackfillCandidate[] {
  return rows
    .filter(
      (row) =>
        row.kind === "ADULT" &&
        Boolean(row.email?.trim()) &&
        row.invitedAt === null &&
        row.userId === null &&
        row.tripRequest.payment?.status === "APPROVED" &&
        row.tripRequest.status !== "CANCELLED" &&
        !isTripEnded(row.tripRequest, now),
    )
    .map((row) => ({
      travelerId: row.id,
      tripRequestId: row.tripRequest.id,
      status: row.status,
      buyerName: row.tripRequest.user.name ?? "",
      maskedEmail: maskEmail(row.email) ?? "",
      startDate: row.tripRequest.startDate,
      endDate: row.tripRequest.endDate,
      tripType: row.tripRequest.type,
    }));
}

const isoDay = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : "-");

export function formatCandidateTable(candidates: BackfillCandidate[]): string {
  if (candidates.length === 0) return "No candidates.";
  const header = ["traveler", "trip", "buyer", "companion", "start", "end", "type"];
  const body = candidates.map((c) => [
    c.travelerId,
    c.tripRequestId,
    c.buyerName,
    c.maskedEmail,
    isoDay(c.startDate),
    isoDay(c.endDate),
    c.tripType,
  ]);
  const widths = header.map((h, i) => Math.max(h.length, ...body.map((r) => r[i].length)));
  const line = (cells: string[]) => cells.map((cell, i) => cell.padEnd(widths[i])).join("  ").trimEnd();
  return [line(header), ...body.map(line)].join("\n");
}

export async function runBackfill(
  client: BackfillClient,
  options: { send: boolean; env?: string; now?: number },
  deps: BackfillDeps,
): Promise<{
  mode: "dry-run" | "send";
  candidates: BackfillCandidate[];
  results: BackfillSendResult[];
}> {
  if (options.send && options.env !== "production") {
    throw new Error(
      "Refusing --send: set RT_DEPLOY_ENV=production (sendMail throws outside production).",
    );
  }

  const rows = await client.tripTraveler.findMany({
    where: {
      kind: "ADULT",
      email: { not: null },
      invitedAt: null,
      userId: null,
      tripRequest: {
        payment: { is: { status: "APPROVED" } },
        status: { not: "CANCELLED" },
      },
    },
    select: {
      id: true,
      kind: true,
      status: true,
      email: true,
      invitedAt: true,
      userId: true,
      tripRequest: {
        select: {
          id: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          user: { select: { name: true } },
          payment: { select: { status: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const candidates = selectBackfillCandidates(rows, options.now);
  deps.log(formatCandidateTable(candidates));
  deps.log(`${candidates.length} candidate(s).`);

  if (!options.send) {
    deps.log("Dry run: nothing sent. Re-run with --send to send these invites.");
    return { mode: "dry-run", candidates, results: [] };
  }

  const results: BackfillSendResult[] = [];
  for (const candidate of candidates) {
    try {
      const plaintext = await deps.issueInvite(candidate.travelerId, candidate.status);
      await deps.deliver(candidate.travelerId, plaintext);
      results.push({ travelerId: candidate.travelerId, ok: true });
      deps.log(`sent     ${candidate.travelerId} -> ${candidate.maskedEmail}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ travelerId: candidate.travelerId, ok: false, error: message });
      deps.log(`FAILED   ${candidate.travelerId} -> ${candidate.maskedEmail}: ${message}`);
    }
  }
  return { mode: "send", candidates, results };
}

const isMainModule =
  process.argv[1]?.endsWith("backfill-companion-invites.ts") ?? false;

if (isMainModule) {
  const send = process.argv.includes("--send");
  const env = process.env.RT_DEPLOY_ENV;
  // Refuse before any env file, database or mail module is loaded.
  if (send && env !== "production") {
    console.error(
      "Refusing --send: set RT_DEPLOY_ENV=production (sendMail throws outside production).",
    );
    process.exitCode = 1;
  } else {
    withPrisma(async (client) => {
      // App modules read DATABASE_URL at import time, so load them only now.
      const { issueTravelerInvite } = await import("../src/lib/travelers/travelerInviteTokens");
      const { deliverTravelerInviteEmail } = await import("../src/lib/email");
      const { results } = await runBackfill(
        client as unknown as BackfillClient,
        { send, env },
        {
          issueInvite: (id, status) =>
            issueTravelerInvite(id, status as Parameters<typeof issueTravelerInvite>[1]),
          deliver: deliverTravelerInviteEmail,
          log: (line) => console.log(line),
        },
      );
      if (results.some((r) => !r.ok)) process.exitCode = 1;
    }).catch((e) => {
      console.error(e);
      process.exitCode = 1;
    });
  }
}
