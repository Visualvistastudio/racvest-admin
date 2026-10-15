import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let verifications = db.verifications.findMany();
    if (status) {
      verifications = verifications.filter((v) => v.status === status);
    }

    return apiSuccess(verifications, { total: verifications.length });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return apiError('Failed to fetch verifications', 500);
  }
}
