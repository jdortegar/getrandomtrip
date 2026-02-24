# i18n Implementation Plan – Next.js App Router

Reusable plan to add internationalization to a Next.js App Router project. Adjust locales, default, and scope to your app.

---

## Phase 0: Decisions (before coding)

| # | Decision | Options | Example |
|---|----------|---------|---------|
| 1 | **Locales** | Which language codes | `en`, `es` |
| 2 | **Default locale** | Primary market | `es` |
| 3 | **URL strategy** | Sub-path for all vs default without prefix | Default without prefix: `/` = es, `/en/...` = en |
| 4 | **Approach** | Built-in dictionaries vs next-intl | Built-in (no extra deps) |
| 5 | **Scope (Phase 1)** | What to translate first | Marketing / public pages |
| 6 | **Locale detection** | First visit | `Accept-Language` header |
| 7 | **Persistence** | User choice | Cookie `NEXT_LOCALE` |
| 8 | **Switcher** | UI to change language | World icon + dropdown in nav |

---

## Phase 1: Foundation

### 1.1 Dependencies (if using Accept-Language)

```bash
npm install negotiator @formatjs/intl-localematcher
npm install -D @types/negotiator
```

### 1.2 Folder and file structure

```
lib/i18n/
  config.ts        # LOCALES, DEFAULT_LOCALE, COOKIE_LOCALE, LOCALE_LABELS
  pathForLocale.ts # pathForLocale(locale, path) – locale-aware URLs
  dictionaries.ts # getDictionary(locale), hasLocale()
  server.ts        # getLocaleFromCookies() for server components
  middleware.ts    # handleI18n(request) – redirect/rewrite logic

dictionaries/
  en.json
  es.json          # (one file per locale)

lib/types/
  dictionary.ts    # MarketingDictionary (or your app’s dict shape)

app/
  layout.tsx       # Root: <html><body>{children}</body>; keep fonts here
  [locale]/
    layout.tsx     # SetLocaleLang, SessionProvider, generateStaticParams
    (marketing)/page.tsx
    (app)/...
    admin/...
    ...
```

### 1.3 Middleware (single entry point)

- **Order:** 1) Optional auth (e.g. protect `/room`). 2) i18n: redirect/rewrite and set cookie.
- **Logic:**
  - Path has default locale prefix (e.g. `/es/...`) → redirect to path without prefix.
  - Path has other locale (e.g. `/en/...`) → `next()`.
  - Path has no locale → `getLocale(request)` (cookie then Accept-Language, else default).
  - If default → `NextResponse.rewrite(/es${pathname})` and set cookie.
  - If other → `NextResponse.redirect(/en${pathname})` and set cookie.
- **Matcher:** All routes except `_next`, `api`, static assets.

### 1.4 Root layout vs `[locale]` layout

- **Root `app/layout.tsx`:** Must contain `<html>` and `<body>` (Next.js requirement). Put fonts and global styles here. Use default `lang` (e.g. `lang="es"`).
- **`app/[locale]/layout.tsx`:** No `<html>`/`<body>`. Render `SetLocaleLang`, providers, and `{children}`. Call `hasLocale(locale)` and `notFound()` if invalid. Export `generateStaticParams` returning `[{ locale: 'es' }, { locale: 'en' }]`.
- **`SetLocaleLang`:** Client component that does `useEffect(() => { document.documentElement.lang = locale }, [locale])` so `lang` matches active locale after hydration.

### 1.5 Dictionary and types

- **`getDictionary(locale)`:** Async; loads `dictionaries/{locale}.json`. Use `server-only` if only used on server.
- **`hasLocale(s)`:** Type guard so `params.locale` can be narrowed to your union type.
- **Type:** Define one main dictionary interface (e.g. `MarketingDictionary`) and keep it in sync with the JSON keys. Use it in pages and components for `dict` props.

### 1.6 Locale-aware links

- **`pathForLocale(locale, path)`:** For default locale return `path` as-is (no prefix). For others return `/${locale}${path}` or `/en${path}`.
- Use in `<Link href={pathForLocale(locale, '/contact')} />` and in redirects (e.g. `redirect(pathForLocale(locale, '/otp'))`).

---

## Phase 2: Move routes under `[locale]`

- Move every route group/page that should be localized under `app/[locale]/`:
  - `(marketing)`, `(app)`, `admin`, `onboarding`, `otp`, etc.
- Leave `app/api/` at the root (no locale).
- Replace the old route files so only `[locale]` routes remain (avoid duplicate routes).

### Auth and redirects

- If you protect routes in middleware (e.g. `/room`), run auth **before** i18n and use the same pathnames (e.g. `/room`, `/en/room`) in the auth check.
- In server code (layout/page), get locale via `getLocaleFromCookies()` or from `params.locale` when available. Use `pathForLocale(locale, '/otp')` (or similar) in `redirect()` and in `<Link>`.
- In client components that redirect (e.g. onboarding, OTP), either:
  - Pass `locale` from the server and use `pathForLocale(locale, path)`, or
  - Derive locale from `usePathname()` (e.g. prefix `/en` → locale en) and build the target path accordingly.

---

## Phase 3: Locale switcher and cookie

- **Cookie:** Set in middleware on redirect/rewrite and in the switcher on click. Name e.g. `NEXT_LOCALE`; `path=/`; long `max-age`.
- **Switcher component:** Client component; reads current `locale` (prop) and `pathname`; on option click set cookie and `router.push(pathForLocale(newLocale, currentPathWithoutLocale))`.
- Place the switcher in the main nav or header (e.g. world icon + dropdown with `LOCALE_LABELS`).

---

## Phase 4: Translate content by area

1. **Extend dictionary type and JSON**  
   Add a key per section (e.g. `marketing.nav`, `marketing.footer`, `marketing.howItWorks`, …). Keep structure identical between `en.json` and `es.json`.

2. **Page loads dict and passes slices**  
   In the page (RSC), `const dict = (await getDictionary(locale)).marketing` (or your top-level key), then pass `dict.nav`, `dict.footer`, etc. to components.

3. **Components accept `dict` (and optionally `locale`)**  
   Replace hardcoded strings with `dict.title`, `dict.ctaButton`, etc. Use `pathForLocale(locale, path)` for any link that must stay on the same locale.

4. **Client components**  
   Receive `dict` and/or `locale` as props from the server; no need for a global i18n provider unless you introduce one later.

---

## Checklist (copy and tick)

- [ ] Locales and default chosen; cookie name and labels defined in `lib/i18n/config.ts`.
- [ ] `pathForLocale`, `getDictionary`, `hasLocale`, `getLocaleFromCookies` implemented.
- [ ] Middleware: handle default-prefix redirect, rewrite for default locale, redirect for others; set cookie; optional auth before i18n.
- [ ] Root layout: html/body/fonts only; `[locale]` layout: providers + `SetLocaleLang` + `generateStaticParams`.
- [ ] All localized routes live under `app/[locale]/`; API routes stay at `app/api/`.
- [ ] Redirects and links use `pathForLocale` (and locale from cookie or params).
- [ ] Locale switcher sets cookie and navigates to same path in new locale.
- [ ] Dictionary type and JSON files in sync; each section’s copy wired to components.

---

## Optional later steps

- **Phase 2 scope:** Add dictionary keys and props for app (room), admin, onboarding/OTP.
- **Rich formatting:** If you need dates/numbers/plurals, consider migrating to **next-intl** and keep the same URL and cookie strategy.
- **SEO:** Use locale in metadata and `alternate` links if you need them.
