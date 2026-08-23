import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoCheck,
} from './icons';
import { sound } from '../utils/sound';
import { TransportType } from '../types';

interface SeasonalDealsCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (from: string, to: string, mode: TransportType) => void;
  onShowToast?: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo') => void;
}

interface SeasonDealPeriod {
  id: string;
  name: string;
  seasonBadge: string;
  badgeColor: string;
  dateRange: string;
  bookingWindow: string;
  avgSaving: string;
  description: string;
  strategy: string;
  recommendedMode: TransportType;
  popularRoutes: string[];
}

const SEASONAL_PERIODS: SeasonDealPeriod[] = [
  {
    id: 'bayram',
    name: 'Ramazan & Kurban Bayramı Dönemi',
    seasonBadge: 'Yoğun Talep',
    badgeColor: 'bg-rose-50 text-rose-900 border-rose-200',
    dateRange: 'Resmi Bayram Tatilleri (9 Günlük Dönemler)',
    bookingWindow: 'Seferden 30 - 45 Gün Önce',
    avgSaving: '%40 Fiyat Avantajı & Yer Garantisi',
    description: 'Bayram dönemlerinde TCDD YHT ek trenleri ve otobüs ek seferleri resmi olarak 30 gün önce sisteme yüklenir. İlk 48 saatte yerler tükenir.',
    strategy: 'Bayramdan 1 gün önce değil, 2 gün önce akşam seferini seçerek hem %30 tasarruf edin hem de Osmangazi / Bolu gişe kilitlenmelerinden kurtulun.',
    recommendedMode: 'tren',
    popularRoutes: ['İstanbul → Ankara', 'İstanbul → İzmir', 'Ankara → Trabzon'],
  },
  {
    id: 'yaz',
    name: 'Ege & Akdeniz Yaz Sezonu',
    seasonBadge: 'Yaz Erken Rezervasyon',
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
    dateRange: '15 Haziran – 15 Eylül',
    bookingWindow: 'Mayıs Ayında (45 Gün Önce)',
    avgSaving: '%35 Erken Alım İndirimi',
    description: 'Bodrum, Çeşme, Fethiye, Kaş ve Antalya hatlarında yaz aylarında son dakika bilet fiyatları 2.5 katına kadar çıkabilir.',
    strategy: 'Salı veya Çarşamba kalkışlı biletleri tercih edin. Hafta sonu cuma-pazar biletlerine göre %25 daha ucuzdur.',
    recommendedMode: 'otobus',
    popularRoutes: ['İstanbul → Bodrum', 'İstanbul → Antalya', 'İzmir → Çeşme'],
  },
  {
    id: 'somestr',
    name: 'Sömestr & Kış Tatili',
    seasonBadge: 'Kış Sezonu',
    badgeColor: 'bg-cyan-50 text-cyan-900 border-cyan-200',
    dateRange: 'Ocak Sonu – Şubat Başı',
    bookingWindow: 'Aralık Ortası (30 Gün Önce)',
    avgSaving: '%25 İndirim',
    description: 'Uludağ, Palandöken, Erciyes kayak merkezleri ile Doğu Ekspresi Kars rotasında yoğunlaşan kış tatili dönemi.',
    strategy: 'Doğu Ekspresi yataklı vagon biletleri Salı ve Perşembe günleri TCDD tarafından satışa açılır; anında biletleme kritiktir.',
    recommendedMode: 'tren',
    popularRoutes: ['Ankara → Kars', 'İstanbul → Bursa', 'İstanbul → Kayseri'],
  },
  {
    id: 'universite',
    name: 'Üniversite Açılış & Vize/Final Dönemi',
    seasonBadge: 'Genç & Öğrenci',
    badgeColor: 'bg-purple-50 text-purple-900 border-purple-200',
    dateRange: 'Eylül Sonu – Ekim & Ocak – Haziran',
    bookingWindow: '15 - 20 Gün Önce',
    avgSaving: '%25 e-Devlet Öğrenci İndirimi',
    description: 'Yurt ve kampüslere dönüş haftalarında büyük şehirler (Ankara, İstanbul, İzmir, Eskişehir) arasında genç yolcu akışı.',
    strategy: 'Öğrenci kimliğinizi profilinize bağlayarak tüm otobüs ve trenlerde doğrudan %15-25 ekstra indirimden yararlanın.',
    recommendedMode: 'otobus',
    popularRoutes: ['İstanbul → Eskişehir', 'Ankara → İzmir', 'Bursa → Ankara'],
  },
];

