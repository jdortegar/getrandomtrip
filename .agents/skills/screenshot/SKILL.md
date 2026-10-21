---
name: screenshot
description: "Trigger: screenshot, screenshots, visual check, capture page, capture component, before push, check UI at mobile/desktop. Capture route × viewport PNGs with one Playwright script."
---

# Screenshot

## Activation Contract

Use this skill to capture screenshots of pages or components for a visual
check, typically before a push or PR. It runs ONE local Playwright script; it
never drives the browser step by step and never uses computer use. Invoking
the skill authorizes running the script against a URL the user provided or a
local dev server; it never authorizes uploading, posting, or committing images.

## Hard Rules

- Judge visual quality only from the final PNGs: open and read the image
  files. Do not inspect DOM dumps, HTML, or browser console logs to decide
  whether the UI looks right.
- Uploading screenshots to a PR, Slack, or anywhere else is a separate step
  that needs explicit user authorization.
- Never fall back to computer use or browser-automation tools without asking
  the user first, even if the script fails.
- Report missing dependencies (Playwright package, Chromium binary) with the
  printed fix command. Never install them yourself.
- No credentials, auth flows, or secrets in configs. Capture only what is
  reachable at the given base URL.
- Screenshots stay in `.screenshots/` (git-ignored). Never commit them.

## Decision Gates

| Situation | Action |
|-----------|--------|
| No server running | Ask the user for a URL, or start the dev server, then pass `--base-url` |
| Exit 3 (missing dependency) | Report the printed message and fix command; stop |
| Exit 2 (config error) | Fix the config or flags; rerun |
| Exit 1 (capture failed) | Read the FAIL reason; fix selector/timeout or report a real bug |
| Warnings (network idle, fonts, images) | Look at the PNG; mention the warning only if the image shows the problem |
| User wants images on the PR | Ask for explicit authorization first |

## Commands

Run from the repo root (output paths are relative to the current directory):

```bash
node .agents/skills/screenshot/scripts/capture.mjs --base-url http://localhost:3010 --route / --route /blog
node .agents/skills/screenshot/scripts/capture.mjs --config shots.json
npm run screenshots -- --config shots.json --viewport mobile
```

Flags (override the config file):

- `--config <file.json>`: JSON config (see below).
- `--base-url <url>`: required (config `baseURL` or flag); http(s) only.
- `--route <path>`: repeatable; replaces config routes. Paths start with `/`.
- `--viewport <v>`: repeatable; `desktop` (1280×800), `mobile` (390×844),
  `WxH`, or `name:WxH`. Default: desktop + mobile.
- `--out-dir <dir>`: root for run directories (default `.screenshots`).
- `--selector <css>` / `--ready-selector <css>`: apply to every route.
- `--full-page` / `--no-full-page`: default full page.
- `--timeout <ms>`: navigation timeout.
- `--playwright-from <dir>`: resolve Playwright from another checkout's
  `node_modules` (e.g. a worktree without its own install).

Config example:

```json
{
  "baseURL": "http://localhost:3010",
  "viewports": ["desktop", "mobile", { "name": "tablet", "width": 820, "height": 1180 }],
  "fullPage": true,
  "timeouts": { "navigation": 30000, "ready": 10000 },
  "routes": [
    "/",
    { "name": "menu-open", "path": "/", "setup": [{ "click": "[aria-label='Menu']" }], "selector": "nav", "component": "nav" },
    { "path": "/blog", "readySelector": "main article", "optional": true }
  ]
}
```

Route fields: `path` (required), `name` (defaults from path; `/` → `home`),
`setup`, `selector` (element screenshot), `component` (file-name suffix,
defaults to the selector), `readySelector` (must become visible), `optional`
(failure is reported as SKIP and does not fail the run), `fullPage`.

Setup steps run in order after the page is ready; each object has exactly one
key. Unknown step types are rejected; there is no arbitrary JavaScript.

| Step | Meaning |
|------|---------|
| `{ "click": "css" }` | Click the first match |
| `{ "hover": "css" }` | Hover the first match |
| `{ "fill": ["css", "text"] }` | Fill an input |
| `{ "press": "Escape" }` | Press a key |
| `{ "waitFor": "css" }` | Wait until visible |
| `{ "wait": 500 }` | Sleep, 0–10000 ms |

Timeouts (ms, 1–120000): `navigation` 30000, `networkIdle` 5000, `ready`
10000, `fonts` 5000, `images` 5000, `step` 5000, `screenshot` 15000.

## Execution Steps

1. Make sure the target is reachable (user URL or running dev server).
2. Run the script once with every route and viewport you need; one browser,
   one context per viewport.
3. Per capture it waits for `domcontentloaded`, then best-effort network idle,
   `readySelector`, setup steps, `document.fonts.ready`, and visible images.
   Best-effort waits warn and continue; required ones fail the capture.
4. Read the PNGs listed as `OK` and judge them visually.

## Output Contract

Files go to a unique run directory `<outDir>/<YYYYMMDD-HHMMSS>-<rand>/` named
`<route>__<viewport>[__<component>].png`. The summary prints the run dir, one
line per capture (`OK <path>`, `FAIL <file> <reason>`, `SKIP <file>` for
optional failures, with warnings and console-error counts in brackets), and
totals. No base64, DOM, or console text.

Exit codes: `0` all required captures OK, `1` a required capture failed, `2`
bad config or flags, `3` missing Playwright or Chromium, `130` interrupted.
The browser is always closed, including on Ctrl+C.

Report to the user: the run dir, which captures passed or failed, and what the
images show. Never claim a visual result you did not read from a PNG.

## References

- [capture.mjs](scripts/capture.mjs) — script; pure helpers tested in `capture.test.mjs`.
