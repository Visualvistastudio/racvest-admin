import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ContentItem } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let items = db.contentItems.findMany();

    if (type) {
      items = items.filter((c) => c.type === type);
    }

    if (status) {
      items = items.filter((c) => c.status === status);
    }

    return apiSuccess(items, { total: items.length });
  } catch (error) {
    console.error('Error fetching content items:', error);
    return apiError('Failed to fetch content items', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, content, status, adminName, adminId } = body;

    if (!type || !title || !content) {
      return apiError('Type, title, and content are required', 400);
    }

    const now = new Date().toISOString();
    const item: ContentItem = {
      id: `CNT-${Math.floor(100 + Math.random() * 900)}`,
      type,
      title,
      content,
      status: status || 'draft',
      author: adminName || 'Admin',
      createdAt: now,
      updatedAt: now,
      publishedAt: status === 'published' ? now : undefined,
    };

    const created = db.contentItems.create(item);

    db.auditLogs.create({
      id: `AUD-${Date.now()}`,
      adminId: adminId || 'ADM-001',
      adminName: adminName || 'Admin',
      action: 'content.created',
      targetType: 'ContentItem',
      targetId: created.id,
      timestamp: now,
      newValue: created,
    });

    return apiSuccess(created, undefined, 201);
  } catch (error) {
    console.error('Error creating content item:', error);
    return apiError('Failed to create content item', 500);
  }
}
