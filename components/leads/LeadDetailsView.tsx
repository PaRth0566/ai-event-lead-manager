'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lead, FollowUpStatus } from '@/types/lead';
import { StatusBadge } from './StatusBadge';
import { AIAssistantSection } from './AIAssistantSection';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Toast } from '@/components/ui/Toast';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Mail,
  Building2,
  Calendar,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface LeadDetailsViewProps {
  initialLead: Lead;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function LeadDetailsView({ initialLead }: LeadDetailsViewProps) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead>(initialLead);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Check URL query parameters for action feedback on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      if (action === 'created') {
        const timer = setTimeout(() => {
          setToast({ message: 'Lead created', type: 'success' });
          window.history.replaceState({}, '', window.location.pathname);
        }, 0);
        return () => clearTimeout(timer);
      } else if (action === 'updated') {
        const timer = setTimeout(() => {
          setToast({ message: 'Lead updated', type: 'success' });
          window.history.replaceState({}, '', window.location.pathname);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Optimistic status change
  const handleStatusChange = async (newStatus: FollowUpStatus) => {
    if (lead.follow_up_status === newStatus || isUpdatingStatus) return;

    const previousLead = lead;

    // 1. Optimistically update local UI immediately
    setLead((prev) => ({
      ...prev,
      follow_up_status: newStatus,
      updated_at: new Date().toISOString(),
    }));

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follow_up_status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status on server');
      }
      // Reconcile with canonical record
      setLead(data.data);
      setToast({ message: 'Status updated', type: 'success' });
    } catch {
      // Revert on failure
      setLead(previousLead);
      setToast({ message: "Couldn't update lead", type: 'error' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Delete lead
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete lead');
      }
      router.push('/?action=deleted');
    } catch {
      setToast({ message: "Couldn't delete lead", type: 'error' });
      setIsDeleting(false);
    }
  };

  const statusOptions: { value: FollowUpStatus; label: string; dotColor: string }[] = [
    { value: 'pending', label: 'Pending', dotColor: 'bg-amber-500' },
    { value: 'contacted', label: 'Contacted', dotColor: 'bg-blue-500' },
    { value: 'completed', label: 'Completed', dotColor: 'bg-emerald-500' },
  ];

  const getNextAction = (status: FollowUpStatus) => {
    switch (status) {
      case 'pending':
        return {
          badge: 'Action Required',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          title: 'Follow up with this lead',
          description:
            'Initial outreach has not been sent yet. Review interaction notes and draft a customized follow-up message.',
        };
      case 'contacted':
        return {
          badge: 'In Progress',
          badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
          title: 'Awaiting attendee response',
          description:
            'Follow-up message has been sent. Follow through if needed or mark completed once the discussion concludes.',
        };
      case 'completed':
        return {
          badge: 'Resolved',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          title: 'Follow-up concluded',
          description:
            'Workflow complete. Interaction notes and history are safely preserved for future reference.',
        };
    }
  };

  const nextAction = getNextAction(lead.follow_up_status);

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb & Page Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Leads</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-800 truncate max-w-[220px]">{lead.name}</span>
        </nav>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link href={`/leads/${lead.id}/edit`}>
            <Button variant="outline" size="sm" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
              Edit Lead
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Lead Overview Card */}
      <Card className="border-slate-200/90 shadow-2xs overflow-hidden">
        <CardBody className="p-5 sm:p-6 space-y-6">
          {/* Top Row: Lead Identification & Segmented Status Switcher */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-5 border-b border-slate-100">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
                  {lead.name}
                </h1>
                <StatusBadge status={lead.follow_up_status} size="sm" />
              </div>

              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs sm:text-sm text-slate-600">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-800 break-words">{lead.company}</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="break-words">{lead.event}</span>
                </div>
              </div>
            </div>

            {/* Accessible Segmented Status Controller */}
            <div className="w-full sm:w-auto shrink-0 bg-slate-100/80 p-1 rounded-lg border border-slate-200/80 grid grid-cols-3 sm:flex sm:flex-row gap-1 self-start">
              <span className="sr-only">Change lead status</span>
              {statusOptions.map((opt) => {
                const isActive = lead.follow_up_status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={isActive}
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(opt.value)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${opt.dotColor} ${
                        !isActive ? 'opacity-50' : ''
                      }`}
                    />
                    <span>{opt.label}</span>
                    {isActive && isUpdatingStatus && (
                      <Loader2 className="w-3 h-3 animate-spin text-slate-400 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact & Timestamp Row with robust responsive layout and zero overlap */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 pt-1">
            {/* Email Column: min-w-0, overflow protection, clean mailto */}
            <div className="min-w-0 space-y-1 overflow-hidden">
              <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
                Email Address
              </span>
              <div className="flex items-center gap-1.5 min-w-0 pt-0.5 overflow-hidden">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a
                  href={`mailto:${lead.email}`}
                  title={lead.email}
                  className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline truncate block min-w-0 max-w-full"
                >
                  {lead.email}
                </a>
              </div>
            </div>

            {/* Captured Date Column */}
            <div className="min-w-0 space-y-1">
              <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
                Lead Captured On
              </span>
              <div className="text-xs sm:text-sm text-slate-700 font-medium pt-0.5 whitespace-normal">
                {formatDate(lead.created_at)}
              </div>
            </div>

            {/* Updated Date Column */}
            <div className="min-w-0 space-y-1">
              <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
                Last Status Update
              </span>
              <div className="text-xs sm:text-sm text-slate-700 font-medium pt-0.5 whitespace-normal">
                {formatDate(lead.updated_at)}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Next Action Presentation - CRM Workflow Enhancement */}
      <div
        className={`p-4 sm:p-5 rounded-lg border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
          lead.follow_up_status === 'pending'
            ? 'bg-amber-50/70 border-amber-200/90'
            : lead.follow_up_status === 'contacted'
            ? 'bg-blue-50/60 border-blue-200/80'
            : 'bg-slate-50/80 border-slate-200/90'
        }`}
      >
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Next Action
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${nextAction.badgeColor}`}>
              {nextAction.badge}
            </span>
          </div>
          <p className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
            {nextAction.title}
          </p>
          <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
            {nextAction.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0 pt-1 sm:pt-0">
          {lead.follow_up_status === 'pending' && (
            <>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('ai-assistant-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <span>Draft follow-up</span>
                <span aria-hidden="true">&darr;</span>
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange('contacted')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 disabled:opacity-60"
              >
                Mark Contacted
              </button>
            </>
          )}

          {lead.follow_up_status === 'contacted' && (
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={() => handleStatusChange('completed')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-60"
            >
              Mark Completed
            </button>
          )}

          {lead.follow_up_status === 'completed' && (
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={() => handleStatusChange('pending')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 disabled:opacity-60"
            >
              Reopen Follow-up
            </button>
          )}
        </div>
      </div>

      {/* Interaction Notes */}
      <Card className="border-slate-200/90 shadow-2xs">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Interaction Notes</h2>
            <p className="text-xs text-slate-500 mt-0.5">Discussion takeaways recorded from {lead.event}</p>
          </div>
          <Link
            href={`/leads/${lead.id}/edit`}
            className="text-xs text-slate-600 hover:text-slate-900 font-medium hover:underline inline-flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Link>
        </CardHeader>
        <CardBody className="p-4 sm:p-6">
          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words bg-slate-50/50 p-4 rounded-lg border border-slate-200/70 font-sans">
            {lead.notes}
          </div>
        </CardBody>
      </Card>

      {/* AI Assistant Section */}
      <AIAssistantSection
        lead={lead}
        onFeedback={(msg, type) => setToast({ message: msg, type: type || 'success' })}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        lead={lead}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
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
