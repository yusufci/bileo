import React, { useState } from 'react';
import {
  BileoClose,
  BileoHeart,
  BileoCheck,
} from './icons';
import { sound } from '../utils/sound';

interface PetTravelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PetPolicy {
  type: 'otobus' | 'ucak' | 'tren' | 'feribot';
  title: string;
  maxWeightKg: number;
  boxDimensions: string;
  fareRule: string;
  mandatoryDocs: string[];
  rules: string[];
  tips: string;
}

const PET_POLICIES: PetPolicy[] = [
  {
    type: 'otobus',
    title: 'Şehirlerarası Otobüs Seyahati',
    maxWeightKg: 8,
    boxDimensions: 'Maksimum 40x30x30 cm',
    fareRule: 'Kucakta taşınabilen küçük evcil hayvanlar ücretsizdir (Koltuk talep edilirse tam bilet alınır).',
    mandatoryDocs: ['Aşı Karnesi & Sağlık Belgesi', 'Kuduz Aşısı Kaydı', 'Mikroçip Kimlik Bilgisi'],
    rules: [
      '8 kg altındaki kedi, köpek ve saka/kanarya gibi küçük kafes kuşları kabin içinde taşınabilir.',
      'Taşıma kafesi kucakta veya koltuk önünde ayak hizasında tutulmalıdır.',
      'Saldırgan veya tehlike arz eden ırklar (Pitbull, Dogo vb.) taşınamaz.',
    ],
    tips: 'Yolculuktan 4 saat önce mama vermeyi kesmeniz ve yanınızda seyahat su kabı bulundurmanız önerilir.',
  },
  {
    type: 'ucak',
    title: 'Uçak Kabin İçi (PETC) & Kargo (AVIH)',
    maxWeightKg: 8,
    boxDimensions: '55x40x20 cm (Yumuşak Yüzeyli Kabin Çantası)',
    fareRule: 'Kabin içi taşımada tek yön 350 - 550 TL arası evcil hayvan servis ücreti uygulanır.',
    mandatoryDocs: ['Uluslararası/Ulusal Aşı Pasaportu', 'Mikroçip Numarası', 'Uçuşa Uygunluk Veteriner Onayı'],
    rules: [
      'Kafes ile toplam ağırlığı 8 kg altındaki evcil hayvanlar kabin içinde ön koltuk altında taşınır.',
      '8 kg üzeri kedi ve köpekler basınç ve sıcaklık kontrollü kargo bölümünde (AVIH) seyahat eder.',
      'Uçuş başına kabin içi canlı hayvan kontenjanı sınırlı olduğundan rezervasyon bilet alımında bildirilmelidir.',
    ],
    tips: 'Uçuştan en az 48 saat önce hava yolu çağrı merkezini arayarak PNR numaranıza evcil hayvan ekletiniz.',
  },
  {
    type: 'tren',
    title: 'TCDD Yüksek Hızlı Tren & Anahat',
    maxWeightKg: 8,
    boxDimensions: 'Küçük Boy Taşıma Çantası (Kucakta Taşınabilir)',
    fareRule: 'Evcil hayvan için standart tam bilet tarifesi üzerinden %50 indirimli bilet düzenlenir.',
    mandatoryDocs: ['Aşı Karnesi (Kuduz ve Karma Aşılar Güncel Olmalıdır)'],
    rules: [
      'Kedi, küçük köpek ve süs kuşları kapalı kafes içinde yolcu yanında taşınabilir.',
      'Evcil hayvan diğer yolcuları rahatsız etmeyecek şekilde kafesinde tutulmalıdır.',
      'Yemekli vagon ve yataklı vagonlara evcil hayvan alınmaz.',
    ],
    tips: 'YHT biletinizi alırken gişeden veya çağrı merkezinden evcil hayvanınız için indirimli yer tanımlatınız.',
  },
  {
    type: 'feribot',
    title: 'İDO & Deniz Otobüsü Seyahatleri',
    maxWeightKg: 15,
    boxDimensions: 'Standart Kafes veya Tasmalı/Ağızlıklı',
    fareRule: 'Kafes içinde kabinde veya açık güverte petbox alanlarında ücretsizdir.',
    mandatoryDocs: ['Aşı Karnesi'],
    rules: [
      'Küçük evcil hayvanlar kafes içinde yolcu salonuna alınabilir.',
      'Büyük köpekler ağızlık ve tasma takılarak açık güvertedeki özel pet alanlarında seyahat edebilir.',
      'Araçlı geçişlerde evcil hayvanın araç içerisinde bırakılmasına izin verilmez.',
    ],
    tips: 'Açık deniz rüzgarına karşı evcil hayvanınızı korunaklı pet alanlarında tutunuz.',
  },
];

