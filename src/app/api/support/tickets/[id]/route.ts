import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { SupportTicket, TicketEvent, TicketStatus } from '@/types';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const ticket = db.supportTickets.findById(id);
    if (!ticket) return apiError(`Ticket not found: ${id}`, 404);
    return apiSuccess(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return apiError('Failed to fetch ticket', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const ticket = db.supportTickets.findById(id);
    if (!ticket) return apiError(`Ticket not found: ${id}`, 404);

    const body = await request.json();
    const { action, event, agent, team, status, resolution, adminName, adminId } = body;
    const actor = adminName || 'Support Agent';
    const now = new Date().toISOString();
    const previousState = { ...ticket };

    if (action === 'add_event') {
      if (!event || !event.content) return apiError('Event content is required', 400);

      const newEvent: TicketEvent = {
        id: `EVT-${Date.now()}`,
        type: event.type || 'note',
        content: event.content,
        author: actor,
        authorRole: 'Support Specialist',
        isInternal: event.isInternal !== undefined ? event.isInternal : true,
        createdAt: now,
      };

      const updated = db.supportTickets.update(id, {
        events: [...ticket.events, newEvent],
        updatedAt: now,
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-004',
        adminName: actor,
        action: `support.ticket_${event.type || 'note'}`,
        targetType: 'SupportTicket',
        targetId: id,
        timestamp: now,
        newValue: { eventType: event.type, isInternal: event.isInternal },
      });

      return apiSuccess(updated);
    }

    if (action === 'assign') {
      if (!agent) return apiError('Agent name is required', 400);

      const updated = db.supportTickets.update(id, {
        assignedAgent: agent,
        assignedTeam: team || ticket.assignedTeam,
        status: ticket.status === 'open' ? 'in_progress' : ticket.status,
        updatedAt: now,
        events: [
          ...ticket.events,
          {
            id: `EVT-${Date.now()}`,
            type: 'assignment',
            content: `Ticket assigned to ${agent}${team ? ` (${team})` : ''} by ${actor}`,
            author: actor,
            authorRole: 'Support Supervisor',
            isInternal: true,
            createdAt: now,
          },
        ],
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-004',
        adminName: actor,
        action: 'support.ticket_assigned',
        targetType: 'SupportTicket',
        targetId: id,
        timestamp: now,
        previousValue: { assignedAgent: previousState.assignedAgent },
        newValue: { assignedAgent: agent, team },
      });

      return apiSuccess(updated);
    }

    if (action === 'update_status') {
      if (!status) return apiError('Status is required', 400);

      const updated = db.supportTickets.update(id, {
        status: status as TicketStatus,
        updatedAt: now,
        events: [
          ...ticket.events,
          {
            id: `EVT-${Date.now()}`,
            type: 'status_change',
            content: `Status updated from ${ticket.status} to ${status} by ${actor}`,
            author: actor,
            authorRole: 'Support Specialist',
            isInternal: true,
            createdAt: now,
          },
        ],
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-004',
        adminName: actor,
        action: 'support.ticket_status_changed',
        targetType: 'SupportTicket',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status },
        newValue: { status },
      });

      return apiSuccess(updated);
    }

    if (action === 'resolve') {
      if (!resolution || !resolution.decision) return apiError('Resolution details required', 400);

      const resolutionRecord = {
        type: resolution.type || 'Standard Resolution',
        summary: resolution.summary || 'Ticket resolved satisfactorily',
        decision: resolution.decision,
        financialOutcome: resolution.financialOutcome || 'None',
        resolvedBy: actor,
        resolvedAt: now,
      };

      const updated = db.supportTickets.update(id, {
        status: 'resolved',
        resolution: resolutionRecord,
        resolvedAt: now,
        updatedAt: now,
        events: [
          ...ticket.events,
          {
            id: `EVT-${Date.now()}`,
            type: 'status_change',
            content: `Ticket resolved by ${actor}. Determination: ${resolution.decision}. Outcome: ${resolution.financialOutcome || 'No financial adjustment'}.`,
            author: actor,
            authorRole: 'Support Specialist',
            isInternal: false,
            createdAt: now,
          },
        ],
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-004',
        adminName: actor,
        action: 'support.ticket_resolved',
        targetType: 'SupportTicket',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status },
        newValue: { status: 'resolved', resolution: resolutionRecord },
      });

      return apiSuccess(updated);
    }

    return apiError('Unrecognized ticket action', 400);
  } catch (error) {
    console.error('Error modifying support ticket:', error);
    return apiError('Failed to modify ticket', 500);
  }
}
