'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Users, Database, CalendarDays } from 'lucide-react';
import { Button } from './ui/Button';

interface NavbarProps {
  dbStatus?: {
    isConnectedToSupabase: boolean;
    provider: 'supabase' | 'demo';
  };
}

export function Navbar({ dbStatus }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xs border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 group min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors shrink-0">
                <CalendarDays className="w-4 h-4 text-slate-100" />
              </div>
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-semibold text-sm sm:text-base text-slate-900 tracking-tight truncate block">
                  AI Event Lead Manager
                </span>
                <span className="text-[11px] text-slate-400 font-medium hidden md:inline shrink-0">
                  Conference CRM
                </span>
              </div>
            </Link>

            {/* Nav links */}
            <nav className="hidden sm:flex items-center gap-1 pl-4 border-l border-slate-200">
              <Link
                href="/"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  pathname === '/'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>All Leads</span>
              </Link>
            </nav>
          </div>

          {/* Right actions: DB badge + Add Lead */}
          <div className="flex items-center gap-3">
            {dbStatus && (
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/80"
                title={
                  dbStatus.isConnectedToSupabase
                    ? 'Connected to live Supabase PostgreSQL'
                    : 'Running in demo storage. Add Supabase keys to .env to connect live PostgreSQL'
                }
              >
                <Database className="w-3 h-3 text-slate-400 shrink-0" />
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    dbStatus.isConnectedToSupabase ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                />
                <span>{dbStatus.isConnectedToSupabase ? 'Supabase Live' : 'Demo Mode'}</span>
              </div>
            )}

            {pathname !== '/leads/new' && (
              <Link href="/leads/new">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Add Lead
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
