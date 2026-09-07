import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  BileoPrinter,
  BileoRotateCcw,
  BileoCheck,
  BileoArrowRight,
  BileoBusIcon,
  BileoPlaneIcon,
  BileoTrainIcon,
  BileoFerryIcon,
} from './icons';
import confetti from 'canvas-confetti';
import { RouteItem, BookingTicket } from '../types';
import { SHOWCASE_TICKET } from '../data/mockData';

interface InteractiveTicketShowcaseProps {
  onTicketPurchased: (ticket: BookingTicket) => void;
}

export const InteractiveTicketShowcase: React.FC<InteractiveTicketShowcaseProps> = ({
  onTicketPurchased,
}) => {
  const [ticketData] = useState<RouteItem>(SHOWCASE_TICKET);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [pnrCode] = useState('3125125');
  const [copied, setCopied] = useState(false);

  const startXRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const maxDrag = 140;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#8A222B', '#D54556', '#F5EBE6', '#1E1B18'],
      });
    } catch {
      // ignore
    }
  };

  const handlePurchaseSuccess = useCallback(() => {
    setIsPurchased(true);
    setDragOffset(0);
    
    triggerConfetti();

    const newBooking: BookingTicket = {
      pnr: pnrCode,
      route: ticketData,
      passengers: [
        {
          id: 'p-1',
          seatNumber: 23,
          firstName: 'Ahmet',
          lastName: 'Yılmaz',
          idNumber: '12345678901',
          gender: 'male',
          email: 'ahmet.yilmaz@example.com',
          phone: '0555 123 45 67',
        }
      ],
      seats: [23],
      totalPrice: ticketData.price,
      purchaseDate: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: 'active',
      qrCodeValue: `BILEO-PNR-${pnrCode}-SEAT-23`,
    };

    onTicketPurchased(newBooking);
  }, [pnrCode, ticketData, onTicketPurchased]);

  const handleDragStart = (clientX: number) => {
    if (isPurchased) return;
    setIsDragging(true);
    startXRef.current = clientX - dragOffset;
    
  };

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging || isPurchased) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    animFrameRef.current = requestAnimationFrame(() => {
      const delta = clientX - startXRef.current;
      const clamped = Math.max(0, Math.min(delta, maxDrag));
      setDragOffset(clamped);
      

      if (clamped >= maxDrag * 0.8) {
        setIsDragging(false);
        handlePurchaseSuccess();
      }
    });
  }, [isDragging, isPurchased, handlePurchaseSuccess]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging || isPurchased) return;
    setIsDragging(false);

    if (dragOffset < maxDrag * 0.8) {
      setDragOffset(0);
    }
  }, [isDragging, isPurchased, dragOffset]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleDragMove(e.touches[0].clientX);
    };
    const onMouseUp = () => handleDragEnd();
    const onTouchEnd = () => handleDragEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const handleReset = () => {
    
    setIsPurchased(false);
    setDragOffset(0);
  };

  const handleCopyPNR = () => {
    
    navigator.clipboard.writeText(pnrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getModeIcon = () => {
    switch (ticketData.transportType) {
      case 'otobus': return BileoBusIcon;
      case 'ucak': return BileoPlaneIcon;
      case 'tren': return BileoTrainIcon;
      case 'feribot': return BileoFerryIcon;
      default: return BileoBusIcon;
    }
  };

  const ModeIcon = getModeIcon();

  return (
    <div className="relative w-full max-w-md mx-auto select-none">
      
      {/* Top Header */}
      <div className="text-center mb-4 space-y-1">
        <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-charcoal font-display">
          BİLETİN HAZIR!
        </h3>
        <p className="text-xs text-charcoal-muted">
          {isPurchased ? 'Biletiniz onaylandı ve cüzdanınıza eklendi.' : 'Aşağıdaki bileti sağa doğru çekerek satın alabilirsiniz.'}
        </p>
      </div>

      {/* DRAGGABLE REALISTIC TICKET WITH CUSTOM BILEO ICON */}
      <div
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onTouchStart={(e) => {
          if (e.touches.length > 0) handleDragStart(e.touches[0].clientX);
        }}
        className={`ticket-paper relative overflow-hidden transition-shadow duration-150 ${
          isDragging ? 'shadow-2xl cursor-grabbing' : 'shadow-ticket cursor-grab'
        }`}
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Perforation Cutout Notches */}
        <div className="ticket-notch-left top-[108px]" />
        <div className="ticket-notch-right top-[108px]" />

        {/* Upper Bordeaux Header */}
        <div className="bg-bordeaux-700 text-white p-5 rounded-t-[1.75rem] relative">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="text-xl font-extrabold tracking-tight">
                {ticketData.from}
              </div>
              <div className="text-[11px] text-white/75 font-medium mt-0.5">
                {ticketData.fromTerminal}
              </div>
            </div>

            {/* Route Connector */}
            <div className="flex-1 px-3 flex items-center justify-center">
              <div className="w-full flex items-center justify-center gap-1">
                <div className="h-[1px] flex-1 bg-white/40" />
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <ModeIcon className="w-4 h-4" />
                </div>
                <div className="h-[1px] flex-1 bg-white/40" />
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-extrabold tracking-tight">
                {ticketData.to}
              </div>
              <div className="text-[11px] text-white/75 font-medium mt-0.5">
                {ticketData.toTerminal}
              </div>
            </div>
          </div>

          {/* Stamped Badge when Confirmed */}
          {isPurchased && (
            <div className="absolute inset-0 bg-bordeaux-900/90 backdrop-blur-[2px] flex items-center justify-center rounded-t-[1.75rem] animate-fadeIn">
              <div className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest rotate-[-3deg] flex items-center gap-1.5 shadow-lg">
                <BileoCheck className="w-4 h-4 text-white" />
                <span>ONAYLANDI</span>
              </div>
            </div>
          )}
        </div>

        {/* Perforation Line */}
        <div className="relative py-2 bg-white flex items-center justify-center">
          <div className="ticket-perforation-line mx-4" />
        </div>

        {/* Ticket Details Grid */}
        <div className="p-5 pt-1 bg-white space-y-4">
          
          <div className="grid grid-cols-3 gap-2 items-center text-center">
            
            <div className="text-left">
              <span className="block text-[11px] font-medium text-charcoal-muted">
                {ticketData.date}
              </span>
              <span className="block text-xl font-extrabold text-charcoal tracking-tight mt-0.5">
                {ticketData.departureTime}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-charcoal-muted">
                Koltuk No
              </span>
              <span className="block text-xl font-extrabold text-charcoal tracking-tight mt-0.5">
                23
              </span>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="block text-[11px] font-medium text-charcoal-muted">
                Firma
              </span>
              <span className="block text-sm font-bold text-charcoal mt-0.5">
                {ticketData.company}
              </span>
              <div className="w-20 h-4 mt-1 barcode-pattern opacity-80" />
            </div>

          </div>

          <div className="h-[1px] bg-cream-200/80" />

          {/* Bottom Footer Details */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <div className="flex items-center gap-1 font-mono text-charcoal-muted">
              <span>PNR</span>
              <span className="font-bold text-charcoal">{pnrCode}</span>
            </div>

            <div className="text-charcoal-muted font-medium text-[11px]">
              1 Yolcu
            </div>

            <div className="text-right">
              <span className="text-lg font-black text-charcoal font-display">
                {ticketData.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
              </span>
            </div>
          </div>

        </div>

        {/* Pull Hint Strip on bottom */}
        {!isPurchased && (
          <div className="bg-cream-100/70 py-2.5 px-4 flex items-center justify-between text-xs text-charcoal-muted">
            <span className="font-semibold text-[11px]">Satın almak için bileti sağa çekin</span>
            <div className="flex items-center gap-1 text-bordeaux-700 font-bold">
              <span className="text-[11px]">Çek</span>
              <BileoArrowRight className="w-3.5 h-3.5 animate-pulse" />
            </div>
          </div>
        )}

      </div>

      {/* Post-Purchase Actions */}
      {isPurchased && (
        <div className="mt-4 p-4 rounded-2xl bg-white shadow-soft space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                <BileoCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-charcoal">Biletiniz Hazır ve Onaylandı!</div>
                <div className="text-[11px] text-charcoal-muted">PNR: {pnrCode}</div>
              </div>
            </div>

            <button
              onClick={handleCopyPNR}
              className="text-xs font-bold text-bordeaux-700 bg-bordeaux-50 hover:bg-bordeaux-100 px-3 py-1.5 rounded-xl transition-colors"
            >
              {copied ? 'Kopyalandı!' : 'PNR Kopyala'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                
                window.print();
              }}
              className="py-2.5 px-3 rounded-xl bg-cream-100 hover:bg-cream-200 text-charcoal text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <BileoPrinter className="w-3.5 h-3.5 text-bordeaux-700" />
              <span>Yazdır / PDF</span>
            </button>

            <button
              onClick={handleReset}
              className="py-2.5 px-3 rounded-xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft transition-colors"
            >
              <BileoRotateCcw className="w-3.5 h-3.5" />
              <span>Tekrar Dene</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
