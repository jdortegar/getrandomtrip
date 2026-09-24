import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { prisma } from "@/lib/prisma";
import { parseDinnerVoucher } from "@/lib/trip-documents/parsers/dinnerVoucher";
import { renderDinnerVoucher } from "@/lib/trip-documents/pdf/renderDinnerVoucher";
import { MAX_DOCUMENT_REQUEST_BYTES } from "@/lib/trip-documents/validationPrimitives";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const MAX_PDF_BYTES = 4 * 1024 * 1024;
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

async function readInput(request: NextRequest): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("INVALID_BODY");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_DOCUMENT_REQUEST_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new Error("REQUEST_TOO_LARGE");
      }
      chunks.push(value);
    }
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        Buffer.concat(chunks, size),
      ),
    );
  } finally {
    reader.releaseLock();
  }
}
function error(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: PRIVATE_HEADERS });
}
async function preview(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    auth.errorResponse.headers.set("Cache-Control", "private, no-store");
    return auth.errorResponse;
  }
  const { id } = await params;
  const trip = await prisma.tripRequest.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!trip) return error("trip_not_found", 404);
  let input: unknown;
  try {
    input = await readInput(request);
  } catch (cause) {
    return cause instanceof Error && cause.message === "REQUEST_TOO_LARGE"
      ? error("request_too_large", 413)
      : error("invalid_body", 400);
  }
  const parsed = parseDinnerVoucher(input, "generation");
  if (!parsed.ok)
    return NextResponse.json(
      { errors: parsed.errors },
      { status: 422, headers: PRIVATE_HEADERS },
    );
  try {
    const result = await renderDinnerVoucher(parsed.value);
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: 422, headers: PRIVATE_HEADERS },
      );
    if (result.buffer.length > MAX_PDF_BYTES)
      return error("pdf_too_large", 413);
    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="dinner-voucher-preview.pdf"',
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (cause) {
    return cause instanceof Error && cause.message === "DOCUMENT_PDF_TOO_LARGE"
      ? error("pdf_too_large", 413)
      : error("preview_unavailable", 503);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    return await preview(request, context);
  } catch {
    return error("preview_unavailable", 503);
  }
}