export const PetTravelModal: React.FC<PetTravelModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<PetPolicy['type']>('otobus');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    asi: false,
    cip: false,
    kafes: false,
  });

  if (!isOpen) return null;

  const current = PET_POLICIES.find((p) => p.type === selectedType) || PET_POLICIES[0];

  const handleTypeChange = (type: PetPolicy['type']) => {
    sound.playTick();
    setSelectedType(type);
  };

  const toggleCheck = (key: string) => {
    sound.playTick();
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
              <BileoHeart className="w-5 h-5 fill-rose-700 text-rose-700" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Evcil Hayvanla Seyahat Rehberi</h3>
              <p className="text-xs text-charcoal-muted font-medium">Otobüs, uçak, tren ve feribotta pati dostu seyahat kuralları</p>
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
              { id: 'otobus', label: 'Otobüs' },
              { id: 'ucak', label: 'Uçak (Kabin/Kargo)' },
              { id: 'tren', label: 'YHT Tren (%50 İndirim)' },
              { id: 'feribot', label: 'Feribot & İDO' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTypeChange(item.id as any)}
                className={`p-3 rounded-2xl border text-center font-extrabold text-xs transition-all cursor-pointer ${
                  selectedType === item.id
                    ? 'bg-bordeaux-700 text-white border-bordeaux-700 shadow-soft'
                    : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5]">
              <span className="text-[10px] text-charcoal-muted font-bold block">Kabin Ağırlık Limiti</span>
              <span className="text-xs font-black text-bordeaux-700 mt-0.5 block font-display">Maks. {current.maxWeightKg} KG</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5]">
              <span className="text-[10px] text-charcoal-muted font-bold block">Kafes / Çanta Ölçüsü</span>
              <span className="text-xs font-black text-charcoal mt-0.5 block">{current.boxDimensions}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] text-rose-800 font-bold block">Bilet & Ücretlendirme</span>
              <span className="text-xs font-black text-rose-950 mt-0.5 block">{current.fareRule}</span>
            </div>
          </div>

          {/* Rules and Mandatory Documents */}
          <div className="space-y-4">
            
            {/* Mandatory Docs */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E1D5] space-y-2">
              <span className="text-[10px] font-extrabold text-charcoal uppercase tracking-wider block">
                📋 Yanınızda Bulunması Zorunlu Belgeler
              </span>
              <div className="flex flex-wrap gap-2">
                {current.mandatoryDocs.map((doc, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold">
                    <BileoCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{doc}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Travel Rules */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E1D5] space-y-2">
              <span className="text-[10px] font-extrabold text-charcoal uppercase tracking-wider block">
                🐾 Temel Seyahat Kuralları
              </span>
              <ul className="space-y-1.5 text-xs text-charcoal-muted font-medium">
                {current.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-charcoal">
                    <span className="w-1.5 h-1.5 rounded-full bg-bordeaux-700 mt-1.5 flex-shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Interactive Travel Prep Checklist */}
            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E1D5] space-y-2.5">
              <span className="text-[10px] font-extrabold text-charcoal uppercase tracking-wider block">
                ✅ Hızlı Seyahat Hazırlık Kontrolü
              </span>
              <div className="space-y-2 text-xs">
                {[
                  { id: 'asi', text: 'Kuduz ve karma aşıları güncel aşı karnesi hazır' },
                  { id: 'cip', text: 'Tarım Bakanlığı kayıtlı mikroçip takılı' },
                  { id: 'kafes', text: 'Hava alabilen kilitli taşıma çantası / kafesi hazır' },
                ].map((item) => (
                  <label
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className="flex items-center gap-2.5 cursor-pointer select-none font-bold text-charcoal hover:text-bordeaux-700"
                  >
                    <input
                      type="checkbox"
                      checked={!!checklist[item.id]}
                      onChange={() => {}}
                      className="w-4 h-4 accent-bordeaux-700 rounded cursor-pointer"
                    />
                    <span className={checklist[item.id] ? 'line-through text-charcoal-muted' : ''}>
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tips Card */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80">
              <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-1">
                Veteriner Hekim Tavsiyesi
              </span>
              <p className="text-xs text-amber-950 font-medium leading-relaxed">
                💡 {current.tips}
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
