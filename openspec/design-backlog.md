# Design Backlog

Pages and sections that are functionally complete but have not been designed yet.
Add entries here when a page is built without a Figma spec or visual design pass.

Last updated: 2026-06-23

---

## Status legend

| Status | Meaning |
|--------|---------|
| `needs-design` | No design exists — page is functional/placeholder only |
| `in-progress` | Designer is actively working on it |
| `ready-for-dev` | Figma spec exists, ready to implement |
| `done` | Implemented and matches design |

---

## Pages

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Review Form | `/review/[token]` | `needs-design` | Token-based public page. Three states: form, already-submitted, invalid token. Currently uses HeaderHero + basic card layout. |
| Admin Reviews | `/dashboard/admin/reviews` | `needs-design` | Table with approve/publish toggles. No layout spec beyond the shared admin shell. |

---

## Sections

| Section | Page / Component | Status | Notes |
|---------|-----------------|--------|-------|
| — | — | — | — |

---

## Notes

- When a design is ready, move the row to `ready-for-dev` and link the Figma frame in the Notes column.
- When implemented, move to `done` and add the PR number.
