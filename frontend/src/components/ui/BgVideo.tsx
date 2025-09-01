'use client';

type Props = {
  webm: string;
  mp4: string;
  poster?: string;
  /** 0..1 opacidad del overlay negro (por defecto 0.22 para no “matar” el video) */
  overlay?: number;
  /** si querés un blur muy suave detrás del contenido */
  blur?: boolean;
};

export default function BgVideo({ webm, mp4, poster, overlay = 0.22, blur = false }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster={poster}
        className={`h-full w-full object-cover ${blur ? 'blur-[1px]' : ''}`}
      >
        <source src={webm} type="video/webm" />
        <source src={mp4} type="video/mp4" />
      </video>
      <div
        className="absolute inset-0"
        style={{ background: `rgb(0 0 0 / ${overlay})` }}
        aria-hidden
      />
      {/* vignette radial muuuy leve, ayuda a “leer” el centro */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(75% 55% at 50% 38%, rgb(0 0 0 / 0) 0%, rgb(0 0 0 / 0.20) 100%)',
        }}
        aria-hidden
      />
    </div>
  );
}
