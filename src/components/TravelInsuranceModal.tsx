import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoCheck,
} from './icons';
import { sound } from '../utils/sound';
import { SampleDataNotice } from './common/SampleDataNotice';

interface TravelInsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface InsurancePlan {
  id: string;
  name: string;
  price: string;
  badge?: string;
  isPopular?: boolean;
  coverages: { title: string; limit: string; included: boolean }[];
  description: string;
}

const INSURANCE_PLANS: InsurancePlan[] = [
  {
    id: 'standard',
    name: 'Standart Zorunlu Güvence',
    price: '0 TL (Bilete Dahil)',
    description: 'T.C. Ulaştırma Bakanlığı ve TÜRSAB mevzuatı gereği her biletli yolcuya sağlanan yasal koruma.',
    coverages: [
      { title: 'Zorunlu Koltuk Ferdi Kaza Sigortası', limit: '250.000 TL', included: true },
      { title: 'Taşıyıcı Sorumluluk Güvencesi', limit: 'Yasal Üst Limit', included: true },
      { title: 'Bagaj Kaybı (Standart Kilo Başı)', limit: 'Yasal Tarife', included: true },
      { title: 'Koşulsuz Kesintisiz İptal Hakkı', limit: 'Dahil Değil', included: false },
      { title: 'Rötar & Bekleme Otel Konaklaması', limit: 'Dahil Değil', included: false },
      { title: '7/24 Özel Tıbbi Danışma & Asistans', limit: 'Dahil Değil', included: false },
    ],
  },
  {
    id: 'plus',
    name: 'Bileo Plus Güvence Paketi',
    price: '49 TL / Sefer',
    isPopular: true,
    badge: 'En Çok Tercih Edilen',
    description: 'Bagaj hasarı, sefer gecikmeleri ve acil sağlık ihtiyaçlarına karşı kapsamlı seyahat koruması.',
    coverages: [
      { title: 'Zorunlu Koltuk Ferdi Kaza Sigortası', limit: '500.000 TL', included: true },
      { title: 'Ekstra Bagaj Kaybı & Hasar Teminatı', limit: '7.500 TL', included: true },
      { title: 'Son 2 Saate Kadar Esnek İptal / Değişim', limit: '%90 İade', included: true },
      { title: 'Rötar Telafi Desteği (3 saat üzeri)', limit: '500 TL Kupon', included: true },
      { title: '7/24 Özel Tıbbi Danışma & Asistans', limit: 'Sınırsız Çağrı', included: true },
      { title: 'Otel & Konaklama Rötar Telafisi', limit: 'Dahil Değil', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Bileo VIP Premium Koruma',
    price: '89 TL / Sefer',
    badge: 'Maksimum Koruma',
    description: 'Sıfır risk ile seyahat etmek isteyenler için %100 koşulsuz iade ve otel konaklama desteği.',
    coverages: [
      { title: 'Zorunlu Koltuk Ferdi Kaza Sigortası', limit: '1.000.000 TL', included: true },
      { title: 'Kayıp Valiz & Değerli Eşya Güvencesi', limit: '15.000 TL', included: true },
      { title: 'Koşulsuz %100 Kesintisiz Bilet İadesi', limit: 'Anında Nakit İade', included: true },
      { title: 'Rötar / İptalde Otel Konaklama Teminatı', limit: '2.500 TL', included: true },
      { title: '7/24 VIP Asistans & Özel Konsiyerj', limit: 'Öncelikli Hat', included: true },
      { title: 'Acil Ambulans & Medikal Transfer', limit: 'Tam Kapsam', included: true },
    ],
  },
];

export const TravelInsuranceModal: React.FC<TravelInsuranceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plus');

  if (!isOpen) return null;

  const handleSelectPlan = (id: string) => {
    sound.playTick();
    setSelectedPlanId(id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <BileoShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Seyahat & Bilet Koruma Paketleri (örnek)</h3>
              <p className="text-xs text-charcoal-muted font-medium">Temsili koruma paketi örnekleri; bu ekranda gerçek bir sigorta ürünü satılmaz</p>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {INSURANCE_PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                    isSelected
                      ? 'bg-white border-bordeaux-700 ring-2 ring-bordeaux-700/20 shadow-soft-lg'
                      : 'bg-white/70 border-[#E8E1D5] hover:bg-white'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-bordeaux-700 text-white shadow-2xs">
                      {plan.badge}
                    </span>
                  )}

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-black text-[#1E1B18] font-display">{plan.name}</h4>
                      <p className="text-[11px] text-charcoal-muted mt-1 leading-relaxed">{plan.description}</p>
                    </div>

                    <div className="pt-2 border-t border-[#FAF7F2]">
                      <span className="text-lg font-black text-bordeaux-700 font-display block">
                        {plan.price}
                      </span>
                    </div>

                    {/* Coverage List */}
                    <div className="space-y-2 pt-2 border-t border-[#FAF7F2]">
                      {plan.coverages.map((cov, cIdx) => (
                        <div key={cIdx} className="flex items-start justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            {cov.included ? (
                              <BileoCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <span className="w-3.5 h-3.5 text-charcoal-muted/40 text-center flex-shrink-0 font-bold">✕</span>
                            )}
                            <span className={cov.included ? 'font-bold text-[#1E1B18]' : 'text-charcoal-muted/60 line-through'}>
                              {cov.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-extrabold font-mono text-charcoal-muted text-right flex-shrink-0">
                            {cov.limit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan(plan.id);
                    }}
                    className={`w-full mt-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-bordeaux-700 text-white shadow-bordeaux'
                        : 'bg-[#FAF7F2] text-charcoal hover:bg-[#E8E1D5]'
                    }`}
                  >
                    {isSelected ? '✓ Seçili Paket' : 'Paketi İncele'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Legal Note */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1.5 text-xs text-charcoal-muted">
            <span className="font-bold text-[#1E1B18] block">🛡️ Güvence ve Poliçe Bilgilendirmesi:</span>
            <p className="leading-relaxed">
              Tüm biletlerimizde 4925 sayılı Karayolu Taşıma Kanunu ve Sivil Havacılık Kanunu uyarınca zorunlu koltuk ferdi kaza sigortası bilet ücretine dahildir. Ek koruma paketleri satın alındığında poliçe detayları anında SMS ve E-posta ile PNR kodunuza tanımlanır.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
