# Randomtrip — User Flow (vNext)

> **Propósito:** Dar a los web developers una visión ejecutable del flujo de usuario end‑to‑end, con rutas, componentes, contratos mínimos de API, estados y criterios de aceptación. Este documento sustituye y unifica los bosquejos previos, manteniendo su espíritu y decisiones clave.

## 0) Principios guía
- **Un solo flujo base**, múltiples puertas de entrada (By Traveller, Top Trippers, Roadtrips, Trippers Decode). Todos convergen a *configurar → add‑ons → checkout → confirmación → revelación*.
- **Precio dinámico “en vivo”** desde que el usuario empieza a configurar (planner/add‑ons).
- **Booking como “fuente de verdad”**: cada cambio en front ejecuta `PATCH /api/bookings/:id` (idempotente) y el backend devuelve el booking recalculado.
- **Experiencia emocional**: anticipación (countdown + emails) y *revelación del destino* como hito.

---

## 1) Mapa de etapas (alto nivel)

```
[Landing / Entradas]
      │
      ├─ By Traveller → Nivel → Planner/Filtros → Add‑ons → Resumen → Pago → Confirmación → Revelación
      ├─ Top Trippers → Nivel → Planner/Filtros → Add‑ons → Resumen → Pago → Confirmación → Revelación
      ├─ Roadtrips    → Nivel →                (salta Filtros)    → Add‑ons → Resumen → Pago → Confirmación → Revelación
      └─ Trippers Decode → Nivel →            (salta Filtros)    → Add‑ons → Resumen → Pago → Confirmación → Revelación
```

### 1.1 Rutas “de marketing” ↔ rutas reales (Next.js)
| Sección | Ruta marketing | Ruta real sugerida (Next) | Notas |
|---|---|---|---|
| Home | `/` | `/` | Hero, “Cómo funciona”, tabs de entrada |
| By Traveller | `/packages/by-type/[tipo]` | `/packages/by-type/[tipo]` | tipo = couple/family/group/solo/honeymoon/paws |
| Top Trippers | `/packages/[tripper]` | `/packages/[tripper]` | nombre/slug del tripper |
| Roadtrips | `/roadtrips/[tipo]` | `/roadtrips/[tipo]` | auto/moto/bici |
| Decode | `/decode` | `/decode` | buscador destino+mes |
| Planner (filtros) | `—` | `/journey/basic-config` | logística + filtros (solo entradas que lo usan) |
| Add‑ons | `—` | `/journey/add-ons` | add‑ons con precio en vivo |
| Resumen | `—` | `/journey/summary` | desglose por pax/total + CTA pagar |
| Checkout | `/checkout/:bookingId` | `/journey/checkout` | MVP con pasarelas *dummy* |
| Confirmación | `/confirmacion` | `/confirmacion` | countdown, compartir, añadir a calendario |
| Revelación | `/revelacion/:bookingId` | `/revelacion/[bookingId]` | gate 48h antes |

> Nota: el repo actual ya contiene páginas en `/journey/*` (p. ej. **summary**) y componentes como `Navbar`, `ChatFab`, `BgCarousel`, `GlassCard`, así como un store `useJourneyStore` y helpers de pricing. Aprovechar esa estructura.

---

## 2) Puertas de entrada (Descubrimiento)
Todas comparten patrón de **Hero contextual + selector de nivel** (Essenza, Modo Explora, Explora+, Bivouac, Atelier) + contenido de apoyo (blog/testimonios) + CTA para avanzar.

### 2.1 By Traveller — `/packages/by-type/[tipo]`
- **Objetivo:** seleccionar *nivel* y preparar intención.
- **Criterios de aceptación (CA):**
  - Mostrar 5 niveles con `name`, `subtitle`, `priceLabel`, `priceFootnote`, `features[]`, `ctaLabel`.
  - CTA avanza a `/journey/basic-config?type=<tipo>&level=<id>` creando/leyendo `bookingId` (ver §4).
  - Si la sesión es *guest*, puede continuar; auth real es opcional (MVP).

### 2.2 Top Trippers — `/packages/[tripper]`
- Hero 2 columnas: (foto+bio+chips) / (selector de nivel + CTA).
- CA: el CTA avanza a `/journey/basic-config?tripper=<slug>&level=<id>`.

### 2.3 Roadtrips — `/roadtrips/[tipo]`
- Detalle por vehículo y qué incluye.
- CA: al confirmar nivel, **salta Filtros** y va a `/journey/add-ons?type=roadtrip&level=<id>`.

### 2.4 Trippers Decode — `/decode`
- Buscador destino+mes (+ IA “Kai” como sugeridor).
- CA: al confirmar nivel, **salta Filtros** y va a `/journey/add-ons?flow=decode&level=<id>`.

---

