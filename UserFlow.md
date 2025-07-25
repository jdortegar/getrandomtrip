# User Flow de Randomtrip

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
- ▶️ Hero con CTA **“RandomtripME!”**  
- ▶️ Secciones informativas: ¿Cómo funciona? · Beneficios · Blog  
- ✅ Pulsar **Start Your Journey** para avanzar

---

## 2. Exploración Inicial  
El usuario elige una de las siguientes rutas:  
- ▶️ **Top Trippers**: grid + buscador de influencers/asesores  
- ▶️ **By Traveller**: tipo de viajero (familia, pareja, grupo, honeymoon, solo [+50 %])  
- ▶️ **Roadtrip**: tarjetas según vehículo (auto, moto, bici)  
- ▶️ **Trippers Decode**: buscador destino + mes con guías verificados (add‑ons reducidos)  

🔁 Cada ruta conduce al paso de selección de nivel de experiencia

---

## 3. Nivel de Experiencia  
- ▶️ Seleccionar nivel: Essenza, Explora, Explora+, Bivouac, Atelier  
- 🔁 Si el usuario es **Solo Traveller** → aplicar **+50 %** al precio base  
- ✅ Avanzar a “Configuración Básica”

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

- 🔁 Casos especiales y bucles de decisión
- 🔁 Si falla la carga del mapa → se invita al usuario a ingresar el destino manualmente

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