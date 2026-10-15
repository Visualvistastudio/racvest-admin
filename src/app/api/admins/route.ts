import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { AdminInvitation, AdminRole } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();

    let admins = db.admins.findMany();
    const invitations = db.adminInvitations.findMany();
    const roles = db.roleConfigs.findMany();

    if (search) {
      admins = admins.filter(
        (a) =>
          a.firstName.toLowerCase().includes(search) ||
          a.lastName.toLowerCase().includes(search) ||
          a.email.toLowerCase().includes(search) ||
          a.department.toLowerCase().includes(search) ||
          a.role.toLowerCase().includes(search)
      );
    }

    return apiSuccess({
      admins,
      adminInvitations: invitations,
      roleConfigs: roles,
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return apiError('Failed to fetch administrator accounts', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, department, role, adminName, adminId } = body;

    if (!email || !firstName || !lastName || !department || !role) {
      return apiError('Missing required admin invitation fields', 400);
    }

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();

    const invitation: AdminInvitation = {
      id: `INV-${Math.floor(100 + Math.random() * 900)}`,
      email,
      firstName,
      lastName,
      department,
      role: role as AdminRole,
      status: 'pending',
      invitedBy: adminId || 'ADM-001',
      invitedByName: adminName || 'Super Admin',
      invitedAt: now,
      expiresAt,
    };

    const created = db.adminInvitations.create(invitation);

    db.auditLogs.create({
      id: `AUD-${Date.now()}`,
      adminId: adminId || 'ADM-001',
      adminName: adminName || 'Super Admin',
      action: 'admin.invitation_sent',
      targetType: 'AdminInvitation',
      targetId: created.id,
      timestamp: now,
      newValue: created,
    });

    return apiSuccess(created, undefined, 201);
  } catch (error) {
    console.error('Error creating admin invitation:', error);
    return apiError('Failed to send admin invitation', 500);
  }
}
