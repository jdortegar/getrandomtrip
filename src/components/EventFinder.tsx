'use client';

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Img from '@/components/common/Img';

interface Event {
  id: string;
  name: string;
  date: string;
  venue: string;
  image: string;
  url: string;
}

const EventFinder: React.FC = () => {
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDate = (date: Date | null) =>
    date ? date.toISOString().split('T')[0] : '';

  const handleSearch = async () => {
    setIsLoading(true);
    setError('');
    setEvents([]);

    const startDateString = formatDate(startDate);
    const endDateString = formatDate(endDate);

    try {
      const response = await fetch(
        `http://localhost:3001/api/events?city=${encodeURIComponent(
          city,
        )}&startDate=${startDateString}&endDate=${endDateString}`,
      );
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setEvents(data.events || []);
      if ((data.events || []).length === 0) {
        setError('No se encontraron eventos para tu búsqueda.');
      }
    } catch {
      setError('Error al buscar eventos. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      aria-label="Buscador de eventos con Ticketmaster"
      className="relative py-24 px-8 text-white overflow-hidden"
    >
      {/* Fondo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/50" />
        <Img
          src="https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg"
          alt="Concierto"
          className="w-full h-full object-cover"
          width={1920} // Assuming a common background image width
          height={1080} // Assuming a common background image height
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 flex flex-col items-center justify-center font-caveat">
            Descubre tu próxima experiencia
          </h2>
          <div>
            Powered by
            <Img
              src="/images/ticketmaster-logo.svg"
              alt="Ticketmaster"
              className="h-12 ml-2 inline-block mb-1"
              width={100} // Approximate width based on h-12
              height={48} // h-12 is 48px
              unoptimized={true} // It's an SVG logo
            />
          </div>
        </div>

        {/* Subtítulo */}
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto font-jost">
          Conquista conciertos, festivales y eventos únicos. Boletos al
          instante, aventuras inolvidables. Solo elige tu ciudad y tus fechas.
        </p>

        {/* Formulario de búsqueda */}
        <div className="bg-black/50 backdrop-blur-sm p-4 rounded-lg flex flex-col md:flex-row items-center gap-4 border border-gray-700 max-w-2xl mx-auto">
          <Input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ingresa una ciudad…"
            className="w-full h-11 bg-gray-900/70 text-white border border-white rounded-md px-3"
          />
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => {
              setStartDate(update[0]);
              setEndDate(update[1]);
            }}
            isClearable
            placeholderText="Selecciona tus fechas…"
            className="w-full h-11 bg-gray-900/70 text-white border border-white outline-none rounded-md px-3 min-w-[200px]"
          />
        </div>

        {/* Botón CTA */}
        <div className="mt-8">
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            variant="outline"
            size="lg"
          >
            {isLoading ? 'Buscando…' : 'Explorar eventos'}
          </Button>
          <p className="text-sm text-white mt-4 font-jost  ">
            Sorpresa, sí. Estrés, nunca. Solo define tus fechas y déjate llevar.
          </p>
        </div>

        {/* Resultados y errores */}
        <div className="mt-12 text-left max-w-2xl mx-auto">
          {error && (
            <div className="bg-red-900/70 text-red-300 p-4 rounded-md inline-block mt-8">
              {error}
            </div>
          )}
          <div className="space-y-4 mt-4">
            {events.map((event) => (
              <a
                key={event.id}
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex bg-gray-800/50 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors backdrop-blur-sm"
              >
                <Img
                  src={event.image}
                  alt={event.name}
                  className="w-40 h-24 object-cover"
                  width={160} // w-40 is 160px
                  height={96} // h-24 is 96px
                />
                <div className="p-4">
                  <h3 className="font-bold">{event.name}</h3>
                  <p className="text-sm text-gray-400">
                    {event.date} – {event.venue}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventFinder;
