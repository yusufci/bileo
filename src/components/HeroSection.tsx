import React, { useState, useRef, useEffect } from 'react';
import {
  BileoSwapHorizontal,
  BileoCalendar,
  BileoClock,
  BileoCreditCard,
  BileoPlane,
  BileoBus,
  BileoFerry,
  BileoClose,
} from './icons';
import { TransportType, SearchFilterState } from '../types';
import { sound } from '../utils/sound';

interface HeroSectionProps {
  searchState: SearchFilterState;
  onUpdateSearchState: (updates: Partial<SearchFilterState>) => void;
  onPerformSearch: () => void;
  onSelectCarrier?: (brand: string) => void;
  onOpenPnrQuery?: () => void;
}

const HotelIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" />
    <circle cx="6" cy="11" r="2" />
  </svg>
);

const CarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

const AIRPORT_DATABASE: { city: string; name: string; code: string; country: string }[] = [
  { city: 'Hatay', name: 'Hatay Havalimanı', code: 'HTY', country: 'Türkiye' },
  { city: 'Şanlıurfa', name: 'Urfa Güney Anadolu Havalimanı', code: 'GNY', country: 'Türkiye' },
  { city: 'İstanbul', name: 'İstanbul Havalimanı', code: 'IST', country: 'Türkiye' },
  { city: 'İstanbul', name: 'Sabiha Gökçen Havalimanı', code: 'SAW', country: 'Türkiye' },
  { city: 'İzmir', name: 'Adnan Menderes Havalimanı', code: 'ADB', country: 'Türkiye' },
  { city: 'Ankara', name: 'Esenboğa Havalimanı', code: 'ESB', country: 'Türkiye' },
  { city: 'Antalya', name: 'Antalya Havalimanı', code: 'AYT', country: 'Türkiye' },
  { city: 'Adana', name: 'Adana Mersin Çukurova Havalimanı', code: 'COV', country: 'Türkiye' },
  { city: 'Bodrum', name: 'Milas-Bodrum Havalimanı', code: 'BJV', country: 'Türkiye' },
  { city: 'Dalaman', name: 'Dalaman Havalimanı', code: 'DLM', country: 'Türkiye' },
  { city: 'Trabzon', name: 'Trabzon Havalimanı', code: 'TZX', country: 'Türkiye' },
  { city: 'Malatya', name: 'Erhaç Havalimanı', code: 'MLX', country: 'Türkiye' },
  { city: 'Kayseri', name: 'Erkilet Havalimanı', code: 'ASR', country: 'Türkiye' },
  { city: 'Gaziantep', name: 'Gaziantep Havalimanı', code: 'GZT', country: 'Türkiye' },
  { city: 'Diyarbakır', name: 'Diyarbakır Havalimanı', code: 'DIY', country: 'Türkiye' },
  { city: 'Samsun', name: 'Çarşamba Havalimanı', code: 'SZF', country: 'Türkiye' },
  { city: 'Bursa', name: 'Yenişehir Havalimanı', code: 'YEI', country: 'Türkiye' },
  { city: 'Eskişehir', name: 'Hasan Polatkan Havalimanı', code: 'AOE', country: 'Türkiye' },
  { city: 'Konya', name: 'Konya Havalimanı', code: 'KYA', country: 'Türkiye' },
  { city: 'Van', name: 'Ferit Melen Havalimanı', code: 'VAN', country: 'Türkiye' },
  { city: 'Erzurum', name: 'Erzurum Havalimanı', code: 'ERZ', country: 'Türkiye' },
];

