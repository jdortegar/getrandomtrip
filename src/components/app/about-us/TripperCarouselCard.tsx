import Link from 'next/link';
import { cn } from '@/lib/utils';
import SafeImage from '@/components/common/SafeImage';

interface TripperCarouselCardProps {
  avatarUrl: string | null;
  bio?: string | null;
  className?: string;
  name: string;
  specialty?: string | null;
  tripperSlug: string;
}

export function TripperCarouselCard({
  avatarUrl,
  bio,
  className,
  name,
  specialty,
  tripperSlug,
}: TripperCarouselCardProps) {
  return (
    <Link
      className={cn(
        'group flex flex-col md:flex-row overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-gray-100',
        className,
      )}
      href={`/trippers/${tripperSlug}`}
    >
      {/* Photo panel */}
      <div className="relative w-full aspect-square md:w-1/2 md:shrink-0 overflow-hidden">
        <SafeImage
          alt={name}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          fill
          sizes="(max-width: 768px) 80vw, 18vw"
          src={avatarUrl}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full px-4 py-4">
          <h3 className="font-barlow-condensed text-3xl font-extrabold uppercase leading-tight text-white">
            {name}
          </h3>
          <div className="mt-1 flex items-center justify-between text-sm text-white/80">
            <span className="ml-auto">Bio +</span>
          </div>
        </div>
      </div>

      {/* Right: specialty + bio */}
      <div className="flex flex-1 flex-col justify-center gap-3 bg-gray-50 p-5">
        {specialty && (
          <p className="font-barlow text-sm font-semibold text-gray-800">{specialty}</p>
        )}
        {bio && (
          <p className="font-barlow text-sm leading-relaxed text-gray-500 line-clamp-4">{bio}</p>
        )}
      </div>
    </Link>
  );
}
