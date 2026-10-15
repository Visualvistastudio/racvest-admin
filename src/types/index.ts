// Racvest Admin Dashboard TypeScript Definitions
// Complete type system for admin operations, users, deliveries, finance, support, trust & safety, content, and settings.

// ============================================================================
// ADMIN & AUTHENTICATION
// ============================================================================

export type AdminRole =
  | 'super_admin'
  | 'operations'
  | 'finance'
  | 'customer_support'
  | 'trust_safety'
  | 'analyst';

export type AdminStatus = 'active' | 'invited' | 'suspended' | 'deactivated';

export type Permission =
  // User Management
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.suspend'
  | 'users.ban'
  | 'users.verify'
  | 'users.delete'
  // Delivery & Dispatch
  | 'deliveries.view'
  | 'deliveries.create'
  | 'deliveries.manage'
  | 'deliveries.cancel'
  | 'deliveries.reassign'
  | 'deliveries.override_status'
  // Finance & Transactions
  | 'finance.view'
  | 'finance.refund_review'
  | 'finance.refund_approve'
  | 'finance.payout_approve'
  | 'finance.payout_execute'
  | 'finance.reconcile'
  | 'finance.export'
  // Support & Tickets
  | 'support.view'
  | 'support.reply'
  | 'support.assign'
  | 'support.escalate'
  | 'support.resolve'
  | 'support.reopen'
  // Trust & Safety
  | 'safety.view'
  | 'safety.investigate'
  | 'safety.take_action'
  | 'safety.manage_sos'
  | 'moderation.review'
  | 'moderation.resolve'
  // Content & Communications
  | 'content.view'
  | 'content.create'
  | 'content.edit'
  | 'content.publish'
  | 'content.delete'
  // Analytics & Reports
  | 'analytics.view'
  | 'reports.export'
  // System Administration
  | 'admins.view'
  | 'admins.invite'
  | 'admins.edit'
  | 'admins.roles'
  | 'settings.view'
  | 'settings.edit'
  | 'integrations.manage'
  | 'audit.view'
  | 'system.all';

export interface Admin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AdminRole;
  department: string;
  status: AdminStatus;
  avatar?: string;
  lastLogin?: string;
  lastActivity?: string;
  createdAt: string;
  invitedBy?: string;
  permissions: Permission[];
}

export interface RoleConfig {
  name: AdminRole;
  label: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminInvitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  role: AdminRole;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invitedBy: string;
  invitedByName: string;
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

// ============================================================================
// MARKETPLACE USERS & VERIFICATION
// ============================================================================

export type UserRole = 'sender' | 'traveller' | 'courier';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'banned';
export type RiskLevel = 'safe' | 'flag' | 'danger';

export interface User {
  id: string; // e.g. RCV-29842
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roles: UserRole[];
  verificationStatus: VerificationStatus;
  accountStatus: AccountStatus;
  riskLevel: RiskLevel;
  location: string;
  avatar?: string;
  rating: number; // 0 - 5.0
  registeredAt: string;
  lastActive: string;
  deliveryCount: number;
  walletBalance: number; // stored in kobo (NGN minor units)
  suspendedReason?: string;
  bannedReason?: string;
}

export type DocumentType =
  | 'nin'
  | 'bvn'
  | 'drivers_license'
  | 'international_passport'
  | 'voters_card';

export interface UserVerification {
  id: string;
  userId: string;
  documentType: DocumentType;
  documentNumber?: string;
  documentUrl: string;
  selfieUrl?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  status: VerificationStatus;
  rejectionReason?: string;
}

// ============================================================================
// DELIVERIES, TRIPS & BIDS
// ============================================================================

export type DeliveryMode = 'traveller' | 'courier';

export type DeliveryStatus =
  | 'draft'
  | 'request_created'
  | 'searching'
  | 'offers_received'
  | 'matched'
  | 'awaiting_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'delivered_awaiting_confirmation'
  | 'completed'
  | 'cancellation_requested'
  | 'cancellation_under_review'
  | 'cancelled'
  | 'disputed'
  | 'failed';

export type PaymentStatus =
  | 'pending'
  | 'held'
  | 'captured'
  | 'released'
  | 'refunded'
  | 'failed';

export interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  actor: string;
  note: string;
}

