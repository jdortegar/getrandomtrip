import { loadRunonwebTranslate } from "@/lib/ai/loadRunonwebTranslate.js";
import {
  sourceLocaleFor,
  type ExperienceCopyLocale,
} from "@/lib/ai/translateExperienceCopy";

export interface TranslatorProgress {
  progress?: number;
  status: string;
}

interface BrowserTranslator {
  load: () => Promise<void>;
  translate: (
    text: string,
    options?: { from?: string; html?: boolean; to?: string },
  ) => Promise<{ text: string }>;
}

interface RunonwebTranslateModule {
  Translator: new (options?: {
    from?: string;
    onProgress?: (info: TranslatorProgress) => void;
    to?: string;
  }) => BrowserTranslator;
}

let progressListener: ((info: TranslatorProgress) => void) | undefined;
let translatorPromise: Promise<BrowserTranslator> | null = null;

function resetTranslator() {
  translatorPromise = null;
}

async function getBrowserTranslator(
  from: ExperienceCopyLocale,
  to: ExperienceCopyLocale,
): Promise<BrowserTranslator> {
  if (!translatorPromise) {
    translatorPromise = loadRunonwebTranslate()
      .then(async (loaded) => {
        const { Translator } = loaded as RunonwebTranslateModule;
        const translator = new Translator({
          from,
          onProgress: (info) => progressListener?.(info),
          to,
        });
        await translator.load();
        return translator;
      })
      .catch((error: unknown) => {
        resetTranslator();
        throw error;
      });
  }

  return translatorPromise;
}

/**
 * Translates each piece in order with the in-browser Firefox Translations model.
 * The first call downloads weights; later calls reuse the same instance.
 */
export async function translateExperiencePieces(
  pieces: Array<{ html: boolean; text: string }>,
  target: ExperienceCopyLocale,
  onProgress?: (info: TranslatorProgress) => void,
): Promise<string[]> {
  progressListener = onProgress;

  try {
    const translator = await getBrowserTranslator(sourceLocaleFor(target), target);
    const translated: string[] = [];

    for (const piece of pieces) {
      const { text } = await translator.translate(piece.text, {
        from: sourceLocaleFor(target),
        html: piece.html,
        to: target,
      });
      translated.push(text.trim() ? text : piece.text);
    }

    return translated;
  } finally {
    progressListener = undefined;
  }
}
