import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { User, UserRole, VerificationStatus, AccountStatus, RiskLevel } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const role = searchParams.get('role') as UserRole | null;
    const verification = searchParams.get('verification') as VerificationStatus | null;
    const status = searchParams.get('status') as AccountStatus | null;
    const risk = searchParams.get('risk') as RiskLevel | null;

    let users = db.users.findMany();

    if (search) {
      users = users.filter(
        (u) =>
          u.firstName.toLowerCase().includes(search) ||
          u.lastName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.phone.includes(search) ||
          u.id.toLowerCase().includes(search)
      );
    }

    if (role) {
      users = users.filter((u) => u.roles.includes(role));
    }

    if (verification) {
      users = users.filter((u) => u.verificationStatus === verification);
    }

    if (status) {
      users = users.filter((u) => u.accountStatus === status);
    }

    if (risk) {
      users = users.filter((u) => u.riskLevel === risk);
    }

    return apiSuccess(users, { total: users.length });
  } catch (error) {
    console.error('Error fetching users:', error);
    return apiError('Failed to fetch users', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, roles, location } = body;

    if (!firstName || !lastName || !email || !phone) {
      return apiError('Missing required user fields', 400);
    }

    const newUser: User = {
      id: `RCV-${Math.floor(10000 + Math.random() * 90000)}`,
      firstName,
      lastName,
      email,
      phone,
      roles: roles || ['sender'],
      verificationStatus: 'unverified',
      accountStatus: 'active',
      riskLevel: 'safe',
      location: location || 'Lagos, Nigeria',
      rating: 5.0,
      registeredAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      deliveryCount: 0,
      walletBalance: 0,
    };

    const created = db.users.create(newUser);

    // Audit log
    db.auditLogs.create({
      id: `AUD-${Date.now()}`,
      adminId: 'SYSTEM',
      adminName: 'Admin System',
      action: 'user.created',
      targetType: 'User',
      targetId: created.id,
      timestamp: new Date().toISOString(),
      newValue: created,
    });

    return apiSuccess(created, undefined, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return apiError('Failed to create user', 500);
  }
}
