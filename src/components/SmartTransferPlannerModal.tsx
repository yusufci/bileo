import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoTrain,
  BileoBus,
  BileoPlane,
  BileoFerry,
  BileoArrowRight,
  BileoClock,
  BileoSparkles,
} from './icons';
import { sound } from '../utils/sound';
import { SampleDataNotice } from './common/SampleDataNotice';
import { TransportType } from '../types';

interface SmartTransferPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (from: string, to: string, mode: TransportType) => void;
  onShowToast?: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo', duration?: number) => void;
}

interface TransferLeg {
  mode: TransportType;
  carrier: string;
  from: string;
  fromTerminal: string;
  to: string;
  toTerminal: string;
  duration: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
}

interface SmartTransferRoute {
  id: string;
  origin: string;
  destination: string;
  totalDuration: string;
  layoverDuration: string;
  transferHub: string;
  transferDetails: string;
  totalPrice: number;
  savingsVsDirect: string;
  legs: TransferLeg[];
  recommendedReason: string;
}

const SMART_TRANSFERS: SmartTransferRoute[] = [
  {
    id: 'tr-1',
    origin: 'İstanbul',
    destination: 'Kars',
    totalDuration: '28 Sa 15 Dk',
    layoverDuration: '1 Sa 45 Dk',
    transferHub: 'Ankara YHT Garı',
    transferDetails: 'YHT ile Ankara Garı varış, peron içi doğrudan Doğu Ekspresi transferi.',
    totalPrice: 840,
    savingsVsDirect: 'Uçuşa kıyasla %55 daha ekonomik & eşsiz kış manzarası',
    recommendedReason: 'Doğu Ekspresi kış manzaralı efsanevi aktarma kombinasyonu',
    legs: [
      {
        mode: 'tren',
        carrier: 'TCDD YHT',
        from: 'İstanbul (Söğütlüçeşme)',
        fromTerminal: 'Söğütlüçeşme YHT Garı',
        to: 'Ankara',
        toTerminal: 'Ankara YHT Garı',
        duration: '4 Sa 20 Dk',
        departureTime: '11:15',
        arrivalTime: '15:35',
        price: 430,
      },
      {
        mode: 'tren',
        carrier: 'TCDD Doğu Ekspresi',
        from: 'Ankara',
        fromTerminal: 'Ankara Tarihi Tren Garı',
        to: 'Kars',
        toTerminal: 'Kars Garı',
        duration: '22 Sa 10 Dk',
        departureTime: '17:20',
        arrivalTime: '15:30 (+1 gün)',
        price: 410,
      },
    ],
  },
  {
    id: 'tr-2',
    origin: 'İzmir',
    destination: 'Trabzon',
    totalDuration: '5 Sa 10 Dk',
    layoverDuration: '1 Sa 30 Dk',
    transferHub: 'İstanbul (SAW Havalimanı)',
    transferDetails: 'Pegasus aktarmalı SAW iç hat bağlantısı, bagaj aktarması otomatik.',
    totalPrice: 1650,
    savingsVsDirect: 'Karayoluna kıyasla 14 saat zaman tasarrufu',
    recommendedReason: 'Ege’den Karadeniz’e en hızlı transit koridor',
    legs: [
      {
        mode: 'ucak',
        carrier: 'Pegasus Airlines',
        from: 'İzmir',
        fromTerminal: 'Adnan Menderes Havalimanı (ADB)',
        to: 'İstanbul',
        toTerminal: 'Sabiha Gökçen Havalimanı (SAW)',
        duration: '1 Sa 05 Dk',
        departureTime: '08:30',
        arrivalTime: '09:35',
        price: 750,
      },
      {
        mode: 'ucak',
        carrier: 'AJet',
        from: 'İstanbul',
        fromTerminal: 'Sabiha Gökçen Havalimanı (SAW)',
        to: 'Trabzon',
        toTerminal: 'Trabzon Havalimanı (TZX)',
        duration: '1 Sa 45 Dk',
        departureTime: '11:05',
        arrivalTime: '12:50',
        price: 900,
      },
    ],
  },
  {
    id: 'tr-3',
    origin: 'Bursa',
    destination: 'Samsun',
    totalDuration: '6 Sa 45 Dk',
    layoverDuration: '55 Dk',
    transferHub: 'Ankara AŞTİ / YHT Garı',
    transferDetails: 'Bursa-Eskişehir otobüs + Eskişehir-Ankara YHT + Ankara-Samsun hızlı ekspres.',
    totalPrice: 790,
    savingsVsDirect: 'Doğrudan otobüse göre 3 saat daha hızlı',
    recommendedReason: 'YHT konforuyla birleştirilmiş hızlı İç Anadolu geçişi',
    legs: [
      {
        mode: 'otobus',
        carrier: 'Pamukkale Turizm',
        from: 'Bursa',
        fromTerminal: 'Bursa Şehirlerarası Otobüs Terminali',
        to: 'Eskişehir',
        toTerminal: 'Eskişehir Otogarı',
        duration: '2 Sa 15 Dk',
        departureTime: '07:00',
        arrivalTime: '09:15',
        price: 240,
      },
      {
        mode: 'tren',
        carrier: 'TCDD YHT',
        from: 'Eskişehir',
        fromTerminal: 'Eskişehir YHT Garı',
        to: 'Ankara',
        toTerminal: 'Ankara YHT Garı',
        duration: '1 Sa 20 Dk',
        departureTime: '10:10',
        arrivalTime: '11:30',
        price: 210,
      },
      {
        mode: 'otobus',
        carrier: 'Ali Osman Ulusoy',
        from: 'Ankara',
        fromTerminal: 'AŞTİ Terminali',
        to: 'Samsun',
        toTerminal: 'SAMSOT Otogarı',
        duration: '5 Sa 10 Dk',
        departureTime: '12:30',
        arrivalTime: '17:40',
        price: 340,
      },
    ],
  },
  {
    id: 'tr-4',
    origin: 'İstanbul',
    destination: 'Bodrum',
    totalDuration: '4 Sa 30 Dk',
    layoverDuration: '1 Sa 15 Dk',
    transferHub: 'İzmir Adnan Menderes (ADB)',
    transferDetails: 'İstanbul-İzmir uçuş + Havaş doğrudan Bodrum & Çeşme transferi.',
    totalPrice: 1320,
    savingsVsDirect: 'Karayolu 9 saati 4.5 saate indirir',
    recommendedReason: 'Yaz sezonu en pratik Ege sahil ekspresi',
    legs: [
      {
        mode: 'ucak',
        carrier: 'Türk Hava Yolları',
        from: 'İstanbul',
        fromTerminal: 'İstanbul Havalimanı (IST)',
        to: 'İzmir',
        toTerminal: 'Adnan Menderes Havalimanı (ADB)',
        duration: '1 Sa 10 Dk',
        departureTime: '09:00',
        arrivalTime: '10:10',
        price: 890,
      },
      {
        mode: 'otobus',
        carrier: 'Pamukkale / Havaş Bodrum Ekspres',
        from: 'İzmir',
        fromTerminal: 'Adnan Menderes Havalimanı Çıkış',
        to: 'Bodrum',
        toTerminal: 'Bodrum Yeni Otogarı',
        duration: '3 Sa 15 Dk',
        departureTime: '11:25',
        arrivalTime: '14:40',
        price: 430,
      },
    ],
  },
];

