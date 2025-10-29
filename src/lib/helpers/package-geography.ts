import { getAvoidCities } from './avoid-cities';

/**
 * Determine if a package matches geographic criteria based on level and origin
 * Uses simplified logic for international packages
 */
export function isPackageGeographicallyValid(
  packageData: {
    destinationCountry: string;
    destinationCity: string;
  },
  originCountry: string,
  originCity: string,
  level: string,
): boolean {
  const packageCountry = packageData.destinationCountry;
  const packageCity = packageData.destinationCity;

  // For now, use a simplified approach since getAvoidCities is designed for American countries only
  // but our packages include international destinations

  switch (level) {
    case 'essenza':
      // Only national packages (same country as origin)
      return packageCountry === originCountry;

    case 'modo-explora':
      // National + neighboring countries (simplified - allow some international)
      return (
        packageCountry === originCountry ||
        [
          'United States',
          'Canada',
          'Mexico',
          'Brazil',
          'Chile',
          'Uruguay',
        ].includes(packageCountry)
      );

    case 'exploraPlus':
      // National + regional + some international destinations
      return (
        packageCountry === originCountry ||
        [
          'United States',
          'Canada',
          'Mexico',
          'Brazil',
          'Chile',
          'Uruguay',
          'Francia',
          'Japón',
          'Nepal',
          'España',
          'Italia',
          'Alemania',
          'Reino Unido',
        ].includes(packageCountry)
      );

    case 'bivouac':
    case 'atelier-getaway':
      // All countries available (international)
      return true;

    default:
      // Default to national only
      return packageCountry === originCountry;
  }
}

/**
 * Calculate price with tripper commission
 */
export function calculatePriceWithCommission(
  basePrice: number,
  commission: number,
): number {
  return basePrice * (1 + commission / 100);
}
