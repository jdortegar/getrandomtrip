"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { trackButtonClick } from "@/lib/helpers/tracking/gtm";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "cursor-pointer flex items-center justify-center outline-none shrink-0 text-center transition-all",
    "font-barlow font-semibold leading-[24px] tracking-[1.5px] uppercase",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-2 border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:border-primary/90",
        destructive:
          "border-2 border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-700 focus-visible:ring-red-600/20",
        outline:
          "relative isolate overflow-hidden border-2 border-white text-white bg-background shadow-xs hover:border-primary hover:text-white before:absolute before:inset-0 before:-z-10 before:origin-left before:scale-x-0 before:bg-primary before:transition-transform before:duration-300 before:ease-out hover:before:scale-x-100 dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-white text-secondary-foreground hover:bg-secondary/80  border-primary border-2 text-primary",
        tertiary: "border-2 border-xsed bg-xsed text-white hover:bg-xsed/90",
        ghost:
          "border-2 border-transparent hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "border-2 border-transparent text-primary underline-offset-4 hover:underline",
        pill: "border-2 border-feature bg-feature text-ink hover:bg-feature hover:border-feature rounded-full",
        white:
          "border-2 border-white bg-white hover:bg-white/90 hover:text-ink",
        feature: "border-2 border-feature bg-feature text-gray-800 hover:bg-feature/90 hover:border-feature/90",
      },
      size: {
        default:
          "min-h-9 px-6 gap-[10px] rounded-sm text-sm has-[>svg]:px-[10px]",
        sm: "min-h-11 px-6 gap-[10px] rounded-sm text-sm has-[>svg]:px-2.5",
        md: "min-h-11 px-6 gap-[10px] rounded-sm text-base has-[>svg]:px-4",
        lg: "min-h-14 px-10 gap-[10px] rounded-sm text-base md:text-lg has-[>svg]:px-4",
        icon: "size-9 rounded-md text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** When set, sends a GTM click_button event with this label on click */
  trackClick?: string;
}

function Button({
  asChild = false,
  className,
  size = "sm",
  trackClick,
  variant = "default",
  onClick,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (trackClick) {
      trackButtonClick(trackClick);
    }
    onClick?.(e);
  };

  return (
    <Comp
      className={cn(buttonVariants({ className, size, variant }))}
      data-slot="button"
      onClick={handleClick}
      {...props}
    />
  );
}

export { Button, buttonVariants };
