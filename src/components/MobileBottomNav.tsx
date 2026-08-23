import React from 'react';
import {
  BileoSearch,
  BileoCompass,
  BileoTicket,
  BileoUser,
  BileoHeadphones
} from './icons';
import { User } from '../types';

interface MobileBottomNavProps {
  activeTab: 'search' | 'discover' | 'wallet';
  onSelectTab: (tab: 'search' | 'discover' | 'wallet') => void;
  user: User | null;
  onOpenAuth: () => void;
  activeTicketCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  user,
  onOpenAuth,
  activeTicketCount,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg px-6 py-2 shadow-soft-lg">
      <div className="flex items-center justify-between">
        
        {/* Arama */}
        <button
          onClick={() => {
            onSelectTab('search');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-colors ${
            activeTab === 'search' ? 'text-bordeaux-700 font-bold' : 'text-charcoal-muted'
          }`}
        >
          <BileoSearch className="w-5 h-5" />
          <span className="text-[10px]">Arama</span>
        </button>

        {/* Keşfet */}
        <button
          onClick={() => {
            onSelectTab('discover');
            const el = document.getElementById('discover-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-colors ${
            activeTab === 'discover' ? 'text-bordeaux-700 font-bold' : 'text-charcoal-muted'
          }`}
        >
          <BileoCompass className="w-5 h-5" />
          <span className="text-[10px]">Keşfet</span>
        </button>

        {/* Biletlerim / Giriş Yap */}
        {user ? (
          <button
            onClick={() => {
              onSelectTab('wallet');
            }}
            className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-colors ${
              activeTab === 'wallet' ? 'text-bordeaux-700 font-bold' : 'text-charcoal-muted'
            }`}
          >
            <div className="relative">
              <BileoTicket className="w-5 h-5" />
              {activeTicketCount > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-bordeaux-700 text-white text-[9px] font-bold flex items-center justify-center animate-pulse-subtle">
                  {activeTicketCount}
                </span>
              )}
            </div>
            <span className="text-[10px]">Biletlerim</span>
          </button>
        ) : (
          <button
            onClick={() => {
              onOpenAuth();
            }}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-bordeaux-700 font-bold transition-colors cursor-pointer"
          >
            <BileoUser className="w-5 h-5" />
            <span className="text-[10px]">Giriş Yap</span>
          </button>
        )}

        {/* Destek */}
        <button
          onClick={() => {
            alert('Bileo 7/24 Müşteri Destek Hattı: 0850 800 00 00\nCanlı destek ve seyahat danışmanlığı için hizmetinizdeyiz.');
          }}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-charcoal-muted hover:text-charcoal transition-colors"
        >
          <BileoHeadphones className="w-5 h-5" />
          <span className="text-[10px]">Destek</span>
        </button>

      </div>
    </div>
  );
};
