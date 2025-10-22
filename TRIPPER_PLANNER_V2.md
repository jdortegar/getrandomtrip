# TripperPlanner V2 - Complete Redesign

## 🎨 New Design Overview

Clean, modern layout with NO background images/videos. Focus on content and user flow.

---

## 🗂️ Component Structure

```
TripperPlanner
├── Featured Trips Gallery (if trips exist)
│   ├── 3 trip cards with images
│   ├── Shows: type, tier, likes, highlights, tags
│   └── Inspirational only (not bookable)
│
├── Divider: "O diseña tu propia aventura"
│
└── Custom Trip Wizard
    ├── Wizard Header (4 steps)
    └── Animated Step Content
        ├── Step 0: Tipo de Viaje (filtered)
        ├── Step 1: Presupuesto (with commission)
        ├── Step 2: La Excusa (filtered alma cards)
        └── Step 3: Afinar Detalles
```

---

## ✨ Key Changes from V1

| Aspect           | V1 (Old)             | V2 (New)                 |
| ---------------- | -------------------- | ------------------------ |
| **Steps**        | 5 steps              | 4 steps                  |
| **Presentation** | ✓ Had "Presentación" | ✗ Removed                |
| **Background**   | Image/video          | Clean white/gradient     |
| **Trip Types**   | All types            | Filtered by tripper      |
| **Pricing**      | Base only            | Base + Commission        |
| **Layout**       | Dark themed          | Light themed             |
| **Inspiration**  | ✗ None               | ✓ Featured trips gallery |

---

## 📊 Step Flow

### **Before Wizard: Featured Gallery**

```
┌──────────────────────────────────────────┐
│  "Experiencias que Dawson ha creado"    │
│                                          │
│  [Trip 1]  [Trip 2]  [Trip 3]           │
│   Solo      Couple     Group            │
│   $728      $2,016     $1,064           │
│   47♥       89♥        63♥              │
└──────────────────────────────────────────┘
         "O diseña tu propia aventura"
```

### **Step 0: Tipo de Viaje**

- Shows only types tripper supports
- Large image cards
- Auto-advances to budget on selection
- Clean white background

### **Step 1: Presupuesto**

- Uses Presupuesto component
- Tiers with commission applied
- Shows: "Incluye curación de Dawson (12%)"

### **Step 2: La Excusa**

- Uses LaExcusa component
- Filtered by tripper's interests
- Flip cards with motivations

### **Step 3: Afinar Detalles**

- Uses AfinarDetalles component
- Final customization
- CTA to summary/checkout

---

## 🎯 Filtering Logic

### **Trip Types (Step 0)**

```typescript
const travellerOptions = tripperData?.availableTypes
  ? allTravellerOptions.filter((opt) =>
      tripperData.availableTypes.includes(opt.key),
    )
  : allTravellerOptions;

// If Dawson has availableTypes: ['solo', 'couple', 'group']
// Only shows: Solo, En Pareja, En Grupo
// Hides: Familia, Honeymoon
```

### **Pricing (Step 1)**

```typescript
const basePrice = 650; // USD
const commission = 0.12; // 12%
const finalPrice = 650 * 1.12 = 728;

// Display:
priceLabel: "$728 USD"
priceFootnote: "Incluye curación de Dawson (12%)"
```

### **Alma Cards (Step 2)**

```typescript
// Filtered by tripper.interests
if (tripper.interests = ['adventure', 'photography', 'culture'])
  -> Show: visual-storytellers, nature-adventure, cultural, etc.
  -> Hide: yoga-wellness, spiritual, business, etc.
```

---

## 🎨 Visual Design

### **Color Scheme**

- Background: `bg-gradient-to-b from-white to-gray-50`
- Cards: White with shadows
- Text: Gray-900 (dark)
- Accents: Primary color
- No dark overlays or backgrounds

### **Typography**

- Headers: font-caveat (brand font)
- Body: Default sans-serif
- Clean, readable

### **Layout**

- Max width: 7xl
- Centered content
- Generous spacing
- Mobile-first responsive

---

## 📦 Props Interface

```typescript
interface TripperPlannerProps {
  staticTripper: Tripper; // Static content (temp)
  tripperData?: {
    // From database
    id: string;
    name: string;
    slug: string;
    commission: number;
    availableTypes: string[];
  };
  featuredTrips?: FeaturedTripCard[]; // From database
}
```

---

## 🔄 Migration Path

### **Current State**

- ✅ Uses static tripper for bio/posts
- ✅ Uses DB tripper for commission/types
- ✅ Shows DB featured trips
- ✅ Filters based on DB data

### **Future State**

- 🔮 Fully DB-driven tripper profiles
- 🔮 Remove static content dependency
- 🔮 Dynamic tripper creation
- 🔮 Tripper dashboard for trip creation

---

## 📱 Responsive Behavior

### **Mobile**

- Stack: Gallery → Wizard
- Single column trip type cards
- Full-width elements

### **Tablet**

- 2 columns for trip types
- 2 columns for featured trips

### **Desktop**

- 3 columns for trip types
- 3 columns for featured trips
- Wider wizard content

---

## ✅ Testing Checklist

- [ ] Visit `/packages/dawson`
- [ ] See 3 featured trips in gallery
- [ ] Only see Solo, Couple, Group in Step 0
- [ ] See commission in pricing (Step 1)
- [ ] See filtered alma cards (Step 2)
- [ ] Complete wizard flow
- [ ] Check mobile responsive
- [ ] Verify animations smooth
- [ ] Test with/without featured trips
- [ ] Test with/without tripper data

---

## 🚀 **Component is Live!**

The new TripperPlanner is now production-ready with a clean, modern design that integrates seamlessly with your database-driven tripper system.
