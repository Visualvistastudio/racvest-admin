import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { RefundStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as RefundStatus | null;
    const search = searchParams.get('search')?.toLowerCase();

    let refunds = db.refunds.findMany();

    if (status) {
      refunds = refunds.filter((r) => r.status === status);
    }

    if (search) {
      refunds = refunds.filter(
        (r) =>
          r.id.toLowerCase().includes(search) ||
          r.requesterName.toLowerCase().includes(search) ||
          r.deliveryId.toLowerCase().includes(search) ||
          r.reason.toLowerCase().includes(search)
      );
    }

    return apiSuccess(refunds, { total: refunds.length });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    return apiError('Failed to fetch refunds', 500);
  }
}
