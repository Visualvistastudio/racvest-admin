import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rawData = db.raw();
    return apiSuccess({
      users: rawData.users,
      userVerifications: rawData.userVerifications,
      deliveries: rawData.deliveries,
      trips: rawData.trips,
      offers: rawData.offers,
      matches: rawData.matches,
      transactions: rawData.transactions,
      refunds: rawData.refunds,
      payouts: rawData.payouts,
      supportTickets: rawData.supportTickets,
      chatConversations: rawData.chatConversations,
      moderationReports: rawData.moderationReports,
      safetyIncidents: rawData.safetyIncidents,
      contentItems: rawData.contentItems,
      admins: rawData.admins,
      adminInvitations: rawData.adminInvitations,
      roleConfigs: rawData.roleConfigs,
      auditLogs: rawData.auditLogs,
      systemSettings: rawData.systemSettings,
      integrationConfigs: rawData.integrationConfigs,
      notificationTemplates: rawData.notificationTemplates,
    });
  } catch (error) {
    console.error('Failed to bootstrap database:', error);
    return NextResponse.json({ success: false, error: 'Database bootstrap failure' }, { status: 500 });
  }
}
