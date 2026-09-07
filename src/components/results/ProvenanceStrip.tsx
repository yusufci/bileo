import React, { useId, useState } from 'react';
import { BileoExternalLink, BileoRotateCcw } from '../icons';
import type { TurnaSuccess } from '../../lib/turna/types';
import { formatTrClock } from '../../lib/turna/format';

/** Always visible under the strip in the ok state; explains what a landing page actually lists. */
export const PROVENANCE_DISCLOSURE =
  'Bu liste Turna.com rota sayfasındaki yaklaşan tarihlerin en ucuz seferleridir; belirli bir güne ait tam sefer listesi değildir.';

/** A direct fetch older than this is shown with the amber (stale) dot. */
export const FRESH_WINDOW_MS = 10 * 60 * 1000;

export type FreshnessTone = 'live' | 'stale';

/** emerald when fetched directly less than 10 minutes ago, amber for cache hits or older data. */
export function freshnessTone(result: Pick<TurnaSuccess, 'fetchedVia' | 'scrapedAt'>, nowMs: number): FreshnessTone {
  if (result.fetchedVia === 'cache') return 'stale';
  const scraped = Date.parse(result.scrapedAt);
  if (Number.isNaN(scraped)) return 'stale';
  return nowMs - scraped < FRESH_WINDOW_MS ? 'live' : 'stale';
}

export interface ProvenanceStripProps {
  result: TurnaSuccess;
  /** Offers that survived validation and adaptation. */
  offerCount: number;
  /** Distinct departure dates (stats.byDay.length). */
  dayCount: number;
  /** Offers rejected by the guard or adapter; surfaced under Notlar. */
  droppedItems?: number;
  onRefresh?: () => void;
  refreshDisabled?: boolean;
  refreshTitle?: string;
  /** Injectable clock (ms since epoch) so tests render deterministically. */
  nowMs?: number;
  /** Set false when the surrounding panel carries its own explanation. */
  showDisclosure?: boolean;
  /** Replaces the default "{n} teklif, {d} tarih" counter, e.g. "50 otel" for city listings. */
  countLabel?: string;
}

/**
 * Source attribution for a live result: Turna.com wordmark, source link, absolute fetch clock,
 * counts, exactly one static semantic dot, optional refresh and a Notlar toggle for warnings.
 */
export const ProvenanceStrip: React.FC<ProvenanceStripProps> = ({
  result,
  offerCount,
  dayCount,
  droppedItems = 0,
  onRefresh,
  refreshDisabled = false,
  refreshTitle,
  nowMs,
  showDisclosure = true,
  countLabel,
}) => {
  const [notesOpen, setNotesOpen] = useState(false);
  const notesId = useId();
  const tone = freshnessTone(result, nowMs ?? Date.now());
  const clock = formatTrClock(result.scrapedAt);
  const viaLabel = result.fetchedVia === 'cache' ? 'Önbellekten' : 'Canlı alındı';
  const notesCount = result.warnings.length + (droppedItems > 0 ? 1 : 0);

  return (
    <div className="space-y-2">
      <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span
            aria-hidden="true"
            className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${tone === 'live' ? 'bg-emerald-500' : 'bg-amber-500'}`}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
              <span className="font-black text-charcoal">Turna.com</span>
              <a
                href={result.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-bordeaux-700 dark:text-bordeaux-300 hover:text-bordeaux-800 underline-offset-2 hover:underline"
              >
                <span>Kaynak sayfa</span>
                <BileoExternalLink className="w-3.5 h-3.5" />
                <span className="sr-only"> (yeni sekmede açılır)</span>
              </a>
            </div>
            <p className="text-[11px] text-charcoal-muted tabular-nums" title={result.scrapedAt}>
              <span>{clock ? `${viaLabel} ${clock}` : viaLabel}</span>
              <span aria-hidden="true"> · </span>
              <span>{countLabel ?? (dayCount > 0 ? `${offerCount} teklif, ${dayCount} tarih` : `${offerCount} teklif`)}</span>
            </p>
            <span className="sr-only">
              {tone === 'live' ? 'Veri son 10 dakika içinde doğrudan alındı.' : 'Veri önbellekten veya 10 dakikadan eski.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {notesCount > 0 && (
            <button
              type="button"
              aria-expanded={notesOpen}
              aria-controls={notesId}
              onClick={() => setNotesOpen((v) => !v)}
              className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-cream-200 hover:bg-cream-300 text-charcoal transition-colors cursor-pointer"
            >
              Notlar ({notesCount})
            </button>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshDisabled}
              title={refreshTitle}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 border ${
                refreshDisabled
                  ? 'bg-cream-200 text-charcoal-muted border-[#E8E1D5] cursor-not-allowed'
                  : 'bg-bordeaux-700 hover:bg-bordeaux-800 text-white border-bordeaux-800 cursor-pointer'
              }`}
            >
              <BileoRotateCcw className="w-3.5 h-3.5" />
              <span>Yenile</span>
            </button>
          )}
        </div>
      </div>

      {notesCount > 0 && notesOpen && (
        <ul id={notesId} className="px-3.5 text-[11px] text-charcoal-muted list-disc list-inside space-y-0.5">
          {result.warnings.map((warning, i) => (
            <li key={`${i}-${warning}`}>{warning}</li>
          ))}
          {droppedItems > 0 && <li>{droppedItems} teklif doğrulanamadı</li>}
        </ul>
      )}

      {showDisclosure && <p className="px-1 text-[11px] text-charcoal-muted">{PROVENANCE_DISCLOSURE}</p>}
    </div>
  );
};
