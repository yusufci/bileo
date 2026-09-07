import React, { useId } from 'react';
import { BileoChevronRight, BileoExternalLink, BileoFerry, BileoRotateCcw } from '../icons';
import type { RouteFacts, TurnaSuccess } from '../../lib/turna/types';
import { formatTrClock } from '../../lib/turna/format';

export interface FerryFactsPanelProps {
  result: TurnaSuccess;
  onRefresh?: () => void;
  refreshDisabled?: boolean;
  refreshTitle?: string;
}

interface FactRow {
  label: string;
  value: string;
}

/** Label/value rows for the facts block; rows the page does not publish are left out. */
export function ferryFactRows(facts: RouteFacts): FactRow[] {
  const rows: FactRow[] = [];
  if (facts.carriersCount != null) rows.push({ label: 'Firma sayısı', value: String(facts.carriersCount) });
  if (facts.popularCarriers.length > 0) rows.push({ label: 'Firmalar', value: facts.popularCarriers.join(', ') });
  if (facts.departureHubs.length > 0) rows.push({ label: 'Kalkış noktaları', value: facts.departureHubs.join(', ') });
  if (facts.arrivalHubs.length > 0) rows.push({ label: 'Varış noktaları', value: facts.arrivalHubs.join(', ') });
  if (facts.shortestDurationLabel) rows.push({ label: 'En kısa süre', value: facts.shortestDurationLabel });
  if (facts.tripsPerDay != null) rows.push({ label: 'Sefer sıklığı', value: `Günde ${facts.tripsPerDay} sefer` });
  else if (facts.tripsPerWeek != null) rows.push({ label: 'Sefer sıklığı', value: `Haftada ${facts.tripsPerWeek} sefer` });
  if (facts.cheapestWeekday) rows.push({ label: 'En ucuz gün', value: facts.cheapestWeekday });
  return rows;
}

/**
 * Facts-only panel for ferry routes: the Turna ferry landing page publishes route facts and an
 * FAQ but no structured ticket list, so nothing here pretends to be a timetable.
 */
export const FerryFactsPanel: React.FC<FerryFactsPanelProps> = ({ result, onRefresh, refreshDisabled = false, refreshTitle }) => {
  const headingId = useId();
  const rows = ferryFactRows(result.facts);
  const faq = result.facts.faq;
  const clock = formatTrClock(result.scrapedAt);
  const viaLabel = result.fetchedVia === 'cache' ? 'Önbellekten' : 'Canlı alındı';

  return (
    <section
      aria-labelledby={headingId}
      className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E1D5] shadow-soft space-y-5"
    >
      <header className="flex items-start gap-3">
        {/* Accent on the icon itself: index.css forces `color` on .bg-cream-100 in dark mode. */}
        <div className="w-10 h-10 rounded-full bg-cream-100 flex items-center justify-center shrink-0">
          <BileoFerry className="w-5 h-5 text-bordeaux-700 dark:text-bordeaux-300" />
        </div>
        <div>
          <h3 id={headingId} className="text-lg font-black text-[#1E1B18] font-display">
            Turna feribot sayfası bilet listesi yayımlamaz
          </h3>
          <p className="text-xs text-charcoal-muted mt-1 leading-relaxed">
            Bu rota için Turna.com yalnızca rota bilgisi ve sık sorulan soruları yayımlar; sefer saatleri ve fiyatlar sayfada yapısal olarak yer almaz.
          </p>
        </div>
      </header>

      {rows.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col">
              <dt className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">{row.label}</dt>
              <dd className="text-sm font-bold text-charcoal">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {faq.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-extrabold text-charcoal-muted uppercase tracking-wider">Sık sorulan sorular</h4>
          {faq.map((item, i) => (
            <details
              key={`${i}-${item.question}`}
              className="group rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] px-4 py-3"
            >
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm font-bold text-charcoal">
                <span>{item.question}</span>
                <BileoChevronRight className="w-4 h-4 shrink-0 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-2 text-xs text-charcoal-muted leading-relaxed whitespace-pre-line">{item.answer}</p>
            </details>
          ))}
        </div>
      )}

      {result.warnings.length > 0 && (
        <ul className="text-[11px] text-charcoal-muted list-disc list-inside space-y-0.5">
          {result.warnings.map((warning, i) => (
            <li key={`${i}-${warning}`}>{warning}</li>
          ))}
        </ul>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-charcoal-muted">
        <span className="tabular-nums" title={result.scrapedAt}>
          {clock ? `${viaLabel} ${clock}` : viaLabel}
        </span>
        <div className="flex items-center gap-3">
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
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshDisabled}
              title={refreshTitle}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors ${
                refreshDisabled
                  ? 'bg-cream-200 text-charcoal-muted cursor-not-allowed'
                  : 'bg-cream-200 hover:bg-cream-300 text-charcoal cursor-pointer'
              }`}
            >
              <BileoRotateCcw className="w-3.5 h-3.5" />
              <span>Yenile</span>
            </button>
          )}
        </div>
      </footer>
    </section>
  );
};
