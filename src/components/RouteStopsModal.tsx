import React, { useState } from 'react';
import {
  BileoClose,
  BileoTrain,
  BileoBus,
  BileoFerry,
  BileoPlane,
} from './icons';
import { sound } from '../utils/sound';

interface RouteStopsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IntermediateStop {
  name: string;
  type: 'origin' | 'stop' | 'rest' | 'destination';
  timeOffset: string;
  duration?: string;
  note?: string;
}

interface RouteDetail {
  id: string;
  mode: 'tren' | 'otobus' | 'feribot' | 'ucak';
  title: string;
  routeCode: string;
  totalTime: string;
  distance: string;
  frequency: string;
  stops: IntermediateStop[];
}

const ROUTE_DATA: RouteDetail[] = [
  {
    id: 'yht-ist-ank',
    mode: 'tren',
    title: 'İstanbul (Söğütlüçeşme) → Ankara Garı',
    routeCode: 'YHT-91024',
    totalTime: '4 sa 20 dk',
    distance: '533 km',
    frequency: 'Her saat başı (Günde 16 sefer)',
    stops: [
      { name: 'İstanbul (Söğütlüçeşme)', type: 'origin', timeOffset: '00:00', note: 'Marmaray & Metrobüs Bağlantısı' },
      { name: 'Bostancı', type: 'stop', timeOffset: '+00:10', duration: '2 dk' },
      { name: 'Pendik', type: 'stop', timeOffset: '+00:25', duration: '3 dk', note: 'Sabiha Gökçen Havalimanı Otobüs Bağlantısı' },
      { name: 'Gebze', type: 'stop', timeOffset: '+00:45', duration: '2 dk' },
      { name: 'İzmit (Kocaeli)', type: 'stop', timeOffset: '+01:15', duration: '3 dk' },
      { name: 'Arifiye (Sakarya)', type: 'stop', timeOffset: '+01:45', duration: '2 dk' },
      { name: 'Bilecik', type: 'stop', timeOffset: '+02:30', duration: '2 dk' },
      { name: 'Bozüyük', type: 'stop', timeOffset: '+02:55', duration: '2 dk' },
      { name: 'Eskişehir Gar', type: 'stop', timeOffset: '+03:20', duration: '5 dk', note: 'Konya & Kütahya Aktarma Noktası' },
      { name: 'Polatlı YHT', type: 'stop', timeOffset: '+03:55', duration: '2 dk' },
      { name: 'Ankara YHT Garı', type: 'destination', timeOffset: '+04:20', note: 'Ankaray & Başkentray Metro Entegrasyonu' },
    ],
  },
  {
    id: 'bus-ist-izm',
    mode: 'otobus',
    title: 'İstanbul (Esenler) → İzmir Şehirlerarası Otogar',
    routeCode: 'O-5 EKSPRES',
    totalTime: '5 sa 15 dk',
    distance: '480 km',
    frequency: 'Günde 28 ekspres sefer',
    stops: [
      { name: 'İstanbul (Esenler Büyük Otogar)', type: 'origin', timeOffset: '00:00', note: 'M1A Metro İstasyonu' },
      { name: 'Alibeyköy Cep Otogarı', type: 'stop', timeOffset: '+00:40', duration: '15 dk', note: 'T5 Tramvay Hattı' },
      { name: 'Osmangazi Köprüsü Geçişi', type: 'stop', timeOffset: '+01:30', note: 'Körfez Hızlı Geçiş' },
      { name: 'Bursa Otogar', type: 'stop', timeOffset: '+02:15', duration: '20 dk' },
      { name: 'Oksijen O-5 Dinlenme Tesisi', type: 'rest', timeOffset: '+03:15', duration: '30 dk Mola', note: 'Sıcak Yemek & Şarj Alanı' },
      { name: 'Balıkesir Otogar', type: 'stop', timeOffset: '+04:00', duration: '15 dk' },
      { name: 'Manisa Şehirlerarası Otogar', type: 'stop', timeOffset: '+04:45', duration: '10 dk' },
      { name: 'İzmir Şehirlerarası Otobüs Terminali', type: 'destination', timeOffset: '+05:15', note: 'İzmirim Kart & Şehir İçi Ücretsiz Servisler' },
    ],
  },
  {
    id: 'bus-ist-ant',
    mode: 'otobus',
    title: 'İstanbul (Harem) → Antalya Otogarı',
    routeCode: 'AKDENİZ GECE',
    totalTime: '9 sa 45 dk',
    distance: '710 km',
    frequency: 'Akşam 20:00 - 23:30 arası yoğun',
    stops: [
      { name: 'İstanbul (Harem Otogarı)', type: 'origin', timeOffset: '00:00', note: 'Üsküdar & Marmaray Bağlantısı' },
      { name: 'Kocaeli (İzmit Otogarı)', type: 'stop', timeOffset: '+01:20', duration: '15 dk' },
      { name: 'Bilecik / Bozüyük', type: 'stop', timeOffset: '+03:30', duration: '15 dk' },
      { name: 'Kütahya Dinlenme Tesisi', type: 'rest', timeOffset: '+04:45', duration: '30 dk Yemek Molası' },
      { name: 'Afyonkarahisar Otogarı', type: 'stop', timeOffset: '+06:15', duration: '20 dk' },
      { name: 'Burdur Otogarı', type: 'stop', timeOffset: '+08:20', duration: '15 dk' },
      { name: 'Antalya Şehirlerarası Terminali', type: 'destination', timeOffset: '+09:45', note: 'Antray Tramvay & Kemer/Alanya İlçeler Terminali' },
    ],
  },
  {
    id: 'ferry-ist-ban',
    mode: 'feribot',
    title: 'İstanbul (Yenikapı) → Bandırma Hızlı Feribot',
    routeCode: 'İDO-BAN90',
    totalTime: '2 sa 30 dk',
    distance: '65 Deniz Mili',
    frequency: 'Günde 4 gidiş - 4 dönüş seferi',
    stops: [
      { name: 'İstanbul Yenikapı İskelesi', type: 'origin', timeOffset: '00:00', note: 'M1/M2 Yenikapı Metro & Marmaray' },
      { name: 'Marmara Denizi Açık Seyir', type: 'stop', timeOffset: '+01:15', note: 'Açık Güverte & Deniz Kafe Hizmeti' },
      { name: 'Bandırma Feribot İskelesi', type: 'destination', timeOffset: '+02:30', note: 'Ege Ekspresi & İzmir Treni Gar Bağlantısı' },
    ],
  },
];

