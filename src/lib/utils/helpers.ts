import { type TravelersOption } from '../types';

export function getTravelersLabel(count: TravelersOption): string {
  return count === 1 ? '1 viajero' : `${count} viajeros`;
}
