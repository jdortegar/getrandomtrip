import { prisma } from "@/lib/prisma";

/**
 * Guards every function below, all of which take a raw `tripperId` and
 * query `Experience` directly with no User join of their own. The
 * isActive gate belongs on this User-lookup step — adding `isActive: true`
 * to the Experience queries here would filter `Experience.isActive`
 * (an unrelated existing field), silently failing to exclude an inactive
 * owner's experiences.
 */
async function isOwnerActive(tripperId: string): Promise<boolean> {
  const owner = await prisma.user.findFirst({
    where: { id: tripperId, isActive: true },
    select: { id: true },
  });
  return owner !== null;
}

/**
 * Fetches packages for a specific tripper and extracts unique type/level combinations
 * @param tripperId - The ID of the tripper (User.id)
 * @returns Array of { type, level } objects representing available combinations
 */
export async function getTripperAvailableTypesAndLevels(tripperId: string) {
  try {
    if (!(await isOwnerActive(tripperId))) return [];

    const packages = await prisma.experience.findMany({
      where: {
        ownerId: tripperId, // Packages are owned by trippers
        isActive: true, // Only get active packages
      },
      select: {
        type: true,
        level: true,
      },
      distinct: ["type", "level"],
    });

    return packages.map((pkg) => ({
      type: pkg.type,
      level: pkg.level,
    }));
  } catch (error) {
    console.error("Error fetching tripper packages:", error);
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
export async function tripperHasExperiencesForTypeAndLevel(
  tripperId: string,
  type: string,
  level: string,
): Promise<boolean> {
  try {
    if (!(await isOwnerActive(tripperId))) return false;

    const pkg = await prisma.experience.findFirst({
      where: {
        ownerId: tripperId,
        isActive: true,
        type: { has: type },
        level: level,
      },
    });

    return !!pkg;
  } catch (error) {
    console.error("Error checking tripper packages:", error);
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
    if (!(await isOwnerActive(tripperId))) return [];

    const packages = await prisma.experience.findMany({
      where: {
        ownerId: tripperId,
        isActive: true,
      },
      select: {
        type: true,
      },
      distinct: ["type"],
    });

    return [...new Set(packages.flatMap((pkg) => pkg.type))];
  } catch (error) {
    console.error("Error fetching tripper types:", error);
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
    if (!(await isOwnerActive(tripperId))) return [];

    const packages = await prisma.experience.findMany({
      where: {
        ownerId: tripperId,
        isActive: true,
        type: { has: type },
      },
      select: {
        level: true,
      },
      distinct: ["level"],
    });

    return packages
      .map((pkg) => pkg.level)
      .filter((l): l is string => l !== null);
  } catch (error) {
    console.error("Error fetching tripper levels for type:", error);
    return [];
  }
}
