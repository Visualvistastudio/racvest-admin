'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Package,
  Plane,
  Truck,
  Search,
  Calendar,
  Filter,
  Download,
  Plus,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  User,
  MapPin,
  Banknote,
  FileText,
  ChevronRight,
  RefreshCw,
  X,
  Gavel,
  Globe,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Delivery, DeliveryMode, DeliveryStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatCurrency, formatDate } from '@/lib/utils';

function DeliveriesContent() {
  const searchParams = useSearchParams();
  const initialDeliveryId = searchParams.get('deliveryId');
  const initialStatusParam = searchParams.get('status');

  const {
    deliveries,
    updateDeliveryStatus,
    requestDeliveryCancellation,
    reassignDelivery,
    hasPermission,
    currentAdmin,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'all' | 'in_transit' | 'disputed' | 'cancelled'>(
    initialStatusParam === 'in_transit'
      ? 'in_transit'
      : initialStatusParam === 'cancelled'
      ? 'cancelled'
      : initialStatusParam === 'disputed'
      ? 'disputed'
      : 'all'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'traveller' | 'courier'>('all');
  const [hubFilter, setHubFilter] = useState('all');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    initialDeliveryId ? deliveries.find((d) => d.id === initialDeliveryId) || null : null
  );

  // Modal dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<DeliveryStatus>('in_transit');
  const [statusNote, setStatusNote] = useState('');
  const [reassignProvider, setReassignProvider] = useState({ id: 'RCV-10105', name: 'Ibrahim Sani', mode: 'courier' as DeliveryMode });

  // Filtered deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      // Tab filter
      if (activeTab === 'in_transit' && !['picked_up', 'in_transit'].includes(d.status)) return false;
      if (activeTab === 'disputed' && d.status !== 'disputed') return false;
      if (activeTab === 'cancelled' && !['cancelled', 'cancellation_requested', 'cancellation_under_review'].includes(d.status)) return false;

      // Mode filter
      if (modeFilter !== 'all' && d.mode !== modeFilter) return false;

      // Hub/Route filter
      if (hubFilter !== 'all' && !d.route.toLowerCase().includes(hubFilter.toLowerCase())) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = d.id.toLowerCase().includes(q);
        const matchesSender = d.senderName.toLowerCase().includes(q);
        const matchesProvider =
          (d.travellerName && d.travellerName.toLowerCase().includes(q)) ||
          (d.courierName && d.courierName.toLowerCase().includes(q));
        const matchesRoute = d.route.toLowerCase().includes(q);
        const matchesDesc = d.packageDescription.toLowerCase().includes(q);
        if (!matchesId && !matchesSender && !matchesProvider && !matchesRoute && !matchesDesc) return false;
      }

      return true;
    });
  }, [deliveries, activeTab, modeFilter, hubFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header matching Shipments Management.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Shipments & Orders</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage real-time logistics and operational throughput across traveller and courier delivery models.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Exporting shipments to CSV...')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-gray-400" />
            Export CSV
          </button>

          <button
            onClick={() => alert('Opening manual shipment booking modal for operations staff...')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0A1628] hover:bg-slate-800 rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            + New Shipment
          </button>
        </div>
      </div>

      {/* Tabs matching Shipments Management.png */}
      <div className="flex items-center gap-6 border-b border-gray-200 text-sm font-semibold overflow-x-auto scrollbar-none whitespace-nowrap">
        {[
          { id: 'all', label: 'All Shipments' },
          { id: 'in_transit', label: 'In Transit' },
          { id: 'disputed', label: 'Disputed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 relative transition ${
                isActive ? 'text-gray-900 font-bold border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Row matching Shipments Management.png */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Shipment Type */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
              Shipment Type
            </span>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as any)}
              className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 outline-none"
            >
              <option value="all">All Types</option>
              <option value="traveller">Traveller Delivery</option>
              <option value="courier">Courier Dispatch</option>
            </select>
          </div>

          {/* Origin Hub */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
              Origin Hub / Route
            </span>
            <select
              value={hubFilter}
              onChange={(e) => setHubFilter(e.target.value)}
              className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 outline-none"
            >
              <option value="all">Global (All Cities)</option>
              <option value="lagos">Lagos Corridor</option>
              <option value="abuja">Abuja Corridor</option>
              <option value="kano">Kano Corridor</option>
              <option value="port harcourt">Port Harcourt</option>
            </select>
          </div>

          {(modeFilter !== 'all' || hubFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setModeFilter('all');
                setHubFilter('all');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-brand-orange hover:underline self-end pb-2"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Search & Results counter */}
        <div className="flex items-center gap-3 self-end w-full sm:w-auto">
          <span className="text-xs text-gray-500 font-medium hidden sm:inline">
            Showing {filteredDeliveries.length} results
          </span>

          <div className="relative w-full sm:w-64 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shipments, IDs, users..."
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-gray-900 outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
        </div>
      </div>

      {/* Table matching Shipments Management.png */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {filteredDeliveries.length === 0 ? (
          <EmptyState
            type="no-results"
            title="No deliveries match criteria"
            description="No active shipments matched your selected tabs, shipment types, and hub routes."
            actionText="Clear all filters"
            onAction={() => {
              setActiveTab('all');
              setModeFilter('all');
              setHubFilter('all');
              setSearchQuery('');
            }}
          />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">
                  <th className="py-3 px-6">ID</th>
                  <th className="py-3 px-6">Sender</th>
                  <th className="py-3 px-6">Courier / Traveler</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Route (O/D)</th>
                  <th className="py-3 px-6">Bid / Competition</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredDeliveries.map((delivery) => {
                  const isTraveller = delivery.mode === 'traveller';
                  const providerName = isTraveller ? delivery.travellerName : delivery.courierName;

                  return (
                    <tr
                      key={delivery.id}
                      onClick={() => setSelectedDelivery(delivery)}
                      className="hover:bg-gray-50/80 transition cursor-pointer"
                    >
                      {/* ID */}
                      <td className="py-4 px-6 font-mono text-xs font-bold text-gray-900">
                        #{delivery.id}
                        {delivery.isDelayed && (
                          <span className="block text-[10px] text-red-600 font-semibold mt-0.5">Delayed</span>
                        )}
                      </td>

                      {/* Sender */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs uppercase border border-gray-200">
                            {delivery.senderName[0]}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900">{delivery.senderName}</div>
                            <div className="text-[10px] text-gray-400 capitalize">
                              {delivery.packageCategory || 'Package'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Courier / Traveler with explicit icons */}
                      <td className="py-4 px-6">
                        {providerName ? (
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-800">
                            {isTraveller ? (
                              <Plane className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            )}
                            <div>
                              <span>{providerName}</span>
                              <span className="text-[10px] text-gray-400 block capitalize">
                                ({delivery.mode})
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                            Pending Assignment
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <StatusBadge status={delivery.status} />
                      </td>

                      {/* Route */}
                      <td className="py-4 px-6 text-xs font-semibold text-gray-800">
                        {delivery.route}
                      </td>

                      {/* Bid Count / Bar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                delivery.isDelayed
                                  ? 'bg-red-500 w-4/5'
                                  : delivery.status === 'completed'
                                  ? 'bg-gray-400 w-full'
                                  : 'bg-emerald-600 w-3/5'
                              }`}
                            />
                          </div>
                          <span
                            className={`text-xs font-bold ${
                              delivery.isDelayed ? 'text-red-600' : 'text-gray-700'
                            }`}
                          >
                            {delivery.isDelayed ? '45 Bids' : '12 Bids'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDelivery(delivery);
                          }}
                          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div>Page 1 of 42</div>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition">
              &lt;
            </button>
            <button className="px-3 py-1 bg-slate-900 text-white font-bold rounded-md">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition">
              2
            </button>
            <button className="px-3 py-1 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition">
              3
            </button>
            <button className="px-3 py-1 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition">
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Summary Cards matching Shipments Management.png */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* VOLUME OVERVIEW */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Volume Overview</div>
            <div className="text-3xl font-black text-gray-900 mt-1">1,284</div>
            <div className="text-xs font-bold text-emerald-600 mt-0.5">~ +12.4% vs last month</div>
          </div>
          {/* Mini Bar Chart Mock */}
          <div className="flex items-end gap-1.5 h-12">
            <div className="w-3 bg-slate-200 rounded-t h-4" />
            <div className="w-3 bg-slate-200 rounded-t h-7" />
            <div className="w-3 bg-slate-300 rounded-t h-9" />
            <div className="w-3 bg-[#0A1628] rounded-t h-12" />
          </div>
        </div>

        {/* BID COMPETITION AVG */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Bid Competition Avg</div>
            <div className="text-3xl font-black text-gray-900 mt-1">18.2</div>
            <div className="text-xs text-gray-500 mt-0.5">Bids per active order</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-brand-green flex items-center justify-center border border-emerald-100">
            <Gavel className="w-6 h-6" />
          </div>
        </div>

        {/* GLOBAL NETWORK LOAD */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div className="flex-1 mr-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Global Network Load</div>
            <div className="text-xl font-black text-gray-900 mt-1">82% Capacity</div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full w-[82%]" />
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
            <Globe className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Delivery Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedDelivery)}
        onClose={() => setSelectedDelivery(null)}
        title={selectedDelivery ? `Shipment #${selectedDelivery.id}` : ''}
        subtitle={selectedDelivery ? `${selectedDelivery.mode.toUpperCase()} DELIVERY • ${selectedDelivery.route}` : ''}
        badges={
          selectedDelivery && (
            <div className="flex items-center gap-2">
              <StatusBadge status={selectedDelivery.status} />
              <StatusBadge status={selectedDelivery.paymentStatus} />
            </div>
          )
        }
        actions={
          selectedDelivery && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Update Button */}
              <button
                onClick={() => {
                  setNewStatus(selectedDelivery.status);
                  setStatusUpdateDialogOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Change Status
              </button>

              {/* Reassign Provider Button */}
              <button
                onClick={() => setReassignDialogOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
              >
                Reassign Carrier
              </button>

              {/* Cancellation Workflow Button */}
              {['cancelled', 'cancellation_under_review'].includes(selectedDelivery.status) ? (
                <span className="text-xs font-bold text-amber-700 px-3 py-1 bg-amber-50 rounded-lg border border-amber-200">
                  Under Cancellation Protocol
                </span>
              ) : (
                <button
                  onClick={() => setCancelDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Initiate Cancellation
                </button>
              )}
            </div>
          )
        }
      >
        {selectedDelivery && (
          <div className="space-y-6">
            {/* Package & Route Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Declared Value</div>
                <div className="text-sm font-bold text-gray-900 mt-1">
                  {formatCurrency(selectedDelivery.declaredValue)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Agreed Fee</div>
                <div className="text-sm font-bold text-brand-green mt-1">
                  {formatCurrency(selectedDelivery.agreedPrice || 0)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Cargo Weight</div>
                <div className="text-sm font-bold text-gray-900 mt-1">
                  {selectedDelivery.packageWeight || 2.5} kg
                </div>
              </div>
            </div>

            {/* Package Description & Images */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Package Manifest</h3>
              <p className="text-sm font-semibold text-gray-900">{selectedDelivery.packageDescription}</p>

              {selectedDelivery.notes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                  <span className="font-bold">Operational Note:</span> {selectedDelivery.notes}
                </div>
              )}

              {selectedDelivery.packageImages && selectedDelivery.packageImages.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-gray-700 block mb-2">Package Inspection Images:</span>
                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {selectedDelivery.packageImages.map((img, i) => (
                      <div key={i} className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                        <img src={img} alt="Package" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Participants (Sender & Carrier) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sender */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Sender Details</span>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-gray-800">
                    {selectedDelivery.senderName[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">{selectedDelivery.senderName}</div>
                    <div className="text-[10px] text-gray-400">ID: {selectedDelivery.senderId}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 flex items-center gap-1 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" /> Pickup: {selectedDelivery.pickupLocation}
                </div>
              </div>

              {/* Carrier */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                  Assigned Carrier ({selectedDelivery.mode})
                </span>
                {selectedDelivery.travellerName || selectedDelivery.courierName ? (
                  <>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-brand-green flex items-center justify-center font-bold text-xs">
                        {selectedDelivery.mode === 'traveller' ? (
                          <Plane className="w-4 h-4" />
                        ) : (
                          <Truck className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">
                          {selectedDelivery.travellerName || selectedDelivery.courierName}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          ID: {selectedDelivery.travellerId || selectedDelivery.courierId}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-1 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" /> Destination: {selectedDelivery.destination}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    No courier or traveller assigned yet. Offer bidding is active.
                  </div>
                )}
              </div>
            </div>

            {/* Status History & Audit Timeline */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Delivery Event Timeline</h3>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                {selectedDelivery.statusHistory.map((item, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-brand-green ring-4 ring-white" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 capitalize">
                        {item.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-gray-400">{formatDate(item.timestamp, 'long')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{item.note}</p>
                    <span className="text-[10px] text-gray-400 block mt-0.5">By {item.actor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Cancellation Workflow Dialog (PRD Section 8.5) */}
      {selectedDelivery && (
        <ConfirmDialog
          isOpen={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
          title={`Initiate Cancellation for #${selectedDelivery.id}?`}
          description={
            ['picked_up', 'in_transit'].includes(selectedDelivery.status)
              ? 'WARNING: Package is currently in transit! Per PRD business rules, an operational case will be created and funds will NOT be automatically refunded until package safety and return are verified.'
              : selectedDelivery.paymentStatus === 'held'
              ? 'Funds are held in escrow. Cancellation review will be routed to Finance for eligible refund.'
              : 'Package is unpaid. The delivery request will be cancelled immediately.'
          }
          confirmLabel="Submit Cancellation"
          variant="danger"
          requireReason={true}
          reasonPlaceholder="Mandatory reason for cancellation (e.g. Sender changed mind, prohibited contents, traveller no-show)..."
          onConfirm={(reason) => {
            const res = requestDeliveryCancellation(
              selectedDelivery.id,
              reason || 'Operational cancellation',
              `Admin initiated cancellation review per exception protocol.`
            );
            setSelectedDelivery(deliveries.find((d) => d.id === selectedDelivery.id) || null);
          }}
        />
      )}

      {/* Change Status Modal */}
      {selectedDelivery && statusUpdateDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-1">Update Delivery Status</h3>
            <p className="text-xs text-gray-500 mb-4">
              Select the validated next state for #{selectedDelivery.id}. All status changes are audited.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as DeliveryStatus)}
                  className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none"
                >
                  <option value="awaiting_pickup">Awaiting Pickup</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered_awaiting_confirmation">Delivered - Awaiting Confirmation</option>
                  <option value="completed">Completed</option>
                  <option value="disputed">Disputed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Operational Note / Reason
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Reason for administrative status update..."
                  rows={2}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setStatusUpdateDialogOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateDeliveryStatus(selectedDelivery.id, newStatus, statusNote || 'Administrative state update');
                    setStatusUpdateDialogOpen(false);
                    setSelectedDelivery(deliveries.find((d) => d.id === selectedDelivery.id) || null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-green hover:bg-brand-green-light rounded-lg shadow-xs"
                >
                  Save Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Carrier Modal */}
      {selectedDelivery && reassignDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-1">Reassign Delivery Carrier</h3>
            <p className="text-xs text-gray-500 mb-4">
              Assign an alternate verified courier or traveller for shipment #{selectedDelivery.id}.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Alternate Provider</label>
                <select
                  value={reassignProvider.id}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (id === 'RCV-10105') {
                      setReassignProvider({ id, name: 'Ibrahim Sani', mode: 'courier' });
                    } else if (id === 'RCV-10104') {
                      setReassignProvider({ id, name: 'Tunde Bakare', mode: 'traveller' });
                    } else {
                      setReassignProvider({ id: 'RCV-10115', name: 'Ronke Oshodi', mode: 'courier' });
                    }
                  }}
                  className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none"
                >
                  <option value="RCV-10105">Ibrahim Sani (Courier - FastTrack Logistics)</option>
                  <option value="RCV-10104">Tunde Bakare (Traveller - Lagos to Abuja)</option>
                  <option value="RCV-10115">Ronke Oshodi (Courier - RedStar Express)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setReassignDialogOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    reassignDelivery(
                      selectedDelivery.id,
                      reassignProvider.id,
                      reassignProvider.name,
                      reassignProvider.mode
                    );
                    setReassignDialogOpen(false);
                    setSelectedDelivery(deliveries.find((d) => d.id === selectedDelivery.id) || null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Confirm Reassignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DeliveriesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton rows={5} message="Loading shipments & logistics data..." />}>
      <DeliveriesContent />
    </Suspense>
  );
}
