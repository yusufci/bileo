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

interface AccessibilityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServiceArea {
  id: string;
  category: 'tren' | 'ucak' | 'otobus' | 'feribot';
  title: string;
  subtitle: string;
  hotline: string;
  features: string[];
  requestSteps: string[];
  prmCodes?: { code: string; name: string; desc: string }[];
  companionRule: string;
}

const ACCESSIBILITY_SERVICES: ServiceArea[] = [
  {
    id: 'tcdd-turuncu-masa',
    category: 'tren',
    title: 'TCDD Turuncu Masa Engelsiz Hizmeti',
    subtitle: 'YHT Garlarında ve Ana İstasyonlarda Birebir Refakatçi ve Tekerlekli Sandalye Desteği',
    hotline: '444 82 33 (Dahili: 3)',
    features: [
      'Gara Girişten Vagondaki Koltuğa Kadar Birebir Görevli Refakati',
      'YHT Setlerinde Tekerlekli Sandalye Sabitleme Alanları',
      'Engelli Asansörleri ve Hissedilebilir Yürüme Yüzeyleri',
      'Görsel ve Sesli Yolcu Bilgilendirme Ekranları',
      'İşitme Engelliler İçin Görüntülü Çağrı Merkezi Desteği',
    ],
    requestSteps: [
      'Biletinizi alırken "Engelli / Turuncu Masa Yolcusu" seçeneğini işaretleyin.',
      'Seyahat saatinden en az 1 saat önce gardaki "Turuncu Masa İletişim Noktası"na başvurun.',
      'Görevli personel bagajınıza yardımcı olarak sizi vagon koltuğunuza kadar yerleştirir.',
    ],
    companionRule: 'Ağır engelli (%50 ve üzeri) yolcuların 1 refakatçisi YHT biletlerinden %50 indirimli yararlanır.',
  },
  {
    id: 'airport-prm',
    category: 'ucak',
    title: 'Havalimanı PRM & Özel Yolcu Hizmetleri',
    subtitle: 'İstanbul (IST), Sabiha Gökçen (SAW) ve Tüm Havalimanlarında Öncelikli Geçiş & Ambulift',
    hotline: '0850 800 00 00 / THY: 444 0 849',
    features: [
      'Terminal Girişinden Uçak Koltuğuna Kadar Tekerlekli Sandalye Tahsisi',
      'Öncelikli Güvenlik, Check-in ve Pasaport Geçiş Kontuarları',
      'Körüklü Olmayan Uçaklarda Özel Hidrolik Asansörlü Ambulift Aracı',
      'Rehber Köpeklerin Kabin İçinde Ücretsiz Taşınması',
      'Uçak İçi Koridor Sandalyesi (WCHC)',
    ],
    requestSteps: [
      'Bilet alımında veya uçuştan en geç 48 saat önce havayoluna WCHR/WCHS/WCHC kodunu iletin.',
      'Havalimanına uçuş saatinden 2.5 saat önce gelip "Özel Yolcu Masası"na müracaat edin.',
      'Yer hizmeti personeli bagaj tesliminden uçağa binişe kadar refakat eder.',
    ],
    prmCodes: [
      { code: 'WCHR', name: 'Rampa Tekerlekli Sandalye', desc: 'Merdiven inip çıkabilen ancak uzun mesafe yürüyemeyen yolcular.' },
      { code: 'WCHS', name: 'Merdiven Sandalyesi', desc: 'Düz zeminde yürüyebilen ancak uçak basamaklarını çıkamayan yolcular.' },
      { code: 'WCHC', name: 'Tam Hareketsiz Sandalye', desc: 'Kabin içi koltuğuna kadar taşınması gereken yolcular.' },
    ],
    companionRule: 'Kendi başına acil çıkış tahliyesini gerçekleştiremeyecek yolcular için refakatçi zorunludur.',
  },
  {
    id: 'bus-accessibility',
    category: 'otobus',
    title: 'Karayolu Şehirlerarası Engelsiz Ulaşım',
    subtitle: 'Rampalı Peronlar, Ön Sıra Koltuk Önceliği ve Karayolları Taşıma Kanunu Güvencesi',
    hotline: 'Ulaştırma Bakanlığı Alo 123',
    features: [
      '1 ve 2 Numaralı Ön Koltukların Hareket Kısıtlı Yolculara Öncelikli Tahsisi',
      'Tekerlekli Sandalyelerin Bagajda Ücretsiz ve Hasarsız Taşınması',
      'Rehber Köpeklerin Ağızlıklı Olarak Yolcu Yanında Seyahati (Ücretsiz)',
      'Otogar İçi Engelli Rampaları ve Engelli Tuvaletleri',
    ],
    requestSteps: [
      'Bilet alımı esnasında Engelli Kimlik Kartınızı ibraz ederek %30 yasal indirim hakkınızı talep edin.',
      'Perona kalkıştan 30 dakika önce gelerek araç kaptanına bagaj yerleşimi bilgisini verin.',
    ],
    companionRule: 'Refakatçi eşliğinde seyahat eden yolcular için araç personeli biniş ve inişte destek sağlar.',
  },
  {
    id: 'ferry-accessibility',
    category: 'feribot',
    title: 'Denizyolu & Hızlı Feribot Engelsiz Erişim',
    subtitle: 'İDO ve BUDO Gemilerinde Rampalı Biniş Köprüleri ve Engelli Asansörleri',
    hotline: '0850 222 44 36',
    features: [
      'Tekerlekli Sandalye İçin Genişletilmiş Biniş Rampaları',
      'Gemi İçi Engelli Asansörleri (Araç Güvertesinden Yolcu Salonuna)',
      'Ana Salonda Özel Tekerlekli Sandalye Park Alanları',
      'Geniş Kapılı ve Çağrı Butonlu Özel Tuvaletler',
    ],
    requestSteps: [
      'Terminal gişelerinden veya çağrı merkezinden biniş desteği talebi oluşturun.',
      'İskeledeki biniş görevlileri gemiye geçişte öncelikli koridoru açar.',
    ],
    companionRule: 'Refakatçi yolcular engelli yolcu ile yan yana koltuklarda seyahat eder.',
  },
];

