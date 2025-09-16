import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- 1. Define Personas --- 
const systemInstructions = {
  default: 'Eres un útil y amigable asistente de viajes. Tu nombre es Aura. Hablas un español neutro y claro, enfocado en dar información precisa y útil.',
  mateo_argentina: "Sos Mateo, un guía de viajes argentino de Buenos Aires. Tu tono es amigable, un poco canchero y siempre con buena onda. Te encanta el fútbol, el asado y la cultura popular argentina. Usá expresiones como 'che', 'vos', 'posta', 'quilombo' (en sentido de lío o problema), 'bajón', 're', 'onda', 'pibe/mina'. Tus respuestas deben ser concisas, directas y con un toque de humor, dando consejos prácticos sobre destinos exóticos y experiencias de viaje, siempre con tu impronta porteña. Evitá formalismos excesivos.",
  sofia_espana: "Eres Sofía, una guía de viajes de Madrid, España. Tu tono es extrovertido, directo y con mucha energía. Eres apasionada por la historia, la gastronomía y las tradiciones españolas. Usas expresiones españolas como 'tío/tía', 'vale', 'mola', 'flipar', 'guay', 'ir de tapas', 'qué pasada'. Tus respuestas deben ser animadas, llenas de entusiasmo y con un toque de salero español, ofreciendo consejos de viaje que inspiren a vivir la aventura al máximo. Habla con naturalidad y evita sonar como un robot.",
  carlos_mexico: "Eres Carlos, un guía de viajes mexicano de la Ciudad de México. Tu tono es cálido, servicial y muy amigable. Te encanta la comida, la música y las tradiciones de México. Usa expresiones como 'órale', 'qué onda', 'chido', 'padre', 'no manches', 'a poco', 'wey' (con cautela y solo si es apropiado). Tus respuestas deben ser detalladas, con un toque de picardía y siempre ofreciendo recomendaciones auténticas y experiencias inolvidables, con tu inconfundible sabor mexicano."
};

const MODEL_NAME = "gemini-1.5-flash";
const API_KEY = process.env.GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

const generationConfig = {
  temperature: 0.9,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export async function POST(request: Request) {
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "API key not found" }), { status: 500 });
  }

  try {
    // --- 2. Extract persona from request --- 
    const { history, latitude, longitude, persona } = await request.json();

    // --- 3. Select system instruction dynamically ---
    const systemInstruction = systemInstructions[persona as keyof typeof systemInstructions] || systemInstructions.default;

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig,
      safetySettings,
      systemInstruction: systemInstruction, // Use the dynamic instruction
    });

    // Isolate the conversation history from the latest user prompt.
    const conversationHistory = history.slice(0, -1);
    const latestMessage = history[history.length - 1];

    if (!latestMessage || latestMessage.type !== 'user') {
        return new Response(JSON.stringify({ error: "No user message found" }), { status: 400 });
    }

    // Find the start of the actual conversation (the first user message).
    const firstUserMessageIndex = conversationHistory.findIndex((msg: { type: string }) => msg.type === 'user');

    // Create a clean history for Gemini, starting from the first user interaction.
    const cleanHistoryForGemini = (firstUserMessageIndex !== -1)
      ? conversationHistory.slice(firstUserMessageIndex)
      : [];

    const chat = model.startChat({
      history: cleanHistoryForGemini.map((msg: any) => ({
        role: msg.type === 'user' ? "user" : "model",
        parts: [{ text: msg.text }],
      })),
    });

    let userMessageContent = latestMessage.text;
    if (latitude && longitude) {
      userMessageContent = `Mi ubicación actual es Latitud: ${latitude}, Longitud: ${longitude}. ${userMessageContent}`;
    }

    const result = await chat.sendMessageStream(userMessageContent);

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          try {
            const chunkText = chunk.text();
            controller.enqueue(encoder.encode(JSON.stringify({ text: chunkText, sources: [] })));
          } catch (error) {
            console.error("Error processing chunk:", error);
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Error in Gemini API route:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}