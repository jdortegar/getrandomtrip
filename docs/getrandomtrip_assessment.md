# Assessment Técnico (Actualizado) — GetRandomTrip

> Estado al día de hoy tras el trabajo reciente (login/profile flow, TripperGuard, /u/[handle], migración `<img>`→`<Image>`, contraste y layout, `next.config.js`, tipos del store y Navbar).

## 📌 Resumen ejecutivo

GetRandomTrip presenta una base sólida con **Next.js 14 (App Router)**, una **UI consistente con Tailwind**, y **flujos de sesión** más claros (auto–redirect por rol, edición de perfil, vista pública por handle y guardas de Tripper). El foco ahora pasa de “hacerlo funcionar” a **cerrar deuda técnica** (seguridad, QA, SEO/Performance, observabilidad) y **terminar el MVP** end‑to‑end: funnels de compra, onboarding, y tooling de Tripper (Tripper OS).

**Prioridades inmediatas (1–2 sprints):**

1. Consolidar Auth + guards globales y `returnTo` (terminado en /login, replicar en páginas sensibles).
2. QA/Testing base (Playwright + Jest + Testing Library).
3. Observabilidad mínima (Sentry + logs estructurados + manejo de errores).
4. SEO/Perf baseline (Lighthouse, sitemap, metadatos, `next/image` ya migrado).
5. “Happy paths” completos de cliente (explorar → configurar → pagar) y Tripper (panel básico).

---

## ✅ Cambios recientes (destacados)

- **/login**: modal de auth + **auto–redirect** por rol y `?returnTo=...`. Añadido `Suspense` para `useSearchParams`.
- **TripperGuard**: bloqueo de `/tripper` si no es `tripper`, con redirección a `/login?returnTo=/tripper` o `/dashboard`.
- **Perfil**:
  - **/profile** (vista autogestionada con banda contextual y stats desde el store).
  - **/profile/edit** (edición tipada: `TravelerType`, `BudgetLevel`, `publicProfile` toggle).
  - **/u/[handle]** (vista pública con `notFound()` si no hay match).
- **UI/Accesibilidad/Perf**:
  - Migración total **`<img>`→`<Image>`** mediante componente `Img.tsx` (wrapper con fallbacks); `next.config.js` permite `placehold.co`.
  - Contraste controlado y **layout independiente del tema del navegador** (`<meta name="color-scheme" content="light">`, `SiteHeaderOffset`, `rt-page`).
  - Navbar con **avatar estable** y accesos coherentes: “Mi perfil público”, “Editar perfil”, “Mi panel”, “Panel de Tripper (condicional)”.
- **Tipos/Store**: `UserRole`, `UserPrefs` extendidos (`country`, `verified`, `bio`, `publicProfile`, `socials`, `metrics`); acciones `updateAccount`, `upsertPrefs`.
- **Higiene**: limpieza de imports duplicados y warnings de TypeScript, y arreglo de compilación por `useSearchParams` con Suspense.

---

## ⚠️ Deuda técnica y riesgos

1. **Auth real** (hoy mock/placeholder): NextAuth/Clerk/Auth0 + roles server‑side + protección de API.
2. **Datos**: definir modelo y persistencia (Prisma + Postgres).
3. **Pagos**: Stripe para checkout y webhooks (fraude, idempotencia).
4. **Observabilidad**: sin Sentry/logs/metrics aún.
5. **SEO y contenidos**: metadata dinámica por página, OGs, sitemap, i18n.
6. **QA**: cobertura baja, sin E2E ni contract tests.
7. **Accesibilidad**: foco/tab order, ARIA, contrastes extremos.
8. **Performance**: rutas con muchos componentes; vigilar Core Web Vitals; cacheado de datos.

---

## 🎯 Roadmap sugerido (por sprint)

### Sprint 1 — “Cierre base de plataforma”

- **Auth**: NextAuth + proveedores (email magic link + Google). Sesión server‑side y cookie segura.
- **Guards/Redirect**: middleware por rol, consolidar `returnTo`.
- **Observabilidad**: Sentry (cliente/servidor) + logger pino en API + páginas de error.
- **Testing base**: Jest + React Testing Library + Playwright smoke (home, login, profile, tripper).
- **SEO/Perf baseline**: Lighthouse automatizado (CI), sitemap, robots, metadatos por ruta.
- **Docs**: README, Guidelines, UserFlow (actualizados).

### Sprint 2 — “Checkout y datos”

- **Stripe**: checkout sessions, webhooks, receipts, rutas protegidas post‑pago.
- **Prisma+DB**: modelos `User`, `Trip`, `Booking`, `Payment`, `Review`, `TripperProfile`, `ClientProfile`. Seeds demo.
- **Caching**: fetcher con SWR/React Query y `revalidateTag` por recurso.
- **E2E**: flujos de compra (feliz y con fallos) + perfil.

### Sprint 3 — “Tripper OS v1 y contenido”

