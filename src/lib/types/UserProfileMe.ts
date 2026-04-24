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
  /**
   * App-level role tokens (lowercase) derived from Prisma `User.roles`.
   */
  roles: Array<'admin' | 'client' | 'tripper'>;
  /**
   * Most privileged app role (lowercase), for simple UI checks.
   */
  role: 'admin' | 'client' | 'tripper';
  avatarUrl?: string | null;
}
