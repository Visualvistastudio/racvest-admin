'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Activity,
  Cpu,
  Bell,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  RotateCw,
  LogOut,
  Laptop,
  Smartphone,
  Key,
  Globe,
  Database,
  Lock,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { SystemSetting, IntegrationConfig, NotificationTemplate, AuditLog } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';

export default function SettingsAndAuditPage() {
  const {
    systemSettings,
    integrationConfigs,
    notificationTemplates,
    auditLogs,
    activeSessions,
    revokeSession,
    updateSetting,
    testIntegration,
    updateNotificationTemplate,
    hasPermission,
    currentAdmin,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'general' | 'audit' | 'security' | 'integrations' | 'notifications'>('general');

  // Audit filter state
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  // Selected template edit
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditActionFilter !== 'all' && !log.action.includes(auditActionFilter)) return false;
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      return (
        log.id.toLowerCase().includes(q) ||
        log.adminName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.targetId.toLowerCase().includes(q) ||
        (log.reason && log.reason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Settings & Audit Logs</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure platform parameters, monitor immutable compliance audit trails, manage active sessions, and check integration health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 shadow-xs">
            System Node: <span className="font-mono text-brand-green">core-cluster-lagos-01</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none flex-nowrap">
        {[
          { id: 'general', label: 'General Configuration', icon: Settings },
          { id: 'audit', label: 'Activity & Audit Logs', icon: Activity, count: auditLogs.length },
          { id: 'security', label: 'Security & Active Sessions', icon: Shield, count: activeSessions.length },
          { id: 'integrations', label: 'Integration Status', icon: Cpu, count: integrationConfigs.length },
          { id: 'notifications', label: 'Notification Templates', icon: Bell, count: notificationTemplates.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-brand-green text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: General Settings (PRD Section 16.1) */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Platform Operational Parameters</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Live marketplace configuration settings. High-impact updates require authorization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {systemSettings.map((setting) => (
              <div key={setting.key} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">{setting.description}</span>
                  <span className="text-[10px] font-mono text-gray-400">{setting.category}</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue={String(setting.value)}
                    onBlur={(e) => updateSetting(setting.key, e.target.value)}
                    className="flex-1 text-xs font-semibold bg-white border border-gray-200 rounded-lg p-2 text-gray-900 outline-none focus:ring-2 focus:ring-brand-green"
                  />
                  <button
                    onClick={() => updateSetting(setting.key, setting.value)}
                    className="px-3 py-2 bg-brand-green hover:bg-brand-green-light text-white rounded-lg text-xs font-bold shadow-xs transition"
                  >
                    Save
                  </button>
                </div>

                <div className="text-[10px] text-gray-400">
                  Last updated by {setting.updatedBy || 'System'} on {formatDate(setting.updatedAt, 'short')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Activity & Audit Logs (PRD Section 16.3) */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none"
              >
                <option value="all">All Actions</option>
                <option value="user">User Actions (verify, suspend, ban)</option>
                <option value="refund">Financial Refunds</option>
                <option value="payout">Carrier Payouts</option>
                <option value="delivery">Delivery Status & Cancellation</option>
                <option value="admin">Administrator Management</option>
                <option value="settings">System Settings</option>
              </select>
            </div>

            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit trail by admin, reason, target..."
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-gray-900 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse text-sm min-w-[780px]">
              <thead>
                <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">
                  <th className="py-3 px-6">Event ID</th>
                  <th className="py-3 px-6">Administrator</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Target</th>
                  <th className="py-3 px-6">Reason / Compliance Record</th>
                  <th className="py-3 px-6">IP Address</th>
                  <th className="py-3 px-6">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition text-xs">
                    <td className="py-3.5 px-6 font-mono font-bold text-gray-900">{log.id}</td>
                    <td className="py-3.5 px-6 font-semibold text-gray-800">{log.adminName}</td>
                    <td className="py-3.5 px-6 font-mono text-brand-green font-bold">{log.action}</td>
                    <td className="py-3.5 px-6 font-mono text-gray-600">
                      {log.targetType}:{log.targetId}
                    </td>
                    <td className="py-3.5 px-6 text-gray-600 max-w-xs">{log.reason || '—'}</td>
                    <td className="py-3.5 px-6 font-mono text-gray-400 text-[11px]">{log.ipAddress || 'Internal'}</td>
                    <td className="py-3.5 px-6 font-mono text-gray-500 text-[11px]">
                      {formatDate(log.timestamp, 'long')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Active Sessions (PRD Section 16.4) */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Active Administrator Sessions</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Revoke unrecognized or outdated sessions immediately to maintain strict access control.
                </p>
              </div>
              <Shield className="w-5 h-5 text-brand-green" />
            </div>

            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-brand-green flex items-center justify-center">
                      {session.device.includes('iPhone') ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <Laptop className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 flex items-center gap-2">
                        <span>{session.device}</span>
                        {session.isCurrent && (
                          <span className="text-[9px] bg-brand-green text-white px-2 py-0.5 rounded-full font-bold">
                            Current Session
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500 mt-0.5 font-mono text-[11px]">
                        IP: {session.ipAddress} • {session.location} • Last active {session.lastActive}
                      </div>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <button
                      onClick={() => revokeSession(session.id)}
                      className="px-3.5 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition self-start sm:self-auto"
                    >
                      Revoke Session
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Integration Status (PRD Section 16.5) */}
      {activeTab === 'integrations' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Third-Party Gateway & Service Status</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Live status of payment processing, SMS dispatch, biometrics, and push notification endpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrationConfigs.map((config) => {
              const isConnected = config.status === 'connected';
              const isNotConfigured = config.status === 'not_configured';

              return (
                <div key={config.id} className="p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{config.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        isConnected
                          ? 'bg-emerald-100 text-emerald-800'
                          : isNotConfigured
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {config.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Type: <span className="font-semibold text-gray-700 capitalize">{config.type}</span></div>
                    {config.lastSuccessAt && (
                      <div className="text-[11px]">
                        Last Ping: <span className="font-mono text-gray-700">{formatDate(config.lastSuccessAt, 'short')}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-400">Credentials Masked</span>
                    <button
                      onClick={() => testIntegration(config.id)}
                      className="px-3 py-1.5 text-xs font-bold text-brand-green hover:bg-emerald-50 rounded-lg border border-emerald-200 transition flex items-center gap-1.5"
                    >
                      <RotateCw className="w-3 h-3" /> Test Connection
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Notification Templates (PRD Section 16.6) */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Automated Notification Message Templates</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage SMS, push, and email copy dispatched for escrow holds, delivery PINs, and delay advisories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notificationTemplates.map((template) => (
              <div key={template.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">{template.name}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                    {template.channel}
                  </span>
                </div>

                <div className="p-3 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-800 leading-relaxed">
                  {template.body}
                </div>

                <div className="flex flex-wrap gap-1">
                  {template.variables.map((v) => (
                    <span key={v} className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-mono">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
