// frontend/src/components/by-type/paws/PawsExperienceCard.tsx
'use client';

export type Props = {
  id: string;
  name: string;
  subtitle: string;
  priceLabel: string;
  priceFootnote: string;
  features: { text: string; footnote?: string }[];
  closingLine: string;
  ctaLabel: string;
  onClick?: () => void;
};

export default function PawsExperienceCard({
  id,
  name,
  subtitle,
  priceLabel,
  priceFootnote,
  features,
  closingLine,
  ctaLabel,
  onClick,
}: Props) {
  return (
    <div
      key={id}
      role="group"
      aria-labelledby={`h-${id}`}
      className="h-full flex flex-col rounded-2xl bg-white p-6 border border-gray-200 shadow-md transition hover:shadow-lg hover:scale-[1.02]"
    >
      {/* Contenido: columna flexible para alinear el closingLine abajo */}
      <div className="flex-1 flex flex-col">
        <h4 id={`h-${id}`} className="font-display text-xl tracking-tightish font-bold text-gray-900">
          {name}
        </h4>

        <p className="text-gray-800 text-sm">{subtitle}</p>

        <div className="mt-6">
          <div className="font-display text-3xl leading-tight font-bold text-[var(--rt-terracotta)]">
            {priceLabel}
          </div>
          <span className="block text-xs text-gray-900">{priceFootnote}</span>
        </div>

        <ul className="mt-5 space-y-2 text-sm text-gray-800">
          {(features ?? []).map((f, i) => (
            <li key={i} className="leading-snug">
              • {f.text.split('**').map((part, index) => (
                  index % 2 === 1 ? <strong key={index}>{part}</strong> : part
                ))}
              {f.footnote && (
                <span className="block pl-4 text-xs text-gray-600">* {f.footnote}</span>
              )}
            </li>
          ))}
        </ul>

        {closingLine && (
          <div className="mt-auto py-4 border-y border-gray-200">
            <p className="text-neutral-800 text-sm leading-relaxed text-center">
              {closingLine}
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div>
        <button
          type="button"
          className="btn-card w-full mt-6"
          aria-label={ctaLabel}
          onClick={onClick}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}