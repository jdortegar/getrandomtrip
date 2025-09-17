'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const travelCardVariants = cva(
  'rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg',
  {
    variants: {
      variant: {
        default: 'border-border',
        elevated: 'border-border shadow-lg hover:shadow-xl',
        luxury:
          'border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-lg hover:shadow-xl',
        adventure:
          'border-tropical-coral/20 bg-gradient-to-br from-card to-tropical-coral/5 shadow-lg hover:shadow-xl',
        coastal:
          'border-coastal-deep/20 bg-gradient-to-br from-card to-coastal-deep/5 shadow-lg hover:shadow-xl',
        mountain:
          'border-mountain-rich/20 bg-gradient-to-br from-card to-mountain-rich/5 shadow-lg hover:shadow-xl',
        urban:
          'border-urban-charcoal/20 bg-gradient-to-br from-card to-urban-charcoal/5 shadow-lg hover:shadow-xl',
        glass:
          'border-white/20 bg-white/10 backdrop-blur-sm shadow-lg hover:shadow-xl',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  },
);

export interface TravelCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof travelCardVariants> {}

const TravelCard = forwardRef<HTMLDivElement, TravelCardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(travelCardVariants({ variant, padding, className }))}
      {...props}
    />
  ),
);

TravelCard.displayName = 'TravelCard';

const TravelCardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-4', className)}
    {...props}
  />
));

TravelCardHeader.displayName = 'TravelCardHeader';

const TravelCardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className,
    )}
    {...props}
  />
));

TravelCardTitle.displayName = 'TravelCardTitle';

const TravelCardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));

TravelCardDescription.displayName = 'TravelCardDescription';

const TravelCardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-0', className)} {...props} />
));

TravelCardContent.displayName = 'TravelCardContent';

const TravelCardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4', className)}
    {...props}
  />
));

TravelCardFooter.displayName = 'TravelCardFooter';

export {
  TravelCard,
  TravelCardHeader,
  TravelCardFooter,
  TravelCardTitle,
  TravelCardDescription,
  TravelCardContent,
};
