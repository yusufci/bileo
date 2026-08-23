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

interface LostAndFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, desc?: string, type?: 'success' | 'error' | 'info' | 'promo') => void;
}

interface LostDeskInfo {
  id: string;
  category: 'tren' | 'ucak' | 'otobus' | 'feribot';
  title: string;
  location: string;
  contact: string;
  retentionPeriod: string;
  processSteps: string[];
  tips: string;
}

const LOST_DESKS: LostDeskInfo[] = [
  {
    id: 'tcdd-lost',
    category: 'tren',
    title: 'TCDD YHT & Anahat Trenleri Kayıp Eşya Büroları',
    location: 'Ankara YHT Garı Zemin Kat, İstanbul Söğütlüçeşme & Halkalı Danışma',
    contact: '444 82 33 / yhtkayipesya@tcdd.gov.tr',
    retentionPeriod: '1 Yıl Boyunca Güvenli Depolama',
    processSteps: [
      'Tren iniş saatinizi ve vagon/koltuk numaranızı belirtin.',
      'Eşyanız gardaki buluntu eşya tutanağı ile eşleştirilir.',
      'Kimlik ibrazı ve eşya detayı doğrulaması sonrası teslim edilir.',
    ],
    tips: 'Tren henüz ara istasyondaysa çağrı merkezini arayarak tren şefine anons geçilmesini sağlayabilirsiniz.',
  },
  {
    id: 'airport-lost',
    category: 'ucak',
    title: 'Havalimanı Terminal & Uçak İçi Buluntu Eşya',
    location: 'İstanbul Havalimanı (IST) & Sabiha Gökçen (SAW) Gelen Yolcu Katı',
    contact: 'IST: 0212 444 1 442 / SAW: 0216 588 88 88',
    retentionPeriod: 'Değerli eşyalar 5 yıl, giyim/aksesuar 6 ay',
    processSteps: [
      'Güvenlik kontrol noktasında unutulan eşyalar Havalimanı Emniyet Amirliği bürosuna devredilir.',
      'Uçak içinde unutulan eşyalar havayolunun yer hizmetleri (TGS / Havaş / Çelebi) ofisinde tutulur.',
      'Biniş kartı (Boarding Pass) ve bagaj fişinizle müracaat edebilirsiniz.',
    ],
    tips: 'Pasaport ve T.C. Kimlik kartı kayıplarında doğrudan Havalimanı Polis Noktasına başvurunuz.',
  },
  {
    id: 'bus-lost',
    category: 'otobus',
    title: 'Otogar & Şehirlerarası Otobüs Kayıp Eşya',
    location: 'Varış Otogarı Firma Yazıhanesi & Peron Amirliği',
    contact: 'Kamil Koç: 444 0 562 / Pamukkale: 0850 333 35 35 / Metro: 0850 222 34 55',
    retentionPeriod: 'Firmaya göre 3 ay - 6 ay',
    processSteps: [
      'Seyahat ettiğiniz aracın plakasını veya bilet PNR kodunu iletin.',
      'Araç hostu/kaptanı temizlik kontrolünde bulduğu eşyayı varış yazıhanesine teslim eder.',
      'Karşı ödemeli kargo ile adresinize gönderim talep edebilirsiniz.',
    ],
    tips: 'Koltuk arkası ceplerde unutulan kulaklık/gözlük gibi eşyalar araç garajına çekilmeden önce yazıhaneye bildirildiğinde daha hızlı bulunur.',
  },
  {
    id: 'ferry-lost',
    category: 'feribot',
    title: 'İDO & BUDO İskele Kayıp Eşya Birimleri',
    location: 'Yenikapı, Pendik, Yalova ve Bursa İskelesi Güvenlik Amirliği',
    contact: 'İDO: 0850 222 44 36 / BUDO: 0850 850 99 16',
    retentionPeriod: '6 Ay Muhafaza',
    processSteps: [
      'Gemi yanaştıktan sonra güverte güvenlik görevlileri salonu tarar.',
      'Bulunan eşyalar iskele kayıp eşya defterine kaydedilir.',
      'İskele gişelerinden kimlik göstererek teslim alınabilir.',
    ],
    tips: 'Açık güvertede rüzgardan düşen şapka/atkı gibi eşyalar için kalkış/varış iskele amirliğiyle görüşünüz.',
  },
];

