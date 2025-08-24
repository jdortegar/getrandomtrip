import BackgroundVideo from '@/components/media/BackgroundVideo';

export default function CoupleHero() {
  return (
    <header className="relative min-h-[70vh] md:min-h-[80vh] flex items-center">
      <BackgroundVideo src="/videos/couple-hero-video.mp4" />
      <div className="relative z-10 container mx-auto px-6">
        {/* contenido existente */}
      </div>
    </header>
  );
}