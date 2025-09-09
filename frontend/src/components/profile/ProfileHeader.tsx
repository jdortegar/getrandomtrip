"use client";
import Image from "next/image";
import { ShieldCheck, MapPin, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  name: string;
  handle: string;
  country?: string;
  avatar?: string;
  cover?: string;
  verified?: boolean;
  bio?: string;
  socials?: { ig?: string; yt?: string; web?: string };
};

export default function ProfileHeader({ name, handle, country, avatar, cover, verified, bio, socials }: Props) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900">
      {/* Cover */}
      <div className="relative h-48 w-full md:h-64">
        <Image
          src={cover ?? "/images/journey-types/friends-group.jpg"}
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/35" />
      </div>

      {/* Content */}
      <div className="relative -mt-12 flex flex-col gap-4 px-4 pb-4 md:flex-row md:items-end md:gap-6 md:px-6">
        <Image
          src={avatar ?? "https://placehold.co/160x160"}
          alt=""
          width={120}
          height={120}
          className="rounded-full border-4 border-white shadow md:rounded-full"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-white md:text-3xl">{name}</h1>
            {verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-xs font-semibold text-white">
                <ShieldCheck size={14} /> Verificado
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-white/90">
            @{handle} {country && <>· <MapPin className="inline -mt-1" size={14}/> {country}</>}
          </div>
          {bio && <p className="mt-3 max-w-2xl text-white/95">{bio}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {socials?.ig && <Link target="_blank" href={`https://instagram.com/${socials.ig}`} className="rt-btn rt-btn--ghost text-white border-white/40"><LinkIcon size={16}/> Instagram</Link>}
            {socials?.yt && <Link target="_blank" href={`https://youtube.com/${socials.yt}`} className="rt-btn rt-btn--ghost text-white border-white/40"><LinkIcon size={16}/> YouTube</Link>}
            {socials?.web && <Link target="_blank" href={`https://${socials.web}`} className="rt-btn rt-btn--ghost text-white border-white/40"><LinkIcon size={16}/> Web</Link>}
          </div>
        </div>
      </div>
    </header>
  );
}
