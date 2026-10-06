import React from 'react';

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
        <div key={i} className="bg-white rounded-lg border border-slate-200/90 p-3 sm:p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-3 bg-slate-200 rounded w-20" />
            <div className="w-2 h-2 rounded-full bg-slate-200" />
          </div>
          <div className="h-7 bg-slate-200 rounded w-12" />
          <div className="h-2.5 bg-slate-100 rounded w-24" />
        </div>
      ))}
    </div>
  );
}
