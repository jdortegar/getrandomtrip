# Randomtrip — UserFlow (Definitivo)

> **Estado**: actualizado post-implementación de: _auto–redirect por rol (con `returnTo`), `TripperGuard`, ruta pública `/u/[handle]`, migración `<img>→<Image>`/`<Img>`, contraste/tema estable, tipado de `userStore`, Navbar, y mejoras de perfil/login_.  
> **Stack**: Next.js (App Router) 14, TypeScript, Tailwind, Zustand (`userStore`), Netlify.

---

## 0) Roles, conceptos y superficies

- **Roles**
  - `client` (usuario comprador/visitante con panel **/dashboard**).
  - `tripper` (creador/host con panel **/tripper** — “Tripper OS / Youtube Studio-like”).
  - `admin` (placeholder, uso futuro).

- **Identidades clave**
  - **Perfil privado** (edición en **/profile/edit**).
  - **Perfil público** (lectura en **/u/[handle]**; opt‑in via `publicProfile`).
  - **Paquetes/rutas** (landing y compra).
  - **Journey** (flow de compra/planificación).

- **Autenticación y estado**
  - `useUserStore` (Zustand) almacena: `isAuthed`, `user: { id, name, email, role?, handle?, avatar?, prefs, socials?, metrics? }`.
  - Acciones: `openAuth(mode)`, `signOut()`, `updateAccount(name,email)`, `upsertPrefs(partial)`.

---

## 1) Entrada al sitio (público)

### 1.1 Landing/Marketing
- **/** (home) y secciones públicas (blogs, bitácoras, “by-type”).
- CTA primarios: _Explorar paquetes_, _Ir al planner_, _Login_.

### 1.2 Descubrimiento de paquetes
- **/packages** (listado).
- **/packages/[tripper]** (portfolio del tripper).
- **/packages/by-type/[type]** (curados por tipo: solo, pareja, familia, etc.).

### 1.3 Perfil público del usuario
- **/u/[handle]** (nuevo): muestra `name`, `@handle`, `country`, `bio`, `avatar`, `verified`, métricas (si existen).
- Si no hay match del `handle` (en demo, contra el store) ⇒ **404**.
- El link a `/u/[handle]` se expone en **/profile** cuando `publicProfile === true`.

---

## 2) Autenticación y redirecciones

### 2.1 Página **/login**
- Al entrar:
  - Si **no authed** ⇒ abre modal `openAuth('signin')` (no duplica UI de perfil aquí).
  - Si **authed** ⇒ **redirect automático**:
    - Destino = `search.get('returnTo')` **o** `dashboardPathFromRole(role)`.
    - `dashboardPathFromRole`: `tripper → /tripper`, `admin → /admin` (placeholder), _default_ → `/dashboard`.
    - Implementado con `router.replace(dest)` y `useSearchParams()` **dentro de `<Suspense>`** para evitar warning de Next.

### 2.2 “ReturnTo” (profundidad)
- Cualquier ruta protegida puede redirigir a `/login?returnTo=${pathname}`.
- Post‑login vuelve automáticamente.

### 2.3 Cerrar sesión
- Botón en **/login** (“Privacidad y Seguridad”) y en **Navbar**.  
- `signOut()` limpia el store y devuelve al estado público.

---

## 3) Perfil: edición vs. vista pública

### 3.1 **/profile/edit** (privado)
- Edición de **cuenta**: `name`, `email` → `updateAccount()`.
- Preferencias tipadas (`TravelerType`, `BudgetLevel`) vía `<select>`:
  - `travelerType`: `solo | pareja | familia | amigos | empresa`.
  - `budget`: `low | mid | high`.
- **Toggle** “Perfil público” (`publicProfile`).
- Guardados con `upsertPrefs({ travelerType, budget, publicProfile })`.

### 3.2 **/profile** (privado, vista _pública_ de tu perfil)
- Banner contextual (si logueado): “Estás viendo la **vista pública**… [Editar visibilidad]”.
- Muestra datos normalizados desde `userStore` con fallbacks:
  - `name`, `@handle || 'usuario'`, `country || '—'`, `avatar || placehold`, `verified`, `bio || ''`.
  - `metrics?: bookings, spendUSD, reviews, favs` (0 por defecto).
- Si `publicProfile` y `handle` existen ⇒ link a **/u/[handle]**.

---

## 4) Dashboards

### 4.1 Dashboard **cliente** (**/dashboard**)
- Resumen de compras, rutas favoritas, próximas reservas.
- CTA a **Journey** o a **Packages**.

