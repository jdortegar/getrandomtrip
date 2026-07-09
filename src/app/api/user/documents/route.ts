import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toDateOnlyString(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

function toDateOrNull(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  return new Date(value);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        idNumber: true,
        idCountry: true,
        idExpiry: true,
        passportNumber: true,
        passportCountry: true,
        passportExpiry: true,
        approvedVisas: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        idNumber: user.idNumber ?? "",
        idCountry: user.idCountry ?? "",
        idExpiry: toDateOnlyString(user.idExpiry),
        passportNumber: user.passportNumber ?? "",
        passportCountry: user.passportCountry ?? "",
        passportExpiry: toDateOnlyString(user.passportExpiry),
        approvedVisas: user.approvedVisas,
      },
    });
  } catch (error) {
    console.error("Error fetching travel documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      idNumber,
      idCountry,
      idExpiry,
      passportNumber,
      passportCountry,
      passportExpiry,
      approvedVisas,
    } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        idNumber,
        idCountry,
        idExpiry: toDateOrNull(idExpiry),
        passportNumber,
        passportCountry,
        passportExpiry: toDateOrNull(passportExpiry),
        approvedVisas,
      },
      select: {
        idNumber: true,
        idCountry: true,
        idExpiry: true,
        passportNumber: true,
        passportCountry: true,
        passportExpiry: true,
        approvedVisas: true,
      },
    });

    return NextResponse.json({
      user: {
        idNumber: updatedUser.idNumber ?? "",
        idCountry: updatedUser.idCountry ?? "",
        idExpiry: toDateOnlyString(updatedUser.idExpiry),
        passportNumber: updatedUser.passportNumber ?? "",
        passportCountry: updatedUser.passportCountry ?? "",
        passportExpiry: toDateOnlyString(updatedUser.passportExpiry),
        approvedVisas: updatedUser.approvedVisas,
      },
    });
  } catch (error) {
    console.error("Error updating travel documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
