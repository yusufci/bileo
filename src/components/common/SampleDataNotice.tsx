import React from 'react';
import { BileoAlertCircle } from '../icons';

/** One sentence, reused by every guide screen that renders static sample data instead of a live feed. */
export const SAMPLE_DATA_NOTICE =
  'Bu ekrandaki veriler temsili örneklerdir; canlı bir kaynağa bağlı değildir ve gerçek sefer, yol, hava veya doluluk durumunu yansıtmaz.';

interface SampleDataNoticeProps {
  className?: string;
  /** Optional extra sentence, e.g. where the real data lives. */
  children?: React.ReactNode;
}

/**
 * Honesty strip for guide modals whose tables, clocks and counters are hand-written samples. Placed right
 * under the modal header so it is read before any number on the screen. Never rendered on screens that
 * show live Turna data (those carry the ProvenanceStrip instead).
 */
export const SampleDataNotice: React.FC<SampleDataNoticeProps> = ({ className = '', children }) => (
  <div
    role="note"
    data-sample-data-notice
    className={`mx-6 mt-4 p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-start gap-2.5 ${className}`}
  >
    <BileoAlertCircle className="w-4 h-4 text-bordeaux-700 shrink-0 mt-0.5" />
    <p className="text-xs text-charcoal-muted leading-relaxed">
      {SAMPLE_DATA_NOTICE}
      {children ? <> {children}</> : null}
    </p>
  </div>
);
