import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp?: string;
    [key: string]: unknown;
  };
}

export function apiSuccess<T>(data: T, meta?: ApiResponse['meta'], status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status }
  );
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error: message,
      meta: details ? { details, timestamp: new Date().toISOString() } : { timestamp: new Date().toISOString() },
    },
    { status }
  );
}
