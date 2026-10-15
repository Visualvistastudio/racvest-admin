'use client';

import React, { useState } from 'react';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { GlobalSearchModal } from '@/components/layout/GlobalSearchModal';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <title>Racvest Admin — Operational Control</title>
        <meta name="description" content="Racvest delivery marketplace administration and operational command centre." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      </head>
      <body className="bg-[#F8FAFC] text-gray-900 min-h-screen flex antialiased">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <TopBar
            onOpenSearch={() => setSearchOpen(true)}
            onToggleMobileMenu={() => setMobileSidebarOpen((prev) => !prev)}
          />

          <main className="flex-1 p-3.5 sm:p-5 md:p-8 max-w-7xl w-full mx-auto min-w-0">
            {children}
          </main>
        </div>

        <ToastContainer />
        <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </body>
    </html>
  );
}
