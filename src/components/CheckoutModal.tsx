import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  BileoArrowLeft,
  BileoCreditCard,
  BileoChevronsRight,
  BileoLock,
  BileoLuggage,
  BileoArrowRight,
  BileoCheck,
  BileoTag,
  BileoMail,
  BileoMaleIcon,
  BileoFemaleIcon
} from './icons';
import confetti from 'canvas-confetti';
import {
  RouteItem,
  PassengerInfo,
  BookingTicket,
  SeatGender,
  SeatItem,
  CheckoutAddOns
} from '../types';
import { CompanyLogo } from './CompanyLogo';
import {
  validateTCKN,
  validatePassport,
  validateLuhn,
  validateCoupon,
  calculatePricing,
  generateAuthenticPnr,
  generateValidTCKN,
} from '../utils/validation';

interface CheckoutModalProps {
  route: RouteItem;
  selectedSeats: (number | string)[];
  selectedGender?: SeatGender;
  seatGenders?: Record<string | number, 'male' | 'female'>;
  selectedSeatObjects?: SeatItem[];
  onClose: () => void;
  onPaymentSuccess?: (ticket: BookingTicket) => void;
  onBookingCompleted?: (ticket: BookingTicket) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  route,
  selectedSeats,
  selectedGender = 'male',
  seatGenders = {},
  selectedSeatObjects = [],
  onClose,
  onPaymentSuccess,
  onBookingCompleted,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentStep]);

  // Step 1: Contact Info
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Step 1: Passengers List
  const [passengers, setPassengers] = useState<PassengerInfo[]>(() => {
    return selectedSeats.map((seatNum, idx) => ({
      id: `p-${idx}-${seatNum}`,
      seatNumber: seatNum,
      firstName: '',
      lastName: '',
      idNumber: '',
      isForeigner: false,
      nationality: 'TR',
      gender: seatGenders[seatNum] || (selectedGender === 'none' ? 'male' : (selectedGender || 'male')),
      email: '',
      phone: '',
    }));
  });

  // Step 1: Add-ons State
  const [addOns, setAddOns] = useState<CheckoutAddOns>({
    luggageKg: 20,
    insurance: false,
    smsNotification: false,
  });

  // Step 1 Validation Errors
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // Step 2: Payment Details
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  // Step 2: Physical Slider Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  /**
   * 1-Click Demo Random Data Generator
   * Generates realistic Turkish names matching passenger gender, valid algorithmic TCKN numbers, and contact details
   */
  const handleAutofillDemoData = () => {
    const MALE_NAMES = ['Ahmet', 'Mehmet', 'Mustafa', 'Emre', 'Burak', 'Caner', 'Oğuz', 'Kaan', 'Mert', 'Deniz', 'Murat', 'Ali', 'Eren', 'Serkan', 'Kerem'];
    const FEMALE_NAMES = ['Ayşe', 'Fatma', 'Elif', 'Zeynep', 'Büşra', 'Selin', 'Ece', 'Damla', 'Merve', 'Gamze', 'İrem', 'Gözde', 'Seda', 'Derya', 'Buse'];
    const SURNAMES = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin'];

    const primarySurname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    const updatedPassengers = passengers.map((p, i) => {
      const isFem = p.gender === 'female';
      const firstName = isFem
        ? FEMALE_NAMES[(i * 3 + Math.floor(Math.random() * 5)) % FEMALE_NAMES.length]
        : MALE_NAMES[(i * 3 + Math.floor(Math.random() * 5)) % MALE_NAMES.length];
      const lastName = i === 0 ? primarySurname : SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
      const tckn = generateValidTCKN();

      return {
        ...p,
        firstName,
        lastName,
        idNumber: tckn,
        isForeigner: false,
      };
    });

    setPassengers(updatedPassengers);

    const leadFirstName = updatedPassengers[0].firstName
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    const leadLastName = updatedPassengers[0].lastName
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');

    setContactEmail(`${leadFirstName}.${leadLastName}${Math.floor(Math.random() * 89 + 10)}@gmail.com`);
    setContactPhone(`0532 ${Math.floor(Math.random() * 899 + 100)} ${Math.floor(Math.random() * 89 + 10)} ${Math.floor(Math.random() * 89 + 10)}`);
    setStep1Errors({});

    // Also prepare Step 2 demo test card data
    setCardHolder(`${updatedPassengers[0].firstName} ${updatedPassengers[0].lastName}`.toUpperCase());
    setCardNumber('5421 8765 4321 0987');
    setCardExpiry('12/28');
    setCardCvv('384');
  };

  // Dynamic Pricing Calculation
  const pricing = useMemo(() => {
    return calculatePricing(
      route.price,
      selectedSeatObjects,
      addOns,
      appliedCouponCode
    );
  }, [route.price, selectedSeatObjects, addOns, appliedCouponCode]);

  // Detected Credit Card Brand via Luhn
  const cardBrand = useMemo(() => {
    const clean = cardNumber.replace(/\s+/g, '');
    if (/^4/.test(clean)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
    if (/^(9792|65|589004)/.test(clean)) return 'Troy';
    return null;
  }, [cardNumber]);

  const updatePassenger = (idx: number, patch: Partial<PassengerInfo>) => {
    setPassengers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const handleProceedToPayment = () => {
    const errors: Record<string, string> = {};

    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      errors.contactEmail = 'Geçerli bir e-posta adresi giriniz.';
    }
    if (!contactPhone || contactPhone.replace(/\D/g, '').length < 10) {
      errors.contactPhone = 'Geçerli bir telefon numarası giriniz (en az 10 hane).';
    }

    passengers.forEach((p, idx) => {
      if (!p.firstName.trim()) {
        errors[`p_${idx}_firstName`] = 'Yolcu adı zorunludur.';
      }
      if (!p.lastName.trim()) {
        errors[`p_${idx}_lastName`] = 'Yolcu soyadı zorunludur.';
      }

      if (p.isForeigner) {
        const passportCheck = validatePassport(p.idNumber);
        if (!passportCheck.isValid) {
          errors[`p_${idx}_idNumber`] = passportCheck.error || 'Geçersiz pasaport formatı.';
        }
      } else {
        const tcknCheck = validateTCKN(p.idNumber);
        if (!tcknCheck.isValid) {
          errors[`p_${idx}_idNumber`] = tcknCheck.error || 'Geçersiz T.C. Kimlik Numarası.';
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setStep1Errors(errors);
      return;
    }

    setStep1Errors({});
    setCurrentStep(2);
  };

  const handleApplyCoupon = () => {
    const res = validateCoupon(couponCode);
    if (res.valid) {
      setAppliedCouponCode(couponCode.trim().toUpperCase());
      setCouponMessage({ text: res.description || 'İndirim Başarıyla Uygulandı!', isError: false });
    } else {
      setAppliedCouponCode('');
      setCouponMessage({ text: 'Geçersiz veya süresi dolmuş kupon kodu.', isError: true });
    }
  };

  // Slider Mouse Move / Touch Move Handler
  const handleDrag = useCallback(
    (clientX: number) => {
      if (!isDragging || !trackRef.current || isSubmitting) return;

      const track = trackRef.current.getBoundingClientRect();
      const thumbWidth = 56;
      const maxDistance = track.width - thumbWidth;
      const currentPos = clientX - track.left - thumbWidth / 2;
      const clamped = Math.max(0, Math.min(maxDistance, currentPos));
      const ratio = clamped / maxDistance;

      setSlideProgress(ratio);

      if (ratio >= 0.95) {
        setIsDragging(false);
        setSlideProgress(1);
        triggerPaymentExecution();
      }
    },
    [isDragging, isSubmitting]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDrag(e.clientX);
    const onMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (slideProgress < 0.95) {
          setSlideProgress(0);
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleDrag(e.touches[0].clientX);
    };
    const onTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        if (slideProgress < 0.95) {
          setSlideProgress(0);
        }
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, slideProgress, handleDrag]);

  const triggerPaymentExecution = () => {
    const errors: Record<string, string> = {};

    const cleanCard = cardNumber.replace(/\s+/g, '');
    const luhnCheck = validateLuhn(cleanCard);
    if (!luhnCheck.isValid) {
      errors.cardNumber = 'Geçersiz kart numarası.';
    }

    if (!cardHolder.trim() || cardHolder.trim().length < 4) {
      errors.cardHolder = 'Kart üzerindeki isim zorunludur.';
    }

    if (!cardExpiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) {
      errors.cardExpiry = 'Geçerli son kullanma tarihi giriniz (AA/YY).';
    }

    if (!cardCvv || cardCvv.length < 3) {
      errors.cardCvv = 'Geçerli CVV kodu giriniz (3-4 hane).';
    }

    if (Object.keys(errors).length > 0) {
      setPaymentErrors(errors);
      setSlideProgress(0);
      return;
    }

    setPaymentErrors({});
    setIsSubmitting(true);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8A222B', '#E5DDD2', '#10B981', '#2C5282'],
      });
    } catch {
      // fallback
    }

    const issuedPnr = generateAuthenticPnr(route.transportType, route.company);

    const issuedTicket: BookingTicket = {
      id: `ticket-${Date.now()}`,
      pnr: issuedPnr,
      route,
      passengers,
      seats: selectedSeats,
      basePrice: pricing.baseFare,
      seatTierSurcharges: pricing.seatSurcharges,
      luggageSurcharges: pricing.luggageFare,
      insuranceFee: pricing.insuranceFare,
      discountAmount: pricing.discount,
      serviceFee: 0,
      totalPrice: pricing.total,
      status: 'active',
      purchaseDate: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      qrCodeValue: `BILEO-${issuedPnr}`,
      addOns,
    };

    setTimeout(() => {
      if (onBookingCompleted) onBookingCompleted(issuedTicket);
      if (onPaymentSuccess) onPaymentSuccess(issuedTicket);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1B18] flex flex-col animate-fadeIn font-sans">
      
      {/* Top Navigation Header (Clean & Solid) */}
      <header className="sticky top-0 z-[100] bg-white shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (currentStep === 2) {
                  setCurrentStep(1);
                } else {
                  onClose();
                }
              }}
              type="button"
              className="text-[#1E1B18] hover:text-bordeaux-700 text-xs font-extrabold flex items-center gap-2 transition-colors cursor-pointer py-2 px-1 group"
            >
              <BileoArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>{currentStep === 2 ? 'Koltuk & Yolcu Bilgilerine Dön' : 'Koltuk Seçimine Dön'}</span>
            </button>

            {/* Authentic Company Vector Logo */}
            <div className="flex items-center gap-3 pl-3 border-l border-[#E2DCD2]/60">
              <CompanyLogo
                company={route.company}
                transportType={route.transportType}
                size="md"
              />
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#1E1B18] tracking-tight flex items-center gap-2">
                  <span>{route.company}</span>
                  <span className="text-xs font-medium text-charcoal-muted hidden md:inline">({route.from} → {route.to})</span>
                </h2>
                <div className="flex items-center gap-2 text-xs text-charcoal-muted mt-0.5">
                  <span className="font-semibold text-[#1E1B18]">{route.date} • {route.departureTime}</span>
                  <span>•</span>
                  <span className="font-extrabold text-bordeaux-700">{selectedSeats.length} Koltuk: {selectedSeats.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Step Progress Ribbon (Clean & Borderless) */}
          <div className="hidden lg:flex items-center gap-3 text-xs font-extrabold">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <BileoCheck className="w-3.5 h-3.5" />
              <span>1. Koltuk Seçildi</span>
            </div>
            <span className="text-[#E8E1D5]">→</span>
            <div className={`flex items-center gap-1.5 ${currentStep === 1 ? 'text-bordeaux-700 font-black' : 'text-emerald-700'}`}>
              {currentStep === 1 ? (
                <span className="w-4 h-4 rounded-full bg-bordeaux-700 text-white flex items-center justify-center text-[10px]">2</span>
              ) : (
                <BileoCheck className="w-3.5 h-3.5" />
              )}
              <span>2. Yolcu Bilgileri</span>
            </div>
            <span className="text-[#E8E1D5]">→</span>
            <div className={`flex items-center gap-1.5 ${currentStep === 2 ? 'text-bordeaux-700 font-black' : 'text-charcoal-muted font-medium'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${currentStep === 2 ? 'bg-bordeaux-700 text-white' : 'bg-[#E8E1D5] text-charcoal-muted'}`}>3</span>
              <span>3. Ödeme & Onay</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Full-Screen Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* STEP 1: PASSENGERS, ID VALIDATION & ADD-ONS */}
        {currentStep === 1 ? (
          <>
            <div className="lg:col-span-8 space-y-8">
              
              {/* Contact Information Section */}
              <div className="space-y-4 pb-6">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-bordeaux-700 block mb-0.5">
                    İletişim & Bildirim
                  </span>
                  <h3 className="text-base font-extrabold text-[#1E1B18] flex items-center gap-2">
                    <BileoMail className="w-4 h-4 text-bordeaux-700" />
                    <span>İletişim Bilgileri (Bilet & SMS Bildirimi)</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-charcoal-muted mb-1.5">
                      E-posta Adresi
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => {
                        setContactEmail(e.target.value);
                        if (step1Errors.contactEmail) {
                          setStep1Errors((prev) => ({ ...prev, contactEmail: '' }));
                        }
                      }}
                      placeholder="ornek@bileo.com"
                      className={`w-full bg-white rounded-xl px-4 py-3 text-xs font-semibold text-charcoal focus:outline-none shadow-soft transition-colors ${
                        step1Errors.contactEmail ? 'bg-rose-50/70 text-rose-700' : ''
                      }`}
                    />
                    {step1Errors.contactEmail && (
                      <span className="text-[11px] font-bold text-rose-600 mt-1 block">{step1Errors.contactEmail}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal-muted mb-1.5">
                      Cep Telefonu
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => {
                        setContactPhone(e.target.value);
                        if (step1Errors.contactPhone) {
                          setStep1Errors((prev) => ({ ...prev, contactPhone: '' }));
                        }
                      }}
                      placeholder="0532 123 45 67"
                      className={`w-full bg-white rounded-xl px-4 py-3 text-xs font-semibold text-charcoal focus:outline-none shadow-soft transition-colors ${
                        step1Errors.contactPhone ? 'bg-rose-50/70 text-rose-700' : ''
                      }`}
                    />
                    {step1Errors.contactPhone && (
                      <span className="text-[11px] font-bold text-rose-600 mt-1 block">{step1Errors.contactPhone}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Passengers Detail Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-bordeaux-700 block mb-0.5">
                      Yolcu Kaydı
                    </span>
                    <h3 className="text-base font-extrabold text-[#1E1B18]">
                      <span>Yolcu Bilgileri ({passengers.length} Yolcu)</span>
                    </h3>
                  </div>

                  {/* 1-Click Demo Random Autofill Button */}
                  <button
                    type="button"
                    onClick={handleAutofillDemoData}
                    className="px-3.5 py-1.5 rounded-xl bg-white text-xs font-black text-bordeaux-700 hover:text-bordeaux-900 shadow-soft hover:shadow-soft-lg transition-all flex items-center gap-1.5 cursor-pointer border border-[#E2DCD2]/60"
                    title="Tüm yolcular için otomatik geçerli T.C. ve isim oluştur"
                  >
                    <span>Rastgele Bilgileri Doldur</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {passengers.map((p, idx) => (
                    <div key={p.id} className="p-5 rounded-2xl bg-white shadow-soft space-y-4">
                      
                      <div className="flex items-center justify-between text-xs font-bold text-charcoal pb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-bordeaux-700 text-white flex items-center justify-center text-xs font-black shadow-2xs">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-extrabold text-[#1E1B18]">
                            {idx + 1}. Yolcu (Koltuk {p.seatNumber})
                          </span>
                          {/* Automatic Gender from Seat Selection */}
                          <span className={`text-[11px] font-bold flex items-center gap-1 ml-1 ${p.gender === 'female' ? 'text-rose-700' : 'text-blue-700'}`}>
                            {p.gender === 'female' ? <BileoFemaleIcon className="w-3.5 h-3.5 text-rose-700" /> : <BileoMaleIcon className="w-3.5 h-3.5 text-blue-700" />}
                            <span>{p.gender === 'female' ? 'Bayan Yolcu' : 'Bay Yolcu'}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => updatePassenger(idx, { isForeigner: false, idNumber: '' })}
                            className={`text-xs font-bold transition-all cursor-pointer py-1 px-1.5 ${
                              !p.isForeigner ? 'text-bordeaux-700 font-black' : 'text-charcoal-muted hover:text-charcoal'
                            }`}
                          >
                            T.C. Vatandaşı
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePassenger(idx, { isForeigner: true, idNumber: '' })}
                            className={`text-xs font-bold transition-all cursor-pointer py-1 px-1.5 ${
                              p.isForeigner ? 'text-bordeaux-700 font-black' : 'text-charcoal-muted hover:text-charcoal'
                            }`}
                          >
                            Yabancı Uyruklu
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-charcoal-muted mb-1.5">Ad</label>
                          <input
                            type="text"
                            value={p.firstName}
                            onChange={(e) => {
                              updatePassenger(idx, { firstName: e.target.value });
                              if (step1Errors[`p_${idx}_firstName`]) {
                                setStep1Errors((prev) => ({ ...prev, [`p_${idx}_firstName`]: '' }));
                              }
                            }}
                            placeholder="Ahmet"
                            className={`w-full bg-[#FAF7F2] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-charcoal focus:outline-none transition-colors ${
                              step1Errors[`p_${idx}_firstName`] ? 'bg-rose-50 text-rose-700' : ''
                            }`}
                          />
                          {step1Errors[`p_${idx}_firstName`] && (
                            <span className="text-[11px] font-bold text-rose-600 mt-1 block">{step1Errors[`p_${idx}_firstName`]}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-charcoal-muted mb-1.5">Soyad</label>
                          <input
                            type="text"
                            value={p.lastName}
                            onChange={(e) => {
                              updatePassenger(idx, { lastName: e.target.value });
                              if (step1Errors[`p_${idx}_lastName`]) {
                                setStep1Errors((prev) => ({ ...prev, [`p_${idx}_lastName`]: '' }));
                              }
                            }}
                            placeholder="Yılmaz"
                            className={`w-full bg-[#FAF7F2] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-charcoal focus:outline-none transition-colors ${
                              step1Errors[`p_${idx}_lastName`] ? 'bg-rose-50 text-rose-700' : ''
                            }`}
                          />
                          {step1Errors[`p_${idx}_lastName`] && (
                            <span className="text-[11px] font-bold text-rose-600 mt-1 block">{step1Errors[`p_${idx}_lastName`]}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-charcoal-muted mb-1.5">
                            {p.isForeigner ? 'Pasaport No (6-9 Hane)' : 'T.C. Kimlik No (11 Haneli)'}
                          </label>
                          <input
                            type="text"
                            value={p.idNumber}
                            onChange={(e) => {
                              updatePassenger(idx, { idNumber: e.target.value.trim().toUpperCase() });
                              if (step1Errors[`p_${idx}_idNumber`]) {
                                setStep1Errors((prev) => ({ ...prev, [`p_${idx}_idNumber`]: '' }));
                              }
                            }}
                            placeholder={p.isForeigner ? 'U1234567' : '10000000146'}
                            className={`w-full bg-[#FAF7F2] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-charcoal focus:outline-none font-mono transition-colors ${
                              step1Errors[`p_${idx}_idNumber`] ? 'bg-rose-50 text-rose-700' : ''
                            }`}
                          />
                          {step1Errors[`p_${idx}_idNumber`] && (
                            <span className="text-[11px] font-bold text-rose-600 mt-1 block">{step1Errors[`p_${idx}_idNumber`]}</span>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Unified Reservation & Checkout Panel */}
            <div className="lg:col-span-4 sticky top-24 space-y-4">
              
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-soft space-y-5">
                
                {/* Header */}
                <div className="pb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-bordeaux-700 block mb-0.5">
                    Rezervasyon Detayı
                  </span>
                  <h3 className="text-base font-extrabold text-[#1E1B18]">
                    Ek Hizmetler & Fiyat Özeti
                  </h3>
                </div>

                {/* Baggage Selection Section */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#1E1B18]">
                    <BileoLuggage className="w-4 h-4 text-bordeaux-700" />
                    <span>Bagaj Hakkı Seçimi</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { kg: 20, label: 'Standart Bagaj (20 kg)', price: 0, sub: 'Bilete Dahil' },
                      { kg: 25, label: 'Ekstra Bagaj (25 kg)', price: 95, sub: '+95 TL / Yolcu' },
                      { kg: 35, label: 'Maksimum Bagaj (35 kg)', price: 175, sub: '+175 TL / Yolcu' },
                    ].map((b) => (
                      <label
                        key={b.kg}
                        className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                          addOns.luggageKg === b.kg
                            ? 'bg-bordeaux-50/50 text-charcoal shadow-2xs'
                            : 'bg-[#FAF7F2] text-charcoal-muted hover:bg-[#FAF5ED]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="luggageKg"
                            checked={addOns.luggageKg === b.kg}
                            onChange={() => setAddOns((prev) => ({ ...prev, luggageKg: b.kg }))}
                            className="accent-bordeaux-700 w-3.5 h-3.5"
                          />
                          <div>
                            <p className="text-xs font-bold text-[#1E1B18]">{b.label}</p>
                            <p className="text-[10px] text-charcoal-muted">{b.sub}</p>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-[#1E1B18]">
                          {b.price === 0 ? '0,00 TL' : `+${b.price} TL`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Travel Insurance Option */}
                <div
                  onClick={() =>
                    setAddOns((prev) => ({
                      ...prev,
                      insurance: !prev.insurance,
                    }))
                  }
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
                    addOns.insurance
                      ? 'bg-emerald-50/60 shadow-2xs'
                      : 'bg-[#FAF7F2] hover:bg-[#FAF5ED]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 transition-colors ${
                        addOns.insurance ? 'bg-emerald-600 text-white' : 'bg-white shadow-2xs'
                      }`}
                    >
                      {addOns.insurance && <BileoCheck className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-extrabold text-[#1E1B18]">Seyahat & İptal Güvencesi</p>
                        <span className="text-[10px] font-black text-emerald-700">
                          +45,00 TL
                        </span>
                      </div>
                      <p className="text-[11px] text-charcoal-muted mt-0.5 leading-relaxed">
                        Sefer saatine kadar %100 koşulsuz iade ve sağlık güvencesi.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="pt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between text-charcoal-muted">
                    <span>Toplam Bilet ({selectedSeats.length} Koltuk):</span>
                    <span className="font-bold text-[#1E1B18]">
                      {(pricing.baseFare + pricing.seatSurcharges).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                    </span>
                  </div>

                  {pricing.luggageFare > 0 && (
                    <div className="flex justify-between text-charcoal-muted">
                      <span>Ekstra Bagaj:</span>
                      <span className="font-bold text-[#1E1B18]">
                        +{pricing.luggageFare.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </span>
                    </div>
                  )}

                  {pricing.insuranceFare > 0 && (
                    <div className="flex justify-between text-charcoal-muted">
                      <span>Seyahat Sigortası:</span>
                      <span className="font-bold text-emerald-700">
                        +{pricing.insuranceFare.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-charcoal-muted">
                    <span>Hizmet & Rezervasyon:</span>
                    <span className="font-bold text-emerald-700">0 TL (Ücretsiz)</span>
                  </div>

                  <div className="pt-3.5 flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-charcoal-muted block font-semibold">Ödenecek Tutar</span>
                      <span className="text-2xl font-black text-[#1E1B18]">
                        {pricing.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-700">
                      Net Fiyat
                    </span>
                  </div>
                </div>

                {/* Primary CTA */}
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="w-full py-4 rounded-2xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-bordeaux cursor-pointer transition-all flex items-center justify-center gap-2 hover:shadow-lg"
                >
                  <span>Ödeme Adımına İlerle</span>
                  <BileoArrowRight className="w-4 h-4" />
                </button>

              </div>

            </div>
          </>
        ) : (
          /* STEP 2: CREDIT CARD DETAILS & PHYSICAL TICKET SLIDE CONFIRMATION */
          <>
            <div className="lg:col-span-8 space-y-8">
              
              <div className="space-y-5 pb-6">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-[#1E1B18]">
                    <BileoCreditCard className="w-4 h-4 text-bordeaux-700" />
                    <span>Kredi / Banka Kartı Bilgileri</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCardHolder(passengers[0]?.firstName ? `${passengers[0].firstName} ${passengers[0].lastName}`.toUpperCase() : 'AHMET YILMAZ');
                        setCardNumber('5421 8765 4321 0987');
                        setCardExpiry('12/28');
                        setCardCvv('384');
                        setPaymentErrors({});
                      }}
                      className="px-3 py-1 rounded-xl bg-white text-[11px] font-black text-bordeaux-700 hover:text-bordeaux-900 shadow-soft transition-all cursor-pointer border border-[#E2DCD2]/60"
                      title="Demo test kart bilgilerini doldur"
                    >
                      Demo Kartı Doldur
                    </button>
                    <div className="hidden sm:flex items-center gap-2 text-[10px] font-extrabold text-charcoal-muted">
                      <span>Visa</span>
                      <span>•</span>
                      <span>Mastercard</span>
                      <span>•</span>
                      <span>Troy</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-charcoal-muted mb-1.5">
                      Kart Numarası (16 Haneli)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                          setCardNumber(v);
                          if (paymentErrors.cardNumber) {
                            setPaymentErrors((prev) => ({ ...prev, cardNumber: '' }));
                          }
                        }}
                        placeholder="4532 •••• •••• 1234"
                        className={`w-full bg-white rounded-xl px-4 py-3 text-sm font-mono font-bold text-charcoal focus:outline-none shadow-soft transition-colors ${
                          paymentErrors.cardNumber ? 'bg-rose-50 text-rose-700' : ''
                        }`}
                      />
                      {cardBrand && (
                        <span className="absolute right-4 top-3 text-xs font-black text-bordeaux-700">
                          {cardBrand}
                        </span>
                      )}
                    </div>
                    {paymentErrors.cardNumber && (
                      <span className="text-[11px] font-bold text-rose-600 mt-1 block">{paymentErrors.cardNumber}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal-muted mb-1.5">
                      Kart Üzerindeki İsim
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => {
                        setCardHolder(e.target.value.toUpperCase());
                        if (paymentErrors.cardHolder) {
                          setPaymentErrors((prev) => ({ ...prev, cardHolder: '' }));
                        }
                      }}
                      placeholder="AHMET YILMAZ"
                      className={`w-full bg-white rounded-xl px-4 py-3 text-xs font-bold text-charcoal focus:outline-none shadow-soft transition-colors ${
                        paymentErrors.cardHolder ? 'bg-rose-50 text-rose-700' : ''
                      }`}
                    />
                    {paymentErrors.cardHolder && (
                      <span className="text-[11px] font-bold text-rose-600 mt-1 block">{paymentErrors.cardHolder}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-charcoal-muted mb-1.5">Son Kullanma (AA/YY)</label>
                      <input
                        type="text"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, '');
                          if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
                          setCardExpiry(v);
                          if (paymentErrors.cardExpiry) {
                            setPaymentErrors((prev) => ({ ...prev, cardExpiry: '' }));
                          }
                        }}
                        placeholder="12/28"
                        className={`w-full bg-white rounded-xl px-4 py-3 text-xs font-mono font-bold text-charcoal focus:outline-none shadow-soft transition-colors ${
                          paymentErrors.cardExpiry ? 'bg-rose-50 text-rose-700' : ''
                        }`}
                      />
                      {paymentErrors.cardExpiry && (
                        <span className="text-[11px] font-bold text-rose-600 mt-1 block">{paymentErrors.cardExpiry}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-charcoal-muted mb-1.5">Güvenlik Kodu (CVV)</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => {
                          setCardCvv(e.target.value.replace(/\D/g, ''));
                          if (paymentErrors.cardCvv) {
                            setPaymentErrors((prev) => ({ ...prev, cardCvv: '' }));
                          }
                        }}
                        placeholder="•••"
                        className={`w-full bg-white rounded-xl px-4 py-3 text-xs font-mono font-bold text-charcoal focus:outline-none shadow-soft transition-colors ${
                          paymentErrors.cardCvv ? 'bg-rose-50 text-rose-700' : ''
                        }`}
                      />
                      {paymentErrors.cardCvv && (
                        <span className="text-[11px] font-bold text-rose-600 mt-1 block">{paymentErrors.cardCvv}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 text-xs text-charcoal-muted">
                  <BileoLock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>256-Bit SSL Şifreleme ile kart bilgileriniz güvendedir.</span>
                </div>
              </div>

              {/* Coupon Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-charcoal">
                  <BileoTag className="w-4 h-4 text-bordeaux-700" />
                  <span>İndirim Kuponu</span>
                </div>

                <div className="flex items-center gap-2.5 max-w-md">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Kupon Kodu (Örn: BILEO50)"
                    className="flex-1 bg-white rounded-xl px-4 py-2.5 text-xs font-bold text-charcoal focus:outline-none uppercase shadow-soft"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-5 py-2.5 rounded-xl bg-charcoal hover:bg-black text-white text-xs font-extrabold cursor-pointer transition-colors shadow-2xs"
                  >
                    Uygula
                  </button>
                </div>

                {couponMessage && (
                  <p className={`text-xs font-bold ${couponMessage.isError ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {couponMessage.text}
                  </p>
                )}
              </div>

            </div>

            <div className="lg:col-span-4 sticky top-24 space-y-4">
              
              <div className="bg-white rounded-3xl p-6 shadow-soft space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-bordeaux-700 pb-2">
                  Ödeme Özeti
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-charcoal-muted">
                    <span>Yolcu Sayısı:</span>
                    <span className="font-bold text-charcoal">{selectedSeats.length} Kişi ({selectedSeats.join(', ')})</span>
                  </div>
                  <div className="flex justify-between text-charcoal-muted">
                    <span>Bilet Tutarı:</span>
                    <span className="font-bold text-charcoal">
                      {(pricing.baseFare + pricing.seatSurcharges).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                    </span>
                  </div>

                  {pricing.luggageFare > 0 && (
                    <div className="flex justify-between text-charcoal-muted">
                      <span>Ekstra Bagaj:</span>
                      <span className="font-bold text-charcoal">
                        +{pricing.luggageFare.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </span>
                    </div>
                  )}

                  {pricing.insuranceFare > 0 && (
                    <div className="flex justify-between text-charcoal-muted">
                      <span>Seyahat Sigortası:</span>
                      <span className="font-bold text-emerald-700">
                        +{pricing.insuranceFare.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </span>
                    </div>
                  )}

                  {pricing.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Kupon İndirimi:</span>
                      <span>-{pricing.discount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                    </div>
                  )}

                  <div className="pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-charcoal-muted block font-semibold">Ödenecek Toplam Tutar</span>
                      <span className="text-2xl font-black text-[#1E1B18]">
                        {pricing.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-700">
                      0 TL Komisyon
                    </span>
                  </div>
                </div>

                {/* Interactive Drag-to-Confirm Physical Slider */}
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-charcoal-muted mb-2 text-center">
                    Bileti Onaylamak İçin Kaydırın
                  </label>

                  <div
                    ref={trackRef}
                    className="relative h-15 rounded-full bg-[#FAF7F2] p-1.5 flex items-center select-none shadow-soft overflow-hidden"
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-bordeaux-700/15 transition-all"
                      style={{ width: `${slideProgress * 100}%` }}
                    />

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-black text-charcoal-muted tracking-wider uppercase">
                      {isSubmitting ? (
                        <span className="text-bordeaux-700 animate-pulse">Bilet Düzenleniyor...</span>
                      ) : (
                        <span>Kaydırarak Satın Al →</span>
                      )}
                    </div>

                    <div
                      onMouseDown={() => {
                        setIsDragging(true);
                      }}
                      onTouchStart={(e) => {
                        if (e.touches[0]) {
                          setIsDragging(true);
                        }
                      }}
                      className={`relative z-10 w-12 h-12 rounded-full bg-bordeaux-700 text-white flex items-center justify-center shadow-bordeaux cursor-grab active:cursor-grabbing transition-transform ${
                        isDragging ? 'scale-105' : ''
                      }`}
                      style={{
                        transform: `translateX(${
                          trackRef.current
                            ? slideProgress * (trackRef.current.getBoundingClientRect().width - 52)
                            : 0
                        }px)`,
                      }}
                    >
                      <BileoChevronsRight className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={triggerPaymentExecution}
                  disabled={isSubmitting}
                  className="w-full py-2.5 text-center text-xs font-bold text-bordeaux-700 hover:text-bordeaux-900 cursor-pointer underline transition-colors"
                >
                  veya Tek Tıkla Ödemeyi Tamamla
                </button>

              </div>

            </div>
          </>
        )}

      </main>

    </div>
  );
};