- **Tripper OS**: panel de rutas/paquetes, media y reseñas.
- **Public profiles**: `/u/[handle]` SEO‑ready (SSG/ISR), share cards (OG).
- **i18n**: ES/EN base.
- **Analytics**: Umami/GA4 con eventos clave (CTA funnel, conversión).

### Sprint 4 — “Calidad y escalabilidad”

- **A11y** mejoras + teclado/lectores.
- **Performance**: imágenes responsive, partial hydration donde aplique, fonts self‑hosted.
- **Infra**: pre‑prod env, backups DB, rate limiting y WAF/CDN (vercel/Cloudflare).
- **QA**: ampliar suites y coverage; test de carga (k6).

---

## 🔐 Seguridad — checklist

- [ ] NextAuth + JWT/PKCE, rotate refresh, revocación.
- [ ] Role‑based access (server y client) + middleware.
- [ ] Sanitización Zod/Yup en endpoints.
- [ ] Rate limiting (Upstash/Redis) y protección de rutas sensibles.
- [ ] Secret management (Vercel/1Password).
- [ ] Webhooks Stripe firmados + idempotencia.
- [ ] CORS estricto y headers de seguridad (CSP, HSTS, XFO, etc.).

---

## 🚀 Performance & SEO

- **Core Web Vitals**: LCP < 2.5s, INP < 200ms, CLS < 0.1.
- **Imágenes**: `next/image` con `sizes` y placeholders; CDN.
- **Datos**: SSG/ISR para páginas públicas (`/u/[handle]`, `/packages/...`).
- **SEO técnico**: metadata dinámica, `sitemap.xml`, `robots.txt`, canonical, OG/twitter cards, breadcrumbs.
- **i18n**: `next-intl` o `next-i18next` y rutas locales.

---

## 📈 Observabilidad

- **Errores**: Sentry+source maps.
- **Logs**: pino (API) + correlación por request id.
- **Métricas**: Web Vitals en browser y tracing de API.
- **Alerting**: reglas en Sentry/Statuspage.

---

## 🧪 QA & Testing

- **Unit**: utilidades, componentes puros, store.
- **Integration**: hooks, páginas con datos simulados.
- **E2E**: Playwright (login, editar perfil, /u/[handle], checkout demo).
- **Contract**: OpenAPI y tests con Prism/Newman si exponen API.
- **Coverage**: badge en README y gate mínimo en CI (p.ej. 70%).

---

## 🛠️ CI/CD (propuesta)

- **CI**: typecheck, lint, tests unit/integration, build, Lighthouse (ci).
- **E2E**: en PR etiquetadas “flow”, ejecutando Playwright en preview.
- **Deploy**: Vercel (frontend) + Railway/Fly.io (API/DB) o Vercel Postgres.
- **Protecciones**: branch protection + PR templates + release notes.

---

## 🗄️ Datos (Prisma — sketch)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(CLIENT)
  handle    String?  @unique
  avatar    String?
  prefs     Json?
  socials   Json?
  metrics   Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role { CLIENT TRIPPER ADMIN }

model Booking {
  id        String   @id @default(cuid())
  userId    String
  tripId    String
  status    String   // draft, paid, confirmed, canceled
  totalUSD  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // relations...
}
```

---

## 📦 Paquetes y scripts recomendados

```bash
# Frontend
npm i next-auth zod @tanstack/react-query @sentry/nextjs
npm i -D @testing-library/react @testing-library/jest-dom jest playwright eslint-plugin-playwright

# API/DB
npm i prisma @prisma/client zod pino
```

**Scripts** (añadir a `package.json`):

```json
{
  "scripts": {
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "test": "jest",
    "test:e2e": "playwright test",
    "test:ci": "jest --ci --reporters=default --coverage",
    "analyze": "lighthouse http://localhost:3001 --chrome-flags='--headless'"
  }
}
```

---

## ✅ Criterios de aceptación — entregables clave

- **Login redirect**: si `isAuthed=true`, `replace(dashboardPathFromRole(role) || returnTo)`; suspenso OK.
- **TripperGuard**: acceso denegado si `role!=='tripper'`; redirección y render nulo mientras valida.
- **Profile Edit**: actualiza `updateAccount` + `upsertPrefs`; validaciones mínimas; feedback UI.
- **/u/[handle]**: muestra datos si coincide y `publicProfile=true`; 404 si no.
- **Navbar**: enlaces según rol; avatar fallback estable.
- **Imágenes**: sin `@next/next/no-img-element` warnings.
- **Contraste**: body y header estables; `color-scheme: light` aplicado.

---

## 📊 KPIs iniciales

- **Conversión** a checkout desde home > 2%.
- **Error rate** < 1% (Sentry).
- **LCP** < 2.5s (p95).
- **Crash‑free sessions** > 99.5%.
- **Coverage** (líneas) ≥ 70% en core.

---

## 🧭 Conclusión

La base del producto está **encaminada y homogénea**. Con los sprints propuestos, el MVP quedará listo para tráfico real y iteración rápida, reduciendo riesgos con seguridad, testing y observabilidad integrados. A partir de ahí, **Tripper OS** y el **funnel de compra** serán los multiplicadores del valor del proyecto.
