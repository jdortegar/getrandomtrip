import type { BlogPost } from "./types";

export const demoPosts: BlogPost[] = [
  {
    id: "1",
    title: "Mi primer viaje sorpresa",
    subtitle: "Cómo un fin de semana se convirtió en transformación",
    tagline: "Serendipia en estado puro",
    coverUrl: "/images/placeholders/cover-1.jpg",
    tags: ["inspiración", "weekend", "pareja"],
    authorHandle: "demo.tripper",
    blocks: [
      { type: "paragraph", text: "Este es un ejemplo de párrafo inicial." },
      { type: "image", url: "/images/placeholders/photo-1.jpg", caption: "Momento dorado" },
      { type: "quote", text: "Viajar es vivir dos veces.", cite: "Omar Khayyam" },
      { type: "embed", provider: "youtube", url: "https://www.youtube.com/embed/xxxx" }
    ],
    createdAt: "2025-08-01T10:00:00Z",
    updatedAt: "2025-08-02T10:00:00Z",
    status: "draft"
  },
  {
    id: "2",
    title: "Aventura en la montaña",
    tags: ["aventura", "outdoors"],
    blocks: [{ type: "paragraph", text: "Explorando nuevas alturas." }],
    status: "published"
  }
];
