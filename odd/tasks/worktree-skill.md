# Worktree skill

## Objective

One documented, scripted way for Claude Code and Codex to use Git worktrees in this repo: when to create one, where, how to set it up and run it, and how to clean up.

## Problem

- Worktree rules are scattered: user memory ("real checkout by default; sibling worktree when another agent is active"), the global CodeGraph rule (siblings under home, never `/tmp`), and `merge`/`release` skills (never touch worktrees).
- Setup steps were rediscovered by trial and error on 2026-10-13: `npm ci` fails on Prisma's postinstall without `DATABASE_URL`; copying `.env` is blocked for agents; a branch created from `origin/develop` tracks `develop`, so a bare push targets `develop`.
- `npm run dev` hardcodes `-p 3010` and next-auth v4 + `/api/attribution/mode` trust `NEXTAUTH_URL`, so a second dev server needs a matching port and URL.
- Stale worktrees piled up: 12 prunable `/tmp` records and 3 leftover sibling worktrees, one holding unsaved work.

## Decisions (grill-me, 2026-10-14)

- **Trigger:** use a worktree ONLY when the main checkout is busy, checked mechanically: (1) `git status --short` shows changes the task did not make, or (2) `HEAD` is on a branch the task does not own with recent reflog activity, or (3) the user says another agent/session is working there. If the checkout changes mid-task: stop writing and move into a worktree; never switch it back or stash others' work.
- **Location/naming:** `../getrandomtrip-worktrees/<branch with / → ->`; one worktree per branch, reused if it exists; never `/tmp`.
- **Script:** `.agents/skills/worktree/scripts/worktree.mjs` with five commands:
  - `create <branch> [--from <ref>]`: verify busy, add or reuse the worktree, `git branch --unset-upstream`, `npm ci` with a placeholder `DATABASE_URL`; if no `.env`, print the exact `! cp <main>/.env <worktree>/.env` for the user (agents never copy `.env`).
  - `dev <branch>`: first free port from 3010; run `next dev -p <port>` with `NEXTAUTH_URL=http://localhost:<port>` inline (never edit `.env`); print the URL and warn that Google login needs the callback registered when the port is not 3010. (Next.js only auto-retries the default port, and next-auth v4 needs `NEXTAUTH_URL` to match.)
  - `list`: read-only; per worktree: path, branch, merged into `origin/main`, real uncommitted changes (LFS files identical to HEAD count as clean), dev server running from it, prunable.
  - `clean [--apply]`: dry run by default; `--apply` prunes stale records and removes worktrees that are merged and have no real changes. Never touches worktrees with real changes: they are reported for a per-case user decision (back up to a branch or discard).
  - `remove <branch>`: refuses unless clean and merged into `origin/main`; stops a dev server running from that worktree, removes it (including its `.env` copy), deletes the local branch. Remote branch deletion is never automatic.
- **Location of the skill:** `.agents/skills/worktree/` (`SKILL.md`, `scripts/`, tests), symlink `.claude/skills/worktree → ../../.agents/skills/worktree`, Codex `agents/openai.yaml` like `release`. User memory `feedback_never_use_worktrees.md` points to the skill.

## Scope

Delivery strategy: single PR to `develop` (small feature).

- [x] **W1** Script `worktree.mjs` (pure, testable helpers + thin CLI) with tests for: slug naming, busy detection, port selection, list/clean classification (incl. LFS-identical files), remove refusal rules.
  - Route: delegated writer. Tests at `.agents/skills/worktree/scripts/worktree.test.mjs` (Vitest collects `.agents/`: probe file appeared in `vitest list --filesOnly`).
  - Evidence: RED (module missing, then 3 failing cases for raw-hash LFS + recent activity) → GREEN `npx vitest run .agents/skills/worktree/scripts/worktree.test.mjs` 31/31; `node --check` OK; `list` and `clean` (dry run) ran against this repo; `remove chore/worktree-skill` refused (real changes); `npm run lint` exit 0 (covers `src/` only). `npm run typecheck` not run (`.mjs` is outside tsconfig `include`).
  - Accepted refinements: LFS "real changes" accept either the filtered or the raw (`--no-filters`) hash matching `HEAD` (repo's hero videos were committed raw before LFS); `clean` keeps worktrees with HEAD reflog activity in the last 4h (a fresh branch cut from `develop` right after a release counts as merged); `create --user-says-busy` covers busy rule (3); `clean` keeps local branches.
- [x] **W2** `SKILL.md` (activation, hard rules, decision gates, commands, setup/testing flow, cleanup), `agents/openai.yaml`, `.claude/skills/worktree` symlink.
  - Evidence: symlink staged as mode `120000` (checked via `git add -N`, then unstaged). AGENTS.md registration not done (outside writer surface).
- [x] **W3** Update user memory rule to reference the skill.

## Checks

- Script unit tests (Vitest) run and pass; confirm Vitest actually collects them (dot-directory include).
- `npm run typecheck`, `npm run lint` unaffected.
- Manual: `node .agents/skills/worktree/scripts/worktree.mjs list` against this repo.

## Progress

- 2026-10-14: design agreed; worktree `../getrandomtrip-worktrees/chore-worktree-skill` on `chore/worktree-skill` from `origin/develop` (upstream unset). Main checkout busy (another session on `chore/playwright-e2e` with uncommitted changes).
