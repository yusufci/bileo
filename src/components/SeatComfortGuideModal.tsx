import React, { useState, useMemo } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoSparkles,
  BileoBus,
  BileoTrain,
  BileoPlane,
  BileoCheckCircle,
} from './icons';
import { sound } from '../utils/sound';

interface SeatComfortGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SeatComfortGuideModal: React.FC<SeatComfortGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Sun calculation simulator state
  const [direction, setDirection] = useState<'east' | 'west' | 'south' | 'north'>('east');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [selectedSeatCategory, setSelectedSeatCategory] = useState<'bus_single' | 'yht_business' | 'flight_exit' | 'middle_balance'>('bus_single');

  // Calculate shade side based on transit compass heading and time of day
  const shadowCalculation = useMemo(() => {
    // Heading East (İstanbul -> Ankara, Trabzon, Erzurum): Sun is in the front-right in morning, right in afternoon
    if (direction === 'east') {
      if (timeOfDay === 'morning') {
        return {
          shadeSide: 'Sol Taraf (Tekli Koltuklar / Pencereler)',
          sunSide: 'Sağ Taraf',
          recommendation: 'İstanbul\'dan Ankara veya Doğu yönüne sabah giderken SOL taraf (1, 4, 7, 10...) güneş almaz ve serindir.',
          idealSeats: '1, 4, 7, 10, 13, 16',
        };
      } else if (timeOfDay === 'afternoon') {
        return {
          shadeSide: 'Sol Taraf',
          sunSide: 'Sağ Taraf',
          recommendation: 'Öğleden sonra güneş güneyde ve batıya meylederken sol taraf gölgede kalır.',
          idealSeats: '1, 4, 7, 10, 13, 16',
        };
      } else {
        return {
          shadeSide: 'Her İki Taraf Rahat',
          sunSide: 'Güneş Batışı (Arka/Sağ)',
          recommendation: 'Akşam üzeri batım sonrası iki taraf da konforludur.',
          idealSeats: 'Tüm tekli koltuklar',
        };
      }
    }
    // Heading South (İstanbul/Ankara -> İzmir, Antalya, Bodrum):
    if (direction === 'south') {
      if (timeOfDay === 'morning') {
        return {
          shadeSide: 'Sağ Taraf',
          sunSide: 'Sol Taraf (Doğu güneşi sol cama vurur)',
          recommendation: 'Güneye (Antalya, Bodrum, İzmir) sabah inerken SAĞ tarafı seçin; güneş soldan doğar.',
          idealSeats: '2, 3, 5, 6, 8, 9',
        };
      } else if (timeOfDay === 'afternoon') {
        return {
          shadeSide: 'Sol Taraf (Tekli Koltuklar)',
          sunSide: 'Sağ Taraf (Batı güneşi sağ cama vurur)',
          recommendation: 'Güneye öğleden sonra veya akşamüstü inerken SOL taraf (Tekli sıra) gölgede kalır.',
          idealSeats: '1, 4, 7, 10, 13, 16',
        };
      } else {
        return {
          shadeSide: 'Her İki Taraf Serin',
          sunSide: 'Güneş batmış durumda',
          recommendation: 'Akşam seferlerinde panoramik manzara için ön sıraları tercih edebilirsiniz.',
          idealSeats: '1, 2, 3, 4',
        };
      }
    }
    // Heading West (Ankara -> İstanbul, İzmir -> Çanakkale):
    if (direction === 'west') {
      if (timeOfDay === 'morning') {
        return {
          shadeSide: 'Sağ Taraf',
          sunSide: 'Sol Taraf',
          recommendation: 'Batı yönüne sabah seyahat ederken SAĞ taraf gölgede kalır.',
          idealSeats: '2, 3, 5, 6, 8, 9',
        };
      } else {
        return {
          shadeSide: 'Sağ Taraf',
          sunSide: 'Ön ve Sol Taraf (Batı güneşi)',
          recommendation: 'Batı yönünde öğleden sonra seyahat ederken SAĞ taraf daha az doğrudan güneş alır.',
          idealSeats: '2, 3, 5, 6, 8, 9',
        };
      }
    }
    // Heading North (Ankara -> Samsun, Sinop, Trabzon):
    return {
      shadeSide: 'Ön ve Her İki Taraf',
      sunSide: 'Arka Taraf',
      recommendation: 'Kuzeye giderken güneş genelde arkanızda kalır, iki taraf da nispeten gölgedir.',
      idealSeats: 'Tekli sıralar (1, 4, 7, 10...)',
    };
  }, [direction, timeOfDay]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center border border-amber-200 text-lg font-black">
              💺
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Koltuk Seçim & Konfor Rehberi</h3>
              <p className="text-xs text-charcoal-muted font-medium">Güneş/gölge hesabı, diz mesafeleri ve en sessiz koltuk stratejileri</p>
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
          
          {/* Smart Sun/Shade Direction Simulator Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E1D5] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D5]">
              <div className="flex items-center gap-2">
                <span className="text-base">☀️</span>
                <h4 className="text-sm font-black text-charcoal">Akıllı Güneş & Gölge Tarafı Hesaplayıcı</h4>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                Göz Kamaşmasız Seyahat
              </span>
            </div>

            {/* Inputs: Direction and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-charcoal block">Seyahat Yönü</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { sound.playTick(); setDirection('east'); }}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      direction === 'east'
                        ? 'bg-bordeaux-900 text-white border-bordeaux-900 shadow-2xs'
                        : 'bg-[#FAF7F2] text-charcoal border-[#E8E1D5] hover:bg-white'
                    }`}
                  >
                    Doğuya (İst ➔ Ank/Trabzon)
                  </button>
                  <button
                    type="button"
                    onClick={() => { sound.playTick(); setDirection('south'); }}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      direction === 'south'
                        ? 'bg-bordeaux-900 text-white border-bordeaux-900 shadow-2xs'
                        : 'bg-[#FAF7F2] text-charcoal border-[#E8E1D5] hover:bg-white'
                    }`}
                  >
                    Güneye (İst/Ank ➔ İzm/Ant)
                  </button>
                  <button
                    type="button"
                    onClick={() => { sound.playTick(); setDirection('west'); }}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      direction === 'west'
                        ? 'bg-bordeaux-900 text-white border-bordeaux-900 shadow-2xs'
                        : 'bg-[#FAF7F2] text-charcoal border-[#E8E1D5] hover:bg-white'
                    }`}
                  >
                    Batıya (Ank ➔ İst/Edirne)
                  </button>
                  <button
                    type="button"
                    onClick={() => { sound.playTick(); setDirection('north'); }}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      direction === 'north'
                        ? 'bg-bordeaux-900 text-white border-bordeaux-900 shadow-2xs'
                        : 'bg-[#FAF7F2] text-charcoal border-[#E8E1D5] hover:bg-white'
                    }`}
                  >
                    Kuzeye (Ank/Kon ➔ Samsun/Sinop)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-charcoal block">Kalkış Vakti</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { sound.playTick(); setTimeOfDay('morning'); }}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      timeOfDay === 'morning'
                        ? 'bg-amber-900 text-white border-amber-900 shadow-2xs'
                        : 'bg-[#FAF7F2] text-charcoal border-[#E8E1D5] hover:bg-white'
                    }`}
                  >
                    🌅 Sabah (06:00 - 12:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => { sound.playTick(); setTimeOfDay('afternoon'); }}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      timeOfDay === 'afternoon'
                        ? 'bg-amber-900 text-white border-amber-900 shadow-2xs'
                        : 'bg-[#FAF7F2] text-charcoal border-[#E8E1D5] hover:bg-white'
                    }`}
                  >
                    ☀️ Öğle (12:00 - 18:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => { sound.playTick(); setTimeOfDay('evening'); }}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      timeOfDay === 'evening'
                        ? 'bg-amber-900 text-white border-amber-900 shadow-2xs'
                        : 'bg-[#FAF7F2] text-charcoal border-[#E8E1D5] hover:bg-white'
                    }`}
                  >
                    🌙 Akşam / Gece
                  </button>
                </div>
              </div>
            </div>

            {/* Calculated Result Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-950">Önerilen Gölge Taraf:</span>
                  <strong className="text-sm font-extrabold text-emerald-900 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300">
                    {shadowCalculation.shadeSide}
                  </strong>
                </div>
                <p className="text-xs text-emerald-900 font-medium">{shadowCalculation.recommendation}</p>
              </div>

              <div className="text-left sm:text-right flex-shrink-0">
                <span className="text-[10px] font-bold text-emerald-800 block">Önerilen Koltuk Noları</span>
                <span className="text-xs font-black text-emerald-950">{shadowCalculation.idealSeats}</span>
              </div>
            </div>
          </div>

          {/* Seat Types & Legroom Benchmark Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-charcoal uppercase tracking-wider">Koltuk Tipleri & Diz Mesafesi Karşılaştırması</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* 2+1 Tekli Koltuk */}
              <div
                onClick={() => { sound.playTick(); setSelectedSeatCategory('bus_single'); }}
                className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-soft space-y-2 ${
                  selectedSeatCategory === 'bus_single'
                    ? 'border-bordeaux-900 bg-bordeaux-50/30 ring-2 ring-bordeaux-900/10'
                    : 'border-[#E8E1D5]'
                }`}
              >
                <div className="flex items-center gap-2 text-bordeaux-800 font-black text-xs">
                  <BileoBus className="w-4 h-4" />
                  <span>2+1 Tekli Sıra</span>
                </div>
                <div className="text-xl font-black text-charcoal">88 cm <span className="text-xs font-medium text-charcoal-muted">Diz Mesafesi</span></div>
                <p className="text-[11px] text-charcoal-muted font-medium">
                  Tek başına seyahat edenler için yan koltuk temassız, koridor ve pencere bağımsızlığı.
                </p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                  <BileoCheckCircle className="w-3 h-3" />
                  <span>En Yüksek Gizlilik</span>
                </div>
              </div>

              {/* YHT Business / 1. Sınıf */}
              <div
                onClick={() => { sound.playTick(); setSelectedSeatCategory('yht_business'); }}
                className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-soft space-y-2 ${
                  selectedSeatCategory === 'yht_business'
                    ? 'border-bordeaux-900 bg-bordeaux-50/30 ring-2 ring-bordeaux-900/10'
                    : 'border-[#E8E1D5]'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
                  <BileoTrain className="w-4 h-4" />
                  <span>YHT Business Set</span>
                </div>
                <div className="text-xl font-black text-charcoal">102 cm <span className="text-xs font-medium text-charcoal-muted">Diz Mesafesi</span></div>
                <p className="text-[11px] text-charcoal-muted font-medium">
                  2+1 deri döşeme, geniş çalışma masası, her koltukta 220V priz ve sessiz vagon.
                </p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                  <BileoCheckCircle className="w-3 h-3" />
                  <span>Laptop & Çalışma Uyumlu</span>
                </div>
              </div>

              {/* Uçak Acil Çıkış (Emergency Exit) */}
              <div
                onClick={() => { sound.playTick(); setSelectedSeatCategory('flight_exit'); }}
                className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-soft space-y-2 ${
                  selectedSeatCategory === 'flight_exit'
                    ? 'border-bordeaux-900 bg-bordeaux-50/30 ring-2 ring-bordeaux-900/10'
                    : 'border-[#E8E1D5]'
                }`}
              >
                <div className="flex items-center gap-2 text-sky-800 font-black text-xs">
                  <BileoPlane className="w-4 h-4" />
                  <span>Uçak Acil Çıkış Sırası</span>
                </div>
                <div className="text-xl font-black text-charcoal">94 cm <span className="text-xs font-medium text-charcoal-muted">Diz Mesafesi</span></div>
                <p className="text-[11px] text-charcoal-muted font-medium">
                  Standart 74 cm yerine 94 cm bacak uzatma alanı (18 yaş üstü yolcular içindir).
                </p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                  <BileoCheckCircle className="w-3 h-3" />
                  <span>Ekstra Bacak Alanı</span>
                </div>
              </div>

              {/* Orta Sıra Amortisör Dengesi */}
              <div
                onClick={() => { sound.playTick(); setSelectedSeatCategory('middle_balance'); }}
                className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-soft space-y-2 ${
                  selectedSeatCategory === 'middle_balance'
                    ? 'border-bordeaux-900 bg-bordeaux-50/30 ring-2 ring-bordeaux-900/10'
                    : 'border-[#E8E1D5]'
                }`}
              >
                <div className="flex items-center gap-2 text-amber-800 font-black text-xs">
                  <BileoSparkles className="w-4 h-4" />
                  <span>Orta Sıra Dengesi</span>
                </div>
                <div className="text-xl font-black text-charcoal">Sıra 4 - 8 <span className="text-xs font-medium text-charcoal-muted">En Az Sarsıntı</span></div>
                <p className="text-[11px] text-charcoal-muted font-medium">
                  Akslar arasındaki orta bölge, viraj ve kasislerde sarsıntıyı %40 oranında daha az iletir.
                </p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                  <BileoCheckCircle className="w-3 h-3" />
                  <span>Mide Hassasiyeti Olanlara</span>
                </div>
              </div>

            </div>
          </div>

          {/* Expert Seat Selection Tactics */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-3">
            <h5 className="text-xs font-black text-charcoal">Uzman Yolcu Koltuk Seçim Taktikleri</h5>
            <ul className="space-y-2 text-xs text-charcoal-muted font-medium">
              <li className="flex items-start gap-2">
                <span className="text-bordeaux-700 font-bold">•</span>
                <span><strong>Hızlı İniş İçin (Ön 1-3 Sıralar):</strong> Mola tesislerinde ilk inen olma ve varış terminalinde bagajı beklemeden teslim alma avantajı.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-bordeaux-700 font-bold">•</span>
                <span><strong>Sessiz Uyku İçin:</strong> Motor gürültüsünden uzak olmak için arka 3 sıradan kaçının; orta-ön aks aralığını tercih edin.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-bordeaux-700 font-bold">•</span>
                <span><strong>Engelsiz & Kolay Erişim:</strong> Hareket kısıtlılığı olan yolcular için kapıya en yakın ön sıra koridor koltukları idealdir.</span>
              </li>
            </ul>
          </div>

          {/* Verification Badge */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-center justify-between text-xs text-charcoal-muted font-medium">
            <div className="flex items-center gap-2">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Bileo akıllı koltuk haritası tüm taşıyıcı standartları ile uyumludur.</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-bordeaux-900 text-white font-black text-xs cursor-pointer hover:bg-bordeaux-950 transition-colors"
            >
              Anladım
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
