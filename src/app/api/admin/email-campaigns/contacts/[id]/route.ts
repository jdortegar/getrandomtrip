import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/requireAdmin";
import { ContactError, updateContact } from "@/lib/email-campaigns/contacts";
import { updateContactSchema } from "@/lib/validation/emailCampaigns";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const body: unknown = await request.json().catch(() => null);
    const parsed = updateContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const contact = await updateContact(params.id, parsed.data);
    return NextResponse.json({ contact });
  } catch (error) {
    if (error instanceof ContactError) {
      if (error.code === "not_found") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (
        error.code === "invalid_status_change" ||
        error.code === "invalid_segment"
      ) {
        return NextResponse.json({ error: error.code }, { status: 400 });
      }
    }
    console.error("[admin/email-campaigns/contacts/[id]] PATCH", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
