import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { AdminRole, AdminStatus } from '@/types';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const admin = db.admins.findById(id);
    if (!admin) return apiError(`Admin not found: ${id}`, 404);
    return apiSuccess(admin);
  } catch (error) {
    console.error('Error fetching admin:', error);
    return apiError('Failed to fetch admin', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const admin = db.admins.findById(id);
    if (!admin) return apiError(`Admin not found: ${id}`, 404);

    const body = await request.json();
    const { action, role, status, adminName, adminId, department } = body;
    const actor = adminName || 'Super Admin';
    const now = new Date().toISOString();
    const previousState = { ...admin };

    // Function to count active Super Admins
    const countActiveSuperAdmins = () => {
      return db.admins.findMany().filter((a) => a.role === 'super_admin' && a.status === 'active').length;
    };

    if (action === 'update_role') {
      if (!role) return apiError('Role is required', 400);

      // Check safeguard if target is currently super_admin and being changed to something else
      if (admin.role === 'super_admin' && role !== 'super_admin' && admin.status === 'active') {
        if (countActiveSuperAdmins() <= 1) {
          return apiError(
            'Safeguard violation: Cannot demote the last remaining active Super Admin. Platform security requires at least one active Super Admin at all times.',
            403
          );
        }
      }

      const roleConfig = db.roleConfigs.findMany().find((r) => r.name === role);
      const permissions = roleConfig ? roleConfig.permissions : admin.permissions;

      const updated = db.admins.update(id, {
        role: role as AdminRole,
        permissions,
        department: department || admin.department,
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: actor,
        action: 'admin.role_changed',
        targetType: 'Admin',
        targetId: id,
        timestamp: now,
        previousValue: { role: previousState.role },
        newValue: { role },
      });

      return apiSuccess(updated);
    }

    if (action === 'update_status') {
      if (!status) return apiError('Status is required', 400);

      // Check safeguard if deactivating or suspending a super_admin
      if (
        admin.role === 'super_admin' &&
        admin.status === 'active' &&
        (status === 'suspended' || status === 'deactivated')
      ) {
        if (countActiveSuperAdmins() <= 1) {
          return apiError(
            'Safeguard violation: Cannot suspend or deactivate the last remaining active Super Admin. Create or promote another Super Admin first.',
            403
          );
        }
      }

      const updated = db.admins.update(id, {
        status: status as AdminStatus,
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: actor,
        action: 'admin.status_changed',
        targetType: 'Admin',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status },
        newValue: { status },
      });

      return apiSuccess(updated);
    }

    return apiError('Unrecognized admin action', 400);
  } catch (error) {
    console.error('Error updating admin:', error);
    return apiError('Failed to update admin account', 500);
  }
}
