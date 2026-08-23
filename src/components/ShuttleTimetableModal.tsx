import React, { useState } from 'react';
import {
  BileoClose,
  BileoBus,
} from './icons';
import { sound } from '../utils/sound';

interface ShuttleTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShuttleRoute {
  id: string;
  name: string;
  terminalName: string;
  type: 'otobus' | 'ucak' | 'tren' | 'feribot';
  frequency: string;
  firstLastTime: string;
  duration: string;
  fare: string;
  stops: string[];
  tips: string;
}

const SHUTTLE_ROUTES: ShuttleRoute[] = [
  {
    id: 'hva-taksim-ist',
    name: 'Havaist HVİST-16 (Taksim - İstanbul Havalimanı)',
    terminalName: 'İstanbul Havalimanı (IST)',
    type: 'ucak',
    frequency: 'Her 30 Dakikada Bir',
    firstLastTime: '24 Saat Kesintisiz (00:00 - 23:30)',
    duration: 'Yaklaşık 90 Dakika',
    fare: '205 TL (İstanbulkart & Kredi Kartı)',
    stops: ['Taksim Gezi Parkı Önü', 'Piyalepaşa', 'Nurtepe Viyadük', 'İstanbul Havalimanı'],
    tips: 'Uçuş saatinizden en az 3 saat önce Taksim kalkış noktasında olmanız tavsiye edilir.',
  },
  {
    id: 'hvb-kadikoy-saw',
    name: 'Havabüs SG-1 (Kadıköy Rıhtım - Sabiha Gökçen)',
    terminalName: 'Sabiha Gökçen Havalimanı (SAW)',
    type: 'ucak',
    frequency: 'Her 30 Dakikada Bir',
    firstLastTime: '04:15 - 00:45',
    duration: 'Yaklaşık 60 Dakika',
    fare: '130 TL (Nakit / Kredi Kartı)',
    stops: ['Kadıköy Rıhtım İETT Durakları', 'Acıbadem Köprüsü', 'Yenisahra', 'Tem Bağlantı', 'SAW Havalimanı'],
    tips: 'Köprü ve TEM trafiği yoğun saatlerde M4 metro hattı alternatif olarak tercih edilebilir.',
  },
  {
    id: 'esenler-servis',
    name: 'Otogar İçi Ücretsiz Şehir İçi Yolcu Servisleri',
    terminalName: 'Büyük İstanbul Otogarı (Esenler)',
    type: 'otobus',
    frequency: 'Sefer Varışına Göre (Her 15-20 Dk)',
    firstLastTime: '05:30 - 01:00',
    duration: 'Güzergaha Göre 20 - 45 Dk',
    fare: 'Ücretsiz (Geçerli Otobüs Bileti İle)',
    stops: ['Bakırköy İncirli', 'Mecidiyeköy', 'Kadıköy', 'Üsküdar', 'Beşiktaş Meydan'],
    tips: 'Servis kullanmak için biletinizi veya PNR kodunuzu servis şoförüne göstermeniz yeterlidir.',
  },
  {
    id: 'asti-ego',
    name: 'EGO 442 Esenboğa Havalimanı - AŞTİ - Kızılay',
    terminalName: 'AŞTİ Otogarı & Esenboğa',
    type: 'otobus',
    frequency: 'Her 20 Dakikada Bir',
    firstLastTime: '24 Saat Kesintisiz',
    duration: 'Yaklaşık 50 Dakika',
    fare: '65 TL (Ankarakart & Temassız Kart)',
    stops: ['AŞTİ Gelen Yolcu Katı', 'Kızılay Meydanı', 'Ulus', 'Esenboğa Havalimanı'],
    tips: 'Gece seferleri saat başı düzenli olarak kalkmaktadır.',
  },
  {
    id: 'yht-baskentray',
    name: 'Başkentray & Gar Ring Transferi',
    terminalName: 'Ankara YHT Garı',
    type: 'tren',
    frequency: 'Her 15 Dakikada Bir',
    firstLastTime: '06:00 - 23:00',
    duration: '5 - 15 Dakika',
    fare: '20 TL (Ankarakart)',
    stops: ['Ankara YHT Garı', 'Sıhhiye', 'Kurtuluş', 'Kayaş / Sincan'],
    tips: 'YHT biletinizle doğrudan gar alt geçidinden Başkentray turnikelerine geçiş yapabilirsiniz.',
  },
];

