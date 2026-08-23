import React, { useState } from 'react';
import {
  BileoClose,
  BileoMapPin,
} from './icons';
import { sound } from '../utils/sound';

interface TaxiEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HubTaxiInfo {
  id: string;
  hubName: string;
  city: string;
  baseFare: string;
  perKmRate: string;
  shortHopMin: string;
  standLocation: string;
  routes: { destination: string; distanceKm: number; estDuration: string; estFare: string }[];
  tips: string;
}

const TAXI_HUBS: HubTaxiInfo[] = [
  {
    id: 'esenler',
    hubName: 'Büyük İstanbul Otogarı (Esenler)',
    city: 'İstanbul',
    baseFare: '30,00 TL',
    perKmRate: '20,00 TL / km',
    shortHopMin: '100,00 TL',
    standLocation: 'Alt Kat Otobüs Peronları Çıkışı & Metro İstasyonu Girişi',
    routes: [
      { destination: 'Taksim Meydanı', distanceKm: 14, estDuration: '25-35 dk', estFare: '310 - 360 TL' },
      { destination: 'Kadıköy Rıhtım (Köprü Geçişli)', distanceKm: 24, estDuration: '35-50 dk', estFare: '510 - 580 TL + Köprü' },
      { destination: 'Bakırköy Sahil', distanceKm: 11, estDuration: '20-25 dk', estFare: '250 - 290 TL' },
      { destination: 'Beşiktaş Meydan', distanceKm: 16, estDuration: '30-40 dk', estFare: '350 - 410 TL' },
    ],
    tips: 'Resmi sarı otogar taksi duraklarını tercih ediniz. Taksimetrenin sıfırlandığını teyit ediniz.',
  },
  {
    id: 'ist-airport',
    hubName: 'İstanbul Havalimanı (IST)',
    city: 'İstanbul',
    baseFare: '30,00 TL',
    perKmRate: '20,00 TL / km',
    shortHopMin: '100,00 TL',
    standLocation: 'Gelen Yolcu Katı (İç & Dış Hat Çıkış Kapıları)',
    routes: [
      { destination: 'Taksim / Beyoğlu', distanceKm: 41, estDuration: '45-55 dk', estFare: '850 - 950 TL' },
      { destination: 'Kadıköy / Moda (Avrasya/Köprü)', distanceKm: 55, estDuration: '55-75 dk', estFare: '1.150 - 1.300 TL + Geçiş' },
      { destination: 'Esenler Otogarı', distanceKm: 36, estDuration: '35-45 dk', estFare: '750 - 850 TL' },
      { destination: 'Bakırköy / Ataköy', distanceKm: 44, estDuration: '45-55 dk', estFare: '900 - 1.000 TL' },
    ],
    tips: 'Sarı (standart), Turkuaz (%15 konforlu) ve Siyah VIP (%50 lüks) taksi seçenekleri bulunmaktadır.',
  },
  {
    id: 'saw-airport',
    hubName: 'Sabiha Gökçen Havalimanı (SAW)',
    city: 'İstanbul',
    baseFare: '30,00 TL',
    perKmRate: '20,00 TL / km',
    shortHopMin: '100,00 TL',
    standLocation: 'Gelen Yolcu Katı Terminal Çıkış Taksi Sırası',
    routes: [
      { destination: 'Kadıköy Rıhtım', distanceKm: 32, estDuration: '35-45 dk', estFare: '670 - 750 TL' },
      { destination: 'Taksim Meydanı (Köprü Geçişli)', distanceKm: 44, estDuration: '50-70 dk', estFare: '910 - 1.050 TL + Köprü' },
      { destination: 'Üsküdar Marmaray', distanceKm: 34, estDuration: '40-50 dk', estFare: '710 - 800 TL' },
      { destination: 'Pendik YHT Garı', distanceKm: 12, estDuration: '15-20 dk', estFare: '270 - 320 TL' },
    ],
    tips: 'Terminal çıkışındaki resmi SAW Taksi Kooperatifi görevlilerinden destek alabilirsiniz.',
  },
  {
    id: 'asti-ankara',
    hubName: 'Ankara AŞTİ Otogarı',
    city: 'Ankara',
    baseFare: '25,00 TL',
    perKmRate: '18,00 TL / km',
    shortHopMin: '90,00 TL',
    standLocation: 'AŞTİ Gelen Yolcu Peronları Taksi Çıkışı',
    routes: [
      { destination: 'Kızılay Meydanı', distanceKm: 6, estDuration: '10-15 dk', estFare: '130 - 160 TL' },
      { destination: 'Ankara YHT Garı', distanceKm: 7, estDuration: '12-18 dk', estFare: '150 - 180 TL' },
      { destination: 'Tunalı Hilmi / Çankaya', distanceKm: 8, estDuration: '15-20 dk', estFare: '170 - 210 TL' },
      { destination: 'Esenboğa Havalimanı', distanceKm: 35, estDuration: '35-45 dk', estFare: '650 - 750 TL' },
    ],
    tips: 'AŞTİ çıkışında yoğun saatlerde Ankaray hafif raylı sistemi de hızlı bir alternatiftir.',
  },
  {
    id: 'yht-ankara',
    hubName: 'Ankara YHT Garı',
    city: 'Ankara',
    baseFare: '25,00 TL',
    perKmRate: '18,00 TL / km',
    shortHopMin: '90,00 TL',
    standLocation: 'Gar Ana Girişi & Celal Bayar Bulvarı Çıkışı',
    routes: [
      { destination: 'Kızılay / Bakanlıklar', distanceKm: 3, estDuration: '8-12 dk', estFare: '80 - 100 TL' },
      { destination: 'AŞTİ Otogarı', distanceKm: 7, estDuration: '12-18 dk', estFare: '150 - 180 TL' },
      { destination: 'Bilkent / ODTÜ Kampüs', distanceKm: 14, estDuration: '20-25 dk', estFare: '270 - 320 TL' },
    ],
    tips: 'Gar altındaki Başkentray ve M4 metro bağlantılarıyla şehir merkezine trafik olmadan ulaşabilirsiniz.',
  },
];

