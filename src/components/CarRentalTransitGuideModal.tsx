import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoCheckCircle,
} from './icons';
import { sound } from '../utils/sound';
import { SampleDataNotice } from './common/SampleDataNotice';

interface CarRentalTransitGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo', duration?: number) => void;
}

interface RentalCategory {
  id: string;
  name: string;
  badge: string;
  sampleModels: string;
  minAge: number;
  minLicenseYears: number;
  depositRange: string;
  avgDailyPrice: string;
  recommendedFor: string;
}

const RENTAL_CATEGORIES: RentalCategory[] = [
  {
    id: 'economy',
    name: 'Ekonomi Sınıfı',
    badge: 'En Popüler / Şehir İçi',
    sampleModels: 'Renault Clio, Fiat Egea, Hyundai i20',
    minAge: 21,
    minLicenseYears: 1,
    depositRange: '1.500 ₺ - 2.500 ₺',
    avgDailyPrice: '850 ₺ - 1.250 ₺',
    recommendedFor: '1-3 kişilik şehir içi geziler, düşük yakıt tüketimi ve kolay park imkanı.',
  },
  {
    id: 'compact_suv',
    name: 'Kompakt & C-SUV',
    badge: 'Aile & Konfor',
    sampleModels: 'Peugeot 2008 / 3008, Dacia Duster, Nissan Qashqai',
    minAge: 23,
    minLicenseYears: 2,
    depositRange: '3.000 ₺ - 4.500 ₺',
    avgDailyPrice: '1.450 ₺ - 2.100 ₺',
    recommendedFor: 'Aile tatilleri, Ege/Akdeniz kıyı turları ve geniş bagaj ihtiyacı.',
  },
  {
    id: 'sedan_business',
    name: 'Geniş Sedan & Business',
    badge: 'Uzun Yol & Konfor',
    sampleModels: 'Volkswagen Passat, Skoda Octavia / Superb, Toyota Corolla',
    minAge: 25,
    minLicenseYears: 2,
    depositRange: '4.000 ₺ - 6.000 ₺',
    avgDailyPrice: '1.800 ₺ - 2.750 ₺',
    recommendedFor: 'Otoban yolculukları, iş seyahatleri ve maksimum arka koltuk diz mesafesi.',
  },
  {
    id: 'minivan',
    name: '7-9 Kişilik Minibüs & Aile',
    badge: 'Grup & Kalabalık Aile',
    sampleModels: 'Mercedes-Benz Vito, Volkswagen Caravelle, Ford Tourneo',
    minAge: 27,
    minLicenseYears: 3,
    depositRange: '6.000 ₺ - 10.000 ₺',
    avgDailyPrice: '2.900 ₺ - 4.500 ₺',
    recommendedFor: 'Kalabalık aileler, grup tatilleri, kayak ve doğa turları.',
  },
];

const HUB_PICKUP_POINTS = [
  {
    hubName: 'İstanbul Havalimanı (IST) & SAW',
    type: '✈️ Havalimanı',
    pickupInfo: 'Gelen yolcu katında 7/24 açık ofisler veya kapıda karşılama (Meet & Greet).',
    tip: 'Otoparktan çıkışta HGS/OGS geçiş cihazı kontrol edilmelidir.',
  },
  {
    hubName: 'Ankara Esenboğa & AŞTİ Otogarı',
    type: '✈️/🚌 Kombine Hub',
    pickupInfo: 'AŞTİ otopark alanında veya Esenboğa terminal çıkışında doğrudan anahtar teslimi.',
    tip: 'Başkent içi çevre yolu ve Konya/Eskişehir aksı için ideal teslim noktası.',
  },
  {
    hubName: 'İzmir Adnan Menderes & İZOTAŞ',
    type: '✈️/🚌 Ege Hub',
    pickupInfo: 'İç hatlar çıkışı ve İZOTAŞ Otogarı girişinde kiralama acenteleri.',
    tip: 'Çeşme, Urla ve Bodrum rotaları için otoyol HGS tanımlı araç talep edin.',
  },
  {
    hubName: 'Antalya Havalimanı (AYT) & Otogar',
    type: '🏖️ Akdeniz Hub',
    pickupInfo: 'Dış hatlar ve İç hatlar otoparkı içi 7/24 kesintisiz araç teslimatı.',
    tip: 'Yaz aylarında klima gazı dolu ve güneşlikli araç teslimini teyit edin.',
  },
];