## 3) Autenticación & Perfil
- **AuthModal** con 3 pasos: sign-in/up → onboarding de preferencias → confirmación.
- **Navbar > Perfil**: menú con “Mis Viajes”, “Mi Perfil”, “Cerrar sesión” (placeholders).
- **Dashboard** `/dashboard`: tabs *Próximos/Pasados/Cancelados* con tarjeta destacada y countdown.
- **CA:** el flujo core no depende de auth; si no hay sesión, se puede capturar email en checkout.

---

## 4) Planner / Configuración
### 4.1 Creación & ciclo de vida del *booking*
- En la **primera entrada al planner o add‑ons**:
  - Front hace `POST /api/bookings` → `{ id, state: "DRAFT", ... }` y persiste `bookingId` (state + storage).
- **Cada cambio** (nivel, fechas, pax, filtros, add‑ons) → `PATCH /api/bookings/:id` (atomizado por campo) y backend devuelve el booking recalculado.
- **Estados (sugeridos):**
  - `DRAFT → READY_FOR_CHECKOUT → PENDING_PAYMENT → CONFIRMED → REVEAL_AVAILABLE → TRIP_ACTIVE → COMPLETED`
  - Errores: `FAILED_PAYMENT`, `CANCELLED`.

### 4.2 Sección A — Logística (desbloquea Filtros)
- Campos: **origen**, **fechas**, **noches**, **pax**.
- Reglas por nivel (MVP; afinar en pricing):
  - Essenza: **1–2** noches; bloquear alta demanda.
  - Modo Explora: **2–4**.
  - Explora+: **3–5**.
  - Bivouac: **4–7**.
  - Atelier: **5–10**.
- **CA:** al completar mínimos (nivel + fechas + pax + origen), el booking pasa a `READY_FOR_CHECKOUT` y se habilitan Filtros (si aplica).

### 4.3 Sección B — Filtros (modelo freemium)
- **Freemium:** 1º filtro **gratis**; 2º–3º a **USD 18/pax**; 4º+ a **USD 25/pax**.
- **Catálogo:**
  - Transporte preferido (sin cargo; obligatorio): Avión/Bus/Tren/Barco.
  - Clima: Indistinto (default), Cálido, Frío, Templado.
  - Tiempo máximo de viaje: Sin límite (default), ≤3h, ≤5h, ≤8h.
  - Horarios (Salida/Llegada): Indistinto/Mañana/Tarde/Noche.
  - Destinos a evitar: grilla 4×4 (15 pre‑cargados) + tarjeta buscador.
- **CA:** resumen flotante siempre visible con **precio en vivo** y CTA “Aplicar y continuar a Add‑ons”.

---

## 5) Add‑ons
- Ruta: `/journey/add-ons` (todas las entradas convergen aquí).
- **Catálogo MVP (con precios orientativos):**
  - Seguro de cancelación (**15%** del subtotal).
  - Seguro de viaje (USD **40–70/pax**).
  - Selección de asiento (USD **10–30**/tramo).
  - Carry‑on (USD **35–50**/tramo).
  - Bodega 23 kg (USD **40–60**/tramo).
  - e‑SIM 5 GB (USD **25**).
  - Upgrade de alojamiento (variable).
  - Transfers origen/destino (USD **40–100** por tramo).
  - Alquiler auto (**50–80/día**), moto/bici (**30/15**).
  - Experiencia gastronómica (**80–150/pax**), turística (**60–120/pax**).
  - Early in / Late out (**50**).
- **CA:** cada toggle o step hace `PATCH` y el **panel de resumen** actualiza: base + filtros + add‑ons = total; mostrar **por persona** y **total (x pax)**.

---

## 6) Resumen y Pago
### 6.1 Resumen — `/journey/summary`
- Desglose: **Base por persona**, **Filtros**, **Add‑ons**, **Total por persona**, **Total (x pax)**.
- Acciones: volver a Add‑ons o **Continuar a pago**.
- **CA:** datos deben provenir del booking (no recálculo en front).

### 6.2 Checkout — `/journey/checkout`
- Mostrar datos de contacto (capturar email si es guest) y selector de método.
- **Acción:** `POST /api/checkout` → crea preferencia (p. ej. Mercado Pago) y redirige.
- Estado del booking → `PENDING_PAYMENT`.

### 6.3 Post‑pago
- **Webhook** de la pasarela: valida y hace `booking → CONFIRMED` + **asigna destino** (algoritmo sorpresa).
- Front redirige a `/confirmacion?bookingId=...&status=success`.

---

## 7) Confirmación, emails y revelación
### 7.1 Confirmación — `/confirmacion`
- Mensaje de éxito + **countdown** al inicio del viaje.
- Acciones: **Agregar al calendario** (Google/Apple/Outlook), **Compartir** (RRSS/WhatsApp/Email).

### 7.2 Emails de anticipación
- **Inmediato:** confirmación “¡Tu aventura está en marcha!”.
- **T–7 días:** pista de clima / recomendaciones.
- **T–3 días:** preparativos finales.

