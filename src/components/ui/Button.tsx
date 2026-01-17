import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer uppercase text-center font-barlow text-lg font-semibold leading-[24px] tracking-[1.5px]',
  {
    variants: {
      variant: {
        default:
          'border border-white text-white bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border border-white text-white bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-white text-secondary-foreground hover:bg-secondary/80 border border-primary border-2 text-primary',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
        pill: 'bg-yellow-400 text-gray-900 hover:bg-yellow-500 rounded-full',
        white:
          'border border-white bg-white text-black hover:bg-white/90 hover:text-black',
        feature:
          'bg-yellow-400 text-gray-800 hover:bg-yellow-500 font-normal tracking-normal text-base normal-case',
      },
      size: {
        default:
          'h-auto py-[3px] px-[10px] gap-[10px] rounded-[3px] has-[>svg]:px-[10px]',
        sm: 'h-8 px-3 gap-[10px] rounded-[3px] has-[>svg]:px-2.5',
        lg: 'h-14 px-10 gap-[10px] rounded-[3px] has-[>svg]:px-4',
        icon: 'size-9 rounded-[3px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
