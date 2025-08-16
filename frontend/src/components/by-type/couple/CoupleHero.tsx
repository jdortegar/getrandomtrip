"use client";

type Props = {
  image?: string; // por si querés parametrizar
};

export default function CoupleHero({ image }: Props) {
  const bg =
    image ??
    "/images/journey-types/couple-hetero.jpg"; // ruta que me pasaste en /public

  const scrollToLevels = () => {
    const el = document.getElementById("experience-levels");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      id="top"
      className="relative min-h-[70vh] md:min-h-[80vh] flex items-center"
      style={{
        backgroundImage: `url('${bg}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/35" />
      <div className="relative container mx-auto px-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow">
            Escapada para 2
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90">
            acceso denegado a terceros
          </p>

          <div className="mt-8">
            <button
              onClick={scrollToLevels}
              className="rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-white/90"
            >
              Randomtrip-us
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 text-white/90 text-xs">
          <button onClick={scrollToLevels} className="opacity-90 hover:opacity-100">
            SCROLL
            <div className="h-6 w-px bg-white/80 mx-auto mt-1" />
          </button>
        </div>
      </div>
    </section>
  );
}