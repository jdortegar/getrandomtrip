import React, { useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';

interface GooglePlacesAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  inputClassName?: string;
  isLoaded: boolean;
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  inputClassName = '',
  isLoaded,
}) => {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      onChange(place.formatted_address || '');
    } else {
      console.log('Autocomplete is not loaded yet!');
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <label htmlFor={label.toLowerCase().replace(/\s/g, '-')} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        options={{ types: ['(cities)'] }}
      >
        <input
          type="text"
          id={label.toLowerCase().replace(/\s/g, '-')}
          placeholder={placeholder}
          required={required}
          defaultValue={value}
          className={`mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base ${inputClassName}`}
        />
      </Autocomplete>
    </div>
  );
};

export default GooglePlacesAutocomplete;
