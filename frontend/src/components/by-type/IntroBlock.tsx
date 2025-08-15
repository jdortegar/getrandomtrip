'use client';

interface IntroBlockProps {
  type: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
}

const getContent = (type: string) => {
  switch (type) {
    case 'families':
      return {
        subtitle: "La sorpresa que junta a todos en la misma historia.",
        paragraphs: [
          "Diseñamos una Ruta con Alma para que la logística desaparezca y aparezca lo importante: ustedes.",
          "Nos encargamos de cada detalle, desde el alojamiento hasta las actividades, para que tu familia solo se preocupe por disfrutar y crear recuerdos inolvidables. Viajar con niños nunca fue tan fácil y emocionante."
        ]
      };
    case 'couples':
      return {
        subtitle: "El mapa se guarda, la mirada se comparte.",
        paragraphs: [
          "Una sorpresa curada para volver a elegirse en cada detalle. Cada destino, cada experiencia, está pensada para fortalecer la conexión y reavivar la chispa.",
          "Desde cenas románticas hasta aventuras inesperadas, tu viaje será un lienzo en blanco para pintar nuevas historias juntos, sin distracciones ni preocupaciones logísticas."
        ]
      };
    case 'solo':
      return {
        subtitle: "Suelta el control. Gana perspectiva. Vuelve con historia.",
        paragraphs: [
          "Un viaje en solitario es una oportunidad única para el autodescubrimiento. Nosotros nos encargamos de la planificación, tú de la aventura.",
          "Explora nuevos horizontes, desafía tus límites y regresa con una perspectiva renovada y anécdotas que solo tú podrás contar. La libertad de viajar a tu propio ritmo, con la seguridad de un itinerario perfectamente curado."
        ]
      };
    case 'honeymoons':
      return {
        subtitle: "Tu ‘sí’ para siempre, nuestra sorpresa hoy.",
        paragraphs: [
          "Íntima, cuidada, inolvidable. Tu luna de miel merece ser tan única como tu amor. Dejamos que la magia de la sorpresa te envuelva, mientras nosotros nos encargamos de cada detalle para que solo te dediques a celebrar.",
          "Desde destinos exóticos hasta experiencias personalizadas, cada momento está diseñado para crear recuerdos que durarán toda la vida, sin estrés ni preocupaciones."
        ]
      };
    case 'groups':
      return {
        subtitle: "Compartir aventura multiplica todo.",
        paragraphs: [
          "Experiencias compartidas, logística invisible. Organizar un viaje en grupo puede ser un desafío, pero con Randomtrip, la diversión comienza desde la planificación.",
          "Nos encargamos de coordinar todo para que tu grupo disfrute al máximo, creando lazos y recuerdos que se multiplicarán con cada nueva aventura. Ideal para amigos, reuniones familiares o eventos especiales."
        ]
      };
    default:
      return {
        subtitle: "Descubre tu próxima aventura sorpresa.",
        paragraphs: [
          "En Randomtrip, creemos que los mejores viajes son aquellos que te sorprenden. Olvídate de la planificación y déjanos curar una experiencia inolvidable para ti.",
          "Nuestras Rutas con Alma están diseñadas para despertar tu curiosidad y llevarte a destinos inesperados, donde cada momento es una nueva oportunidad para explorar y disfrutar."
        ]
      };
  }
};

export default function IntroBlock({ type, palette }: IntroBlockProps) {
  const content = getContent(type);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: palette.secondary }}>
          {content.subtitle}
        </h2>
        <div className="text-lg md:text-xl leading-relaxed" style={{ color: palette.text }}>
          {content.paragraphs.map((p, index) => (
            <p key={index} className="mb-4 last:mb-0">{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
