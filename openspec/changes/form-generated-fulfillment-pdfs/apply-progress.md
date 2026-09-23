# Apply Progress: Form-generated Fulfillment PDFs

Mode: Strict TDD. Delivery: auto-chain / feature-branch-chain; no size exception.
Completed: 0.1, 0.2 (planning), 1.1 (metadata validation). Remaining: 1.2 onward.
Boundary: pure metadata validator/manual types and adjacent tests; no schema, routes, dependencies or UI.

## TDD Cycle Evidence

| Task | Test file | Layer / Safety net | RED | GREEN | Triangulate | Refactor |
|---|---|---|---|---|---|---|
| 1.1 | `src/lib/trip-documents/__tests__/documentMetadata.test.ts` | Unit / N/A (new files) | Missing-module failure before implementation | Initial 1/1 passed | Draft blanks: 1 failed → 2 passed; bounds/catalog/locale: 20 failed → 72 passed; shape/types: 60 failed → 134 passed; hidden/symbol fields: 2 failed → 136 passed | Extracted field/limit constants, ordered imports, formatted; 144/144 including catalog regression passed |

Verification: `npm run test -- src/lib/trip-documents/__tests__/documentMetadata.test.ts src/lib/trips/__tests__/destinationCountries.test.ts` → 144 passed (136 new + 8 existing); `npm run typecheck` → pass; targeted Prettier check → pass. Full suite/lint not rerun; known baseline failures unchanged by this isolated unit.

Contract: complete metadata shape; typed field-path errors (`$` for malformed/unknown shape), explicit draft/generation mode. Label trim and 120-character ceiling match uploads; country codes remain exact/case-sensitive across all 24 catalog countries; locale is always en/es. Drafts allow blank label/country only. No inferred defaults or mutations. No design deviations; no approval tests required.

Rollback: revert this isolated unit. Next: fresh review, then task 1.2 validation primitives. No DB/runtime/deploy verification claimed.
