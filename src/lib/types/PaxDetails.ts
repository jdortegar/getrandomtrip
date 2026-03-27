/** Party breakdown for family/group trips; persisted as JSON on TripRequest.paxDetails. */
export interface PaxDetails {
  adults: number;
  minors: number;
  rooms: number;
}