export const SeasonalDealsCalendarModal: React.FC<SeasonalDealsCalendarModalProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
  onShowToast,
}) => {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('bayram');
  const [alarmSetFor, setAlarmSetFor] = useState<{ [key: string]: boolean }>({});

  if (!isOpen) return null;

  const current = SEASONAL_PERIODS.find((p) => p.id === selectedPeriodId) || SEASONAL_PERIODS[0];

  const handleSelectPeriod = (id: string) => {
    sound.playTick();
    setSelectedPeriodId(id);
  };

  const handleToggleAlarm = (id: string, name: string) => {
    sound.playSuccess();
    setAlarmSetFor((prev) => {
      const next = !prev[id];
      if (next && onShowToast) {
        onShowToast(
          'Erken Rezervasyon Alarmı Kuruldu! 🔔',
          `${name} için biletler satışa açıldığında e-posta ve SMS ile ilk size bildireceğiz.`,
          'promo'
        );
      }
      return { ...prev, [id]: next };
    });
  };

  const handleSelectRouteClick = (routeStr: string) => {
    sound.playSuccess();
    const parts = routeStr.split('→').map((s) => s.trim());
    if (parts.length === 2 && onSelectRoute) {
      onSelectRoute(parts[0], parts[1], current.recommendedMode);
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
              📅
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Erken Rezervasyon & Bayram/Yaz İndirim Takvimi</h3>
              <p className="text-xs text-charcoal-muted font-medium">En Uygun Bilet Alma Pencereleri, Sefer Açılış Tarihleri & Tasarruf Stratejileri</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Period Selection Tabs */}
        <div className="px-6 py-3 bg-white/60 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {SEASONAL_PERIODS.map((period) => (
            <button
              key={period.id}
              type="button"
              onClick={() => handleSelectPeriod(period.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedPeriodId === period.id
                  ? 'bg-amber-900 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              {period.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Info Hero Card */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-black border inline-block ${current.badgeColor}`}>
                {current.seasonBadge}
              </span>
              <h4 className="text-lg font-black text-charcoal pt-1">{current.name}</h4>
              <p className="text-xs text-charcoal-muted font-medium">
                🕒 Tarih Aralığı: <span className="text-charcoal font-bold">{current.dateRange}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleAlarm(current.id, current.name)}
                className={`px-4 py-2.5 rounded-xl font-black text-xs transition-colors cursor-pointer shadow-soft flex items-center gap-1.5 ${
                  alarmSetFor[current.id]
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-amber-900 hover:bg-amber-950 text-white'
                }`}
              >
                {alarmSetFor[current.id] ? (
                  <>
                    <BileoCheck className="w-3.5 h-3.5" />
                    <span>Alarm Kuruldu</span>
                  </>
                ) : (
                  <>
                    <span>🔔 Erken Rezervasyon Alarmı Kur</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Golden Rules & Timing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2 shadow-2xs">
              <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">
                🎯 İdeal Bilet Satın Alma Penceresi:
              </span>
              <p className="font-extrabold text-charcoal text-sm">{current.bookingWindow}</p>
              <p className="text-emerald-700 font-bold">{current.avgSaving}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2 shadow-2xs">
              <span className="text-[10px] font-black text-charcoal uppercase tracking-wider block">
                💡 Yolculuk Özeti & Talep Dinamiği:
              </span>
              <p className="text-charcoal font-medium leading-relaxed">{current.description}</p>
            </div>
          </div>

          {/* Expert Secret Strategy Callout */}
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 flex items-start gap-2.5 shadow-2xs">
            <span className="text-lg flex-shrink-0 mt-0.5">🧠</span>
            <div>
              <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block mb-0.5">
                BİLEO AKILLI REZERVASYON TAKTİĞİ
              </span>
              <p className="text-xs text-amber-950 font-semibold leading-relaxed">
                {current.strategy}
              </p>
            </div>
          </div>

          {/* Popular Routes for this Period */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-3 shadow-2xs">
            <span className="text-[10px] font-black text-charcoal uppercase tracking-wider block">
              🔥 Bu Dönemin En Çok Tercih Edilen Rotaları:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {current.popularRoutes.map((routeStr) => (
                <button
                  key={routeStr}
                  type="button"
                  onClick={() => handleSelectRouteClick(routeStr)}
                  className="px-3.5 py-2 rounded-xl bg-cream-50 hover:bg-cream-100 border border-[#E8E1D5] text-xs font-black text-charcoal hover:text-bordeaux-900 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>{routeStr}</span>
                  <span className="text-charcoal-muted">→</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bileo Price Guarantee */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-center justify-between text-xs text-charcoal-muted font-medium">
            <div className="flex items-center gap-2">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Bileo'da tüm sezonluk biletler 0 TL komisyon ve resmi tavan fiyat garantisiyle listelenir.</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
