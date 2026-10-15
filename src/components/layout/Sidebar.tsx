'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  Gavel,
  CreditCard,
  Flag,
  Headphones,
  BarChart3,
  FileEdit,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { Permission } from '@/types';

export interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onMobileClose }) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [usersExpanded, setUsersExpanded] = useState(true);
  const { currentAdmin, hasPermission, switchAdminRole } = useAppStore();

interface NavSubItem {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: Permission | null;
  hasSubItems?: boolean;
  subItems?: NavSubItem[];
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

  const isRouteActive = (route: string) => {
    if (route === '/' || route === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(route);
  };

  const navGroups: NavGroup[] = [
    {
      group: 'OVERVIEW',
      items: [
        {
          name: 'Dashboard',
          href: '/',
          icon: LayoutDashboard,
          permission: null,
        },
      ],
    },
    {
      group: 'OPERATIONS',
      items: [
        {
          name: 'User Management',
          href: '/users',
          icon: Users,
          permission: 'users.view' as const,
          hasSubItems: true,
          subItems: [
            { name: 'All Users', href: '/users' },
            { name: 'Senders', href: '/users?role=sender' },
            { name: 'Travelers', href: '/users?role=traveller' },
            { name: 'Couriers', href: '/users?role=courier' },
          ],
        },
        {
          name: 'Deliveries',
          href: '/deliveries',
          icon: Package,
          permission: 'deliveries.view' as const,
        },
        {
          name: 'Bids & Matches',
          href: '/bids-matches',
          icon: Gavel,
          permission: 'deliveries.view' as const,
        },
        {
          name: 'Payments',
          href: '/payments',
          icon: CreditCard,
          permission: 'finance.view' as const,
        },
      ],
    },
    {
      group: 'TRUST AND SUPPORT',
      items: [
        {
          name: 'Reports & Moderation',
          href: '/moderation',
          icon: Flag,
          permission: 'safety.view' as const,
        },
        {
          name: 'Customer Support',
          href: '/support',
          icon: Headphones,
          permission: 'support.view' as const,
        },
      ],
    },
    {
      group: 'INSIGHT',
      items: [
        {
          name: 'Analytics',
          href: '/analytics',
          icon: BarChart3,
          permission: 'analytics.view' as const,
        },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        {
          name: 'Content Management',
          href: '/content',
          icon: FileEdit,
          permission: 'content.view' as const,
        },
        {
          name: 'Admin Management',
          href: '/admins',
          icon: ShieldCheck,
          permission: 'admins.view' as const,
        },
        {
          name: 'Settings & Audit Logs',
          href: '/settings',
          icon: Settings,
          permission: 'settings.view' as const,
        },
      ],
    },
  ];

  const renderNavContent = (isMobile = false) => (
    <>
      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (!item.permission) return true;
            return hasPermission(item.permission as any);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.group} className="space-y-1">
              {(!collapsed || isMobile) && (
                <div className="px-3 text-[10px] font-bold text-gray-500 tracking-wider mb-1.5 uppercase">
                  {group.group}
                </div>
              )}

              {visibleItems.map((item) => {
                const active = isRouteActive(item.href);
                const Icon = item.icon;

                return (
                  <div key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (isMobile && onMobileClose) onMobileClose();
                      }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition group relative',
                        active
                          ? 'bg-gradient-to-r from-brand-orange to-brand-orange-light text-white shadow-md font-bold'
                          : 'text-gray-400 hover:text-white hover:bg-[#0C3524]'
                      )}
                      title={collapsed && !isMobile ? item.name : undefined}
                    >
                      <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-white' : 'text-gray-400 group-hover:text-emerald-400')} />

                      {(!collapsed || isMobile) && (
                        <span className="flex-1 truncate">{item.name}</span>
                      )}

                      {(!collapsed || isMobile) && item.hasSubItems && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setUsersExpanded(!usersExpanded);
                          }}
                          className="p-0.5 hover:text-white"
                        >
                          <ChevronDown
                            className={cn(
                              'w-3.5 h-3.5 transition-transform duration-150',
                              !usersExpanded && '-rotate-90'
                            )}
                          />
                        </button>
                      )}
                    </Link>

                    {/* Submenu for User Management if expanded */}
                    {(!collapsed || isMobile) && item.hasSubItems && usersExpanded && active && (
                      <div className="ml-7 mt-1 pl-2 border-l border-[#0F422D] space-y-1">
                        {item.subItems?.map((sub) => {
                          return (
                            <Link
                              key={sub.name}
                              href={sub.href}
                              onClick={() => {
                                if (isMobile && onMobileClose) onMobileClose();
                              }}
                              className={cn(
                                'block py-1 px-2 text-[11px] rounded transition font-medium',
                                'text-gray-400 hover:text-white hover:bg-[#0C3524]'
                              )}
                            >
                              {sub.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Admin Profile & Persona at Bottom */}
      <div className="p-3 border-t border-[#0C3524] bg-[#04150D]">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#0C3524] transition">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-green border border-emerald-500/30 flex-shrink-0">
            {currentAdmin?.avatar ? (
              <img src={currentAdmin.avatar} alt="Admin avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                {currentAdmin?.firstName?.[0]}
              </div>
            )}
          </div>

          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {currentAdmin ? `${currentAdmin.firstName} ${currentAdmin.lastName}` : 'Admin'}
              </div>
              <div className="text-[10px] text-brand-orange uppercase font-semibold tracking-wider truncate">
                {currentAdmin?.role.replace('_', ' ')}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Off-Canvas Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onMobileClose}
            aria-hidden="true"
          />

          {/* Sliding Drawer */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#061D13] text-gray-300 z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200 border-r border-[#08281B]">
            {/* Header with Close Button */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-[#0C3524]">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 shadow-sm border border-[#0A4F2A]">
                  R
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-black tracking-wider text-white">
                    RAC<span className="text-brand-orange">VEST</span>
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400/80 -mt-0.5">
                    Admin Control
                  </span>
                </div>
              </div>

              <button
                onClick={onMobileClose}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#0C3524] transition"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderNavContent(true)}
          </aside>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside
        className={cn(
          'h-screen sticky top-0 hidden lg:flex flex-col bg-[#061D13] text-gray-300 transition-all duration-300 z-30 select-none border-r border-[#08281B]',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#0C3524]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 shadow-sm border border-[#0A4F2A]">
              R
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-black tracking-wider text-white">
                  RAC<span className="text-brand-orange">VEST</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400/80 -mt-0.5">
                  Admin Control
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#0C3524] transition flex-shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform duration-200', collapsed && 'rotate-180')} />
          </button>
        </div>

        {renderNavContent(false)}
      </aside>
    </>
  );
};
