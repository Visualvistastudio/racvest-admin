'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CreditCard,
  Banknote,
  RotateCcw,
  Send,
  Wallet,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Eye,
  Building,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Transaction, Refund, Payout, TransactionType, TransactionStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatCurrency, formatDate } from '@/lib/utils';

function PaymentsContent() {
  const searchParams = useSearchParams();
  const initialTabParam = searchParams.get('tab') as 'transactions' | 'refunds' | 'payouts' | 'wallets' | null;
  const initialTxnId = searchParams.get('txnId');

  const {
    transactions,
    refunds,
    payouts,
    users,
    approveRefund,
    executeRefund,
    rejectRefund,
    approvePayout,
    executePayout,
    rejectPayout,
    hasPermission,
    currentAdmin,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'transactions' | 'refunds' | 'payouts' | 'wallets'>(
    initialTabParam || 'transactions'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(
    initialTxnId ? transactions.find((t) => t.id === initialTxnId) || null : null
  );
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

  // Dialogs
  const [rejectRefundDialogOpen, setRejectRefundDialogOpen] = useState(false);
  const [rejectPayoutDialogOpen, setRejectPayoutDialogOpen] = useState(false);
  const [approveRefundDialogOpen, setApproveRefundDialogOpen] = useState(false);

  // Financial metrics
  const totalVolume = transactions
    .filter((t) => t.status === 'succeeded' && t.type === 'delivery_payment')
    .reduce((sum, t) => sum + t.amount, 0);

  const platformRevenue = Math.round(totalVolume * 0.1); // 10% marketplace fee

  const heldEscrowFunds = transactions
    .filter((t) => t.type === 'delivery_payment' && t.status === 'succeeded')
    .reduce((sum, t) => sum + t.amount, 0) -
    payouts.filter((p) => p.status === 'succeeded').reduce((sum, p) => sum + p.grossAmount, 0);

  const refundsAwaitingReview = refunds.filter((r) => ['requested', 'under_review'].includes(r.status));
  const payoutsAwaitingApproval = payouts.filter((p) => p.status === 'pending_approval');

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = tx.id.toLowerCase().includes(q);
        const matchesUser = tx.userName.toLowerCase().includes(q);
        const matchesRef = tx.providerRef && tx.providerRef.toLowerCase().includes(q);
        const matchesDeliv = tx.deliveryId && tx.deliveryId.toLowerCase().includes(q);
        if (!matchesId && !matchesUser && !matchesRef && !matchesDeliv) return false;
      }
      return true;
    });
  }, [transactions, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Finance & Escrow Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor payment flows, inspect escrow transactions, authorize refunds, and approve provider disbursements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Exporting financial audit ledger (CSV)...')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg shadow-xs hover:bg-gray-50 transition"
          >
            <Download className="w-4 h-4 text-gray-400" />
            Export Financial Ledger
          </button>
        </div>
      </div>

      {/* Financial Overview Metrics (PRD Section 10.2) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Gross Transaction Volume</div>
          <div className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(totalVolume)}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">All successful deliveries</div>
        </div>

        <div className="bg-[#0A2617] text-white p-5 rounded-2xl border border-emerald-950 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Est. Platform Revenue</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(platformRevenue)}</div>
          <div className="text-[11px] text-emerald-200/80 mt-0.5">10% Platform fee commission</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Refunds Awaiting Review</div>
          <div className="text-2xl font-black text-brand-orange mt-1">{refundsAwaitingReview.length}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Requires Finance approval</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Payouts Awaiting Approval</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{payoutsAwaitingApproval.length}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Ready for bank transfer</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        {[
          { id: 'transactions', label: 'Transactions', count: transactions.length },
          { id: 'refunds', label: 'Refund Requests', count: refunds.length },
          { id: 'payouts', label: 'Carrier Payouts', count: payouts.length },
          { id: 'wallets', label: 'User Wallets', count: users.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 ${
                isActive
                  ? 'bg-brand-green text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Transactions Table */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none"
              >
                <option value="all">Status: All</option>
                <option value="succeeded">Succeeded</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>

              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="text-xs font-semibold text-brand-orange hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transaction ID, user, delivery..."
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="py-3 px-6">Transaction ID</th>
                    <th className="py-3 px-6">User / Recipient</th>
                    <th className="py-3 px-6">Related Delivery</th>
                    <th className="py-3 px-6">Type</th>
                    <th className="py-3 px-6">Amount</th>
                    <th className="py-3 px-6">Provider</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Date</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTransaction(tx)}
                      className="hover:bg-gray-50/80 transition cursor-pointer"
                    >
                      <td className="py-4 px-6 font-mono text-xs font-bold text-gray-900">{tx.id}</td>
                      <td className="py-4 px-6">
                        <div className="text-xs font-bold text-gray-900">{tx.userName}</div>
                        <div className="text-[10px] text-gray-400 font-mono">ID: {tx.userId}</div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-brand-green font-semibold">
                        {tx.deliveryId || '—'}
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-700 capitalize">
                        {tx.type.replace(/_/g, ' ')}
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-900">{formatCurrency(tx.amount)}</td>
                      <td className="py-4 px-6 text-xs text-gray-600 capitalize">
                        {tx.provider} ({tx.method})
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-500">{formatDate(tx.createdAt, 'short')}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTransaction(tx);
                          }}
                          className="text-xs font-bold text-brand-green hover:underline"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Refunds Management (PRD Section 10.5) */}
      {activeTab === 'refunds' && (
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Separation of Duties & Approval Controls:</span> Refunds exceeding ₦50,000
              require independent approval from a Finance Administrator before disbursement. An admin who initiates a
              cancellation cannot independently execute its refund.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="py-3 px-6">Refund ID</th>
                    <th className="py-3 px-6">Delivery ID</th>
                    <th className="py-3 px-6">Customer</th>
                    <th className="py-3 px-6">Requested Amount</th>
                    <th className="py-3 px-6">Max Refundable</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Reason / Policy</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {refunds.map((ref) => (
                    <tr
                      key={ref.id}
                      onClick={() => setSelectedRefund(ref)}
                      className="hover:bg-gray-50/80 transition cursor-pointer"
                    >
                      <td className="py-4 px-6 font-mono text-xs font-bold text-gray-900">{ref.id}</td>
                      <td className="py-4 px-6 font-mono text-xs text-brand-green font-semibold">
                        {ref.deliveryId}
                      </td>
                      <td className="py-4 px-6 text-xs font-bold text-gray-900">{ref.requesterName}</td>
                      <td className="py-4 px-6 font-bold text-gray-900">{formatCurrency(ref.amount)}</td>
                      <td className="py-4 px-6 font-mono text-xs text-gray-500">
                        {formatCurrency(ref.maxRefundable)}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={ref.status} />
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-600 max-w-xs truncate">{ref.reason}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRefund(ref);
                          }}
                          className="text-xs font-bold text-brand-green hover:underline"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Carrier Payouts Management (PRD Section 10.6) */}
      {activeTab === 'payouts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="py-3 px-6">Payout ID</th>
                    <th className="py-3 px-6">Recipient</th>
                    <th className="py-3 px-6">Delivery ID</th>
                    <th className="py-3 px-6">Gross Amount</th>
                    <th className="py-3 px-6">Platform Fee</th>
                    <th className="py-3 px-6">Net Payout</th>
                    <th className="py-3 px-6">Destination Bank</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payouts.map((pay) => (
                    <tr
                      key={pay.id}
                      onClick={() => setSelectedPayout(pay)}
                      className="hover:bg-gray-50/80 transition cursor-pointer"
                    >
                      <td className="py-4 px-6 font-mono text-xs font-bold text-gray-900">{pay.id}</td>
                      <td className="py-4 px-6">
                        <div className="text-xs font-bold text-gray-900">{pay.recipientName}</div>
                        <div className="text-[10px] text-gray-400 capitalize">({pay.recipientType})</div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-brand-green font-semibold">
                        {pay.deliveryId}
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-700">{formatCurrency(pay.grossAmount)}</td>
                      <td className="py-4 px-6 text-xs text-red-600">-{formatCurrency(pay.fees)}</td>
                      <td className="py-4 px-6 font-bold text-emerald-700">{formatCurrency(pay.netAmount)}</td>
                      <td className="py-4 px-6 text-xs font-mono text-gray-600">{pay.destinationRef}</td>
                      <td className="py-4 px-6">
                        <StatusBadge status={pay.status} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPayout(pay);
                          }}
                          className="text-xs font-bold text-brand-green hover:underline"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: User Wallets Ledger (PRD Section 10.7) */}
      {activeTab === 'wallets' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">User Wallet Balances & Escrow Holds</h3>
            <p className="text-xs text-gray-500">Live balances stored in secure Nigerian banking escrow.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-6">User</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Available Balance</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-4 px-6 font-bold text-xs text-gray-900">
                      {u.firstName} {u.lastName} <span className="text-gray-400 font-normal">({u.id})</span>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-600 capitalize">{u.roles.join(', ')}</td>
                    <td className="py-4 px-6 font-bold text-brand-green">{formatCurrency(u.walletBalance)}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={u.accountStatus} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => alert(`Viewing complete wallet ledger for ${u.firstName} ${u.lastName}`)}
                        className="text-xs font-bold text-brand-green hover:underline"
                      >
                        Ledger &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
        title={selectedTransaction ? `Transaction #${selectedTransaction.id}` : ''}
        subtitle={selectedTransaction ? `GATEWAY REF • ${selectedTransaction.providerRef || 'N/A'}` : ''}
        badges={selectedTransaction && <StatusBadge status={selectedTransaction.status} />}
      >
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400">Transaction Amount</span>
                <div className="text-xl font-black text-gray-900 mt-1">
                  {formatCurrency(selectedTransaction.amount)}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400">Payment Method</span>
                <div className="text-sm font-bold text-gray-900 mt-1 capitalize">
                  {selectedTransaction.method.replace('_', ' ')} ({selectedTransaction.provider})
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3 text-xs">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gateway Audit Trail</h4>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Party:</span>
                <span className="font-bold text-gray-900">{selectedTransaction.userName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Related Delivery:</span>
                <span className="font-mono font-bold text-brand-green">{selectedTransaction.deliveryId || 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Initiated At:</span>
                <span className="font-mono text-gray-700">{formatDate(selectedTransaction.createdAt, 'long')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Provider Confirmation:</span>
                <span className="font-mono text-emerald-700">
                  {selectedTransaction.confirmedAt ? formatDate(selectedTransaction.confirmedAt, 'long') : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Refund Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedRefund)}
        onClose={() => setSelectedRefund(null)}
        title={selectedRefund ? `Refund Request #${selectedRefund.id}` : ''}
        subtitle={selectedRefund ? `ESCROW REFUND • ${selectedRefund.deliveryId}` : ''}
        badges={selectedRefund && <StatusBadge status={selectedRefund.status} />}
        actions={
          selectedRefund && (
            <div className="flex items-center gap-2">
              {['requested', 'under_review'].includes(selectedRefund.status) && (
                <>
                  <button
                    onClick={() => setApproveRefundDialogOpen(true)}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-brand-green hover:bg-brand-green-light rounded-lg shadow-xs transition"
                  >
                    Approve Refund
                  </button>
                  <button
                    onClick={() => setRejectRefundDialogOpen(true)}
                    className="px-4 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition"
                  >
                    Reject
                  </button>
                </>
              )}

              {selectedRefund.status === 'approved' && (
                <button
                  onClick={() => {
                    executeRefund(selectedRefund.id);
                    setSelectedRefund(refunds.find((r) => r.id === selectedRefund.id) || null);
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Execute Gateway Refund
                </button>
              )}
            </div>
          )
        }
      >
        {selectedRefund && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400">Refund Amount</span>
                <div className="text-xl font-black text-gray-900 mt-1">{formatCurrency(selectedRefund.amount)}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400">Max Refundable Balance</span>
                <div className="text-sm font-bold text-brand-green mt-1">
                  {formatCurrency(selectedRefund.maxRefundable)}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3 text-xs">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Policy Compliance Review</h4>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-medium">
                {selectedRefund.policyEligibility}
              </div>

              <div className="space-y-2 pt-2">
                <div>
                  <span className="font-bold text-gray-700">Customer Cancellation Reason:</span>
                  <p className="text-gray-600 mt-0.5">{selectedRefund.reason}</p>
                </div>
                {selectedRefund.notes && (
                  <div>
                    <span className="font-bold text-gray-700">Case Investigation Notes:</span>
                    <p className="text-gray-600 mt-0.5">{selectedRefund.notes}</p>
                  </div>
                )}
                {selectedRefund.providerRef && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-mono">
                    Provider Transaction Reference: {selectedRefund.providerRef}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Payout Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedPayout)}
        onClose={() => setSelectedPayout(null)}
        title={selectedPayout ? `Carrier Payout #${selectedPayout.id}` : ''}
        subtitle={selectedPayout ? `BANK DISBURSEMENT • ${selectedPayout.deliveryId}` : ''}
        badges={selectedPayout && <StatusBadge status={selectedPayout.status} />}
        actions={
          selectedPayout && (
            <div className="flex items-center gap-2">
              {selectedPayout.status === 'pending_approval' && (
                <>
                  <button
                    onClick={() => {
                      approvePayout(selectedPayout.id, 'Verified delivery completion proof and recipient OTP code');
                      setSelectedPayout(payouts.find((p) => p.id === selectedPayout.id) || null);
                    }}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-brand-green hover:bg-brand-green-light rounded-lg shadow-xs transition"
                  >
                    Approve Payout
                  </button>
                  <button
                    onClick={() => setRejectPayoutDialogOpen(true)}
                    className="px-4 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition"
                  >
                    Reject
                  </button>
                </>
              )}

              {selectedPayout.status === 'approved' && (
                <button
                  onClick={() => {
                    executePayout(selectedPayout.id);
                    setSelectedPayout(payouts.find((p) => p.id === selectedPayout.id) || null);
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Initiate Bank Transfer
                </button>
              )}
            </div>
          )
        }
      >
        {selectedPayout && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400">Gross Delivery Fee</span>
                <div className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(selectedPayout.grossAmount)}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400">Commission Fee</span>
                <div className="text-sm font-bold text-red-600 mt-1">-{formatCurrency(selectedPayout.fees)}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400">Net Transfer</span>
                <div className="text-sm font-black text-brand-green mt-1">
                  {formatCurrency(selectedPayout.netAmount)}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3 text-xs">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Disbursement Account</h4>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Building className="w-6 h-6 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="font-bold text-gray-900">{selectedPayout.destinationRef}</div>
                  <div className="text-[11px] text-gray-500">
                    Recipient: {selectedPayout.recipientName} ({selectedPayout.recipientType})
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Confirmation Modals for Finance */}
      {selectedRefund && (
        <>
          <ConfirmDialog
            isOpen={approveRefundDialogOpen}
            onClose={() => setApproveRefundDialogOpen(false)}
            title={`Approve ₦${(selectedRefund.amount / 100).toLocaleString()} Refund?`}
            description={`Verify that cargo was not in possession of carrier or has been safely returned. This approval unlocks gateway execution.`}
            confirmLabel="Approve Refund"
            variant="primary"
            requireReason={true}
            reasonPlaceholder="Mandatory Finance justification (e.g. Cancelled pre-pickup, agreed dispute settlement)..."
            onConfirm={(reason) => {
              approveRefund(selectedRefund.id, reason || 'Compliance approved');
              setSelectedRefund(refunds.find((r) => r.id === selectedRefund.id) || null);
            }}
          />

          <ConfirmDialog
            isOpen={rejectRefundDialogOpen}
            onClose={() => setRejectRefundDialogOpen(false)}
            title="Reject Refund Request?"
            description="The sender will be notified that the refund request has been denied per marketplace terms."
            confirmLabel="Reject Refund"
            variant="danger"
            requireReason={true}
            reasonPlaceholder="Mandatory rejection reason (e.g. Delivery confirmed delivered, unauthorized cancellation)..."
            onConfirm={(reason) => {
              rejectRefund(selectedRefund.id, reason || 'Refund rejected');
              setSelectedRefund(refunds.find((r) => r.id === selectedRefund.id) || null);
            }}
          />
        </>
      )}

      {selectedPayout && (
        <ConfirmDialog
          isOpen={rejectPayoutDialogOpen}
          onClose={() => setRejectPayoutDialogOpen(false)}
          title="Reject Carrier Payout?"
          description="Carrier payout disbursement will be halted pending dispute resolution."
          confirmLabel="Reject Payout"
          variant="danger"
          requireReason={true}
          reasonPlaceholder="Mandatory reason for withholding payout..."
          onConfirm={(reason) => {
            rejectPayout(selectedPayout.id, reason || 'Payout halted');
            setSelectedPayout(payouts.find((p) => p.id === selectedPayout.id) || null);
          }}
        />
      )}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton rows={5} message="Loading financial transactions and escrow balances..." />}>
      <PaymentsContent />
    </Suspense>
  );
}
