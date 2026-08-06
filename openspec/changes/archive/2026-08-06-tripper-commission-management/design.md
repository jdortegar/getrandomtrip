# Design: Tripper Commission Management

## Technical Approach

Four layers, no schema change:

1. **Helper** — one new module owns the `null → 0.15` default, the fraction↔percent conversion, and the percent validator. Every existing truthiness coercion (`commission || 0`) is replaced by a helper call.
2. **Write path** — `PATCH /api/admin/users/[id]` becomes the sole writer: percent in, fraction out, validated before the single `prisma.user.update` (atomicity is free).
3. **Lockdown** — the tripper self-service route stops reading `commission` from its body, and its onboarding guard drops commission entirely.
4. **Read surfaces** — admin Users table column, admin modal input, tripper settings card, earnings math, public tripper profile.

**Correction to proposal/spec wording**: `src/app/api/user/tripper/route.ts` exports `GET` and **`PATCH`** — there is no `PUT`. Everywhere the proposal and spec say `PUT /api/user/tripper`, the implementation target is the `PATCH` handler (line 53). Its only caller is the tripper settings page (`page.tsx:217`).

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| Helper location | New domain folder `src/lib/tripper/commission.ts` | `src/lib/admin/commission.ts`; inline `?? 0.15` per site; `src/lib/validation/commission.ts` | Read sites are mostly tripper-side (earnings, public profile, settings); admin is one of five consumers. Matches the existing per-domain `src/lib/{blog,xsed,travelers,geo}/` convention, each with a `__tests__/` sibling. Inline defaults drift across 5 sites — that drift is the bug being fixed. |
| Storage semantics | Keep `Float?`; `null` = "never set", `0` = "negotiated 0%" | Prisma `@default(0.15)` + backfill | A DB default erases the null/0 distinction permanently and is irreversible. |
| Transport unit | Percent integer on the wire, fraction in the DB; conversion **only** inside the helper | Send fractions from the modal | The modal already showed a `1000%` because a raw fraction crossed a boundary untyped. One conversion point makes the unit bug structurally impossible. |
| Lockdown technique | **Never destructure `commission` from `body`** in the tripper PATCH (plus a comment saying why), rather than `delete body.commission` or a strip helper | Explicit strip/`omit()`; Zod schema for the route | The route destructures an explicit allow-list already; removing the key from that list *is* the allow-list. A strip call would imply the field is still conceptually accepted. No Zod anywhere in these routes — don't introduce it for one field. |
| Onboarding guard | Remove commission from the guard; keep an explicit `availableTypes` length check (`!Array.isArray(...) \|\| length === 0`) | Fix truthiness to `commission === undefined`; keep `!commission` | Commission is no longer a client-supplied field at all, so it cannot be a required field. The remaining check is written explicitly so it never regresses into truthiness. |
| Modal dirty-check | `isDirty = !rolesEqual(roles, user.roles) \|\| commissionDirty`, where `commissionDirty` compares the parsed percent against a baseline derived from `user.commission` | Track a generic "touched" flag; always enable Save | Both `handleSave`'s early return (L66) and `disabled={saving \|\| rolesEqual(...)}` (L171) currently gate on roles only — a commission-only edit would silently no-op. One shared `isDirty` keeps the two in sync. |
| Demotion | When Tripper is unchecked the modal **omits** `commission` from the PATCH body; server writes the column only when the key is present | Send `commission: null`; server-side nulling on demotion | Commission follows the signed contract, not the role flag. Omission makes demote/re-promote lossless with zero server branching. |
| Table + modal display of `null` | Show the **effective** value (`15%`), same as the tripper sees | Show `—` or "default" for `null` | An admin needs to see the rate actually being paid. Cost: `null` and explicit `0.15` look identical — see Open Questions. |

## Interfaces

```ts
// src/lib/tripper/commission.ts  (new)
export const DEFAULT_COMMISSION = 0.15;

/** Fraction actually applied to earnings. `null`/`undefined` → 0.15; explicit 0 stays 0. */
export function effectiveCommission(commission: number | null | undefined): number {
  return commission ?? DEFAULT_COMMISSION;
}

/** Whole-percent for display/inputs (e.g. 0.15 → 15). Applies the default. */
export function toCommissionPercent(commission: number | null | undefined): number {
  return Math.round(effectiveCommission(commission) * 100);
}

/** Wire contract for PATCH /api/admin/users/[id]: integer 0–100 inclusive. No clamping. */
export function isValidCommissionPercent(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100;
}

export function commissionPercentToFraction(percent: number): number {
  return percent / 100;
}
```

