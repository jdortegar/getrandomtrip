/**
 * Commission is an admin-owned rate stored as a nullable fraction on
 * `User.commission` (e.g. `0.15` = 15%). `null`/`undefined` means "never
 * explicitly set" and MUST default to {@link DEFAULT_COMMISSION}; an explicit
 * `0` is a negotiated 0% rate and MUST NOT be coerced to the default.
 *
 * Every read site (earnings calc, tripper profile, tripper settings, admin
 * modal pre-fill) MUST go through {@link effectiveCommission} instead of a
 * truthiness fallback like `commission || 0` — truthiness treats explicit `0`
 * the same as `null`, which is the bug this module fixes.
 */

/** Fraction (0–1) applied when a tripper has no explicit commission set. */
export const DEFAULT_COMMISSION = 0.15;

/**
 * Fraction actually applied to earnings/display. `null`/`undefined` default
 * to {@link DEFAULT_COMMISSION}; an explicit `0` is returned unchanged.
 */
export function effectiveCommission(
  commission: number | null | undefined,
): number {
  return commission ?? DEFAULT_COMMISSION;
}

/**
 * Whole-percent for display/inputs (e.g. `0.15` -> `15`). Applies the default
 * for `null`/`undefined` before converting.
 */
export function toCommissionPercent(
  commission: number | null | undefined,
): number {
  return Math.round(effectiveCommission(commission) * 100);
}

/**
 * Wire contract for `PATCH /api/admin/users/[id]`: a whole integer in
 * `0–100` inclusive. Out-of-range or non-integer values MUST be rejected
 * (400), never clamped.
 */
export function isValidCommissionPercent(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 100
  );
}

/** Converts a validated whole-percent integer (e.g. `15`) to a fraction (`0.15`). */
export function commissionPercentToFraction(percent: number): number {
  return percent / 100;
}
