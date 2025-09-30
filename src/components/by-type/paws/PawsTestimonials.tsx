export default function PawsTestimonials() {
  const testimonials = [
    {
      quote:
        '¡Increíble experiencia! Mi perro y yo disfrutamos cada momento. La logística fue perfecta y los alojamientos superaron nuestras expectativas.',
      author: 'Ana & Max (Golden Retriever)',
    },
    {
      quote:
        'Siempre fue un desafío encontrar lugares donde mi gato fuera bienvenido. PAWS© lo hizo posible. Un viaje sin estrés y con mimos para mi felino.',
      author: 'Carlos & Luna (Siamesa)',
    },
    {
      quote:
        'Nunca pensé que viajar con mi hurón sería tan fácil. Gracias a PAWS©, tuvimos unas vacaciones inolvidables. ¡Totalmente recomendado!',
      author: 'Sofía & Rocky (Hurón)',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-800 mb-12">
          Lo que dicen nuestros viajeros con huellas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-lg flex flex-col justify-between h-full"
            >
              <p className="italic text-gray-700 mb-6 text-lg leading-relaxed">
                “{testimonial.quote}”
              </p>
              <p className="font-semibold text-gray-900 text-base mt-auto">
                — {testimonial.author}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
