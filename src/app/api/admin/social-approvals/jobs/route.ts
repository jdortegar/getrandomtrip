import { after, NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { dispatchSocialWorker } from "@/lib/social-approvals/dispatchSocialWorker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
async function authorized() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });
  return !!user && hasRoleAccess(user, "admin");
}
export async function GET() {
  if (!(await authorized()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const jobs = await prisma.socialRevisionJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      kind: true,
      reviewId: true,
      sourceId: true,
      publishedMediaId: true,
      newReviewId: true,
      status: true,
      attempts: true,
      errorCode: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(
    { jobs },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function POST(request: NextRequest) {
  if (
    !(await authorized()) ||
    request.headers.get("origin") !== request.nextUrl.origin
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (
    process.env.SLACK_SOCIAL_AI_ENABLED !== "true" &&
    process.env.SLACK_SOCIAL_PUBLISH_ENABLED !== "true"
  )
    return NextResponse.json(
      { error: "AI revisions and publishing disabled" },
      { status: 503 },
    );
  try {
    const body = (await request.json()) as {
      jobId?: string;
      confirmPossibleAdditionalCharge?: boolean;
    };
    if (
      typeof body.jobId !== "string" ||
      body.jobId.length > 100 ||
      body.confirmPossibleAdditionalCharge !== true
    )
      return NextResponse.json(
        {
          error:
            "A job ID and explicit confirmation of possible additional AI charges are required",
        },
        { status: 400 },
      );
    const result = await prisma.socialRevisionJob.updateMany({
      where: {
        id: body.jobId,
        status: "MANUAL_RECOVERY",
        attempts: { lt: 2 },
        newReviewId: null,
        // A publish is retryable only if it failed before media_publish.
        publishedMediaId: null,
        OR: [{ kind: { not: "PUBLISH" } }, { errorCode: "PUBLISH_FAILED" }],
      },
      data: {
        status: "QUEUED",
        errorCode: null,
        leaseToken: null,
        leaseUntil: null,
      },
    });
    if (!result.count)
      return NextResponse.json(
        {
          error:
            "Job cannot be retried. Inspect ambiguous Slack delivery or create a manual replacement review.",
        },
        { status: 409 },
      );
    const job = await prisma.socialRevisionJob.findUnique({
      where: { id: body.jobId },
      select: { kind: true, reviewId: true, sourceId: true },
    });
    if (job?.kind === "TRANSLATE" && job.sourceId)
      await prisma.socialSource.updateMany({
        where: { id: job.sourceId, status: "TRANSLATION_FAILED" },
        data: { status: "TRANSLATION_QUEUED" },
      });
    if (job?.kind === "PUBLISH" && job.reviewId)
      await prisma.socialApproval.updateMany({
        where: { id: job.reviewId, status: "PUBLISH_FAILED" },
        data: { status: "PUBLISHING" },
      });
    after(async () => {
      try {
        await dispatchSocialWorker();
      } catch {
        console.error("[social-approvals] retry dispatch deferred to recovery");
      }
    });
    return NextResponse.json({ queued: true, testOnly: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
