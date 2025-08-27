# User Flow: El Viaje del Tripper

Este documento describe el viaje completo del usuario a través de la plataforma Randomtrip, desde la inspiración inicial hasta la revelación del destino. Es nuestra hoja de ruta para el desarrollo.

---

### Fase 1: Inspiración y Descubrimiento (El "Hook")

**Objetivo:** Captar el interés, generar confianza y comunicar la propuesta de valor.

1.  **Página de Aterrizaje (Landing Page):**
    *   El usuario llega a la página principal o a una página de tipo de viaje (`/viajes/familias`, `/viajes/parejas`).
    *   **Propósito:** Presentar el concepto de "viaje sorpresa" de forma clara y atractiva.
    *   **Componentes Clave:** Hero, propuesta de valor (`IntroBlock.tsx`), testimonios, CTA principal ("Comenzar a planificar").

2.  **Bitácoras de Viaje (`/bitacoras`):**
    *   El usuario explora guías detalladas de destinos.
    *   **Propósito:** No es un catálogo para elegir, sino una **prueba de calidad**. Demuestra el tipo de curaduría y experiencias que Randomtrip ofrece, generando confianza y deseo.
    *   **Componentes Clave:** Página índice con tarjetas (`DestinationCard.tsx`), página de detalle de destino (`/bitacoras/[slug]`).

---

### Fase 2: El Planificador Interactivo (El "Core Loop")

**Objetivo:** Permitir al usuario configurar su viaje de forma fluida y dinámica en una única interfaz, viendo el impacto de sus decisiones en tiempo real.

1.  **Página del Planificador (`/planner`):**
    *   El usuario llega aquí tras hacer clic en "Comenzar a planificar". Es el corazón de la experiencia interactiva.
    *   **Acción Backend (al cargar):** Se crea una `Booking` inicial con estado `DRAFT`. (`POST /api/bookings`). El `bookingId` se guarda en el estado del frontend.

2.  **Layout de la Página:**
    *   **Panel Principal (Izquierda/Centro):** Contiene todas las opciones de configuración, agrupadas por secciones. El usuario puede completarlas en cualquier orden.
        *   **¿Quién viaja?** (Pareja, Familia, Solo, etc.)
        *   **Nivel de Experiencia** (Essenza, Signature, Apex)
        *   **Logística:** Ciudad de origen, fechas, duración, viajeros.
        *   **Preferencias y Filtros:** Opciones para acotar la sorpresa (ej. "Solo playa", "Aventura").
        *   **Add-ons:** Extras opcionales (cenas, tours, etc.).
    *   **Panel de Resumen (Derecha/Flotante):**
        *   Una tarjeta que se actualiza **en tiempo real** cada vez que el usuario cambia una opción.
        *   Muestra el desglose del precio: Precio base, costo de filtros, costo de add-ons y **Precio Total**.
        *   Contiene el botón final de "Continuar a la reserva".

3.  **Interacción y Backend:**
    *   Cada vez que el usuario modifica una opción (ej. cambia el nivel de experiencia), se envía una petición al backend para actualizar la reserva.
    *   **Acción Backend (en cada cambio):** `PATCH /api/bookings/:id` con el campo modificado. El backend recalcula el precio y devuelve el objeto `Booking` actualizado. El frontend actualiza el panel de resumen.

---

### Fase 3: Reserva y Confirmación (El "Commitment")

**Objetivo:** Formalizar la reserva y procesar el pago de forma segura.

1.  **Página de Resumen y Pago (`/checkout/:bookingId`):**
    *   El usuario es dirigido aquí tras pulsar "Continuar a la reserva".
    *   **Propósito:** Mostrar un resumen final y claro de todo lo seleccionado antes de realizar el pago.
    *   **Acción Frontend:** Obtiene los datos finales de la reserva. (`GET /api/bookings/:id`).
    *   El usuario confirma y se inicia el proceso de pago.

2.  **Pasarela de Pago (Mercado Pago):**
    *   **Acción Backend:** Se crea una preferencia de pago en Mercado Pago y se redirige al usuario. (`POST /api/checkout`).

---

### Fase 4: La Experiencia Post-Reserva (La "Anticipación y Revelación")

**Objetivo:** Mantener la emoción alta y entregar la revelación del destino como un evento memorable.

1.  **Página de Post-Compra (`/confirmacion`):**
    *   El usuario es redirigido desde Mercado Pago (`?status=success`).
    *   Se le felicita y se le explica que la cuenta regresiva ha comenzado.
    *   **Acción Backend (Webhook):** Un webhook de Mercado Pago actualiza el estado de la `Booking` a `CONFIRMED` y **asigna el destino final**.

2.  **Secuencia de Emails de Anticipación:**
    *   El usuario recibe una serie de correos para mantener la emoción:
        *   **Email 1 (Inmediato):** Confirmación de compra. "¡Tu aventura está en marcha!".
        *   **Email 2 (7 días antes):** "Un pequeño adelanto... Prepara ropa para un clima [cálido/frío/templado]".
        *   **Email 3 (3 días antes):** "La cuenta regresiva final ha comenzado".

3.  **La Gran Revelación (`/revelacion/:bookingId`):**
    *   48 horas antes del viaje, se habilita el acceso.
    *   El usuario accede a una página especial con una animación o experiencia interactiva que revela el destino.
    *   **Acción Frontend:** Llama al endpoint de revelación. (`GET /api/bookings/:id/reveal`).
    *   **Email de Revelación:** Simultáneamente, recibe un email: "¡Tu Aventura Randomtrip te espera en... **[DESTINO]**!" con todos los detalles, itinerario, vuelos, y documentos de viaje.
