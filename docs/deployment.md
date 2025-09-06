# Deployment & Rollback Runbook (Actualizado)

Este runbook estandariza **entornos, branching, CI/CD, variables de entorno, monitoreo y rollback** para Randomtrip.

## 1) Entornos y branching

| Entorno | Rama | URL | Propósito |
|---|---|---|---|
| **Local** | feature/* | `http://localhost:3001` | Desarrollo local, hot‑reload |
| **Preview** | PR a `develop` | Vercel Preview | QA rápido por PR |
| **Staging** | `develop` | staging.<dominio> | Ensayos integrales previos a prod |
| **Production** | `main` | https://getrandomtrip.netlify.app/ o prod vercel | Público final |

**Reglas**  
- Feature → PR a `develop` (Preview).  
- `develop` → staging estable.  
- `main` = release; **solo** desde `develop` con squash/merge y etiqueta de versión.

## 2) CI/CD (GitHub Actions + Vercel)

**Jobs clave**  
- **lint+typecheck** en PR.  
- **build** (Next.js) + pruebas de humo.  
- **deploy preview** al abrir/actualizar PR.  
- **deploy staging** al merge a `develop`.  
- **deploy prod** al merge a `main` + **release notes** automáticas.

## 3) Variables de entorno

> Definir por entorno en Vercel/Netlify; nunca commitear secretos.

- `NEXT_PUBLIC_BACKEND_API_URL`  
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`  
- `MERCADOPAGO_ACCESS_TOKEN`  
- `DATABASE_URL`  
- `FRONTEND_URL`  
- `BACKEND_URL`

Mantener claves separadas para **Preview/Staging/Prod**. Rotación semestral o ante incidencia.

## 4) Observabilidad

**Herramientas**  
- Vercel Analytics/Logs (básico).  
- **Sentry**: errores front/back + performance.  
- **UptimeRobot** (o similar) para health‑checks públicos.

**Métricas**  
- Uptime y latencia.  
- Error rate (cliente/servidor).  
- LCP/CLS/TTFB en páginas críticas.  
- Éxito de pago y webhooks.

## 5) Checklist de release

1) PRs aprobadas y **green** en CI.  
2) CHANGELOG/Release notes listos.  
3) Migraciones (si las hay) revisadas en staging.  
4) Flags/entitlements correctos.  
5) Plan de rollback listo.  
6) Smoke test post‑deploy (home, login redirect, /dashboard, /tripper con guard, /u/[handle], checkout sandbox).

## 6) Rollback (emergencia)

1. **Detectar**: alertas Sentry/Uptime y reportes.  
2. **Elegir build estable** en Vercel/Netlify y **Redeploy/Rollback**.  
3. **Verificar** con smoke test.  
4. **Comunicar** en Slack/issue.  
5. **Post‑mortem**: causa raíz, acción preventiva y plan de re‑release.

## 7) Rendimiento, A11y y seguridad (gates)

- **Performance budgets**: LCP < 2.5s; bundle compartido < 95 kB inicial; imágenes optimizadas.  
- **A11y**: contraste AA, foco visible, labels/alt, traps evitados.  
- **Seguridad**: redirects server‑safe, sanitización de inputs, política de imágenes remotas, protección de rutas por rol.

## 8) Troubleshooting rápido

- **CSR hooks en /login**: envolver `useSearchParams()` con `<Suspense>` o usar guardas condicionales para evitar “CSR bailout” en SSG.  
- **Imágenes externas**: añadir dominios permitidos en `next.config.js`.  
- **Builds lentos**: revisar imágenes enormes, dependencias, o desactivar sourcemaps en prod si aplica.

---

> **Notas**  
> - Mantener documentación viva en el repo (`/docs`) y enlaces desde README.  
> - Automatizar lo repetitivo (plantillas de PR, issue, release).
