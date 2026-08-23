import React, { useState } from 'react';
import {
  BileoClose,
  BileoCheck,
  BileoBus,
  BileoTrain,
  BileoPlane,
  BileoFerry,
} from './icons';
import { sound } from '../utils/sound';

interface CateringMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CateringService {
  id: string;
  category: 'tren' | 'ucak' | 'otobus' | 'feribot';
  title: string;
  subtitle: string;
  isFree: boolean;
  highlights: string[];
  specialDiets: { code: string; name: string; desc: string }[];
  noticePeriod: string;
  tips: string;
}

const CATERING_SERVICES: CateringService[] = [
  {
    id: 'yht-bistro',
    category: 'tren',
    title: 'TCDD YHT Bistro & Yemekli Vagon Servisi',
    subtitle: 'Yüksek Hızlı Trenlerde 2. Vagonda Konumlanan Bistro Kafeterya',
    isFree: false,
    highlights: [
      'Kaşarlı & Sucuklu Sıcak Tost Çeşitleri',
      'Taze Günlük Soğuk Sandviçler',
      'Demleme Çay & Taze Filtre Kahve',
      'Glütensiz Bisküvi & Kuruyemiş Paketleri',
      'Kredi Kartı / Temassız Ödeme İmkanı',
    ],
    specialDiets: [
      { code: 'BISTRO', name: 'Standart Menü', desc: 'Bistro vagonundan dilediğiniz an satın alım yapabilirsiniz.' },
      { code: 'BUSINESS', name: 'Business Kompartıman', desc: 'Seçili Business biletlerde sıcak içecek ve atıştırmalık masaya servis edilir.' },
    ],
    noticePeriod: 'Ön sipariş gerekmez; sefer boyunca 2. vagondaki bistro açıktır.',
    tips: 'Bistro vagonunda yer bulmak için ara istasyon kalkışlarından hemen sonra gitmeniz önerilir.',
  },
  {
    id: 'aviation-meals',
    category: 'ucak',
    title: 'Havayolu İkramları & Özel Yemek Seçenekleri',
    subtitle: 'THY, Pegasus, AJet ve SunExpress İçi Sıcak/Soğuk Menüler',
    isFree: true,
    highlights: [
      'THY İç Hatlarda Ücretsiz Sıcak Kaşarlı Pide & Sandviç',
      'Doğal Limonata, Taze Sıkma Portakal ve İçecek İkramı',
      'Dış Hat Uçuşlarında Sıcak Ana Yemek Servisi',
      'Bebek & Çocuklara Özel Eğlenceli Beslenme Kutuları',
    ],
    specialDiets: [
      { code: 'VGML', name: 'Vegan / Vejetaryen', desc: 'Hayvansal gıda içermeyen taze sebze ve tahıl menüsü.' },
      { code: 'GFML', name: 'Glütensiz Yemek', desc: 'Çölyak ve glüten hassasiyeti olan yolcular için özel steril paketleme.' },
      { code: 'DBML', name: 'Diyabetik Menü', desc: 'Şekersiz ve düşük glisemik indeksli dengeli besinler.' },
      { code: 'CHML', name: 'Çocuk Menüsü', desc: '2-12 yaş çocukların damak tadına uygun besleyici içerikler.' },
    ],
    noticePeriod: 'Özel yemek talepleri uçuş saatinden en geç 24 saat önce bildirilmelidir.',
    tips: 'Biletinizi aldıktan sonra PNR sorgulama ekranından özel yemek kodunuzu seçebilirsiniz.',
  },
  {
    id: 'bus-refreshments',
    category: 'otobus',
    title: 'Karayolu VIP Otobüs Açık Büfe İkramları',
    subtitle: 'Kamil Koç, Pamukkale, Metro ve Seçili Firmaların Yol Boyu İkramları',
    isFree: true,
    highlights: [
      'Kalkıştan 30 Dakika Sonra Başlayan Sıcak İçecek Servisi',
      'Tchibo / Nescafe Kahve & Demleme Siyah Çay',
      'Tatlı & Tuzlu Paketli Atıştırmalıklar (Kek, Çubuk Kraker)',
      'Yaz Aylarında Kapalı Kutu Dondurma İkramı',
      'Sınırsız 0.5L Kapalı Bardak/Şişe Su',
    ],
    specialDiets: [
      { code: 'IKRAM', name: 'Standart Ücretsiz Servis', desc: 'Tüm biletli yolculara her 2-3 saatte bir periyodik servis yapılır.' },
      { code: 'DIYET', name: 'Şekersiz İçecek', desc: 'Host / hostesten şekersiz çay/kahve veya diyet meşrubat talep edebilirsiniz.' },
    ],
    noticePeriod: 'Ön talep gerekmez; araç personeli sefer esnasında servis yapar.',
    tips: 'Sıcak içecek servisi esnasında koltuk servis masanızı açık tutmanız dökülmeleri önler.',
  },
  {
    id: 'ferry-cafe',
    category: 'feribot',
    title: 'İDO & BUDO Deniz Kafe & Büfe Hizmetleri',
    subtitle: 'Marmara Denizi Hızlı Feribot ve Deniz Otobüslerinde Taze İkramlar',
    isFree: false,
    highlights: [
      'Geleneksel Taze Çıtır Simit & Beyaz Peynir',
      'Taze Demleme Rize Çayı ve Türk Kahvesi',
      'Soğuk Kutu Meşrubatlar & Meyve Suları',
      'Tatlı / Tuzlu Atıştırmalıklar & Çikolata Çeşitleri',
    ],
    specialDiets: [
      { code: 'BUFE', name: 'Hızlı Deniz Büfe', desc: 'Feribot ana salonundaki büfeden nakit veya kartla sipariş verebilirsiniz.' },
    ],
    noticePeriod: 'Gemi hareket ettikten hemen sonra büfe servisi başlar.',
    tips: 'Açık güverteye çıkmadan önce sıcak çayınızı koruyucu kapakla almanız tavsiye edilir.',
  },
];

