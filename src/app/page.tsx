'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Banknote,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  UserCheck,
  FileQuestion,
  RefreshCw,
  Send,
  Navigation,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OverviewDashboardPage() {
  const router = useRouter();
  const {
    deliveries,
    users,
    userVerifications,
    transactions,
    supportTickets,
    moderationReports,
    safetyIncidents,
    refunds,
    payouts,
  } = useAppStore();

  // Dynamic calculations derived directly from authoritative collections
  const totalDeliveries = deliveries.length;
  const activeDeliveries = deliveries.filter((d) => ['picked_up', 'in_transit'].includes(d.status)).length;
  const completedDeliveries = deliveries.filter((d) => d.status === 'completed').length;
  const cancelledDeliveries = deliveries.filter((d) => d.status === 'cancelled').length;
  const pendingRequests = deliveries.filter((d) =>
    ['request_created', 'searching', 'offers_received', 'awaiting_pickup'].includes(d.status)
  ).length;

  // Platform gross volume and estimated platform fee commission (e.g. 10%)
  const totalCapturedPayments = transactions
    .filter((t) => t.type === 'delivery_payment' && t.status === 'succeeded')
    .reduce((sum, t) => sum + t.amount, 0);

  const platformRevenue = Math.round(totalCapturedPayments * 0.1); // 10% platform fee

  // Recent transactions table
  const recentTransactions = transactions.slice(0, 6);

  // Active Map Corridors
  const activeCorridors = [
    { from: 'Lagos', to: 'Abuja', couriers: 18, status: 'Heavy Cargo Corridor', speed: 'Normal' },
    { from: 'Lagos', to: 'Port Harcourt', couriers: 12, status: 'Detour advisory at Ore', speed: 'Moderate' },
    { from: 'Abuja', to: 'Kano', couriers: 9, status: 'Clear Expressway', speed: 'Fast' },
    { from: 'Ibadan', to: 'Lagos', couriers: 24, status: 'High Frequency', speed: 'Fast' },
    { from: 'Enugu', to: 'Onitsha', couriers: 8, status: 'Active Bridge Route', speed: 'Normal' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Operational throughput, active Nigeria logistics corridors, and real-time marketplace exceptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Marketplace Engine Online
          </span>
        </div>
      </div>

      {/* Top Metric Cards Row matching Super Admin Home.png */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Deliveries */}
        <Link
          href="/deliveries"
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-brand-green/40 hover:shadow-sm transition group"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Deliveries</div>
          <div className="text-2xl font-black text-gray-900 mt-1 flex items-baseline justify-between">
            <span>{totalDeliveries.toLocaleString()}</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +8.4%
            </span>
          </div>
        </Link>

        {/* Active Deliveries */}
        <Link
          href="/deliveries?status=in_transit"
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-brand-green/40 hover:shadow-sm transition group"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active Deliveries</div>
          <div className="text-2xl font-black text-gray-900 mt-1 flex items-baseline justify-between">
            <span>{activeDeliveries}</span>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
              LIVE
            </span>
          </div>
        </Link>

        {/* Completed */}
        <Link
          href="/deliveries?status=completed"
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-brand-green/40 hover:shadow-sm transition group"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Completed</div>
          <div className="text-2xl font-black text-gray-900 mt-1 flex items-baseline justify-between">
            <span>{completedDeliveries}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        </Link>

        {/* Cancelled */}
        <Link
          href="/deliveries?status=cancelled"
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-brand-green/40 hover:shadow-sm transition group"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cancelled</div>
          <div className="text-2xl font-black text-gray-900 mt-1 flex items-baseline justify-between">
            <span>{cancelledDeliveries}</span>
            <span className="text-[11px] font-bold text-red-500 flex items-center gap-0.5">
              <AlertTriangle className="w-3 h-3" /> 2.1%
            </span>
          </div>
        </Link>

        {/* Pending Requests */}
        <Link
          href="/deliveries?status=pending"
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-brand-green/40 hover:shadow-sm transition group"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pending Requests</div>
          <div className="text-2xl font-black text-gray-900 mt-1 flex items-baseline justify-between">
            <span>{pendingRequests}</span>
            <Clock className="w-4 h-4 text-brand-orange" />
          </div>
        </Link>

        {/* Platform Revenue */}
        <Link
          href="/payments"
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-brand-green/40 hover:shadow-sm transition group"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Est. Platform Revenue</div>
          <div className="text-xl font-black text-brand-green mt-1 flex items-baseline justify-between truncate">
            <span>{formatCurrency(platformRevenue)}</span>
            <Banknote className="w-4 h-4 text-brand-green flex-shrink-0" />
          </div>
        </Link>
      </div>

      {/* Middle Section: Live Delivery Map & Alert Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Delivery Map Corridor Canvas */}
        <div className="lg:col-span-2 bg-[#0A1628] rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[380px] border border-slate-800">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 z-10">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400" /> Live Delivery Map & Corridors
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tracking {activeDeliveries} active couriers & verified travellers across Nigeria routes
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> DELIVERED
              </span>
              <span className="flex items-center gap-1.5 text-brand-orange">
                <span className="w-2 h-2 rounded-full bg-brand-orange" /> EN ROUTE
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-400" /> SCHEDULED
              </span>
            </div>
          </div>

          {/* Interactive Map Visual Visualization */}
          <div className="relative my-6 flex-1 flex items-center justify-center">
            {/* Visual radar background rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-72 h-72 rounded-full border border-emerald-500/40 animate-ping" />
              <div className="w-96 h-96 rounded-full border border-slate-700 absolute" />
            </div>

            {/* Hub Nodes Representation */}
            <div className="w-full max-w-lg grid grid-cols-2 md:grid-cols-3 gap-3 z-10">
              <div className="bg-slate-900/80 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>Lagos Hub</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-lg font-black text-white mt-1">42 Couriers</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Ikeja • VI • Lekki</div>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span>Abuja FCT</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
                <div className="text-lg font-black text-white mt-1">28 Couriers</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Wuse 2 • Maitama</div>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition">
                <div className="flex items-center justify-between text-xs font-bold text-blue-400">
                  <span>Port Harcourt</span>
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                </div>
                <div className="text-lg font-black text-white mt-1">16 Couriers</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Trans-Amadi • GRA</div>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition">
                <div className="flex items-center justify-between text-xs font-bold text-purple-400">
                  <span>Kano Hub</span>
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                </div>
                <div className="text-lg font-black text-white mt-1">19 Couriers</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Bompai • Dala Port</div>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
                  <span>Ibadan Hub</span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                </div>
                <div className="text-lg font-black text-white mt-1">21 Couriers</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Bodija • Dugbe</div>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition">
                <div className="flex items-center justify-between text-xs font-bold text-pink-400">
                  <span>Enugu Hub</span>
                  <span className="w-2 h-2 rounded-full bg-pink-400" />
                </div>
                <div className="text-lg font-black text-white mt-1">14 Couriers</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Independence Layout</div>
              </div>
            </div>
          </div>

          {/* Bottom active corridors bar */}
          <div className="border-t border-slate-800 pt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 z-10">
            <span className="font-semibold text-slate-300">Live Interstate Transit Corridors:</span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-emerald-400 font-bold">Lagos ↔ Abuja: 18 Trips</span>
              <span className="text-brand-orange font-bold">Lagos ↔ PH: 12 Trips</span>
              <span className="text-blue-400 font-bold">Abuja ↔ Kano: 9 Trips</span>
            </div>
            <Link
              href="/bids-matches"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
            >
              Corridor Diagnostics <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Col: Alert Feed & Quick Actions */}
        <div className="space-y-6">
          {/* Alert Feed matching Super Admin Home.png */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Alert Feed</h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                4 NEW
              </span>
            </div>

            <div className="space-y-3">
              {/* Failed Payment Alert */}
              <Link
                href="/payments?tab=transactions"
                className="block p-3 rounded-xl border-l-4 border-l-red-600 bg-red-50/40 hover:bg-red-50 border border-gray-100 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-900">Failed Payment: ORD-8834</span>
                  <span className="text-[10px] text-gray-400">2 MINS AGO</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Sender card payment of ₦85,000 was declined (Insufficient funds).
                </p>
              </Link>

              {/* Delayed Delivery Alert */}
              <Link
                href="/deliveries?deliveryId=DLV-83921"
                className="block p-3 rounded-xl border-l-4 border-l-brand-orange bg-amber-50/40 hover:bg-amber-50 border border-gray-100 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">Delayed Delivery Alert</span>
                  <span className="text-[10px] text-gray-400">15 MINS AGO</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Traveller Tunde B. flight rerouted to Kaduna for DLV-83921 (MacBook Pro).
                </p>
              </Link>

              {/* Pending Business App */}
              <Link
                href="/users?tab=pending"
                className="block p-3 rounded-xl border-l-4 border-l-blue-600 bg-blue-50/40 hover:bg-blue-50 border border-gray-100 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900">Pending Business App</span>
                  <span className="text-[10px] text-gray-400">1 HOUR AGO</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Global Logistics Nigeria submitted CAC & biometric verification.
                </p>
              </Link>

              {/* System Integrity Check */}
              <div className="p-3 rounded-xl border-l-4 border-l-emerald-600 bg-emerald-50/40 border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">System Integrity Check</span>
                  <span className="text-[10px] text-gray-400">3 HOURS AGO</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Escrow treasury ledger & biometric verification checksum passed.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>

            <div className="space-y-2">
              <Link
                href="/support"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-brand-green/40 hover:bg-gray-50 transition group text-sm font-semibold text-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <span>Open Operational Dispute</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-green transition" />
              </Link>

              <Link
                href="/users?role=courier"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-brand-green/40 hover:bg-gray-50 transition group text-sm font-semibold text-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span>Approve Courier Verification</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-green transition" />
              </Link>

              <Link
                href="/users?role=traveller"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-brand-green/40 hover:bg-gray-50 transition group text-sm font-semibold text-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-brand-green flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>Verify Active Traveler</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-green transition" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Transactions Table matching Super Admin Home.png */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight">Recent Transactions</h3>
            <p className="text-xs text-gray-500 mt-0.5">Live payments, escrow holds, and completed disbursements</p>
          </div>

          <Link
            href="/payments"
            className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1"
          >
            View All Report <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-6">Transaction ID</th>
                <th className="py-3 px-6">User / Entity</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Method</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/80 transition">
                  <td className="py-4 px-6 font-mono text-xs font-bold text-gray-900">{tx.id}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                        {tx.userName[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">{tx.userName}</div>
                        <div className="text-[11px] text-gray-400">{tx.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-bold text-gray-900">{formatCurrency(tx.amount)}</td>
                  <td className="py-4 px-6 text-xs text-gray-600 capitalize">
                    {tx.method.replace('_', ' ')} ({tx.provider})
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-500">{formatDate(tx.createdAt, 'short')}</td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/payments?txnId=${tx.id}`}
                      className="text-xs font-bold text-brand-green hover:underline"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
