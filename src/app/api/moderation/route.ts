import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ReportStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ReportStatus | null;
    const severity = searchParams.get('severity');
    const search = searchParams.get('search')?.toLowerCase();

    let reports = db.moderationReports.findMany();

    if (status) {
      reports = reports.filter((r) => r.status === status);
    }

    if (severity) {
      reports = reports.filter((r) => r.severity === severity);
    }

    if (search) {
      reports = reports.filter(
        (r) =>
          r.id.toLowerCase().includes(search) ||
          r.reporterName.toLowerCase().includes(search) ||
          (r.reportedUserName && r.reportedUserName.toLowerCase().includes(search)) ||
          r.description.toLowerCase().includes(search) ||
          r.type.toLowerCase().includes(search)
      );
    }

    return apiSuccess(reports, { total: reports.length });
  } catch (error) {
    console.error('Error fetching moderation reports:', error);
    return apiError('Failed to fetch moderation reports', 500);
  }
}
