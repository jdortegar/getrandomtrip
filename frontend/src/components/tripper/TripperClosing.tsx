export default function TripperClosing() {
  const benefits = [
    { t: 'Sin estrés', d: 'Curaduría y logística resueltas.' },
    { t: 'Todo resuelto', d: 'Vuelos, stays y ritmo de viaje.' },
    { t: 'Sorpresa bien diseñada', d: 'Momentos memorables, sin improvisación.' },
  ];
  return (
    <section className="py-16 bg-white text-black border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10" style={{ fontFamily: 'Playfair Display, serif' }}>
          ¿Por qué Randomtrip?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map(b => (
            <div key={b.t} className="text-center">
              <h3 className="text-xl font-semibold mb-2">{b.t}</h3>
              <p className="text-neutral-600">{b.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}