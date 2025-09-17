/**
 * Layout System
 * Comprehensive layout components following modern design patterns
 */

import React from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// CONTAINER COMPONENT
// ============================================================================

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
  padding?: boolean;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className,
  size = 'lg',
  centered = true,
  padding = true,
  ...props
}) => {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'w-full',
        sizeClasses[size],
        centered && 'mx-auto',
        padding && 'px-4 sm:px-6 lg:px-8',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// ============================================================================
// GRID COMPONENT
// ============================================================================

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  };
}

export const Grid: React.FC<GridProps> = ({
  children,
  className,
  cols = 1,
  gap = 'md',
  responsive,
  ...props
}) => {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const getColClasses = (cols: number) => {
    const colMap: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      12: 'grid-cols-12',
    };
    return colMap[cols] || 'grid-cols-1';
  };

  const responsiveClasses = responsive
    ? Object.entries(responsive)
        .map(([breakpoint, cols]) => {
          if (cols) {
            return `${breakpoint}:${getColClasses(cols)}`;
          }
          return '';
        })
        .filter(Boolean)
        .join(' ')
    : '';

  return (
    <div
      className={cn(
        'grid',
        getColClasses(cols),
        gapClasses[gap],
        responsiveClasses,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// ============================================================================
// GRID ITEM COMPONENT
// ============================================================================

export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  start?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  end?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  responsive?: {
    sm?: { span?: number; start?: number; end?: number };
    md?: { span?: number; start?: number; end?: number };
    lg?: { span?: number; start?: number; end?: number };
    xl?: { span?: number; start?: number; end?: number };
  };
}

export const GridItem: React.FC<GridItemProps> = ({
  children,
  className,
  span,
  start,
  end,
  responsive,
  ...props
}) => {
  const getSpanClasses = (span?: number) => {
    if (!span) return '';
    return `col-span-${span}`;
  };

  const getStartClasses = (start?: number) => {
    if (!start) return '';
    return `col-start-${start}`;
  };

  const getEndClasses = (end?: number) => {
    if (!end) return '';
    return `col-end-${end}`;
  };

  const responsiveClasses = responsive
    ? Object.entries(responsive)
        .map(([breakpoint, config]) => {
          if (!config) return '';
          const classes = [
            config.span ? `${breakpoint}:col-span-${config.span}` : '',
            config.start ? `${breakpoint}:col-start-${config.start}` : '',
            config.end ? `${breakpoint}:col-end-${config.end}` : '',
          ].filter(Boolean);
          return classes.join(' ');
        })
        .filter(Boolean)
        .join(' ')
    : '';

  return (
    <div
      className={cn(
        getSpanClasses(span),
        getStartClasses(start),
        getEndClasses(end),
        responsiveClasses,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// ============================================================================
// STACK COMPONENT
// ============================================================================

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  wrap?: boolean;
}

export const Stack: React.FC<StackProps> = ({
  children,
  className,
  direction = 'column',
  align = 'stretch',
  justify = 'start',
  gap = 'md',
  wrap = false,
  ...props
}) => {
  const directionClasses = {
    row: 'flex-row',
    column: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'column-reverse': 'flex-col-reverse',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  return (
    <div
      className={cn(
        'flex',
        directionClasses[direction],
        alignClasses[align],
        justifyClasses[justify],
        gapClasses[gap],
        wrap && 'flex-wrap',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// ============================================================================
// DIVIDER COMPONENT
// ============================================================================

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  thickness?: 'thin' | 'medium' | 'thick';
}

export const Divider: React.FC<DividerProps> = ({
  className,
  orientation = 'horizontal',
  variant = 'solid',
  thickness = 'thin',
  ...props
}) => {
  const orientationClasses = {
    horizontal: 'w-full border-t',
    vertical: 'h-full border-l',
  };

  const variantClasses = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  };

  const thicknessClasses = {
    thin: 'border-1',
    medium: 'border-2',
    thick: 'border-4',
  };

  return (
    <hr
      className={cn(
        'border-gray-200',
        orientationClasses[orientation],
        variantClasses[variant],
        thicknessClasses[thickness],
        className,
      )}
      {...props}
    />
  );
};

// ============================================================================
// SECTION COMPONENT
// ============================================================================

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  background?: 'default' | 'muted' | 'accent' | 'transparent';
  fullWidth?: boolean;
}

export const Section: React.FC<SectionProps> = ({
  children,
  className,
  size = 'md',
  background = 'default',
  fullWidth = false,
  ...props
}) => {
  const sizeClasses = {
    sm: 'py-8 sm:py-12',
    md: 'py-16 sm:py-20',
    lg: 'py-20 sm:py-24',
    xl: 'py-24 sm:py-32',
  };

  const backgroundClasses = {
    default: 'bg-background',
    muted: 'bg-muted',
    accent: 'bg-accent',
    transparent: 'bg-transparent',
  };

  return (
    <section
      className={cn(
        'w-full',
        sizeClasses[size],
        backgroundClasses[background],
        !fullWidth && 'container mx-auto px-4 sm:px-6 lg:px-8',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
};
