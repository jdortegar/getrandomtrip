/** Structured user address (matches `User.address` JSON in Prisma). */
export interface UserProfileAddress {
  city: string;
  country: string;
  /** National ID or passport no. (checkout / booking). */
  idDocument?: string;
  state: string;
  street: string;
  zipCode: string;
}
