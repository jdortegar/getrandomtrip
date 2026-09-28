# Launch with private-by-default analytics and canonical public pages

Deploy the application and Google configuration as one coordinated change. Source changes and unpublished GTM drafts do not repair the currently published container. Publishing GTM and deploying production remain separate, explicitly approved release actions. Keep collection disabled until the configuration below has been verified.

## Safe release order

1. Verify the release candidate in a non-production environment first. Deploy production source with `NEXT_PUBLIC_GTM_ID` or `NEXT_PUBLIC_GA_MEASUREMENT_ID` empty; either missing ID disables collection. **Leave the production marketing waitlist gate unchanged for this release.** While it is enabled, gated pages remain `noindex,nofollow` and the sitemap stays empty. A future public launch requires separate approval and anonymous content/schema verification. Keep all private-route authentication and authorization enabled.
2. Publish the reviewed GTM configuration below and disable **all GA4 enhanced measurement**, including history pageviews, scroll, outbound clicks, form interactions, downloads and video. Set the base Google tag `send_page_view=false`.
3. Set the production build variables and redeploy: `NEXT_PUBLIC_SITE_URL=https://getrandomtrip.com`, `NEXT_PUBLIC_ANALYTICS_HOSTNAME=getrandomtrip.com`, and the verified GTM/GA measurement IDs. Preview hosts and investor subdomains remain excluded even with saved consent.
4. Verify the consent, navigation and conversion matrix below. Do not submit synthetic purchases or registrations to production merely to test collection.

## GTM contract

**Staged, not published (2026-09-28):** workspace 4 has 18 changes. Trigger 21 contains the 12-event allowlist below; GA4 event tag 8 uses `{{Event}}` and the existing 11 parameters plus `items={{DLV - items}}` and `payment_type={{DLV - payment_type}}`. Variable 23 (`items`) uses Version 1; variable 24 (`payment_type`) uses Version 2. Production-host, `rt_analytics_allowed=true`, and required `analytics_storage` guards are preserved. Live version 3 has not been replaced. GA4 stream 13401877701 still has enhanced measurement **ON** (including page views, scrolls, and outbound clicks); it was inspected but not changed. Disabling it, the safe release order, and network verification remain required.

The application owns manual `page_view`. Never derive an event name from hostname, URL, title or a click. Remove the old All Clicks/All Pages GA event triggers.

| Tag             | Trigger and settings                                                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Base Google tag | Initialization only; exact production hostname, `rt_analytics_allowed` equals boolean `true`, analytics consent required. `send_page_view=false`.                                                                                                |
| GA4 event tag   | Custom-event regex `^(page_view\|scroll_depth\|sign_up\|login\|generate_lead\|newsletter_subscribe\|waitlist_join\|view_item\|select_item\|begin_checkout\|add_payment_info\|purchase)$`; same host/flag/consent guards; event name `{{Event}}`. |

Both tags must explicitly set `page_location`, `page_path`, `page_referrer`, `page_title` and `language` from the same-named dataLayer variables. Never use browser URL/title/referrer built-ins. `page_referrer` is always empty. Titles are fixed route names. Public article/profile paths use route templates instead of authored slugs or IDs. Queries and hashes never enter the payload.

| Event                                                | Additional allowlisted parameters                                                                                           |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `page_view`, `newsletter_subscribe`, `waitlist_join` | None                                                                                                                        |
| `scroll_depth`                                       | `percent`: 25, 50, 75, 90 or 100                                                                                            |
| `sign_up`, `login`                                   | `method`: email or google                                                                                                   |
| `generate_lead`                                      | `trip_type`: couple, solo, family, group, honeymoon, paws or xsed                                                           |
| `view_item`, `select_item`                           | `items`: one coarse public booking item; no guessed monetary value                                                          |
| `begin_checkout`                                     | `value`, `currency`, `items`: first ready server quote in the mounted checkout                                              |
| `add_payment_info`                                   | Same monetary fields plus `payment_type=stripe`; submitted complete Stripe element after successful contact validation/save |
| `purchase`                                           | Same monetary fields plus Stripe `transaction_id`; approved server payment and confirmed booking                            |

