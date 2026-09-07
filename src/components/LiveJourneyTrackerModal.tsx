import React, { useState } from 'react';
import {
  BileoClose,
  BileoMapPin,
  BileoCheck,
  BileoBus,
  BileoTrain,
  BileoPlane,
  BileoFerry,
} from './icons';
import { SampleDataNotice } from './common/SampleDataNotice';
import { sound } from '../utils/sound';

interface LiveJourneyTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPnr?: string;
  onShowToast?: (title: string, desc?: string, type?: 'success' | 'error' | 'info' | 'promo') => void;
}

interface ActiveJourney {
  pnr: string;
  carrier: string;
  vehicleType: string;
  mode: 'otobus' | 'ucak' | 'tren' | 'feribot';
  from: string;
  to: string;
  departureTime: string;
  estimatedArrival: string;
  progressPercent: number;
  currentLocation: string;
  currentSpeed: string;
  remainingKm: string;
  remainingTime: string;
  weatherOnRoad: string;
  status: 'Zamanında' | '5 Dk Erken' | '10 Dk Rötar';
  captainName: string;
  plateOrFlightNo: string;
}

const MOCK_JOURNEYS: ActiveJourney[] = [
  {
    pnr: 'BL-98421',
    carrier: 'Kamil Koç',
    vehicleType: 'Mercedes-Benz Tourismo (2+1)',
    mode: 'otobus',
    from: 'İstanbul (Esenler)',
    to: 'Ankara (AŞTİ)',
    departureTime: '13:00',
    estimatedArrival: '19:15',
    progressPercent: 68,
    currentLocation: 'Bolu Dağı Geçişi • Düzce - Bolu Sınırı',
    currentSpeed: '94 km/s',
    remainingKm: '142 km',
    remainingTime: '1 sa 45 dk',
    weatherOnRoad: '16°C Parçalı Bulutlu',
    status: 'Zamanında',
    captainName: 'Ahmet Yılmaz (1. Kaptan)',
    plateOrFlightNo: '34 KMK 842',
  },
  {
    pnr: 'BL-51203',
    carrier: 'TCDD Taşımacılık',
    vehicleType: 'Siemens Velaro YHT',
    mode: 'tren',
    from: 'İstanbul (Söğütlüçeşme)',
    to: 'Ankara (YHT Garı)',
    departureTime: '14:30',
    estimatedArrival: '19:08',
    progressPercent: 82,
    currentLocation: 'Polatlı Hızlı Tren Viyadüğü',
    currentSpeed: '248 km/s',
    remainingKm: '68 km',
    remainingTime: '24 dk',
    weatherOnRoad: '19°C Güneşli',
    status: '5 Dk Erken',
    captainName: 'Makinist: Serdar Kaya',
    plateOrFlightNo: 'YHT 91022',
  },
  {
    pnr: 'BL-77341',
    carrier: 'Türk Hava Yolları',
    vehicleType: 'Airbus A321neo',
    mode: 'ucak',
    from: 'İstanbul (IST)',
    to: 'İzmir (ADB)',
    departureTime: '15:15',
    estimatedArrival: '16:25',
    progressPercent: 45,
    currentLocation: 'Balıkesir Üzeri • İrtifa: 28.000 Feet',
    currentSpeed: '780 km/s',
    remainingKm: '185 km',
    remainingTime: '32 dk',
    weatherOnRoad: '22°C Açık',
    status: 'Zamanında',
    captainName: 'Kaptan Pilot: Barış Erdem',
    plateOrFlightNo: 'TK 2324',
  },
  {
    pnr: 'BL-33019',
    carrier: 'İDO',
    vehicleType: 'Hızlı Deniz Otobüsü',
    mode: 'feribot',
    from: 'Yenikapı',
    to: 'Bursa (Güzelyalı)',
    departureTime: '15:30',
    estimatedArrival: '17:00',
    progressPercent: 55,
    currentLocation: 'Marmara Denizi Açıkları • İmralı Kuzeyi',
    currentSpeed: '32 Knot (59 km/s)',
    remainingKm: '22 Deniz Mili',
    remainingTime: '38 dk',
    weatherOnRoad: 'Deniz Durumu: Hafif Dalgalı (1-2 B)',
    status: 'Zamanında',
    captainName: 'Süvari Kaptanı: Murat Çetin',
    plateOrFlightNo: 'İDO Burak Reis-3',
  },
];

