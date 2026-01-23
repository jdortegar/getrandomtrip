
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * useQuerySync
 * 
 * A React hook for synchronizing updates to the query string in the browser's URL.
 * 
 * Returns a function that receives a "patch" object representing key/value pairs to update.
 * - If a value is undefined or an empty array, the corresponding query param is removed.
 * - If a value is an array, it is stringified as a comma-separated list.
 * - Otherwise, the value is stringified and set as the query param.
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

  return (patch: Record<string, string | string[] | undefined>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || (Array.isArray(v) && v.length === 0)) {
        next.delete(k);
      } else if (Array.isArray(v)) {
        next.set(k, v.join(','));
      } else {
        next.set(k, v);
      }
    });
    router.replace(`?${next.toString()}`, { scroll: false });
  };
}
