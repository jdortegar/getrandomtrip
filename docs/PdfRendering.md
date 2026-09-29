# Run the fulfillment PDF renderer

The five fulfillment documents print self-contained HTML through pinned Chromium,
using the original PDF design coordinates uniformly scaled to A4. Saved-draft,
revision-lock, preview receipt, and publication contracts are unchanged.

## Local verification

Use Node 20.11 or newer. On macOS/Windows, the renderer discovers OS-installed Chrome/Chromium/Edge
at standard application paths. For a pinned headless shell or nonstandard
installation, set its absolute executable path before starting Next or tests:

```bash
export PDF_CHROMIUM_EXECUTABLE_PATH="/absolute/path/to/chrome-headless-shell"
npm run test -- src/lib/trip-documents/pdf
```

The executable is intentionally not downloaded during a render. Linux production
uses the bundled `@sparticuz/chromium` 147 binary with `puppeteer-core` 24.42.
For reproducible QA, use Chrome 147; another explicit local version is useful for
development but does not verify the production binary. `PDF_QA_OUTPUT_DIR` saves
synthetic PDF fixtures from the reference-render tests for PNG inspection.

## Fidelity and safety

- Each template retains its own geometry and source palette. Normal fixtures use
  one page; oversized text flows to measured continuation pages without shrinking.
  Uniform PDF print scaling (not CSS zoom) preserves the original 2/3-unit
  border weights without browser fractional-border quantization.
- Brand/icons are discrete original vector assets, not a full-page background.
  Booking values and QR destinations are always regenerated from validated input.
- Arimo is the licensed Arial-metric-compatible substitute, not identical Arial
  outlines. Barlow Bold and Inter 3.19 match the original heading/legal fonts.
  See the font `SOURCE.md` files and bundled OFL licenses.
- HTML text is escaped; authored links require HTTPS. The browser disables page
  JavaScript and blocks network/file loads; only trusted pagination is evaluated.
- Every render owns a fresh browser, with a 40-second deadline, bounded cleanup,
  one active render per process, and the existing 4 MiB output cap. Busy renders
  fail with `DOCUMENT_PDF_RENDER_BUSY`; the operation is safe to retry.

## Deployment gate

Next tracing includes all local assets and Chromium's four compressed binary
archives for the six PDF routes. Before production use, inspect actual function
bundles for those assets and check the total unpacked function size. Run cold and
warm prints of all five templates on Netlify's configured memory/runtime; local
macOS rendering alone cannot prove Linux launch, memory, or deployment packaging.
Do not change live documents or storage just to test rendering.
