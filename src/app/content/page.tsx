'use client';

import React, { useState } from 'react';
import {
  FileEdit,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Archive,
  Eye,
  Trash2,
  ExternalLink,
  Send,
  BookOpen,
  Megaphone,
  HelpCircle,
  Shield,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ContentItem } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import { formatDate } from '@/lib/utils';

export default function ContentManagementPage() {
  const {
    contentItems,
    createContentItem,
    updateContentItem,
    publishContentItem,
    archiveContentItem,
    hasPermission,
    currentAdmin,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'all' | 'banner' | 'announcement' | 'faq' | 'terms' | 'help'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  // New Content Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<ContentItem['type']>('announcement');

  const filteredItems = contentItems.filter((item) => {
    if (activeTab !== 'all' && item.type !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreate = () => {
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Title and content are required.');
      return;
    }
    createContentItem({
      title: newTitle.trim(),
      content: newContent.trim(),
      type: newType,
      status: 'draft',
    });
    setNewTitle('');
    setNewContent('');
    setCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Platform Content Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage mobile app banners, courier transit advisories, escrow FAQs, and legal policies.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-green hover:bg-brand-green-light rounded-lg shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Create Content Item
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none flex-nowrap">
        {[
          { id: 'all', label: 'All Content' },
          { id: 'banner', label: 'In-App Banners' },
          { id: 'announcement', label: 'Announcements' },
          { id: 'faq', label: 'FAQs & Guides' },
          { id: 'terms', label: 'Legal Policies' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-brand-green text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search and Listing Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content by title or body text..."
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-gray-900 outline-none"
            />
          </div>

          <span className="text-xs text-gray-500 font-medium">
            Showing {filteredItems.length} items
          </span>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse text-sm min-w-[650px]">
            <thead>
              <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">
                <th className="py-3 px-6">ID</th>
                <th className="py-3 px-6">Title</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Author</th>
                <th className="py-3 px-6">Last Updated</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="hover:bg-gray-50/80 transition cursor-pointer"
                >
                  <td className="py-4 px-6 font-mono text-xs font-bold text-gray-900">{item.id}</td>
                  <td className="py-4 px-6">
                    <div className="text-xs font-bold text-gray-900">{item.title}</div>
                    <div className="text-[11px] text-gray-400 max-w-md truncate">{item.content}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-700">{item.author}</td>
                  <td className="py-4 px-6 text-xs text-gray-500">{formatDate(item.updatedAt, 'short')}</td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
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

      {/* Content Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title={selectedItem ? selectedItem.title : ''}
        subtitle={selectedItem ? `${selectedItem.type.toUpperCase()} • ${selectedItem.id}` : ''}
        badges={selectedItem && <StatusBadge status={selectedItem.status} />}
        actions={
          selectedItem && (
            <div className="flex items-center gap-2">
              {selectedItem.status !== 'published' ? (
                <button
                  onClick={() => {
                    publishContentItem(selectedItem.id);
                    setSelectedItem(contentItems.find((c) => c.id === selectedItem.id) || null);
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-brand-green hover:bg-brand-green-light rounded-lg shadow-xs transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publish Live
                </button>
              ) : (
                <button
                  onClick={() => {
                    archiveContentItem(selectedItem.id);
                    setSelectedItem(contentItems.find((c) => c.id === selectedItem.id) || null);
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition"
                >
                  Unpublish & Archive
                </button>
              )}
            </div>
          )
        }
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Content Body</span>
              <p className="text-sm text-gray-900 leading-relaxed font-normal whitespace-pre-wrap">
                {selectedItem.content}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Author:</span>
                <span className="font-bold text-gray-900">{selectedItem.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created:</span>
                <span className="font-mono text-gray-700">{formatDate(selectedItem.createdAt, 'long')}</span>
              </div>
              {selectedItem.publishedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Published:</span>
                  <span className="font-mono text-emerald-700">{formatDate(selectedItem.publishedAt, 'long')}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-1">Create Content Item</h3>
            <p className="text-xs text-gray-500 mb-4">
              Draft customer-facing announcements, promotional copy, or legal updates.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Content Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none"
                >
                  <option value="announcement">Announcement</option>
                  <option value="banner">In-App Banner</option>
                  <option value="faq">FAQ</option>
                  <option value="terms">Terms & Policy</option>
                  <option value="help">Help Guide</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Rainy Season Transit Advisory"
                  className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Body Text</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Draft user-facing message or policy..."
                  rows={4}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-green hover:bg-brand-green-light rounded-lg shadow-xs"
                >
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
