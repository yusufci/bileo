import React, { useState } from 'react';
import {
  BileoClose,
  BileoCheck,
  BileoTrain,
  BileoPlane,
  BileoBus,
  BileoFerry,
} from './icons';
import { sound } from '../utils/sound';

interface MedicalTravelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MedicalRule {
  id: string;
  category: 'tren' | 'ucak' | 'otobus' | 'feribot';
  title: string;
  subtitle: string;
  emergencySupport: string;
  coldChainMedication: string;
  pregnancyRules: string;
  medicalDevices: string;
  tips: string[];
}

const MEDICAL_RULES: MedicalRule[] = [
  {
    id: 'aviation-medical',
    category: 'ucak',
    title: 'Havayolu Medikal & Sağlık Taşıma Standartları',
    subtitle: 'THY, Pegasus, AJet Uçuşlarında İlaç, Oksijen Cihazı ve Hamilelik Kuralları',
    emergencySupport: 'Kabin ekibi ilk yardım sertifikalıdır; acil durumlarda yerdeki MedAire doktorlarıyla telemetri kurulur.',
    coldChainMedication: 'İnsülin ve aşılar orijinal reçeteli ambalajında 100ml sıvı sınırından muaftır; kabin bagajında taşınmalıdır.',
    pregnancyRules: '28. haftaya kadar raporsuz; 28-35. hafta (tekiz) arası "Uçakla Seyahatinde Sakınca Yoktur" doktor raporlu; 36. haftadan sonra uçuş yasaktır.',
    medicalDevices: 'CPAP, POC (Oksijen Konsantratörü) ve nebulizatör cihazları pil güvenlik sertifikasıyla kabine kabul edilir.',
    tips: [
      'İlaçlarınızı asla kargo bagajına vermeyiniz; uçak kargo bölümündeki sıcaklık dalgalanması ilaç yapısını bozabilir.',
      'Sıvı ilaç reçetenizi veya e-Nabız dökümünü güvenlik kontrolünde kolayca gösterebileceğiniz üst gözde tutunuz.',
    ],
  },
  {
    id: 'yht-medical',
    category: 'tren',
    title: 'TCDD YHT & Tren Seyahat Sağlığı',
    subtitle: 'Hızlı Trenlerde İlkyardım, AED Defibrilatör ve Soğuk Zincir İlaç Desteği',
    emergencySupport: 'YHT setlerinde Otomatik Kalp Şok Cihazı (AED) ve tam donanımlı ilk yardım çantası mevcuttur.',
    coldChainMedication: 'Bistro vagonu personeline rica ederek insülin kaleminizi buzdolabında muhafaza ettirebilirsiniz.',
    pregnancyRules: 'Herhangi bir gebelik haftası kısıtlaması yoktur; sarsıntısız manyetik raylar konforlu bir yolculuk sunar.',
    medicalDevices: '220V prizler sayesinde şarjlı veya elektrikli medikal cihazlar vagon koltuğunda kesintisiz çalıştırılabilir.',
    tips: [
      'Seyahat boyunca dolaşımı desteklemek için her 1 saatte bir vagon koridorunda kısa yürüyüşler yapınız.',
      'Ani rahatsızlıklarda vagon butonuna basarak tren kondüktörünü anında çağırabilirsiniz.',
    ],
  },
  {
    id: 'bus-medical',
    category: 'otobus',
    title: 'Karayolu & Otobüs Seyahat Sağlığı',
    subtitle: 'Yol Tutması (Kinetozis), Mola Düzeni ve Kronik Rahatsızlıklar',
    emergencySupport: 'Araç personeli acil durumlarda güzergah üzerindeki en yakın acil servise veya 112 ile koordinasyona geçer.',
    coldChainMedication: 'Termos veya buz akülü özel ilaç çantanızda yanınızda taşımanız tavsiye edilir.',
    pregnancyRules: 'Doktor onayıyla seyahat önerilir; molalarda bacak esnetme hareketleri yapılmalıdır.',
    medicalDevices: 'Koltuk altı 220V prizler taşınabilir solunum cihazları için kullanılabilir.',
    tips: [
      'Yol tutması yaşıyorsanız ön sıra (3-4-5-6 no’lu) koltukları seçiniz ve kalkıştan 30 dk önce zencefilli atıştırmalık tüketiniz.',
      'Hosttan sıcak/soğuk su kompresi veya acil temiz hava molası talep edebilirsiniz.',
    ],
  },
  {
    id: 'ferry-medical',
    category: 'feribot',
    title: 'Denizyolu & Feribot Sağlık Prosedürleri',
    subtitle: 'Deniz Tutması, Revir Hizmeti ve Güverte Güvenliği',
    emergencySupport: 'Büyük arabalı feribotlarda sağlık personeli ve ilk müdahale revir odası bulunmaktadır.',
    coldChainMedication: 'Kısa seyir süreleri nedeniyle el çantasında güvenle taşınabilir.',
    pregnancyRules: 'Kısıtlama yoktur; feribot içindeki sarsıntısız orta salon koltukları tercih edilmelidir.',
    medicalDevices: 'Ana salondaki masalı alanlarda elektrik erişimi mevcuttur.',
    tips: [
      'Deniz tutması hassasiyetiniz varsa ufuk çizgisine bakabileceğiniz cam kenarı veya açık güverteyi tercih ediniz.',
    ],
  },
];

