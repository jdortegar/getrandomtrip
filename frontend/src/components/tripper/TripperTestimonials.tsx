'use client';

export default function TripperTestimonials({ testimonials = [] as {author:string; quote:string}[] }) {
  if (!testimonials.length) return null;
  return (
    <section className="py-16 bg-gray-800 text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'Playfair Display, serif' }}>Opiniones</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-xl border border-gray-700 p-6 bg-gray-900 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition">
              <p className="italic text-gray-300">“{t.quote}”</p>
              <p className="mt-4 text-sm text-gray-400">— {t.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}