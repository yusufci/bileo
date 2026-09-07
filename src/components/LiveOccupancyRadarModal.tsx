import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoBus,
  BileoTrain,
  BileoPlane,
  BileoFerry,
} from './icons';
import { SampleDataNotice } from './common/SampleDataNotice';
import { sound } from '../utils/sound';
import { TransportType } from '../types';

interface LiveOccupancyRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (from: string, to: string, mode: TransportType) => void;
  onShowToast?: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo') => void;
}

interface OccupancyItem {
  id: string;
  route: string;
  from: string;
  to: string;
  mode: TransportType;
  carrier: string;
  departureTime: string;
  occupancyPercent: number;
  remainingSeats: number;
  urgency: 'critical' | 'high' | 'moderate';
  note: string;
}

const OCCUPANCY_DATA: OccupancyItem[] = [
  {
    id: '1',
    route: 'İstanbul → Ankara',
    from: 'İstanbul',
    to: 'Ankara',
    mode: 'tren',
    carrier: 'TCDD Taşımacılık (YHT)',
    departureTime: '17:30 (Akşam Seferi)',
    occupancyPercent: 96,
    remainingSeats: 3,
    urgency: 'critical',
    note: 'Son 3 Business ve Ekonomi koltuğu kaldı. Biletler hızla tükeniyor.',
  },
  {
    id: '2',
    route: 'İstanbul → İzmir',
    from: 'İstanbul',
    to: 'İzmir',
    mode: 'otobus',
    carrier: 'Pamukkale Turizm (Jumbo 2+1)',
    departureTime: '19:00 (O-5 Ekspres)',
    occupancyPercent: 91,
    remainingSeats: 5,
    urgency: 'high',
    note: 'Son 2 adet tekli rahat koltuk mevcut.',
  },
  {
    id: '3',
    route: 'Ankara → Antalya',
    from: 'Ankara',
    to: 'Antalya',
    mode: 'ucak',
    carrier: 'Pegasus Hava Yolları',
    departureTime: '20:45',
    occupancyPercent: 94,
    remainingSeats: 4,
    urgency: 'critical',
    note: 'Akşam tatil uçuşu son ekonomi tarifesi.',
  },
  {
    id: '4',
    route: 'Bursa (Mudanya) → İstanbul (Yenikapı)',
    from: 'Bursa',
    to: 'İstanbul',
    mode: 'feribot',
    carrier: 'BUDO Hızlı Deniz Otobüsü',
    departureTime: '18:30',
    occupancyPercent: 82,
    remainingSeats: 18,
    urgency: 'moderate',
    note: 'Hafta sonu dönüş yoğunluğu başlamış durumda.',
  },
  {
    id: '5',
    route: 'Ankara → Kars',
    from: 'Ankara',
    to: 'Kars',
    mode: 'tren',
    carrier: 'Turistik Doğu Ekspresi',
    departureTime: '18:55',
    occupancyPercent: 99,
    remainingSeats: 1,
    urgency: 'critical',
    note: 'Yataklı kompartımanlar tamamen doldu. Son 1 örtülü kuşet koltuk.',
  },
  {
    id: '6',
    route: 'İstanbul → Trabzon',
    from: 'İstanbul',
    to: 'Trabzon',
    mode: 'otobus',
    carrier: 'Ali Osman Ulusoy (2+1)',
    departureTime: '16:00',
    occupancyPercent: 87,
    remainingSeats: 7,
    urgency: 'high',
    note: 'Karadeniz sahil yolu güzergahında akşam hareketli sefer.',
  },
];

