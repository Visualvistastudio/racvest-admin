import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { DeliveryStatus } from '@/types';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const delivery = db.deliveries.findById(id);
    if (!delivery) {
      return apiError(`Delivery not found with ID: ${id}`, 404);
    }

    const offers = db.offers.findMany().filter((o) => o.deliveryId === id);
    const matches = db.matches.findMany().filter((m) => m.deliveryId === id);
    const tickets = db.supportTickets.findMany((t) => t.deliveryId === id);
    const reports = db.moderationReports.findMany((r) => r.deliveryId === id);
    const transactions = db.transactions.findMany((t) => t.deliveryId === id);

    return apiSuccess({
      delivery,
      offers,
      matches,
      tickets,
      reports,
      transactions,
    });
  } catch (error) {
    console.error('Error fetching delivery detail:', error);
    return apiError('Failed to fetch delivery detail', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const delivery = db.deliveries.findById(id);
    if (!delivery) {
      return apiError(`Delivery not found with ID: ${id}`, 404);
    }

    const body = await request.json();
    const {
      action,
      status,
      note,
      adminId,
      adminName,
      providerId,
      providerName,
      mode,
      reason,
      explanation,
      decision,
    } = body;

    const actor = adminName || 'Admin Operations';
    const now = new Date().toISOString();
    const previousState = { ...delivery };

    if (action === 'update_status') {
      if (!status) return apiError('Status is required', 400);

      const historyEntry = {
        status,
        timestamp: now,
        actor,
        note: note || `Status updated to ${status}`,
      };

      const updates: Record<string, unknown> = {
        status: status as DeliveryStatus,
        updatedAt: now,
        statusHistory: [...delivery.statusHistory, historyEntry],
      };

      if (status === 'completed') {
        updates.actualDelivery = now;
      }

      const updated = db.deliveries.update(id, updates);
      if (!updated) return apiError('Failed to update status', 500);

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: actor,
        action: 'delivery.status_changed',
        targetType: 'Delivery',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status },
        newValue: { status },
        reason: note,
      });

      return apiSuccess(updated);
    }

    if (action === 'reassign') {
      if (!providerId || !providerName || !mode) {
        return apiError('Provider ID, name, and mode are required for reassignment', 400);
      }

      const historyEntry = {
        status: delivery.status,
        timestamp: now,
        actor,
        note: `Provider reassigned to ${mode === 'traveller' ? 'Traveller' : 'Courier'} ${providerName} (${providerId})`,
      };

      const updates = {
        mode,
        travellerId: mode === 'traveller' ? providerId : undefined,
        travellerName: mode === 'traveller' ? providerName : undefined,
        courierId: mode === 'courier' ? providerId : undefined,
        courierName: mode === 'courier' ? providerName : undefined,
        updatedAt: now,
        statusHistory: [...delivery.statusHistory, historyEntry],
      };

      const updated = db.deliveries.update(id, updates);
      if (!updated) return apiError('Failed to reassign delivery', 500);

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: actor,
        action: 'delivery.reassigned',
        targetType: 'Delivery',
        targetId: id,
        timestamp: now,
        previousValue: {
          mode: previousState.mode,
          travellerId: previousState.travellerId,
          courierId: previousState.courierId,
        },
        newValue: { mode, providerId, providerName },
      });

      return apiSuccess(updated);
    }

    if (action === 'request_cancellation') {
      // 4-scenario cancellation logic
      const currentStatus = delivery.status;
      let outcome: 'cancelled_unpaid' | 'under_review_paid' | 'under_review_transit' | 'disputed_completed';
      let nextStatus: DeliveryStatus;

      if (['draft', 'request_created', 'searching', 'offers_received'].includes(currentStatus)) {
        outcome = 'cancelled_unpaid';
        nextStatus = 'cancelled';
      } else if (['matched', 'awaiting_pickup'].includes(currentStatus)) {
        outcome = 'under_review_paid';
        nextStatus = 'cancellation_under_review';
      } else if (['picked_up', 'in_transit'].includes(currentStatus)) {
        outcome = 'under_review_transit';
        nextStatus = 'cancellation_under_review';
      } else {
        outcome = 'disputed_completed';
        nextStatus = 'disputed';
      }

      const historyEntry = {
        status: nextStatus,
        timestamp: now,
        actor,
        note: `Cancellation requested (${outcome}). Reason: ${reason}. Explanation: ${explanation || 'None provided'}`,
      };

      const updated = db.deliveries.update(id, {
        status: nextStatus,
        updatedAt: now,
        statusHistory: [...delivery.statusHistory, historyEntry],
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: actor,
        action: 'delivery.cancellation_requested',
        targetType: 'Delivery',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status },
        newValue: { status: nextStatus, outcome, reason },
        reason,
      });

      return apiSuccess({ delivery: updated, outcome });
    }

    if (action === 'resolve_cancellation') {
      if (!decision || !['approved', 'rejected'].includes(decision)) {
        return apiError('Valid decision (approved/rejected) is required', 400);
      }

      const isApproved = decision === 'approved';
      const nextStatus: DeliveryStatus = isApproved ? 'cancelled' : 'in_transit';

      const historyEntry = {
        status: nextStatus,
        timestamp: now,
        actor,
        note: `Cancellation review resolved: ${decision.toUpperCase()}. Admin notes: ${note || 'None'}`,
      };

      const updated = db.deliveries.update(id, {
        status: nextStatus,
        paymentStatus: isApproved ? 'refunded' : delivery.paymentStatus,
        updatedAt: now,
        statusHistory: [...delivery.statusHistory, historyEntry],
      });

      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: actor,
        action: 'delivery.cancellation_resolved',
        targetType: 'Delivery',
        targetId: id,
        timestamp: now,
        previousValue: { status: previousState.status },
        newValue: { status: nextStatus, decision },
        reason: note,
      });

      return apiSuccess(updated);
    }

    return apiError('Unrecognized delivery action', 400);
  } catch (error) {
    console.error('Error modifying delivery:', error);
    return apiError('Failed to modify delivery', 500);
  }
}
