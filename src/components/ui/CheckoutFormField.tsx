import * as React from 'react';
import type { ReactNode } from 'react';

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
  return (
    <div className="flex flex-col gap-2">
      <label className={checkoutLabelClass} htmlFor={id}>
        {label}
      </label>
      <input
        className={cn(checkoutControlClass, className)}
        id={id}
        ref={ref}
        type={type}
        {...inputProps}
      />
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
