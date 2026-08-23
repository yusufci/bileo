import React, { useState } from 'react';
import {
  BileoClose,
  BileoCheck,
  BileoBus,
  BileoTrain,
  BileoPlane,
} from './icons';
import { sound } from '../utils/sound';

interface GroupBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, desc?: string, type?: 'success' | 'error' | 'info' | 'promo') => void;
}

export const GroupBookingModal: React.FC<GroupBookingModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [groupSize, setGroupSize] = useState<number>(15);
  const [travelType, setTravelType] = useState<string>('otobus');
  const [fromCity, setFromCity] = useState<string>('İstanbul');
  const [toCity, setToCity] = useState<string>('Ankara');
  const [contactName, setContactName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPhone.trim()) return;
    sound.playSuccess();
    setIsSubmitted(true);
    if (onShowToast) {
      onShowToast(
        'Grup Rezervasyon Talebi Alındı 👥',
        `${groupSize} kişilik ${travelType.toUpperCase()} seferi için kurumsal teklifiniz hazırlandı. Uzmanımız 15 dakika içinde arayacaktır.`,
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
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-800 flex items-center justify-center border border-indigo-200 text-lg font-black">
              👥
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Grup & Kurumsal Bilet Portalı</h3>
              <p className="text-xs text-charcoal-muted font-medium">10+ Kişilik Geziler, Şirket Seyahatleri, Okul & Düğün Konvoyları İçin İndirimli Rezervasyon</p>
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
          
          {/* Top Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-bordeaux-800 text-white shadow-soft relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest block">
                ⭐ TOPLU ALIM AVANTAJLARI
              </span>
              <h4 className="text-xl sm:text-2xl font-black font-display">
                10 Kişi ve Üzeri Seyahatlerde %20'ye Varan Özel Grup İndirimi
              </h4>
              <p className="text-xs text-indigo-100 max-w-xl leading-relaxed">
                Yan yana koltuk blokajı, esnek yolcu isim değişikliği, tek faturada kurumsal e-Fatura kesimi ve 7/24 özel operasyon sorumlusu refakati.
              </p>
            </div>
          </div>

          {/* 3 Core Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-bordeaux-700">
                <BileoBus className="w-4 h-4" />
                <span className="text-xs font-black">Özel Otobüs & Minibüs</span>
              </div>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                16+1 Sprinter, 31+1 Novo veya 46+1 Travego şoförlü araç tahsisi ve esnek kalkış saati.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-blue-700">
                <BileoTrain className="w-4 h-4" />
                <span className="text-xs font-black">YHT Vagon Blokajı</span>
              </div>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                TCDD YHT setlerinde kompartıman veya tam vagon blokajı ile tüm grubun bir arada seyahati.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-purple-700">
                <BileoPlane className="w-4 h-4" />
                <span className="text-xs font-black">Kurumsal Uçak Bileti</span>
              </div>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                THY & AJet uçuşlarında grup PNR kaydı, ekstra bagaj hakkı ve kalkışa 48 saat kalana dek ücretsiz isim revizyonu.
              </p>
            </div>

          </div>

          {/* Interactive Quote Request Form */}
          <div className="p-5 rounded-3xl bg-cream-100/70 border border-[#E8E1D5] space-y-4">
            <span className="text-[11px] font-black text-bordeaux-700 uppercase tracking-wider block">
              📋 Hızlı Grup Teklifi Al
            </span>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-charcoal uppercase tracking-wider block mb-1">
                      Seyahat Türü
                    </label>
                    <select
                      value={travelType}
                      onChange={(e) => setTravelType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white text-charcoal text-xs font-bold border border-[#E8E1D5] focus:outline-none"
                    >
                      <option value="otobus">Şehirlerarası Otobüs</option>
                      <option value="tren">TCDD YHT Hızlı Tren</option>
                      <option value="ucak">Uçak Seferi</option>
                      <option value="ozel-arac">Özel Şoförlü Minibüs/Otobüs</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-charcoal uppercase tracking-wider block mb-1">
                      Kişi Sayısı ({groupSize} Kişi)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      step="5"
                      value={groupSize}
                      onChange={(e) => setGroupSize(Number(e.target.value))}
                      className="w-full h-2 bg-cream-200 rounded-lg appearance-none cursor-pointer accent-bordeaux-700 mt-2"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-charcoal uppercase tracking-wider block mb-1">
                      Güzergah (Kalkış - Varış)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={fromCity}
                        onChange={(e) => setFromCity(e.target.value)}
                        placeholder="Kalkış"
                        className="px-2.5 py-1.5 rounded-lg bg-white text-charcoal text-xs font-bold border border-[#E8E1D5]"
                      />
                      <input
                        type="text"
                        value={toCity}
                        onChange={(e) => setToCity(e.target.value)}
                        placeholder="Varış"
                        className="px-2.5 py-1.5 rounded-lg bg-white text-charcoal text-xs font-bold border border-[#E8E1D5]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-charcoal uppercase tracking-wider block mb-1">
                      Yetkili Adı Soyadı
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Örn: Ahmet Yılmaz"
                      className="w-full px-3 py-2 rounded-xl bg-white text-charcoal text-xs font-bold border border-[#E8E1D5]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-charcoal uppercase tracking-wider block mb-1">
                      İletişim Telefonu
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="w-full px-3 py-2 rounded-xl bg-white text-charcoal text-xs font-bold border border-[#E8E1D5]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-bordeaux-700 text-white font-black text-xs uppercase tracking-wider hover:bg-bordeaux-800 transition-colors cursor-pointer shadow-soft"
                >
                  {groupSize} Kişilik Özel Grup Fiyat Teklifi Al
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-center animate-fadeIn">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-sm">
                  <BileoCheck className="w-4 h-4" />
                </div>
                <h5 className="text-sm font-black text-emerald-950">Grup Teklif Talebiniz Başarıyla İletildi!</h5>
                <p className="text-xs text-emerald-800">
                  {groupSize} kişilik {fromCity} - {toCity} seyahatiniz için kurumsal danışmanımız en avantajlı bilet ve araç opsiyonlarıyla 15 dakika içinde telefon numaranızdan dönüş yapacaktır.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="text-xs font-black text-emerald-900 underline pt-1 cursor-pointer"
                >
                  Yeni Teklif İste
                </button>
              </div>
            )}
          </div>

          {/* Guarantee Checklist */}
          <div className="space-y-2">
            <span className="text-[11px] font-black text-charcoal uppercase tracking-wider block">
              Kurumsal Güvencelerimiz
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                'Resmi TÜRSAB A Grubu Seyahat Acentası Faturası',
                'Koltuk Başı Tam Kapsamlı Ferdi Kaza Koltuk Sigortası',
                'Kredi Kartı ile 6 Taksit veya Kurumsal Havale İmkanı',
                'Tek Sözleşme ile Tüm Yolcuların Hukuki Korunması',
              ].map((item, idx) => (
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

        </div>

      </div>
    </div>
  );
};
