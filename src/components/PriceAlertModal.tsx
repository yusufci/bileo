import React, { useState, useEffect } from 'react';
import { BileoClose, BileoTag, BileoCheckCircle } from './icons';
import { findPriceAlert, removePriceAlert, savePriceAlert } from '../lib/turna/alerts';
import type { PriceAlert } from '../lib/turna/alerts';
import { priceTL } from '../lib/turna/format';
import { useDialogFocus } from '../lib/useDialogFocus';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromCity: string;
  toCity: string;
  currentMinPrice: number;
  /** Route key of the live result the alert belongs to (`flight:istanbul-ankara`); null disables saving. */
  routeKey?: string | null;
  onShowToast: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo', duration?: number) => void;
}

/** What the alert can and cannot do, said plainly: browser-local, checked on the next search, no e-mail. */
export const PRICE_ALERT_DISCLOSURE =
  'Alarm yalnızca bu tarayıcıda saklanır. Aynı rotayı tekrar aradığınızda Turna sayfasındaki en düşük fiyat hedefinizin altındaysa burada bildirim gösteririz. E-posta veya SMS gönderilmez.';

export function priceAlertLabel(fromCity: string, toCity: string): string {
  return toCity ? `${fromCity} - ${toCity}` : fromCity;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  fromCity,
  toCity,
  currentMinPrice,
  routeKey = null,
  onShowToast,
}) => {
  const [targetPrice, setTargetPrice] = useState(Math.round(currentMinPrice * 0.85));
  const [saved, setSaved] = useState(false);
  const [existing, setExisting] = useState<PriceAlert | undefined>(undefined);
  const dialogRef = useDialogFocus<HTMLDivElement>(isOpen, onClose);

  // App keeps this modal mounted, so the useState initialiser runs once; re-derive the
  // default target and the stored alert whenever the modal opens or the live minimum changes.
  useEffect(() => {
    if (isOpen) {
      setTargetPrice(Math.round(currentMinPrice * 0.85));
      setExisting(findPriceAlert(routeKey));
      setSaved(false);
    }
  }, [isOpen, currentMinPrice, routeKey]);

  if (!isOpen) return null;

  const label = priceAlertLabel(fromCity, toCity);
  const canSave = Boolean(routeKey) && Number.isFinite(currentMinPrice) && currentMinPrice > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeKey || !canSave) {
      onShowToast('Alarm kurulamadı', 'Önce canlı bir arama yapın; alarm o rotanın gerçek fiyatına bağlanır.', 'error');
      return;
    }
    savePriceAlert({ routeKey, label, targetPrice, baselinePrice: currentMinPrice });
    setSaved(true);
    onShowToast('Fiyat alarmı kaydedildi', `${label}: en düşük fiyat ${priceTL(targetPrice)} veya altına inince bir sonraki aramada haber veririz.`, 'success', 6000);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 2200);
  };

  const handleRemove = () => {
    if (!routeKey) return;
    removePriceAlert(routeKey);
    setExisting(undefined);
    onShowToast('Fiyat alarmı kaldırıldı', `${label} için alarm silindi.`, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="price-alert-title">
      <div ref={dialogRef} tabIndex={-1} className="bg-[#FAF7F2] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#E8E1D5] outline-none">
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cream-200 flex items-center justify-center text-bordeaux-700">
              <BileoTag className="w-5 h-5" />
            </div>
            <div>
              <h3 id="price-alert-title" className="text-base font-black text-[#1E1B18] font-display">Fiyat Alarmı</h3>
              <p className="text-xs text-charcoal-muted font-medium">Hedef fiyatı bu tarayıcıda takip edin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {saved ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-cream-200 text-bordeaux-700 flex items-center justify-center mx-auto">
                <BileoCheckCircle className="w-8 h-8" />
              </div>
              <div className="text-base font-black text-[#1E1B18] font-display">Alarm Kaydedildi</div>
              <p className="text-xs text-charcoal-muted max-w-xs mx-auto">
                {label} için hedef {priceTL(targetPrice)}. Bir sonraki aramada gerçek en düşük fiyat bu değere inerse bildirim görürsünüz.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" aria-label="Fiyat alarmı">
              <div className="bg-white p-4 rounded-2xl border border-[#E8E1D5] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-charcoal-muted">Rota:</span>
                  <span className="text-bordeaux-700 font-extrabold">{label}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-charcoal-muted">Turna'daki en düşük fiyat:</span>
                  <span className="text-charcoal font-black tabular-nums">{priceTL(currentMinPrice)}</span>
                </div>
                {existing && (
                  <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-[#E8E1D5]">
                    <span className="text-charcoal-muted">Kayıtlı hedef:</span>
                    <span className="flex items-center gap-2">
                      <span className="text-charcoal font-black tabular-nums">{priceTL(existing.targetPrice)}</span>
                      <button type="button" onClick={handleRemove} className="text-bordeaux-700 hover:text-bordeaux-800 underline underline-offset-2 cursor-pointer">
                        Alarmı kaldır
                      </button>
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="price-alert-target" className="text-[11px] font-extrabold text-charcoal uppercase tracking-wider">
                    Hedef Fiyat
                  </label>
                  <span className="text-xs font-black text-bordeaux-700 tabular-nums">{priceTL(targetPrice)}</span>
                </div>
                <input
                  id="price-alert-target"
                  type="range"
                  min={Math.round(currentMinPrice * 0.5)}
                  max={Math.round(currentMinPrice)}
                  step={10}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="w-full accent-bordeaux-700 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-charcoal-muted mt-1 font-bold tabular-nums">
                  <span>{priceTL(Math.round(currentMinPrice * 0.5))}</span>
                  <span>{priceTL(Math.round(currentMinPrice))}</span>
                </div>
              </div>

              <p className="text-[11px] text-charcoal-muted leading-relaxed">{PRICE_ALERT_DISCLOSURE}</p>

              <button
                type="submit"
                disabled={!canSave}
                className={`w-full py-3 rounded-xl text-white text-xs font-extrabold transition-colors flex items-center justify-center gap-2 ${
                  canSave ? 'bg-bordeaux-700 hover:bg-bordeaux-800 shadow-bordeaux cursor-pointer' : 'bg-charcoal-muted cursor-not-allowed'
                }`}
              >
                <BileoTag className="w-4 h-4" />
                <span>{existing ? 'Hedefi Güncelle' : 'Alarmı Kaydet'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
