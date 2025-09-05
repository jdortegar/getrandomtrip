'use client';
import { useEffect } from 'react';

export default function SiteHeaderOffset() {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('[data-site-header]');
    const h = el?.offsetHeight ?? 64;
    document.documentElement.style.setProperty('--rt-header-h', `${h}px`);

    const onResize = () => {
      const nh = el?.offsetHeight ?? 64;
      document.documentElement.style.setProperty('--rt-header-h', `${nh}px`);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return null;
}