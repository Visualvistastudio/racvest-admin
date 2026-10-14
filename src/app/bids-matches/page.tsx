'use client';

import React, { useState } from 'react';
import {
  Gavel,
  Radio,
  Clock,
  MapPin,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Zap,
  ArrowRight,
  Plane,
  Truck,
  Eye,
  ChevronRight,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Offer, Match, TripDeclaration } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function BidsAndMatchesPage() {
  const {
    offers,
    matches,
    tripDeclarations,
    deliveries,
    acceptOffer,
    rejectOffer,
    boostRequest,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'requests' | 'declarations' | 'offers' | 'matches'>('requests');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Live Open Requests matching Bid Monitoring Dashboard.png
  const liveOpenRequests = [
    {
      id: 'REQ-9421-LG',
      title: 'Commercial Solar Batteries & Cables (42kg)',
      zone: 'Lekki-Epe Axis, Lagos',
      timeOpen: '14m 20s',
      bidCount: 12,
      targetPrice: 24500000,
      urgent: false,
    },
    {
      id: 'REQ-2856-ABJ',
      title: 'Emergency Medical Diagnostic Reagents (3kg)',
      zone: 'Maitama Central, Abuja',
      timeOpen: '02m 45s',
      bidCount: 3,
      targetPrice: 1800000,
      urgent: false,
    },
    {
      id: 'REQ-7712-PH',
      title: 'Oilfield Valve Spare Parts (18kg)',
      zone: 'Port Harcourt Port, Rivers',
      timeOpen: '48m 12s',
      bidCount: 1,
      targetPrice: 14500000,
      urgent: true,
    },
    {
      id: 'REQ-3901-KAN',
      title: 'Textile Fabric Samples to Lagos (8kg)',
      zone: 'Kano-Dala Dry Port, Kano',
      timeOpen: '32m 10s',
      bidCount: 2,
      targetPrice: 1200000,
      urgent: true,
    },
  ];

  // Real-time Bid Activity live feed items
  const realTimeFeed = [
    {
      id: 'FEED-01',
      type: 'bid_placed',
      title: 'New Bid Placed',
      description: 'Provider T-TRANS_01 bid ₦245,000 for REQ-9421-LG',
      time: 'Just now',
      color: 'bg-slate-900 text-white',
    },
    {
      id: 'FEED-02',
      type: 'provider_joined',
      title: 'Provider Joined Request',
      description: 'CargoConnect Abuja entered the bidding pool for REQ-2856-ABJ',
      time: '2m ago',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'FEED-03',
      type: 'bid_accepted',
      title: 'Bid Accepted',
      description: 'Request REQ-0012-IB finalized with FastTrack Logistics at ₦110,000',
      time: '5m ago',
      color: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'FEED-04',
      type: 'bid_placed',
      title: 'New Bid Placed',
      description: 'Traveller Tunde B. bid ₦35,000 for Lagos → Abuja transit',
      time: '8m ago',
      color: 'bg-slate-900 text-white',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Bid Monitoring & Marketplace Matches</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor real-time traveller capacity declarations, sender requests, bidding competition, and match assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            Live Marketplace Stream Active
          </span>
        </div>
      </div>

      {/* Main Grid: Left Column (Live Requests & Feed) | Right Column (Zero-Bid Alerts & Zone Health) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Open Requests matching Bid Monitoring Dashboard.png */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">Live Open Requests</h3>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">UPDATED 2S AGO</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-2.5">Request Title</th>
                    <th className="pb-2.5">Zone</th>
                    <th className="pb-2.5">Time Open</th>
                    <th className="pb-2.5">Bid Count</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {liveOpenRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3 pr-3 font-semibold text-gray-900">
                        <span className="font-mono text-brand-green mr-1.5 font-bold">{req.id}</span>
                        <span className="text-gray-700">{req.title}</span>
                      </td>
                      <td className="py-3 px-2 text-gray-600">{req.zone}</td>
                      <td className="py-3 px-2 font-mono text-gray-500">{req.timeOpen}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                req.bidCount > 5 ? 'bg-emerald-600 w-full' : req.bidCount === 1 ? 'bg-red-500 w-1/4' : 'bg-brand-orange w-1/2'
                              }`}
                            />
                          </div>
                          <span className="font-bold text-gray-800">{req.bidCount}</span>
                        </div>
                      </td>
                      <td className="py-3 pl-2 text-right">
                        <button
                          onClick={() => alert(`Inspecting live bidding auction for ${req.id}`)}
                          className="text-xs font-bold text-brand-green hover:underline"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time Bid Activity Live Feed matching Bid Monitoring Dashboard.png */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">Real-time Bid Activity</h3>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> LIVE FEED
              </span>
            </div>

            <div className="space-y-3">
              {realTimeFeed.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${item.color}`}>
                      <Gavel className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">{item.title}</div>
                      <div className="text-[11px] text-gray-600">{item.description}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Zero-Bid Alerts, Supply Health, Avg Bids) */}
        <div className="space-y-6">
          {/* Zero-Bid Alerts matching Bid Monitoring Dashboard.png */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Zero-Bid Alerts</h3>
            </div>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              4 requests have been open for over 30 minutes with 0 bids. Action required to prevent SLA delay.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border-l-4 border-l-red-600 bg-red-50/50 border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">REQ-9901-ENU</span>
                  <span className="text-xs font-bold text-red-600 font-mono">52m</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Enugu - Timber Market</div>
                <button
                  onClick={() => boostRequest('REQ-9901-ENU')}
                  className="mt-3 w-full py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  BOOST VISIBILITY
                </button>
              </div>

              <div className="p-3.5 rounded-xl border-l-4 border-l-red-600 bg-red-50/50 border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">REQ-1022-KN</span>
                  <span className="text-xs font-bold text-red-600 font-mono">41m</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Kano-Dala Dry Port</div>
                <button
                  onClick={() => boostRequest('REQ-1022-KN')}
                  className="mt-3 w-full py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  BOOST VISIBILITY
                </button>
              </div>
            </div>
          </div>

          {/* Supply Health by Zone matching Bid Monitoring Dashboard.png */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Supply Health by Zone</h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="text-gray-900">Lagos</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">High Supply</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full w-4/5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="text-gray-900">Abuja</span>
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px]">Balanced</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-orange h-full rounded-full w-3/5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="text-gray-900">Port Harcourt</span>
                  <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded text-[10px]">Critical Low</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-red-600 h-full rounded-full w-1/4" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="text-gray-900">Kano</span>
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px]">Balanced</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-orange h-full rounded-full w-1/2" />
                </div>
              </div>
            </div>

            {/* Zone Map Card representation */}
            <div className="relative rounded-xl overflow-hidden bg-slate-900 text-center p-4 text-white">
              <div className="text-[11px] text-slate-400 font-semibold mb-2">Nigeria Regional Logistics Grid</div>
              <button
                onClick={() => alert('Opening regional zone coverage heatmap...')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition"
              >
                Expand Zone Map
              </button>
            </div>
          </div>

          {/* Avg. Bids Per Request matching Bid Monitoring Dashboard.png */}
          <div className="bg-[#0A1628] rounded-2xl p-5 text-white shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg. Bids Per Request</div>
            <div className="text-4xl font-black mt-2">8.4</div>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> +12.5% vs last week
            </div>
          </div>
        </div>
      </div>

      {/* Confirmed Matches & Historical Offers Table (PRD Section 9.3) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Confirmed Marketplace Matches</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Verified matches between sender shipments and travellers or couriers with negotiated rates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Total Matches: {matches.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-6">Match ID</th>
                <th className="py-3 px-6">Delivery ID</th>
                <th className="py-3 px-6">Sender</th>
                <th className="py-3 px-6">Matched Provider</th>
                <th className="py-3 px-6">Route</th>
                <th className="py-3 px-6">Agreed Price</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {matches.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/80 transition">
                  <td className="py-4 px-6 font-mono text-xs font-bold text-gray-900">{m.id}</td>
                  <td className="py-4 px-6 font-mono text-xs text-brand-green font-semibold">{m.deliveryId}</td>
                  <td className="py-4 px-6 text-xs font-bold text-gray-900">{m.senderName}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                      {m.providerType === 'traveller' ? (
                        <Plane className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span>{m.providerName}</span>
                      <span className="text-[10px] text-gray-400 capitalize">({m.providerType})</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs font-semibold text-gray-700">{m.route}</td>
                  <td className="py-4 px-6 font-bold text-gray-900">{formatCurrency(m.agreedPrice)}</td>
                  <td className="py-4 px-6">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setSelectedMatch(m)}
                      className="text-xs font-bold text-brand-green hover:underline"
                    >
                      Inspect Match
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Match Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedMatch)}
        onClose={() => setSelectedMatch(null)}
        title={selectedMatch ? `Match Record #${selectedMatch.id}` : ''}
        subtitle={selectedMatch ? `${selectedMatch.route} • ${selectedMatch.providerType.toUpperCase()}` : ''}
        badges={selectedMatch && <StatusBadge status={selectedMatch.status} />}
      >
        {selectedMatch && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400">Delivery ID</span>
                <div className="text-sm font-bold text-gray-900 mt-1">{selectedMatch.deliveryId}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400">Agreed Settlement</span>
                <div className="text-sm font-bold text-brand-green mt-1">
                  {formatCurrency(selectedMatch.agreedPrice)}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Marketplace Parties</h4>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Sender:</span>
                <span className="font-bold text-gray-900">{selectedMatch.senderName} ({selectedMatch.senderId})</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Provider ({selectedMatch.providerType}):</span>
                <span className="font-bold text-gray-900">{selectedMatch.providerName} ({selectedMatch.providerId})</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Matched Timestamp:</span>
                <span className="font-mono text-gray-700">{formatDate(selectedMatch.matchedAt, 'long')}</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              <span className="font-bold">Price Safeguard:</span> Administrators are prohibited from silently altering
              agreed pricing or deleting historical offer negotiations. Any dispute requires formal operational review.
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
