# Runtime English social policy

The application uses the corrected `randomtrip-en-social-transcreator` package supplied for this work, not only an installed desktop-agent skill. The runtime policy and the explicit reviewed-copy fixture live in `src/lib/ai/socialBrandPolicy.ts`; initial vision transcreation and feedback caption/artwork edits import the same policy.

## Authority and boundaries

- Current explicitly locked fields take precedence over examples and style suggestions. Preserve exact punctuation, capitalization and paragraphs independently for caption and artwork.
- Approved canonical brand lines apply only when intended. Proposed expressions are not universal payoffs, and a reviewed solo-travel example is not a template for every solo post.
- Product facts remain source-bound. Never universalize XSED mechanics or add unsupported flights, stays, meals, radius, timing, availability, hashtags or guarantees.
- Caption, headline, CTA and rationale have separate field boundaries. Editorial rationale is not publication copy.
- The De0IMw8jOGl mapping is selected only by explicit operator assignment. Copy locks are editorial constraints, **not Slack decisions or publication authorization**.

## Reviewed source package

The supplied source contains `SKILL.md` and `references/voice-and-positioning.md`, `glossary-and-payoffs.md`, `product-fact-guardrails.md`, `output-and-qa.md`, and `examples.md`. Runtime policy version: **2026-10-23**. The corrected examples file SHA-256 is `414ba2264c1716fcd42f85558138bb157e2da477ff92072ecfcae515a6e51bf4`; unlike the older repository agent-only copy, it includes the post-specific reviewed solo copy and explicit rationale boundary.

Tests assert exact four-paragraph caption/headline preservation, explicit selection, no unrelated-post substitution, and no rationale or unrequested hashtag leakage. Automated image editing is not a pixel-exact typesetter: final artwork still requires human visual review. Source assets are not overwritten.

## When changing the policy

Update the runtime policy, deterministic copy fixture and integrity tests together. Do not mark a generated output approved or apply a post-specific example solely because its topic resembles another post. An explicit assignment conflict requires a new reviewed assignment, not silent rewriting.
