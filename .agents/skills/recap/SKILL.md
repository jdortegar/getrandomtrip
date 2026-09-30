---
name: recap
description: "Trigger: feature recap video, browser walkthrough. Record a short local demo; publish to Slack only when authorized. Not text summaries or general testing."
---

# Recap

## Activation Contract

An explicit `$recap` invocation authorizes recording and publishing the verified
MP4 to **Randomtrip → #github-updates**. Honor narrower requests such as “record
only,” “preview,” or “show me first”: keep the video local until publishing is
approved. Automatic skill selection does not authorize uploading or posting.
Authoring, installing, reviewing, or discussing this skill executes nothing.

## Hard Rules

- Show the complete implemented feature at natural speed in **at most 15 seconds**.
  Never omit required coverage or speed up a take to fit.
- Record only the actual local website from the verified source checkout. Never
  substitute production, a preview deployment, screenshots, or synthetic video.
- Preserve the default native **1728 × 1117 viewport at DPR 2**, **3456 × 2234
  H.264 MP4 at 60 FPS**, with a visible cursor. No emulation or upscaling.
- Use only session-permitted tools and their documented capabilities. A skill
  cannot grant recording access; missing capability is a blocker, not permission
  to install tools or bypass computer-use restrictions.
- Preserve unrelated edits, sessions, and drafts. Do not commit, push, open PRs,
  merge, change issues, or deploy as part of a recap.

## Decision Gates

- No browser-visible result, unsafe demo interaction, missing recorder, or
  unavailable native quality: report the blocker before capture.
- Complete, readable coverage cannot fit: explain the constraint; do not deliver
  an incomplete or overlong clip.
- Uncertain send: inspect delivery evidence before any retry; never post blindly.

## Execution Steps

1. Honor an explicit PR, branch, or focus. Otherwise inspect current-branch work,
   including relevant uncommitted changes, against its PR base or merge base. If
   none exists, use the PR just completed in this session, then the repository's
   latest merged PR by **merge time**. Verify the actual diff and selected source.
2. Read [Recording](references/recording.md) before any setup or capture. Plan
   every required section and meaningful interaction, including the footer for
   page-wide changes; rehearse, reset to the top, and record.
3. Run [the verifier](scripts/verify-video.py), then inspect the decoded opening,
   each required view, the ending, and motion. Retake failures; encoding checks
   alone cannot prove a real, complete walkthrough.
4. Only when publishing is authorized, read [Slack](references/slack.md), upload
   the actual verified MP4 as the signed-in user with a short title, and verify
   the posted attachment. Reuse a valid clip only if its scope is unchanged.

## Output Contract

Return the absolute local video link and duration. Include a verified Slack
permalink only after posting; otherwise state local-only, blocked, or uncertain.
Retain the accepted MP4 and close only temporary resources you created.

## References

- [Recording](references/recording.md) — capability gate, checkout, pacing, quality.
- [Slack](references/slack.md) — authorization, destination, upload, readback.
