# Apply Progress: Form-generated Fulfillment PDFs

Mode: Strict TDD. Delivery: auto-chain / feature-branch-chain; no size exception.
Completed: 0.1, 0.2 (planning), 1.1 (metadata), 1.2 (validation primitives). Remaining: 1.3 onward.
Boundaries: separately reviewed pure metadata and calendar/time/range/HTTPS/bounds units with adjacent tests; no schema, routes, dependencies or UI.

## TDD Cycle Evidence

| Task | Test file | Layer / Safety net | RED | GREEN | Triangulate | Refactor |
|---|---|---|---|---|---|---|
| 1.1 | `src/lib/trip-documents/__tests__/documentMetadata.test.ts` | Unit / N/A (new files) | Missing-module failure before implementation | Initial 1/1 passed | Draft blanks: 1 failed → 2 passed; bounds/catalog/locale: 20 failed → 72 passed; shape/types: 60 failed → 134 passed; hidden/symbol fields: 2 failed → 136 passed | Extracted field/limit constants, ordered imports, formatted; 144/144 including catalog regression passed |
| 1.2 | `src/lib/trip-documents/__tests__/validationPrimitives.test.ts` | Unit / N/A (new); 144 existing regression tests passed before work | Missing-module failure before implementation | Initial 1/1 passed | Calendar: 8 failed → 25 passed; time/range: 25 failed → 50 passed; HTTPS: 29 failed → 79 passed; bounds: 8 failed → 87 passed | Extracted limits, bounded UTF-8 allocation, formatted; 231/231 including prior regressions passed |

Verification: `npm run test -- src/lib/trip-documents/__tests__/documentMetadata.test.ts src/lib/trips/__tests__/destinationCountries.test.ts` → 144 passed (136 new + 8 existing); `npm run typecheck` → pass; targeted Prettier check → pass. Full suite/lint not rerun; known baseline failures unchanged by this isolated unit.

Contract: complete metadata shape; typed field-path errors (`$` for malformed/unknown shape), explicit draft/generation mode. Label trim and 120-character ceiling match uploads; country codes remain exact/case-sensitive across all 24 catalog countries; locale is always en/es. Drafts allow blank label/country only. No inferred defaults or mutations. No design deviations; no approval tests required.

Task 1.2 verification: `npm run test -- src/lib/trip-documents/__tests__/validationPrimitives.test.ts src/lib/trip-documents/__tests__/documentMetadata.test.ts src/lib/trips/__tests__/destinationCountries.test.ts` → 231 passed (87 new + 144 existing); typecheck and targeted Prettier check passed.

Task 1.2 contract: seven pure predicates; real fixed-width calendar dates (Gregorian leap rules), HH:mm wall times, inclusive ordered date ranges, absolute credential-free HTTPS syntax without fetching/host restrictions. Parsers own optional/draft blanks. Bounds allow empty text/arrays, cap text at 4000 JS string units and arrays at 50; serialized request text is capped at 128 KiB UTF-8 bytes, not characters. Request readers must also enforce the exported byte cap while streaming. No design deviations or approval tests required.

Rollback: revert the respective isolated unit. Next: fresh review, then task 1.3 template parser. No DB/runtime/deploy verification claimed.
