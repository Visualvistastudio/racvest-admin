'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badges,
  actions,
  children,
  width = '2xl',
}) => {
  // Listen for escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  let widthClass = 'max-w-2xl';
  if (width === 'lg') widthClass = 'max-w-xl';
  if (width === 'xl') widthClass = 'max-w-3xl';
  if (width === '2xl') widthClass = 'max-w-4xl';
  if (width === '3xl') widthClass = 'max-w-5xl';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div
          className={cn(
            'w-screen max-w-full bg-white shadow-2xl flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-200',
            widthClass
          )}
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-surface-secondary/50">
            <div className="min-w-0 pr-2">
              {subtitle && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-0.5 truncate">
                  {subtitle}
                </span>
              )}
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight truncate">{title}</h2>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {badges}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Row if present */}
          {actions && (
            <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-white flex flex-wrap items-center gap-2">
              {actions}
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
