import React, { useState } from 'react';
import {
  BileoClose,
  BileoBus,
  BileoPlane,
  BileoTrain,
  BileoFerry,
  BileoShieldCheck,
  BileoCheck,
  BileoSparkles,
} from './icons';

interface VehicleModel {
  id: string;
  name: string;
  category: 'otobus' | 'ucak' | 'tren' | 'feribot';
  operator: string;
  capacity: string;
  seatPitch: string;
  speed: string;
  comfortFeatures: string[];
  description: string;
  badge: string;
}

const FLEET_MODELS: VehicleModel[] = [
  {
    id: 'travego',
    name: 'Mercedes-Benz Travego 16 SHD (2+1 Jumbo)',
    category: 'otobus',
    operator: 'Pamukkale Turizm, Kamil Koç, Metro',
    capacity: '37 Yolcu Kapasitesi',
    seatPitch: '84 cm Geniş Diz Mesafesi',
    speed: '100 km/s Seyir Hızı',
    comfortFeatures: ['2+1 Ergonomik Ortopedik Koltuk', '220V Şarj Prizi + Type-C / USB', 'Kişisel Android Dokunmatik Multimedya Ekranı', 'Bağımsız Klima Menfezleri', 'Sıcak & Soğuk İkram Servisi'],
    description: 'Yolculuk sırasında maksimum bacak rahatlığı ve tekli koltuk mahremiyeti sunan amiral gemisi şehirlerarası otobüs.',
    badge: 'En Çok Tercih Edilen',
  },
  {
    id: 'a350',
    name: 'Airbus A350-900 XWB',
    category: 'ucak',
    operator: 'Turkish Airlines',
    capacity: '329 Yolcu Kapasitesi',
    seatPitch: '79 - 86 cm Geniş Diz Mesafesi',
    speed: '903 km/s Seyir Hızı',
    comfortFeatures: ['Süper Sessiz Karbon Kompozit Kabin', '4K UHD Dokunmatik Ekranlar', 'Gelişmiş HEPA Hava Filtrasyon Sistemi', 'Full-Flat Yatak Olabilen Business Koltuklar', 'Canlı TV & Yüksek Hızlı Uydu Wi-Fi'],
    description: 'Geniş gövdeli, ultra sessiz ve yüksek tavanlı kabin mimarisiyle havacılıkta konfor standartlarını yeniden belirleyen modern uçak.',
    badge: 'Premium Konfor',
  },
  {
    id: 'velaro',
    name: 'Siemens Velaro TR (YHT 300)',
    category: 'tren',
    operator: 'TCDD Taşımacılık YHT',
    capacity: '519 Yolcu Kapasitesi',
    seatPitch: '90 - 100 cm Geniş Diz Mesafesi',
    speed: '300 km/s Maksimum Operasyonel Hız',
    comfortFeatures: ['300 km/s Sarsıntısız Manyetik Süspansiyon', 'Yemekli Restoran Vagonu & Bistro', 'Business Bölmelerinde Bireysel Çalışma Masaları', 'Tekerlekli Sandalye ve Özel Erişim Alanları', 'Sessiz Vagon Seçeneği'],
    description: 'İstanbul-Ankara-Konya hatlarında hızlı, sarsıntısız ve güvenli seyahatin simgesi Siemens Velaro hızlı tren filosu.',
    badge: 'En Hızlı Ulaşım',
  },
  {
    id: 'catamaran',
    name: 'Austal High-Speed Katamaran Feribot',
    category: 'feribot',
    operator: 'İDO & BUDO',
    capacity: '450 Yolcu + 120 Araç',
    seatPitch: '82 cm Panoramik Deniz Manzaralı',
    speed: '65 km/s (35 Knot) Deniz Hızı',
    comfortFeatures: ['Çift Gövdeli Dalga Sönümleyici Katamaran Dizaynı', 'Geniş Araç Güvertesi', 'Açık Seyir Terası & Kafe-Bistro', 'Geniş Bagaj Alanları', 'Klima & TV Ekranları'],
    description: 'Marmara Denizi üzerinde dalgalara karşı dengeli seyir sunan, hızlı araç ve yolcu transferi sağlayan modern katamaranlar.',
    badge: 'Manzaralı Seyir',
  },
];

