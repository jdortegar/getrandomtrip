'use client';

import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Img from '@/components/common/Img';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
      className="relative flex min-h-screen items-center overflow-hidden px-8 py-24 text-white"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Img
          alt="Concierto"
          className="h-full w-full object-cover"
          height={1080}
          src="https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg"
          width={1920}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Elegant gradient background overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-gray-900/50 pointer-events-none" />

      {/* Subtle accent glow */}
      <div className="absolute left-1/4 top-0 z-[1] h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 z-[1] h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        {/* Decorative top border accent */}
        <div className="absolute -top-12 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/60 via-primary/30 to-transparent" />

        <div className="flex flex-col items-center justify-center gap-2">
          <h2 className="font-caveat text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-br from-white via-white to-gray-300 bg-clip-text text-transparent drop-shadow-lg leading-tight">
            Descubre tu próxima experiencia
          </h2>
          <div className="flex items-center gap-2 text-gray-300/90">
            <span className="text-sm">Powered by</span>
            <Img
              alt="Ticketmaster"
              className="mb-1 ml-2 inline-block h-12"
              height={48}
              src="/images/ticketmaster-logo.svg"
              unoptimized={true}
              width={100}
            />
          </div>
        </div>

        {/* Subtitle */}
        <p className="font-jost mx-auto mb-10 max-w-2xl text-lg text-gray-300/90 leading-relaxed mt-6">
          Conquista conciertos, festivales y eventos únicos. Boletos al
          instante, aventuras inolvidables. Solo elige tu ciudad y tus fechas.
        </p>

        {/* Search Form - Enhanced */}
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-xl border border-white/20 bg-black/40 p-6 backdrop-blur-md md:flex-row shadow-2xl">
          <Input
            className="h-12 w-full rounded-lg border border-white/30 bg-gray-900/80 px-4 text-white placeholder:text-gray-400 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ingresa una ciudad…"
            type="text"
            value={city}
          />
          <DatePicker
            className="h-12 w-full min-w-[200px] rounded-lg border border-white/30 bg-gray-900/80 px-4 text-white outline-none placeholder:text-gray-400 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            endDate={endDate}
            isClearable
            onChange={(update) => {
              setStartDate(update[0]);
              setEndDate(update[1]);
            }}
            placeholderText="Selecciona tus fechas…"
            selectsRange
            startDate={startDate}
          />
        </div>

        {/* CTA Button - Enhanced */}
        <div className="mt-8">
          <Button
            className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            disabled={isLoading}
            onClick={handleSearch}
            size="lg"
            variant="outline"
          >
            {isLoading ? 'Buscando…' : 'Explorar eventos'}
          </Button>
          <p className="font-jost mt-4 text-sm text-gray-300/90">
            Sorpresa, sí. Estrés, nunca. Solo define tus fechas y déjate llevar.
          </p>
        </div>

        {/* Results and Errors */}
        <div className="mx-auto mt-12 max-w-2xl text-left">
          {error && (
            <div className="mt-8 inline-block rounded-lg border border-red-500/30 bg-red-900/70 p-4 text-red-300 backdrop-blur-sm">
              {error}
            </div>
          )}
          <div className="mt-4 space-y-4">
            {events.map((event) => (
              <a
                className="group flex overflow-hidden rounded-xl border border-white/10 bg-gray-800/50 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-gray-800/70 hover:shadow-lg hover:shadow-primary/10"
                href={event.url}
                key={event.id}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Img
                  alt={event.name}
                  className="h-28 w-44 object-cover transition-transform duration-300 group-hover:scale-105"
                  height={112}
                  src={event.image}
                  width={176}
                />
                <div className="p-4">
                  <h3 className="font-bold text-white">{event.name}</h3>
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