export const LiveOccupancyRadarModal: React.FC<LiveOccupancyRadarModalProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
  onShowToast,
}) => {
  const [filterMode, setFilterMode] = useState<string>('all');

  if (!isOpen) return null;

  const filtered = filterMode === 'all'
    ? OCCUPANCY_DATA
    : OCCUPANCY_DATA.filter((item) => item.mode === filterMode);

  const handleSelectMode = (mode: string) => {
    sound.playTick();
    setFilterMode(mode);
  };

  const handleBook = (item: OccupancyItem) => {
    sound.playSuccess();
    if (onSelectRoute) {
      onSelectRoute(item.from, item.to, item.mode);
    }
    onClose();
  };

  const handleSetAlert = (item: OccupancyItem) => {
    sound.playSuccess();
    if (onShowToast) {
      onShowToast(
        'Doluluk Takip Alarmı Kuruldu',
        `${item.route}: bu örnek ekran bildirim göndermez; Turna landing sayfaları koltuk sayısı yayımlamaz. Gerçek fiyat alarmı için arama sonuçlarındaki Fiyat Alarmı düğmesini kullanın.`,
        'success'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-900 flex items-center justify-center border border-rose-200 text-lg font-black animate-pulse">
              🔥
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Doluluk & Son Koltuklar Radarı (örnek)</h3>
              <p className="text-xs text-charcoal-muted font-medium">Kritik Seferler, Dolmak Üzere Olan Hatlar ve Örnek Koltuk Sayıları; canlı envanter değildir</p>
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

        {/* Filter Pills */}
        <div className="px-6 py-3 bg-white/60 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Tüm Seferler' },
            { id: 'tren', label: '🚄 YHT & Tren' },
            { id: 'otobus', label: '🚌 Otobüs' },
            { id: 'ucak', label: '✈️ Uçak' },
            { id: 'feribot', label: '🚢 Deniz Otobüsü' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => handleSelectMode(pill.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                filterMode === pill.id
                  ? 'bg-rose-900 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* List of Occupancy Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-white border border-[#E8E1D5] hover:border-rose-300 transition-all shadow-2xs space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {item.mode === 'otobus' && <BileoBus className="w-4 h-4 text-bordeaux-700" />}
                      {item.mode === 'tren' && <BileoTrain className="w-4 h-4 text-emerald-700" />}
                      {item.mode === 'ucak' && <BileoPlane className="w-4 h-4 text-sky-700" />}
                      {item.mode === 'feribot' && <BileoFerry className="w-4 h-4 text-cyan-700" />}
                      <span className="text-xs font-black text-charcoal">{item.carrier}</span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${
                        item.urgency === 'critical'
                          ? 'bg-rose-50 text-rose-900 border-rose-300 animate-pulse'
                          : item.urgency === 'high'
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-cream-100 text-charcoal border-[#E8E1D5]'
                      }`}
                    >
                      {item.remainingSeats <= 3 ? `⚠️ Son ${item.remainingSeats} Koltuk!` : `%${item.occupancyPercent} Dolu`}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-charcoal">{item.route}</h4>
                  <p className="text-xs text-charcoal-muted font-semibold">🕒 Kalkış Saati: <strong className="text-charcoal">{item.departureTime}</strong></p>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] font-bold text-charcoal-muted">
                      <span>Doluluk Oranı</span>
                      <span className="text-rose-950 font-black">%{item.occupancyPercent}</span>
                    </div>
                    <div className="w-full bg-cream-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.occupancyPercent >= 95
                            ? 'bg-rose-600'
                            : item.occupancyPercent >= 85
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${item.occupancyPercent}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-charcoal-muted font-medium bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E1D5]">
                    💡 {item.note}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#E8E1D5]">
                  <button
                    type="button"
                    onClick={() => handleBook(item)}
                    className="flex-1 py-2.5 rounded-xl bg-rose-900 hover:bg-rose-950 text-white font-black text-xs transition-colors cursor-pointer shadow-soft flex items-center justify-center gap-1.5"
                  >
                    <span>Koltuk Seç & Bilet Al</span>
                    <span>→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAlert(item)}
                    className="px-3 py-2.5 rounded-xl bg-white hover:bg-cream-100 border border-[#E8E1D5] text-charcoal font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                    title="Doluluk Alarmı Kur"
                  >
                    <span>🔔</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Verification Badge */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-center justify-between text-xs text-charcoal-muted font-medium">
            <div className="flex items-center gap-2">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Bu doluluk verileri örnektir; taşıyıcı envanterine canlı bağlantı yoktur.</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
