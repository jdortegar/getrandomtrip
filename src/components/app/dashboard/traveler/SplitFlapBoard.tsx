"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { boardFrame, BOARD_REVEAL_CONFIG } from "./boardReveal";
import styles from "./traveler-trip-details.module.css";

export interface SplitFlapBoardHandle {
  /** Flip every tile to `text` (centered). `animate: false` snaps instantly. */
  show(text: string, options?: { animate?: boolean }): void;
  /** Cancel in-flight flips and pending timers, leaving tiles as they are. */
  stop(): void;
}

interface SplitFlapBoardProps {
  ref?: Ref<SplitFlapBoardHandle>;
  rows: number;
}

const HALVES = ["staticTop", "staticBottom", "movingTop", "movingBottom"] as const;
const BLANK = " ";

/**
 * Airport split-flap board. Tiles are rendered once by React with empty glyph
 * spans; flips are driven imperatively (Web Animations API) because a word
 * change touches up to `rows × columns × 4` nodes every ~500 ms — far too hot
 * for React state. React never renders glyph text, so it never fights these
 * writes. Without WAAPI (tests, very old browsers) tiles snap without motion.
 */
export function SplitFlapBoard({ ref, rows }: SplitFlapBoardProps) {
  const { columns, flipMs, staggerMs } = BOARD_REVEAL_CONFIG;
  const tilesRef = useRef<(HTMLSpanElement | null)[]>([]);
  const currentRef = useRef<string[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    },
    [],
  );

  useImperativeHandle(ref, () => {
    function glyphs(tile: HTMLSpanElement): HTMLElement[] {
      return Array.from(tile.querySelectorAll<HTMLElement>("[data-glyph]"));
    }
    function cancelTile(tile: HTMLSpanElement) {
      tile.getAnimations?.({ subtree: true }).forEach((animation) => animation.cancel());
    }
    function setAll(tile: HTMLSpanElement, char: string) {
      glyphs(tile).forEach((glyph) => {
        glyph.textContent = char;
      });
    }

    return {
      show(text, { animate = true } = {}) {
        const frame = boardFrame(text, rows, columns);
        tilesRef.current.forEach((tile, index) => {
          if (!tile) return;
          const next = frame[index] ?? BLANK;
          const old = currentRef.current[index] ?? BLANK;
          cancelTile(tile);
          currentRef.current[index] = next;

          const movingTop = tile.querySelector<HTMLElement>("[data-half='movingTop']");
          const movingBottom = tile.querySelector<HTMLElement>("[data-half='movingBottom']");
          if (!animate || next === old || typeof movingTop?.animate !== "function" || !movingBottom) {
            setAll(tile, next);
            return;
          }

          // The old upper flap falls, then the new lower flap settles.
          const [staticTop, staticBottom, movingTopGlyph, movingBottomGlyph] = glyphs(tile);
          staticTop.textContent = next;
          staticBottom.textContent = old;
          movingTopGlyph.textContent = old;
          movingBottomGlyph.textContent = next;

          const delay = index * staggerMs;
          const half = flipMs / 2;
          movingTop.animate(
            [
              { transform: "rotateX(0deg)", opacity: 1 },
              { transform: "rotateX(-90deg)", opacity: 1 },
            ],
            { duration: half, delay, fill: "both", easing: "cubic-bezier(.55,.02,.85,.5)" },
          );
          movingBottom.animate(
            [
              { transform: "rotateX(90deg)", opacity: 1 },
              { transform: "rotateX(0deg)", opacity: 1 },
            ],
            { duration: half, delay: delay + half, fill: "both", easing: "cubic-bezier(.16,.65,.3,1)" },
          );
          timersRef.current.push(
            setTimeout(() => {
              setAll(tile, next);
              cancelTile(tile);
            }, delay + flipMs + 10),
          );
        });
      },
      stop() {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
        tilesRef.current.forEach((tile, index) => {
          if (!tile) return;
          cancelTile(tile);
          setAll(tile, currentRef.current[index] ?? BLANK);
        });
      },
    };
  }, [rows, columns, flipMs, staggerMs]);

  return (
    <div className={styles.flapBoard} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {Array.from({ length: rows * columns }, (_, index) => (
        <span
          className={styles.flapTile}
          key={index}
          ref={(el) => {
            tilesRef.current[index] = el;
          }}
        >
          {HALVES.map((half) => (
            <span className={`${styles.tileHalf} ${styles[half]}`} data-half={half} key={half}>
              <span className={styles.tileGlyph} data-glyph="" />
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
