import { type RefObject, useEffect, useRef, useState } from "react";

/**
 * Loads and plays a lazily-sourced background video, and reports when it may be
 * shown. The video stays hidden until its `playing` event so the first visible
 * frame is frame 0 (matching the still underneath), never a mid-clip frame.
 * Once revealed it stays revealed, even while paused off-screen.
 */
export function useVideoReveal(
  videoRef: RefObject<HTMLVideoElement | null>,
  {
    isInView,
    shouldLoad,
    src,
  }: { isInView: boolean; shouldLoad: boolean; src?: string },
) {
  // Keyed by source so a new src starts hidden again without a reset effect.
  const [revealedSrc, setRevealedSrc] = useState<string>();
  const revealedRef = useRef(false);

  // Sources are attached on the render that flips shouldLoad; load() makes the
  // element pick them up.
  useEffect(() => {
    revealedRef.current = false;
    const video = videoRef.current;
    if (!video || !shouldLoad) return;

    const handlePlaying = () => {
      revealedRef.current = true;
      setRevealedSrc(src);
    };
    video.addEventListener("playing", handlePlaying);
    video.load();
    return () => video.removeEventListener("playing", handlePlaying);
  }, [shouldLoad, src, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;
    if (isInView) {
      if (!revealedRef.current && video.currentTime > 0) video.currentTime = 0;
      video.play().catch(() => {});
    } else video.pause();
  }, [isInView, shouldLoad, videoRef]);

  return src !== undefined && revealedSrc === src;
}
