/**
 * Input Component
 * Comprehensive input system with validation states and accessibility
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// INPUT VARIANTS
// ============================================================================

const inputVariants = cva(
  [
    'flex w-full rounded-lg border bg-background-primary',
    'px-3 py-2 text-sm transition-colors',
    'placeholder:text-text-placeholder',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-gray-200',
          'focus-visible:ring-primary-500 focus-visible:border-primary-500',
          'hover:border-gray-300',
        ],
        error: [
          'border-red-500',
          'focus-visible:ring-red-500 focus-visible:border-red-500',
          'hover:border-red-600',
        ],
        success: [
          'border-green-500',
          'focus-visible:ring-green-500 focus-visible:border-green-500',
          'hover:border-green-600',
        ],
        warning: [
          'border-yellow-500',
          'focus-visible:ring-yellow-500 focus-visible:border-yellow-500',
          'hover:border-yellow-600',
        ],
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

// ============================================================================
// INPUT PROPS INTERFACE
// ============================================================================

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /**
   * Label for the input
   */
  label?: string;
  /**
   * Helper text below the input
   */
  helperText?: string;
  /**
   * Error message
   */
  error?: string;
  /**
   * Success message
   */
  success?: string;
  /**
   * Warning message
   */
  warning?: string;
  /**
   * Left icon
   */
  leftIcon?: React.ReactNode;
  /**
   * Right icon
   */
  rightIcon?: React.ReactNode;
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Required field indicator
   */
  required?: boolean;
  /**
   * Input container class name
   */
  containerClassName?: string;
  /**
   * Label class name
   */
  labelClassName?: string;
}

// ============================================================================
// INPUT COMPONENT
// ============================================================================

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      label,
      helperText,
      error,
      success,
      warning,
      leftIcon,
      rightIcon,
      loading,
      required,
      containerClassName,
      labelClassName,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Determine variant based on state
    const inputVariant = error
      ? 'error'
      : success
        ? 'success'
        : warning
          ? 'warning'
          : variant;

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-text-primary',
              error && 'text-error-600',
              success && 'text-success-600',
              warning && 'text-warning-600',
              labelClassName,
            )}
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ variant: inputVariant, size }),
              leftIcon && 'pl-10',
              (rightIcon || loading) && 'pr-10',
              className,
            )}
            {...props}
          />

          {/* Right Icon or Loading */}
          {(rightIcon || loading) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {loading ? (
                <svg
                  className="animate-spin h-4 w-4"
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
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>

        {/* Helper Text / Error / Success / Warning */}
        {(helperText || error || success || warning) && (
          <p
            className={cn(
              'text-xs',
              error && 'text-error-600',
              success && 'text-success-600',
              warning && 'text-warning-600',
              !error && !success && !warning && 'text-text-secondary',
            )}
          >
            {error || success || warning || helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

// ============================================================================
// TEXTAREA COMPONENT
// ============================================================================

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  warning?: string;
  required?: boolean;
  containerClassName?: string;
  labelClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      size,
      label,
      helperText,
      error,
      success,
      warning,
      required,
      containerClassName,
      labelClassName,
      id,
      ...props
    },
    ref,
  ) => {
    const textareaId =
      id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    const inputVariant = error
      ? 'error'
      : success
        ? 'success'
        : warning
          ? 'warning'
          : variant;

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'block text-sm font-medium text-text-primary',
              error && 'text-error-600',
              success && 'text-success-600',
              warning && 'text-warning-600',
              labelClassName,
            )}
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            inputVariants({ variant: inputVariant, size }),
            'min-h-[80px] resize-y',
            className,
          )}
          {...props}
        />

        {/* Helper Text / Error / Success / Warning */}
        {(helperText || error || success || warning) && (
          <p
            className={cn(
              'text-xs',
              error && 'text-error-600',
              success && 'text-success-600',
              warning && 'text-warning-600',
              !error && !success && !warning && 'text-text-secondary',
            )}
          >
            {error || success || warning || helperText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

// ============================================================================
// SELECT COMPONENT
// ============================================================================

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  warning?: string;
  required?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      variant,
      size,
      label,
      helperText,
      error,
      success,
      warning,
      required,
      containerClassName,
      labelClassName,
      options,
      placeholder,
      id,
      ...props
    },
    ref,
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    const inputVariant = error
      ? 'error'
      : success
        ? 'success'
        : warning
          ? 'warning'
          : variant;

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              'block text-sm font-medium text-text-primary',
              error && 'text-error-600',
              success && 'text-success-600',
              warning && 'text-warning-600',
              labelClassName,
            )}
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        {/* Select Container */}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              inputVariants({ variant: inputVariant, size }),
              'appearance-none pr-10 cursor-pointer',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="h-4 w-4 text-text-tertiary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Helper Text / Error / Success / Warning */}
        {(helperText || error || success || warning) && (
          <p
            className={cn(
              'text-xs',
              error && 'text-error-600',
              success && 'text-success-600',
              warning && 'text-warning-600',
              !error && !success && !warning && 'text-text-secondary',
            )}
          >
            {error || success || warning || helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';

export { inputVariants };
