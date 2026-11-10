import { useMemo, useOptimistic, useTransition } from "react";
import {
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";

export type QueryPatch = Record<string, string | string[] | undefined>;

/**
 * Applies a query patch to a serialized query string.
 * - undefined or an empty array removes the param.
 * - An array is stored as a comma-separated list.
 * - Anything else is stored as-is.
 */
function applyQueryPatch(query: string, patch: QueryPatch): string {
  const next = new URLSearchParams(query);
  Object.entries(patch).forEach(([k, v]) => {
    if (v === undefined || (Array.isArray(v) && v.length === 0)) {
      next.delete(k);
    } else if (Array.isArray(v)) {
      next.set(k, v.join(","));
    } else {
      next.set(k, v);
    }
  });
  return next.toString();
}

/**
 * useQuerySync
 *
 * A React hook for synchronizing updates to the query string in the browser's URL.
 *
 * Returns a function that receives a "patch" object representing key/value pairs to update
 * (see applyQueryPatch for the rules).
 *
 * The browser's URL is updated using router.replace without scrolling.
 *
 * Example usage:
 *   const updateQuery = useQuerySync();
 *   updateQuery({ foo: "bar", baz: ["a", "b"], pop: undefined });
 */
export function useQuerySync() {
  const router = useRouter();
  const sp = useSearchParams();

  return (patch: QueryPatch) => {
    router.replace(`?${applyQueryPatch(sp.toString(), patch)}`, {
      scroll: false,
    });
  };
}

/**
 * useOptimisticQuerySync
 *
 * Like useQuerySync, but also returns search params that reflect a patch
 * immediately. On dynamic routes router.replace re-renders the server page,
 * so UI driven by the real search params (e.g. selected cards) would only
 * update once that round trip lands. The optimistic params show the new
 * selection at once and settle to the real URL when the navigation commits.
 */
export function useOptimisticQuerySync(): {
  searchParams: ReadonlyURLSearchParams;
  updateQuery: (patch: QueryPatch) => void;
} {
  const router = useRouter();
  const sp = useSearchParams();
  const [optimisticQuery, setOptimisticQuery] = useOptimistic(sp.toString());
  const [, startTransition] = useTransition();

  const searchParams = useMemo(
    () => new URLSearchParams(optimisticQuery) as ReadonlyURLSearchParams,
    [optimisticQuery],
  );

  const updateQuery = (patch: QueryPatch) => {
    const next = applyQueryPatch(optimisticQuery, patch);
    startTransition(() => {
      setOptimisticQuery(next);
      router.replace(`?${next}`, { scroll: false });
    });
  };

  return { searchParams, updateQuery };
}
