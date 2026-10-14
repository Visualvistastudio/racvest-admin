'use client';

import React, { useState } from 'react';
import { AlertTriangle, UserX, Ban, HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  requireReason?: boolean;
  reasonPlaceholder?: string;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  requireReason = false,
  reasonPlaceholder = 'Please enter a mandatory justification for this action...',
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError('A justification reason is required for compliance and audit logging.');
      return;
    }
    setError('');
    onConfirm(reason);
    setReason('');
    onClose();
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  let iconBg = 'bg-red-50 text-red-600 border border-red-100';
  let buttonBg = 'bg-red-700 hover:bg-red-800 text-white';
  let Icon = Ban;

  if (variant === 'warning') {
    iconBg = 'bg-amber-50 text-amber-600 border border-amber-100';
    buttonBg = 'bg-amber-600 hover:bg-amber-700 text-white';
    Icon = UserX;
  } else if (variant === 'primary') {
    iconBg = 'bg-emerald-50 text-brand-green border border-emerald-100';
    buttonBg = 'bg-brand-green hover:bg-brand-green-light text-white';
    Icon = AlertTriangle;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-100 p-6 animate-in zoom-in-95 duration-150 relative"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className={cn('w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0', iconBg)}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-snug">{title}</h3>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-4">{description}</p>

        {requireReason && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Action Justification / Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder={reasonPlaceholder}
              rows={3}
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green transition resize-none"
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={cn('px-5 py-2 text-sm font-medium rounded-lg shadow-sm transition', buttonBg)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
