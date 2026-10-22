# Randomtrip EN Social Transcreator — skill export

## What this is
A self-contained instruction pack for automating the **Spanish → English transcreation** of Randomtrip social content. It is not an image-editing tool, machine-translation API, publishing integration, or live offer catalogue.

## Included
- `SKILL.md` — main instructions, routing, locked terms, workflow and stop conditions.
- `references/voice-and-positioning.md` — strategy, voice, two core tensions, creative guidelines.
- `references/glossary-and-payoffs.md` — approved English language vs suggested localizations.
- `references/product-fact-guardrails.md` — product separation, source-of-truth rules and risks.
- `references/examples.md` — translation pairs and anti-patterns.
- `references/output-and-qa.md` — field-by-field output and QA contract.
- `examples/automation-prompt.md` — ready-to-paste system/workflow prompt.
- `examples/test-cases.jsonl` — sample tasks for checking a new automation.
- `SOURCES.md` — provenance and approval status.

## Setup
1. Unzip the skill folder and load `SKILL.md` as the main skill/instruction document; make the `references/` directory available to the model (or paste all markdown files into its knowledge base).
2. If your automation tool supports reusable skills, preserve the folder structure. If it doesn't, start with `SKILL.md` and add the reference files to its context or project knowledge.
3. Point the automation to the original Spanish post assets, with **image text and caption clearly separated**, plus current product facts where needed.
4. Use the template in `examples/automation-prompt.md` for each job.
5. Review the resulting English copy and resolve any flagged offer/asset ambiguities before scheduling publication.

## Usage tip
If a workflow expects a single instruction file, use the standalone `/mnt/data/Randomtrip_EN_Social_Translation_SKILL.md` that accompanies this ZIP. The ZIP is the fuller version with examples and reference files.

## Approval caution
Only the English lines explicitly marked **Approved / A** are canonical. Other phrase translations are suggested directions and should be approved once if they will become fixed, recurring English campaign assets.

**Version:** 1.0 · 2026-10-20
