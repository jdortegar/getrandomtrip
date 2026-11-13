# AI visibility checks

Goal: Randomtrip is cited by name in AI answers (ChatGPT, Perplexity, Google AI Overviews / Gemini, Claude, Copilot) for surprise-trip queries in **es-LatAm** and **en-US**. Two signals, reviewed together once a month:

The on-site levers (structured data, `/llms.txt`, brand disambiguation) and their rules are in `AnalyticsSeoLaunch.md` → "Structured data and AI visibility". When the panel finds a wrong fact, fix it there at its dictionary key.

1. **Referral traffic** — GA4 `ai_referral` events by `ai_source` (see `AnalyticsSeoLaunch.md`). Shows people who clicked through.
2. **Manual prompt panel** — the fixed prompts below. Shows whether we are mentioned at all, even without a click.

## How to run the panel

- First business day of each month. Use a logged-out or fresh session with no memory or custom instructions, and set the location to the target market when the engine allows it.
- Run every prompt on every engine. Do not rephrase prompts between months: the panel only works if it stays fixed. Add new prompts at the end; never edit or remove old ones.
- Score each answer:
  - **C** — cited: links to a getrandomtrip.com page.
  - **M** — mentioned by name, no link.
  - **–** — absent.
- Note any competitor the answer recommends instead, and any **wrong fact** about Randomtrip (e.g. prices, reveal timing, what's included). Wrong facts are the highest priority: fix the source page or dictionary copy they came from.

## Prompts

### es-LatAm

| #   | Prompt                                                |
| --- | ----------------------------------------------------- |
| E1  | ¿Qué es un viaje sorpresa y cómo funciona?            |
| E2  | Empresas de viajes sorpresa en Latinoamérica          |
| E3  | Viaje sorpresa para parejas                           |
| E4  | Regalar un viaje sorpresa                             |
| E5  | Viaje sorpresa en familia con niños                   |
| E6  | Viaje sorpresa con mi perro                           |
| E7  | Luna de miel sorpresa                                 |
| E8  | Escapada de fin de semana sorpresa cerca de mi ciudad |
| E9  | ¿Qué es Randomtrip?                                   |
| E10 | ¿Cuándo te revelan el destino en un viaje sorpresa?   |

### en-US

| #   | Prompt                                                  |
| --- | ------------------------------------------------------- |
| N1  | What is a surprise trip and how does it work?           |
| N2  | Best mystery trip companies                             |
| N3  | Surprise trip for couples                               |
| N4  | Surprise trip as a gift                                 |
| N5  | Surprise family vacation with kids                      |
| N6  | Mystery trip with my dog                                |
| N7  | Surprise honeymoon destination planner                  |
| N8  | Surprise weekend road trip near me                      |
| N9  | What is Randomtrip?                                     |
| N10 | When do you find out the destination on a mystery trip? |

E9/N9 check the brand entity itself: the answer should match the FAQ (destination revealed 48 hours before departure, transport and accommodation by experience level, no fixed origin market).

## Log

Copy this block per month. One cell per prompt × engine.

```
### YYYY-MM
Engines: ChatGPT | Perplexity | Gemini/AI Overviews | Claude | Copilot
E1:  – | – | – | – | –
...
N10: – | – | – | – | –
ai_referral (GA4, last 30 days): chatgpt 0 · perplexity 0 · gemini 0 · claude 0 · copilot 0
Wrong facts found:
Competitors named:
Actions:
```

### 2026-11 (baseline, partial)

Run 2026-11-12, logged out, via browser automation. Perplexity: full panel. ChatGPT: E9 only (logged-out session stopped answering after one prompt). Gemini/AI Overviews, Claude, Copilot: not run (need a logged-in or manual session).

```
Engines: ChatGPT | Perplexity | Gemini/AI Overviews | Claude | Copilot
E1:  n/r | – | n/r | n/r | n/r
E2:  n/r | – | n/r | n/r | n/r
E3:  n/r | – | n/r | n/r | n/r
E4:  n/r | – | n/r | n/r | n/r
E5:  n/r | – | n/r | n/r | n/r
E6:  n/r | – | n/r | n/r | n/r
E7:  n/r | – | n/r | n/r | n/r
E8:  n/r | – | n/r | n/r | n/r
E9:  C   | ✗ | n/r | n/r | n/r
E10: n/r | – | n/r | n/r | n/r
N1:  n/r | – | n/r | n/r | n/r
N2:  n/r | – | n/r | n/r | n/r
N3:  n/r | – | n/r | n/r | n/r
N4:  n/r | – | n/r | n/r | n/r
N5:  n/r | – | n/r | n/r | n/r
N6:  n/r | – | n/r | n/r | n/r
N7:  n/r | – | n/r | n/r | n/r
N8:  n/r | – | n/r | n/r | n/r
N9:  n/r | ✗ | n/r | n/r | n/r
N10: n/r | n/a | n/r | n/r | n/r
ai_referral (GA4, last 30 days): tracking went live 2026-11-12; first real numbers in 2026-12
Wrong facts found:
- ✗ = answered about a DIFFERENT "Randomtrip": Perplexity E9/N9 describe randomtrip.net (travel blog by Inês and Chris) and also cite randomtrip.es. Entity confusion, not just absence.
- ChatGPT E9 is correct (surprise trips, reveal ~48h before, flights + lodging, links getrandomtrip.com) but its image carousel shows another site's offers ("Barcelona 150€").
Competitors named:
- es (Perplexity E2): Escappy Travel (Colombia) as the leading LatAm surprise-trip company; Wish and Fly.
- en (Perplexity N2, citing Forbes): Pack Up + Go, Journee, Guess Where Trips.
Actions:
- Disambiguate the entity: Organization schema with sameAs (Instagram, LinkedIn, Facebook), legalName "Randomtrip Inc.", and pages that say "Randomtrip (getrandomtrip.com)".
- Get listed where the competitors are cited: Forbes-style "best mystery trip companies" roundups, LatAm press like the one citing Escappy.
- Finish the panel for the n/r engines manually.
```
