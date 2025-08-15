import React from 'react';

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  inputClassName?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange, required = false, inputClassName = '' }) => {
  return (
    <div>
      <label htmlFor={label.toLowerCase().replace(/\s/g, '-')} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="date"
        id={label.toLowerCase().replace(/\s/g, '-')}
        value={value}
        onChange={onChange}
        required={required}
        className={`mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base ${inputClassName}`}
      />
    </div>
  );
};

export default DatePicker;