## Diff-Level Deltas

### `src/app/api/user/tripper/route.ts` — PATCH (lines 62–82, 134)

```ts
    const {
      bio, heroImage, location, nickname, socialLinks, tierLevel, destinations,
      tripperSlug: requestedSlug,
      availableTypes,
    } = body;
    // `commission` is deliberately NOT read from the body: it is admin-owned and
    // writable only via PATCH /api/admin/users/[id].

    // availableTypes is still required; commission is not (read layer defaults it).
    if (!Array.isArray(availableTypes) || availableTypes.length === 0) {
      return NextResponse.json({ error: "Missing required tripper fields" }, { status: 400 });
    }
```

- Line 134: delete `commission,` from `prisma.user.update({ data: … })`.
- Line 152: **keep** `commission: true` in `select` — the client still reads the admin-set value back for display.
- `GET` (line 23) unchanged.

### `src/app/[locale]/(secure)/dashboard/tripper/settings/page.tsx`

| Line | Now | Becomes |
|---|---|---|
| 33 | `commission: typeof extras.commission === "number" ? extras.commission : 0` | `commission: effectiveCommission(extras.commission)` |
| 54 (`EMPTY_FORM`) | `commission: 0` | `commission: DEFAULT_COMMISSION` |
| 76 (initial `profile`) | `commission: 0` | `commission: DEFAULT_COMMISSION` |
| 229 (save body) | `commission: formData.commission,` | **removed** — server ignores it |
| 252 (session update) | unchanged | still valid: `nextProfile.commission` comes from the server response |
| 360 (`<TripperSettingsAccountCard>`) | — | add `commission={formData.commission}` |

### `src/app/api/admin/users/[id]/route.ts` — PATCH

```ts
const body = (await request.json()) as { role?: unknown; roles?: unknown; commission?: unknown };
// …existing roles parsing / 400s / self-demotion guard unchanged…

// Validate BEFORE the update so an invalid commission rejects the roles change too.
const hasCommission = body.commission !== undefined && body.commission !== null;
if (hasCommission && !isValidCommissionPercent(body.commission)) {
  return NextResponse.json({ error: "Invalid commission" }, { status: 400 });
}

const updated = await prisma.user.update({
  data: {
    roles: { set: roles },
    ...(tripperSlug ? { tripperSlug } : {}),
    ...(hasCommission ? { commission: commissionPercentToFraction(body.commission as number) } : {}),
  },
  select: { id: true, roles: true, tripperSlug: true, commission: true },
  where: { id: params.id },
});
```

Atomicity needs no transaction: one `update`, all validation ahead of it.

### `src/components/app/admin/UserRoleModal.tsx`

```ts
const baselinePct = toCommissionPercent(user.commission);
const [commissionPct, setCommissionPct] = useState(String(baselinePct)); // string: allows a transient empty input
// reset effect (L60): add setCommissionPct(String(toCommissionPercent(user.commission)));
//                     deps become [user.id, userRolesKey, user.commission]

const isTripper = roles.includes("TRIPPER");
const parsedPct = Number(commissionPct);
const commissionValid =
  !isTripper || (commissionPct.trim() !== "" && isValidCommissionPercent(parsedPct));
const commissionDirty = isTripper && commissionValid && parsedPct !== baselinePct;
const isDirty = !rolesEqual(roles, user.roles) || commissionDirty;
```

- `handleSave` L66: `if (!isDirty) { onClose(); return; }`; then `if (!commissionValid) { setError(copy.modal.commissionError); return; }`.
- Body L74: `JSON.stringify({ roles: sortRoles(roles), ...(isTripper ? { commission: parsedPct } : {}) })`.
- Save button L171: `disabled={saving || !isDirty || !commissionValid}`.
- Input renders only when `isTripper`, inside the roles block, styled after the sibling admin-modal input (`BulkDeleteUsersModal.tsx:70-79`) — `h-10 rounded-lg border border-gray-200 px-3 text-sm shadow-sm` with a trailing `%`, `type="number" min={0} max={100} step={1} inputMode="numeric"`. Deliberately **not** `FormField` (`px-6 py-4 rounded-xl bg-gray-100`) — that primitive belongs to the big journey/experience forms; the sibling-file convention wins here per `component-patterns.md` rule 2.

