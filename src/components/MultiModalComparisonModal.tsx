import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoPlane,
  BileoBus,
  BileoTrain,
} from './icons';
import { sound } from '../utils/sound';
import { TransportType } from '../types';

interface MultiModalComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (from: string, to: string, mode: TransportType) => void;
}

interface RouteComparisonItem {
  id: string;
  corridor: string;
  fromCity: string;
  toCity: string;
  bus: {
    price: number;
    nominalDuration: string;
    doorToDoorDuration: string;
    co2: number;
    comfort: string;
    pros: string;
  };
  train: {
    price: number;
    nominalDuration: string;
    doorToDoorDuration: string;
    co2: number;
    comfort: string;
    pros: string;
  };
  plane: {
    price: number;
    nominalDuration: string;
    doorToDoorDuration: string;
    co2: number;
    comfort: string;
    pros: string;
  };
  ferry?: {
    price: number;
    nominalDuration: string;
    doorToDoorDuration: string;
    co2: number;
    comfort: string;
    pros: string;
  };
  bestChoice: 'train' | 'bus' | 'plane';
  bestReason: string;
}

const COMPARISON_CORRIDORS: RouteComparisonItem[] = [
  {
    id: 'ist-ank',
    corridor: 'İstanbul ↔ Ankara',
    fromCity: 'İstanbul',
    toCity: 'Ankara',
    bus: {
      price: 450,
      nominalDuration: '5 sa 30 dk',
      doorToDoorDuration: '6 sa 15 dk',
      co2: 19,
      comfort: '2+1 Geniş Koltuk & Mola',
      pros: 'Her 15 dakikada bir 24 saat kesintisiz sefer sıklığı',
    },
    train: {
      price: 540,
      nominalDuration: '4 sa 15 dk',
      doorToDoorDuration: '4 sa 45 dk',
      co2: 7,
      comfort: 'Geniş Masa, Priz, Wi-Fi & Kesintisiz Çalışma',
      pros: 'Şehir merkezinden merkeze (Söğütlüçeşme ↔ Ankara Garı), sıfır güvenlik kuyruğu',
    },
    plane: {
      price: 1350,
      nominalDuration: '1 sa 05 dk',
      doorToDoorDuration: '3 sa 45 dk (Havalimanı + Transfer Dahil)',
      co2: 74,
      comfort: 'Hızlı uçuş',
      pros: 'Saf uçuş süresi çok kısa; acil iş seyahatleri için ideal',
    },
    bestChoice: 'train',
    bestReason: '🏆 YHT Hızlı Tren kapıdan kapıya sürede uçağa en yakın, konforda ve karbon ayak izinde açık ara 1. sıradadır.',
  },
  {
    id: 'ist-izm',
    corridor: 'İstanbul ↔ İzmir',
    fromCity: 'İstanbul',
    toCity: 'İzmir',
    bus: {
      price: 650,
      nominalDuration: '5 sa 00 dk (O-5 Otoyolu)',
      doorToDoorDuration: '5 sa 40 dk',
      co2: 24,
      comfort: 'O-5 Ekspres & Oksijen Mola',
      pros: 'Osmangazi Köprüsü üzerinden kesintisiz otoyol konforu',
    },
    train: {
      price: 380,
      nominalDuration: '9 sa (Ege Ekspresi)',
      doorToDoorDuration: '9 sa 30 dk',
      co2: 12,
      comfort: 'Nostaljik Seyahat',
      pros: 'Ekonomik bilet ve manzara sevenler için keyifli',
    },
    plane: {
      price: 1450,
      nominalDuration: '1 sa 10 dk',
      doorToDoorDuration: '3 sa 30 dk',
      co2: 79,
      comfort: 'Jet Uçuş',
      pros: 'Adnan Menderes - İZBAN raylı aktarma kolaylığı',
    },
    bestChoice: 'bus',
    bestReason: '🏆 O-5 Otoyolu ile otobüs seferleri 5 saatte doğrudan şehir merkezine ulaşarak fiyat/performans lideridir.',
  },
  {
    id: 'ist-ant',
    corridor: 'İstanbul ↔ Antalya',
    fromCity: 'İstanbul',
    toCity: 'Antalya',
    bus: {
      price: 750,
      nominalDuration: '9 sa 30 dk',
      doorToDoorDuration: '10 sa 15 dk',
      co2: 35,
      comfort: '2+1 Gece Otobüsü',
      pros: 'Akşam binip sabah Akdeniz’de uyanma avantajı',
    },
    train: {
      price: 490,
      nominalDuration: 'Kombine (YHT + Otobüs)',
      doorToDoorDuration: '8 sa 00 dk',
      co2: 18,
      comfort: 'Eskişehir/Konya Aktarmalı',
      pros: 'TCDD kombine güzergah indirimi',
    },
    plane: {
      price: 1550,
      nominalDuration: '1 sa 15 dk',
      doorToDoorDuration: '3 sa 30 dk',
      co2: 88,
      comfort: 'Direkt Uçuş',
      pros: 'Tatil süresini maksimuma çıkarma ve sıfır yorgunluk',
    },
    bestChoice: 'plane',
    bestReason: '🏆 700+ km uzun mesafede uçak seferleri 7 saatlik net zaman tasarrufu sağlar.',
  },
];

