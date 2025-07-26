import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listPremiumFilters = async () => {
  // In a real application, you would fetch this from the database.
  // For now, we will use a mock list.
  const premiumFilters = [
    {
      id: 'transport_type',
      name: 'Preferred Transport Type',
      description: 'Choose your preferred mode of transport.',
      price: 0, // First filter is free
    },
    {
      id: 'experience_type',
      name: 'Specific Experience Type',
      description: 'Tailor your trip to a specific experience (e.g., adventure, relaxation).',
      price: 50,
    },
    {
      id: 'climate_preference',
      name: 'Climate Preference',
      description: 'Select your ideal climate (e.g., tropical, snowy, temperate).',
      price: 30,
    },
    {
      id: 'avoid_destinations',
      name: 'Avoid Specific Destinations',
      description: "Exclude places you've already visited or don't wish to go.",
      price: 20,
    },
  ];

  return premiumFilters;
};