export const LostAndFoundModal: React.FC<LostAndFoundModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [selectedDeskId, setSelectedDeskId] = useState<string>('tcdd-lost');
  const [itemCategory, setItemCategory] = useState<string>('Elektronik (Telefon, Laptop, Kulaklık)');
  const [itemDesc, setItemDesc] = useState<string>('');
  const [pnrCode, setPnrCode] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const current = LOST_DESKS.find((d) => d.id === selectedDeskId) || LOST_DESKS[0];

  const handleSelectDesk = (id: string) => {
    sound.playTick();
    setSelectedDeskId(id);
    setIsSubmitted(false);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDesc.trim()) return;
    sound.playSuccess();
    setIsSubmitted(true);
    if (onShowToast) {
      onShowToast(
        'Kayıp Eşya Bildirimi Alındı 📦',
        `Kayıt Numaranız: #KYP-${Math.floor(100000 + Math.random() * 900000)}. İlgili terminal ve araç ekibine anında iletildi.`,
        'success'
      );
    }
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
              🧳
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Kayıp & Buluntu Eşya Takip Portalı</h3>
              <p className="text-xs text-charcoal-muted font-medium">Gar, Havalimanı, Otogar ve İskelelerde Unutulan Eşya Sorgulama & Kayıt Masası</p>
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
          {LOST_DESKS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => handleSelectDesk(d.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedDeskId === d.id
                  ? 'bg-bordeaux-700 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              {React.createElement(getCategoryIcon(d.category), { className: 'w-3.5 h-3.5' })}
              <span>{d.title.split('&')[0].trim()}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Title & Desk Info */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xl font-black text-[#1E1B18] font-display">{current.title}</h4>
              <p className="text-xs text-charcoal-muted font-medium mt-0.5">📍 {current.location}</p>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-black">
              📞 {current.contact}
            </div>
          </div>

          {/* Retention Badge & Steps */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-charcoal uppercase tracking-wider">
                Eşya Teslim Alma Prosedürü
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-200">
                ⏳ {current.retentionPeriod}
              </span>
            </div>
            <div className="space-y-2">
              {current.processSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-medium text-charcoal">
                  <span className="w-5 h-5 rounded-full bg-cream-200 text-bordeaux-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Lost Item Report Form */}
          <div className="p-5 rounded-3xl bg-cream-100/70 border border-[#E8E1D5] space-y-4">
            <span className="text-[11px] font-black text-bordeaux-700 uppercase tracking-wider block">
              📝 Hızlı Kayıp Eşya Bildirimi Oluştur
            </span>

            {!isSubmitted ? (
              <form onSubmit={handleSubmitReport} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-charcoal uppercase tracking-wider block mb-1">
                      Eşya Türü
                    </label>
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white text-charcoal text-xs font-bold border border-[#E8E1D5] focus:outline-none"
                    >
                      <option>Elektronik (Telefon, Laptop, Kulaklık)</option>
                      <option>Çanta, Cüzdan, Sırt Çantası</option>
                      <option>Giyim, Palto, Ayakkabı, Gözlük</option>
                      <option>T.C. Kimlik, Pasaport, Evrak Çantası</option>
                      <option>Diğer Özel Eşya</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-charcoal uppercase tracking-wider block mb-1">
                      Bilet PNR Kodu / Koltuk No
                    </label>
                    <input
                      type="text"
                      value={pnrCode}
                      onChange={(e) => setPnrCode(e.target.value)}
                      placeholder="Örn: PNR-849204 veya Koltuk 14"
                      className="w-full px-3 py-2 rounded-xl bg-white text-charcoal text-xs font-bold border border-[#E8E1D5] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-charcoal uppercase tracking-wider block mb-1">
                    Eşya Tanımı & Ayırt Edici Özellikler
                  </label>
                  <textarea
                    rows={2}
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    placeholder="Örn: Siyah deri sırt çantası, içinde 13 inç laptop ve gri şarj aleti..."
                    className="w-full px-3 py-2 rounded-xl bg-white text-charcoal text-xs font-medium border border-[#E8E1D5] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-bordeaux-700 text-white font-black text-xs uppercase tracking-wider hover:bg-bordeaux-800 transition-colors cursor-pointer shadow-soft"
                >
                  Kayıp Eşya Bildirimini Gönder
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-center animate-fadeIn">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-sm">
                  <BileoCheck className="w-4 h-4" />
                </div>
                <h5 className="text-sm font-black text-emerald-950">Kayıp Eşya Kaydınız Başarıyla Oluşturuldu!</h5>
                <p className="text-xs text-emerald-800">
                  Bildiriminiz ilgili terminal amirliğine ve seyahat firmasına iletildi. Eşya bulunduğunda SMS ve e-posta ile anında bilgilendirileceksiniz.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="text-xs font-black text-emerald-900 underline pt-1 cursor-pointer"
                >
                  Yeni Bildirim Yap
                </button>
              </div>
            )}
          </div>

          {/* Traveler Tip */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1">
            <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-0.5">
              Kayıp Eşya Güvenlik Tavsiyesi
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
