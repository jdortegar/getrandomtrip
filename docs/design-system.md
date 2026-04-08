# GetRandomTrip — Design System

Consolidated patterns extracted from the live codebase. **New requirements must follow these rules.** Do not invent new values when an existing one fits.

---

## 1. Color

### Brand palette

| Token                | Value     | Use                                            |
| -------------------- | --------- | ---------------------------------------------- |
| `primary`            | `#111827` | Primary actions, dark backgrounds, nav         |
| `primary-foreground` | `#ffffff` | Text/icons on primary                          |
| `accent-cyan`        | `#4f96b6` | Links, carousel controls, secondary highlights |
| `yellow-400`         | `#FCD34D` | Feature CTAs, pill buttons                     |
| `yellow-500`         | `#EAB308` | Hover state of yellow CTAs                     |

### Semantic / surface palette

| Use             | Tailwind class                                         |
| --------------- | ------------------------------------------------------ |
| Page background | `bg-neutral-50`                                        |
| Body text       | `text-neutral-900`                                     |
| Muted text      | `text-neutral-500` / `text-gray-500`                   |
| Subtle text     | `text-neutral-400` / `text-gray-400`                   |
| Card background | `bg-white`                                             |
| Card border     | `border border-neutral-200` / `border border-gray-200` |
| Dividers        | `border-gray-200`                                      |
| Destructive     | `bg-destructive` (red, from shadcn tokens)             |

### Dark overlay (hero/image sections)

```
bg-gradient-to-t from-black/75 to-transparent   // image overlay, full coverage
bg-black/20 to bg-black/75                       // range used across image cards
```

### Rules

- **No raw hex in components.** Use Tailwind classes or CSS variables from `globals.css`.
- **No dark mode variants needed.** Body is forced light (`bg-neutral-50 text-neutral-900`).
- Contrast AA (4.5:1) is required for all body text.

---

## 2. Typography

### Fonts

| Variable                     | Family               | Use                                 |
| ---------------------------- | -------------------- | ----------------------------------- |
| `font-barlow` (default sans) | Barlow               | All body text, UI labels, buttons   |
| `font-barlow-condensed`      | Barlow Condensed     | Hero titles, large display headings |
| `font-nothing-you-could-do`  | Nothing You Could Do | Rare decorative accents             |

> **Default**: Barlow is the base sans — all text is Barlow unless explicitly overriding.

### Type scale

| Role                   | Classes                                                                         | Notes                          |
| ---------------------- | ------------------------------------------------------------------------------- | ------------------------------ |
| Hero title             | `text-[80px] md:text-[130px] font-barlow-condensed font-extrabold leading-none` | Full-bleed sections only       |
| Page / section heading | `text-3xl sm:text-4xl md:text-[44px] font-bold leading-[1.1]`                   | One per major section          |
| Subsection heading     | `text-2xl font-semibold leading-none tracking-tight`                            | Card titles, modal titles      |
| Eyebrow label          | `text-xs uppercase tracking-[0.18em] font-semibold text-neutral-500`            | Above section headings         |
| Body (large)           | `text-lg font-normal leading-relaxed`                                           | Section intros, descriptions   |
| Body (default)         | `text-base font-normal leading-relaxed`                                         | Standard paragraphs            |
| Body (small)           | `text-sm font-normal`                                                           | Captions, helper text          |
| Micro                  | `text-xs`                                                                       | Badges, timestamps, fine print |

### Weight hierarchy

| Weight          | Class            | Use                                  |
| --------------- | ---------------- | ------------------------------------ |
| 800 / extrabold | `font-extrabold` | Hero display only                    |
| 700 / bold      | `font-bold`      | Section headings                     |
| 600 / semibold  | `font-semibold`  | Subsection headings, buttons, labels |
| 500 / medium    | `font-medium`    | Emphasis within body                 |
| 400 / normal    | `font-normal`    | All body text                        |

### Rules

- Minimum body size is `text-base` (16px) — never go below `text-sm` for readable text.
- Line height: `leading-relaxed` for paragraphs, `leading-none` or `leading-tight` for headings.
- Letter spacing: `tracking-[0.18em]` only for eyebrows/uppercase labels. No tracking on body.

---

## 3. Buttons

All buttons use `<Button>` from `src/components/ui/Button.tsx`. **Do not create custom button-like elements.**

### Base style (applied to all variants)

```
font-barlow font-semibold leading-[24px] tracking-[1.5px] uppercase
cursor-pointer flex items-center justify-center
transition-all whitespace-nowrap
disabled:pointer-events-none disabled:opacity-50
```

### Variants

