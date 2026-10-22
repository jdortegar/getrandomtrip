---
description: >-
  Randomtrip Brand Book 3.1 for agents: essence, palette and usage ratio,
  logo lockups, type voices, tone of voice, payoffs, photography and Tripper
  treatment. Apply when writing UI, copy, emails, or dictionary strings.
alwaysApply: false
paths:
  - "src/components/**"
  - "src/app/**"
  - "src/dictionaries/**"
  - "src/emails/**"
---

# Randomtrip Brand

Source: Randomtrip Brand Book 3.1 (ESP). Live reference: the Brand part of `/[locale]/design-system` (`src/components/app/design-system/brand/`). Code-level tokens and component patterns live in `design-system.md`; this file is the *why* and the voice.

## Essence

| Layer | Content |
| --- | --- |
| North Star | **El asombro empieza donde termina la certeza.** — EN: *Wonder begins where certainty ends.* |
| Purpose | Hacer que viajar vuelva a sentirse mágico: help people find trips they'd never have chosen, but end up loving. |
| Vision | Un mundo donde las personas viajan con más curiosidad y menos suposiciones. |
| Belief | The best experiences aren't always the ones we choose. Optimizing every decision makes us repeat ourselves. |
| Essence | Serendipia por diseño (designed serendipity). |
| Values | **Curiosidad** (go beyond the known) · **Confianza** (let go of control, everything is carefully designed) · **Facilidad** (remove decisions and planning to leave room for serendipity). |
| Character | Curioso · Humano · Ligero · Inesperado |
| Promise | Redescubrir el asombro de viajar. |
| Value proposition | Viajes que no habrías elegido, pero que terminas amando. |
| Consumer | Curious, experience-driven, digitally savvy travelers, open to trying things outside their usual preferences — tired of hours of research that never surprises them. |

## Color

Tokens and the call-site rule are in `design-system.md` (palette tier named after the brand, role tier used by UI). Usage ratio per view:

| Color | Role token | Share | Use |
| --- | --- | --- | --- |
| Off White `#F3F2ED` | `ground` | 60% | Main canvas, with photography. *Ligero, sereno, limpio.* |
| Mineral Sage `#A4B4AA` | `secondary` | 30% | Sections, blocks, containers, layered backgrounds. *Curioso, natural, humano.* |
| Deep Teal `#0F5C60` | `primary` | 5–10% | Text, headlines, navigation, icons, key elements — never a large fill. *Fiable, seguro, audaz.* |
| Ochre `#E5A51C` | `feature` | 0–5% | CTAs, highlights, moments that need energy. *Inesperado, enérgico, optimista.* |

- **Deep Teal Dark** `#082E30` / **Sage Dark** `#4D5E54` (`deep-teal-dark`, `sage-dark`): text over light images only.
- **Canyon Clay** `#D97E4A` (`xsed`): secondary palette, reserved for the XSED sub-brand.
- **Sky Drift** `#6BAAC9` (`sky-drift`): secondary palette reference; no UI role until the brand defines one — don't use it.
- White text over dark images. Color is a brand signal: consistent use builds recognition.

## Logo

Asset files in `public/assets/logos/`. Three constructions, then four approved color lockups:

| Construction | Asset |
| --- | --- |
| Isologo (symbol only) | `iso-randomtrip.svg` |
| Lockup without tagline | `logo_randomtrip_no_tag.svg` |
| Lockup with tagline | `logo_randomtrip.svg` |

| Background | Logo | Asset |
| --- | --- | --- |
| Off White | Ochre icon + Deep Teal wordmark | `logo_randomtrip_no_tag.svg` (`logo_randomtrip.svg` adds the tagline) |
| Deep Teal | All Ochre | CSS mask of `logo_randomtrip_no_tag.svg` filled `bg-feature` |
| Mineral Sage | All Deep Teal | CSS mask filled `bg-primary` |
| Ochre | All White | `logo_white_no_tag.svg` or CSS mask filled `bg-white` |

Never recolor the logo outside these pairs or place it on busy photography without contrast.

## Typography — three voices

| Voice | Font | Character | Use |
| --- | --- | --- | --- |
| Editorial | Barlow Condensed **Bold 700**, UPPERCASE | Audaz, provocadora, segura | Powerful lines that spark curiosity; the main idea. |
| Human | Nothing You Could Do (`font-nothing-you-could-do`) | Personal, íntima, cercana | Emotional turns, reflections, story fragments. Set 1–2 pt smaller than the main idea. |
| Documentary | Barlow Regular (default sans) | Real, clara, fiable | Concrete information that anchors the story. |

