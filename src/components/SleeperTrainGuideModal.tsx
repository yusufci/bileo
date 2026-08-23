import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoTrain,
  BileoArrowRight,
} from './icons';
import { sound } from '../utils/sound';

interface SleeperTrainGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (from: string, to: string) => void;
  onShowToast?: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo', duration?: number) => void;
}

interface SleeperTrainRoute {
  id: string;
  name: string;
  from: string;
  to: string;
  duration: string;
  frequency: string;
  highlight: string;
  stops: string[];
  cabinTypes: ('yatakli' | 'kusetli' | 'pulman')[];
  priceFrom: number;
}

const SLEEPER_TRAIN_ROUTES: SleeperTrainRoute[] = [
  {
    id: 'dogu_ekspresi',
    name: 'Turistik Doğu Ekspresi',
    from: 'Ankara',
    to: 'Kars',
    duration: '31s 40d (1.310 km)',
    frequency: 'Haftada 3 Gün (Kış/Bahar)',
    highlight: 'Karasu Vadisi, İliç Kanyonu, Erzurum Cağ Kebabı molası & Çıldır Gölü',
    stops: ['Ankara Gar', 'Kayseri', 'Sivas', 'İliç', 'Erzincan', 'Erzurum', 'Sarıkamış', 'Kars Gar'],
    cabinTypes: ['yatakli', 'kusetli'],
    priceFrom: 1850,
  },
  {
    id: 'van_golu_ekspresi',
    name: 'Van Gölü Ekspresi',
    from: 'Ankara',
    to: 'Tatvan (Bitlis)',
    duration: '25s 30d (1.200 km)',
    frequency: 'Salı & Pazar Günleri',
    highlight: 'Fırat Nehri manzarası, Muş Ovası, Nemrut Krater Gölü & Van Gölü Feribotu',
    stops: ['Ankara Gar', 'Irmak', 'Kayseri', 'Sivas', 'Malatya', 'Elazığ', 'Bingöl', 'Muş', 'Tatvan'],
    cabinTypes: ['yatakli', 'kusetli', 'pulman'],
    priceFrom: 620,
  },
  {
    id: 'guney_kurtalan',
    name: 'Güney Kurtalan Ekspresi',
    from: 'Ankara',
    to: 'Kurtalan (Siirt)',
    duration: '24s 00d (1.212 km)',
    frequency: 'Pzt, Çrş, Per, Cmt, Paz',
    highlight: 'Mezopotamya bozkırları, Diyarbakır Surları & Dicle Vadisi',
    stops: ['Ankara Gar', 'Kayseri', 'Sivas', 'Malatya', 'Diyarbakır', 'Batman', 'Kurtalan'],
    cabinTypes: ['yatakli', 'kusetli', 'pulman'],
    priceFrom: 580,
  },
  {
    id: 'izmir_mavi',
    name: 'İzmir Mavi Treni',
    from: 'İzmir (Basmane)',
    to: 'Ankara',
    duration: '13s 30d (Gece Seferi)',
    frequency: 'Her Gün Karşılıklı',
    highlight: 'Ege bağları, Manisa Spil Dağı etekleri, Eskişehir aktarması & Yataklı vagon konforu',
    stops: ['İzmir Basmane', 'Manisa', 'Uşak', 'Afyonkarahisar', 'Eskişehir', 'Ankara Gar'],
    cabinTypes: ['yatakli', 'pulman'],
    priceFrom: 490,
  },
  {
    id: 'sofya_ekspresi',
    name: 'İstanbul - Sofya Ekspresi',
    from: 'İstanbul (Halkalı)',
    to: 'Sofya (Bulgaristan)',
    duration: '11s 45d (Uluslararası)',
    frequency: 'Her Akşam 20:00 Kalkış',
    highlight: 'Kapıkule sınır geçişi, Plovdiv & Balkan dağları manzarasıyla Avrupa yolculuğu',
    stops: ['İstanbul Halkalı', 'Çerkezköy', 'Edirne', 'Kapıkule', 'Svilengrad', 'Dimitrovgrad', 'Plovdiv', 'Sofya'],
    cabinTypes: ['yatakli', 'kusetli'],
    priceFrom: 1450,
  },
];

