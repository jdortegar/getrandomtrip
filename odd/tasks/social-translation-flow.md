# Social translation flow — @getrandomtrip.es → @getrandomtrip.en

Objective: detect new Spanish Instagram posts daily, translate caption + artwork with OpenAI on demand from Slack, review/revise, then publish to @getrandomtrip.en through the Meta Graph API.
Branch: `feat/social-translation-flow` (from `develop` 2ecf845d) · Delivery: `single-pr` (one coherent feature; work-unit commits) · Test runner: `npx jest <path>`.

## Specs

- **S1 — Detection card.** "when the Spanish account publishes a post, I receive a message in my Slack channel ("translations") to start the flow. The button could say "Translate this post."" Detection frequency: "run daily", then "do it in the same recap job" (weekday Instagram recap, 4-day window). Each Spanish post is announced once. Channel: existing #social-media-translations (`C0CAQS7HNH4`) — assumption: this is the "translations" channel.
- **S2 — Translate.** "That action hits OpenAI to translate the images and the caption." Caption and on-image copy follow the `randomtrip-en-social-transcreator` skill ("use this skill for the caption"). Carousels translate every image slide; a carousel is one review.
- **S3 — Review.** "We wait for a human to review or request changes." Existing Approve / Request changes loop, applied to the whole post; feedback can target caption, artwork, or both, and specific slides.
- **S4 — Publish button.** "Once changes are approved, another button will ask to publish."
- **S6 — Ordered mirror.** "also add a verification to not jump posts, en account should be sync in the same order as the english one, so at the beggining we will have a delay of maybe 30 posts". One Spanish post in progress at a time, oldest unmirrored first; publish refused while an earlier post isn't mirrored; manual "Mark as posted" for videos/hand posts; admin sets the sync starting point.
- **S5 — Publish.** "The app connects with the Facebook Business API to publish it." Publishes to @getrandomtrip.en only (Instagram content publishing API). Assumption: Instagram only, no Facebook Page crosspost. Gated by an explicit flag and a target-username guard; uncertain publish attempts are never retried automatically.

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S2, S3 | inline | done | 9d352ff9, 0625cf34 |
| T2 | S1 | inline | done | 70f0886d |
| T3 | S2 | inline | done | fef528b2 |
| T4 | S4, S5 | inline | done | d09d4a46 |
| T5 | S1–S5 docs/env | inline | done | a552f920 |
| T6 | S6 | inline | done | d7a81283 |
| T7 | S5 | inline | done | retry before media_publish |

- T1 — Multi-image reviews: schema (`imageUrls`, job `kind`, nullable `reviewId`, `sourceId`), migration, Slack card renders all slides, feedback modal accepts slide numbers. Risk: item 1 (persisted format change on existing tables).
- T2 — `SocialSource` model, source Graph client (media + children), daily scheduled function (production only) + internal route + admin "check now", Slack "Translate this post" card.
- T3 — TRANSLATE job: download source media, vision transcreation with the skill, per-slide image edits with exact copy, create review revision 1, post review card.
- T4 — "Publish to @getrandomtrip.en" button on approved reviews, PUBLISH job, JPEG conversion, carousel/single container + publish, card status. Risk: item 1 (irreversible external effect).
- T5 — `docs/SlackSocialApprovals.md`, `env.example`.
- T7 — Retry a publish that never reached `media_publish` (timeouts and lost leases). `publishAttemptedAt` on the same unapplied migration. Risk: item 1.

Route evidence: all units share `slackApproval.ts`, the Slack route, the worker and the schema, so no disjoint parallel units exist (Writer trigger not fired); inline.

## Log

- L1 (2026-10-21, user, verbatim): "I found some issues in this flow. First of all, I like that when the Spanish account publishes a post, I receive a message in my Slack channel ("translations") to start the flow. The button could say "Translate this post." From there, the flow should work like this: 1. That action hits OpenAI to translate the images and the caption. 2. We wait for a human to review or request changes. 3. Once changes are approved, another button will ask to publish. 4. The app connects with the Facebook Business API to publish it."
- L2 (2026-10-21, user, verbatim): "i dont want to waste resources every 10 min, what could be the best strategy ?" → "run daily"
- L3 (2026-10-21, user, verbatim, earlier): "so use this skill for the caption and lets post the 4 images"
- L4 Findings: Meta has no webhook for own-account new media (polling required). Netlify scheduled functions run only on production deploys, and reviews/buttons/DB must share one environment → production after release; develop testing via admin "check now". Existing `INSTAGRAM_PAGE_ACCESS_TOKEN` is read-only (instagram_basic, instagram_manage_insights); publishing needs `instagram_content_publish` + a Page token for the Page linked to getrandomtrip.en. Instagram publishing requires public JPEG URLs; uploads are converted to WebP today.
- L5 Engram mirror: pending (Engram tools unavailable in this session).
- L6 (2026-10-21) Evidence: social/AI/recap suites 127 tests pass (baseline 56); eslint + prettier clean on feature files; no social type errors. Test-first deviation: tests were written alongside each unit rather than observed RED first. Live Slack/Meta/OpenAI calls not exercised; publishing needs SOCIAL_TARGET_PAGE_TOKEN with instagram_content_publish.
- L7 (2026-10-21, user, verbatim): "do it in the same recap job" → detection moved into the weekday Instagram recap job (no separate scheduled function); window widened to 4 days so Monday covers Fri–Sun. S1 frequency now: weekdays with the recap.
- L8 Independent verifier: no blockers; S1–S5 met; invariants (migration additive, no double media_publish, account/flag guard, no repeat paid calls, legacy reviews, no flood) hold. Fixed advisories 5 (TRANSLATE retry resets source status) and 6 (fences write updatedAt explicitly). Open advisories: legacy generatedImageUrl checkpoint ignored on retry; lease-expired publishes have no in-app retry; 10-minute lease not renewed for long carousels; slide numbers validated only in the worker; card header now mrkdwn with user mention.
- L9 (2026-10-21, user, verbatim): "also add a verification to not jump posts, en account should be sync in the same order as the english one, so at the beggining we will have a delay of maybe 30 posts" → S6/T6: sequential queue replaces the 4-day window and shortcode announce; publish order guard; Mark as posted manually; syncedThrough baseline. Social suites 141 tests pass, tsc 0 errors.
- L10 (2026-10-22): fixed queue stall — a source card Slack never confirmed (no messageTs, ANNOUNCING/UNSUPPORTED, older than 10 min) is re-posted by the next advance. Social suites 143 tests pass, tsc 0 errors.
- L11 (2026-10-22, user, verbatim): "yes" to adding an in-app retry for a publish that times out before posting anything. Resume after Claude session `getrandomtrip-6e` hit the weekly limit mid-change. T7: record `publishAttemptedAt` immediately before `media_publish`; retry only when that field is still empty (timeouts and lost leases included). Same unapplied migration. Risk: item 1 (migration + irreversible Instagram publish).
- L12 (2026-10-22): writer checks: social suites 105 pass; focused publish/jobs tests 11 pass; `tsc --noEmit` 0 errors; eslint clean on touched files. Independent verifier unavailable (subagent model limit). Parent spot-check: focused vitest 11 pass.
