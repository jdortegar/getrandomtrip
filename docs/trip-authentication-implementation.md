# Trip Authentication & Save Implementation

## 📋 Overview

This document outlines the implementation of **Option B: Login at Summary** for the journey flow, including a complete trip save system.

---

## 🎯 Authentication Flow

### **Journey Flow with Authentication**

```
1. Home (/) → Public ✅
   ↓
2. Basic Config (/journey/basic-config) → Public ✅
   - Step 1: Logistics (country, city, dates, nights, pax)
   - Step 2: Preferences (filters like transport, climate, etc.)
   - Step 3: Add-ons (extras)
   ↓
3. Summary (/journey/summary) → REQUIRES LOGIN 🔒
   - Auto-saves trip as DRAFT
   - Shows "Guardado" indicator
   - Review all selections
   - See total price
   - [Button: "Continuar a pago"]
   ↓
4. Checkout (/journey/checkout) → REQUIRES LOGIN 🔒
   - Updates trip status to PENDING_PAYMENT
   - Payment gateway selection
   - [Button: "Pagar ahora (demo)"]
   ↓
5. Confirmation (/journey/confirmation) → REQUIRES LOGIN 🔒
   - Updates trip status to CONFIRMED
   - Shows booking confirmation
   - "Ir a Mis Viajes" (Dashboard)
```

---

## 🗄️ Database Schema

### **New Trip Model**

```prisma
model Trip {
  id        String     @id @default(cuid())
  userId    String
  status    TripStatus @default(DRAFT)

  // Journey metadata
  from  String? // 'tripper' | ''
  type  String // 'couple' | 'family' | 'group' | 'solo' | 'honeymoon' | 'paws'
  level String // 'essenza' | 'modo-explora' | 'explora-plus' | 'bivouac' | 'atelier-getaway'

  // Logistics
  country   String
  city      String
  startDate DateTime?
  endDate   DateTime?
  nights    Int       @default(1)
  pax       Int       @default(1)

  // Filters
  transport          String   @default("avion")
  climate            String   @default("indistinto")
  maxTravelTime      String   @default("sin-limite")
  departPref         String   @default("indistinto")
  arrivePref         String   @default("indistinto")
  avoidDestinations  String[] @default([])

  // Addons (JSON for flexibility)
  addons Json? // AddonSelection[]

  // Pricing
  basePriceUsd   Float  @default(0)
  displayPrice   String @default("")
  filtersCostUsd Float  @default(0)
  addonsCostUsd  Float  @default(0)
  totalPerPaxUsd Float  @default(0)
  totalTripUsd   Float  @default(0)

  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  payment Payment?

  @@map("trips")
}

enum TripStatus {
  DRAFT              // Initial save from summary page
  SAVED              // User explicitly saved
  PENDING_PAYMENT    // User clicked "Continuar a pago"
  CONFIRMED          // Payment completed
  REVEALED           // Destination revealed (48h before)
  COMPLETED          // Trip completed
  CANCELLED          // User cancelled
}
```

### **Updated User Model**

```prisma
model User {
  // ... existing fields
  trips         Trip[]
  bookings      Booking[]
  reviews       Review[]
  // ...
}
```

### **Updated Payment Model**

```prisma
model Payment {
  // ... existing fields
  tripId               String?       @unique
  bookingId            String?       @unique
  // ...
  trip                 Trip?         @relation(...)
  booking              Booking?      @relation(...)
}
```

---

## 🔌 API Endpoints

### **POST /api/trips**

Create or update a trip.

**Request Body:**

```json
{
  "id": "optional-trip-id-for-update",
  "from": "",
  "type": "couple",
  "level": "modo-explora",
  "country": "Argentina",
  "city": "Buenos Aires",
  "startDate": "2025-11-01T00:00:00.000Z",
  "endDate": "2025-11-05T00:00:00.000Z",
  "nights": 4,
  "pax": 2,
  "transport": "avion",
  "climate": "templado",
  "maxTravelTime": "5h",
  "departPref": "manana",
  "arrivePref": "tarde",
  "avoidDestinations": ["Mexico", "Peru"],
  "addons": [{ "id": "dinner", "qty": 2, "optionId": "gourmet" }],
  "basePriceUsd": 800,
  "displayPrice": "USD 800",
  "filtersCostUsd": 50,
  "addonsCostUsd": 200,
  "totalPerPaxUsd": 625,
  "totalTripUsd": 1250,
  "status": "SAVED"
}
```

**Response:**

```json
{
  "trip": {
    "id": "clxxx123",
    "status": "SAVED",
    "createdAt": "2025-10-10T...",
    "updatedAt": "2025-10-10T..."
  }
}
```

### **GET /api/trips**

Get all trips for the authenticated user.

**Response:**

```json
{
  "trips": [
    {
      "id": "clxxx123",
      "type": "couple",
      "level": "modo-explora",
      "country": "Argentina",
      "city": "Buenos Aires",
      "status": "SAVED",
      "totalTripUsd": 1250,
      "createdAt": "2025-10-10T...",
      "payment": null
    }
  ]
}
```

### **GET /api/trips/[id]**

Get a specific trip by ID.

**Response:**

```json
{
  "trip": {
    "id": "clxxx123",
    "type": "couple",
    // ... all trip fields
    "payment": null
  }
}
```

### **DELETE /api/trips/[id]**

Delete a trip.

**Response:**

```json
{
  "message": "Trip deleted successfully"
}
```

---

## 🎨 Frontend Implementation

### **Custom Hook: useSaveTrip**

