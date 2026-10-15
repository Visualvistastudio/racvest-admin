import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const report = db.moderationReports.findById(id);
    if (!report) return apiError(`Report not found: ${id}`, 404);
    return apiSuccess(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    return apiError('Failed to fetch report', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const report = db.moderationReports.findById(id);
    if (!report) return apiError(`Report not found: ${id}`, 404);

    const body = await request.json();
    const { action, resolution, notes, adminName, adminId, punitiveAction } = body;
    const actor = adminName || 'Trust & Safety Officer';
    const now = new Date().toISOString();
    const previousState = { ...report };

    if (action === 'resolve') {
      const updated = db.moderationReports.update(id, {
        status: 'resolved',
        resolution: resolution || notes || 'Report reviewed and determined compliant.',
        assignedTo: actor,
        updatedAt: now,
      });

      // Handle punitive actions if requested (e.g. suspend or ban user)
      if (punitiveAction && report.reportedUserId) {
        if (punitiveAction.type === 'suspend') {
          db.users.update(report.reportedUserId, {
            accountStatus: 'suspended',
            suspendedReason: `Suspended following moderation report ${id}: ${punitiveAction.reason || 'Safety guideline violation'}`,
          });
        } else if (punitiveAction.type === 'ban') {
          db.users.update(report.reportedUserId, {
            accountStatus: 'banned',
            bannedReason: `Banned following moderation report ${id}: ${punitiveAction.reason || 'Severe safety violation'}`,
            riskLevel: 'danger',
          });
        }
      }

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-005',
        adminName: actor,
        action: 'moderation.report_resolved',
        targetType: 'ModerationReport',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status },
        newValue: { status: 'resolved', resolution, punitiveAction },
        reason: notes || resolution,
      });

      return apiSuccess(updated);
    }

    if (action === 'dismiss') {
      const updated = db.moderationReports.update(id, {
        status: 'dismissed',
        resolution: resolution || notes || 'Dismissed as unsubstantiated or false report.',
        assignedTo: actor,
        updatedAt: now,
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-005',
        adminName: actor,
        action: 'moderation.report_dismissed',
        targetType: 'ModerationReport',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status },
        newValue: { status: 'dismissed' },
        reason: notes,
      });

      return apiSuccess(updated);
    }

    if (action === 'escalate') {
      const updated = db.moderationReports.update(id, {
        status: 'escalated',
        severity: 'critical',
        assignedTo: actor,
        updatedAt: now,
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-005',
        adminName: actor,
        action: 'moderation.report_escalated',
        targetType: 'ModerationReport',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status, severity: previousState.severity },
        newValue: { status: 'escalated', severity: 'critical' },
      });

      return apiSuccess(updated);
    }

    return apiError('Unrecognized moderation action', 400);
  } catch (error) {
    console.error('Error modifying moderation report:', error);
    return apiError('Failed to modify report', 500);
  }
}
