import { withTranslationCache, writeCachedTranslation } from "@/lib/ai/translationCache";
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
  choices?: Array<{
    finish_reason?: string | null;
    message?: { content?: string | null };
  }>;
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
      max_completion_tokens: 16_384,
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

  const payloadText = await response.text();
  if (!response.ok) {
    console.error(`OpenAI translation HTTP ${response.status}`, payloadText.slice(0, 400));
    throw new AiServiceError("AI request failed", 502);
  }

  let payload: ChatCompletion;
  try {
    payload = JSON.parse(payloadText) as ChatCompletion;
  } catch {
    throw new AiServiceError("AI request failed", 502);
  }
  const choice = payload.choices?.[0];
  const content = choice?.message?.content;
  if (!content) throw new AiServiceError("AI request failed", 502);
  if (choice.finish_reason && choice.finish_reason !== "stop") {
    console.error(
      `OpenAI translation finish_reason=${choice.finish_reason} chars=${content.length}`,
      content.slice(-200),
    );
    throw new AiServiceError("AI request failed", 502);
  }
  return content;
}

async function translateBatch(
  batch: TranslationPiece[],
  target: TranslationLocale,
): Promise<string[]> {
  const messages = translationMessages({ pieces: batch, target });
  const raw = await completeJson(messages.system, messages.user);
  try {
    const translated = parseTranslationTexts(raw, batch.length);
    return translated.map((text, index) => {
      const piece = batch[index];
      const next = text.trim() ? text : piece.text;
      writeCachedTranslation(piece, target, next);
      return next;
    });
  } catch (error) {
    let detail = "unparseable";
    try {
      const parsed = JSON.parse(raw) as { texts?: unknown };
      detail = Array.isArray(parsed.texts)
        ? `len=${parsed.texts.length} types=${parsed.texts.map((text) => typeof text).join(",")}`
        : `texts=${typeof parsed.texts}`;
    } catch (parseError) {
      detail = `json:${(parseError as Error).message}`;
    }
    console.error(
      `OpenAI translation JSON invalid pieces=${batch.length} chars=${raw.length} ${detail}`,
    );
    if (batch.length === 1) throw error;
    const texts: string[] = [];
    for (const piece of batch) {
      texts.push(...(await translateBatch([piece], target)));
    }
    return texts;
  }
}

export const aiService = {
  async translate(pieces: TranslationPiece[], target: TranslationLocale): Promise<string[]> {
    return withTranslationCache(pieces, target, (batch) => translateBatch(batch, target));
  },
};
