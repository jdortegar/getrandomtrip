import type { Testimonial } from '@/lib/data/shared/testimonial-types';

export const soloTestimonialsData = {
  title: 'Lo que dicen nuestros viajeros solitarios',
  items: [
    { quote: 'Mi primer viaje solo y me sentí acompañado por una organización impecable. Volví distinto.', author: 'Martín S.', city: 'Buenos Aires' },
    { quote: 'La sorpresa fue un regalo. Me encontré con lugares y personas que no esperaba.', author: 'Camila R.', city: 'Montevideo' },
    { quote: 'Itinerario flexible y seguro. Pude moverme a mi ritmo sin perderme lo esencial.', author: 'Diego P.', city: 'Santiago' },
    { quote: 'Me animé a probar cosas nuevas. Gran equilibrio entre actividad y calma.', author: 'Luisa G.', city: 'Córdoba' },
    { quote: 'La curaduría me hizo sentir protagonista del viaje, no espectador.', author: 'Tomás L.', city: 'Mendoza' },
    { quote: 'Descubrí que viajar solo no significa sentirse solo. Gran experiencia.', author: 'Paula F.', city: 'Lima' },
  ] as Testimonial[],
};

export const soloTestimonialsTitle = soloTestimonialsData.title;
export const soloTestimonials = soloTestimonialsData.items;
