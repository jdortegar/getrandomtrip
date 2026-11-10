# PDF approved fonts

## Objective

Fulfillment PDFs (vouchers and roadmaps) use only the approved brand font, Barlow.

## Problem / Why

The HTML PDF pipeline embeds Arimo (an Arial substitute) as the body font and
Inter for legal/numbered text. Neither is an approved brand font; the app and the
original PDF spec (`openspec/changes/form-generated-fulfillment-pdfs/design.md:54`)
use Barlow.

## Scope

- `src/lib/trip-documents/pdf/html/` assets and styles: Barlow 400/700 only.
- Remove the Arimo and Inter font assets.
- Update tests and `docs/PdfRendering.md`.

## Constraints

- Branch: `fix/pdf-approved-fonts` (from `57b91931`).
- RDD: global off, so no native review.
- No layout loosening: when reflow changes measured geometry, update expectations
  with a reason instead of weakening assertions.

## Tasks

- [x] T1a Switch the HTML PDF fonts to Barlow (400/700), update tests and docs.
  - Route: delegated (writer trigger: 2+ non-trivial files).
  - Commit: `f7494aae`.
  - RED: 5 font-embedding tests failed on Arimo/Inter output; GREEN after switch.
  - Checks: `npx vitest run src/lib/trip-documents/pdf` 15 files / 151 tests pass;
    `npm run typecheck` pass; `npm run lint` pass; `npx vitest run` 662 files /
    7195 tests pass.
  - Geometry: no measured expectation changed. `referenceEdgeCases` probe text
    changed from "Confirmation ref N" to "Booking ref N" because Barlow's "fi"
    ligature splits pdf.js text items; layout was verified intact (reference
    block ends above the summary dates, 2 pages as before).
- [x] T1b Remove `public/assets/fonts/arimo/` and `public/assets/fonts/inter/`.
  - Route: inline (two mechanical list edits plus `git rm`).
  - Dropped both globs from `next.config.js` `pdfAssets` and the
    `pdfFonts.test.tsx` expectation, then removed the directories.
  - Checks: `npx vitest run src/lib/trip-documents/pdf` 15 files / 151 tests pass;
    `npm run typecheck` pass; `npm run lint` pass.

## Acceptance criteria

- No `Arimo` or `Inter` font-face/font-family in PDF HTML/CSS; assets removed.
- Rendered PDFs embed Barlow Regular and Barlow Bold.
- `npm run typecheck`, `npm run lint`, full `npx vitest run` pass.

## Progress

- 57b91931: pre-existing test fixes committed on `fix/pre-existing-test-failures`.

## Next step

Open the pull request.
