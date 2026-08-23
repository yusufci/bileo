import React, { useState } from 'react';
import {
  BileoClose,
  BileoTrain,
  BileoPlane,
  BileoBus,
  BileoCheck,
  BileoCompass,
} from './icons';
import { sound } from '../utils/sound';

import { TransportType } from '../types';

interface TravelGuidesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (from: string, to: string, mode: TransportType) => void;
}

interface DestinationGuide {
  id: string;
  destination: string;
  tag: string;
  recommendedMode: TransportType;
  fromCity: string;
  toCity: string;
  duration: string;
  budgetEst: string;
  highlights: string[];
  transitTip: string;
  bestSeason: string;
}

const DESTINATION_GUIDES: DestinationGuide[] = [
  {
    id: 'eskisehir-yht',
    destination: 'Eskişehir — Kültür & Venedik Esintisi',
    tag: 'TCDD YHT İle 2.5 Saatte Hızlı Kaçamak',
    recommendedMode: 'tren',
    fromCity: 'İstanbul',
    toCity: 'Eskişehir',
    duration: '2 sa 45 dk (YHT)',
    budgetEst: '1.200 - 2.500 TL (Hafta Sonu)',
    highlights: ['Odunpazarı Tarihi Evleri', 'Porsuk Çayı Gondol Turu', 'Sazova Bilim & Kültür Parkı', 'Balmumu Heykel Müzesi'],
    transitTip: 'İstanbul Söğütlüçeşme veya Ankara Gar\'dan her saat başı kalkan YHT ile doğrudan merkezdeki Eskişehir Garı\'na inip yürüyerek şehri gezebilirsiniz.',
    bestSeason: 'İlkbahar & Sonbahar',
  },
  {
    id: 'kapadokya-bus-plane',
    destination: 'Kapadokya — Masalsı Peri Bacaları',
    tag: 'Nevşehir/Kayseri Aktarmalı Gezi',
    recommendedMode: 'ucak',
    fromCity: 'İstanbul',
    toCity: 'Nevşehir',
    duration: '1 sa 15 dk Uçuş + 30 dk Servis',
    budgetEst: '4.500 - 9.000 TL (3 Günlük)',
    highlights: ['Göreme Açık Hava Müzesi', 'Sıcak Hava Balon Turu', 'Derinkuyu Yeraltı Şehri', 'Uçhisar Kalesi'],
    transitTip: 'Nevşehir Kapadokya (NAV) veya Kayseri (ASR) havalimanlarından Göreme/Ürgüp bölgesine Havaş ve otel servisleri mevcuttur.',
    bestSeason: 'Eylül - Kasım / Nisan - Haziran',
  },
  {
    id: 'kas-kalkan',
    destination: 'Kaş & Kalkan — Turkuaz Akdeniz',
    tag: 'Fethiye veya Antalya Otogar Üzerinden',
    recommendedMode: 'otobus',
    fromCity: 'İzmir',
    toCity: 'Antalya',
    duration: '6 sa 30 dk Otobüs',
    budgetEst: '5.000 - 12.000 TL (Yaz Sezonu)',
    highlights: ['Kaputaş Plajı & Patara Kum Tepeleri', 'Kekova Batık Şehir Tekne Turu', 'Meis Adası Günübirlik Geçiş', 'Antik Tiyatro Günbatımı'],
    transitTip: 'Antalya veya Fethiye otogarından her 45 dakikada bir kalkan sahil minibüsleriyle Kaş Otogarı\'na ulaşabilirsiniz.',
    bestSeason: 'Mayıs - Ekim Arası',
  },
  {
    id: 'karadeniz-ayder',
    destination: 'Rize Ayder & Fırtına Vadisi',
    tag: 'Rize-Artvin Havalimanı (RZV) İle Kolay Ulaşım',
    recommendedMode: 'ucak',
    fromCity: 'İstanbul',
    toCity: 'Rize',
    duration: '1 sa 50 dk Uçak + 50 dk Havaş',
    budgetEst: '4.000 - 8.000 TL (Doğa Turu)',
    highlights: ['Ayder Yaylası & Kaplıcalar', 'Zilkale & Palovit Şelalesi', 'Fırtına Deresi Rafting', 'Pokut & Sal Yaylası Bulut Denizi'],
    transitTip: 'Deniz dolgusu üzerine inşa edilen Rize-Artvin Havalimanı (RZV) çıkışında Havaş servisleri Çamlıhemşin ve Ayder güzergahına düzenli sefer yapar.',
    bestSeason: 'Haziran - Eylül',
  },
];

export const TravelGuidesModal: React.FC<TravelGuidesModalProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
}) => {
  const [selectedId, setSelectedId] = useState<string>('eskisehir-yht');

  if (!isOpen) return null;

  const current = DESTINATION_GUIDES.find((g) => g.id === selectedId) || DESTINATION_GUIDES[0];

  const handleSelect = (id: string) => {
    sound.playTick();
    setSelectedId(id);
  };

  const handleBookRoute = () => {
    sound.playSuccess();
    if (onSelectRoute) {
      onSelectRoute(current.fromCity, current.toCity, current.recommendedMode);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center border border-amber-200">
              <BileoCompass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Popüler Rotalar & Tatil Gezi Rehberi</h3>
              <p className="text-xs text-charcoal-muted font-medium">Türkiye’nin En Sevilen Kaçış Rotaları, Gezilecek Yerler ve Ulaşım İpuçları</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Destination Tabs */}
        <div className="px-6 py-3 bg-white/50 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {DESTINATION_GUIDES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => handleSelect(g.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedId === g.id
                  ? 'bg-bordeaux-700 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              {g.destination.split('—')[0].trim()}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Hero Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950 via-bordeaux-900 to-indigo-950 text-white shadow-soft relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest block">
                {current.tag}
              </span>
              <h4 className="text-xl sm:text-2xl font-black font-display">{current.destination}</h4>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-xs text-[11px] font-bold">
                  {current.duration}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-xs text-[11px] font-bold">
                  {current.budgetEst}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-xs text-[11px] font-bold">
                  {current.bestSeason}
                </span>
              </div>
            </div>
          </div>

          {/* Highlights Checklist */}
          <div className="space-y-3">
            <span className="text-[11px] font-black text-charcoal uppercase tracking-wider block">
              Mutlaka Görülmesi & Deneyimlenmesi Gerekenler
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {current.highlights.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-[#E8E1D5] text-xs font-bold text-charcoal shadow-2xs"
                >
                  <BileoCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transit Advice Box */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-1">
            <span className="text-[10px] font-black text-emerald-900 uppercase tracking-wider block mb-0.5">
              Yerel Ulaşım & Aktarma İpucu
            </span>
            <p className="text-xs text-emerald-950 font-medium leading-relaxed">
              {current.transitTip}
            </p>
          </div>

          {/* 1-Click Action to Book Search */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div>
              <h5 className="text-sm font-black text-charcoal">{current.fromCity} → {current.toCity} Seferlerini Karşılaştır</h5>
              <p className="text-xs text-charcoal-muted font-medium mt-0.5">En uygun bilet fiyatları ve kalkış saatleriyle yerinizi ayırtın.</p>
            </div>
            <button
              type="button"
              onClick={handleBookRoute}
              className="px-5 py-2.5 rounded-xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-soft flex items-center gap-1.5"
            >
              {current.recommendedMode === 'tren' ? <BileoTrain className="w-4 h-4" /> : current.recommendedMode === 'ucak' ? <BileoPlane className="w-4 h-4" /> : <BileoBus className="w-4 h-4" />}
              <span>Seferleri Listele</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
