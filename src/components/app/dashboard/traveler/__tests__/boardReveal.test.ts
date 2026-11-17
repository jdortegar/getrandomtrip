import { describe, expect, it } from "vitest";
import {
  BOARD_REVEAL_CONFIG,
  boardFrame,
  layoutBoardLines,
  pickBoardSequence,
} from "@/components/app/dashboard/traveler/boardReveal";

describe("layoutBoardLines", () => {
  it("keeps a short name on one line", () => {
    expect(layoutBoardLines("RIO DE JANEIRO", 14)).toEqual(["RIO DE JANEIRO"]);
  });

  it("breaks at word boundaries when a name is wider than the board", () => {
    expect(layoutBoardLines("SAN CARLOS DE BARILOCHE", 14)).toEqual(["SAN CARLOS DE", "BARILOCHE"]);
  });

  it("hard-splits a single word longer than a line instead of truncating it", () => {
    const lines = layoutBoardLines("LLANFAIRPWLLGWYNGYLL", 14);
    expect(lines).toEqual(["LLANFAIRPWLLGW", "YNGYLL"]);
  });

  it("counts accented letters as one tile each", () => {
    expect(layoutBoardLines("SÃO PAULO", 9)).toEqual(["SÃO PAULO"]);
  });
});

describe("boardFrame", () => {
  it("centers the text horizontally and fills every tile", () => {
    const frame = boardFrame("KIN", 1, 7);
    expect(frame).toEqual([" ", " ", "K", "I", "N", " ", " "]);
  });

  it("centers a one-line word vertically on a taller board", () => {
    const frame = boardFrame("KIN", 3, 3);
    expect(frame.join("")).toBe("   KIN   ");
  });
});

describe("pickBoardSequence", () => {
  it("is deterministic per trip and uses only brand vocabulary", () => {
    const sequence = pickBoardSequence("trip-abc");
    expect(pickBoardSequence("trip-abc")).toBe(sequence);
    expect(BOARD_REVEAL_CONFIG.sequences).toContain(sequence);
  });

  it("fits every brand word on a single board line", () => {
    for (const word of BOARD_REVEAL_CONFIG.sequences.flat()) {
      expect([...word].length).toBeLessThanOrEqual(BOARD_REVEAL_CONFIG.columns);
    }
  });
});
