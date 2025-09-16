export interface RoadtripType {
  type: string;
  icon: string;
  description: string;
  bgImage: string;
  query: string;
}

export const initialRoadtripTypes: RoadtripType[] = [
  {
    type: 'Car',
    icon: '🚗',
    description: 'Libertad sobre ruedas.',
    bgImage: '/images/journey-types/roadtrip-car.jpg',
    query: 'scenic car roadtrip mountain',
  },
  {
    type: 'Motorcycle',
    icon: '🏍️',
    description: 'Siente el camino y el viento.',
    bgImage: '/images/journey-types/roadtrip-motorcycle.jpg',
    query: 'motorcycle adventure open road',
  },
  {
    type: 'Bike',
    icon: '🚴',
    description: 'Una aventura a tu propio ritmo.',
    bgImage: '/images/journey-types/roadtrip-bike.jpg',
    query: 'bicycle touring nature path',
  },
];
