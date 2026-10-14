'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Download,
  Award,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  UserX,
  Ban,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wallet,
  Package,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { User, UserRole, VerificationStatus, AccountStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatCurrency, formatDate } from '@/lib/utils';

function UserManagementContent() {
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get('role') as UserRole | null;
  const initialUserId = searchParams.get('userId');

  const {
    users,
    userVerifications,
    approveVerification,
    rejectVerification,
    suspendUser,
    banUser,
    restoreUser,
    hasPermission,
    currentAdmin,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'all' | 'sender' | 'traveller' | 'courier'>(
    initialRoleParam === 'sender'
      ? 'sender'
      : initialRoleParam === 'traveller'
      ? 'traveller'
      : initialRoleParam === 'courier'
      ? 'courier'
      : 'all'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(
    initialUserId ? users.find((u) => u.id === initialUserId) || null : null
  );

  // Dialog states
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [rejectVerifDialogOpen, setRejectVerifDialogOpen] = useState(false);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role tab filter
      if (activeTab !== 'all' && !u.roles.includes(activeTab)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = `${u.firstName} ${u.lastName}`.toLowerCase().includes(q);
        const matchesId = u.id.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesPhone = u.phone.includes(q);
        if (!matchesName && !matchesId && !matchesEmail && !matchesPhone) return false;
      }

      // Status
      if (statusFilter !== 'all' && u.accountStatus !== statusFilter) {
        return false;
      }

      // Verification
      if (verificationFilter !== 'all' && u.verificationStatus !== verificationFilter) {
        return false;
      }

      // Location
      if (locationFilter !== 'all' && !u.location.toLowerCase().includes(locationFilter.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [users, activeTab, searchQuery, statusFilter, verificationFilter, locationFilter]);

  // Dynamic statistics
  const currentRoleUsers = users.filter((u) => (activeTab === 'all' ? true : u.roles.includes(activeTab)));
  const totalCount = currentRoleUsers.length;
  const activeCount = currentRoleUsers.filter((u) => u.accountStatus === 'active').length;
  const verifiedCount = currentRoleUsers.filter((u) => u.verificationStatus === 'verified').length;
  const newTodayCount = currentRoleUsers.filter(
    (u) => new Date(u.registeredAt).toDateString() === new Date('2026-10-14').toDateString()
  ).length || 4;

  const averageRating =
    currentRoleUsers.reduce((sum, u) => sum + (u.rating || 4.5), 0) / (currentRoleUsers.length || 1);

  // Selected user's verification submission
  const userVerification = selectedUser
    ? userVerifications.find((v) => v.userId === selectedUser.id)
    : null;

  // Toggle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((item) => item !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header matching Senders.png */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight capitalize">
            {activeTab === 'all' ? 'User Management' : `${activeTab} Management`}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage {activeTab === 'all' ? 'marketplace' : activeTab} accounts, monitor activity, verify identities, and oversee compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setVerificationFilter('all');
              setLocationFilter('all');
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 shadow-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
            Refresh
          </button>

          <button
            onClick={() => alert('Generating user compliance directory report CSV...')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-green hover:bg-brand-green-light rounded-lg shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            Download report
          </button>
        </div>
      </div>

      {/* Tabs matching Senders.png / Travelers.png / Courier.png */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        {(['all', 'sender', 'traveller', 'courier'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const label = tab === 'all' ? 'All Users' : tab.charAt(0).toUpperCase() + tab.slice(1);
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                isActive
                  ? 'bg-brand-green text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Metric Cards Row matching Senders.png */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Card - Dark forest green */}
        <div className="bg-[#0A2617] text-white p-5 rounded-2xl shadow-xs border border-emerald-950 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Total {activeTab === 'all' ? 'Users' : activeTab}s
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-900/60 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-black tracking-tight">{totalCount.toLocaleString()}</div>
            <span className="text-xs font-bold text-emerald-400">+8.4%</span>
          </div>
        </div>

        {/* Active Card */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Active {activeTab === 'all' ? 'Users' : activeTab}s
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-brand-green">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-black text-gray-900 tracking-tight">{activeCount.toLocaleString()}</div>
            <span className="text-xs font-bold text-emerald-600">+56.4%</span>
          </div>
        </div>

        {/* Verified Card */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Verified {activeTab === 'all' ? 'Users' : activeTab}s
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-brand-green">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-black text-gray-900 tracking-tight">{verifiedCount.toLocaleString()}</div>
            <span className="text-xs font-bold text-emerald-600">+94.4%</span>
          </div>
        </div>

        {/* New Today Card */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              New {activeTab === 'all' ? 'Users' : activeTab} Today
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-brand-orange">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-black text-gray-900 tracking-tight">{newTodayCount}</div>
            <span className="text-xs font-bold text-gray-400">Today</span>
          </div>
        </div>
      </div>

      {/* Average Rating Banner matching Senders.png */}
      <div className="bg-gradient-to-r from-brand-orange to-brand-orange-light text-white px-6 py-3.5 rounded-xl shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-wide">
            Average {activeTab === 'all' ? 'Marketplace' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} rating
          </span>
        </div>
        <div className="text-2xl font-black tracking-tight">{averageRating.toFixed(2)} / 5.0</div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:ring-2 focus:ring-brand-green"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>

          {/* Verification Dropdown */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:ring-2 focus:ring-brand-green"
          >
            <option value="all">Verification: All</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="unverified">Unverified</option>
          </select>

          {/* Location Dropdown */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:ring-2 focus:ring-brand-green"
          >
            <option value="all">Location: All Cities</option>
            <option value="lagos">Lagos</option>
            <option value="abuja">Abuja</option>
            <option value="kano">Kano</option>
            <option value="port harcourt">Port Harcourt</option>
            <option value="ibadan">Ibadan</option>
          </select>

          {(statusFilter !== 'all' || verificationFilter !== 'all' || locationFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setVerificationFilter('all');
                setLocationFilter('all');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-brand-orange hover:underline px-2"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Anything..."
            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <EmptyState
            type="no-results"
            title="No matching users found"
            description="No user records matched your active filter conditions."
            actionText="Clear all filters"
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setVerificationFilter('all');
              setLocationFilter('all');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                    />
                  </th>
                  <th className="py-3 px-4">User / Contact</th>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Risk</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredUsers.map((user) => {
                  const isChecked = selectedUserIds.includes(user.id);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(user.id)}
                          className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                        />
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 border border-gray-200">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-700">
                                {user.firstName[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-[11px] text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono text-xs font-semibold text-gray-700">
                        {user.id}
                      </td>

                      <td className="py-4 px-4 text-xs text-gray-600">{user.location}</td>

                      <td className="py-4 px-4">
                        <StatusBadge status={user.verificationStatus} />
                      </td>

                      <td className="py-4 px-4">
                        <StatusBadge status={user.accountStatus} />
                      </td>

                      <td className="py-4 px-4">
                        <StatusBadge status={user.riskLevel} />
                      </td>

                      <td className="py-4 px-4 text-xs text-gray-500">
                        {formatDate(user.lastActive, 'relative')}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 hover:text-brand-green hover:bg-emerald-50 transition border border-gray-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing {filteredUsers.length} of {totalCount} {activeTab === 'all' ? 'users' : `${activeTab}s`}
          </div>

          <div className="flex items-center gap-1">
            <button className="px-3 py-1 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition">
              &larr; Prev
            </button>
            <button className="px-3 py-1 bg-brand-green text-white font-bold rounded-md">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition">
              2
            </button>
            <button className="px-3 py-1 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition">
              3
            </button>
            <button className="px-3 py-1 bg-brand-green text-white font-bold rounded-md hover:bg-brand-green-light transition">
              Next &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : ''}
        subtitle={selectedUser ? `USER PROFILE • ${selectedUser.id}` : ''}
        badges={
          selectedUser && (
            <div className="flex items-center gap-2">
              <StatusBadge status={selectedUser.verificationStatus} />
              <StatusBadge status={selectedUser.accountStatus} />
            </div>
          )
        }
        actions={
          selectedUser && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Verification Actions */}
              {selectedUser.verificationStatus === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      if (userVerification) {
                        approveVerification(userVerification.id);
                        setSelectedUser({ ...selectedUser, verificationStatus: 'verified' });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-brand-green hover:bg-brand-green-light rounded-lg shadow-xs transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Verification
                  </button>
                  <button
                    onClick={() => setRejectVerifDialogOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </>
              )}

              {/* Account Restriction Actions */}
              {selectedUser.accountStatus === 'active' ? (
                <>
                  <button
                    onClick={() => setSuspendDialogOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Suspend 7 Days
                  </button>
                  <button
                    onClick={() => setBanDialogOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Ban Account
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    restoreUser(selectedUser.id);
                    setSelectedUser({ ...selectedUser, accountStatus: 'active', suspendedReason: undefined });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Restore Account
                </button>
              )}
            </div>
          )
        }
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* Top Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Roles</div>
                <div className="text-xs font-bold text-gray-900 mt-1 capitalize">
                  {selectedUser.roles.join(', ')}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Rating</div>
                <div className="text-xs font-bold text-brand-orange mt-1">★ {selectedUser.rating} / 5.0</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Deliveries</div>
                <div className="text-xs font-bold text-gray-900 mt-1">{selectedUser.deliveryCount} completed</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Wallet Escrow</div>
                <div className="text-xs font-bold text-brand-green mt-1">
                  {formatCurrency(selectedUser.walletBalance)}
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact & Registration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{selectedUser.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{selectedUser.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{selectedUser.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Joined {formatDate(selectedUser.registeredAt, 'long')}</span>
                </div>
              </div>

              {selectedUser.suspendedReason && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                  <span className="font-bold">Suspension Record:</span> {selectedUser.suspendedReason}
                </div>
              )}

              {selectedUser.bannedReason && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900">
                  <span className="font-bold">Permanent Ban Reason:</span> {selectedUser.bannedReason}
                </div>
              )}
            </div>

            {/* Identity & Verification Section */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Identity Verification Documents
                </h3>
                <StatusBadge status={selectedUser.verificationStatus} />
              </div>

              {userVerification ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1">
                      <div className="text-gray-400 uppercase font-semibold text-[10px]">Document Type</div>
                      <div className="font-bold text-gray-900 uppercase">{userVerification.documentType}</div>
                      <div className="text-gray-500 font-mono">
                        Number: {userVerification.documentNumber || '••••••••••'}
                      </div>
                      <div className="text-[10px] text-gray-400 pt-1">
                        Submitted: {formatDate(userVerification.submittedAt, 'short')}
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1">
                      <div className="text-gray-400 uppercase font-semibold text-[10px]">Verification Review</div>
                      <div className="font-bold text-gray-900 capitalize">{userVerification.status}</div>
                      {userVerification.reviewedBy && (
                        <div className="text-gray-500">Reviewed By: {userVerification.reviewedBy}</div>
                      )}
                      {userVerification.rejectionReason && (
                        <div className="text-red-600 font-semibold mt-1">
                          Reason: {userVerification.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document & Biometric Previews */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-gray-700">Submitted Proof of Identity:</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-100 rounded-lg border border-gray-200 text-center">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                        <span className="text-xs font-semibold text-gray-800 block">ID Document PDF</span>
                        <a
                          href={userVerification.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-brand-green font-bold hover:underline mt-1 inline-block"
                        >
                          View Document &rarr;
                        </a>
                      </div>

                      {userVerification.selfieUrl && (
                        <div className="p-3 bg-gray-100 rounded-lg border border-gray-200 text-center">
                          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                          <span className="text-xs font-semibold text-gray-800 block">Biometric Live Selfie</span>
                          <a
                            href={userVerification.selfieUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-brand-green font-bold hover:underline mt-1 inline-block"
                          >
                            Inspect Selfie &rarr;
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-center text-xs text-gray-500">
                  No verification documents currently on file for this user.
                </div>
              )}
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Confirmation Dialogs */}
      {selectedUser && (
        <>
          {/* Suspend Modal */}
          <ConfirmDialog
            isOpen={suspendDialogOpen}
            onClose={() => setSuspendDialogOpen(false)}
            title={`Suspend ${selectedUser.firstName} ${selectedUser.lastName}?`}
            description="Active deliveries and bids will be paused. The user will be notified of the temporary suspension."
            confirmLabel="Suspend Account"
            variant="warning"
            requireReason={true}
            reasonPlaceholder="Mandatory reason for suspension (e.g. Conduct violation, suspected price gouging)..."
            onConfirm={(reason) => {
              suspendUser(selectedUser.id, reason || 'Conduct violation', 7);
              setSelectedUser({ ...selectedUser, accountStatus: 'suspended', suspendedReason: reason });
            }}
          />

          {/* Ban Modal */}
          <ConfirmDialog
            isOpen={banDialogOpen}
            onClose={() => setBanDialogOpen(false)}
            title={`Permanently ban this account?`}
            description="This cannot be reversed without Executive Security approval. All marketplace privileges will be permanently revoked."
            confirmLabel="Ban Account"
            variant="danger"
            requireReason={true}
            reasonPlaceholder="Mandatory compliance justification for permanent expulsion..."
            onConfirm={(reason) => {
              banUser(selectedUser.id, reason || 'Compliance violation');
              setSelectedUser({ ...selectedUser, accountStatus: 'banned', bannedReason: reason });
            }}
          />

          {/* Reject Verification Modal */}
          <ConfirmDialog
            isOpen={rejectVerifDialogOpen}
            onClose={() => setRejectVerifDialogOpen(false)}
            title="Reject Identity Verification?"
            description="Please provide a clear reason explaining why the document or selfie failed compliance inspection."
            confirmLabel="Reject Submission"
            variant="danger"
            requireReason={true}
            reasonPlaceholder="Reason (e.g. Document expired, blurry photo, name mismatch)..."
            onConfirm={(reason) => {
              if (userVerification) {
                rejectVerification(userVerification.id, reason || 'Documentation failed verification criteria');
                setSelectedUser({ ...selectedUser, verificationStatus: 'rejected' });
              }
            }}
          />
        </>
      )}
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <Suspense fallback={<LoadingSkeleton rows={5} message="Loading user directory..." />}>
      <UserManagementContent />
    </Suspense>
  );
}
