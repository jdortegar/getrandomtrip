export interface TranslationPiece {
  html: boolean;
  text: string;
}

export type TranslationLocale = "en" | "es";

export interface TranslationRequest {
  pieces: TranslationPiece[];
  target: TranslationLocale;
}

const MAX_PIECES = 80;
const MAX_PIECE_CHARS = 20_000;
const MAX_TOTAL_CHARS = 80_000;

export class TranslationRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranslationRequestError";
  }
}

function isPiece(value: unknown): value is TranslationPiece {
  if (!value || typeof value !== "object") return false;
  const piece = value as TranslationPiece;
  return typeof piece.html === "boolean" && typeof piece.text === "string";
}

/** Accepts only a bounded list of text pieces and a Spanish or English target. */
export function parseTranslationRequest(value: unknown): TranslationRequest {
  if (!value || typeof value !== "object") {
    throw new TranslationRequestError("Translation request is invalid");
  }

  const body = value as { pieces?: unknown; target?: unknown };
  if (body.target !== "en" && body.target !== "es") {
    throw new TranslationRequestError("Translation target is invalid");
  }
  if (!Array.isArray(body.pieces) || body.pieces.length === 0 || body.pieces.length > MAX_PIECES) {
    throw new TranslationRequestError("Translation pieces are invalid");
  }
  if (!body.pieces.every(isPiece)) {
    throw new TranslationRequestError("Translation pieces are invalid");
  }

  const total = body.pieces.reduce((sum, piece) => sum + piece.text.length, 0);
  if (body.pieces.some((piece) => piece.text.length > MAX_PIECE_CHARS) || total > MAX_TOTAL_CHARS) {
    throw new TranslationRequestError("Translation request is too large");
  }

  return {
    pieces: body.pieces.map((piece) => ({ html: piece.html, text: piece.text })),
    target: body.target,
  };
}

export function translationMessages(request: TranslationRequest): { system: string; user: string } {
  const target = request.target === "en" ? "English" : "Spanish";
  const source = request.target === "en" ? "Spanish" : "English";

  return {
    system: [
      `You translate GetRandomTrip editorial copy from ${source} to ${target}.`,
      'Return only JSON: {"texts":["..."]} with one string per input piece, in the same order.',
      "Keep the author's tone. Do not add notes or markdown fences.",
      "When html is true, keep every tag, attribute, and entity unchanged and translate only the text.",
      "Leave URLs, email addresses, hotel names, and brand names unchanged.",
    ].join(" "),
    user: JSON.stringify({
      pieces: request.pieces.map((piece) => ({ html: piece.html, text: piece.text })),
    }),
  };
}

/** Reads the model JSON and requires one string for every input piece. */
export function parseTranslationTexts(raw: string, count: number): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new TranslationRequestError("Translation response is invalid");
  }

  const texts = parsed && typeof parsed === "object" ? (parsed as { texts?: unknown }).texts : undefined;
  if (!Array.isArray(texts) || texts.length !== count || texts.some((text) => typeof text !== "string")) {
    throw new TranslationRequestError("Translation response is invalid");
  }

  return texts;
}
