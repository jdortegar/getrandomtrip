# AI visibility checks

Goal: Randomtrip is cited by name in AI answers (ChatGPT, Perplexity, Google AI Overviews / Gemini, Claude, Copilot) for surprise-trip queries in **es-LatAm** and **en-US**. Two signals, reviewed together once a month:

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
