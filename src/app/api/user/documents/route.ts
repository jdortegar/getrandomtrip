import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isIsoCountryCode,
  isVisaCode,
  normalizeCountryCodes,
  normalizeVisaCodes,
} from "@/lib/geo/countryOptions";
import { resolveNationalityCode, toVisaCodes } from "@/lib/geo/visaCodes";

const DOCUMENTS_SELECT = {
  idNumber: true,
  idCountry: true,
  idExpiry: true,
  passportNumber: true,
  passportCountry: true,
  passportExpiry: true,
  nationalities: true,
  approvedVisas: true,
} as const;

interface DocumentsRow {
  idNumber: string | null;
  idCountry: string | null;
  idExpiry: Date | null;
  passportNumber: string | null;
  passportCountry: string | null;
  passportExpiry: Date | null;
  nationalities: string[];
  approvedVisas: string[];
}

function toDateOnlyString(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

function toDateOrNull(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  return new Date(value);
}

/**
 * Response shape. Legacy visa names are converted to codes on read (unresolved
 * ones are dropped, nothing is written back); empty nationalities are
 * prefilled from a resolvable `passportCountry`.
 */
function toDocumentsResponse(user: DocumentsRow) {
  const nationalities = normalizeCountryCodes(user.nationalities);
  const prefill = resolveNationalityCode(user.passportCountry);
  return {
    idNumber: user.idNumber ?? "",
    idCountry: user.idCountry ?? "",
    idExpiry: toDateOnlyString(user.idExpiry),
    passportNumber: user.passportNumber ?? "",
    passportCountry: user.passportCountry ?? "",
    passportExpiry: toDateOnlyString(user.passportExpiry),
    nationalities: nationalities.length === 0 && prefill ? [prefill] : nationalities,
    approvedVisas: toVisaCodes(user.approvedVisas).codes,
  };
}

type CodeListResult =
  | { ok: true; codes: string[] | undefined }
  | { ok: false; invalid: string[] };

/** Validates an optional code list; `undefined` means "leave the field unchanged". */
function parseCodeList(
  value: unknown,
  isValid: (code: string) => boolean,
  normalize: (values: readonly string[]) => string[],
): CodeListResult {
  if (value === undefined) return { ok: true, codes: undefined };
  if (!Array.isArray(value)) return { ok: false, invalid: [] };
  const invalid = value
    .filter((entry) => typeof entry !== "string" || !isValid(entry.trim().toUpperCase()))
    .map(String);
  if (invalid.length > 0) return { ok: false, invalid };
  return { ok: true, codes: normalize(value as string[]) };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: DOCUMENTS_SELECT,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: toDocumentsResponse(user) });
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
    } = body;

    const nationalities = parseCodeList(
      body.nationalities,
      isIsoCountryCode,
      normalizeCountryCodes,
    );
    if (!nationalities.ok) {
      return NextResponse.json(
        { error: "Invalid nationalities", invalid: nationalities.invalid },
        { status: 400 },
      );
    }
    const approvedVisas = parseCodeList(
      body.approvedVisas,
      isVisaCode,
      normalizeVisaCodes,
    );
    if (!approvedVisas.ok) {
      return NextResponse.json(
        { error: "Invalid approvedVisas", invalid: approvedVisas.invalid },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        idNumber,
        idCountry,
        idExpiry: toDateOrNull(idExpiry),
        passportNumber,
        passportCountry,
        passportExpiry: toDateOrNull(passportExpiry),
        nationalities: nationalities.codes,
        approvedVisas: approvedVisas.codes,
      },
      select: DOCUMENTS_SELECT,
    });

    return NextResponse.json({ user: toDocumentsResponse(updatedUser) });
  } catch (error) {
    console.error("Error updating travel documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
