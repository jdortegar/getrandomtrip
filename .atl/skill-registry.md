# Skill Registry — getrandomtrip

<!-- Updated by sdd-init on 2026-05-29. -->

Last updated: 2026-05-29

## Sources scanned

- `/Users/david.ortega/repos/getrandomtrip/.claude/skills` (project-level)
- `/Users/david.ortega/.claude/skills` (user-level)

## Contract

**Delegator use only.** This registry is an index, not a summary. Any agent that launches subagents reads it to select relevant skills, then passes exact `SKILL.md` paths for the subagent to read before work.

`SKILL.md` remains the source of truth. Do not inject generated summaries or compact rules by default; pass paths so subagents load the full runtime contract and preserve author intent.

## Skills

### Project-Level (take precedence over user-level when names collide)

| Skill | Trigger / description | Scope | Path |
| --- | --- | --- | --- |
| `create-component` | Creates new React components following GetRandomTrip conventions—dictionary copy, Img, server/client page split. Use when scaffolding components, new pages, or UI under `src/components/`. | project | `/Users/david.ortega/repos/getrandomtrip/.claude/skills/create-component.md` |
| `refactor-component` | Refactors or restyles components—extract subcomponents, migrate copy to dictionaries, Hero to HeaderHero, GlassCard to white cards. Use when refactoring UI, dashboard pages, or tripper blog flows. | project | `/Users/david.ortega/repos/getrandomtrip/.claude/skills/refactor-component.md` |

### User-Level

| Skill | Trigger / description | Scope | Path |
| --- | --- | --- | --- |
| `branch-pr` | Create Gentle AI pull requests with issue-first checks. Trigger: creating, opening, or preparing PRs for review. | user | `/Users/david.ortega/.claude/skills/branch-pr/SKILL.md` |
| `chained-pr` | Trigger: PRs over 400 lines, stacked PRs, review slices. Split oversized changes into chained PRs that protect review focus. | user | `/Users/david.ortega/.claude/skills/chained-pr/SKILL.md` |
| `cognitive-doc-design` | Design docs that reduce cognitive load. Trigger: writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs. | user | `/Users/david.ortega/.claude/skills/cognitive-doc-design/SKILL.md` |
| `comment-writer` | Write warm, direct collaboration comments. Trigger: PR feedback, issue replies, reviews, Slack messages, or GitHub comments. | user | `/Users/david.ortega/.claude/skills/comment-writer/SKILL.md` |
| `go-testing` | Trigger: Go tests, go test coverage, Bubbletea teatest, golden files. Apply focused Go testing patterns. | user | `/Users/david.ortega/.claude/skills/go-testing/SKILL.md` |
| `issue-creation` | Create Gentle AI issues with issue-first checks. Trigger: creating GitHub issues, bug reports, or feature requests. | user | `/Users/david.ortega/.claude/skills/issue-creation/SKILL.md` |
| `judgment-day` | Trigger: judgment day, dual review, adversarial review, juzgar. Run blind dual review, fix confirmed issues, then re-judge. | user | `/Users/david.ortega/.claude/skills/judgment-day/SKILL.md` |
| `skill-creator` | Trigger: new skills, agent instructions, documenting AI usage patterns. Create LLM-first skills with valid frontmatter. | user | `/Users/david.ortega/.claude/skills/skill-creator/SKILL.md` |
| `skill-improver` | Trigger: improve skills, audit skills, refactor skills, skill quality. Audit and upgrade existing LLM-first skills. | user | `/Users/david.ortega/.claude/skills/skill-improver/SKILL.md` |
| `work-unit-commits` | Plan commits as reviewable work units. Trigger: implementation, commit splitting, chained PRs, or keeping tests and docs with code. | user | `/Users/david.ortega/.claude/skills/work-unit-commits/SKILL.md` |

## Convention Files

| File | Purpose |
| --- | --- |
| `/Users/david.ortega/repos/getrandomtrip/.claude/CLAUDE.md` | Project overview, stack, commands, architecture, coding conventions |
| `/Users/david.ortega/repos/getrandomtrip/.claude/rules/component-patterns.md` | Component isolation, dashboard structure, props pattern, import aliases |
| `/Users/david.ortega/repos/getrandomtrip/.claude/rules/design-system.md` | Card styles, typography, icons, badges, buttons, layout grid, theme |
| `/Users/david.ortega/repos/getrandomtrip/.claude/rules/i18n-and-types.md` | Dictionary files, i18n sections, domain types, type quality rules |

## Skill Matching Guide

| Task context | Code context | Skills to load |
| --- | --- | --- |
| Scaffolding new component, page, or UI | `src/components/`, `src/app/` | `create-component` |
| Refactoring, restyling, extracting components | `src/components/`, `src/app/` | `refactor-component` |
| Creating or preparing a PR | any | `branch-pr`, `work-unit-commits` |
| PR exceeds 400 lines or SDD flags high risk | any | `chained-pr`, `work-unit-commits` |
| Creating GitHub issues | any | `issue-creation` |
| Implementation work (sdd-apply) | any | `work-unit-commits` |

## Loading protocol

1. Match task context and target files against the `Trigger / description` column.
2. Pass only the matching `Path` values to the subagent under `## Skills to load before work`.
3. Instruct the subagent to read those exact `SKILL.md` files before reading, writing, reviewing, testing, or creating artifacts.
4. If no matching skill exists, proceed without project skill injection and report `skill_resolution: none`.
