import fs from 'fs';
import path from 'path';
import {
  User,
  UserVerification,
  Delivery,
  TripDeclaration,
  Offer,
  Match,
  Transaction,
  Refund,
  Payout,
  SupportTicket,
  ChatConversation,
  ModerationReport,
  SafetyIncident,
  ContentItem,
  Admin,
  AdminInvitation,
  RoleConfig,
  AuditLog,
  SystemSetting,
  IntegrationConfig,
  NotificationTemplate,
} from '@/types';
import {
  INITIAL_USERS,
  INITIAL_VERIFICATIONS,
  INITIAL_DELIVERIES,
  INITIAL_TRIPS,
  INITIAL_OFFERS,
  INITIAL_MATCHES,
  INITIAL_TRANSACTIONS,
  INITIAL_REFUNDS,
  INITIAL_PAYOUTS,
  INITIAL_TICKETS,
  INITIAL_CHATS,
  INITIAL_SOS,
  INITIAL_REPORTS,
  INITIAL_ADMINS,
  INITIAL_INVITATIONS,
  INITIAL_SETTINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CONTENT,
  INITIAL_ROLE_CONFIGS,
  INITIAL_INTEGRATIONS,
  INITIAL_NOTIFICATIONS,
} from '@/lib/data/seed-data';

export interface RacvestDatabaseSchema {
  users: User[];
  userVerifications: UserVerification[];
  deliveries: Delivery[];
  trips: TripDeclaration[];
  offers: Offer[];
  matches: Match[];
  transactions: Transaction[];
  refunds: Refund[];
  payouts: Payout[];
  supportTickets: SupportTicket[];
  chatConversations: ChatConversation[];
  moderationReports: ModerationReport[];
  safetyIncidents: SafetyIncident[];
  contentItems: ContentItem[];
  admins: Admin[];
  adminInvitations: AdminInvitation[];
  roleConfigs: RoleConfig[];
  auditLogs: AuditLog[];
  systemSettings: SystemSetting[];
  integrationConfigs: IntegrationConfig[];
  notificationTemplates: NotificationTemplate[];
}

// Global cached instance to avoid re-reading disk unnecessarily in long-running processes
let memoryDb: RacvestDatabaseSchema | null = null;

function getDbFilePath(): string {
  // Use project root .data folder, fallback to temp dir if read-only serverless environment
  const primaryDir = path.join(process.cwd(), '.data');
  try {
    if (!fs.existsSync(primaryDir)) {
      fs.mkdirSync(primaryDir, { recursive: true });
    }
    return path.join(primaryDir, 'racvest-db.json');
  } catch {
    const tmpDir = path.join(process.platform === 'win32' ? process.env.TEMP || 'C:\\Windows\\Temp' : '/tmp', 'racvest');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    return path.join(tmpDir, 'racvest-db.json');
  }
}

function getInitialDatabaseState(): RacvestDatabaseSchema {
  return {
    users: INITIAL_USERS,
    userVerifications: INITIAL_VERIFICATIONS,
    deliveries: INITIAL_DELIVERIES,
    trips: INITIAL_TRIPS,
    offers: INITIAL_OFFERS,
    matches: INITIAL_MATCHES,
    transactions: INITIAL_TRANSACTIONS,
    refunds: INITIAL_REFUNDS,
    payouts: INITIAL_PAYOUTS,
    supportTickets: INITIAL_TICKETS,
    chatConversations: INITIAL_CHATS,
    moderationReports: INITIAL_REPORTS,
    safetyIncidents: INITIAL_SOS,
    contentItems: INITIAL_CONTENT,
    admins: INITIAL_ADMINS,
    adminInvitations: INITIAL_INVITATIONS,
    roleConfigs: INITIAL_ROLE_CONFIGS,
    auditLogs: INITIAL_AUDIT_LOGS,
    systemSettings: INITIAL_SETTINGS,
    integrationConfigs: INITIAL_INTEGRATIONS,
    notificationTemplates: INITIAL_NOTIFICATIONS,
  };
}

export function getDb(): RacvestDatabaseSchema {
  if (memoryDb) {
    return memoryDb;
  }

  const filePath = getDbFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      memoryDb = JSON.parse(raw);
      return memoryDb!;
    }
  } catch (err) {
    console.error('Error reading database file, resetting to initial state:', err);
  }

  // Initialize and persist initial seed
  memoryDb = getInitialDatabaseState();
  saveDb(memoryDb);
  return memoryDb;
}

