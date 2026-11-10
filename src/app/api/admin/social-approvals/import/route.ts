import { after, NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { approvalConfig } from "@/lib/social-approvals/slackApproval";
import {
  resolveOwnedInstagramPost,
  instagramImportUrl,
} from "@/lib/social-approvals/importInstagram";
import { selectedCopyLocks } from "@/lib/ai/socialBrandPolicy";
import { importSocialReview } from "@/lib/db/importSocialReview";
import { dispatchSocialWorker } from "@/lib/social-approvals/dispatchSocialWorker";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });
  if (
    !user ||
    !hasRoleAccess(user, "admin") ||
    request.headers.get("origin") !== request.nextUrl.origin
  )
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (!approvalConfig() || process.env.SLACK_SOCIAL_AI_ENABLED !== "true")
    return NextResponse.json({ error: "IMPORT_DISABLED" }, { status: 503 });
  try {
    const raw = await request.text();
    if (raw.length > 10000)
      return NextResponse.json({ error: "REQUEST_TOO_LARGE" }, { status: 413 });
    const input = JSON.parse(raw) as {
      instagramUrl?: unknown;
      copyLocks?: unknown;
      useReviewedExample?: unknown;
    };
    const wanted = instagramImportUrl(input.instagramUrl);
    const locks = selectedCopyLocks(
      wanted.shortcode,
      input.copyLocks,
      input.useReviewedExample,
    );
    const source = await resolveOwnedInstagramPost(input.instagramUrl);
    const result = await importSocialReview(source, session.user.id, locks);
    after(async () => {
      try {
        await dispatchSocialWorker();
      } catch {
        console.error("[social-import] dispatch deferred to durable recovery");
      }
    });
    return NextResponse.json(
      { ...result, approvalRequired: true, publishingAllowed: false },
      { status: result.created ? 202 : 200 },
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const invalid = [
      "INVALID_INSTAGRAM_URL",
      "INVALID_COPY_LOCKS",
      "REVIEWED_ASSET_MISMATCH",
      "IMPORT_SINGLE_IMAGE_ONLY",
    ];
    const known = [
      ...invalid,
      "IMPORT_ACCOUNT_UNCONFIGURED",
      "IMPORT_ACCOUNT_MISMATCH",
      "POST_NOT_IN_OWNED_FEED",
      "IMPORT_ASSIGNMENT_CONFLICT",
      "IMPORT_DAILY_LIMIT",
    ];
    return NextResponse.json(
      { error: known.includes(code) ? code : "IMPORT_FAILED" },
      {
        status:
          invalid.includes(code) ||
          error instanceof SyntaxError ||
          error instanceof TypeError
            ? 400
            : code === "IMPORT_ASSIGNMENT_CONFLICT"
              ? 409
              : 503,
      },
    );
  }
}
