export const HERO_VIDEOS = {
  homepage: "/videos/hero-video.mp4",

  couple: "/videos/couple-hero-video.mp4",
  couples: "/videos/couple-hero-video.mp4",

  solo: "/videos/solo-hero-video.mp4",

  family: "/videos/family-hero-video.mp4",
  families: "/videos/family-hero-video.mp4",

  group: "/videos/group-hero-video.mp4",
  groups: "/videos/group-hero-video.mp4",

  honeymoon: "/videos/honeymoon-video.mp4",
  paws: "/videos/paws-hero-video.mp4",
} as const;

export type HeroKey = keyof typeof HERO_VIDEOS;

export function getHeroVideo(key: string) {
  const k = key.toLowerCase() as HeroKey;
  return HERO_VIDEOS[k] ?? HERO_VIDEOS.homepage;
}
