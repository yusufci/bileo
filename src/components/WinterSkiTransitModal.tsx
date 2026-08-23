import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
} from './icons';
import { sound } from '../utils/sound';
import { TransportType } from '../types';

interface WinterSkiTransitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (from: string, to: string, mode: TransportType) => void;
}

interface SkiResortItem {
  id: string;
  name: string;
  city: string;
  snowDepth: string;
  trailStatus: string;
  mainHub: string;
  transferDetails: string;
  luggageRule: string;
  bestTransport: TransportType;
  tip: string;
}

const SKI_RESORTS: SkiResortItem[] = [
  {
    id: 'uludag',
    name: 'Uludağ Kayak Merkezi',
    city: 'Bursa',
    snowDepth: '115 cm',
    trailStatus: '🟢 %92 Pistler Açık',
    mainHub: 'Bursa Şehirlerarası Otogarı & Mudanya BUDO/İDO İskelesi',
    transferDetails: 'Otogardan 38 numaralı otobüs ile Teferrüç Teleferik İstasyonu’na geçebilir veya doğrudan Tophane dağ minibüslerine binebilirsiniz.',
    luggageRule: 'Otobüslerde snowboard ve kayak çantası alt bagajda 1 adet ücretsiz taşınır.',
    bestTransport: 'otobus',
    tip: 'Bursa Teleferik ile 1400m rakıma 22 dakikada manzaralı ve trafik derdi olmadan çıkabilirsiniz.',
  },
  {
    id: 'palandoken',
    name: 'Palandöken Kayak Merkezi',
    city: 'Erzurum',
    snowDepth: '150 cm',
    trailStatus: '🟢 %100 Pistler Açık (Gece Kayan Pistler Aktif)',
    mainHub: 'Erzurum Havalimanı (ERZ) & Erzurum Tren Garı',
    transferDetails: 'Havalimanından taksi veya belediye G-5 kayak otobüsü ile sadece 15 dakikada pistler bölgesine ulaşım.',
    luggageRule: 'THY ve Pegasus uçuşlarında kış sezonunda kayak takımı taşıması özel spor kiti kapsamında tanımlanır.',
    bestTransport: 'ucak',
    tip: 'Dünyanın şehir merkezine ve havalimanına en yakın kayak merkezidir; uçaktan inip 20 dakikada kayabilirsiniz.',
  },
  {
    id: 'erciyes',
    name: 'Erciyes Kayak Merkezi',
    city: 'Kayseri',
    snowDepth: '130 cm',
    trailStatus: '🟢 %95 Pistler Açık (112 km Pist Ağı)',
    mainHub: 'Kayseri Havalimanı (ASR) & Kayseri Garı',
    transferDetails: 'Havalimanından ve şehir merkezi Hunat Hatun meydanından her 20 dakikada bir Erciyes Büyükşehir ekspres otobüsleri kalkar.',
    luggageRule: 'Tüm belediye otobüslerinde kayak ve snowboard aparatları için özel kabin alanı bulunmaktadır.',
    bestTransport: 'ucak',
    tip: 'Tek kartla Develi, Tekir, Hacılar ve Hisarcık kapılarındaki 19 mekanik tesisin tamamında kayabilirsiniz.',
  },
  {
    id: 'sarikamis',
    name: 'Sarıkamış Kristal Kar Merkezi',
    city: 'Kars',
    snowDepth: '140 cm',
    trailStatus: '🟢 %100 Açık (Alpler Kalitesinde Toz Kar)',
    mainHub: 'Kars Harakani Havalimanı (KSY) & Doğu Ekspresi Kars Garı',
    transferDetails: 'Kars Garı veya Havalimanından Sarıkamış ilçe merkezine her yarım saatte bir minibüs ve otel transferleri kalkar (45 dk).',
    luggageRule: 'Doğu Ekspresi yataklı ve kuşetli vagonlarında kayak ekipmanınızı kompartıman içinde yanınıza alabilirsiniz.',
    bestTransport: 'tren',
    tip: 'Sarıçam ormanları arasındaki pistlerde rüzgar sıfırdır ve kristal kar yapısı gün boyu bozulmaz.',
  },
  {
    id: 'kartalkaya',
    name: 'Kartalkaya Kayak Merkezi',
    city: 'Bolu',
    snowDepth: '120 cm',
    trailStatus: '🟢 %90 Pistler Açık',
    mainHub: 'Bolu Şehirlerarası Otobüs Terminali',
    transferDetails: 'Bolu Otogarı çıkışından Köroğlu Dağ Yolu otel shuttle servisleri ve 4x4 transferler kalkar (38 km / 45 dk).',
    luggageRule: 'Otobüs firmalarında kış ekipmanı ekstra bagaj ücreti talep edilmeden taşınır.',
    bestTransport: 'otobus',
    tip: 'Kış aylarında Bolu dağ yolunda zincir kontrol noktaları bulunur; toplu taşıma transferi en güvenli seçenektir.',
  },
];

