'use client';

import { useEffect, useState } from 'react';

/** Lee ?var=B y persiste por tipo; por defecto 'A' */
export function useVariantParam(type: string): 'A' | 'B' {
  const [variant, setVariant] = useState<'A' | 'B'>('A');

  useEffect(() => {
    try {
      const usp = new URLSearchParams(window.location.search);
      const q = (usp.get('var') || localStorage.getItem(`rt-var-${type}`) || 'A').toUpperCase();
      const v = q === 'B' ? 'B' : 'A';
      setVariant(v);
      localStorage.setItem(`rt-var-${type}`, v);
    } catch {
      // SSR/No DOM: noop
    }
  }, [type]);

  return variant;
}

// también default, por si algún componente lo importa por default
const _default = useVariantParam;
export default _default;