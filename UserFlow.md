# User Flow de Randomtrip

## Flujo Conceptual de Alto Nivel

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

---
<br>

## 🧾 Leyenda
- ▶️ Pantalla o paso visual
- 🔁 Decisión / bifurcación
- ❌ Error / fallback
- ✅ Acción / confirmación

---

## 🎯 Objetivo
Guiar al usuario paso a paso por un viaje sorpresa personalizado, con precio dinámico y experiencia emocional, hasta la revelación del destino.

---

## ✅ INICIO: Landing Page
    - ▶️ Hero con Titulo + Subtitulo + CTA **“RANDOMTRIPME!”**
    - ▶️ Secciones 1 - informativas: ¿Cómo funciona? · Beneficios Claves + CTA **'''GETRANDOMTRIP!”'''**
    - ▶️ Seccion 2 - Blog  '''Explora las historias de nuestros Trippers''' + CTA **'''GETRANDOMTRIP!”'''**
    - ▶️ Seccion 3 - ''' COMIENZA TU VIAJE ''' 
    El usuario elige una de las siguientes rutas:
        - ▶️ **By Traveller**: tipo de viajero (familia, pareja, grupo,      honeymoon, solo [+30%])
        - ▶️ **Top Trippers**: grid de 9 trippers + buscador de influencers/asesores
        - ▶️ **Roadtrip**: tarjetas según vehículo (auto, moto, bici)
        - ▶️ **Trippers Decode**: buscador destino + mes con guías verificados (add‑ons reducidos)
    - ▶️ Seccion 4 - '''Descubre tu próxima experiencia con Ticketmaster''' + CTA **'''GETRANDOMTRIP!”'''**
    - ▶️ Seccion 5 - '''¿Listo para la aventura?''' + CTA **'''GETRANDOMTRIP!”'''** 
    - Footer con links a diferentes landings de la pagina
    - Cierre: Comparte tus viajes (Redes Sociales) - © 2025 Randomtrip. Wonder. Wander. Repeat.

🔁 Cada ruta conduce a su landing correspondiente, para el paso de selección de nivel de experiencia y algunos detalles adicionales en relacion a la ruta/opcion elegida.

---

## 1.5. Autenticación y Perfil de Usuario
    - ▶️ **Navbar (Ícono de Perfil):**
        - 🔁 **Sin sesión:** Click en ícono de perfil abre **Modal de Autenticación**.
        - 🔁 **Con sesión:** Click en ícono de perfil muestra **Menú Desplegable** con opciones:
            - ▶️ '''Mis Viajes''' → Navega a `/dashboard`.
            - ▶️ '''Mi Perfil''' → Navega a `/login`.
            - ✅ '''Cerrar Sesión''' → Cierra la sesión del usuario.
    - ▶️ **Modal de Autenticación (AuthModal):**
        - **Paso 1: Sign In / Sign Up (Demo):** Permite iniciar sesión o registrarse (dummy).
        - **Paso 2: Onboarding de Preferencias:** Preguntas sobre tipo de viajero, intereses, cosas a evitar y presupuesto.
        - **Paso 3: Revisión y Confirmación:** Muestra un resumen de las preferencias y cierra el modal.
    - ▶️ **Página '''Mis Viajes''' (`/dashboard`):**
        - ▶️ Layout moderno con pestañas: '''Próximos''', '''Pasados''', '''Cancelados'''.
        - ▶️ En '''Próximos''': Tarjeta destacada del próximo viaje con countdown en vivo.
        - ▶️ Historial de Pagos.
        - ▶️ Tarjetas de viajes con imagen en '''Pasados''' y '''Cancelados'''.
    - ▶️ **Página '''Mi Perfil''' (`/login`):**
        - 🔁 **Sin sesión:** Abre automáticamente el Modal de Autenticación y muestra un fallback.
        - 🔁 **Con sesión:** Muestra el perfil del usuario con secciones:
            - ▶️ Datos Personales (nombre, email, editable dummy).
            - ▶️ Preferencias de Viaje (muestra intereses, dislikes, tipo de viajero, presupuesto; botón '''Editar''' abre el modal de onboarding).
            - ▶️ Métodos de Pago (placeholder).
            - ▶️ Pasajeros (placeholder).
            - ▶️ Privacidad y Seguridad (con botón '''Cerrar Sesión''').

