import {
  parseTranslationTexts,
  translationMessages,
  type TranslationLocale,
  type TranslationPiece,
} from "@/lib/ai/translationRequest";

const DEFAULT_MODEL = "gpt-4.1-nano";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

export class AiServiceError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AiServiceError";
    this.status = status;
  }
}

interface ChatCompletion {
  choices?: Array<{ message?: { content?: string | null } }>;
}

/**
 * Server-side AI entry point. Translation is the only task so far.
 * Drafting and grammar edits should be added here as further methods.
 */
async function completeJson(system: string, user: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AiServiceError("AI is not configured", 503);

  const response = await fetch(OPENAI_CHAT_URL, {
    body: JSON.stringify({
      messages: [
        { content: system, role: "system" },
        { content: user, role: "user" },
      ],
      model: process.env.OPENAI_TRANSLATION_MODEL || DEFAULT_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) throw new AiServiceError("AI request failed", 502);

  const payload = (await response.json()) as ChatCompletion;
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new AiServiceError("AI request failed", 502);
  return content;
}

export const aiService = {
  async translate(pieces: TranslationPiece[], target: TranslationLocale): Promise<string[]> {
    const messages = translationMessages({ pieces, target });
    const raw = await completeJson(messages.system, messages.user);
    const texts = parseTranslationTexts(raw, pieces.length);
    return texts.map((text, index) => (text.trim() ? text : pieces[index].text));
  },
};
