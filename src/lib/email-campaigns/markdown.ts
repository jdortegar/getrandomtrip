/**
 * Minimal markdown subset for campaign bodies (odd/tasks/email-campaigns.md,
 * decision 3): paragraphs, line breaks, **bold**, *italic*, [links](url),
 * bullet and numbered lists. Parses to a small AST that the email template
 * renders as React elements, so raw HTML is never passed through: React
 * escapes every text node. Links keep only absolute http(s) and mailto hrefs.
 */

export type MarkdownInline =
  | { type: "text"; value: string }
  | { type: "break" }
  | { type: "strong"; children: MarkdownInline[] }
  | { type: "em"; children: MarkdownInline[] }
  | { type: "link"; href: string; children: MarkdownInline[] };

export type MarkdownBlock =
  | { type: "paragraph"; children: MarkdownInline[] }
  | { type: "list"; ordered: boolean; items: MarkdownInline[][] };

const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d{1,9}[.)]\s+(.*)$/;
const LINK = /^\[([^\]\n]+)\]\(([^)\s]+)\)/;
const ESCAPABLE = /[\\*_[\]()#+\-.!`]/;

/** Absolute http(s) or mailto URL, normalized; anything else is `null`. */
export function safeHref(raw: string): string | null {
  const value = raw.trim();
  if (/^mailto:[^\s]+$/i.test(value)) return value;
  if (!/^https?:\/\//i.test(value)) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function mergeText(nodes: MarkdownInline[]): MarkdownInline[] {
  const merged: MarkdownInline[] = [];
  for (const node of nodes) {
    const last = merged[merged.length - 1];
    if (node.type === "text" && last?.type === "text") {
      merged[merged.length - 1] = { type: "text", value: last.value + node.value };
    } else if (node.type !== "text" || node.value) {
      merged.push(node);
    }
  }
  return merged;
}

/** Inline parser for one line (no newlines). Unmatched markers stay literal. */
function parseInline(source: string): MarkdownInline[] {
  const nodes: MarkdownInline[] = [];
  let text = "";
  const flush = () => {
    if (text) nodes.push({ type: "text", value: text });
    text = "";
  };

  let i = 0;
  while (i < source.length) {
    const char = source[i];

    if (char === "\\" && ESCAPABLE.test(source[i + 1] ?? "")) {
      text += source[i + 1];
      i += 2;
      continue;
    }

    if (source.startsWith("**", i)) {
      let end = source.indexOf("**", i + 2);
      // In `***` the outer strong closes last: `**a *b***`.
      if (end > 0 && source[end + 2] === "*") end += 1;
      if (end > i + 2) {
        flush();
        nodes.push({ type: "strong", children: parseInline(source.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }

    // Single `*` emphasis must hug its content, so "2 * 3" stays literal.
    if (char === "*" && source[i + 1] !== "*" && /\S/.test(source[i + 1] ?? "")) {
      const end = findEmphasisEnd(source, i + 1);
      if (end > 0) {
        flush();
        nodes.push({ type: "em", children: parseInline(source.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }

    if (char === "[") {
      const match = LINK.exec(source.slice(i));
      if (match) {
        flush();
        const children = parseInline(match[1]);
        const href = safeHref(match[2]);
        if (href) nodes.push({ type: "link", href, children });
        else nodes.push(...children);
        i += match[0].length;
        continue;
      }
    }

    text += char;
    i += 1;
  }
  flush();
  return mergeText(nodes);
}

/** Closing `*` for an emphasis opened before `from`, skipping `**` pairs. */
function findEmphasisEnd(source: string, from: number): number {
  let i = from;
  while (i < source.length) {
    if (source[i] === "\\") {
      i += 2;
      continue;
    }
    if (source.startsWith("**", i)) {
      const close = source.indexOf("**", i + 2);
      if (close < 0) return -1;
      // `***` closes a nested strong and this emphasis together.
      if (source[close + 2] === "*") return close + 2;
      i = close + 2;
      continue;
    }
    if (source[i] === "*" && /\S/.test(source[i - 1] ?? "")) return i;
    i += 1;
  }
  return -1;
}

export function parseCampaignMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: MarkdownInline[][] } | null = null;

  const closeParagraph = () => {
    if (!paragraph.length) return;
    const children: MarkdownInline[] = [];
    paragraph.forEach((line, index) => {
      if (index > 0) children.push({ type: "break" });
      children.push(...parseInline(line));
    });
    blocks.push({ type: "paragraph", children });
    paragraph = [];
  };
  const closeList = () => {
    if (list) blocks.push({ type: "list", ...list });
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      closeParagraph();
      closeList();
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    const item = bullet ?? numbered;
    if (item) {
      closeParagraph();
      const ordered = Boolean(numbered);
      if (list && list.ordered !== ordered) closeList();
      list ??= { ordered, items: [] };
      list.items.push(parseInline(item[1].trim()));
      continue;
    }

    closeList();
    paragraph.push(line);
  }
  closeParagraph();
  closeList();
  return blocks;
}
