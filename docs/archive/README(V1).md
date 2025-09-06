# Randomtrip — Web App (Monorepo)

Randomtrip es una web app de “viajes sorpresa”. Este repositorio contiene el **frontend en Next.js** y la documentación de producto/UX necesaria para entender el flujo completo del usuario (MVP).

> Si solo quieres correr el proyecto: ve directo a **“Arranque rápido”**.

---

## Estructura del repo

```
/frontend/                  # Aplicación Next.js (UI + flows + Cypress E2E)
/docs/                      # Documentación (p. ej. UserFlow.md)
/backend/                   # Semillas/artefactos Prisma (placeholder de backend)
.github/workflows/          # Pipelines de CI (e2e con Cypress)
```

Notas:
- El foco actual está en **frontend/**. El backend aún no es requerido para correr el MVP; hay artefactos de Prisma para futuros escenarios.
- La documentación clave de producto está en `docs/UserFlow.md` (user journey completo).

---

## Requisitos

- **Node.js 20+** y **npm 9/10+**
- (Opcional) **Google Maps API key** si vas a probar componentes que usan mapas.

### Variables de entorno (frontend)
Crea `frontend/.env.local` con los valores necesarios (usa placeholders si no los tienes aún):

```
# URL pública de la app (opcional)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Maps (opcional, solo si usarás los componentes que lo requieren)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxx

# Otros (solo si los habilitas en el código)
# NEXT_PUBLIC_OPENAI_API_KEY=...
# GEMINI_API_KEY=...
```

> Si una variable falta, la mayor parte del MVP sigue funcionando.

---

## Arranque rápido (solo frontend)

```bash
git clone https://github.com/ssenega/getrandomtrip.git
cd getrandomtrip/frontend
npm ci      # o npm install
npm run dev # abre http://localhost:3000
```

Build/producción:

```bash
npm run build
npm run start # sirve la build en http://localhost:3000
```

---

## Scripts útiles (frontend)

- `npm run dev` – Next.js en modo desarrollo
- `npm run build` – Compilación de producción
- `npm run start` – Servir la build
- `npm run lint` – Linter de Next/ESLint
- `npm run typecheck` – Chequeo estático de TypeScript
- `npm run test:e2e` – **E2E**: build + servidor + Cypress en Chrome (headless)
- `npm run cypress` – Cypress en modo interactivo

> Los tests E2E viven en `frontend/cypress/e2e/` y el config en `frontend/cypress.config.ts`.

---

## Pruebas E2E locales (Cypress)

```bash
cd frontend
npm run test:e2e
```

Este script:
1) hace `npm run build`,
2) levanta `npm run start` en `http://localhost:3000`,
3) ejecuta `cypress run --e2e --browser chrome`.

Para ejecutar el runner interactivo:

```bash
npm run cypress
```

Estructura mínima de tests:

```
frontend/cypress.config.ts
frontend/cypress/e2e/smoke.cy.ts
```

---

## CI (GitHub Actions)

- Existe un workflow **e2e** que corre Cypress en cada push/PR. Asegúrate de que:
  - La app **construye** (build) sin errores de TypeScript.
  - Existen **tests** E2E (al menos `smoke.cy.ts`).
  - No se suben binarios pesados (ver sección “Pitfalls”).

Puedes revisar logs en la pestaña **Actions** del repo cuando un job falle.

---

## Convenciones de código y ramas

- **Conventional Commits** (ej.: `feat:`, `fix:`, `chore:`)
- Ramas: `feat/*`, `fix/*`, `chore/*` (p. ej. `feat/paws-landing`)
- **ESLint + TypeScript** activos en build/CI.

---

## Documentación de producto/UX

- **UserFlow**: `docs/UserFlow.md` recoge el flujo end-to-end:
  - onboarding, configuración de viaje/sorpresa,
  - filtros premium y add-ons,
  - resumen/checkout,
  - dashboard “Mis viajes” y perfil.
- Este README es un complemento para levantar el entorno y para que el equipo dev ubique rápidamente el scope técnico.
- Si necesitas la “foto de producto”, empieza por `docs/UserFlow.md` y vuelve a este README para ejecutar el código.

---

## Troubleshooting / Pitfalls

- **Archivos grandes**: evita subir binarios (>100 MB). Ya se agregó `frontend/frontend.zip` al `.gitignore`. Si subes algo por error:
  - quítalo del índice (`git restore --staged <archivo>`),
  - o reescribe el historial con herramientas como `git filter-repo`/`git filter-branch` (cuando sea estrictamente necesario).
- **Errores de TypeScript en build**: corrige tipos o usa guardas (`as const`, `satisfies`) donde aplique.
- **Cypress falla en CI**: verifica que `smoke.cy.ts` exista y que `npm run build` pase localmente.

---

## Licencia

TBD.

## Autores / Contacto

- Equipo Randomtrip – Producto, UX y Web.
- PRs y issues bienvenidos.