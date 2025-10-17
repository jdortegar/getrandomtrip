import { AMERICAN_COUNTRIES } from '@/lib/data/shared/countries';

// Country neighboring relationships (simplified for American countries)
const NEIGHBORING_COUNTRIES: Record<string, string[]> = {
  // North America
  US: ['CA', 'MX'],
  CA: ['US'],
  MX: ['US', 'GT', 'BZ'],

  // Central America
  GT: ['MX', 'BZ', 'SV', 'HN'],
  BZ: ['MX', 'GT'],
  SV: ['GT', 'HN'],
  HN: ['GT', 'SV', 'NI'],
  NI: ['HN', 'CR'],
  CR: ['NI', 'PA'],
  PA: ['CR', 'CO'],

  // South America
  CO: ['PA', 'VE', 'BR', 'PE', 'EC'],
  VE: ['CO', 'BR', 'GY'],
  GY: ['VE', 'SR', 'BR'],
  SR: ['GY', 'GF', 'BR'],
  GF: ['SR', 'BR'],
  BR: ['CO', 'VE', 'GY', 'SR', 'GF', 'UY', 'AR', 'PY', 'BO', 'PE'],
  EC: ['CO', 'PE'],
  PE: ['EC', 'CO', 'BR', 'BO', 'CL'],
  BO: ['PE', 'BR', 'PY', 'AR', 'CL'],
  CL: ['PE', 'BO', 'AR'],
  AR: ['CL', 'BO', 'PY', 'BR', 'UY'],
  UY: ['AR', 'BR'],
  PY: ['AR', 'BO', 'BR'],

  // Caribbean
  CU: ['JM', 'HT', 'BS'],
  JM: ['CU', 'HT'],
  HT: ['CU', 'JM', 'DO'],
  DO: ['HT'],
  TT: ['VE', 'GD'],
  BB: ['LC', 'VC'],
  LC: ['BB', 'VC'],
  VC: ['LC', 'BB', 'GD'],
  GD: ['VC', 'TT'],
  AG: ['KN'],
  KN: ['AG'],
  DM: ['GD'],
  BS: ['CU', 'US'],
};

// Regional groupings (by geographic proximity)
const REGIONAL_GROUPS: Record<string, string[]> = {
  'north-america': ['US', 'CA', 'MX'],
  'central-america': ['GT', 'BZ', 'SV', 'HN', 'NI', 'CR', 'PA'],
  caribbean: [
    'CU',
    'JM',
    'HT',
    'DO',
    'TT',
    'BB',
    'LC',
    'VC',
    'GD',
    'AG',
    'KN',
    'DM',
    'BS',
  ],
  'south-america': [
    'CO',
    'VE',
    'GY',
    'SR',
    'GF',
    'BR',
    'EC',
    'PE',
    'BO',
    'CL',
    'AR',
    'UY',
    'PY',
  ],
};

export interface AvoidCity {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  image: string;
}

/**
 * Get cities to show in AvoidGrid based on level and departure location
 */
export function getAvoidCities(
  departureCountry: string,
  departureCity: string,
  level: string,
  count: number = 12,
): AvoidCity[] {
  const allCities: AvoidCity[] = [];

  // Find departure country data
  const deptCountry = AMERICAN_COUNTRIES.find(
    (c) => c.name === departureCountry || c.code === departureCountry,
  );
  const deptCountryCode = deptCountry?.code || '';

  let eligibleCountries: string[] = [];

  switch (level) {
    case 'essenza':
      // Only national cities
      eligibleCountries = [deptCountryCode];
      break;

    case 'modo-explora':
      // National + neighboring countries
      eligibleCountries = [
        deptCountryCode,
        ...(NEIGHBORING_COUNTRIES[deptCountryCode] || []),
      ];
      break;

    case 'explora-plus':
      // National + neighboring + regional countries
      const region =
        Object.entries(REGIONAL_GROUPS).find(([_, countries]) =>
          countries.includes(deptCountryCode),
        )?.[1] || [];
      eligibleCountries = [
        deptCountryCode,
        ...(NEIGHBORING_COUNTRIES[deptCountryCode] || []),
        ...region,
      ];
      // Remove duplicates
      eligibleCountries = [...new Set(eligibleCountries)];
      break;

    case 'bivouac':
    case 'atelier-getaway':
      // All American countries
      eligibleCountries = AMERICAN_COUNTRIES.map((c) => c.code);
      break;

    default:
      // Default to national only
      eligibleCountries = [deptCountryCode];
  }

  // Collect all cities from eligible countries
  eligibleCountries.forEach((countryCode) => {
    const country = AMERICAN_COUNTRIES.find((c) => c.code === countryCode);
    if (!country) return;

    country.cities.forEach((city) => {
      // Exclude departure city
      if (country.name === departureCountry && city === departureCity) {
        return;
      }

      allCities.push({
        id: `${countryCode}-${city}`.toLowerCase().replace(/\s+/g, '-'),
        name: city,
        country: country.name,
        countryCode: country.code,
        image: '', // Will be populated separately
      });
    });
  });

  // Distribute cities proportionally across countries
  const citiesByCountry: Record<string, AvoidCity[]> = {};
  allCities.forEach((city) => {
    if (!citiesByCountry[city.countryCode]) {
      citiesByCountry[city.countryCode] = [];
    }
    citiesByCountry[city.countryCode].push(city);
  });

  const countryList = Object.keys(citiesByCountry);
  const citiesPerCountry = Math.ceil(count / countryList.length);

  const result: AvoidCity[] = [];
  countryList.forEach((countryCode) => {
    const cities = citiesByCountry[countryCode];
    const selected = cities.slice(0, citiesPerCountry);
    result.push(...selected);
  });

  // Return exactly 'count' cities
  return result.slice(0, count);
}

/**
 * Search cities by name across all American countries
 */
export function searchCities(query: string, limit: number = 20): AvoidCity[] {
  if (!query || query.length < 2) return [];

  const results: AvoidCity[] = [];
  const lowerQuery = query.toLowerCase();

  AMERICAN_COUNTRIES.forEach((country) => {
    country.cities.forEach((city) => {
      if (city.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `${country.code}-${city}`.toLowerCase().replace(/\s+/g, '-'),
          name: city,
          country: country.name,
          countryCode: country.code,
          image: '',
        });
      }
    });
  });

  return results.slice(0, limit);
}

/**
 * Get all cities from American countries
 */
export function getAllCities(): AvoidCity[] {
  const cities: AvoidCity[] = [];

  AMERICAN_COUNTRIES.forEach((country) => {
    country.cities.forEach((city) => {
      cities.push({
        id: `${country.code}-${city}`.toLowerCase().replace(/\s+/g, '-'),
        name: city,
        country: country.name,
        countryCode: country.code,
        image: '',
      });
    });
  });

  return cities;
}