export const TaxiEstimatorModal: React.FC<TaxiEstimatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedHubId, setSelectedHubId] = useState<string>('esenler');

  if (!isOpen) return null;

  const currentHub = TAXI_HUBS.find((h) => h.id === selectedHubId) || TAXI_HUBS[0];

  const handleSelectHub = (id: string) => {
    sound.playTick();
    setSelectedHubId(id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
              <BileoMapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Otogar & Havalimanı Taksi Ücret Hesaplayıcı</h3>
              <p className="text-xs text-charcoal-muted font-medium">Resmi tarife, tahmini yolculuk tutarları ve durak lokasyonları</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Hub Tabs */}
        <div className="px-6 py-3 bg-white/50 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {TAXI_HUBS.map((hub) => (
            <button
              key={hub.id}
              type="button"
              onClick={() => handleSelectHub(hub.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                selectedHubId === hub.id
                  ? 'bg-bordeaux-700 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              {hub.hubName}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Tariff Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5]">
              <span className="text-[10px] text-charcoal-muted font-bold block">Açılış Ücreti</span>
              <span className="text-xs font-black text-charcoal mt-0.5 block">{currentHub.baseFare}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5]">
              <span className="text-[10px] text-charcoal-muted font-bold block">Kilometre Başı</span>
              <span className="text-xs font-black text-charcoal mt-0.5 block">{currentHub.perKmRate}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] text-amber-800 font-bold block">İndi-Bindi Taban Ücreti</span>
              <span className="text-xs font-black text-amber-950 mt-0.5 block">{currentHub.shortHopMin}</span>
            </div>
          </div>

          {/* Stand Location */}
          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-white border border-[#E8E1D5] text-xs">
            <BileoMapPin className="w-4 h-4 text-bordeaux-700 flex-shrink-0" />
            <span className="text-charcoal font-bold">
              <span className="text-charcoal-muted font-normal">Taksi Durağı Lokasyonu: </span>
              {currentHub.standLocation}
            </span>
          </div>

          {/* Popular Routes List */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-black text-charcoal uppercase tracking-wider block">
              Popüler Varış Noktaları & Tahmini Tutar
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentHub.routes.map((route, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#1E1B18]">{route.destination}</span>
                    <span className="text-xs font-black text-emerald-700">{route.estFare}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-charcoal-muted pt-1">
                    <span>Mesafe: {route.distanceKm} km</span>
                    <span>Süre: {route.estDuration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips Card */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80">
            <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-1">
              Yolcu Güvenlik İpucu
            </span>
            <p className="text-xs text-amber-950 font-medium leading-relaxed">
              💡 {currentHub.tips}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
