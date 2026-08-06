/**
 * Pure logic extracted from `UserRoleModal` so it can be unit tested without
 * mocking the modal's rendering, fetch, or dialog primitives.
 *
 * These two predicates are deliberately SEPARATE concerns:
 * - `shouldIncludeCommission` decides whether the PATCH body includes
 *   `commission` at all.
 * - `isModalDirty` decides whether the Save button is enabled.
 *
 * A roles-only edit can make the modal dirty (Save enabled) while the
 * commission stays untouched — in that case `shouldIncludeCommission` MUST
 * stay `false` so an unrelated save never writes the displayed default
 * (e.g. 15%) into a tripper whose `commission` is actually `null`.
 */

/**
 * The PATCH body includes `commission` ONLY when the admin actually edited
 * the input (`commissionTouched`) — never merely because Tripper is checked.
 */
export function shouldIncludeCommission(
  isTripper: boolean,
  commissionTouched: boolean,
): boolean {
  return isTripper && commissionTouched;
}

/**
 * The Save button is enabled when there is something valid to save: a roles
 * change, and/or a touched commission — but an invalid touched commission
 * blocks the whole save, even if roles also changed.
 */
export function isModalDirty(
  rolesChanged: boolean,
  isTripper: boolean,
  commissionTouched: boolean,
  commissionValid: boolean,
): boolean {
  return (
    commissionValid && (rolesChanged || (isTripper && commissionTouched))
  );
}