const CABIN_INFO = [
  {
    type: '2 Kişilik Yataklı Vagon (Sleeper)',
    icon: '🛌',
    features: [
      'Özel lavabo ve ayna',
      'Mini buzdolabı (ücretsiz su ve çikolata ikramı)',
      '220V priz ve ayarlanabilir iklimlendirme',
      'İçeriden kilitlenebilir oda kapısı',
      'Masa ve okuma lambaları',
    ],
    recommendedFor: 'Çiftler, fotoğraf tutkunları ve tam mahremiyet arayanlar.',
  },
  {
    type: '4 Kişilik Örtülü Kuşetli Vagon',
    icon: '🛏️',
    features: [
      'Karşılıklı 4 kişilik açılır ranza yatak düzeni',
      'TCDD ambalajlı temiz nevresim, çarşaf ve yastık',
      'Orta masa ve 220V priz',
      'Gündüz koltuk, gece yatağa dönüşebilen sistem',
    ],
    recommendedFor: 'Arkadaş grupları, aileler ve bütçe dostu macera arayanlar.',
  },
  {
    type: 'Pulman Koltuk (Ekonomik)',
    icon: '💺',
    features: [
      '2+1 yatabilen ergonomik koltuklar',
      'Geniş diz mesafesi ve baş üstü bagaj alanı',
      'Yemekli vagona serbest geçiş imkanı',
    ],
    recommendedFor: 'Kısa mesafe veya ekonomik seyahat edenler.',
  },
];

