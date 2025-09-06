# Randomtrip — Guidelines (Definitivo)

> **Objetivo:** mantener consistencia técnica y de UX mientras el proyecto evoluciona.

---

## 1) Stack y principios

- **Next.js 14 (App Router), TypeScript estricto, Tailwind, Zustand**.
- **Accesibilidad y contraste por defecto** (tema independiente del navegador).
- **Performance budget**: LCP < 2.5s en páginas clave, CLS ~0, TBT bajo.
- **DX**: type‑safe, rutas limpias, componentes reutilizables, estilos consistentes.

---

## 2) Estructura de carpetas (resumen)

```
frontend/
  src/
    app/                # App Router
      (públicas)
      profile/
      tripper/
      u/[handle]/
      journey/
      packages/
    components/
      common/           # Img, SafeImage, etc.
      user/             # PageContainer, SectionCard, StatCard
      tripper/          # Tripper OS
      by-type/          # variantes de marketing/landing
    lib/                # helpers (roles.ts, format.ts, etc.)
    store/              # Zustand (userStore)
    styles/             # rt.css y estilos globales
```

---

## 3) Estado y Tipos

- **`userStore` (Zustand)**  
  - Types:
    - `TravelerType = 'solo' | 'pareja' | 'familia' | 'amigos' | 'empresa'`
    - `BudgetLevel = 'low' | 'mid' | 'high'`
    - `UserRole = 'client' | 'tripper' | 'admin'`
    - `User`, `UserPrefs`, `UserSocials`, `UserMetrics`
  - Acciones: `updateAccount(name?,email?)`, `upsertPrefs(partial)`.
  - **Inicial**: `prefs: { interests: [], dislikes: [] }` para evitar crashes en mapeos.
- **No uses `getState()` en componentes**; preferí `useUserStore()` y selectores.

---

## 4) Rutas y Guards

- **Auto‑redirect en `/login`**:
  - Si authed ⇒ `search.returnTo ?? dashboardPathFromRole(role)` via `router.replace()`.
  - `useSearchParams()` **siempre bajo `<Suspense>`**.
- **TripperGuard** en `app/tripper/layout.tsx`:
  - `!isAuthed` ⇒ `/login?returnTo=/tripper`.
  - `isAuthed && role!=='tripper'` ⇒ `/dashboard`.
- **Perfil público**: `/u/[handle]` (renderiza desde store demo; futuro: backend).

---

## 5) UI/UX

- **Contraste y tema**:  
  - `<body class="bg-neutral-50 text-neutral-900 antialiased">`  
  - `<meta name="color-scheme" content="light">`
- **Header sticky** con `data-site-header` + `SiteHeaderOffset` (CSS var `--rt-header-h`).
- **Botones y Badges**: clases `rt-btn`, `rt-badge` (mantener semántica/consistencia).
- **Copiable**: si `publicProfile` y `handle`, mostrar enlace a `/u/[handle]`.
- **Estados vacíos**: textos de fallback (“No especificado”, “Ninguno”, “—”).

---

## 6) Imágenes

- Usar **`<Image>` de Next.js** o el wrapper **`<Img>`** (preferido).
  - `next.config.js`: `remotePatterns` debe incluir `placehold.co` (y otros CDNs usados).
  - Si usás `fill`, contenedor `relative` + alto fijo (`h-*`) + `sizes="100vw"`.
  - Evitar `<img>` nativo (regla ESLint `@next/next/no-img-element`).

---

## 7) Accesibilidad (A11y)

- Texto alternativo en imágenes (`alt`).
- Contrastes AA (Tailwind neutrals ya configurados).
- Focus visible; no bloquear TAB.
- `aria-*` en componentes interactivos cuando aplique.

---

## 8) Performance

- Evitar imágenes gigantes; setear `sizes` y/o `quality` cuando corresponda.
- **Code‑splitting** en páginas pesadas; `React.lazy`/`dynamic()` si aplica.
- Reutilizar componentes; evitar re-renders con selectores de Zustand.

---

## 9) SEO y Metadatos

- Añadir `metadata` por ruta (App Router).
- OG básico para `/u/[handle]` y páginas de paquetes.
- Evitar indexar rutas privadas con `robots`/`noindex`.

---

## 10) Seguridad

- No exponer secretos en cliente.
- Validación de inputs (server‑side cuando haya backend).
- Sanitizar HTML de terceros.
- CSP y headers seguros (en plataforma de hosting).

---

## 11) Testing & QA

- **Typecheck** obligatorio (`npm run typecheck`).
- **Lint** (`npm run lint`).
- E2E/criticos: auth redirects, TripperGuard, `/u/[handle]` 404 vs OK, journey checkout.
- Visual: contrastes, focus, responsive.

---

## 12) Contribución y Git

- Convención de commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`…
- PRs pequeñas, con checklist (typecheck, lint, screenshots cuando aplique).
- Issue templates para bugs/features.

---

## 13) Deploy

- **Netlify** (actual). Revisar envs en panel.
- Builds deben pasar `typecheck` y ESLint (warnings aceptables, errores no).
- Reglas de redirect/headers si se agregan rutas backend en el futuro.

---

## 14) Roadmap (próximos)

- Auth real + roles desde backend.
- PSP (Stripe) + facturación.
- SSG/SSR de `/u/[handle]` y `packages` con datos reales.
- i18n.
- Observabilidad (Sentry/Logflare) y analítica (Plausible/GA).

---

**Última actualización**: posterior a la integración de auto‑redirect, TripperGuard y `/u/[handle]`.
