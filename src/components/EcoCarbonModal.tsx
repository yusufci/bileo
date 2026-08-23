import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoBus,
  BileoPlane,
  BileoTrain,
  BileoFerry,
} from './icons';
import { sound } from '../utils/sound';

interface EcoCarbonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EcoCarbonModal: React.FC<EcoCarbonModalProps> = ({ isOpen, onClose }) => {
  const [distanceKm, setDistanceKm] = useState<number>(450); // Istanbul - Ankara approx
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [selectedMode, setSelectedMode] = useState<'tren' | 'otobus' | 'feribot' | 'ucak'>('tren');
  const [showCertificate, setShowCertificate] = useState<boolean>(false);

  if (!isOpen) return null;

  // Real world emissions grams CO2 per passenger-km (EEA / ICAO average data)
  const EMISSION_FACTORS = {
    tren: 28,     // 28g CO2/km (YHT electric)
    otobus: 68,   // 68g CO2/km (Euro 6 2+1 coach)
    feribot: 110, // 110g CO2/km (Catamaran)
    ucak: 245,    // 245g CO2/km (Domestic short-haul flight)
  };

  const trainEmission = Math.round((distanceKm * EMISSION_FACTORS.tren * passengerCount) / 1000);
  const busEmission = Math.round((distanceKm * EMISSION_FACTORS.otobus * passengerCount) / 1000);
  const flightEmission = Math.round((distanceKm * EMISSION_FACTORS.ucak * passengerCount) / 1000);
  const selectedEmission = Math.round((distanceKm * EMISSION_FACTORS[selectedMode] * passengerCount) / 1000);

  const savedCo2VsFlight = Math.max(0, flightEmission - selectedEmission);
  const treesEquivalent = (savedCo2VsFlight / 22).toFixed(1); // 1 tree absorbs ~22kg CO2/year

  const handleGenerateCertificate = () => {
    sound.playSuccessChime();
    setShowCertificate(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <BileoShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Karbon Ayak İzi & Eko-Seyahat Hesaplayıcı</h3>
              <p className="text-xs text-charcoal-muted font-medium">Ulaşım moduna göre çevre tasarrufunuzu ve ağaç eşdeğerini hesaplayın</p>
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
          
          {/* Controls: Distance and Passengers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#E8E1D5]">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-charcoal">Seyahat Mesafesi</label>
                <span className="text-xs font-black text-bordeaux-700 font-display">{distanceKm} KM</span>
              </div>
              <input
                type="range"
                min={100}
                max={1500}
                step={25}
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                className="w-full accent-bordeaux-700 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-charcoal-muted mt-1">
                <span>100 km (Kısa)</span>
                <span>450 km (İst-Ank)</span>
                <span>1500 km (Uzun)</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8E1D5]">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-charcoal">Yolcu Sayısı</label>
                <span className="text-xs font-black text-bordeaux-700 font-display">{passengerCount} Yolcu</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setPassengerCount(num)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      passengerCount === num
                        ? 'bg-bordeaux-700 text-white'
                        : 'bg-[#FAF7F2] text-charcoal hover:bg-[#E8E1D5]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="text-xs font-bold text-charcoal mb-2.5 block">Tercih Edilen Ulaşım Modu</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'tren', label: 'YHT Tren', icon: <BileoTrain className="w-4 h-4 text-emerald-700" />, co2: `${trainEmission} kg` },
                { id: 'otobus', label: '2+1 Otobüs', icon: <BileoBus className="w-4 h-4 text-amber-700" />, co2: `${busEmission} kg` },
                { id: 'feribot', label: 'Deniz Otobüsü', icon: <BileoFerry className="w-4 h-4 text-cyan-700" />, co2: `${Math.round((distanceKm * EMISSION_FACTORS.feribot * passengerCount) / 1000)} kg` },
                { id: 'ucak', label: 'Uçak (Direkt)', icon: <BileoPlane className="w-4 h-4 text-blue-700" />, co2: `${flightEmission} kg` },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedMode(item.id as any)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedMode === item.id
                      ? 'bg-white border-bordeaux-700 ring-2 ring-bordeaux-700/20 shadow-soft'
                      : 'bg-white/60 border-[#E8E1D5] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    {item.icon}
                    <span className="text-[11px] font-black font-display text-charcoal">{item.co2}</span>
                  </div>
                  <span className="text-xs font-bold text-[#1E1B18]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Environmental Impact Savings Card */}
          <div className="bg-emerald-900 text-white p-5 rounded-3xl space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800 pb-3">
              <div>
                <span className="text-[11px] font-extrabold text-emerald-300 uppercase tracking-wider">Uçuşa Kıyasla Çevre Kazancı</span>
                <h4 className="text-xl font-black font-display mt-0.5">{savedCo2VsFlight} kg CO2 Tasarrufu</h4>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-200">Ağaç Eşdeğeri</span>
                <p className="text-lg font-black text-amber-300 font-display">🌳 ~{treesEquivalent} Yıllık Ağaç</p>
              </div>
            </div>

            <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
              {selectedMode === 'tren' && 'TCDD YHT elektrikli yüksek hızlı tren altyapısı sayesinde bu rotada karbon salınımınızı %88 oranında düşürdünüz.'}
              {selectedMode === 'otobus' && 'Euro 6 motorlu modern 2+1 otobüs filosu sayesinde uçuşa kıyasla %72 daha az karbon salınımı sağladınız.'}
              {selectedMode === 'feribot' && 'Deniz otobüsü transferi ile kara trafiğini atlayarak dengeli ve çevreci bir yolculuk seçtiniz.'}
              {selectedMode === 'ucak' && 'Hızlı ulaşım sağlarken daha yüksek karbon çıktısı oluşur. Gelecek seferinizde YHT veya otobüsü tercih ederek karbon izinizi düşürebilirsiniz.'}
            </p>

            {selectedMode !== 'ucak' && !showCertificate && (
              <button
                type="button"
                onClick={handleGenerateCertificate}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs transition-all cursor-pointer shadow-sm"
              >
                🌿 Dijital Yeşil Seyahat Rozetini Görüntüle
              </button>
            )}
          </div>

          {/* Certificate Preview */}
          {showCertificate && (
            <div className="p-5 rounded-3xl bg-white border-2 border-emerald-600 space-y-3 animate-fadeIn text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Bileo Sürdürülebilir Ulaşım Rozeti</span>
              <h4 className="text-base font-black text-[#1E1B18]">Çevre Dostu Yolcu Belgesi</h4>
              <p className="text-xs text-charcoal-muted">
                Sayın yolcumuz, <strong>{distanceKm} KM</strong> mesafeli seyahatinizde <strong>{selectedMode.toUpperCase()}</strong> tercih ederek <strong>{savedCo2VsFlight} kg CO2</strong> salınımının önüne geçtiniz.
              </p>
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black">
                Sertifika Kodu: ECO-2026-{Math.floor(100000 + Math.random() * 900000)}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
