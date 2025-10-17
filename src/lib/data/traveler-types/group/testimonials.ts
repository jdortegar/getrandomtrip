import type { Testimonial } from '@/lib/data/shared/testimonial-types';

export const groupTestimonialsData = {
  title: 'Lo que dicen nuestros grupos',
  items: [
    { quote: 'Organizaron todo perfecto para nuestro grupo de 10. Cero conflictos, pura diversión.', author: 'Grupo de Amigos BA', city: 'Buenos Aires' },
    { quote: 'Cada uno pudo hacer lo suyo sin perderse lo grupal. Gran balance.', author: 'Los Viajeros', city: 'Montevideo' },
    { quote: 'Actividades para todos los gustos. Nadie se aburrió ni un segundo.', author: 'Barra del Sur', city: 'Córdoba' },
    { quote: 'La logística fue impecable. Pudimos disfrutar sin preocuparnos.', author: 'Crew Mendoza', city: 'Mendoza' },
    { quote: 'Un viaje que fortaleció nuestra amistad. Inolvidable.', author: 'Los Exploradores', city: 'Santiago' },
    { quote: 'Sorpresas perfectamente calibradas para el grupo. Muy recomendable.', author: 'Squad Lima', city: 'Lima' },
  ] as Testimonial[],
};

export const groupTestimonialsTitle = groupTestimonialsData.title;
export const groupTestimonials = groupTestimonialsData.items;