export const MedicalTravelModal: React.FC<MedicalTravelModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedRuleId, setSelectedRuleId] = useState<string>('aviation-medical');

  if (!isOpen) return null;

  const current = MEDICAL_RULES.find((r) => r.id === selectedRuleId) || MEDICAL_RULES[0];

  const handleSelectRule = (id: string) => {
    sound.playTick();
    setSelectedRuleId(id);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tren': return BileoTrain;
      case 'ucak': return BileoPlane;
      case 'otobus': return BileoBus;
      case 'feribot': return BileoFerry;
      default: return BileoPlane;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-800 flex items-center justify-center border border-rose-200 text-lg font-black">
              🩺
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Seyahat Sağlığı & Medikal Taşıma Rehberi</h3>
              <p className="text-xs text-charcoal-muted font-medium">İlaç Taşıma, Soğuk Zincir, Hamilelik Kuralları, Oksijen Cihazı ve İlkyardım</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-3 bg-white/50 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {MEDICAL_RULES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelectRule(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedRuleId === r.id
                  ? 'bg-bordeaux-700 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              {React.createElement(getCategoryIcon(r.category), { className: 'w-3.5 h-3.5' })}
              <span>{r.title.split(' ')[0]} {r.title.split(' ')[1]}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Title */}
          <div>
            <h4 className="text-xl font-black text-[#1E1B18] font-display">{current.title}</h4>
            <p className="text-xs text-charcoal-muted font-medium mt-0.5">{current.subtitle}</p>
          </div>

          {/* 4 Health Pillars Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1 shadow-2xs">
              <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider block">
                💉 Soğuk Zincir & Sıvı İlaçlar
              </span>
              <p className="text-xs font-bold text-charcoal leading-relaxed">{current.coldChainMedication}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1 shadow-2xs">
              <span className="text-[10px] font-black text-purple-800 uppercase tracking-wider block">
                🤰 Hamilelik & Anne Adayları
              </span>
              <p className="text-xs font-bold text-charcoal leading-relaxed">{current.pregnancyRules}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1 shadow-2xs">
              <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider block">
                ⚡ Medikal Cihazlar & CPAP/POC
              </span>
              <p className="text-xs font-bold text-charcoal leading-relaxed">{current.medicalDevices}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1 shadow-2xs">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                🚑 Acil Müdahale & İlkyardım
              </span>
              <p className="text-xs font-bold text-charcoal leading-relaxed">{current.emergencySupport}</p>
            </div>

          </div>

          {/* Practical Tips */}
          <div className="space-y-2">
            <span className="text-[11px] font-black text-charcoal uppercase tracking-wider block">
              Hayati Seyahat Sağlığı Tavsiyeleri
            </span>
            <div className="space-y-2">
              {current.tips.map((tip, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-[#E8E1D5] text-xs font-bold text-charcoal"
                >
                  <BileoCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Box */}
          <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 space-y-1">
            <span className="text-[10px] font-extrabold text-rose-900 uppercase tracking-wider block mb-0.5">
              Acil Durum İletişimi
            </span>
            <p className="text-xs text-rose-950 font-medium leading-relaxed">
              📞 Seyahatiniz sırasında ortaya çıkabilecek hayati acil durumlarda Türkiye genelinde <strong>112 Acil Çağrı Merkezi</strong> aranmalı ve derhal araç kaptanına veya tren/kabin şefine bilgi verilmelidir.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
