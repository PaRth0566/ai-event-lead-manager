'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lead, FollowUpStatus } from '@/types/lead';
import { StatusBadge } from './StatusBadge';
import { AIAssistantSection } from './AIAssistantSection';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
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

  // Quick status change
  const handleStatusChange = async (newStatus: FollowUpStatus) => {
    if (lead.follow_up_status === newStatus || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follow_up_status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }
      setLead(data.data);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not update status');
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
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not delete lead');
      setIsDeleting(false);
    }
  };

  const statusOptions: { value: FollowUpStatus; label: string; dotColor: string }[] = [
    { value: 'pending', label: 'Pending', dotColor: 'bg-amber-500' },
    { value: 'contacted', label: 'Contacted', dotColor: 'bg-blue-500' },
    { value: 'completed', label: 'Completed', dotColor: 'bg-emerald-500' },
  ];

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
      <Card className="border-slate-200 shadow-2xs overflow-hidden">
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

      {/* Interaction Notes */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Interaction Notes</h2>
            <p className="text-xs text-slate-500 mt-0.5">Discussion takeaways recorded from the event</p>
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
      <AIAssistantSection lead={lead} />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        lead={lead}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
