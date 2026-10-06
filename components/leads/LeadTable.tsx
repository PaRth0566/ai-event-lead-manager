'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FollowUpStatus, Lead } from '@/types/lead';
import { StatusBadge } from './StatusBadge';
import { Tooltip } from '@/components/ui/Tooltip';
import { timeAgo } from '@/lib/time';
import { buildLocalSummary } from '@/lib/summary';
import { copyTextToClipboard } from '@/lib/clipboard';
import { Eye, Edit3, Trash2, Calendar, Building2, Mail, Sparkles, Copy, Check } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  onDeleteClick: (lead: Lead) => void;
  onStatusChange?: (leadId: string, newStatus: FollowUpStatus) => void;
  onAIClick?: (lead: Lead) => void;
  onFeedback?: (message: string, type?: 'success' | 'error') => void;
}

const statusDots: Record<FollowUpStatus, string> = {
  pending: 'bg-amber-400',
  contacted: 'bg-blue-400',
  completed: 'bg-emerald-400',
};

const statusLabels: Record<FollowUpStatus, string> = {
  pending: 'Pending',
  contacted: 'Contacted',
  completed: 'Completed',
};

function formatFullTimestamp(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString('en-US', {
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

function formatDay(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/** Status-specific pipeline insight shown when hovering the status control */
function statusInsight(lead: Lead): { headline: string; detail: string } {
  switch (lead.follow_up_status) {
    case 'pending':
      return {
        headline: 'Awaiting first outreach',
        detail: `Captured ${timeAgo(lead.created_at) || 'recently'} · no activity for ${timeAgo(lead.updated_at) || 'a while'}`,
      };
    case 'contacted':
      return {
        headline: 'Outreach in progress',
        detail: `Last activity ${timeAgo(lead.updated_at) || 'recently'} — nudge if there is no response`,
      };
    case 'completed':
      return {
        headline: 'Follow-up resolved',
        detail: `Concluded ${timeAgo(lead.updated_at) || 'recently'} · notes kept for reference`,
      };
  }
}

/**
 * Structured instant summary for the lead hover card.
 * Extracts pain points, interests, and next steps from the notes
 * locally (no network) using the shared deterministic summarizer.
 */
function TooltipSummary({ lead }: { lead: Lead }) {
  const summary = buildLocalSummary({
    notes: lead.notes,
    name: lead.name,
    company: lead.company,
    event: lead.event,
  });

  // The Lead Context bullet repeats who/where — the row already shows that
  const bullets = summary
    .split('\n\n')
    .filter((b) => b && !b.includes('**Lead Context'))
    .slice(0, 4);

  if (bullets.length === 0) {
    return (
      <p className="border-t border-white/10 pt-1.5 text-[11px] leading-relaxed text-slate-300 line-clamp-3">
        {lead.notes}
      </p>
    );
  }

  return (
    <div className="border-t border-white/10 pt-1.5 mt-1.5 space-y-1.5">
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <Sparkles className="w-3 h-3" />
        <span>Quick summary</span>
      </div>
      {bullets.map((bullet, index) => {
        const match = bullet.match(/^(?:-\s+)?\*\*(.+?):\*\*\s*([\s\S]*)$/);
        if (!match) {
          return (
            <p key={index} className="text-[11px] leading-relaxed text-slate-300 line-clamp-2">
              {bullet}
            </p>
          );
        }
        return (
          <p key={index} className="text-[11px] leading-relaxed text-slate-300">
            <span className="font-semibold text-white">{match[1]}: </span>
            <span className="line-clamp-2">{match[2]}</span>
          </p>
        );
      })}
    </div>
  );
}

export function LeadTable({ leads, onDeleteClick, onStatusChange, onAIClick, onFeedback }: LeadTableProps) {
  const router = useRouter();
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRowClick = (leadId: string) => {
    router.push(`/leads/${leadId}`);
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, leadId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(`/leads/${leadId}`);
    }
  };

  // One-click email copy straight from the list
  const handleCopyEmail = async (lead: Lead) => {
    const ok = await copyTextToClipboard(lead.email);
    if (ok) {
      setCopiedEmailId(lead.id);
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
      copyResetTimer.current = setTimeout(() => setCopiedEmailId(null), 2000);
    } else {
      onFeedback?.("Couldn't copy email", 'error');
    }
  };

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border border-slate-200/90 bg-white shadow-2xs">
        <table className="w-full table-fixed text-left text-xs sm:text-sm text-slate-700">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[20%]" />
            <col className="w-[16%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th scope="col" className="py-3 px-4 bg-slate-50 first:rounded-tl-lg">
                Lead Name & Email
              </th>
              <th scope="col" className="py-3 px-4 bg-slate-50">
                Company
              </th>
              <th scope="col" className="py-3 px-4 bg-slate-50">
                Event
              </th>
              <th scope="col" className="py-3 px-3 bg-slate-50">
                Status
              </th>
              <th scope="col" className="py-3 px-3 bg-slate-50">
                Updated
              </th>
              <th scope="col" className="py-3 px-4 text-right bg-slate-50 last:rounded-tr-lg">
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
                  <Tooltip
                    variant="rich"
                    align="left"
                    className="w-full flex-col min-w-0"
                    content={
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusDots[lead.follow_up_status]}`} />
                          <span className="text-[11px] font-semibold uppercase tracking-wider">
                            {statusLabels[lead.follow_up_status]}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            · captured {timeAgo(lead.created_at) || 'recently'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 truncate">{lead.email}</div>
                        <div className="text-[11px] text-slate-400">
                          Last activity {timeAgo(lead.updated_at) || 'recently'}
                        </div>
                        <TooltipSummary lead={lead} />
                      </div>
                    }
                  >
                    <span
                      className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors block truncate"
                    >
                      {lead.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyEmail(lead);
                      }}
                      className="group/email inline-flex items-center gap-1 max-w-full text-left min-w-0 cursor-pointer"
                      aria-label={`Copy email address of ${lead.name}`}
                    >
                      <span className="text-xs text-slate-500 group-hover/email:text-slate-700 transition-colors block truncate">
                        {lead.email}
                      </span>
                      {copiedEmailId === lead.id ? (
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover/email:opacity-100 transition-opacity shrink-0" />
                      )}
                    </button>
                  </Tooltip>
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
                    <Tooltip
                      variant="rich"
                      align="center"
                      content={
                        (() => {
                          const insight = statusInsight(lead);
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusDots[lead.follow_up_status]}`} />
                                <span className="text-[11px] font-semibold">{insight.headline}</span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-slate-300">{insight.detail}</p>
                            </div>
                          );
                        })()
                      }
                    >
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
                    </Tooltip>
                  ) : (
                    <StatusBadge status={lead.follow_up_status} size="sm" />
                  )}
                </td>

                {/* Last Updated */}
                <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">
                  <Tooltip label={`Last activity: ${formatFullTimestamp(lead.updated_at || lead.created_at)}`}>
                    <span className="cursor-default">{formatDay(lead.updated_at || lead.created_at)}</span>
                  </Tooltip>
                </td>

                {/* Actions */}
                <td
                  className="py-3 px-4 text-right whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip label="View details">
                      <Link
                        href={`/leads/${lead.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                        aria-label={`View ${lead.name}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Tooltip>
                    <Tooltip label="Edit lead">
                      <Link
                        href={`/leads/${lead.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                        aria-label={`Edit ${lead.name}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                    </Tooltip>
                    <Tooltip label="AI assistant">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAIClick?.(lead);
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
                        aria-label={`Open AI tools for ${lead.name}`}
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </Tooltip>
                    <Tooltip label="Delete lead">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClick(lead);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-600"
                        aria-label={`Delete ${lead.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Tooltip>
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
                    className={`text-[11px] font-medium rounded-md px-2.5 py-1.5 border cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors ${
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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyEmail(lead);
                }}
                className="group/email flex items-center gap-1.5 min-w-0 w-full text-left cursor-pointer"
                aria-label={`Copy email address of ${lead.name}`}
              >
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate group-hover/email:text-slate-700" title={lead.email}>
                  {lead.email}
                </span>
                {copiedEmailId === lead.id ? (
                  <Check className="w-3 h-3 text-emerald-500 shrink-0 ml-auto" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-400 shrink-0 ml-auto" />
                )}
              </button>
              <div className="flex items-center gap-1.5 min-w-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate" title={lead.event}>
                  {lead.event}
                </span>
              </div>
            </div>

            {/* Footer: Date & Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <Tooltip label={`Last activity: ${formatFullTimestamp(lead.updated_at || lead.created_at)}`}>
                <span className="text-slate-400 cursor-default">
                  {formatDay(lead.updated_at || lead.created_at)}
                </span>
              </Tooltip>
              <div
                className="flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Link
                  href={`/leads/${lead.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                  aria-label={`View ${lead.name}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </Link>
                <Tooltip label="Edit lead">
                  <Link
                    href={`/leads/${lead.id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                    aria-label={`Edit ${lead.name}`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>
                </Tooltip>
                <Tooltip label="AI assistant">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAIClick?.(lead);
                    }}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
                    aria-label={`Open AI tools for ${lead.name}`}
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip label="Delete lead">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClick(lead);
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-600"
                    aria-label={`Delete ${lead.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
