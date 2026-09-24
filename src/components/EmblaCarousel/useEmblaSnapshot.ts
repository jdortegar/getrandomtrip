import { useCallback, useSyncExternalStore } from "react";
import type { EmblaCarouselType } from "embla-carousel";

// Readers must return primitives or stable values (Embla's snap list is stable
// until reInit). Never allocate a new object/array inside a snapshot reader.
export function useEmblaSnapshot<T>(
  api: EmblaCarouselType | undefined,
  read: (api: EmblaCarouselType) => T,
  fallback: T,
): T {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!api) return () => {};
      api.on("select", notify).on("reInit", notify);
      return () => {
        api.off("select", notify).off("reInit", notify);
      };
    },
    [api],
  );
  return useSyncExternalStore(
    subscribe,
    () => (api ? read(api) : fallback),
    () => fallback,
  );
}
