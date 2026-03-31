/** Structured user address (matches `User.address` JSON in Prisma). */
export interface UserProfileAddress {
  city: string;
  country: string;
  state: string;
  street: string;
  zipCode: string;
}
