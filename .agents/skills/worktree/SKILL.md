---
name: worktree
description: "Trigger: worktree, main checkout busy, another agent/session active, parallel branch, run a branch locally while checkout busy, clean up worktrees. Create, run, list, and clean Git worktrees."
---

# Worktree

## Activation Contract

Use a worktree ONLY when the main checkout is busy. Busy means any of:
(1) `git status` shows real changes this task did not make, (2) `HEAD` is on a
branch this task does not own and has reflog activity in the last 4 hours, or
(3) the user says another agent/session works there. Otherwise work in the
main checkout. An explicit `$worktree` invocation authorizes the script
commands below; it never authorizes commits, pushes, or remote deletion.

## Hard Rules

- Location: `../<repo>-worktrees/<branch with / -> ->`; one worktree per
  branch, reused if it exists. Never `/tmp`.
- Never stash, switch, reset, or edit files in another session's checkout.
- `create` seeds `.env` / `.env.local` from the main checkout itself. Agents never
  read, print, or copy `.env*` by hand; the script never overwrites an existing
  file and refuses symlinks, the main checkout, and files Git does not ignore.
- Branches start with upstream unset; push only with an explicit refspec:
  `git push -u origin <branch>:<branch>`.
- Delete a remote branch only after the user confirms it.
- Never remove a worktree with real changes (LFS files identical to `HEAD`
  are not real changes); the user decides per case.

## Decision Gates

| Situation | Action |
|-----------|--------|
| Main checkout not busy | Work there; no worktree |
| Checkout changed under you mid-task | Stop writing; `create` a worktree and continue there |
| User reports another session, script sees nothing | `create <branch> --user-says-busy` |
| `create` prints `env: not copying ...` | Report the reason; the user fixes the source file before `dev` |
| Port 3010 busy | `dev` picks the next free port; warn Google login needs that callback registered |
| Worktree has real changes | Ask: back up to a branch, or discard |
| `remove` refused | Report the reason; do not force |

## Commands

`node .agents/skills/worktree/scripts/worktree.mjs <command>`

- `create <branch> [--from <ref>] [--user-says-busy]`: verify busy, add or
  reuse the worktree (default from `origin/develop`), unset upstream, `npm ci`
  with a placeholder `DATABASE_URL`, seed missing `.env` / `.env.local` from the main checkout.
- `dev <branch>`: first free port from 3010; runs `next dev -p <port>` with
  inline `NEXTAUTH_URL=http://localhost:<port>` (`.env` untouched).
- `list`: read-only; path, branch, merged into `origin/main`, real changes,
  listening process, prunable, suggested action.
- `clean [--apply]`: dry run by default; `--apply` prunes stale records and
  removes merged, unchanged, idle worktrees. Keeps local branches.
- `remove <branch>`: only if clean and merged; stops its dev server, removes
  the worktree and local branch. Remote branch untouched.

## Execution Steps

Testing a branch: `create <branch>` (seeds env files) → `dev <branch>`
→ give the user the printed URL.

Cleanup: `git fetch origin main` → `list` → `clean` (dry run) → `clean --apply`
after the user agrees → per-case decisions for `needs-decision` →
`remove <branch>` for specific ones.

## Output Contract

Report the worktree path, branch, upstream state, URL/port when running, any
env files copied or refused (names only, never contents), and for cleanup what was removed, kept, and
awaits a decision. Never claim removal or push that did not happen.

## References

- [worktree.mjs](scripts/worktree.mjs) — script; pure helpers tested in `worktree.test.mjs`.
