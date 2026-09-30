# Publish the verified recap

## Authorization and destination

Publish only for an explicit full `$recap` invocation or an explicit instruction
to post the video. “Preview,” “record only,” and “show me first” override that
default and require subsequent publishing approval. Automatic skill selection,
skill authoring, a merge request, or merely mentioning Slack grants no upload or
send permission. This workflow does not run the PR or merge skills.

Default: **Randomtrip → #github-updates**, workspace **T0ATKF9157F**, channel
**C0AV3K4125B**, at <https://getrandomtrip.slack.com/archives/C0AV3K4125B>.
Honor an explicit destination override. Verify the live workspace, channel, and
signed-in sender before uploading; never substitute a similar channel.

Use the invoking user's signed-in Slack desktop app or browser through the
session's permitted computer-use interface and documented APIs. Do not extract
tokens, inspect session stores, install integrations, or substitute an app/bot
identity. If identity, access, or supported file upload cannot be verified, retain
the local clip and report the blocker without uploading elsewhere.

## Attach, inspect, send once

1. Open the channel's main message composer, not a thread or canvas. Preserve any
   existing draft and attachments. Use a separate supported compose surface, or
   stop if doing so would overwrite unrelated work.
2. Attach the exact verified local MP4 through an observed upload control and the
   documented file-picker/upload flow. Do not assume API names or inject paths
   through unsupported methods. Wait for a completed upload and video/file card.
3. Add only a short descriptive title. Use a supported non-submitting text-entry
   method; native text entry with newlines can send prematurely. Inspect the
   title, attachment filename, signed-in sender, and channel together before send.
4. Send once using the observed control. Do not press Enter with uncertain focus.
   Never replace the actual attachment with a local path, external video link,
   text recap, or unrelated PR announcement.
5. Verify the sent channel message under the intended user contains both the
   title and the correct playable video attachment, and obtain its permalink
   where supported. A composer preview or completed upload alone is not a post.

If sending is uncertain, inspect recent messages for this take's title and
attachment. Do not retry without evidence of non-delivery or renewed explicit
authorization. Report failed, unsent, or unconfirmed outcomes distinctly. Resume
only the unfinished authorized action and reuse a verified clip only when the
selected implementation and scope remain unchanged; do not resend a verified post.
