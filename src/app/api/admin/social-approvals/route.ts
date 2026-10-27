import { parseCopyLocks } from "@/lib/ai/socialBrandPolicy";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { createSocialApproval } from "@/lib/db/socialApprovals";
import { approvalConfig } from "@/lib/social-approvals/slackApproval";
import { postSocialReview } from "@/lib/social-approvals/postSocialReview";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const caller = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });
  if (!caller || !hasRoleAccess(caller, "admin"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Cookie-authenticated mutation: require same-origin browser requests.
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const config = approvalConfig();
  if (!config)
    return NextResponse.json(
      { error: "Social approvals are disabled" },
      { status: 503 },
    );
  try {
    const raw = await request.text();
    if (raw.length > 12000)
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    const body = JSON.parse(raw) as Record<string, unknown>;
    const { reviewKey, requestId, caption } = body;
    const copyLocks = parseCopyLocks(body.copyLocks);
    if (copyLocks.caption !== undefined && caption !== copyLocks.caption)
      return NextResponse.json(
        { error: "Locked caption must match the submitted caption exactly" },
        { status: 400 },
      );
    // imageUrls (1-10 slides, in order) supersedes the single imageUrl field.
    const imageUrls = Array.isArray(body.imageUrls)
      ? body.imageUrls
      : [body.imageUrl];
    if (
      typeof reviewKey !== "string" ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(reviewKey) ||
      typeof requestId !== "string" ||
      !/^[a-zA-Z0-9_-]{16,100}$/.test(requestId) ||
      typeof caption !== "string" ||
      !caption.trim() ||
      caption.length > 2800 ||
      imageUrls.length < 1 ||
      imageUrls.length > 10 ||
      imageUrls.some((u) => typeof u !== "string" || u.length > 2000)
    )
      return NextResponse.json({ error: "Invalid review" }, { status: 400 });
    const urls = (imageUrls as string[]).map((u) => new URL(u));
    if (
      urls.some(
        (url) =>
          url.protocol !== "https:" ||
          url.username ||
          url.password ||
          !process.env.SLACK_SOCIAL_IMAGE_ORIGIN ||
          url.origin !== process.env.SLACK_SOCIAL_IMAGE_ORIGIN,
      )
    )
      return NextResponse.json(
        { error: "Image must use the configured public asset origin" },
        { status: 400 },
      );
    const { row, created } = await createSocialApproval({
      reviewKey,
      requestId,
      caption,
      imageUrl: imageUrls[0] as string,
      imageUrls: imageUrls as string[],
      ...(Object.keys(copyLocks).length
        ? { copyLocks: copyLocks as Prisma.InputJsonValue }
        : {}),
      createdBy: session.user.id,
    });
    if (!created) return NextResponse.json({ review: row, testOnly: true });
    // Never automatically repeat an ambiguous external post. Retry of requestId
    // returns the durable row, not a second Slack message.
    try {
      await postSocialReview(config, row);
    } catch {
      return NextResponse.json(
        {
          error:
            "Slack delivery unconfirmed; inspect the review before retrying",
          reviewId: row.id,
          testOnly: true,
        },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { reviewId: row.id, revision: row.revision, testOnly: true },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      error instanceof TypeError ||
      (error instanceof Error &&
        ["INVALID_COPY_LOCKS", "AI_CAPTION_CONTAINS_RATIONALE"].includes(
          error.message,
        ))
    )
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    if (error instanceof Error && error.message === "REQUEST_ID_CONFLICT")
      return NextResponse.json(
        { error: "Request ID already used for different content" },
        { status: 409 },
      );
    return NextResponse.json(
      {
        error:
          "Review could not be confirmed. Reuse the same requestId to inspect its state.",
      },
      { status: 503 },
    );
  }
}