### `src/components/app/dashboard/tripper/settings/TripperSettingsAccountCard.tsx`

Re-add prop `commission: number` (fraction, already defaulted by the caller), `const commissionPct = Math.round(commission * 100);`, and this block between the email and tier blocks:

```tsx
<div>
  <div className="mb-2 flex items-center justify-between">
    <p className="text-sm font-medium text-neutral-500">{copy.commissionLabel}</p>
    <AdminSetBadge label={copy.adminSet} />
  </div>
  <p className="font-barlow-condensed text-3xl font-extrabold leading-none text-gray-900">
    {commissionPct}%
  </p>
  <p className="mt-1 text-xs text-neutral-400">{copy.commissionHelper}</p>
</div>
```

> Recovered by reconstruction, not from git: this phase has no shell access. The dict keys survived deletion (`es.json:3774-3776`, `dictionary.ts:335-337`), and the markup mirrors the surviving tier block (L63-87) which uses the same label + `AdminSetBadge` header row. **Apply phase should still run `git log --follow -p -- <file>` and prefer the original blob if reachable.**

### Read-site sweep (every `|| 0` on commission)

| Site | Now | Becomes |
|---|---|---|
| `src/lib/db/tripper-queries.ts:713` (earnings) | `tr.experience.owner.commission \|\| 0` | `effectiveCommission(tr.experience.owner.commission)` |
| `src/lib/db/tripper-queries.ts:75` (profile) | `tripper.commission \|\| 0` | `effectiveCommission(tripper.commission)` |
| `src/app/[locale]/trippers/[tripper]/page.tsx:114` | `tripperData.commission \|\| 0` | `tripperData.commission` (already defaulted upstream; the `\|\| 0` is a redundant truthiness trap) |
| `tripper-queries.ts:210` | `tripper.commission` (raw, `TripperListItem.commission: number \| null`) | unchanged — list type is nullable by contract |

### Admin Users table

- `AdminUser` (`UsersTableRow.tsx:9`) gains `commission: number | null;`.
- `GET /api/admin/users` — **`src/app/api/admin/users/route.ts`**, select at lines 47-55, add `commission: true`.
- `UsersTable.tsx` headers array (L39-46): insert `copy.headers.commission` after `copy.headers.roles`.
- `UsersTableRow.tsx`: new cell after the roles cell —
  `{user.roles.includes("TRIPPER") ? `${toCommissionPercent(user.commission)}%` : "—"}` in `<td className="px-5 py-4 text-sm text-neutral-500">`.
- `AdminUsersPageClient.tsx` needs no change (it passes API rows straight through).

## i18n

| Key | Status | es | en |
|---|---|---|---|
| `tripperDashboard.settingsProfile.account.commissionLabel` | **exists** (`es.json:3774`) | Tasa de Comisión | Commission Rate |
| `…account.adminSet` | **exists** (3775) | Definido por el admin | Set by admin |
| `…account.commissionHelper` | **exists** (3776) | (already written) | (already written) |
| `adminUsers.headers.commission` | **new** | Comisión | Commission |
| `adminUsers.modal.commissionLabel` | **new** | Comisión (%) | Commission (%) |
| `adminUsers.modal.commissionPlaceholder` | **new** | 15 | 15 |
| `adminUsers.modal.commissionError` | **new** | Ingresá un número entero entre 0 y 100 | Enter a whole number between 0 and 100 |

Types: add the four `adminUsers` keys to `src/lib/types/dictionary.ts` (`headers` block L2824-2831, `modal` block L2832-2845). Settings-card types need **no** change. Do **not** reuse `dictionary.ts:837` `commission` / `commissionPlaceholder` — that is the unrelated `0–1` experience-form field.

## Data Flow

```
admin edits pencil modal
  → UserRoleModal (percent int, client-validated, sent only when Tripper checked)
    → PATCH /api/admin/users/[id]  → isValidCommissionPercent → /100 → prisma.user.update
                                     invalid ⇒ 400, nothing written (roles included)
  → onSaved() → refetch GET /api/admin/users (select now includes commission)
    → UsersTable / UsersTableRow → toCommissionPercent → "15%" | "—"

tripper reads
  getTripperEarnings   → effectiveCommission(owner.commission) × payment.amount
  getTripperBySlug     → effectiveCommission(...) → TripperProfile.commission
  GET /api/user/tripper → raw value → settings page effectiveCommission() → AccountCard "15%"
  PATCH /api/user/tripper → commission key ignored entirely
```

