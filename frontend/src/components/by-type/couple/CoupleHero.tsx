"use client";

import { useCallback } from "react";

export default function CoupleHero() {
  const onClick = useCallback(() => {
    const el = document.getElementById("experience-levels");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <section
      className="relative h-[100svh] w-full overflow-hidden"
      style={{ backgroundImage: "url('/images/journey-types/couple-hetero.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/35" />
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center gap-6 px-4">
        <h1 className="font-display max-w-3xl text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tightish text-white">
          Escapada para 2
        </h1>
        <p className="text-white/90 text-lg md:text-xl">acceso denegado a terceros</p>

        <button
          onClick={onClick}
          className="w-fit rounded-full bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 active:scale-[0.99] transition cursor-pointer"
        >
          Randomtrip-us
        </button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute inset-x-0 bottom-10 flex justify-center">
        <button
          onClick={onClick}
          className="text-white/90 text-xs tracking-widest animate-bounce"
        >
          SCROLL
          <div className="h-6 w-px bg-white/80 mx-auto mt-1" />
        </button>
      </div>
    </section>
  );
}