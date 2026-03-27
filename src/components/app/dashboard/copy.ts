import type { DashboardCopy } from './types';

const DASHBOARD_COPY_ES: DashboardCopy = {
  allTrips: {
    emptyDestination: 'Destino Sorpresa',
    from: 'Desde',
    title: 'Todos Mis Viajes',
    totalLabel: 'viajes',
    viewMore: 'Ver mas',
  },
  common: {
    id: 'ID',
    transactions: 'transacciones',
  },
  financialSummary: {
    completedPayments: 'Pagos Completados',
    pendingPayments: 'Pagos Pendientes',
    title: 'Resumen Financiero',
    totalSpent: 'Total Gastado',
  },
  header: {
    description: 'Gestiona tus viajes y descubre nuevas aventuras',
    helloFallbackName: 'Viajero',
    helloPrefix: 'Hola',
  },
  paymentStatus: {
    APPROVED: 'Aprobado',
    PENDING: 'Pendiente',
  },
  quickActions: {
    history: 'Historial de Pagos',
    newTrip: 'Planificar Nuevo Viaje',
    profile: 'Ver Mi Perfil',
    title: 'Acciones Rapidas',
  },
  recentPayments: {
    amount: 'Monto',
    date: 'Fecha',
    empty: 'No hay pagos registrados',
    status: 'Estado',
    title: 'Historial de Pagos',
    trip: 'Viaje',
  },
  stats: {
    averageRating: 'Rating Promedio',
    totalSpent: 'Gasto Total',
    totalTrips: 'Viajes Totales',
    upcomingTrips: 'Proximos Viajes',
  },
  tripStatus: {
    CANCELLED: 'Cancelado',
    COMPLETED: 'Completado',
    CONFIRMED: 'Confirmado',
    DRAFT: 'Borrador',
    REVEALED: 'Revelado',
    SAVED: 'Guardado',
  },
  unpaidTrips: {
    action: 'Completar pago',
    message: 'Completa el pago para confirmar tu reserva. Puedes reintentar desde aca.',
    paymentPrefix: 'Pago',
    title: 'Viajes pendientes de pago',
  },
  upcomingTrips: {
    emptyCta: 'Planificar Viaje',
    emptyMessage: 'Comienza tu proxima aventura ahora.',
    emptyTitle: 'No tienes viajes proximos',
    newTrip: 'Nuevo Viaje',
    title: 'Proximos Viajes',
    viewDetails: 'Ver Detalles',
  },
};

const DASHBOARD_COPY_EN: DashboardCopy = {
  allTrips: {
    emptyDestination: 'Surprise Destination',
    from: 'From',
    title: 'All My Trips',
    totalLabel: 'trips',
    viewMore: 'View more',
  },
  common: {
    id: 'ID',
    transactions: 'transactions',
  },
  financialSummary: {
    completedPayments: 'Completed Payments',
    pendingPayments: 'Pending Payments',
    title: 'Financial Summary',
    totalSpent: 'Total Spent',
  },
  header: {
    description: 'Manage your trips and discover new adventures',
    helloFallbackName: 'Traveler',
    helloPrefix: 'Hello',
  },
  paymentStatus: {
    APPROVED: 'Approved',
    PENDING: 'Pending',
  },
  quickActions: {
    history: 'Payment History',
    newTrip: 'Plan New Trip',
    profile: 'View My Profile',
    title: 'Quick Actions',
  },
  recentPayments: {
    amount: 'Amount',
    date: 'Date',
    empty: 'No payments found',
    status: 'Status',
    title: 'Payment History',
    trip: 'Trip',
  },
  stats: {
    averageRating: 'Average Rating',
    totalSpent: 'Total Spent',
    totalTrips: 'Total Trips',
    upcomingTrips: 'Upcoming Trips',
  },
  tripStatus: {
    CANCELLED: 'Cancelled',
    COMPLETED: 'Completed',
    CONFIRMED: 'Confirmed',
    DRAFT: 'Draft',
    REVEALED: 'Revealed',
    SAVED: 'Saved',
  },
  unpaidTrips: {
    action: 'Complete payment',
    message: 'Complete payment to confirm your reservation. You can retry from here.',
    paymentPrefix: 'Payment',
    title: 'Trips Pending Payment',
  },
  upcomingTrips: {
    emptyCta: 'Plan Trip',
    emptyMessage: 'Start your next adventure now.',
    emptyTitle: 'You have no upcoming trips',
    newTrip: 'New Trip',
    title: 'Upcoming Trips',
    viewDetails: 'View Details',
  },
};

export function getDashboardCopy(locale?: string): DashboardCopy {
  if (locale?.toLowerCase().startsWith('en')) return DASHBOARD_COPY_EN;
  return DASHBOARD_COPY_ES;
}
