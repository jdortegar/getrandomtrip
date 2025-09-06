# Randomtrip — Product Roadmap (Definitivo, 2025-H1)

> Estado actual: **MVP web functional** (Next.js 14 + App Router, TypeScript, Tailwind, Zustand store). Flujo principal operativo con: login modal, **auto-redirect** post-login según rol, **TripperGuard** para /tripper, perfil público en **/u/[handle]**, migración `<img>→<Image>`, contraste/fondo independiente del tema del navegador, y rutas de “journey” (básico → filtros → premium → summary → checkout).

## 1) Visión
Ofrecer viajes sorpresa personalizados con una experiencia fluida, emocional y segura, desde la inspiración hasta el **reveal** de destino y post-compra.

### Éxito (MVP)
- 1ª compra real end‑to‑end (checkout simulado/real), tiempo de carga < 3s en 4G, ≥ 0.95 Core Web Vitals en home y /packages.
- Primeros 50 usuarios registrados, ≥ 10 perfiles públicos en /u/[handle].
- 1º paquete vendido por un **Tripper** (flujo Studio básico).

## 2) Personas y dashboards
- **Cliente** (dashboard: `/dashboard`): explora, compra, gestiona viajes y perfil público.
- **Tripper** (dashboard “OS”: `/tripper`): crea/gestiona rutas, contenido, reseñas, ganancias.
- **Admin** (futuro): governance, reporting, catálogo.

## 3) Flujo E2E (resumen)
1. **Descubrimiento**: Landing → selección por tipo (solo, pareja, etc.) → card de paquetes → “Iniciar”.  
2. **Onboarding & Auth**: Modal sign‑in; si entra por `/login` redirige a panel según rol o `?returnTo=`.  
3. **Configuración**: nivel básico → filtros → premium; cálculo de precio dinámico.  
4. **Resumen**: summary + upsells.  
5. **Checkout**: pago simulado (MVP), confirmación, email.  
6. **Post‑compra**: seguimiento, contenidos, reveal.  
7. **Perfil**: edición (`/profile/edit`), visibilidad pública, vista pública en `/u/[handle]`.  
8. **Tripper OS**: creación de rutas, media y reseñas (siguiente fase).

## 4) Alcance por hitos (build plan)

### Milestone 1 — **Core Frontend y UX base** ✅
- App Router, Tailwind, componentes UI (cards, badges, progress), carruseles/background, **Navbar** accesos por rol.
- Migración global a `next/image` con wrapper `Img`.
- Contraste estable (no depender del tema del navegador), `SiteHeaderOffset` y layout.

**Entrega**: Home, paquetes por tipo, journey básico, páginas de soporte.

### Milestone 2 — **Auth, Perfil y Rutas de usuario** ✅/➕
- Modal auth. **Auto‑redirect** post‑login según rol/`returnTo`.
- `/profile` leyendo de store + banda contextual (vista pública/privada).  
- `/profile/edit` con selects tipados (travelerType, budget), toggle **publicProfile**.  
- **/u/[handle]**: vista pública SSR/CSR simple (MVP demo).  
- **TripperGuard** en `/tripper`.

**Pendientes**:
- Persistir/servir datos reales (API) y `handle` único.  
- Avisos de completitud de perfil y checklist.

### Milestone 3 — **Pricing, Add‑ons y Checkout** ▶
- Motor de cálculo (básico + premium) y desglose.  
- Integración **Mercado Pago** (primero sandbox).  
- Email transaccional (compra, recordatorios).  
- Estado de pedido en `/dashboard`.

**Riesgos/Foco**: idempotencia de pagos, validación de carrito, protección de rutas de confirmación.

### Milestone 4 — **Tripper OS (v1)** ▶
- CRUD de rutas/paquetes, media upload (inicio con estáticos), reseñas.  
- Earnings (resumen), analytics básicos.  
- Perfil de Tripper público (catálogo de rutas).

### Milestone 5 — **Calidad, Observabilidad y Release** ▶
- CI/CD (Vercel + GitHub Actions), pre‑push lint+typecheck, pre‑deploy e2e smoke.  
- Sentry + Vercel Analytics + UptimeRobot.  
- Accesibilidad (WCAG AA) y **performance budgets**.  
- Rollback y post‑mortems.

## 5) Requisitos no funcionales
- **Rendimiento**: LCP < 2.5s; imágenes optimizadas y lazy; `next/image` en todas partes.
- **Accesibilidad**: contraste, foco visible, etiquetas/alt, navegación con teclado.
- **Seguridad**: CSRF/SSR‑safe redirects, validación de inputs, manejo de tokens/secretos en Vercel.
- **Observabilidad**: tracing/alerts; errores uncaught reportados.
- **SEO**: metadatos por página, `sitemap.xml`, `robots.txt`.

## 6) Métricas
- Conversión funnel (landing → configurador → checkout).  
- CTR en upsells/premium.  
- % perfiles públicos publicados y vistas en `/u/[handle]`.  
- Tasa de éxito de pago y reintentos.

## 7) Riesgos y mitigaciones
- **Pagos**: sandbox primero, webhooks con reintentos, colas o outbox (post‑MVP).  
- **Datos**: modelo evolutivo (User/Prefs/Routes/Booking).  
- **Tráfico pico**: pre‑render y edge caching; usar rutas dinámicas con “static params” cuando aplique.

## 8) Calendario propuesto (orientativo)
- S1–S2: Pricing + Checkout sandbox + emails.  
- S3: Tripper OS v1 (CRUD, media).  
- S4: QA integral, A11y/Perf, observabilidad, **Release**.

## 9) Backlog (post‑MVP corto)
- Internacionalización (i18n) ES/EN.  
- Mapa/destino (Google Maps) y reveal mejorado.  
- Integración de IA para curaduría de rutas y prompts de preferencias.  
- Programa de referidos, cupones y gift cards.
