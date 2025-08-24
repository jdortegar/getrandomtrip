import Link from 'next/link';

type Props = {
  id: string;
  title: string;
  top: number;
  duration: string;
  transport: string;
  dates?: string;
  accommodation: string;
  extras: string;
  description: string;
  cta: string;
};

export default function PawsExperienceCard({
  id, title, top, duration, transport, dates, accommodation, extras, description, cta,
}: Props) {
  return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-md flex flex-col h-full">
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-2xl font-semibold text-[#D4AF37] mb-4">Hasta {top} USD</p>
      <ul className="text-gray-700 text-sm mb-6 flex-grow">
        <li className="mb-1"><strong>Duración:</strong> {duration}</li>
        <li className="mb-1"><strong>Transporte:</strong> {transport}</li>
        {dates && <li className="mb-1"><strong>Fechas:</strong> {dates}</li>}
        <li className="mb-1"><strong>Alojamiento:</strong> {accommodation}</li>
        <li className="mb-1"><strong>Extras:</strong> {extras}</li>
      </ul>
      <p className="text-gray-800 mb-6">{description}</p>
      <Link
        href={`/journey/basic-config?type=paws&level=${id}`}
        className="mt-auto bg-[#D4AF37] text-gray-900 font-bold py-2 px-4 rounded-full text-center hover:bg-[#EACD65] transition-colors"
        data-analytics={`cta_paws_${id}`}
      >
        {cta}
      </Link>
    </div>
  );
}