import React, { useEffect, useState } from 'react';
import { BileoAlertCircle, BileoRotateCcw, BileoSparkles } from '../icons';
import type { LiveSearchState } from '../../types';

export type NoticeTone = 'quiet' | 'info' | 'warning' | 'error';

type ErrorState = Extract<LiveSearchState, { status: 'error' }>;

export interface NoticeAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface SearchStateNoticeProps {
  tone?: NoticeTone;
  title: string;
  message?: string;
  /** Small technical line under the message (e.g. the server error code). */
  detail?: string;
  action?: NoticeAction;
  /** Seconds the action stays disabled (from Retry-After); counts down client-side. */
  retryAfterSeconds?: number;
  /**
   * Whether the card is its own live region (role="alert" / role="status"). Pass false when the
   * parent already wraps it in an aria-live container, so screen readers announce it once.
   */
  announce?: boolean;
  children?: React.ReactNode;
}

export interface ErrorNoticeContext {
  fromCity: string;
  toCity: string;
}

const ERROR_TITLE = 'Canlı veri alınamadı';

/** Turkish copy for a failed live search, keyed by the server's errorCode. */
export function errorNoticeCopy(state: ErrorState, ctx: ErrorNoticeContext): { title: string; message: string } {
  const from = ctx.fromCity || state.query?.from || 'kalkış';
  const to = ctx.toCity || state.query?.to || 'varış';
  switch (state.errorCode) {
    case 'blocked': {
      const wait =
        typeof state.retryAfterSeconds === 'number' && state.retryAfterSeconds > 0
          ? `${state.retryAfterSeconds} sn sonra tekrar deneyin.`
          : 'Birkaç dakika sonra tekrar deneyin.';
      return { title: ERROR_TITLE, message: `Turna.com erişimi şu an engelli. ${wait}` };
    }
    case 'route_not_found':
      return {
        title: ERROR_TITLE,
        message: `Turna.com ${from} ile ${to} arasında bu rota için sayfa yayımlamıyor. Şehir adlarını kontrol edin.`,
      };
    case 'no_structured_data':
      return { title: ERROR_TITLE, message: 'Turna sayfası alındı ancak yapısal veri içermiyor.' };
    case 'upstream_unavailable':
      return { title: ERROR_TITLE, message: 'Turna.com yanıt vermedi. Tekrar deneyin.' };
    case 'rate_limited':
      return { title: ERROR_TITLE, message: 'Çok sık istek. Birkaç saniye bekleyin.' };
    case 'robots_disallowed':
      return { title: ERROR_TITLE, message: 'Bu sayfa turna.com robots.txt tarafından kapalı; okunmadı.' };
    case 'invalid_query':
    case 'invalid_json':
      return { title: 'Arama geçersiz', message: state.message || 'Arama parametreleri kabul edilmedi.' };
    case 'network':
      return { title: 'Bağlantı kurulamadı', message: state.message || 'Sunucuya ulaşılamadı; bağlantınızı kontrol edin.' };
    case 'aborted':
      return { title: 'Arama iptal edildi', message: 'Yeni bir arama başlatıldı veya sayfa kapatıldı.' };
    case 'invalid_response':
      return { title: ERROR_TITLE, message: state.message || 'Turna yanıtı doğrulanamadı.' };
    default:
      return {
        title: ERROR_TITLE,
        message: state.message || 'Beklenmeyen bir hata oluştu. Tekrar deneyin.',
      };
  }
}

/**
 * Colour lives on the icon, not on the circle: src/index.css forces `color` on `.bg-cream-*`
 * containers in dark mode with !important, which would swallow a `dark:text-*` pair on the box.
 */
const TONE_CLASS: Record<NoticeTone, { box: string; icon: string }> = {
  quiet: { box: 'bg-cream-100', icon: 'text-charcoal-muted' },
  info: { box: 'bg-cream-100', icon: 'text-bordeaux-700 dark:text-bordeaux-300' },
  warning: { box: 'bg-amber-50 dark:bg-amber-950/40', icon: 'text-amber-800 dark:text-amber-300' },
  error: { box: 'bg-rose-50 dark:bg-rose-950/40', icon: 'text-rose-800 dark:text-rose-300' },
};

/**
 * One honest state card for the results section (idle, unsupported, facts-only, error).
 * The optional action is a plain button; when `retryAfterSeconds` is given it stays disabled
 * until the countdown reaches zero.
 */
export const SearchStateNotice: React.FC<SearchStateNoticeProps> = ({
  tone = 'quiet',
  title,
  message,
  detail,
  action,
  retryAfterSeconds,
  announce = true,
  children,
}) => {
  const initialWait = typeof retryAfterSeconds === 'number' && retryAfterSeconds > 0 ? Math.ceil(retryAfterSeconds) : 0;
  const [remaining, setRemaining] = useState(initialWait);

  useEffect(() => {
    setRemaining(initialWait);
    if (initialWait <= 0) return undefined;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [initialWait]);

  const Icon = tone === 'error' || tone === 'warning' ? BileoAlertCircle : BileoSparkles;
  const actionDisabled = Boolean(action?.disabled) || remaining > 0;
  const actionLabel = action ? (remaining > 0 ? `${action.label} (${remaining} sn)` : action.label) : '';

  return (
    <div
      role={announce ? (tone === 'error' ? 'alert' : 'status') : undefined}
      className="bg-white rounded-3xl p-10 text-center border border-[#E8E1D5] space-y-4 shadow-soft"
    >
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${TONE_CLASS[tone].box}`}>
        <Icon className={`w-7 h-7 ${TONE_CLASS[tone].icon}`} />
      </div>
      <div className="text-lg font-black text-[#1E1B18] font-display">{title}</div>
      {message && <p className="text-xs text-charcoal-muted max-w-md mx-auto leading-relaxed">{message}</p>}
      {detail && <p className="text-[10px] text-charcoal-muted tabular-nums">{detail}</p>}
      {children}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          disabled={actionDisabled}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 mx-auto transition-colors ${
            actionDisabled
              ? 'bg-cream-200 text-charcoal-muted cursor-not-allowed'
              : 'bg-bordeaux-700 hover:bg-bordeaux-800 text-white shadow-bordeaux cursor-pointer'
          }`}
        >
          <BileoRotateCcw className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
