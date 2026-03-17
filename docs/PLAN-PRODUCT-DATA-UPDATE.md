# Plan: Actualización de datos de producto (docs originalData → código)

Objetivo: alinear la data del producto con los 6 mapas (BOND, SOLUM, KIN, CREW, PAWS, NUPTIA), usando **type** como identificador, unificando niveles/excusas y agregando pasos y filtros faltantes.

Decisiones ya acordadas:
- PAWS es una opción más en el paso 1 (tipo de viajero).
- Precios se ajustan a los valores finales de los docs.
- Excusas van en la carpeta de cada tipo de viaje y se actualizan según docs.
- Excusa solo Explora+ y Bivouac para BOND/KIN/CREW; para SOLUM/PAWS en todos los niveles.
- KIN (familia): paso adicional en el journey “quién viaja”.
- PAWS “Afinar detalles” (mascotas, tamaño, etc.): tratado como **pasos** (no filtros).
- NUPTIA: dejar bases para un flujo distinto (solo Atelier → Atelier Access).
- Una sola fuente de verdad para niveles/beneficios/copy.
- Tipo de alojamiento se agrega como **filtro**.

---

## Fase 1: Estructura de datos y configuración compartida
**Objetivo:** Definir la fuente única de productos, niveles y reglas (qué niveles muestran excusa por tipo). Agregar tipo de alojamiento a la definición de filtros.

**Ubicación de filtros (acordado):** Hoy las opciones de filtro (`FILTER_OPTION_KEYS`, `FILTER_OPTIONS`) y los tipos `FilterOption`/`Filters` están en `store/slices/journeyStore.ts`. Según la estructura del proyecto (constantes en `lib/constants/`, tipos en `lib/types/`), lo correcto es:
- **Constantes de opciones** (keys y listas de opciones) → `lib/constants/journey-filters.ts` (o similar).
- **Tipos** `FilterOption` y `Filters` → pueden vivir en `lib/types/` o seguir en el store si se prefiere slice autónomo.
- **Store** → solo importa constantes/tipos, define estado inicial de `filters` y acciones. Al añadir `accommodationType`, el store añade la clave al tipo y al estado; las opciones (Hotel Style, Home Style, etc.) se definen en `lib/constants/`.

| # | Tarea | Archivos / impacto |
|---|--------|---------------------|
| 1.1 | Definir lista de tipos de producto y regla “excusa por nivel”: BOND/KIN/CREW = solo Explora+ y Bivouac; SOLUM/PAWS = todos los niveles; NUPTIA = sin excusa. | `lib/constants/` o `lib/data/` (ej. `product-config.ts`) |
| 1.2 | Mover definición de filtros a `lib/constants/journey-filters.ts`: opciones actuales + **accommodationType** (Hotel Style, Home Style, Nature Escape, Hybrid Hub, Glamping). Store importa de ahí y añade `accommodationType` al tipo `Filters` y al estado inicial. | `lib/constants/journey-filters.ts` (nuevo o renombrar), `store/slices/journeyStore.ts` (import + tipo + initial state) |
| 1.3 | Documentar en el mismo archivo qué filtros son de pago / Power Pack según docs. | Comentarios o config en `product-config.ts` |

**Entregable:** Config central que diga por `type` qué niveles tienen excusa y filtros disponibles (incl. alojamiento). Constantes de filtros en `lib/constants/`; store solo usa estado y acciones. Sin cambiar aún precios ni excusas.

**¿Aprobamos Fase 1 antes de seguir?** [ ]

---

## Fase 2: Precios
**Objetivo:** Una sola fuente de precios alineada con los docs.

| # | Tarea | Valores (USD/persona) |
|---|--------|------------------------|
| 2.1 | Actualizar `pricing-catalog.json` (o la fuente única si ya está en Fase 1): BOND/KIN/CREW: 350, 550, 850, 1200, 1200. SOLUM: 450, 650, 1100, 1550, 1550. PAWS: 490, 700, 1190, 1680, 1680. NUPTIA: solo atelier 1800. | Por tipo y nivel |
| 2.2 | Aplicar regla +20% single/triple para PAWS donde corresponda (documentar en código o config). | Lógica en `lib/pricing.ts` o donde se calcule total |
| 2.3 | Eliminar o deprecar precios duplicados en `content/levels.ts` / `experienceLevels.ts`; que todo lea de la fuente única. | `content/levels.ts`, `content/experienceLevels.ts` |

**Entregable:** Precios por tipo/nivel que coincidan con los docs; una sola fuente usada en checkout y resumen.

**¿Aprobamos Fase 2 antes de seguir?** [ ]

---

## Fase 3: PAWS en paso 1 y labels
**Objetivo:** PAWS visible como opción de tipo de viajero y con labels coherentes.

