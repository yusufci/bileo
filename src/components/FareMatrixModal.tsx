import React, { useState } from 'react';
import {
  BileoClose,
  BileoBus,
  BileoPlane,
  BileoTrain,
  BileoFerry,
  BileoArrowRight,
  BileoShieldCheck,
} from './icons';
import { TransportType } from '../types';
import { SampleDataNotice } from './common/SampleDataNotice';

interface RouteComparisonItem {
  id: string;
  from: string;
  to: string;
  modes: {
    type: TransportType;
    duration: string;
    avgPrice: string;
    comfort: string;
    co2Kg: number;
    luggage: string;
    bestFor: string;
  }[];
}

const COMPARISON_DATA: RouteComparisonItem[] = [
  {
    id: 'ist-ank',
    from: 'İstanbul',
    to: 'Ankara',
    modes: [
      {
        type: 'tren',
        duration: '4s 15dk',
        avgPrice: '450 - 680 TL',
        comfort: 'Geniş bacak mesafesi, yemekli vagon, priz & Wi-Fi',
        co2Kg: 12,
        luggage: '30 KG Ücretsiz',
        bestFor: 'En Çevre Dostu & Şehir Merkezinden Merkeze',
      },
      {
        type: 'ucak',
        duration: '1s 05dk (+1s havalimanı)',
        avgPrice: '950 - 1.850 TL',
        comfort: 'Hızlı uçuş, lounge erişimi, ikram',
        co2Kg: 78,
        luggage: '15 - 20 KG',
        bestFor: 'Acil İş Seyahatleri',
      },
      {
        type: 'otobus',
        duration: '5s 30dk',
        avgPrice: '480 - 650 TL',
        comfort: '2+1 Tekli Koltuk, Android multimedya, mola tesisi',
        co2Kg: 28,
        luggage: '30 KG Ücretsiz',
        bestFor: 'Ekonomik & Gece Seferleri',
      },
    ],
  },
  {
    id: 'ist-izm',
    from: 'İstanbul',
    to: 'İzmir',
    modes: [
      {
        type: 'ucak',
        duration: '1s 10dk',
        avgPrice: '850 - 1.750 TL',
        comfort: 'Hızlı ulaşım, doğrudan Adnan Menderes varış',
        co2Kg: 85,
        luggage: '15 - 20 KG',
        bestFor: 'En Hızlı Ulaşım',
      },
      {
        type: 'otobus',
        duration: '5s 15dk (Osmangazi Köprüsü)',
        avgPrice: '520 - 750 TL',
        comfort: '2+1 Jumbo Koltuk, USB şarj, ikram',
        co2Kg: 32,
        luggage: '30 KG',
        bestFor: 'Konforlu & Esnek Saatler',
      },
      {
        type: 'feribot',
        duration: '1s 45dk (Yalova / Bandırma Transfer)',
        avgPrice: '380 - 550 TL',
        comfort: 'Deniz manzarası, araçlı transfer, kafe',
        co2Kg: 22,
        luggage: 'Sınırsız',
        bestFor: 'Araçlı & Manzaralı Yolculuk',
      },
    ],
  },
  {
    id: 'ist-bur',
    from: 'İstanbul',
    to: 'Bursa',
    modes: [
      {
        type: 'feribot',
        duration: '1s 35dk (İDO / BUDO)',
        avgPrice: '260 - 380 TL',
        comfort: 'Deniz otobüsü, doğrudan Mudanya iskelesi',
        co2Kg: 14,
        luggage: '30 KG',
        bestFor: 'Trafiksiz & En Hızlı',
      },
      {
        type: 'otobus',
        duration: '2s 00dk',
        avgPrice: '250 - 350 TL',
        comfort: '2+1 Rahat Koltuk, Osmangazi Köprü geçişi',
        co2Kg: 18,
        luggage: '30 KG',
        bestFor: 'Şehirlerarası Otogar Bağlantısı',
      },
    ],
  },
];

interface FareMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRouteMode?: (from: string, to: string, mode: TransportType) => void;
}