interface FleetExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FleetExperienceModal: React.FC<FleetExperienceModalProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'otobus' | 'ucak' | 'tren' | 'feribot'>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleModel>(FLEET_MODELS[0]);

  if (!isOpen) return null;

  const filteredVehicles = FLEET_MODELS.filter((v) => {
    if (selectedCategory !== 'all' && v.category !== selectedCategory) return false;
    return true;
  });

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'otobus':
        return <BileoBus className="w-4 h-4" />;
      case 'ucak':
        return <BileoPlane className="w-4 h-4" />;
      case 'tren':
        return <BileoTrain className="w-4 h-4" />;
      case 'feribot':
        return <BileoFerry className="w-4 h-4" />;
      default:
        return <BileoBus className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <BileoSparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Filo & Araç Konfor Standartları</h3>
              <p className="text-xs text-charcoal-muted font-medium">Otobüs, uçak, tren ve deniz araçlarının donanım özellikleri</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3.5 bg-white/60 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto flex-shrink-0">
          {[
            { id: 'all', label: 'Tüm Araç Tipleri' },
            { id: 'otobus', label: '2+1 Otobüsler' },
            { id: 'ucak', label: 'Uçak Filosu' },
            { id: 'tren', label: 'Hızlı Trenler (YHT)' },
            { id: 'feribot', label: 'Katamaranlar' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-bordeaux-700 text-white shadow-2xs'
                  : 'bg-white hover:bg-cream-100 text-charcoal-muted border border-[#E8E1D5]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Grid */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
          
          {/* Left Vehicle Selector */}
          <div className="md:col-span-5 p-4 border-r border-[#E8E1D5] overflow-y-auto space-y-2.5 max-h-60 md:max-h-none">
            {filteredVehicles.map((vehicle) => {
              const isSelected = selectedVehicle.id === vehicle.id;
              return (
                <button
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-white border-bordeaux-700 shadow-md ring-1 ring-bordeaux-700/20'
                      : 'bg-white/70 hover:bg-white border-[#E8E1D5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 uppercase">
                      {vehicle.badge}
                    </span>
                    <span className="text-charcoal-muted">{getTransportIcon(vehicle.category)}</span>
                  </div>
                  <h4 className="text-xs font-black text-[#1E1B18] line-clamp-1">{vehicle.name}</h4>
                  <p className="text-[11px] text-charcoal-muted mt-0.5 line-clamp-1">{vehicle.operator}</p>
                </button>
              );
            })}
          </div>

          {/* Right Vehicle Spec View */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-5 bg-white">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-amber-700 uppercase tracking-wider mb-1">
                <span>{selectedVehicle.operator}</span>
              </div>
              <h3 className="text-xl font-black text-[#1E1B18] font-display">{selectedVehicle.name}</h3>
              <p className="text-xs text-charcoal-muted mt-1 leading-relaxed">{selectedVehicle.description}</p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] text-center">
                <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Kapasite</span>
                <span className="text-xs font-black text-charcoal mt-0.5 block">{selectedVehicle.capacity}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] text-center">
                <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Diz Mesafesi</span>
                <span className="text-xs font-black text-bordeaux-700 mt-0.5 block">{selectedVehicle.seatPitch}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] text-center">
                <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Hız / Performans</span>
                <span className="text-xs font-black text-charcoal mt-0.5 block">{selectedVehicle.speed}</span>
              </div>
            </div>

            {/* Comfort Features */}
            <div>
              <span className="text-[11px] font-extrabold text-charcoal uppercase tracking-wider block mb-2.5">
                Standart Donanım ve Konfor Özellikleri
              </span>
              <div className="space-y-2">
                {selectedVehicle.comfortFeatures.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FAF7F2] text-xs font-bold text-charcoal border border-[#E8E1D5]"
                  >
                    <BileoCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Invariant Badge */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-3">
              <BileoShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              <p className="text-xs text-emerald-950 font-bold">
                Tüm sefer araçları T.C. Ulaştırma Bakanlığı ve ilgili havacılık/denizcilik regülasyonlarına göre periyodik muayene onaylıdır.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
