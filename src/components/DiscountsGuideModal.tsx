import React, { useState } from 'react';
import {
  BileoClose,
  BileoSparkles,
} from './icons';
import { sound } from '../utils/sound';

interface DiscountsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DiscountCategory {
  id: string;
  title: string;
  icon: string;
  badge: string;
  description: string;
  requiredDoc: string;
  rates: { mode: string; discount: string; details: string }[];
  howToApply: string;
}

const DISCOUNT_CATEGORIES: DiscountCategory[] = [
  {
    id: 'ogrenci',
    title: 'Öğrenci & Genç (13 - 26 Yaş)',
    icon: '🎓',
    badge: '%15 - %20 İndirim',
    description: 'Milli Eğitim Bakanlığı veya YÖK onaylı aktif öğrenci belgesine sahip gençler için avantajlı seyahat tarifesi.',
    requiredDoc: 'Aktif Öğrenci Kimliği veya e-Devlet Öğrenci Belgesi Barkodu',
    rates: [
      { mode: 'TCDD YHT & Anahat Tren', discount: '%15 İndirim', details: '13-26 yaş arası tüm genç yolcular için geçerlidir.' },
      { mode: 'Şehirlerarası Otobüs', discount: '%10 - %20 İndirim', details: 'Firmaya bağlı olarak öğrenci koltuk kontenjanlarında geçerlidir.' },
      { mode: 'Türk Hava Yolları & AJet', discount: '%10 + 20kg Bagaj', details: 'Miles&Smiles / Genç üyelik eşleştirmesi ile ek bagaj ve bilet indirimi.' },
      { mode: 'İDO & Deniz Otobüsü', discount: '%15 İndirim', details: 'Öğrenci İstanbulkart veya öğrenci belgesi ibrazı ile.' },
    ],
    howToApply: 'Bilet alırken yolcu tipi olarak "Öğrenci" seçiniz veya istasyon gişelerinde öğrenci belgenizi gösteriniz.',
  },
  {
    id: 'kidemli',
    title: '65+ Yaş Kıdemli Vatandaşlar',
    icon: '🧓',
    badge: '%30 - %50 İndirim',
    description: '65 yaş ve üzeri büyüklerimiz için devlet demiryolları ve karayolu mevzuatı gereği özel indirim hakları.',
    requiredDoc: 'T.C. Nüfus Cüzdanı / Kimlik Kartı (Doğum tarihi esastır)',
    rates: [
      { mode: 'TCDD YHT & Anahat Tren', discount: '%50 İndirim', details: 'YHT Business ve Ekonomi vagonlarında %50 doğrudan indirim.' },
      { mode: 'Şehirlerarası Otobüs', discount: 'Yasal %30 İndirim', details: '4925 sayılı Karayolu Taşıma Yönetmeliği gereği yasal taban indirim hakkı.' },
      { mode: 'İDO Feribot', discount: '%20 İndirim', details: '65 yaş üstü yolcu tarifesi.' },
    ],
    howToApply: 'Doğum tarihinizi girdiğinizde sistem otomatik olarak 65+ yaş indirimli fiyatı uygular.',
  },
  {
    id: 'tsk',
    title: 'TSK, Polis & Askeri Personel',
    icon: '🎖️',
    badge: '%15 İndirim',
    description: 'Türk Silahlı Kuvvetleri, Jandarma, Emniyet Genel Müdürlüğü ve Sahil Güvenlik personeli ile ailelerine özel haklar.',
    requiredDoc: 'Resmi TSK / Emniyet / Jandarma Personel Kimlik Kartı',
    rates: [
      { mode: 'TCDD YHT & Anahat Tren', discount: '%15 İndirim', details: 'Askeri personel ve bakmakla yükümlü olduğu eş ve çocukları için.' },
      { mode: 'Şehirlerarası Otobüs', discount: '%10 - %15 İndirim', details: 'Seçili kurumsal otobüs firmalarında askeri personel indirimi.' },
    ],
    howToApply: 'Bilet oluştururken Askeri Personel seçeneğini işaretleyip binişte kimliğinizi ibraz ediniz.',
  },
  {
    id: 'ogretmen',
    title: 'Öğretmen & Akademisyen',
    icon: '📚',
    badge: '%15 İndirim',
    description: 'MEB bünyesindeki tüm öğretmenler ve üniversitelerdeki akademik kadro için tanımlı indirimler.',
    requiredDoc: 'MEBBİS Öğretmen Kimlik Kartı veya Üniversite Akademik Personel Kimliği',
    rates: [
      { mode: 'TCDD YHT & Anahat Tren', discount: '%15 İndirim', details: 'Yıl boyu tüm YHT ve anahat tren seferlerinde geçerlidir.' },
      { mode: '24 Kasım Öğretmenler Haftası', discount: '%50 İndirim', details: 'Öğretmenler Günü haftasında özel kampanya tarifesi uygulanır.' },
    ],
    howToApply: 'Öğretmen seçeneğiyle bilet alıp kontrol esnasında MEBBİS kartınızı gösteriniz.',
  },
  {
    id: 'gazi-engelli',
    title: 'Gazi, Şehit Yakını & Engelli Yolcular',
    icon: '🎗️',
    badge: '%100 Ücretsiz & %40 İndirim',
    description: 'Kahraman gazilerimiz, şehit ailelerimiz ve engelli vatandaşlarımız için yasal en üst düzey sosyal haklar.',
    requiredDoc: 'Gazi/Şehit Yakını Kimliği veya Aile ve Sosyal Hizmetler Engelli Kimlik Kartı',
    rates: [
      { mode: 'TCDD Trenleri (Gazi & Şehit Yakını)', discount: '%100 Ücretsiz', details: 'Tüm vagon sınıflarında ücretsiz seyahat hakkı.' },
      { mode: 'TCDD Trenleri (Engelli Yolcu)', discount: '%50 İndirim', details: '%40 ve üzeri engelli raporu olan vatandaşlarımız için.' },
      { mode: 'Şehirlerarası Otobüs', discount: 'Yasal %30 İndirim', details: 'Tüm otobüs firmalarında zorunlu yasal indirim hakkı.' },
      { mode: 'İDO & Şehir Hatları', discount: '%100 Ücretsiz / İndirimli', details: 'Engelli refakatçi kartı ile geçerlidir.' },
    ],
    howToApply: 'Engelli/Gazi kartı numaranızla online rezervasyon yapabilir veya gişeden biletinizi alabilirsiniz.',
  },
];

