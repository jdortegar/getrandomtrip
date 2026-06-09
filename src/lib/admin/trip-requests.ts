import type {
  AdminTripExperience,
  AdminTripPayment,
  AdminTripUser,
} from "./types";

interface TripRequestWithRelationIds {
  id: string;
  experienceId: string | null;
  userId: string;
}

export function attachAdminTripRequestRelations<
  T extends TripRequestWithRelationIds,
>(
  tripRequests: T[],
  usersById: Record<string, AdminTripUser>,
  experiencesById: Record<string, AdminTripExperience>,
  paymentsByTripRequestId: Record<string, AdminTripPayment>,
) {
  return tripRequests.map(({ experienceId, userId, ...tripRequest }) => {
    const user = usersById[userId];

    if (!user) {
      throw new Error(
        `Missing user relation for trip request ${tripRequest.id}`,
      );
    }

    return {
      ...tripRequest,
      experience: experienceId ? (experiencesById[experienceId] ?? null) : null,
      experienceId: experienceId ?? null,
      payment: paymentsByTripRequestId[tripRequest.id] ?? null,
      user,
    };
  });
}
