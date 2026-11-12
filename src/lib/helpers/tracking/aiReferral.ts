/**
 * Classifies a landing as coming from an AI answer engine. Only the coarse
 * source name ever leaves the browser: never the referrer URL or the query.
 */
export const AI_SOURCES = [
  "chatgpt",
  "perplexity",
  "gemini",
  "claude",
  "copilot",
] as const;

export type AiSource = (typeof AI_SOURCES)[number];

const HOSTS: Array<[string, AiSource]> = [
  ["chatgpt.com", "chatgpt"],
  ["chat.openai.com", "chatgpt"],
  ["perplexity.ai", "perplexity"],
  ["gemini.google.com", "gemini"],
  ["bard.google.com", "gemini"],
  ["claude.ai", "claude"],
  ["copilot.microsoft.com", "copilot"],
];

/** `utm_source` values AI engines append to outbound links. */
const UTM_SOURCES: Record<string, AiSource> = {
  chatgpt: "chatgpt",
  "chatgpt.com": "chatgpt",
  openai: "chatgpt",
  perplexity: "perplexity",
  "perplexity.ai": "perplexity",
  gemini: "gemini",
  claude: "claude",
  "claude.ai": "claude",
  copilot: "copilot",
};

export function isAiSource(value: unknown): value is AiSource {
  return (AI_SOURCES as readonly unknown[]).includes(value);
}

function fromReferrer(referrer: string): AiSource | null {
  if (!referrer) return null;
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }
  const match = HOSTS.find(([h]) => host === h || host.endsWith(`.${h}`));
  return match ? match[1] : null;
}

function fromQuery(search: string): AiSource | null {
  const utm = new URLSearchParams(search).get("utm_source");
  return utm ? (UTM_SOURCES[utm.trim().toLowerCase()] ?? null) : null;
}

export function classifyAiReferral(
  referrer: string,
  search: string,
): AiSource | null {
  return fromReferrer(referrer) ?? fromQuery(search);
}
