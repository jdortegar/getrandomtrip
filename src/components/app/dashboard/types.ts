export interface DashboardStats {
  totalTrips: number;
  upcomingTrips: number;
  completedTrips: number;
  totalSpent: number;
  averageRating: number;
}

export interface DashboardCopy {
  allTrips: {
    emptyDestination: string;
    from: string;
    title: string;
    totalLabel: string;
    viewMore: string;
  };
  common: {
    id: string;
    transactions: string;
  };
  financialSummary: {
    completedPayments: string;
    pendingPayments: string;
    title: string;
    totalSpent: string;
  };
  header: {
    description: string;
    helloFallbackName: string;
    helloPrefix: string;
  };
  paymentStatus: Record<string, string>;
  quickActions: {
    history: string;
    newTrip: string;
    profile: string;
    title: string;
  };
  recentPayments: {
    amount: string;
    date: string;
    empty: string;
    status: string;
    title: string;
    trip: string;
  };
  stats: {
    averageRating: string;
    totalSpent: string;
    totalTrips: string;
    upcomingTrips: string;
  };
  tripStatus: Record<string, string>;
  unpaidTrips: {
    action: string;
    message: string;
    paymentPrefix: string;
    title: string;
  };
  upcomingTrips: {
    emptyCta: string;
    emptyMessage: string;
    emptyTitle: string;
    newTrip: string;
    title: string;
    viewDetails: string;
  };
}
