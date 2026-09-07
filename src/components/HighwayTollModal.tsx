import React, { useState } from 'react';
import {
  BileoClose,
  BileoCheck,
  BileoBus,
} from './icons';
import { sound } from '../utils/sound';
import { SampleDataNotice } from './common/SampleDataNotice';

interface HighwayTollModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HighwayRoute {
  id: string;
  name: string;
  bridgeOrPass: string;
  busToll: string;
  carToll: string;
  timeSaved: string;
  highlights: string[];
  hgsTips: string;
}

const HIGHWAY_ROUTES: HighwayRoute[] = [
  {
    id: 'osmangazi-izmir',
    name: 'İstanbul - İzmir Otoyolu (O-5) & Osmangazi Köprüsü',
    bridgeOrPass: 'Osmangazi Köprüsü + 400 km Otoyol',
    carToll: '555 ₺ (Köprü) + 600 ₺ (Otoyol) = ~1.155 ₺',
    busToll: '1.280 ₺ (Otobüs Tarifesi Dahil)',
    timeSaved: 'Körfezi dolaşmaya göre 3.5 saat zaman kazancı (3.5 saatte İzmir)',
    highlights: [
      'İstanbul (Gebze) - Bursa arası sadece 45 dakika',
      'Yol boyunca modern Oksijen & Dinlenme Tesisleri',
      '7/24 Akıllı HGS Gişeleri & İhlalsiz Otomatik Geçiş',
    ],
    hgsTips: 'Otobüs bilet fiyatlarına köprü ve otoyol geçiş ücretleri dahildir; yolcudan ekstra ücret alınmaz.',
  },
  {
    id: 'canakkale-1915',
    name: '1915 Çanakkale Köprüsü & Malkara Otoyolu',
    bridgeOrPass: '1915 Çanakkale Asma Köprüsü',
    carToll: '419 ₺ (Köprü Geçişi)',
    busToll: '980 ₺ (Köprü Otobüs Tarifesi)',
    timeSaved: 'Feribot bekleme sırası hariç 1.5 saat kazanç (6 dakikada kıtalararası geçiş)',
    highlights: [
      'Lapseki ile Gelibolu arasını feribotsuz 6 dakikaya indiren dünyanın en uzun asma köprüsü',
      'Fırtına ve lodos nedeniyle feribot iptallerinden etkilenmeyen kesintisiz rota',
    ],
    hgsTips: 'Trakya-Ege otobüs seferlerinde kış aylarında lodos iptallerine karşı en güvenli rotadır.',
  },
  {
    id: 'kmo-yss',
    name: 'Kuzey Marmara Otoyolu (KMO) & Yavuz Sultan Selim Köprüsü',
    bridgeOrPass: 'YSS Köprüsü & İstanbul Havalimanı Koridoru',
    carToll: '70 ₺ (Köprü) + ~120 ₺ (Otoyol)',
    busToll: '220 ₺ (Otobüs ve Ağır Vasıta)',
    timeSaved: 'Şehir içi FSM ve Boğaziçi trafiğine girmeden 1.5 saat tasarruf',
    highlights: [
      'Tüm şehirlerarası yolcu otobüslerinin zorunlu transit güzergahı',
      'İstanbul Havalimanı (IST) ve Sabiha Gökçen (SAW) ekspres bağlantısı',
      '4 şeritli geniş akıllı otoyol ve tünel aydınlatmaları',
    ],
    hgsTips: 'Esenler ve Alibeyköy otogarlarından kalkan tüm otobüsler YSS Köprüsü üzerinden Anadoluya geçer.',
  },
  {
    id: 'ankara-nigde',
    name: 'Ankara - Niğde Akıllı Otoyolu (O-21)',
    bridgeOrPass: 'İç Anadolu - Çukurova Transit Hattı',
    carToll: '310 ₺ (Tam Güzergah)',
    busToll: '650 ₺ (Otobüs Tarifesi)',
    timeSaved: 'Eski devlet yoluna göre 2 saat zaman tasarrufu',
    highlights: [
      'Ankara - Adana/Mersin arasını 4.5 saate indiren akıllı sensörlü otoyol',
      'Yerli fiber optik altyapı ve buzlanma erken uyarı sensörleri',
      'Yüksek seyir konforu ve sıfır trafik ışığı',
    ],
    hgsTips: 'Kapadokya ve Güneydoğu yönüne giden ekspres otobüs seferleri bu rotayı kullanır.',
  },
];

export const HighwayTollModal: React.FC<HighwayTollModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('osmangazi-izmir');

  if (!isOpen) return null;

  const current = HIGHWAY_ROUTES.find((r) => r.id === selectedRouteId) || HIGHWAY_ROUTES[0];

  const handleSelectRoute = (id: string) => {
    sound.playTick();
    setSelectedRouteId(id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200 text-lg font-black">
              🛣️
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Otoyol, Köprü & HGS Ücretleri Rehberi (örnek)</h3>
              <p className="text-xs text-charcoal-muted font-medium">Osmangazi, 1915 Çanakkale, Kuzey Marmara ve Ankara-Niğde için temsili geçiş tarifesi örnekleri</p>
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

        {/* Route Tabs */}
        <div className="px-6 py-3 bg-white/50 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {HIGHWAY_ROUTES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelectRoute(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedRouteId === r.id
                  ? 'bg-bordeaux-700 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              <BileoBus className="w-3.5 h-3.5" />
              <span>{r.name.split('&')[0].trim()}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Route Title */}
          <div>
            <h4 className="text-xl font-black text-[#1E1B18] font-display">{current.name}</h4>
            <p className="text-xs text-charcoal-muted font-medium mt-0.5">🌉 {current.bridgeOrPass}</p>
          </div>

          {/* Cost & Savings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1 shadow-2xs">
              <span className="text-[10px] font-black text-bordeaux-700 uppercase tracking-wider block">
                🚌 Otobüs Bileti Güvencesi
              </span>
              <p className="text-xs font-bold text-emerald-700">Tüm Köprü & Otoyol Ücretleri Biletinize Dahildir</p>
              <span className="text-[10px] text-charcoal-muted block">Sıfır ek masraf</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1 shadow-2xs">
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                🚗 Otomobil Geçiş Ücreti
              </span>
              <p className="text-xs font-black text-charcoal">{current.carToll}</p>
              <span className="text-[10px] text-charcoal-muted block">HGS / Nakit / Kredi Kartı</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1 shadow-2xs">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                ⏱️ Kazanılan Seyahat Süresi
              </span>
              <p className="text-xs font-bold text-emerald-900 leading-tight">{current.timeSaved}</p>
            </div>

          </div>

          {/* Route Highlights */}
          <div className="space-y-2">
            <span className="text-[11px] font-black text-charcoal uppercase tracking-wider block">
              Güzergah Avantajları & Tesisler
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {current.highlights.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#E8E1D5] text-xs font-bold text-charcoal"
                >
                  <BileoCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Traveler Tip */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1">
            <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-0.5">
              Yolcu & Bilet Avantajı
            </span>
            <p className="text-xs text-amber-950 font-medium leading-relaxed">
              💡 {current.hgsTips}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
