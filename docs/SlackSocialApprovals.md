# Translate @getrandomtrip.es posts to @getrandomtrip.en through Slack

The flow runs in **#social-media-translations** (`C0CAQS7HNH4`):

1. **Detect.** The weekday Instagram recap job (09:05 Argentina, `netlify/functions/instagram-recap.ts`) also posts each new @getrandomtrip.es post from the last 4 days to Slack, once, with a **Translate this post** button. Four days covers Friday to Sunday on Monday's run.
2. **Translate.** The button queues one paid job. It transcreates the caption and on-image copy in one vision call, following the Randomtrip transcreation rules (`.claude/skills/randomtrip-en-social-transcreator`, condensed in `src/lib/ai/socialTranscreation.ts`). It then edits each slide that has Spanish text with the exact English copy and posts **one review** with every slide. Slides without text are kept. Reviewer notes, if any, appear in the review's thread.
3. **Review.** **Approve** or **Request changes**. Changes target the caption, the artwork or both, and optionally specific slides (`1, 3`). Each request produces a new revision that needs a fresh approval.
4. **Publish.** An approved review shows **Publish to @getrandomtrip.en**, with a confirmation dialog. The app publishes the caption and every slide through the Instagram content publishing API (single image or carousel) and links the live post on the card.

Each stage has its own flag, all off by default: `SLACK_SOCIAL_APPROVALS_ENABLED` (cards and buttons), `SLACK_SOCIAL_AI_ENABLED` (translations and revisions), and `SLACK_SOCIAL_PUBLISH_ENABLED` (publishing). Video posts are announced without a button; they can't be translated automatically.

## Where it runs

The recap job is a scheduled function, which Netlify runs on the **production** deploy only, and the Slack buttons, reviews and jobs must share one database. Run the full flow in production: point the Slack app's Interactivity Request URL at `https://<production-origin>/api/slack/social-approvals`, and set `SLACK_SOCIAL_IMAGE_ORIGIN` and `SLACK_SOCIAL_APP_ORIGIN` to the production origin. Instagram downloads published images from that origin, so it must be public.

To test on a branch deploy, point the Request URL and both origins at that deploy and use **Check now** below instead of the recap schedule.

## Setup

1. Apply migrations `20261021120000_social_approvals` and `20261022120000_social_translation_flow` (production applies them on deploy through `migrate-if-outdated`).
2. Slack app `A0CAR605CF8` (Randomtrip Social Approvals): Socket Mode **off**, Interactivity **on** with the Request URL above, bot invited to #social-media-translations. `chat:write` is enough. Set `SLACK_SOCIAL_BOT_TOKEN` and `SLACK_SOCIAL_SIGNING_SECRET`.
3. AI: `OPENAI_API_KEY`, `OPENAI_SOCIAL_IMAGE_MODEL` (a GPT Image model that supports edits), optional `OPENAI_SOCIAL_TEXT_MODEL` (default `gpt-4.1`), `SLACK_SOCIAL_WORKER_SECRET`, then `SLACK_SOCIAL_AI_ENABLED=true`.
4. Source account: `SOCIAL_SOURCE_PAGE_TOKEN`, a Page token for the Facebook Page linked to @getrandomtrip.es with `instagram_basic`. It defaults to `INSTAGRAM_PAGE_ACCESS_TOKEN`. The app refuses a token whose Instagram username isn't `getrandomtrip.es`.
5. Publishing: in the Meta app, add `instagram_content_publish` (plus `instagram_basic`, `pages_show_list`, `pages_read_engagement`). Generate a non-expiring Page token for the Facebook Page linked to @getrandomtrip.en and set it as `SOCIAL_TARGET_PAGE_TOKEN`. Then set `SLACK_SOCIAL_PUBLISH_ENABLED=true`. The app refuses a token whose username isn't `getrandomtrip.en`.

## Catching up on older posts

The recap check never announces posts older than 4 days, so the first run doesn't flood the channel. To bring one older post into the flow, a signed-in admin sends a same-origin request:

```
POST /api/admin/social-approvals/sources
{ "shortcode": "DXiYOKaFxwb" }
```

The shortcode is the part after `/p/` in the post's link. Without a body, the request runs the normal 4-day check immediately ("Check now"). Each post is announced at most once.

Reviews can still be created directly, without a Spanish source, with `POST /api/admin/social-approvals` and `{ reviewKey, requestId, caption, imageUrls: [...] }` (1–10 public HTTPS images on `SLACK_SOCIAL_IMAGE_ORIGIN`; `imageUrl` still works for a single image).

## Durability, retries and spending limits

- Paid AI jobs (translations and revisions) share a limit of **10 per UTC day**, and each review key allows five revisions. These are request limits, not a dollar budget; set an OpenAI project spending limit separately. Translation slide edits use `quality=high`; feedback revisions use `low`.
- One TRANSLATE job per Spanish post, one REVISE or PUBLISH job per review. Repeated clicks replay the existing job.
- A Netlify background function runs the jobs. A five-minute scheduled dispatcher recovers missed dispatches. Database leases prevent duplicate claims, and checkpoints (transcreation, finished slides, published media id) keep a resumed job from paying or publishing twice.
- Uncertain paid calls or Slack deliveries move the job to `MANUAL_RECOVERY`; nothing is retried blindly. `GET /api/admin/social-approvals/jobs` lists jobs; a same-origin admin can retry one with `{ "jobId": "...", "confirmPossibleAdditionalCharge": true }`.
- **Publishing is never retried after `media_publish`.** Failures before it (`PUBLISH_FAILED`) leave nothing public and can be retried. A failed or unconfirmed `media_publish` call (`PUBLISH_UNCONFIRMED`), or a job with a recorded media id, can't be retried: check @getrandomtrip.en first.

## Security

Slack signatures cover the original bytes and expire after five minutes. App, workspace, channel and message timestamp must match, and feedback modals are HMAC-bound to the actor, revision and expiry. Any workspace member who can see the channel can translate, approve or publish; don't share the channel externally. Prompts treat captions, images and feedback as content, never instructions. Source images are downloaded only from Instagram's CDN. Graph API tokens are never logged; publishing calls send them in the request body.

- [ ] Verify bad signatures, foreign identities and stale cards are rejected.
- [ ] Translate one post end to end on a test deploy and check every slide's text, photo and crop.
- [ ] Publish one approved test review and confirm it appears only on @getrandomtrip.en.

References: [Instagram content publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/), [Slack interaction responses](https://docs.slack.dev/interactivity/handling-user-interaction/), [OpenAI image edits](https://developers.openai.com/api/reference/resources/images/methods/edit), [Netlify scheduled functions](https://docs.netlify.com/build/functions/scheduled-functions/).
