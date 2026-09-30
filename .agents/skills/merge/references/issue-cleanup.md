# Verified issue cleanup

## Inspect closure effects before merging

1. Resolve each candidate's exact repository, number, current state, and acceptance
   scope. Candidates are actual GitHub Development/closing links, explicit resolution
   directives in the PR body or its commits, and issues the user explicitly includes.
   An incidental mention, URL, search match, or discussion comment alone does not
   authorize cleanup. Do not search for unrelated old issues or perform mass cleanup.
2. Inspect both PR links and closing directives in the actual PR body and commits.
   Closing keywords in a PR description are interpreted for default-branch-target
   PRs; commit closing directives can take effect when those commits reach the
   default branch. Missing automatic links on a PR targeting `develop` must not
   hide its explicit closing intent. Resolve the repository's actual default branch
   and target rather than assuming `main` or that merging anywhere auto-closes issues.
3. Compare each issue's acceptance criteria, relevant comments/checklists, and
   dependencies with the verified PR diff and evidence for that head. Require
   evidence for the whole issue, not just the part this PR implements. Keep issues
   open while any required scope remains incomplete: partial fixes, umbrella trackers
   with unfinished child work, incomplete rollout/operations tasks, or unresolved
   release or hosted-verification requirements. A merge to `develop`
   cannot establish production release or hosted acceptance. Do not deploy, run
   production actions, or manufacture evidence to finish cleanup.
4. If an incomplete or unverified issue could be closed automatically by this
   merge, stop before merging and report the problematic link/directive. Likewise
   stop if automatic closure conflicts with an explicit instruction not to close
   issues. Do not silently edit PR text, commit messages, or links; removing the
   directive/link needs separate authorization. If already merged and an incomplete
   issue was automatically closed, report it; reopening also needs authorization.

## Close only after a verified merge and within authorized scope

- Manual cleanup requires an explicit full `$merge` invocation or separate issue
  cleanup authorization, not ordinary merge-only wording. Honor explicit omissions.
  A closing keyword identifies intent; it is not proof of acceptance or permission
  to close an incomplete issue.
- After merge readback, re-read every candidate's state and latest acceptance scope.
  Account for GitHub auto-closure, concurrent edits, and already completed actions.
  If acceptance changed, reassess it. Record already closed issues without closing
  again or adding duplicate comments. Do not reopen them as a side effect.
- Close an open candidate only when its complete acceptance is demonstrably met by
  the verified merged PR and any required release/hosted evidence. Use its exact
  repository and issue number; close as completed, never delete. Use a closure
  comment only when explicitly requested; do not edit labels, milestones, projects,
  issue text, or unrelated comments as part of cleanup.
- Read back each closure to confirm `CLOSED`. If the response or state is uncertain,
  read state before considering a retry; if it remains unverifiable, stop that
  mutation and report uncertainty. On resumption, reassess still-open candidates
  and skip already finished closures.
- Report closed and already closed issues separately from deferred issues (scope
  incomplete or evidence missing) and blocked closures (permission/tool failure).
  Cleanup blockers do not undo a verified merge or imply that deployment succeeded;
  an authorized merge announcement may proceed without claiming cleanup is complete.
