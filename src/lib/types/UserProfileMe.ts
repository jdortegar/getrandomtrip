import type { UserProfileAddress } from '@/lib/types/UserProfileAddress';

export interface UserProfileMe {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: UserProfileAddress | null;
  createdAt: string;
  travelerType: string | null;
  interests: string[];
  dislikes: string[];
  role: string;
}