### 4.2 Dashboard **Tripper OS** (**/tripper**)
- Protegido por **`<TripperGuard>`** en `app/tripper/layout.tsx`:
  - Si **no authed** ⇒ `router.replace('/login?returnTo=/tripper')`.
  - Si **role !== 'tripper'` ⇒ `router.replace('/dashboard')`.
- Superficies:
  - Rutas/paquetes (CRUD), media, reseñas, earnings, settings.
  - Vistas asociadas: `/tripper/routes`, `/tripper/media`, `/tripper/earnings`, `/tripper/reviews`, `/tripper/settings`.
- “Studio” (inspiración YouTube Studio): métricas + acciones rápidas.

---

## 5) Journey de compra / configuración

> **Objetivo**: configurar experiencia/roadtrip con preferencias y add‑ons.

- Entradas: **/journey/** (varios pasos: basic-config, filters, premium filters, summary, checkout, confirmation, reveal, etc.).
- Estado: persistente en cliente (local store) durante el flow.
- **Checkout**: captura datos y _placeholder_ de pago (integración PSP en roadmap).
- **Post‑purchase**: `post-purchase` páginas/acciones.

---

## 6) Navbar + rutas útiles

- **Navbar** (con sesión):
  - “Mi perfil **público**” → `/profile`
  - “Editar perfil” → `/profile/edit`
  - (Solo tripper) “Panel de Tripper” → `/tripper`
  - “Mi panel” (cliente por defecto) → `/dashboard`
- Avatar: `user.avatar` con fallback `https://placehold.co/64x64` (dominio permitido en `next.config.js`).

---

## 7) Accesibilidad, contraste y tema

- Fondo y texto **independientes** del tema del navegador:
  - `<body class="bg-neutral-50 text-neutral-900 antialiased">`
  - `<meta name="color-scheme" content="light" />` y `<meta name="theme-color" content="#fafafa" />`
- Header con `data-site-header` y **`SiteHeaderOffset`** para `--rt-header-h` (evita solape).
- **Imgs**: migradas a `<Image>` o wrapper `<Img>` (usa `next/image` bajo el capó).

---

## 8) Estados vacíos y errores (MVP)

- **/u/[handle]** sin match ⇒ 404.
- **/tripper** sin sesión ⇒ redirect a `/login?returnTo=/tripper`.
- **/tripper** sin rol tripper ⇒ redirect `/dashboard`.
- **/profile** y **/profile/edit** sin sesión ⇒ `/login?returnTo=/profile` o banda que invita a iniciar sesión.
- Preferencias vacías ⇒ mostrar “No especificado” / “Ninguno”.

---

## 9) SEO y OpenGraph (resumen)

- Rutas públicas con metadatos (`title`, `description`, OG).
- Evitar indexar páginas privadas (`robots` en app/route metadata si aplica).
- Perfil público `/u/[handle]` listo para OG minimal (avatar, name, bio).

---

## 10) Roadmap (alto nivel)

- **Autenticación real** (OAuth/email-pass, sesiones).
- **Pago** (PSP: Stripe) + tickets/booking.
- **Mensajería** (cliente↔tripper).
- **Multilenguaje** (i18n).
- **SSR de `/u/[handle]`** contra backend real.
- **Observabilidad** (log de eventos, métricas, Sentry).

---

## 11) Mapa de rutas (resumen)

| Ruta                                   | Tipo     | Protección          | Notas |
|----------------------------------------|----------|---------------------|-------|
| `/`                                    | pública  | —                   | Landing |
| `/login`                               | pública  | —                   | Modal de auth + redirect automático |
| `/profile`                             | privada  | sesión              | Vista pública de _tu_ perfil (+banda) |
| `/profile/edit`                        | privada  | sesión              | Edición de cuenta + preferencias |
| `/u/[handle]`                          | pública  | —                   | Perfil público por handle |
| `/dashboard`                           | privada  | sesión              | Panel cliente |
| `/tripper` (+ subrutas)                | privada  | **TripperGuard**    | Tripper OS |
| `/packages` (+ variantes)              | pública  | —                   | Descubrimiento |
| `/journey/*`                           | privada? | sesión (checkout)   | Config/checkout |
| `/post-purchase`                       | privada  | sesión              | Confirmaciones |
| `/bitacoras`, `/blog`, `/nosotros`     | pública  | —                   | Contenido |

---

### Anexos técnicos (referencias rápidas)

- `dashboardPathFromRole(role)`:
  - `'tripper' → '/tripper'`, `'admin' → '/admin'`, default `'/dashboard'`.
- `TripperGuard` (layout `/tripper`):
  - `!isAuthed` ⇒ `/login?returnTo=/tripper`.
  - `role !== 'tripper'` ⇒ `/dashboard`.
- `<Img />`:
  - Usa `next/image`. Si necesitas `fill`, envuelve en `relative` + `h-*` y pasa `fill`/`sizes`.
- `next.config.js`:
  - `images.remotePatterns`: incluye `placehold.co` (y otros avatares si se usan).
- `layout.tsx`:
  - `<meta name="color-scheme" content="light" />`
  - `<body class="bg-neutral-50 text-neutral-900 ...">`
  - `<SiteHeaderOffset />` cargado.