export const RouteStopsModal: React.FC<RouteStopsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('yht-ist-ank');

  if (!isOpen) return null;

  const current = ROUTE_DATA.find((r) => r.id === selectedRouteId) || ROUTE_DATA[0];

  const handleSelectRoute = (id: string) => {
    sound.playTick();
    setSelectedRouteId(id);
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'tren': return BileoTrain;
      case 'otobus': return BileoBus;
      case 'feribot': return BileoFerry;
      case 'ucak': return BileoPlane;
      default: return BileoBus;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center border border-amber-200 text-lg font-black">
              🗺️
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Güzergah & Durak Çizelgesi Portalı</h3>
              <p className="text-xs text-charcoal-muted font-medium">Seferlerin Ara Durakları, Varış Saatleri, Mola Yerleri ve İstasyon Bağlantıları</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Route Selector Tabs */}
        <div className="px-6 py-3 bg-white/50 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {ROUTE_DATA.map((r) => (
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
              {React.createElement(getModeIcon(r.mode), { className: 'w-3.5 h-3.5' })}
              <span>{r.title.split('→')[0].trim()} → {r.title.split('→')[1]?.trim().split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Route Overview Card */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] space-y-3 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-black text-bordeaux-700 uppercase tracking-widest block">
                  {current.routeCode}
                </span>
                <h4 className="text-lg font-black text-charcoal font-display">{current.title}</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-cream-100 text-charcoal font-black text-xs border border-[#E8E1D5]">
                  ⏱️ {current.totalTime}
                </span>
                <span className="px-3 py-1 rounded-xl bg-cream-100 text-charcoal font-black text-xs border border-[#E8E1D5]">
                  🛣️ {current.distance}
                </span>
              </div>
            </div>
            <p className="text-xs text-charcoal-muted font-medium">
              🕒 <strong>Sefer Sıklığı:</strong> {current.frequency}
            </p>
          </div>

          {/* Interactive Visual Timeline */}
          <div className="space-y-3">
            <span className="text-[11px] font-black text-charcoal uppercase tracking-wider block">
              Durak Durak Güzergah Akışı
            </span>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E8E1D5]">
              {current.stops.map((stop, idx) => {
                const isOrigin = stop.type === 'origin';
                const isDestination = stop.type === 'destination';
                const isRest = stop.type === 'rest';

                return (
                  <div key={idx} className="relative group">
                    {/* Circle Node */}
                    <div
                      className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-black ${
                        isOrigin
                          ? 'bg-emerald-600 border-white text-white ring-2 ring-emerald-200'
                          : isDestination
                          ? 'bg-bordeaux-700 border-white text-white ring-2 ring-bordeaux-200'
                          : isRest
                          ? 'bg-amber-500 border-white text-white ring-2 ring-amber-200'
                          : 'bg-white border-charcoal-muted text-charcoal'
                      }`}
                    >
                      {isOrigin ? 'A' : isDestination ? 'B' : isRest ? '☕' : idx}
                    </div>

                    {/* Card */}
                    <div
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isRest
                          ? 'bg-amber-50/70 border-amber-200 shadow-2xs'
                          : isOrigin || isDestination
                          ? 'bg-white border-[#E8E1D5] shadow-2xs'
                          : 'bg-white/70 border-[#E8E1D5]/70'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-charcoal">{stop.name}</span>
                          {stop.duration && (
                            <span className="px-2 py-0.5 rounded-md bg-cream-200 text-charcoal-muted text-[10px] font-extrabold">
                              {stop.duration}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono font-bold text-bordeaux-700">
                          {stop.timeOffset}
                        </span>
                      </div>

                      {stop.note && (
                        <p className="text-[11px] text-charcoal-muted font-medium mt-1">
                          🔗 {stop.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
