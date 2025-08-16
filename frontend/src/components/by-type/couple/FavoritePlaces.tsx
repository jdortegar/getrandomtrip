const PLACES = [
  { title: "Bacalar", img: "/images/placeholder/place-1.jpg" },
  { title: "San Miguel de Allende", img: "/images/placeholder/place-2.jpg" },
  { title: "Valle de Bravo", img: "/images/placeholder/place-3.jpg" },
  { title: "Purmamarca", img: "/images/placeholder/place-4.jpg" },
  { title: "Cartagena", img: "/images/placeholder/place-5.jpg" },
  { title: "Oaxaca", img: "/images/placeholder/place-6.jpg" },
];

export default function FavoritePlaces() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <header className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold">
            Nuestros lugares favoritos para escapadas en pareja
          </h2>
          <p className="mt-4 text-neutral-600">
            El viaje debe ser tan único como ustedes.
          </p>
          <a
            href="#experience-levels"
            className="inline-flex items-center rounded-full bg-black text-white px-6 py-3 text-sm font-semibold hover:bg-black/90"
          >
            Randomtrip-us
          </a>
        </header>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {PLACES.map((p) => (
            <figure
              key={p.title}
              className="relative overflow-hidden rounded-2xl aspect-[4/3] bg-neutral-100"
              style={{
                backgroundImage: `url(${p.img})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <figcaption className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-white font-semibold">
                {p.title}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}