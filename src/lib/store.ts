import { create } from 'zustand';
import {
  Admin,
  AdminInvitation,
  AdminRole,
  AuditLog,
  ChatConversation,
  ContentItem,
  Delivery,
  DeliveryStatus,
  IntegrationConfig,
  Match,
  ModerationReport,
  NotificationTemplate,
  Offer,
  Payout,
  Permission,
  Refund,
  RoleConfig,
  SafetyIncident,
  SupportTicket,
  SystemSetting,
  Transaction,
  TripDeclaration,
  User,
  UserVerification,
  VerificationStatus,
} from '@/types';

import { admins as initialAdmins, adminInvitations as initialInvitations, roleConfigs as initialRoleConfigs } from './data/admins';
import { users as initialUsers, userVerifications as initialVerifications } from './data/users';
import { deliveries as initialDeliveries, tripDeclarations as initialTrips, offers as initialOffers, matches as initialMatches } from './data/deliveries';
import { transactions as initialTransactions, refunds as initialRefunds, payouts as initialPayouts } from './data/finance';
import { supportTickets as initialTickets, chatConversations as initialChats } from './data/support';
import { moderationReports as initialReports, safetyIncidents as initialIncidents, auditLogs as initialAuditLogs } from './data/moderation';
import { contentItems as initialContent, systemSettings as initialSettings, integrationConfigs as initialIntegrations, notificationTemplates as initialTemplates } from './data/system';
import { syncApi } from './api-sync';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  duration?: number;
}

export interface AdminSession {
  id: string;
  adminId: string;
  device: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

interface AppStore {
  // Current admin persona
  currentAdmin: Admin;
  setCurrentAdmin: (admin: Admin) => void;
  switchAdminRole: (role: AdminRole) => void;
  hasPermission: (perm: Permission) => boolean;

  // Active Sessions
  activeSessions: AdminSession[];
  revokeSession: (sessionId: string) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Global search query
  globalSearch: string;
  setGlobalSearch: (q: string) => void;

  // Data Collections
  users: User[];
  userVerifications: UserVerification[];
  deliveries: Delivery[];
  tripDeclarations: TripDeclaration[];
  offers: Offer[];
  matches: Match[];
  transactions: Transaction[];
  refunds: Refund[];
  payouts: Payout[];
  supportTickets: SupportTicket[];
  chatConversations: ChatConversation[];
  moderationReports: ModerationReport[];
  safetyIncidents: SafetyIncident[];
  auditLogs: AuditLog[];
  roleConfigs: RoleConfig[];
  admins: Admin[];
  adminInvitations: AdminInvitation[];
  contentItems: ContentItem[];
  systemSettings: SystemSetting[];
  integrationConfigs: IntegrationConfig[];
  notificationTemplates: NotificationTemplate[];

  // Mutations with audit logging
  // Users & Verifications
  approveVerification: (verificationId: string) => void;
  rejectVerification: (verificationId: string, reason: string) => void;
  suspendUser: (userId: string, reason: string, days?: number) => void;
  banUser: (userId: string, reason: string) => void;
  restoreUser: (userId: string) => void;

  // Deliveries & Cancellations
  updateDeliveryStatus: (deliveryId: string, newStatus: DeliveryStatus, note: string) => void;
  requestDeliveryCancellation: (
    deliveryId: string,
    reason: string,
    explanation: string,
    evidence?: string[]
  ) => { outcome: 'cancelled_unpaid' | 'under_review_paid' | 'under_review_transit' | 'disputed_completed' };
  resolveCancellationReview: (deliveryId: string, decision: 'approved' | 'rejected', notes: string) => void;
  reassignDelivery: (deliveryId: string, providerId: string, providerName: string, mode: 'traveller' | 'courier') => void;

  // Marketplace Offers & Bids
  acceptOffer: (offerId: string) => void;
  rejectOffer: (offerId: string) => void;
  boostRequest: (requestId: string) => void;

  // Finance & Refunds & Payouts
  approveRefund: (refundId: string, reason: string) => boolean;
  executeRefund: (refundId: string) => { success: boolean; message: string };
  rejectRefund: (refundId: string, reason: string) => void;
  approvePayout: (payoutId: string, reason: string) => void;
  executePayout: (payoutId: string) => { success: boolean; message: string };
  rejectPayout: (payoutId: string, reason: string) => void;

  // Support
  sendChatMessage: (conversationId: string, content: string) => void;
  assignChat: (conversationId: string, agentName: string) => void;
  resolveChat: (conversationId: string) => void;
  convertChatToTicket: (
    conversationId: string,
    ticketDetails: { title: string; category: string; priority: 'low' | 'normal' | 'high' | 'critical'; assignedTeam?: string }
  ) => string;
  addTicketEvent: (
    ticketId: string,
    event: { type: 'note' | 'agent_reply' | 'customer_reply' | 'status_change' | 'escalation'; content: string; isInternal: boolean }
  ) => void;
  assignTicket: (ticketId: string, agent: string, team?: string) => void;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => void;
  resolveTicket: (
    ticketId: string,
    resolution: { type: string; summary: string; decision: string; financialOutcome?: string }
  ) => void;

  // SOS & Safety
  acknowledgeSOS: (incidentId: string) => void;
  assignSOS: (incidentId: string, adminName: string) => void;
  escalateSOS: (incidentId: string, notes: string) => void;
  resolveSOS: (incidentId: string, resolution: string) => void;

  // Moderation
  assignReport: (reportId: string, adminName: string) => void;
  escalateReport: (reportId: string, reason: string) => void;
  takeModerationAction: (
    reportId: string,
    actionType: 'suspend' | 'ban' | 'fine' | 'warning',
    details: { reason: string; amount?: number; durationDays?: number }
  ) => void;
  resolveReport: (reportId: string, resolution: string) => void;
  dismissReport: (reportId: string, reason: string) => void;

  // Content
  createContentItem: (item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'author'>) => void;
  updateContentItem: (id: string, updates: Partial<ContentItem>) => void;
  publishContentItem: (id: string) => void;
  archiveContentItem: (id: string) => void;

  // Admins & Roles
  inviteAdmin: (data: { firstName: string; lastName: string; email: string; department: string; role: AdminRole }) => { success: boolean; message: string };
  resendInvitation: (invitationId: string) => void;
  revokeInvitation: (invitationId: string) => void;
  updateAdminRole: (adminId: string, newRole: AdminRole) => { success: boolean; message: string };
  toggleAdminStatus: (adminId: string, status: 'active' | 'suspended') => { success: boolean; message: string };

  // System Settings & Integrations
  updateSetting: (key: string, value: string | number | boolean) => void;
  testIntegration: (id: string) => { success: boolean; message: string };
  updateNotificationTemplate: (id: string, updates: Partial<NotificationTemplate>) => void;

