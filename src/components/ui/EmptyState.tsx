'use client';

import React from 'react';
import { Inbox, Search, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  type?: 'empty' | 'no-results' | 'error';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'empty',
  title,
  description,
  actionText,
  onAction,
  className,
}) => {
  let defaultTitle = "You're all caught up";
  let defaultDesc = 'There are no items in this queue. New items will appear here.';
  let defaultAction = 'Refresh queue';
  let iconBg = 'bg-emerald-50 text-brand-green border border-emerald-100';
  let buttonStyle = 'bg-brand-green hover:bg-brand-green-light text-white';
  let Icon = Inbox;

  if (type === 'no-results') {
    defaultTitle = 'No matching records';
    defaultDesc = 'No results match your search and filter criteria. Try broadening your query.';
    defaultAction = 'Clear filters';
    iconBg = 'bg-amber-50 text-amber-600 border border-amber-100';
    buttonStyle = 'bg-brand-green hover:bg-brand-green-light text-white';
    Icon = Search;
  } else if (type === 'error') {
    defaultTitle = "We couldn't load data";
    defaultDesc = 'The service did not respond. Your parameters are saved; retry or check connectivity.';
    defaultAction = 'Try again';
    iconBg = 'bg-red-50 text-red-600 border border-red-100';
    buttonStyle = 'bg-red-700 hover:bg-red-800 text-white';
    Icon = AlertTriangle;
  }

  const heading = title || defaultTitle;
  const desc = description || defaultDesc;
  const btn = actionText || defaultAction;

  return (
    <div
      className={cn(
        'bg-surface-secondary/70 border border-gray-200/80 rounded-xl p-10 flex flex-col items-center justify-center text-center my-4',
        className
      )}
    >
      <div className={cn('w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-sm', iconBg)}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1">{heading}</h3>
      <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">{desc}</p>
      {onAction && (
        <button
          onClick={onAction}
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition',
            buttonStyle
          )}
        >
          {type === 'empty' && <RefreshCw className="w-4 h-4" />}
          {btn}
        </button>
      )}
    </div>
  );
};
