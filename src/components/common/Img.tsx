'use client';
import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

const PLACEHOLDER = '/images/placeholder/placeholder.jpg';

type ImgProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'width' | 'height'> & {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: ImageProps['sizes'];
  unoptimized?: boolean;
};

export default function Img({
  src,
  alt = '',
  width,
  height,
  className,
  priority,
  sizes = '100vw',
  unoptimized,
  ...rest
}: ImgProps) {
  const [current, setCurrent] = useState(src);
  const w = width ?? 1200;
  const h = height ?? 675;
  return (
    <Image
      src={current}
      alt={alt}
      width={w}
      height={h}
      className={className}
      priority={priority}
      sizes={sizes}
      unoptimized={unoptimized}
      onError={() => { if (current !== PLACEHOLDER) setCurrent(PLACEHOLDER); }}
      {...rest}
    />
  );
}
