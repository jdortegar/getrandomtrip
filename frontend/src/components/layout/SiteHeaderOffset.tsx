'use client';
import { useEffect } from 'react';

export default function SiteHeaderOffset() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('[data-site-header]');
    const set = () => {
      const h = header?.offsetHeight ?? 64;
      document.documentElement.style.setProperty('--rt-header-h', `${h}px`);
    };
    set();
    window.addEventListener('resize', set);
    return () => window.removeEventListener('resize', set);
  }, []);
  return null;
}
