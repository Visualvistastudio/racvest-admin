'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  AlertTriangle,
  UserCheck,
  ChevronDown,
  Check,
  Shield,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { AdminRole } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface TopBarProps {
  onOpenSearch: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenSearch }) => {
  const pathname = usePathname();
  const { currentAdmin, switchAdminRole, safetyIncidents, moderationReports, supportTickets, refunds } = useAppStore();

  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const personaRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) {
        setPersonaMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roles: { role: AdminRole; label: string; desc: string; dept: string }[] = [
    { role: 'super_admin', label: 'Super Admin', desc: 'Full System Access & Governance', dept: 'Executive' },
    { role: 'operations', label: 'Operations Lead', desc: 'Logistics, Matches & Cancellations', dept: 'Operations' },
    { role: 'finance', label: 'Finance Officer', desc: 'Escrow, Refunds & Payouts', dept: 'Treasury' },
    { role: 'customer_support', label: 'Support Specialist', desc: 'Tickets, Live Chat & Resolutions', dept: 'CX' },
    { role: 'trust_safety', label: 'Trust & Safety', desc: 'Verifications, Reports & SOS', dept: 'Compliance' },
    { role: 'analyst', label: 'Read-only Analyst', desc: 'Reports & Aggregated Metrics', dept: 'Analytics' },
  ];

  // Dynamic alerts for notification bell
  const urgentReports = moderationReports.filter((r) => r.status === 'action_required' || r.severity === 'critical');
  const activeSOS = safetyIncidents.filter((i) => i.status === 'new' || i.status === 'escalated');
  const pendingRefunds = refunds.filter((r) => r.status === 'under_review');
  const unreadAlertsCount = urgentReports.length + activeSOS.length + (pendingRefunds.length > 0 ? 1 : 0);

  // Title generation
  const getPageTitle = () => {
    if (pathname === '/' || pathname === '/dashboard') return 'System Overview';
    if (pathname.startsWith('/users')) return 'User Management';
    if (pathname.startsWith('/deliveries')) return 'Shipments & Orders';
    if (pathname.startsWith('/bids-matches')) return 'Bid Monitoring & Matches';
    if (pathname.startsWith('/payments')) return 'Financial Operations & Escrow';
    if (pathname.startsWith('/support')) return 'Customer Support Hub';
    if (pathname.startsWith('/moderation')) return 'Reports & Trust Moderation';
    if (pathname.startsWith('/analytics')) return 'Analytics & Business Intelligence';
    if (pathname.startsWith('/content')) return 'Platform Content Management';
    if (pathname.startsWith('/admins')) return 'Administrator Access Control';
    if (pathname.startsWith('/settings')) return 'System Settings & Audit Logs';
    return 'Racvest Administration';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Page Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-base font-bold text-gray-900 tracking-tight">{getPageTitle()}</h1>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-xl mx-8">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100/80 border border-gray-200 rounded-lg text-sm text-gray-500 transition shadow-xs group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" />
            <span className="truncate">Search orders, users, transactions, tickets...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 rounded shadow-xs">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Action Icons & Persona Menu */}
      <div className="flex items-center gap-3">
        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition relative"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white" />
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Live Alert Feed</span>
                <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {unreadAlertsCount} Urgent
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 py-1">
                {activeSOS.map((sos) => (
                  <Link
                    key={sos.id}
                    href="/support?tab=sos"
                    onClick={() => setNotifMenuOpen(false)}
                    className="block p-3 hover:bg-red-50/50 rounded-lg transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                      <span className="text-xs font-bold text-red-700 truncate">Critical SOS: {sos.id}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">{sos.description}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">Reported: {sos.reporterName}</span>
                  </Link>
                ))}

                {urgentReports.map((rpt) => (
                  <Link
                    key={rpt.id}
                    href="/moderation"
                    onClick={() => setNotifMenuOpen(false)}
                    className="block p-3 hover:bg-amber-50/50 rounded-lg transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                      <span className="text-xs font-bold text-gray-900 truncate">{rpt.type}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-1 line-clamp-1">{rpt.description}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">Case {rpt.id}</span>
                  </Link>
                ))}

                {pendingRefunds.map((ref) => (
                  <Link
                    key={ref.id}
                    href="/payments?tab=refunds"
                    onClick={() => setNotifMenuOpen(false)}
                    className="block p-3 hover:bg-blue-50/50 rounded-lg transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      <span className="text-xs font-bold text-gray-900 truncate">Refund Review: {ref.id}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-1 line-clamp-1">{ref.reason}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">₦{(ref.amount / 100).toLocaleString()}</span>
                  </Link>
                ))}

                {unreadAlertsCount === 0 && (
                  <div className="py-6 text-center text-xs text-gray-500">All alerts resolved</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current Admin Persona Switcher */}
        <div className="relative" ref={personaRef}>
          <button
            onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 pl-2 hover:bg-gray-100 rounded-lg transition border border-gray-200/80"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-brand-green text-white flex items-center justify-center text-xs font-bold">
              {currentAdmin?.avatar ? (
                <img src={currentAdmin.avatar} alt="Admin" className="w-full h-full object-cover" />
              ) : (
                currentAdmin?.firstName?.[0]
              )}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-gray-900 leading-none">
                {currentAdmin ? `${currentAdmin.firstName} ${currentAdmin.lastName}` : 'Admin'}
              </div>
              <div className="text-[10px] font-semibold text-brand-orange uppercase leading-tight mt-0.5">
                {currentAdmin?.role.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {personaMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                  RBAC Persona Switcher
                </span>
                <p className="text-xs text-gray-600 leading-snug">
                  Switch roles to test permissions, approval gates, and access controls in real-time.
                </p>
              </div>

              <div className="py-1 space-y-0.5 max-h-80 overflow-y-auto">
                {roles.map((item) => {
                  const isCurrent = currentAdmin?.role === item.role;
                  return (
                    <button
                      key={item.role}
                      onClick={() => {
                        switchAdminRole(item.role);
                        setPersonaMenuOpen(false);
                      }}
                      className={cn(
                        'w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between transition',
                        isCurrent
                          ? 'bg-emerald-50 text-brand-green font-semibold'
                          : 'hover:bg-gray-50 text-gray-700'
                      )}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{item.label}</span>
                          {isCurrent && <span className="text-[9px] bg-brand-green text-white px-1.5 rounded">Active</span>}
                        </div>
                        <div className="text-[11px] text-gray-500 font-normal leading-tight mt-0.5">{item.desc}</div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-brand-green flex-shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 mt-1 border-t border-gray-100 px-3 py-1 flex items-center justify-between text-[11px] text-gray-500">
                <span>Current Department:</span>
                <span className="font-semibold text-gray-800">{currentAdmin?.department}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
