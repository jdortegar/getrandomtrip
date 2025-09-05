'use client';
import { useEffect, useMemo, useState } from 'react';

function readInitialHeaderH(): number {
  if (typeof window === 'undefined') return 64;
  const v = getComputedStyle(document.documentElement).getPropertyValue('--rt-header-h').trim();
  const n = parseInt(v.replace('px',''), 10);
  return Number.isFinite(n) ? n : 64;
}

export default function TripperOffset({ children }: { children: React.ReactNode }) {
  const [h, setH] = useState<number>(readInitialHeaderH());

  useEffect(() => {
    const header = document.querySelector('[data-site-header]') as HTMLElement | null;
    if (!header) return;

    const update = () => setH(header.offsetHeight || 0);
    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(header);

    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // Exponemos la variable para Topbar sticky y aplicamos padding al contenido
  const style = useMemo(() => ({
    paddingTop: `${h}px`,
    ['--rt-header-h' as any]: `${h}px`,
  }), [h]);

  return <div style={style}>{children}</div>;
}