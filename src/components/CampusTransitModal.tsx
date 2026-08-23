import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
} from './icons';
import { sound } from '../utils/sound';

interface CampusTransitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, desc?: string, type?: 'success' | 'error' | 'info' | 'promo') => void;
}

interface UniversityTransit {
  id: string;
  city: string;
  university: string;
  campus: string;
  mainHub: string;
  metroLine: string;
  travelTime: string;
  transitTip: string;
  discountRate: string;
}

const CAMPUS_DATA: UniversityTransit[] = [
  {
    id: 'odtu-ankara',
    city: 'Ankara',
    university: 'Orta Doğu Teknik Üniversitesi (ODTÜ)',
    campus: 'Üniversiteler Mah. Ana Yerleşke',
    mainHub: 'AŞTİ Otogarı & Ankara YHT Garı',
    metroLine: 'M1-M2-M3 Kızılay - Çayyolu Metrosu (ODTÜ İstasyonu)',
    travelTime: 'AŞTİ’den Ankaray + Metro ile 20 dk',
    transitTip: 'AŞTİ’den Ankaray ile Kızılay’a geçip M2 Çayyolu metrosuna aktarma yapabilirsiniz; ODTÜ A1 kapısında inilir.',
    discountRate: '%25 Öğrenci İndirimi',
  },
  {
    id: 'hacettepe-ankara',
    city: 'Ankara',
    university: 'Hacettepe Üniversitesi',
    campus: 'Beytepe Yerleşkesi',
    mainHub: 'AŞTİ Otogarı & Eryaman YHT İstasyonu',
    metroLine: 'M2 Çayyolu Metrosu (Beytepe İstasyonu + Kampüs Ringi)',
    travelTime: 'AŞTİ’den 25 dk',
    transitTip: 'Beytepe metro durağında inip üniversitenin ücretsiz yeşil ring otobüslerine binerek yurtlara ulaşabilirsiniz.',
    discountRate: '%25 Öğrenci İndirimi',
  },
  {
    id: 'itu-istanbul',
    city: 'İstanbul',
    university: 'İstanbul Teknik Üniversitesi (İTÜ)',
    campus: 'Ayazağa Yerleşkesi (Maslak)',
    mainHub: 'Alibeyköy Cep Otogarı & Esenler Otogarı',
    metroLine: 'M2 Yenikapı - Hacıosman Metrosu (İTÜ Ayazağa İstasyonu)',
    travelTime: 'Alibeyköy’den T5 + M2 ile 35 dk',
    transitTip: 'İTÜ Ayazağa metro durağından çıktığınızda doğrudan rektörlük ve yurtlar ana giriş kapısındasınız.',
    discountRate: '%20 Gençlik İndirimi',
  },
  {
    id: 'anadolu-eskisehir',
    city: 'Eskişehir',
    university: 'Anadolu Üniversitesi',
    campus: 'Yunus Emre Yerleşkesi',
    mainHub: 'Eskişehir YHT Garı & Otogar',
    metroLine: 'Estram Tramvay Hattı (Anadolu Üniversitesi Durağı)',
    travelTime: 'YHT Garı’ndan Tramvayla 12 dk',
    transitTip: 'Gar çıkışındaki Estram durağından Otogar-SSK tramvayına binip 4 durak sonra kampüs kapısında inebilirsiniz.',
    discountRate: '%30 YHT Genç Tarifesi',
  },
  {
    id: 'ege-izmir',
    city: 'İzmir',
    university: 'Ege Üniversitesi',
    campus: 'Bornova Ana Yerleşke & KYK',
    mainHub: 'İZOTAŞ İzmir Şehirlerarası Otogarı',
    metroLine: 'İzmir Metrosu (Ege Üniversitesi & Evka-3 İstasyonu)',
    travelTime: 'Otogardan 15 dk',
    transitTip: 'Otogardan kalkan Bornova dolmuşları veya 204 numaralı ESHOT ile metroya binip 2 durakta kampüse varabilirsiniz.',
    discountRate: '%25 Ege Ekspres İndirimi',
  },
];

