import * as React from 'react';
import type { ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/lib/utils';

const checkoutControlClass =
  'bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-lg';

const checkoutLabelClass =
  'block font-normal text-gray-600 text-xl';

export interface CheckoutFormFieldProps
  extends Omit<React.ComponentProps<'input'>, 'id'> {
  id: string;
  label: ReactNode;
}

export const CheckoutFormField = React.forwardRef<
  HTMLInputElement,
  CheckoutFormFieldProps
>(function CheckoutFormField(
  { className, id, label, type, ...inputProps },
  ref,
) {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const isPasswordField = type === 'password';
  const resolvedType = isPasswordField
    ? isPasswordVisible
      ? 'text'
      : 'password'
    : type;

  return (
    <div className="flex flex-col gap-2">
      <label className={checkoutLabelClass} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          className={cn(
            checkoutControlClass,
            isPasswordField && 'pr-12',
            className,
          )}
          id={id}
          ref={ref}
          type={resolvedType}
          {...inputProps}
        />
        {isPasswordField ? (
          <button
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            type="button"
          >
            {isPasswordVisible ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
});

CheckoutFormField.displayName = 'CheckoutFormField';

export interface CheckoutFormSelectFieldProps
  extends Omit<React.ComponentProps<'select'>, 'id'> {
  children: ReactNode;
  id: string;
  label: ReactNode;
}

export const CheckoutFormSelectField = React.forwardRef<
  HTMLSelectElement,
  CheckoutFormSelectFieldProps
>(function CheckoutFormSelectField(
  { children, className, id, label, ...selectProps },
  ref,
) {
  return (
    <div className="flex flex-col gap-2">
      <label className={checkoutLabelClass} htmlFor={id}>
        {label}
      </label>
      <select
        className={cn(checkoutControlClass, className)}
        id={id}
        ref={ref}
        {...selectProps}
      >
        {children}
      </select>
    </div>
  );
});

CheckoutFormSelectField.displayName = 'CheckoutFormSelectField';
