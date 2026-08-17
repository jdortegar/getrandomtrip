"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import styles from "./traveler-trip-details.module.css";

const BRUSH_RADIUS = 52;
const CHECK_EVERY_N_MOVES = 6;
const SAMPLE_STRIDE = 24;
const CLEAR_ALPHA_THRESHOLD = 180;
const COMPLETE_THRESHOLD = 0.35;
const FADE_MS = 700;
export const BODY_LOCK_CLASS = "rt-scratch-locked";

interface TripScratchRevealCopy {
  title: string;
  subtitle: string;
  scrollCue: string;
}

interface TripScratchRevealProps {
  tripId: string;
  children: React.ReactNode;
  copy: TripScratchRevealCopy;
  onComplete?: (result: { instant: boolean }) => void;
}

function scratchStorageKey(tripId: string): string {
  return `rt:scratch:${tripId}`;
}

function hasScratched(tripId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(scratchStorageKey(tripId)) === "1";
  } catch {
    return false;
  }
}

function markScratched(tripId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(scratchStorageKey(tripId), "1");
  } catch {
    // Quota or private mode — nothing to persist, the gate just replays next time.
  }
}

/** Ported from the approved "Scratch to Reveal Gated" prototype — the canvas
 * erase mechanic (brush radius, sample stride, completion threshold, paint
 * pattern) is a 1:1 port kept dependency-free per the prototype's own script.
 * Wraps `children` (the trip hero) with a scratchable cover; reveals once per
 * trip via localStorage, and calls `onComplete` when the gate opens so the
 * caller can mount the rest of the page. */
export function TripScratchReveal({ tripId, children, copy, onComplete }: TripScratchRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  const [revealed, setRevealed] = useState(false);
  const [dimHint, setDimHint] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [renderCanvas, setRenderCanvas] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || hasScratched(tripId)) {
      setRevealed(true);
      onCompleteRef.current?.({ instant: true });
      return;
    }
    setRenderCanvas(true);
  }, [tripId]);

  // Separate from the bypass-check effect above: the canvas only exists in
  // the DOM once `renderCanvas` flips true and React commits that render, so
  // paint/listener setup has to run in its own effect keyed on `renderCanvas`
  // rather than reading `canvasRef.current` in the same pass that sets it.
  useEffect(() => {
    if (!renderCanvas) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let drawing = false;
    let done = false;
    let checkTick = 0;
    let last: [number, number] | null = null;

    function paint() {
      const rect = container!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const gradient = ctx!.createLinearGradient(0, 0, rect.width, rect.height);
      gradient.addColorStop(0, "#141a2b");
      gradient.addColorStop(0.5, "#0b0f1a");
      gradient.addColorStop(1, "#12283a");
      ctx!.fillStyle = gradient;
      ctx!.fillRect(0, 0, rect.width, rect.height);

      ctx!.fillStyle = "rgba(255,255,255,.05)";
      for (let y = 0; y < rect.height; y += 34) {
        for (let x = ((y / 34) % 2) * 17; x < rect.width; x += 34) {
          ctx!.beginPath();
          ctx!.arc(x, y, 1.6, 0, 6.284);
          ctx!.fill();
        }
      }

      ctx!.strokeStyle = "rgba(0,209,255,.10)";
      ctx!.lineWidth = 1;
      for (let i = -rect.height; i < rect.width; i += 64) {
        ctx!.beginPath();
        ctx!.moveTo(i, 0);
        ctx!.lineTo(i + rect.height, rect.height);
        ctx!.stroke();
      }

      ctx!.globalCompositeOperation = "destination-out";
    }

    function pos(e: PointerEvent): [number, number] {
      const rect = canvas!.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    }

    function measure() {
      const data = ctx!.getImageData(0, 0, canvas!.width, canvas!.height).data;
      let clear = 0;
      let total = 0;
      for (let i = 3; i < data.length; i += 4 * SAMPLE_STRIDE) {
        total++;
        if (data[i] < CLEAR_ALPHA_THRESHOLD) clear++;
      }
      const pct = clear / total;
      setProgressPct(Math.min(100, (pct / COMPLETE_THRESHOLD) * 100));
      if (pct >= COMPLETE_THRESHOLD) finish();
    }

    function scratch(e: PointerEvent) {
      if (done) return;
      const [x, y] = pos(e);
      ctx!.lineCap = ctx!.lineJoin = "round";
      ctx!.lineWidth = BRUSH_RADIUS * 2;
      ctx!.beginPath();
      if (last) {
        ctx!.moveTo(last[0], last[1]);
        ctx!.lineTo(x, y);
        ctx!.stroke();
      }
      ctx!.arc(x, y, BRUSH_RADIUS, 0, 6.284);
      ctx!.fill();
      last = [x, y];
      setDimHint(true);
      checkTick += 1;
      if (checkTick % CHECK_EVERY_N_MOVES === 0) measure();
    }

    function finish() {
      if (done) return;
      done = true;
      setProgressPct(100);
      setFadingOut(true);
      markScratched(tripId);
      window.setTimeout(() => {
        setRevealed(true);
        onCompleteRef.current?.({ instant: false });
      }, FADE_MS);
    }

    function handlePointerDown(e: PointerEvent) {
      drawing = true;
      last = null;
      container!.setPointerCapture(e.pointerId);
      scratch(e);
    }
    function handlePointerMove(e: PointerEvent) {
      if (drawing) scratch(e);
    }
    function handlePointerUp() {
      drawing = false;
      last = null;
      if (!done) measure();
    }
    function handleResize() {
      if (!done) paint();
    }

    paint();
    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("resize", handleResize);
    };
  }, [renderCanvas, tripId]);

  return (
    <div
      ref={containerRef}
      className={`${styles.scratchWrap} ${!revealed ? styles.heroGated : ""}`}
    >
      <div
        className={`${styles.scratchContent} ${revealed ? styles.scratchContentRevealed : ""}`}
        aria-hidden={!revealed}
      >
        {children}
      </div>

      {renderCanvas && (
        <div className={`${styles.scratchCover} ${fadingOut ? styles.scratchCoverGone : ""}`}>
          <canvas ref={canvasRef} className={styles.scratchCanvas} />
          <div className={`${styles.scratchHint} ${dimHint ? styles.scratchHintDim : ""}`}>
            <div className={styles.scratchIcon}>
              <Sparkles aria-hidden="true" />
            </div>
            <h2 className={styles.scratchTitle}>{copy.title}</h2>
            <p className={styles.scratchSubtitle}>{copy.subtitle}</p>
          </div>
          <div className={styles.scratchBar}>
            <div className={styles.scratchBarFill} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      <div className={`${styles.scrollCue} ${revealed ? styles.scrollCueVisible : ""}`}>
        <span>{copy.scrollCue}</span>
        <span className={styles.scrollCueArrow} aria-hidden="true">
          ↓
        </span>
      </div>
    </div>
  );
}
