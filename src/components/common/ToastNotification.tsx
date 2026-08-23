import React, { useEffect } from 'react';
import { BileoCheckCircle, BileoAlertCircle, BileoClose, BileoSparkles } from '../icons';

export type ToastType = 'success' | 'error' | 'info' | 'promo';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    toasts.forEach((toast) => {
      const duration = toast.duration || 4000;
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, duration);
      return () => clearTimeout(timer);
    });
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-[#E8E1D5]';
        let bgClass = 'bg-white';
        let icon = <BileoCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />;

        if (toast.type === 'success') {
          borderClass = 'border-emerald-200';
          bgClass = 'bg-white';
          icon = <BileoCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />;
        } else if (toast.type === 'error') {
          borderClass = 'border-rose-200';
          bgClass = 'bg-white';
          icon = <BileoAlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
        } else if (toast.type === 'promo') {
          borderClass = 'border-bordeaux-200';
          bgClass = 'bg-[#FAF7F2]';
          icon = <BileoSparkles className="w-5 h-5 text-bordeaux-700 shrink-0" />;
        } else {
          borderClass = 'border-[#E8E1D5]';
          bgClass = 'bg-white';
          icon = <BileoAlertCircle className="w-5 h-5 text-charcoal shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-soft-lg border ${borderClass} ${bgClass} transition-all duration-300 transform translate-y-0 animate-fadeIn`}
            role="alert"
          >
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-[#1E1B18] font-display">{toast.title}</div>
              {toast.description && (
                <div className="text-[11px] text-charcoal-muted mt-0.5 font-medium leading-relaxed">
                  {toast.description}
                </div>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-charcoal-muted hover:text-charcoal p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
              title="Kapat"
            >
              <BileoClose className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