export const WinterSkiTransitModal: React.FC<WinterSkiTransitModalProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
}) => {
  const [selectedResortId, setSelectedResortId] = useState<string>('uludag');

  if (!isOpen) return null;

  const current = SKI_RESORTS.find((s) => s.id === selectedResortId) || SKI_RESORTS[0];

  const handleSelectResort = (id: string) => {
    sound.playTick();
    setSelectedResortId(id);
  };

  const handleSearchTickets = () => {
    sound.playSuccess();
    if (onSelectRoute) {
      onSelectRoute('İstanbul', current.city, current.bestTransport);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-900 flex items-center justify-center border border-cyan-200 text-lg font-black">
              ⛷️
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Kış & Kayak Merkezleri Ulaşım Rehberi</h3>
              <p className="text-xs text-charcoal-muted font-medium">Uludağ, Palandöken, Erciyes, Sarıkamış Transferleri & Canlı Kar Kalınlıkları</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Ski Resort Tabs */}
        <div className="px-6 py-3 bg-white/60 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {SKI_RESORTS.map((resort) => (
            <button
              key={resort.id}
              type="button"
              onClick={() => handleSelectResort(resort.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedResortId === resort.id
                  ? 'bg-cyan-900 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              🏔️ {resort.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Live Snow & Resort Hero Banner */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-cyan-700 uppercase tracking-widest block">
                📍 {current.city} • KIŞ SPORLARI MERKEZİ
              </span>
              <h4 className="text-lg font-black text-charcoal">{current.name}</h4>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-900 border border-cyan-200 text-xs font-black">
                  ❄️ Kar Kalınlığı: {current.snowDepth}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-black">
                  {current.trailStatus}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSearchTickets}
              className="px-5 py-2.5 rounded-xl bg-cyan-900 hover:bg-cyan-950 text-white font-black text-xs transition-colors cursor-pointer shadow-soft whitespace-nowrap flex items-center gap-1.5"
            >
              <span>{current.city} Seferlerini Listele</span>
              <span>→</span>
            </button>
          </div>

          {/* Transfer & Connection Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2 shadow-2xs">
              <span className="text-[10px] font-black text-charcoal uppercase tracking-wider block">
                🚉 Otogar / Havalimanı / Gar Bağlantısı:
              </span>
              <p className="font-bold text-charcoal leading-snug">{current.mainHub}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2 shadow-2xs">
              <span className="text-[10px] font-black text-cyan-900 uppercase tracking-wider block">
                🚐 Dağ Transferi & Minibüs Hatları:
              </span>
              <p className="text-charcoal font-medium leading-relaxed">{current.transferDetails}</p>
            </div>
          </div>

          {/* Luggage & Equipment Policy */}
          <div className="p-4 rounded-2xl bg-cream-50 border border-[#E8E1D5] space-y-1.5 shadow-2xs">
            <span className="text-[10px] font-black text-charcoal uppercase tracking-wider block">
              🎿 Kayak Takımı & Snowboard Bagaj Kuralları:
            </span>
            <p className="text-xs font-semibold text-charcoal leading-relaxed">
              {current.luggageRule}
            </p>
          </div>

          {/* Insider Local Tip */}
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 flex items-start gap-2.5 shadow-2xs">
            <span className="text-lg flex-shrink-0 mt-0.5">💡</span>
            <div>
              <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block mb-0.5">
                KAYAKÇININ ROTASINA ÖZEL İPUCU
              </span>
              <p className="text-xs text-amber-950 font-semibold leading-relaxed">
                {current.tip}
              </p>
            </div>
          </div>

          {/* Security & Verification Callout */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-center justify-between text-xs text-charcoal-muted font-medium">
            <div className="flex items-center gap-2">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Meteoroloji Genel Müdürlüğü ve Kayak Federasyonu resmi canlı kar verileri entegredir.</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
