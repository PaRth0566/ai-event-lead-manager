import React from 'react';
import { LeadStats, FollowUpStatus } from '@/types/lead';

interface LeadStatsCardsProps {
  stats: LeadStats;
  selectedStatus?: FollowUpStatus | 'all';
  onSelectStatus?: (status: FollowUpStatus | 'all') => void;
}

export function LeadStatsCards({ stats, selectedStatus = 'all', onSelectStatus }: LeadStatsCardsProps) {
  const cards = [
    {
      id: 'all' as const,
      label: 'Total Leads',
      value: stats.total,
      dotColor: 'bg-slate-400',
    },
    {
      id: 'pending' as const,
      label: 'Pending',
      value: stats.pending,
      dotColor: 'bg-amber-500',
    },
    {
      id: 'contacted' as const,
      label: 'Contacted',
      value: stats.contacted,
      dotColor: 'bg-blue-500',
    },
    {
      id: 'completed' as const,
      label: 'Completed',
      value: stats.completed,
      dotColor: 'bg-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {cards.map((card) => {
        const isSelected = selectedStatus === card.id;

        return (
          <button
            key={card.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectStatus?.(card.id)}
            className={`text-left bg-white rounded-lg border p-3 sm:p-4 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
              isSelected
                ? 'border-slate-900 ring-1 ring-slate-900 shadow-2xs'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-medium text-slate-500 truncate">
                {card.label}
              </span>
              <span className={`w-2 h-2 rounded-full shrink-0 ${card.dotColor}`} />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {card.value}
            </div>
          </button>
        );
      })}
    </div>
  );
}
