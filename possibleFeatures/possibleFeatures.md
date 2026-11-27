# Possible Features

Backlog of feature ideas under consideration. Each entry has a status, owner for review, and open decisions.

---

## 1. "Share your destination" (Instagram, post-reveal)

- **Status:** Proposal — pending review
- **Reviewer:** Carla Vazquez
- **Category:** UX / UI, Copy
- **Priority:** Medium
- **Estimate:** ~1 day of dev (post-reveal version, no incentive)

### Goal

Grow the Instagram account (@getrandomtrip, ~180 followers as of 2026-11-19) by using the most shareable moment in the product: the destination reveal.

### How it works

1. After the reveal animation, the trip page (`src/app/[locale]/(secure)/dashboard/trips/[id]/reveal/page.tsx`, post-reveal state → `TripItineraryContent`) shows a **"Share my destination"** button.
2. Tapping it generates a Story-format image (1080×1920):

   ```
   ┌───────────────────┐
   │  [destination     │
   │   city photo]     │
   │                   │
   │   I DIDN'T KNOW   │
   │   WHERE I WAS     │
   │   GOING…          │
   │                   │
   │   BARILOCHE 🏔     │
   │                   │
   │  @getrandomtrip   │
   │  getrandomtrip.com│
   └───────────────────┘
   ```

   - Destination only — **no dates, hotel or flights** (security: don't broadcast when the home is empty).
   - Localized (ES / EN) based on the user's locale.

3. **Mobile:** native share sheet (Web Share API with file) → Instagram (Story / post / DM) or WhatsApp.
4. **Desktop fallback:** download the image + copy a ready-made caption, e.g. _"Me tocó un viaje sorpresa con @getrandomtrip y es Bariloche 🤯 #RandomTrip"_.

### Limitation

Instagram doesn't let a website post the Story or add the mention sticker automatically. The @ on the image is visible but doesn't notify or link. After sharing, show a nudge: _"Add the @getrandomtrip mention so we can repost you."_ Reposts are what actually bring followers.

### Optional extras

- **Pre-reveal teaser:** from the countdown screen, share a card like _"My destination is revealed in 2 days 🤫 Guess where I'm going?"_ — drives guessing/engagement.
- **Incentive:** "Tag us → X% off your next trip" or a monthly draw. Manual verification; tagged posts could feed the existing admin social-approvals import.
- **Tracking:** analytics events for share clicked / share completed.

### Implementation sketch

| Piece | Where |
| --- | --- |
| Image generator (auth-guarded, owner only) | `src/app/api/trips/[id]/share-image/route.ts` using `next/og` `ImageResponse`, reusing `/api/city-image` for the photo |
| Share button + fallback | `src/components/app/dashboard/traveler/ShareDestinationButton.tsx` |
| Copy | new `tripShare` section in `src/dictionaries/es.json` + `en.json`, type in `src/lib/types/dictionary.ts` |

### Open decisions

- [ ] Include the pre-reveal teaser in v1?
- [ ] Offer an incentive for tagging? Which one?
- [ ] Final copy for image and caption (ES / EN)
- [ ] Story image design

### Related growth actions (context, non-dev)

- 3–4 Reels per week (reveal reactions, "where would you go without knowing where?", tripper tips)
- Collab posts with trippers
- Giveaway: follow + tag 2 friends
- USD 5–10/day boosts only on Reels that already performed organically (AR/LatAm, 22–40, travel interests)
- Don't buy followers
