'use client';
import Image, { ImageProps } from 'next/image';

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
  // Fallbacks razonables para casos donde <img> no tenía width/height
  const w = width ?? 1200;
  const h = height ?? 675;
  return (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      className={className}
      priority={priority}
      sizes={sizes}
      unoptimized={unoptimized}
      {...rest}
    />  
  );
}
