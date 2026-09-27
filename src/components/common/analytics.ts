import { trackCustomEvent } from "@/lib/helpers/tracking/gtm";

/** Legacy callers still pass through the same privacy allowlist. */
export function track(event: string, params: Record<string, unknown> = {}) {
  trackCustomEvent({ ...params, event });
}
