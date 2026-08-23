import React, { useState } from 'react';
import {
  BileoSwapHorizontal,
  BileoSearch,
  BileoCheck,
} from './icons';
import { TransportType, SearchFilterState } from '../types';
import { CITIES } from '../data/mockData';
import { AviationLogosRibbon } from './PartnerLogosRibbon';

interface HeroSectionProps {
  searchState: SearchFilterState;
  onUpdateSearchState: (updates: Partial<SearchFilterState>) => void;
  onPerformSearch: () => void;
  onSelectCarrier?: (brand: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchState,
  onUpdateSearchState,
  onPerformSearch,
  onSelectCarrier,
}) => {
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const transportTabs: { type: TransportType; label: string }[] = [
    { type: 'otobus', label: 'Otobüs' },
    { type: 'ucak', label: 'Uçak' },
    { type: 'tren', label: 'Tren' },
    { type: 'feribot', label: 'Feribot' },
  ];

  const handleSwap = () => {
    setIsSwapping(true);
    const temp = searchState.fromCity;
    onUpdateSearchState({
      fromCity: searchState.toCity,
      toCity: temp,
    });
    setTimeout(() => setIsSwapping(false), 300);
  };

  return (
    <div className="space-y-6 py-2 sm:py-4">
      {/* Top Aviation Partner Carrier Ribbon */}
      <div className="mb-2">
        <AviationLogosRibbon onSelectCarrier={onSelectCarrier} />
      </div>

      {/* Clean & Borderless Pure Typographic Transport Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-1">
        {transportTabs.map((tab) => {
          const isActive = searchState.transportType === tab.type;
          return (
            <button
              key={tab.type}
              type="button"
              onClick={() => onUpdateSearchState({ transportType: tab.type })}
              className={`py-2 px-1 text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-bordeaux-700 border-b-2 border-bordeaux-700 font-black'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Clean & Borderless Search Area */}
      <div className="max-w-5xl mx-auto relative z-20 pt-2">
        <div className="py-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Nereden */}
            <div className="md:col-span-3 relative py-2">
              <label className="block text-[10px] font-extrabold text-charcoal-muted uppercase tracking-wider mb-1">
                Nereden
              </label>
              <div
                className="cursor-pointer"
                onClick={() => {
                  setShowFromDropdown(!showFromDropdown);
                  setShowToDropdown(false);
                }}
              >
                <span className="text-xl sm:text-2xl font-extrabold text-[#1E1B18] tracking-tight block truncate">
                  {searchState.fromCity || 'İstanbul'}
                </span>
              </div>

              {showFromDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-soft-lg p-2 z-50 animate-fadeIn">
                  <div className="text-[11px] font-bold text-charcoal-muted px-3 py-1.5">Popüler Kalkış Şehirleri</div>
                  <div className="max-h-48 overflow-y-auto no-scrollbar space-y-0.5">
                    {CITIES.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          onUpdateSearchState({ fromCity: city });
                          setShowFromDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                          searchState.fromCity === city
                            ? 'bg-bordeaux-50 text-bordeaux-700 font-bold'
                            : 'text-charcoal hover:bg-cream-100'
                        }`}
                      >
                        <span>{city}</span>
                        {searchState.fromCity === city && <BileoCheck className="w-3.5 h-3.5 text-bordeaux-700" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex justify-center -my-2 md:my-0">
              <button
                type="button"
                onClick={handleSwap}
                className={`w-9 h-9 rounded-full text-charcoal hover:text-bordeaux-700 flex items-center justify-center transition-transform cursor-pointer ${
                  isSwapping ? 'rotate-180 scale-110' : ''
                }`}
                title="Şehirleri Değiştir"
              >
                <BileoSwapHorizontal className="w-4 h-4 text-bordeaux-700" />
              </button>
            </div>

            {/* Nereye */}
            <div className="md:col-span-3 relative py-2">
              <label className="block text-[10px] font-extrabold text-charcoal-muted uppercase tracking-wider mb-1">
                Nereye
              </label>
              <div
                className="cursor-pointer"
                onClick={() => {
                  setShowToDropdown(!showToDropdown);
                  setShowFromDropdown(false);
                }}
              >
                <span className="text-xl sm:text-2xl font-extrabold text-[#1E1B18] tracking-tight block truncate">
                  {searchState.toCity || 'Ankara'}
                </span>
              </div>

              {showToDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-soft-lg p-2 z-50 animate-fadeIn">
                  <div className="text-[11px] font-bold text-charcoal-muted px-3 py-1.5">Popüler Varış Şehirleri</div>
                  <div className="max-h-48 overflow-y-auto no-scrollbar space-y-0.5">
                    {CITIES.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          onUpdateSearchState({ toCity: city });
                          setShowToDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                          searchState.toCity === city
                            ? 'bg-bordeaux-50 text-bordeaux-700 font-bold'
                            : 'text-charcoal hover:bg-cream-100'
                        }`}
                      >
                        <span>{city}</span>
                        {searchState.toCity === city && <BileoCheck className="w-3.5 h-3.5 text-bordeaux-700" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tarih */}
            <div className="md:col-span-3 py-2">
              <label className="block text-[10px] font-extrabold text-charcoal-muted uppercase tracking-wider mb-1">
                Gidiş Tarihi
              </label>
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-[#1E1B18] tracking-tight block truncate">
                  {searchState.departureDate || '24 Mayıs Cuma'}
                </span>
              </div>
            </div>

            {/* Arama Butonu */}
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={onPerformSearch}
                className="w-full py-4 rounded-2xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-bordeaux cursor-pointer transition-all flex items-center justify-center gap-2 hover:shadow-lg"
              >
                <BileoSearch className="w-4 h-4" />
                <span>Sefer Bul</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};