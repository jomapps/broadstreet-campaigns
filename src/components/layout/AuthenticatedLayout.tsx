'use client';

import { SignedIn, SignedOut } from '@clerk/nextjs';
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import QueryProvider from "@/lib/providers/query-client-provider";
import AppInitializer from "@/components/app/AppInitializer";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

/**
 * AuthenticatedLayout - Conditionally renders the dashboard layout only for signed-in users
 * For signed-out users, renders children directly (for public pages like home)
 */
export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <>
      <SignedIn>
        <QueryProvider>
          <AppInitializer />
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </QueryProvider>
      </SignedIn>
      <SignedOut>
        {children}
      </SignedOut>
    </>
  );
}
