import React from 'react';
import {
  BileoSearch,
  BileoCompass,
  BileoTicket,
  BileoUser,
  BileoHeadphones
} from './icons';
import { User } from '../types';
import { sound } from '../utils/sound';

interface MobileBottomNavProps {
  activeTab: 'search' | 'discover' | 'wallet';
  onSelectTab: (tab: 'search' | 'discover' | 'wallet') => void;
  user: User | null;
  onOpenAuth: () => void;
  activeTicketCount: number;
  onOpenSupport?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  user,
  onOpenAuth,
  activeTicketCount,
  onOpenSupport,
}) => {
  return (
    <nav 
      aria-label="Mobil Ana Gezinme"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] shadow-soft-lg border-t border-[#E8E1D5]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Arama */}
        <button
          type="button"
          onClick={() => {
            sound.playTick();
            onSelectTab('search');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[56px] py-1 px-2 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'search' 
              ? 'text-bordeaux-700 font-extrabold scale-105' 
              : 'text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <BileoSearch className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Arama</span>
        </button>

        {/* Keşfet */}
        <button
          type="button"
          onClick={() => {
            sound.playTick();
            onSelectTab('discover');
            const el = document.getElementById('discover-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[56px] py-1 px-2 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'discover' 
              ? 'text-bordeaux-700 font-extrabold scale-105' 
              : 'text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <BileoCompass className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Keşfet</span>
        </button>

        {/* Biletlerim / Giriş Yap */}
        {user ? (
          <button
            type="button"
            onClick={() => {
              sound.playTick();
              onSelectTab('wallet');
            }}
            className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[56px] py-1 px-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'wallet' 
                ? 'text-bordeaux-700 font-extrabold scale-105' 
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <div className="relative">
              <BileoTicket className="w-5 h-5" />
              {activeTicketCount > 0 && (
                <span className="absolute -top-1 -right-2.5 w-4 h-4 rounded-full bg-bordeaux-700 text-white text-[9px] font-black flex items-center justify-center animate-pulse-subtle shadow-xs">
                  {activeTicketCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Biletlerim</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              sound.playTick();
              onOpenAuth();
            }}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[56px] py-1 px-2 rounded-2xl text-bordeaux-700 font-bold transition-all cursor-pointer hover:scale-105"
          >
            <BileoUser className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Giriş Yap</span>
          </button>
        )}

        {/* 7/24 Destek */}
        <button
          type="button"
          onClick={() => {
            sound.playTick();
            if (onOpenSupport) {
              onOpenSupport();
            } else {
              window.open('tel:08508000000', '_self');
            }
          }}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[56px] py-1 px-2 rounded-2xl text-charcoal-muted hover:text-charcoal transition-all cursor-pointer"
        >
          <BileoHeadphones className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Destek</span>
        </button>

      </div>
    </nav>
  );
};
