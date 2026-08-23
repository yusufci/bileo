import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoBus,
  BileoTrain,
  BileoPlane,
  BileoCheckCircle,
} from './icons';
import { sound } from '../utils/sound';

interface OnboardEntertainmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo', duration?: number) => void;
}

interface MediaCategory {
  id: string;
  name: string;
  icon: string;
  items: {
    title: string;
    subtitle: string;
    tag: string;
    duration?: string;
  }[];
}

const MEDIA_CATEGORIES: MediaCategory[] = [
  {
    id: 'live_tv',
    name: 'Canlı TV & Haber',
    icon: '📺',
    items: [
      { title: 'TRT Spor HD', subtitle: 'Canlı Maç & Spor Gündemi', tag: 'Canlı Yayın' },
      { title: 'NTV & HaberTürk', subtitle: 'Kesintisiz Haber ve Ekonomi Akışı', tag: 'Canlı Yayın' },
      { title: 'TLC & DMAX', subtitle: 'Doğa & Yaşam Belgeselleri', tag: 'Belgesel' },
      { title: 'TRT Çocuk', subtitle: 'Rafadan Tayfa, Pırıl, Kaptan Pengu', tag: 'Çocuk' },
    ],
  },
  {
    id: 'movies',
    name: 'Vizyon & Klasik Filmler',
    icon: '🎬',
    items: [
      { title: 'Yol Hikayeleri (2025)', subtitle: 'Türk Sineması Dram & Macera', tag: 'HD 1080p', duration: '1s 54dk' },
      { title: 'Hızlı ve Öfkeli Serisi', subtitle: 'Aksiyon & Yüksek Hız', tag: 'Türkçe Dublaj', duration: '2s 10dk' },
      { title: 'Kış Uykusu & Ahlat Ağacı', subtitle: 'Nuri Bilge Ceylan Seçkisi', tag: 'Festival', duration: '3s 08dk' },
      { title: 'Hababam Sınıfı Koleksiyonu', subtitle: 'Restorasyonlu 4K Yeşilçam', tag: 'Klasik Komedi', duration: '1s 35dk' },
    ],
  },
  {
    id: 'audiobooks',
    name: 'Sesli Kitap & Podcast',
    icon: '🎧',
    items: [
      { title: 'Kürk Mantolu Madonna', subtitle: 'Sabahattin Ali • Seslendiren: Mert Fırat', tag: 'Sesli Kitap', duration: '4s 15dk' },
      { title: 'Nasıl Olunur? (Nilay Örnek)', subtitle: 'Kültür, Sanat ve Yaşam Sohbetleri', tag: 'Podcast', duration: '58dk' },
      { title: 'Tarihin Arka Odası & İlber Ortaylı', subtitle: 'Anadolu Seyahatleri ve Gar Tarihi', tag: 'Tarih', duration: '1s 20dk' },
      { title: 'Yol Hali & Meditasyon', subtitle: 'Rahatlatıcı Uyku ve Yol Müziği', tag: 'Gevşeme', duration: '2s 00dk' },
    ],
  },
  {
    id: 'kids',
    name: 'Çocuk & Aile',
    icon: '🧸',
    items: [
      { title: 'Kral Şakir: Korsanlar Diyarı', subtitle: 'Çocuk Animasyon & Macera', tag: 'Çizgi Dizi', duration: '1s 28dk' },
      { title: 'Pepee & Niloya Yolculukta', subtitle: 'Eğitici Okul Öncesi Maceralar', tag: 'Eğitici', duration: '45dk' },
      { title: 'Buz Devri 5', subtitle: 'Türkçe Dublaj Aile Komedisi', tag: 'Animasyon', duration: '1s 40dk' },
    ],
  },
];

