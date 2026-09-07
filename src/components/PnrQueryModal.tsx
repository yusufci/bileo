import React, { useState } from 'react';
import { useDialogFocus } from '../lib/useDialogFocus';
import {
  BileoSearch,
  BileoTicket,
  BileoClose,
  BileoPrinter,
  BileoRotateCcw,
  BileoCopy,
  BileoCheck,
  BileoShieldCheck,
  BileoAlertCircle,
  BileoArrowRight,
} from './icons';
import { BookingTicket } from '../types';
import { CompanyLogo } from './CompanyLogo';

interface PnrQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: BookingTicket[];
  onOpenRefund: (ticket: BookingTicket) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo') => void;
}

export const PnrQueryModal: React.FC<PnrQueryModalProps> = ({
  isOpen,
  onClose,
  tickets,
  onOpenRefund,
  onShowToast,
}) => {
  const [pnrInput, setPnrInput] = useState('');
  const [surnameInput, setSurnameInput] = useState('');
  const [searchedTicket, setSearchedTicket] = useState<BookingTicket | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const dialogRef = useDialogFocus<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPnr = pnrInput.trim().toUpperCase();
    if (!cleanPnr) {
      onShowToast('PNR Kodu Gereklidir', 'Lütfen geçerli bir PNR kodu giriniz.', 'error');
      return;
    }

    setHasSearched(true);

    const found = tickets.find((t) => {
      const pnrMatch = t.pnr.toUpperCase().replace(/\s+/g, '') === cleanPnr.replace(/\s+/g, '');
      if (!pnrMatch) return false;
      if (surnameInput.trim()) {
        const sMatch = t.passengers.some((p) =>
          p.lastName.toLowerCase().includes(surnameInput.trim().toLowerCase())
        );
        return sMatch;
      }
      return true;
    });

    if (found) {
      setSearchedTicket(found);
      onShowToast('Bilet Bulundu', `${found.pnr} bilet detayları yüklendi.`, 'success');
    } else {
      setSearchedTicket(null);
    }
  };

  const handleQuickFill = (demoPnr: string) => {
    setPnrInput(demoPnr);
    const found = tickets.find((t) => t.pnr === demoPnr);
    if (found) {
      setSurnameInput(found.passengers[0]?.lastName || '');
    }
  };

  const handleCopy = (pnr: string) => {
    navigator.clipboard.writeText(pnr);
    setCopied(true);
    onShowToast('Kopyalandı', `PNR ${pnr} panoya kopyalandı.`, 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pnr-query-title"
    >
      <div ref={dialogRef} tabIndex={-1} className="bg-[#FAF7F2] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh] outline-none">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-bordeaux-50 flex items-center justify-center text-bordeaux-700">
              <BileoTicket className="w-5 h-5" />
            </div>
            <div>
              <h2 id="pnr-query-title" className="text-base sm:text-lg font-black text-[#1E1B18] font-display tracking-tight">
                PNR ile Bilet Sorgulama & İade Portalı
              </h2>
              <p className="text-xs text-charcoal-muted font-medium">
                Biletinizi görüntüleyin, yazdırın veya anında iptal/iade işlemi başlatın.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
            title="Kapat"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Query Form */}
          <form onSubmit={handleSearch} className="bg-white p-5 rounded-2xl border border-[#E8E1D5] shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold text-charcoal uppercase tracking-wider mb-1.5">
                  PNR Numarası *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={pnrInput}
                    onChange={(e) => setPnrInput(e.target.value.toUpperCase())}
                    placeholder="Örn: BL-89241"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E1D5] bg-[#FAF7F2] text-sm font-bold text-[#1E1B18] uppercase tracking-wider focus:outline-none focus:border-bordeaux-700 focus:bg-white transition-colors"
                  />
                  <BileoTicket className="w-4 h-4 text-charcoal-muted absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-charcoal uppercase tracking-wider mb-1.5">
                  Yolcu Soyadı (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={surnameInput}
                  onChange={(e) => setSurnameInput(e.target.value)}
                  placeholder="Örn: Yılmaz"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E1D5] bg-[#FAF7F2] text-sm font-medium text-[#1E1B18] focus:outline-none focus:border-bordeaux-700 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Quick Demo Helper */}
            {tickets.length > 0 && (
              <div className="flex items-center flex-wrap gap-2 pt-1">
                <span className="text-[10px] font-extrabold text-charcoal-muted uppercase">Kayıtlı Biletleriniz:</span>
                {tickets.slice(0, 3).map((t) => (
                  <button
                    key={t.pnr}
                    type="button"
                    onClick={() => handleQuickFill(t.pnr)}
                    className="px-2 py-0.5 rounded-md bg-cream-100 hover:bg-bordeaux-50 hover:text-bordeaux-700 text-[11px] font-bold text-charcoal border border-[#E8E1D5] transition-colors cursor-pointer"
                  >
                    {t.pnr} ({t.route.from} → {t.route.to})
                  </button>
                ))}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white text-xs font-extrabold shadow-bordeaux flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <BileoSearch className="w-4 h-4" />
              <span>Bileti Sorgula</span>
            </button>
          </form>

          {/* Results Area */}
          {hasSearched && (
            <div>
              {searchedTicket ? (
                <div className="bg-white rounded-2xl border border-[#E8E1D5] p-5 shadow-soft-sm space-y-4 animate-fadeIn">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D5]">
                    <div className="flex items-center gap-2.5">
                      <CompanyLogo company={searchedTicket.route.company} size="sm" />
                      <div>
                        <div className="text-xs font-black text-[#1E1B18] font-display">
                          {searchedTicket.route.company}
                        </div>
                        <div className="text-[11px] text-charcoal-muted font-medium">
                          {searchedTicket.route.date} • {searchedTicket.route.departureTime}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          searchedTicket.status === 'refunded'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {searchedTicket.status === 'refunded' ? 'İade Edildi' : 'Onaylı & Aktif'}
                      </span>
                    </div>
                  </div>

                  {/* Route & Times */}
                  <div className="grid grid-cols-3 gap-2 text-center py-2 bg-[#FAF7F2] rounded-xl p-3">
                    <div>
                      <div className="text-sm font-black text-[#1E1B18] font-display">
                        {searchedTicket.route.departureTime}
                      </div>
                      <div className="text-xs font-bold text-charcoal">{searchedTicket.route.from}</div>
                      <div className="text-[10px] text-charcoal-muted truncate">{searchedTicket.route.fromTerminal}</div>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-[10px] font-extrabold text-bordeaux-700">{searchedTicket.route.duration}</div>
                      <div className="w-full flex items-center gap-1 my-1">
                        <div className="h-[2px] flex-1 bg-bordeaux-200" />
                        <BileoArrowRight className="w-3 h-3 text-bordeaux-700 shrink-0" />
                        <div className="h-[2px] flex-1 bg-bordeaux-200" />
                      </div>
                      <div className="text-[9px] text-emerald-700 font-bold">Direkt Sefer</div>
                    </div>
                    <div>
                      <div className="text-sm font-black text-[#1E1B18] font-display">
                        {searchedTicket.route.arrivalTime}
                      </div>
                      <div className="text-xs font-bold text-charcoal">{searchedTicket.route.to}</div>
                      <div className="text-[10px] text-charcoal-muted truncate">{searchedTicket.route.toTerminal}</div>
                    </div>
                  </div>

                  {/* Passenger & Seats Info */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-extrabold text-charcoal-muted uppercase">Yolcu ve Koltuk Bilgileri</div>
                    <div className="space-y-1.5">
                      {searchedTicket.passengers.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] text-xs"
                        >
                          <div className="font-bold text-[#1E1B18]">
                            {p.firstName} {p.lastName}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-white border border-[#E8E1D5] font-black text-bordeaux-700 text-[11px]">
                              Koltuk {p.seatNumber}
                            </span>
                            <span className="text-[11px] text-charcoal-muted">
                              {p.gender === 'female' ? 'Kadın' : 'Erkek'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E8E1D5]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(searchedTicket.pnr)}
                        className="px-3 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#E8E1D5] text-xs font-bold text-charcoal flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copied ? <BileoCheck className="w-3.5 h-3.5 text-emerald-600" /> : <BileoCopy className="w-3.5 h-3.5" />}
                        <span>{searchedTicket.pnr}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePrint}
                        className="px-3 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#E8E1D5] text-xs font-bold text-charcoal flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <BileoPrinter className="w-3.5 h-3.5" />
                        <span>Bileti Yazdır</span>
                      </button>
                    </div>

                    {searchedTicket.status !== 'refunded' && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenRefund(searchedTicket);
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <BileoRotateCcw className="w-3.5 h-3.5" />
                        <span>İptal / İade Talebi Başlat</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-rose-200 p-6 text-center space-y-2 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                    <BileoAlertCircle className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-black text-[#1E1B18] font-display">Bilet Bulunamadı</div>
                  <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
                    Girdiğiniz PNR kodu ({pnrInput}) ile eşleşen bir bilet kaydı bulunamadı. Lütfen PNR kodunuzu kontrol ediniz.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#E8E1D5] flex items-center justify-between text-xs text-charcoal-muted">
          <div className="flex items-center gap-2">
            <BileoShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">256-Bit SSL Korumalı Güvenli Bilet Sorgulama</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold text-bordeaux-700 hover:underline cursor-pointer"
          >
            Pencereyi Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