```typescript
// src/hooks/useSaveTrip.ts
import { useState } from 'react';
import { useStore } from '@/store/store';

export function useSaveTrip() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const store = useStore();

  const saveTrip = async (tripId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        id: tripId,
        from: store.from,
        type: store.type,
        level: store.level,
        country: store.logistics.country,
        city: store.logistics.city,
        // ... map all store fields to API payload
      };

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save trip');
      }

      const data = await response.json();
      return data.trip;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save trip');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { saveTrip, isLoading, error };
}
```

### **Summary Page Protection**

```typescript
// src/app/journey/summary/page.tsx
export default function SummaryPage() {
  const { data: session, status } = useSession();
  const { isAuthed } = useUserStore();
  const { saveTrip } = useSaveTrip();
  const [savedTripId, setSavedTripId] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return;

    if (!session && !isAuthed) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/login?returnTo=${encodeURIComponent(currentPath)}`);
    }
  }, [session, isAuthed, status, router]);

  // Auto-save trip when user arrives (if authenticated)
  useEffect(() => {
    if ((session || isAuthed) && !savedTripId) {
      handleSaveTrip();
    }
  }, [session, isAuthed]);

  const handleSaveTrip = async () => {
    try {
      const trip = await saveTrip(savedTripId || undefined);
      setSavedTripId(trip.id);
    } catch (error) {
      console.error('Failed to save trip:', error);
    }
  };

  // Show loading while checking auth
  if (status === 'loading') {
    return <LoadingState />;
  }

  // Don't render if not authenticated
  if (!session && !isAuthed) {
    return null;
  }

  // ... rest of component
}
```

---

## 🔐 Authentication Guards

All protected pages use the same pattern:

1. **Check session** using `useSession()` from `next-auth/react`
2. **Check Zustand auth** using `useUserStore()`
3. **Redirect to login** with `returnTo` parameter if not authenticated
4. **Show loading state** while checking authentication
5. **Return null** if not authenticated (will redirect)

### **Protected Pages:**

- ✅ `/journey/summary`
- ✅ `/journey/checkout`
- ✅ `/journey/confirmation`

---

## 🚀 Next Steps

### **Database Migration**

```bash
# Generate migration
npx prisma migrate dev --name add_trip_model

# Apply migration
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### **Environment Variables**

Ensure `DATABASE_URL` is set in `.env.local`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/randomtrip"
```

### **Testing Checklist**

1. **Anonymous User Flow:**
   - [ ] Can access home page
   - [ ] Can configure journey in basic-config
   - [ ] Redirected to login at summary page
   - [ ] After login, returned to summary page
   - [ ] Trip auto-saved as DRAFT

2. **Authenticated User Flow:**
   - [ ] Can access summary page directly
   - [ ] See "Guardado" indicator
   - [ ] Trip saved to database
   - [ ] Can continue to checkout
   - [ ] Trip status updated to PENDING_PAYMENT
   - [ ] Can complete payment (demo)
   - [ ] Trip status updated to CONFIRMED
   - [ ] Can access confirmation page

3. **API Testing:**
   - [ ] POST /api/trips creates new trip
   - [ ] POST /api/trips updates existing trip
   - [ ] GET /api/trips returns user's trips
   - [ ] GET /api/trips/[id] returns specific trip
   - [ ] DELETE /api/trips/[id] deletes trip
   - [ ] Unauthorized users get 401

4. **Edge Cases:**
   - [ ] Session expires during journey
   - [ ] Network error during save
   - [ ] Duplicate trip creation prevented
   - [ ] Trip ownership verified on all operations

---

## 📝 Notes

### **Why This Approach?**

1. **Better UX**: Users can explore and configure without login friction
2. **Data Capture**: All journey data is saved when user commits
3. **Abandonment Recovery**: Can send reminders for DRAFT trips
4. **Analytics**: Track conversion funnel from config to payment
5. **State Persistence**: Trip data persists across sessions

### **Future Enhancements**

- **Draft Auto-Save**: Save draft every N seconds while configuring
- **Trip History**: Show previous trips in dashboard
- **Trip Sharing**: Generate shareable links for trips
- **Trip Templates**: Save configurations as templates
- **Email Notifications**: Send confirmation emails
- **Payment Integration**: Integrate real payment provider
- **Destination Reveal**: Implement 48h reveal logic

---

## 🐛 Troubleshooting

### **Common Issues**

1. **"Unauthorized" error when saving trip**
   - Ensure user is authenticated
   - Check NextAuth session configuration
   - Verify API route has proper session check

2. **Trip not auto-saving**
   - Check browser console for errors
   - Verify `useSaveTrip` hook is called
   - Check network tab for API calls

3. **Infinite redirect loop**
   - Ensure `status === 'loading'` check is present
   - Verify `returnTo` URL is not the login page itself

4. **Prisma Client errors**
   - Run `npx prisma generate`
   - Ensure database migration is applied
   - Check database connection string

---

## ✅ Implementation Checklist

- [x] Create Trip model in Prisma schema
- [x] Add TripStatus enum
- [x] Update User model with trips relation
- [x] Update Payment model to support trips
- [x] Create Prisma client utility
- [x] Create POST /api/trips endpoint
- [x] Create GET /api/trips endpoint
- [x] Create GET /api/trips/[id] endpoint
- [x] Create DELETE /api/trips/[id] endpoint
- [x] Create useSaveTrip hook
- [x] Add authentication to /journey/summary
- [x] Add auto-save functionality to summary page
- [x] Add "Guardado" indicator
- [x] Add authentication to /journey/checkout
- [x] Add authentication to /journey/confirmation
- [x] Update payNow to update trip status
- [ ] Run database migration
- [ ] Test complete flow
- [ ] Update dashboard to show saved trips

---

**Last Updated:** October 10, 2025  
**Status:** ✅ Implementation Complete - Ready for Testing
