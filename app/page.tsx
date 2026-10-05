'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Lead, LeadStats, FollowUpStatus } from '@/types/lead';
import { Navbar } from '@/components/Navbar';
import { LeadStatsCards } from '@/components/leads/LeadStatsCards';
import { LeadFiltersBar } from '@/components/leads/LeadFiltersBar';
import { LeadTable } from '@/components/leads/LeadTable';
import { DeleteConfirmModal } from '@/components/leads/DeleteConfirmModal';
import { QuickAIModal } from '@/components/leads/QuickAIModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonStats, SkeletonRow, SkeletonCard } from '@/components/ui/LoadingState';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { Plus, Users, SearchX, AlertCircle, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  // Master lead dataset in memory
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters - operated purely client-side for instant response
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FollowUpStatus | 'all'>('all');
  const [eventFilter, setEventFilter] = useState('all');

  // Deletion modal state
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick AI modal state (open directly from the leads list)
  const [aiLead, setAiLead] = useState<Lead | null>(null);

  // Subtle action feedback toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check URL action on mount (e.g. redirected after lead creation or deletion)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      if (action === 'created') {
        const timer = setTimeout(() => {
          setToast({ message: 'Lead created', type: 'success' });
          window.history.replaceState({}, '', '/');
        }, 0);
        return () => clearTimeout(timer);
      } else if (action === 'deleted') {
        const timer = setTimeout(() => {
          setToast({ message: 'Lead deleted', type: 'success' });
          window.history.replaceState({}, '', '/');
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Fetch full leads dataset on initial load or manual refresh
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch('/api/leads');
        const json = await res.json();

        if (!isCancelled) {
          if (!res.ok || !json.success) {
            throw new Error(json.error || 'Failed to load leads from server');
          }

          setAllLeads(json.data.leads || []);
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
  }, [refreshTrigger]);

  // Derive stats dynamically from all loaded leads
  const stats: LeadStats = useMemo(() => {
    return {
      total: allLeads.length,
      pending: allLeads.filter((l) => l.follow_up_status === 'pending').length,
      contacted: allLeads.filter((l) => l.follow_up_status === 'contacted').length,
      completed: allLeads.filter((l) => l.follow_up_status === 'completed').length,
    };
  }, [allLeads]);

  // Derive unique events dynamically from all loaded leads
  const availableEvents: string[] = useMemo(() => {
    const set = new Set(allLeads.map((l) => l.event).filter(Boolean));
    return Array.from(set).sort();
  }, [allLeads]);

  // Client-side instant filtering across all criteria
  const filteredLeads = useMemo(() => {
    let result = allLeads;

    if (statusFilter !== 'all') {
      result = result.filter((lead) => lead.follow_up_status === statusFilter);
    }

    if (eventFilter !== 'all') {
      result = result.filter((lead) => lead.event === eventFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (lead) =>
          lead.name.toLowerCase().includes(q) ||
          lead.company.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          lead.event.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allLeads, statusFilter, eventFilter, search]);

  // Optimistic status update
  const handleStatusChange = async (leadId: string, newStatus: FollowUpStatus) => {
    const previousLead = allLeads.find((l) => l.id === leadId);

    // 1. Update UI immediately
    setAllLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId
          ? { ...lead, follow_up_status: newStatus, updated_at: new Date().toISOString() }
          : lead
      )
    );

    // 2. Persist in background
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follow_up_status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update lead status on server');
      }
      // Reconcile with canonical server record
      setAllLeads((prev) =>
        prev.map((lead) => (lead.id === leadId ? data.data : lead))
      );
      setToast({ message: 'Status updated', type: 'success' });
    } catch {
      // Revert only the affected lead so concurrent optimistic updates survive
      if (previousLead) {
        setAllLeads((prev) => prev.map((lead) => (lead.id === leadId ? previousLead : lead)));
      }
      setToast({ message: "Couldn't update lead", type: 'error' });
    }
  };

  // Optimistic lead deletion
  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;

    const leadId = leadToDelete.id;
    const previousLead = allLeads.find((l) => l.id === leadId);

    // 1. Immediately remove from local list and close modal
    setIsDeleting(true);
    setAllLeads((prev) => prev.filter((l) => l.id !== leadId));
    setLeadToDelete(null);

    // 2. Persist deletion in background
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.status === 404) {
        // Lead already removed server-side — nothing to revert
        setToast({ message: 'Lead deleted', type: 'success' });
        return;
      }
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete lead from server');
      }
      setToast({ message: 'Lead deleted', type: 'success' });
    } catch {
      // Re-insert only the deleted lead so concurrent optimistic updates survive
      if (previousLead) {
        setAllLeads((prev) => (prev.some((l) => l.id === leadId) ? prev : [previousLead, ...prev]));
      }
      setToast({ message: "Couldn't delete lead", type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const isFiltered = Boolean(search || statusFilter !== 'all' || eventFilter !== 'all');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Event Leads
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Track conference contacts, prioritize follow-ups, and draft attendee outreach.
            </p>
          </div>

          {/* Navbar already exposes this CTA on small screens */}
          <div className="hidden sm:block self-start sm:self-auto">
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

        {/* Lead Stats Cards - Instant click-to-filter */}
        {isLoading && allLeads.length === 0 ? (
          <SkeletonStats />
        ) : (
          <LeadStatsCards
            stats={stats}
            totalEvents={availableEvents.length}
            selectedStatus={statusFilter}
            onSelectStatus={(status) => setStatusFilter(status)}
          />
        )}

        {/* Action Priority Banner - Answers "Which leads need attention?" */}
        {!isLoading && stats.pending > 0 && statusFilter !== 'pending' && (
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className="mb-6 w-full flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 rounded-lg bg-amber-50/80 border border-amber-200/90 text-left text-xs text-amber-900 shadow-2xs hover:bg-amber-100/60 hover:border-amber-300 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
          >
            <span
              className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse"
              aria-hidden="true"
            />
            <span className="flex-1 min-w-0 block leading-relaxed">
              <span className="font-semibold text-amber-950">Action required:</span>{' '}
              <span className="text-amber-800">
                {stats.pending} {stats.pending === 1 ? 'attendee requires' : 'attendees require'}{' '}
                follow-up outreach.
              </span>
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 font-semibold text-amber-900 group-hover:text-amber-950 transition-colors">
              <span className="hidden sm:inline">
                View pending {stats.pending === 1 ? 'lead' : 'leads'}
              </span>
              <ArrowRight
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </button>
        )}

        {/* Search & Filters - Instant local interactions */}
        <LeadFiltersBar
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          event={eventFilter}
          onEventChange={setEventFilter}
          availableEvents={availableEvents}
          totalResults={filteredLeads.length}
        />

        {/* Content Area */}
        {isLoading && allLeads.length === 0 ? (
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
        ) : filteredLeads.length > 0 ? (
          <LeadTable
            leads={filteredLeads}
            onDeleteClick={(lead) => setLeadToDelete(lead)}
            onStatusChange={handleStatusChange}
            onAIClick={(lead) => setAiLead(lead)}
            onFeedback={(msg, type) => setToast({ message: msg, type: type || 'success' })}
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

      {/* Quick AI Modal — run from the leads list without opening a lead.
          Keyed by lead id so results reset when switching leads. */}
      <QuickAIModal
        key={aiLead?.id ?? 'none'}
        lead={aiLead}
        isOpen={Boolean(aiLead)}
        onClose={() => setAiLead(null)}
        onFeedback={(msg, type) => setToast({ message: msg, type: type || 'success' })}
      />

      {/* Action Feedback Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