export const AccessibilityGuideModal: React.FC<AccessibilityGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('tcdd-turuncu-masa');

  if (!isOpen) return null;

  const current = ACCESSIBILITY_SERVICES.find((s) => s.id === selectedServiceId) || ACCESSIBILITY_SERVICES[0];

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
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center border border-blue-200 text-lg font-black">
              ♿
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Engelsiz Seyahat & Erişilebilirlik Portalı</h3>
              <p className="text-xs text-charcoal-muted font-medium">Turuncu Masa, Havalimanı PRM Refakati, Tekerlekli Sandalye & Öncelikli Geçiş</p>
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
          {ACCESSIBILITY_SERVICES.map((s) => (
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
              <span>{s.title.split(' ')[0]} {s.title.split(' ')[1]}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Title & Hotline */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xl font-black text-[#1E1B18] font-display">{current.title}</h4>
              <p className="text-xs text-charcoal-muted font-medium mt-0.5">{current.subtitle}</p>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-black flex items-center gap-1.5">
              <span>📞 Destek Hattı: {current.hotline}</span>
            </div>
          </div>

          {/* Features Grid */}
          <div className="space-y-2">
            <span className="text-[11px] font-black text-charcoal uppercase tracking-wider block">
              Sunulan Engelsiz Ulaşım İmkanları
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {current.features.map((item, idx) => (
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

          {/* PRM Special Codes (If Airport) */}
          {current.prmCodes && (
            <div className="space-y-2">
              <span className="text-[11px] font-black text-charcoal uppercase tracking-wider block">
                Uluslararası Havacılık PRM Hareket Kısıtı Kodları
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {current.prmCodes.map((prm) => (
                  <div
                    key={prm.code}
                    className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-bordeaux-700">{prm.name}</span>
                      <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                        {prm.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-charcoal-muted leading-relaxed">{prm.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step-by-Step Request Guide */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2.5">
            <span className="text-[10px] font-black text-charcoal uppercase tracking-wider block">
              📋 Başvuru & Refakat Talep Adımları
            </span>
            <div className="space-y-2">
              {current.requestSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-medium text-charcoal">
                  <span className="w-5 h-5 rounded-full bg-cream-200 text-bordeaux-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Companion Rule */}
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 space-y-1">
            <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider block mb-0.5">
              Refakatçi Yasal Hakları
            </span>
            <p className="text-xs text-blue-950 font-medium leading-relaxed">
              🤝 {current.companionRule}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
