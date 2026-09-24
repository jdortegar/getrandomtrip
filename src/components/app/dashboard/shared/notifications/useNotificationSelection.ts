"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NotificationAudienceValue, NotificationStatusFilter } from "@/lib/notifications/list-query";
import type { ClientNotification, NotificationPaneState } from "@/types/notifications";

export type NotificationSelectionMode = "push" | "replace";

interface UseNotificationSelectionArgs {
  /** The currently loaded (filtered + paginated) page of notifications. */
  list: ClientNotification[];
  page: number;
  status: NotificationStatusFilter;
  audience: NotificationAudienceValue;
  /** Seeded from the server page's `?id=` search param — resolved on mount. */
  initialSelectedId?: string;
  /**
   * Called every time a notification finishes resolving (list hit, snapshot
   * hit, or a successful `GET [id]`) — for every path that can select one:
   * a row click, Prev/Next, a deep link on mount, or popstate. The caller
   * decides what "opening marks it read" means (an API call); this hook
   * only reports that a resolution happened.
   */
  onResolved?: (notification: ClientNotification) => void;
}

export interface UseNotificationSelectionResult {
  selectedId: string | null;
  /** Snapshot of the selected notification — kept even after it leaves `list` (D1). */
  selected: ClientNotification | null;
  paneState: NotificationPaneState;
  /** True when the last detail resolution failed for a reason other than a clean 404. */
  loadError: boolean;
  canPrev: boolean;
  canNext: boolean;
  /** The frozen insertion-point index used to resolve Prev/Next once the selected item has left `list` (D1). Exposed so callers can resolve a neighbor against a list they already have in hand (e.g. right after a delete's own refetch response) without waiting on a render cycle. */
  anchor: number | null;
  /** Opens (or re-selects) a notification. "push" for list clicks, "replace" for Prev/Next, delete-advance, and deep-link cleanup (D4). */
  open: (id: string, mode?: NotificationSelectionMode) => void;
  step: (direction: "prev" | "next") => void;
  /** Clears the selection — `history.back()` if this session pushed the entry, otherwise a plain replace (D4). */
  close: () => void;
  /** Unconditionally clears the selection via a plain replace, regardless of push/replace history — for programmatic cleanup (e.g. delete-advance finding no next item) rather than user-initiated dismissal. */
  clear: () => void;
  /** Patches the snapshot in place (e.g. after a successful mark read/unread) without a re-fetch. */
  updateSelected: (updater: (prev: ClientNotification) => ClientNotification) => void;
}

function setIdParam(id: string | null, mode: NotificationSelectionMode) {
  const url = new URL(window.location.href);
  if (id) {
    url.searchParams.set("id", id);
  } else {
    url.searchParams.delete("id");
  }
  const href = `${url.pathname}${url.search}`;
  if (mode === "push") {
    window.history.pushState(null, "", href);
  } else {
    window.history.replaceState(null, "", href);
  }
}

function readIdParam(): string | null {
  return new URL(window.location.href).searchParams.get("id");
}

/**
 * Pure anchor math (D1): if the selected item is still in `list`, neighbors
 * are `idx±1`. Once it has left the list, `prev = list[anchor-1]` and
 * `next = list[anchor]` — the frozen insertion point from before it left.
 */
export function resolveNeighborId(
  list: ClientNotification[],
  selectedId: string | null,
  anchor: number | null,
  direction: "prev" | "next",
): string | undefined {
  if (anchor === null || !selectedId) return undefined;
  const idxInList = list.findIndex((n) => n.id === selectedId);
  if (idxInList !== -1) {
    const targetIdx = direction === "prev" ? idxInList - 1 : idxInList + 1;
    return list[targetIdx]?.id;
  }
  const targetIdx = direction === "prev" ? anchor - 1 : anchor;
  return list[targetIdx]?.id;
}

