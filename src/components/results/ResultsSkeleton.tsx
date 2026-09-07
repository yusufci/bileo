import React from 'react';

export interface ResultsSkeletonProps {
  /**
   * Whether the skeleton is its own live region (role="status"). Pass false when the parent
   * already wraps it in an aria-live container with aria-busy, so it is not announced twice.
   */
  announce?: boolean;
}

/**
 * Loading placeholder for the results section: a provenance-strip shell and three card shells
 * that mirror the real card grid. It carries no copy that claims anything about the outcome.
 */
export const ResultsSkeleton: React.FC<ResultsSkeletonProps> = ({ announce = true }) => (
  <div role={announce ? 'status' : undefined} aria-label="Teklifler yükleniyor" className="space-y-4">
    <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-center justify-between gap-3">
      <div className="space-y-2">
        <div className="h-4 w-32 rounded-md bg-cream-200 animate-pulse" />
        <div className="h-3 w-48 rounded-md bg-cream-200 animate-pulse" />
      </div>
      <div className="h-8 w-20 rounded-xl bg-cream-200 animate-pulse" />
    </div>

    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white rounded-3xl p-6 border border-[#FAF7F2] shadow-soft">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-3 space-y-2">
            <div className="h-8 w-28 rounded-md bg-cream-200 animate-pulse" />
            <div className="h-4 w-24 rounded-md bg-cream-200 animate-pulse" />
          </div>
          <div className="lg:col-span-6 flex items-center gap-4">
            <div className="h-7 w-16 rounded-md bg-cream-200 animate-pulse" />
            <div className="flex-1 h-[1px] bg-[#E8E1D5]" />
            <div className="h-7 w-16 rounded-md bg-cream-200 animate-pulse" />
          </div>
          <div className="lg:col-span-3 flex lg:flex-col items-center lg:items-end justify-between gap-3">
            <div className="h-7 w-24 rounded-md bg-cream-200 animate-pulse" />
            <div className="h-[46px] w-28 rounded-2xl bg-cream-200 animate-pulse" />
          </div>
        </div>
      </div>
    ))}
    <span className="sr-only">Yükleniyor</span>
  </div>
);
