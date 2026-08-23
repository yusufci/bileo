import React, { useState, useEffect } from 'react';
import {
  BileoClose,
  BileoRotateCcw,
  BileoCheckCircle,
  BileoArrowRight
} from './icons';
import { BookingTicket, RefundDetails } from '../types';
import { CompanyLogo } from './CompanyLogo';

interface RefundModalProps {
  ticket: BookingTicket;
  onClose: () => void;
  onConfirmRefund: (pnr: string, refundDetails: RefundDetails) => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  ticket,
  onClose,
  onConfirmRefund,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [refundReceipt, setRefundReceipt] = useState<RefundDetails | null>(null);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleProcessRefund = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const receiptId = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      const details: RefundDetails = {
        refundedAmount: ticket.totalPrice,
        refundDate: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
        receiptId,
        reason: 'Bileo Koşulsuz Kesintisiz İade Güvencesi',
        deductionAmount: 0,
        originalAmount: ticket.totalPrice,
      };

      setRefundReceipt(details);
      setIsProcessing(false);
      setIsCompleted(true);
      onConfirmRefund(ticket.pnr, details);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-6 select-none animate-fadeIn">
        
        {/* Grounded Signature Bordeaux Header */}
        <div className="bg-bordeaux-700 text-white px-6 py-4.5 flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black font-display tracking-tight text-white">
              Bilet İade Onayı
            </h3>
            <p className="text-xs text-white/80 font-mono mt-0.5">
              PNR: {ticket.pnr}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Kapat"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {!isCompleted ? (
            <>
              {/* Trip Summary Card */}
              <div className="bg-[#FAF7F2] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <CompanyLogo
                    company={ticket.route.company}
                    transportType={ticket.route.transportType}
                    size="sm"
                  />
                  <span className="text-xs font-bold text-charcoal-muted">
                    {ticket.seats.map((s) => typeof s === 'object' ? `Koltuk ${s.number}` : `Koltuk ${s}`).join(', ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-base font-black text-[#1E1B18] font-display">
                  <span>{ticket.route.from}</span>
                  <BileoArrowRight className="w-4 h-4 text-bordeaux-700 flex-shrink-0" />
                  <span>{ticket.route.to}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-charcoal-muted">
                  <span>{ticket.route.date} • {ticket.route.departureTime}</span>
                  <span className="font-bold text-charcoal">
                    {ticket.passengers.map((p) => `${p.firstName} ${p.lastName}`).join(', ')}
                  </span>
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-charcoal-muted">
                  <span>Ödenen Bilet Tutarı</span>
                  <span className="font-bold text-charcoal">
                    {ticket.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                  </span>
                </div>

                <div className="flex items-center justify-between text-charcoal-muted">
                  <span>Bileo Hizmet Kesintisi</span>
                  <span className="font-medium text-charcoal">0,00 TL</span>
                </div>

                <div className="pt-2 flex items-baseline justify-between">
                  <span className="text-sm font-black text-[#1E1B18] font-display">
                    İade Edilecek Tutar
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-bordeaux-700 font-display">
                      {ticket.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-black text-bordeaux-700 font-display">TL</span>
                  </div>
                </div>
              </div>

              {/* Helper Notice */}
              <p className="text-[11px] text-charcoal-muted/80 leading-relaxed font-medium">
                İade tutarı, bilet alımında kullandığınız kartınıza bankanıza bağlı olarak 1-3 iş günü içinde eksiksiz aktarılacaktır.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="text-charcoal-muted hover:text-charcoal text-xs font-bold transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>

                <button
                  type="button"
                  onClick={handleProcessRefund}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isProcessing ? (
                    <>
                      <BileoRotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>İşleniyor...</span>
                    </>
                  ) : (
                    <>
                      <span>İadeyi Tamamla</span>
                      <BileoArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Completed Receipt State */
            <div className="text-center space-y-5 py-2">
              <div className="w-12 h-12 rounded-full bg-cream-100 text-bordeaux-700 flex items-center justify-center mx-auto">
                <BileoCheckCircle className="w-7 h-7 text-emerald-600" />
              </div>

              <div>
                <h4 className="text-xl font-black text-[#1E1B18] font-display">
                  İade Talebiniz Onaylandı
                </h4>
                <p className="text-xs text-charcoal-muted mt-1">
                  Biletiniz iptal edildi ve ücret iadesi bankanıza aktarıldı.
                </p>
              </div>

              {refundReceipt && (
                <div className="p-4 rounded-2xl bg-[#FAF7F2] text-xs space-y-2 text-left">
                  <div className="flex justify-between text-charcoal-muted">
                    <span>İade Dekont No:</span>
                    <span className="font-mono font-bold text-charcoal">{refundReceipt.receiptId}</span>
                  </div>
                  <div className="flex justify-between text-charcoal-muted">
                    <span>İade Edilen Tutar:</span>
                    <span className="font-black text-bordeaux-700 text-sm">
                      {refundReceipt.refundedAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                    </span>
                  </div>
                  <div className="flex justify-between text-charcoal-muted">
                    <span>İşlem Tarihi:</span>
                    <span className="font-medium text-charcoal">{refundReceipt.refundDate}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Tamam
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
