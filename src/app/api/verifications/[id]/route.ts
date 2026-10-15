import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    // id could be verificationId (e.g. VRF-001) or userId (e.g. RCV-002)
    const all = db.verifications.findMany();
    const verification = all.find((v) => v.id === id || v.userId === id);

    if (!verification) {
      return apiError(`Verification record not found for: ${id}`, 404);
    }

    const body = await request.json();
    const { action, reason, adminId, adminName } = body;

    const reviewer = adminName || 'Admin';
    const now = new Date().toISOString();

    if (action === 'approve') {
      const updated = db.verifications.update(verification.userId, {
        status: 'verified',
        reviewedAt: now,
        reviewedBy: reviewer,
        rejectionReason: undefined,
      });

      // Also update User record
      db.users.update(verification.userId, {
        verificationStatus: 'verified',
      });

      // Audit log
      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: reviewer,
        action: 'user.verification_approved',
        targetType: 'UserVerification',
        targetId: verification.id,
        timestamp: now,
        previousValue: { status: verification.status },
        newValue: { status: 'verified', reviewedBy: reviewer },
      });

      return apiSuccess(updated);
    } else if (action === 'reject') {
      if (!reason) return apiError('Rejection reason is required', 400);

      const updated = db.verifications.update(verification.userId, {
        status: 'rejected',
        reviewedAt: now,
        reviewedBy: reviewer,
        rejectionReason: reason,
      });

      // Also update User record
      db.users.update(verification.userId, {
        verificationStatus: 'rejected',
      });

      // Audit log
      db.auditLogs.create({
        id: `AUD-${Date.now()}`,
        adminId: adminId || 'ADM-001',
        adminName: reviewer,
        action: 'user.verification_rejected',
        targetType: 'UserVerification',
        targetId: verification.id,
        timestamp: now,
        previousValue: { status: verification.status },
        newValue: { status: 'rejected', reason, reviewedBy: reviewer },
        reason,
      });

      return apiSuccess(updated);
    }

    return apiError('Invalid verification action. Must be "approve" or "reject"', 400);
  } catch (error) {
    console.error('Error updating verification:', error);
    return apiError('Failed to update verification', 500);
  }
}
