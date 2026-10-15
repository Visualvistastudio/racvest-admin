import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const user = db.users.findById(id);
    if (!user) {
      return apiError(`User not found with ID: ${id}`, 404);
    }

    const verification = db.verifications.findByUserId(id);
    const deliveries = db.deliveries.findMany((d) => d.senderId === id || d.travellerId === id || d.courierId === id);
    const transactions = db.transactions.findMany((t) => t.userId === id);

    return apiSuccess({
      user,
      verification,
      deliveries,
      transactions,
    });
  } catch (error) {
    console.error('Error fetching user detail:', error);
    return apiError('Failed to fetch user', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const user = db.users.findById(id);
    if (!user) {
      return apiError(`User not found with ID: ${id}`, 404);
    }

    const body = await request.json();
    const { action, reason, days, amount, adminId, adminName, roles, updates } = body;
    const previousState = { ...user };

    let updatedUser = user;

    if (action === 'suspend') {
      if (!reason) return apiError('Suspension reason is required', 400);
      const updated = db.users.update(id, {
        accountStatus: 'suspended',
        suspendedReason: reason + (days ? ` (Suspended for ${days} days)` : ''),
      });
      if (!updated) return apiError('Failed to suspend user', 500);
      updatedUser = updated;

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: adminName || 'Admin',
        action: 'user.suspended',
        targetType: 'User',
        targetId: id,
        timestamp: new Date().toISOString(),
        previousValue: { status: previousState.accountStatus },
        newValue: { status: 'suspended', reason, days },
        reason,
      });
    } else if (action === 'ban') {
      if (!reason) return apiError('Ban reason is required', 400);
      const updated = db.users.update(id, {
        accountStatus: 'banned',
        bannedReason: reason,
        riskLevel: 'danger',
      });
      if (!updated) return apiError('Failed to ban user', 500);
      updatedUser = updated;

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: adminName || 'Admin',
        action: 'user.banned',
        targetType: 'User',
        targetId: id,
        timestamp: new Date().toISOString(),
        previousValue: { status: previousState.accountStatus, riskLevel: previousState.riskLevel },
        newValue: { status: 'banned', reason },
        reason,
      });
    } else if (action === 'restore') {
      const updated = db.users.update(id, {
        accountStatus: 'active',
        suspendedReason: undefined,
        bannedReason: undefined,
        riskLevel: 'safe',
      });
      if (!updated) return apiError('Failed to restore user', 500);
      updatedUser = updated;

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: adminName || 'Admin',
        action: 'user.restored',
        targetType: 'User',
        targetId: id,
        timestamp: new Date().toISOString(),
        previousValue: { status: previousState.accountStatus },
        newValue: { status: 'active' },
        reason: reason || 'Account restored by admin',
      });
    } else if (action === 'adjust_wallet') {
      if (typeof amount !== 'number') return apiError('Valid amount in kobo is required', 400);
      const newBalance = Math.max(0, user.walletBalance + amount);
      const updated = db.users.update(id, { walletBalance: newBalance });
      if (!updated) return apiError('Failed to update wallet balance', 500);
      updatedUser = updated;

      // Create transaction ledger record
      db.transactions.create({
        id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        type: 'adjustment',
        amount: Math.abs(amount),
        currency: 'NGN',
        method: 'wallet',
        provider: 'system',
        providerRef: `ADJ-${Date.now()}`,
        status: 'succeeded',
        createdAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
        description: `Admin wallet adjustment: ${amount >= 0 ? 'Credit' : 'Debit'} of ₦${(Math.abs(amount) / 100).toLocaleString()}. Reason: ${reason || 'Administrative adjustment'}`,
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: adminName || 'Admin',
        action: 'user.wallet_adjusted',
        targetType: 'User',
        targetId: id,
        timestamp: new Date().toISOString(),
        previousValue: { walletBalance: previousState.walletBalance },
        newValue: { walletBalance: newBalance, change: amount },
        reason: reason || 'Wallet balance administrative adjustment',
      });
    } else if (action === 'update_roles') {
      if (!Array.isArray(roles) || roles.length === 0) return apiError('At least one role is required', 400);
      const updated = db.users.update(id, { roles });
      if (!updated) return apiError('Failed to update roles', 500);
      updatedUser = updated;

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: adminName || 'Admin',
        action: 'user.roles_updated',
        targetType: 'User',
        targetId: id,
        timestamp: new Date().toISOString(),
        previousValue: { roles: previousState.roles },
        newValue: { roles },
      });
    } else if (updates) {
      const updated = db.users.update(id, updates);
      if (!updated) return apiError('Failed to update user', 500);
      updatedUser = updated;

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: adminName || 'Admin',
        action: 'user.updated',
        targetType: 'User',
        targetId: id,
        timestamp: new Date().toISOString(),
        previousValue: previousState,
        newValue: updatedUser,
      });
    }

    return apiSuccess(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return apiError('Failed to update user', 500);
  }
}
