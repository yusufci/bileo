import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoClock,
  BileoBus,
} from './icons';
import { sound } from '../utils/sound';

interface ElectricVehicleChargingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo', duration?: number) => void;
}

interface HighwayChargingCorridor {
  id: string;
  highwayCode: string;
  corridorName: string;
  distanceKm: number;
  stationsCount: number;
  fastChargerKw: string;
  keyFacilities: {
    name: string;
    kmMarker: string;
    operators: string[];
    socketTypes: string;
    amenities: string[];
    coffeeTime: string;
  }[];
}

const CHARGING_CORRIDORS: HighwayChargingCorridor[] = [
  {
    id: 'o5-ist-izm',
    highwayCode: 'O-5 Otoyolu',
    corridorName: 'İstanbul ↔ İzmir Otoyolu (Osmangazi Köprüsü Üzeri)',
    distanceKm: 426,
    stationsCount: 8,
    fastChargerKw: '180 kW - 300 kW DC Ultra Hızlı',
    keyFacilities: [
      {
        name: 'Oksijen O-5 Osmangazi (Kuzey & Güney)',
        kmMarker: 'KM 14',
        operators: ['Trugo (300kW)', 'ZES (180kW)', 'Tesla Supercharger'],
        socketTypes: 'CCS2 (8 Soket) + Type-2',
        amenities: ['Starbucks', 'Kahve Dünyası', 'Mescit & Bebek Bakım', 'Market'],
        coffeeTime: '18 - 25 Dk (%20 ➔ %80)',
      },
      {
        name: 'Bursa Oksijen O-68 Tesisi',
        kmMarker: 'KM 68',
        operators: ['Trugo (180kW)', 'Eşarj (120kW)'],
        socketTypes: 'CCS2 (6 Soket)',
        amenities: ['Köfteci Yusuf', 'Geniş Otopark', 'Çocuk Oyun Alanı'],
        coffeeTime: '20 - 28 Dk (%20 ➔ %80)',
      },
      {
        name: 'Balıkesir Oksijen O-155 Tesisi',
        kmMarker: 'KM 155',
        operators: ['Trugo (300kW)', 'ZES (180kW)', 'Astor Şarj'],
        socketTypes: 'CCS2 (8 Soket)',
        amenities: ['Yasa Dinlenme', 'Restoran & Kafe', 'Ücretsiz Wi-Fi'],
        coffeeTime: '15 - 22 Dk (%20 ➔ %80)',
      },
      {
        name: 'Manisa Oksijen O-270 Tesisi',
        kmMarker: 'KM 270',
        operators: ['Trugo (300kW)', 'ZES (180kW)'],
        socketTypes: 'CCS2 (6 Soket)',
        amenities: ['Starbucks On-the-go', 'Yöresel Manisa Ürünleri'],
        coffeeTime: '18 - 24 Dk (%20 ➔ %80)',
      },
    ],
  },
  {
    id: 'o4-ist-ank',
    highwayCode: 'O-4 Otoyolu',
    corridorName: 'İstanbul ↔ Ankara Anadolu Otoyolu (Bolu Dağı Geçişi)',
    distanceKm: 450,
    stationsCount: 7,
    fastChargerKw: '120 kW - 300 kW DC Hızlı',
    keyFacilities: [
      {
        name: 'Sapanca Oksijen Dinlenme Tesisi',
        kmMarker: 'KM 105',
        operators: ['Trugo (300kW)', 'Eşarj (120kW)', 'ZES (180kW)'],
        socketTypes: 'CCS2 (8 Soket)',
        amenities: ['Göl Manzarası Kafe', 'Fast Food', 'Market'],
        coffeeTime: '20 - 25 Dk',
      },
      {
        name: 'Bolu Dağı Highway Outlet Tesisleri',
        kmMarker: 'KM 228',
        operators: ['Trugo (300kW)', 'ZES (180kW)', 'Tesla Supercharger'],
        socketTypes: 'CCS2 (12 Soket) + Type-2',
        amenities: ['Büyük AVM & Food Court', 'Bolu Dağı Et Lokantaları', 'Eczane'],
        coffeeTime: '15 - 22 Dk',
      },
      {
        name: 'Düzce Türsan Dinlenme Tesisi',
        kmMarker: 'KM 185',
        operators: ['Astor Şarj (180kW)', 'Voltrun (60kW)'],
        socketTypes: 'CCS2 (4 Soket)',
        amenities: ['Yöresel Fındık & Çikolata', 'Sıcak Yemek'],
        coffeeTime: '25 - 32 Dk',
      },
    ],
  },
  {
    id: 'o21-ank-nig',
    highwayCode: 'O-21 Otoyolu',
    corridorName: 'Ankara ↔ Niğde ↔ Pozantı Otoyolu (Gülek Boğazı)',
    distanceKm: 330,
    stationsCount: 5,
    fastChargerKw: '180 kW - 300 kW DC',
    keyFacilities: [
      {
        name: 'Kulu Dinlenme & Şarj İstasyonu',
        kmMarker: 'KM 82',
        operators: ['Trugo (300kW)', 'ZES (180kW)'],
        socketTypes: 'CCS2 (6 Soket)',
        amenities: ['Kafeterya', 'Market', 'Mescit'],
        coffeeTime: '20 Dk',
      },
      {
        name: 'Şereflikoçhisar Tuz Gölü Manzara Tesisi',
        kmMarker: 'KM 145',
        operators: ['Trugo (300kW)', 'Astor Şarj (180kW)'],
        socketTypes: 'CCS2 (8 Soket)',
        amenities: ['Tuz Gölü Yürüyüş Alanı', 'Fotoğraf Seyir Terası'],
        coffeeTime: '20 - 25 Dk',
      },
    ],
  },
];

