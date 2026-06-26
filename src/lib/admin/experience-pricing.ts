// ============================================================================
// Experience Pricing Validator — used by admin approve endpoint
// ============================================================================

/**
 * Validates the pricingByType payload from an admin approval request.
 *
 * Rules:
 * - Must be a plain object (not null, not an array)
 * - Keys must exactly match the experience's type[] (excluding "XSED")
 * - Every value must be a finite number greater than 0
 */
export function validatePricingByType(
  input: unknown,
  types: string[],
): { ok: true; value: Record<string, number> } | { ok: false; error: string } {
  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input)
  ) {
    return { ok: false, error: "pricing_invalid" };
  }

  const typesForPricing = types.filter((t) => t !== "XSED");
  const expected = new Set(typesForPricing);
  const got = new Set(Object.keys(input as Record<string, unknown>));

  if (
    expected.size !== got.size ||
    [...expected].some((k) => !got.has(k))
  ) {
    return { ok: false, error: "pricing_keys_mismatch" };
  }

  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) {
      return { ok: false, error: "pricing_invalid" };
    }
    out[k] = v;
  }

  return { ok: true, value: out };
}
