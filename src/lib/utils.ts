/**
 * Class Name Utility
 * Enhanced version of clsx with Tailwind-specific optimizations
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and merges Tailwind classes with tailwind-merge
 * This ensures that conflicting Tailwind classes are properly resolved
 * 
 * @param inputs - Class values to combine
 * @returns Merged class string
 * 
 * @example
 * cn('px-2 py-1', 'px-4') // Returns 'py-1 px-4' (px-2 is overridden by px-4)
 * cn('bg-red-500', { 'text-white': true }) // Returns 'bg-red-500 text-white'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Conditional class name utility
 * Similar to cn but with a more explicit conditional API
 * 
 * @param condition - Boolean condition
 * @param trueClass - Class to apply when condition is true
 * @param falseClass - Class to apply when condition is false
 * @returns Class string based on condition
 * 
 * @example
 * conditional(true, 'text-green-500', 'text-red-500') // Returns 'text-green-500'
 */
export function conditional(
  condition: boolean,
  trueClass: string,
  falseClass: string = ''
): string {
  return condition ? trueClass : falseClass;
}

/**
 * Variant-based class name utility
 * Creates a function that applies classes based on variants
 * 
 * @param variants - Object mapping variant values to class strings
 * @returns Function that returns classes based on current variant
 * 
 * @example
 * const buttonClasses = variant({
 *   size: {
 *     sm: 'px-2 py-1 text-sm',
 *     md: 'px-4 py-2 text-base',
 *     lg: 'px-6 py-3 text-lg'
 *   },
 *   variant: {
 *     primary: 'bg-blue-500 text-white',
 *     secondary: 'bg-gray-500 text-white'
 *   }
 * });
 * 
 * buttonClasses({ size: 'md', variant: 'primary' }) // Returns combined classes
 */
export function variant<T extends Record<string, Record<string, string>>>(
  variants: T
) {
  return (props: { [K in keyof T]?: keyof T[K] }) => {
    const classes: string[] = [];
    
    Object.entries(variants).forEach(([key, variantMap]) => {
      const value = props[key as keyof typeof props];
      if (value && variantMap[value as string]) {
        classes.push(variantMap[value as string]);
      }
    });
    
    return cn(...classes);
  };
}

/**
 * Responsive class utility
 * Applies classes based on breakpoint
 * 
 * @param classes - Object mapping breakpoints to class strings
 * @returns Responsive class string
 * 
 * @example
 * responsive({
 *   base: 'text-sm',
 *   md: 'text-base',
 *   lg: 'text-lg'
 * }) // Returns 'text-sm md:text-base lg:text-lg'
 */
export function responsive(classes: {
  base?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
}): string {
  const breakpoints = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
  const result: string[] = [];
  
  breakpoints.forEach((breakpoint) => {
    const classString = classes[breakpoint];
    if (classString) {
      if (breakpoint === 'base') {
        result.push(classString);
      } else {
        result.push(`${breakpoint}:${classString}`);
      }
    }
  });
  
  return cn(...result);
}

/**
 * State-based class utility
 * Applies classes based on component state
 * 
 * @param state - Current state object
 * @param stateClasses - Object mapping state keys to class strings
 * @returns Class string based on current state
 * 
 * @example
 * stateClasses(
 *   { loading: true, disabled: false, error: false },
 *   {
 *     loading: 'opacity-50 cursor-wait',
 *     disabled: 'opacity-50 cursor-not-allowed',
 *     error: 'border-red-500'
 *   }
 * ) // Returns 'opacity-50 cursor-wait'
 */
export function stateClasses<T extends Record<string, boolean>>(
  state: T,
  stateClasses: { [K in keyof T]?: string }
): string {
  const classes: string[] = [];
  
  Object.entries(state).forEach(([key, value]) => {
    if (value && stateClasses[key as keyof typeof stateClasses]) {
      classes.push(stateClasses[key as keyof typeof stateClasses]!);
    }
  });
  
  return cn(...classes);
}