export const LiveJourneyTrackerModal: React.FC<LiveJourneyTrackerModalProps> = ({
  isOpen,
  onClose,
  initialPnr,
  onShowToast,
}) => {
  const [searchPnr, setSearchPnr] = useState<string>(initialPnr || '');
  const [selectedJourney, setSelectedJourney] = useState<ActiveJourney>(MOCK_JOURNEYS[0]);

  if (!isOpen) return null;

  const handleSelectJourney = (journey: ActiveJourney) => {
    sound.playTick();
    setSelectedJourney(journey);
    setSearchPnr(journey.pnr);
  };

  const handleCopyShareLink = () => {
    sound.playSuccess();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`https://bileo.vercel.app/takip?pnr=${selectedJourney.pnr}`);
    }
    if (onShowToast) {
      onShowToast(
        'Canlı Takip Linki Kopyalandı',
        `${selectedJourney.pnr} PNR kodlu seferin canlı takip bağlantısı panoya kopyalandı. Yakınlarınızla paylaşabilirsiniz.`,
        'success'
      );
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'otobus': return BileoBus;
      case 'tren': return BileoTrain;
      case 'ucak': return BileoPlane;
      case 'feribot': return BileoFerry;
      default: return BileoBus;
    }
  };

  const handleSearchByPnr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPnr.trim()) return;
    sound.playTick();
    const found = MOCK_JOURNEYS.find(
      (j) => j.pnr.toLowerCase().includes(searchPnr.trim().toLowerCase())
    );
    if (found) {
      setSelectedJourney(found);
    } else if (onShowToast) {
      onShowToast('Sefer Bulundu (Simüle)', `${searchPnr.toUpperCase()} seferi aktif sinyal veriyor.`, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 text-lg font-black relative">
              🛰️
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-[#1E1B18] font-display">Sefer & GPS Yol Takibi (örnek)</h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  Örnek Sinyal
                </span>
              </div>
              <p className="text-xs text-charcoal-muted font-medium">Örnek sefer konumu, hız ve tahmini varış; canlı GPS bağlantısı yoktur</p>
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

        {/* PNR Search & Demo Tabs */}
        <div className="px-6 py-3 bg-white/50 border-b border-[#E8E1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchByPnr} className="flex items-center gap-2">
            <input
              type="text"
              value={searchPnr}
              onChange={(e) => setSearchPnr(e.target.value)}
              placeholder="PNR No (Örn: BL-98421)..."
              className="px-3 py-1.5 text-xs font-bold bg-white rounded-xl border border-[#E8E1D5] focus:outline-none focus:border-bordeaux-700 w-44"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white text-xs font-extrabold cursor-pointer transition-colors"
            >
              Sorgula
            </button>
          </form>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {MOCK_JOURNEYS.map((j) => (
              <button
                key={j.pnr}
                type="button"
                onClick={() => handleSelectJourney(j)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  selectedJourney.pnr === j.pnr
                    ? 'bg-bordeaux-700 text-white shadow-soft'
                    : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
                }`}
              >
                {React.createElement(getModeIcon(j.mode), { className: 'w-3 h-3' })}
                <span>{j.carrier}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Journey Status Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E1D5] shadow-xs space-y-5">
            
            {/* Top Bar: Carrier & Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#FAF7F2]">
              <div>
                <span className="text-[10px] font-black text-bordeaux-700 uppercase tracking-widest block mb-0.5">
                  PNR: {selectedJourney.pnr} • {selectedJourney.plateOrFlightNo}
                </span>
                <h4 className="text-xl font-black text-[#1E1B18] font-display">
                  {selectedJourney.carrier} — {selectedJourney.vehicleType}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-1.5">
                  <BileoCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{selectedJourney.status}</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#E8E1D5] border border-[#E8E1D5] text-xs font-bold text-charcoal flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Yakınlarınızla paylaşmak için canlı takip linkini kopyalayın"
                >
                  <span>🔗 Linki Paylaş</span>
                </button>
              </div>
            </div>

            {/* Visual Route Progress Track */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-charcoal">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-charcoal-muted font-medium block">Kalkış: {selectedJourney.departureTime}</span>
                  <span className="text-sm font-black text-charcoal">{selectedJourney.from}</span>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-[10px] text-charcoal-muted font-medium block">Tahmini Varış: {selectedJourney.estimatedArrival}</span>
                  <span className="text-sm font-black text-bordeaux-700">{selectedJourney.to}</span>
                </div>
              </div>

              {/* Progress Bar with Moving Pin */}
              <div className="relative pt-2 pb-1">
                <div className="w-full h-3 bg-cream-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-bordeaux-700 to-emerald-600 rounded-full transition-all duration-700 relative"
                    style={{ width: `${selectedJourney.progressPercent}%` }}
                  />
                </div>
                <div 
                  className="absolute top-0 -ml-3 flex flex-col items-center transition-all duration-700"
                  style={{ left: `${selectedJourney.progressPercent}%` }}
                >
                  <span className="text-base animate-bounce">📍</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-charcoal-muted pt-1">
                <span>Tamamlanan: %{selectedJourney.progressPercent}</span>
                <span>Kalan Mesafe: {selectedJourney.remainingKm} ({selectedJourney.remainingTime})</span>
              </div>
            </div>

            {/* Telemetry Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-0.5">
                <span className="text-[10px] font-extrabold text-charcoal-muted uppercase tracking-wider block">🚗 Örnek Hız</span>
                <span className="text-base font-black text-charcoal font-display block">{selectedJourney.currentSpeed}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-0.5">
                <span className="text-[10px] font-extrabold text-charcoal-muted uppercase tracking-wider block">⏱️ Kalan Süre</span>
                <span className="text-base font-black text-bordeaux-700 font-display block">{selectedJourney.remainingTime}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-0.5">
                <span className="text-[10px] font-extrabold text-charcoal-muted uppercase tracking-wider block">🌦️ Güzergah Havası</span>
                <span className="text-xs font-black text-charcoal block">{selectedJourney.weatherOnRoad}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-0.5">
                <span className="text-[10px] font-extrabold text-charcoal-muted uppercase tracking-wider block">👨‍✈️ Sorumlu Personel</span>
                <span className="text-xs font-black text-charcoal block truncate">{selectedJourney.captainName}</span>
              </div>

            </div>

            {/* Current Waypoint Box */}
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-cream-50 border border-cream-200 text-xs">
              <BileoMapPin className="w-4 h-4 text-bordeaux-700 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-[#1E1B18] block">Son Tespit Edilen GPS Mevkii:</span>
                <p className="text-charcoal font-medium">{selectedJourney.currentLocation}</p>
              </div>
            </div>

          </div>

          {/* Safety & Realtime FAQ Tip */}
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 space-y-1">
            <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider block mb-0.5">
              Bileo Akıllı Telemetri Sistemi
            </span>
            <p className="text-xs text-blue-950 font-medium leading-relaxed">
              🛰️ Otobüs, tren ve feribotlardaki uydu GPS alıcıları 15 saniyede bir koordinat güncellemesi yapar. Karayolları Genel Müdürlüğü ve TCDD trafik sinyalleri ile entegre çalışır.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
