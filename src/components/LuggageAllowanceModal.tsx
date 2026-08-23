import React, { useState } from 'react';
import {
  BileoClose,
  BileoBus,
  BileoPlane,
  BileoTrain,
  BileoFerry,
  BileoShieldCheck,
  BileoCheck,
} from './icons';
import { sound } from '../utils/sound';

interface LuggageAllowanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BaggageRule {
  type: 'otobus' | 'ucak' | 'tren' | 'feribot';
  name: string;
  freeWeightKg: number;
  cabinPieces: string;
  excessPerKgFee: number; // in TL
  prohibitedItems: string[];
  tips: string;
}

const BAGGAGE_RULES: BaggageRule[] = [
  {
    type: 'otobus',
    name: 'Şehirlerarası Otobüs',
    freeWeightKg: 30,
    cabinPieces: '1 Adet Küçük El Çantası (Maks. 5 kg)',
    excessPerKgFee: 25,
    prohibitedItems: ['Yanıcı/Parlayıcı Gazlar', 'Açık Sıvı Gıda & Koli', 'Ruhsatsız Canlı Hayvan'],
    tips: 'Bagaj fişinizi biletinizle eşleştirmeyi unutmayınız. Değerli eşyalarınızı araç içi el çantanızda muhafaza ediniz.',
  },
  {
    type: 'ucak',
    name: 'İç Hat Uçuşları',
    freeWeightKg: 15,
    cabinPieces: '1 Adet Kabin Boy Valiz (8 kg, 55x40x23cm) + 1 Kişisel Eşya',
    excessPerKgFee: 95,
    prohibitedItems: ['100ml Üzeri Sıvılar (Kabinde)', 'Lityum Powerbank (Bagaj Altında Yasak)', 'Kesici/Delici Aletler'],
    tips: 'Powerbank ve yedek bataryalarınızı kesinlikle kargo bagajına vermeyiniz, sadece kabin çantanızda taşıyınız.',
  },
  {
    type: 'tren',
    name: 'YHT & Anahat Trenleri',
    freeWeightKg: 30,
    cabinPieces: '2 Adet Başüstü Valiz (Toplam 30 kg)',
    excessPerKgFee: 35,
    prohibitedItems: ['Yanıcı Kimyasallar', 'Açık Kokulu Yiyecekler', 'Büyük Boy Bisiklet (Katlanabilir Hariç)'],
    tips: 'Vagon girişlerindeki büyük bagaj raflarını ve koltuk üstü geniş kompartımanları ücretsiz kullanabilirsiniz.',
  },
  {
    type: 'feribot',
    name: 'Hızlı Feribot & Deniz Otobüsü',
    freeWeightKg: 30,
    cabinPieces: '1 Adet El Çantası + Araç Bagajı (Araçlı Geçişte Sınırsız)',
    excessPerKgFee: 20,
    prohibitedItems: ['LPG/Gaz Kaçağı Olan Araçlar', 'Açık Yanıcı Maddeler'],
    tips: 'Araçlı geçişlerde araç içi bagajlar için ekstra kilo sınırlaması uygulanmaz.',
  },
];

export const LuggageAllowanceModal: React.FC<LuggageAllowanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<BaggageRule['type']>('otobus');
  const [estimatedKg, setEstimatedKg] = useState<number>(25);

  if (!isOpen) return null;

  const currentRule = BAGGAGE_RULES.find((r) => r.type === selectedType) || BAGGAGE_RULES[0];
  const excessKg = Math.max(0, estimatedKg - currentRule.freeWeightKg);
  const excessFee = excessKg * currentRule.excessPerKgFee;

  const handleTypeSelect = (type: BaggageRule['type']) => {
    sound.playTick();
    setSelectedType(type);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <BileoShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Bagaj Hakkı & Fazla Bagaj Hesaplayıcı</h3>
              <p className="text-xs text-charcoal-muted font-medium">Ulaşım türüne göre ücretsiz haklar ve kurallar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Modality Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'otobus', label: 'Otobüs (30 kg)', icon: <BileoBus className="w-4 h-4" /> },
              { id: 'ucak', label: 'Uçak (15+8 kg)', icon: <BileoPlane className="w-4 h-4" /> },
              { id: 'tren', label: 'YHT Tren (30 kg)', icon: <BileoTrain className="w-4 h-4" /> },
              { id: 'feribot', label: 'Feribot (30 kg)', icon: <BileoFerry className="w-4 h-4" /> },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTypeSelect(item.id as any)}
                className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  selectedType === item.id
                    ? 'bg-bordeaux-700 text-white border-bordeaux-700 shadow-soft'
                    : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Weight Estimator Slider */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E1D5] space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-charcoal">Tahmini Toplam Bagaj Ağırlığınız</label>
              <span className="text-base font-black text-bordeaux-700 font-display">{estimatedKg} KG</span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              step={1}
              value={estimatedKg}
              onChange={(e) => setEstimatedKg(Number(e.target.value))}
              className="w-full accent-bordeaux-700 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-charcoal-muted">
              <span>5 kg (Hafif)</span>
              <span>Ücretsiz Limit: {currentRule.freeWeightKg} kg</span>
              <span>60 kg (Ağır)</span>
            </div>

            {/* Excess Baggage Fee Result */}
            <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
              excessKg > 0
                ? 'bg-amber-50 border-amber-200 text-amber-950'
                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider block">
                  {excessKg > 0 ? 'Fazla Bagaj Ücreti' : 'Ücretsiz Bagaj Dahilinde'}
                </span>
                <p className="text-xs font-bold">
                  {excessKg > 0
                    ? `Limit aşımı: +${excessKg} kg (Kg başı ${currentRule.excessPerKgFee} TL)`
                    : 'Tebrikler! Bagajınız biletinize dahil ücretsiz hak sınırları içinde.'}
                </p>
              </div>
              <span className="text-xl font-black font-display">
                {excessKg > 0 ? `${excessFee} TL` : '0 TL'}
              </span>
            </div>
          </div>

          {/* Rules & Policies Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Cabin Policy */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E1D5] space-y-2">
              <span className="text-[10px] font-extrabold text-charcoal uppercase tracking-wider block">
                Kabin İçi El Bagajı
              </span>
              <p className="text-xs font-bold text-charcoal flex items-center gap-2">
                <BileoCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{currentRule.cabinPieces}</span>
              </p>
            </div>

            {/* Free Hold Policy */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E1D5] space-y-2">
              <span className="text-[10px] font-extrabold text-charcoal uppercase tracking-wider block">
                Bagaj / Kargo Bölümü
              </span>
              <p className="text-xs font-bold text-charcoal flex items-center gap-2">
                <BileoCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{currentRule.freeWeightKg} KG Ücretsiz Taşıma Hakkı</span>
              </p>
            </div>

          </div>

          {/* Prohibited Items & Safety Tips */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2">
            <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider block">
              ⚠️ Taşınması Yasak veya Özel İzne Tabi Maddeler
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentRule.prohibitedItems.map((item, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 text-[11px] font-bold">
                  ✕ {item}
                </span>
              ))}
            </div>
            <p className="text-xs text-charcoal-muted pt-2 border-t border-[#FAF7F2]">
              💡 <strong>Yolcu İpucu:</strong> {currentRule.tips}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
