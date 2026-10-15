// Master Seed Data for Racvest Admin Dashboard
// Exports comprehensive realistic Nigerian seed data matching all application modules.

import { admins, adminInvitations, roleConfigs } from './admins';
import { users, userVerifications } from './users';
import { deliveries, tripDeclarations, offers, matches } from './deliveries';
import { transactions, refunds, payouts } from './finance';
import { supportTickets, chatConversations } from './support';
import { moderationReports, safetyIncidents, auditLogs } from './moderation';
import { contentItems, systemSettings, integrationConfigs, notificationTemplates } from './system';
import { dashboardMetrics } from './metrics';

export * from './admins';
export * from './users';
export * from './deliveries';
export * from './finance';
export * from './support';
export * from './moderation';
export * from './system';
export * from './metrics';

// Canonical INITIAL_* exports for database seed initialization
export const INITIAL_USERS = users;
export const INITIAL_VERIFICATIONS = userVerifications;
export const INITIAL_DELIVERIES = deliveries;
export const INITIAL_TRIPS = tripDeclarations;
export const INITIAL_OFFERS = offers;
export const INITIAL_MATCHES = matches;
export const INITIAL_TRANSACTIONS = transactions;
export const INITIAL_REFUNDS = refunds;
export const INITIAL_PAYOUTS = payouts;
export const INITIAL_TICKETS = supportTickets;
export const INITIAL_CHATS = chatConversations;
export const INITIAL_SOS = safetyIncidents;
export const INITIAL_REPORTS = moderationReports;
export const INITIAL_ADMINS = admins;
export const INITIAL_INVITATIONS = adminInvitations;
export const INITIAL_SETTINGS = systemSettings;
export const INITIAL_AUDIT_LOGS = auditLogs;
export const INITIAL_CONTENT = contentItems;
export const INITIAL_ROLE_CONFIGS = roleConfigs;
export const INITIAL_INTEGRATIONS = integrationConfigs;
export const INITIAL_NOTIFICATIONS = notificationTemplates;