| # | Tarea | Archivos |
|---|--------|----------|
| 3.1 | Añadir PAWS a `TRAVELLER_TYPE_OPTIONS` (key, title, subtitle, img). | `lib/constants/traveller-types.ts` |
| 3.2 | Incluir `paws` en `TRAVELLER_TYPE_MAP` y en `TYPE_LABELS` si no está. | Idem |
| 3.3 | Revisar `TRAVELER_TYPE_LABELS` en `lib/data/journey-labels.ts` y diccionarios (es/en) para “Con Mascotas” / “PAWS”. | `journey-labels.ts`, `dictionaries/es.json`, `en.json` |
| 3.4 | Asegurar que el step de “tipo de viajero” en el journey muestre las 6 opciones (Solo, Pareja, Familia, Grupo, Honeymoon, PAWS). | Componente que use `TRAVELLER_TYPE_OPTIONS` |

**Entregable:** En paso 1 se puede elegir PAWS y todos los textos/labels son consistentes.

**¿Aprobamos Fase 3 antes de seguir?** [ ]

---

## Fase 4: Unificación de niveles (contenido y beneficios)
**Objetivo:** Una sola fuente para niveles: duración, destino, transporte, alojamiento, beneficio, copy por tipo.

| # | Tarea | Archivos |
|---|--------|----------|
| 4.1 | Definir estructura unificada de nivel (campos de los docs: budget, duración, perfil destino, estilo viaje, alojamiento, beneficio). | Nuevo módulo ej. `lib/data/levels.ts` o `lib/data/product-levels.ts` |
| 4.2 | Poblar por tipo (couple, solo, family, group, paws, honeymoon) y nivel (essenza, modo-explora, explora-plus, bivouac, atelier) con textos de los docs. | Mismo módulo |
| 4.3 | NUPTIA: solo atelier con copy “Honeymoon Edition” y 1800 USD. | Mismo módulo, tipo honeymoon |
| 4.4 | Migrar usos desde `content/levels.ts` y `content/experienceLevels.ts` al nuevo módulo; deprecar o eliminar duplicados. | `content/levels.ts`, `experienceLevels.ts`, componentes que usen `getLevel`, `ALL_LEVELS`, etc. |

**Entregable:** Todo el contenido de niveles (features, beneficios, precios mostrados) sale de una sola fuente y refleja los docs.

**¿Aprobamos Fase 4 antes de seguir?** [ ]

---

## Fase 5: Excusas por tipo en su carpeta
**Objetivo:** Excusas y “refine details” por tipo según docs; cada tipo en su carpeta.

| # | Tarea | Archivos |
|---|--------|----------|
| 5.1 | Por cada tipo (couple, solo, family, group, paws): crear o actualizar `lib/data/traveler-types/<type>/excuses.ts` con la lista exacta del doc y las opciones de detalle (refine). | `lib/data/traveler-types/*/excuses.ts` |
| 5.2 | BOND (couple): 8 excusas con sus opciones (ya muy alineadas; solo revisar keys/labels). | `traveler-types/couple/excuses.ts` |
| 5.3 | SOLUM (solo): Get Lost, Búsqueda Interior, Aventura & Desafío, Exploración Cultural, Fotografía & Narrativa Visual, Literatura/Arte/Talleres, Música & Sonidos, Tribe Encounters + opciones por excusa. | `traveler-types/solo/excuses.ts` |
| 5.4 | KIN (family): Aventura en familia, Naturaleza & fauna, Cultura & tradiciones, Playas & dunas, Graduaciones & celebraciones, Escapadas Madre-hijo / Padre-hijo + opciones. | `traveler-types/family/excuses.ts` |
| 5.5 | CREW (group): Narradores Visuales, Yoga & Bienestar, Religioso/Espiritual, Gastronómico, Historias & Fantasía, Naturaleza & Aventura, Amigos, Negocios, Estudiantes, Música & Festivales + opciones. | `traveler-types/group/excuses.ts` |
| 5.6 | PAWS: Senderos & Naturaleza, Playas Dog-Friendly, Ciudades Pet Lovers, Aventura Outdoor, Relax & Bienestar, Escapadas Gastronómicas, Trips Rurales & Granja, Dog Events & Comunidades + opciones. | `traveler-types/paws/excuses.ts` |
| 5.7 | Honeymoon (NUPTIA): sin excusas en el flujo estándar; no crear archivo de excusas o dejarlo vacío/estub. | - |
| 5.8 | Actualizar `getExcusesByTravelerType` (y helpers) para que lean de `traveler-types/<type>/excuses.ts`. Eliminar o deprecar `lib/data/shared/excuses.ts` central. | `lib/helpers/excuse-helper.ts` o equivalente, imports en componentes |

**Entregable:** Excusas y refine por tipo en su carpeta y alineadas con los docs; journey sigue mostrando excusa según la regla de Fase 1.

**¿Aprobamos Fase 5 antes de seguir?** [ ]

---

## Fase 6: Filtro “Tipo de alojamiento” en UI y store
**Objetivo:** El filtro de alojamiento exista en estado y en la UI del journey.

