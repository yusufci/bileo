import React, { useState } from 'react';
import { BileoClose, BileoMail, BileoTag, BileoCheckCircle } from './icons';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromCity: string;
  toCity: string;
  currentMinPrice: number;
  onShowToast: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo', duration?: number) => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  fromCity,
  toCity,
  currentMinPrice,
  onShowToast,
}) => {
  const [email, setEmail] = useState('');
  const [targetPrice, setTargetPrice] = useState(Math.round(currentMinPrice * 0.85));
  const [isSubscribed, setIsSubscribed] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      onShowToast('Geçersiz E-posta', 'Lütfen bildirim almak için geçerli bir e-posta giriniz.', 'error');
      return;
    }

    setIsSubscribed(true);
    onShowToast(
      'Fiyat Alarmı Kuruldu!',
      `${fromCity} → ${toCity} seferlerinde fiyat ${targetPrice} TL altına düştüğünde ${email} adresine bildirim gönderilecek.`,
      'success',
      6000
    );

    setTimeout(() => {
      setIsSubscribed(false);
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#E8E1D5]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <BileoTag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#1E1B18] font-display">Fiyat Takibi & İndirim Alarmı</h3>
              <p className="text-xs text-charcoal-muted font-medium">Fiyat düşünce anında haberin olsun</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isSubscribed ? (
            <div className="text-center py-6 space-y-3 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <BileoCheckCircle className="w-8 h-8" />
              </div>
              <div className="text-base font-black text-[#1E1B18] font-display">Alarm Başarıyla Kuruldu</div>
              <p className="text-xs text-charcoal-muted max-w-xs mx-auto">
                {fromCity} → {toCity} hattındaki indirim ve erken rezervasyon fırsatları e-postanıza iletilecektir.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-[#E8E1D5] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-charcoal-muted">Güzergah:</span>
                  <span className="text-bordeaux-700 font-extrabold">{fromCity} → {toCity}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-charcoal-muted">Mevcut En Düşük Fiyat:</span>
                  <span className="text-charcoal font-black">{currentMinPrice} TL</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-charcoal uppercase tracking-wider mb-1.5">
                  E-Posta Adresiniz *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@eposta.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E1D5] bg-white text-xs font-bold text-[#1E1B18] focus:outline-none focus:border-bordeaux-700"
                  />
                  <BileoMail className="w-4 h-4 text-charcoal-muted absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-extrabold text-charcoal uppercase tracking-wider">
                    Hedef Fiyat Limiti
                  </label>
                  <span className="text-xs font-black text-bordeaux-700">{targetPrice} TL</span>
                </div>
                <input
                  type="range"
                  min={Math.round(currentMinPrice * 0.5)}
                  max={currentMinPrice}
                  step={10}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="w-full accent-bordeaux-700 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-charcoal-muted mt-1 font-bold">
                  <span>{Math.round(currentMinPrice * 0.5)} TL</span>
                  <span>{currentMinPrice} TL</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white text-xs font-extrabold shadow-bordeaux transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <BileoTag className="w-4 h-4" />
                <span>Fiyat Alarmını Başlat</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
