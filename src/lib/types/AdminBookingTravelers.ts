/** Read-only identity details for admin reservations; never an invite payload. */
export interface AdminBookingTraveler {
  id: string;
  kind: "BOOKING_HOLDER" | "ADULT" | "MINOR";
  name: string | null;
  idDocument: string | null;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
}
