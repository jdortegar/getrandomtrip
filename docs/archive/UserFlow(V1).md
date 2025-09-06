# Randomtrip — User Flow Definitivo (v2)

*Última actualización: 6 de septiembre de 2025*

**Propósito:** Dar al equipo de desarrollo una visión ejecutable y unificada del flujo de usuario end-to-end. Este documento es la única fuente de verdad y combina el detalle técnico con la visión de producto, incluyendo rutas, componentes, contratos de API, estados y criterios de aceptación.

## 0. Principios y Experiencia de Usuario

*   **Visión:** Ofrecer rutas sorpresa donde el usuario deja que Randomtrip planifique su viaje; sólo descubre el destino al final. **"Donde termina la rutina, comienza la aventura"** es la promesa central.  
*   **Flujo Único con Múltiples Entradas:** Distintos puntos de entrada (Por viajero, Top Trippers, Roadtrips…), pero todos convergen en el mismo funnel de creación de booking: *configurar → add-ons → checkout → confirmación → revelación*.  
*   **Precios Dinámicos:** El precio se calcula en el backend y se actualiza en vivo durante la configuración. El booking es la fuente de verdad; cada cambio se guarda vía PATCH.  
*   **Experiencia Emocional:** Se busca generar anticipación con emails previos y una revelación del destino 48h antes del viaje como hito principal.  
*   **Calidad y Accesibilidad:** Paleta neutra (bg-neutral-50, text-neutral-900), tokenización con clases rt-*, contrastes AA y meta tags (color-scheme: light, theme-color: #fafafa). Todas las imágenes usan next/image mediante el wrapper Img con dominios permitidos. Se usan helpers de formato (formatUSD) para evitar mismatch de hidratación.  
*   **Roles y Paneles:** Tres roles (client, tripper, admin) con paneles diferenciados y redirección automática post-login según rol o returnTo.

## 1. Mapa de Etapas y Rutas

### 1.1 Mapa de Flujo (Alto Nivel)

```
[Landing / Entradas]
      │
      ├─ By Traveller → Nivel → Planner/Filtros → Add-ons → Resumen → Pago → Confirmación → Revelación
      ├─ Top Trippers → Nivel → Planner/Filtros → Add-ons → Resumen → Pago → Confirmación → Revelación
      ├─ Roadtrips    → Nivel →                (salta Filtros)    → Add-ons → Resumen → Pago → Confirmación → Revelación
      └─ Trippers Decode → Buscar destino → Seleccionar Tripper →                (salta Filtros)    → Add-ons → Resumen → Pago → Confirmación
```

### 1.2 Rutas Reales (Next.js)

| Sección | Ruta | Detalle |
| :---- | :---- | :---- |
| Home | / | Landing con llamada a la acción principal y secciones de presupuestos. |
| Iniciar Sesión | /login | UI mínima; abre modal si no hay sesión. Si autenticado, redirige a returnTo o dashboard por rol. |
| Perfil (Privado) | /profile | Muestra datos del usuario; banner de visibilidad. |
| Editar Perfil | /profile/edit | Edita nombre, email, preferencias, y toggle de publicProfile. |
| Perfil Público | /u/[handle] | Vista pública del perfil. 404 si el handle no existe. |
| Dashboard Cliente | /dashboard | KPI (reservas, gasto, etc.) + acciones rápidas. |
| Tripper OS | /tripper | Panel de Trippers (Mis Rutas, Ganancias, etc.). Protegido por <TripperGuard/>. |
| Por Viajero | /packages/by-type/[type] | Entrada principal al flujo de configuración. |
| Top Trippers | /tripper-finder | Mosaico de creadores y sus paquetes. |
| Roadtrips | /roadtrips | Explorar roadtrips destacados. |
| Blog/Historias | /blog | Contenido inspirador con CTAs al planificador. |
| Planner (Filtros) | /journey/basic-config | Configuración de logística y filtros. |
| Add-ons | /journey/add-ons | Selección de extras para el viaje. |
| Resumen | /journey/summary | Desglose de precios final antes del pago. |
| Checkout | /journey/checkout | Datos de contacto y pasarela de pago. |
| Confirmación | /journey/confirmation | Página de éxito post-pago con countdown. |
| Revelación | /revelacion/[bookingId] | Disponible 48h antes para revelar el destino. |

## 2. Puertas de Entrada (Descubrimiento)

### 2.1 By Traveller — /packages/by-type/[tipo]

*   **Objetivo:** El usuario selecciona un nivel (Essenza, Explora, etc.) para su tipo de viaje.  
*   **CA:** El CTA principal avanza a /journey/basic-config con los parámetros correspondientes, iniciando la creación del booking.

### 2.2 Top Trippers / Roadtrips

*   **Objetivo:** El usuario navega un catálogo de creadores o roadtrips.  
*   **CA:** Al seleccionar uno, se inicia el plan con una ruta pre-configurada y se salta la pantalla de filtros, pasando directamente a los Add-ons.

### 2.3 Historias / Blog

*   **Objetivo:** Inspirar al usuario con contenido.  
*   **CA:** Los CTAs dentro del contenido conducen al planificador, creando booking al momento.

## 3. Autenticación y Perfiles

*   **AuthModal:** Implementado vía modal con 3 pasos (signin/signup, onboarding, confirmación). El usuario puede registrarse o iniciar sesión desde cualquier página.  
*   **Post-login:** La página /login redirige automáticamente a returnTo (si existe y es una ruta local) o al dashboard correspondiente al rol (client→/dashboard, tripper→/tripper). Esto ocurre dentro de un <Suspense> para cumplir con Next.js.  
*   **Navbar:** Si el usuario está logueado, muestra enlaces a: Mi perfil público, Editar perfil, Mi panel, Panel de Tripper (si es tripper), y cerrar sesión.  
*   **Store de Usuario:** Contiene id, name, email, role?, handle?, avatar?, prefs (travelerType, budget, country, verified, bio, publicProfile), socials?, metrics?. Acciones: updateAccount(name?, email?) y upsertPrefs(partial).  
*   **Perfil Público (/u/[handle]):** Muestra avatar, nombre, handle, país, bio y métricas. En /profile/edit se puede copiar el enlace y activar/desactivar la visibilidad con publicProfile.  
*   **TripperGuard:** Componente que protege la ruta /tripper. Si el usuario no tiene sesión, redirige a /login?returnTo=/tripper; si el usuario no es tripper, redirige a /dashboard.

## 4. Planner y Booking

### 4.1 Creación y Ciclo de Vida del Booking

*   **Inicio:** Al entrar al planner, el front hace POST /api/bookings para crear un objeto en estado DRAFT y persiste el bookingId.  
*   **Actualización:** Cada cambio (fechas, filtros, add-ons) ejecuta un PATCH /api/bookings/:id y el backend devuelve el booking con precios recalculados.  
*   **Estados:** DRAFT → READY_FOR_CHECKOUT → PENDING_PAYMENT → CONFIRMED → REVEAL_AVAILABLE → TRIP_ACTIVE → COMPLETED. (Errores: PAYMENT_FAILED, CANCELED).

### 4.2 Logística y Filtros

*   **Campos obligatorios:** Origen, fechas/noches, número de pasajeros, tipo de viajero.  
*   **Filtros (Modelo Freemium):** Incluyen transporte, clima, tiempo de viaje, horarios y destinos a evitar. Los filtros "freemium" no alteran el precio; los "premium" añaden un costo.

## 5. Add-ons

*   **Ruta:** /journey/add-ons. Todas las entradas convergen aquí.  
*   **Catálogo:** Seguro de cancelación, seguro de viaje, selección de asiento, equipajes, eSIM, upgrades de alojamiento, transfers, alquiler de vehículos, experiencias, early/late check-in/out.  
*   **CA:** Cada toggle o cambio ejecuta un PATCH y el panel de resumen flotante actualiza los precios en tiempo real.

## 6. Resumen y Pago

*   **Resumen (/journey/summary):** Muestra el desglose final: Base + Filtros + Add-ons = Total (por persona y total del viaje).  
*   **Checkout (/journey/checkout):** Se recopilan datos de contacto y pago. Un POST /api/checkout crea la preferencia de pago y el booking pasa a PENDING_PAYMENT.  
*   **Webhook de Pago:** Al recibir la confirmación de la pasarela, el booking cambia a CONFIRMED y el backend asigna un destino aleatorio.

## 7. Confirmación y Revelación

*   **Confirmación (/journey/confirmation):** Página de éxito con un countdown hasta el viaje y CTAs para añadir al calendario o compartir.  
*   **Emails de Anticipación:** Se envían emails para generar expectativa (confirmación, pistas de clima, preparativos).  
*   **Revelación (/revelacion/[bookingId]):** Disponible 48h antes del viaje. Una animación revela el destino, vuelos, hotel y recomendaciones.

## 8. Contrato Técnico (MVP)

### 8.1 Endpoints

POST   /api/bookings           # Crea un booking en estado DRAFT.  
GET    /api/bookings/:id       # Recupera un booking completo.  
PATCH  /api/bookings/:id       # Actualiza el booking y recalcula precios.  
POST   /api/checkout           # Crea la preferencia de pago.  
POST   /api/webhooks/payment   # Webhook que confirma el pago y asigna destino.  
GET    /api/bookings/:id/reveal # Valida si la revelación está disponible.

### 8.2 Esquema Mínimo de Booking

```json
{
  "id": "bk_123",
  "state": "DRAFT",
  "entry": { "type": "by-traveller|tripper|roadtrip|decode", "meta": {} },
  "who": { "type": "couple|family|group|solo|honeymoon|paws" },
  "level": "essenza|explora|explora_plus|bivouac|atelier",
  "logistics": { "origin": "BUE", "startDate": "2025-10-01", "nights": 4, "pax": 2 },
  "filters": {
    "transport": "plane",
    "climate": "calido",
    "avoidDestinations": ["Rio de Janeiro"]
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
  "reveal": { "availableAt": "2025-09-29T12:00:00Z", "destination": null }
}
```

## 9. Analítica (Eventos)

*   view_home, cta_start, select_entry_point  
*   booking_create, booking_update (con detalles del campo modificado)  
*   add_on_toggle (con id del add-on)  
*   view_summary, start_checkout, payment_success / payment_fail  
*   confirm_view, reveal_view  
*   auth_open, auth_success(role), auto_redirect(dest)  
*   guard_tripper_blocked  
*   profile_visibility_toggle(on/off), public_profile_view(handle)

## 10. QA / E2E (Escenarios Críticos)

1.  **Flujo Completo (By Traveller):** Crear booking, configurar logística, filtros, add-ons, pagar y validar precios y estados en cada paso.  
2.  **Flujo Abreviado (Roadtrip):** Validar que se salta correctamente la sección de filtros.  
3.  **Login Redirect:** Probar que un usuario sin sesión es enviado al modal y redirigido a returnTo tras el login.  
4.  **TripperGuard:** Probar que un client es redirigido a /dashboard si intenta acceder a /tripper.  
5.  **Perfil Público:** Testear el toggle de visibilidad y que la URL /u/[handle] muestra los datos correctos o un 404.  
6.  **Gate de Revelación:** Confirmar que el acceso a la revelación está bloqueado antes de las 48h y permitido después.  
7.  **Hydration & imágenes:** No deben existir mismatches; todas las imágenes se sirven vía next/image.

## 11. Edge Cases y Fallbacks

*   **Fallo de Pago:** Permitir reintentos manteniendo el estado del booking.  
*   **Fallo de APIs Externas (Mapas, etc.):** Mostrar fallbacks con texto e imágenes estáticas.  
*   **Validación:** Usar Zod en el backend para validar todos los payloads de la API.

## 12. Backlog y Roadmap

### 12.1 Backlog para el MVP

1.  Conectar el backend real: POST/PATCH/GET /api/bookings y POST /api/checkout.  
2.  Completar UI del Planner y Add-ons con resumen de precio en vivo.  
3.  Implementar webhook de pago para cambiar estado a CONFIRMED.  
4.  Desarrollar la página de confirmación con countdown.  
5.  Crear el gate de tiempo para la página de revelación.  
6.  Implementar métricas y analítica del embudo principal.

### 12.2 Roadmap Post-MVP

*   Completar wizard "Crear Ruta" en el Tripper OS.  
*   Módulos de Reviews/NPS y Ganancias para Trippers.  
*   Sistema de Promociones y referidos.  
*   Panel de Admin para gestión de usuarios y bookings.  
*   SEO y Open Graph (generateMetadata) en páginas públicas (blog, /u/[handle]).  
*   Mejorar validación de campos en el planner para una UX más robusta.

## 13. Glosario

*   **Nivel:** Categoría del viaje (Essenza, Explora, etc.) que define el precio base y las reglas.  
*   **Planner:** Interfaz donde el usuario configura su viaje (logística, filtros, add-ons).  
*   **Booking:** La entidad central que almacena todo el estado de un viaje.  
*   **Revelación:** El evento clave 48h antes del viaje donde se desvela el destino.