'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingSkeletonProps {
  rows?: number;
  message?: string;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  rows = 4,
  message = 'Loading records...',
  className,
}) => {
  return (
    <div className={cn('space-y-4 p-6 bg-white rounded-xl border border-gray-100 shadow-sm', className)}>
      {/* Top placeholder header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="h-6 w-48 rounded-md skeleton" />
        <div className="h-8 w-28 rounded-md skeleton" />
      </div>

      {/* Row placeholders */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <div className="w-8 h-8 rounded-full skeleton flex-shrink-0" />
            <div className="h-4 w-40 rounded skeleton" />
            <div className="h-4 flex-1 rounded skeleton hidden md:block" />
            <div className="h-4 w-24 rounded skeleton" />
            <div className="h-6 w-20 rounded-full skeleton" />
          </div>
        ))}
      </div>

      {/* Loading spinner label */}
      <div className="flex items-center justify-center gap-2 pt-4 text-xs font-medium text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin text-brand-green" />
        <span>{message}</span>
      </div>
    </div>
  );
};
