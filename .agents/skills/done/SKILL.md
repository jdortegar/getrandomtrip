---
name: done
description: "Trigger: run Done, or It's done as a delivery request. Publish the PR, merge, announce, and recap browser-visible results."
---

# Done

## Activation Contract

A full `$done` invocation, or “It's done” clearly requesting delivery, authorizes
the sequence below: PR publication, merge, verified resolved-issue cleanup, the
Slack announcement, and recording and posting an eligible recap. Honor narrower
user restrictions. Mentioning, authoring, installing, or reviewing this skill, or
acknowledging an unrelated completed step, executes nothing. Clarify ambiguous
completion signals before consequential actions.

## Hard Rules

- Keep the same intended change throughout. Carry the verified repository, PR
  URL, head/base, actual diff, and merge result into each subsequent step.
- Preserve explicitly requested branches; otherwise use `develop` for the
  established feature workflow, not an assumed `main`.
- Child skills own their mechanics, gates, and destination defaults:
  **Randomtrip → #github-updates** unless overridden. Done does not authorize
  recorder bypasses, tool installation, or host repair.

## Decision Gates

- Stop at a blocking prerequisite and report completed and unfinished steps.
  Never undo completed actions because a later step failed.
- On resumption, verify the recorded target and outcomes; run only unfinished,
  still-authorized steps. Do not repeat verified posts or blindly retry an
  uncertain action. Follow each child's readback and retry rules.

## Execution Steps

Read each linked skill in full just before its step; follow its required
references and gates rather than replacing them with this coordinator.

1. Follow [PR](../pr/SKILL.md) to create or update the intended pull request.
2. Follow [Merge](../merge/SKILL.md) for that exact PR, including verified
   resolved linked-issue cleanup and the signed-in-user Slack announcement.
3. Follow [Recap](../recap/SKILL.md) to record and post a verified video only if
   that PR's diff introduces UI or functionality with a browser-visible result.
   Pass the intended PR and verified source explicitly after merge; never select
   unrelated current work or a latest PR. Otherwise skip Recap.

## Output Contract

Report the verified PR link and per-step outcomes, including skipped or restricted
Recap, blockers, and uncertainty. Include video and Slack links only as verified
by the child skills; do not claim the whole sequence completed while steps remain.