Rules: text is part of the story, not a layer on top — use contrast, scale and placement to create intrigue, and leave space. One protagonist idea per piece. Combine two fonts only when a line naturally splits into a more emotional part. Two different messages: Barlow Condensed or the handwritten font for the main one, Barlow Regular lowercase for the secondary. Align left or right; center only for emphasis; keep text away from edges. Reading always comes first — type accompanies the image, never competes with it.

Editorial headings use Barlow Condensed **Bold 700** (`font-bold`). Never `font-extrabold` (800).

## Tone of voice

Speak like someone you'd want to travel with. Don't explain the magic — leave just enough curiosity. Talk about possibilities, stories and letting go of control — **not** mystery, surprise destinations, or mechanics.

| Character | Voice rule | ✓ Works | ✗ Doesn't work |
| --- | --- | --- | --- |
| Curioso | Open possibilities instead of selling destinations | ¿Y si no eligieras adónde ir? | Descubre nuestra amplia selección de viajes emocionantes. |
| Humano | Speak like a person, not a travel platform | No estabas buscando este lugar. Mejor así. | Nuestras plataformas ofrecen experiencias únicas y personalizadas. |
| Ligero | Say less; make every word count | Haz la maleta. Nosotros seguimos desde aquí. | Completa tus preferencias y crearemos un viaje sorpresa a tu medida. |
| Inesperado | Spark curiosity; don't reveal everything | Tu mejor historia podría estar donde nunca buscaste. | Reserva un viaje sorpresa y descubre tu destino 48 horas antes de salir. |

English copy follows the same rules; the reviewed English versions of these examples live in `src/dictionaries/en.json` under `designSystem`. When writing any user-facing string (`es.json`/`en.json`, emails, metadata): short, human, curious, no platform jargon ("our platform offers…", "unique personalized experiences"), no over-explaining the mechanism.

## Payoffs — one signature, five messages

Pick **one** protagonist payoff per piece by goal; a second only as reinforcement.

| # | Payoff (ES) | Payoff (EN) | Job | Recommended use |
| --- | --- | --- | --- | --- |
| Signature | WONDER • WANDER *Repeat* | same | Institutional sign-off, recognition device | Next to the logo, closing brand pieces, campaigns, video, social, packaging |
| 01 Philosophy | El asombro empieza donde termina la certeza. | Wonder begins where certainty ends. | Highest brand expression: magic happens when we let go of control | Social, site hero, covers, manifestos |
| 02 Benefit | Menos elección. Más posibilidades. | Fewer choices. More possibilities. | Answers decision fatigue and planning stress | "How it works", product mailings, landing benefits |
| 03 Promise | Hay viajes que nunca elegirías. *Hasta que los vives.* | Some trips you'd never choose. *Until you live them.* | Turns distrust of the unknown into curiosity | Near testimonials, UGC, real-experience carousels, checkout |
| 04 Emotion | *Vuelve a sentir la magia de viajar.* | *Feel the magic of travel again.* | Most emotional, human expression of the purpose | Brand story, site footer, post-trip thank-yous |
| 05 Differentiator | No busques destinos. Encuentra historias. | Don't chase destinations. Find stories. | Reframes what people come for: stories, not destinations | Social bios, Trippers section, community campaigns |

Payoffs set in the editorial voice except where italic (*handwritten* human voice), as in the book. English versions are agent-written and pending brand review.

## Photography

"No buscamos destinos. Buscamos historias." Photos capture the moments that made the trip worth remembering, not proof of where you went. The Brand gallery uses the Brand Book 3.1 photographs in `public/images/brand-book/` for type-on-image examples, payoffs, philosophy, treatment, and Tripper frames.

- **Real, not perfect**: natural light, imperfect framing, movement, grain, unposed real people.
- **Attitude over destination**: a small detail says more than a landmark; the image should make you think "what happened here?".
- **Stories, not postcards**: doors, tables after a meal, a view from the train, someone turning a corner.
- **Collected**: found along the way, not created for the camera.
- **Color treatment**: balanced and natural; Mineral Sage lives subtly in shadows and foliage; Ochre warms sun, skin, stone and wood; subtle grain and soft blacks. Real first, then the magic — the treatment never invents the moment.

## Trippers

Real people, unexpected stories; warm, imperfect, authentic — never over-polished. Collection frame: a vertical notebook strip (sage, ochre or teal) with the Tripper's @handle, the name in Barlow Condensed uppercase, a handwritten subtitle (e.g. "The Explorer"), and a collection label ("COL. #0007 / RANDOMTRIPPER / CITY, COUNTRY"). Reference implementation: `src/components/app/design-system/brand/TripperCollectionFrame.tsx` (page-local; promote to `src/components/common/` when a real screen adopts it).
