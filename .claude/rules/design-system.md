---
description: >-
  Dashboard design tokens, component patterns, and layout rules for all
  dashboard sections. Tripper OS, client dashboard, and admin pages.
alwaysApply: true
---

# Design System

## Color Tokens

Six canonical tokens — use nothing outside these and the Tailwind neutral scale:

| Token   | Hex       | Tailwind               | Usage                                      |
| ------- | --------- | ---------------------- | ------------------------------------------ |
| Ink     | `#111827` | `gray-900`             | Headings, primary buttons, body text       |
| Cyan    | `#4F96B6` | `text-light-blue`      | Eyebrows, icon pucks, links, publish state |
| Sun     | `#FCD34D` | `yellow-400`           | KPI accent bar only — never full-bleed     |
| Surface | `#FFFFFF` | `white`                | Card and panel backgrounds                 |
| Ground  | `#F9FAFB` | `gray-50`              | Page background, table header rows         |
| Border  | `#E5E7EB` | `gray-200`             | Card borders, dividers                     |

No dark mode. `<body>` is locked to `bg-neutral-50 text-neutral-900`. Never add `dark:` variants.

---

## Typography

| Role            | Classes                                                                       |
| --------------- | ----------------------------------------------------------------------------- |
| Section heading | `font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900` |
| KPI value       | `font-barlow-condensed text-5xl font-extrabold leading-[.9] text-gray-900`   |
| Price cell      | `font-barlow-condensed text-lg font-bold leading-none text-gray-900`          |
| Eyebrow         | `text-xs font-semibold uppercase tracking-[0.18em] text-light-blue`          |
| Table header    | `text-[11px] font-semibold uppercase tracking-wider text-neutral-500`         |
| Panel heading   | `text-xl font-semibold text-neutral-900`                                      |
| Body / cell     | `text-sm text-neutral-700`                                                    |
| Caption / sub   | `text-xs text-neutral-500`                                                    |
| Label           | `text-sm font-medium text-neutral-500`                                        |

Use `font-barlow-condensed` for numeric KPI values, section headings, and price cells only. Everything else uses the default body font.

---

## Section Header Pattern

Every dashboard section opens with this exact pattern. No plain `<h2>` without the eyebrow above it.

```tsx
{/* Header-only */}
<div>
  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
    {copy.eyebrow}
  </p>
  <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
    {copy.heading}
  </h2>
</div>

{/* Header + primary CTA (same row) */}
<div className="flex items-end justify-between gap-4">
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
      {copy.eyebrow}
    </p>
    <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
      {copy.heading}
    </h2>
  </div>
  <Link href={copy.ctaHref}>
    <Button className="h-11 rounded-sm border-2 border-gray-900 bg-gray-900 px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white">
      {copy.ctaLabel}
    </Button>
  </Link>
</div>
```

Rules:
- Eyebrow describes context ("This month", "Your catalog"), not the section title.
- CTA button is ink-fill, near-square corners (`rounded-sm`), ALLCAPS — same flex row as heading, right-aligned.
- Never put the CTA below the heading.

---

## Card Styles

**KPI stat card** (large value + icon puck):

```tsx
<div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
  {/* Top: label left, icon puck right */}
  <div className="flex items-center justify-between">
    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
      {copy.label}
    </span>
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-light-blue/10 text-light-blue">
      <Icon className="h-4 w-4" />
    </span>
  </div>
  {/* Bottom: yellow accent bar + Barlow Condensed value */}
  <div className="flex items-stretch gap-3">
    <div className="w-1 shrink-0 self-stretch rounded-full bg-yellow-400" />
    <span className="font-barlow-condensed text-5xl font-extrabold leading-[.9] text-gray-900">
      {value}
    </span>
  </div>
</div>
```

Icon puck colors: cyan (`bg-light-blue/10 text-light-blue`) for most stats; gold (`bg-yellow-400/15 text-yellow-600`) for rating only.

**Supporting strip** (secondary metrics row below KPI cards):

```tsx
<div className="flex rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
  {metrics.map((m, i) => (
    <div key={i} className="flex flex-1 items-center justify-between px-6 py-4 border-l border-gray-200 first:border-l-0">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">{m.label}</span>
      <span className="font-barlow-condensed text-3xl font-extrabold text-gray-900">{m.value}</span>
    </div>
  ))}
</div>
```

**Panel card** (table / list section):

```tsx
<div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
```

Do NOT use `GlassCard` for dashboard pages — it belongs to marketing/public pages only.

---

## Table Anatomy

```tsx
<div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            {copy.column}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        <tr className="hover:bg-gray-50 transition-colors">
          <td className="px-5 py-4 text-sm text-neutral-700">…</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

Column rules:
- **All columns left-aligned** — no center, no right-align on data columns.
- **Title cell**: `font-semibold text-sm text-neutral-900` + subtitle below in `text-xs text-neutral-500 mt-0.5`.
- **Price cell**: `font-barlow-condensed text-lg font-bold leading-none text-gray-900`.
- **Date cell**: `text-sm text-neutral-500`, format as "Jun 18, 2026".
- Always `overflow-hidden` on the wrapper and `overflow-x-auto` on the inner container.

---

## Filter Row

```tsx
<div className="flex items-center justify-between gap-3 flex-wrap">
  <div className="flex items-center gap-2 flex-wrap">
    <Select className="h-11 rounded-lg border border-gray-200 shadow-sm text-sm" />
    <Select className="h-11 rounded-lg border border-gray-200 shadow-sm text-sm" />
    {hasActiveFilters && (
      <Button variant="ghost" className="h-11 rounded-sm border border-gray-200 px-4 text-[13px] font-medium text-neutral-600">
        ✕ {copy.clearFilters}
      </Button>
    )}
  </div>
  <span className="text-[13px] text-neutral-400">
    {filtered} {copy.of} {total} {copy.count}
  </span>
