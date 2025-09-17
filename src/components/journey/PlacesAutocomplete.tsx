'use client';
import { useStore } from '@/store/store';
import { Input } from '@/components/ui/Input';
import { useState, useEffect, useRef, useCallback } from 'react';

interface Country {
  name: string;
  code: string;
}

interface City {
  name: string;
  country: string;
  code?: string;
}

export function CountryInput() {
  const { logistics, setPartial } = useStore();
  const [value, setValue] = useState(logistics.country?.name ?? '');
  const [suggestions, setSuggestions] = useState<Country[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch countries from REST Countries API
  const fetchCountries = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(query)}`,
      );
      if (response.ok) {
        const data = await response.json();
        const countries = data
          .slice(0, 10) // Limit to 10 results
          .map((country: any) => ({
            name: country.name.common,
            code: country.cca2,
          }))
          .filter((country: Country) =>
            country.name.toLowerCase().includes(query.toLowerCase()),
          );
        setSuggestions(countries);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCountries(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setShowSuggestions(true);

    setPartial({
      logistics: {
        ...logistics,
        country: { name: newValue, code: undefined },
      },
    });
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (country: Country) => {
    setValue(country.name);
    setShowSuggestions(false);
    setSuggestions([]);

    setPartial({
      logistics: {
        ...logistics,
        country: { name: country.name, code: country.code },
      },
    });
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        placeholder="País de salida"
        aria-label="País de salida"
        autoComplete="off"
      />

      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {loading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Buscando...</div>
          ) : (
            suggestions.map((country, index) => (
              <button
                key={`${country.code}-${index}`}
                type="button"
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                onClick={() => handleSuggestionSelect(country)}
              >
                {country.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function CityInput() {
  const { logistics, setPartial } = useStore();
  const [value, setValue] = useState(logistics.city?.name ?? '');
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get selected country code for filtering cities
  const selectedCountryCode = logistics.country?.code;

  // Fetch cities using a free API or fallback to local data
  const fetchCities = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      // If no country is selected, show a message
      if (!selectedCountryCode) {
        setSuggestions([{ name: 'Selecciona un país primero', country: '' }]);
        return;
      }

      setLoading(true);
      try {
        // Try using a free cities API (no API key required)
        const response = await fetch(
          `https://api.teleport.org/api/cities/?search=${encodeURIComponent(query)}&limit=20`,
        );

        if (response.ok) {
          const data = await response.json();
          if (data._embedded && data._embedded['city:search-results']) {
            const cities = data._embedded['city:search-results']
              .map((result: any) => ({
                name: result.matching_full_name,
                country: result.matching_full_name.split(', ').pop() || '',
                countryCode: result.matching_full_name.split(', ').pop() || '',
              }))
              .filter((city: any) => {
                // Filter by selected country if available
                if (selectedCountryCode) {
                  return (
                    city.countryCode === selectedCountryCode ||
                    city.country
                      .toLowerCase()
                      .includes(logistics.country?.name?.toLowerCase() || '')
                  );
                }
                return true;
              })
              .slice(0, 10);

            setSuggestions(cities);
          } else {
            // Fallback to local cities list filtered by country
            const fallbackCities = getFallbackCities(
              query,
              selectedCountryCode,
            );
            setSuggestions(fallbackCities);
          }
        } else {
          // Fallback to a simple cities list if API fails
          const fallbackCities = getFallbackCities(query, selectedCountryCode);
          setSuggestions(fallbackCities);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        // Fallback to a simple cities list
        const fallbackCities = getFallbackCities(query, selectedCountryCode);
        setSuggestions(fallbackCities);
      } finally {
        setLoading(false);
      }
    },
    [selectedCountryCode, logistics.country?.name],
  );

  // Fallback cities list for when API is not available
  const getFallbackCities = (query: string, countryCode?: string): City[] => {
    const cities = [
      { name: 'Buenos Aires', country: 'Argentina', code: 'AR' },
      { name: 'Córdoba', country: 'Argentina', code: 'AR' },
      { name: 'Rosario', country: 'Argentina', code: 'AR' },
      { name: 'Mendoza', country: 'Argentina', code: 'AR' },
      { name: 'Ciudad de México', country: 'México', code: 'MX' },
      { name: 'Guadalajara', country: 'México', code: 'MX' },
      { name: 'Monterrey', country: 'México', code: 'MX' },
      { name: 'Puebla', country: 'México', code: 'MX' },
      { name: 'Cancún', country: 'México', code: 'MX' },
      { name: 'Madrid', country: 'España', code: 'ES' },
      { name: 'Barcelona', country: 'España', code: 'ES' },
      { name: 'Valencia', country: 'España', code: 'ES' },
      { name: 'Sevilla', country: 'España', code: 'ES' },
      { name: 'Bogotá', country: 'Colombia', code: 'CO' },
      { name: 'Medellín', country: 'Colombia', code: 'CO' },
      { name: 'Cali', country: 'Colombia', code: 'CO' },
      { name: 'Cartagena', country: 'Colombia', code: 'CO' },
      { name: 'Santiago', country: 'Chile', code: 'CL' },
      { name: 'Valparaíso', country: 'Chile', code: 'CL' },
      { name: 'Concepción', country: 'Chile', code: 'CL' },
      { name: 'Lima', country: 'Perú', code: 'PE' },
      { name: 'Arequipa', country: 'Perú', code: 'PE' },
      { name: 'Cusco', country: 'Perú', code: 'PE' },
      { name: 'São Paulo', country: 'Brasil', code: 'BR' },
      { name: 'Río de Janeiro', country: 'Brasil', code: 'BR' },
      { name: 'Brasilia', country: 'Brasil', code: 'BR' },
      { name: 'Salvador', country: 'Brasil', code: 'BR' },
      { name: 'Nueva York', country: 'Estados Unidos', code: 'US' },
      { name: 'Los Ángeles', country: 'Estados Unidos', code: 'US' },
      { name: 'Chicago', country: 'Estados Unidos', code: 'US' },
      { name: 'Miami', country: 'Estados Unidos', code: 'US' },
      { name: 'París', country: 'Francia', code: 'FR' },
      { name: 'Marsella', country: 'Francia', code: 'FR' },
      { name: 'Lyon', country: 'Francia', code: 'FR' },
      { name: 'Roma', country: 'Italia', code: 'IT' },
      { name: 'Milán', country: 'Italia', code: 'IT' },
      { name: 'Nápoles', country: 'Italia', code: 'IT' },
      { name: 'Berlín', country: 'Alemania', code: 'DE' },
      { name: 'Hamburgo', country: 'Alemania', code: 'DE' },
      { name: 'Múnich', country: 'Alemania', code: 'DE' },
      { name: 'Londres', country: 'Reino Unido', code: 'GB' },
      { name: 'Birmingham', country: 'Reino Unido', code: 'GB' },
      { name: 'Manchester', country: 'Reino Unido', code: 'GB' },
      { name: 'Tokio', country: 'Japón', code: 'JP' },
      { name: 'Osaka', country: 'Japón', code: 'JP' },
      { name: 'Sídney', country: 'Australia', code: 'AU' },
      { name: 'Melbourne', country: 'Australia', code: 'AU' },
    ];

    let filteredCities = cities;

    // Filter by country if country code is provided
    if (countryCode) {
      filteredCities = cities.filter((city) => city.code === countryCode);
    }

    // Filter by query
    filteredCities = filteredCities.filter((city) =>
      city.name.toLowerCase().includes(query.toLowerCase()),
    );

    return filteredCities.slice(0, 10);
  };

  // Clear city when country changes
  useEffect(() => {
    if (selectedCountryCode && logistics.city?.name) {
      // Check if current city belongs to selected country
      const currentCityCountry = logistics.city.name.split(', ').pop() || '';
      if (
        !currentCityCountry
          .toLowerCase()
          .includes(logistics.country?.name?.toLowerCase() || '')
      ) {
        setValue('');
        setPartial({
          logistics: {
            ...logistics,
            city: { name: '', placeId: undefined },
          },
        });
      }
    }
  }, [
    selectedCountryCode,
    logistics.country?.name,
    logistics.city?.name,
    logistics,
    setPartial,
  ]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCities(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, selectedCountryCode, fetchCities]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setShowSuggestions(true);

    setPartial({
      logistics: {
        ...logistics,
        city: { name: newValue, placeId: undefined },
      },
    });
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (city: City) => {
    // Don't allow selection if it's the "select country first" message
    if (city.name === 'Selecciona un país primero') {
      return;
    }

    setValue(city.name);
    setShowSuggestions(false);
    setSuggestions([]);

    setPartial({
      logistics: {
        ...logistics,
        city: { name: city.name, placeId: undefined },
      },
    });
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        placeholder={
          selectedCountryCode
            ? 'Ciudad de salida'
            : 'Selecciona un país primero'
        }
        aria-label="Ciudad de salida"
        autoComplete="off"
      />

      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {loading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Buscando...</div>
          ) : (
            suggestions.map((city, index) => (
              <button
                key={`${city.name}-${index}`}
                type="button"
                className={`w-full px-4 py-2 text-left text-sm focus:outline-none ${
                  city.name === 'Selecciona un país primero'
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-100 focus:bg-gray-100'
                }`}
                onClick={() => handleSuggestionSelect(city)}
                disabled={city.name === 'Selecciona un país primero'}
              >
                <div className="font-medium">{city.name}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
