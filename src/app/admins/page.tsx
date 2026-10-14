'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Mail,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  Ban,
  UserCheck,
  Building,
  Key,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Admin, AdminInvitation, AdminRole, RoleConfig } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDate } from '@/lib/utils';

export default function AdminManagementPage() {
  const {
    admins,
    adminInvitations,
    roleConfigs,
    currentAdmin,
    hasPermission,
    inviteAdmin,
    resendInvitation,
    revokeInvitation,
    updateAdminRole,
    toggleAdminStatus,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'admins' | 'invitations' | 'roles'>('admins');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDepartment, setInviteDepartment] = useState('Logistics & Dispatch');
  const [inviteRole, setInviteRole] = useState<AdminRole>('operations');
  const [inviteError, setInviteError] = useState('');

  // Role Change Modal
  const [roleChangeModalOpen, setRoleChangeModalOpen] = useState(false);
  const [newSelectedRole, setNewSelectedRole] = useState<AdminRole>('operations');

  const filteredAdmins = admins.filter((a) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteFirstName.trim() || !inviteLastName.trim() || !inviteEmail.trim()) {
      setInviteError('Please fill in all required fields.');
      return;
    }

    const res = inviteAdmin({
      firstName: inviteFirstName.trim(),
      lastName: inviteLastName.trim(),
      email: inviteEmail.trim(),
      department: inviteDepartment,
      role: inviteRole,
    });

    if (res.success) {
      setInviteFirstName('');
      setInviteLastName('');
      setInviteEmail('');
      setInviteError('');
      setInviteModalOpen(false);
    } else {
      setInviteError(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Administrator Access Control</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage internal staff administrators, invite colleagues, assign granular permissions, and govern RBAC roles.
          </p>
        </div>

        {hasPermission('admins.invite') && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-green hover:bg-brand-green-light rounded-lg shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            Invite Administrator
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        {[
          { id: 'admins', label: 'Active Administrators', count: admins.length },
          { id: 'invitations', label: 'Invitations', count: adminInvitations.length },
          { id: 'roles', label: 'Role Permissions & Matrix', count: roleConfigs.length },
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

      {/* Tab 1: Administrators Table */}
      {activeTab === 'admins' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search administrators by name, email, role..."
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-gray-900 outline-none"
              />
            </div>
            <span className="text-xs text-gray-500">Showing {filteredAdmins.length} admins</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-6">Admin</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Last Active</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAdmins.map((admin) => (
                  <tr
                    key={admin.id}
                    onClick={() => setSelectedAdmin(admin)}
                    className="hover:bg-gray-50/80 transition cursor-pointer"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-green text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {admin.avatar ? (
                            <img src={admin.avatar} alt="Admin" className="w-full h-full object-cover" />
                          ) : (
                            admin.firstName[0]
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">
                            {admin.firstName} {admin.lastName}{' '}
                            {admin.id === currentAdmin.id && (
                              <span className="text-[10px] text-brand-green font-normal">(You)</span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400">{admin.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="text-xs font-bold capitalize text-gray-800 bg-gray-100 px-2.5 py-1 rounded-full">
                        {admin.role.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-xs text-gray-700">{admin.department}</td>

                    <td className="py-4 px-6">
                      <StatusBadge status={admin.status} />
                    </td>

                    <td className="py-4 px-6 text-xs text-gray-500 font-mono">
                      {formatDate(admin.lastActivity || admin.createdAt, 'relative')}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAdmin(admin);
                        }}
                        className="text-xs font-bold text-brand-green hover:underline"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Invitations Table (PRD Section 15.4) */}
      {activeTab === 'invitations' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Pending & Historical Administrator Invitations</h3>
            <span className="text-xs text-gray-500">Links expire automatically after 7 days</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-6">Invitee</th>
                  <th className="py-3 px-6">Assigned Role</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Invited By</th>
                  <th className="py-3 px-6">Expires At</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {adminInvitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-4 px-6">
                      <div className="text-xs font-bold text-gray-900">
                        {inv.firstName} {inv.lastName}
                      </div>
                      <div className="text-[11px] text-gray-400">{inv.email}</div>
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold capitalize text-gray-800">
                      {inv.role.replace('_', ' ')}
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-600">{inv.department}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-600">{inv.invitedByName}</td>
                    <td className="py-4 px-6 text-xs text-gray-500 font-mono">
                      {formatDate(inv.expiresAt, 'short')}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {inv.status === 'pending' && (
                        <>
                          <button
                            onClick={() => resendInvitation(inv.id)}
                            className="text-xs font-bold text-brand-green hover:underline"
                          >
                            Resend
                          </button>
                          <button
                            onClick={() => revokeInvitation(inv.id)}
                            className="text-xs font-bold text-red-600 hover:underline"
                          >
                            Revoke
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Role Matrix (PRD Section 15.6) */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roleConfigs.map((role) => (
            <div key={role.name} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">{role.label}</h3>
                <span className="text-[10px] font-mono text-gray-400 uppercase">{role.name}</span>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">{role.description}</p>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Granted Permissions ({role.permissions.length})
                </span>
                <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-1 bg-gray-50 rounded-lg border border-gray-100">
                  {role.permissions.map((p) => (
                    <span
                      key={p}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-gray-700 border border-gray-200"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedAdmin)}
        onClose={() => setSelectedAdmin(null)}
        title={selectedAdmin ? `${selectedAdmin.firstName} ${selectedAdmin.lastName}` : ''}
        subtitle={selectedAdmin ? `ADMINISTRATOR • ${selectedAdmin.id}` : ''}
        badges={selectedAdmin && <StatusBadge status={selectedAdmin.status} />}
        actions={
          selectedAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setNewSelectedRole(selectedAdmin.role);
                  setRoleChangeModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Change Role
              </button>

              {selectedAdmin.status === 'active' ? (
                <button
                  onClick={() => {
                    const res = toggleAdminStatus(selectedAdmin.id, 'suspended');
                    if (res.success) {
                      setSelectedAdmin(admins.find((a) => a.id === selectedAdmin.id) || null);
                    }
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition"
                >
                  Suspend Account
                </button>
              ) : (
                <button
                  onClick={() => {
                    const res = toggleAdminStatus(selectedAdmin.id, 'active');
                    if (res.success) {
                      setSelectedAdmin(admins.find((a) => a.id === selectedAdmin.id) || null);
                    }
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
                >
                  Reactivate Account
                </button>
              )}
            </div>
          )
        }
      >
        {selectedAdmin && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="font-bold text-gray-900">{selectedAdmin.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Department:</span>
                <span className="font-bold text-gray-900">{selectedAdmin.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Assigned Role:</span>
                <span className="font-bold text-brand-green capitalize">{selectedAdmin.role.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Joined Date:</span>
                <span className="font-mono text-gray-700">{formatDate(selectedAdmin.createdAt, 'long')}</span>
              </div>
            </div>

            {/* Permissions Summary */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Active Permissions ({selectedAdmin.permissions.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedAdmin.permissions.map((p) => (
                  <span
                    key={p}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Super Admin Safeguard Note */}
            {selectedAdmin.role === 'super_admin' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                <span className="font-bold">System Safeguard Enforced:</span> The platform prohibits removing the last
                remaining active Super Admin to ensure governance continuity.
              </div>
            )}
          </div>
        )}
      </DetailDrawer>

      {/* Invite Admin Modal (PRD Section 15.3) */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleInviteSubmit}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100"
          >
            <h3 className="text-base font-bold text-gray-900 mb-1">Invite New Administrator</h3>
            <p className="text-xs text-gray-500 mb-4">
              Send an onboarding invitation token to an internal team member.
            </p>

            {inviteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold">
                {inviteError}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    placeholder="e.g. Khalid"
                    className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    placeholder="e.g. Umar"
                    className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="khalid.umar@racvest.com"
                  className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Department / Team</label>
                <select
                  value={inviteDepartment}
                  onChange={(e) => setInviteDepartment(e.target.value)}
                  className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none"
                >
                  <option value="Logistics & Dispatch">Logistics & Dispatch (Operations)</option>
                  <option value="Finance & Treasury">Finance & Treasury</option>
                  <option value="Customer Experience">Customer Experience (Support)</option>
                  <option value="Trust & Safety">Trust & Safety (Compliance)</option>
                  <option value="Strategy & Intelligence">Strategy & Intelligence (Analytics)</option>
                  <option value="Executive Management">Executive Management</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Assigned Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                  className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none"
                >
                  <option value="operations">Operations Manager</option>
                  <option value="finance">Finance Specialist</option>
                  <option value="customer_support">Customer Support Lead</option>
                  <option value="trust_safety">Trust & Safety Officer</option>
                  <option value="analyst">Business Analyst</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-green hover:bg-brand-green-light rounded-lg shadow-xs"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Change Role Modal with Safeguard */}
      {selectedAdmin && roleChangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Change Role for {selectedAdmin.firstName} {selectedAdmin.lastName}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Select the new RBAC role tier. This alters effective permissions immediately.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target Role</label>
                <select
                  value={newSelectedRole}
                  onChange={(e) => setNewSelectedRole(e.target.value as AdminRole)}
                  className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="operations">Operations Manager</option>
                  <option value="finance">Finance Specialist</option>
                  <option value="customer_support">Customer Support Lead</option>
                  <option value="trust_safety">Trust & Safety Officer</option>
                  <option value="analyst">Business Analyst</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRoleChangeModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const res = updateAdminRole(selectedAdmin.id, newSelectedRole);
                    if (res.success) {
                      setRoleChangeModalOpen(false);
                      setSelectedAdmin(admins.find((a) => a.id === selectedAdmin.id) || null);
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-green hover:bg-brand-green-light rounded-lg shadow-xs"
                >
                  Confirm Role Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
