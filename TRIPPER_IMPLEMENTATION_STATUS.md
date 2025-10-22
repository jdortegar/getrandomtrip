# Tripper System Implementation Status

## ✅ Completed

### 1. Database Schema (Prisma)

- ✅ Added `UserRole` enum (CLIENT, TRIPPER, ADMIN)
- ✅ Added `OwnerType` enum (CUSTOMER, TRIPPER, ADMIN)
- ✅ Updated User model with tripper fields:
  - `tripperSlug` (unique identifier)
  - `commission` (percentage rate)
  - `availableTypes` (supported trip types)
- ✅ Updated Trip model with ownership fields:
  - `ownerId`, `ownerType`
  - `isTemplate`, `isFeatured`, `likes`
  - `title`, `teaser`, `description`, `heroImage`
  - `tags`, `highlights`
- ✅ Created `TripLike` model for like system
- ✅ Created migration file (safe role migration)

### 2. TypeScript Types

- ✅ Created `/src/types/tripper.ts` with:
  - `TripperProfile`
  - `FeaturedTrip`
  - `FeaturedTripCard`
  - `TripperPlannerData`
  - `TripLike`

### 3. Database Queries

- ✅ Created `/src/lib/db/tripper-queries.ts` with:
  - `getTripperBySlug()` - Fetch tripper profile
  - `getTripperFeaturedTrips()` - Get 3 most liked trips
  - `getAllTrippers()` - List all trippers
  - `toggleTripLike()` - Like/unlike functionality
  - `hasUserLikedTrip()` - Check like status
  - `getTripById()` - Get trip with owner info

### 4. UI Components

- ✅ Created `TripperInspirationGallery` component:
  - Displays 3 featured trips
  - Shows type & tier badges
  - Displays likes, highlights, tags
  - Beautiful card design with images

---

## 🚧 In Progress / TODO

### 5. Apply Migration

```bash
# Run this command:
npx prisma migrate dev
```

### 6. Update TripperPlanner Component

**Current:** Uses static tripper content from `/src/content/trippers.ts`
**Needed:**

- Accept `featuredTrips` prop from database
- Accept `tripperData` from database (commission, availableTypes)
- Add `TripperInspirationGallery` at the top
- Filter traveller types by `availableTypes`
- Apply commission to tier prices

### 7. Update Tripper Page

**File:** `/src/app/packages/(tripper)/[tripper]/page.tsx`
**Needed:**

- Fetch tripper from database using `getTripperBySlug()`
- Fetch featured trips using `getTripperFeaturedTrips()`
- Pass data to components
- Handle 404 if tripper not found

---

## 📋 Implementation Plan

### Step 1: Apply Migration ⏳

```bash
cd /Users/jdortega/repos/getrandomtrip
npx prisma migrate dev
npx prisma generate
```

### Step 2: Seed Test Data

Create a test tripper in database:

```typescript
// prisma/seed.ts or manual DB insert
{
  email: "dawson@randomtrip.com",
  name: "Dawson Belair",
  role: "TRIPPER",
  tripperSlug: "dawson",
  commission: 0.12, // 12%
  availableTypes: ["solo", "couple", "group"],
  interests: ["adventure", "photography", "urban exploration"]
}
```

Create test featured trips for Dawson:

```typescript
{
  userId: adminId,
  ownerId: dawsonId,
  ownerType: "TRIPPER",
  isFeatured: true,
  isTemplate: true,
  status: "COMPLETED",
  title: "Aventura Urbana Misteriosa",
  teaser: "Una inmersión cultural en una ciudad vibrante",
  heroImage: "/images/trips/dawson-urban.jpg",
  type: "solo",
  level: "modo-explora",
  highlights: ["3 noches", "Hotel boutique", "Guía local"],
  tags: ["adventure", "urban", "culture"],
  likes: 47,
  // ... other required fields
}
```

### Step 3: Update TripperPlanner Props

```typescript
// src/components/tripper/TripperPlanner.tsx
interface TripperPlannerProps {
  tripper: {
    name: string;
    slug: string;
    commission: number;
    availableTypes: string[];
    interests: string[];
  };
  featuredTrips: FeaturedTripCard[];
}
```

### Step 4: Integrate TripperInspirationGallery

Add at the top of TripperPlanner:

```typescript
{featuredTrips.length > 0 && (
  <TripperInspirationGallery
    trips={featuredTrips}
    tripperName={tripper.name}
  />
)}
```

### Step 5: Filter Traveller Types

```typescript
const travellerOptions = allTravellerOptions.filter((opt) =>
  tripper.availableTypes?.includes(opt.key),
);
```

### Step 6: Apply Commission to Prices

```typescript
const calculateTripperPrice = (basePrice: number) => {
  const commission = tripper.commission || 0;
  const final = basePrice * (1 + commission);
  return {
    display: `$${final.toFixed(0)} USD`,
    footnote: `Incluye curación de ${tripper.name} (${commission * 100}%)`,
    base: basePrice,
    commissionAmount: basePrice * commission,
    total: final,
  };
};
```

### Step 7: Update Tripper Page

```typescript
// src/app/packages/(tripper)/[tripper]/page.tsx
export default async function TripperPage({ params }) {
  const { tripper } = params;

  // Fetch from database
  const tripperData = await getTripperBySlug(tripper);
  const featuredTrips = await getTripperFeaturedTrips(tripper);

  if (!tripperData) {
    notFound();
  }

  return (
    <>
      <TripperHero tripper={tripperData} />
      <TripperPlanner
        tripper={tripperData}
        featuredTrips={featuredTrips}
      />
    </>
  );
}
```

---

## 🎯 Next Steps

1. **Apply migration** → `npx prisma migrate dev`
2. **Seed test data** → Create Dawson tripper + 3 featured trips
3. **Update TripperPlanner** → Add gallery + filter logic
4. **Update tripper page** → Fetch from DB instead of static content
5. **Test the flow** → Verify everything works
6. **Add admin panel** → For trippers to create featured trips

---

## 📝 Notes

- Featured trips are **inspirational only** (not directly bookable)
- User still goes through wizard to customize their trip
- Commission is added transparently to prices
- Likes are tracked per user (requires auth)
- Tripper content from `/src/content/trippers.ts` will eventually be replaced by DB data

---

## 🔗 Related Files

- `/prisma/schema.prisma` - Database schema
- `/prisma/migrations/20251021214611_add_tripper_ownership_and_featured_trips/migration.sql` - Migration
- `/src/types/tripper.ts` - TypeScript types
- `/src/lib/db/tripper-queries.ts` - Database queries
- `/src/components/tripper/TripperInspirationGallery.tsx` - Gallery component
- `/src/components/tripper/TripperPlanner.tsx` - Main planner (needs update)
- `/src/app/packages/(tripper)/[tripper]/page.tsx` - Page route (needs update)
