---
description: >-
  Dictionaries in es.json and en.json, MarketingDictionary types, client locale
  pattern, domain types in src/types.
alwaysApply: true
---

# i18n and Types

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
