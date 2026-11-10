# Translate @getrandomtrip.es posts to @getrandomtrip.en through Slack

The flow runs in **#social-media-translations** (`C0CAQS7HNH4`):

1. **Detect, in order.** @getrandomtrip.en mirrors @getrandomtrip.es post by post, in the same order, never skipping. The app offers **one** Spanish post at a time: the oldest one not yet on English, and only when no earlier post is still in progress. Its card has **Translate this post** and **Mark as posted manually**, plus how many Spanish posts are still waiting. The next post is offered right after a publication or a manual mark, so a backlog moves as fast as the team approves. The weekday Instagram recap job (09:05 Argentina, `netlify/functions/instagram-recap.ts`) also checks for new posts when nothing is in progress.
2. **Translate.** The button queues one paid job. It transcreates the caption and on-image copy in one vision call, following the Randomtrip transcreation rules (`.claude/skills/randomtrip-en-social-transcreator`, condensed in `src/lib/ai/socialTranscreation.ts`). It then edits each slide that has Spanish text with the exact English copy and posts **one review** with every slide. Slides without text are kept. Reviewer notes, if any, appear in the review's thread.
3. **Review.** **Approve** or **Request changes**. Changes target the caption, the artwork or both, and optionally specific slides (`1, 3`). Each request produces a new revision that needs a fresh approval.
4. **Publish.** An approved review shows **Publish to @getrandomtrip.en**, with a confirmation dialog. Publishing is refused while an earlier Spanish post isn't on English yet, and for reviews not linked to a Spanish post. The app publishes the caption and every slide through the Instagram content publishing API (single image or carousel), links the live post on the card, and offers the next Spanish post.

Each stage has its own flag, all off by default: `SLACK_SOCIAL_APPROVALS_ENABLED` (cards and buttons), `SLACK_SOCIAL_AI_ENABLED` (translations and revisions), and `SLACK_SOCIAL_PUBLISH_ENABLED` (publishing). Video posts can't be translated automatically: post them on English by hand, then **Mark as posted manually** so the queue continues.

## Where it runs

The recap job is a scheduled function, which Netlify runs on the **production** deploy only, and the Slack buttons, reviews and jobs must share one database. Run the full flow in production: point the Slack app's Interactivity Request URL at `https://<production-origin>/api/slack/social-approvals`, and set `SLACK_SOCIAL_IMAGE_ORIGIN` and `SLACK_SOCIAL_APP_ORIGIN` to the production origin. Instagram downloads published images from that origin, so it must be public.

To test on a branch deploy, point the Request URL and both origins at that deploy and use **Check now** below instead of the recap schedule.

## Setup

1. Apply migrations `20261021120000_social_approvals` and `20261022120000_social_translation_flow` (production applies them on deploy through `migrate-if-outdated`).
2. Slack app `A0CAR605CF8` (Randomtrip Social Approvals): Socket Mode **off**, Interactivity **on** with the Request URL above, bot invited to #social-media-translations. `chat:write` is enough. Set `SLACK_SOCIAL_BOT_TOKEN` and `SLACK_SOCIAL_SIGNING_SECRET`.
3. AI: `OPENAI_API_KEY`, `OPENAI_SOCIAL_IMAGE_MODEL` (a GPT Image model that supports edits), optional `OPENAI_SOCIAL_TEXT_MODEL` (default `gpt-4.1`), `SLACK_SOCIAL_WORKER_SECRET`, then `SLACK_SOCIAL_AI_ENABLED=true`.
4. Source account: `SOCIAL_SOURCE_PAGE_TOKEN`, a Page token for the Facebook Page linked to @getrandomtrip.es with `instagram_basic`. It defaults to `INSTAGRAM_PAGE_ACCESS_TOKEN`. The app refuses a token whose Instagram username isn't `getrandomtrip.es`.
5. Publishing: in the Meta app, add `instagram_content_publish` (plus `instagram_basic`, `pages_show_list`, `pages_read_engagement`). Generate a non-expiring Page token for the Facebook Page linked to @getrandomtrip.en and set it as `SOCIAL_TARGET_PAGE_TOKEN`. Then set `SLACK_SOCIAL_PUBLISH_ENABLED=true`. The app refuses a token whose username isn't `getrandomtrip.en`.

## Starting the sync and the backlog

Nothing is offered until the starting point is set: the last Spanish post that is already on @getrandomtrip.en. A signed-in admin sends a same-origin request with that post's shortcode (the part after `/p/` in its link):

```
POST /api/admin/social-approvals/sources
{ "syncedThrough": "DXiKjIyj3Ik" }
```

That post and every earlier one count as synced, and the next Spanish post is offered immediately. From there the backlog (around 30 posts at the start) goes one post at a time, in order. Without a body, the request offers the next post now if none is in progress ("Check now").

If Slack never confirms a post's card, the next check (recap run, publication, manual mark or Check now) posts it again after 10 minutes, so the queue can't stall. A rare duplicate card is possible; only the latest one's buttons work.

If someone posts a Spanish post's English version by hand, use **Mark as posted manually** on its card so the order stays intact. A post can't be marked while the app is publishing it.

Reviews can still be created directly, without a Spanish source (they can be reviewed but never published, to keep the feeds in order), with `POST /api/admin/social-approvals` and `{ reviewKey, requestId, caption, imageUrls: [...] }` (1–10 public HTTPS images on `SLACK_SOCIAL_IMAGE_ORIGIN`; `imageUrl` still works for a single image).

