---
name: release
description: "Trigger: release, ship to production, promote develop to main, merge and release a PR. Merge a feature PR into develop, then open and merge the develop→main release PR."
---

# Release

## Activation Contract

An explicit `$release` invocation, or a request to merge a PR and promote
`develop` to `main`, authorizes: merging the named (or current-branch) feature
PR into `develop`, opening or reusing the `develop` → `main` release PR, and
merging it. Merging into `main` deploys production; never infer it from a
merge-only request. Slack announcements and issue closure are not included
unless explicitly requested — then follow [Merge](.agents/skills/merge/SKILL.md) for them.
Authoring or reviewing this skill executes nothing.

## Hard Rules

- Follow [Merge safety](.agents/skills/merge/references/merge-safety.md) for both merges:
  exact repo/PR/head SHA, gates, no admin bypass, no auto-merge, read back.
- Merge with merge commits only (`gh pr merge --merge --match-head-commit`);
  never squash or rebase either step.
- Never commit, push, reset, or delete branches; keep the worktree untouched.
- Do not open a second release PR when one `develop` → `main` is already open.

## Decision Gates

| Situation | Action |
|-----------|--------|
| Feature PR is draft, not based on `develop`, or gates fail | Stop before merging |
| Feature PR already merged | Verify merge commit, continue to release |
| `git rev-list origin/main..origin/develop` is empty | Stop: nothing to release |
| Release PR checks pending | Wait in bounded intervals, max 10 min |
| Netlify checks `skipping` / deploy preview `canceled` on release PR | Expected (release previews are skipped); not a failure |
| Any other failing or missing required check | Stop and report |

## Execution Steps

1. Resolve the feature PR; verify base `develop`, state, `mergeStateStatus`,
   checks, and head SHA. Merge it and read back `MERGED` + merge commit.
2. `git fetch origin main develop`; list develop-only non-merge commits and the
   PRs they came from.
3. Reuse an open `develop` → `main` PR or create one titled
   `chore(release): promote develop to main`, with a body (temp file outside
   the repo, `--body-file`) listing included PRs and a post-deploy check.
4. Wait for checks per the gates; confirm head SHA equals the `develop` tip.
5. Merge with a merge commit and `--match-head-commit`; verify `MERGED` and
   `git merge-base --is-ancestor <develop tip> origin/main`.

## Output Contract

Report both PR links with merge commits, the released changes, and pending
post-deploy QA. Distinguish stopped, pending, and completed steps; never call
a queued or unverified merge complete.

## References

- [Merge](.agents/skills/merge/SKILL.md) — merge gates, issue cleanup, Slack announcement.
- [Merge safety](.agents/skills/merge/references/merge-safety.md) — identity, gates, readback.
- [PR](.agents/skills/pr/SKILL.md) — PR body conventions when a feature PR must be created first.
