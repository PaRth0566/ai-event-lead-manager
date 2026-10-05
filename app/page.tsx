'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lead, LeadStats, FollowUpStatus } from '@/types/lead';
import { Navbar } from '@/components/Navbar';
import { LeadStatsCards } from '@/components/leads/LeadStatsCards';
import { LeadFiltersBar } from '@/components/leads/LeadFiltersBar';
import { LeadTable } from '@/components/leads/LeadTable';
import { DeleteConfirmModal } from '@/components/leads/DeleteConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonStats, SkeletonRow, SkeletonCard } from '@/components/ui/LoadingState';
import { Button } from '@/components/ui/Button';
import { Plus, Users, SearchX, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({ total: 0, pending: 0, contacted: 0, completed: 0 });
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);
  const [dbStatus, setDbStatus] = useState<{ isConnectedToSupabase: boolean; provider: 'supabase' | 'demo' }>({
    isConnectedToSupabase: false,
    provider: 'demo',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FollowUpStatus | 'all'>('all');
  const [eventFilter, setEventFilter] = useState('all');

  // Deletion modal state
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch leads on filter change or refresh
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
        if (eventFilter && eventFilter !== 'all') params.set('event', eventFilter);

        const res = await fetch(`/api/leads?${params.toString()}`);
        const json = await res.json();

        if (!isCancelled) {
          if (!res.ok || !json.success) {
            throw new Error(json.error || 'Failed to load leads from server');
          }

          setLeads(json.data.leads || []);
          setStats(json.data.stats || { total: 0, pending: 0, contacted: 0, completed: 0 });
          setAvailableEvents(json.data.events || []);
          if (json.data.dbStatus) {
            setDbStatus(json.data.dbStatus);
          }
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : 'Something went wrong while loading your leads. Please try again.'
          );
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch, statusFilter, eventFilter, refreshTrigger]);

  // Handle lead deletion
  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/leads/${leadToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete lead');
      }

      setLeadToDelete(null);
      setRefreshTrigger((k) => k + 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete lead');
    } finally {
      setIsDeleting(false);
    }
  };

  const isFiltered = Boolean(debouncedSearch || statusFilter !== 'all' || eventFilter !== 'all');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar dbStatus={dbStatus} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Event Leads
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage attendees, summarize conversation notes, and draft follow-up emails.
            </p>
          </div>

          <div className="self-start sm:self-auto">
            <Link href="/leads/new">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Lead
              </Button>
            </Link>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Unable to load data:</span> {error}
            </div>
            <Button size="sm" variant="outline" onClick={() => setRefreshTrigger((k) => k + 1)}>
              Retry
            </Button>
          </div>
        )}

        {/* Lead Stats Cards */}
        {isLoading && stats.total === 0 ? (
          <SkeletonStats />
        ) : (
          <LeadStatsCards
            stats={stats}
            selectedStatus={statusFilter}
            onSelectStatus={(status) => setStatusFilter(status)}
          />
        )}

        {/* Search & Filters */}
        <LeadFiltersBar
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          event={eventFilter}
          onEventChange={setEventFilter}
          availableEvents={availableEvents}
          totalResults={leads.length}
        />

        {/* Content Area */}
        {isLoading ? (
          <div>
            <div className="hidden md:block overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full">
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <SkeletonRow key={i} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        ) : leads.length > 0 ? (
          <LeadTable
            leads={leads}
            onDeleteClick={(lead) => setLeadToDelete(lead)}
          />
        ) : isFiltered ? (
          <EmptyState
            icon={<SearchX className="w-5 h-5 text-slate-400" />}
            title="No leads found"
            description="No leads match your current search or filter criteria. Try adjusting your search query or reset active filters."
            actionLabel="Clear Filters"
            onAction={() => {
              setSearch('');
              setStatusFilter('all');
              setEventFilter('all');
            }}
          />
        ) : (
          <EmptyState
            icon={<Users className="w-5 h-5 text-slate-400" />}
            title="No leads yet"
            description="Add your first event lead to start tracking conversations, summarizing notes, and drafting follow-up emails."
            actionLabel="Add Lead"
            actionHref="/leads/new"
          />
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        lead={leadToDelete}
        isOpen={Boolean(leadToDelete)}
        onClose={() => setLeadToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