export function saveDb(data: RacvestDatabaseSchema): void {
  memoryDb = data;
  const filePath = getDbFilePath();
  const tempPath = `${filePath}.${Date.now()}.tmp`;

  try {
    const serialized = JSON.stringify(data, null, 2);
    fs.writeFileSync(tempPath, serialized, 'utf-8');
    // Atomic rename
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    // Fallback if atomic rename fails on Windows lock
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (fallbackErr) {
      console.error('Failed to save database file:', fallbackErr);
    }
  }
}

// Typed Database Accessors and Business Logic Methods
export const db = {
  // Database status & reset
  raw: () => getDb(),
  reset: () => {
    const fresh = getInitialDatabaseState();
    saveDb(fresh);
    return fresh;
  },

  // USERS
  users: {
    findMany: (filter?: (u: User) => boolean): User[] => {
      const state = getDb();
      return filter ? state.users.filter(filter) : state.users;
    },
    findById: (id: string): User | undefined => {
      return getDb().users.find((u) => u.id === id);
    },
    create: (user: User): User => {
      const state = getDb();
      state.users.unshift(user);
      saveDb(state);
      return user;
    },
    update: (id: string, updates: Partial<User>): User | null => {
      const state = getDb();
      const index = state.users.findIndex((u) => u.id === id);
      if (index === -1) return null;
      state.users[index] = { ...state.users[index], ...updates };
      saveDb(state);
      return state.users[index];
    },
    delete: (id: string): boolean => {
      const state = getDb();
      const index = state.users.findIndex((u) => u.id === id);
      if (index === -1) return false;
      state.users.splice(index, 1);
      saveDb(state);
      return true;
    },
  },

  // USER VERIFICATIONS / KYC
  verifications: {
    findMany: (): UserVerification[] => getDb().userVerifications,
    findByUserId: (userId: string): UserVerification | undefined => {
      return getDb().userVerifications.find((v) => v.userId === userId);
    },
    update: (userId: string, updates: Partial<UserVerification>): UserVerification | null => {
      const state = getDb();
      const index = state.userVerifications.findIndex((v) => v.userId === userId);
      if (index === -1) return null;
      state.userVerifications[index] = { ...state.userVerifications[index], ...updates };
      saveDb(state);
      return state.userVerifications[index];
    },
  },

  // DELIVERIES & SHIPMENTS
  deliveries: {
    findMany: (filter?: (d: Delivery) => boolean): Delivery[] => {
      const state = getDb();
      return filter ? state.deliveries.filter(filter) : state.deliveries;
    },
    findById: (id: string): Delivery | undefined => {
      return getDb().deliveries.find((d) => d.id === id);
    },
    create: (delivery: Delivery): Delivery => {
      const state = getDb();
      state.deliveries.unshift(delivery);
      saveDb(state);
      return delivery;
    },
    update: (id: string, updates: Partial<Delivery>): Delivery | null => {
      const state = getDb();
      const index = state.deliveries.findIndex((d) => d.id === id);
      if (index === -1) return null;
      state.deliveries[index] = { ...state.deliveries[index], ...updates };
      saveDb(state);
      return state.deliveries[index];
    },
  },

  // TRAVELLER TRIPS
  trips: {
    findMany: (): TripDeclaration[] => getDb().trips,
    create: (trip: TripDeclaration): TripDeclaration => {
      const state = getDb();
      state.trips.unshift(trip);
      saveDb(state);
      return trip;
    },
    update: (id: string, updates: Partial<TripDeclaration>): TripDeclaration | null => {
      const state = getDb();
      const index = state.trips.findIndex((t) => t.id === id);
      if (index === -1) return null;
      state.trips[index] = { ...state.trips[index], ...updates };
      saveDb(state);
      return state.trips[index];
    },
  },

  // BIDS & OFFERS
  offers: {
    findMany: (): Offer[] => getDb().offers,
    create: (offer: Offer): Offer => {
      const state = getDb();
      state.offers.unshift(offer);
      saveDb(state);
      return offer;
    },
    update: (id: string, updates: Partial<Offer>): Offer | null => {
      const state = getDb();
      const index = state.offers.findIndex((o) => o.id === id);
      if (index === -1) return null;
      state.offers[index] = { ...state.offers[index], ...updates };
      saveDb(state);
      return state.offers[index];
    },
  },

  // MATCHES
  matches: {
    findMany: (): Match[] => getDb().matches,
    create: (match: Match): Match => {
      const state = getDb();
      state.matches.unshift(match);
      saveDb(state);
      return match;
    },
    update: (id: string, updates: Partial<Match>): Match | null => {
      const state = getDb();
      const index = state.matches.findIndex((m) => m.id === id);
      if (index === -1) return null;
      state.matches[index] = { ...state.matches[index], ...updates };
      saveDb(state);
      return state.matches[index];
    },
  },

  // TRANSACTIONS
  transactions: {
    findMany: (filter?: (t: Transaction) => boolean): Transaction[] => {
      const state = getDb();
      return filter ? state.transactions.filter(filter) : state.transactions;
    },
    findById: (id: string): Transaction | undefined => {
      return getDb().transactions.find((t) => t.id === id);
    },
    create: (txn: Transaction): Transaction => {
      const state = getDb();
      state.transactions.unshift(txn);
      saveDb(state);
      return txn;
    },
  },

  // REFUNDS
  refunds: {
    findMany: (filter?: (r: Refund) => boolean): Refund[] => {
      const state = getDb();
      return filter ? state.refunds.filter(filter) : state.refunds;
    },
    findById: (id: string): Refund | undefined => {
      return getDb().refunds.find((r) => r.id === id);
    },
    create: (refund: Refund): Refund => {
      const state = getDb();
      state.refunds.unshift(refund);
      saveDb(state);
      return refund;
    },
    update: (id: string, updates: Partial<Refund>): Refund | null => {
      const state = getDb();
      const index = state.refunds.findIndex((r) => r.id === id);
      if (index === -1) return null;
      state.refunds[index] = { ...state.refunds[index], ...updates };
      saveDb(state);
      return state.refunds[index];
    },
  },

  // PAYOUTS
  payouts: {
    findMany: (filter?: (p: Payout) => boolean): Payout[] => {
      const state = getDb();
      return filter ? state.payouts.filter(filter) : state.payouts;
    },
    findById: (id: string): Payout | undefined => {
      return getDb().payouts.find((p) => p.id === id);
    },
    create: (payout: Payout): Payout => {
      const state = getDb();
      state.payouts.unshift(payout);
      saveDb(state);
      return payout;
    },
    update: (id: string, updates: Partial<Payout>): Payout | null => {
      const state = getDb();
      const index = state.payouts.findIndex((p) => p.id === id);
      if (index === -1) return null;
      state.payouts[index] = { ...state.payouts[index], ...updates };
      saveDb(state);
      return state.payouts[index];
    },
  },

  // SUPPORT TICKETS
  supportTickets: {
    findMany: (filter?: (t: SupportTicket) => boolean): SupportTicket[] => {
      const state = getDb();
      return filter ? state.supportTickets.filter(filter) : state.supportTickets;
    },
    findById: (id: string): SupportTicket | undefined => {
      return getDb().supportTickets.find((t) => t.id === id);
    },
    create: (ticket: SupportTicket): SupportTicket => {
      const state = getDb();
      state.supportTickets.unshift(ticket);
      saveDb(state);
      return ticket;
    },
    update: (id: string, updates: Partial<SupportTicket>): SupportTicket | null => {
      const state = getDb();
      const index = state.supportTickets.findIndex((t) => t.id === id);
      if (index === -1) return null;
      state.supportTickets[index] = { ...state.supportTickets[index], ...updates };
      saveDb(state);
      return state.supportTickets[index];
    },
  },

  // LIVE CHAT
  chatConversations: {
    findMany: (): ChatConversation[] => getDb().chatConversations,
    findById: (id: string): ChatConversation | undefined => {
      return getDb().chatConversations.find((c) => c.id === id);
    },
    update: (id: string, updates: Partial<ChatConversation>): ChatConversation | null => {
      const state = getDb();
      const index = state.chatConversations.findIndex((c) => c.id === id);
      if (index === -1) return null;
      state.chatConversations[index] = { ...state.chatConversations[index], ...updates };
      saveDb(state);
      return state.chatConversations[index];
    },
  },

  // MODERATION REPORTS
  moderationReports: {
    findMany: (filter?: (r: ModerationReport) => boolean): ModerationReport[] => {
      const state = getDb();
      return filter ? state.moderationReports.filter(filter) : state.moderationReports;
    },
    findById: (id: string): ModerationReport | undefined => {
      return getDb().moderationReports.find((r) => r.id === id);
    },
    update: (id: string, updates: Partial<ModerationReport>): ModerationReport | null => {
      const state = getDb();
      const index = state.moderationReports.findIndex((r) => r.id === id);
      if (index === -1) return null;
      state.moderationReports[index] = { ...state.moderationReports[index], ...updates };
      saveDb(state);
      return state.moderationReports[index];
    },
  },

  // SAFETY & SOS INCIDENTS
  safetyIncidents: {
    findMany: (): SafetyIncident[] => getDb().safetyIncidents,
    findById: (id: string): SafetyIncident | undefined => {
      return getDb().safetyIncidents.find((s) => s.id === id);
    },
    update: (id: string, updates: Partial<SafetyIncident>): SafetyIncident | null => {
      const state = getDb();
      const index = state.safetyIncidents.findIndex((s) => s.id === id);
      if (index === -1) return null;
      state.safetyIncidents[index] = { ...state.safetyIncidents[index], ...updates };
      saveDb(state);
      return state.safetyIncidents[index];
    },
  },

  // CONTENT ITEMS
  contentItems: {
    findMany: (): ContentItem[] => getDb().contentItems,
    findById: (id: string): ContentItem | undefined => {
      return getDb().contentItems.find((c) => c.id === id);
    },
    create: (item: ContentItem): ContentItem => {
      const state = getDb();
      state.contentItems.unshift(item);
      saveDb(state);
      return item;
    },
    update: (id: string, updates: Partial<ContentItem>): ContentItem | null => {
      const state = getDb();
      const index = state.contentItems.findIndex((c) => c.id === id);
      if (index === -1) return null;
      state.contentItems[index] = { ...state.contentItems[index], ...updates };
      saveDb(state);
      return state.contentItems[index];
    },
    delete: (id: string): boolean => {
      const state = getDb();
      const index = state.contentItems.findIndex((c) => c.id === id);
      if (index === -1) return false;
      state.contentItems.splice(index, 1);
      saveDb(state);
      return true;
    },
  },

  // ADMINS
  admins: {
    findMany: (): Admin[] => getDb().admins,
    findById: (id: string): Admin | undefined => {
      return getDb().admins.find((a) => a.id === id);
    },
    create: (admin: Admin): Admin => {
      const state = getDb();
      state.admins.push(admin);
      saveDb(state);
      return admin;
    },
    update: (id: string, updates: Partial<Admin>): Admin | null => {
      const state = getDb();
      const index = state.admins.findIndex((a) => a.id === id);
      if (index === -1) return null;
      state.admins[index] = { ...state.admins[index], ...updates };
      saveDb(state);
      return state.admins[index];
    },
  },

  // ADMIN INVITATIONS
  adminInvitations: {
    findMany: (): AdminInvitation[] => getDb().adminInvitations,
    findById: (id: string): AdminInvitation | undefined => {
      return getDb().adminInvitations.find((i) => i.id === id);
    },
    create: (invitation: AdminInvitation): AdminInvitation => {
      const state = getDb();
      state.adminInvitations.unshift(invitation);
      saveDb(state);
      return invitation;
    },
    update: (id: string, updates: Partial<AdminInvitation>): AdminInvitation | null => {
      const state = getDb();
      const index = state.adminInvitations.findIndex((i) => i.id === id);
      if (index === -1) return null;
      state.adminInvitations[index] = { ...state.adminInvitations[index], ...updates };
      saveDb(state);
      return state.adminInvitations[index];
    },
  },

  // AUDIT LOGS
  auditLogs: {
    findMany: (limit = 100): AuditLog[] => {
      return getDb().auditLogs.slice(0, limit);
    },
    create: (log: AuditLog): AuditLog => {
      const state = getDb();
      state.auditLogs.unshift(log);
      saveDb(state);
      return log;
    },
  },

  // SYSTEM SETTINGS
  systemSettings: {
    findMany: (): SystemSetting[] => getDb().systemSettings,
    update: (key: string, value: string | number | boolean, adminName: string): SystemSetting | null => {
      const state = getDb();
      const index = state.systemSettings.findIndex((s) => s.key === key);
      if (index === -1) return null;
      state.systemSettings[index] = {
        ...state.systemSettings[index],
        value,
        updatedBy: adminName,
        updatedAt: new Date().toISOString(),
      };
      saveDb(state);
      return state.systemSettings[index];
    },
  },

  // ROLE CONFIGS
  roleConfigs: {
    findMany: (): RoleConfig[] => getDb().roleConfigs,
  },

  // INTEGRATION CONFIGS
  integrations: {
    findMany: (): IntegrationConfig[] => getDb().integrationConfigs,
    update: (id: string, updates: Partial<IntegrationConfig>): IntegrationConfig | null => {
      const state = getDb();
      const index = state.integrationConfigs.findIndex((ic) => ic.id === id);
      if (index === -1) return null;
      state.integrationConfigs[index] = { ...state.integrationConfigs[index], ...updates };
      saveDb(state);
      return state.integrationConfigs[index];
    },
  },

  // NOTIFICATION TEMPLATES
  notifications: {
    findMany: (): NotificationTemplate[] => getDb().notificationTemplates,
    update: (id: string, updates: Partial<NotificationTemplate>): NotificationTemplate | null => {
      const state = getDb();
      const index = state.notificationTemplates.findIndex((nt) => nt.id === id);
      if (index === -1) return null;
      state.notificationTemplates[index] = { ...state.notificationTemplates[index], ...updates };
      saveDb(state);
      return state.notificationTemplates[index];
    },
  },
};