  // Backend Database Synchronization
  isHydrated: boolean;
  initFromApi: () => Promise<void>;
}

const initialSessions: AdminSession[] = [
  {
    id: 'SES-001',
    adminId: 'ADM-001',
    device: 'MacBook Pro 16" (macOS Sonoma / Chrome 129)',
    ipAddress: '102.89.23.114',
    location: 'Lagos, Nigeria',
    lastActive: 'Just now',
    isCurrent: true,
  },
  {
    id: 'SES-002',
    adminId: 'ADM-001',
    device: 'iPhone 15 Pro (iOS 18 / Safari)',
    ipAddress: '105.112.98.4',
    location: 'Abuja, Nigeria',
    lastActive: '3 hours ago',
    isCurrent: false,
  },
  {
    id: 'SES-003',
    adminId: 'ADM-001',
    device: 'Dell XPS 15 (Windows 11 / Edge)',
    ipAddress: '102.89.44.12',
    location: 'Lagos, Nigeria',
    lastActive: '2 days ago',
    isCurrent: false,
  },
];

export const useAppStore = create<AppStore>((set, get) => ({
  isHydrated: false,
  initFromApi: async () => {
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        set({
          isHydrated: true,
          users: json.data.users,
          userVerifications: json.data.userVerifications,
          deliveries: json.data.deliveries,
          tripDeclarations: json.data.trips,
          offers: json.data.offers,
          matches: json.data.matches,
          transactions: json.data.transactions,
          refunds: json.data.refunds,
          payouts: json.data.payouts,
          supportTickets: json.data.supportTickets,
          chatConversations: json.data.chatConversations,
          moderationReports: json.data.moderationReports,
          safetyIncidents: json.data.safetyIncidents,
          contentItems: json.data.contentItems,
          admins: json.data.admins,
          adminInvitations: json.data.adminInvitations,
          roleConfigs: json.data.roleConfigs,
          auditLogs: json.data.auditLogs,
          systemSettings: json.data.systemSettings,
          integrationConfigs: json.data.integrationConfigs,
          notificationTemplates: json.data.notificationTemplates,
        });
      }
    } catch (err) {
      console.warn('Backend database API offline, keeping local store state:', err);
    }
  },

  currentAdmin: initialAdmins[0], // Chioma Okonjo (Super Admin)
  activeSessions: initialSessions,
  toasts: [],
  globalSearch: '',

  setGlobalSearch: (q) => set({ globalSearch: q }),

  setCurrentAdmin: (admin) => set({ currentAdmin: admin }),

  switchAdminRole: (role) => {
    const adminForRole = get().admins.find((a) => a.role === role) || {
      ...get().currentAdmin,
      role,
      permissions: get().roleConfigs.find((r) => r.name === role)?.permissions || [],
    };
    set({ currentAdmin: adminForRole });
    get().addToast({
      type: 'info',
      title: 'Active Persona Switched',
      message: `Now viewing dashboard as ${adminForRole.firstName} ${adminForRole.lastName} (${role.replace('_', ' ').toUpperCase()}).`,
    });
  },

  hasPermission: (perm) => {
    const { currentAdmin } = get();
    if (!currentAdmin) return false;
    if (currentAdmin.role === 'super_admin' || currentAdmin.permissions.includes('system.all')) return true;
    return currentAdmin.permissions.includes(perm);
  },

  revokeSession: (sessionId) => {
    const session = get().activeSessions.find((s) => s.id === sessionId);
    set((state) => ({
      activeSessions: state.activeSessions.filter((s) => s.id !== sessionId),
    }));
    get().addToast({
      type: 'warning',
      title: 'Session Revoked',
      message: `Session from ${session?.device || sessionId} has been terminated immediately.`,
    });
  },

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    if (toast.duration !== 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, toast.duration || 5000);
    }
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  // Collections
  users: initialUsers,
  userVerifications: initialVerifications,
  deliveries: initialDeliveries,
  tripDeclarations: initialTrips,
  offers: initialOffers,
  matches: initialMatches,
  transactions: initialTransactions,
  refunds: initialRefunds,
  payouts: initialPayouts,
  supportTickets: initialTickets,
  chatConversations: initialChats,
  moderationReports: initialReports,
  safetyIncidents: initialIncidents,
  auditLogs: initialAuditLogs,
  roleConfigs: initialRoleConfigs,
  admins: initialAdmins,
  adminInvitations: initialInvitations,
  contentItems: initialContent,
  systemSettings: initialSettings,
  integrationConfigs: initialIntegrations,
  notificationTemplates: initialTemplates,

  // User Actions
  approveVerification: (verificationId) => {
    const { currentAdmin, hasPermission } = get();
    if (!hasPermission('users.verify')) {
      get().addToast({ type: 'danger', title: 'Permission Denied', message: 'You do not have permission to verify users.' });
      return;
    }
    const now = new Date().toISOString();
    let updatedUserId = '';
    set((state) => {
      const vIndex = state.userVerifications.findIndex((v) => v.id === verificationId);
      if (vIndex === -1) return state;
      const v = state.userVerifications[vIndex];
      updatedUserId = v.userId;

      const updatedVerifications = [...state.userVerifications];
      updatedVerifications[vIndex] = {
        ...v,
        status: 'verified',
        reviewedAt: now,
        reviewedBy: currentAdmin.id,
      };

      const updatedUsers = state.users.map((u) =>
        u.id === v.userId ? { ...u, verificationStatus: 'verified' as VerificationStatus } : u
      );

      const audit: AuditLog = {
        id: `AUD-${Date.now()}`,
        adminId: currentAdmin.id,
        adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
        action: 'user.verify_approved',
        targetType: 'UserVerification',
        targetId: verificationId,
        timestamp: now,
        reason: 'Identity document biometric and checksum verified',
      };

      return {
        userVerifications: updatedVerifications,
        users: updatedUsers,
        auditLogs: [audit, ...state.auditLogs],
      };
    });

    get().addToast({
      type: 'success',
      title: 'Verification Approved',
      message: `User ${updatedUserId} verification has been verified and badge issued.`,
    });

    syncApi(`/api/verifications/${verificationId}`, 'PATCH', {
      action: 'approve',
      adminId: currentAdmin.id,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
    });
  },

  rejectVerification: (verificationId, reason) => {
    const { currentAdmin, hasPermission } = get();
    if (!hasPermission('users.verify')) {
      get().addToast({ type: 'danger', title: 'Permission Denied', message: 'You do not have permission to review verifications.' });
      return;
    }
    const now = new Date().toISOString();
    set((state) => {
      const vIndex = state.userVerifications.findIndex((v) => v.id === verificationId);
      if (vIndex === -1) return state;
      const v = state.userVerifications[vIndex];

      const updatedVerifications = [...state.userVerifications];
      updatedVerifications[vIndex] = {
        ...v,
        status: 'rejected',
        reviewedAt: now,
        reviewedBy: currentAdmin.id,
        rejectionReason: reason,
      };

      const updatedUsers = state.users.map((u) =>
        u.id === v.userId ? { ...u, verificationStatus: 'rejected' as VerificationStatus } : u
      );

      const audit: AuditLog = {
        id: `AUD-${Date.now()}`,
        adminId: currentAdmin.id,
        adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
        action: 'user.verify_rejected',
        targetType: 'UserVerification',
        targetId: verificationId,
        timestamp: now,
        reason,
      };

      return {
        userVerifications: updatedVerifications,
        users: updatedUsers,
        auditLogs: [audit, ...state.auditLogs],
      };
    });

    get().addToast({
      type: 'warning',
      title: 'Verification Rejected',
      message: `Verification ${verificationId} rejected. Reason logged for user notification.`,
    });

    syncApi(`/api/verifications/${verificationId}`, 'PATCH', {
      action: 'reject',
      reason,
      adminId: currentAdmin.id,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
    });
  },

  suspendUser: (userId, reason, days = 7) => {
    const { currentAdmin, hasPermission } = get();
    if (!hasPermission('users.suspend')) {
      get().addToast({ type: 'danger', title: 'Permission Denied', message: 'You do not have permission to suspend accounts.' });
      return;
    }
    const now = new Date().toISOString();
    set((state) => {
      const updatedUsers = state.users.map((u) =>
        u.id === userId
          ? {
              ...u,
              accountStatus: 'suspended' as const,
              suspendedReason: `${reason} (${days} days)`,
              riskLevel: 'flag' as const,
            }
          : u
      );
      const audit: AuditLog = {
        id: `AUD-${Date.now()}`,
        adminId: currentAdmin.id,
        adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
        action: 'user.suspended',
        targetType: 'User',
        targetId: userId,
        timestamp: now,
        reason: `Account suspended for ${days} days. Reason: ${reason}`,
      };
      return {
        users: updatedUsers,
        auditLogs: [audit, ...state.auditLogs],
      };
    });
    get().addToast({
      type: 'warning',
      title: 'Account Suspended',
      message: `User ${userId} has been suspended for ${days} days. Active bids paused.`,
    });

    syncApi(`/api/users/${userId}`, 'PATCH', {
      action: 'suspend',
      reason,
      days,
      adminId: currentAdmin.id,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
    });
  },

