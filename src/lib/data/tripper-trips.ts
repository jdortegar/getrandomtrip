import { prisma } from '@/lib/prisma';

/**
 * Fetches packages for a specific tripper and extracts unique type/level combinations
 * @param tripperId - The ID of the tripper (User.id)
 * @returns Array of { type, level } objects representing available combinations
 */
export async function getTripperAvailableTypesAndLevels(tripperId: string) {
  try {
    const packages = await prisma.package.findMany({
      where: {
        ownerId: tripperId, // Packages are owned by trippers
        isActive: true, // Only get active packages
      },
      select: {
        type: true,
        level: true,
      },
      distinct: ['type', 'level'],
    });

    return packages.map((pkg) => ({
      type: pkg.type,
      level: pkg.level,
    }));
  } catch (error) {
    console.error('Error fetching tripper packages:', error);
    return [];
  }
}

/**
 * Checks if a tripper has packages for a specific type and level combination
 * @param tripperId - The ID of the tripper
 * @param type - The traveler type (solo, couple, family, etc.)
 * @param level - The experience level (essenza, explora, exploraPlus, etc.)
 * @returns Boolean indicating if the tripper has packages for this combination
 */
export async function tripperHasPackagesForTypeAndLevel(
  tripperId: string,
  type: string,
  level: string,
): Promise<boolean> {
  try {
    const pkg = await prisma.package.findFirst({
      where: {
        ownerId: tripperId,
        isActive: true,
        type: type,
        level: level,
      },
    });

    return !!pkg;
  } catch (error) {
    console.error('Error checking tripper packages:', error);
    return false;
  }
}

/**
 * Gets all available types for a tripper
 * @param tripperId - The ID of the tripper
 * @returns Array of unique traveler types
 */
export async function getTripperAvailableTypes(
  tripperId: string,
): Promise<string[]> {
  try {
    const packages = await prisma.package.findMany({
      where: {
        ownerId: tripperId,
        isActive: true,
      },
      select: {
        type: true,
      },
      distinct: ['type'],
    });

    return packages.map((pkg) => pkg.type);
  } catch (error) {
    console.error('Error fetching tripper types:', error);
    return [];
  }
}

/**
 * Gets all available levels for a tripper and specific type
 * @param tripperId - The ID of the tripper
 * @param type - The traveler type
 * @returns Array of unique experience levels
 */
export async function getTripperAvailableLevelsForType(
  tripperId: string,
  type: string,
): Promise<string[]> {
  try {
    const packages = await prisma.package.findMany({
      where: {
        ownerId: tripperId,
        isActive: true,
        type: type,
      },
      select: {
        level: true,
      },
      distinct: ['level'],
    });

    return packages.map((pkg) => pkg.level);
  } catch (error) {
    console.error('Error fetching tripper levels for type:', error);
    return [];
  }
}
