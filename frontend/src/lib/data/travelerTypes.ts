export interface TravelerType {
  title: string;
  description: string;
  travelType: string;
  query: string;
  imageUrl: string;
}

export const initialTravellerTypes: TravelerType[] = [
  {
    title: 'En Pareja',
    description: 'Escapadas románticas.',
    travelType: 'Couple',
    query: 'heterosexual couple romantic travel',
    imageUrl: '/images/journey-types/couple-hetero.jpg',
  },
  {
    title: 'Solo',
    description: 'Un viaje único.',
    travelType: 'Solo',
    query: 'solo travel adventure landscape',
    imageUrl: '/images/journey-types/solo-traveler.jpg',
  },
  {
    title: 'En Familia',
    description: 'Recuerdos juntos.',
    travelType: 'Family',
    query: 'family vacation happy kids outdoor',
    imageUrl: '/images/journey-types/family-vacation.jpg',
  },
  {
    title: 'En Grupo',
    description: 'Experiencias compartidas.',
    travelType: 'Group',
    query: 'friends group travel exploring city',
    imageUrl: '/images/journey-types/friends-group.jpg',
  },
  {
    title: 'Honeymoon',
    description: 'El comienzo perfecto.',
    travelType: 'Honeymoon',
    query: 'same sex couple honeymoon romantic getaway',
    imageUrl: '/images/journey-types/honeymoon-same-sex.jpg',
  },
  {
    title: 'PAWS',
    description: 'Aventuras con tu mascota.',
    travelType: 'Paws',
    query: 'travel with pet dog',
    imageUrl: '/images/journey-types/paws-card.jpg',
  },
];
