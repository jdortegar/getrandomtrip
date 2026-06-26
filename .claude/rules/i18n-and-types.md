---
description: >-
  Dictionaries in es.json and en.json, MarketingDictionary types, client locale
  pattern, domain types in src/types.
alwaysApply: true
---

# i18n and Types

## Mandatory Localization Rule

**Any code that introduces user-visible text MUST be localized in both `es` and `en` in the same change.** No exceptions.

This applies to:
- UI copy: labels, placeholders, hints, error messages, empty states, button text, confirmation prompts
- Inline string literals inside UI components (e.g. `"No results."`, `"Select..."`)
- Dynamic text generated at runtime (e.g. hint templates like `"X Nights / Y Days"`)

**Never** hardcode English-only or Spanish-only strings in components or pages. If a string cannot go into the dictionary (e.g. a UI primitive that must be locale-aware at runtime), use a locale-keyed map covering both `es` and `en`:

```ts
const LABELS: Record<string, string> = {
  en: "English string",
  es: "Spanish string",
};
const label = LABELS[locale.slice(0, 2)] ?? LABELS.es;
```

Checklist for every PR that touches UI text:
- [ ] String added to `src/dictionaries/es.json`
- [ ] Same key added to `src/dictionaries/en.json`
- [ ] Type added to `src/lib/types/dictionary.ts` if it's a new section
- [ ] `npm run typecheck` passes

## Dictionary Files

Main dictionaries:

- `src/dictionaries/es.json` (default)
- `src/dictionaries/en.json`

Types are defined in `src/lib/types/dictionary.ts` as `MarketingDictionary`.
Each top-level section gets its own exported interface (e.g. `TripperDashboardDict`), defined above `MarketingDictionary` and referenced as a field inside it.

**Never** create a standalone `copy.ts` file for new features. Add strings to the main dictionaries.

## Adding a New Section

1. Add the interface to `src/lib/types/dictionary.ts`:
   ```ts
   export interface MyFeatureDict {
     title: string;
     // ...
   }
   // then inside MarketingDictionary:
   myFeature: MyFeatureDict;
   ```
2. Add the actual strings to both `src/dictionaries/es.json` and `src/dictionaries/en.json`
3. Verify with `npm run typecheck`

## Using Dictionaries in Client Components

Client components can't use the async `getDictionary()`. Import both JSONs statically and select by locale:

```ts
import esCopy from "@/dictionaries/es.json";
import enCopy from "@/dictionaries/en.json";

function getCopy(locale: string) {
  return locale.startsWith("en") ? enCopy.myFeature : esCopy.myFeature;
}
```

Locale comes from `useParams()`:

```ts
const params = useParams();
const locale = (params?.locale as string) ?? "es";
```

## Using Dictionaries in Server Pages and Layouts

When a server page or layout receives `params.locale`, always normalize it with `hasLocale()` before calling `getDictionary()`:

```ts
const locale = hasLocale(params.locale) ? params.locale : "es";
const dict = await getDictionary(locale);
```

Use this pattern consistently in server routes under `src/app/[locale]/`. Do not call `getDictionary(params.locale)` directly without validating the locale first.

## Domain Types

All domain types live in `src/types/`:

- `src/types/core.ts` — base types, User, Journey, Addons
- `src/types/tripper.ts` — Tripper-specific types, dashboard stats, booking types

**Never** define types local to a component file or page. Add them to the appropriate types file.

## Type Quality Rules

- Avoid `string` for fields that have a known set of values — use a union or reference the Prisma enum
- Status fields that map to dictionary keys must use the same casing as the dict keys
- Add JSDoc comments to numeric fields that have a non-obvious unit (e.g. percentages, currencies)
- Optional fields use `?`, not `| undefined` explicitly
