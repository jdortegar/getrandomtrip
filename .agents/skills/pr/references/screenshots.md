# Screenshots

Capture rendered UI with Playwright and embed it in the PR description.

`node .agents/skills/pr/scripts/pr-shots.mjs <command>`

## Privacy gate (public repository)

This repository is public, and published screenshots live on the public
`pr-assets` branch forever (deleting a file does not remove it from history).

- Capture only from `localhost` or a Netlify deploy preview. The script refuses
  production because it holds real customer data.
- Log in only with dedicated test accounts, and show only seeded or test data.
- Mask anything that still shows personal data: emails, phone numbers, names of
  real people, payment details, tokens (`mask` in the spec).
- View every captured image before `publish`. If one shows real personal data,
  fix the data or the mask and recapture; never publish it.

## 1. Run the app

Use a running dev server for the PR head: `npm run dev` in an idle checkout,
or `node .agents/skills/worktree/scripts/worktree.mjs dev <branch>` when the
main checkout is busy. Pass its URL with `--base-url` if it is not port 3010.

## 2. Write the spec

Write the spec outside the repository (for example in the session temp dir).
Pick one, two, or three shots per the description contract; add a mobile shot
when the layout changed.

```json
{
  "baseUrl": "http://localhost:3010",
  "login": { "role": "ADMIN" },
  "shots": [
    {
      "name": "notification-modal-desktop",
      "description": "Admin notification modal showing the review rating and excerpt",
      "path": "/es/dashboard/notifications",
      "steps": [
        { "click": "text=Nueva reseña" },
        { "waitFor": "[data-component=NotificationReadingPane]" }
      ],
      "element": "[role=dialog]",
      "mask": ["[data-testid=user-email]"]
    },
    {
      "name": "notification-modal-mobile",
      "description": "Same modal at 360 px with Previous/Next centered",
      "path": "/es/dashboard/notifications",
      "viewport": "mobile",
      "steps": [{ "click": "text=Nueva reseña" }]
    }
  ]
}
```

| Field | Meaning |
|-------|---------|
| `name` | File name: lowercase `a-z`, `0-9`, `-`; unique |
| `description` | Text placed directly above the image in the PR |
| `path` | Route relative to the base URL, starting with `/` |
| `viewport` | `desktop` (1280×800, default) or `mobile` (360×740) |
| `login` | `{ "role": "ADMIN" }` at spec or shot level; `null` on a shot for logged-out |
| `steps` | Ordered `click`, `fill: [selector, value]`, `waitFor`, `press` |
| `element` | Crop to this selector instead of the viewport |
| `fullPage` | Capture the whole scrollable page (ignored with `element`) |
| `mask` | Selectors painted over before capture |

Login uses the Credentials provider. Export the test account for each role
used: `PR_SHOTS_<ROLE>_EMAIL` and `PR_SHOTS_<ROLE>_PASSWORD`. The account must
have a verified email. Never write these values into the spec or the repo.

The script pre-declines analytics consent (no banner, no tracking) and hides
the Next.js dev indicator.

## 3. Capture and review

```bash
node .agents/skills/pr/scripts/pr-shots.mjs capture --spec <spec.json> --out <dir outside repo>
```

Open every PNG in `<dir>` and check it against the privacy gate and the change
it should show. Recapture until each image is right.

## 4. Publish

The PR must exist first; its number names the asset folder.

```bash
node .agents/skills/pr/scripts/pr-shots.mjs publish --pr <number> --dir <capture dir> [--dry-run]
```

`publish` commits the PNGs to `pr-<number>/` on the orphan `pr-assets` branch
with git plumbing (no checkout, working tree untouched) and pushes it. It prints
Markdown with each description above its image, pinned to the asset commit's
raw URL. `--dry-run` builds the commit without pushing.

Paste that Markdown at the top of the description, then update the PR with
`gh pr edit --body-file`. Read the published body back and confirm each image
URL returns `200`.
