---
name: merge
description: "Trigger: merge a PR, run Merge, resume merge cleanup or announcement. Verify the merge, resolved linked issues, and a signed-in-user Slack announcement."
---

# Merge

## Activation Contract

An explicit `$merge` invocation authorizes the complete merge, verified linked-issue
cleanup, and Slack announcement workflow. Honor explicit omissions. Automatic
selection for an ordinary merge-only request grants no manual issue cleanup or
Slack posting permission. Authoring, installing, or reviewing this skill executes
nothing.

## Hard Rules

- Resolve the exact repository, PR, base, and head SHA; preserve unrelated work.
- Never bypass protections, invent passed checks, delete issues, reset branches,
  delete branches/worktrees, or deploy as a side effect.
- Merge success is not proof that an issue's acceptance criteria or deployment
  requirements are complete. Close only verified, fully resolved linked issues.
- Post through the invoking user's signed-in Slack interface, not an integration.

## Decision Gates

- Draft, ambiguous target, unsafe automatic issue closure, or unmet merge gates:
  stop before merging and report the blocker.
- Already merged: verify the recorded merge and skip re-merging. Resume only
  unfinished authorized actions; a new full-workflow invocation may announce again.
- Blocked cleanup or posting: preserve the successful merge; report each outcome
  separately without retrying an uncertain mutation blindly.

## Execution Steps

1. Read [Merge safety](references/merge-safety.md) before resolving or merging.
2. Read [Issue cleanup](references/issue-cleanup.md) before any merge to inspect
   automatic closure risks; execute manual cleanup only when authorized.
3. Verify the completed merge, then re-read issues before any authorized closure.
4. When posting is authorized, read [Slack announcement](references/slack-announcement.md).
   Default: **Randomtrip → #github-updates**. Follow explicit destination overrides.

## Output Contract

Return the verified PR link, issue outcomes (closed/already closed/deferred/blocked),
and verified Slack permalink when available. Distinguish pending, omitted, failed,
and uncertain steps; never present a queued merge or unsent draft as complete.

## References

- [Merge safety](references/merge-safety.md) — identity, gates, ancestry, readback.
- [Issue cleanup](references/issue-cleanup.md) — scope, acceptance, automatic closure.
- [Slack announcement](references/slack-announcement.md) — destination and exact format.
