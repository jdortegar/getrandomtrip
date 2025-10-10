# 🐛 Debug Authentication & Trip Save Flow

## 🧪 Testing Steps

### **1. Start Dev Server**

```bash
npm run dev
```

App will run on: `http://localhost:3010`

### **2. Test Journey Flow**

1. Go to: `http://localhost:3010/journey/basic-config`
2. Fill in the form:
   - Select country and city
   - Select dates
   - Add preferences
   - Add some add-ons
3. Click "Revisar" button
4. Should redirect to `/login`

### **3. Test Registration**

Open **Browser DevTools** → **Console** tab

1. Fill registration form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
2. Click "Crear Cuenta"

**Expected Console Logs:**

```
Creating user: { name: 'Test User', email: 'test@example.com' }
User created successfully: { id: 'clxxx', name: 'Test User', email: 'test@example.com', ... }
```

### **4. Test Auto-Redirect**

After successful registration:

- ✅ Should redirect back to `/journey/summary`
- ✅ Journey data should be restored from localStorage

### **5. Test Trip Save**

On the summary page, check console for:

**Expected Console Logs:**

```
🚀 useSaveTrip: Starting save trip... { tripId: undefined }
📦 Store data: { type: 'couple', level: 'modo-explora', country: 'Argentina', city: 'Buenos Aires' }
📤 Sending to API: { ... full payload ... }
Finding user by email: test@example.com
User found: clxxx
Trip data received: { ... }
Creating new trip for user: clxxx
Trip created: clyyy
📥 API Response status: 201
✅ Trip saved successfully: { id: 'clyyy', status: 'DRAFT', ... }
```

### **6. Verify in Database**

```bash
npx prisma studio
```

Check:

- ✅ `users` table has 1 row
- ✅ `trips` table has 1 row
- ✅ Trip is linked to user (check `userId` field)

---

## 🚨 Common Issues

### **Issue 1: "Unauthorized" when saving trip**

**Cause:** NextAuth session not created properly

**Debug:**

```javascript
// In browser console
console.log(document.cookie); // Should see session cookie
```

**Fix:**

- Make sure `window.location.reload()` is called after login
- Check `.env.local` has correct `NEXTAUTH_URL` and `NEXTAUTH_SECRET`

### **Issue 2: "User not found" when saving trip**

**Cause:** NextAuth session email doesn't match database user email

**Debug:**

- Check console logs for "Finding user by email"
- Verify email in session matches email in database

**Fix:**

- Ensure registration and login use same email
- Check database for user: `SELECT * FROM users WHERE email = 'test@example.com';`

### **Issue 3: Trip not saving**

**Cause:** `useSaveTrip` hook not being called

**Debug:**

- Check console for "🚀 useSaveTrip: Starting save trip..."
- If not present, check useEffect in summary page

**Fix:**

- Verify `handleSaveTrip()` is called in useEffect
- Check authentication status: `console.log({ session, isAuthed })`

### **Issue 4: Journey data lost after login**

**Cause:** LocalStorage not persisting or not being restored

**Debug:**

```javascript
// In browser console
localStorage.getItem('getrandomtrip-storage');
```

**Fix:**

- Clear localStorage and try again
- Check persist middleware configuration
- Verify `partialize` function includes all needed fields

---

## ✅ Success Checklist

After completing the flow, you should see:

**In Console:**

- [ ] "Creating user" log
- [ ] "User created successfully" log
- [ ] "🚀 useSaveTrip: Starting save trip" log
- [ ] "Finding user by email" log
- [ ] "User found" log
- [ ] "Creating new trip for user" log
- [ ] "Trip created" log
- [ ] "✅ Trip saved successfully" log

**In Database (Prisma Studio):**

- [ ] 1 user in `users` table
- [ ] 1 trip in `trips` table
- [ ] Trip `userId` matches user `id`
- [ ] Trip has all journey data

**In localStorage:**

- [ ] Key `getrandomtrip-storage` exists
- [ ] Contains journey data (type, level, logistics, filters, addons)

---

## 🔍 Manual Database Check

```bash
# Connect to PostgreSQL
psql postgresql://dev:dev@localhost:5432/getrandomtrip

# Check users
SELECT id, name, email, "createdAt" FROM users;

# Check trips
SELECT id, "userId", type, level, country, city, status, "createdAt" FROM trips;

# Check relationship
SELECT
  u.name, u.email,
  t.type, t.level, t.country, t.city, t.status
FROM users u
LEFT JOIN trips t ON t."userId" = u.id;
```

---

**Last Updated:** October 10, 2025  
**Status:** Debug logging enabled
