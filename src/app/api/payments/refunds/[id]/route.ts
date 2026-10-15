import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const refund = db.refunds.findById(id);
    if (!refund) return apiError(`Refund not found: ${id}`, 404);
    return apiSuccess(refund);
  } catch (error) {
    console.error('Error fetching refund:', error);
    return apiError('Failed to fetch refund', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const refund = db.refunds.findById(id);
    if (!refund) return apiError(`Refund not found: ${id}`, 404);

    const body = await request.json();
    const { action, reason, adminName, adminId, role } = body;
    const actor = adminName || 'Finance Admin';
    const now = new Date().toISOString();
    const previousState = { ...refund };

    if (action === 'approve') {
      if (refund.status !== 'requested' && refund.status !== 'under_review') {
        return apiError(`Cannot approve refund with status: ${refund.status}`, 400);
      }

      const updated = db.refunds.update(id, {
        status: 'approved',
        approvedBy: actor,
        updatedAt: now,
        notes: refund.notes ? `${refund.notes}\nApproved by ${actor} on ${now}. Reason: ${reason || 'Approved'}` : `Approved by ${actor}.`,
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-003',
        adminName: actor,
        action: 'finance.refund_approved',
        targetType: 'Refund',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status },
        newValue: { status: 'approved', approvedBy: actor },
        reason: reason || 'Refund criteria verified against platform cancellation policy',
      });

      return apiSuccess(updated);
    }

    if (action === 'execute') {
      if (refund.status !== 'approved') {
        return apiError('Only approved refunds can be executed', 400);
      }

      // Separation of duties enforcement:
      // An administrator cannot execute a refund that they themselves approved unless they are a Super Admin overriding with audit trail
      if (refund.approvedBy === actor && role !== 'super_admin') {
        return apiError(
          'Separation of duties violation: The same administrator who approved this refund cannot execute the payment. A separate finance officer or Super Admin must execute.',
          403
        );
      }

      const providerRef = `PAYSTACK-RFD-${Date.now()}`;
      const updated = db.refunds.update(id, {
        status: 'succeeded',
        executedBy: actor,
        providerRef,
        updatedAt: now,
      });

      // Record transaction
      db.transactions.create({
        id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
        userId: refund.requesterId,
        userName: refund.requesterName,
        deliveryId: refund.deliveryId,
        type: 'refund',
        amount: refund.amount,
        currency: 'NGN',
        method: 'card',
        provider: 'paystack',
        providerRef,
        status: 'succeeded',
        createdAt: now,
        confirmedAt: now,
        description: `Refund executed for delivery ${refund.deliveryId} (₦${(refund.amount / 100).toLocaleString()}) by ${actor}`,
      });

      // Audit log
      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-003',
        adminName: actor,
        action: 'finance.refund_executed',
        targetType: 'Refund',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status },
        newValue: { status: 'succeeded', executedBy: actor, providerRef },
      });

      return apiSuccess({ refund: updated, message: `Refund of ₦${(refund.amount / 100).toLocaleString()} executed successfully via Paystack.` });
    }

    if (action === 'reject') {
      if (!reason) return apiError('Rejection reason is required', 400);

      const updated = db.refunds.update(id, {
        status: 'rejected',
        updatedAt: now,
        notes: refund.notes ? `${refund.notes}\nRejected by ${actor}: ${reason}` : `Rejected by ${actor}: ${reason}`,
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-003',
        adminName: actor,
        action: 'finance.refund_rejected',
        targetType: 'Refund',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status },
        newValue: { status: 'rejected', reason },
        reason,
      });

      return apiSuccess(updated);
    }

    return apiError('Unrecognized refund action', 400);
  } catch (error) {
    console.error('Error modifying refund:', error);
    return apiError('Failed to process refund request', 500);
  }
}
