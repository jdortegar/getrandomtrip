/* eslint-disable @next/next/no-img-element */
'use client';

import Image, { ImageProps } from 'next/image';
import { useMemo, useState } from 'react';

type Props = {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
} & Omit<ImageProps, 'src' | 'alt' | 'width' | 'height' | 'fill'>;

const ALLOWED_HOSTS = new Set([
  'images.unsplash.com',
  'source.unsplash.com',
  'images.pexels.com',
  'upload.wikimedia.org',
  'i.pravatar.cc',
  'picsum.photos',
  'cdn.pixabay.com',
  'randomuser.me',
  'res.cloudinary.com',
  'avatars.githubusercontent.com',
]);

function getHost(u?: string | null) {
  if (!u) return null;
  try { return new URL(u).hostname; } catch { return null; }
}
function isSvgPath(u?: string | null) {
  return !!u && /\.svg(\?.*)?$/i.test(u);
}
function normalizeUnsplash(u: string) {
  try {
    const url = new URL(u, 'http://dummy'); // base por si es relativa
    if (url.hostname === 'images.unsplash.com') {
      // si no tiene query, agregamos defaults para que el proxy de Next no falle
      if (!url.search || url.search === '') {
        return `${u}?auto=format&fit=crop&w=1600&q=80`;
      }
    }
  } catch {}
  return u;
}

export default function SafeImage({
  src,
  alt,
  fallbackSrc = '/images/fallbacks/tripper-avatar.svg',
  fill,
  width,
  height,
  className,
  sizes,
  priority,
  ...rest
}: Props) {
  const initialRaw = src || fallbackSrc;
  const initial =
    initialRaw && initialRaw.startsWith('http')
      ? normalizeUnsplash(initialRaw)
      : initialRaw;

  const [current, setCurrent] = useState(initial);

  const host = useMemo(() => getHost(current), [current]);
  const isRemote = /^https?:\/\//i.test(current);
  const looksLikeSvg = isSvgPath(current) || isSvgPath(fallbackSrc);

  const canUseNextImage =
    !looksLikeSvg &&
    (!isRemote || (host && ALLOWED_HOSTS.has(host)));

  const handleError = () => {
    if (current !== fallbackSrc) setCurrent(fallbackSrc);
  };

  if (canUseNextImage) {
    return fill ? (
      <Image
        src={current!}
        alt={alt}
        fill
        className={className}
        onError={handleError}
        sizes={sizes}
        priority={priority}
        {...rest}
      />
    ) : (
      <Image
        src={current!}
        alt={alt}
        width={width ?? 800}
        height={height ?? 600}
        className={className}
        onError={handleError}
        sizes={sizes}
        priority={priority}
        {...rest}
      />
    );
  }

  return (
    <img
      src={current!}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={handleError}
      loading="lazy"
      decoding="async"
      style={fill ? { width: '100%', height: '100%', objectFit: 'cover' } : undefined}
    />
  );
}
