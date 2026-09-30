# Signed-in-user Slack announcement

## Destination and authorization

Default to **Randomtrip → #github-updates**, workspace **T0ATKF9157F**, channel
**C0AV3K4125B**, at <https://getrandomtrip.slack.com/archives/C0AV3K4125B>.
Follow an explicit destination override; never substitute a similarly named channel
or another workspace. The configured destination was verified during authoring,
but verify its live identity and accessibility again before every send.

An explicit full `$merge` invocation includes this announcement unless omitted.
Ordinary merge-only wording does not. Use the invoking user's signed-in Slack
desktop app or browser through the available computer-use tool and its documented
APIs. Inspect the live UI and verify the signed-in user, workspace, and channel
before composing. Do not install an integration, extract session credentials,
read session stores, or substitute an app/bot identity.

If sign-in, identity, or channel access cannot be verified, report the completed
merge and unsent announcement separately. Do not announce a pending or uncertain
merge as successful. Resuming this step never requires re-merging the PR.

## Exact one-line format

Send one parent announcement per explicit full-workflow invocation, including for
an already merged PR. A new user invocation may announce it again. During a resume,
skip an already verified send; do not search for the PR URL or inspect old messages
to deduplicate announcements from prior invocations.

The parent message must render on one line in exactly this format:

`PR #<number> - <description>`

Link only `PR #<number>` to the verified pull request. Summarize the actual change
in about five words, never more than ten words excluding the PR-number prefix.
Count description words before sending. For a test PR, make its test purpose clear
within the limit. Do not prepend “Merged”, copy a long title, append a raw URL, or
add emoji, mentions, status details, or another sentence. Dismiss automatic link
previews when supported. Keep verification/issue details in the final response
unless the user requests a Slack thread; never imply deployment success without
checking it.

## Preserve drafts, send once, verify

- Inspect the composer for an existing draft and preserve it. Use a clean supported
  composer surface or ask for help if none is available; never clear or overwrite
  an unrelated draft. Prefer `set_value` when the selected interface supports it:
  native Slack `type_text` with newlines can send prematurely.
- Use documented formatting actions rather than assuming Markdown renders as a
  link. Inspect the complete text, linked PR, sender, and destination, then send
  once using the observed send control. Do not press Enter with uncertain focus.
- Verify the new message in channel history with the intended sender, content,
  and PR link. Capture its Slack permalink when available; verify any requested
  thread reply separately. This post-send readback is not a search for earlier
  announcements.
- If the send result is uncertain, do not send again blindly within this invocation
  or its resumption. Report uncertainty and require evidence of non-delivery or
  renewed explicit authorization before retrying. If a draft remains unsent, report
  it as unsent. Do not undo the merge because Slack failed.
