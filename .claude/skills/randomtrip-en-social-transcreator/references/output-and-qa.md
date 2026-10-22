# Operational output contract and QA

## Inputs
The operator should pass, when available:
- `post_id` / asset name, intended channel and market, planned publish date.
- Distinct text fields: image headline, image body, each carousel slide (indexed), caption, hashtags, CTA, pinned comment, Reel subtitles, Story frames.
- Specific offer name and current product facts/approval status, if product-related.
- Any locked Spanish and English phrasing, character limits, brand/legal tags and visual constraints.
- Whether the request is `faithful`, `adapted` (default, natural transcreation) or `bold` (more creative within truthful meaning).

**No image manipulation is required for text translation.** Return copy for designers to place into images unless the workflow explicitly also has image-editing instructions.

## Output: human-readable copy (default)
Group by the source's original pieces:

```
POST ID: 2026-xx-xx-xx
IMAGE 1 — HEADLINE
...
IMAGE 1 — BODY
...
IMAGE 2 — HEADLINE
...
CAPTION
...
HASHTAGS
...
CTA
...

REVIEW NOTES (only when necessary)
- ...
```

If the input only contains caption, output just caption, not manufactured images, hashtags or product sections. For long batches return one consistent block per input asset in source order.

## Output: example structured object
An automation may require JSON to feed a publishing queue. Adapt to the actual destination schema, but preserve these relationships:

```json
{
  "source_id": "campaign_post_001",
  "language": "en",
  "locale": "en-US",
  "assets": [
    { "slide_index": 1, "headline": "THE UNEXPECTED, YOUR WAY.", "body": "..." }
  ],
  "caption": "...",
  "cta": "Link in bio.",
  "hashtags": [],
  "needs_review": false,
  "review_notes": []
}
```

This object is **illustrative**, not a command to add unknown fields. No automatic content may assert `approved: true` without human approval.

## Quality checks (automatable)
### Literalness / fluency
- Does the headline sound written by an English-speaking brand editor?
- Natural rhythm and idiom? Any Spanish syntax, false friends or awkward prepositions?
- Excessive word count for artwork vs caption?

### Brand positioning
- Consumer is motivated by possible discoveries, not just hiding a location?
- Planning fatigue supported where relevant, not added randomly?
- Humans vs algorithms / careful design made clear when needed?
- Brand not presented as a lottery, guessing game or exclusive destination catalogue?

### Entity preservation
- `Randomtrip`/`RANDOMTRIP`, `XSED`, `ESSENZA`, `MODO EXPLORA`, `EXPLORA+`, `BIVOUAC`, `ATELIER GETAWAY`, `Trippers`, `Sunday Drop` and `WONDER. WANDER. REPEAT.` correct?
- Copyright, registered marks, URLs, discount code, CTA and tags unchanged where required?

### Factual and contextual risk
- No newly invented travel radius, departure city, flights, hotels, meals, guarantee, price, discounts, scarcity or schedule?
- No conversion of `up to` into an absolute claim?
- No universal XSED rules projected onto other experiences?
- No automatic local time zone conversion, price/currency conversion or claim of live inventory?
- No fabricated review, quote, testimonial or real completed journey?

### Editorial
- Caption vs text-in-image are distinguishable?
- All-caps hierarchy preserved when visually significant?
- Source emoji intent, hashtag intent and calls to action preserved?
- The output can go directly into the correct publication channel with no unrequested extra paragraphs?

## Escalation logic
**Ready to publish** only when claims are faithfully supported and the copy has been proofread; approval should still follow the brand team's process.

**Needs review** for: offer-data conflict; ambiguous product/inclusion or audience; legal/currency claims; locked line lacking approved EN adaptation; quote/testimonial authenticity; content too long to fit original artwork; unidentified or illegible text from image.

## Recommendation for human approval sampling
Before fully automating a month, have a native-level editor review **one post of each type** (emotional brand, planning-fatigue humor, product conversion, FAQ/trust, story/reel, community reply). After sign-off, sample output regularly for drift into tourism clichés, mechanistic XSED language and overpromises.
