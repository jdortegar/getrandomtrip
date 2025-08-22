'use client';
import Image from 'next/image';
import clsx from 'clsx';

export default function TravelerGroupCard({
  title,
  tagline,
  iconSrc,
  active = false,
  onSelect,
}: {
  title: string;
  tagline: string;
  iconSrc: string;
  active?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      className={clsx(
        'group relative w-full rounded-2xl border transition-all px-6 pt-8 pb-6 text-left focus:outline-none focus:ring-2 focus:ring-neutral-400',
        active
          ? 'bg-neutral-900 text-white border-neutral-800 shadow-xl'
          : 'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-300 hover:shadow-md'
      )}
    >
      <div className="w-full flex items-center justify-center">
        <Image
          src={iconSrc}
          alt=""
          width={220}
          height={140}
          priority
          className={clsx(
            'h-auto w-[220px] max-w-[60%] md:max-w-[70%]',
            active ? 'invert brightness-200' : 'opacity-90 group-hover:opacity-100'
          )}
        />
      </div>
      <h4 className={clsx('mt-5 font-semibold tracking-wide', active ? 'text-white' : 'text-neutral-900')}>
        {title}
      </h4>
      <p className={clsx('mt-1 text-sm leading-relaxed', active ? 'text-white/85' : 'text-neutral-600')}>
        {tagline}
      </p>
      {active && (
        <span className="absolute top-3 right-3 text-xs rounded-full bg-white/10 border border-white/20 px-2 py-1">
          Seleccionado ✓
        </span>
      )}
    </button>
  );
}