| Variant       | Appearance                                         | When to use                                  |
| ------------- | -------------------------------------------------- | -------------------------------------------- |
| `default`     | Dark (`bg-primary`) fill, white text, white border | Primary action on light bg                   |
| `secondary`   | White bg, primary border + text                    | Secondary action alongside `default`         |
| `feature`     | `bg-yellow-400`, gray text, hover `bg-yellow-500`  | High-emphasis CTA on dark/image bg           |
| `pill`        | `bg-yellow-400`, gray text, `rounded-full`         | Chips, filter tags                           |
| `outline`     | White border + text, transparent bg                | Ghosted CTA on dark backgrounds              |
| `white`       | White bg, hover white/90                           | CTA on dark bg when color contrast is needed |
| `ghost`       | Transparent, accent hover                          | Tertiary / icon button                       |
| `link`        | Primary color, underline on hover                  | Inline text links                            |
| `destructive` | Red bg, white text                                 | Delete / irreversible actions only           |

### Sizes

| Size      | Height          | Use                          |
| --------- | --------------- | ---------------------------- |
| `default` | h-9, text-sm    | Dense UIs, toolbars          |
| `sm`      | h-11, text-sm   | Standard compact             |
| `md`      | h-11, text-base | Standard comfortable         |
| `lg`      | h-14, text-lg   | Hero CTAs, prominent actions |
| `icon`    | 36×36px         | Icon-only buttons            |

### Rules

- **One primary action per view.** Secondary/ghost for the rest.
- Use `feature` or `white` variant (not `default`) when the background is dark or an image.
- All buttons have `tracking-[1.5px] uppercase` — do not override text case.
- Async operations: set `disabled` on the button and show a loading state.

---

## 4. Cards & Surfaces

### Standard card

```tsx
<div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-6">
```

- Hover elevation: `transition-all duration-300 hover:shadow-lg`
- Click elevation: occasionally `transform hover:-translate-y-0.5`

### Glass card (on image/dark backgrounds)

```tsx
<div className="rounded-2xl bg-white/95 backdrop-blur-md ring-1 ring-neutral-200 shadow-sm p-6">
```

### Radius scale

| Use                                      | Class          |
| ---------------------------------------- | -------------- |
| Buttons, inputs, badges                  | `rounded-md`   |
| Standard cards, dialogs                  | `rounded-xl`   |
| Large cards, image cards, feature blocks | `rounded-2xl`  |
| Avatars, pill buttons                    | `rounded-full` |

### Shadow scale

| Context                  | Class       |
| ------------------------ | ----------- |
| Default card             | `shadow-sm` |
| Card on hover            | `shadow-lg` |
| Elevated modal / tooltip | `shadow-xl` |

---

## 5. Layout & Spacing

### Page containers

```tsx
<div className="container mx-auto px-4">       // standard
<div className="max-w-7xl mx-auto px-4">       // wide
<div className="max-w-3xl mx-auto px-4">       // content (prose)
```

### Section spacing

```
py-16           // compact section
py-20           // standard section
py-24           // hero / feature section
```

### Internal spacing rhythm (multiples of 4)

| Token                 | Value   | Use                            |
| --------------------- | ------- | ------------------------------ |
| `gap-2` / `space-y-2` | 8px     | Tight item spacing             |
| `gap-4` / `space-y-4` | 16px    | Default item spacing           |
| `gap-6` / `space-y-6` | 24px    | Card internal, form fields     |
| `gap-8` / `gap-10`    | 32–40px | Grid columns, section children |
| `gap-12`              | 48px    | Large grid gaps                |

### Grid patterns

```tsx
// Two-column responsive
<div className="grid grid-cols-1 gap-6 md:grid-cols-2">

// Three-column responsive
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

// Card grid (auto-fill)
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
```

### Breakpoints

| Name   | Min-width | Tailwind prefix |
| ------ | --------- | --------------- |
| Mobile | 0px       | (default)       |
| Small  | 640px     | `sm:`           |
| Medium | 768px     | `md:`           |
| Large  | 1024px    | `lg:`           |
| XL     | 1280px    | `xl:`           |

Mobile-first always — write base styles for mobile, then add `sm:` / `md:` / `lg:` overrides.

---

## 6. Interactive States

### Hover

```
hover:bg-primary/90          // buttons
hover:shadow-lg              // cards
hover:underline              // text links (offset-2)
hover:-translate-y-0.5       // elevated card CTA
```

