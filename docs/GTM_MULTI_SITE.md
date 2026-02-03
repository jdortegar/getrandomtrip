# GTM: same container for main site and subdomains

Use one Google Tag Manager container for **getrandomtrip.com** and **investors.getrandomtrip.com**.

---

## Replicate this configuration in another repo (e.g. investors app)

1. **Create these files** (copy from this repo or create with the same content):

   | In this repo (getrandomtrip)                 | Create in other repo (same paths)         |
   | -------------------------------------------- | ----------------------------------------- |
   | `src/lib/constants/tracking/service-keys.ts` | Same path, same content (GTM_ID from env) |
   | `src/lib/helpers/tracking/gtm.ts`            | Same path, same content                   |
   | `src/components/tracking/AppTracking.tsx`    | Same path, same content                   |

2. **Root layout** (e.g. `app/layout.tsx`): import and render `<AppTracking />` inside your `SessionProvider` (or equivalent), e.g.:

   ```tsx
   import AppTracking from '@/components/tracking/AppTracking';
   // ...
   <SessionProvider>
     <AppTracking />
     {/* rest of layout */}
   </SessionProvider>;
   ```

3. **Env**: add `NEXT_PUBLIC_GTM_ID="GTM-XXXXXXX"` (same value as main site). No other GTM env vars needed; filter by **Page Hostname** in GTM.

4. **Alias**: ensure the other repo has `@/` pointing to `src/` (or adjust imports to match its structure).

---

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

---

## 5. Sending interactions to GA4 (why you don’t see events in GA)

The app pushes events to **dataLayer**; GTM only forwards them to GA4 if you configure tags and triggers.

### Events pushed by the app

| dataLayer event | When it fires                              | Example payload                                          |
| --------------- | ------------------------------------------ | -------------------------------------------------------- |
| `page_view`     | On route change (SPA)                      | `{ event: 'page_view', page_path: '/blog' }`             |
| `click_button`  | When a button with `trackClick` is clicked | `{ event: 'click_button', label: 'hero_cta' }`           |
| `scroll_depth`  | When user scrolls 25%, 50%, 75%, 90%, 100% | `{ event: 'scroll_depth', page_path: '/', percent: 50 }` |

### GTM setup so GA4 receives them

1. **GA4 Configuration tag**  
   Tag type: Google Analytics: GA4 Configuration. Measurement ID: your GA4 Measurement ID (e.g. `G-XXXXXXXXXX`). Fire on: All Pages.

2. **Triggers for custom events**  
   Create **Custom Event** triggers: Event name `page_view`, `click_button`, and `scroll_depth`.

3. **GA4 Event tags**  
   Create GA4 Event tags that fire on those triggers. For `click_button` and `scroll_depth`, add **Event Parameters** (e.g. `label`, `page_path`, `percent`) using Data Layer Variables so they appear in GA4.

4. **Data Layer Variables**  
   In GTM: Variables → Data Layer Variable for `label`, `page_path`, `percent` so you can pass them as event parameters to GA4.

5. **Publish** the GTM container.

### Buttons: use `trackClick` so clicks are sent

Clicks are only pushed when the `Button` component has the `trackClick` prop:

```tsx
<Button trackClick="hero_cta" onClick={handleCta}>
  Comprar
</Button>
```

Add `trackClick="some_label"` on the main CTAs you want to see in GA4.
