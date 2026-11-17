/**
 * Timing, vocabulary and pure layout helpers for the compass + split-flap
 * destination reveal (TripBoardReveal). Ported from the approved
 * "Randomtrip Reveal — Tablero v2" prototype (`boardConfig` in its app.js):
 * change words or timings here, never in the animation code.
 *
 * The intermediate words are brand vocabulary only — never city names — so
 * the board can't hint at, or be mistaken for, a different destination.
 */
export const BOARD_REVEAL_CONFIG = {
  /** Compass "find north" frame before the board appears (ms). */
  orientMs: 2800,
  columns: 14,
  /** Time between brand words (ms). */
  wordIntervalMs: 520,
  /** Full flip of one tile, both halves (ms). */
  flipMs: 180,
  /** Extra delay per tile, left to right (ms). */
  staggerMs: 10,
  /** Hold on the settled destination before the photo opens (ms). */
  finalHoldMs: 440,
  /** Board out → photo in (ms). */
  openingMs: 800,
  sequences: [
    ["XSED", "MODO EXPLORA", "BOND", "SERENDIPIA", "WONDER", "WANDER", "REPEAT"],
    ["ESSENZA", "EXPLORA+", "SOLUM", "BIVOUAC", "WANDER", "REPEAT"],
    ["ATELIER", "KIN", "CREW", "SERENDIPIA", "WONDER", "WANDER", "REPEAT"],
  ],
} as const;

/** Deterministic per trip, so a reload replays the same words. */
export function pickBoardSequence(tripId: string): readonly string[] {
  let hash = 0;
  for (const char of tripId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const { sequences } = BOARD_REVEAL_CONFIG;
  return sequences[hash % sequences.length];
}

/**
 * Breaks `text` into board lines of at most `columns` characters, at word
 * boundaries where possible. A single word longer than a line is hard-split
 * rather than truncated, so the destination is never silently cut.
 */
export function layoutBoardLines(text: string, columns: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line: string[] = [];

  for (let word of words) {
    while ([...word].length > columns) {
      if (line.length) lines.push(line.join(" "));
      line = [];
      const chars = [...word];
      lines.push(chars.slice(0, columns).join(""));
      word = chars.slice(columns).join("");
    }
    const candidate = [...line, word].join(" ");
    if (line.length && [...candidate].length > columns) {
      lines.push(line.join(" "));
      line = [word];
    } else {
      line.push(word);
    }
  }
  if (line.length) lines.push(line.join(" "));
  return lines.length ? lines : [""];
}

/**
 * The full board as one character per tile (row-major, `rows × columns`),
 * each line centered horizontally and the block centered vertically.
 */
export function boardFrame(text: string, rows: number, columns: number): string[] {
  const lines = layoutBoardLines(text, columns).slice(0, rows);
  const top = Math.floor((rows - lines.length) / 2);
  const frame: string[] = [];
  for (let row = 0; row < rows; row++) {
    const chars = [...(lines[row - top] ?? "")];
    const left = Math.floor((columns - chars.length) / 2);
    for (let col = 0; col < columns; col++) frame.push(chars[col - left] ?? " ");
  }
  return frame;
}

/** Ms from the destination flip starting until its last tile has settled. */
export function boardSettleMs(rows: number): number {
  const { columns, flipMs, staggerMs } = BOARD_REVEAL_CONFIG;
  return flipMs + (rows * columns - 1) * staggerMs;
}
