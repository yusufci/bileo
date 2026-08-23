import React, { useState } from 'react';
import {
  BileoClose,
  BileoTrain,
  BileoPlane,
  BileoBus,
  BileoCheck,
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
    duration: '2 sa 40 dk (YHT)',
    budgetEst: '₺₺ (Ekonomik & Öğrenci Dostu)',
    highlights: [
      'Porsuk Çayı üzerinde Venedik tipi gondol ve bot turları',
      'Tarihi Odunpazarı Evleri, Balmumu Heykel Müzesi ve Lületaşı Çarşısı',
      'Sazova Bilim Kültür ve Sanat Parkı & Masal Şatosu',
      'Meşhur Odunpazarı Çiböreği ve Balaban Kebap lezzet durakları',
    ],
    transitTip: 'Eskişehir YHT Garı şehir merkezindedir; çıkışta Estram tramvayına binerek 5 dakikada Porsuk Çayı’na ulaşabilirsiniz.',
    bestSeason: 'İlkbahar ve Sonbahar (Nisan - Ekim)',
  },
  {
    id: 'kapadokya-peri',
    destination: 'Kapadokya — Masalsı Vadiler & Balonlar',
    tag: 'Nevşehir & Göreme Gece Seferi',
    recommendedMode: 'otobus',
    fromCity: 'İstanbul',
    toCity: 'Nevşehir',
    duration: '9 sa (Konforlu Gece Otobüsü)',
    budgetEst: '₺₺₺ (Kültür & Deneyim)',
    highlights: [
      'Gün doğumunda Göreme semalarında sıcak hava balonu turu',
      'Derinkuyu ve Kaymaklı yeraltı şehirleri keşfi',
      'Aşk Vadisi ve Paşabağ Rahipler Vadisi peribacaları yürüyüşü',
      'Uçhisar Kalesi gün batımı manzarası ve çömlek kebabı',
    ],
    transitTip: 'Nevşehir Otogarı’ndan her 20 dakikada bir kalkan Göreme/Ürgüp ilçe servisleriyle vadilere kolayca geçebilirsiniz.',
    bestSeason: 'Tüm Yıl (Özellikle Eylül - Kasım ve Nisan - Haziran)',
  },
  {
    id: 'kas-fethiye-likya',
    destination: 'Kaş & Fethiye — Turkuaz Akdeniz & Likya',
    tag: 'Ölüdeniz & Kaputaş Plajı Rotası',
    recommendedMode: 'ucak',
    fromCity: 'İstanbul',
    toCity: 'Muğla (Dalaman)',
    duration: '1 sa 15 dk Uçuş + HAVAŞ',
    budgetEst: '₺₺₺ (Tatil & Doğa)',
    highlights: [
      'Dünyaca ünlü Kaputaş Plajı ve Patara kum tepeleri',
      'Babadağ’dan Ölüdeniz lagününe yamaç paraşütü',
      'Kekova batık şehir tekne turu ve Simena kalesi',
      'Tarihi Likya Yolu günübirlik doğa yürüyüş parkurları',
    ],
    transitTip: 'Dalaman Havalimanı’ndan Fethiye ve Kaş’a kesintisiz HAVAŞ ve MUTTAŞ transfer otobüsleri çalışmaktadır.',
    bestSeason: 'Mayıs - Ekim Arası',
  },
  {
    id: 'karadeniz-yayla',
    destination: 'Trabzon & Rize — Karadeniz Yeşili',
    tag: 'Ayder, Uzungöl & Sümela Manastırı',
    recommendedMode: 'ucak',
    fromCity: 'İstanbul',
    toCity: 'Trabzon',
    duration: '1 sa 40 dk Uçuş',
    budgetEst: '₺₺₺ (Yayla & Doğa)',
    highlights: [
      'Kayalıklara asılı tarihi Sümela Manastırı ziyareti',
      'Rize Ayder ve Pokut yaylalarında bulut denizi manzarası',
      'Fırtına Deresi boyunca zipline ve rafting heyecanı',
      'Karadeniz Pidesi, Muhlama ve Akçaabat Köftesi ziyafeti',
    ],
    transitTip: 'Trabzon Havalimanı şehir merkezine 10 dakika mesafededir; Rize-Artvin Havalimanı ise yaylalara doğrudan erişim sunar.',
    bestSeason: 'Haziran - Eylül Arası',
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
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center border border-amber-200 text-lg font-black">
              🏖️
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
                  ⏱️ {current.duration}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-xs text-[11px] font-bold">
                  💰 {current.budgetEst}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-xs text-[11px] font-bold">
                  ☀️ {current.bestSeason}
                </span>
              </div>
            </div>
          </div>

          {/* Highlights Checklist */}
          <div className="space-y-3">
            <span className="text-[11px] font-black text-charcoal uppercase tracking-wider block">
              ⭐ Mutlaka Görülmesi & Deneyimlenmesi Gerekenler
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
              💡 Yerel Ulaşım & Aktarma İpucu
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
