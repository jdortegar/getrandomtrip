---
description: >-
  Dashboard design tokens—cards, typography, HeaderHero, Button+Link, badges,
  grids. Use for tripper and client dashboard UI.
alwaysApply: true
---

# Design System

## Card Styles

Two canonical card styles — use nothing else:

**Stat card** (large value + icon):
```html
<div class="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-md ring-1 ring-gray-100">
```

**Panel card** (section with heading + content):
```html
<div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
```

Do NOT use `GlassCard` for dashboard pages. It belongs to the marketing/public pages only.

## Typography

- Large stat values: `font-barlow-condensed font-bold text-4xl text-gray-900`
- Panel headings (h2): `text-xl font-semibold text-neutral-900`
- Panel headings (h3): `text-lg font-semibold text-neutral-900`
- Label text: `text-sm font-medium text-neutral-500`
- Body/secondary: `text-sm text-neutral-600`

## Icons

Dashboard icons use `text-light-blue` at `h-10 w-10` for stat cards.
Inline action icons use `h-4 w-4` or `h-5 w-5`.
All icons from `lucide-react`.

## Status Badges

```tsx
<span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(status)}`}>
```

Status color map:
- confirmed / completed → `bg-green-100 text-green-800 border-green-200`
- revealed → `bg-purple-100 text-purple-800 border-purple-200`
- pending / default → `bg-yellow-100 text-yellow-800 border-yellow-200`
- cancelled → `bg-red-100 text-red-800 border-red-200`

## Buttons / Links

Use `<Button asChild variant="ghost">` wrapping `<Link>` for navigation actions.
Use `<Button asChild size="sm">` for primary CTAs inside panels.
Never use raw styled `<a>` or `<Link>` for actions — always go through `Button`.

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

## Layout Grid

```tsx
{/* Stats row */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

{/* Main + sidebar */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">  {/* main panel */}
  <div className="space-y-6">     {/* sidebar panels */}

{/* Full-width bottom */}
<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
```

Wrap everything in `<Section><div className="rt-container">`.

## Theme

Light mode only. `<body>` is forced to `bg-neutral-50 text-neutral-900`.
Never add `dark:` variants.
