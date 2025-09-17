/**
 * Button Component
 * Following atomic design principles and accessibility best practices
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// BUTTON VARIANTS (CVA - Class Variance Authority)
// ============================================================================

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'relative overflow-hidden',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-500 text-white',
          'hover:bg-primary-600 active:bg-primary-700',
          'focus-visible:ring-primary-500',
          'shadow-sm hover:shadow-md',
        ],
        secondary: [
          'bg-gray-100 text-gray-900',
          'hover:bg-gray-200 active:bg-gray-300',
          'focus-visible:ring-gray-500',
          'border border-gray-200',
        ],
        outline: [
          'bg-transparent text-primary-600',
          'hover:bg-primary-50 active:bg-primary-100',
          'focus-visible:ring-primary-500',
          'border border-primary-200 hover:border-primary-300',
        ],
        ghost: [
          'bg-transparent text-gray-700',
          'hover:bg-gray-100 active:bg-gray-200',
          'focus-visible:ring-gray-500',
        ],
        destructive: [
          'bg-error-500 text-white',
          'hover:bg-error-600 active:bg-error-700',
          'focus-visible:ring-error-500',
          'shadow-sm hover:shadow-md',
        ],
        success: [
          'bg-success-500 text-white',
          'hover:bg-success-600 active:bg-success-700',
          'focus-visible:ring-success-500',
          'shadow-sm hover:shadow-md',
        ],
        warning: [
          'bg-warning-500 text-white',
          'hover:bg-warning-600 active:bg-warning-700',
          'focus-visible:ring-warning-500',
          'shadow-sm hover:shadow-md',
        ],
        link: [
          'bg-transparent text-primary-600 underline-offset-4',
          'hover:underline focus-visible:ring-primary-500',
          'p-0 h-auto',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-12 px-6 text-base rounded-lg',
        xl: 'h-14 px-8 text-lg rounded-xl',
        icon: 'h-10 w-10 rounded-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
      loading: {
        true: 'cursor-wait',
        false: 'cursor-pointer',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      loading: false,
    },
  },
);

// ============================================================================
// BUTTON PROPS INTERFACE
// ============================================================================

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Button content
   */
  children: React.ReactNode;
  /**
   * Loading state - shows spinner and disables button
   */
  loading?: boolean;
  /**
   * Icon to display before the text
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to display after the text
   */
  rightIcon?: React.ReactNode;
  /**
   * Loading spinner component
   */
  loadingSpinner?: React.ReactNode;
  /**
   * Custom class name
   */
  className?: string;
  /**
   * Button type
   */
  type?: 'button' | 'submit' | 'reset';
  /**
   * Accessibility label
   */
  'aria-label'?: string;
}

// ============================================================================
// LOADING SPINNER COMPONENT
// ============================================================================

const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('animate-spin h-4 w-4', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      leftIcon,
      rightIcon,
      loadingSpinner,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          buttonVariants({
            variant,
            size,
            fullWidth,
            loading,
            className,
          }),
        )}
        {...props}
      >
        {/* Loading Spinner */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            {loadingSpinner || <LoadingSpinner />}
          </span>
        )}

        {/* Button Content */}
        <span className={cn('flex items-center gap-2', loading && 'opacity-0')}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </span>
      </button>
    );
  },
);

Button.displayName = 'Button';

// ============================================================================
// BUTTON GROUP COMPONENT
// ============================================================================

export interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  spacing = 'sm',
  className,
}) => {
  const spacingClasses = {
    none: 'gap-0',
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-4',
  };

  const orientationClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col',
  };

  return (
    <div
      className={cn(
        'flex',
        orientationClasses[orientation],
        spacingClasses[spacing],
        className,
      )}
      role="group"
    >
      {children}
    </div>
  );
};

// ============================================================================
// EXPORT VARIANTS FOR EXTERNAL USE
// ============================================================================

export { buttonVariants };
export type { VariantProps };