export const MultiModalComparisonModal: React.FC<MultiModalComparisonModalProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
}) => {
  const [selectedId, setSelectedId] = useState<string>('ist-ank');

  if (!isOpen) return null;

  const current = COMPARISON_CORRIDORS.find((c) => c.id === selectedId) || COMPARISON_CORRIDORS[0];

  const handleSelectCorridor = (id: string) => {
    sound.playTick();
    setSelectedId(id);
  };

  const handleBook = (mode: TransportType) => {
    sound.playSuccess();
    if (onSelectRoute) {
      onSelectRoute(current.fromCity, current.toCity, mode);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-bordeaux-50 text-bordeaux-800 flex items-center justify-center border border-bordeaux-200 text-lg font-black">
              ⚖️
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Sefer Karşılaştırma & Seyahat Modu Optimizatörü</h3>
              <p className="text-xs text-charcoal-muted font-medium">Uçak, YHT, Otobüs ve Feribot Arasında Fiyat, Süre ve Karbon Analizi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Corridor Tabs */}
        <div className="px-6 py-3 bg-white/60 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {COMPARISON_CORRIDORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelectCorridor(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedId === c.id
                  ? 'bg-bordeaux-700 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              {c.corridor}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Smart Decision Recommendation Box */}
          <div className="p-4.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 flex items-start gap-3 shadow-2xs">
            <span className="text-xl flex-shrink-0 mt-0.5">💡</span>
            <div>
              <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block mb-0.5">
                BİLEO AKILLI SEYAHAT TAVSİYESİ
              </span>
              <p className="text-xs font-bold leading-relaxed">{current.bestReason}</p>
            </div>
          </div>

          {/* 3-Way Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            {/* Train Column */}
            <div className="p-4.5 rounded-2xl bg-white border border-[#E8E1D5] space-y-3 shadow-2xs flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BileoTrain className="w-5 h-5 text-bordeaux-700" />
                    <h4 className="text-sm font-black text-charcoal">TCDD YHT / Tren</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-200">
                    🌱 En Çevreci
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-cream-50 space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-charcoal-muted">Bilet Fiyatı:</span>
                    <span className="text-bordeaux-700 font-black">{current.train.price} ₺</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-charcoal-muted">Sefer Süresi:</span>
                    <span className="text-charcoal">{current.train.nominalDuration}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-charcoal-muted">Kapıdan Kapıya:</span>
                    <span className="text-charcoal font-black">{current.train.doorToDoorDuration}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-charcoal-muted">CO₂ Salımı:</span>
                    <span className="text-emerald-700 font-black">{current.train.co2} kg</span>
                  </div>
                </div>

                <p className="text-[11px] text-charcoal-muted font-medium leading-relaxed">
                  ✓ {current.train.pros}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleBook('tren')}
                className="w-full py-2.5 rounded-xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white font-black text-xs transition-colors cursor-pointer shadow-soft mt-2"
              >
                YHT Seferlerini Listele
              </button>
            </div>

            {/* Bus Column */}
            <div className="p-4.5 rounded-2xl bg-white border border-[#E8E1D5] space-y-3 shadow-2xs flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BileoBus className="w-5 h-5 text-indigo-700" />
                    <h4 className="text-sm font-black text-charcoal">Otobüs Seferi</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 text-[10px] font-black border border-indigo-200">
                    💰 En Ekonomik
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-cream-50 space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-charcoal-muted">Bilet Fiyatı:</span>
                    <span className="text-indigo-800 font-black">{current.bus.price} ₺</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-charcoal-muted">Sefer Süresi:</span>
                    <span className="text-charcoal">{current.bus.nominalDuration}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-charcoal-muted">Kapıdan Kapıya:</span>
                    <span className="text-charcoal font-black">{current.bus.doorToDoorDuration}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-charcoal-muted">CO₂ Salımı:</span>
                    <span className="text-charcoal font-black">{current.bus.co2} kg</span>
                  </div>
                </div>

                <p className="text-[11px] text-charcoal-muted font-medium leading-relaxed">
                  ✓ {current.bus.pros}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleBook('otobus')}
                className="w-full py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-black text-xs transition-colors cursor-pointer shadow-soft mt-2"
              >
                Otobüs Seferlerini Listele
              </button>
            </div>

            {/* Plane Column */}
            <div className="p-4.5 rounded-2xl bg-white border border-[#E8E1D5] space-y-3 shadow-2xs flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BileoPlane className="w-5 h-5 text-amber-700" />
                    <h4 className="text-sm font-black text-charcoal">Uçak Seferi</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 text-[10px] font-black border border-amber-200">
                    ⚡ En Hızlı Uçuş
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-cream-50 space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-charcoal-muted">Bilet Fiyatı:</span>
                    <span className="text-amber-800 font-black">{current.plane.price} ₺</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-charcoal-muted">Saf Uçuş:</span>
                    <span className="text-charcoal">{current.plane.nominalDuration}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-charcoal-muted">Kapıdan Kapıya:</span>
                    <span className="text-charcoal font-black">{current.plane.doorToDoorDuration}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-charcoal-muted">CO₂ Salımı:</span>
                    <span className="text-rose-700 font-black">{current.plane.co2} kg</span>
                  </div>
                </div>

                <p className="text-[11px] text-charcoal-muted font-medium leading-relaxed">
                  ✓ {current.plane.pros}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleBook('ucak')}
                className="w-full py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-black text-xs transition-colors cursor-pointer shadow-soft mt-2"
              >
                Uçak Seferlerini Listele
              </button>
            </div>

          </div>

          {/* Door-to-Door Truth Transparency Callout */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] flex items-start gap-2.5 shadow-2xs">
            <BileoShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-black text-charcoal uppercase tracking-wider block mb-0.5">
                Dürüst Kapıdan Kapıya Seyahat Süresi Metodolojisi
              </span>
              <p className="text-xs text-charcoal-muted font-medium leading-relaxed">
                Bileo, sadece taşıt içindeki nominal süreyi değil; havalimanı güvenlik/bagaj teslimi, şehir merkezi transfer süreleri ve servis bekleme sürelerini gerçekçi olarak hesaplar.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
