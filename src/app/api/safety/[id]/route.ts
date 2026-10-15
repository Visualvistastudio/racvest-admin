import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { IncidentStatus } from '@/types';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const incident = db.safetyIncidents.findById(id);
    if (!incident) return apiError(`Safety incident not found: ${id}`, 404);
    return apiSuccess(incident);
  } catch (error) {
    console.error('Error fetching safety incident:', error);
    return apiError('Failed to fetch incident', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const incident = db.safetyIncidents.findById(id);
    if (!incident) return apiError(`Safety incident not found: ${id}`, 404);

    const body = await request.json();
    const { action, status, note, resolution, adminName, adminId } = body;
    const actor = adminName || 'Trust & Safety Emergency Officer';
    const now = new Date().toISOString();
    const previousState = { ...incident };

    if (action === 'acknowledge') {
      const updated = db.safetyIncidents.update(id, {
        status: 'acknowledged',
        assignedTo: actor,
        updatedAt: now,
        timeline: [
          ...incident.timeline,
          {
            status: 'acknowledged',
            timestamp: now,
            actor,
            note: note || `Emergency acknowledged by ${actor}. Emergency dispatch initiated.`,
          },
        ],
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-005',
        adminName: actor,
        action: 'safety.sos_acknowledged',
        targetType: 'SafetyIncident',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status },
        newValue: { status: 'acknowledged' },
      });

      return apiSuccess(updated);
    }

    if (action === 'update_status') {
      if (!status) return apiError('Status is required', 400);

      const updated = db.safetyIncidents.update(id, {
        status: status as IncidentStatus,
        assignedTo: incident.assignedTo || actor,
        updatedAt: now,
        timeline: [
          ...incident.timeline,
          {
            status,
            timestamp: now,
            actor,
            note: note || `Status changed to ${status}`,
          },
        ],
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-005',
        adminName: actor,
        action: 'safety.incident_status_changed',
        targetType: 'SafetyIncident',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status },
        newValue: { status },
        reason: note,
      });

      return apiSuccess(updated);
    }

    if (action === 'resolve') {
      if (!resolution) return apiError('Resolution notes are required', 400);

      const updated = db.safetyIncidents.update(id, {
        status: 'resolved',
        resolution,
        updatedAt: now,
        timeline: [
          ...incident.timeline,
          {
            status: 'resolved',
            timestamp: now,
            actor,
            note: `Incident resolved: ${resolution}`,
          },
        ],
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-005',
        adminName: actor,
        action: 'safety.incident_resolved',
        targetType: 'SafetyIncident',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status },
        newValue: { status: 'resolved', resolution },
        reason: resolution,
      });

      return apiSuccess(updated);
    }

    return apiError('Unrecognized safety action', 400);
  } catch (error) {
    console.error('Error modifying safety incident:', error);
    return apiError('Failed to modify incident', 500);
  }
}
