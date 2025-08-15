export default function Inspirations({ type }:{ type:string }){
  return (
    <section className="container mx-auto px-4 py-16 space-y-12">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold">Sorpresa con red</h2>
          <p className="mt-3 text-base opacity-90">Delegás la logística, te quedás con la historia. Nuestra comunidad Tripper diseña la Ruta con Alma; vos disfrutás el asombro controlado.</p>
        </div>
        <div className="theme-card rounded-2xl p-6 shadow">
          <p className="text-sm opacity-90">Se siente distinto según quién viaja. {type === 'familia' ? 'Tiempo de calidad sin pantallas.' : type === 'parejas' ? 'Detalles que reencantan.' : type === 'solo' ? 'Pausa que ordena.' : type === 'honeymoon' ? 'Complicidad que se diseña.' : 'Celebraciones sin spoiler.'}</p>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {[1,2,3].map(i => (
          <article key={i} className="rounded-2xl border border-black/5 p-6">
            <h3 className="font-semibold mb-2">Momento {i}</h3>
            <p className="text-sm opacity-80">Fotografía editorial, luz natural, perspectiva humana. Sin pose; solo verdad.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