</div>
```

Count format: `{filtered} of {total} {localized-noun}` — both keys must exist in both locales.

---

## Experience Status Badges

Use `<ExperienceStatusBadge>` from `@/components/common/ExperienceStatusBadge`. Never write inline badge styles for experience statuses.

```tsx
<ExperienceStatusBadge
  status={item.status}
  label={copy.status[item.status as keyof typeof copy.status] ?? item.status}
/>
```

Shape: `rounded-[6px]` with a colored dot — never `rounded-full`. Dict keys must match Prisma enum exactly (SCREAMING_SNAKE_CASE).

| Status                  | Background  | Text        | Border      | Dot         |
| ----------------------- | ----------- | ----------- | ----------- | ----------- |
| `ACTIVE`                | green-50    | green-800   | green-200   | green-500   |
| `DRAFT`                 | amber-50    | amber-800   | amber-200   | amber-400   |
| `PENDING_REVIEW`        | sky-50      | sky-800     | sky-200     | sky-500     |
| `PENDING_TRIPPER_REVIEW`| purple-50   | purple-800  | purple-200  | purple-500  |
| `INACTIVE`              | red-50      | red-800     | red-200     | red-500     |
| `ARCHIVED`              | neutral-50  | neutral-600 | neutral-200 | neutral-400 |

Trip status badges (booking flow) use the older `rounded-full` pill style — these are separate and not replaced by this component.

---

## Experience Type Chips

Use `<ExperienceTypePills>` from `@/components/common/ExperienceTypePills`. Never write inline chip styles.

```tsx
<ExperienceTypePills types={exp.type} level={exp.level} locale={locale} />
```

Manual chip style when needed outside the component:

```tsx
<span className="rounded-[6px] border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
  {label}
</span>
```

Level label (below chips): plain `text-xs text-neutral-500 mt-1` — no chip treatment.

---

## Table Action Buttons

Use `<TableIconButton>` / `<TableIconLink>` from `@/components/ui/TableIconButton` for icon-only row actions in tables. These include a tooltip — never use the browser `title` attribute alone.

```tsx
import { TableIconButton, TableIconLink } from "@/components/ui/TableIconButton";

<TableIconLink href={`/path/${id}`} title={copy.edit}>
  <Pencil className="h-4 w-4" />
</TableIconLink>

<TableIconButton title={copy.delete} danger onClick={() => handleDelete(id)}>
  <Trash2 className="h-4 w-4" />
</TableIconButton>
```

Size: `34×34px`, `rounded-[6px]`, `border border-gray-200`. Danger hover: red border + red-50 background.

Use `<RowActions>` from `@/components/common/RowActions` only for simple edit/delete pairs outside tables where a tooltip is not needed.

---

## Icons

- Stat card icon puck: `h-4 w-4` inside a `h-9 w-9 rounded-full` puck
- Inline action icons: `h-4 w-4`
- All icons from `lucide-react`

---

## Buttons / Links

- Primary CTA (ink): `h-11 rounded-sm border-2 border-gray-900 bg-gray-900 px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white`
- Navigation action: `<Button asChild variant="ghost">` wrapping `<Link>`
- Panel CTA: `<Button asChild size="sm">`
- Never use raw styled `<a>` or `<Link>` for actions — always go through `Button`

---

## Page Header

Dashboard pages use `<HeaderHero>` (not `<Hero>`):

```tsx
<HeaderHero
  title={copy.header.title}
  description={copy.header.description}
  videoSrc="/videos/hero-video-1.mp4"
  fallbackImage="/images/bg-playa-mexico.jpg"
/>
```

---

## Layout

**Standard section page:**

```tsx
<Section>
  <div className="rt-container text-left">  {/* text-left is REQUIRED — Section adds text-center */}
    <div className="space-y-10 py-10">
      {/* Section header */}
      {/* KPI grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 */}
      {/* Supporting strip */}
      {/* Panel card (table / list) */}
    </div>
  </div>
</Section>
```

**Multi-step form page (New Experience / multi-step flows):**

```tsx
<div className="min-h-screen bg-gray-50">
  <JourneyContentNavigation … />
  <div className="rt-container py-4 sm:py-8">
    <div className="flex flex-col lg:flex-row gap-8">
      <JourneyProgressSidebar className="hidden lg:block" />  {/* sticky sidebar */}
      <div className="flex-1 min-w-0">                       {/* main content */}
        …
      </div>
    </div>
  </div>
</div>
```

**Critical**: `Section` component (`src/components/layout/Section.tsx` line 63) applies `text-center` to its inner wrapper. Always add `text-left` to the `rt-container` div — otherwise all content inherits centered alignment.
