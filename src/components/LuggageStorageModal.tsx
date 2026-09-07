import React, { useState } from 'react';
import {
  BileoClose,
  BileoMapPin,
  BileoCheck,
} from './icons';
import { sound } from '../utils/sound';
import { SampleDataNotice } from './common/SampleDataNotice';

interface LuggageStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StorageHub {
  id: string;
  hubName: string;
  location: string;
  hours: string;
  contact: string;
  smallBagFee: string;
  mediumBagFee: string;
  largeBagFee: string;
  securityNote: string;
  tips: string;
}

const STORAGE_HUBS: StorageHub[] = [
  {
    id: 'ist-airport',
    hubName: 'İstanbul Havalimanı (IST) Emanet Eşya',
    location: 'Gelen Yolcu Katı (Kapı 13 Yanı) & Giden Yolcu Katı (Check-in Sırası F)',
    hours: '7/24 Kesintisiz Hizmet',
    contact: '0212 444 1 442',
    smallBagFee: '90 TL / Gün',
    mediumBagFee: '150 TL / Gün',
    largeBagFee: '220 TL / Gün',
    securityNote: 'Tüm eşyalar güvenlik x-ray taramasından geçirildikten sonra barkodlu ve mühürlü teslim edilir.',
    tips: 'Uzun aktarma sürelerinizde eşyalarınızı emanete bırakıp M11 metro hattı ile şehri gezebilirsiniz.',
  },
  {
    id: 'saw-airport',
    hubName: 'Sabiha Gökçen (SAW) Bagaj Emanet',
    location: 'Terminal Dışı Giriş Meydanı & Gelen Yolcu Çıkışı',
    hours: '7/24 Kesintisiz Hizmet',
    contact: '0216 588 88 88',
    smallBagFee: '80 TL / Gün',
    mediumBagFee: '130 TL / Gün',
    largeBagFee: '190 TL / Gün',
    securityNote: 'T.C. Kimlik Kartı veya Pasaport ibrazı ile emanet makbuzu kesilmektedir.',
    tips: 'Uçuşunuzdan 30 dakika önce emanet fişinizle teslim almanız önerilir.',
  },
  {
    id: 'esenler-otogar',
    hubName: 'Büyük İstanbul Otogarı (Esenler) Emanet',
    location: 'Alt Peron Katı, 48-52 No’lu Peronlar Arası Resmi Emanet Ofisi',
    hours: '24 Saat Açık',
    contact: '0212 658 00 34',
    smallBagFee: '50 TL / Gün',
    mediumBagFee: '80 TL / Gün',
    largeBagFee: '120 TL / Gün',
    securityNote: 'Resmi Otogar İşletmesi mühürlü numaralı fiş sistemiyle çalışır.',
    tips: 'Sefer kalkış saatinize kadar valizlerinizi güvenle bırakıp metro ile Tarihi Yarımada’ya geçebilirsiniz.',
  },
  {
    id: 'asti-ankara',
    hubName: 'Ankara AŞTİ Otogarı Emanet Ofisi',
    location: 'Zemin Kat Gelen Yolcu Salonu, Doğu Çıkış Kapısı Yanı',
    hours: '24 Saat Kesintisiz',
    contact: '0312 207 10 00',
    smallBagFee: '40 TL / Gün',
    mediumBagFee: '70 TL / Gün',
    largeBagFee: '100 TL / Gün',
    securityNote: 'Kayıt esnasında güvenlik kamerası kaydı ve fiş teslimi yapılmaktadır.',
    tips: 'Kızılay ve Anıtkabir ziyaretleriniz için Ankaray bağlantısı öncesi eşyalarınızı bırakabilirsiniz.',
  },
  {
    id: 'ankara-yht',
    hubName: 'Ankara YHT Garı Elektronik Emanet Dolapları',
    location: 'Gar Ana Binası B1 Katı & Peron Giriş Holü',
    hours: '06:00 - 23:30',
    contact: '0312 444 82 33',
    smallBagFee: '45 TL / Gün',
    mediumBagFee: '75 TL / Gün',
    largeBagFee: '110 TL / Gün',
    securityNote: 'Şifreli elektronik çelik dolaplar; temassız kart veya nakit ile kilitlenir.',
    tips: 'Kendi belirleyeceğiniz 6 haneli PIN şifresi ile dolabınızı gün boyu dilediğinizce açıp kapatabilirsiniz.',
  },
];

export const LuggageStorageModal: React.FC<LuggageStorageModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedHubId, setSelectedHubId] = useState<string>('esenler-otogar');

  if (!isOpen) return null;

  const current = STORAGE_HUBS.find((h) => h.id === selectedHubId) || STORAGE_HUBS[0];

  const handleSelectHub = (id: string) => {
    sound.playTick();
    setSelectedHubId(id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 text-lg font-black">
              🛅
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Otogar & Havalimanı Emanet Dolapları (örnek)</h3>
              <p className="text-xs text-charcoal-muted font-medium">Valiz ve eşya emanet ofisleri, günlük tarifeler ve konum bilgileri</p>
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

        {/* Hub Tabs */}
        <div className="px-6 py-3 bg-white/50 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {STORAGE_HUBS.map((hub) => (
            <button
              key={hub.id}
              type="button"
              onClick={() => handleSelectHub(hub.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                selectedHubId === hub.id
                  ? 'bg-bordeaux-700 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              {hub.hubName.split('(')[0].trim()}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Title & Hours */}
          <div>
            <span className="text-[10px] font-black text-bordeaux-700 uppercase tracking-widest block mb-1">
              🕒 {current.hours}
            </span>
            <h3 className="text-xl font-black text-[#1E1B18] font-display">{current.hubName}</h3>
          </div>

          {/* Location Box */}
          <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-white border border-[#E8E1D5] text-xs">
            <BileoMapPin className="w-4 h-4 text-bordeaux-700 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-[#1E1B18] block">Emanet Ofisi & Dolap Konumu:</span>
              <p className="text-charcoal-muted leading-relaxed">{current.location}</p>
            </div>
          </div>

          {/* Daily Price Tiers Grid */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-black text-charcoal uppercase tracking-wider block">
              Günlük Bagaj & Valiz Emanet Tarifesi
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1">
                <span className="text-[10px] font-extrabold text-charcoal-muted uppercase tracking-wider block">🎒 Küçük Boy (Sırt Çantası)</span>
                <span className="text-lg font-black text-charcoal font-display block">{current.smallBagFee}</span>
                <span className="text-[11px] text-charcoal-muted font-medium block">Maks. 5-10 KG</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1">
                <span className="text-[10px] font-extrabold text-charcoal-muted uppercase tracking-wider block">🧳 Orta Boy (Kabin Valizi)</span>
                <span className="text-lg font-black text-bordeaux-700 font-display block">{current.mediumBagFee}</span>
                <span className="text-[11px] text-charcoal-muted font-medium block">Maks. 15-25 KG</span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
                <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider block">📦 Büyük Boy (Büyük Valiz/Koli)</span>
                <span className="text-lg font-black text-blue-950 font-display block">{current.largeBagFee}</span>
                <span className="text-[11px] text-blue-800 font-medium block">30+ KG & Hacimli Eşyalar</span>
              </div>

            </div>
          </div>

          {/* Security & Procedures */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2">
            <span className="text-[10px] font-extrabold text-charcoal uppercase tracking-wider block">
              🛡️ Güvenlik & Teslim Prosedürü
            </span>
            <div className="flex items-center gap-2 text-xs font-bold text-charcoal">
              <BileoCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{current.securityNote}</span>
            </div>
          </div>

          {/* Traveler Tip */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1">
            <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-1">
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