  banUser: (userId, reason) => {
    const { currentAdmin, hasPermission } = get();
    if (!hasPermission('users.ban')) {
      get().addToast({ type: 'danger', title: 'Permission Denied', message: 'You do not have permission to ban accounts.' });
      return;
    }
    const now = new Date().toISOString();
    set((state) => {
      const updatedUsers = state.users.map((u) =>
        u.id === userId
          ? {
              ...u,
              accountStatus: 'banned' as const,
              bannedReason: reason,
              riskLevel: 'danger' as const,
            }
          : u
      );
      const audit: AuditLog = {
        id: `AUD-${Date.now()}`,
        adminId: currentAdmin.id,
        adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
        action: 'user.banned',
        targetType: 'User',
        targetId: userId,
        timestamp: now,
        reason: `Permanent ban enforced. Reason: ${reason}`,
      };
      return {
        users: updatedUsers,
        auditLogs: [audit, ...state.auditLogs],
      };
    });
    get().addToast({
      type: 'danger',
      title: 'Account Permanently Banned',
      message: `User ${userId} has been permanently banned from the marketplace.`,
    });

    syncApi(`/api/users/${userId}`, 'PATCH', {
      action: 'ban',
      reason,
      adminId: currentAdmin.id,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
    });
  },

  restoreUser: (userId) => {
    const { currentAdmin } = get();
    const now = new Date().toISOString();
    set((state) => {
      const updatedUsers = state.users.map((u) =>
        u.id === userId
          ? {
              ...u,
              accountStatus: 'active' as const,
              suspendedReason: undefined,
              bannedReason: undefined,
              riskLevel: 'safe' as const,
            }
          : u
      );
      const audit: AuditLog = {
        id: `AUD-${Date.now()}`,
        adminId: currentAdmin.id,
        adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
        action: 'user.restored',
        targetType: 'User',
        targetId: userId,
        timestamp: now,
        reason: 'Account reinstated following review',
      };
      return {
        users: updatedUsers,
        auditLogs: [audit, ...state.auditLogs],
      };
    });
    get().addToast({
      type: 'success',
      title: 'Account Restored',
      message: `User ${userId} status restored to active.`,
    });

    syncApi(`/api/users/${userId}`, 'PATCH', {
      action: 'restore',
      adminId: currentAdmin.id,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
    });
  },

  // Deliveries & Cancellations
  updateDeliveryStatus: (deliveryId, newStatus, note) => {
    const { currentAdmin, hasPermission } = get();
    if (!hasPermission('deliveries.manage')) {
      get().addToast({ type: 'danger', title: 'Permission Denied', message: 'You do not have permission to modify delivery statuses.' });
      return;
    }
    const now = new Date().toISOString();
    set((state) => {
      const dIndex = state.deliveries.findIndex((d) => d.id === deliveryId);
      if (dIndex === -1) return state;
      const d = state.deliveries[dIndex];

      const newHistoryEntry = {
        status: newStatus,
        timestamp: now,
        actor: `${currentAdmin.firstName} ${currentAdmin.lastName} (Admin)`,
        note,
      };

      const updatedDeliveries = [...state.deliveries];
      updatedDeliveries[dIndex] = {
        ...d,
        status: newStatus,
        updatedAt: now,
        statusHistory: [...d.statusHistory, newHistoryEntry],
      };

      const audit: AuditLog = {
        id: `AUD-${Date.now()}`,
        adminId: currentAdmin.id,
        adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
        action: 'delivery.status_update',
        targetType: 'Delivery',
        targetId: deliveryId,
        timestamp: now,
        previousValue: { status: d.status },
        newValue: { status: newStatus },
        reason: note,
      };

      return {
        deliveries: updatedDeliveries,
        auditLogs: [audit, ...state.auditLogs],
      };
    });

    get().addToast({
      type: 'success',
      title: 'Delivery Status Updated',
      message: `Delivery ${deliveryId} is now marked as ${newStatus.replace('_', ' ').toUpperCase()}.`,
    });

    syncApi(`/api/deliveries/${deliveryId}`, 'PATCH', {
      action: 'update_status',
      status: newStatus,
      note,
      adminId: currentAdmin.id,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
    });
  },

  requestDeliveryCancellation: (deliveryId, reason, explanation, evidence = []) => {
    const { currentAdmin } = get();
    const delivery = get().deliveries.find((d) => d.id === deliveryId);
    if (!delivery) throw new Error('Delivery not found');

    const now = new Date().toISOString();

    // PRD Section 8.5 Business Rules:
    // Scenario A: Unpaid -> cancel immediately, no refund created
    if (delivery.paymentStatus === 'pending' || delivery.paymentStatus === 'failed') {
      get().updateDeliveryStatus(deliveryId, 'cancelled', `Cancellation requested (Unpaid): ${reason} - ${explanation}`);
      return { outcome: 'cancelled_unpaid' };
    }

    // Scenario B: Paid, but pickup has not occurred
    if (['request_created', 'searching', 'offers_received', 'matched', 'awaiting_pickup'].includes(delivery.status)) {
      get().updateDeliveryStatus(deliveryId, 'cancellation_under_review', `Cancellation Requested Pre-Pickup: ${reason} - ${explanation}`);

      // Create linked refund request in finance
      const refundId = `RFD-${Math.floor(10000 + Math.random() * 90000)}`;
      const newRefund: Refund = {
        id: refundId,
        originalPaymentId: delivery.paymentId || 'TXN-UNKNOWN',
        deliveryId: delivery.id,
        requesterId: delivery.senderId,
        requesterName: delivery.senderName,
        amount: delivery.agreedPrice || 0,
        maxRefundable: delivery.agreedPrice || 0,
        reason: `Pre-pickup cancellation: ${reason}`,
        policyEligibility: 'Eligible for 100% Escrow Refund (Cancelled prior to handover)',
        status: 'under_review',
        notes: explanation,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => ({ refunds: [newRefund, ...state.refunds] }));

      get().addToast({
        type: 'warning',
        title: 'Cancellation Under Review',
        message: `Delivery ${deliveryId} moved to review. Refund request ${refundId} queued for Finance approval.`,
      });
      return { outcome: 'under_review_paid' };
    }

    // Scenario C: Parcel picked up or in transit
    if (['picked_up', 'in_transit'].includes(delivery.status)) {
      get().updateDeliveryStatus(deliveryId, 'cancellation_under_review', `Transit Cancellation Request: ${reason} - ${explanation}`);

      // Create an operational support ticket
      const ticketId = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
      const newTicket: SupportTicket = {
        id: ticketId,
        title: `Transit Cancellation Investigation - ${delivery.id} (${delivery.route})`,
        customerId: delivery.senderId,
        customerName: delivery.senderName,
        category: 'Cancellation Requests',
        priority: 'high',
        status: 'open',
        assignedTeam: 'Logistics Escalations',
        deliveryId: delivery.id,
        createdAt: now,
        updatedAt: now,
        events: [
          {
            id: `EVT-${Date.now()}`,
            type: 'customer_reply',
            content: `Sender requested transit cancellation. Reason: ${reason}. Explanation: ${explanation}`,
            author: delivery.senderName,
            authorRole: 'sender',
            isInternal: false,
            createdAt: now,
          },
          {
            id: `EVT-${Date.now() + 1}`,
            type: 'note',
            content: `DO NOT AUTO-REFUND: Parcel in possession of ${delivery.travellerName || delivery.courierName}. Operations desk must establish package security and coordinate return before financial resolution.`,
            author: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
            authorRole: 'admin',
            isInternal: true,
            createdAt: now,
          },
        ],
      };

      set((state) => ({ supportTickets: [newTicket, ...state.supportTickets] }));

      get().addToast({
        type: 'warning',
        title: 'Transit Cancellation Escalated',
        message: `Package is in transit. Case ${ticketId} created for Operations to halt delivery safely before any refund.`,
      });
      return { outcome: 'under_review_transit' };
    }

    // Scenario D: Completed -> post-delivery dispute
    get().updateDeliveryStatus(deliveryId, 'disputed', `Post-completion dispute: ${reason}`);
    return { outcome: 'disputed_completed' };
  },

