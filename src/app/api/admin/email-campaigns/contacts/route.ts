import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/requireAdmin";
import {
  ContactError,
  createFriendsFamilyContact,
  listContacts,
} from "@/lib/email-campaigns/contacts";
import {
  contactListQuerySchema,
  createContactSchema,
} from "@/lib/validation/emailCampaigns";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const searchParams = request.nextUrl.searchParams;
    const parsed = contactListQuerySchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      source: searchParams.get("source") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      q: searchParams.get("q") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    return NextResponse.json(await listContacts(parsed.data));
  } catch (error) {
    console.error("[admin/email-campaigns/contacts] GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const body: unknown = await request.json().catch(() => null);
    const parsed = createContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const contact = await createFriendsFamilyContact(parsed.data);
    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    if (error instanceof ContactError && error.code === "duplicate_email") {
      return NextResponse.json({ error: error.code }, { status: 409 });
    }
    console.error("[admin/email-campaigns/contacts] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
