# Merge safety

## Resolve without changing the worktree

- Follow the requested repository, PR, head, and base. Otherwise resolve the
  current branch's PR from its actual remote. Record repository identity, PR URL
  and number, base, head SHA, state, and actual diff. Do not select an unrelated
  open PR when the current branch has none. Stop on zero or multiple candidates
  rather than creating a PR or choosing a duplicate arbitrarily.
- Use the verified repository and PR number explicitly for every mutation. Do not
  infer the remote from the shell's current directory at mutation time. Keep dirty
  worktrees and unrelated changes intact; no commit, push, checkout, reset, branch
  deletion, or worktree deletion is part of this workflow.
- Read GitHub first on resumption. For an already merged PR, verify `MERGED`,
  `mergedAt`, and the merge commit; use its recorded diff, not newer local branch
  changes. Skip merging and continue only the authorized remaining steps. A closed,
  unmerged PR is not success; do not reopen it incidentally.

## Verify the exact head and base

- Inspect current repository instructions, branch protections/rulesets, required
  checks, reviews, unresolved required conversations, draft status, conflicts, and
  mergeability for the recorded head and base. Use actual repository requirements,
  including documented quality gates; do not inherit another project's check names.
  Configuration placeholders, absent checks, stale results for another SHA, skipped
  jobs, or unavailable protection data are not evidence that requirements passed.
  Report missing evidence instead of assuming success.
- A draft remains a draft. Stop and report it; marking ready requires separate
  explicit authorization. Do not change draft state merely to make merging possible.
- For pending checks or unknown mergeability, wait in bounded intervals with useful
  progress updates, for at most ten minutes per invocation unless the user requests
  a different bound. On timeout, report pending. Investigate failures without
  editing code, rerunning workflows, weakening gates, or using admin overrides as
  incidental fixes. Do not enable auto-merge or queue a merge unless requested.
- Before merging, inspect linked issues and closing directives using
  [Issue cleanup](issue-cleanup.md), even in merge-only mode. Stop for unsafe
  automatic closure rather than silently changing the PR or its links.

## Merge and read back

- Use the requested method when allowed by repository policy; otherwise use a
  verified established method. If neither determines a safe method, ask rather
  than inventing a squash default. For long-lived `develop` to `main` releases,
  preserve branch ancestry with a merge commit. If the request or repository rules
  conflict with that, stop for resolution; do not squash/rebase or reset the
  long-lived branch to work around it.
- Immediately re-read identity, base, head, state, and gates. If the head changed,
  re-evaluate the diff, acceptance evidence, closing directives, and checks; if the
  target/base changed, stop and resolve authorization. Guard the write with
  `gh pr merge`'s `--match-head-commit` (or an equivalent conditional API write),
  using the explicit PR/repository and verified method. Never retry a rejected or
  uncertain merge before reading current GitHub state.
- Read the PR back and require `state: MERGED`, `mergedAt`, and its merge commit
  for the verified target before issue cleanup or a success announcement. Queued
  merges and enabled auto-merge are pending, not completed. If readback is
  unavailable, report uncertainty and stop downstream mutations.
- Only switch back to the base and fast-forward when separately requested and safe
  for the existing worktree. Never undo a merge because a later step failed.
