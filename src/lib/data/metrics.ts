import { DashboardMetrics } from '@/types';
import { users, userVerifications } from './users';
import { deliveries } from './deliveries';
import { supportTickets } from './support';
import { safetyIncidents } from './moderation';
import { transactions, refunds, payouts } from './finance';

export const dashboardMetrics: DashboardMetrics = {
  totalUsers: users.length,
  activeUsers: users.filter((u) => u.accountStatus === 'active').length,
  deliveriesInProgress: deliveries.filter((d) =>
    ['picked_up', 'in_transit'].includes(d.status)
  ).length,
  deliveriesAwaitingPickup: deliveries.filter((d) => d.status === 'awaiting_pickup')
    .length,
  delayedDeliveries: deliveries.filter((d) => Boolean(d.isDelayed)).length,
  completedDeliveries: deliveries.filter((d) => d.status === 'completed').length,
  pendingVerifications: userVerifications.filter((v) => v.status === 'pending').length,
  openTickets: supportTickets.filter((t) =>
    ['open', 'in_progress', 'waiting_customer', 'waiting_internal', 'escalated'].includes(
      t.status
    )
  ).length,
  activeSOSIncidents: safetyIncidents.filter((i) =>
    ['new', 'acknowledged', 'investigating', 'escalated'].includes(i.status)
  ).length,
  paymentsAwaitingReconciliation: transactions.filter((t) =>
    ['processing', 'pending'].includes(t.status)
  ).length,
  refundsAwaitingReview: refunds.filter((r) =>
    ['requested', 'under_review'].includes(r.status)
  ).length,
  payoutsAwaitingApproval: payouts.filter((p) => p.status === 'pending_approval')
    .length,
};
