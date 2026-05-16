"use client";

import React from "react";
import { motion } from "framer-motion";
import { slugify } from "@/lib/helpers/slugify";
import { cn } from "@/lib/utils";
import Container from "./Container";
import Img from "../common/Img";

type SectionProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  eyebrowColor?: string;
  className?: string;
  variant?: "default" | "light" | "dark";
  id?: string;
  fullWidth?: boolean;
  style?: React.CSSProperties;
  backgroundImage?: string;
  backgroundOpacity?: number;
};

const Section = ({
  backgroundImage,
  children,
  title,
  subtitle,
  eyebrow,
  eyebrowColor,
  className,
  variant = "default",
  id,
  fullWidth = false,
  style,
  backgroundOpacity = 0.5,
}: SectionProps) => {
  return (
    <section
      className={cn("relative ",
        {
          "bg-white text-gray-900": variant === "default",
          "bg-gray-50 text-gray-900": variant === "light",
          "bg-primary text-white": variant === "dark",
        })}
    >
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Img
            className="h-full w-full object-cover"
            height={1080}
            src={backgroundImage}
            width={1920}
          />
          <div className="absolute inset-0 bg-black/60" style={{ opacity: backgroundOpacity }} />
        </div>
      )}
      <div className={cn(
        "text-center relative flex flex-col items-center justify-center w-full py-24 md:py-32",
        !fullWidth && "rt-container",
        className,
      )}
        id={id}
        style={style}>
        {(eyebrow || title || subtitle) && (
          <div className={cn("mb-14 ", fullWidth && "rt-container")}>
            {eyebrow && (
              <motion.div
                className="text-base md:text-lg font-bold md:tracking-[9px] tracking-[6px] uppercase text-light-blue"
                style={eyebrowColor ? { color: eyebrowColor } : undefined}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {eyebrow}
              </motion.div>
            )}
            {title && (
              <motion.h2
                className={cn(
                  "font-barlow-condensed text-[50px] md:text-[70px] uppercase font-bold mt-4 leading-none",
                  {
                    "text-gray-900": variant === "default" || variant === "light",
                    "text-white": variant === "dark",
                  },
                )}
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.4 }}
                dangerouslySetInnerHTML={{ __html: title }}
              />
            )}
            {subtitle && (
              <motion.p
                className={cn("text-lg text-[#888] mx-auto mt-8 ", {
                  "text-gray-700": variant === "default",
                  "text-gray-900": variant === "light",
                  "text-white": variant === "dark",
                })}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        )}
        <motion.div
          className="mx-auto w-full"
          initial={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
};

export default Section;
