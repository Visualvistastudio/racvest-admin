'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Package, CreditCard, Headphones, Flag, Shield, X, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { users, deliveries, supportTickets, transactions, moderationReports, admins } = useAppStore();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut listener for Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Results
  const matchedUsers = q
    ? users.filter(
        (u) =>
          u.id.toLowerCase().includes(q) ||
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q)
      ).slice(0, 4)
    : [];

  const matchedDeliveries = q
    ? deliveries.filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          d.senderName.toLowerCase().includes(q) ||
          (d.travellerName && d.travellerName.toLowerCase().includes(q)) ||
          (d.courierName && d.courierName.toLowerCase().includes(q)) ||
          d.route.toLowerCase().includes(q) ||
          d.packageDescription.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const matchedTickets = q
    ? supportTickets.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const matchedTransactions = q
    ? transactions.filter(
        (tx) =>
          tx.id.toLowerCase().includes(q) ||
          tx.userName.toLowerCase().includes(q) ||
          (tx.deliveryId && tx.deliveryId.toLowerCase().includes(q)) ||
          (tx.providerRef && tx.providerRef.toLowerCase().includes(q))
      ).slice(0, 3)
    : [];

  const matchedReports = q
    ? moderationReports.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.reporterName.toLowerCase().includes(q) ||
          (r.reportedUserName && r.reportedUserName.toLowerCase().includes(q))
      ).slice(0, 3)
    : [];

  const hasResults =
    matchedUsers.length > 0 ||
    matchedDeliveries.length > 0 ||
    matchedTickets.length > 0 ||
    matchedTransactions.length > 0 ||
    matchedReports.length > 0;

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a User ID, Delivery ID, Ticket, Transaction, or Name..."
            className="flex-1 text-sm bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded border border-gray-200">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!q && (
            <div className="py-8 text-center text-gray-400 text-xs space-y-1">
              <p className="font-semibold text-gray-500">Quick Global Search</p>
              <p>Search across marketplace users, live deliveries, finance escrow ledgers, and support tickets.</p>
              <div className="flex items-center justify-center gap-2 pt-3">
                <span className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded">DLV-83921</span>
                <span className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded">RCV-29842</span>
                <span className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded">TXN-99281</span>
                <span className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded">TKT-83921</span>
              </div>
            </div>
          )}

          {q && !hasResults && (
            <div className="py-10 text-center text-xs text-gray-500">
              No matching records found for <span className="font-semibold text-gray-800">"{query}"</span>.
            </div>
          )}

          {/* Users */}
          {matchedUsers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-2">
                Users & Accounts
              </div>
              <div className="space-y-1">
                {matchedUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelect(`/users?userId=${u.id}`)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-brand-green flex items-center justify-center font-bold text-xs">
                        {u.firstName[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900 group-hover:text-brand-green transition">
                          {u.firstName} {u.lastName} <span className="font-normal text-gray-400">({u.id})</span>
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {u.email} • {u.location}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Deliveries */}
          {matchedDeliveries.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-2">
                Deliveries & Shipments
              </div>
              <div className="space-y-1">
                {matchedDeliveries.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelect(`/deliveries?deliveryId=${d.id}`)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900 group-hover:text-brand-green transition">
                          {d.id} • {d.route}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {d.packageDescription} • Sender: {d.senderName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        {d.status.replace('_', ' ')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tickets */}
          {matchedTickets.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-2">
                Support Tickets
              </div>
              <div className="space-y-1">
                {matchedTickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(`/support?ticketId=${t.id}`)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                        <Headphones className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900 group-hover:text-brand-green transition">
                          {t.id}: {t.title}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Customer: {t.customerName} • Priority: {t.priority.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transactions */}
          {matchedTransactions.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-2">
                Finance & Transactions
              </div>
              <div className="space-y-1">
                {matchedTransactions.map((tx) => (
                  <button
                    key={tx.id}
                    onClick={() => handleSelect(`/payments?txnId=${tx.id}`)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-brand-green flex items-center justify-center font-bold text-xs">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900 group-hover:text-brand-green transition">
                          {tx.id} • ₦{(tx.amount / 100).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {tx.description} • {tx.userName}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      {tx.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Moderation */}
          {matchedReports.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-2">
                Trust & Moderation Reports
              </div>
              <div className="space-y-1">
                {matchedReports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(`/moderation?reportId=${r.id}`)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center font-bold text-xs">
                        <Flag className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900 group-hover:text-brand-green transition">
                          {r.id}: {r.type}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Reported: {r.reportedUserName || 'Unknown'} • Severity: {r.severity}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