Map each additional parameter to its same-named dataLayer variable: `method`, `percent`, `trip_type`, `transaction_id`, `value`, `currency`, **`items`**, **`payment_type`**. Use **Data Layer Variable Version 1 for `items`** (whole-array replacement, no recursive merge); scalar variables may use Version 2. The event payload is flat, not nested under `ecommerce`.

The app resets every additional field to `null` before supplying that event's allowed values, and also clears them on route/consent transitions. Do not map user IDs, click labels, origins, arbitrary objects, client secrets, trip IDs, or authored titles.

### Product and funnel semantics

- `view_item`: currently displayed Journey traveler-type product or the XSED booking builder, once per product per mounted builder. `select_item`: explicit Journey traveler-type selection or XSED travel-party option selection. Prices are omitted until an authoritative checkout quote exists.
- `generate_lead`: successfully saved Journey/XSED trip request before entering checkout. This is not a substitute for `begin_checkout`.
- `begin_checkout`: valid payable trip **and a ready server quote**, once per booking per mounted checkout; no event on failed quote loading. Promo/party quote refreshes do not duplicate it. Direct checkout visits are included.
- `add_payment_info`: Stripe reports a complete element and contact preflight succeeds immediately before provider confirmation. A declined charge still represents submitted payment information, **not** a purchase; retries within the same mounted booking do not duplicate this event. No card details or method-specific user data are read.
- `items`: exactly one whole-booking item (`quantity=1`), not one item per passenger. IDs are `trip-couple`, `trip-solo`, `trip-family`, `trip-group`, `trip-honeymoon`, `trip-paws`, or `trip-xsed`; names and categories are regenerated from this fixed public catalog. Never pass a user-generated trip label. Monetary item `price` equals event `value` (whole booking after discounts).
- `value`: finite nonnegative major units, at most 1,000,000,000; supported currency is `USD` (active Stripe quotes) or `ARS` (legacy records). Purchase uses the server payment amount/currency, not preview pricing. No coupon, destination, traveler count, or personal preferences are sent.
- `add_to_cart` is intentionally unsupported: this booking flow has no cart action. Generic/free-text clicks remain disabled. `newsletter_subscribe` remains allowlisted but inactive because the legacy newsletter component is not mounted; this change introduces no new form. `waitlist_join` remains the active subscription signal on successful waitlist submission.

Do not enable Google Signals, advertising personalization or cross-domain linking as part of this release.

### Consent and initialization order

No GTM script or noscript iframe loads before analytics opt-in. The bilingual preferences control offers accept/reject and remains available to withdraw.

1. Queue consent **default denied** for analytics and all advertising storage/user-data/personalization.
2. Set sanitized page fields and `rt_analytics_allowed=true` only on consented eligible production routes.
3. Queue analytics consent granted; advertising stays denied.
4. Queue `gtm.js` initialization and load the container once.
5. Queue one explicit sanitized pageview. Session changes and query changes do not create pageviews.

Tracking follows the actual rendered gate branch, not merely the global switch. A visible marketing waitlist uses a fixed waitlist context in the requested language; gate-unlocked visitors keep their actual public/purchase context. Private/auth/invitation/review/token routes are excluded. The only private-route exceptions are exact `/checkout` (only `begin_checkout`/`add_payment_info`) and `/checkout/success` (only `purchase`), including their locale equivalents. Neither emits pageview, scroll, auth, or product-view events; checkout descendants/pending/failure remain excluded. Purchase requires the authenticated server summary `payment.status=APPROVED` plus trip status `CONFIRMED`, `REVEALED`, or `COMPLETED`. Confirmation may fail while the webhook has already settled the booking; the authoritative summary still establishes success. DB amounts are already major currency units. Browser transaction dedup suppresses repeated success-page visits; it is not a server exactly-once guarantee and can be lost when browser storage is cleared. A blocked/network-dropped event may remain locally marked sent. If the visitor grants analytics consent while a verified success page is still mounted, that current purchase can emit once. A rejected emit is not marked sent; pending/failed payments never emit. No historical purchases are fetched for replay. Checkout-start/product-view can likewise observe current state after opt-in, but earlier payment-info submissions, selections, leads, and authentication are not replayed.

