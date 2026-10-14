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

  return (
    <html lang="en">
      <head>
        <title>Racvest Admin — Operational Control</title>
        <meta name="description" content="Racvest delivery marketplace administration and operational command centre." />
      </head>
      <body className="bg-[#F8FAFC] text-gray-900 min-h-screen flex antialiased">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <TopBar onOpenSearch={() => setSearchOpen(true)} />

          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        <ToastContainer />
        <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </body>
    </html>
  );
}
