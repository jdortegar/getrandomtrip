# Delta for tripper

## ADDED Requirements

### Requirement: Carousel Attribution-Aware Fallback Cards
In `TravelerTypesCarousel`, available-type cards MUST link with a working attributed href. Unavailable-type cards MUST render (not be hidden) with a localized "visit RandomTrip experiences" label and a plain, non-attributed href. Clicking an unavailable-type card MUST NOT alter `referredByTripperId` or force any mode change — it is a reversible, per-card opt-out only.

(Previously: `filterCarouselCards` silently dropped any traveler type not in the tripper's `availableTypes` from the rendered list — no fallback card was shown, and the whole carousel could early-return `null` if the tripper offered nothing matching. The card `href` for every type, including offered ones, was unconditionally the plain `/experiences/by-type/${slug}` with no tripper param, so attribution broke on click even for available types.)

#### Scenario: Offered type carries attribution
- GIVEN a tripper offers "couple" and attribution is active for that tripper
- WHEN the carousel renders the "couple" card
- THEN its href includes the tripper's attribution and following it preserves that attribution

#### Scenario: Non-offered type renders a fallback, not nothing
- GIVEN a tripper does not offer "honeymoon" and attribution is active
- WHEN the carousel renders
- THEN a "honeymoon" card still renders with the localized RandomTrip-fallback label and a plain, non-attributed href

### Requirement: Pricing-Mode Banner and Toggle
When the active cookie attribution differs from what is currently displayed, a persistent, reversible, fully localized banner MUST let the visitor switch pricing mode by toggling the `grt_tripper` cookie only. It MUST NEVER write to `referredByTripperId`.

#### Scenario: Banner toggle changes cookie only
- GIVEN the displayed mode differs from the active cookie
- WHEN the visitor uses the banner toggle
- THEN `grt_tripper` changes and `referredByTripperId` (if any) is untouched
