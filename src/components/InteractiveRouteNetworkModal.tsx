import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoPlane,
  BileoBus,
  BileoTrain,
} from './icons';
import { sound } from '../utils/sound';
import { SampleDataNotice } from './common/SampleDataNotice';
import { TransportType } from '../types';

interface InteractiveRouteNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (from: string, to: string, mode: TransportType) => void;
}

interface CorridorItem {
  id: string;
  name: string;
  region: string;
  from: string;
  to: string;
  dailyTrips: number;
  avgBusFare: string;
  avgYhtFare?: string;
  avgFlightFare?: string;
  durationBus: string;
  durationFast: string;
  bestMode: TransportType;
  highlightTag: string;
}

const CORRIDORS: CorridorItem[] = [
  {
    id: 'ist-ank',
    name: 'İstanbul ↔ Ankara Başkent Koridoru',
    region: 'Marmara – İç Anadolu',
    from: 'İstanbul',
    to: 'Ankara',
    dailyTrips: 52,
    avgBusFare: '450 ₺',
    avgYhtFare: '430 ₺',
    avgFlightFare: '1.200 ₺',
    durationBus: '5s 30dk',
    durationFast: '4s 15dk (YHT)',
    bestMode: 'tren',
    highlightTag: '⚡ En Popüler YHT Hattı',
  },
  {
    id: 'ist-izm',
    name: 'İstanbul ↔ İzmir Otoyol & Hava Koridoru',
    region: 'Marmara – Ege',
    from: 'İstanbul',
    to: 'İzmir',
    dailyTrips: 44,
    avgBusFare: '650 ₺',
    avgFlightFare: '1.350 ₺',
    durationBus: '4s 45dk (O-5)',
    durationFast: '1s 05dk (Uçak)',
    bestMode: 'otobus',
    highlightTag: '🌉 Osmangazi Ekspres',
  },
  {
    id: 'ist-ayt',
    name: 'İstanbul ↔ Antalya Akdeniz Hattı',
    region: 'Marmara – Akdeniz',
    from: 'İstanbul',
    to: 'Antalya',
    dailyTrips: 36,
    avgBusFare: '750 ₺',
    avgFlightFare: '1.450 ₺',
    durationBus: '9s 30dk',
    durationFast: '1s 15dk (Uçak)',
    bestMode: 'ucak',
    highlightTag: '🏖️ Yaz & Tatil Hattı',
  },
  {
    id: 'ank-izm',
    name: 'Ankara ↔ İzmir Ege Bağlantısı',
    region: 'İç Anadolu – Ege',
    from: 'Ankara',
    to: 'İzmir',
    dailyTrips: 28,
    avgBusFare: '550 ₺',
    avgFlightFare: '1.280 ₺',
    durationBus: '7s 45dk',
    durationFast: '1s 10dk (Uçak)',
    bestMode: 'otobus',
    highlightTag: '🚌 2+1 Süit Gece Seferleri',
  },
  {
    id: 'ank-kars',
    name: 'Ankara ↔ Kars Doğu Ekspresi Rotası',
    region: 'İç Anadolu – Doğu Anadolu',
    from: 'Ankara',
    to: 'Kars',
    dailyTrips: 2,
    avgBusFare: '900 ₺',
    avgYhtFare: '400 ₺ (Örtülü Kuşet)',
    avgFlightFare: '1.750 ₺',
    durationBus: '16s 00dk',
    durationFast: '26s 00dk (Masalsı Tren)',
    bestMode: 'tren',
    highlightTag: '❄️ Kültür & Manzara Treni',
  },
  {
    id: 'ist-esk',
    name: 'İstanbul ↔ Eskişehir Öğrenci & Kültür Hattı',
    region: 'Marmara – İç Anadolu',
    from: 'İstanbul',
    to: 'Eskişehir',
    dailyTrips: 34,
    avgBusFare: '380 ₺',
    avgYhtFare: '310 ₺',
    durationBus: '4s 15dk',
    durationFast: '2s 50dk (YHT)',
    bestMode: 'tren',
    highlightTag: '🎓 Genç & Hızlı Tren',
  },
];