export const CarRentalTransitGuideModal: React.FC<CarRentalTransitGuideModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>('compact_suv');
  const [activeTab, setActiveTab] = useState<'categories' | 'hubs' | 'checklist'>('categories');

  if (!isOpen) return null;

  const currentCategory = RENTAL_CATEGORIES.find((c) => c.id === selectedCatId) || RENTAL_CATEGORIES[0];

  const handleCopyGuide = () => {
    sound.playSuccess();
    if (onShowToast) {
      onShowToast(
        'Kiralama İpuçları Kaydedildi',
        `${currentCategory.name} teslim alma ve depozito rehberi notlarınıza eklendi.`,
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
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center border border-amber-200 text-lg font-black">
              🚗
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Otogar & Havalimanı Araç Kiralama Rehberi (örnek)</h3>
              <p className="text-xs text-charcoal-muted font-medium">İniş sonrası son mil ulaşımı, depozito kuralları, kasko güvenceleri ve teslim noktaları</p>
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
          
          {/* Sub Navigation */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveTab('categories'); }}
              className={`py-3 px-4 rounded-2xl text-center font-black text-xs transition-all cursor-pointer border shadow-2xs ${
                activeTab === 'categories'
                  ? 'bg-amber-900 text-white border-amber-900'
                  : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              🚗 Araç Sınıfları & Fiyat Endeksi
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveTab('hubs'); }}
              className={`py-3 px-4 rounded-2xl text-center font-black text-xs transition-all cursor-pointer border shadow-2xs ${
                activeTab === 'hubs'
                  ? 'bg-amber-900 text-white border-amber-900'
                  : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              🏢 Terminal & Havalimanı Noktaları
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveTab('checklist'); }}
              className={`py-3 px-4 rounded-2xl text-center font-black text-xs transition-all cursor-pointer border shadow-2xs ${
                activeTab === 'checklist'
                  ? 'bg-amber-900 text-white border-amber-900'
                  : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              📋 Teslim Alma & Depozito Kontrolü
            </button>
          </div>

          {activeTab === 'categories' && (
            <div className="space-y-4">
              
              {/* Category Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {RENTAL_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { sound.playTick(); setSelectedCatId(cat.id); }}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer shadow-2xs ${
                      selectedCatId === cat.id
                        ? 'bg-amber-900 text-white border-amber-900 shadow-soft'
                        : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="font-black text-xs truncate">{cat.name}</div>
                    <div className={`text-[10px] font-medium truncate ${selectedCatId === cat.id ? 'text-amber-200' : 'text-charcoal-muted'}`}>
                      {cat.badge}
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected Category Details Card */}
              <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8E1D5]">
                  <div>
                    <h4 className="text-sm font-black text-charcoal">{currentCategory.name} Detayları</h4>
                    <p className="text-xs text-charcoal-muted font-medium">Örnek Araçlar: <span className="font-bold text-charcoal">{currentCategory.sampleModels}</span></p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-charcoal-muted font-bold block uppercase tracking-wider">Tahmini Günlük Ücret</span>
                    <span className="text-sm font-black text-amber-900 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200 inline-block">
                      {currentCategory.avgDailyPrice}
                    </span>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1">
                    <strong className="text-charcoal font-black block">🎂 Yaş & Ehliyet Şartı</strong>
                    <p className="text-[11px] text-charcoal-muted font-medium">
                      Min. <strong>{currentCategory.minAge} Yaş</strong> ve <strong>{currentCategory.minLicenseYears} Yıllık Ehliyet</strong>
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1">
                    <strong className="text-charcoal font-black block">💳 Kredi Kartı Depozitosu</strong>
                    <p className="text-[11px] text-charcoal-muted font-medium">
                      Ortalama <strong>{currentCategory.depositRange}</strong> bloke tutarı
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1">
                    <strong className="text-charcoal font-black block">🎯 Kullanım Amacı</strong>
                    <p className="text-[11px] text-charcoal-muted font-medium">
                      {currentCategory.recommendedFor}
                    </p>
                  </div>
                </div>

                {/* Insurance Notice */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
                  <strong className="font-black text-emerald-950 block">🛡️ Bileo Güvenceli Kiralama Standartları:</strong>
                  <ul className="space-y-1 text-emerald-900 font-medium text-[11px]">
                    <li>• <strong>Tam Kasko (CDW):</strong> Trafik kazası ve çalınma durumlarında muafiyetsiz koruma.</li>
                    <li>• <strong>Mini Hasar Güvencesi:</strong> Tutanaksız 2.500 ₺'ye kadar ufak çizik ve sürtmelerde ek masrafsız iade.</li>
                    <li>• <strong>Depozito İadesi:</strong> Araç tesliminden sonra trafik cezası kontrolüyle 10-14 iş günü içinde blokenin kalkması.</li>
                  </ul>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleCopyGuide}
                    className="px-4 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-white font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-soft"
                  >
                    <BileoCheckCircle className="w-3.5 h-3.5" />
                    <span>Rehberi Not Al</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'hubs' && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-charcoal uppercase tracking-wider">Ana Ulaşım Merkezleri Teslimat Noktaları</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HUB_PICKUP_POINTS.map((hub, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2 shadow-2xs hover:border-amber-400 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-black text-charcoal text-xs">{hub.hubName}</h5>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {hub.type}
                      </span>
                    </div>

                    <p className="text-[11px] text-charcoal-muted leading-relaxed font-medium">
                      {hub.pickupInfo}
                    </p>

                    <div className="text-[11px] text-amber-950 font-medium bg-[#FAF7F2] p-2 rounded-xl border border-[#E8E1D5]">
                      💡 <strong>Yolcu İpucu:</strong> {hub.tip}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-sm space-y-4 text-xs">
              <h4 className="font-black text-charcoal text-sm">Araç Teslim Alırken ve İade Ederken Dikkat Edilecekler</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1.5">
                  <strong className="text-charcoal font-black block">📸 Teslim Alma Sırasında:</strong>
                  <ul className="space-y-1 text-charcoal-muted font-medium">
                    <li>• Aracın 4 köşesini ve jantlarını video/fotoğraf ile çekin.</li>
                    <li>• Yakıt göstergesini ve kilometre sayacını fotoğraflayın.</li>
                    <li>• Stepne, kriko ve ilk yardım çantasının varlığını kontrol edin.</li>
                    <li>• Varsa mevcut çizikleri kiralama sözleşmesine işletin.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1.5">
                  <strong className="text-charcoal font-black block">🏁 İade Sırasında:</strong>
                  <ul className="space-y-1 text-charcoal-muted font-medium">
                    <li>• Aracı aldığınız yakıt seviyesinde teslim edin.</li>
                    <li>• Teslim tutanağını imzalayın ve bir kopyasını alın.</li>
                    <li>• Otoyol HGS/OGS geçiş dökümünü talep edin.</li>
                    <li>• Kredi kartı provizyon iade dekontunu isteyin.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-charcoal-muted font-medium">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Tüm kiralama ortakları TÜRSAB ve TOKKDER kurumsal kalite standartlarına tabidir.</span>
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
