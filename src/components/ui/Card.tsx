/**
 * Card Component
 * Shadcn/UI based card component with variants and accessibility
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// CARD VARIANTS
// ============================================================================

const cardVariants = cva(
  [
    'rounded-lg border bg-card text-card-foreground shadow-sm',
    'transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        default: 'border-gray-200',
        elevated: 'border-gray-200 shadow-md hover:shadow-lg',
        outlined: 'border-2 border-gray-200 bg-transparent',
        filled: 'border-transparent bg-muted',
        ghost: 'border-transparent bg-transparent shadow-none',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      interactive: false,
    },
  },
);

// ============================================================================
// CARD COMPONENT
// ============================================================================

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, interactive, className }),
        )}
        {...props}
      />
    );
  },
);

Card.displayName = 'Card';

// ============================================================================
// CARD HEADER
// ============================================================================

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  ),
);

CardHeader.displayName = 'CardHeader';

// ============================================================================
// CARD TITLE
// ============================================================================

export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  asChild?: boolean;
}

export const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  ),
);

CardTitle.displayName = 'CardTitle';

// ============================================================================
// CARD DESCRIPTION
// ============================================================================

export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  asChild?: boolean;
}

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

// ============================================================================
// CARD CONTENT
// ============================================================================

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
);

CardContent.displayName = 'CardContent';

// ============================================================================
// CARD FOOTER
// ============================================================================

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  ),
);

CardFooter.displayName = 'CardFooter';

// ============================================================================
// EXPORT VARIANTS
// ============================================================================

export { cardVariants };