  resolveCancellationReview: (deliveryId, decision, notes) => {
    const { currentAdmin, hasPermission } = get();
    if (!hasPermission('deliveries.cancel')) {
      get().addToast({ type: 'danger', title: 'Permission Denied', message: 'You do not have permission to approve/reject cancellations.' });
      return;
    }
    const finalStatus = decision === 'approved' ? 'cancelled' : 'in_transit';
    get().updateDeliveryStatus(deliveryId, finalStatus, `Cancellation review resolved (${decision}): ${notes}`);
    get().addToast({
      type: decision === 'approved' ? 'success' : 'info',
      title: `Cancellation Review ${decision.toUpperCase()}`,
      message: `Delivery ${deliveryId} is now ${finalStatus}.`,
    });
  },

  reassignDelivery: (deliveryId, providerId, providerName, mode) => {
    const { currentAdmin, hasPermission } = get();
    if (!hasPermission('deliveries.reassign')) {
      get().addToast({ type: 'danger', title: 'Permission Denied', message: 'You do not have permission to reassign deliveries.' });
      return;
    }
    const now = new Date().toISOString();
    set((state) => {
      const dIndex = state.deliveries.findIndex((d) => d.id === deliveryId);
      if (dIndex === -1) return state;
      const d = state.deliveries[dIndex];

      const updatedDeliveries = [...state.deliveries];
      updatedDeliveries[dIndex] = {
        ...d,
        mode,
        travellerId: mode === 'traveller' ? providerId : undefined,
        travellerName: mode === 'traveller' ? providerName : undefined,
        courierId: mode === 'courier' ? providerId : undefined,
        courierName: mode === 'courier' ? providerName : undefined,
        status: 'matched',
        updatedAt: now,
        statusHistory: [
          ...d.statusHistory,
          {
            status: 'matched',
            timestamp: now,
            actor: `${currentAdmin.firstName} ${currentAdmin.lastName} (Admin)`,
            note: `Reassigned delivery to ${providerName} (${mode})`,
          },
        ],
      };

      const audit: AuditLog = {
        id: `AUD-${Date.now()}`,
        adminId: currentAdmin.id,
        adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
        action: 'delivery.reassigned',
        targetType: 'Delivery',
        targetId: deliveryId,
        timestamp: now,
        newValue: { providerId, providerName, mode },
        reason: 'Operational reassignment per exception protocol',
      };

      return {
        deliveries: updatedDeliveries,
        auditLogs: [audit, ...state.auditLogs],
      };
    });

    get().addToast({
      type: 'success',
      title: 'Delivery Reassigned',
      message: `Delivery ${deliveryId} successfully reassigned to ${providerName}.`,
    });

    syncApi(`/api/deliveries/${deliveryId}`, 'PATCH', {
      action: 'reassign',
      providerId,
      providerName,
      mode,
      adminId: currentAdmin.id,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
    });
  },

  // Marketplace Offers
  acceptOffer: (offerId) => {
    const offer = get().offers.find((o) => o.id === offerId);
    if (!offer) return;
    set((state) => ({
      offers: state.offers.map((o) => (o.id === offerId ? { ...o, status: 'accepted' as const } : o)),
    }));
    get().addToast({
      type: 'success',
      title: 'Offer Accepted',
      message: `Offer ${offerId} from ${offer.travellerName} marked as accepted.`,
    });

    syncApi('/api/bids-matches', 'POST', {
      action: 'accept_offer',
      offerId,
      adminId: get().currentAdmin.id,
      adminName: `${get().currentAdmin.firstName} ${get().currentAdmin.lastName}`,
    });
  },

  rejectOffer: (offerId) => {
    set((state) => ({
      offers: state.offers.map((o) => (o.id === offerId ? { ...o, status: 'rejected' as const } : o)),
    }));
    get().addToast({
      type: 'info',
      title: 'Offer Rejected',
      message: `Offer ${offerId} marked as rejected.`,
    });

    syncApi('/api/bids-matches', 'POST', {
      action: 'reject_offer',
      offerId,
      adminId: get().currentAdmin.id,
      adminName: `${get().currentAdmin.firstName} ${get().currentAdmin.lastName}`,
    });
  },

  boostRequest: (requestId) => {
    get().addToast({
      type: 'success',
      title: 'Visibility Boosted',
      message: `Request ${requestId} priority bumped. Push broadcast dispatched to available travellers in corridor.`,
    });

    syncApi('/api/bids-matches', 'POST', {
      action: 'boost_request',
      deliveryId: requestId,
      adminId: get().currentAdmin.id,
      adminName: `${get().currentAdmin.firstName} ${get().currentAdmin.lastName}`,
    });
  },

  // Finance & Refunds & Payouts
  approveRefund: (refundId, reason) => {
    const { currentAdmin, hasPermission } = get();
    if (!hasPermission('finance.refund_approve')) {
      get().addToast({ type: 'danger', title: 'Permission Denied', message: 'You do not have permission to approve refunds.' });
      return false;
    }
    const refund = get().refunds.find((r) => r.id === refundId);
    if (!refund) return false;

    // Separation of duties check: An admin who requested it or non-finance cannot approve without review
    if (refund.reviewedBy === currentAdmin.id && currentAdmin.role !== 'super_admin') {
      get().addToast({
        type: 'danger',
        title: 'Separation of Duties Required',
        message: 'Policy requires an independent administrator to approve this refund.',
      });
      return false;
    }

    const now = new Date().toISOString();
    set((state) => {
      const updatedRefunds = state.refunds.map((r) =>
        r.id === refundId
          ? {
              ...r,
              status: 'approved' as const,
              approvedBy: currentAdmin.id,
              notes: `${r.notes}\nApproved by ${currentAdmin.firstName} ${currentAdmin.lastName}: ${reason}`,
              updatedAt: now,
            }
          : r
      );
      const audit: AuditLog = {
        id: `AUD-${Date.now()}`,
        adminId: currentAdmin.id,
        adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
        action: 'refund.approved',
        targetType: 'Refund',
        targetId: refundId,
        timestamp: now,
        reason,
      };
      return {
        refunds: updatedRefunds,
        auditLogs: [audit, ...state.auditLogs],
      };
    });

    get().addToast({
      type: 'success',
      title: 'Refund Approved',
      message: `Refund ${refundId} approved. Ready for execution via payment gateway.`,
    });

    syncApi(`/api/payments/refunds/${refundId}`, 'PATCH', {
      action: 'approve',
      reason,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      adminId: currentAdmin.id,
    });

    return true;
  },

  executeRefund: (refundId) => {
    const { currentAdmin, hasPermission } = get();
    if (!hasPermission('finance.refund_approve') && currentAdmin.role !== 'finance' && currentAdmin.role !== 'super_admin') {
      get().addToast({ type: 'danger', title: 'Permission Denied', message: 'You do not have permission to execute financial refunds.' });
      return { success: false, message: 'Permission denied' };
    }

    const refund = get().refunds.find((r) => r.id === refundId);
    if (!refund) return { success: false, message: 'Refund not found' };
    if (refund.status !== 'approved') {
      get().addToast({ type: 'warning', title: 'Execution Blocked', message: 'Refund must be formally approved before gateway execution.' });
      return { success: false, message: 'Refund not approved' };
    }

    const now = new Date().toISOString();
    const providerRef = `pstk_ref_${Math.floor(10000000 + Math.random() * 90000000)}`;

    // Create financial transaction record
    const txn: Transaction = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: refund.requesterId,
      userName: refund.requesterName,
      deliveryId: refund.deliveryId,
      type: 'refund',
      amount: refund.amount,
      currency: 'NGN',
      method: 'card',
      provider: 'paystack',
      providerRef,
      status: 'succeeded',
      createdAt: now,
      confirmedAt: now,
      description: `Escrow refund executed for delivery ${refund.deliveryId}`,
    };