const CARRIER_WIFI_GUIDES = [
  {
    carrier: 'Pamukkale Turizm',
    mode: 'otobus',
    ssid: 'PamukMedya-WiFi',
    portalUrl: 'pamukmedya.com (veya koltuk arkası ekran)',
    details: 'Her koltukta 10 inç Android ekran + telefon/tabletten internet kotası yemeden yerel medya akışı.',
  },
  {
    carrier: 'Kamil Koç',
    mode: 'otobus',
    ssid: 'KamilKoc-Eglence',
    portalUrl: 'multimedya.kamilkoc.com.tr',
    details: '2+1 ve 2+2 otobüslerde USB şarj destekli koltuk ekranları ve Wi-Fi bağlantısı.',
  },
  {
    carrier: 'TCDD YHT (Yüksek Hızlı Tren)',
    mode: 'tren',
    ssid: 'YHT-WIFI-PORTAL',
    portalUrl: 'yhtportal.tcdd.gov.tr',
    details: 'Siemens Velaro ve CAF setlerinde vagon içi intranet film/müzik arşivi ve internet erişimi.',
  },
  {
    carrier: 'Türk Hava Yolları / AJet',
    mode: 'ucak',
    ssid: 'TK-Planet / AJet-Inflight',
    portalUrl: 'planet.thy.com',
    details: 'Uçuş modundayken telefonunuzdan bağlanabileceğiniz 500+ film, müzik ve uçuş haritası.',
  },
];

export const OnboardEntertainmentModal: React.FC<OnboardEntertainmentModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('live_tv');

  if (!isOpen) return null;

  const currentCategory = MEDIA_CATEGORIES.find((c) => c.id === selectedCategory) || MEDIA_CATEGORIES[0];

  const handleTestConnection = (ssid: string) => {
    sound.playSuccess();
    if (onShowToast) {
      onShowToast(
        'Multimedya Portalı Hazır',
        `"${ssid}" ağına bağlandıktan sonra tarayıcınızdan portal sayfasına ücretsiz erişebilirsiniz.`,
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
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-900 flex items-center justify-center border border-indigo-200 text-lg font-black">
              🎬
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Araç İçi Multimedya & Wi-Fi Eğlence Rehberi</h3>
              <p className="text-xs text-charcoal-muted font-medium">Otobüs, YHT ve uçaklarda canlı TV, film, sesli kitap ve Wi-Fi bağlantı kılavuzu</p>
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
          
          {/* Category Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MEDIA_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => { sound.playTick(); setSelectedCategory(cat.id); }}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer shadow-2xs flex items-center gap-2.5 ${
                  selectedCategory === cat.id
                    ? 'bg-bordeaux-900 text-white border-bordeaux-900 shadow-soft'
                    : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="text-xs font-black truncate">{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Media Items Showcase */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E1D5]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-charcoal">{currentCategory.name} İçerik Kataloğu</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                İnternet Kotası Yemez (Yerel Sunucu)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentCategory.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1.5 shadow-2xs hover:border-bordeaux-300 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-black text-charcoal text-xs">{item.title}</h5>
                    <span className="text-[10px] font-bold text-bordeaux-800 bg-white px-2 py-0.5 rounded-md border border-[#E8E1D5]">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-charcoal-muted font-medium">{item.subtitle}</p>
                  {item.duration && (
                    <span className="text-[10px] text-charcoal-muted/70 font-semibold block">
                      Süre: {item.duration}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Carrier Connection Guide */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-charcoal uppercase tracking-wider">Firma & Araç Wi-Fi Bağlantı Kılavuzu</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CARRIER_WIFI_GUIDES.map((g, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {g.mode === 'tren' ? <BileoTrain className="w-4 h-4 text-emerald-700" /> : g.mode === 'ucak' ? <BileoPlane className="w-4 h-4 text-sky-700" /> : <BileoBus className="w-4 h-4 text-bordeaux-700" />}
                      <span className="text-xs font-black text-charcoal">{g.carrier}</span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 font-mono">
                      {g.ssid}
                    </span>
                  </div>

                  <p className="text-[11px] text-charcoal-muted font-medium leading-relaxed">
                    {g.details}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-[#E8E1D5]/60 text-[10px]">
                    <span className="text-charcoal-muted font-bold">Portal: <strong className="text-charcoal font-mono">{g.portalUrl}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleTestConnection(g.ssid)}
                      className="text-bordeaux-800 hover:text-bordeaux-950 font-black cursor-pointer underline"
                    >
                      Nasıl Bağlanırım?
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Checklist */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-charcoal-muted font-medium">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>3.5mm standart kulaklık ve Bluetooth ses aktarımı tüm araçlarda desteklenir.</span>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <BileoCheckCircle className="w-4 h-4" />
              <span>220V Priz & USB 2.1A Şarj Aktif</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
