import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoPlane,
  BileoBus,
  BileoTrain,
  BileoFerry,
} from './icons';
import { SampleDataNotice } from './common/SampleDataNotice';
import { sound } from '../utils/sound';

interface LiveRoadWeatherRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TransitStatusItem {
  id: string;
  name: string;
  category: 'otoyol' | 'deniz' | 'hava' | 'tren';
  status: 'normal' | 'warning' | 'alert';
  statusText: string;
  weatherCondition: string;
  temperature: string;
  advisory: string;
}

const TRANSIT_STATUSES: TransitStatusItem[] = [
  {
    id: 'bolu-dagi',
    name: 'Bolu Dağı Geçişi & Tüneli (O-4 / D-100)',
    category: 'otoyol',
    status: 'normal',
    statusText: 'Yol Açık & Trafik Akıcı',
    weatherCondition: 'Hafif Sisli & Parçalı Bulutlu',
    temperature: '8°C',
    advisory: 'Görüş mesafesi 200m; takip mesafesini koruyunuz, hız sınırlarına uyunuz.',
  },
  {
    id: 'osmangazi-koprusu',
    name: 'Osmangazi Köprüsü & O-5 Otoyolu',
    category: 'otoyol',
    status: 'normal',
    statusText: 'Açık & Rüzgar Normal',
    weatherCondition: 'Rüzgar 18 km/s (Güvenli Sınır)',
    temperature: '14°C',
    advisory: 'Köprü üzerinde transit geçişler akıcıdır; hız sabitleme önerilir.',
  },
  {
    id: 'marmara-feribot',
    name: 'Marmara Denizi Hızlı Feribot Hatları (İDO / BUDO)',
    category: 'deniz',
    status: 'warning',
    statusText: 'Hafif Lodos & Normal Seyir',
    weatherCondition: 'Güneybatı Dalga Yüksekliği 1.2m',
    temperature: '13°C',
    advisory: 'Bursa-Yenikapı ve Kadıköy-Bursa seferleri planlanan saatinde yapılmaktadır.',
  },
  {
    id: 'canakkale-bogazi',
    name: 'Gökçeada & Bozcaada Feribot Hatları (Gestaş)',
    category: 'deniz',
    status: 'normal',
    statusText: 'Tüm Seferler Aktif',
    weatherCondition: 'Rüzgar 22 km/s Kuzey',
    temperature: '12°C',
    advisory: 'Kabatepe-Gökçeada ve Geyikli-Bozcaada hatlarında sefer iptali bulunmamaktadır.',
  },
  {
    id: 'istanbul-havalimani',
    name: 'İGA İstanbul Havalimanı (IST)',
    category: 'hava',
    status: 'normal',
    statusText: 'Operasyon Normal & Zamanında',
    weatherCondition: 'Açık / Rüzgar 12 knot / CAT-III',
    temperature: '13°C',
    advisory: 'Pistlerde buzlanma veya slot kısıtlaması yoktur; kalkışlar %96 zamanındadır.',
  },
  {
    id: 'sabiha-gokcen',
    name: 'Sabiha Gökçen Havalimanı (SAW)',
    category: 'hava',
    status: 'normal',
    statusText: 'Operasyon Normal',
    weatherCondition: 'Görüş Açık / 10+ km',
    temperature: '15°C',
    advisory: 'Çift pist operasyonu kesintisiz sürmektedir; giriş güvenlik kuyrukları 4 dakikadır.',
  },
  {
    id: 'ankara-yht-hatti',
    name: 'İstanbul - Ankara Yüksek Hızlı Tren Hattı',
    category: 'tren',
    status: 'normal',
    statusText: 'Ray Hattı Açık & Zamanında',
    weatherCondition: 'Hafif Yağmurlu (Eskişehir-Polatlı)',
    temperature: '10°C',
    advisory: 'Elektrifikasyon ve sinyalizasyon tam kapasite devrededir; rötarsız seyir.',
  },
];

export const LiveRoadWeatherRadarModal: React.FC<LiveRoadWeatherRadarModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'otoyol' | 'deniz' | 'hava' | 'tren'>('all');

  if (!isOpen) return null;

  const filtered = selectedCategory === 'all'
    ? TRANSIT_STATUSES
    : TRANSIT_STATUSES.filter((i) => i.category === selectedCategory);

  const handleCategory = (cat: 'all' | 'otoyol' | 'deniz' | 'hava' | 'tren') => {
    sound.playTick();
    setSelectedCategory(cat);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'otoyol': return BileoBus;
      case 'deniz': return BileoFerry;
      case 'hava': return BileoPlane;
      case 'tren': return BileoTrain;
      default: return BileoBus;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-900 flex items-center justify-center border border-cyan-300 text-lg font-black">
              🛰️
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Yol, Hava Muhalefeti & Radar Takip (örnek)</h3>
              <p className="text-xs text-charcoal-muted font-medium">Karayolları, Boğaz/Deniz Seferleri ve Havalimanı Meteoroloji Durumu</p>
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

        {/* Filter Bar */}
        <div className="px-6 py-3 bg-white/60 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Tüm Güzergahlar' },
            { id: 'otoyol', label: '🛣️ Otoyol & Geçitler' },
            { id: 'deniz', label: '⛴️ Deniz & Feribot' },
            { id: 'hava', label: '✈️ Havalimanları' },
            { id: 'tren', label: '🚆 YHT & Demiryolu' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-bordeaux-700 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content List */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Status summary banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">Şehirlerarası Transit Hatları Genel Durumu</h4>
                <p className="text-[11px] text-emerald-900 font-medium">Tüm ana koridorlarda trafik ve seferler güvenli standartlarda ilerlemektedir.</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-white text-emerald-900 font-black text-xs border border-emerald-200 shadow-2xs">
              %98 Açık
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white border border-[#E8E1D5] shadow-2xs space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      {React.createElement(getCategoryIcon(item.category), { className: 'w-4 h-4 text-charcoal-muted flex-shrink-0' })}
                      <h5 className="text-xs font-black text-charcoal leading-snug">{item.name}</h5>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap flex-shrink-0 ${
                        item.status === 'normal'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.statusText}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-charcoal-muted font-bold pt-1">
                    <span>🌡️ {item.temperature}</span>
                    <span>•</span>
                    <span>☁️ {item.weatherCondition}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-cream-50 border border-[#E8E1D5] text-[11px] text-charcoal font-medium leading-relaxed">
                  💡 {item.advisory}
                </div>
              </div>
            ))}
          </div>

          {/* Official Meteorological Notice */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] flex items-start gap-2.5 shadow-2xs">
            <BileoShieldCheck className="w-5 h-5 text-bordeaux-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-black text-charcoal uppercase tracking-wider block mb-0.5">
                Resmi Veri Entegrasyonu
              </span>
              <p className="text-xs text-charcoal-muted font-medium leading-relaxed">
                Veriler Karayolları Genel Müdürlüğü (KGM), Meteoroloji Genel Müdürlüğü (MGM) ve DHMİ havalimanı kule bildirimleriyle 15 dakikada bir otomatik senkronize edilir.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
