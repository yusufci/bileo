import React, { useState, useEffect } from 'react';
import { BileoShieldCheck, BileoTicket } from '../icons';

interface OfflineBannerProps {
  onOpenWallet?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onOpenWallet }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 animate-fadeIn max-w-md">
      <div className="bg-[#1E1B18] text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
            <BileoShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black font-display">Çevrimdışı Moddasınız</h4>
            <p className="text-[11px] text-white/70 font-medium">Biletleriniz ve biniş kartlarınız cüzdanınızda hazır.</p>
          </div>
        </div>

        {onOpenWallet && (
          <button
            onClick={onOpenWallet}
            className="px-3 py-1.5 rounded-xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
          >
            <BileoTicket className="w-3.5 h-3.5" />
            <span>Cüzdan</span>
          </button>
        )}
      </div>
    </div>
  );
};
