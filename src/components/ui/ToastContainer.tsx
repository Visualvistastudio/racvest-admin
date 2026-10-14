'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-l-4 border-l-status-success border-gray-200 bg-status-success-bg text-gray-900';
        let icon = <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0" />;

        if (toast.type === 'warning') {
          borderClass = 'border-l-4 border-l-status-warning border-gray-200 bg-status-warning-bg text-gray-900';
          icon = <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0" />;
        } else if (toast.type === 'danger') {
          borderClass = 'border-l-4 border-l-status-danger border-gray-200 bg-status-danger-bg text-gray-900';
          icon = <AlertCircle className="w-5 h-5 text-status-danger flex-shrink-0" />;
        } else if (toast.type === 'info') {
          borderClass = 'border-l-4 border-l-brand-green border-gray-200 bg-white text-gray-900 shadow-md';
          icon = <Info className="w-5 h-5 text-brand-green flex-shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-sm border text-sm transition-all animate-in fade-in slide-in-from-top-2 duration-200',
              borderClass
            )}
            role="alert"
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 leading-tight">{toast.title}</h4>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{toast.message}</p>
              {toast.actionText && toast.onAction && (
                <button
                  onClick={toast.onAction}
                  className="mt-2 text-xs font-semibold text-brand-green hover:underline inline-block"
                >
                  {toast.actionText}
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition"
              aria-label="Close toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
