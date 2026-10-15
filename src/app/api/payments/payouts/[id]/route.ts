import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const payout = db.payouts.findById(id);
    if (!payout) return apiError(`Payout not found: ${id}`, 404);
    return apiSuccess(payout);
  } catch (error) {
    console.error('Error fetching payout:', error);
    return apiError('Failed to fetch payout', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const payout = db.payouts.findById(id);
    if (!payout) return apiError(`Payout not found: ${id}`, 404);

    const body = await request.json();
    const { action, reason, adminName, adminId } = body;
    const actor = adminName || 'Finance Admin';
    const now = new Date().toISOString();
    const previousState = { ...payout };

    if (action === 'approve') {
      const updated = db.payouts.update(id, {
        status: 'approved',
        approvedBy: actor,
        updatedAt: now,
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-003',
        adminName: actor,
        action: 'finance.payout_approved',
        targetType: 'Payout',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status },
        newValue: { status: 'approved', approvedBy: actor },
        reason: reason || 'Carrier proof of delivery and delivery confirmation verified',
      });

      return apiSuccess(updated);
    }

    if (action === 'execute') {
      const providerRef = `NIP-${Date.now()}`;
      const updated = db.payouts.update(id, {
        status: 'succeeded',
        providerRef,
        updatedAt: now,
      });

      // Record transaction
      db.transactions.create({
        id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
        userId: payout.recipientId,
        userName: payout.recipientName,
        deliveryId: payout.deliveryId,
        type: payout.recipientType === 'traveller' ? 'traveller_payout' : 'courier_payout',
        amount: payout.netAmount,
        currency: 'NGN',
        method: 'bank_transfer',
        provider: 'flutterwave',
        providerRef,
        status: 'succeeded',
        createdAt: now,
        confirmedAt: now,
        description: `Disbursement of ₦${(payout.netAmount / 100).toLocaleString()} to ${payout.recipientName} (${payout.destinationRef})`,
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-003',
        adminName: actor,
        action: 'finance.payout_executed',
        targetType: 'Payout',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status },
        newValue: { status: 'succeeded', providerRef },
      });

      return apiSuccess({ payout: updated, message: `Payout of ₦${(payout.netAmount / 100).toLocaleString()} disbursed successfully to ${payout.destinationRef}` });
    }

    if (action === 'reject') {
      if (!reason) return apiError('Rejection reason is required', 400);

      const updated = db.payouts.update(id, {
        status: 'rejected',
        updatedAt: now,
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-003',
        adminName: actor,
        action: 'finance.payout_rejected',
        targetType: 'Payout',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status },
        newValue: { status: 'rejected', reason },
        reason,
      });

      return apiSuccess(updated);
    }

    return apiError('Unrecognized payout action', 400);
  } catch (error) {
    console.error('Error modifying payout:', error);
    return apiError('Failed to process payout', 500);
  }
}
