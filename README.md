# Randomtrip (frontend)

Next.js 14 + TypeScript + Tailwind + Zustand.  
Deploy: Netlify — https://getrandomtrip.netlify.app/

## Características clave

- **App Router** con rutas públicas/privadas.
- **Estado** con `userStore` (Zustand): `isAuthed`, `user`, acciones `updateAccount` y `upsertPrefs`.
- **Flujos**:
  - **Login** con **auto‑redirect** por rol + `?returnTo=` (dentro de `<Suspense>` por `useSearchParams()`).
  - **Perfil**: `/profile` (vista pública de tu perfil) y `/profile/edit` (edición).
  - **Perfil público**: `/u/[handle]` (404 si no corresponde en demo).
  - **Dashboards**: `/dashboard` (cliente) y `/tripper` (Tripper OS) con **`<TripperGuard>`**.
  - **Journey** de compra y **Packages**.
- **Imagen**: migración `<img> → <Image>` a través de wrapper `<Img>`.
- **Contraste/tema** independientes del navegador (forzado `light`).

## Requisitos

- Node 18+
- pnpm/npm/yarn
- (Opcional) cuentas/CDNs para imágenes remotas

## Configuración local

```bash
# instalar deps
npm install

# typecheck
npm run typecheck

# dev (Next selecciona 3001 si 3000 está ocupado)
npm run dev

# build + start
npm run build
npm start
```

## Variables de entorno

- `.env.local` — (placeholder para futuras integraciones: auth real, PSP, analytics).

## Rutas principales

- `/` — landing
- `/login` — modal de sign‑in y redirect automático (rol o `returnTo`)
- `/profile` — vista pública de tu perfil (con banda contextual si estás logueado)
- `/profile/edit` — edición de cuenta y preferencias (toggle `publicProfile`)
- `/u/[handle]` — perfil público
- `/dashboard` — panel cliente
- `/tripper` — Tripper OS (protegido con `TripperGuard`)
- `/journey/*` — flujo de compra
- `/packages/*` — descubrimiento por tripper o tipo

## Arquitectura / convenciones

- **Estado**: `src/store/userStore.ts`  
  - Tipos: `TravelerType`, `BudgetLevel`, `UserRole`, `User`, `UserPrefs`…  
  - Acciones: `updateAccount`, `upsertPrefs`.
- **Roles util**: `src/lib/roles.ts` → `dashboardPathFromRole(role)`.
- **Imagen**: `src/components/common/Img.tsx` (usa `next/image`).
- **Accesibilidad/tema**:  
  - `src/app/layout.tsx`: `<meta name="color-scheme" content="light">` y `<body class="bg-neutral-50 text-neutral-900">`.
  - `SiteHeaderOffset` + `data-site-header` para `--rt-header-h`.
- **Navbar** (sesión): enlaces a `/profile`, `/profile/edit`, `/dashboard` y, si `role==='tripper'`, `/tripper`. Avatar con `user.avatar` o `placehold.co`.

## next.config.js (imágenes)

```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'placehold.co' },
    // agrega otros CDNs si usás (githubusercontent, lh3.googleusercontent, etc.)
  ],
},
```

## Testing / Calidad

- `npm run typecheck` — Sin errores de TS.
- `npm run lint` — Evitar `<img>` (usar `<Img>`).  
- QA manual de flujos críticos:
  - Redirect en `/login` (rol y `returnTo`)
  - Guard de `/tripper`
  - `/u/[handle]` 404 vs válido
  - Edición/guardado de preferencias

## Roadmap

- Auth real, pagos (Stripe), mensajería cliente↔tripper, i18n, SSR de datos públicos, analytics/observabilidad.

---

## Planning Index (Issues)

**Fuente de verdad del backlog macro.** Mantener en sincronía con `README.md`, `Guidelines.md`, `UserFlow.md` y `roadmap.md`.

### Leyenda
- **Prioridad**: P0 (crítico), P1 (alto), P2 (medio).  
- **Milestones sugeridos**: MVP, M1 (Go‑to‑Market), M2 (Growth).  
- **Área (label)**: `area:product`, `area:design`, `area:frontend`, `area:backend`, `area:infra`, `area:qa`, `area:content`.

### Índice de Issues