const POPULAR_CHIPS = [
  'İstanbul', 'İzmir', 'Antalya', 'Malatya', 'Ankara',
  'Kayseri', 'Adana', 'Bodrum', 'Dalaman'
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchState,
  onUpdateSearchState,
  onPerformSearch,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<'from' | 'to' | null>(null);
  const [fromInputText, setFromInputText] = useState(searchState.fromCity || 'Hatay');
  const [toInputText, setToInputText] = useState(searchState.toCity || '');
  const [tripType, setTripType] = useState<'single' | 'round' | 'multi'>('single');
  const [onlyDirect, setOnlyDirect] = useState(false);
  const [cabinClass, setCabinClass] = useState<'Ekonomi' | 'Business'>('Ekonomi');
  const [showPassengerModal, setShowPassengerModal] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFromInputText(searchState.fromCity || 'Hatay');
  }, [searchState.fromCity]);

  useEffect(() => {
    setToInputText(searchState.toCity || '');
  }, [searchState.toCity]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setShowPassengerModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwap = () => {
    sound.playTick();
    const temp = searchState.fromCity;
    onUpdateSearchState({
      fromCity: searchState.toCity,
      toCity: temp,
    });
  };

  const selectAirport = (item: { city: string; name: string; code: string }) => {
    sound.playTick();
    if (activeDropdown === 'from') {
      onUpdateSearchState({ fromCity: item.city });
      setFromInputText(item.city);
    } else if (activeDropdown === 'to') {
      onUpdateSearchState({ toCity: item.city });
      setToInputText(item.city);
    }
    setActiveDropdown(null);
  };

  const currentQuery = activeDropdown === 'from' ? fromInputText : toInputText;
  const filteredAirports = AIRPORT_DATABASE.filter(a =>
    a.city.toLowerCase().includes(currentQuery.toLowerCase().trim()) ||
    a.name.toLowerCase().includes(currentQuery.toLowerCase().trim()) ||
    a.code.toLowerCase().includes(currentQuery.toLowerCase().trim())
  );

  return (
    <div className="w-full pt-10 sm:pt-16 pb-8 select-none">
      {/* 1. Modality Navigation Tabs */}
      <div className="flex items-center gap-6 sm:gap-9 border-b border-[#E8E1D5] pb-4 mb-6 overflow-x-auto no-scrollbar">
        {/* Uçak */}
        <button
          type="button"
          onClick={() => {
            sound.playTick();
            onUpdateSearchState({ transportType: 'ucak' });
          }}
          className="flex flex-col items-center gap-1.5 group cursor-pointer shrink-0"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            searchState.transportType === 'ucak'
              ? 'bg-[#0a1172] text-white shadow-md'
              : 'text-charcoal-muted hover:bg-cream-100 hover:text-charcoal'
          }`}>
            <BileoPlane className="w-6 h-6" />
          </div>
          <span className={`text-xs font-black tracking-tight ${
            searchState.transportType === 'ucak' ? 'text-[#0a1172]' : 'text-charcoal-muted group-hover:text-charcoal'
          }`}>
            Uçak
          </span>
        </button>

        {/* Otel */}
        <button
          type="button"
          onClick={() => sound.playTick()}
          className="flex flex-col items-center gap-1.5 group cursor-pointer shrink-0"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-charcoal-muted hover:bg-cream-100 hover:text-charcoal transition-all">
            <HotelIcon className="w-6 h-6" />
          </div>
          <span className="text-xs font-black tracking-tight text-charcoal-muted group-hover:text-charcoal">
            Otel
          </span>
        </button>

        {/* Otobüs */}
        <button
          type="button"
          onClick={() => {
            sound.playTick();
            onUpdateSearchState({ transportType: 'otobus' });
          }}
          className="flex flex-col items-center gap-1.5 group cursor-pointer shrink-0"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            searchState.transportType === 'otobus'
              ? 'bg-[#0a1172] text-white shadow-md'
              : 'text-charcoal-muted hover:bg-cream-100 hover:text-charcoal'
          }`}>
            <BileoBus className="w-6 h-6" />
          </div>
          <span className={`text-xs font-black tracking-tight ${
            searchState.transportType === 'otobus' ? 'text-[#0a1172]' : 'text-charcoal-muted group-hover:text-charcoal'
          }`}>
            Otobüs
          </span>
        </button>

        {/* Araç */}
        <button
          type="button"
          onClick={() => sound.playTick()}
          className="flex flex-col items-center gap-1.5 group cursor-pointer shrink-0"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-charcoal-muted hover:bg-cream-100 hover:text-charcoal transition-all">
            <CarIcon className="w-6 h-6" />
          </div>
          <span className="text-xs font-black tracking-tight text-charcoal-muted group-hover:text-charcoal">
            Araç
          </span>
        </button>

        {/* Feribot */}
        <button
          type="button"
          onClick={() => {
            sound.playTick();
            onUpdateSearchState({ transportType: 'feribot' });
          }}
          className="flex flex-col items-center gap-1.5 group cursor-pointer shrink-0"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            searchState.transportType === 'feribot'
              ? 'bg-[#0a1172] text-white shadow-md'
              : 'text-charcoal-muted hover:bg-cream-100 hover:text-charcoal'
          }`}>
            <BileoFerry className="w-6 h-6" />
          </div>
          <span className={`text-xs font-black tracking-tight ${
            searchState.transportType === 'feribot' ? 'text-[#0a1172]' : 'text-charcoal-muted group-hover:text-charcoal'
          }`}>
            Feribot
          </span>
        </button>

        {/* Puan */}
        <button
          type="button"
          onClick={() => sound.playTick()}
          className="flex flex-col items-center gap-1.5 group cursor-pointer shrink-0"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-charcoal-muted hover:bg-cream-100 hover:text-charcoal transition-all">
            <BileoCreditCard className="w-6 h-6" />
          </div>
          <span className="text-xs font-black tracking-tight text-charcoal-muted group-hover:text-charcoal">
            Puan
          </span>
        </button>
      </div>

      {/* 2. Trip Type Radio Buttons */}
      <div className="flex items-center gap-6 mb-4 text-xs font-extrabold text-[#1E1B18]">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="tripType"
            checked={tripType === 'single'}
            onChange={() => setTripType('single')}
            className="w-4 h-4 text-[#0a1172] accent-[#0a1172] cursor-pointer"
          />
          <span className="group-hover:text-[#0a1172] transition-colors">Tek Yön</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group text-charcoal-muted hover:text-charcoal">
          <input
            type="radio"
            name="tripType"
            checked={tripType === 'round'}
            onChange={() => setTripType('round')}
            className="w-4 h-4 text-[#0a1172] accent-[#0a1172] cursor-pointer"
          />
          <span className="group-hover:text-[#0a1172] transition-colors">Gidiş Dönüş</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group text-charcoal-muted hover:text-charcoal">
          <input
            type="radio"
            name="tripType"
            checked={tripType === 'multi'}
            onChange={() => setTripType('multi')}
            className="w-4 h-4 text-[#0a1172] accent-[#0a1172] cursor-pointer"
          />
          <span className="group-hover:text-[#0a1172] transition-colors">Çoklu Uçuş</span>
        </label>
      </div>

      {/* 3. Main Search Bar */}
      <div className="relative z-30" ref={dropdownRef}>
        <div className="bg-white rounded-3xl border border-[#E8E1D5] shadow-soft-lg p-2 flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
          
          {/* Nereden Box (Editable Real Input) */}
          <div
            className={`flex-1 px-4 py-2.5 rounded-2xl transition-all border ${
              activeDropdown === 'from'
                ? 'border-[#0a1172] ring-2 ring-[#0a1172]/15 bg-blue-50/10'
                : 'border-transparent hover:bg-cream-50'
            }`}
          >
            <span className="text-[11px] font-bold text-charcoal-muted block">Nereden?</span>
            <input
              type="text"
              value={fromInputText}
              onFocus={() => setActiveDropdown('from')}
              onChange={(e) => {
                setFromInputText(e.target.value);
                onUpdateSearchState({ fromCity: e.target.value });
                setActiveDropdown('from');
              }}
              placeholder="Kalkış Şehri veya Havalimanı"
              className="w-full text-sm sm:text-base font-extrabold text-[#1E1B18] font-display bg-transparent border-0 p-0 focus:outline-none placeholder-gray-400 truncate"
            />
          </div>

          {/* Swap Button */}
          <button
            type="button"
            onClick={handleSwap}
            className="w-9 h-9 rounded-full bg-cream-100 hover:bg-cream-200 border border-[#E8E1D5] text-charcoal hover:text-[#0a1172] flex items-center justify-center mx-auto lg:-mx-2 z-10 cursor-pointer shrink-0 transition-transform active:scale-95 shadow-2xs"
            title="Kalkış ve Varış Noktalarını Değiştir"
          >
            <BileoSwapHorizontal className="w-4 h-4" />
          </button>

          {/* Nereye Box (Editable Real Input) */}
          <div
            className={`flex-1 px-4 py-2.5 rounded-2xl transition-all border ${
              activeDropdown === 'to'
                ? 'border-[#0a1172] ring-2 ring-[#0a1172]/15 bg-blue-50/10'
                : 'border-transparent hover:bg-cream-50'
            }`}
          >
            <span className="text-[11px] font-bold text-charcoal-muted block">Nereye?</span>
            <input
              type="text"
              value={toInputText}
              onFocus={() => setActiveDropdown('to')}
              onChange={(e) => {
                setToInputText(e.target.value);
                onUpdateSearchState({ toCity: e.target.value });
                setActiveDropdown('to');
              }}
              placeholder="Nereye?"
              className="w-full text-sm sm:text-base font-extrabold text-[#1E1B18] font-display bg-transparent border-0 p-0 focus:outline-none placeholder-gray-400 truncate"
            />
          </div>

          <div className="w-[1px] h-10 bg-[#E8E1D5] hidden lg:block mx-1" />

          {/* Gidiş Tarihi Box */}
          <div className="flex-1 px-4 py-2.5 rounded-2xl hover:bg-cream-50 cursor-pointer flex items-center justify-between border border-transparent">
            <div>
              <span className="text-[11px] font-bold text-charcoal-muted block">Gidiş Tarihi</span>
              <span className="text-sm sm:text-base font-extrabold text-[#1E1B18] font-display block">
                {searchState.departureDate || '28 Ağu, Cum'}
              </span>
            </div>
            <BileoCalendar className="w-5 h-5 text-gray-500 shrink-0" />
          </div>

          {/* Dönüş Ekle Button */}
          <button
            type="button"
            onClick={() => sound.playTick()}
            className="px-3 py-2.5 rounded-xl text-xs font-extrabold text-charcoal-muted hover:text-[#0a1172] hover:bg-cream-100 cursor-pointer text-left shrink-0 transition-colors"
          >
            + Dönüş Ekle
          </button>

          <div className="w-[1px] h-10 bg-[#E8E1D5] hidden lg:block mx-1" />

          {/* Yolcu ve Sınıf Box */}
          <div
            onClick={() => setShowPassengerModal(!showPassengerModal)}
            className="flex-1 px-4 py-2.5 rounded-2xl hover:bg-cream-50 cursor-pointer border border-transparent"
          >
            <span className="text-[11px] font-bold text-charcoal-muted block">Yolcu ve Sınıf</span>
            <span className="text-sm font-extrabold text-[#1E1B18] font-display block">
              {searchState.passengerCount || 1} Yolcu, {cabinClass}
            </span>
          </div>

          {/* Primary CTA: Ucuz Bilet Ara ≫ */}
          <button
            type="button"
            onClick={() => {
              sound.playSuccess();
              onPerformSearch();
            }}
            className="bg-[#0a1172] hover:bg-[#070b4f] text-white px-7 py-4 rounded-2xl font-black text-sm tracking-wide shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] shrink-0 min-h-[50px]"
          >
            <span>Ucuz Bilet Ara</span>
            <span className="text-base font-black">≫</span>
          </button>
        </div>

        {/* 4. Autocomplete Popup Menu matching Turna */}
        {activeDropdown && (
          <div className="absolute top-full left-0 mt-3 w-full max-w-md bg-white rounded-3xl shadow-soft-xl border border-[#E8E1D5] p-5 z-50 animate-fadeIn space-y-4">
            
            {/* Filtered Airports List */}
            {filteredAirports.length > 0 && currentQuery.trim().length > 0 && (
              <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar">
                {filteredAirports.slice(0, 8).map((airport) => (
                  <div
                    key={`${airport.city}-${airport.code}`}
                    onClick={() => selectAirport(airport)}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-blue-50/50 cursor-pointer transition-colors border border-transparent hover:border-blue-100"
                  >
                    <div className="flex items-center gap-3">
                      <BileoPlane className="w-4 h-4 text-gray-500 shrink-0" />
                      <div>
                        <div className="text-xs font-extrabold text-[#1E1B18] font-display">
                          {airport.city} - {airport.name}
                        </div>
                        <div className="text-[11px] text-gray-400">{airport.country}</div>
                      </div>
                    </div>
                    <span className="text-xs font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                      {airport.code}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Default Sections if input is empty or has recent */}
            {currentQuery.trim().length === 0 && (
              <>
                {/* Son Aramalar */}
                <div className="space-y-2">
                  <div className="text-[11px] font-black uppercase tracking-wider text-charcoal-muted">Son Aramalar</div>
                  <div
                    onClick={() => selectAirport({ city: 'İzmir', name: 'Adnan Menderes', code: 'ADB' })}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cream-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <BileoClock className="w-4 h-4 text-[#0a1172]" />
                      <div>
                        <div className="text-xs font-bold text-[#1E1B18]">İstanbul → İzmir</div>
                        <div className="text-[10px] text-charcoal-muted">28 Ağu</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-extrabold text-charcoal-muted bg-cream-200 px-2 py-0.5 rounded-md">IST-ADB</span>
                  </div>
                </div>

                {/* Yakındaki Havalimanları */}
                <div className="space-y-2 pt-2 border-t border-[#E8E1D5]">
                  <div className="text-[11px] font-black uppercase tracking-wider text-charcoal-muted">Yakındaki Havalimanları</div>
                  <div
                    onClick={() => selectAirport({ city: 'Adana', name: 'Adana Mersin Çukurova (COV)', code: 'COV' })}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-cream-100 cursor-pointer transition-colors"
                  >
                    <BileoPlane className="w-4 h-4 text-[#0a1172] shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-[#1E1B18]">Adana - Adana Mersin Çukurova (COV)</div>
                      <div className="text-[10px] text-charcoal-muted">Adana, Türkiye - Adana Mersin Çukurova Havalimanı (COV)</div>
                    </div>
                  </div>
                </div>

                {/* Popüler Şehirler */}
                <div className="space-y-2.5 pt-2 border-t border-[#E8E1D5]">
                  <div className="text-[11px] font-black uppercase tracking-wider text-charcoal-muted">Popüler Şehirler</div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_CHIPS.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => selectAirport({ city, name: city, code: 'TUR' })}
                        className="px-3 py-1.5 rounded-xl border border-[#E8E1D5] bg-[#FAF7F2] hover:bg-blue-50 hover:border-[#0a1172] text-xs font-bold text-charcoal transition-colors cursor-pointer shadow-2xs"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

          </div>
        )}

        {/* Passenger & Cabin Modal */}
        {showPassengerModal && (
          <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-3xl shadow-soft-xl border border-[#E8E1D5] p-5 z-50 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#1E1B18]">Yolcu Sayısı</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateSearchState({ passengerCount: Math.max(1, (searchState.passengerCount || 1) - 1) })}
                  className="w-8 h-8 rounded-xl bg-cream-100 hover:bg-cream-200 text-charcoal flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="text-sm font-black text-charcoal">{searchState.passengerCount || 1}</span>
                <button
                  type="button"
                  onClick={() => onUpdateSearchState({ passengerCount: Math.min(9, (searchState.passengerCount || 1) + 1) })}
                  className="w-8 h-8 rounded-xl bg-cream-100 hover:bg-cream-200 text-charcoal flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#E8E1D5]">
              <span className="text-xs font-extrabold text-[#1E1B18] block">Kabin Sınıfı</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCabinClass('Ekonomi')}
                  className={`py-2 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                    cabinClass === 'Ekonomi'
                      ? 'bg-[#0a1172] text-white shadow-2xs'
                      : 'bg-[#FAF7F2] text-charcoal hover:bg-cream-200 border border-[#E8E1D5]'
                  }`}
                >
                  Ekonomi
                </button>
                <button
                  type="button"
                  onClick={() => setCabinClass('Business')}
                  className={`py-2 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                    cabinClass === 'Business'
                      ? 'bg-[#0a1172] text-white shadow-2xs'
                      : 'bg-[#FAF7F2] text-charcoal hover:bg-cream-200 border border-[#E8E1D5]'
                  }`}
                >
                  Business
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 5. Sub-bar Checkbox: [ ] Sadece direkt uçuşlar */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={onlyDirect}
            onChange={(e) => {
              setOnlyDirect(e.target.checked);
              onUpdateSearchState({ onlyDirect: e.target.checked });
            }}
            className="w-4 h-4 rounded text-[#0a1172] accent-[#0a1172] cursor-pointer"
          />
          <span className="group-hover:text-gray-800 transition-colors font-medium">
            {searchState.transportType === 'ucak' ? 'Sadece direkt uçuşlar' : 'Sadece direkt seferler'}
          </span>
        </label>
        <span className="text-[11px] text-gray-400">
          Bileo Turizm, Belge No: 10357
        </span>
      </div>

    </div>
  );
};