### Focus (keyboard)

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2
```

### Disabled

```
disabled:pointer-events-none disabled:opacity-50
```

### Transitions

- Default: `transition-all duration-300`
- Fast (micro): `transition-colors duration-150`
- Accordion: `0.2s ease-out` (via `.animate-accordion-down/up`)

---

## 7. Section anatomy

A standard content section follows this structure:

```tsx
<section className="py-20 bg-white">
  {" "}
  // or bg-neutral-50 for alternating
  <div className="container mx-auto px-4">
    {/* Optional eyebrow */}
    <p className="text-xs uppercase tracking-[0.18em] font-semibold text-neutral-500 mb-3">
      Eyebrow label
    </p>

    {/* Section heading */}
    <h2 className="text-3xl sm:text-4xl font-bold leading-[1.1] text-neutral-900 mb-4">
      Section Title
    </h2>

    {/* Optional description */}
    <p className="text-lg text-neutral-500 max-w-2xl mb-12">
      Supporting description text here.
    </p>

    {/* Content grid */}
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">...</div>
  </div>
</section>
```

---

## 8. Form inputs

Use shadcn/ui primitives (`Input`, `Select`, `Checkbox`, etc.). Consistent patterns:

```tsx
// Label + input pair
<div className="space-y-2">
  <label className="text-sm font-medium text-neutral-900">
    Field label <span className="text-destructive">*</span>
  </label>
  <Input placeholder="..." />
  {/* Error */}
  <p className="text-sm text-destructive">Error message here.</p>
  {/* Helper */}
  <p className="text-xs text-neutral-500">Helper text.</p>
</div>
```

- Errors always **below** the field, in `text-destructive`.
- Required fields marked with `*`.
- Placeholder is not a label replacement — always show the label.

---

## 9. Experience-type theme gradients

When content is themed by travel type, use these gradient pairs (from `TravelCard` / `TravelButton`):

| Type      | Gradient                                                       |
| --------- | -------------------------------------------------------------- |
| Adventure | `from-[#E85D04] to-[#F48C06]` (tropical coral → desert orange) |
| Coastal   | `from-[#023E8A] to-[#0096C7]` (deep blue → teal)               |
| Mountain  | `from-[#1B4332] to-[#40916C]` (rich → forest green)            |
| Urban     | `from-[#343A40] to-[#6C757D]` (charcoal → vibrant gray)        |
| Luxury    | `from-[#7B5E3A] to-[#C9A96E]` (warm brown → gold)              |

These are exclusively for experience-type themed cards/buttons. Do not use them for generic UI.

---

## 10. Icons

- **Use Lucide React** (`lucide-react`) — the project's icon library.
- All icons are SVG. **No emoji as icons.**
- Consistent icon sizes: `size-4` (16px) inline, `size-5` (20px) standard, `size-6` (24px) prominent.
- Pair icons with text labels — avoid icon-only interactive elements without `aria-label`.

---

## 11. Animations

| Name                      | Class                     | Duration      | Use              |
| ------------------------- | ------------------------- | ------------- | ---------------- |
| Accordion open            | `animate-accordion-down`  | 0.2s ease-out | Radix accordion  |
| Accordion close           | `animate-accordion-up`    | 0.2s ease-out | Radix accordion  |
| Marquee / infinite scroll | `animate-infinite-scroll` | 60s linear    | Carousels        |
| Scroll indicator          | `scroll-indicator`        | 1.8s          | Hero scroll hint |

General rules:

- Micro-interactions: `150–300ms`
- Page-level transitions: `≤400ms`
- Use `transform` / `opacity` only — never animate `width`, `height`, `top`, `left`.
- Add `motion-safe:` prefix or check `prefers-reduced-motion` for decorative animations.

---

## 12. Do / Don't

| Do                                                           | Don't                                                                        |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Use `<Button variant="feature">` on dark/image backgrounds   | Create a new `<div onClick>` styled to look like a button                    |
| Use `text-neutral-500` for muted text                        | Use `text-gray-400` and `text-neutral-500` interchangeably without intention |
| Use `rounded-xl` for cards, `rounded-md` for inputs/buttons  | Mix `rounded-lg` and `rounded-xl` randomly                                   |
| Use `py-16` / `py-20` for section spacing                    | Use arbitrary values like `py-[72px]`                                        |
| Use `gap-6` between form fields                              | Use `mt-4` on each field individually                                        |
| Refer to `src/components/ui/Button.tsx` for button variants  | Re-implement button styles inline with `className`                           |
| Add `tracking-[0.18em] uppercase text-xs` for eyebrow labels | Use `text-sm tracking-wide` — it's inconsistent                              |
| Use Lucide icons (`import { Icon } from 'lucide-react'`)     | Use emoji or `<img>` for icons                                               |