export const DiscountsGuideModal: React.FC<DiscountsGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>('ogrenci');

  if (!isOpen) return null;

  const current = DISCOUNT_CATEGORIES.find((c) => c.id === selectedCatId) || DISCOUNT_CATEGORIES[0];

  const handleSelectCat = (id: string) => {
    sound.playTick();
    setSelectedCatId(id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cream-100 text-bordeaux-700 flex items-center justify-center border border-[#E8E1D5] text-lg font-black">
              🎟️
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">İndirimli Bilet & Yasal Haklar Rehberi</h3>
              <p className="text-xs text-charcoal-muted font-medium">Öğrenci, 65+ yaş, TSK personeli, öğretmen, engelli ve gazi indirim tarifeleri</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Content 2-Column */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          
          {/* Left Categories List */}
          <div className="md:col-span-5 border-r border-[#E8E1D5] overflow-y-auto p-4 space-y-2 bg-[#FAF7F2]/60">
            {DISCOUNT_CATEGORIES.map((cat) => {
              const isSelected = selectedCatId === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCat(cat.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-bordeaux-700 ring-2 ring-bordeaux-700/20 shadow-soft'
                      : 'bg-white/70 border-[#E8E1D5] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{cat.icon}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {cat.badge}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-[#1E1B18] line-clamp-1">{cat.title}</h4>
                  <p className="text-[11px] text-charcoal-muted line-clamp-1 mt-0.5">{cat.requiredDoc}</p>
                </button>
              );
            })}
          </div>

          {/* Right Details Pane */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-5 bg-white">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{current.icon}</span>
                <div>
                  <h3 className="text-xl font-black text-[#1E1B18] font-display">{current.title}</h3>
                  <span className="text-xs font-bold text-emerald-700">{current.badge}</span>
                </div>
              </div>
              <p className="text-xs text-charcoal-muted mt-2 leading-relaxed">{current.description}</p>
            </div>

            {/* Required Identification */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1">
              <span className="text-[10px] font-extrabold text-charcoal uppercase tracking-wider block">
                🪪 İbraz Edilmesi Gereken Belge / Kart
              </span>
              <p className="text-xs font-bold text-bordeaux-700">
                {current.requiredDoc}
              </p>
            </div>

            {/* Discount Rates List */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-black text-charcoal uppercase tracking-wider block">
                Ulaşım Türlerine Göre İndirim Oranları
              </span>
              <div className="space-y-2">
                {current.rates.map((rate, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-[#E8E1D5] flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-black text-[#1E1B18] block">{rate.mode}</span>
                      <span className="text-[11px] text-charcoal-muted font-medium">{rate.details}</span>
                    </div>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex-shrink-0 font-mono">
                      {rate.discount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* How to Apply */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase tracking-wider">
                <BileoSparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Bilete Nasıl Uygulanır?</span>
              </div>
              <p className="text-xs text-amber-950 font-medium leading-relaxed">
                {current.howToApply}
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
