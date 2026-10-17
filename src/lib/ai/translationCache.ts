import {
  batchTranslationPieces,
  type TranslationLocale,
  type TranslationPiece,
} from "@/lib/ai/translationRequest";

const STORAGE_PREFIX = "rt-ai-translate-v1:";

const memory = new Map<string, string>();

function fnv1a(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function translationCacheKey(
  piece: TranslationPiece,
  target: TranslationLocale,
): string {
  const material = `${target}\0${piece.html ? "1" : "0"}\0${piece.text}`;
  return `${fnv1a(material).toString(16)}-${fnv1a(`salt:${material}`).toString(16)}-${piece.text.length}`;
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function readCachedTranslation(
  piece: TranslationPiece,
  target: TranslationLocale,
): string | null {
  const key = translationCacheKey(piece, target);
  const remembered = memory.get(key);
  if (remembered !== undefined) return remembered;
  const store = storage();
  if (!store) return null;
  try {
    const stored = store.getItem(`${STORAGE_PREFIX}${key}`);
    if (stored === null) return null;
    memory.set(key, stored);
    return stored;
  } catch {
    return null;
  }
}

export function writeCachedTranslation(
  piece: TranslationPiece,
  target: TranslationLocale,
  text: string,
): void {
  const key = translationCacheKey(piece, target);
  memory.set(key, text);
  const store = storage();
  if (!store) return;
  try {
    store.setItem(`${STORAGE_PREFIX}${key}`, text);
  } catch {
    // Quota or private-mode writes must not break translation.
  }
}

export function clearTranslationCache(): void {
  memory.clear();
  const store = storage();
  if (!store) return;
  const keys: string[] = [];
  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index);
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
  }
  for (const key of keys) store.removeItem(key);
}

/** Translates only uncached pieces; successful batches stay cached if a later batch fails. */
export async function withTranslationCache(
  pieces: TranslationPiece[],
  target: TranslationLocale,
  translateBatch: (batch: TranslationPiece[]) => Promise<string[]>,
): Promise<string[]> {
  const texts: Array<string | undefined> = pieces.map(
    (piece) => readCachedTranslation(piece, target) ?? undefined,
  );
  const pending: Array<{ index: number; piece: TranslationPiece }> = [];
  pieces.forEach((piece, index) => {
    if (texts[index] === undefined) pending.push({ index, piece });
  });
  if (!pending.length) return texts as string[];

  let offset = 0;
  for (const batch of batchTranslationPieces(pending.map((item) => item.piece))) {
    const translated = await translateBatch(batch);
    if (
      translated.length !== batch.length ||
      translated.some((text) => typeof text !== "string")
    ) {
      throw new Error("Translation failed");
    }
    for (let index = 0; index < batch.length; index += 1) {
      const item = pending[offset + index];
      const text = translated[index];
      if (!item || text === undefined) continue;
      writeCachedTranslation(item.piece, target, text);
      texts[item.index] = text;
    }
    offset += batch.length;
  }

  return texts as string[];
}
