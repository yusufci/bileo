import React from 'react';
import type { SourceId } from '../../lib/sources/types';
import { SOURCE_LABELS } from '../../lib/sources/types';

export interface SourceBadgeProps {
  source: SourceId;
  /** When given, the badge links to the landing page the row was read from. */
  href?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Attribution chip printed next to every multi-source row: which site published the figure. Text only,
 * no dot, no colour scale; the single accent is reserved for the link state.
 */
export const SourceBadge: React.FC<SourceBadgeProps> = ({ source, href, size = 'sm', className = '' }) => {
  const label = SOURCE_LABELS[source];
  const base = `inline-flex items-center rounded-lg border border-[#E8E1D5] bg-cream-200 font-bold text-charcoal ${
    size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
  } ${className}`;
  if (href && /^https:\/\//.test(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-source-badge={source}
        title={`Kaynak: ${label}`}
        className={`${base} hover:border-bordeaux-700 hover:text-bordeaux-700 transition-colors`}
      >
        {label}
        <span className="sr-only"> (yeni sekmede açılır)</span>
      </a>
    );
  }
  return (
    <span data-source-badge={source} title={`Kaynak: ${label}`} className={base}>
      {label}
    </span>
  );
};
