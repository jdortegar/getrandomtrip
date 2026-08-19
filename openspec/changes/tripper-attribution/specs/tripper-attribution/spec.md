# Spec: tripper-attribution (New Capability)

## Requirement: Anonymous Pricing-Session Cookie
The system MUST set/refresh a signed, `httpOnly`, `secure`, `sameSite: lax`, `path: "/"` `grt_tripper` cookie in `src/proxy.ts` whenever an unauthenticated or authenticated-with-no-frozen-referral request carries `?tripper=slug` on any route, or visits `/trippers/[tripper]`. The cookie MUST propagate on every subsequent request with no per-page query-param threading required.

#### Scenario: Cookie set from query param on any route
- GIVEN no `grt_tripper` cookie exists
- WHEN a visitor loads `/experiences/by-type/couple?tripper=maria`
- THEN `grt_tripper=maria` (signed) is set and present on the next navigation without `?tripper=`

#### Scenario: Cookie set from tripper profile path
- GIVEN no `grt_tripper` cookie exists
- WHEN a visitor loads `/trippers/maria`
- THEN `grt_tripper=maria` is set identically to the query-param case

## Requirement: Authenticated Attribution Overrides Query Param
For an authenticated request, the system MUST force-derive `grt_tripper` from the NextAuth JWT's `referredByTripperSlug` claim, overriding any `?tripper=` present on that same request.

#### Scenario: Frozen referral beats a clicked link
- GIVEN a signed-in user whose JWT carries `referredByTripperSlug: "carla"`
- WHEN they load a page with `?tripper=maria`
- THEN `grt_tripper` resolves to `carla`, not `maria`

#### Scenario: Authenticated user with no referral keeps anonymous/query behavior
- GIVEN a signed-in user whose JWT `referredByTripperSlug` is null
- WHEN they load a page with `?tripper=maria`
- THEN `grt_tripper` is set to `maria`

## Requirement: Referral Capture at Signup (First-Touch, Permanent)
`User.referredByTripperId` MUST be written exactly once, at registration, from a register-modal `<select>` listing validated ACTIVE trippers plus an explicit "None" option, pre-filled from `grt_tripper` when present. It MUST NOT be overwritten by any later action.

#### Scenario: Pre-filled from anonymous cookie
- GIVEN `grt_tripper=maria` is set and `maria` is an ACTIVE tripper
- WHEN the register modal opens
- THEN the dropdown pre-selects `maria`

#### Scenario: Explicit None freezes null
- GIVEN a registrant selects "None"
- WHEN the account is created
- THEN `referredByTripperId` is `null` and never set afterward by cookie/banner activity

#### Scenario: Second registration attempt cannot change it
- GIVEN a user already has `referredByTripperId` set
- WHEN any later request attempts to write a different value to that field
- THEN the write is rejected/ignored — the original value is unchanged

## Requirement: Self-Referral Rejection
The write path MUST reject `referredByTripperId === user.id` server-side, independent of whether the UI prevents selecting oneself.

#### Scenario: Server rejects self-referral regardless of UI
- GIVEN a request to set `referredByTripperId` equal to the acting user's own id
- WHEN the write path processes it
- THEN the request is rejected and no self-referential value is persisted

## Requirement: Read-Time Liveness Re-Validation
Every read site that affects price or referral eligibility (trip-request creation, checkout/payment-intent, register submit) MUST re-validate the attributed tripper via `getTripperJourneyContext` at read time, not trust the cookie/JWT value indefinitely.

#### Scenario: Deactivated tripper resolves as no attribution
- GIVEN `grt_tripper` or the JWT claim points to a tripper who is now `isActive: false`
- WHEN a price or referral-affecting read runs
- THEN attribution resolves to "none" for that read, regardless of the stale cookie/claim value

#### Scenario: Demoted (non-TRIPPER) user resolves as no attribution
- GIVEN the referenced user no longer has the TRIPPER role
- WHEN `getTripperJourneyContext` is invoked at a read site
- THEN it returns `not_found`/`inactive` and attribution resolves to "none"

## Requirement: Deleted Referrer — Permanent Attribution Loss (Settled)
`User.referredByTripperId` MUST use `onDelete: SetNull`. If a referring tripper's account is deleted, every traveler they referred permanently loses that attribution with no historical snapshot; RandomTrip retains 100% of any of those travelers' future bookings. This is intentional, not a defect, and MUST NOT be replaced by a snapshot/ledger mechanism in this change.

#### Scenario: Referrer deletion nulls attribution with no trace
- GIVEN a traveler with `referredByTripperId` pointing to tripper T
- WHEN T's `User` row is deleted
- THEN the traveler's `referredByTripperId` becomes `null` and no record of the prior referral survives

## Requirement: Charge-Time Price Re-Derivation Invariant
The price used at actual payment-intent creation MUST always be resolved server-side from the CURRENT attribution state via `resolveBasePricePerPerson`, never trusted from an earlier client-displayed value.

#### Scenario: Attribution changes between view and charge
- GIVEN a price was displayed under tripper A's overrides
- WHEN the visitor's attribution changes (banner toggle, login) before payment-intent creation
- THEN the charged amount is re-derived under the attribution state active at charge time, not the earlier displayed value

## Cross-Cutting: Request-Scoped Attribution Reads
Reading the `grt_tripper` cookie (`readAttributionSlug`) and re-validating a tripper's liveness (`getTripperJourneyContext`) SHOULD be memoized per request when the same value is read by more than one server-rendered surface in the same response (e.g. the layout-mounted banner and a page's own attribution read for the same slug). This is a performance guarantee, not a correctness one — a request that fails to dedupe still returns correct results, just at the cost of redundant cookie-verify/DB work.

#### Scenario: Banner and page both read attribution for the same request
- GIVEN a page render includes both `AttributionModeBanner` and a page-level attribution read (`by-type/page.tsx` or `journey/page.tsx`) for the same visitor
- WHEN the request is processed
- THEN the `grt_tripper` cookie is verified and the tripper's liveness is resolved at most once for that request, via `React.cache()`-wrapped `readAttributionSlug`/`getTripperJourneyContext`

(Found during PR3 apply: each server-rendered surface called `readAttributionSlug()`/`getTripperJourneyContext()` independently, duplicating the HMAC cookie-verify and the DB round-trip within the same request whenever more than one surface needed the same slug's attribution. Fixed by wrapping both in `React.cache()` — a no-op outside an active Next.js request render, e.g. in unit tests, so behavior is unchanged in every environment; only redundant same-request work is eliminated.)

## Explicitly Out of Scope
Commission rate calculation, payout modeling, and any `ReferralCommission` ledger (the 1%/2%/3% logic) are NOT part of this change. This spec covers only the attribution foundation; commission consumes it in a future change.

## Cross-Cutting: Localization
All new user-visible strings (register dropdown labels, "None" option, carousel fallback label, banner copy) MUST exist in both `es.json` and `en.json` with matching `dictionary.ts` types. The hardcoded-Spanish pattern in `TripperPreviewBanner.tsx` MUST NOT be replicated.

#### Scenario: Dictionary parity enforced
- GIVEN the new dropdown/fallback/banner copy is added
- WHEN `npm run typecheck` runs
- THEN no missing dictionary key errors are reported for either locale
