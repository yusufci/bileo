import React, { useState, useRef, useEffect } from 'react';
import {
  BileoSwapHorizontal,
  BileoSearch,
  BileoCheck,
  BileoTicket,
} from './icons';
import { TransportType, SearchFilterState } from '../types';
import { CITIES } from '../data/mockData';
import { AviationLogosRibbon } from './PartnerLogosRibbon';

interface HeroSectionProps {
  searchState: SearchFilterState;
  onUpdateSearchState: (updates: Partial<SearchFilterState>) => void;
  onPerformSearch: () => void;
  onSelectCarrier?: (brand: string) => void;
  onOpenPnrQuery?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchState,
  onUpdateSearchState,
  onPerformSearch,
  onSelectCarrier,
  onOpenPnrQuery,
}) => {
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');

  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target as Node)) {
        setShowFromDropdown(false);
      }
      if (toDropdownRef.current && !toDropdownRef.current.contains(event.target as Node)) {
        setShowToDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const transportTabs: { type: TransportType; label: string }[] = [
    { type: 'otobus', label: 'Otobüs' },
    { type: 'ucak', label: 'Uçak' },
    { type: 'tren', label: 'Tren' },
    { type: 'feribot', label: 'Feribot' },
  ];

  const filteredFromCities = CITIES.filter((c) =>
    c.toLowerCase().includes(fromQuery.toLowerCase().trim())
  );

  const filteredToCities = CITIES.filter((c) =>
    c.toLowerCase().includes(toQuery.toLowerCase().trim())
  );

  const handleSwap = () => {
    setIsSwapping(true);
    const temp = searchState.fromCity;
    onUpdateSearchState({
      fromCity: searchState.toCity,
      toCity: temp,
    });
    setTimeout(() => setIsSwapping(false), 300);
  };

  const handleSetQuickDate = (dateLabel: string) => {
    onUpdateSearchState({ departureDate: dateLabel });
  };

  return (
    <div className="space-y-6 py-2 sm:py-4">
      {/* Top Aviation Partner Carrier Ribbon */}
      <div className="mb-2">
        <AviationLogosRibbon onSelectCarrier={onSelectCarrier} />
      </div>

      {/* Clean & Borderless Pure Typographic Transport Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mx-auto sm:mx-0">
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

        {/* Fast PNR Quick Query Button on Hero Top */}
        {onOpenPnrQuery && (
          <button
            type="button"
            onClick={onOpenPnrQuery}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-cream-100 border border-[#E8E1D5] text-xs font-bold text-charcoal hover:text-bordeaux-700 transition-colors shadow-2xs cursor-pointer"
          >
            <BileoTicket className="w-3.5 h-3.5 text-bordeaux-700" />
            <span>PNR ile Bilet Sorgula</span>
          </button>
        )}
      </div>

      {/* Clean & Borderless Search Area */}
      <div className="max-w-5xl mx-auto relative z-20 pt-2">
        <div className="py-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Nereden */}
            <div className="md:col-span-3 relative py-2" ref={fromDropdownRef}>
              <label className="block text-[10px] font-extrabold text-charcoal-muted uppercase tracking-wider mb-1">
                Nereden
              </label>
              <div
                className="cursor-pointer group"
                onClick={() => {
                  setShowFromDropdown(!showFromDropdown);
                  setShowToDropdown(false);
                }}
              >
                <span className="text-xl sm:text-2xl font-extrabold text-[#1E1B18] group-hover:text-bordeaux-700 transition-colors tracking-tight block truncate">
                  {searchState.fromCity || 'İstanbul'}
                </span>
              </div>

              {showFromDropdown && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-soft-lg p-3 z-50 animate-fadeIn border border-[#E8E1D5]">
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={fromQuery}
                      onChange={(e) => setFromQuery(e.target.value)}
                      placeholder="Şehir veya terminal ara..."
                      autoFocus
                      className="w-full px-3 py-2 text-xs font-bold bg-[#FAF7F2] rounded-xl border border-[#E8E1D5] focus:outline-none focus:border-bordeaux-700"
                    />
                  </div>
                  <div className="text-[10px] font-extrabold text-charcoal-muted uppercase px-1 py-1">Kalkış Noktaları</div>
                  <div className="max-h-48 overflow-y-auto no-scrollbar space-y-0.5">
                    {filteredFromCities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          onUpdateSearchState({ fromCity: city });
                          setShowFromDropdown(false);
                          setFromQuery('');
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
                    {filteredFromCities.length === 0 && (
                      <div className="text-xs text-charcoal-muted p-2 text-center">Sonuç bulunamadı</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex justify-center -my-2 md:my-0">
              <button
                type="button"
                onClick={handleSwap}
                className={`w-9 h-9 rounded-full text-charcoal hover:text-bordeaux-700 hover:bg-[#FAF7F2] flex items-center justify-center transition-all cursor-pointer ${
                  isSwapping ? 'rotate-180 scale-110' : ''
                }`}
                title="Şehirleri Değiştir"
              >
                <BileoSwapHorizontal className="w-4 h-4 text-bordeaux-700" />
              </button>
            </div>

            {/* Nereye */}
            <div className="md:col-span-3 relative py-2" ref={toDropdownRef}>
              <label className="block text-[10px] font-extrabold text-charcoal-muted uppercase tracking-wider mb-1">
                Nereye
              </label>
              <div
                className="cursor-pointer group"
                onClick={() => {
                  setShowToDropdown(!showToDropdown);
                  setShowFromDropdown(false);
                }}
              >
                <span className="text-xl sm:text-2xl font-extrabold text-[#1E1B18] group-hover:text-bordeaux-700 transition-colors tracking-tight block truncate">
                  {searchState.toCity || 'Ankara'}
                </span>
              </div>

              {showToDropdown && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-soft-lg p-3 z-50 animate-fadeIn border border-[#E8E1D5]">
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={toQuery}
                      onChange={(e) => setToQuery(e.target.value)}
                      placeholder="Şehir veya terminal ara..."
                      autoFocus
                      className="w-full px-3 py-2 text-xs font-bold bg-[#FAF7F2] rounded-xl border border-[#E8E1D5] focus:outline-none focus:border-bordeaux-700"
                    />
                  </div>
                  <div className="text-[10px] font-extrabold text-charcoal-muted uppercase px-1 py-1">Varış Noktaları</div>
                  <div className="max-h-48 overflow-y-auto no-scrollbar space-y-0.5">
                    {filteredToCities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          onUpdateSearchState({ toCity: city });
                          setShowToDropdown(false);
                          setToQuery('');
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
                    {filteredToCities.length === 0 && (
                      <div className="text-xs text-charcoal-muted p-2 text-center">Sonuç bulunamadı</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tarih & Hızlı Seçim */}
            <div className="md:col-span-3 py-2">
              <label className="block text-[10px] font-extrabold text-charcoal-muted uppercase tracking-wider mb-1">
                Gidiş Tarihi
              </label>
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-[#1E1B18] tracking-tight block truncate">
                  {searchState.departureDate || '24 Mayıs Cuma'}
                </span>
              </div>
              {/* Fast Date Pills */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => handleSetQuickDate('Bugün')}
                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md transition-colors cursor-pointer ${
                    searchState.departureDate === 'Bugün'
                      ? 'bg-bordeaux-700 text-white'
                      : 'bg-white hover:bg-cream-100 text-charcoal border border-[#E8E1D5]'
                  }`}
                >
                  Bugün
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate('Yarın')}
                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md transition-colors cursor-pointer ${
                    searchState.departureDate === 'Yarın'
                      ? 'bg-bordeaux-700 text-white'
                      : 'bg-white hover:bg-cream-100 text-charcoal border border-[#E8E1D5]'
                  }`}
                >
                  Yarın
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate('25 Mayıs Cumartesi')}
                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md transition-colors cursor-pointer ${
                    searchState.departureDate === '25 Mayıs Cumartesi'
                      ? 'bg-bordeaux-700 text-white'
                      : 'bg-white hover:bg-cream-100 text-charcoal border border-[#E8E1D5]'
                  }`}
                >
                  Hafta Sonu
                </button>
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