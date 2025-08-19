'use client';
import { useEffect, useRef, useState } from 'react';

export default function FamilyPlanner(props:{ id?: string }) {
  const ref = useRef<HTMLDivElement|null>(null);
  const [isOpen, setIsOpen] = useState(false); // o tu flag existente (showPlanner)

  // Abre y hace scroll si llega con #planner (o si el hash cambia a #planner)
  useEffect(() => {
    const openFromHash = () => {
      if (typeof window === 'undefined') return;
      if (window.location.hash === '#planner') {
        setIsOpen(true);                  // o tu openPlanner()
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, []);

  return (
    <section id={props.id ?? 'planner'} ref={ref}>
      {/* render de carátula + tabs; usa isOpen para mostrar/ocultar si aplica */}
    </section>
  );
}
