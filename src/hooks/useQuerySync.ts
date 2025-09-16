
import { useRouter, useSearchParams } from 'next/navigation';

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