export const CateringMenuModal: React.FC<CateringMenuModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('yht-bistro');

  if (!isOpen) return null;

  const current = CATERING_SERVICES.find((s) => s.id === selectedServiceId) || CATERING_SERVICES[0];

  const handleSelectService = (id: string) => {
    sound.playTick();
    setSelectedServiceId(id);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tren': return BileoTrain;
      case 'ucak': return BileoPlane;
      case 'otobus': return BileoBus;
      case 'feribot': return BileoFerry;
      default: return BileoTrain;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200 text-lg font-black">
              ☕
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">İkram Menüleri & Özel Yemek Seçenekleri</h3>
              <p className="text-xs text-charcoal-muted font-medium">Tren Bistro, Uçak Sıcak Yemek, Otobüs Açık Büfe ve Deniz Kafe İkramları</p>
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
          {CATERING_SERVICES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectService(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedServiceId === s.id
                  ? 'bg-bordeaux-700 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              {React.createElement(getCategoryIcon(s.category), { className: 'w-3.5 h-3.5' })}
              <span>{s.title.split('&')[0].trim()}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Title & Tag */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xl font-black text-[#1E1B18] font-display">{current.title}</h4>
              <p className="text-xs text-charcoal-muted font-medium mt-0.5">{current.subtitle}</p>
            </div>
            <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
              current.isFree
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-900 border border-amber-200'
            }`}>
              {current.isFree ? '🎁 Ücretsiz Standart İkram' : '🛒 Menü / Ücretli Satış'}
            </span>
          </div>

          {/* Highlights Grid */}
          <div className="space-y-2">
            <span className="text-[11px] font-black text-charcoal uppercase tracking-wider block">
              Öne Çıkan Lezzetler & İkram Servisi
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {current.highlights.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#E8E1D5] text-xs font-bold text-charcoal"
                >
                  <BileoCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Special Diets List */}
          {current.specialDiets.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-black text-charcoal uppercase tracking-wider block">
                Özel Beslenme & Diyet Kodları
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {current.specialDiets.map((diet) => (
                  <div
                    key={diet.code}
                    className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-bordeaux-700">{diet.name}</span>
                      <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-[#FAF7F2] text-charcoal border border-[#E8E1D5]">
                        {diet.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-charcoal-muted leading-relaxed">{diet.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notice Period Box */}
          <div className="p-4 rounded-2xl bg-cream-100 border border-[#E8E1D5] text-xs space-y-1">
            <span className="text-[10px] font-black text-bordeaux-700 uppercase tracking-wider block">
              🕒 Talep & Servis Süresi
            </span>
            <p className="text-charcoal font-semibold leading-relaxed">{current.noticePeriod}</p>
          </div>

          {/* Traveler Tip */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1">
            <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-0.5">
              Yolcu Tavsiyesi
            </span>
            <p className="text-xs text-amber-950 font-medium leading-relaxed">
              💡 {current.tips}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