## Durability, retries and spending limits

- Paid AI jobs (translations and revisions) share a limit of **10 per UTC day**, and each review key allows five revisions. These are request limits, not a dollar budget; set an OpenAI project spending limit separately. Translation slide edits use `quality=high`; feedback revisions use `low`.
- One TRANSLATE job per Spanish post, one REVISE or PUBLISH job per review. Repeated clicks replay the existing job.
- A Netlify background function runs the jobs. A five-minute scheduled dispatcher recovers missed dispatches. Database leases prevent duplicate claims, and checkpoints (transcreation, finished slides, published media id) keep a resumed job from paying or publishing twice. Each checkpoint renews the 10-minute lease, so a 10-slide carousel is not killed mid-run. If the process dies, the lease expires 10 minutes after the last checkpoint and the job goes to `MANUAL_RECOVERY`.
- Uncertain paid calls or Slack deliveries move the job to `MANUAL_RECOVERY`; nothing is retried blindly. `GET /api/admin/social-approvals/jobs` lists jobs; a same-origin admin can retry one with `{ "jobId": "...", "confirmPossibleAdditionalCharge": true }`.
- **Publishing is never retried after `media_publish`.** The worker records `publishAttemptedAt` immediately before that call. Failures before it (`PUBLISH_FAILED`, a timeout, or a lost lease) leave that field empty, so an admin can retry. Once `publishAttemptedAt` is set, or the job has a recorded media id, retry is refused (`PUBLISH_UNCONFIRMED`): check @getrandomtrip.en first.

## Security

Slack signatures cover the original bytes and expire after five minutes. App, workspace, channel and message timestamp must match, and feedback modals are HMAC-bound to the actor, revision and expiry. Any workspace member who can see the channel can translate, approve or publish; don't share the channel externally. Prompts treat captions, images and feedback as content, never instructions. Source images are downloaded only from Instagram's CDN. Graph API tokens are never logged; publishing calls send them in the request body.

- [ ] Verify bad signatures, foreign identities and stale cards are rejected.
- [ ] Translate one post end to end on a test deploy and check every slide's text, photo and crop.
- [ ] Publish one approved test review and confirm it appears only on @getrandomtrip.en.

References: [Instagram content publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/), [Slack interaction responses](https://docs.slack.dev/interactivity/handling-user-interaction/), [OpenAI image edits](https://developers.openai.com/api/reference/resources/images/methods/edit), [Netlify scheduled functions](https://docs.netlify.com/build/functions/scheduled-functions/).

## Import a URL and stop at Slack review

An authenticated admin can open `/dashboard/admin/social-approvals` (English: `/en/dashboard/admin/social-approvals`) and submit a URL, or POST to `/api/admin/social-approvals/import`:

```json
{
  "instagramUrl": "https://www.instagram.com/p/De0IMw8jOGl/",
  "useReviewedExample": true
}
```

This **read-only import** uses the existing `SOCIAL_TARGET_PAGE_TOKEN`, independently of the publication flag. The Page token must resolve through the existing Meta account/profile client to **getrandomtrip.en**, with access to its professional-account media. The URL is parsed locally and never fetched or scraped: only an exact canonical permalink returned from the owned media feed (up to 500 recent accessible posts) can match. The initial UI supports one IMAGE post; reels, videos and carousels return a clear unsupported-media error. Meta permissions/access failures are not bypassed with browser login or scraping. The existing Facebook Login integration needs `instagram_basic` and applicable Page access/read permissions; verify the actual app/token setup before live testing. Meta documentation retrieval was unavailable during this implementation, so no new endpoint/permission capability is claimed.

Both Slack approvals and AI generation must already be configured/enabled. The same durable TRANSLATE queue, spend caps, checkpoints, immutable asset storage, and Slack review posting are reused. The worker rechecks account identity before reading media. Imported EN source rows are isolated from the Spanish synchronization backlog. Their generated reviews are **not linked to a publishable Spanish source**, and the Slack publish button is suppressed even if an unrelated publishing feature is enabled. This import does not publish anything or grant human approval.

For this exact reviewed solo post, selecting `useReviewedExample: true` locks the exact artwork headline and four-paragraph caption from the corrected transcreator references. The shortcode alone never selects or approves that copy. The same option on a different post is rejected. Explicit current-assignment `copyLocks` take precedence independently:

```json
{
  "instagramUrl": "https://www.instagram.com/p/De0IMw8jOGl/",
  "copyLocks": {
    "caption": "Exact caption with intentional paragraph breaks.",
    "artworkHeadline": "EXACT MAIN HEADLINE"
  }
}
```

Locked caption text bypasses rewriting, including during generic Slack feedback revisions. Locked headline instructions take precedence in artwork edits; pixel-exact rendering still requires visual approval. General feedback does not silently unlock either field. For an explicitly changed locked field, an admin can submit a new manual review using the existing admin review endpoint with a new request ID, the same review key, updated artwork URL/caption, and updated `copyLocks`. Re-importing an already queued post with different locks returns a conflict rather than creating another paid assignment.

The corrected brand policy is versioned in `src/lib/ai/socialBrandPolicy.ts` and used by initial transcreation **and** feedback revisions. Artwork, caption and editorial rationale remain separate; rationale cannot enter the caption. No generated field implies a human approval. See `docs/SocialTranscreationPolicy.md` for policy provenance and scope.
