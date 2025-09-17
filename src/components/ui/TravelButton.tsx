'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const travelButtonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
        outline:
          'border border-primary text-primary hover:bg-primary hover:text-primary-foreground',
        ghost: 'text-primary hover:bg-primary/10',
        luxury:
          'bg-gradient-to-r from-primary to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
        adventure:
          'bg-gradient-to-r from-tropical-coral to-desert-orange text-white hover:from-tropical-coral/90 hover:to-desert-orange/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
        coastal:
          'bg-gradient-to-r from-coastal-deep to-coastal-teal text-white hover:from-coastal-deep/90 hover:to-coastal-teal/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
        mountain:
          'bg-gradient-to-r from-mountain-rich to-mountain-forest text-white hover:from-mountain-rich/90 hover:to-mountain-forest/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
        urban:
          'bg-gradient-to-r from-urban-charcoal to-urban-vibrant text-white hover:from-urban-charcoal/90 hover:to-urban-vibrant/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-12 px-8 text-lg',
        xl: 'h-14 px-10 text-xl',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface TravelButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof travelButtonVariants> {
  asChild?: boolean;
}

const TravelButton = forwardRef<HTMLButtonElement, TravelButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(travelButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

TravelButton.displayName = 'TravelButton';

export { TravelButton, travelButtonVariants };
