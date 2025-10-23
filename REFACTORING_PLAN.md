# Schema Refactoring Plan: TripRequest + Package Models

## Overview

Split current `Trip` model into:

- **TripRequest**: User planning data (what user wants)
- **Package**: Tripper-created content (what tripper offers)

## New Schema Structure

### TripRequest Model

- **Purpose**: User planning data (preferences, filters, origin)
- **Fields**: type, level, originCountry, originCity, nights, pax, dates, filters, addons, pricing
- **Relations**: user, owner, package (assigned package)

### Package Model

- **Purpose**: Tripper-created trip content
- **Fields**: type, level, destinationCountry, destinationCity, hotels, activities, itinerary, pricing
- **Constraints**: minNights, maxNights, minPax, maxPax
- **Relations**: owner (tripper), tripRequests

## Migration Strategy

### Option 1: Fresh Start (Recommended)

1. Drop current database
2. Apply new schema
3. Update all code references
4. Re-seed with new data structure

### Option 2: Gradual Migration

1. Create new models alongside existing
2. Migrate data gradually
3. Update code to use new models
4. Remove old models

## Code Changes Required

### API Routes

- `/api/trips` → `/api/trip-requests`
- `/api/packages` (new)
- Update all trip-related endpoints

### Components

- `useSaveTrip` → `useSaveTripRequest`
- `TripperPlanner` → use Package data for tiers
- `TripDetails` → `TripRequestDetails`

### Database Queries

- Update all Prisma queries to use new models
- Update tripper-trips.ts to query packages instead of trips

## Benefits

1. **Clear separation** between user planning and tripper content
2. **Better matching** between user preferences and available packages
3. **Scalable** package management for trippers
4. **Flexible** content structure for packages

## Implementation Steps

1. ✅ Create new schema
2. 🔄 Update API routes
3. 🔄 Update components
4. 🔄 Update database queries
5. 🔄 Update types and interfaces
6. 🔄 Test and validate
