'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'pill' | 'subtle' | 'outline';
  dot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'pill',
  dot = true,
  className,
}) => {
  const s = (status || '').toLowerCase().trim();

  let bg = 'bg-gray-100 text-gray-700 border-gray-200';
  let dotColor = 'bg-gray-400';

  if (['active', 'completed', 'verified', 'safe', 'approved', 'succeeded', 'resolved', 'on', 'published'].includes(s)) {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (
    [
      'pending',
      'in transit',
      'in_transit',
      'in progress',
      'in_progress',
      'processing',
      'under review',
      'under_review',
      'waiting',
      'waiting_customer',
      'waiting_internal',
      'held',
      'pending_approval',
      'draft',
      'cancellation_under_review',
    ].includes(s)
  ) {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (
    [
      'banned',
      'suspended',
      'failed',
      'rejected',
      'danger',
      'critical',
      'urgent',
      'flag',
      'off',
      'restricted',
      'cancelled',
      'disputed',
      'breached',
      'action_required',
    ].includes(s)
  ) {
    bg = 'bg-red-50 text-red-700 border-red-200';
    dotColor = 'bg-red-500';
  } else if (['escalated', 'high'].includes(s)) {
    bg = 'bg-purple-50 text-purple-700 border-purple-200';
    dotColor = 'bg-purple-500';
  } else if (['info', 'new', 'open', 'request_created', 'searching', 'matched', 'picked_up'].includes(s)) {
    bg = 'bg-blue-50 text-blue-700 border-blue-200';
    dotColor = 'bg-blue-500';
  }

  const formatLabel = (txt: string) => {
    return txt
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border',
        bg,
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />}
      <span>{formatLabel(status)}</span>
    </span>
  );
};
