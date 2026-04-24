import type { AdminTripPackage, AdminTripPayment, AdminTripUser } from './types';

interface TripRequestWithRelationIds {
  id: string;
  packageId: string | null;
  userId: string;
}

export function attachAdminTripRequestRelations<T extends TripRequestWithRelationIds>(
  tripRequests: T[],
  usersById: Record<string, AdminTripUser>,
  packagesById: Record<string, AdminTripPackage>,
  paymentsByTripRequestId: Record<string, AdminTripPayment>,
) {
  return tripRequests.map(({ packageId, userId, ...tripRequest }) => {
    const user = usersById[userId];

    if (!user) {
      throw new Error(`Missing user relation for trip request ${tripRequest.id}`);
    }

    return {
      ...tripRequest,
      package: packageId ? packagesById[packageId] ?? null : null,
      payment: paymentsByTripRequestId[tripRequest.id] ?? null,
      user,
    };
  });
}