    set((state) => {
      const updatedRefunds = state.refunds.map((r) =>
        r.id === refundId
          ? {
              ...r,
              status: 'succeeded' as const,
              executedBy: currentAdmin.id,
              providerRef,
              updatedAt: now,
            }
          : r
      );
      const audit: AuditLog = {
        id: `AUD-${Date.now()}`,
        adminId: currentAdmin.id,
        adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
        action: 'refund.executed',
        targetType: 'Refund',
        targetId: refundId,
        timestamp: now,
        newValue: { providerRef, status: 'succeeded' },
        reason: 'Executed refund through Paystack payment processor',
      };
      return {
        refunds: updatedRefunds,
        transactions: [txn, ...state.transactions],
        auditLogs: [audit, ...state.auditLogs],
      };
    });

    get().addToast({
      type: 'success',
      title: 'Refund Executed Successfully',
      message: `Gateway confirmed refund ${refundId}. Ref: ${providerRef}`,
    });

    syncApi(`/api/payments/refunds/${refundId}`, 'PATCH', {
      action: 'execute',
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      adminId: currentAdmin.id,
      role: currentAdmin.role,
    });

    return { success: true, message: 'Refund executed successfully' };
  },

  rejectRefund: (refundId, reason) => {
    const { currentAdmin, hasPermission } = get();
    if (!hasPermission('finance.refund_review')) {
      get().addToast({ type: 'danger', title: 'Permission Denied', message: 'You do not have permission to reject refunds.' });
      return;
    }
    const now = new Date().toISOString();
    set((state) => {
      const updatedRefunds = state.refunds.map((r) =>
        r.id === refundId
          ? {
              ...r,
              status: 'rejected' as const,
              notes: `${r.notes}\nRejected by ${currentAdmin.firstName} ${currentAdmin.lastName}: ${reason}`,
              updatedAt: now,
            }
          : r
      );
      const audit: AuditLog = {
        id: `AUD-${Date.now()}`,
        adminId: currentAdmin.id,
        adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
        action: 'refund.rejected',
        targetType: 'Refund',
        targetId: refundId,
        timestamp: now,
        reason,
      };
      return {
        refunds: updatedRefunds,
        auditLogs: [audit, ...state.auditLogs],
      };
    });

    get().addToast({
      type: 'info',
      title: 'Refund Request Rejected',
      message: `Refund ${refundId} marked as rejected. Reason: ${reason}`,
    });

    syncApi(`/api/payments/refunds/${refundId}`, 'PATCH', {
      action: 'reject',
      reason,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      adminId: currentAdmin.id,
    });
  },

  approvePayout: (payoutId, reason) => {
    const { currentAdmin, hasPermission } = get();
    if (!hasPermission('finance.payout_approve')) {
      get().addToast({ type: 'danger', title: 'Permission Denied', message: 'You do not have permission to approve payouts.' });
      return;
    }
    const now = new Date().toISOString();
    set((state) => {
      const updatedPayouts = state.payouts.map((p) =>
        p.id === payoutId
          ? {
              ...p,
              status: 'approved' as const,
              approvedBy: currentAdmin.id,
              updatedAt: now,
            }
          : p
      );
      const audit: AuditLog = {
        id: `AUD-${Date.now()}`,
        adminId: currentAdmin.id,
        adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
        action: 'payout.approved',
        targetType: 'Payout',
        targetId: payoutId,
        timestamp: now,
        reason,
      };
      return {
        payouts: updatedPayouts,
        auditLogs: [audit, ...state.auditLogs],
      };
    });

    get().addToast({
      type: 'success',
      title: 'Payout Approved',
      message: `Payout ${payoutId} approved for disbursement.`,
    });

    syncApi(`/api/payments/payouts/${payoutId}`, 'PATCH', {
      action: 'approve',
      reason,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      adminId: currentAdmin.id,
    });
  },

  executePayout: (payoutId) => {
    const { currentAdmin, hasPermission } = get();
    if (!hasPermission('finance.payout_execute') && currentAdmin.role !== 'finance' && currentAdmin.role !== 'super_admin') {
      get().addToast({ type: 'danger', title: 'Permission Denied', message: 'You do not have permission to execute payouts.' });
      return { success: false, message: 'Permission denied' };
    }

    const payout = get().payouts.find((p) => p.id === payoutId);
    if (!payout) return { success: false, message: 'Payout not found' };
    if (payout.status !== 'approved') {
      get().addToast({ type: 'warning', title: 'Execution Blocked', message: 'Payout must be approved before execution.' });
      return { success: false, message: 'Payout not approved' };
    }

    const now = new Date().toISOString();
    const providerRef = `pstk_trf_${Math.floor(10000000 + Math.random() * 90000000)}`;

    const txn: Transaction = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: payout.recipientId,
      userName: payout.recipientName,
      deliveryId: payout.deliveryId,
      type: payout.recipientType === 'traveller' ? 'traveller_payout' : 'courier_payout',
      amount: payout.netAmount,
      currency: 'NGN',
      method: 'bank_transfer',
      provider: 'paystack',
      providerRef,
      status: 'succeeded',
      createdAt: now,
      confirmedAt: now,
      description: `Disbursement to ${payout.destinationRef} for ${payout.deliveryId}`,
    };

    set((state) => {
      const updatedPayouts = state.payouts.map((p) =>
        p.id === payoutId
          ? {
              ...p,
              status: 'succeeded' as const,
              providerRef,
              updatedAt: now,
            }
          : p
      );
      const audit: AuditLog = {
        id: `AUD-${Date.now()}`,
        adminId: currentAdmin.id,
        adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
        action: 'payout.executed',
        targetType: 'Payout',
        targetId: payoutId,
        timestamp: now,
        newValue: { providerRef, status: 'succeeded' },
        reason: 'Executed bank transfer disbursement via Paystack Transfers',
      };
      return {
        payouts: updatedPayouts,
        transactions: [txn, ...state.transactions],
        auditLogs: [audit, ...state.auditLogs],
      };
    });

    get().addToast({
      type: 'success',
      title: 'Payout Disbursed',
      message: `Bank transfer initiated for ${payoutId}. Ref: ${providerRef}`,
    });

    syncApi(`/api/payments/payouts/${payoutId}`, 'PATCH', {
      action: 'execute',
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      adminId: currentAdmin.id,
    });

    return { success: true, message: 'Payout executed' };
  },

  rejectPayout: (payoutId, reason) => {
    const { currentAdmin } = get();
    const now = new Date().toISOString();
    set((state) => {
      const updatedPayouts = state.payouts.map((p) =>
        p.id === payoutId
          ? {
              ...p,
              status: 'rejected' as const,
              updatedAt: now,
            }
          : p
      );
      const audit: AuditLog = {
        id: `AUD-${Date.now()}`,
        adminId: currentAdmin.id,
        adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
        action: 'payout.rejected',
        targetType: 'Payout',
        targetId: payoutId,
        timestamp: now,
        reason,
      };
      return {
        payouts: updatedPayouts,
        auditLogs: [audit, ...state.auditLogs],
      };
    });
    get().addToast({
      type: 'info',
      title: 'Payout Rejected',
      message: `Payout ${payoutId} has been rejected. Reason: ${reason}`,
    });

    syncApi(`/api/payments/payouts/${payoutId}`, 'PATCH', {
      action: 'reject',
      reason,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      adminId: currentAdmin.id,
    });
  },

  // Support
  sendChatMessage: (conversationId, content) => {
    const { currentAdmin } = get();
    const now = new Date().toISOString();
    const newMsg = {
      id: `MSG-${Date.now()}`,
      sender: 'agent' as const,
      senderName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      content,
      timestamp: now,
      isRead: true,
    };

    set((state) => {
      const updatedChats = state.chatConversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              lastMessage: content,
              lastActivity: now,
              status: 'waiting_customer' as const,
              messages: [...c.messages, newMsg],
            }
          : c
      );
      return { chatConversations: updatedChats };
    });

    syncApi(`/api/support/chat/${conversationId}`, 'PATCH', {
      action: 'send_message',
      content,
      agentName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
    });
  },

  assignChat: (conversationId, agentName) => {
    set((state) => ({
      chatConversations: state.chatConversations.map((c) =>
        c.id === conversationId ? { ...c, assignedAgent: agentName, status: 'assigned' as const } : c
      ),
    }));
    get().addToast({
      type: 'success',
      title: 'Chat Assigned',
      message: `Conversation ${conversationId} assigned to ${agentName}.`,
    });

    syncApi(`/api/support/chat/${conversationId}`, 'PATCH', {
      action: 'assign',
      agentName,
    });
  },

  resolveChat: (conversationId) => {
    set((state) => ({
      chatConversations: state.chatConversations.map((c) =>
        c.id === conversationId ? { ...c, status: 'resolved' as const } : c
      ),
    }));
    get().addToast({
      type: 'success',
      title: 'Chat Resolved',
      message: `Conversation ${conversationId} marked as resolved.`,
    });

    syncApi(`/api/support/chat/${conversationId}`, 'PATCH', {
      action: 'resolve',
    });
  },

  convertChatToTicket: (conversationId, details) => {
    const { currentAdmin } = get();
    const chat = get().chatConversations.find((c) => c.id === conversationId);
    if (!chat) throw new Error('Chat not found');

    const ticketId = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    const newTicket: SupportTicket = {
      id: ticketId,
      title: details.title,
      customerId: chat.customerId,
      customerName: chat.customerName,
      category: details.category,
      priority: details.priority,
      status: 'open',
      assignedTeam: details.assignedTeam || 'Customer Experience Desk',
      assignedAgent: currentAdmin.firstName + ' ' + currentAdmin.lastName,
      deliveryId: chat.deliveryId,
      createdAt: now,
      updatedAt: now,
      slaStatus: 'within_sla',
      events: [
        {
          id: `EVT-${Date.now()}`,
          type: 'customer_reply',
          content: `Escalated from Live Chat (${conversationId}). Customer original query: "${chat.lastMessage}"`,
          author: chat.customerName,
          authorRole: 'customer',
          isInternal: false,
          createdAt: now,
        },
        ...chat.messages.slice(-4).map((m, idx) => ({
          id: `EVT-${Date.now() + idx + 1}`,
          type: (m.sender === 'customer' ? 'customer_reply' : 'agent_reply') as any,
          content: m.content,
          author: m.senderName,
          authorRole: m.sender,
          isInternal: false,
          createdAt: m.timestamp,
        })),
      ],
    };

    set((state) => ({
      supportTickets: [newTicket, ...state.supportTickets],
      chatConversations: state.chatConversations.map((c) =>
        c.id === conversationId ? { ...c, status: 'escalated' as const } : c
      ),
    }));

    get().addToast({
      type: 'success',
      title: 'Converted to Ticket',
      message: `Ticket ${ticketId} created with complete chat history retained.`,
    });

    syncApi(`/api/support/chat/${conversationId}`, 'PATCH', {
      action: 'convert_to_ticket',
      ticketDetails: details,
      agentName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
    });

    return ticketId;
  },

  addTicketEvent: (ticketId, eventData) => {
    const { currentAdmin } = get();
    const now = new Date().toISOString();
    const event = {
      id: `EVT-${Date.now()}`,
      ...eventData,
      author: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      authorRole: currentAdmin.role,
      createdAt: now,
    };

    set((state) => {
      const updatedTickets = state.supportTickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              updatedAt: now,
              status: eventData.type === 'agent_reply' ? ('waiting_customer' as const) : t.status,
              events: [...t.events, event],
            }
          : t
      );
      return { supportTickets: updatedTickets };
    });

    get().addToast({
      type: 'info',
      title: eventData.isInternal ? 'Internal Note Saved' : 'Reply Sent to Customer',
      message: eventData.isInternal
        ? 'Note recorded privately for internal administrators.'
        : 'Message delivered to customer channel.',
    });

    syncApi(`/api/support/tickets/${ticketId}`, 'PATCH', {
      action: 'add_event',
      event: eventData,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      adminId: currentAdmin.id,
    });
  },

  assignTicket: (ticketId, agent, team) => {
    set((state) => ({
      supportTickets: state.supportTickets.map((t) =>
        t.id === ticketId ? { ...t, assignedAgent: agent, assignedTeam: team || t.assignedTeam, status: 'in_progress' as const } : t
      ),
    }));
    get().addToast({
      type: 'success',
      title: 'Ticket Assigned',
      message: `Ticket ${ticketId} assigned to ${agent}.`,
    });

    syncApi(`/api/support/tickets/${ticketId}`, 'PATCH', {
      action: 'assign',
      agent,
      team,
    });
  },

  updateTicketStatus: (ticketId, status) => {
    const now = new Date().toISOString();
    set((state) => ({
      supportTickets: state.supportTickets.map((t) =>
        t.id === ticketId ? { ...t, status, updatedAt: now } : t
      ),
    }));

    syncApi(`/api/support/tickets/${ticketId}`, 'PATCH', {
      action: 'update_status',
      status,
    });
  },

  resolveTicket: (ticketId, resolution) => {
    const { currentAdmin } = get();
    const now = new Date().toISOString();
    set((state) => {
      const updatedTickets = state.supportTickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'resolved' as const,
              resolvedAt: now,
              updatedAt: now,
              resolution: {
                ...resolution,
                resolvedBy: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
                resolvedAt: now,
              },
            }
          : t
      );
      const audit: AuditLog = {
        id: `AUD-${Date.now()}`,
        adminId: currentAdmin.id,
        adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
        action: 'support.ticket_resolved',
        targetType: 'SupportTicket',
        targetId: ticketId,
        timestamp: now,
        reason: resolution.summary,
      };
      return {
        supportTickets: updatedTickets,
        auditLogs: [audit, ...state.auditLogs],
      };
    });

    get().addToast({
      type: 'success',
      title: 'Ticket Resolved',
      message: `Ticket ${ticketId} marked as resolved and added to Resolution History.`,
    });

    syncApi(`/api/support/tickets/${ticketId}`, 'PATCH', {
      action: 'resolve',
      resolution,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      adminId: currentAdmin.id,
    });
  },

  // SOS & Safety
  acknowledgeSOS: (incidentId) => {
    const { currentAdmin } = get();
    const now = new Date().toISOString();
    set((state) => ({
      safetyIncidents: state.safetyIncidents.map((i) =>
        i.id === incidentId
          ? {
              ...i,
              status: 'acknowledged' as const,
              assignedTo: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
              updatedAt: now,
              timeline: [
                ...i.timeline,
                {
                  status: 'acknowledged',
                  timestamp: now,
                  actor: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
                  note: 'SOS alert acknowledged by active safety controller',
                },
              ],
            }
          : i
      ),
    }));
    get().addToast({
      type: 'warning',
      title: 'SOS Incident Acknowledged',
      message: `Emergency controller assigned to ${incidentId}.`,
    });

    syncApi(`/api/safety/${incidentId}`, 'PATCH', {
      action: 'acknowledge',
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      adminId: currentAdmin.id,
    });
  },

  assignSOS: (incidentId, adminName) => {
    const now = new Date().toISOString();
    set((state) => ({
      safetyIncidents: state.safetyIncidents.map((i) =>
        i.id === incidentId ? { ...i, assignedTo: adminName, status: 'investigating' as const, updatedAt: now } : i
      ),
    }));
  },

  escalateSOS: (incidentId, notes) => {
    const { currentAdmin } = get();
    const now = new Date().toISOString();
    set((state) => ({
      safetyIncidents: state.safetyIncidents.map((i) =>
        i.id === incidentId
          ? {
              ...i,
              status: 'escalated' as const,
              updatedAt: now,
              timeline: [
                ...i.timeline,
                {
                  status: 'escalated',
                  timestamp: now,
                  actor: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
                  note: `Escalated: ${notes}`,
                },
              ],
            }
          : i
      ),
    }));
    get().addToast({
      type: 'danger',
      title: 'SOS Incident Escalated',
      message: `High-priority escalation dispatched to Operations Director & Trust Lead.`,
    });
  },

  resolveSOS: (incidentId, resolution) => {
    const { currentAdmin } = get();
    const now = new Date().toISOString();
    set((state) => ({
      safetyIncidents: state.safetyIncidents.map((i) =>
        i.id === incidentId
          ? {
              ...i,
              status: 'resolved' as const,
              resolution,
              updatedAt: now,
              timeline: [
                ...i.timeline,
                {
                  status: 'resolved',
                  timestamp: now,
                  actor: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
                  note: `Resolved: ${resolution}`,
                },
              ],
            }
          : i
      ),
    }));
    get().addToast({
      type: 'success',
      title: 'SOS Incident Resolved',
      message: `Incident ${incidentId} closed with complete audit record.`,
    });

    syncApi(`/api/safety/${incidentId}`, 'PATCH', {
      action: 'resolve',
      resolution,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      adminId: currentAdmin.id,
    });
  },

  // Moderation
  assignReport: (reportId, adminName) => {
    set((state) => ({
      moderationReports: state.moderationReports.map((r) =>
        r.id === reportId ? { ...r, assignedTo: adminName, status: 'under_review' as const } : r
      ),
    }));
    get().addToast({
      type: 'info',
      title: 'Report Assigned',
      message: `Report ${reportId} assigned to ${adminName}.`,
    });
  },

  escalateReport: (reportId, reason) => {
    const { currentAdmin } = get();
    const now = new Date().toISOString();
    set((state) => ({
      moderationReports: state.moderationReports.map((r) =>
        r.id === reportId ? { ...r, status: 'escalated' as const, updatedAt: now } : r
      ),
      auditLogs: [
        {
          id: `AUD-${Date.now()}`,
          adminId: currentAdmin.id,
          adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
          action: 'report.escalated',
          targetType: 'ModerationReport',
          targetId: reportId,
          timestamp: now,
          reason,
        },
        ...state.auditLogs,
      ],
    }));
    get().addToast({
      type: 'warning',
      title: 'Report Escalated',
      message: `Report ${reportId} escalated to senior review panel.`,
    });
  },

  takeModerationAction: (reportId, actionType, details) => {
    const { currentAdmin, hasPermission } = get();
    if (!hasPermission('safety.take_action')) {
      get().addToast({ type: 'danger', title: 'Permission Denied', message: 'You do not have permission to take punitive moderation actions.' });
      return;
    }
    const report = get().moderationReports.find((r) => r.id === reportId);
    if (!report) return;

    if (report.reportedUserId) {
      if (actionType === 'suspend') {
        get().suspendUser(report.reportedUserId, details.reason, details.durationDays || 7);
      } else if (actionType === 'ban') {
        get().banUser(report.reportedUserId, details.reason);
      }
    }

    const resolution = `Action taken: ${actionType.toUpperCase()}. Reason: ${details.reason}`;
    get().resolveReport(reportId, resolution);
  },

  resolveReport: (reportId, resolution) => {
    const { currentAdmin } = get();
    const now = new Date().toISOString();
    set((state) => ({
      moderationReports: state.moderationReports.map((r) =>
        r.id === reportId ? { ...r, status: 'resolved' as const, resolution, updatedAt: now } : r
      ),
      auditLogs: [
        {
          id: `AUD-${Date.now()}`,
          adminId: currentAdmin.id,
          adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
          action: 'report.resolved',
          targetType: 'ModerationReport',
          targetId: reportId,
          timestamp: now,
          reason: resolution,
        },
        ...state.auditLogs,
      ],
    }));
    get().addToast({
      type: 'success',
      title: 'Report Resolved',
      message: `${reportId} was resolved and the reporter was notified.`,
    });

    syncApi(`/api/moderation/${reportId}`, 'PATCH', {
      action: 'resolve',
      resolution,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      adminId: currentAdmin.id,
    });
  },

  dismissReport: (reportId, reason) => {
    const { currentAdmin } = get();
    const now = new Date().toISOString();
    set((state) => ({
      moderationReports: state.moderationReports.map((r) =>
        r.id === reportId ? { ...r, status: 'dismissed' as const, resolution: `Dismissed: ${reason}`, updatedAt: now } : r
      ),
      auditLogs: [
        {
          id: `AUD-${Date.now()}`,
          adminId: currentAdmin.id,
          adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
          action: 'report.dismissed',
          targetType: 'ModerationReport',
          targetId: reportId,
          timestamp: now,
          reason,
        },
        ...state.auditLogs,
      ],
    }));
    get().addToast({
      type: 'info',
      title: 'Report Dismissed',
      message: `Report ${reportId} marked as dismissed.`,
    });

    syncApi(`/api/moderation/${reportId}`, 'PATCH', {
      action: 'dismiss',
      notes: reason,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      adminId: currentAdmin.id,
    });
  },

  // Content
  createContentItem: (item) => {
    const { currentAdmin } = get();
    const now = new Date().toISOString();
    const newItem: ContentItem = {
      ...item,
      id: `CNT-${Math.floor(100 + Math.random() * 900)}`,
      author: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ contentItems: [newItem, ...state.contentItems] }));
    get().addToast({
      type: 'success',
      title: 'Content Item Created',
      message: `Draft created for "${item.title}".`,
    });

    syncApi('/api/content', 'POST', {
      ...item,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      adminId: currentAdmin.id,
    });
  },

  updateContentItem: (id, updates) => {
    const now = new Date().toISOString();
    set((state) => ({
      contentItems: state.contentItems.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: now } : c)),
    }));
    get().addToast({
      type: 'success',
      title: 'Content Updated',
      message: `Content item ${id} saved successfully.`,
    });
  },

  publishContentItem: (id) => {
    const { currentAdmin, hasPermission } = get();
    if (!hasPermission('content.publish')) {
      get().addToast({ type: 'danger', title: 'Permission Denied', message: 'You do not have permission to publish content.' });
      return;
    }
    const now = new Date().toISOString();
    set((state) => ({
      contentItems: state.contentItems.map((c) =>
        c.id === id ? { ...c, status: 'published' as const, publishedAt: now, updatedAt: now } : c
      ),
    }));
    get().addToast({
      type: 'success',
      title: 'Content Published',
      message: `Item ${id} is now live to Racvest mobile app and web clients.`,
    });
  },

  archiveContentItem: (id) => {
    const now = new Date().toISOString();
    set((state) => ({
      contentItems: state.contentItems.map((c) => (c.id === id ? { ...c, status: 'archived' as const, updatedAt: now } : c)),
    }));
    get().addToast({
      type: 'info',
      title: 'Content Archived',
      message: `Item ${id} un-published and archived.`,
    });
  },

  // Admins & Roles
  inviteAdmin: (data) => {
    const { currentAdmin, hasPermission } = get();
    if (!hasPermission('admins.invite')) {
      get().addToast({ type: 'danger', title: 'Permission Denied', message: 'You do not have permission to invite administrators.' });
      return { success: false, message: 'Permission denied' };
    }

    // Check duplicate email
    const existsAdmin = get().admins.some((a) => a.email.toLowerCase() === data.email.toLowerCase());
    const existsInvite = get().adminInvitations.some(
      (i) => i.email.toLowerCase() === data.email.toLowerCase() && i.status === 'pending'
    );

    if (existsAdmin) {
      get().addToast({ type: 'danger', title: 'Email Already Exists', message: 'An active administrator with this email already exists.' });
      return { success: false, message: 'Admin email already exists' };
    }
    if (existsInvite) {
      get().addToast({ type: 'warning', title: 'Pending Invitation Exists', message: 'An invitation is already pending for this email address.' });
      return { success: false, message: 'Pending invitation already exists' };
    }

    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const newInvite: AdminInvitation = {
      id: `INV-${Math.floor(100 + Math.random() * 900)}`,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      department: data.department,
      role: data.role,
      status: 'pending',
      invitedBy: currentAdmin.id,
      invitedByName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      invitedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };

    set((state) => ({
      adminInvitations: [newInvite, ...state.adminInvitations],
      auditLogs: [
        {
          id: `AUD-${Date.now()}`,
          adminId: currentAdmin.id,
          adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
          action: 'admin.invited',
          targetType: 'AdminInvitation',
          targetId: newInvite.id,
          timestamp: now.toISOString(),
          reason: `Invited ${data.firstName} ${data.lastName} as ${data.role}`,
        },
        ...state.auditLogs,
      ],
    }));

    get().addToast({
      type: 'success',
      title: 'Invitation Sent',
      message: `Invitation email queued for ${data.email} with 7-day secure token.`,
    });

    syncApi('/api/admins', 'POST', {
      ...data,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      adminId: currentAdmin.id,
    });

    return { success: true, message: 'Invitation sent' };
  },

  resendInvitation: (invitationId) => {
    const invite = get().adminInvitations.find((i) => i.id === invitationId);
    if (!invite) return;
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    set((state) => ({
      adminInvitations: state.adminInvitations.map((i) =>
        i.id === invitationId
          ? {
              ...i,
              status: 'pending' as const,
              invitedAt: now.toISOString(),
              expiresAt: expires.toISOString(),
            }
          : i
      ),
    }));

    get().addToast({
      type: 'info',
      title: 'Invitation Resent',
      message: `Fresh invitation link sent to ${invite.email}.`,
    });
  },

  revokeInvitation: (invitationId) => {
    set((state) => ({
      adminInvitations: state.adminInvitations.map((i) =>
        i.id === invitationId ? { ...i, status: 'revoked' as const } : i
      ),
    }));
    get().addToast({
      type: 'warning',
      title: 'Invitation Revoked',
      message: `Invitation token invalidated.`,
    });
  },

  updateAdminRole: (adminId, newRole) => {
    const { currentAdmin, hasPermission } = get();
    if (!hasPermission('admins.roles')) {
      get().addToast({ type: 'danger', title: 'Permission Denied', message: 'You do not have permission to modify administrator roles.' });
      return { success: false, message: 'Permission denied' };
    }

    // PRD Section 15.5: Safeguard: A Super Admin must not be able to accidentally remove the final required Super Admin account
    const superAdmins = get().admins.filter((a) => a.role === 'super_admin' && a.status === 'active');
    const targetAdmin = get().admins.find((a) => a.id === adminId);
    if (targetAdmin?.role === 'super_admin' && superAdmins.length <= 1 && newRole !== 'super_admin') {
      get().addToast({
        type: 'danger',
        title: 'Safeguard Blocked Change',
        message: 'Cannot demote the last remaining active Super Admin. Assign another Super Admin first.',
      });
      return { success: false, message: 'Cannot demote last Super Admin' };
    }

    const newPermissions = get().roleConfigs.find((r) => r.name === newRole)?.permissions || [];
    const now = new Date().toISOString();

    set((state) => {
      const updatedAdmins = state.admins.map((a) =>
        a.id === adminId ? { ...a, role: newRole, permissions: newPermissions } : a
      );
      const audit: AuditLog = {
        id: `AUD-${Date.now()}`,
        adminId: currentAdmin.id,
        adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
        action: 'admin.role_changed',
        targetType: 'Admin',
        targetId: adminId,
        timestamp: now,
        previousValue: { role: targetAdmin?.role },
        newValue: { role: newRole },
        reason: `Role changed to ${newRole}`,
      };
      return {
        admins: updatedAdmins,
        auditLogs: [audit, ...state.auditLogs],
        currentAdmin: state.currentAdmin.id === adminId ? { ...state.currentAdmin, role: newRole, permissions: newPermissions } : state.currentAdmin,
      };
    });

    get().addToast({
      type: 'success',
      title: 'Admin Role Updated',
      message: `Administrator ${targetAdmin?.firstName} ${targetAdmin?.lastName} assigned role ${newRole.toUpperCase()}.`,
    });

    syncApi(`/api/admins/${adminId}`, 'PATCH', {
      action: 'update_role',
      role: newRole,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      adminId: currentAdmin.id,
    });

    return { success: true, message: 'Role updated' };
  },

  toggleAdminStatus: (adminId, status) => {
    const targetAdmin = get().admins.find((a) => a.id === adminId);
    if (targetAdmin?.role === 'super_admin' && status === 'suspended') {
      const superAdmins = get().admins.filter((a) => a.role === 'super_admin' && a.status === 'active');
      if (superAdmins.length <= 1) {
        get().addToast({
          type: 'danger',
          title: 'Action Blocked',
          message: 'Cannot suspend the last remaining active Super Admin.',
        });
        return { success: false, message: 'Cannot suspend last Super Admin' };
      }
    }

    const now = new Date().toISOString();
    set((state) => ({
      admins: state.admins.map((a) => (a.id === adminId ? { ...a, status } : a)),
      auditLogs: [
        {
          id: `AUD-${Date.now()}`,
          adminId: state.currentAdmin.id,
          adminName: `${state.currentAdmin.firstName} ${state.currentAdmin.lastName}`,
          action: `admin.${status}`,
          targetType: 'Admin',
          targetId: adminId,
          timestamp: now,
          reason: `Admin account marked as ${status}`,
        },
        ...state.auditLogs,
      ],
    }));

    get().addToast({
      type: status === 'active' ? 'success' : 'warning',
      title: `Administrator ${status === 'active' ? 'Activated' : 'Suspended'}`,
      message: `Account status updated for ${targetAdmin?.firstName} ${targetAdmin?.lastName}.`,
    });

    syncApi(`/api/admins/${adminId}`, 'PATCH', {
      action: 'update_status',
      status,
      adminName: `${get().currentAdmin.firstName} ${get().currentAdmin.lastName}`,
      adminId: get().currentAdmin.id,
    });

    return { success: true, message: 'Status updated' };
  },

  // Settings & Integrations
  updateSetting: (key, value) => {
    const { currentAdmin, hasPermission } = get();
    if (!hasPermission('settings.edit')) {
      get().addToast({ type: 'danger', title: 'Permission Denied', message: 'You do not have permission to alter system configuration.' });
      return;
    }
    const now = new Date().toISOString();
    set((state) => ({
      systemSettings: state.systemSettings.map((s) =>
        s.key === key ? { ...s, value, updatedAt: now, updatedBy: currentAdmin.firstName + ' ' + currentAdmin.lastName } : s
      ),
      auditLogs: [
        {
          id: `AUD-${Date.now()}`,
          adminId: currentAdmin.id,
          adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
          action: 'settings.updated',
          targetType: 'SystemSetting',
          targetId: key,
          timestamp: now,
          newValue: { value },
          reason: `Config key "${key}" modified`,
        },
        ...state.auditLogs,
      ],
    }));

    get().addToast({
      type: 'success',
      title: 'Configuration Saved',
      message: `Platform setting "${key}" updated successfully.`,
    });

    syncApi('/api/settings', 'PATCH', {
      action: 'update_setting',
      key,
      value,
      adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
      adminId: currentAdmin.id,
    });
  },

  testIntegration: (id) => {
    const config = get().integrationConfigs.find((c) => c.id === id);
    if (!config) return { success: false, message: 'Integration not found' };

    const now = new Date().toISOString();
    // Simulate ping to integration
    if (config.status === 'not_configured') {
      get().addToast({
        type: 'warning',
        title: 'Integration Not Configured',
        message: `${config.name} credentials are missing. Add API keys in environment or configuration vault.`,
      });
      return { success: false, message: 'Not configured' };
    }

    set((state) => ({
      integrationConfigs: state.integrationConfigs.map((c) =>
        c.id === id ? { ...c, status: 'connected' as const, lastSuccessAt: now } : c
      ),
    }));

    get().addToast({
      type: 'success',
      title: 'Connection Successful',
      message: `Ping to ${config.name} API endpoint verified. HTTP 200 OK (Latency: 142ms).`,
    });

    return { success: true, message: 'Connected' };
  },

  updateNotificationTemplate: (id, updates) => {
    const now = new Date().toISOString();
    set((state) => ({
      notificationTemplates: state.notificationTemplates.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: now } : t
      ),
    }));
    get().addToast({
      type: 'success',
      title: 'Template Saved',
      message: `Notification template updated.`,
    });
  },
}));
