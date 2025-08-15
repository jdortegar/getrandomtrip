import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { query, personaId } = await req.json();

  const localResponses: Record<string, string[]> = {
    mx: [
      "Claro que sí, amigo. Por aquí cerca tienes una taquería increíble que casi nadie conoce.",
      "Anímate a visitar el mercado local, la fruta está de lujo.",
    ],
    ar: [
      "Copate con una caminata por la costanera, vas a ver un atardecer increíble.",
      "Acá cerca hay una pizzería que es un golazo, probá la fugazzeta.",
    ],
    us: [
      "There's a cozy coffee shop around the corner that locals love.",
      "You should check out the farmer's market nearby; it's full of fresh produce.",
    ],
  };

  const responses = localResponses[personaId] || ["Enjoy your trip!"];
  const message = responses[Math.floor(Math.random() * responses.length)];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(JSON.stringify({ message }) + "\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}