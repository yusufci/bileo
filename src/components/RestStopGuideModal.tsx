import React, { useState } from 'react';
import {
  BileoClose,
  BileoSparkles,
  BileoMapPin,
} from './icons';
import { sound } from '../utils/sound';

interface RestStopGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RestFacility {
  id: string;
  name: string;
  highway: string;
  location: string;
  famousFlavor: string;
  amenities: string[];
  rating: string;
  tip: string;
}

const REST_FACILITIES: RestFacility[] = [
  {
    id: 'bolu-dagi',
    name: 'Bolu Dağı Dinlenme Tesisleri & İsmail’in Yeri',
    highway: 'O-4 Anadolu Otoyolu (İstanbul - Ankara)',
    location: 'Bolu Dağı Geçişi, Düzce / Bolu',
    famousFlavor: 'Meşhur Bolu Köftesi, Manda Yoğurdu & Bal-Kaymak',
    amenities: ['24 Saat Sıcak Yemek', 'Temiz Mescit & WC', 'EV Elektrikli Şarj', 'Yöresel Bolu Pazarı'],
    rating: '4.8 / 5 (Tarihi Mola Noktası)',
    tip: 'Otobüs mola süresinde (30 dk) hızlı servis edilen sıcak köfte porsiyonu veya fırın sütlaç tercih edebilirsiniz.',
  },
  {
    id: 'susurluk',
    name: 'Susurluk Yasa & Şeker Dinlenme Tesisleri',
    highway: 'O-5 / D565 (İstanbul - Bursa - İzmir)',
    location: 'Susurluk, Balıkesir',
    famousFlavor: 'Bol Köpüklü Susurluk Ayranı & Mihaliç Peynirli Tost',
    amenities: ['Hızlı Tost & Ayran Büfesi', 'Yöresel Peynir Satışı', 'Geniş Otopark', 'Çocuk Oyun Alanı'],
    rating: '4.9 / 5 (Efsanevi Lezzet Durağı)',
    tip: 'Özel taş fırın ekmeğinde çıtır Mihaliç tostunun yanına yayık ayranı istemeyi unutmayın.',
  },
  {
    id: 'afyon-cumhuriyet',
    name: 'Afyon Cumhuriyet & İkbal Dinlenme Tesisleri',
    highway: 'D300 (İstanbul / Ankara - Antalya / İzmir)',
    location: 'Afyonkarahisar Çevre Yolu',
    famousFlavor: 'Tarihi Afyon Sucuk Ekmek & Hakiki Manda Kaymaklı Ekmek Kadayıfı',
    amenities: ['Sucuk & Şarküteri Satışı', 'Lokum Tadım Standı', '24 Saat Restoran', 'Geniş Dinlenme Alanı'],
    rating: '4.8 / 5 (Kavşak Noktası Klasiği)',
    tip: 'Yolculuk hediyesi olarak taze lokum ve vakumlu sucuk paketleri temin edebilirsiniz.',
  },
  {
    id: 'selcuk-cop-sis',
    name: 'Selçuk & Torbalı Dinlenme Noktaları',
    highway: 'İzmir - Aydın Otoyolu',
    location: 'Selçuk / Torbalı, İzmir',
    famousFlavor: 'Közde Domates & Biberli Ege Çöp Şiş',
    amenities: ['Közde Çöp Şiş Servisi', 'Ege Zeytin & Zeytinyağı', 'Açık Bahçe Alanı'],
    rating: '4.7 / 5 (Ege Klasiği)',
    tip: 'Lavaş eşliğinde sunulan hızlı porsiyon çöp şiş molaların en sevilen tercihidir.',
  },
  {
    id: 'pozanti',
    name: 'Pozantı Akdeniz Geçişi Dinlenme Tesisleri',
    highway: 'O-21 / Toros Geçişi (Ankara / İç Anadolu - Adana / Mersin)',
    location: 'Toros Dağları Eteği, Pozantı, Adana',
    famousFlavor: 'Toroslar Meşhur Kuzu Tandır & Yayık Ayranı',
    amenities: ['Dağ Manzaralı Teras', 'Yöresel Narenciye Pazarı', '24 Saat Açık'],
    rating: '4.7 / 5 (Toros Molası)',
    tip: 'Torosların serin dağ havasında çay molası vermek için en ideal tesistir.',
  },
];

export const RestStopGuideModal: React.FC<RestStopGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('susurluk');

  if (!isOpen) return null;

  const current = REST_FACILITIES.find((f) => f.id === selectedFacilityId) || REST_FACILITIES[0];

  const handleSelectFacility = (id: string) => {
    sound.playTick();
    setSelectedFacilityId(id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
              <BileoMapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Karayolu Mola & Dinlenme Tesisleri Rehberi</h3>
              <p className="text-xs text-charcoal-muted font-medium">Meşhur lezzet durakları, yol üstü lezzetleri ve tesis olanakları</p>
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
          
          {/* Left List Pane */}
          <div className="md:col-span-5 border-r border-[#E8E1D5] overflow-y-auto p-4 space-y-2.5 bg-[#FAF7F2]/60">
            {REST_FACILITIES.map((facility) => {
              const isSelected = selectedFacilityId === facility.id;

              return (
                <button
                  key={facility.id}
                  type="button"
                  onClick={() => handleSelectFacility(facility.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-bordeaux-700 ring-2 ring-bordeaux-700/20 shadow-soft'
                      : 'bg-white/70 border-[#E8E1D5] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                      {facility.highway.split('(')[0].trim()}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700">★ {facility.rating.split('/')[0]}</span>
                  </div>
                  <h4 className="text-xs font-black text-[#1E1B18] line-clamp-1">{facility.name}</h4>
                  <p className="text-[11px] text-bordeaux-700 font-bold line-clamp-1 mt-1">🍴 {facility.famousFlavor}</p>
                </button>
              );
            })}
          </div>

          {/* Right Detail Pane */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-5 bg-white">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-bordeaux-700 font-extrabold uppercase tracking-wider mb-1">
                <BileoMapPin className="w-3.5 h-3.5" />
                <span>{current.location}</span>
              </div>
              <h3 className="text-xl font-black text-[#1E1B18] font-display">{current.name}</h3>
              <p className="text-xs text-charcoal-muted font-semibold mt-0.5">{current.highway}</p>
            </div>

            {/* Famous Flavor Card */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase tracking-wider">
                <BileoSparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Meşhur Mola Lezzeti</span>
              </div>
              <p className="text-sm font-black text-amber-950 font-display">
                {current.famousFlavor}
              </p>
            </div>

            {/* Amenities Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-black text-charcoal uppercase tracking-wider block">
                Tesis Olanakları & Hizmetler
              </span>
              <div className="grid grid-cols-2 gap-2">
                {current.amenities.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] text-xs font-bold text-charcoal flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0" />
                    <span className="line-clamp-1">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Traveler Tip */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1">
              <span className="text-[10px] font-extrabold text-charcoal uppercase tracking-wider block">
                Otobüs Yolcusu İpucu (Mola Süresi)
              </span>
              <p className="text-xs text-charcoal-muted font-medium leading-relaxed">
                ⏱️ {current.tip}
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
