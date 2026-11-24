"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ButtonV2 } from "@/components/ui/ButtonV2";
import { useHydrated } from "@/hooks/useHydrated";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useNavbarChrome } from "@/context/NavbarChromeContext";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import {
  BOARD_REVEAL_CONFIG,
  boardSettleMs,
  layoutBoardLines,
  pickBoardSequence,
} from "./boardReveal";
import { SplitFlapBoard, type SplitFlapBoardHandle } from "./SplitFlapBoard";
import styles from "./traveler-trip-details.module.css";

export const BODY_LOCK_CLASS = "rt-reveal-locked";
/** Navbar slides away while the sequence plays (globals.css). */
const BODY_PLAYING_CLASS = "rt-reveal-playing";
/** Navbar overlay gets the dark top gradient over the destination photo (globals.css). */
const BODY_HERO_CLASS = "rt-reveal-hero";
/** Graphic signature from the prototype, not a counter or copy. */
const SIGNATURE = "R / 48";

type Phase = "ready" | "orienting" | "boarding" | "opening" | "done";
const PLAYING: readonly Phase[] = ["orienting", "boarding", "opening"];

interface TripBoardRevealProps {
  tripId: string;
  /** Destination shown on the board, e.g. the city. Uppercased here. */
  destination: string;
  locale: string;
  copy: TripItineraryDict["boardReveal"];
  children: React.ReactNode;
  onComplete?: (result: { instant: boolean }) => void;
  /** Focus "Reveal my destination" on mount — set when the traveler asked to replay. */
  focusCta?: boolean;
  /**
   * Open on the final state with no gate — the traveler already watched (or
   * skipped) this reveal. `onComplete` still fires, but focus stays put.
   */
  startRevealed?: boolean;
}

/**
 * Compass + split-flap destination reveal, ported from the approved
 * "Randomtrip Reveal — Tablero v2" prototype. Wraps `children` (the trip
 * hero) and plays until the traveler has seen it once (`startRevealed`
 * then opens on the final state) — "Ir al destino" skips it:
 * ready → orienting (compass finds north) → boarding (brand words flip) →
 * the destination settles in ochre → opening (photo comes into focus) → done.
 *
 * The destination is already decided server-side (trip is REVEALED); the
 * animation only presents it. Skip and reduced motion (before or during the
 * sequence) land on the same final state.
 *
 * Chrome, as in the prototype: on the ready screen the dashboard navbar stays
 * solid above the gate. Once the reveal starts the gate becomes a fixed,
 * full-viewport layer, the navbar slides away, and on the final state it
 * returns as the transparent overlay (solid again on scroll) over the
 * full-viewport destination hero.
 */
