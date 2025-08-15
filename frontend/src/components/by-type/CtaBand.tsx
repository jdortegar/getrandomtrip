'use client';

interface CtaBandProps {
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
}

export default function CtaBand({ palette }: CtaBandProps) {
  return (
    <section className="py-16 px-4 md:px-8 text-center"
      style={{ backgroundColor: palette.secondary, color: palette.primary }}
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          ¿Listo para descubrir tu próxima aventura?
        </h2>
        <button
          className="rt-button"
          style={{ backgroundColor: palette.accent, color: palette.secondary }}
        >
          Descubrir tu sorpresa
        </button>
      </div>
    </section>
  );
}
