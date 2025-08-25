'use client';

export default function PhotoTileCard({
  title, src, onClick,
}: { title: string; src: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative group w-full h-48 md:h-56 overflow-hidden rounded-2xl text-left focus:outline-none focus:ring-2 focus:ring-neutral-900"
    >
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/35 group-hover:bg-black/45 transition-colors" />
      <div className="relative z-10 p-4">
        <h4 className="text-white font-semibold drop-shadow">{title}</h4>
      </div>
    </button>
  );
}