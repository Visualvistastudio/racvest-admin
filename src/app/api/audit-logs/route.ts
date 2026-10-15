import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { AuditLog } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const targetType = searchParams.get('targetType');
    const adminId = searchParams.get('adminId');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let logs = db.auditLogs.findMany(limit);

    if (search) {
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes(search) ||
          l.adminName.toLowerCase().includes(search) ||
          l.targetId.toLowerCase().includes(search) ||
          (l.reason && l.reason.toLowerCase().includes(search))
      );
    }

    if (targetType) {
      logs = logs.filter((l) => l.targetType.toLowerCase() === targetType.toLowerCase());
    }

    if (adminId) {
      logs = logs.filter((l) => l.adminId === adminId);
    }

    return apiSuccess(logs, { total: logs.length });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return apiError('Failed to fetch audit logs', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, adminName, action, targetType, targetId, previousValue, newValue, reason } = body;

    if (!adminId || !adminName || !action || !targetType || !targetId) {
      return apiError('Missing required audit log parameters', 400);
    }

    const newLog: AuditLog = {
      id: `AUD-${Date.now()}`,
      adminId,
      adminName,
      action,
      targetType,
      targetId,
      timestamp: new Date().toISOString(),
      previousValue,
      newValue,
      reason,
    };

    const created = db.auditLogs.create(newLog);
    return apiSuccess(created, undefined, 201);
  } catch (error) {
    console.error('Error creating audit log:', error);
    return apiError('Failed to record audit log', 500);
  }
}
