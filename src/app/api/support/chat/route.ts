import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();

    let chats = db.chatConversations.findMany();

    if (status) {
      chats = chats.filter((c) => c.status === status);
    }

    if (search) {
      chats = chats.filter(
        (c) =>
          c.id.toLowerCase().includes(search) ||
          c.customerName.toLowerCase().includes(search) ||
          c.category.toLowerCase().includes(search) ||
          (c.deliveryId && c.deliveryId.toLowerCase().includes(search))
      );
    }

    return apiSuccess(chats, { total: chats.length });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return apiError('Failed to fetch chat conversations', 500);
  }
}
