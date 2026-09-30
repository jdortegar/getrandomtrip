# Record and verify

## Capability gate

Read the current session's computer-use instructions before touching the browser.
Confirm an available, documented, permitted recorder can capture the real browser
content with a visible cursor, preserve natural timing, flush on failure, and
produce a local MP4 at the required native quality. Browser screenshots and
navigation alone are not recording capability. Do not invent recording APIs.

Use the session's supported browser/control surface. When control is restricted
to CUA, use only CUA's documented APIs for browser and app interaction; do not
substitute shell-launched Agent Browser, raw CDP, AppleScript, or another OS
automation path. If no permitted recorder is available, stop and report that
recording is blocked. Do not install tools or assemble screenshots into a fake
walkthrough. A user-supplied real recording may be verified, but identify it as
supplied rather than claim to have recorded it.

This adaptation intentionally omits the source skill's Agent Browser launch
recipe and raw-CDP resize/scroll helpers. Their existence does not establish
permission or an equivalent recording capability in another session. The quality
and natural-scroll requirements remain; they must be proven by the actual tools.

## Source and local setup

- Identify the selected repository, checkout, branch/commit, and relevant dirty
  diff before choosing a URL. Use the requested PR's actual head/base, not an
  assumed `main`. Preserve dirty work; use an isolated checkout if different code
  is needed rather than resetting or switching a shared checkout.
- Verify the local server process's working directory matches that checkout and
  the browser is showing its local URL. A responding localhost port alone is not
  proof. Never stop or reuse an unrelated listener without establishing ownership.
- Follow the selected checkout's `AGENTS.md` and `package.json` for setup. The
  current Randomtrip `npm run dev` uses port **3010**; verify rather than assume.
  Do not install dependencies, seed/migrate databases, or alter secrets merely
  to obtain a demo. Report missing setup separately.
- Use the intended locale and role with already available safe demo data. Do not
  submit payments, create bookings, send messages, or change real records as a
  demonstration side effect. A local frontend may still contact real services.
  If a meaningful interaction needs unsafe data or external effects, stop and
  request a safe target rather than stage the application or bypass auth.

## Native capture and pacing

Resolve installed offline `python3`, `ffmpeg`, and `ffprobe` for verification;
missing tools are blockers, not automatic installation permission. Save each take
in a unique folder in the user's resolved Downloads directory, or their chosen
location outside the repository. Do not put captures in `public/videos`.

Require a real **1728 × 1117 viewport at DPR 2**, with page-content output at
**3456 × 2234**, **H.264 MP4**, **60 FPS**, cursor visible. Verify dimensions through
documented observations. Do not emulate a device, force a scale factor, upscale,
or silently lower quality when the native window/display cannot provide it.
Exclude unrelated windows, desktop content, private data, and notifications.

1. Plan all required views, scrolling, purposeful hovers/clicks, and a readable
   ending before capture. Aim for **13–14 seconds**, leaving room under 15.
   Remove redundant actions, not implemented sections or meaningful results.
2. Load fonts and images, rehearse the route, then reset to the top. Verify
   **scrollY = 0** using a permitted observation and the visible opening. URL
   navigation can restore an old scroll position. Hold the opening about a second.
3. Prefer short wheel/touchpad pushes followed by a diminishing coast, keeping the
   pointer still during swipes. Where the documented tool supports gesture timing,
   start around **900 ms** and measure actual elapsed time; browser response can
   extend it. Spend more time on settled content than scrolling. Use normal
   human-paced pointer travel toward real targets, not custom pointer paths.
4. Execute the rehearsed sequence without model-thinking gaps, but only through
   permitted sequencing capabilities. Always stop and flush the recorder using
   its documented cleanup mechanism, even if an action fails. Inspect each result.

No anchor jumps during capture, constant-speed scrolling, injected scroll CSS,
application changes to stage the demo, narration, or music unless requested.
Never accelerate playback or discard required views to fit the duration cap.

## Verify before delivery

Resolve `recap_skill` to this skill's absolute directory and `recap_video` to the
actual captured MP4, then run the offline helper:

```sh
python3 "$recap_skill/scripts/verify-video.py" "$recap_video"
```

The helper checks the container family and recognized MP4 major brand, H.264,
dimensions, both reported frame
rates, **0 < duration ≤ 15 seconds**, and full-file decoding. It cannot prove
native provenance, cursor visibility, natural motion, readable content, privacy,
or scope. Inspect the **first decoded frame**, every required feature view, and
the ending; review motion and pauses against the rehearsed plan using permitted
local media inspection. Retake rushed, incomplete, failed, or overlong captures.
If verification or meaningful inspection is unavailable, do not publish or label
the video as verified. Retain a valid local clip if Slack alone is blocked.

The helper's offline regression checks require only Python's standard library:

```sh
python3 -B "$recap_skill/scripts/test_verify_video.py"
```

These use synthetic metadata and mocked subprocesses, not real encoding/decoding
or browser recording. Passing them does not verify a captured video.
