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

#### Scenario: A tripper who offers nothing still shows a full fallback row, not a hidden section
- GIVEN a tripper has zero ACTIVE experiences (`availableTypes` is empty)
- WHEN any host component embeds `TravelerTypesCarousel` for that tripper (e.g. the tripper's public profile page)
- THEN the section still renders and every card renders as a fallback (non-attributed href, RandomTrip-fallback label) — no host component may re-introduce an `if (!availableTypes?.length) return null`-style guard above the carousel that hides the whole section instead of showing the fallback row

(Found during PR3 apply: `TripperTravelerTypesSection` — the tripper-profile-page wrapper around `TravelerTypesCarousel` — had its own separate `if (!availableTypes?.length) return null` guard, independent of the one removed from `TravelerTypesCarousel` itself. A tripper with zero offerings still hid the entire section, defeating the fallback-row requirement above one layer up. Fixed by removing that guard too.)

### Requirement: Pricing-Mode Banner and Toggle
When the active cookie attribution differs from what is currently displayed, a persistent, reversible, fully localized banner MUST let the visitor switch pricing mode by toggling the `grt_tripper` cookie only. It MUST NEVER write to `referredByTripperId`.

#### Scenario: Banner toggle changes cookie only
- GIVEN the displayed mode differs from the active cookie
- WHEN the visitor uses the banner toggle
- THEN `grt_tripper` changes and `referredByTripperId` (if any) is untouched