export const SleeperTrainGuideModal: React.FC<SleeperTrainGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
  onShowToast,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('dogu_ekspresi');
  const [activeTab, setActiveTab] = useState<'routes' | 'cabins' | 'tips'>('routes');

  if (!isOpen) return null;

  const currentRoute = SLEEPER_TRAIN_ROUTES.find((r) => r.id === selectedRouteId) || SLEEPER_TRAIN_ROUTES[0];

  const handleBookTrain = (from: string, to: string) => {
    sound.playSuccess();
    if (onShowToast) {
      onShowToast('Tren Hattı Seçildi', `${from} ➔ ${to} rotasında bilet arama motoru yüklendi.`, 'info');
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
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-900 flex items-center justify-center border border-emerald-200 text-lg font-black">
              🚂
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">TCDD Yataklı & Turistik Trenler Portalı</h3>
              <p className="text-xs text-charcoal-muted font-medium">Doğu Ekspresi, Van Gölü, Kurtalan ve Gece Mavi Trenleri seyahat rehberi</p>
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
          
          {/* Tabs */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveTab('routes'); }}
              className={`py-3 px-4 rounded-2xl text-center font-black text-xs transition-all cursor-pointer border shadow-2xs ${
                activeTab === 'routes'
                  ? 'bg-emerald-900 text-white border-emerald-900'
                  : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              🗺️ Efsanevi Tren Hatları
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveTab('cabins'); }}
              className={`py-3 px-4 rounded-2xl text-center font-black text-xs transition-all cursor-pointer border shadow-2xs ${
                activeTab === 'cabins'
                  ? 'bg-emerald-900 text-white border-emerald-900'
                  : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              🛌 Yataklı & Kuşetli Vagonlar
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveTab('tips'); }}
              className={`py-3 px-4 rounded-2xl text-center font-black text-xs transition-all cursor-pointer border shadow-2xs ${
                activeTab === 'tips'
                  ? 'bg-emerald-900 text-white border-emerald-900'
                  : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              💡 Bilet Bulma & Hazırlık Taktikleri
            </button>
          </div>

          {activeTab === 'routes' && (
            <div className="space-y-4">
              
              {/* Route Selector Pills */}
              <div className="flex flex-wrap gap-2">
                {SLEEPER_TRAIN_ROUTES.map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => { sound.playTick(); setSelectedRouteId(route.id); }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border shadow-2xs ${
                      selectedRouteId === route.id
                        ? 'bg-emerald-900 text-white border-emerald-900'
                        : 'bg-white text-charcoal border-[#E8E1D5] hover:border-emerald-300'
                    }`}
                  >
                    {route.name}
                  </button>
                ))}
              </div>

              {/* Selected Route Spotlight Card */}
              <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8E1D5]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                      <BileoTrain className="w-5 h-5 text-emerald-800" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-charcoal">{currentRoute.name}</h4>
                      <p className="text-xs text-charcoal-muted font-medium">
                        {currentRoute.from} Gar ➔ {currentRoute.to} Gar
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-charcoal-muted font-bold block">Başlangıç Fiyatı</span>
                    <strong className="text-sm font-black text-emerald-900">{currentRoute.priceFrom} ₺</strong>
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5]">
                    <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Yolculuk Süresi & Mesafe</span>
                    <strong className="text-xs font-black text-charcoal block mt-0.5">{currentRoute.duration}</strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5]">
                    <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Sefer Sıklığı</span>
                    <strong className="text-xs font-black text-charcoal block mt-0.5">{currentRoute.frequency}</strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 font-medium">
                  <strong>🌟 Manzara ve Önemli Noktalar:</strong> {currentRoute.highlight}
                </div>

                {/* Intermediate Stops */}
                <div>
                  <span className="text-[10px] font-black text-charcoal-muted uppercase tracking-wider block mb-2">Güzergah Ana İstasyonları</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {currentRoute.stops.map((stop, i) => (
                      <React.Fragment key={i}>
                        <span className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#E8E1D5] text-[11px] font-bold text-charcoal">
                          {stop}
                        </span>
                        {i < currentRoute.stops.length - 1 && (
                          <BileoArrowRight className="w-3 h-3 text-charcoal-muted/60" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleBookTrain(currentRoute.from, currentRoute.to)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-soft"
                  >
                    <span>Bu Trende Sefer Ara</span>
                    <BileoArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'cabins' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3.5">
                {CABIN_INFO.map((cabin, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl bg-white border border-[#E8E1D5] space-y-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{cabin.icon}</span>
                      <h4 className="text-sm font-black text-charcoal">{cabin.type}</h4>
                    </div>

                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-charcoal-muted">
                      {cabin.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 font-bold">
                      💡 Kimler İçin İdeal: {cabin.recommendedFor}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-sm space-y-4 text-xs">
              <h4 className="font-black text-charcoal text-sm">Doğu Ekspresi ve Gece Trenleri İçin Altın Taktikler</h4>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1">
                  <strong className="text-charcoal font-black block">🕒 1. Biletler Ne Zaman Satışa Çıkar?</strong>
                  <p className="text-charcoal-muted leading-relaxed font-medium">
                    TCDD tren biletleri seyahat tarihinden tam <strong>30 gün önce saat 00:00 veya sabah 07:00'de</strong> sisteme yüklenir. Popüler kış aylarında 30 gün öncesi gece alarm kurmanız tavsiye edilir.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1">
                  <strong className="text-charcoal font-black block">🔄 2. İptal Düşme Radarı</strong>
                  <p className="text-charcoal-muted leading-relaxed font-medium">
                    Tur şirketlerinin veya yolcuların iptal ettiği yataklı vagon biletleri genellikle kalkışa <strong>48 saat ve 24 saat kala</strong> sisteme geri düşer.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1">
                  <strong className="text-charcoal font-black block">🎒 3. Yanınıza Almanız Önerilenler</strong>
                  <p className="text-charcoal-muted leading-relaxed font-medium">
                    Üçlü priz çoğaltıcı (fotoğraf makinesi ve telefonlar için), pilli peri LED ışıklar (kompartıman ambiyansı için), termos kupa ve atıştırmalıklar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-charcoal-muted font-medium">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Tüm TCDD Taşımacılık A.Ş. resmi sefer saatleri ve vagon tarifeleri entegredir.</span>
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
