import { NextResponse } from "next/server";

import {
  SEGMENT_ERROR_STATUS,
  SegmentError,
} from "@/lib/email-campaigns/segments";

/** Maps repository failures to the admin API error shape; `null` otherwise. */
export function segmentErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof SegmentError)) return null;
  return NextResponse.json(
    { error: error.code === "not_found" ? "Not found" : error.code },
    { status: SEGMENT_ERROR_STATUS[error.code] },
  );
}
