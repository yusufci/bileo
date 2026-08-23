import React, { useState, useMemo } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoSearch,
  BileoBus,
  BileoTrain,
  BileoPlane,
  BileoFerry,
  BileoArrowRight,
} from './icons';
import { sound } from '../utils/sound';
import { TURKEY_81_PROVINCES, ProvinceTransitInfo } from '../data/turkeyProvinces';
import { TransportType } from '../types';

interface AllProvincesTransitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (from: string, to: string, mode: TransportType) => void;
}

const REGIONS = [
  'Tümü (81 İl)',
  'Marmara',
  'Ege',
  'Akdeniz',
  'İç Anadolu',
  'Karadeniz',
  'Doğu Anadolu',
  'Güneydoğu Anadolu',
];

export const AllProvincesTransitModal: React.FC<AllProvincesTransitModalProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Tümü (81 İl)');
  const [selectedProvince, setSelectedProvince] = useState<ProvinceTransitInfo | null>(null);

  const filteredProvinces = useMemo(() => {
    return TURKEY_81_PROVINCES.filter((p) => {
      const matchesRegion =
        selectedRegion === 'Tümü (81 İl)' || p.region === selectedRegion;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesRegion;

      const plateStr = p.plate < 10 ? `0${p.plate}` : `${p.plate}`;
      const matchesPlate = plateStr === q || `${p.plate}` === q;
      const matchesName = p.name.toLowerCase().includes(q);
      const matchesAirport = p.airports?.some(
        (a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
      );
      const matchesTerminal = p.terminals.some((t) => t.toLowerCase().includes(q));

      return matchesRegion && (matchesPlate || matchesName || matchesAirport || matchesTerminal);
    });
  }, [searchQuery, selectedRegion]);

  if (!isOpen) return null;

  const handleRegionClick = (region: string) => {
    sound.playTick();
    setSelectedRegion(region);
  };

  const handleSelectProvince = (prov: ProvinceTransitInfo) => {
    sound.playTick();
    setSelectedProvince(prov);
  };

  const handleSearchFromCity = (cityName: string, targetCity: string = 'İstanbul', mode: TransportType = 'otobus') => {
    sound.playSuccess();
    if (onSelectRoute) {
      onSelectRoute(cityName, targetCity, mode);
    }
    onClose();
  };

  const handleSearchToCity = (cityName: string, fromCity: string = 'İstanbul', mode: TransportType = 'otobus') => {
    sound.playSuccess();
    if (onSelectRoute) {
      onSelectRoute(fromCity, cityName, mode);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-bordeaux-50 text-bordeaux-900 flex items-center justify-center border border-bordeaux-200 text-lg font-black">
              🇹🇷
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Türkiye 81 İl Ulaşım & Terminal Rehberi</h3>
              <p className="text-xs text-charcoal-muted font-medium">Bütün İllerin Otogarları, Havalimanları (IATA), Gar ve İskeleleri</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Region Filter Bar */}
        <div className="p-4 bg-white/80 border-b border-[#E8E1D5] space-y-3 flex-shrink-0">
          {/* Search Input */}
          <div className="relative">
            <BileoSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="İl adı (ör. Adana, İzmir), plaka kodu (ör. 34, 06) veya havalimanı IATA kodu (ör. IST, ESB, AYT) arayın..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] text-xs font-bold text-charcoal placeholder:text-charcoal-muted/70 focus:outline-none focus:border-bordeaux-600 transition-colors"
            />
          </div>

          {/* Region Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {REGIONS.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => handleRegionClick(region)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  selectedRegion === region
                    ? 'bg-bordeaux-900 text-white shadow-soft'
                    : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Selected Province Detailed Spotlight Banner */}
          {selectedProvince && (
            <div className="p-5 rounded-3xl bg-white border border-bordeaux-200 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8E1D5]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-bordeaux-900 text-white flex items-center justify-center font-black text-xl shadow-soft">
                    {selectedProvince.plate < 10 ? `0${selectedProvince.plate}` : selectedProvince.plate}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-charcoal">{selectedProvince.name}</h4>
                    <span className="text-xs font-bold text-bordeaux-700">{selectedProvince.region} Bölgesi</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSearchFromCity(selectedProvince.name)}
                    className="px-3.5 py-2 rounded-xl bg-bordeaux-900 hover:bg-bordeaux-950 text-white font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{selectedProvince.name}'den Sefer Ara</span>
                    <BileoArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSearchToCity(selectedProvince.name)}
                    className="px-3.5 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 border border-[#E8E1D5] text-charcoal font-black text-xs transition-colors cursor-pointer"
                  >
                    <span>{selectedProvince.name}'e Git</span>
                  </button>
                </div>
              </div>

              {/* Transit Hubs Grid for Selected City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                
                {/* Otogarlar */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-black text-charcoal">
                    <BileoBus className="w-4 h-4 text-bordeaux-700" />
                    <span>Otogarlar</span>
                  </div>
                  <ul className="space-y-1 text-charcoal-muted font-semibold text-[11px]">
                    {selectedProvince.terminals.map((t, idx) => (
                      <li key={idx} className="truncate">• {t}</li>
                    ))}
                  </ul>
                </div>

                {/* Havalimanları */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-black text-charcoal">
                    <BileoPlane className="w-4 h-4 text-sky-700" />
                    <span>Havalimanları</span>
                  </div>
                  {selectedProvince.airports && selectedProvince.airports.length > 0 ? (
                    <ul className="space-y-1 text-charcoal-muted font-semibold text-[11px]">
                      {selectedProvince.airports.map((a, idx) => (
                        <li key={idx} className="truncate">
                          • {a.name} <strong className="text-sky-900">({a.code})</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-charcoal-muted/70 italic">Havalimanı bulunmuyor (En yakın havalimanı transferi mevcut)</p>
                  )}
                </div>

                {/* Tren İstasyonları */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-black text-charcoal">
                    <BileoTrain className="w-4 h-4 text-emerald-700" />
                    <span>Gar & Raylı Sistem</span>
                  </div>
                  {selectedProvince.trainStations && selectedProvince.trainStations.length > 0 ? (
                    <ul className="space-y-1 text-charcoal-muted font-semibold text-[11px]">
                      {selectedProvince.trainStations.map((g, idx) => (
                        <li key={idx} className="truncate">• {g}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-charcoal-muted/70 italic">Demiryolu hattı bulunmuyor</p>
                  )}
                </div>

                {/* Feribot & Deniz Ulaşımı */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-black text-charcoal">
                    <BileoFerry className="w-4 h-4 text-cyan-700" />
                    <span>Deniz & Feribot</span>
                  </div>
                  {selectedProvince.ferryPorts && selectedProvince.ferryPorts.length > 0 ? (
                    <ul className="space-y-1 text-charcoal-muted font-semibold text-[11px]">
                      {selectedProvince.ferryPorts.map((f, idx) => (
                        <li key={idx} className="truncate">• {f}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-charcoal-muted/70 italic">Deniz kıyısı bulunmuyor</p>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Grid of All 81 Provinces */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProvinces.map((prov) => (
              <div
                key={prov.plate}
                onClick={() => handleSelectProvince(prov)}
                className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-soft flex items-center justify-between ${
                  selectedProvince?.plate === prov.plate
                    ? 'border-bordeaux-900 bg-bordeaux-50/40 ring-2 ring-bordeaux-900/10'
                    : 'border-[#E8E1D5] hover:border-bordeaux-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] font-black text-xs text-charcoal flex items-center justify-center">
                    {prov.plate < 10 ? `0${prov.plate}` : prov.plate}
                  </span>
                  <div>
                    <h5 className="font-black text-charcoal text-sm">{prov.name}</h5>
                    <p className="text-[10px] text-charcoal-muted font-bold">{prov.region}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  {prov.airports && <span title="Havalimanı Var">✈️</span>}
                  {prov.trainStations && <span title="Tren Garı Var">🚄</span>}
                  {prov.ferryPorts && <span title="Feribot Var">🚢</span>}
                  <span title="Otogar Var">🚌</span>
                </div>
              </div>
            ))}
          </div>

          {/* Verification Badge */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-center justify-between text-xs text-charcoal-muted font-medium">
            <div className="flex items-center gap-2">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Tüm 81 ilin resmi terminal ve IATA havalimanı verileri entegre edilmiştir.</span>
            </div>
            <span className="text-[11px] font-bold text-charcoal">Toplam {TURKEY_81_PROVINCES.length} İl</span>
          </div>

        </div>

      </div>
    </div>
  );
};
