'use client';
import React from 'react';
import GetRandomtripCta from '@/components/common/GetRandomtripCta';

type HowItWorksProps = {
  variant?: 'default' | 'compact';
};

export default function HowItWorksSection({ variant = 'default' }: HowItWorksProps) {
  const steps = [
    {
      num: '1',
      title: 'Planificá',
      description:
        'Elegí fechas, ciudad de origen, duración y presupuesto. Sumá filtros y mood si querés.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2a2 2 0 0 0-2 2v1h16V4a2 2 0 0 0-2-2H6Z" />
          <path d="M20 7H4v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7ZM8 10h5v2H8v-2Z" />
        </svg>
      ),
    },
    {
      num: '2',
      title: 'Recibí la sorpresa',
      description:
        'Confirmá tu viaje. Te revelamos el destino 48 h antes y te enviamos la guía para ese mood.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-2h2Zm1.07-7.75-.9.92A2.51 2.51 0 0 0 12.5 12h-1v-1a1.5 1.5 0 0 1 .44-1.06l1.24-1.25a1.75 1.75 0 1 0-2.97-1.24H8a3.75 3.75 0 1 1 6.07 2.8Z"/>
        </svg>
      ),
    },
    {
      num: '3',
      title: 'Viajá sin estrés',
      description:
        'Hacé la valija. Pasajes y alojamiento listos; soporte humano cuando lo necesites.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 7h20v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7Zm5-3h10v2H7V4Z" />
        </svg>
      ),
    },
  ];

  const isCompact = variant === 'compact';

  const wrapCls = isCompact ? 'py-6 md:py-8' : 'py-10 md:py-14';
  const headerWrapCls = isCompact ? 'text-center mb-6' : 'text-center mb-10';
  const titleCls = isCompact ? 'text-3xl md:text-4xl font-bold leading-tight' : 'text-4xl md:text-5xl font-bold';
  const subtitleCls = isCompact ? 'mt-1 text-sm md:text-base text-neutral-600' : 'mt-2 text-neutral-600';
  const gridCls = isCompact ? 'grid md:grid-cols-3 gap-5' : 'grid md:grid-cols-3 gap-8';
  const cardCls = isCompact ? 'relative rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm' : 'relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow';
  const cardTitleCls = isCompact ? 'text-lg md:text-xl font-bold mb-1' : 'text-xl md:text-2xl font-bold mb-2';
  const cardTextCls = isCompact ? 'text-xs md:text-sm text-neutral-700 leading-snug' : 'text-sm text-neutral-700';
  const noteCls = isCompact ? 'mt-3 text-[11px] md:text-xs text-neutral-500 text-center' : 'mt-4 text-xs text-neutral-500 text-center';
  const ctaWrapCls = isCompact ? 'mt-6 flex justify-center' : 'mt-8 flex justify-center';
  const badgesWrapCls = isCompact ? 'mt-6 grid grid-cols-2 md:grid-cols-4 gap-2' : 'mt-8 grid grid-cols-2 md:grid-cols-4 gap-3';

  return (
    <section className={wrapCls}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className={headerWrapCls}>
          <h3
            className={titleCls}
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            ¿Cómo funciona?
          </h3>
          <p className={subtitleCls}>
            Tres pasos. Cero estrés. Más descubrimiento.
          </p>
        </header>

        <ol className={gridCls} role="list">
          {steps.map((s) => (
            <li key={s.title} className={cardCls}>
              <div className="absolute -top-4 left-6 inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-full bg-neutral-900 text-white text-sm font-semibold shadow">
                {s.num}
              </div>

              <div className="mt-4 flex items-center gap-3 text-[#D97E4A]">
                {s.icon}
                <h4
                  className={cardTitleCls}
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {s.title}
                </h4>
              </div>

              <p className={cardTextCls}>{s.description}</p>
            </li>
          ))}
        </ol>

        <p className={noteCls}>
          * El destino se revela 48 horas antes para preservar la sorpresa. Se envía guía y checklist.
        </p>

        <div className={ctaWrapCls}>
          <GetRandomtripCta align="center" />
        </div>

        <div className={badgesWrapCls}>
          {['Confiado por viajeros', 'Atención humana 24/7', 'Pagos seguros', 'Pet-friendly ready'].map(
            (t) => (
              <div key={t} className="text-center text-xs text-neutral-600 border rounded-lg py-2 px-1">
                {t}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}