| # | Tarea | Archivos |
|---|--------|----------|
| 6.1 | Añadir al estado de filtros (journey store) la clave para tipo de alojamiento y sus opciones (Hotel Style, Home Style, Nature Escape, Hybrid Hub, Glamping). | `store/slices/journeyStore.ts` |
| 6.2 | Añadir el campo al tipo `Filters` y a persistencia/URL si la hay. | Idem + tipos en `lib/types` si aplica |
| 6.3 | Mostrar el selector en el paso de preferencias/filtros del journey (y en resumen). | Componentes de filtros (ej. `FiltersTab`, `JourneyPreferencesStep`) |
| 6.4 | Incluir en resumen de viaje y en payload a checkout/API si aplica. | `JourneySummary`, API trip-request |

**Entregable:** Usuario puede elegir tipo de alojamiento como filtro y se guarda y muestra en resumen.

**¿Aprobamos Fase 6 antes de seguir?** [ ]

---

## Fase 7: Paso extra KIN “Quién viaja”
**Objetivo:** Paso adicional solo para tipo “family” (KIN): “De flotadores a tablas de surf”.

| # | Tarea | Archivos |
|---|--------|----------|
| 7.1 | Añadir al estado del journey un campo opcional, ej. `familyTravelWith` o `kinWhoTravels`: 'con-mas-chicos' | 'con-adolescentes' | 'con-hijos-grandes' | 'toda-la-familia'. | `store/slices/journeyStore.ts` |
| 7.2 | Crear componente o bloque para este paso (solo visible si type === 'family'), después de nivel y antes de excusa (o según orden del doc). | Componente en `components/journey/` o `components/by-type/family/` |
| 7.3 | Integrar el paso en el flujo de `JourneyMainContent` (orden correcto de pasos). | `JourneyMainContent.tsx` |
| 7.4 | Mostrar la elección en resumen y enviarla en el payload de trip-request si aplica. | `JourneySummary`, API |

**Entregable:** En familia se muestra el paso “Con los más chicos / Con adolescentes / Con hijos grandes / Con toda la familia” y se guarda y resume.

**¿Aprobamos Fase 7 antes de seguir?** [ ]

---

## Fase 8: Paso PAWS “Afinar detalles” (mascotas)
**Objetivo:** Paso específico PAWS con campos: total mascotas, tamaño principal, transporte, preferencia hotel, preferencia aerolínea, paseos por día, relación con niños, relación con otros perros.

| # | Tarea | Archivos |
|---|--------|----------|
| 8.1 | Añadir al estado del journey un bloque opcional, ej. `pawsDetails` o `petPreferences`, con los campos del doc. | `store/slices/journeyStore.ts` |
| 8.2 | Crear componente del paso (solo visible si type === 'paws'), en el orden definido (después de excusa o donde indique el doc). | Componente en `components/journey/` o `components/by-type/paws/` |
| 8.3 | Integrar en el flujo de `JourneyMainContent`. | `JourneyMainContent.tsx` |
| 8.4 | Mostrar en resumen y en payload de trip-request. | `JourneySummary`, API |

**Entregable:** En PAWS se muestra el paso de afinado mascotas, se guarda y se envía al backend.

**¿Aprobamos Fase 8 antes de seguir?** [ ]

---

## Fase 9: Bases del flujo NUPTIA (solo Atelier)
**Objetivo:** Preparar el flujo distinto para honeymoon sin implementar todo el 1:1.

| # | Tarea | Archivos |
|---|--------|----------|
| 9.1 | Asegurar que para type === 'honeymoon' solo se ofrezca Atelier (ya está en parte; consolidar con la fuente única de niveles). | Config de niveles / producto |
| 9.2 | Tras elegir Atelier en honeymoon: redirigir o marcar flujo “Atelier Access” (ej. ruta `/atelier-access` o estado `flow: 'atelier'`). No implementar aún sesiones 1:1 ni diseño del viaje. | Journey: redirección o estado; opcional: página stub “Atelier Access – Próximamente” o contacto. |
| 9.3 | Documentar en código o en este doc los pasos futuros: Sesiones 1:1, Diseño del viaje, Confirmación, Pago, Reveal. | Comentarios o `docs/` |

**Entregable:** Honeymoon solo muestra Atelier; al elegirlo se dejan bases para un flujo separado (stub o redirección); resto del flujo normal no se muestra para NUPTIA hasta que se implemente.

**¿Aprobamos Fase 9 antes de seguir?** [ ]

---

## Resumen de fases

| Fase | Nombre corto | Aprobado |
|------|----------------|----------|
| 1 | Estructura de datos y filtro alojamiento | [ ] |
| 2 | Precios | [ ] |
| 3 | PAWS en paso 1 y labels | [ ] |
| 4 | Unificación niveles | [ ] |
| 5 | Excusas por tipo en carpeta | [ ] |
| 6 | Filtro tipo alojamiento en UI | [ ] |
| 7 | Paso KIN “Quién viaja” | [ ] |
| 8 | Paso PAWS “Afinar detalles” | [ ] |
| 9 | Bases flujo NUPTIA | [ ] |

Cuando apruebes una fase, responde "Aprobada Fase X" y seguimos con la siguiente; si querés cambiar algo de una fase, dilo y ajustamos el plan antes de codear.
