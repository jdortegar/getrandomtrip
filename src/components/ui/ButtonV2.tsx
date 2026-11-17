"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Editorial button from the "Randomtrip Reveal — Tablero v2" prototype:
 * square, sentence case, regular weight, label and icon pushed apart, and a
 * 2px lift on hover (none with reduced motion). Use it on prototype-styled
 * surfaces such as the revealed trip page; `Button` stays the default
 * everywhere else.
 */
const buttonV2Variants = cva(
  [
    "inline-flex cursor-pointer items-center justify-between rounded-none border border-transparent",
    "font-barlow font-normal normal-case tracking-normal leading-[1.5] no-underline",
    "transition-[background-color,border-color,color,translate] duration-[220ms] ease-out hover:-translate-y-0.5",
    "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-feature",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        /** Deep Teal fill — the main action on a light surface. */
        primary: "bg-primary text-ground hover:bg-[#08474a]",
        /** Off White fill — on photos and teal bands; warms to Ochre on hover. */
        light: "bg-ground text-primary hover:bg-feature",
        /** Hairline teal outline — secondary or icon-only actions. */
        outline: "border-primary bg-transparent text-primary hover:bg-primary hover:text-ground",
      },
      size: {
        default: "min-h-[58px] gap-[38px] px-[25px] py-[15px] text-base [&_svg]:size-[22px]",
        sm: "min-h-11 gap-2.5 px-[18px] py-2.5 text-sm [&_svg]:size-4",
        icon: "size-11 justify-center p-0 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

interface ButtonV2Props
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonV2Variants> {
  /** Render the child element (e.g. an `<a>`) with the button's styles. */
  asChild?: boolean;
}

function ButtonV2({ asChild = false, className, size, variant, ...props }: ButtonV2Props) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonV2Variants({ size, variant }), className)}
      data-slot="button-v2"
      {...props}
      data-component="ButtonV2"
    />
  );
}

export { ButtonV2, buttonV2Variants };
