import React from 'react';
import { cn } from '@/lib/utils';

export type ContainerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  centered?: boolean;
  horizontalPadding?: boolean;
}

const SIZE_CLASS_MAP: Record<ContainerSize, string> = {
  xs: 'max-w-xl',
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: '',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

export function Container({
  children,
  className,
  size = 'xl',
  centered = true,
  horizontalPadding = true,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        'w-full',
        SIZE_CLASS_MAP[size],
        centered && 'mx-auto',
        horizontalPadding && 'px-4 sm:px-6 lg:px-8',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Container;
