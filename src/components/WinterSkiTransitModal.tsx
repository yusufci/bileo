import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoCompass,
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
    name: 'Bursa Uludağ Kayak Merkezi',
    city: 'Bursa',
    snowDepth: '145 cm',
    trailStatus: 'Tüm Pistler Açık (1. ve 2. Gelişim)',
    mainHub: 'Bursa Otogarı & İDO/BUDO Mudanya İskelesi',
    transferDetails: 'Bursa Otogarı\'ndan her 30 dakikada bir Tophane minibüsleri ve Teleferik (Teferrüç istasyonu) ile 22 dakikada zirveye ulaşım.',
    luggageRule: 'Otobüslerde kayak/snowboard çantası ücretsiz bagaj kapsamında taşınır. Mudanya feribotlarında ek ücret alınmaz.',
    bestTransport: 'otobus',
    tip: 'Hafta sonu teleferik gişelerindeki sıra için biletinizi önceden online alın.',
  },
  {
    id: 'palandoken',
    name: 'Erzurum Palandöken & Konaklı',
    city: 'Erzurum',
    snowDepth: '190 cm',
    trailStatus: 'Gece Aydınlatmalı Pistler Dahil Açık',
    mainHub: 'Erzurum Havalimanı (ERZ) & Erzurum Garı',
    transferDetails: 'Havalimanından Palandöken dağ otelleri bölgesine taksi veya belediye otobüsü ile sadece 15 dakika mesafe.',
    luggageRule: 'Havayollarında spor ekipmanı rezervasyonu önceden yapılmalıdır (AJet & Pegasus standart spor tarifesi).',
    bestTransport: 'ucak',
    tip: 'Dünyanın havalimanına en yakın kayak merkezidir; günübirlik uçuşla kayak yapılabilir.',
  },
  {
    id: 'erciyes',
    name: 'Kayseri Erciyes Kayak Merkezi',
    city: 'Kayseri',
    snowDepth: '165 cm',
    trailStatus: 'Tekir, Develi, Hacılar Kapı Aktif',
    mainHub: 'Kayseri Havalimanı (ASR) & Kayseri Otogarı',
    transferDetails: 'Kayseri şehir merkezinden (Seyyid Burhaneddin Türbesi yanı) Erciyes dağ servisleri her saat başı kalkar.',
    luggageRule: 'Kayseri YHT ve otobüs seferlerinde kılıfında olmak şartıyla kayak takımları ücretsiz kabul edilir.',
    bestTransport: 'ucak',
    tip: 'Farklı zorluk derecelerinde 34 pisti birbirine bağlayan tek mekanik tesis kartı geçerlidir.',
  },
  {
    id: 'sarikamis',
    name: 'Kars Sarıkamış Kayak Merkezi',
    city: 'Kars',
    snowDepth: '175 cm',
    trailStatus: 'Kristal Kar Pistleri Mükemmel Durumda',
    mainHub: 'Kars Harakani Havalimanı (KSY) & Doğu Ekspresi Garı',
    transferDetails: 'Kars Havalimanı\'ndan Sarıkamış\'a transfer araçları 40 dakika; Doğu Ekspresi Sarıkamış istasyonundan ise 5 dakikadır.',
    luggageRule: 'Doğu Ekspresi yataklı ve örtülü kuşetli vagonlarında kayak takımları için geniş kompartıman alanı bulunur.',
    bestTransport: 'tren',
    tip: 'Alpler dışında dünyada sadece Sarıkamış\'ta bulunan toz kristal kar yapısı pistleri asla buzlandırmaz.',
  },
  {
    id: 'kartepe',
    name: 'Kocaeli Kartepe Kayak Merkezi',
    city: 'Kocaeli',
    snowDepth: '110 cm',
    trailStatus: 'Günübirlik Pistler Açık',
    mainHub: 'İzmit Otogarı & Maşukiye',
    transferDetails: 'İstanbul\'a en yakın merkez (1.5 saat). İzmit Otogarı\'ndan Maşukiye minibüsleri ile dağ yoluna aktarma.',
    luggageRule: 'Günübirlik otobüs ve özel tur araçlarında bagaj kısıtlaması yoktur.',
    bestTransport: 'otobus',
    tip: 'Yoğun hafta sonlarında Maşukiye-Kartepe tırmanışında kar lastiği ve zincir kontrolü zorunludur.',
  },
];

export const WinterSkiTransitModal: React.FC<WinterSkiTransitModalProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
}) => {
  const [selectedResortId, setSelectedResortId] = useState<string>('uludag');

  if (!isOpen) return null;

  const current = SKI_RESORTS.find((r) => r.id === selectedResortId) || SKI_RESORTS[0];

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
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-900 flex items-center justify-center border border-cyan-200">
              <BileoCompass className="w-5 h-5" />
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
              {resort.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Live Snow & Resort Hero Banner */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-cyan-700 uppercase tracking-widest block">
                {current.city} • Kış Sporları Merkezi
              </span>
              <h4 className="text-lg font-black text-charcoal">{current.name}</h4>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-900 border border-cyan-200 text-xs font-black">
                  Kar Kalınlığı: {current.snowDepth}
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
              <span>{current.city} Seferlerini Gör</span>
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