export const ShuttleTimetableModal: React.FC<ShuttleTimetableModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<'all' | 'otobus' | 'ucak' | 'tren' | 'feribot'>('all');
  const [selectedRoute, setSelectedRoute] = useState<ShuttleRoute>(SHUTTLE_ROUTES[0]);

  if (!isOpen) return null;

  const filtered = SHUTTLE_ROUTES.filter((r) => {
    if (selectedType !== 'all' && r.type !== selectedType) return false;
    return true;
  });

  const handleTypeChange = (type: 'all' | 'otobus' | 'ucak' | 'tren' | 'feribot') => {
    sound.playTick();
    setSelectedType(type);
    const firstMatch = SHUTTLE_ROUTES.find((r) => type === 'all' || r.type === type);
    if (firstMatch) setSelectedRoute(firstMatch);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cream-100 text-bordeaux-700 flex items-center justify-center border border-[#E8E1D5]">
              <BileoBus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Havalimanı & Otogar Servis Saatleri</h3>
              <p className="text-xs text-charcoal-muted font-medium">Havaist, Havabüs, ücretsiz otogar servisleri ve transfer ringleri</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-3 bg-white/50 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Tüm Servisler' },
            { id: 'ucak', label: 'Havalimanı (Havaist/Havabüs)' },
            { id: 'otobus', label: 'Otogar Servisleri' },
            { id: 'tren', label: 'Gar & Tren Ring' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTypeChange(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                selectedType === tab.id
                  ? 'bg-bordeaux-700 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          
          {/* Left List Pane */}
          <div className="md:col-span-5 border-r border-[#E8E1D5] overflow-y-auto p-4 space-y-2 bg-[#FAF7F2]/60">
            {filtered.map((route) => (
              <button
                key={route.id}
                type="button"
                onClick={() => {
                  sound.playTick();
                  setSelectedRoute(route);
                }}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRoute.id === route.id
                    ? 'bg-white border-bordeaux-700 ring-2 ring-bordeaux-700/20 shadow-soft'
                    : 'bg-white/70 border-[#E8E1D5] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-bordeaux-50 text-bordeaux-700">
                    {route.terminalName}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700">{route.fare}</span>
                </div>
                <h4 className="text-xs font-black text-[#1E1B18] line-clamp-1">{route.name}</h4>
                <p className="text-[11px] text-charcoal-muted line-clamp-1 mt-1">🕒 {route.frequency}</p>
              </button>
            ))}
          </div>

          {/* Right Detail Pane */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-5 bg-white">
            <div>
              <span className="text-[10px] font-black text-bordeaux-700 uppercase tracking-widest block mb-1">
                {selectedRoute.terminalName}
              </span>
              <h3 className="text-xl font-black text-[#1E1B18] font-display">{selectedRoute.name}</h3>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5]">
                <span className="text-[10px] text-charcoal-muted font-bold block">Sefer Sıklığı</span>
                <span className="text-xs font-black text-charcoal mt-0.5 block">{selectedRoute.frequency}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5]">
                <span className="text-[10px] text-charcoal-muted font-bold block">Seyahat Süresi</span>
                <span className="text-xs font-black text-charcoal mt-0.5 block">{selectedRoute.duration}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-emerald-800 font-bold block">Bilet / Ücret</span>
                <span className="text-xs font-black text-emerald-950 mt-0.5 block">{selectedRoute.fare}</span>
              </div>
            </div>

            {/* Stops Timeline */}
            <div>
              <span className="text-[11px] font-extrabold text-charcoal uppercase tracking-wider block mb-2.5">
                Güzergah Durakları
              </span>
              <div className="space-y-1.5 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E1D5]">
                {selectedRoute.stops.map((stop, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-bold text-charcoal">
                    <span className="w-2 h-2 rounded-full bg-bordeaux-700" />
                    <span>{stop}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips Note */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80">
              <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-1">
                Yolcu İpucu
              </span>
              <p className="text-xs text-amber-950 font-medium leading-relaxed">
                {selectedRoute.tips}
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