### 7.3 Revelación — `/revelacion/[bookingId]`
- Se **habilita 48 h antes** (gate por backend, `GET /api/bookings/:id/reveal`).
- Animación/experiencia que **revela DESTINO** + itinerario, vouchers y documentos.
- Email simultáneo: “¡Tu Aventura Randomtrip te espera en… [DESTINO]!”

---

## 8) Contrato técnico (MVP)
### 8.1 Endpoints
```
POST /api/bookings                      # crea DRAFT
GET  /api/bookings/:id                  # lee booking
PATCH /api/bookings/:id                 # aplica cambios y recalcula
POST /api/checkout                      # crea preferencia (MP/Stripe/…)
POST /api/webhooks/mercadopago          # confirma pago → CONFIRMED + destino
GET  /api/bookings/:id/reveal           # valida ventana de revelación
```

### 8.2 Esquema mínimo de Booking (sugerido)
```json
{
  "id": "bk_123",
  "state": "DRAFT",
  "entry": { "type": "by-traveller|tripper|roadtrip|decode", "meta": {} },
  "who": { "type": "couple|family|group|solo|honeymoon|paws" },
  "level": "essenza|explora|explora_plus|bivouac|atelier",
  "logistics": { "origin": "BUE", "startDate": "2025-10-01", "endDate": "2025-10-05", "nights": 4, "pax": 2 },
  "filters": {
    "transport": "plane|bus|train|boat",
    "climate": "indistinto|calido|frio|templado",
    "maxTravelTime": "sin-limite|3h|5h|8h",
    "departPref": "indistinto|manana|tarde|noche",
    "arrivePref": "indistinto|manana|tarde|noche",
    "avoidDestinations": ["Rio de Janeiro", "Miami"]
  },
  "addons": [
    { "id": "cancel_ins", "qty": 1 },
    { "id": "esim_5gb", "qty": 2 }
  ],
  "pricing": {
    "basePerPax": 350.00,
    "filtersPerPax": 18.00,
    "addonsPerPax": 45.00,
    "totalPerPax": 413.00,
    "totalTrip": 826.00,
    "currency": "USD"
  },
  "reveal": { "availableAt": "2025-10-03T12:00:00Z", "destination": null }
}
```

### 8.3 Reglas de precio (fórmula MVP)
```
total = base(nivel, pax, noches, origen)
      + markup_solo(30%)? + markup_paws(25%)?
      + filtros_freemium (1º gratis; 2–3: 18 USD/pax; 4+: 25 USD/pax)
      + suma(add_ons)
```
> El cálculo lo resuelve el backend. El front solo muestra los montos retornados en `pricing`.

---

## 9) Analítica (eventos mínimos)
- **Descubrimiento:** `view_home`, `cta_start`, `select_entry_point`.
- **Planner:** `booking_created`, `booking_patched(field)`, `logistics_completed`, `filters_opened`, `filter_added/removed`.
- **Add‑ons:** `addon_added/removed`.
- **Checkout:** `view_checkout`, `checkout_started`, `payment_success|failure`.
- **Post:** `confirmation_view`, `reveal_view`.
- **Embudo:** Home → Planner → Checkout → Pago → Confirmación → Revelación.

---

## 10) QA / E2E (flujos críticos que deben pasar en CI)
1) **By Traveller (pareja)**  
   *crear → configurar (logística+filtros) → add‑ons → resumen → checkout → confirmación*  
   - CA: precio en vivo consistente entre planner, add‑ons y resumen.
2) **Roadtrip (auto)**  
   *crear → nivel → add‑ons (salta filtros) → resumen → checkout*.
3) **Revelación gate**  
   *booking confirmado* → antes de 48 h: acceso denegado; dentro de ventana: acceso OK + datos de destino.

---

## 11) Edge‑cases & fallback
- Pago falla → reintentar (mantener booking) o ruta alternativa.
- Fallo mapas/medios → fallback texto e imágenes estáticas; CTA a soporte.
- Usuario sin filtros/add‑ons → continúa con precio base.
- Rate‑limit/validaciones en APIs; payloads validados con Zod.

---

## 12) Backlog inmediato (orden sugerido)
1) Implementar `/api/bookings` (POST/PATCH/GET) con estados y pricing MVP.  
2) Planner con resumen vivo y validaciones mínimas.  
3) Add‑ons con catálogo MVP y recalculo.  
4) Checkout + webhook stub de pasarela.  
5) Confirmación + countdown + guardas de estado/tiempo.  
6) Revelación gated (endpoint `reveal`).  
7) Métricas del embudo (front+back).  
8) Copy y UI de errores/reintentos.  
9) Admin básico: override de destino y reenvío de emails.

---

## 13) Glosario corto
- **Nivel**: Essenza / Modo Explora / Explora+ / Bivouac / Atelier. Define base de precio y reglas de calendario.
- **Planner**: pantalla(s) donde el usuario configura logística, filtros y add‑ons con precio en vivo.
- **Booking**: entidad transaccional que guarda todo el estado del viaje.
- **Revelación**: hito 48 h antes que expone el destino final.