export const CampusTransitModal: React.FC<CampusTransitModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [selectedCity, setSelectedCity] = useState<string>('Tümü');
  const [selectedUniId, setSelectedUniId] = useState<string>('odtu-ankara');

  if (!isOpen) return null;

  const cities = ['Tümü', 'Ankara', 'İstanbul', 'Eskişehir', 'İzmir'];

  const filtered = selectedCity === 'Tümü'
    ? CAMPUS_DATA
    : CAMPUS_DATA.filter((c) => c.city === selectedCity);

  const current = CAMPUS_DATA.find((c) => c.id === selectedUniId) || CAMPUS_DATA[0];

  const handleSelectUni = (id: string) => {
    sound.playTick();
    setSelectedUniId(id);
  };

  const handleApplyDiscount = () => {
    sound.playSuccess();
    if (onShowToast) {
      onShowToast('Öğrenci Doğrulaması Başarılı!', '%25 Öğrenci & Genç Seyahat İndirimi hesabınıza tanımlandı.', 'success');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-900 flex items-center justify-center border border-indigo-200 text-lg font-black">
              🎓
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Kampüs Ulaşım & Genç Seyahat Ağı</h3>
              <p className="text-xs text-charcoal-muted font-medium">Otogar ve Gar’dan Üniversite Yerleşkelerine Kesintisiz Metro & Ring Rehberi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* City Filter Pills */}
        <div className="px-6 py-3 bg-white/60 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                sound.playTick();
                setSelectedCity(city);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedCity === city
                  ? 'bg-bordeaux-700 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Universities List Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((u) => (
              <div
                key={u.id}
                onClick={() => handleSelectUni(u.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs space-y-2 ${
                  selectedUniId === u.id
                    ? 'bg-white border-bordeaux-700 ring-2 ring-bordeaux-700/20'
                    : 'bg-white/80 border-[#E8E1D5] hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block">
                      📍 {u.city}
                    </span>
                    <h4 className="text-sm font-black text-charcoal leading-snug">{u.university}</h4>
                    <p className="text-xs text-charcoal-muted font-medium">{u.campus}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black whitespace-nowrap">
                    {u.discountRate}
                  </span>
                </div>

                <div className="pt-1 border-t border-[#E8E1D5]/60 flex items-center justify-between text-[11px] text-charcoal-muted font-bold">
                  <span>⏱️ {u.travelTime}</span>
                  <span className="text-bordeaux-700 font-extrabold">Aktarma Detayı →</span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Uni Detailed Route Map Info */}
          <div className="p-5 rounded-3xl bg-cream-100/80 border border-[#E8E1D5] space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <h5 className="text-sm font-black text-charcoal font-display">
                🚇 {current.university} Doğrudan Ulaşım Çizelgesi
              </h5>
              <span className="px-3 py-1 rounded-xl bg-white border border-[#E8E1D5] text-xs font-black text-indigo-900">
                {current.city}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] space-y-1">
                <span className="text-[10px] font-black text-charcoal uppercase tracking-wider block">
                  Terminal & Gar Bağlantısı:
                </span>
                <p className="font-bold text-charcoal">{current.mainHub}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] space-y-1">
                <span className="text-[10px] font-black text-charcoal uppercase tracking-wider block">
                  Toplu Taşıma & Metro Hattı:
                </span>
                <p className="font-bold text-charcoal">{current.metroLine}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/80">
              <span className="text-[10px] font-black text-indigo-950 uppercase tracking-wider block mb-0.5">
                💡 Öğrenciye Özel İpucu:
              </span>
              <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                {current.transitTip}
              </p>
            </div>
          </div>

          {/* Student Verification Action Box */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div>
              <h5 className="text-sm font-black text-charcoal">e-Devlet / Öğrenci Belgenizle %25 İndirimi Açın</h5>
              <p className="text-xs text-charcoal-muted font-medium mt-0.5">Otobüs, YHT ve uçak biletlerinde tüm yıl boyunca gençlik tarifesinden faydalanın.</p>
            </div>
            <button
              type="button"
              onClick={handleApplyDiscount}
              className="px-5 py-2.5 rounded-xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-soft flex items-center gap-1.5"
            >
              <BileoShieldCheck className="w-4 h-4" />
              <span>İndirimi Tanımla</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
