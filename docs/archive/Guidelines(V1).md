# Randomtrip Design & Style Guidelines

**Last Updated:** 2024-07-24

This document outlines the design, style, and content guidelines for getrandomtrip.com. It is the single source of truth for ensuring brand consistency and a high-quality user experience. All team members must reference this guide at each stage of the workflow.

---

## 1. Brand & Mission Statement

**Vision:** To be the leading platform for personalized, surprise travel, offering curated and emotionally resonant experiences that inspire a sense of adventure and luxury.

**Mission:** We empower travelers to embrace the unknown by crafting unique, high-end journeys tailored to their individual preferences. We handle the details, so they can enjoy the discovery.

**Inspiration:** Our brand is inspired by the aspirational and premium quality of **Black Tomato**. We aim for a similar feel of exclusivity, storytelling, and impeccable execution.

---

## 2. Voice & Tone

Our voice is **aspirational, evocative, and concise**. We speak to the discerning traveler who values quality, emotion, and seamless experiences.

- **Aspirational:** Use language that inspires and creates a sense of desire.
- **Concise:** Every word has a purpose. Avoid jargon and unnecessary explanations.
- **Emotional:** Connect with the user’s feelings of excitement, curiosity, and anticipation.

| Example Phrasing | Tone |
| --- | --- |
| "Begin your unexpected journey." | Aspirational, Direct |
| "The details are secret. The experience is yours." | Evocative, Mysterious |
| "Your adventure awaits." | Simple, Powerful |

---

## 3. Visual Identity

### Color Palette

| Role | Name | Hex | RGB |
| --- | --- | --- | --- |
| **Primary** | Deep Blue | `#0A2240` | `10, 34, 64` |
| **Secondary** | Terracotta | `#D97E4A` | `217, 126, 74` |
| **Neutral** | Graphite | `#212121` | `33, 33, 33` |
| **Neutral** | Off-White | `#F5F5F5` | `245, 245, 245` |
| **Accent** | Gold | `#FFD700` | `255, 215, 0` |

### Typography

- **Headlines:** `Merriweather`, Bold (for a classic, premium feel)
- **Body & UI:** `Poppins`, Regular (for clarity and modern appeal)

| Element | Font Family | Weight | Size (Desktop) |
| --- | --- | --- | --- |
| H1 | Merriweather | Bold | 48px |
| H2 | Merriweather | Bold | 36px |
| H3 | Poppins | SemiBold | 24px |
| Body | Poppins | Regular | 16px |
| Button | Poppins | Medium | 16px |

### Imagery & Media

- **Hero Imagery:** Use high-resolution, full-bleed images that are emotionally evocative and tell a story.
- **Ratios:** Primarily 16:9 for hero images. Cards and thumbnails can be 4:3 or 1:1.
- **Filters:** Apply subtle filters to enhance mood, but keep images looking natural.

### Iconography & Button Style

- **Icons:** Use minimalist, line-art icons that are easily recognizable.
- **Buttons:**
    - **Primary CTA:** Solid `Terracotta` fill with `Off-White` text.
    - **Secondary:** `Terracotta` outline with `Terracotta` text.
    - **States:** Clear hover, focus, and disabled states.

### Spacing & Layout

- **Grid System:** Use a 12-column grid with consistent gutters.
- **Spacing:** Employ a 4px or 8px baseline grid for consistent spacing between elements. Generous whitespace is key to our premium feel.

---

## 4. UI Component Rules

- **Design Tokens:** Use design tokens for colors, fonts, and spacing to ensure consistency.
- **Naming Conventions:**
    - Components: `PascalCase` (e.g., `PrimaryButton`, `TripCard`).
    - CSS/Styled-Components: `kebab-case` (e.g., `trip-card__title`).
- **Transitions & Animations:** Animations should be subtle and smooth (e.g., fade-ins, slow transitions on carousels).

---

## 5. Accessibility Standards

We adhere to **WCAG 2.1 Level AA**.

- **Color Contrast:** Ensure text has a contrast ratio of at least 4.5:1 against background (WCAG 1.4.3).
- **Non‑Text Contrast (New in WCAG 2.1 – SC 1.4.11):** Interactive UI components and meaningful graphics (like buttons, form fields, icons, focus outlines) must have a contrast ratio of at least 3:1 against adjacent colors :contentReference[oaicite:1]{index=1}.
- **Reflow / Responsive Layout (SC 1.4.10):** Layout must adapt without horizontal scrolling when zoomed to 400% or when viewport is reduced to 320px width, ensuring readable text and accessible content :contentReference[oaicite:2]{index=2}.
- **Focus States:** Every interactive element must have a visible focus outline for keyboard navigation.
- **Forms:** Use clear labels, validation messaging, and ARIA attributes for accessibility.
- **Body Copy:** Use simple, readable language for all users.
- **Alt Text:** All informative images require descriptive alt text for screen reader users.

Below is an updated snippet for clarity:

```text
- Color Contrast: ≥ 4.5:1 for text (1.4.3)
- Non‑Text Contrast: ≥ 3:1 for UI components/icons (1.4.11)
- Reflow: no horizontal scrolling at 400% zoom or minimum width 320px (1.4.10)

---

## 6. Naming Conventions & Folder Structure

Based on the existing structure:

```
/getrandomtrip
|-- /components
|   |-- /common       // Reusable, generic components
|   |   |-- Button.tsx
|   |   `-- Card.tsx
|   |-- /screens      // Screen-level components
|   |   `-- LandingScreen.tsx
|   `-- ProgressBar.tsx
|-- /services       // API calls and other services
|   `-- kaiService.ts
|-- /styles         // Global styles and design tokens
|   `-- theme.ts
|-- App.tsx
`-- index.tsx
```

---

## 7. Copywriting Guidelines

- **Microcopy:** Keep it concise and helpful.
- **Punctuation:** Use sentence case for titles and headings. Use the Oxford comma.
- **Capitalization:** Use title case for primary CTAs (e.g., "Start Your Journey").
- **Error Messages:** Be clear, polite, and provide a path to resolution.
- **Localization:** Write copy that can be easily translated without losing its meaning.

---

## 8. Do’s & Don’ts

| Area | Do | Don't |
| --- | --- | --- |
| **Branding** | Use full-bleed, high-quality images. | Use generic stock photos. |
| **Tone** | "Craft your unique escape." | "Plan your trip now." |
| **Layout** | Use generous whitespace. | Crowd elements together. |
| **Copy** | "Your adventure is being tailored." | "Loading..." |

---

## 9. Review & Update Guidelines

- **Versioning:** This document will be versioned with a `Last Updated` date.
- **Suggestions:** Team members can suggest improvements by creating an issue or pull request.
- **Review Process:** The Product Manager and UX/UI Designer will review and approve changes.

---

## 10. Quick Reference Section

- **Inspiration:** Black Tomato
- **Colors:** Deep Blue (`#0A2240`), Terracotta (`#D97E4A`), Graphite (`#212121`)
- **Fonts:** `Merriweather` (Headlines), `Poppins` (Body)
- **Key Principles:** Aspirational, Concise, Emotional, Clean, Accessible.
- **Workflow:** Reference this file at every stage of the `TeamWorkflow.md`.
