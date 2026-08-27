import React, { useState, useRef, useEffect } from 'react';
import { BileoUser, BileoTicket, BileoLogOut, BileoSearch, BileoChevronRight, BileoMapPin } from './icons';
import { TransportType, User } from '../types';
import { SeferLogo } from './SeferLogo';
import { sound } from '../utils/sound';

interface HeaderProps {
  activeTransport?: TransportType;
  onSelectTransport?: (type: TransportType) => void;
  onOpenWallet: () => void;
  onOpenAuth: () => void;
  onOpenPnrQuery?: () => void;
  onOpenTerminalGuide?: () => void;
  onLogout: () => void;
  user: User | null;
  activeTicketCount?: number;
}

const SunIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({
  onOpenWallet,
  onOpenAuth,
  onOpenPnrQuery,
  onOpenTerminalGuide,
  onLogout,
  user,
  activeTicketCount = 0,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || localStorage.getItem('bileo_theme') === 'dark';
    }
    return false;
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    sound.playTick();
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bileo_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bileo_theme', 'light');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md transition-all duration-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group flex items-center focus:outline-none"
          >
            <SeferLogo size="md" variant="bordeaux" />
          </a>
        </div>

        {/* Center Slogan */}
        <div className="hidden sm:flex items-center justify-center flex-1 px-6 text-center">
          <span className="text-sm md:text-base font-extrabold text-[#1E1B18] tracking-tight font-display">
            Yolculuğun <span className="text-bordeaux-700">En Keyifli Hali</span>
          </span>
        </div>

        {/* Right Actions: Theme Toggle, PNR Query & Terminal Guide & Authentication & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Day / Night Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            type="button"
            className="p-2.5 rounded-2xl bg-[#FAF7F2] hover:bg-cream-100 border border-[#E8E1D5] text-[#1E1B18] transition-all cursor-pointer flex items-center justify-center shadow-2xs"
            title={isDarkMode ? "Gündüz Moduna Geç" : "Gece Moduna Geç (Göz Yormayan Tema)"}
            aria-label="Gece Gündüz Modu"
          >
            {isDarkMode ? (
              <SunIcon className="w-4 h-4 text-amber-400" />
            ) : (
              <MoonIcon className="w-4 h-4 text-bordeaux-700" />
            )}
          </button>

          {onOpenTerminalGuide && (
            <button
              onClick={onOpenTerminalGuide}
              type="button"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#FAF7F2] hover:bg-cream-100 border border-[#E8E1D5] text-[#1E1B18] text-xs font-extrabold transition-all cursor-pointer"
              title="Terminal, Otogar, Gar ve Havalimanı Rehberi"
            >
              <BileoMapPin className="w-3.5 h-3.5 text-bordeaux-700" />
              <span>Terminaller</span>
            </button>
          )}

          {onOpenPnrQuery && (
            <button
              onClick={onOpenPnrQuery}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#FAF7F2] hover:bg-cream-100 border border-[#E8E1D5] text-[#1E1B18] text-xs font-extrabold transition-all cursor-pointer"
              title="PNR Numarası ile Bilet Sorgula & İptal Et"
            >
              <BileoTicket className="w-3.5 h-3.5 text-bordeaux-700" />
              <span className="hidden sm:inline">PNR Sorgula</span>
            </button>
          )}

          {user ? (
            /* Logged-in Profile Menu */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                type="button"
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-cream-100 transition-colors cursor-pointer"
                title="Hesap Menüsü"
              >
                <div className="w-8 h-8 rounded-full bg-bordeaux-700 text-white flex items-center justify-center text-xs font-black font-display shadow-2xs">
                  {user.avatarInitials || user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-[#1E1B18] hidden sm:inline">
                  {user.name}
                </span>
              </button>

              {/* Profile Dropdown */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-3xl bg-white shadow-soft-lg p-3 z-50 animate-fadeIn">
                  {/* User info card */}
                  <div className="p-3 bg-[#FAF7F2] rounded-2xl mb-2">
                    <div className="text-xs font-black text-[#1E1B18] font-display">
                      {user.name} {user.surname}
                    </div>
                    <div className="text-[11px] text-charcoal-muted truncate mt-0.5 font-medium">
                      {user.email}
                    </div>
                  </div>

                  <div className="space-y-1">
                    {/* Biletlerim & Cüzdan */}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenWallet();
                      }}
                      type="button"
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF7F2] text-xs font-bold text-[#1E1B18] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <BileoTicket className="w-4 h-4 text-bordeaux-700" />
                        <span>Biletlerim & Cüzdanım</span>
                      </div>
                      {activeTicketCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-bordeaux-700 text-white text-[10px] font-black">
                          {activeTicketCount}
                        </span>
                      ) : (
                        <BileoChevronRight className="w-3.5 h-3.5 text-charcoal-muted" />
                      )}
                    </button>

                    {/* PNR Sorgula */}
                    {onOpenPnrQuery && (
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenPnrQuery();
                        }}
                        type="button"
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF7F2] text-xs font-bold text-[#1E1B18] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <BileoSearch className="w-4 h-4 text-bordeaux-700" />
                          <span>PNR ile Bilet Sorgula</span>
                        </div>
                        <BileoChevronRight className="w-3.5 h-3.5 text-charcoal-muted" />
                      </button>
                    )}

                    {/* Terminal Rehberi */}
                    {onOpenTerminalGuide && (
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenTerminalGuide();
                        }}
                        type="button"
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF7F2] text-xs font-bold text-[#1E1B18] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <BileoMapPin className="w-4 h-4 text-bordeaux-700" />
                          <span>Terminal & Gar Rehberi</span>
                        </div>
                        <BileoChevronRight className="w-3.5 h-3.5 text-charcoal-muted" />
                      </button>
                    )}

                    {/* Yeni Sefer Ara */}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      type="button"
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF7F2] text-xs font-bold text-[#1E1B18] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <BileoSearch className="w-4 h-4 text-bordeaux-700" />
                        <span>Yeni Sefer Ara</span>
                      </div>
                      <BileoChevronRight className="w-3.5 h-3.5 text-charcoal-muted" />
                    </button>

                    {/* Güvenli Çıkış Yap */}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onLogout();
                      }}
                      type="button"
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-rose-50 text-xs font-bold text-rose-700 transition-colors cursor-pointer"
                    >
                      <BileoLogOut className="w-4 h-4 text-rose-700" />
                      <span>Güvenli Çıkış Yap</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged-out Login / Register Action */
            <button
              onClick={onOpenAuth}
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white text-xs font-extrabold shadow-bordeaux transition-all cursor-pointer"
            >
              <BileoUser className="w-4 h-4" />
              <span>Giriş Yap / Kayıt Ol</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