export interface Delivery {
  id: string; // e.g. DLV-83921
  senderId: string;
  senderName: string;
  mode: DeliveryMode;
  travellerId?: string;
  travellerName?: string;
  courierId?: string;
  courierName?: string;
  packageDescription: string;
  packageCategory?: string;
  packageWeight?: number; // in kg
  packageImages: string[];
  declaredValue: number; // in kobo
  agreedPrice?: number; // in kobo
  pickupLocation: string;
  destination: string;
  route: string; // e.g. "Lagos → Abuja"
  scheduledPickup: string;
  scheduledDelivery: string;
  actualDelivery?: string;
  status: DeliveryStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  isDelayed?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistoryEntry[];
}

export interface TripDeclaration {
  id: string; // e.g. TRP-58421
  travellerId: string;
  travellerName: string;
  origin: string;
  destination: string;
  travelDate: string;
  availableCapacity: string; // e.g. "15 kg"
  meetupPoint: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Offer {
  id: string; // e.g. OFF-10294
  type: 'traveller_bid' | 'sender_response';
  deliveryId?: string;
  tripId?: string;
  senderId?: string;
  senderName?: string;
  travellerId?: string;
  travellerName?: string;
  price: number; // in kobo
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  createdAt: string;
  expiresAt: string;
}

export interface Match {
  id: string; // e.g. MTC-39201
  deliveryId: string;
  senderId: string;
  senderName: string;
  providerId: string;
  providerName: string;
  providerType: 'traveller' | 'courier';
  agreedPrice: number; // in kobo
  status: 'confirmed' | 'cancelled' | 'disputed';
  matchedAt: string;
  route: string;
}

// ============================================================================
// FINANCE, TRANSACTIONS, REFUNDS & PAYOUTS
// ============================================================================

export type TransactionType =
  | 'delivery_payment'
  | 'wallet_funding'
  | 'wallet_debit'
  | 'refund'
  | 'traveller_payout'
  | 'courier_payout'
  | 'platform_fee'
  | 'adjustment';

export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export interface Transaction {
  id: string; // e.g. TXN-99281
  userId: string;
  userName: string;
  deliveryId?: string;
  type: TransactionType;
  amount: number; // in kobo
  currency: 'NGN';
  method: string; // e.g. 'card', 'bank_transfer', 'wallet', 'paystack'
  provider: string; // e.g. 'paystack', 'flutterwave', 'system', 'wallet'
  providerRef?: string;
  status: TransactionStatus;
  createdAt: string;
  confirmedAt?: string;
  description: string;
}

export type RefundStatus =
  | 'requested'
  | 'under_review'
  | 'approved'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'rejected'
  | 'cancelled';

export interface Refund {
  id: string; // e.g. RFD-10293
  originalPaymentId: string;
  deliveryId: string;
  requesterId: string;
  requesterName: string;
  amount: number; // in kobo
  maxRefundable: number; // in kobo
  reason: string;
  policyEligibility: string;
  status: RefundStatus;
  reviewedBy?: string;
  approvedBy?: string;
  executedBy?: string;
  providerRef?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type PayoutStatus =
  | 'pending_approval'
  | 'approved'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'rejected';

export interface Payout {
  id: string; // e.g. PAY-48192
  recipientId: string;
  recipientName: string;
  recipientType: 'traveller' | 'courier';
  deliveryId: string;
  grossAmount: number; // in kobo
  fees: number; // in kobo
  netAmount: number; // in kobo
  destinationRef: string; // e.g. "GTBank •••• 4821"
  status: PayoutStatus;
  approvedBy?: string;
  providerRef?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CUSTOMER SUPPORT & TICKETS
// ============================================================================

export type TicketPriority = 'low' | 'normal' | 'high' | 'critical';

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_customer'
  | 'waiting_internal'
  | 'escalated'
  | 'resolved'
  | 'closed';

export interface TicketResolution {
  type: string;
  summary: string;
  decision: string;
  financialOutcome?: string;
  resolvedBy: string;
  resolvedAt: string;
}

export interface TicketEvent {
  id: string;
  type:
    | 'note'
    | 'status_change'
    | 'assignment'
    | 'customer_reply'
    | 'agent_reply'
    | 'escalation';
  content: string;
  author: string;
  authorRole: string;
  isInternal: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string; // e.g. TKT-83921
  title: string;
  customerId: string;
  customerName: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTeam?: string;
  assignedAgent?: string;
  deliveryId?: string;
  paymentId?: string;
  refundId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolution?: TicketResolution;
  events: TicketEvent[];
  slaStatus?: 'within_sla' | 'at_risk' | 'breached';
}

export type ChatStatus =
  | 'open'
  | 'assigned'
  | 'waiting_customer'
  | 'waiting_internal'
  | 'escalated'
  | 'resolved';

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'agent' | 'system';
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string; // e.g. CHT-49102
  customerId: string;
  customerName: string;
  deliveryId?: string;
  category: string;
  status: ChatStatus;
  assignedAgent?: string;
  priority: TicketPriority;
  lastMessage: string;
  lastActivity: string;
  unreadCount: number;
  messages: ChatMessage[];
}

// ============================================================================
// TRUST, SAFETY & MODERATION
// ============================================================================

export type ReportStatus =
  | 'new'
  | 'under_review'
  | 'escalated'
  | 'action_required'
  | 'resolved'
  | 'dismissed';

export interface ModerationReport {
  id: string; // e.g. RPT-10481
  type: string;
  reporterId: string;
  reporterName: string;
  reportedUserId?: string;
  reportedUserName?: string;
  deliveryId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: ReportStatus;
  assignedTo?: string;
  evidence: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
  resolution?: string;
}

export type IncidentStatus =
  | 'new'
  | 'acknowledged'
  | 'investigating'
  | 'escalated'
  | 'resolved'
  | 'closed';

export interface SafetyIncident {
  id: string; // e.g. SOS-49120
  reporterId: string;
  reporterName: string;
  deliveryId?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: IncidentStatus;
  assignedTo?: string;
  description: string;
  evidence: string[];
  timeline: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  resolution?: string;
}

// ============================================================================
// AUDIT LOGS, CONTENT, NOTIFICATIONS & SETTINGS
// ============================================================================

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  previousValue?: string | Record<string, unknown> | any;
  newValue?: string | Record<string, unknown> | any;
  reason?: string;
  ipAddress?: string;
}

export interface ContentItem {
  id: string;
  type: 'banner' | 'announcement' | 'faq' | 'terms' | 'privacy' | 'help';
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  author: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface SystemSetting {
  key: string;
  value: string | number | boolean;
  category: string;
  description: string;
  updatedBy?: string;
  updatedAt: string;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'payment' | 'email' | 'sms' | 'push' | 'maps' | 'identity';
  status: 'connected' | 'disconnected' | 'error' | 'not_configured';
  lastSuccessAt?: string;
  lastErrorMessage?: string;
  configuredAt?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  event: string;
  channel: 'email' | 'sms' | 'push';
  subject?: string;
  body: string;
  variables: string[];
  status: 'active' | 'inactive';
  updatedAt: string;
}

// ============================================================================
// DASHBOARD METRICS
// ============================================================================

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  deliveriesInProgress: number;
  deliveriesAwaitingPickup: number;
  delayedDeliveries: number;
  completedDeliveries: number;
  pendingVerifications: number;
  openTickets: number;
  activeSOSIncidents: number;
  paymentsAwaitingReconciliation: number;
  refundsAwaitingReview: number;
  payoutsAwaitingApproval: number;
}
