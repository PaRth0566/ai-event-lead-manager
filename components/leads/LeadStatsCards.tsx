import React from 'react';
import { LeadStats, FollowUpStatus } from '@/types/lead';
import { Tooltip } from '@/components/ui/Tooltip';

interface LeadStatsCardsProps {
  stats: LeadStats;
  totalEvents?: number;
  selectedStatus?: FollowUpStatus | 'all';
  onSelectStatus?: (status: FollowUpStatus | 'all') => void;
}

export function LeadStatsCards({
  stats,
  totalEvents = 0,
  selectedStatus = 'all',
  onSelectStatus,
}: LeadStatsCardsProps) {
  const pct = (value: number) =>
    stats.total > 0 ? Math.round((value / stats.total) * 100) : 0;

  const cards = [
    {
      id: 'all' as const,
      label: 'Total Leads',
      value: stats.total,
      subtext: 'All event contacts',
      dotColor: 'bg-slate-400',
      badge: null,
      badgeStyle: '',
      insight:
        totalEvents > 0
          ? `${stats.total} lead${stats.total === 1 ? '' : 's'} captured across ${totalEvents} event${totalEvents === 1 ? '' : 's'}`
          : 'All event contacts you have captured',
    },
    {
      id: 'pending' as const,
      label: 'Needs Follow-up',
      value: stats.pending,
      subtext: stats.pending === 1 ? '1 lead awaiting' : `${stats.pending} leads awaiting`,
      dotColor: 'bg-amber-500',
      badge: stats.pending > 0 ? 'Action needed' : null,
      badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200/80',
      insight:
        stats.pending > 0
          ? `${pct(stats.pending)}% of your pipeline is still awaiting first outreach`
          : 'All caught up — no leads are waiting for outreach',
    },
    {
      id: 'contacted' as const,
      label: 'Contacted',
      value: stats.contacted,
      subtext: 'Outreach in progress',
      dotColor: 'bg-blue-500',
      badge: null,
      badgeStyle: '',
      insight:
        stats.contacted > 0
          ? `${pct(stats.contacted)}% of your pipeline has outreach in progress`
          : 'No active outreach right now',
    },
    {
      id: 'completed' as const,
      label: 'Completed',
      value: stats.completed,
      subtext: 'Follow-up resolved',
      dotColor: 'bg-emerald-500',
      badge: null,
      badgeStyle: '',
      insight:
        stats.completed > 0
          ? `${pct(stats.completed)}% of your follow-ups have been resolved`
          : 'No follow-ups resolved yet',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {cards.map((card) => {
        const isSelected = selectedStatus === card.id;

        return (
          <Tooltip key={card.id} label={card.insight} side="top" align="center">
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectStatus?.(card.id)}
              className={`w-full text-left rounded-lg border p-3 sm:p-4 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 group ${
                isSelected
                  ? 'bg-slate-50/90 border-slate-900 ring-1 ring-slate-900 shadow-2xs'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <span className="text-xs font-medium text-slate-600 truncate">
                  {card.label}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {card.badge && (
                    <span className={`hidden sm:inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded border ${card.badgeStyle}`}>
                      {card.badge}
                    </span>
                  )}
                  <span className={`w-2 h-2 rounded-full shrink-0 ${card.dotColor}`} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-none mb-1">
                {card.value}
              </div>
              <div className="text-[11px] text-slate-500 truncate flex items-center justify-between">
                <span>{card.subtext}</span>
                {isSelected && (
                  <span className="text-[10px] font-semibold text-slate-900 uppercase tracking-wider shrink-0 ml-1">
                    Active
                  </span>
                )}
              </div>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