| ID | Título                                                  | Área       | Prioridad | Milestone | Archivo                              |
|----|---------------------------------------------------------|------------|-----------|-----------|--------------------------------------|
| 01 | Product Roadmap & Milestones                            | product    | P0        | MVP       | `docs/issues/01-product-roadmap.md` |
| 02 | User Stories & Acceptance Criteria                      | product    | P0        | MVP       | `docs/issues/02-user-stories.md`    |
| 03 | Wireframes (clave)                                      | design     | P1        | MVP       | `docs/issues/03-wireframes.md`      |
| 04 | Style Guide / Design Tokens                             | design     | P1        | MVP       | `docs/issues/04-style-guide.md`     |
| 05 | Frontend Scaffold (Next 14, TS)                         | frontend   | P0        | Hecho     | `docs/issues/05-fe-scaffold.md`     |
| 06 | Reusable UI Components                                  | frontend   | P1        | MVP       | `docs/issues/06-reusable-components.md` |
| 07 | Application Screens (login/profile/dashboard/tripper)   | frontend   | P0        | MVP       | `docs/issues/07-app-screens.md`     |
| 08 | Mock API / Fixtures (temporal)                          | backend    | P1        | MVP       | `docs/issues/08-mock-api.md`        |
| 09 | Prisma Schema (si backend propio)                       | backend    | P1        | M1        | `docs/issues/09-prisma-schema.md`   |
| 10 | API Endpoints (auth, perfil, routes)                    | backend    | P0        | M1        | `docs/issues/10-api-endpoints.md`   |
| 11 | Unit Tests de Pricing/Rules                             | qa         | P2        | M1        | `docs/issues/11-unit-tests-pricing.md` |
| 12 | CI/CD Pipeline                                          | infra      | P1        | MVP       | `docs/issues/12-cicd.md`            |
| 13 | Infra Provisioning (si backend)                         | infra      | P1        | M1        | `docs/issues/13-infra-provision.md` |
| 14 | Backups & Monitoring                                    | infra      | P2        | M1        | `docs/issues/14-backups-monitoring.md` |
| 15 | Test Plan (flujos críticos)                             | qa         | P0        | MVP       | `docs/issues/15-test-plan.md`       |
| 16 | Automated Regression (Cypress/Playwright)               | qa         | P1        | M1        | `docs/issues/16-automation-regression.md` |
| 17 | Microcopy & Empty States                                | content    | P2        | MVP       | `docs/issues/17-microcopy-empty-states.md` |
| 18 | Transactional Emails (definir triggers)                 | content    | P1        | M1        | `docs/issues/18-transactional-emails.md` |
| 19 | Landing Page Content & SEO                              | content    | P1        | MVP       | `docs/issues/19-landing-seo.md`     |

#### Notas de estado (rápidas)
- **Hecho / Integrado** (marcar como cerrado o “complete” cuando migres a Issues):  
  FE Scaffold (05), flujo `/login` → redirect por rol (Prompt 1), `TripperGuard` (Prompt 2), perfil público `/u/[handle]` (Prompt 3), contraste y fondo estables, migración `<img>` → `<Image>` con wrapper `Img`.
- **En curso**: (06) Componentes reutilizables (Navbar, Cards, Img, badges), (07) pantallas `/profile`, `/profile/edit`, `/dashboard`, `/tripper`.
- **Pendiente** (depende de decidir backend real vs. mock): (08) Mock API, (09) Prisma, (10) Endpoints; (11/16) QA; (13/14) Infra.

#### Definición de Listo (DoD) sugerida
Para marcar cualquier issue como **Done**:
- PRs vinculados y CI verde.
- Accesibilidad AA y contraste correcto.
- Lighthouse ≥ 90 (Perf/Best/SEO) en páginas públicas.
- Estados vacíos y errores manejados (microcopy).
- Responsive (≥ 360px y ≥ 1280px).
- Documentación tocada si corresponde (`Guidelines.md`, `UserFlow.md`, `README.md`, `deployment.md`).

#### Dependencias recomendadas
- (03)+(04) → (06)+(07)  
- (08) → (07)  
- (09) → (10) → (11)+(16)  
- (12) → todo lo que pase por build/deploy  
- (15) → cierre de MVP

#### Crear issues en GitHub desde estos archivos
1) Crear los archivos bajo `docs/planning/issues/` con los nombres del índice.  
2) (Opcional) Importar como Issues reales con GitHub CLI:

```bash
for f in docs/planning/issues/*.md; do
  title="$(grep -m1 '^# ' "$f" | sed 's/^# //')"
  gh issue create     --title "$title"     --body  "$(< "$f")"     --label "area:planning"     --repo ssenega/getrandomtrip
done
```

---

**Licencia**: privada (pendiente de definir).
