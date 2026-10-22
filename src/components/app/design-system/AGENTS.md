# Design-system galleries — agent reference

Public AI rules (no repository needed):

- `/design-system/llms`
- `/en/design-system/llms`

The live pages link that URL and embed the same markdown, so a teammate can
paste `http://localhost:3012/design-system` into another AI tool and the agent
can fetch the rules.

## Live pages (noindex)

| Route | What it is |
| --- | --- |
| `/[locale]/design-system` | Brand Book 3.1 |
| `/[locale]/design-system/components` | UI kit — real product components |
| `/[locale]/design-system/llms` | AI rules as `text/markdown` |

Spanish is the default (`/design-system`). English uses the `/en/` prefix.

## In-repo specs

- Brand voice, logo, photography: `.claude/rules/brand.md`
- Tokens, cards, tables, buttons: `.claude/rules/design-system.md`
- Source of the public markdown: `src/lib/constants/DESIGN_SYSTEM_LLMS.ts`

If you change a shared component, update the components gallery in the same
change. If you change a rule an external agent must follow, update
`DESIGN_SYSTEM_LLMS.ts` too.