On withdrawal or private navigation, the app synchronously updates the consent boundary during the navigation layout effect: `rt_analytics_allowed=false`, `ga-disable-<measurement-id>=true`, denied consent and safe generic page fields. Withdrawal also expires accessible owned GA cookies, leaving essential cookies untouched. Direct private/token loads never load GTM.

**Residual verification:** already-loaded Google code cannot be unloaded retroactively. Confirm that automatic engagement/consent behavior does not leak real URL/query/referrer/title after SPA navigation or withdrawal. Consent updates may be handled by Google's already-loaded runtime; this is not a guarantee of no network requests of any kind. `user_engagement` may occur on the sanitized commerce exceptions. Use browser network inspection, not dataLayer inspection alone. If any unsafe collection remains, disable collection by removing an analytics ID and redeploy before investigating.

## Search visibility

- Spanish canonical URLs are unprefixed; English uses `/en`. The URL, not a remembered language cookie, determines locale. Middleware forwards the actual locale for server-rendered `<html lang>`.
- Public metadata and JSON-LD share canonical URL construction. Legacy blog IDs redirect permanently to the canonical slug. Blog alternates only include usable translations; Spanish-only articles never advertise English copies.
- Sitemap entries include every available locale with reciprocal/self language references and real modification timestamps where available. Drafts, inactive posts, review copies and unavailable translations remain excluded.
- Private/utility pages are `noindex,nofollow`; this does not replace authentication. The secure wrapper and all existing authorization remain unchanged.
- Re-enabling the marketing gate applies `noindex,nofollow` to public routes and returns an empty sitemap; hidden article markup remains behind the existing gate. Public-mode server rendering already worked before this change and now has an explicit regression test.
- JSON-LD escapes `<`, so stored text cannot terminate the script element. Article markup includes the available modification date.

## Verification and rollback

Check anonymously at mobile 360px and desktop 1280px:

- Before choice/reject: no Google script or collection; consent controls readable and keyboard accessible.
- Accept: exactly one public pageview; public SPA navigation adds one; session/query changes add none. No duplicate history pageviews.
- Public → token/private → public: no private pageview, scroll or URL values; flag and GA-disable follow route eligibility.
- Withdraw: no subsequent application events, cookies expire, preference survives reload. Reaccept only measures the current eligible page.
- Preview/subdomain: no production collection even after consent.
- Successful/failed Google auth: only a fresh server-confirmed success receipt issued after the current consent grant can emit login/signup. Rejected receipt timestamps persist so reload + later opt-in cannot replay pre-consent authentication. Email account creation emits signup even when email verification blocks auto-login.
- Checkout: no pageview/scroll; one begin event after a successful quote, one payment-info event after validated submission, no duplicates on rerender/decline/quote refresh. Failed preflight emits no payment info.
- Confirmed purchase: one event with matching major-unit value and coarse item price; pending/error/non-approved/unconfirmed-booking cases emit none. Same-mount opt-in permits the current verified purchase; consent withdrawal blocks further events.
- Inspect actual GA requests after every transition: `items` and `payment_type` must not leak into later pageviews/auth events. GTM DebugView alone is not delivery proof.
- English/Spanish page source: matching HTML language, canonical, hreflang and visible content/schema. Confirm no `/es/` sitemap entries and no invented English article copies.

Rollback collection immediately by clearing either public analytics ID and redeploying. Do not restore the malformed automatic GTM event tag. Roll back SEO/consent changes separately if needed; never remove authentication to restore traffic. Keep the gate setting under explicit release-owner control. Recheck Search Console and GA DebugView after deployment; source tests are not proof that a live container or indexed page has changed.

Event semantics follow the [GA4 recommended ecommerce events reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events). Source tests verify the application contract, not live GTM publication or Google delivery.
