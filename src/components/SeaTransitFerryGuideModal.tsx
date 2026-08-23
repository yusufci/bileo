import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoFerry,
  BileoArrowRight,
  BileoCheckCircle,
} from './icons';
import { sound } from '../utils/sound';

interface SeaTransitFerryGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (from: string, to: string) => void;
  onShowToast?: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo', duration?: number) => void;
}

interface FerryRoute {
  id: string;
  name: string;
  operator: string;
  from: string;
  to: string;
  duration: string;
  frequency: string;
  vehicleSupport: boolean;
  vehicleTypes: string[];
  passengerPrice: number;
  carPrice?: number;
  highlight: string;
}

const FERRY_ROUTES: FerryRoute[] = [
  {
    id: 'ido_yenikapi_bursa',
    name: 'Yenikapı ➔ Bursa (Mudanya)',
    operator: 'İDO (İstanbul Deniz Otobüsleri)',
    from: 'İstanbul (Yenikapı)',
    to: 'Bursa (Mudanya)',
    duration: '1s 35d',
    frequency: 'Günde 6-8 Sefer',
    vehicleSupport: true,
    vehicleTypes: ['Otomobil', 'SUV', 'Motosiklet', 'Yaya'],
    passengerPrice: 280,
    carPrice: 950,
    highlight: 'Osmangazi Köprüsü trafiğine girmeden doğrudan Mudanya ve Bursa merkez bağlantısı.',
  },
  {
    id: 'budo_kabatas_mudanya',
    name: 'Kabataş / Eminönü ➔ Mudanya',
    operator: 'BUDO (Bursa Deniz Otobüsleri)',
    from: 'İstanbul (Kabataş/Eminönü)',
    to: 'Bursa (Mudanya)',
    duration: '1s 50d',
    frequency: 'Günde 8 Sefer',
    vehicleSupport: false,
    vehicleTypes: ['Yaya Yolcu'],
    passengerPrice: 230,
    highlight: 'Şehir merkezinden (Kabataş vapur iskelesi) doğrudan Mudanya İskelesine ekonomik geçiş.',
  },
  {
    id: 'ido_yenikapi_bandirma',
    name: 'Yenikapı ➔ Bandırma (Balıkesir/Ege)',
    operator: 'İDO Hızlı Feribot',
    from: 'İstanbul (Yenikapı)',
    to: 'Balıkesir (Bandırma)',
    duration: '2s 45d',
    frequency: 'Günde 2-4 Sefer',
    vehicleSupport: true,
    vehicleTypes: ['Otomobil', 'SUV', 'Minibüs', 'Tır/Kamyon', 'Yaya'],
    passengerPrice: 380,
    carPrice: 1450,
    highlight: 'İzmir, Ayvalık ve Ege sahillerine gidenler için 4 saatlik kara yolunu kısaltan hızlı deniz köprüsü.',
  },
  {
    id: 'gestas_canakkale_eceabat',
    name: 'Çanakkale ➔ Eceabat / Kilitbahir',
    operator: 'GESTAŞ Deniz Ulaşım',
    from: 'Çanakkale Merkez',
    to: 'Eceabat (Gelibolu Yarımadası)',
    duration: '25 dk (Boğaz Geçişi)',
    frequency: '7/24 Her 30 Dakikada Bir',
    vehicleSupport: true,
    vehicleTypes: ['Otomobil', 'Motosiklet', 'Otobüs', 'Yaya'],
    passengerPrice: 35,
    carPrice: 280,
    highlight: 'Tarihi Gelibolu Şehitliği ve Çanakkale Boğazı arabalı vapur hattı.',
  },
  {
    id: 'gestas_geyikli_bozcaada',
    name: 'Geyikli İskelesi ➔ Bozcaada',
    operator: 'GESTAŞ Ada Hattı',
    from: 'Çanakkale (Geyikli)',
    to: 'Bozcaada',
    duration: '35 dk',
    frequency: 'Yazın Saatte Bir, Kışın Günde 4-6 Sefer',
    vehicleSupport: true,
    vehicleTypes: ['Otomobil (Online Randevulu)', 'Yaya'],
    passengerPrice: 60,
    carPrice: 680,
    highlight: 'Bozcaada kalesi, bağları ve plajlarına tek resmi arabalı vapur ulaşımı.',
  },
  {
    id: 'ege_adalar_midilli',
    name: 'Ayvalık ➔ Midilli (Yunanistan)',
    operator: 'Turyol & Jalem Tur',
    from: 'Balıkesir (Ayvalık)',
    to: 'Midilli Adası (Lesvos)',
    duration: '45 dk (Hızlı Katamaran)',
    frequency: 'Yaz Sezonunda Her Gün',
    vehicleSupport: true,
    vehicleTypes: ['Otomobil (Yeşil Sigortalı)', 'Yaya'],
    passengerPrice: 1250,
    carPrice: 2800,
    highlight: 'Kapıda vize uygulamasıyla Ege üzerinden Yunan Adaları geçişi.',
  },
];

