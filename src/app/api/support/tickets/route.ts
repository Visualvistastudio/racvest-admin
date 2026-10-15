import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { SupportTicket, TicketStatus, TicketPriority } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const status = searchParams.get('status') as TicketStatus | null;
    const priority = searchParams.get('priority') as TicketPriority | null;
    const category = searchParams.get('category');

    let tickets = db.supportTickets.findMany();

    if (search) {
      tickets = tickets.filter(
        (t) =>
          t.id.toLowerCase().includes(search) ||
          t.title.toLowerCase().includes(search) ||
          t.customerName.toLowerCase().includes(search) ||
          (t.deliveryId && t.deliveryId.toLowerCase().includes(search))
      );
    }

    if (status) {
      tickets = tickets.filter((t) => t.status === status);
    }

    if (priority) {
      tickets = tickets.filter((t) => t.priority === priority);
    }

    if (category) {
      tickets = tickets.filter((t) => t.category.toLowerCase() === category.toLowerCase());
    }

    return apiSuccess(tickets, { total: tickets.length });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return apiError('Failed to fetch support tickets', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, customerId, customerName, category, priority, deliveryId, initialMessage, assignedTeam } = body;

    if (!title || !customerId || !customerName || !category) {
      return apiError('Missing required support ticket fields', 400);
    }

    const now = new Date().toISOString();
    const newTicket: SupportTicket = {
      id: `TKT-${Math.floor(10000 + Math.random() * 90000)}`,
      title,
      customerId,
      customerName,
      category,
      priority: priority || 'normal',
      status: 'open',
      assignedTeam: assignedTeam || 'Tier 1 Support',
      deliveryId,
      createdAt: now,
      updatedAt: now,
      events: [
        {
          id: `EVT-${Date.now()}`,
          type: 'customer_reply',
          content: initialMessage || 'Support ticket logged by customer.',
          author: customerName,
          authorRole: 'Customer',
          isInternal: false,
          createdAt: now,
        },
      ],
      slaStatus: 'within_sla',
    };

    const created = db.supportTickets.create(newTicket);

    db.auditLogs.create({
      id: `AUD-${Date.now()}`,
      adminId: 'SYSTEM',
      adminName: 'Support System',
      action: 'support.ticket_created',
      targetType: 'SupportTicket',
      targetId: created.id,
      timestamp: now,
      newValue: created,
    });

    return apiSuccess(created, undefined, 201);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return apiError('Failed to create ticket', 500);
  }
}
