import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const systemSettings = db.systemSettings.findMany();
    const integrationConfigs = db.integrations.findMany();
    const notificationTemplates = db.notifications.findMany();

    return apiSuccess({
      systemSettings,
      integrationConfigs,
      notificationTemplates,
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return apiError('Failed to fetch settings', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, key, value, adminName, adminId, integrationId, integrationUpdates, templateId, templateUpdates } = body;
    const actor = adminName || 'Super Admin';
    const now = new Date().toISOString();

    if (action === 'update_setting') {
      if (!key || value === undefined) {
        return apiError('Setting key and value are required', 400);
      }

      const updated = db.systemSettings.update(key, value, actor);
      if (!updated) return apiError(`Setting key not found: ${key}`, 404);

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: actor,
        action: 'settings.updated',
        targetType: 'SystemSetting',
        targetId: key,
        timestamp: now,
        newValue: { [key]: value },
      });

      return apiSuccess(updated);
    }

    if (action === 'update_integration') {
      if (!integrationId || !integrationUpdates) {
        return apiError('Integration ID and updates are required', 400);
      }

      const updated = db.integrations.update(integrationId, integrationUpdates);
      if (!updated) return apiError(`Integration not found: ${integrationId}`, 404);

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: actor,
        action: 'integration.updated',
        targetType: 'IntegrationConfig',
        targetId: integrationId,
        timestamp: now,
        newValue: integrationUpdates,
      });

      return apiSuccess(updated);
    }

    if (action === 'update_notification') {
      if (!templateId || !templateUpdates) {
        return apiError('Template ID and updates are required', 400);
      }

      const updated = db.notifications.update(templateId, templateUpdates);
      if (!updated) return apiError(`Notification template not found: ${templateId}`, 404);

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: actor,
        action: 'notification_template.updated',
        targetType: 'NotificationTemplate',
        targetId: templateId,
        timestamp: now,
        newValue: templateUpdates,
      });

      return apiSuccess(updated);
    }

    return apiError('Unrecognized settings action', 400);
  } catch (error) {
    console.error('Error modifying settings:', error);
    return apiError('Failed to modify settings', 500);
  }
}
