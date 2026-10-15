import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { IncidentStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as IncidentStatus | null;
    const severity = searchParams.get('severity');

    let incidents = db.safetyIncidents.findMany();

    if (status) {
      incidents = incidents.filter((i) => i.status === status);
    }

    if (severity) {
      incidents = incidents.filter((i) => i.severity === severity);
    }

    return apiSuccess(incidents, { total: incidents.length });
  } catch (error) {
    console.error('Error fetching safety incidents:', error);
    return apiError('Failed to fetch safety incidents', 500);
  }
}