export function TripBoardReveal({
  tripId,
  destination,
  locale,
  copy,
  children,
  onComplete,
  focusCta = false,
  startRevealed = false,
}: TripBoardRevealProps) {
  const hydrated = useHydrated();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const { setNavbarOverlay } = useNavbarChrome();

  const [phase, setPhase] = useState<Phase>(startRevealed ? "done" : "ready");
  const [instant, setInstant] = useState(startRevealed);
  const [destinationShown, setDestinationShown] = useState(startRevealed);
  // Opening already revealed must not pull focus to the hero title on load.
  const focusOnDoneRef = useRef(!startRevealed);
  const [previousTrip, setPreviousTrip] = useState(tripId);
  if (previousTrip !== tripId) {
    setPreviousTrip(tripId);
    setPhase("ready");
    setInstant(false);
    setDestinationShown(false);
  }

  const boardRef = useRef<SplitFlapBoardHandle>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onCompleteRef = useRef(onComplete);

  const boardText = destination.toLocaleUpperCase(locale);
  const rows = useMemo(
    () => layoutBoardLines(boardText, BOARD_REVEAL_CONFIG.columns).length,
    [boardText],
  );

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers, tripId]);

  const finish = useCallback(
    (skipped: boolean) => {
      clearTimers();
      boardRef.current?.stop();
      setInstant(skipped);
      setPhase("done");
    },
    [clearTimers],
  );

  const start = useCallback(() => {
    if (phase !== "ready") return;
    if (reducedMotion) {
      finish(true);
      return;
    }
    const later = (fn: () => void, ms: number) => timersRef.current.push(setTimeout(fn, ms));
    const { orientMs, wordIntervalMs, finalHoldMs, openingMs } = BOARD_REVEAL_CONFIG;
    const words = pickBoardSequence(tripId);
    const boardAt = orientMs;
    const destinationAt = boardAt + words.length * wordIntervalMs;
    const openingAt = destinationAt + boardSettleMs(rows) + finalHoldMs;

    setPhase("orienting");
    later(() => setPhase("boarding"), boardAt);
    words.forEach((word, i) => later(() => boardRef.current?.show(word), boardAt + i * wordIntervalMs));
    later(() => {
      setDestinationShown(true);
      boardRef.current?.show(boardText);
    }, destinationAt);
    later(() => setPhase("opening"), openingAt);
    later(() => finish(false), openingAt + openingMs);
  }, [phase, reducedMotion, tripId, rows, boardText, finish]);

  // After a replay request, put focus back on the ready screen's action.
  useEffect(() => {
    if (focusCta && hydrated) ctaRef.current?.focus({ preventScroll: true });
  }, [focusCta, hydrated]);

  // Turning reduced motion on mid-sequence lands on the destination at once.
  useEffect(() => {
    if (!PLAYING.includes(phase)) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => {
      if (media.matches) finish(true);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [phase, finish]);

  useEffect(() => {
    if (phase === "orienting") skipRef.current?.focus({ preventScroll: true });
    if (phase !== "done") return;
    onCompleteRef.current?.({ instant });
    if (!focusOnDoneRef.current) {
      focusOnDoneRef.current = true;
      return;
    }
    // Hand focus from the gate to the revealed destination title.
    const heading = contentRef.current?.querySelector<HTMLElement>("h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, [phase, instant, tripId]);

  // From the first frame of the sequence to the final hero, the navbar is
  // the transparent overlay (and is hidden while the sequence plays).
  const immersivePhase = phase !== "ready";
  const playingPhase = PLAYING.includes(phase);
  useEffect(() => {
    if (!immersivePhase) return;
    setNavbarOverlay(true);
    document.body.classList.add(BODY_HERO_CLASS);
    return () => {
      setNavbarOverlay(false);
      document.body.classList.remove(BODY_HERO_CLASS);
    };
  }, [immersivePhase, setNavbarOverlay]);
  useEffect(() => {
    if (!playingPhase) return;
    document.body.classList.add(BODY_PLAYING_CLASS);
    return () => document.body.classList.remove(BODY_PLAYING_CLASS);
  }, [playingPhase]);

  const done = phase === "done";
  const playing = PLAYING.includes(phase);
  const status = done
    ? interpolateTemplate(copy.statusRevealed, { destination })
    : playing
      ? copy.statusPlaying
      : "";

  return (
    <div
      className={[
        styles.revealWrap,
        done ? "" : styles.revealGated,
        immersivePhase ? styles.revealImmersive : "",
        phase === "opening" ? styles.revealOpening : "",
        instant ? styles.revealInstant : "",
      ].join(" ")}
      data-component="TripBoardReveal"
      data-phase={phase}
    >
      <div className={styles.revealContent} aria-hidden={!done} inert={!done} ref={contentRef}>
        {children}
      </div>

      {!done && (
        // Opaque from the first paint, so the hero (destination + photo) is
        // never visible before the gate's content hydrates.
        <div className={styles.gate} data-phase={phase}>
          {hydrated && (
            <>
              <div className={styles.gateBackdrop} aria-hidden="true">
                <span className={styles.maskCompass} />
              </div>

              <div className={styles.ready} inert={phase !== "ready"}>
                <div className={styles.intro}>
                  <p className={styles.introEyebrow}>
                    <span className={styles.introDot} aria-hidden="true" />
                    {copy.eyebrow}
                  </p>
                  <h2 className={`${styles.introTitle} ${styles.cond}`}>
                    {copy.titleLead}
                    {"\n"}
                    <span>{copy.titleAccent}</span>
                  </h2>
                  <p className={styles.introBody}>{copy.body}</p>
                  <ButtonV2 className={styles.introCta} onClick={start} ref={ctaRef} type="button">
                    {copy.cta}
                  </ButtonV2>
                  <p className={styles.introMicro}>{copy.micro}</p>
                  <p className={styles.introFoot}>{copy.footer}</p>
                </div>

                <div className={styles.stage} aria-hidden="true">
                  <span className={`${styles.stageRule} ${styles.stageRuleTop}`} />
                  <span className={styles.stageTagline}>{copy.stageTagline}</span>
                  <span className={`${styles.orbit} ${styles.orbitInner}`} />
                  <span className={`${styles.orbit} ${styles.orbitOuter}`} />
                  <span className={styles.orbitLine} />
                  <span className={`${styles.maskCompass} ${styles.stageGhost}`} />
                  <span className={`${styles.maskCompass} ${styles.stageCompass}`} />
                  <p className={`${styles.stageCaption} ${styles.cond}`}>{copy.stageCaption}</p>
                  <span className={styles.stageIndex}>{SIGNATURE}</span>
                  <span className={`${styles.stageRule} ${styles.stageRuleBottom}`} />
                </div>
              </div>

              <div className={styles.motionCopy} aria-hidden="true">
                <p className={styles.motionEyebrow}>{copy.orientEyebrow}</p>
                <p className={styles.motionLine}>{copy.orientLine}</p>
              </div>

              <div
                className={`${styles.board} ${destinationShown ? styles.boardDestination : ""}`}
                aria-hidden="true"
              >
                <div className={styles.boardSignature}>
                  <span className={`${styles.maskCompass} ${styles.boardCompass}`} />
                  <p className={styles.motionEyebrow}>{copy.orientEyebrow}</p>
                </div>
                <div className={styles.boardHousing}>
                  <SplitFlapBoard ref={boardRef} rows={rows} />
                </div>
                <div className={styles.boardFooter}>
                  <span>{destinationShown ? copy.boardCaptionFinal : copy.boardCaption}</span>
                  <span className={styles.boardCode}>{SIGNATURE}</span>
                </div>
              </div>

              {playing && phase !== "opening" && (
                <button className={styles.skip} onClick={() => finish(true)} ref={skipRef} type="button">
                  {copy.skip}
                </button>
              )}
            </>
          )}
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {status}
      </p>
    </div>
  );
}
