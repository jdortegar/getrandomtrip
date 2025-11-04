# Netlify vs Vercel: Deployment Differences

## Why Vercel Passes but Netlify Requires Configuration

### Key Differences

1. **Native Integration**
   - **Vercel**: Created by Next.js team, has deep native integration
   - **Netlify**: Framework-agnostic, requires explicit plugin configuration

2. **Build Environment**
   - **Vercel**: Automatically sets `NODE_ENV=production` correctly
   - **Netlify**: May set non-standard `NODE_ENV` values, causing warnings
     - Solution: Explicitly set in `netlify.toml`

3. **Static Generation**
   - **Vercel**: More lenient with build-time static generation errors
   - **Netlify**: Stricter, treats warnings as potential failures
     - Solution: Mark dynamic routes with `export const dynamic = 'force-dynamic'`

4. **Plugin Requirement**
   - **Vercel**: No plugin needed
   - **Netlify**: Requires `@netlify/plugin-nextjs` for proper SSR/API route support

## Required Configuration for Netlify

### 1. Install Netlify Next.js Plugin

```bash
npm install --save-dev @netlify/plugin-nextjs
```

### 2. Create `netlify.toml`

See the root `netlify.toml` file for complete configuration.

Key settings:

- `NODE_VERSION = "18.x"` - Node 18+ required for Next.js 14
- `NODE_ENV = "production"` - Fixes non-standard NODE_ENV warning
- `@netlify/plugin-nextjs` - Required plugin for Next.js support

### 3. Mark Dynamic Routes

For pages that use client-side hooks (`useSession`, `useContext`, etc.):

```typescript
// In a server component layout or route segment config
export const dynamic = 'force-dynamic';
```

Or create a server component layout:

```typescript
// src/app/dashboard/tripper/layout.tsx
export const dynamic = 'force-dynamic';

import ClientLayout from './layout-client';

export default function Layout({ children }) {
  return <ClientLayout>{children}</ClientLayout>;
}
```

### 4. API Routes

For API routes using `headers()` or `getServerSession()`:

```typescript
// src/app/api/tripper/packages/route.ts
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // ... route handler
}
```

## Common Issues and Solutions

### Issue: "Non-standard NODE_ENV value"

**Solution**: Set `NODE_ENV = "production"` in `netlify.toml`

### Issue: "Cannot read properties of null (reading 'useContext')"

**Solution**: Mark pages using client hooks as dynamic via layout

### Issue: "Route couldn't be rendered statically because it used `headers`"

**Solution**: Add `export const dynamic = 'force-dynamic'` to API routes

### Issue: Build warnings treated as errors

**Solution**: Vercel is more lenient; Netlify is stricter - fix all warnings

## Deployment Checklist for Netlify

- [ ] `netlify.toml` configured with correct Node version
- [ ] `@netlify/plugin-nextjs` installed
- [ ] `NODE_ENV` explicitly set to "production"
- [ ] Dynamic routes marked with `export const dynamic = 'force-dynamic'`
- [ ] API routes using `headers()` marked as dynamic
- [ ] Client component pages have server component layouts with dynamic config
- [ ] All build warnings resolved (Netlify treats them more strictly)

## Why This Matters

While both platforms can host Next.js apps, Vercel's native integration means:

- ✅ Less configuration needed
- ✅ Automatic optimizations
- ✅ Better error messages
- ✅ Faster deployments

Netlify requires more setup but offers:

- ✅ Framework-agnostic approach
- ✅ More control over build process
- ✅ Different pricing/billing model
- ✅ Different ecosystem/integrations

Choose based on your needs, but ensure proper configuration for whichever platform you use.
