'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Flag,
  ShieldAlert,
  Search,
  Filter,
  UserCheck,
  AlertTriangle,
  UserX,
  Ban,
  CheckCircle2,
  XCircle,
  FileText,
  MessageSquare,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Gavel,
  Check,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ModerationReport, ReportStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

function ModerationContent() {
  const searchParams = useSearchParams();
  const initialReportId = searchParams.get('reportId');

  const {
    moderationReports,
    auditLogs,
    assignReport,
    escalateReport,
    takeModerationAction,
    resolveReport,
    dismissReport,
    suspendUser,
    banUser,
    hasPermission,
    currentAdmin,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(
    initialReportId
      ? moderationReports.find((r) => r.id === initialReportId) || moderationReports[0] || null
      : moderationReports.length > 0
      ? moderationReports[0]
      : null
  );

  // Modals
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [internalNoteText, setInternalNoteText] = useState('');

  // Counts
  const openReportsCount = moderationReports.filter((r) =>
    ['new', 'under_review', 'action_required', 'escalated'].includes(r.status)
  ).length;

  const underReviewCount = moderationReports.filter((r) => r.status === 'under_review').length;

  // Filtered reports
  const filteredReports = useMemo(() => {
    return moderationReports.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (severityFilter !== 'all' && r.severity !== severityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = r.id.toLowerCase().includes(q);
        const matchesType = r.type.toLowerCase().includes(q);
        const matchesReporter = r.reporterName.toLowerCase().includes(q);
        const matchesReported = r.reportedUserName && r.reportedUserName.toLowerCase().includes(q);
        if (!matchesId && !matchesType && !matchesReporter && !matchesReported) return false;
      }
      return true;
    });
  }, [moderationReports, statusFilter, severityFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header matching Dashboard shell.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Report Queue</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {openReportsCount} open reports · sorted by newest · Trust & Safety compliance investigation desk.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-xs flex items-center gap-4 text-xs font-semibold">
            <div>
              <span className="text-gray-400">Open Reports:</span>{' '}
              <span className="font-bold text-gray-900">{openReportsCount}</span>
            </div>
            <div className="border-l border-gray-200 pl-4">
              <span className="text-gray-400">Under Review:</span>{' '}
              <span className="font-bold text-brand-orange">{underReviewCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Queue List | Right Details View matching Dashboard shell.png */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Report Queue List */}
        <div className={`space-y-4 ${selectedReport ? 'hidden lg:block' : 'block'}`}>
          {/* Search & Filters */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search report ID, reason, user..."
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-gray-900 outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-[11px] font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-gray-700 outline-none flex-1"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="under_review">Under Review</option>
                <option value="action_required">Action Required</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="text-[11px] font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-gray-700 outline-none flex-1"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Queue Cards matching Dashboard shell.png */}
          <div className="space-y-2.5">
            {filteredReports.map((report) => {
              const isSelected = selectedReport?.id === report.id;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`w-full text-left p-4 rounded-xl border transition shadow-xs flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-white border-brand-green ring-1 ring-brand-green'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-gray-900">{report.id}</span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        report.severity === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : report.severity === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {report.severity}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{report.type}</h4>

                  <div className="text-[11px] text-gray-500">
                    Reporter: <span className="font-semibold text-gray-700">{report.reporterName}</span>
                  </div>

                  <div className="text-[11px] text-gray-500">
                    Reported user:{' '}
                    <span className="font-semibold text-gray-700">{report.reportedUserName || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-[10px]">
                    <StatusBadge status={report.status} />
                    <span className="text-gray-400">{formatDate(report.createdAt, 'relative')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column (2 Cols): Active Report Details matching Dashboard shell.png */}
        <div className={`lg:col-span-2 ${!selectedReport ? 'hidden lg:block' : 'block'}`}>
          {selectedReport ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="lg:hidden p-1.5 -ml-1 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition mr-0.5"
                    aria-label="Back to report queue"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                      REPORT DETAILS
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">{selectedReport.id}</h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedReport.status} />
                  <span className="text-xs font-black uppercase px-2.5 py-0.5 bg-red-100 text-red-800 rounded-full">
                    {selectedReport.severity}
                  </span>
                </div>
              </div>

              {/* Action Bar matching Dashboard shell.png */}
              <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-2 bg-white">
                <button
                  onClick={() => assignReport(selectedReport.id, `${currentAdmin.firstName} ${currentAdmin.lastName}`)}
                  className="px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-xs transition"
                >
                  Assign to me
                </button>

                <button
                  onClick={() => setEscalateModalOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-xs transition"
                >
                  Escalate
                </button>

                <button
                  onClick={() => setSuspendModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-brand-green hover:bg-brand-green-light rounded-lg shadow-xs transition"
                >
                  <Gavel className="w-3.5 h-3.5" />
                  Take action
                </button>

                <button
                  onClick={() => {
                    resolveReport(
                      selectedReport.id,
                      `Compliance resolution logged by ${currentAdmin.firstName} ${currentAdmin.lastName}`
                    );
                    setSelectedReport(moderationReports.find((r) => r.id === selectedReport.id) || null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#0A1628] hover:bg-slate-800 rounded-lg shadow-xs transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  Resolve
                </button>

                <button
                  onClick={() => setDismissModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition ml-auto"
                >
                  Dismiss
                </button>
              </div>

              {/* 2-Column Investigation Content matching Dashboard shell.png */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Report Overview */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Report Overview
                    </span>
                    <h4 className="text-sm font-bold text-gray-900">{selectedReport.type}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{selectedReport.description}</p>
                  </div>

                  {/* People Involved */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      People Involved
                    </span>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold">
                          {selectedReport.reporterName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{selectedReport.reporterName}</div>
                          <div className="text-[11px] text-gray-500">Reporter · Sender · ID verified</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </div>

                    {selectedReport.reportedUserName && (
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                            {selectedReport.reportedUserName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{selectedReport.reportedUserName}</div>
                            <div className="text-[11px] text-gray-500">Reported user · Traveler</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Restricted
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Related Transaction */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Related Transaction
                      </span>
                      {selectedReport.deliveryId && (
                        <Link
                          href={`/deliveries?deliveryId=${selectedReport.deliveryId}`}
                          className="text-[11px] font-bold text-brand-green hover:underline flex items-center gap-1"
                        >
                          Open delivery &rarr;
                        </Link>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-gray-400 block">Delivery ID:</span>
                        <span className="font-mono font-bold text-gray-900">{selectedReport.deliveryId || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Corridor:</span>
                        <span className="font-semibold text-gray-900">Lagos → Abuja</span>
                      </div>
                    </div>
                  </div>

                  {/* Evidence Thumbnails matching Dashboard shell.png */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Evidence Files</span>
                      <span className="text-[11px] font-bold text-brand-green">
                        {selectedReport.evidence.length} files attached
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {selectedReport.evidence.map((img, i) => (
                        <div key={i} className="h-28 rounded-lg overflow-hidden border border-gray-200">
                          <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Internal Notes matching Dashboard shell.png */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Internal Investigation Notes
                    </span>
                    <textarea
                      value={internalNoteText}
                      onChange={(e) => setInternalNoteText(e.target.value)}
                      placeholder="Add investigation findings visible only to administrators..."
                      rows={2}
                      className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-green"
                    />
                    <button
                      onClick={() => {
                        if (internalNoteText.trim()) {
                          alert(`Investigation note saved: ${internalNoteText}`);
                          setInternalNoteText('');
                        }
                      }}
                      className="px-4 py-2 bg-brand-green hover:bg-brand-green-light text-white text-xs font-bold rounded-lg transition"
                    >
                      Save note
                    </button>
                  </div>
                </div>

                {/* Right Column (Timeline, Previous Reports, Audit Log) */}
                <div className="space-y-6">
                  {/* Case Timeline */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Case Timeline</span>
                    <div className="relative pl-5 space-y-3 before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-gray-200 text-xs">
                      <div className="relative">
                        <span className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                        <div className="flex justify-between font-bold text-gray-900">
                          <span>Investigation opened</span>
                          <span className="text-[10px] font-mono text-gray-400">09:06</span>
                        </div>
                        <p className="text-[11px] text-gray-500">{currentAdmin.firstName} claimed the report.</p>
                      </div>

                      <div className="relative">
                        <span className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
                        <div className="flex justify-between font-bold text-gray-900">
                          <span>Evidence preserved</span>
                          <span className="text-[10px] font-mono text-gray-400">08:58</span>
                        </div>
                        <p className="text-[11px] text-gray-500">2 digital chat screenshots secured.</p>
                      </div>

                      <div className="relative">
                        <span className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-amber-600 ring-2 ring-white" />
                        <div className="flex justify-between font-bold text-gray-900">
                          <span>Account restricted</span>
                          <span className="text-[10px] font-mono text-gray-400">08:33</span>
                        </div>
                        <p className="text-[11px] text-gray-500">Off-platform bidding temporarily paused.</p>
                      </div>

                      <div className="relative">
                        <span className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white" />
                        <div className="flex justify-between font-bold text-gray-900">
                          <span>Report submitted</span>
                          <span className="text-[10px] font-mono text-gray-400">08:17</span>
                        </div>
                        <p className="text-[11px] text-gray-500">{selectedReport.reporterName} filed formal complaint.</p>
                      </div>
                    </div>
                  </div>

                  {/* Previous Reports matching Dashboard shell.png */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Previous Reports
                      </span>
                      <span className="text-[11px] font-bold text-brand-green">View profile</span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-gray-900">RPT-09831</div>
                        <div className="text-[11px] text-gray-500">Price manipulation · 14 Aug</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Resolved
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-gray-900">RPT-08240</div>
                        <div className="text-[11px] text-gray-500">Late delivery dispute · 03 May</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                        Dismissed
                      </span>
                    </div>
                  </div>

                  {/* Audit Trail matching Dashboard shell.png */}
                  <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Audit Log</span>
                      <span className="text-[11px] font-bold text-gray-400">Export</span>
                    </div>

                    <div className="divide-y divide-gray-50">
                      <div className="py-2 flex justify-between">
                        <div>
                          <span className="font-bold text-gray-900">{currentAdmin.firstName} L.</span>
                          <span className="text-gray-500 block text-[11px]">Assigned report · Decision pending</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">09:06</span>
                      </div>

                      <div className="py-2 flex justify-between">
                        <div>
                          <span className="font-bold text-gray-900">System Engine</span>
                          <span className="text-gray-500 block text-[11px]">Preserved evidence</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">08:58</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              type="empty"
              title="No report selected"
              description="Select a report from the moderation queue to review evidence, timelines, and take action."
            />
          )}
        </div>
      </div>

      {/* Confirmation Dialogs matching Moderation companion states.png */}
      {selectedReport && (
        <>
          {/* Suspend Confirmation Modal */}
          <ConfirmDialog
            isOpen={suspendModalOpen}
            onClose={() => setSuspendModalOpen(false)}
            title={`Suspend ${selectedReport.reportedUserName || 'user'} for 7 days?`}
            description="Active deliveries and bids will be paused and the user signed out across devices. Mandatory reason required."
            confirmLabel="Suspend"
            variant="warning"
            requireReason={true}
            reasonPlaceholder="Mandatory compliance reason for temporary suspension..."
            onConfirm={(reason) => {
              takeModerationAction(selectedReport.id, 'suspend', {
                reason: reason || 'Violation of marketplace conduct standards',
                durationDays: 7,
              });
              setSelectedReport(moderationReports.find((r) => r.id === selectedReport.id) || null);
            }}
          />

          {/* Ban Confirmation Modal */}
          <ConfirmDialog
            isOpen={banModalOpen}
            onClose={() => setBanModalOpen(false)}
            title="Permanently ban this account?"
            description="This cannot be reversed without Executive Security approval. All marketplace privileges will be permanently revoked."
            confirmLabel="Ban account"
            variant="danger"
            requireReason={true}
            reasonPlaceholder="Mandatory reason for permanent ban..."
            onConfirm={(reason) => {
              takeModerationAction(selectedReport.id, 'ban', {
                reason: reason || 'Severe compliance breach',
              });
              setSelectedReport(moderationReports.find((r) => r.id === selectedReport.id) || null);
            }}
          />

          {/* Dismiss Modal */}
          <ConfirmDialog
            isOpen={dismissModalOpen}
            onClose={() => setDismissModalOpen(false)}
            title="Dismiss Moderation Report?"
            description="Please specify why this complaint is unfounded or has been settled."
            confirmLabel="Dismiss Report"
            variant="primary"
            requireReason={true}
            reasonPlaceholder="Reason for dismissal..."
            onConfirm={(reason) => {
              dismissReport(selectedReport.id, reason || 'Unsubstantiated claim');
              setSelectedReport(moderationReports.find((r) => r.id === selectedReport.id) || null);
            }}
          />

          {/* Escalate Modal */}
          <ConfirmDialog
            isOpen={escalateModalOpen}
            onClose={() => setEscalateModalOpen(false)}
            title="Escalate to Executive Review?"
            description="High-severity escalations are sent directly to the Legal & Safety Leadership board."
            confirmLabel="Escalate Case"
            variant="warning"
            requireReason={true}
            reasonPlaceholder="Escalation rationale..."
            onConfirm={(reason) => {
              escalateReport(selectedReport.id, reason || 'Escalated for senior review');
              setSelectedReport(moderationReports.find((r) => r.id === selectedReport.id) || null);
            }}
          />
        </>
      )}
    </div>
  );
}

export default function ModerationPage() {
  return (
    <Suspense fallback={<LoadingSkeleton rows={5} message="Loading moderation queue..." />}>
      <ModerationContent />
    </Suspense>
  );
}
