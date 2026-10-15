'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Headphones,
  MessageSquare,
  Ticket,
  ShieldAlert,
  Archive,
  Search,
  Filter,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  User,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  MapPin,
  Lock,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { SupportTicket, ChatConversation, SafetyIncident, TicketPriority, TicketStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

function CustomerSupportContent() {
  const searchParams = useSearchParams();
  const initialTabParam = searchParams.get('tab') as 'chat' | 'tickets' | 'resolutions' | 'sos' | null;
  const initialTicketId = searchParams.get('ticketId');

  const {
    supportTickets,
    chatConversations,
    safetyIncidents,
    deliveries,
    users,
    sendChatMessage,
    assignChat,
    resolveChat,
    convertChatToTicket,
    addTicketEvent,
    assignTicket,
    resolveTicket,
    acknowledgeSOS,
    escalateSOS,
    resolveSOS,
    currentAdmin,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'chat' | 'tickets' | 'resolutions' | 'sos'>(
    initialTabParam || 'tickets'
  );

  // Live Chat states
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(
    chatConversations.length > 0 ? chatConversations[0] : null
  );
  const [chatInput, setChatInput] = useState('');
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [ticketCategory, setTicketCategory] = useState('Delayed Delivery');
  const [ticketPriority, setTicketPriority] = useState<TicketPriority>('high');

  // Support Tickets states
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    initialTicketId ? supportTickets.find((t) => t.id === initialTicketId) || null : null
  );
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('all');

  // Note vs Reply inside Ticket
  const [ticketMessageType, setTicketMessageType] = useState<'note' | 'reply'>('note');
  const [ticketMessageText, setTicketMessageText] = useState('');

  // Ticket Resolution modal
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionType, setResolutionType] = useState('Delivery Issue Resolved');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [resolutionDecision, setResolutionDecision] = useState('');

  // SOS state
  const [selectedSOS, setSelectedSOS] = useState<SafetyIncident | null>(null);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return supportTickets.filter((t) => {
      if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) return false;
      if (ticketPriorityFilter !== 'all' && t.priority !== ticketPriorityFilter) return false;
      if (ticketSearchQuery.trim()) {
        const q = ticketSearchQuery.toLowerCase();
        const matchesId = t.id.toLowerCase().includes(q);
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesCustomer = t.customerName.toLowerCase().includes(q);
        const matchesDeliv = t.deliveryId && t.deliveryId.toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesCustomer && !matchesDeliv) return false;
      }
      return true;
    });
  }, [supportTickets, ticketStatusFilter, ticketPriorityFilter, ticketSearchQuery]);

  // Resolved tickets history
  const resolvedTickets = supportTickets.filter((t) => t.status === 'resolved' || t.status === 'closed');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Customer Support & Safety Hub</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage live chat inquiries, structured operational support tickets, emergency SOS escalations, and resolution records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 shadow-xs">
            Assigned Agent: <span className="font-bold text-brand-green">{currentAdmin?.firstName} {currentAdmin?.lastName}</span>
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs matching PRD Section 11.2 */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none flex-nowrap">
        {[
          { id: 'tickets', label: 'Support Tickets', icon: Ticket, count: supportTickets.length },
          { id: 'chat', label: 'Live Chat', icon: MessageSquare, count: chatConversations.length },
          { id: 'sos', label: 'SOS & Safety Incidents', icon: ShieldAlert, count: safetyIncidents.length },
          { id: 'resolutions', label: 'Resolution History', icon: Archive, count: resolvedTickets.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
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
              <Icon className="w-3.5 h-3.5" />
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

      {/* Tab 1: Support Tickets (PRD Section 11.4) */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value)}
                className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none"
              >
                <option value="all">Status: All</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="escalated">Escalated</option>
                <option value="waiting_customer">Waiting for Customer</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={ticketPriorityFilter}
                onChange={(e) => setTicketPriorityFilter(e.target.value)}
                className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none"
              >
                <option value="all">Priority: All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ticketSearchQuery}
                onChange={(e) => setTicketSearchQuery(e.target.value)}
                placeholder="Search ticket ID, title, customer..."
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse text-sm min-w-[850px]">
                <thead>
                  <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">
                    <th className="py-3 px-6">Ticket ID</th>
                    <th className="py-3 px-6">Issue Title</th>
                    <th className="py-3 px-6">Customer</th>
                    <th className="py-3 px-6">Category</th>
                    <th className="py-3 px-6">Priority</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Assigned Agent / Team</th>
                    <th className="py-3 px-6">SLA</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="hover:bg-gray-50/80 transition cursor-pointer"
                    >
                      <td className="py-4 px-6 font-mono text-xs font-bold text-gray-900">{t.id}</td>
                      <td className="py-4 px-6">
                        <div className="text-xs font-bold text-gray-900 max-w-xs truncate">{t.title}</div>
                        {t.deliveryId && (
                          <span className="text-[10px] text-brand-green font-mono">Linked: {t.deliveryId}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-800">{t.customerName}</td>
                      <td className="py-4 px-6 text-xs text-gray-600">{t.category}</td>
                      <td className="py-4 px-6">
                        <StatusBadge status={t.priority} />
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-700">
                        {t.assignedAgent ? `${t.assignedAgent}` : 'Unassigned'}
                        <div className="text-[10px] text-gray-400">{t.assignedTeam}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.slaStatus === 'breached'
                              ? 'bg-red-100 text-red-700'
                              : t.slaStatus === 'at_risk'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {t.slaStatus?.replace('_', ' ').toUpperCase() || 'WITHIN SLA'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(t);
                          }}
                          className="text-xs font-bold text-brand-green hover:underline"
                        >
                          Investigate
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

      {/* Tab 2: Live Chat Interface (PRD Section 11.3) */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[580px]">
          {/* Conversation List */}
          <div className={`border-r border-gray-200 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Conversations</h3>
              <span className="text-xs font-bold text-brand-green bg-emerald-50 px-2 py-0.5 rounded-full">
                {chatConversations.length} Live
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {chatConversations.map((chat) => {
                const isSelected = selectedChat?.id === chat.id;
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full text-left p-4 transition flex items-start gap-3 ${
                      isSelected ? 'bg-emerald-50/70 border-l-4 border-l-brand-green' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {chat.customerName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{chat.customerName}</h4>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {formatDate(chat.lastActivity, 'relative')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{chat.lastMessage}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={chat.status} />
                        {chat.deliveryId && (
                          <span className="text-[10px] font-mono text-brand-green">{chat.deliveryId}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Chat Conversation Area */}
          <div className={`md:col-span-2 flex flex-col h-full justify-between bg-gray-50/30 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
            {selectedChat ? (
              <>
                {/* Chat Header & Convert Action */}
                <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <button
                      onClick={() => setSelectedChat(null)}
                      className="md:hidden p-1.5 -ml-1 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition mr-0.5"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-brand-green flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {selectedChat.customerName[0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-gray-900 truncate">{selectedChat.customerName}</h3>
                      <div className="text-[11px] text-gray-400 truncate">
                        Category: {selectedChat.category} {selectedChat.deliveryId && `• Shipment ${selectedChat.deliveryId}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConvertModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0A1628] hover:bg-slate-800 rounded-lg shadow-xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create Ticket
                    </button>
                    <button
                      onClick={() => resolveChat(selectedChat.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolve
                    </button>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {selectedChat.messages.map((msg) => {
                    const isAgent = msg.sender === 'agent';
                    return (
                      <div key={msg.id} className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-gray-500">{msg.senderName}</span>
                          <span className="text-[9px] text-gray-400">{formatDate(msg.timestamp, 'relative')}</span>
                        </div>
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isAgent
                              ? 'bg-brand-green text-white rounded-tr-none'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-tl-none shadow-xs'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input */}
                <div className="p-4 bg-white border-t border-gray-200 flex items-center gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && chatInput.trim()) {
                        sendChatMessage(selectedChat.id, chatInput.trim());
                        setChatInput('');
                      }
                    }}
                    placeholder={`Reply to ${selectedChat.customerName}...`}
                    className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-green"
                  />
                  <button
                    onClick={() => {
                      if (chatInput.trim()) {
                        sendChatMessage(selectedChat.id, chatInput.trim());
                        setChatInput('');
                      }
                    }}
                    className="p-2.5 bg-brand-green hover:bg-brand-green-light text-white rounded-lg transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">
                Select a live conversation from the queue
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: SOS & Safety (PRD Section 11.7) */}
      {activeTab === 'sos' && (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-xs text-red-900 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Urgent Safety Protocols Active:</span> SOS incidents represent physical safety,
              cargo hijacking, or emergency roadside events. Controllers must acknowledge within 2 minutes and follow
              verified local dispatch protocols.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-6">Incident ID</th>
                  <th className="py-3 px-6">Reporter</th>
                  <th className="py-3 px-6">Incident Type</th>
                  <th className="py-3 px-6">Severity</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Assigned Controller</th>
                  <th className="py-3 px-6">Reported At</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {safetyIncidents.map((sos) => (
                  <tr key={sos.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-4 px-6 font-mono text-xs font-bold text-red-700">{sos.id}</td>
                    <td className="py-4 px-6 text-xs font-bold text-gray-900">{sos.reporterName}</td>
                    <td className="py-4 px-6 text-xs text-gray-700">{sos.type}</td>
                    <td className="py-4 px-6">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                        {sos.severity}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={sos.status} />
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-700">{sos.assignedTo || 'Unassigned'}</td>
                    <td className="py-4 px-6 text-xs text-gray-500">{formatDate(sos.createdAt, 'long')}</td>
                    <td className="py-4 px-6 text-right">
                      {sos.status === 'new' ? (
                        <button
                          onClick={() => acknowledgeSOS(sos.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                        >
                          Acknowledge SOS
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedSOS(sos)}
                          className="text-xs font-bold text-brand-green hover:underline"
                        >
                          View Incident &rarr;
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Resolution History (PRD Section 11.6) */}
      {activeTab === 'resolutions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Support Resolution Audit History</h3>
              <p className="text-xs text-gray-500">Immutable ledger of completed dispute and support determinations.</p>
            </div>

            {resolvedTickets.length === 0 ? (
              <EmptyState
                type="empty"
                title="No resolutions yet"
                description="Completed ticket resolutions will be logged here for legal, financial, and compliance auditing."
              />
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse text-sm min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">
                    <th className="py-3 px-6">Ticket ID</th>
                    <th className="py-3 px-6">Customer</th>
                    <th className="py-3 px-6">Issue Category</th>
                    <th className="py-3 px-6">Resolution Type</th>
                    <th className="py-3 px-6">Final Summary</th>
                    <th className="py-3 px-6">Resolved By</th>
                    <th className="py-3 px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resolvedTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-4 px-6 font-mono text-xs font-bold text-gray-900">{t.id}</td>
                      <td className="py-4 px-6 text-xs font-bold text-gray-900">{t.customerName}</td>
                      <td className="py-4 px-6 text-xs text-gray-600">{t.category}</td>
                      <td className="py-4 px-6 text-xs font-semibold text-brand-green">
                        {t.resolution?.type || 'Delivery Resolved'}
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-700 max-w-sm truncate">
                        {t.resolution?.summary || 'Issue resolved per standard operating procedure.'}
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-600">
                        {t.resolution?.resolvedBy || t.assignedAgent || 'System'}
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-500 font-mono">
                        {formatDate(t.resolvedAt || t.updatedAt, 'short')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ticket Detail Drawer (featuring TKT-83921 from PRD 11.5) */}
      <DetailDrawer
        isOpen={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket ? `${selectedTicket.title}` : ''}
        subtitle={selectedTicket ? `SUPPORT CASE • ${selectedTicket.id}` : ''}
        badges={
          selectedTicket && (
            <div className="flex items-center gap-2">
              <StatusBadge status={selectedTicket.priority} />
              <StatusBadge status={selectedTicket.status} />
            </div>
          )
        }
        actions={
          selectedTicket && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setResolveDialogOpen(true)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-brand-green hover:bg-brand-green-light rounded-lg shadow-xs transition"
              >
                Record Resolution
              </button>
            </div>
          )
        }
      >
        {selectedTicket && (
          <div className="space-y-6">
            {/* Linked Records Row (PRD 11.4 C) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Customer</span>
                <div className="text-xs font-bold text-gray-900 mt-1">{selectedTicket.customerName}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Linked Shipment</span>
                <Link
                  href={`/deliveries?deliveryId=${selectedTicket.deliveryId}`}
                  className="text-xs font-bold text-brand-green hover:underline mt-1 block"
                >
                  {selectedTicket.deliveryId || 'None'} &rarr;
                </Link>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Escalation Team</span>
                <div className="text-xs font-bold text-gray-900 mt-1">{selectedTicket.assignedTeam}</div>
              </div>
            </div>

            {/* Conversation Timeline & Internal Notes (PRD 11.4 D, E, F) */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Investigation & Communication Log</h3>

              <div className="space-y-3">
                {selectedTicket.events.map((evt) => {
                  return (
                    <div
                      key={evt.id}
                      className={`p-3.5 rounded-xl text-xs border ${
                        evt.isInternal
                          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                          : evt.type === 'agent_reply'
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-black/5">
                        <div className="flex items-center gap-1.5 font-bold">
                          {evt.isInternal ? (
                            <span className="flex items-center gap-1 text-amber-800 font-extrabold uppercase text-[10px]">
                              <Lock className="w-3 h-3" /> PRIVATE INTERNAL NOTE
                            </span>
                          ) : (
                            <span className="text-gray-700">{evt.author} ({evt.authorRole})</span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {formatDate(evt.createdAt, 'relative')}
                        </span>
                      </div>
                      <p className="leading-relaxed">{evt.content}</p>
                    </div>
                  );
                })}
              </div>

              {/* Message Composer with Note vs Reply toggle */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTicketMessageType('note')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                      ticketMessageType === 'note'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <Lock className="w-3 h-3" /> Internal Staff Note
                  </button>
                  <button
                    onClick={() => setTicketMessageType('reply')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                      ticketMessageType === 'reply'
                        ? 'bg-brand-green text-white shadow-xs'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <Send className="w-3 h-3" /> Reply to Customer
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <textarea
                    value={ticketMessageText}
                    onChange={(e) => setTicketMessageText(e.target.value)}
                    placeholder={
                      ticketMessageType === 'note'
                        ? 'Write internal findings (hidden from customer)...'
                        : 'Send formal message to customer...'
                    }
                    rows={2}
                    className="flex-1 text-xs border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-green"
                  />
                  <button
                    onClick={() => {
                      if (ticketMessageText.trim()) {
                        addTicketEvent(selectedTicket.id, {
                          type: ticketMessageType === 'note' ? 'note' : 'agent_reply',
                          content: ticketMessageText.trim(),
                          isInternal: ticketMessageType === 'note',
                        });
                        setTicketMessageText('');
                        setSelectedTicket(supportTickets.find((t) => t.id === selectedTicket.id) || null);
                      }
                    }}
                    className="px-4 py-3 bg-[#0A1628] hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Convert Chat to Ticket Modal (PRD Section 11.3) */}
      {selectedChat && convertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-1">Convert Live Chat to Ticket</h3>
            <p className="text-xs text-gray-500 mb-4">
              Escalate conversation #{selectedChat.id} to a dedicated support case with SLA tracking.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none"
                >
                  <option value="Delayed Delivery">Delayed Delivery</option>
                  <option value="Package Not Received">Package Not Received</option>
                  <option value="Cancellation Requests">Cancellation Requests</option>
                  <option value="Refunds & Escrow">Refunds & Escrow</option>
                  <option value="Safety & Misconduct">Safety & Misconduct</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Priority</label>
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value as TicketPriority)}
                  className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setConvertModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const tid = convertChatToTicket(selectedChat.id, {
                      title: `${ticketCategory}: ${selectedChat.customerName}`,
                      category: ticketCategory,
                      priority: ticketPriority,
                    });
                    setConvertModalOpen(false);
                    setActiveTab('tickets');
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-green hover:bg-brand-green-light rounded-lg shadow-xs"
                >
                  Generate Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Ticket Resolution Modal */}
      {selectedTicket && resolveDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-1">Record Final Resolution</h3>
            <p className="text-xs text-gray-500 mb-4">
              Formal determination for case #{selectedTicket.id}. This will be added to immutable Resolution History.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Resolution Type</label>
                <select
                  value={resolutionType}
                  onChange={(e) => setResolutionType(e.target.value)}
                  className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none"
                >
                  <option value="Delivery Issue Resolved">Delivery Issue Resolved</option>
                  <option value="Cancellation Approved">Cancellation Approved</option>
                  <option value="Refund Approved">Refund Approved</option>
                  <option value="Refund Rejected">Refund Rejected</option>
                  <option value="Safety Issue Escalated">Safety Issue Escalated</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Resolution Summary</label>
                <textarea
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  placeholder="Summary of findings and confirmed operational outcome..."
                  rows={2}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setResolveDialogOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    resolveTicket(selectedTicket.id, {
                      type: resolutionType,
                      summary: resolutionSummary || 'Resolved per customer agreement',
                      decision: 'Resolved with customer update',
                    });
                    setResolveDialogOpen(false);
                    setSelectedTicket(supportTickets.find((t) => t.id === selectedTicket.id) || null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-green hover:bg-brand-green-light rounded-lg shadow-xs"
                >
                  Save & Resolve Case
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerSupportPage() {
  return (
    <Suspense fallback={<LoadingSkeleton rows={5} message="Loading support cases & live chat..." />}>
      <CustomerSupportContent />
    </Suspense>
  );
}
