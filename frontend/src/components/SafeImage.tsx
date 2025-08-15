'use client';
import Image from 'next/image';
import { useState } from 'react';

function SafeImage({ src, fallbackSrc, alt, width = 1600, height = 1067, className = '' }: {
  src: string; fallbackSrc: string; alt: string; width?: number; height?: number; className?: string;
}) {
  const [imgSrc, setImgSrc] = useState(src);

  return <Image src={imgSrc} alt={alt} width={width} height={height} onError={() => setImgSrc(fallbackSrc)} className={className} />;
}

export default SafeImage;