export const FareMatrixModal: React.FC<FareMatrixModalProps> = ({
  isOpen,
  onClose,
  onSelectRouteMode,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ist-ank');

  if (!isOpen) return null;

  const currentRoute = COMPARISON_DATA.find((r) => r.id === selectedRouteId) || COMPARISON_DATA[0];

  const getModeIcon = (type: TransportType) => {
    switch (type) {
      case 'otobus':
        return <BileoBus className="w-5 h-5 text-amber-700" />;
      case 'ucak':
        return <BileoPlane className="w-5 h-5 text-blue-700" />;
      case 'tren':
        return <BileoTrain className="w-5 h-5 text-emerald-700" />;
      case 'feribot':
        return <BileoFerry className="w-5 h-5 text-cyan-700" />;
    }
  };

  const getModeTitle = (type: TransportType) => {
    switch (type) {
      case 'otobus':
        return '2+1 Otobüs';
      case 'ucak':
        return 'Uçak (Direkt)';
      case 'tren':
        return 'YHT Yüksek Hızlı Tren';
      case 'feribot':
        return 'Hızlı Deniz Otobüsü';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-black text-[#1E1B18] font-display">Çok Modlu Ulaşım & Fiyat Karşılaştırması (örnek)</h3>
            <p className="text-xs text-charcoal-muted font-medium">Temsili süre, bilet fiyatı, bagaj ve karbon salınımı karşılaştırma tablosu</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        <SampleDataNotice />

        {/* Route Selector Tabs */}
        <div className="px-6 py-3.5 bg-white/60 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto flex-shrink-0">
          {COMPARISON_DATA.map((route) => (
            <button
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                selectedRouteId === route.id
                  ? 'bg-bordeaux-700 text-white shadow-2xs'
                  : 'bg-white hover:bg-cream-100 text-charcoal border border-[#E8E1D5]'
              }`}
            >
              <span>{route.from}</span>
              <BileoArrowRight className="w-3.5 h-3.5" />
              <span>{route.to}</span>
            </button>
          ))}
        </div>

        {/* Comparison Cards Grid */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentRoute.modes.map((mode, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-[#E8E1D5] shadow-soft flex flex-col justify-between space-y-4 hover:border-bordeaux-700/50 transition-all"
              >
                <div>
                  {/* Top Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] flex items-center justify-center">
                      {getModeIcon(mode.type)}
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 uppercase">
                      {mode.bestFor}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-[#1E1B18] font-display">{getModeTitle(mode.type)}</h4>
                  
                  {/* Metrics */}
                  <div className="mt-3 space-y-2 text-xs border-y border-[#E8E1D5]/60 py-3">
                    <div className="flex justify-between items-center">
                      <span className="text-charcoal-muted font-bold">Seyahat Süresi:</span>
                      <span className="font-black text-charcoal">{mode.duration}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-charcoal-muted font-bold">Ortalama Fiyat:</span>
                      <span className="font-black text-bordeaux-700 font-display text-sm">{mode.avgPrice}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-charcoal-muted font-bold">Ücretsiz Bagaj:</span>
                      <span className="font-bold text-charcoal">{mode.luggage}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-charcoal-muted font-bold">CO2 Karbon İzi:</span>
                      <span className="font-bold text-emerald-700">{mode.co2Kg} kg / yolcu</span>
                    </div>
                  </div>

                  <p className="text-xs text-charcoal-muted mt-3 leading-relaxed font-medium">
                    {mode.comfort}
                  </p>
                </div>

                {onSelectRouteMode && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectRouteMode(currentRoute.from, currentRoute.to, mode.type);
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>Seferleri Listele</span>
                    <BileoArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Environmental Insight */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center gap-3">
            <BileoShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0" />
            <p className="text-xs text-emerald-950 font-bold leading-relaxed">
              Yüksek Hızlı Tren ve 2+1 otobüs tercih ederek uçuşa kıyasla %85'e varan oranda karbon ayak izinizi azaltabilirsiniz.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
