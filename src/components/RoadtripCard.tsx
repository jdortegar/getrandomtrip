import React from 'react';
import Link from 'next/link';
import Img from '@/components/common/Img'; // Added import

interface RoadtripCardProps {
  title: string;
  description: string;
  bgImage: string;
  icon?: string;                 // opcional
  onClick?: () => void;          // sigue funcionando si NO pasas href
  href?: string;                 // nuevo: usa <Link> si está presente
  className?: string;
}

const CardInner: React.FC<{
  title: string;
  description: string;
  bgImage: string;
  icon?: string;
  className?: string;
  // handlers opcionales cuando NO usamos Link
  onClick?: () => void;
}> = ({ title, description, bgImage, icon, className, onClick }) => (
  <div
    onClick={onClick}
    className={`relative h-96 rounded-lg overflow-hidden shadow-lg group ${onClick ? 'cursor-pointer' : ''} ${className || ''}`}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={
      onClick
        ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick();
            }
          }
        : undefined
    }
    aria-label={`Abrir ${title}`}
  >
    <Img
      src={bgImage}
      alt={title}
      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
      width={1200} // Assuming a reasonable default width
      height={960} // Assuming a reasonable default height (h-96)
    />
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-t from-black/80 to-transparent text-center">
      {icon ? <div className="text-5xl mb-2">{icon}</div> : null}
      <h3 className="text-4xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
        {title}
      </h3>
      <p className="text-lg text-gray-200 mt-2">{description}</p>
    </div>
  </div>
);

const RoadtripCard: React.FC<RoadtripCardProps> = (props) => {
  const { href, ...rest } = props;

  // Si hay href, usamos Link para navegación estable/prefetch
  if (href) {
    return (
      <Link href={href} className="block">
        <CardInner {...rest} />
      </Link>
    );
  }

  // Si no hay href, se mantiene el comportamiento anterior con onClick
  return <CardInner {...rest} />;
};

export default RoadtripCard;
