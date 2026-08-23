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

interface OnboardTechModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TechSpec {
  id: string;
  category: 'tren' | 'ucak' | 'otobus' | 'feribot';
  title: string;
  subtitle: string;
  powerRating: string;
  wifiStatus: string;
  entertainment: string;
  quietZone: string;
  features: string[];
  tips: string;
}

const TECH_SPECS: TechSpec[] = [
  {
    id: 'yht-tech',
    category: 'tren',
    title: 'TCDD YHT Yüksek Hızlı Tren Donanımı',
    subtitle: 'Siemens Velaro & CAF Setlerinde Modern Çalışma & Şarj Altyapısı',
    powerRating: '220V Standart Priz (Her 2 Koltuğa 1 Adet) + USB-A',
    wifiStatus: 'Ücretsiz TCDD Wi-Fi (Tüneller hariç kesintisiz)',
    entertainment: 'Yerel Multimedya Portalı (Film, Müzik, Güncel Gazeteler)',
    quietZone: '1. Vagon (Business) ve Seçili Kompartımanlar Sessiz Alandır',
    features: [
      'Geniş Katlanır Çalışma Masaları (Laptop için ideal)',
      'Koltuk Başı Ayarlanabilir LED Okuma Lambaları',
      'Tünel ve Viyadüklerde Düşük Sarsıntılı Manyetik Ray Dengesi',
      'Telefon Görüşmeleri İçin Vagon Arası Akustik Koridorlar',
    ],
    tips: 'Laptop şarj adaptörünüzü çantanızın üst gözünde tutun; prizler koltuk altı orta bölmede yer alır.',
  },
  {
    id: 'airline-tech',
    category: 'ucak',
    title: 'Havayolu Kabin İçi Teknoloji Standartları',
    subtitle: 'THY, Pegasus, AJet ve SunExpress Filolarında Dijital Konfor',
    powerRating: 'USB-A & 60W USB-C Hızlı Şarj (Koltuk Altı / Ekran Yanı)',
    wifiStatus: 'FlyTurkish / Havayolu İnternet (Miles&Smiles ile ücretsiz mesajlaşma)',
    entertainment: 'Planet Bireysel Dokunmatik Ekranlar & Kabin İçi Wi-Fi Yayını',
    quietZone: 'Uçuş Boyunca Kulaklık Kullanımı Zorunludur',
    features: [
      '300+ Vizyon Filmi, Dizi ve Canlı TV Yayını (THY Geniş Gövde)',
      'Bluetooth Kulaklık Eşleştirme Desteği (Yeni Nesil A350 & B787)',
      '10.000 Metrede WhatsApp, Telegram ve iMessage Ücretsiz Mesajlaşma',
      'Uçuş Haritası & Canlı Uçuş Telemetrisi (Yükseklik, Hız, Kalan Süre)',
    ],
    tips: 'Kendi kablolu 3.5mm veya Bluetooth kulaklığınızı yanınıza alarak uçak içi eğlence sistemine doğrudan bağlanabilirsiniz.',
  },
  {
    id: 'bus-tech',
    category: 'otobus',
    title: 'Karayolu VIP 2+1 Otobüs Donanımları',
    subtitle: 'Mercedes Travego, Tourismo ve Setra 2+1 Lüks Filolarda Teknoloji',
    powerRating: 'Her Koltukta Bağımsız 220V Priz + 45W Type-C Hızlı Şarj',
    wifiStatus: 'Sınırsız 4.5G Karayolu Wi-Fi Yayını',
    entertainment: '10.1 inç Android Dokunmatik Koltuk Ekranı (Netflix/YouTube/Spotify)',
    quietZone: 'Gece Seferlerinde 23:00 - 07:00 Arası Otomatik Karartma',
    features: [
      'Geniş Koltuk Aralığı (Diz mesafesi 85cm+)',
      'Ayarlanabilir Ergonomik Baş ve Baldır Dayama Desteği',
      'Kişiye Özel Havalandırma Menfezleri ve Gece Işığı',
      'Telefon/Tablet Sabitleme Yuvası ve Bardaklık',
    ],
    tips: 'Koltuk arkası ekrana kendi kablolu kulaklığınızı takabilir veya hosttan ücretsiz tek kullanımlık kulaklık isteyebilirsiniz.',
  },
  {
    id: 'ferry-tech',
    category: 'feribot',
    title: 'Hızlı Feribot & Deniz Otobüsü Donanımları',
    subtitle: 'İDO ve BUDO Hızlı Katamaran Gemilerinde Dijital İmkanlar',
    powerRating: 'Ana Salon ve Çalışma Masalarında 220V Şarj İstasyonları',
    wifiStatus: 'Marmara Denizi Açıklarında Kesintisiz 4.5G Çekim Gücü',
    entertainment: 'Ortak Salon TV Yayınları & Canlı Seyir Haritası',
    quietZone: 'Açık Güverte ve Kapalı Salon Ayrımı',
    features: [
      'Geniş Panoramik Deniz Manzaralı Masalı Koltuklar',
      'Elektronik Cihazlar İçin Güvenli Şarj Totemleri',
      'Deniz Ortasında Kesintisiz Mobil Veri Kapsama Alanı',
    ],
    tips: 'Laptop ile çalışacaksanız bilet alırken masalı koltuk düzenini (4 kişilik karşılıklı) seçmeniz önerilir.',
  },
];

