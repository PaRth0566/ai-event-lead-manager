'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FollowUpStatus, Lead } from '@/types/lead';
import { StatusBadge } from './StatusBadge';
import { Eye, Edit3, Trash2, Calendar, Building2, Mail } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  onDeleteClick: (lead: Lead) => void;
  onStatusChange?: (leadId: string, newStatus: FollowUpStatus) => void;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function LeadTable({ leads, onDeleteClick, onStatusChange }: LeadTableProps) {
  const router = useRouter();

  const handleRowClick = (leadId: string) => {
    router.push(`/leads/${leadId}`);
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, leadId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(`/leads/${leadId}`);
    }
  };

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-2xs">
        <table className="w-full table-fixed text-left text-xs sm:text-sm text-slate-700">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[20%]" />
            <col className="w-[18%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th scope="col" className="py-3 px-4">
                Lead Name & Email
              </th>
              <th scope="col" className="py-3 px-4">
                Company
              </th>
              <th scope="col" className="py-3 px-4">
                Event
              </th>
              <th scope="col" className="py-3 px-3">
                Status
              </th>
              <th scope="col" className="py-3 px-3">
                Updated
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                tabIndex={0}
                role="link"
                aria-label={`View details for ${lead.name}`}
                onClick={() => handleRowClick(lead.id)}
                onKeyDown={(e) => handleRowKeyDown(e, lead.id)}
                className="hover:bg-slate-50/80 active:bg-slate-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900 transition-colors duration-120 cursor-pointer group"
              >
                {/* Lead Name & Email */}
                <td className="py-3 px-4 min-w-0">
                  <span
                    title={lead.name}
                    className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors block truncate"
                  >
                    {lead.name}
                  </span>
                  <span
                    title={lead.email}
                    className="text-xs text-slate-500 block truncate"
                  >
                    {lead.email}
                  </span>
                </td>

                {/* Company */}
                <td className="py-3 px-4 min-w-0 text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span title={lead.company} className="truncate">
                      {lead.company}
                    </span>
                  </div>
                </td>

                {/* Event */}
                <td className="py-3 px-4 min-w-0">
                  <span
                    title={lead.event}
                    className="inline-block max-w-full text-xs text-slate-700 truncate font-normal"
                  >
                    {lead.event}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  {onStatusChange ? (
                    <select
                      aria-label={`Update status for ${lead.name}`}
                      value={lead.follow_up_status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        onStatusChange(lead.id, e.target.value as FollowUpStatus);
                      }}
                      className={`text-[11px] font-medium rounded-md px-2 py-0.5 border cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors ${
                        lead.follow_up_status === 'pending'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70'
                          : lead.follow_up_status === 'contacted'
                          ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100/70'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="completed">Completed</option>
                    </select>
                  ) : (
                    <StatusBadge status={lead.follow_up_status} size="sm" />
                  )}
                </td>

                {/* Last Updated */}
                <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">
                  {formatDate(lead.updated_at || lead.created_at)}
                </td>

                {/* Actions */}
                <td
                  className="py-3 px-4 text-right whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/leads/${lead.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                      title="View details"
                      aria-label={`View ${lead.name}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/leads/${lead.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                      title="Edit"
                      aria-label={`Edit ${lead.name}`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClick(lead);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-600"
                      title="Delete"
                      aria-label={`Delete ${lead.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards */}
      <div className="md:hidden space-y-3">
        {leads.map((lead) => (
          <div
            key={lead.id}
            tabIndex={0}
            role="link"
            aria-label={`View details for ${lead.name}`}
            onClick={() => handleRowClick(lead.id)}
            onKeyDown={(e) => handleRowKeyDown(e, lead.id)}
            className="bg-white hover:bg-slate-50/80 active:bg-slate-100/70 rounded-lg border border-slate-200/90 p-3.5 shadow-2xs space-y-2.5 transition-colors duration-120 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            {/* Header: Name + Status */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span
                  className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm sm:text-base block truncate"
                  title={lead.name}
                >
                  {lead.name}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate" title={lead.company}>
                    {lead.company}
                  </span>
                </div>
              </div>
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                {onStatusChange ? (
                  <select
                    aria-label={`Update status for ${lead.name}`}
                    value={lead.follow_up_status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      onStatusChange(lead.id, e.target.value as FollowUpStatus);
                    }}
                    className={`text-[11px] font-medium rounded-md px-2 py-0.5 border cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors ${
                      lead.follow_up_status === 'pending'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : lead.follow_up_status === 'contacted'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="completed">Completed</option>
                  </select>
                ) : (
                  <StatusBadge status={lead.follow_up_status} size="sm" />
                )}
              </div>
            </div>

            {/* Email & Event info */}
            <div className="text-xs text-slate-600 space-y-1 bg-slate-50/70 p-2.5 rounded border border-slate-100">
              <div className="flex items-center gap-1.5 min-w-0">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate" title={lead.email}>
                  {lead.email}
                </span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate" title={lead.event}>
                  {lead.event}
                </span>
              </div>
            </div>

            {/* Footer: Date & Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400">
                {formatDate(lead.updated_at || lead.created_at)}
              </span>
              <div
                className="flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Link
                  href={`/leads/${lead.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                  aria-label={`View ${lead.name}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </Link>
                <Link
                  href={`/leads/${lead.id}/edit`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                  title="Edit"
                  aria-label={`Edit ${lead.name}`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(lead);
                  }}
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-600"
                  title="Delete"
                  aria-label={`Delete ${lead.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
