import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { PayoutStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as PayoutStatus | null;
    const search = searchParams.get('search')?.toLowerCase();

    let payouts = db.payouts.findMany();

    if (status) {
      payouts = payouts.filter((p) => p.status === status);
    }

    if (search) {
      payouts = payouts.filter(
        (p) =>
          p.id.toLowerCase().includes(search) ||
          p.recipientName.toLowerCase().includes(search) ||
          p.deliveryId.toLowerCase().includes(search) ||
          p.destinationRef.toLowerCase().includes(search)
      );
    }

    return apiSuccess(payouts, { total: payouts.length });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return apiError('Failed to fetch payouts', 500);
  }
}
