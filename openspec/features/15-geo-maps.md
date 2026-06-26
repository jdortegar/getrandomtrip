# Geo / Maps

**Status**: Complete
**Priority**: Low

## Purpose

Provides geographic lookup and autocomplete for destination and location fields throughout the app. Countries come from the Mapbox Geocoding API; city search uses either Mapbox or Google Places Autocomplete depending on context. An in-memory module-scope cache reduces redundant API calls per server instance.

## What's Implemented

- `GET /api/geo/countries` and `GET /api/geo/cities` via Mapbox Geocoding API
- Module-scope in-memory cache with bilingual support
- `CountrySelector` component for country dropdowns
- `GooglePlacesAutocomplete` component for city/location freetext search

## Gaps

- [ ] Cache resets on every cold start — no TTL or persistent cache (Redis); high-traffic or serverless environments will hit the Mapbox API on every new instance
- [ ] `GooglePlacesAutocomplete` and the Mapbox routes coexist without a clear decision on which is authoritative — dual dependency and inconsistent UX
- [ ] No feedback in the UI when city lookup is disabled due to a missing country selection
- [ ] Destination fields are free-text — no geo lookup or validation for the `actualDestination` field on trip reveal, or the tripper's base location field

## Out of Scope

- Map rendering on public pages (beyond the placeholder noted in Trip Booking)
- Route or distance calculation between destinations