export const OnboardTechModal: React.FC<OnboardTechModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedTechId, setSelectedTechId] = useState<string>('yht-tech');

  if (!isOpen) return null;

  const current = TECH_SPECS.find((s) => s.id === selectedTechId) || TECH_SPECS[0];

  const handleSelectTech = (id: string) => {
    sound.playTick();
    setSelectedTechId(id);
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
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-800 flex items-center justify-center border border-cyan-200 text-lg font-black">
              🔌
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Priz, Wi-Fi & Teknoloji Rehberi</h3>
              <p className="text-xs text-charcoal-muted font-medium">Tren, Uçak, VIP Otobüs ve Feribotlarda Şarj, İnternet ve Eğlence Donanımları</p>
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
          {TECH_SPECS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectTech(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedTechId === s.id
                  ? 'bg-bordeaux-700 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              {React.createElement(getCategoryIcon(s.category), { className: 'w-3.5 h-3.5' })}
              <span>{s.title.split(' ')[0]} {s.title.split(' ')[1]}</span>
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

          {/* 4 Core Specs Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1 shadow-2xs">
              <span className="text-[10px] font-black text-cyan-800 uppercase tracking-wider block">
                ⚡ Priz & Şarj İmkanı
              </span>
              <p className="text-xs font-bold text-charcoal leading-relaxed">{current.powerRating}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1 shadow-2xs">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                📶 İnternet & Wi-Fi
              </span>
              <p className="text-xs font-bold text-charcoal leading-relaxed">{current.wifiStatus}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1 shadow-2xs">
              <span className="text-[10px] font-black text-purple-800 uppercase tracking-wider block">
                🎬 Eğlence & Multimedya
              </span>
              <p className="text-xs font-bold text-charcoal leading-relaxed">{current.entertainment}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1 shadow-2xs">
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                🤫 Sessiz Alan & Gece Düzeni
              </span>
              <p className="text-xs font-bold text-charcoal leading-relaxed">{current.quietZone}</p>
            </div>

          </div>

          {/* Features Checklist */}
          <div className="space-y-2">
            <span className="text-[11px] font-black text-charcoal uppercase tracking-wider block">
              Öne Çıkan Dijital & Ergonomik Özellikler
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {current.features.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#E8E1D5] text-xs font-bold text-charcoal"
                >
                  <BileoCheck className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips Box */}
          <div className="p-4 rounded-2xl bg-cyan-50/80 border border-cyan-200/80 space-y-1">
            <span className="text-[10px] font-extrabold text-cyan-900 uppercase tracking-wider block mb-0.5">
              Dijital Göçebe & Yolcu Tavsiyesi
            </span>
            <p className="text-xs text-cyan-950 font-medium leading-relaxed">
              💡 {current.tips}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
