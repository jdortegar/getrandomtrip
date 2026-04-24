interface TripWithId {
  id: string;
}

export function attachPaymentsToTrips<
  TTrip extends TripWithId,
  TPayment extends Record<string, unknown>,
>(
  trips: TTrip[],
  paymentsByTripRequestId: Record<string, TPayment>,
) {
  return trips.map((trip) => ({
    ...trip,
    payment: paymentsByTripRequestId[trip.id] ?? null,
  }));
}
