import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const item = db.contentItems.findById(id);
    if (!item) return apiError(`Content item not found: ${id}`, 404);
    return apiSuccess(item);
  } catch (error) {
    console.error('Error fetching content item:', error);
    return apiError('Failed to fetch content item', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const item = db.contentItems.findById(id);
    if (!item) return apiError(`Content item not found: ${id}`, 404);

    const body = await request.json();
    const { title, content, status, adminName, adminId } = body;
    const now = new Date().toISOString();

    const updates: Record<string, unknown> = {
      updatedAt: now,
    };

    if (title) updates.title = title;
    if (content) updates.content = content;
    if (status) {
      updates.status = status;
      if (status === 'published' && !item.publishedAt) {
        updates.publishedAt = now;
      }
    }

    const updated = db.contentItems.update(id, updates);

    db.auditLogs.create({
      id: `AUD-${Date.now()}`,
      adminId: adminId || 'ADM-001',
      adminName: adminName || 'Admin',
      action: 'content.updated',
      targetType: 'ContentItem',
      targetId: id,
      timestamp: now,
      previousValue: { title: item.title, status: item.status },
      newValue: updates,
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error('Error modifying content item:', error);
    return apiError('Failed to modify content item', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const item = db.contentItems.findById(id);
    if (!item) return apiError(`Content item not found: ${id}`, 404);

    const success = db.contentItems.delete(id);

    db.auditLogs.create({
      id: `AUD-${Date.now()}`,
      adminId: 'ADM-001',
      adminName: 'Admin',
      action: 'content.deleted',
      targetType: 'ContentItem',
      targetId: id,
      timestamp: new Date().toISOString(),
      previousValue: item,
    });

    return apiSuccess({ deleted: success });
  } catch (error) {
    console.error('Error deleting content item:', error);
    return apiError('Failed to delete content item', 500);
  }
}