## File Changes

| File | Action | Notes |
|---|---|---|
| `src/lib/tripper/commission.ts` | Create | Default, conversions, validator |
| `src/lib/tripper/__tests__/commission.test.ts` | Create | Unit tests (TDD-first) |
| `src/app/api/admin/users/[id]/route.ts` | Modify | Validate + convert + conditional write |
| `src/app/api/admin/users/[id]/__tests__/route.test.ts` | Create | No test file exists for this route yet |
| `src/app/api/admin/users/route.ts` | Modify | `commission: true` in GET select |
| `src/app/api/user/tripper/route.ts` | Modify | Drop commission from destructure + `data`; rewrite guard |
| `src/app/api/user/tripper/__tests__/route.test.ts` | Create | Ignore-commission + onboarding-guard coverage |
| `src/components/app/admin/UserRoleModal.tsx` | Modify | Input, validation, `isDirty` |
| `src/components/app/admin/UsersTable.tsx` | Modify | Header |
| `src/components/app/admin/UsersTableRow.tsx` | Modify | `AdminUser.commission` + cell |
| `src/components/app/dashboard/tripper/settings/TripperSettingsAccountCard.tsx` | Modify | Restore section + prop |
| `src/app/[locale]/(secure)/dashboard/tripper/settings/page.tsx` | Modify | Defaults, drop commission from save body, pass prop |
| `src/lib/db/tripper-queries.ts` | Modify | Lines 75, 713 |
| `src/app/[locale]/trippers/[tripper]/page.tsx` | Modify | Line 114 |
| `src/lib/types/dictionary.ts` | Modify | 4 new `adminUsers` keys |
| `src/dictionaries/{es,en}.json` | Modify | Same 4 keys, both locales |

## Testing Strategy

Strict TDD is active — tests first, `vitest` (see `src/lib/admin/__tests__/format.test.ts` for the helper pattern and `src/app/api/admin/users/__tests__/route.test.ts` for the route-mock pattern: `vi.mock("next-auth")` + `vi.mock("@/lib/prisma")`, dynamic `await import("../route")` in `beforeEach`).

| Layer | What | How |
|---|---|---|
| Unit | `effectiveCommission(null)===0.15`, `(0)===0`, `(0.2)===0.2`; `toCommissionPercent`; `isValidCommissionPercent` accepts 0 and 100, rejects `-1`, `101`, `12.5`, `"15"`, `NaN`; `commissionPercentToFraction(15)===0.15` | Pure vitest |
| Route — admin PATCH | 401/403 unchanged; `commission: 20` → `update` called with `0.15`→`0.2`; `150`/`12.5`/`"20"` → 400 **and `prisma.user.update` never called**; absent commission → `data` has no `commission` key | Mocked prisma, assert on `update` args |
| Route — tripper PATCH | body `commission: 10` → `update` data has no `commission` key; no `commission` + valid `availableTypes` → 200; empty `availableTypes` → 400 | Mocked prisma |
| Type/lint | `npm run typecheck`, `npm run lint` | Both locales keyed |
| Manual | Set 20% → table shows `20%`, tripper settings shows `20%`; set 0% → `0%` everywhere (not 15%); uncheck Tripper → field hides, value survives re-promotion; commission-only edit enables Save; `null` tripper's earnings are non-zero | ≥360px + ≥1280px |

## Migration / Rollout

No migration. Code-only; DB untouched. Rollback = revert commits (values written meanwhile remain valid fractions).

## Open Questions

- [ ] `null` and an explicit `0.15` are indistinguishable in the admin table and modal. Consequence: an admin who opens the modal for a `null` tripper and saves any change materializes `0.15` into the column. Accepted as intentional (it records the rate actually being paid) — confirm before apply, or add a "default" hint to the cell.
- [ ] Should the tripper settings card visually distinguish an admin-assigned rate from the 15% fallback? Current design does not.
- [ ] Proposal risk "audit existing `null` rows before ship" has no owner — a read-only count query before deploy is recommended but is not a code task.
