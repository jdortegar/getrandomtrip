import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { prompt, context } = await request.json();

  // Simulate AI response
  const suggestions = {
    titles: [
      `El Arte de Viajar Solo: ${prompt}`,
      `Descubre ${prompt}: Una Guía Inesperada`,
      `Serendipia en ${prompt}: Mi Experiencia`,
    ],
    subtitles: [
      `Explorando lo desconocido con ${context}.`,
      `Más allá de los mapas: ${context}.`,
      `Una perspectiva única sobre ${context}.`,
    ],
    rewrites: [
      `Versión 1: ${context}. Pero con un toque más aventurero.`,
      `Versión 2: ${context}. Con un enfoque más poético.`,
    ],
  };

  return NextResponse.json(suggestions);
}
