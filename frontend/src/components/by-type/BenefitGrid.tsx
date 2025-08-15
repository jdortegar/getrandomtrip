'use client';
import { FaPlaneDeparture, FaMapMarkedAlt, FaHandsHelping, FaHeart, FaUsers, FaRegLightbulb } from 'react-icons/fa';
import { IconType } from 'react-icons';

interface BenefitGridProps {
  type: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
}

interface Benefit {
  icon: IconType;
  title: string;
  description: string;
}

const getBenefits = (type: string): Benefit[] => {
  switch (type) {
    case 'families':
      return [
        { icon: FaHandsHelping, title: "Logística Invisible", description: "Nos encargamos de todo, tú solo disfrutas." },
        { icon: FaRegLightbulb, title: "Sorpresa Curada", description: "Itinerarios pensados para todas las edades." },
        { icon: FaPlaneDeparture, title: "Tiempos Optimizados", description: "Máximo disfrute, mínimo estrés." },
        { icon: FaMapMarkedAlt, title: "Destinos Familiares", description: "Aventuras seguras y emocionantes." },
      ];
    case 'couples':
      return [
        { icon: FaHeart, title: "Conexión Profunda", description: "Momentos diseñados para reconectar." },
        { icon: FaRegLightbulb, title: "Curaduría Romántica", description: "Detalles que enamoran en cada paso." },
        { icon: FaMapMarkedAlt, title: "Escapadas Inolvidables", description: "Destinos que inspiran el amor." },
        { icon: FaHandsHelping, title: "Soporte Discreto", description: "Asistencia 24/7 sin interrupciones." },
      ];
    case 'solo':
      return [
        { icon: FaRegLightbulb, title: "Suelta el Control", description: "Libertad total en tu aventura." },
        { icon: FaMapMarkedAlt, title: "Gana Perspectiva", description: "Viajes que transforman y enriquecen." },
        { icon: FaHandsHelping, title: "Soporte Seguro", description: "Asistencia constante y confiable." },
        { icon: FaPlaneDeparture, title: "Vuelve con Historia", description: "Experiencias únicas para contar." },
      ];
    case 'honeymoons':
      return [
        { icon: FaHeart, title: "Íntimo y Cuidado", description: "Cada detalle pensado para el romance." },
        { icon: FaRegLightbulb, title: "Inolvidable", description: "Momentos que durarán para siempre." },
        { icon: FaMapMarkedAlt, title: "Destinos Soñados", description: "El escenario perfecto para tu amor." },
        { icon: FaHandsHelping, title: "Asistencia Premium", description: "Soporte exclusivo para tu luna de miel." },
      ];
    case 'groups':
      return [
        { icon: FaUsers, title: "Experiencias Compartidas", description: "Multiplica la diversión con tu grupo." },
        { icon: FaHandsHelping, title: "Logística Simplificada", description: "Organización sin esfuerzo para todos." },
        { icon: FaRegLightbulb, title: "Sorpresa para Todos", description: "Itinerarios que unen y divierten." },
        { icon: FaMapMarkedAlt, title: "Destinos Grupales", description: "Aventuras diseñadas para compartir." },
      ];
    default:
      return [
        { icon: FaPlaneDeparture, title: "Sorpresa Curada", description: "Destinos inesperados, experiencias únicas." },
        { icon: FaMapMarkedAlt, title: "Logística Invisible", description: "Nos encargamos de todo, tú solo disfrutas." },
        { icon: FaHandsHelping, title: "Soporte Humano 24/7", description: "Siempre estamos contigo, en cada paso." },
      ];
  }
};

export default function BenefitGrid({ type, palette }: BenefitGridProps) {
  const benefits = getBenefits(type);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {benefits.map((benefit, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-6 rounded-xl shadow-lg"
            style={{ backgroundColor: palette.primary, color: palette.text }}
          >
            <div className="text-4xl mb-4" style={{ color: palette.accent }}>
              <benefit.icon />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: palette.secondary }}>
              {benefit.title}
            </h3>
            <p className="text-base" style={{ color: palette.text }}>
              {benefit.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