---

## 2. Landings de Tab 1: Nivel/Tipo de Experiencia - By Traveller

    - ▶️ Landingpage de '''En Pareja'''
        - ▶️ Seccion 1 - Hero (Titulo - Subitulo - Chips -CTAs - Storytelling)
        - ✅ Seccion 2 - Nivel de Experiencia (Essenza, Explora, Explora+, Bivouac, Atelier)
            - 🔁 **Requiere Autenticación:** Al seleccionar una tarjeta de nivel de experiencia, si el usuario no está logueado, se abre el Modal de Autenticación.
        - ▶️ Seccion 3 - blog (filtrado -parejas-) '''Nuestros lugares favoritos para escapadas en pareja''' + CTA **'''RANDOMTRIP-us!”'''**
        - ▶️ Seccion 4 - Opinines '''Lo que dicen las parejas''' + CTA **'''RANDOMTRIP-us!”'''**
	- ✅ Avanzar a “Configuración Básica”

    - ▶️ Landingpage de '''Solo'''
        - ▶️ Seccion 1 - Hero (Titulo - Subitulo - Chips -CTAs - Storytelling)
        - ✅ Seccion 2 - Nivel de Experiencia (Essenza, Explora, Explora+, Bivouac, Atelier)
            - 🔁 **Requiere Autenticación:** Al seleccionar una tarjeta de nivel de experiencia, si el usuario no está logueado, se abre el Modal de Autenticación.
        - ▶️ Seccion 3 - blog (filtrado -Solo-) '''Nuestros destinos favoritos para viajar solo''' + CTA **'''RANDOMTRIP-me!”'''**
        - ▶️ Seccion 4 - Opinines '''Lo que dicen quienes viajaron solos''' + CTA **'''RANDOMTRIP-me!”'''**    
	- ✅ Avanzar a “Configuración Básica”
	- ▶️ Landingpage de '''En Familia'''

        - ▶️ Seccion 1 - Hero (Titulo - Subitulo - Chips -CTAs - Storytelling)
        - ✅ Seccion 2 - '''Comencemos a diseñar el Family Randomtrip''' (4 tabs - 1 de presentacion + 3 informacion/detalles extras de personalizacion)
            - ▶️ Seccion 2.1 - Presentacion Personalizada '''Viajar en familia tiene sus códigos (y los entendemos)'''
            - ▶️ Seccion 2.2 - Nivel de Experiencia/Presupuesto (Essenza, Explora, Explora+, Bivouac, Atelier)
                - 🔁 **Requiere Autenticación:** Al seleccionar una tarjeta de nivel de experiencia, si el usuario no está logueado, se abre el Modal de Autenticación.
            - ▶️ Seccion 2.3 - Tipo de viaje ('''Con los mas chicos'''; '''Con Adolescentes; '''Con hijos grandes'''; '''Con toda la familia''')
            - ▶️ Seccion 2.3 - Tipo de escapada ('''Aventura en familia'''; '''Naturaleza & Fauna'''; '''Cultura & Tradiciones'''; '''Payas & Dunas'''; '''Graduaciones & Celebraciones'''; '''Escapadas Madre-hij@ / Padre-hij@''')
        - ▶️ Seccion 3 - blog (filtrado -Familia-) '''Nuestros destinos favoritos para viajar en familia''' + CTA **'''RANDOMTRIP-we!”'''**
        - ▶️ Seccion 4 - Opinines '''Lo que dicen quienes viajaron solos''' + CTA **'''RANDOMTRIP-we!”'''**
	- ✅ Avanzar a “Configuración Básica”    
        
    - ▶️ Landingpage de '''En Grupo'''
        - ▶️ Seccion 1 - Hero (Titulo - Subitulo - Chips -CTAs - Storytelling)
        - ✅ Seccion 2 - '''De amigos a equipos: diseñen su Randomtrip''' (4 tabs - 1 de presentacion + 3 informacion/detalles extras de personalizacion)
            - ▶️ Seccion 2.1 - Presentacion Personalizada '''Viajar en grupo tiene sus códigos (y los entendemos)'''
            - ▶️ Seccion 2.2 - Nivel de Experiencia/Presupuesto (Essenza, Explora, Explora+, Bivouac, Atelier)
                - 🔁 **Requiere Autenticación:** Al seleccionar una tarjeta de nivel de experiencia, si el usuario no está logueado, se abre el Modal de Autenticación.
            - ▶️ Seccion 2.3 - Grupo & Alma ('''Narradores Visuales; Yoga & Bienestar; Religioso o Espiritual; Gastronómico; Historias & Fantasía; Naturaleza & Aventura; Amigos; Negocios; Estudiantes; Música & Festivales)
            - ▶️ Seccion 2.3 - Afinar detalles (4 Opciones personalizadas para opcion de '''Grupo & Alma)
        - ▶️ Seccion 3 - blog (filtrado -Grupo-) '''Nuestros destinos favoritos para viajar en grupo''' + CTA **'''Activar Randomtrip en grupo!”'''**
        - ▶️ Seccion 4 - Opinines '''Lo que dicen quienes viajaron solos''' + CTA **'''RANDOMTRIP-all!”'''**    
	- ✅ Avanzar a “Configuración Básica”

    - ▶️ Landingpage de '''En Honeymoon'''
        - ▶️ Seccion 1 - Hero (Titulo - Subitulo - Chips -CTAs - Storytelling)
        - ✅ Seccion 2 - '''Diseñen su Honeymoon Randomtrip''' (2 tabs de informacion/detalles extras de personalizacion)
            - ▶️ Seccion 2.1 - Nivel de Experiencia/Presupuesto (Essenza, Explora, Explora+, Bivouac, Atelier)
                - 🔁 **Requiere Autenticación:** Al seleccionar una tarjeta de nivel de experiencia, si el usuario no está logueado, se abre el Modal de Autenticación.
            - ▶️ Seccion 2.2 - Tipo de honeymoon (Naturaleza & Aventura, Cultura & Tradiciones, 	Playas & Dunas, Musica & Festivales)
        - ▶️ Seccion 3 - blog (filtrado -Honeymoon-) '''Destinos y escenas para su luna de miel''' + CTA **'''A disenar la luna de miel!”'''**
        - ▶️ Seccion 4 - Opinines '''Lo que dicen las parejas''' + CTA **'''RANDOMTRIP-us!”'''**
	- ✅ Avanzar a “Configuración Básica”

    - ▶️ Landingpage de '''Viajer@s con mascotas'''
        - ▶️ Seccion 1 - Hero (Titulo - Subitulo - Chips -CTAs - Storytelling)
        - ✅ Seccion 2 - '''Diseña el viaje con tu mascota''' (2 tabs de informacion/detalles extras de personalizacion)
            - ▶️ Seccion 2.1 - Nivel de Experiencia/Presupuesto (Essenza, Explora, Explora+, Bivouac, Atelier)
                - 🔁 **Requiere Autenticación:** Al seleccionar una tarjeta de nivel de experiencia, si el usuario no está logueado, se abre el Modal de Autenticación.
            - ▶️ Seccion 2.2 - Informacion de si va con mascota extra y se suma un 25% al precio de nivel de experiencia, tamano del perro, si es pequene opcion de viajar en cabina
        - ▶️ Seccion 3 - blog (filtrado -Masctoas-) '''Viajes y experiencas para ir con tu mascota''' + CTA **'''RANDOMTRIP-paws!”'''**
        - ▶️ Seccion 4 - Opinines '''Opiniones de quienes ya se animaron''' + CTA **'''RANDOMTRIP-paws!”'''**
	- ✅ Avanzar a “Configuración Básica”
   
## 3. Landings de Tab 2: Nivel de Experiencia - Top Tripper
    Landing [tripper], todos misma estructura:
        - ▶️ Seccion 1 - Hero Dividido en 2 columnas:
        De un lado(Foto- Nombre - Subitulo - Chips -CTAs - Storytelling)
        Del otro lado
            - ✅ Seccion 2 - '''Diseña el viaje con tu mascota''' (2 tabs de informacion/detalles extras de personalizacion)
            - ▶️ Seccion 2.1 - Nivel de Experiencia/Presupuesto (Essenza, Explora, Explora+, Bivouac, Atelier)
                - 🔁 **Requiere Autenticación:** Al seleccionar una tarjeta de nivel de experiencia, si el usuario no está logueado, se abre el Modal de Autenticación.
            - ▶️ Seccion 2.2 - Informacion de si va con mascota extra y se suma un 25% al precio de nivel de experiencia, tamano del perro, si es pequene opcion de viajar en cabina
        - ▶️ Seccion 3 - blog (filtrado -Masctoas-) '''Viajes y experiencas para ir con tu mascota''' + CTA **'''RANDOMTRIP-paws!”'''**
        - ▶️ Seccion 4 - Opinines '''Opiniones de quienes ya se animaron''' + CTA **'''RANDOMTRIP-paws!”'''**
        - ✅ Avanzar a “Configuración Básica”


## 3. Landings de Tab 3: Roadtrip
## 3. Nivel de Experiencia
## 3. Nivel de Experiencia
## 3. Nivel de Experiencia
## 3. Nivel de Experiencia
## 3. Nivel de Experiencia
## 3. Nivel de Experiencia
## 3. Nivel de Experiencia
## 3. Nivel de Experiencia


---

## 4. Configuración Básica
- ▶️ Seleccionar servicios básicos según nivel (alojamiento, transporte)
- ✅ Se calcula el **precio base**

---

## 5. Filtros Premium
- ▶️ Primer filtro gratis
- ▶️ Segundo y tercer filtro: USD 18 por persona cada uno
- ▶️ Cuarto filtro en adelante: USD 25 por persona
- ✅ El precio se actualiza automáticamente
```text
precio_total = precio_base + solo_markup + suma(filtros) + suma(add_ons)

---

## 6. Add‑ons según flujo
- ▶️ Roadtrip: formulario con origen, destino, presupuesto y alojamiento

- ▶️ Trippers Decode: add‑ons reducidos basados en la guía seleccionada

- ✅ El precio recalcula automáticamente

---

## 7. Resumen y Pago
- ▶️ Vista de destino estimado o ruta y precio total

- ✅ Permite editar filtros o add‑ons

- ▶️ Simulación de pago (Mercado Pago en MVP)

- ✅ Confirmación, creación de cuenta y activación de countdown

- 🔁 Si el pago falla → opción de reintentar o mostrar error

---

## 8. Post‑compra
- ▶️ Página de estado con resumen del viaje

- ✅ Countdown visible hasta revelación del destino

---

## 9. Revelación del Destino
- ▶️ Email automático 48 h antes con detalles finales del itinerario

- ✅ Pantalla de agradecimiento y cierre del flujo

- 🔁 Si el pago falla → se permite reintentar de inmediato

- ✅ Si el usuario no elige filtros o add‑ons → se continúa con el precio base

---

🧩 Integraciones técnicas
IA Kai / Gemini (fase 2): sugerencias personalizadas de ruta y experiencia

Google Maps API: vista previa de destino o ruta

Mercado Pago: pago simulado en MVP, real en fase 2

Email transaccional: confirmación y revelación

🎨 UX & Branding
Estilo aspiracional y premium (inspirado en Black Tomato)

Flujo unidireccional claro y objetivo por etapa

Transparencia en precios y control pleno del usuario

Feedback visual constante: barra de progreso, mensajes de error/éxito, validaciones

---

## 🔁 Casos especiales y bucles de decisión
- 🔁 Si falla la carga del mapa → se invita al usuario a ingresar el destino manualmente
- 🔁 Si el pago falla → se permite reintentar de inmediato
- ✅ Si el usuario no elige filtros o add‑ons → se continúa con el precio base