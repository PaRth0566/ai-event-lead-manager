import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = 'Loading...', size = 'md' }: { message?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-2.5 text-slate-500">
      <Loader2 className={`${sizes[size]} animate-spin text-slate-800`} />
      {message && <p className="text-xs font-medium text-slate-600">{message}</p>}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100 animate-pulse">
      <td className="py-3 px-4">
        <div className="h-3.5 bg-slate-200 rounded w-28 mb-1.5" />
        <div className="h-3 bg-slate-100 rounded w-20" />
      </td>
      <td className="py-3 px-4">
        <div className="h-3.5 bg-slate-200 rounded w-32" />
      </td>
      <td className="py-3 px-4">
        <div className="h-3.5 bg-slate-200 rounded w-24" />
      </td>
      <td className="py-3 px-3">
        <div className="h-5 bg-slate-200 rounded w-16" />
      </td>
      <td className="py-3 px-3">
        <div className="h-3 bg-slate-100 rounded w-16" />
      </td>
      <td className="py-3 px-4 text-right">
        <div className="h-6 bg-slate-200 rounded w-16 ml-auto" />
      </td>
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-slate-200 rounded w-36" />
          <div className="h-3 bg-slate-100 rounded w-28" />
        </div>
        <div className="h-5 bg-slate-200 rounded w-16" />
      </div>
      <div className="space-y-1.5 pt-1">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-3/4" />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
        <div className="h-3 bg-slate-100 rounded w-20" />
        <div className="h-6 bg-slate-200 rounded w-16" />
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 space-y-2">
          <div className="h-3 bg-slate-200 rounded w-20" />
          <div className="h-7 bg-slate-200 rounded w-10" />
        </div>
      ))}
    </div>
  );
}
