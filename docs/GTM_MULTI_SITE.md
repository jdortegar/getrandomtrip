# GTM: same container for main site and subdomains

Use one Google Tag Manager container for **getrandomtrip.com** and **investors.getrandomtrip.com**.

## 1. Environment variables

Both deployments use the **same** `NEXT_PUBLIC_GTM_ID`:

```env
NEXT_PUBLIC_GTM_ID="GTM-XXXXXXX"
```

No extra env vars needed. Segment by site in GTM using **Page Hostname** (built-in variable).

## 2. Investors app (if separate codebase)

- Add the same GTM setup: `AppTracking`, `gtm.ts`, `service-keys.ts` (or reuse from a shared package).
- In the investors app root layout, render `<AppTracking />` inside your session/auth provider.
- Set the same `NEXT_PUBLIC_GTM_ID` in that app’s env.

## 3. GTM: filter by hostname

- Enable the built-in variable **Page Hostname** (Variables → Configure → Page Hostname).
- In triggers or tags, use **Page Hostname** to filter (e.g. `equals` `investors.getrandomtrip.com` vs `getrandomtrip.com`).
- In GA4 you can create a custom dimension from the hostname if needed.

## 4. Domains

- The same GTM container can load on any domain where you install the snippet.
- If you use GA4 via GTM and want cookies to work across subdomains, set the cookie domain to `.getrandomtrip.com` in the GA4 configuration tag (Fields to Set).
