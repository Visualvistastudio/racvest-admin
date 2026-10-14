'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Users,
  Package,
  CreditCard,
  Headphones,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';

export default function AnalyticsPage() {
  const {
    users,
    deliveries,
    transactions,
    supportTickets,
    moderationReports,
    safetyIncidents,
    hasPermission,
  } = useAppStore();

  const [dateRange, setDateRange] = useState('30d');
  const [deliveryMode, setDeliveryMode] = useState('all');

  // Authoritative calculations
  const totalUsers = users.length;
  const sendersCount = users.filter((u) => u.roles.includes('sender')).length;
  const travellersCount = users.filter((u) => u.roles.includes('traveller')).length;
  const couriersCount = users.filter((u) => u.roles.includes('courier')).length;

  const totalDeliveries = deliveries.length;
  const completedDeliveries = deliveries.filter((d) => d.status === 'completed').length;
  const cancelledDeliveries = deliveries.filter((d) => d.status === 'cancelled').length;
  const completionRate = Math.round((completedDeliveries / (totalDeliveries || 1)) * 100);
  const cancellationRate = Math.round((cancelledDeliveries / (totalDeliveries || 1)) * 100);

  const travellerDeliveries = deliveries.filter((d) => d.mode === 'traveller').length;
  const courierDeliveries = deliveries.filter((d) => d.mode === 'courier').length;

  const grossVolume = transactions
    .filter((t) => t.status === 'succeeded' && t.type === 'delivery_payment')
    .reduce((sum, t) => sum + t.amount, 0);

  const platformRevenue = Math.round(grossVolume * 0.1);

  const resolvedTickets = supportTickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;
  const ticketResolutionRate = Math.round((resolvedTickets / (supportTickets.length || 1)) * 100);

  const handleExport = () => {
    if (!hasPermission('reports.export' as any) && !hasPermission('finance.export')) {
      alert('Permission Denied: Your administrative role is not authorized to export aggregated reporting data.');
      return;
    }
    alert('Generating aggregated operational and financial performance report (CSV)...');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Analytics & Business Intelligence</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Operational throughput, marketplace liquidity, financial metrics, and trust metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs font-semibold bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none shadow-xs"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last Quarter</option>
            <option value="ytd">Year to Date (2026)</option>
          </select>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-green hover:bg-brand-green-light rounded-lg shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            Export Metrics CSV
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Completion Rate</span>
          <div className="text-3xl font-black text-emerald-700 mt-1">{completionRate}%</div>
          <div className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> +4.2% vs target
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cancellation Rate</span>
          <div className="text-3xl font-black text-gray-900 mt-1">{cancellationRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Within 5% operational threshold</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Gross Escrow Volume</span>
          <div className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(grossVolume)}</div>
          <div className="text-xs text-gray-500 mt-1">Total marketplace throughput</div>
        </div>

        <div className="bg-[#0A2617] text-white p-5 rounded-2xl border border-emerald-950 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Net Platform Revenue</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(platformRevenue)}</div>
          <div className="text-xs text-emerald-300/80 mt-1">10% commission fee model</div>
        </div>
      </div>

      {/* Grid: Marketplace Growth & Logistics Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marketplace User Growth */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">User Growth & Breakdown</h3>
              <p className="text-xs text-gray-400 mt-0.5">Total registered marketplace participants ({totalUsers})</p>
            </div>
            <Users className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
                <span>Senders</span>
                <span>{sendersCount} ({Math.round((sendersCount / totalUsers) * 100)}%)</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-brand-green h-full rounded-full w-[45%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
                <span>Verified Travellers</span>
                <span>{travellersCount} ({Math.round((travellersCount / totalUsers) * 100)}%)</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-brand-orange h-full rounded-full w-[35%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
                <span>Couriers / Fleet Services</span>
                <span>{couriersCount} ({Math.round((couriersCount / totalUsers) * 100)}%)</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full w-[20%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Model Share (Traveller vs Courier) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Delivery Model Utilization</h3>
              <p className="text-xs text-gray-400 mt-0.5">Traveller capacity vs dedicated Courier dispatch</p>
            </div>
            <Package className="w-5 h-5 text-gray-400" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Traveller Model</span>
              <div className="text-3xl font-black text-brand-green mt-2">{travellerDeliveries}</div>
              <div className="text-xs text-emerald-700 font-semibold mt-1">
                {Math.round((travellerDeliveries / (totalDeliveries || 1)) * 100)}% of total deliveries
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Courier Dispatch</span>
              <div className="text-3xl font-black text-blue-700 mt-2">{courierDeliveries}</div>
              <div className="text-xs text-blue-700 font-semibold mt-1">
                {Math.round((courierDeliveries / (totalDeliveries || 1)) * 100)}% of total deliveries
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 leading-relaxed">
            <span className="font-bold text-gray-800">Logistics Insight:</span> Travellers capture high-value, small electronics
            along air corridors (Lagos ↔ Abuja), while Couriers handle heavy cargo and industrial supplies across road routes.
          </div>
        </div>
      </div>

      {/* Grid: Support SLA & Safety Escalations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Support SLA Compliance */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Customer Support SLA Health</h3>
              <p className="text-xs text-gray-400 mt-0.5">Ticket resolution throughput and response SLAs</p>
            </div>
            <Headphones className="w-5 h-5 text-gray-400" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Total Tickets</span>
              <div className="text-xl font-black text-gray-900 mt-1">{supportTickets.length}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Resolution Rate</span>
              <div className="text-xl font-black text-emerald-600 mt-1">{ticketResolutionRate}%</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Avg First Reply</span>
              <div className="text-xl font-black text-gray-900 mt-1">14m</div>
            </div>
          </div>
        </div>

        {/* Safety & Moderation Overview */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Trust & Safety Escalations</h3>
              <p className="text-xs text-gray-400 mt-0.5">Emergency SOS alerts and user misconduct incidents</p>
            </div>
            <ShieldAlert className="w-5 h-5 text-gray-400" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-red-50 rounded-xl text-center border border-red-100">
              <span className="text-[10px] font-bold text-red-700 uppercase">SOS Alerts</span>
              <div className="text-xl font-black text-red-800 mt-1">{safetyIncidents.length}</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-center border border-amber-100">
              <span className="text-[10px] font-bold text-amber-800 uppercase">Moderation</span>
              <div className="text-xl font-black text-amber-900 mt-1">{moderationReports.length}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl text-center border border-gray-100">
              <span className="text-[10px] font-bold text-gray-600 uppercase">Restricted</span>
              <div className="text-xl font-black text-gray-900 mt-1">
                {users.filter((u) => u.accountStatus !== 'active').length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