export const ElectricVehicleChargingGuideModal: React.FC<ElectricVehicleChargingGuideModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('o5-ist-izm');
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState<number>(75);
  const [currentChargePct, setCurrentChargePct] = useState<number>(20);
  const [targetChargePct, setTargetChargePct] = useState<number>(80);

  if (!isOpen) return null;

  const currentCorridor = CHARGING_CORRIDORS.find((c) => c.id === selectedCorridorId) || CHARGING_CORRIDORS[0];

  // Energy needed in kWh
  const energyNeededKwh = Math.max(0, ((targetChargePct - currentChargePct) / 100) * batteryCapacityKwh);
  // Assuming average 150 kW DC charging speed
  const estimatedChargingMinutes = Math.round((energyNeededKwh / 150) * 60);

  const handleCopyCorridor = () => {
    sound.playSuccess();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Bileo Otoyol Elektrikli Şarj Rehberi — ${currentCorridor.highwayCode}\nGüzergah: ${currentCorridor.corridorName}\nMesafe: ${currentCorridor.distanceKm} km\nİstasyon Sayısı: ${currentCorridor.stationsCount}\nŞarj Hızı: ${currentCorridor.fastChargerKw}`
      );
    }
    if (onShowToast) {
      onShowToast(
        'Şarj Rehberi Kopyalandı',
        `${currentCorridor.highwayCode} koridor istasyonları panoya kopyalandı.`,
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
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-900 flex items-center justify-center border border-teal-200">
              <BileoBus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Otoyol Elektrikli Şarj & Dinlenme İstasyonları</h3>
              <p className="text-xs text-charcoal-muted font-medium">O-5, O-4, O-21 hızlı DC şarj koridorları, Trugo/ZES/Eşarj lokasyonları ve dinlenme süreleri</p>
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
          
          {/* Corridor Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {CHARGING_CORRIDORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { sound.playTick(); setSelectedCorridorId(c.id); }}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border shadow-2xs ${
                  selectedCorridorId === c.id
                    ? 'bg-teal-900 text-white border-teal-900 shadow-soft'
                    : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
                }`}
              >
                <span>{c.highwayCode}</span> • <span className="opacity-90">{c.distanceKm} km</span>
              </button>
            ))}
          </div>

          {/* Corridor Summary Card */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E1D5] pb-3">
              <div>
                <span className="text-[10px] font-black text-teal-800 uppercase tracking-wider block">Otoyol Koridoru</span>
                <h4 className="text-base font-black text-charcoal font-display">{currentCorridor.corridorName}</h4>
              </div>
              <button
                type="button"
                onClick={handleCopyCorridor}
                className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-cream-200 text-charcoal text-xs font-bold transition-colors cursor-pointer border border-[#E8E1D5] self-start sm:self-auto"
              >
                Bilgileri Kopyala
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5]">
                <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Toplam Koridor Mesafesi</span>
                <span className="text-base font-black text-charcoal font-mono">{currentCorridor.distanceKm} KM</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5]">
                <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Aktif DC Şarj İstasyonu</span>
                <span className="text-base font-black text-teal-900 font-mono">{currentCorridor.stationsCount} Tesis</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5]">
                <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Maksimum Şarj Gücü</span>
                <span className="text-sm font-black text-emerald-800">{currentCorridor.fastChargerKw}</span>
              </div>
            </div>
          </div>

          {/* Interactive Battery Simulation Widget */}
          <div className="p-5 rounded-3xl bg-teal-950 text-white shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-teal-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider block">Mola & Batarya Simülatörü</span>
                <h5 className="text-sm font-black text-white font-display">Tahmini Şarj Süresi & Dinlenme Eşleşmesi</h5>
              </div>
              <div className="text-right">
                <span className="text-xs text-teal-300 font-mono">Tahmini Mola Süresi:</span>
                <div className="text-lg font-black text-emerald-400 font-mono flex items-center gap-1 justify-end">
                  <BileoClock className="w-4 h-4 text-emerald-400" />
                  <span>~{estimatedChargingMinutes} Dakika</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-teal-200 font-bold block">Batarya Kapasitesi (kWh):</label>
                <input
                  type="number"
                  min={40}
                  max={120}
                  step={5}
                  value={batteryCapacityKwh}
                  onChange={(e) => setBatteryCapacityKwh(Number(e.target.value) || 75)}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-mono font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-teal-200 font-bold block">Mevcut Şarj: %{currentChargePct}</label>
                <input
                  type="range"
                  min={5}
                  max={60}
                  value={currentChargePct}
                  onChange={(e) => setCurrentChargePct(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-teal-200 font-bold block">Hedef Şarj: %{targetChargePct}</label>
                <input
                  type="range"
                  min={70}
                  max={100}
                  value={targetChargePct}
                  onChange={(e) => setTargetChargePct(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Key Facilities on this Route */}
          <div className="space-y-3">
            <label className="text-xs font-black text-charcoal uppercase tracking-wider block">
              Öne Çıkan Şarj & Mola Tesisleri ({currentCorridor.keyFacilities.length} Ana Tesis)
            </label>

            <div className="grid grid-cols-1 gap-3">
              {currentCorridor.keyFacilities.map((fac, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-[#E8E1D5] shadow-2xs space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#E8E1D5] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-900 text-[10px] font-black font-mono">
                        {fac.kmMarker}
                      </span>
                      <h6 className="text-xs font-black text-charcoal">{fac.name}</h6>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">{fac.coffeeTime}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-charcoal-muted block">Operatörler & Soketler:</span>
                      <span className="font-bold text-charcoal">{fac.operators.join(' • ')}</span>
                      <p className="text-[11px] text-charcoal-muted font-medium">{fac.socketTypes}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-charcoal-muted block">Tesis Olanakları:</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {fac.amenities.map((am, aIdx) => (
                          <span key={aIdx} className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8E1D5] text-[10px] font-medium text-charcoal">
                            {am}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Security Notice */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-charcoal-muted font-medium">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Otoyol şarj istasyonlarında EPDK lisanslı şarj tarifeleri uygulanmaktadır.</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal font-black text-xs transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