const FARE_CATEGORIES = [
  {
    category: 'Yaya / Yolcu',
    icon: '🚶',
    rules: 'Kişi başı 1 adet el bagajı + 1 valiz ücretsizdir. İDO/BUDO salonlarında Wi-Fi ve büfe mevcuttur.',
  },
  {
    category: 'Otomobil & SUV (< 5 metre)',
    icon: '🚗',
    rules: 'Araç içi tüm yolcular için ayrıca yaya bileti alınması gerekebilir (Hatta göre değişkenlik gösterir).',
  },
  {
    category: 'Motosiklet & Scooter',
    icon: '🛵',
    rules: 'Feribot güvertesinde özel sabitleme alanı mevcuttur. Otomobil tarifesinin %40 indirimlisidir.',
  },
  {
    category: 'Karavan & Çekme Römork',
    icon: '🚐',
    rules: 'Metraj ve dingil sayısına göre feribot yanaşma kapısında kantar ölçümü yapılır.',
  },
];

export const SeaTransitFerryGuideModal: React.FC<SeaTransitFerryGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
  onShowToast,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ido_yenikapi_bursa');
  const [activeTab, setActiveTab] = useState<'routes' | 'vehicle_rates' | 'weather_tips'>('routes');

  if (!isOpen) return null;

  const currentRoute = FERRY_ROUTES.find((r) => r.id === selectedRouteId) || FERRY_ROUTES[0];

  const handleBookFerry = (from: string, to: string) => {
    sound.playSuccess();
    if (onShowToast) {
      onShowToast('Feribot Hattı Seçildi', `${from} ➔ ${to} rotasında deniz seferleri yüklendi.`, 'info');
    }
    if (onSelectRoute) {
      onSelectRoute(from, to);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-900 flex items-center justify-center border border-cyan-200">
              <BileoFerry className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Feribot, Deniz Otobüsü & Ada İskeleleri Portalı</h3>
              <p className="text-xs text-charcoal-muted font-medium">İDO, BUDO, GESTAŞ arabalı vapur hatları, ada geçişleri ve araç tarifeleri</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Sub Navigation */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveTab('routes'); }}
              className={`py-3 px-4 rounded-2xl text-center font-black text-xs transition-all cursor-pointer border shadow-2xs ${
                activeTab === 'routes'
                  ? 'bg-cyan-900 text-white border-cyan-900'
                  : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              Popüler Deniz Hatları
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveTab('vehicle_rates'); }}
              className={`py-3 px-4 rounded-2xl text-center font-black text-xs transition-all cursor-pointer border shadow-2xs ${
                activeTab === 'vehicle_rates'
                  ? 'bg-cyan-900 text-white border-cyan-900'
                  : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              Araç & Yolcu Kuralları
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveTab('weather_tips'); }}
              className={`py-3 px-4 rounded-2xl text-center font-black text-xs transition-all cursor-pointer border shadow-2xs ${
                activeTab === 'weather_tips'
                  ? 'bg-cyan-900 text-white border-cyan-900'
                  : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              Lodos & İskele Tavsiyeleri
            </button>
          </div>

          {activeTab === 'routes' && (
            <div className="space-y-4">
              
              {/* Route Pills */}
              <div className="flex flex-wrap gap-2">
                {FERRY_ROUTES.map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => { sound.playTick(); setSelectedRouteId(route.id); }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border shadow-2xs ${
                      selectedRouteId === route.id
                        ? 'bg-cyan-900 text-white border-cyan-900'
                        : 'bg-white text-charcoal border-[#E8E1D5] hover:border-cyan-300'
                    }`}
                  >
                    {route.name}
                  </button>
                ))}
              </div>

              {/* Spotlight Card */}
              <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8E1D5]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center">
                      <BileoFerry className="w-5 h-5 text-cyan-800" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-charcoal">{currentRoute.operator}</span>
                        {currentRoute.vehicleSupport && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Arabalı Vapur
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-black text-charcoal mt-0.5">
                        {currentRoute.from} ➔ {currentRoute.to}
                      </h4>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-charcoal-muted font-bold block">Yolcu / Araç Fiyatı</span>
                    <strong className="text-sm font-black text-cyan-950">
                      {currentRoute.passengerPrice} ₺ {currentRoute.carPrice ? `/ ${currentRoute.carPrice} ₺ (Oto)` : ''}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5]">
                    <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Sefer Süresi</span>
                    <strong className="text-xs font-black text-charcoal block mt-0.5">{currentRoute.duration}</strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5]">
                    <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Günlük Sıklık</span>
                    <strong className="text-xs font-black text-charcoal block mt-0.5">{currentRoute.frequency}</strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-cyan-50/60 border border-cyan-200 text-xs text-cyan-950 font-medium">
                  <strong>🚢 Güzergah Özelliği:</strong> {currentRoute.highlight}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-charcoal-muted font-medium">
                    <BileoCheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Kabul Edilen: {currentRoute.vehicleTypes.join(', ')}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBookFerry(currentRoute.from, currentRoute.to)}
                    className="px-5 py-2.5 rounded-xl bg-cyan-900 hover:bg-cyan-950 text-white font-black text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-soft"
                  >
                    <span>Bu hatta Feribot Ara</span>
                    <BileoArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'vehicle_rates' && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-charcoal uppercase tracking-wider">Feribot Araç Tipleri ve Biniş Kuralları</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FARE_CATEGORIES.map((cat, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon}</span>
                      <h5 className="font-black text-charcoal text-xs">{cat.category}</h5>
                    </div>
                    <p className="text-[11px] text-charcoal-muted font-medium leading-relaxed">
                      {cat.rules}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'weather_tips' && (
            <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-sm space-y-4 text-xs">
              <h4 className="font-black text-charcoal text-sm">Deniz Ulaşımında Hava Durumu & Kritik İpuçları</h4>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1">
                  <strong className="text-charcoal font-black block">💨 1. Marmara Lodos Uyarısı</strong>
                  <p className="text-charcoal-muted leading-relaxed font-medium">
                    Sonbahar ve kış aylarında güneybatıdan esen sert <strong>Lodos fırtınaları</strong> nedeniyle İDO ve BUDO deniz otobüsü seferleri iptal edilebilir. Bu durumda Osmangazi Köprüsü veya hızlı tren alternatif güzergah olarak kullanılır.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1">
                  <strong className="text-charcoal font-black block">🏝️ 2. Bozcaada & Gökçeada Yaz Yoğunluğu</strong>
                  <p className="text-charcoal-muted leading-relaxed font-medium">
                    Haziran - Eylül ayları arasında Geyikli ve Kabatepe iskelelerinden adalara araçla geçişlerde <strong>GESTAŞ online rezervasyon</strong> zorunludur. Randevusuz araçlar iskelede uzun kuyruklara girebilir.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1">
                  <strong className="text-charcoal font-black block">⚓ 3. İskelede Hazır Bulunma Süresi</strong>
                  <p className="text-charcoal-muted leading-relaxed font-medium">
                    Arabalı vapur binişlerinde sefer saatinden en az <strong>30 dakika önce</strong> araç sırasına girilmesi gerekir. Yaya yolcular için 15 dakika önce turnikeden geçiş yeterlidir.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-charcoal-muted font-medium">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Tüm resmi denizcilik işletmelerinin canlı sefer tarifeleri ve iskele konumları entegredir.</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal font-black text-xs transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
