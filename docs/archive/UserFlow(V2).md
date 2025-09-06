UserFlow vNext (2025)
0. Principios y experiencia

Visión: ofrecer rutas sorpresa donde el usuario deja que Randomtrip planifique su viaje; sólo descubre el destino al final. "Donde termina la rutina, comienza la aventura" es la promesa central
getrandomtrip.netlify.app
.

Flujo único con múltiples entradas: distintos puntos de entrada (Por viajero, Top Trippers, Roadtrips…), pero convergen en el mismo funnel de creación de booking.

Precios dinámicos: el precio se calcula en backend y se actualiza en vivo durante la configuración. El booking es la fuente de verdad; cada cambio se guarda vía PATCH.

Experiencia emotiva: se busca generar anticipación con emails previos y una revelación del destino 48 h antes del viaje.

Calidad y accesibilidad: paleta neutra (bg-neutral-50, texto text-neutral-900), tokenización con clases rt-*, contrastes AA y meta tags (color-scheme: light, theme-color: #fafafa). Todas las imágenes usan next/image mediante el wrapper Img con dominios permitidos. Se usan helpers de formato (formatUSD) para evitar mismatch de hidratación.

Roles y paneles: tres roles (client, tripper, admin) con paneles diferenciados. Redirección automática post‑login según rol o returnTo.

1. Mapa de etapas

Entrada

Por Viajero (/packages/by-type/[type])

Top Trippers (/tripper-finder)

Roadtrips (/roadtrips)

Historias/inspiraciones (/blog)

Usuarios logueados son redirigidos a su panel (/dashboard o /tripper).

Configuración (Planner)

Selección de nivel (Essenza/Explora/Exclusive) y número de noches.

Captura logística: origen, fechas, pax, tipo de viajero.

Filtros opcionales (transporte, clima, tiempo de viaje, horarios, destinos prohibidos).

Add‑ons

Cancelación, seguro de viaje, selección de asiento, equipajes, eSIM, upgrades, transfers, alquiler de vehículos, experiencias gastronómicas/turísticas, early/late check‑in/out.

Resumen & Checkout

/journey/summary: breakdown base + filtros + add‑ons (por persona y total).

/journey/checkout: datos de contacto y pago (Stripe). Booking pasa a PENDING_PAYMENT.

Confirmación & Revelación

/journey/confirmation: email inmediato + countdown + CTA compartir viaje.

/revelacion/[bookingId]: disponible 48 h antes; revela destino y detalles.

2. Rutas reales (Next.js)
Marketing	Ruta	Detalle
Home	/	Landing con llamada a la acción y secciones de presupuestos
getrandomtrip.netlify.app
.
Por viajero	/packages/by-type/[type]	Entrada principal, config por nivel y logística.
Top Trippers	/tripper-finder	Mosaico de creadores y sus paquetes.
Roadtrips	/roadtrips	Explorar roadtrips destacados.
Iniciar sesión	/login	UI mínima; abre modal si no hay sesión. Si autenticado, redirige a returnTo o dashboard por rol.
Perfil privado	/profile	Muestra datos del usuario; banner de visibilidad; enlace a /u/{handle} si publicProfile.
Editar perfil	/profile/edit	Edita nombre, email, preferencias, toggles (publicProfile).
Perfil público	/u/[handle]	Vista pública; 404 si el handle no existe.
Dashboard cliente	/dashboard	KPI (reservas, gasto, próximos viajes, mensajes) + acciones rápidas.
Tripper OS	/tripper	Panel de Trippers (Mis Rutas, Ganancias, etc.). Protegido por <TripperGuard/>.
3. Entradas al flujo
3.1 By Traveller

El usuario selecciona nivel y noches. Se crea un booking en estado DRAFT (POST /api/bookings) y se persiste el bookingId. Luego se completa logística (origen, fechas, pax) y se guarda (PATCH /api/bookings/:id). Finalmente se definen filtros y se pasa a add‑ons.

3.2 Top Trippers / Roadtrips

El usuario navega un catálogo de creadores o roadtrips. Al seleccionar uno, se inicia el plan con la ruta preconfigurada y se salta la pantalla de filtros. Se aplica bookingId y se permite añadir add‑ons.

3.3 Historias / blog

Contenidos inspiradores en /blog. Los CTAs conducen al planificador, creando booking al momento.

4. Autenticación y perfiles

AuthModal: implementado via modal (signin, signup, onboarding). El usuario puede registrarse o iniciar sesión desde cualquier página.

Post-login: tras autenticación, la página /login redirige automáticamente a returnTo (si existe y comienza con /) o al dashboard del rol (client→/dashboard, tripper→/tripper, admin→/admin). Esto ocurre dentro de un <Suspense> para cumplir con Next.js.

Navbar: al estar logueado, muestra enlaces: Mi perfil público (/profile), Editar perfil (/profile/edit), Mi panel (/dashboard), Panel de Tripper (solo si role='tripper'), y cerrar sesión.

Store: user contiene id, name, email, role?, handle?, avatar?, prefs (travelerType, budget, country, verified, bio, publicProfile), socials?, metrics?. Acciones: updateAccount(name?, email?) y upsertPrefs(partial).

Perfil público: route /u/[handle] muestra avatar, nombre, handle, país, bio, verificación y métricas. Si no hay handle, devuelve 404. En /profile/edit se puede copiar el enlace y activar/desactivar publicProfile.

TripperGuard: componente que protege /tripper. Si no hay sesión, redirige a /login?returnTo=/tripper; si el usuario no es tripper, redirige a /dashboard.

5. Planner y booking
5.1 Crear booking

Se ejecuta POST /api/bookings para crear un objeto en estado DRAFT con pricing inicial (base, filters, addOns). La respuesta se almacena localmente y se envía en cada paso.

5.2 Logística y filtros

Los campos obligatorios: origen, fecha inicio, fecha fin (o noches), número de pasajeros, tipo de viajero. Cada nivel tiene restricciones de noches (por ejemplo Essenza 2–4 noches, Explora 2–6 noches).

Filtros incluyen transporte (libre, avión, tren, coche), clima preferido, tiempo máximo de viaje, horarios de salida/retorno, destinos a evitar. Filtros freemium no alteran el precio; filtros premium añaden un markup. Cada cambio implica un PATCH.

5.3 Add‑ons

Lista de extras que se pueden añadir: seguro de cancelación, seguro de viaje, selección de asiento, equipaje de mano o 23 kg, eSIM de 5 GB, upgrades de alojamiento, transfers, alquiler de coche/moto/bici, experiencias gastronómicas o tours, early check‑in / late check‑out. Al activar un add‑on se hace PATCH y se actualiza la tabla de precios. El resumen muestra Base, Filtros, Add‑ons, Total por pax y Total de viaje.

5.4 Resumen & Checkout

/journey/summary: muestra desglose del coste y permite ir atrás a add‑ons o continuar al pago.

/journey/checkout: se recopilan datos de contacto y pago. Un POST /api/checkout crea la preferencia de pago y el booking pasa a PENDING_PAYMENT. Si el pago es exitoso (via webhook), cambia a CONFIRMED y se asigna un destino.

5.5 Confirmación & Revelación

/journey/confirmation: página con mensaje de éxito, indicador de countdown hasta el viaje y botones para añadir al calendario o compartir.

/revelacion/[bookingId]: disponible 48 h antes; una animación revela el destino, vuelos, hotel y recomendaciones.

6. Contrato técnico

Endpoints:

POST /api/bookings → crea booking DRAFT y devuelve id + pricing.

PATCH /api/bookings/:id → actualiza booking y recalcula precios.

GET /api/bookings/:id → recupera booking completo.

POST /api/checkout → crea preferencia de pago, marca booking PENDING_PAYMENT.

Webhook de pago: al confirmar, marca CONFIRMED y asigna destino aleatorio.

Estados: DRAFT → READY_FOR_CHECKOUT → PENDING_PAYMENT → CONFIRMED → REVEAL_AVAILABLE → TRIP_ACTIVE → COMPLETED (más PAYMENT_FAILED, CANCELED).

Estructura de booking: id, state, entry, who, level, logistics, filters, addOns, pricing (base, filters, addOns, totalPerPax, totalTrip), reveal (availableAt, destination).

Fórmula de pricing: totalTrip = (base + filtersFreemium + addOns) × pax + markups; totalPerPax = totalTrip / pax. El frontend no recalcula; sólo muestra booking.pricing.

7. Analítica

Registrar eventos en cada etapa:

view_home, cta_start, select_entry_point.

booking_create, booking_update (nivel, noches, filtros).

add_on_toggle con id y cantidad.

view_summary, start_checkout, payment_success / payment_fail, confirm_view.

reveal_view.

auth_open, auth_success(role), auto_redirect(dest), guard_tripper_blocked.

profile_visibility_toggle(on/off), public_profile_view(handle).

Puntos de abandono por etapa.

8. QA / E2E

Escenarios críticos a testear:

Flujo completo By Traveller: crear booking (planner, filtros, add‑ons, resumen, checkout) y validar precios/estados.

Login redirect: sin sesión → se abre modal y redirige a returnTo tras login; con sesión → redirección inmediata.

TripperGuard: invitado intenta /tripper → /login?returnTo=/tripper; cliente → /dashboard; tripper → accede.

Perfil público: toggle en /profile/edit; enlace copiablе; /u/[handle] muestra datos o 404.

Revelación: intentar acceder antes de 48 h (debería bloquear); después, mostrar destino.

Hydration & imágenes: no deben existir mismatches; todas las imágenes se sirven vía next/image.

9. Backlog y siguientes pasos

Conectar el backend real (endpoints de booking y checkout) y persistir datos.

Completar wizard “Crear Ruta” en el Tripper OS.

Módulos de Reviews/NPS y Ganancias (resumen y exportación).

Sistema de Promos y referidos.

Panel de admin para gestión de usuarios y bookings.

SEO/OG (generateMetadata) en páginas públicas (blog, /u/[handle]).

Copiar enlace de perfil público en /profile/edit con botón Copiar.

Mejorar la validación de fechas y campos en planner para UX robusta.

Consolidar métricas y analítica en un dashboard interno.

El presente UserFlow detalla el estado actual de Randomtrip y los pasos pendientes para un MVP completo. Se actualiza con la nueva lógica de login, perfiles, paneles y pricing dinámico, priorizando claridad de navegación y confiabilidad de datos. 

En él encontrarás un resumen de todo el viaje del usuario (desde la entrada al sitio hasta la revelación del destino) y las mejoras implementadas: redirección automática después del login según rol o returnTo, protección del panel tripper con TripperGuard, nuevos flujos para edición y publicación de perfil público en /u/[handle], y detalles sobre booking, add‑ons, resumen y pago. Además se incluyen orientaciones para el desarrollo futuro, como el backlog de módulos pendientes (wizard de creación de rutas, reviews, ganancias, etc.) y las directrices de UI/UX, accesibilidad y contraste.
