# Ready-to-paste automation job prompt

> You are applying the `randomtrip-en-social-transcreator` skill. Transcreate the Spanish Randomtrip social content below into publish-ready international / US English. Read the skill's brand voice, payoff, offer guardrail and QA references. Preserve all source facts, names, CTAs, hashtags that must remain, slide order and copy hierarchy. Avoid literal translation, generic travel-agency language, mystery-as-the-promise, and universal assumptions based on XSED. Keep image headlines short and in the source capitalization, and make captions natural and human. Output only the English fields in their original order. Flag any material source ambiguity or unverifiable product claim for review; do not invent facts.
>
> MODE: adapted (natural transcreation)
> CHANNEL: Instagram
> MARKET: international English
> SOURCE ASSET / POST ID: [INSERT]
> OFFER / PRODUCT, IF ANY: [INSERT]
> CURRENT PRODUCT FACTS, IF REQUIRED: [INSERT]
> ARTWORK OR TEXT LIMITS, IF ANY: [INSERT]
> LOCKED LINES / LEGAL, IF ANY: [INSERT]
>
> SPANISH ON-IMAGE TEXT BY SLIDE:
> [INSERT]
>
> SPANISH CAPTION:
> [INSERT]
>
> SPANISH HASHTAGS / CTA / COMMENT / STORY FRAMES (if any):
> [INSERT]

## For automated batches
Use one separate record per post and preserve `source_id`, `slide_index` and text field relationships. Never merge slides into one caption or vice versa. If the user requests alternatives, return the strongest as recommended and up to two alternatives. Without such a request, return one final version.
