---
name: pr
description: "Trigger: create or update a PR, record prompt history. Pair exact user prompts with brief commit-linked summaries and UI screenshots."
---

# PR

## Activation Contract

Create or update a pull request using the exact prompts behind its changes and
brief, commit-linked summaries. Installing or reviewing this skill does not
authorize running the workflow or publishing a PR.

## Hard Rules

- Follow the user's repository, head/base branches, scope, and draft status.
  Respect release PRs such as `develop` to `main`; do not force a feature branch.
- Commit and push intended changes only when needed for an explicit PR publication
  request. Preparing a description alone does not authorize those actions.
- Never merge or send Slack announcements in this skill.
- Keep raw transcripts and generated history artifacts out of the repository.

## Decision Gates

- For UI changes, place described screenshots of the rendered result before the
  prompt/summary pairs. Omit screenshots for non-UI changes.
- If history is incomplete or publishing fails, report the gap or blocker. Do not
  invent prompts or commits, claim success, or bypass repository protections.

## Execution Steps

1. Before recovering prompts or composing the description, read
   [Description contract](references/description-contract.md) in full. It defines
   history selection, redaction, commit evidence, and the exact PR body format.
2. Inspect the requested head, base diff, commits, and any existing PR. Run the
   repository's relevant checks; commit and push only within the authorization
   boundary above. Build the final body after any needed commits exist.
3. Before publication, compare prompts with their sources and check rendered
   images, prompt/blockquote boundaries, and commit links.
4. When publication is requested, use a temporary body file outside the repository
   with `gh pr create --body-file`, `gh pr edit --body-file`, or an equivalent
   structured GitHub API call. Verify the published description, head/base, and
   open state by reading them back. On failure, keep the body and report the blocker.

## Output Contract

Use the exact description format in the reference and a concise, descriptive PR
title. Report a published PR only after verification; otherwise return the
prepared description or blocker without implying publication.

## References

- [Description contract](references/description-contract.md) — required before
  selecting prompt history or writing a PR description.
