import React, { useState } from 'react';
import {
  BileoClose,
  BileoCheck,
} from './icons';
import { sound } from '../utils/sound';

interface StudentTravelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, desc?: string, type?: 'success' | 'error' | 'info' | 'promo') => void;
}

export const StudentTravelModal: React.FC<StudentTravelModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [eduMailOrTc, setEduMailOrTc] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduMailOrTc.trim()) return;
    sound.playTick();
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      sound.playSuccess();
      if (onShowToast) {
        onShowToast(
          'Genç Bileo Statüsü Onaylandı 🎉',
          'YÖKSİS / E-Devlet doğrulamanız başarıyla tamamlandı. Tüm seyahatlerinizde %20 ek öğrenci indirimi tanımlandı.',
          'promo'
        );
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 text-lg font-black">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-[#1E1B18] font-display">Genç Bileo • Öğrenci Kulübü</h3>
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[10px] font-black uppercase tracking-wider">
                  13-26 Yaş
                </span>
              </div>
              <p className="text-xs text-charcoal-muted font-medium">Öğrenci indirimleri, ekstra bagaj hakları ve YÖKSİS hızlı doğrulama</p>
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
          
          {/* Top Verification Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-900 to-bordeaux-800 text-white shadow-soft relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <span className="text-[10px] font-black text-purple-200 uppercase tracking-widest block">
                ⚡ 1 DAKİKADA ANINDA AKTİVASYON
              </span>
              <h4 className="text-xl sm:text-2xl font-black font-display">
                Öğrenciliğini Doğrula, Tüm Biletlerde %15 - %20 İndirim Kazan
              </h4>
              <p className="text-xs text-purple-100 max-w-xl leading-relaxed">
                Üniversite .edu.tr e-posta adresin veya T.C. Kimlik Numaran ile YÖKSİS üzerinden anında doğrula. Otobüs, YHT ve uçak biletlerine otomatik indirim tanımlansın.
              </p>

              {!isVerified ? (
                <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-2 pt-2 max-w-md">
                  <input
                    type="text"
                    value={eduMailOrTc}
                    onChange={(e) => setEduMailOrTc(e.target.value)}
                    placeholder="Örn: ogrenci@itu.edu.tr veya T.C. No..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white text-charcoal text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="px-5 py-2.5 rounded-xl bg-white text-purple-900 font-extrabold text-xs uppercase tracking-wider hover:bg-cream-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? 'Doğrulanıyor...' : 'Doğrula'}
                  </button>
                </form>
              ) : (
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <BileoCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Genç Bileo Statünüz Aktif! Tüm biletlerinizde öğrenci indirimi uygulanacaktır.</span>
                </div>
              )}
            </div>
          </div>

          {/* 4 Modal Student Privileges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-bordeaux-700">🚄 TCDD YHT Tren İndirimi</span>
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[10px] font-black">%15 İndirim</span>
              </div>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Tüm Yüksek Hızlı Tren ve Anahat tren biletlerinde yılın 365 günü %15 net indirim hakkı.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-700">✈️ Havayolu Genç Bagajı</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-black">+20 KG Bagaj</span>
              </div>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                THY ve AJet iç hat uçuşlarında %10 bilet indirimi ve memleket dönüşleri için ücretsiz 20 kg ekstra bagaj hakkı.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-700">🚌 Otobüs Puan Biriktirme</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-black">5. Bilette %50</span>
              </div>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Kamil Koç, Pamukkale ve 200+ partner firmada her seferinde Genç Puan kazan, 5. biletinde %50 indirim kullan.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-800">🏛️ Müzekart & Kültür Rehberi</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[10px] font-black">60 TL / Yıl</span>
              </div>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Gittiğin şehirdeki 300'den fazla müze ve örenyerine Kültür Bakanlığı Müzekart ile 1 yıl boyunca sınırsız giriş.
              </p>
            </div>

          </div>

          {/* Tips Box */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1">
            <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-0.5">
              Vize & Final Haftası İpucu
            </span>
            <p className="text-xs text-amber-950 font-medium leading-relaxed">
              💡 Üniversite sınav ve tatil dönemlerinde yoğunluk yaşandığı için tren ve otobüs biletlerinizi 15-20 gün önceden almanız önerilir. İptal ve açığa alma işlemlerinde cezasız %100 iade hakkınız korunur.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
