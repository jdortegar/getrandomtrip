# Review and revise English Instagram drafts in Slack

The backend posts artwork and its caption with **Approve** / **Request changes** buttons. Optional AI revisions collect feedback in a Slack modal, edit the selected content in a durable background job, and post a new draft for approval. **Nothing connects to Meta or publishes to Instagram.** Both features are disabled by default; this change does not configure or deploy them.

## Set up a test

1. Apply migration `20261021120000_social_approvals` using the reviewed database deployment procedure, then regenerate Prisma. It creates review/job tables; do not run schema push against production.
2. Configure deployment secrets `SLACK_SOCIAL_BOT_TOKEN` and `SLACK_SOCIAL_SIGNING_SECRET`. Set `SLACK_SOCIAL_IMAGE_ORIGIN` to the public app HTTPS origin, without a trailing slash. Never commit real secrets.
3. Invite **Randomtrip Social Approvals** to **#social-media-translations**. In app `A0CAR605CF8`, enable Interactivity with Request URL `https://<deployment>/api/slack/social-approvals`. Existing `chat:write` is enough; `views.open` needs no additional scope. No Events API subscription is needed for buttons/modals.
4. Deploy, then set `SLACK_SOCIAL_APPROVALS_ENABLED=true`. Submit an initial review from a signed-in GetRandomtrip admin session, with its same-origin `Origin` header, to `POST /api/admin/social-approvals`:

```json
{
  "reviewKey": "instagram-DXiKjIyj3Ik",
  "requestId": "a-new-unique-request-id",
  "caption": "The complete English caption",
  "imageUrl": "https://<app-origin>/api/upload?key=<immutable-upload-key>"
}
```

Upload initial artwork through the existing authenticated `/api/upload` flow or provide another immutable public image URL on the configured origin. This slice does not automatically import Instagram posts or translate the initial source post. Changed content needs a new request ID with the same review key; previous approvals never carry over. Never overwrite artwork at an existing URL.

## Enable automatic feedback revisions

Use the existing `OPENAI_API_KEY` and optional `OPENAI_TRANSLATION_MODEL`; caption edits retain the existing `gpt-4.1-nano` default. Configure `OPENAI_SOCIAL_IMAGE_MODEL` explicitly with a GPT Image model supported by the Images edits API, `quality=low`, and `size=auto`. There is deliberately no paid-image model fallback.

Set `SLACK_SOCIAL_APP_ORIGIN` equal to `SLACK_SOCIAL_IMAGE_ORIGIN`, configure a separate random `SLACK_SOCIAL_WORKER_SECRET`, then enable `SLACK_SOCIAL_AI_ENABLED=true` in one deployment only. The environment needs Netlify Blobs access and background-function support. Generated PNGs use new immutable job-specific keys in the existing deployment-aware media store and existing public upload GET route. Inputs are bounded public HTTPS images from the configured origin; redirects are rejected.

**Request changes** opens a 15-minute, actor-bound feedback form. The reviewer explicitly selects caption, artwork, or both. Caption-only changes never call the image model; artwork-only changes retain the caption. Canceling the modal leaves the draft pending. Accepted feedback and its source revision are persisted atomically; the original buttons disappear and show “AI revision queued.” The generated revision gets fresh approval buttons.

Prompts treat feedback as editorial content, not authorization for tools/publication or access to secrets. Artwork edits use the existing image as input and request preservation of photo, crop, subjects, typography and unchanged design. **AI edits are not pixel-preserving or guaranteed:** visually check text accuracy, photo fidelity, crop, and brand consistency before approving. Original assets are retained unchanged.

## Durability, retries and spending limits

- One accepted feedback job per revision; first decision wins. PostgreSQL transaction locks serialize revisions/decisions and conditional job writes fence lease ownership.
- Maximum 10 accepted AI jobs per UTC day and five total revisions per review key. Each job permits at most two worker claims, including an explicitly authorized retry. Each claim can make at most one bounded caption request (2,048 output tokens) and one low-quality image edit. These are request-count limits, **not a dollar budget**; set a provider project spending limit separately.
- The Netlify `social-revisions-background` function handles long AI work, not a Next.js `after()` callback. Feedback dispatches it immediately after acknowledgment. A five-minute scheduled dispatcher recovers missed dispatches and queued work; it does not poll Instagram. Database leases prevent duplicate claims. Successful caption/artwork checkpoints are reused.
- Paid-call timeouts, uncertain delivery, or expired work move to `MANUAL_RECOVERY`, never blindly retry generation. A 10-minute expired lease does not requeue paid work. Worker errors show an admin-attention message in Slack when possible; the database/admin job endpoint remains authoritative if Slack refresh fails.
- `GET /api/admin/social-approvals/jobs` lists recent statuses. After inspecting failures, an authenticated same-origin admin may POST `{ "jobId": "...", "confirmPossibleAdditionalCharge": true }` to that endpoint for **one** retry, reusing successful checkpoints. This can incur another charge when an earlier response was lost. Jobs with a created replacement review cannot retry automatically: inspect ambiguous Slack delivery, then create a manual replacement review if needed.
- An identical initial `requestId` returns persisted state without posting again; different content with that ID returns 409. An ambiguous initial Slack post stays `POSTING` and fails closed. Inspect Slack/database before creating a replacement; HTTP failure is not proof nothing was sent.

## Security and deployment checks

Slack signatures cover the original bytes and expire after five minutes. App, workspace, channel and stored message timestamp must match. Modal context is HMAC-authenticated and bound to actor/revision/expiry. The configured identities are Randomtrip (`T0ATKF9157F`, `C0CAQS7HNH4`, `A0CAR605CF8`). Current channel membership is **not independently queried** with `chat:write`: same-workspace actors who can interact with that message may decide. Do not externally share the channel.

- [ ] Confirm bad signatures, foreign identities, changed message timestamps and expired/tampered modals are rejected.
- [ ] Test approve, duplicate/competing decisions, modal cancellation and stale-revision rejection.
- [ ] Test caption-only and artwork-only changes with mocked AI first; manually review the first paid test.
- [ ] Verify deployment bundling, Netlify background/Blobs access, scheduled recovery, and Slack’s three-second acknowledgment window.
- [ ] Verify queued/failed/completed Slack statuses, immutable image rendering, job caps, and manual recovery.
- [ ] Confirm Instagram remains unchanged. Disable the AI flag to stop future claims; already-running provider requests may still finish.

No admin UI, automatic source detection, initial content generation pipeline, Meta integration or publication path is included. A future source connector can submit initial reviews separately.

References: [Slack verification](https://docs.slack.dev/authentication/verifying-requests-from-slack/), [Slack interaction responses](https://docs.slack.dev/interactivity/handling-user-interaction/), [Slack views.open](https://docs.slack.dev/reference/methods/views.open/), [OpenAI image edits](https://developers.openai.com/api/reference/resources/images/methods/edit), [Netlify Background Functions](https://docs.netlify.com/build/functions/background-functions/).
