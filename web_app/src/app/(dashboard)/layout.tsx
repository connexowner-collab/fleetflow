"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  // G4.3: Verify session validity on every dashboard mount.
  // Handles immediate invalidation when user is deactivated/deleted.
  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(data => {
        if (!data.valid) {
          fetch('/api/auth/login', { method: 'DELETE' }).finally(() => {
            router.push('/login')
          })
        }
      })
      .catch(() => {}) // network errors don't log out the user
  }, [router])

  return (
    <div className="flex bg-background text-foreground h-full w-full overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col md:ml-64 h-full min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
