import type { TranslationLocale, TranslationPiece } from "@/lib/ai/translationRequest";

/** Asks the signed-in AI route to translate the given pieces. */
export async function requestCopyTranslation(
  pieces: TranslationPiece[],
  target: TranslationLocale,
): Promise<string[]> {
  const response = await fetch("/api/ai/translate", {
    body: JSON.stringify({ pieces, target }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) throw new Error("Translation failed");

  const payload = (await response.json()) as { texts?: unknown };
  if (
    !Array.isArray(payload.texts) ||
    payload.texts.length !== pieces.length ||
    payload.texts.some((text) => typeof text !== "string")
  ) {
    throw new Error("Translation failed");
  }

  return payload.texts;
}