export function useNotificationSelection({
  list,
  page,
  status,
  audience,
  initialSelectedId,
  onResolved,
}: UseNotificationSelectionArgs): UseNotificationSelectionResult {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId ?? null,
  );
  const [selected, setSelected] = useState<ClientNotification | null>(null);
  const [paneState, setPaneState] = useState<NotificationPaneState>(
    initialSelectedId ? "loading" : "empty",
  );
  const [loadError, setLoadError] = useState(false);
  const [anchor, setAnchor] = useState<number | null>(null);

  // Tracks whether the *current* selection entry was pushed (vs. replaced or
  // arrived via popstate) — close() only calls history.back() in that case.
  const pushedRef = useRef(false);
  // `resolve()` below is only ever invoked from event handlers, popstate, or
  // a mount effect — never during render — so refreshing these refs in an
  // effect (after the value actually commits) is sufficient and avoids
  // mutating a ref during render.
  const selectedRef = useRef<ClientNotification | null>(null);
  const listRef = useRef<ClientNotification[]>(list);
  const requestIdRef = useRef(0);
  const onResolvedRef = useRef(onResolved);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    listRef.current = list;
  }, [list]);

  useEffect(() => {
    onResolvedRef.current = onResolved;
  }, [onResolved]);

  const resolve = useCallback(
    async (id: string) => {
      const inList = listRef.current.find((n) => n.id === id);
      if (inList) {
        setSelected(inList);
        setPaneState("ready");
        setLoadError(false);
        onResolvedRef.current?.(inList);
        return;
      }
      if (selectedRef.current?.id === id) {
        setPaneState("ready");
        setLoadError(false);
        onResolvedRef.current?.(selectedRef.current);
        return;
      }

      setPaneState("loading");
      setLoadError(false);
      const requestId = ++requestIdRef.current;
      try {
        const res = await fetch(`/api/notifications/${id}?audience=${audience}`);
        if (requestId !== requestIdRef.current) return; // superseded by a newer resolve
        if (res.status === 404) {
          setSelected(null);
          setPaneState("notFound");
          return;
        }
        if (!res.ok) {
          setSelected(null);
          setPaneState("notFound");
          setLoadError(true);
          return;
        }
        const data = (await res.json()) as { notification: ClientNotification };
        setSelected(data.notification);
        setPaneState("ready");
        onResolvedRef.current?.(data.notification);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setSelected(null);
        setPaneState("notFound");
        setLoadError(true);
      }
    },
    [audience],
  );

  const open = useCallback(
    (id: string, mode: NotificationSelectionMode = "push") => {
      pushedRef.current = mode === "push";
      setSelectedId(id);
      setIdParam(id, mode);
      void resolve(id);
    },
    [resolve],
  );

  const close = useCallback(() => {
    if (pushedRef.current) {
      window.history.back();
    } else {
      setIdParam(null, "replace");
      setSelectedId(null);
      setSelected(null);
      setPaneState("empty");
    }
    pushedRef.current = false;
  }, []);

  const clear = useCallback(() => {
    setIdParam(null, "replace");
    setSelectedId(null);
    setSelected(null);
    setPaneState("empty");
    pushedRef.current = false;
  }, []);

  // D1 — the anchor tracks the selected item's index while it's present in
  // the list; once it leaves (e.g. an unread-filter re-fetch), the anchor is
  // left untouched so Prev/Next keep resolving against the pre-refetch
  // order. A page or status change invalidates that context, so it resets
  // to null. Both are adjustments made *during render* — not effects — per
  // React's guidance for state that mirrors a prop/derived value:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  //
  // Each block below only reacts when the specific inputs it cares about
  // actually changed (mirroring what a `useEffect` dependency array would
  // gate on) — comparing against a stored "previous" value, not just
  // re-deriving unconditionally every render. Without that guard, the
  // idx-tracking block would re-fire on every render (since the item stays
  // "found" in an unchanged list) and immediately undo the page/status
  // reset the moment it also happens to run.
  const pageStatusKey = `${page}:${status}`;
  const [prevPageStatusKey, setPrevPageStatusKey] = useState(pageStatusKey);
  if (pageStatusKey !== prevPageStatusKey) {
    setPrevPageStatusKey(pageStatusKey);
    setAnchor(null);
  }

  const [prevList, setPrevList] = useState(list);
  const [prevSelectedIdForAnchor, setPrevSelectedIdForAnchor] = useState(selectedId);
  if (list !== prevList || selectedId !== prevSelectedIdForAnchor) {
    setPrevList(list);
    setPrevSelectedIdForAnchor(selectedId);
    if (selectedId) {
      const idx = list.findIndex((n) => n.id === selectedId);
      if (idx !== -1) setAnchor(idx);
    }
  }

  const canPrev = resolveNeighborId(list, selectedId, anchor, "prev") !== undefined;
  const canNext = resolveNeighborId(list, selectedId, anchor, "next") !== undefined;

  const step = useCallback(
    (direction: "prev" | "next") => {
      const id = resolveNeighborId(list, selectedId, anchor, direction);
      if (id) open(id, "replace");
    },
    [list, selectedId, anchor, open],
  );

  const updateSelected = useCallback(
    (updater: (prev: ClientNotification) => ClientNotification) => {
      setSelected((prev) => (prev ? updater(prev) : prev));
    },
    [],
  );

  // Deep link / reload — resolve the server-seeded id once on mount. Guarded
  // by a ref (not an empty dep array) so the effect's own dependencies stay
  // honest — `initialSelectedId`/`resolve` are listed, but the ref ensures
  // the actual resolve only ever runs once, even if either identity changes
  // on a later render.
  const didInitialResolveRef = useRef(false);
  useEffect(() => {
    if (didInitialResolveRef.current) return;
    didInitialResolveRef.current = true;
    if (initialSelectedId) void resolve(initialSelectedId);
  }, [initialSelectedId, resolve]);

  // Hardware/browser back or forward — re-read `id` from the URL and resolve
  // it the same way (list, then snapshot, then GET).
  useEffect(() => {
    function handlePopState() {
      const id = readIdParam();
      pushedRef.current = false;
      if (!id) {
        setSelectedId(null);
        setSelected(null);
        setPaneState("empty");
        return;
      }
      setSelectedId(id);
      void resolve(id);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [resolve]);

  return {
    selectedId,
    selected,
    paneState,
    loadError,
    canPrev,
    canNext,
    anchor,
    open,
    step,
    close,
    clear,
    updateSelected,
  };
}
