import React, { useState, useEffect, useMemo } from 'react';
import { useScreenEntry } from '../lib/useScreenEntry';
import {
  BileoArrowLeft,
  BileoArrowRight,
  BileoCheck,
  BileoAlertCircle,
  BileoMaleIcon,
  BileoFemaleIcon,
} from './icons';
import { RouteItem, SeatItem } from '../types';
import { CompanyLogo } from './CompanyLogo';
import {
  generateCabinSeats,
  generateTrainSeats,
  generateFerrySeats
} from '../data/mockData';
import { validateSeatGenderAdjacency } from '../utils/validation';
import { RealisticSeat } from './common/RealisticSeat';

interface SeatSelectionModalProps {
  route: RouteItem;
  targetSeatsCount?: number;
  onClose: () => void;
  onConfirmSeats: (
    selectedSeats: (number | string)[],
    seatGenders: Record<string | number, 'male' | 'female'>,
    selectedSeatObjects?: SeatItem[]
  ) => void;
}

export const SeatSelectionModal: React.FC<SeatSelectionModalProps> = ({
  route,
  targetSeatsCount = 1,
  onClose,
  onConfirmSeats,
}) => {
  const entryRef = useScreenEntry<HTMLHeadingElement>();
  const [selectedCarriage, setSelectedCarriage] = useState<number>(1);
  const [selectedDeck, setSelectedDeck] = useState<'main' | 'upper'>('main');
  const [selectedSeats, setSelectedSeats] = useState<(number | string)[]>([]);
  const [selectedSeatObjects, setSelectedSeatObjects] = useState<SeatItem[]>([]);
  const [activeGender, setActiveGender] = useState<'male' | 'female'>('male');
  const [seatGenders, setSeatGenders] = useState<Record<string | number, 'male' | 'female'>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // A Turna offer carries exactly one published fare; the representative layout must not price tiers above it.
  const flatFare = Boolean(route.provenance);

  const cabinSeats = useMemo(() => {
    const generated =
      route.transportType === 'tren'
        ? generateTrainSeats(route.price, route.vehicleType, selectedCarriage)
        : route.transportType === 'feribot'
          ? generateFerrySeats(route.price, selectedDeck)
          : generateCabinSeats(route.transportType, route.seatLayoutType || 'bus_2_1', route.price);
    if (!flatFare) return generated;
    return generated.map((seat) => ({ ...seat, price: route.price }));
  }, [route.transportType, route.price, route.vehicleType, route.seatLayoutType, selectedCarriage, selectedDeck, flatFare]);

  const maxRow = useMemo(() => {
    return cabinSeats.reduce((max, s) => Math.max(max, s.row), 1);
  }, [cabinSeats]);

  const isBus = route.transportType === 'otobus';
  const isPlane = route.transportType === 'ucak';
  const isTrain = route.transportType === 'tren';
  const isFerry = route.transportType === 'feribot';

  const handleSeatClick = (seat: SeatItem) => {
    setErrorMessage(null);

    if (seat.status === 'booked' || seat.status === 'taken_male' || seat.status === 'taken_female' || seat.status === 'disabled') {
      setErrorMessage(`${seat.number} numaralı koltuk doludur.`);
      return;
    }

    if (selectedSeats.includes(seat.number)) {
      setSelectedSeats((prev) => prev.filter((s) => s !== seat.number));
      setSelectedSeatObjects((prev) => prev.filter((s) => s.number !== seat.number));
      setSeatGenders((prev) => {
        const next = { ...prev };
        delete next[seat.number];
        return next;
      });
      return;
    }

    if (selectedSeats.length >= targetSeatsCount) {
      setErrorMessage(`Belirlediğiniz bilet adedi kadar (${targetSeatsCount} Koltuk) seçim yapabilirsiniz.`);
      return;
    }

    if (isBus) {
      const check = validateSeatGenderAdjacency(cabinSeats, seat, activeGender, selectedSeats.map(String));
      if (!check.allowed) {
        setErrorMessage(check.reason || 'Cinsiyet kuralına göre bu koltuk seçilemez.');
        return;
      }
    }

    setSelectedSeats((prev) => [...prev, seat.number]);
    setSelectedSeatObjects((prev) => [...prev, seat]);
    setSeatGenders((prev) => ({ ...prev, [seat.number]: activeGender }));
  };

  const calculateTotal = useMemo(() => {
    if (selectedSeats.length === 0) return 0;
    return selectedSeatObjects.reduce((sum, s) => sum + (s.price || route.price), 0);
  }, [selectedSeats, selectedSeatObjects, route.price]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1B18] flex flex-col selection:bg-bordeaux-700 selection:text-white animate-fadeIn font-sans">
      
      {/* Top Sticky Navigation Bar */}
      <div className="sticky top-0 z-[100] bg-white shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="text-[#1E1B18] hover:text-bordeaux-700 text-xs font-extrabold flex items-center gap-2 transition-colors cursor-pointer py-2 px-1 group"
            >
              <BileoArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Bilet Önizlemesine Dön</span>
            </button>

            {/* Authentic Company Vector Logo */}
            <div className="flex items-center gap-3 pl-3 border-l border-[#E2DCD2]/60">
              <CompanyLogo
                company={route.company}
                transportType={route.transportType}
                size="md"
              />
              <div>
                <h2 ref={entryRef} tabIndex={-1} className="text-sm sm:text-base font-extrabold text-[#1E1B18] tracking-tight flex items-center gap-2 outline-none">
                  <span>{route.company}</span>
                  {route.vehicleType && (
                    <span className="text-xs font-semibold text-charcoal-muted hidden md:inline">({route.vehicleType})</span>
                  )}
                </h2>
                <div className="flex items-center gap-2 text-xs text-charcoal-muted">
                  <span className="font-semibold text-[#1E1B18]">{route.from} → {route.to}</span>
                  <span>•</span>
                  <span>{route.departureTime}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-xs font-extrabold">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <BileoCheck className="w-3.5 h-3.5" />
              <span>1. {targetSeatsCount} Bilet Belirlendi</span>
            </div>
            <span className="text-[#E2DCD2]">→</span>
            <div className="flex items-center gap-1.5 text-bordeaux-700 font-black">
              <span className="w-4 h-4 rounded-full bg-bordeaux-700 text-white flex items-center justify-center text-[10px]">2</span>
              <span>2. Koltuk Seçimi</span>
            </div>
            <span className="text-[#E2DCD2]">→</span>
            <div className="flex items-center gap-1.5 text-charcoal-muted">
              <span className="w-4 h-4 rounded-full bg-[#E8E1D5] text-charcoal-muted flex items-center justify-center text-[10px]">3</span>
              <span>3. Yolcu & Ödeme</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          
          {/* Prominent High-Visibility Gender Selection Card for Buses */}
          {isBus && (
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-soft max-w-lg mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold text-[#1E1B18] block">Seçilecek Koltuk Cinsiyeti:</span>
                <span className="text-[11px] text-charcoal-muted">Koltuk seçmeden önce cinsiyeti belirleyin</span>
              </div>
              <div className="flex items-center gap-2 bg-[#FAF7F2] p-1.5 rounded-2xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveGender('male')}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeGender === 'male'
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : 'text-charcoal-muted hover:text-[#1E3A8A]'
                  }`}
                >
                  <BileoMaleIcon className="w-3.5 h-3.5" />
                  <span>Bay Yolcu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGender('female')}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeGender === 'female'
                      ? 'bg-bordeaux-700 text-white shadow-xs'
                      : 'text-charcoal-muted hover:text-bordeaux-700'
                  }`}
                >
                  <BileoFemaleIcon className="w-3.5 h-3.5" />
                  <span>Bayan Yolcu</span>
                </button>
              </div>
            </div>
          )}

          {/* Train Carriage Selector */}
          {isTrain && (
            <div className="bg-white rounded-3xl p-4 shadow-soft max-w-lg mx-auto flex items-center justify-between gap-2 overflow-x-auto">
              <span className="text-xs font-extrabold text-[#1E1B18]">Vagon Seçimi:</span>
              <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl">
                {[1, 2, 3, 4].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCarriage(c)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedCarriage === c
                        ? 'bg-bordeaux-700 text-white shadow-xs'
                        : 'text-charcoal-muted hover:text-charcoal'
                    }`}
                  >
                    Vagon {c} {c === 1 ? '(Business)' : c === 4 ? '(Masa)' : '(Ekonomi)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ferry Deck Selector */}
          {isFerry && (
            <div className="bg-white rounded-3xl p-4 shadow-soft max-w-lg mx-auto flex items-center justify-between gap-3">
              <span className="text-xs font-extrabold text-[#1E1B18]">Güverte Seçimi:</span>
              <div className="flex items-center gap-2 bg-[#FAF7F2] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSelectedDeck('main')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedDeck === 'main'
                      ? 'bg-bordeaux-700 text-white shadow-xs'
                      : 'text-charcoal-muted hover:text-charcoal'
                  }`}
                >
                  Ana Güverte
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDeck('upper')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedDeck === 'upper'
                      ? 'bg-bordeaux-700 text-white shadow-xs'
                      : 'text-charcoal-muted hover:text-charcoal'
                  }`}
                >
                  {flatFare ? 'Üst Salon' : 'Üst VIP Salonu (+60 TL)'}
                </button>
              </div>
            </div>
          )}

          {/* Error Message Toast */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 text-xs font-bold text-rose-700 flex items-center gap-2 animate-fadeIn max-w-lg mx-auto">
              <BileoAlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cabin Layout Canvas */}
          <div className="py-2 sm:py-4">
            
            {/* Informative Seat Status Legend Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 py-2.5 px-4 bg-white rounded-2xl max-w-xl mx-auto mb-6 shadow-soft text-xs text-[#1E1B18]">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-4.5 rounded-md bg-white border border-[#D8D0C5] shadow-xs" />
                <span className="text-[11px] font-semibold text-charcoal-muted">Müsait</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-4.5 rounded-md bg-bordeaux-700 border border-bordeaux-800 shadow-xs" />
                <span className="text-[11px] font-semibold text-charcoal-muted">Seçili</span>
              </div>
              {isBus && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-4.5 rounded-md bg-[#EEF4FA] border border-[#CBDCEB]" />
                    <span className="text-[11px] font-semibold text-charcoal-muted">Dolu (Bay)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-4.5 rounded-md bg-[#FDF1F3] border border-[#F9CCD4]" />
                    <span className="text-[11px] font-semibold text-charcoal-muted">Dolu (Bayan)</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-4.5 rounded-md bg-[#EDE7DE] border border-[#DBD4C8] opacity-60" />
                <span className="text-[11px] font-semibold text-charcoal-muted">Dolu</span>
              </div>
              {/* The seat map is procedurally generated; no source publishes live occupancy or seat tiers. */}
              <span className="basis-full text-center text-[11px] text-charcoal-muted pt-1">
                {route.provenance
                  ? 'Koltuk düzeni temsilidir; canlı doluluk Turna sayfasında yayımlanmaz. Tüm koltuklar Turna fiyatıyla listelenir; koltuk farkı alınmaz.'
                  : 'Koltuk düzeni temsilidir.'}
              </span>
            </div>

            <div className="flex items-center justify-center pb-4 mb-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#1E1B18]/70 font-display">
                {isBus ? 'ARAÇ ÖNÜ / KAPTAN KÖŞKÜ' : isPlane ? 'UÇAK ÖNÜ / KOKPİT' : isTrain ? 'LOKOMOTİF / TREN ÖNÜ' : 'GEMİ BAŞI / ÖN GÜVERTE'}
              </span>
            </div>

            <div className="max-w-xl mx-auto space-y-4">
              {Array.from({ length: maxRow }, (_, rIdx) => rIdx + 1).map((rowNum) => {
                const rowSeats = cabinSeats.filter((s) => s.row === rowNum);
                return (
                  <div key={rowNum} className="flex items-center justify-center gap-3">
                    <span className="w-6 text-[11px] font-mono font-bold text-charcoal-muted text-center">
                      {rowNum}
                    </span>
                    <div className="flex items-center gap-3 sm:gap-4">
                      {rowSeats.map((seat) => {
                        const isSelected = selectedSeats.includes(seat.number);
                        const isBooked = seat.status === 'booked' || seat.status === 'disabled';
                        const isMale = seat.status === 'taken_male' || (!isSelected && seatGenders[seat.number] === 'male');
                        const isFemale = seat.status === 'taken_female' || (!isSelected && seatGenders[seat.number] === 'female');
                        const seatSelectedGender = seatGenders[seat.number] || (isSelected ? activeGender : undefined);

                        return (
                          <React.Fragment key={seat.id}>
                            {isBus && seat.col === 2 && rowSeats.length > 2 && (
                              <div className="w-6 sm:w-10 text-center text-[10px] text-[#C4B9A8] font-bold select-none">
                                Koridor
                              </div>
                            )}
                            {isPlane && seat.col === 4 && (
                              <div className="w-6 sm:w-10 text-center text-[10px] text-[#C4B9A8] font-bold select-none">
                                Koridor
                              </div>
                            )}
                            <RealisticSeat
                              seat={seat}
                              isSelected={isSelected}
                              isMale={isMale}
                              isFemale={isFemale}
                              isBooked={isBooked}
                              isSingleVIP={seat.tier === 'single'}
                              selectedGender={seatSelectedGender}
                              onClick={() => handleSeatClick(seat)}
                            />
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Summary Card */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-soft space-y-4">
            <h4 className="text-base font-extrabold text-[#1E1B18] font-display pb-3 border-b border-[#E2DCD2]/40">
              Koltuk Seçim Özeti
            </h4>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-charcoal-muted">
                <span>Hedef Bilet Adedi:</span>
                <span className="font-bold text-[#1E1B18]">{targetSeatsCount} Koltuk</span>
              </div>
              <div className="flex justify-between text-charcoal-muted">
                <span>Seçilen Koltuklar:</span>
                <span className="font-bold text-bordeaux-700 text-sm">
                  {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Henüz seçilmedi'}
                </span>
              </div>
              <div className="flex justify-between text-charcoal-muted">
                <span>Birim Bilet Fiyatı:</span>
                <span className="font-bold text-[#1E1B18]">
                  {route.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                </span>
              </div>

              {/* Live Selected Seat Breakdown with Gender Badges */}
              {selectedSeats.length > 0 && (
                <div className="pt-2 pb-1 space-y-2 border-t border-[#E2DCD2]/40">
                  <span className="text-[11px] font-bold text-charcoal-muted block">Seçim Detayı:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map((num) => {
                      const g = seatGenders[num];
                      return (
                        <span
                          key={num}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-black inline-flex items-center gap-1 ${
                            g === 'male'
                              ? 'bg-[#EEF4FA] text-[#1E3A8A]'
                              : 'bg-[#FDF1F3] text-bordeaux-700'
                          }`}
                        >
                          <span>Koltuk {num}</span>
                          <span className="text-[10px] opacity-80">({g === 'male' ? 'Bay' : 'Bayan'})</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 flex items-center justify-between border-t border-[#E2DCD2]/40">
                <div>
                  <span className="text-[11px] text-charcoal-muted block font-semibold">Toplam Tutar</span>
                  <span className="text-2xl font-black text-[#1E1B18] font-display">
                    {calculateTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                  </span>
                </div>
                <div className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md">
                  <BileoCheck className="w-3.5 h-3.5" />
                  <span>0 TL Komisyon</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={selectedSeats.length !== targetSeatsCount}
              onClick={() => onConfirmSeats(selectedSeats, seatGenders, selectedSeatObjects)}
              className={`w-full py-4 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                selectedSeats.length === targetSeatsCount
                  ? 'bg-bordeaux-700 hover:bg-bordeaux-800 text-white shadow-bordeaux cursor-pointer hover:shadow-lg scale-100'
                  : 'bg-[#E8E1D5] text-charcoal-muted cursor-not-allowed'
              }`}
            >
              <span>Yolcu Bilgilerine İlerle ({selectedSeats.length}/{targetSeatsCount})</span>
              <BileoArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