export const InteractiveRouteNetworkModal: React.FC<InteractiveRouteNetworkModalProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
}) => {
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('ist-ank');

  if (!isOpen) return null;

  const current = CORRIDORS.find((c) => c.id === selectedCorridorId) || CORRIDORS[0];

  const handleSelectCorridor = (id: string) => {
    sound.playTick();
    setSelectedCorridorId(id);
  };

  const handleBook = (mode: TransportType) => {
    sound.playSuccess();
    if (onSelectRoute) {
      onSelectRoute(current.from, current.to, mode);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-bordeaux-50 text-bordeaux-900 flex items-center justify-center border border-bordeaux-200 text-lg font-black">
              🗺️
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Türkiye Ana Sefer & Rota Ağı Haritası (örnek)</h3>
              <p className="text-xs text-charcoal-muted font-medium">Büyük Şehirler Arası Sefer Sıklığı, Ortalama Fiyatlar & İdeal Ulaşım Modları</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        <SampleDataNotice />

        {/* Corridor Tabs */}
        <div className="px-6 py-3 bg-white/60 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {CORRIDORS.map((corridor) => (
            <button
              key={corridor.id}
              type="button"
              onClick={() => handleSelectCorridor(corridor.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedCorridorId === corridor.id
                  ? 'bg-bordeaux-900 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              {corridor.from} ↔ {corridor.to}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Corridor Detail Banner */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <span className="px-2.5 py-1 rounded-lg bg-bordeaux-50 text-bordeaux-900 text-xs font-black border border-bordeaux-200 inline-block">
                  {current.highlightTag}
                </span>
                <h4 className="text-xl font-black text-charcoal pt-1">{current.name}</h4>
                <p className="text-xs text-charcoal-muted font-semibold">📍 Bölge: {current.region} • Günde Ortalama <strong className="text-charcoal">{current.dailyTrips} Sefer</strong></p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBook(current.bestMode)}
                  className="px-4 py-2.5 rounded-xl bg-bordeaux-900 hover:bg-bordeaux-950 text-white font-black text-xs transition-colors cursor-pointer shadow-soft flex items-center gap-1.5"
                >
                  <span>Önerilen Modla Seferleri Bul</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mode Price & Duration Comparison Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
            
            {/* Bus Card */}
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <BileoBus className="w-4 h-4 text-bordeaux-700" />
                <h5 className="font-black text-charcoal">Otobüs Seferleri</h5>
              </div>
              <p className="text-sm font-black text-charcoal">{current.avgBusFare}</p>
              <p className="text-charcoal-muted font-medium">⏱️ Süre: {current.durationBus}</p>
              <button
                type="button"
                onClick={() => handleBook('otobus')}
                className="w-full py-2 mt-1 rounded-xl bg-cream-50 hover:bg-cream-100 border border-[#E8E1D5] font-black text-[11px] text-charcoal hover:text-bordeaux-900 transition-colors cursor-pointer"
              >
                Otobüs Bileti Seç →
              </button>
            </div>

            {/* YHT / Train Card */}
            {current.avgYhtFare ? (
              <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <BileoTrain className="w-4 h-4 text-emerald-700" />
                  <h5 className="font-black text-charcoal">YHT & Tren</h5>
                </div>
                <p className="text-sm font-black text-emerald-900">{current.avgYhtFare}</p>
                <p className="text-charcoal-muted font-medium">⏱️ Süre: {current.durationFast}</p>
                <button
                  type="button"
                  onClick={() => handleBook('tren')}
                  className="w-full py-2 mt-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-black text-[11px] text-emerald-900 transition-colors cursor-pointer"
                >
                  Tren Bileti Seç →
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white/60 border border-[#E8E1D5] space-y-2 opacity-60 flex flex-col justify-center text-center">
                <span className="text-xs font-bold text-charcoal-muted">Bu Rotada Doğrudan Raylı Sistem Yok</span>
              </div>
            )}

            {/* Flight Card */}
            {current.avgFlightFare ? (
              <div className="p-4 rounded-2xl bg-white border border-sky-200 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <BileoPlane className="w-4 h-4 text-sky-700" />
                  <h5 className="font-black text-charcoal">Uçak Seferleri</h5>
                </div>
                <p className="text-sm font-black text-sky-900">{current.avgFlightFare}</p>
                <p className="text-charcoal-muted font-medium">⏱️ Süre: {current.durationFast}</p>
                <button
                  type="button"
                  onClick={() => handleBook('ucak')}
                  className="w-full py-2 mt-1 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 font-black text-[11px] text-sky-900 transition-colors cursor-pointer"
                >
                  Uçak Bileti Seç →
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white/60 border border-[#E8E1D5] space-y-2 opacity-60 flex flex-col justify-center text-center">
                <span className="text-xs font-bold text-charcoal-muted">Kısa Mesafe (Uçuş Bulunmuyor)</span>
              </div>
            )}

          </div>

          {/* Verification Badge */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-center justify-between text-xs text-charcoal-muted font-medium">
            <div className="flex items-center gap-2">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Bu haritadaki sefer sıklığı ve ortalama fiyatlar temsili örneklerdir; canlı bir veri kaynağına bağlı değildir.</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