export const SmartTransferPlannerModal: React.FC<SmartTransferPlannerModalProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
  onShowToast,
}) => {
  const [selectedRoute, setSelectedRoute] = useState<SmartTransferRoute>(SMART_TRANSFERS[0]);

  if (!isOpen) return null;

  const handleSelectRoutePlan = (route: SmartTransferRoute) => {
    sound.playTick();
    setSelectedRoute(route);
  };

  const handleBookCombination = (route: SmartTransferRoute) => {
    sound.playSuccess();
    if (onShowToast) {
      onShowToast(
        'Aktarmalı Bilet Planı Seçildi',
        `${route.origin} ➔ ${route.destination} aktarmalı sefer planı sepete eklendi.`,
        'success'
      );
    }
    if (onSelectRoute) {
      onSelectRoute(route.origin, route.destination, route.legs[0].mode);
    }
    onClose();
  };

  const getModeIcon = (mode: TransportType) => {
    switch (mode) {
      case 'tren': return <BileoTrain className="w-4 h-4 text-emerald-700" />;
      case 'ucak': return <BileoPlane className="w-4 h-4 text-sky-700" />;
      case 'feribot': return <BileoFerry className="w-4 h-4 text-cyan-700" />;
      default: return <BileoBus className="w-4 h-4 text-bordeaux-700" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center border border-amber-200">
              <BileoTrain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Akıllı Aktarma & Bağlantılı Sefer Planlayıcı (örnek)</h3>
              <p className="text-xs text-charcoal-muted font-medium">Doğrudan hat bulunmayan rotalarda optimize edilmiş hızlı ve ekonomik aktarmalar</p>
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Transfer Route Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SMART_TRANSFERS.map((r) => (
              <div
                key={r.id}
                onClick={() => handleSelectRoutePlan(r)}
                className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-soft space-y-2 ${
                  selectedRoute.id === r.id
                    ? 'border-bordeaux-900 bg-bordeaux-50/40 ring-2 ring-bordeaux-900/10'
                    : 'border-[#E8E1D5] hover:border-bordeaux-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-charcoal">
                    <span>{r.origin}</span>
                    <BileoArrowRight className="w-3.5 h-3.5 text-bordeaux-700" />
                    <span>{r.destination}</span>
                  </div>
                  <span className="text-xs font-extrabold text-bordeaux-900">{r.totalPrice} ₺</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-charcoal-muted font-semibold">
                  <span className="flex items-center gap-1">
                    <BileoClock className="w-3 h-3 text-amber-600" />
                    {r.totalDuration}
                  </span>
                  <span className="text-emerald-700 font-bold">{r.legs.length} Bacak</span>
                </div>
                <p className="text-[10px] text-charcoal-muted line-clamp-1 italic">
                  Hub: {r.transferHub}
                </p>
              </div>
            ))}
          </div>

          {/* Selected Itinerary Detailed Visual Timeline */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E1D5] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E1D5]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-bordeaux-50 text-bordeaux-900 font-black text-xs border border-bordeaux-200">
                    Önerilen Aktarma Planı
                  </span>
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <BileoSparkles className="w-3.5 h-3.5" />
                    {selectedRoute.savingsVsDirect}
                  </span>
                </div>
                <h4 className="text-xl font-black text-charcoal mt-1 font-display">
                  {selectedRoute.origin} ➔ {selectedRoute.destination}
                </h4>
                <p className="text-xs text-charcoal-muted font-medium mt-0.5">
                  {selectedRoute.recommendedReason}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-charcoal-muted font-bold block">Toplam Fiyat</span>
                  <span className="text-2xl font-black text-bordeaux-900">{selectedRoute.totalPrice} ₺</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleBookCombination(selectedRoute)}
                  className="px-5 py-3 rounded-2xl bg-bordeaux-900 hover:bg-bordeaux-950 text-white font-black text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-soft"
                >
                  <span>Kombine Seferi İncele</span>
                  <BileoArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Hub & Safe Buffer Notification */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center flex-shrink-0">
                <BileoClock className="w-4 h-4 text-amber-900" />
              </div>
              <div className="space-y-0.5 text-xs">
                <div className="flex items-center gap-2">
                  <strong className="text-amber-950 font-black">Aktarma Noktası: {selectedRoute.transferHub}</strong>
                  <span className="text-amber-800 font-bold bg-white px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                    Bekleme Süresi: {selectedRoute.layoverDuration}
                  </span>
                </div>
                <p className="text-amber-900 font-medium">
                  {selectedRoute.transferDetails} (Bileo 45+ dakika güvenli aktarma garantisi geçerlidir).
                </p>
              </div>
            </div>

            {/* Visual Multi-Leg Timeline */}
            <div className="space-y-4">
              <h5 className="text-xs font-black text-charcoal uppercase tracking-wider">Sefer Bacakları & Zaman Çizelgesi</h5>
              
              <div className="space-y-3">
                {selectedRoute.legs.map((leg, index) => (
                  <div key={index} className="relative">
                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Leg Meta & Carrier */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E1D5] flex items-center justify-center shadow-2xs">
                          {getModeIcon(leg.mode)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-bordeaux-800 uppercase bg-bordeaux-50 px-2 py-0.5 rounded-md">
                              {index + 1}. Bacak ({leg.mode.toUpperCase()})
                            </span>
                            <span className="text-xs font-black text-charcoal">{leg.carrier}</span>
                          </div>
                          <p className="text-[11px] text-charcoal-muted font-bold mt-0.5">
                            Süre: {leg.duration}
                          </p>
                        </div>
                      </div>

                      {/* Station & Timing Flow */}
                      <div className="flex items-center gap-6 flex-1 max-w-md">
                        <div className="text-left">
                          <span className="text-sm font-black text-charcoal block">{leg.departureTime}</span>
                          <span className="text-[11px] font-bold text-charcoal-muted block">{leg.from}</span>
                          <span className="text-[10px] text-charcoal-muted/70 block truncate max-w-[140px]">{leg.fromTerminal}</span>
                        </div>

                        <div className="flex-1 flex flex-col items-center">
                          <span className="text-[10px] font-bold text-charcoal-muted">{leg.duration}</span>
                          <div className="w-full h-0.5 bg-bordeaux-300 relative my-1">
                            <div className="w-2 h-2 rounded-full bg-bordeaux-900 absolute right-0 top-1/2 -translate-y-1/2" />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700">Direkt</span>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-charcoal block">{leg.arrivalTime}</span>
                          <span className="text-[11px] font-bold text-charcoal-muted block">{leg.to}</span>
                          <span className="text-[10px] text-charcoal-muted/70 block truncate max-w-[140px]">{leg.toTerminal}</span>
                        </div>
                      </div>

                      {/* Leg Price */}
                      <div className="text-right pl-4 md:border-l md:border-[#E8E1D5]">
                        <span className="text-[10px] text-charcoal-muted block">Bacak Ücreti</span>
                        <span className="text-base font-black text-charcoal">{leg.price} ₺</span>
                      </div>

                    </div>

                    {/* Layover connector between legs */}
                    {index < selectedRoute.legs.length - 1 && (
                      <div className="flex items-center justify-center my-1">
                        <div className="px-3 py-1 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300 text-[10px] font-black flex items-center gap-1.5 shadow-2xs">
                          <span>🔄 {selectedRoute.transferHub} Aktarması ({selectedRoute.layoverDuration})</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-center gap-2.5">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-charcoal-muted font-semibold">Gecikme durumunda ücretsiz sonraki sefer koruması</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-center gap-2.5">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-charcoal-muted font-semibold">Tek PNR ile tüm bacaklar tek ekrandan kontrol edilir</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-center gap-2.5">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-charcoal-muted font-semibold">En az 45 dk emniyetli aktarma süresi zorunludur</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
