// src/content/bitacoras/types.ts
export type Tag = "Aventura"|"Gastronomía"|"Naturaleza"|"Lujo"|"Cultura"|"Familias"|"Parejas"|"Amigos"|"Roadtrip"|"Wellness"|"Playas"|"Navegación"|"Relajo"|"Deportes Acuáticos"|"Seguridad"|"Buceo"|"Surf"|"Fotografía"|"Fiesta"|"Invierno"|"Historia"|"Música"|"Autenticidad"|"Trekking"|"Ecoturismo"|"Vida Salvaje"|"Café"|"Expedición"|"Volcanes"|"Ciencia"|"Arte"|"Espiritualidad"|"Ron"|"Ciudad";
export interface SeasonHint { months: string; why: string; } // ej: "May–Sep", "clima seco en Andes"
export interface Idea { title: string; blurb: string; }
export interface Faq { q: string; a: string; }

export interface CountryCopy {
  slug: string;                // "/argentina"
  name: string;                // "Argentina"
  seoTitle: string;            // 55–65 chars
  seoDescription: string;      // 140–160 chars
  h1: string;                  // H1 visible
  heroKicker?: string;         // peq. sobre-título opcional
  heroHeadline: string;        // 1 frase potente
  heroSub: string;             // 1–2 frases
  ctaLabel: string;            // "Diseñar mi viaje"
  reasonsToGo: string[];       // 4–6 bullets (máx 12 palabras c/u)
  bestFor: Tag[];              // 3–6 tags
  whenToGo: SeasonHint[];      // 2–4 rangos
  signatureExperiences: string[]; // 5–8 experiencias icónicas
  ideas: Idea[];               // 2–4 ideas de itinerario
  faqs: Faq[];                 // 3–5 FAQs
  // Assets
  heroVideo?: string;          // "/videos/argentina.mp4"
  heroImage: string;           // "/images/bitacoras/argentina.jpg"
  gallery?: string[];          // imágenes adicionales
}