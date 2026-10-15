import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ChatMessage, SupportTicket } from '@/types';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const chat = db.chatConversations.findById(id);
    if (!chat) return apiError(`Chat not found: ${id}`, 404);
    return apiSuccess(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    return apiError('Failed to fetch chat', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const chat = db.chatConversations.findById(id);
    if (!chat) return apiError(`Chat not found: ${id}`, 404);

    const body = await request.json();
    const { action, content, agentName, ticketDetails, adminId } = body;
    const actor = agentName || 'Customer Support Agent';
    const now = new Date().toISOString();

    if (action === 'send_message') {
      if (!content) return apiError('Message content is required', 400);

      const newMsg: ChatMessage = {
        id: `MSG-${Date.now()}`,
        sender: 'agent',
        senderName: actor,
        content,
        timestamp: now,
        isRead: true,
      };

      const updated = db.chatConversations.update(id, {
        messages: [...chat.messages, newMsg],
        lastMessage: content,
        lastActivity: now,
        status: chat.status === 'open' ? 'assigned' : chat.status,
        assignedAgent: chat.assignedAgent || actor,
      });

      return apiSuccess(updated);
    }

    if (action === 'assign') {
      if (!agentName) return apiError('Agent name is required', 400);

      const updated = db.chatConversations.update(id, {
        assignedAgent: agentName,
        status: 'assigned',
        lastActivity: now,
      });

      return apiSuccess(updated);
    }

    if (action === 'resolve') {
      const updated = db.chatConversations.update(id, {
        status: 'resolved',
        lastActivity: now,
      });

      return apiSuccess(updated);
    }

    if (action === 'convert_to_ticket') {
      const { title, category, priority, assignedTeam } = ticketDetails || {};

      const newTicket: SupportTicket = {
        id: `TKT-${Math.floor(10000 + Math.random() * 90000)}`,
        title: title || `Escalated from Chat ${id}: ${chat.category}`,
        customerId: chat.customerId,
        customerName: chat.customerName,
        category: category || chat.category,
        priority: priority || chat.priority || 'normal',
        status: 'open',
        assignedTeam: assignedTeam || 'Tier 2 Support',
        assignedAgent: chat.assignedAgent || actor,
        deliveryId: chat.deliveryId,
        createdAt: now,
        updatedAt: now,
        events: chat.messages.map((m) => ({
          id: `EVT-${m.id}`,
          type: m.sender === 'agent' ? 'agent_reply' : 'customer_reply',
          content: m.content,
          author: m.senderName,
          authorRole: m.sender === 'agent' ? 'Support Agent' : 'Customer',
          isInternal: false,
          createdAt: m.timestamp,
        })),
        slaStatus: 'within_sla',
      };

      const createdTicket = db.supportTickets.create(newTicket);

      // Resolve the chat and link ticket
      db.chatConversations.update(id, {
        status: 'resolved',
        lastActivity: now,
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-004',
        adminName: actor,
        action: 'support.chat_converted_to_ticket',
        targetType: 'ChatConversation',
        targetId: id,
        timestamp: now,
        newValue: { ticketId: createdTicket.id },
      });

      return apiSuccess({ chat: db.chatConversations.findById(id), ticket: createdTicket });
    }

    return apiError('Unrecognized chat action', 400);
  } catch (error) {
    console.error('Error modifying chat:', error);
    return apiError('Failed to modify chat', 500);
  }
}
