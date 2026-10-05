'use client';

import React from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { FollowUpStatus } from '@/types/lead';

interface LeadFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: FollowUpStatus | 'all';
  onStatusChange: (status: FollowUpStatus | 'all') => void;
  event: string;
  onEventChange: (event: string) => void;
  availableEvents: string[];
  totalResults: number;
}

export function LeadFiltersBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  event,
  onEventChange,
  availableEvents,
  totalResults,
}: LeadFiltersBarProps) {
  const hasActiveFilters = Boolean(search || (status && status !== 'all') || (event && event !== 'all'));

  const handleClear = () => {
    onSearchChange('');
    onStatusChange('all');
    onEventChange('all');
  };

  const statusOptions: { value: FollowUpStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200/90 p-3 sm:p-4 mb-6 shadow-2xs space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name, company, email or event..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Segmented Filter */}
          <div className="inline-flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs font-medium">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={status === opt.value}
                onClick={() => onStatusChange(opt.value)}
                className={`px-2 sm:px-2.5 py-1.5 sm:py-1 rounded transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 ${
                  status === opt.value
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Event Filter */}
          {availableEvents.length > 0 && (
            <div className="relative flex-1 sm:flex-initial min-w-[140px] max-w-full sm:max-w-[200px]">
              <select
                value={event}
                onChange={(e) => onEventChange(e.target.value)}
                aria-label="Filter by Event"
                className="w-full pl-2.5 pr-7 py-1.5 sm:py-1 text-xs font-medium bg-white border border-slate-300 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 appearance-none cursor-pointer truncate"
              >
                <option value="all">All Events ({availableEvents.length})</option>
                {availableEvents.map((evt) => (
                  <option key={evt} value={evt}>
                    {evt}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>
          )}

          {/* Reset Action */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 px-2 py-1.5 sm:py-1 rounded hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter hint row */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{totalResults}</strong> matching{' '}
            {totalResults === 1 ? 'lead' : 'leads'}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
