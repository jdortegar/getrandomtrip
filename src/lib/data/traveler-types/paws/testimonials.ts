import type { Testimonial } from '@/lib/data/shared/testimonial-types';

export const pawsTestimonialsData = {
  title: 'Lo que dicen nuestros viajeros con mascotas',
  items: [
    { quote: 'Mi perro disfrutó tanto como yo. Lugares increíbles y pet-friendly.', author: 'Lucía & Max', city: 'Buenos Aires' },
    { quote: 'Todo estaba pensado para viajar con mascota. Sin complicaciones.', author: 'Pedro & Luna', city: 'Montevideo' },
    { quote: 'Encontramos playas, parques y restaurantes perfectos para ir con Toby.', author: 'Ana & Toby', city: 'Santiago' },
    { quote: 'Mi gato viajó cómodo y seguro. Gran experiencia para ambos.', author: 'María & Michi', city: 'Lima' },
    { quote: 'Actividades y alojamientos ideales para viajar con nuestro peludo.', author: 'Juan & Rocky', city: 'Córdoba' },
    { quote: 'Un viaje que disfrutamos toda la familia, incluida nuestra mascota.', author: 'Familia López & Coco', city: 'Mendoza' },
  ] as Testimonial[],
};

export const pawsTestimonialsTitle = pawsTestimonialsData.title;
export const pawsTestimonials = pawsTestimonialsData.items;
