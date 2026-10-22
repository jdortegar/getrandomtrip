/** Public AI rules for anyone given the live gallery URL, without repo access. */
export const DESIGN_SYSTEM_LLMS = `# Randomtrip design system — AI rules

You were given the live gallery. There is no repository. Follow this document
and the two gallery pages. Do not invent a parallel visual language.

## Pages

- Brand Book: /design-system (English: /en/design-system)
- UI kit (real product components): /design-system/components
  (English: /en/design-system/components)
- These AI rules: /design-system/llms (English: /en/design-system/llms)

Spanish is the default locale (no prefix). Study the UI kit before drawing new
controls. Match what is already on that page.

## Product

GetRandomtrip is a mystery travel platform. Light theme only. Never use dark
mode or \`dark:\` Tailwind variants.

## Color

Use role names, not one-off hex, when you can. Hex is listed so you can match
without the codebase.

| Role | Hex | Use |
| --- | --- | --- |
| Ink | #383838 | Headings and body text |
| Primary / Deep Teal | #0F5C60 | Text, eyebrows, icons, focus, borders. Never a large fill (nav, footer, hero band, section). Cap about 5–10% of a view. |
| Secondary / Mineral Sage | #A4B4AA | Supporting sections, containers, layered backgrounds (~30%) |
| Feature / Ochre | #E5A51C | High-emphasis CTAs and highlights only (0–5%) |
| Ground / Off-White | #F3F2ED | Page canvas |
| Surface / White | #FFFFFF | Cards, panels, form surfaces |
| Border | #E5E7EB | Card and field borders (\`gray-200\`) |
| XSED | #D97E4A | XSED sub-brand only. Never a general accent. |

Body text on Ground or White. Cards are white with a light border and rounded
corners (\`rounded-xl\`). Deep Teal as a big button fill is off-brand when the
action is a highlight — use Ochre for that emphasis, Deep Teal for text and
chrome.

## Type

- UI and body: Barlow, sentence case, ink
- Editorial headings: Barlow Condensed, Bold 700 (not 800), uppercase
- Human asides: Nothing You Could Do
- Eyebrows: small, uppercase, tracking, Deep Teal

## Forms (leads, settings, any form)

Before inventing a field, copy the pattern on /design-system/components
(Campos / Fields). Required:

- One white card: white background, \`#E5E7EB\` border, \`rounded-xl\`, inner
  spacing
- Labeled fields with visible labels (not placeholder-only)
- Native, accessible inputs. Email, text, textarea, select, checkbox/switch
- Validation: show an error next to the field, move focus to the first invalid
  field, keep a status message for success
- Primary submit uses the product Button treatment: uppercase, Barlow
  semibold, letter-spacing, near-square corners. Show a spinner and a progress
  label while saving; disabled alone is not enough. Allow retry after failure
- Do not use raw \`<a>\` styled as a button

If you can name the primitives, use them: FormField, FormSelectField,
TextAreaInput, FormValidationScope, QuantityStepper, Switch, Button.

## Copy and language

Every user-visible string needs Spanish and English. Default locale is Spanish.
Do not hardcode a single language into the UI.

Voice: curious, human, a little wonder. Do not over-explain. Do not sound like
a brochure or a luxury travel ad. North Star: "Wonder begins where certainty
ends." / "El asombro empieza donde termina la certeza."

## Images and motion

No raw \`<img>\`. Prefer the product image component if the host app has it.
Respect reduced motion. Visible focus rings. Touch targets that are easy to hit.

## Do not

- Dark mode
- Deep Teal as a full-bleed section or footer
- A second, custom form kit that does not match /design-system/components
- Canyon Clay / XSED orange unless the work is explicitly XSED
- Glass / frosted cards on dashboard-like surfaces
`;