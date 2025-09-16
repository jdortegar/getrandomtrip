// services/geminiExperienceService.ts — streaming + guardrails (coords off)

export type Delta = {
  text?: string;
  sources?: string[];
  functionCall?: { name: string; arguments?: any };
};

export type StreamOptions = {
  systemStyle?: string;
  country?: 'MX' | 'AR' | 'US' | null;
};

// Replace any raw coordinates with a friendly placeholder
function maskCoordinatesInline(text: string): string {
  if (!text) return text;
  const coordPattern = /(-?\d{1,3}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})/g;
  return text.replace(coordPattern, 'cerca de aquí');
}

// Also remove explicit mentions of punctuation names the TTS could read literally
function stripLiteralPunctuationWords(text: string): string {
  return text.replace(/\b(coma|punto|signo de exclamación|signo de interrogación|barra|slash)\b/gi, '');
}

function sanitizeModelChunk(text: string): string {
  let t = text;
  t = maskCoordinatesInline(t);
  t = stripLiteralPunctuationWords(t);
  t = t.replace(/\b\d{4,}\b/g, (m) => `${m.length} dígitos`);
  return t;
}

// Generic SSE/NDJSON reader
async function* readStreamLines(res: Response) {
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      yield line;
    }
  }
  if (buffer.trim()) yield buffer.trim();
}

/**
 * Stream model responses. Expects an API route at /api/experience that returns NDJSON or SSE lines, each line either:
 *   {"text":"...","sources":[...]}  OR  "data: {json}"
 */
export async function streamExperienceMessage(
  messages: any,
  lat: number | null,
  lng: number | null,
  personaId: string,
  onDelta: (chunk: Delta) => void,
  onError: (err: Error) => void,
  options?: StreamOptions
) {
  const payload = {
    messages,
    lat,
    lng,
    personaId,
    systemStyle: options?.systemStyle || '',
    country: options?.country || null,
  };

  try {
    const res = await fetch('/api/experience', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok || !res.body) {
      const fallback =
        options?.country === 'US'
          ? 'I found a couple of spots nearby worth checking out. Want me to read them out?'
          : 'Tengo un par de lugares cerca que valen la pena. ¿Te cuento rápido?';
      onDelta({ text: sanitizeModelChunk(fallback) });
      return;
    }

    for await (const rawLine of readStreamLines(res)) {
      let jsonStr = rawLine;
      if (rawLine.startsWith('data:')) jsonStr = rawLine.slice(5).trim();
      try {
        const parsed = JSON.parse(jsonStr);
        const chunk: Delta = {};
        if (parsed.functionCall) chunk.functionCall = parsed.functionCall;
        if (typeof parsed.text === 'string') chunk.text = sanitizeModelChunk(parsed.text);
        if (Array.isArray(parsed.sources)) chunk.sources = parsed.sources;
        onDelta(chunk);
      } catch {
        onDelta({ text: sanitizeModelChunk(jsonStr) });
      }
    }
  } catch (err: any) {
    onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}