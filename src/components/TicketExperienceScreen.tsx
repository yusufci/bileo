import React, { useState, useEffect } from 'react';
import {
  BileoArrowLeft,
  BileoArrowRight,
  BileoCheckCircle,
  BileoShieldCheck,
  BileoClose,
  BileoPlus,
  BileoBusIcon,
  BileoPlaneIcon,
  BileoTrainIcon,
  BileoFerryIcon,
  BileoThumbUp,
  BileoThumbDown,
  BileoMessageSquare,
  BileoStar,
  BileoCheck,
} from './icons';
import { RouteItem, TransportType, ReviewItem, ReviewReply, User } from '../types';
import { CompanyLogo } from './CompanyLogo';

interface TicketExperienceScreenProps {
  route: RouteItem;
  initialPassengerCount?: number;
  currentUser?: User | null;
  onRequireAuth?: (reason: string, callback?: () => void) => boolean;
  onClose: () => void;
  onProceedToSeats: (route: RouteItem, passengerCount: number) => void;
}

const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    author: 'Mehmet Yılmaz',
    rating: 5,
    date: '18 Mayıs 2024',
    comment: 'Araç tertemizdi, koltuk arkası ekranlar ve prizler sorunsuz çalıştı. Mola tesisi de çok kaliteliydi. Kesinlikle tavsiye ederim.',
    travelType: '2+1 VIP Otobüs',
    verified: true,
    scores: { cleanliness: 5, punctuality: 5, comfort: 5, service: 5 },
    likes: 18,
    dislikes: 1,
    userVote: null,
    replies: [
      {
        id: 'rep-1-1',
        author: 'Pamukkale Müşteri Deneyimi',
        date: '19 Mayıs 2024',
        text: 'Değerli yolcumuz, seyahatinizden memnun kalmanıza çok sevindik. Bir sonraki yolculuğunuzda da sizi ağırlamaktan onur duyarız.',
        isCompany: true,
      }
    ]
  },
  {
    id: 'rev-2',
    author: 'Ayşe Kaya',
    rating: 5,
    date: '14 Mayıs 2024',
    comment: 'Tam vaktinde hareket etti ve tam söylenen saatte vardı. Muavin ve kaptan çok kibardı, sıcak çay ve kahve ikramı harikaydı.',
    travelType: 'Ekonomi Seferi',
    verified: true,
    scores: { cleanliness: 5, punctuality: 5, comfort: 4, service: 5 },
    likes: 14,
    dislikes: 0,
    userVote: null,
    replies: []
  },
  {
    id: 'rev-3',
    author: 'Caner Demir',
    rating: 4,
    date: '02 Mayıs 2024',
    comment: 'Diz mesafesi oldukça genişti, yol boyunca Wi-Fi üzerinden rahatça çalıştım. Bileo üzerinden almak da çok hızlı oldu.',
    travelType: 'İş Seyahati',
    verified: true,
    scores: { cleanliness: 4, punctuality: 5, comfort: 5, service: 4 },
    likes: 9,
    dislikes: 1,
    userVote: null,
    replies: []
  }
];

/**
 * Authentic real-world regulatory ticketing passenger limits per PNR transaction
 */
const getPassengerLimit = (type: TransportType, availableSeats?: number) => {
  let max = 5;
  let ruleDescription = 'Karayolu Mevzuatı Bireysel Limit: Maksimum 5 Bilet';
  
  switch (type) {
    case 'otobus':
      max = 5;
      ruleDescription = 'Karayolu Mevzuatı Bireysel Limit: Maksimum 5 Bilet';
      break;
    case 'tren':
      max = 5;
      ruleDescription = 'TCDD Taşımacılık Tek Seferde Maksimum 5 Koltuk';
      break;
    case 'ucak':
      max = 9;
      ruleDescription = 'IATA Havacılık Standartı: Maksimum 9 Yolcu';
      break;
    case 'feribot':
      max = 9;
      ruleDescription = 'Deniz Hatları Bireysel Limit: Maksimum 9 Bilet';
      break;
  }

  if (availableSeats && availableSeats > 0 && availableSeats < max) {
    return {
      max: availableSeats,
      ruleDescription: `Mevcut Boş Koltuk: ${availableSeats} Koltuk`,
    };
  }

  return { max, ruleDescription };
};

export const TicketExperienceScreen: React.FC<TicketExperienceScreenProps> = ({
  route,
  initialPassengerCount = 1,
  currentUser,
  onRequireAuth,
  onClose,
  onProceedToSeats,
}) => {
  const limitInfo = getPassengerLimit(route.transportType, route.availableSeats);
  const [passengerCount, setPassengerCount] = useState<number>(
    Math.max(1, Math.min(limitInfo.max, initialPassengerCount))
  );
  const [activePassengerTab, setActivePassengerTab] = useState<number>(0);
  const [showAllTicketsModal, setShowAllTicketsModal] = useState<boolean>(false);

  // Reviews & Rating System State
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(() => {
    return route.reviews && route.reviews.length > 0 ? route.reviews : DEFAULT_REVIEWS;
  });
  const [currentScore, setCurrentScore] = useState<number>(route.rating || 4.8);
  const [currentReviewCount, setCurrentReviewCount] = useState<number>(route.reviewCount || 1420);

  // New Review Modal State
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState<boolean>(false);
  const [newRating, setNewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [newAuthor, setNewAuthor] = useState<string>('Misafir Yolcu');
  const [newTravelType, setNewTravelType] = useState<string>('2+1 VIP Otobüs');
  const [newComment, setNewComment] = useState<string>('');
  const [newCleanliness, setNewCleanliness] = useState<number>(5);
  const [newPunctuality, setNewPunctuality] = useState<number>(5);
  const [newComfort, setNewComfort] = useState<number>(5);
  const [newService, setNewService] = useState<number>(5);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Open Add Review Modal with Authentication Check
  const handleOpenAddReview = () => {
    if (!currentUser && onRequireAuth) {
      onRequireAuth('Sefer değerlendirmesi yapabilmek ve puan verebilmek için lütfen giriş yapınız.', () => {
        setIsAddReviewModalOpen(true);
      });
      return;
    }
    setIsAddReviewModalOpen(true);
  };

  // Reply State
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const getTransportIcon = (type: TransportType) => {
    switch (type) {
      case 'otobus': return BileoBusIcon;
      case 'ucak': return BileoPlaneIcon;
      case 'tren': return BileoTrainIcon;
      case 'feribot': return BileoFerryIcon;
    }
  };

  const Icon = getTransportIcon(route.transportType);
  const totalPrice = route.price * passengerCount;

  const handlePassengerChange = (newVal: number) => {
    const clamped = Math.max(1, Math.min(limitInfo.max, newVal));
    setPassengerCount(clamped);
    if (activePassengerTab >= clamped) {
      setActivePassengerTab(clamped - 1);
    }
  };

  // Like / Dislike Handlers
  const handleVoteReview = (reviewId: string, voteType: 'like' | 'dislike') => {
    setReviewsList((prev) =>
      prev.map((r) => {
        if (r.id !== reviewId) return r;

        let curLikes = r.likes ?? 0;
        let curDislikes = r.dislikes ?? 0;
        let nextVote: 'like' | 'dislike' | null = voteType;

        if (r.userVote === voteType) {
          // Toggle off
          nextVote = null;
          if (voteType === 'like') curLikes = Math.max(0, curLikes - 1);
          if (voteType === 'dislike') curDislikes = Math.max(0, curDislikes - 1);
        } else {
          // Switching vote or first time
          if (r.userVote === 'like') curLikes = Math.max(0, curLikes - 1);
          if (r.userVote === 'dislike') curDislikes = Math.max(0, curDislikes - 1);

          if (voteType === 'like') curLikes += 1;
          if (voteType === 'dislike') curDislikes += 1;
        }

        return {
          ...r,
          likes: curLikes,
          dislikes: curDislikes,
          userVote: nextVote,
        };
      })
    );
  };

  // Submit Reply Handler
  const handleAddReply = (reviewId: string) => {
    if (!replyText.trim()) return;

    const replierName = currentUser
      ? `${currentUser.name} ${currentUser.surname}`.trim()
      : 'Doğrulanmış Yolcu';

    const newReply: ReviewReply = {
      id: `rep-${Date.now()}`,
      author: `${replierName} (Yolcu)`,
      date: 'Bugün',
      text: replyText.trim(),
      isCompany: false,
    };

    setReviewsList((prev) =>
      prev.map((r) => {
        if (r.id !== reviewId) return r;
        return {
          ...r,
          replies: [...(r.replies || []), newReply],
        };
      })
    );

    setReplyText('');
    setReplyingReviewId(null);
    showToast('Yanıtınız başarıyla yayınlandı.');
  };

  // Submit New Rating & Review Handler
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const authorName = currentUser
      ? `${currentUser.name} ${currentUser.surname}`.trim()
      : (newAuthor.trim() || 'Doğrulanmış Yolcu');

    const newReviewItem: ReviewItem = {
      id: `rev-${Date.now()}`,
      author: authorName,
      rating: newRating,
      date: 'Bugün',
      comment: newComment.trim(),
      travelType: newTravelType,
      verified: true,
      scores: {
        cleanliness: newCleanliness,
        punctuality: newPunctuality,
        comfort: newComfort,
        service: newService,
      },
      likes: 0,
      dislikes: 0,
      userVote: null,
      replies: [],
    };

    const updated = [newReviewItem, ...reviewsList];
    setReviewsList(updated);

    // Live rating update calculation
    const newTotalReviews = currentReviewCount + 1;
    const newAverage = Number(
      (((currentScore * currentReviewCount) + newRating) / newTotalReviews).toFixed(1)
    );
    setCurrentScore(newAverage);
    setCurrentReviewCount(newTotalReviews);

    // Reset Form
    setIsAddReviewModalOpen(false);
    setNewComment('');
    setNewRating(5);
    showToast('Değerlendirmeniz ve puanınız başarıyla kaydedildi!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1B18] flex flex-col selection:bg-bordeaux-700 selection:text-white animate-fadeIn font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-[#1E1B18] text-white px-5 py-3.5 rounded-2xl shadow-soft-lg flex items-center gap-3 animate-fadeIn border border-white/10">
          <BileoCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Sticky Navigation Bar */}
      <header className="sticky top-0 z-[100] bg-white shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Back Button & Company Logo Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.location.search.includes('carrier=')) {
                  try {
                    window.close();
                  } catch {
                    // ignore
                  }
                }
                onClose();
              }}
              type="button"
              className="text-[#1E1B18] hover:text-bordeaux-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer py-2 px-1 group"
            >
              <BileoArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Sefer Listesine Dön</span>
            </button>

            {/* Authentic Company Vector Logo */}
            <div className="flex items-center gap-3 pl-3 border-l border-[#E2DCD2]/60">
              <CompanyLogo
                company={route.company}
                transportType={route.transportType}
                size="md"
              />
              <div>
                <h1 className="text-sm sm:text-base font-extrabold text-[#1E1B18] tracking-tight flex items-center gap-2">
                  <span>{route.company}</span>
                  <span className="text-xs font-medium text-charcoal-muted hidden md:inline">({route.vehicleType})</span>
                </h1>
                <div className="flex items-center gap-2 text-xs text-charcoal-muted">
                  <span className="font-semibold text-[#1E1B18]">{route.from} → {route.to}</span>
                  <span>•</span>
                  <span>{route.date}</span>
                  <span>•</span>
                  <span className="font-semibold text-[#1E1B18]">
                    {route.departureTime}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Minimal 3-Step Breadcrumb */}
          <div className="hidden lg:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-extrabold text-bordeaux-700">
              <span className="w-4 h-4 rounded-full bg-bordeaux-700 text-white flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Bilet & Yolcu Sayısı</span>
            </div>
            <span className="text-charcoal-light">→</span>
            <div className="flex items-center gap-1.5 text-charcoal-muted font-medium">
              <span className="w-4 h-4 rounded-full bg-[#E8E1D5] text-charcoal-muted flex items-center justify-center text-[10px]">2</span>
              <span>Koltuk Seçimi</span>
            </div>
            <span className="text-charcoal-light">→</span>
            <div className="flex items-center gap-1.5 text-charcoal-muted font-medium">
              <span className="w-4 h-4 rounded-full bg-[#E8E1D5] text-charcoal-muted flex items-center justify-center text-[10px]">3</span>
              <span>Ödeme & PNR</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Layout */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Step Banner & Passenger Selector Bar */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-bordeaux-700 font-display block mb-1">
              1. Adım • Biniş Kartı & Sefer İnceleme
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E1B18] tracking-tight">
              Yolcu Sayısını Belirleyin & Detayları İnceleyin
            </h2>
          </div>

          {/* Ticket Counter & Regulatory Note */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 bg-[#FAF7F2] px-3 py-2 rounded-2xl self-start sm:self-auto">
              <span className="text-xs font-bold text-[#1E1B18]">Bilet / Yolcu Sayısı:</span>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePassengerChange(passengerCount - 1)}
                  disabled={passengerCount <= 1}
                  className="w-8 h-8 rounded-xl bg-white text-charcoal hover:bg-[#EAE4D8] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-sm font-black transition-colors cursor-pointer shadow-2xs"
                  title="Yolcu Azalt"
                >
                  —
                </button>

                <input
                  type="number"
                  min={1}
                  max={limitInfo.max}
                  value={passengerCount}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    if (!isNaN(parsed)) {
                      handlePassengerChange(parsed);
                    }
                  }}
                  className="w-10 text-center text-base font-extrabold text-bordeaux-700 bg-transparent focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => handlePassengerChange(passengerCount + 1)}
                  disabled={passengerCount >= limitInfo.max}
                  className="w-8 h-8 rounded-xl bg-white text-charcoal hover:bg-[#EAE4D8] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-sm font-black transition-colors cursor-pointer shadow-2xs"
                  title="Yolcu Arttır"
                >
                  <BileoPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <span className="text-[11px] text-charcoal-muted font-medium">
              ({limitInfo.ruleDescription})
            </span>
          </div>
        </div>

        {/* Primary 2-Column Booking Flow Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (7 cols): Passenger Switcher & Physical Boarding Pass */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Passenger Selector Tabs (When multiple passengers selected) */}
            {passengerCount > 1 && (
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
                <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl shadow-soft">
                  {Array.from({ length: passengerCount }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePassengerTab(idx)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                        activePassengerTab === idx
                          ? 'bg-bordeaux-700 text-white shadow-xs'
                          : 'text-charcoal-muted hover:text-charcoal'
                      }`}
                    >
                      {idx + 1}. Yolcu
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAllTicketsModal(true)}
                  className="text-xs font-bold text-bordeaux-700 hover:text-bordeaux-900 transition-colors cursor-pointer whitespace-nowrap py-1"
                >
                  Tüm Biletleri Listele ({passengerCount}) →
                </button>
              </div>
            )}

            {/* Boarding Pass Physical Card */}
            <div className="w-full bg-white rounded-3xl overflow-hidden shadow-soft transition-all duration-300">
              
              {/* Top Section: Bordeaux Boarding Header */}
              <div className="bg-bordeaux-700 text-white p-6 sm:p-7 relative overflow-hidden rounded-t-3xl">
                
                <div className="flex items-center justify-between mb-4 text-xs font-bold text-white/90">
                  <span className="uppercase tracking-wider">
                    {activePassengerTab + 1}. Yolcu Biniş Kartı ({activePassengerTab + 1}/{passengerCount})
                  </span>
                  <span className="font-mono">TR-{route.id.toUpperCase()}-0{activePassengerTab + 1}</span>
                </div>

                <div className="grid grid-cols-12 items-center gap-2 relative z-10">
                  
                  {/* Departure City */}
                  <div className="col-span-5">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {route.from}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/80 font-medium mt-0.5 truncate max-w-[200px]">
                      {route.fromTerminal}
                    </p>
                  </div>

                  {/* Center Route Line with Mode Icon */}
                  <div className="col-span-2 flex flex-col items-center justify-center">
                    <div className="w-full flex items-center justify-center gap-1 text-white/70 text-xs">
                      <span className="h-[1px] flex-1 bg-white/40 border-dashed" />
                      <Icon className="w-4 h-4 text-white flex-shrink-0" />
                      <span className="h-[1px] flex-1 bg-white/40 border-dashed" />
                    </div>
                    <span className="text-[10px] text-white/90 font-bold mt-1">
                      {route.duration}
                    </span>
                  </div>

                  {/* Arrival City */}
                  <div className="col-span-5 text-right">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {route.to}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/80 font-medium mt-0.5 truncate max-w-[200px] ml-auto">
                      {route.toTerminal}
                    </p>
                  </div>

                </div>

              </div>

              {/* Perforated Tear Line with Semicircular Notches */}
              <div className="relative h-6 bg-white flex items-center justify-between px-3">
                <div className="w-6 h-6 -ml-6 rounded-full bg-[#FAF7F2]" />
                <div className="flex-1 border-b-2 border-dashed border-[#E2DCD2] mx-2" />
                <div className="w-6 h-6 -mr-6 rounded-full bg-[#FAF7F2]" />
              </div>

              {/* Bottom Section: White Body */}
              <div className="p-6 sm:p-7 bg-white space-y-6 rounded-b-3xl">
                
                {/* 3 Main Data Columns */}
                <div className="grid grid-cols-3 gap-4 pb-4">
                  
                  <div>
                    <span className="text-xs font-semibold text-charcoal-muted block">
                      {route.date}
                    </span>
                    <span className="text-xl font-extrabold text-[#1E1B18] mt-0.5 block">
                      {route.departureTime}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-charcoal-muted block">
                      Koltuk No
                    </span>
                    <span className="text-base font-extrabold text-bordeaux-700 mt-0.5 block">
                      Adım 2'de Seçilecek
                    </span>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs font-semibold text-charcoal-muted block mb-1">
                      Taşıyıcı Firma
                    </span>
                    <div className="flex items-center gap-2">
                      <CompanyLogo
                        company={route.company}
                        transportType={route.transportType}
                        size="sm"
                      />
                      <span className="text-sm font-extrabold text-[#1E1B18]">
                        {route.company}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Footer Row: PNR, Passenger, Barcode & Price */}
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-4 border-t border-[#E2DCD2]/40">
                  
                  <div className="flex items-center gap-3 text-charcoal-muted font-semibold">
                    <span>PNR: TR-{route.id.toUpperCase()}-0{activePassengerTab + 1}</span>
                    <span>•</span>
                    <span className="text-[#1E1B18] font-bold">
                      Yolcu {activePassengerTab + 1}/{passengerCount}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 ml-auto">
                    {/* Authentic Barcode */}
                    <div className="flex items-center gap-[2.5px] h-8 px-1.5 bg-[#FAF7F2] rounded-md overflow-hidden">
                      {[3, 1, 4, 1, 2, 4, 1, 3, 1, 4, 2, 1, 3, 1, 4, 1, 3, 2, 1, 4, 1, 3].map((w, bIdx) => (
                        <div
                          key={bIdx}
                          className="h-full bg-[#1E1B18]"
                          style={{ width: `${w}px` }}
                        />
                      ))}
                    </div>

                    <span className="text-2xl font-extrabold text-[#1E1B18]">
                      {route.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                    </span>
                  </div>

                </div>

              </div>

            </div>

            {/* Travel Guarantees Ribbon */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-3 max-w-xl mx-auto text-xs text-charcoal-muted font-medium">
              <span>Koltuk Seçim Garantisi</span>
              <span>•</span>
              <span>30 KG Bagaj Hakkı</span>
              <span>•</span>
              <span>%100 İade Güvencesi</span>
            </div>

          </div>

          {/* Right Column (5 cols): High-End Editorial Price & Action Card */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-soft space-y-5">
              <div className="pb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-bordeaux-700 block mb-0.5">
                  Rezervasyon Özeti
                </span>
                <h3 className="text-lg font-extrabold text-[#1E1B18]">
                  Sefer & Ücret Dökümü
                </h3>
              </div>

              {/* Itinerary Details */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-charcoal-muted">
                  <span>Taşıyıcı Firma:</span>
                  <div className="flex items-center gap-2">
                    <CompanyLogo company={route.company} transportType={route.transportType} size="sm" />
                    <span className="font-bold text-[#1E1B18]">{route.company}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-charcoal-muted">
                  <span>Güzergah:</span>
                  <span className="font-bold text-[#1E1B18]">{route.from} → {route.to}</span>
                </div>
                <div className="flex justify-between items-center text-charcoal-muted">
                  <span>Tarih & Saat:</span>
                  <span className="font-bold text-[#1E1B18]">{route.date} • {route.departureTime}</span>
                </div>
                <div className="flex justify-between items-center text-charcoal-muted">
                  <span>Bilet Adedi:</span>
                  <span className="font-black text-bordeaux-700">{passengerCount} Yolcu</span>
                </div>
              </div>

              {/* Price Calculation Box */}
              <div className="pt-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-charcoal-muted">
                  <span>Birim Bilet Ücreti:</span>
                  <span className="font-medium text-[#1E1B18]">
                    {route.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL x {passengerCount}
                  </span>
                </div>
                <div className="flex justify-between items-center text-charcoal-muted">
                  <span>Hizmet & Rezervasyon Bedeli:</span>
                  <span className="font-extrabold text-emerald-700">0 TL (Ücretsiz)</span>
                </div>

                <div className="pt-3.5 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-charcoal-muted block">Ödenecek Toplam Tutar</span>
                    <span className="text-3xl font-extrabold text-[#1E1B18]">
                      {totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    Net Fiyat
                  </span>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] text-xs text-charcoal-muted flex items-start gap-2.5">
                <BileoShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  Sefer Güvencesi: Sefer saatine kadar %100 kesintisiz anında para iadesi hakkınız saklıdır.
                </span>
              </div>

              {/* Primary Next Action CTA */}
              <button
                type="button"
                onClick={() => onProceedToSeats(route, passengerCount)}
                className="w-full py-4 rounded-2xl bg-bordeaux-700 hover:bg-bordeaux-900 text-white font-extrabold text-sm shadow-bordeaux hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>KOLTUK SEÇİMİNE İLERLE ({passengerCount} KOLTUK)</span>
                <BileoArrowRight className="w-4 h-4" />
              </button>

            </div>

          </div>

        </div>

        {/* Reviews, Ratings, Like/Dislike & Replies Section */}
        <section className="pt-10 border-t border-[#E2DCD2]/60 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-bordeaux-700 block mb-0.5">
                Yolcu Deneyimi & Donanım
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E1B18] tracking-tight">
                Değerlendirmeler & Araç Özellikleri
              </h2>
            </div>

            {/* Puan ve Yorum Ekle Butonu */}
            <button
              type="button"
              onClick={handleOpenAddReview}
              className="px-4 py-2.5 rounded-2xl bg-white text-xs font-black text-bordeaux-700 hover:text-bordeaux-900 shadow-soft hover:shadow-soft-lg transition-all flex items-center gap-2 cursor-pointer border border-[#E2DCD2]/60 self-start sm:self-auto"
            >
              <BileoStar className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Seferi Değerlendir & Yorum Yaz</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left: Overall Rating & Score Breakdown (5 cols) */}
            <div className="lg:col-span-5 space-y-7">
              
              <div className="flex items-center gap-5 pb-5">
                <div className="flex flex-col items-start justify-center">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-[#1E1B18] font-display leading-none">
                      {currentScore}
                    </span>
                    <span className="text-xs font-bold text-charcoal-muted">/ 5.0</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 mt-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <BileoStar
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(currentScore) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1E1B18]">Genel Sefer Puanı</h3>
                  <p className="text-xs text-charcoal-muted mt-0.5">
                    {currentReviewCount} Doğrulanmış Yolcu Değerlendirmesi
                  </p>
                </div>
              </div>

              {/* Category Scores */}
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-[#1E1B18] mb-1.5">
                    <span className="font-semibold">Araç Temizliği & Hijyen</span>
                    <span className="font-bold text-bordeaux-700">4.9 / 5.0</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EFE8DC] overflow-hidden">
                    <div className="h-full bg-bordeaux-700 rounded-full" style={{ width: '98%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#1E1B18] mb-1.5">
                    <span className="font-semibold">Zamanında Kalkış & Varış</span>
                    <span className="font-bold text-bordeaux-700">4.8 / 5.0</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EFE8DC] overflow-hidden">
                    <div className="h-full bg-bordeaux-700 rounded-full" style={{ width: '96%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#1E1B18] mb-1.5">
                    <span className="font-semibold">Koltuk Konforu & Diz Mesafesi</span>
                    <span className="font-bold text-bordeaux-700">4.7 / 5.0</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EFE8DC] overflow-hidden">
                    <div className="h-full bg-bordeaux-700 rounded-full" style={{ width: '94%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#1E1B18] mb-1.5">
                    <span className="font-semibold">Personel & İkram Servisi</span>
                    <span className="font-bold text-bordeaux-700">4.9 / 5.0</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EFE8DC] overflow-hidden">
                    <div className="h-full bg-bordeaux-700 rounded-full" style={{ width: '98%' }} />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="pt-6 space-y-3">
                <span className="text-xs font-bold text-[#1E1B18] block">Araç Donanımı & Konfor</span>
                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 text-xs text-charcoal font-medium">
                  <span>220V & USB Priz</span>
                  <span className="text-charcoal-muted">•</span>
                  <span>Hızlı Wi-Fi</span>
                  <span className="text-charcoal-muted">•</span>
                  <span>Koltuk Ekranı</span>
                  <span className="text-charcoal-muted">•</span>
                  <span>Sıcak İkram</span>
                </div>
              </div>

            </div>

            {/* Right: Reviews List with Like/Dislike and Replies (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {reviewsList.map((rev) => (
                <div
                  key={rev.id}
                  className="pb-6 border-b border-[#E2DCD2]/40 last:border-b-0 space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white text-[#1E1B18] font-black text-xs flex items-center justify-center shadow-2xs border border-[#E2DCD2]/60">
                        {rev.author.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1E1B18]">{rev.author}</span>
                          {rev.verified && (
                            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                              <BileoCheckCircle className="w-3 h-3" />
                              <span>Doğrulanmış Yolcu</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-charcoal-muted">{rev.date} • {rev.travelType}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <BileoStar
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[#1E1B18] leading-relaxed pl-12">
                    "{rev.comment}"
                  </p>

                  {/* Actions Row: Likes, Dislikes & Reply Button */}
                  <div className="pl-12 flex items-center gap-4 text-xs">
                    
                    {/* Like Button */}
                    <button
                      type="button"
                      onClick={() => handleVoteReview(rev.id, 'like')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                        rev.userVote === 'like'
                          ? 'bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200'
                          : 'text-charcoal-muted hover:text-emerald-700 hover:bg-emerald-50/50'
                      }`}
                      title="Beğen"
                    >
                      <BileoThumbUp className="w-3.5 h-3.5" fill={rev.userVote === 'like' ? 'currentColor' : 'none'} />
                      <span className="text-[11px] font-bold">{rev.likes ?? 0}</span>
                    </button>

                    {/* Dislike Button */}
                    <button
                      type="button"
                      onClick={() => handleVoteReview(rev.id, 'dislike')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                        rev.userVote === 'dislike'
                          ? 'bg-rose-50 text-rose-700 font-extrabold border border-rose-200'
                          : 'text-charcoal-muted hover:text-rose-700 hover:bg-rose-50/50'
                      }`}
                      title="Beğenme"
                    >
                      <BileoThumbDown className="w-3.5 h-3.5" fill={rev.userVote === 'dislike' ? 'currentColor' : 'none'} />
                      <span className="text-[11px] font-bold">{rev.dislikes ?? 0}</span>
                    </button>

                    {/* Reply Toggle Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingReviewId(replyingReviewId === rev.id ? null : rev.id);
                        setReplyText('');
                      }}
                      className="flex items-center gap-1.5 text-charcoal-muted hover:text-bordeaux-700 px-2 py-1 rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer text-[11px] font-bold"
                    >
                      <BileoMessageSquare className="w-3.5 h-3.5" />
                      <span>Yanıtla {rev.replies && rev.replies.length > 0 ? `(${rev.replies.length})` : ''}</span>
                    </button>
                  </div>

                  {/* Inline Reply Input Box */}
                  {replyingReviewId === rev.id && (
                    <div className="ml-12 p-3 bg-white rounded-2xl shadow-soft space-y-2.5 animate-fadeIn">
                      <div className="flex items-center justify-between text-[11px] font-bold text-charcoal-muted">
                        <span>{rev.author} kullanıcısının yorumuna yanıt veriyorsunuz:</span>
                        <button
                          type="button"
                          onClick={() => setReplyingReviewId(null)}
                          className="text-charcoal-muted hover:text-charcoal cursor-pointer"
                        >
                          İptal
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Yanıtınızı buraya yazın..."
                        className="w-full p-2.5 bg-[#FAF7F2] rounded-xl text-xs text-[#1E1B18] placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-bordeaux-700 resize-none"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={!replyText.trim()}
                          onClick={() => handleAddReply(rev.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-bordeaux-700 hover:bg-bordeaux-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Yanıtı Gönder
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Threaded Nested Replies List */}
                  {rev.replies && rev.replies.length > 0 && (
                    <div className="ml-12 pl-4 border-l-2 border-[#E2DCD2]/60 space-y-3 pt-1">
                      {rev.replies.map((rep) => (
                        <div key={rep.id} className="bg-white/80 p-3 rounded-2xl space-y-1 shadow-2xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-[#1E1B18]">{rep.author}</span>
                              {rep.isCompany && (
                                <span className="px-1.5 py-0.5 rounded-md bg-bordeaux-50 text-bordeaux-700 text-[10px] font-black">
                                  Firma Yetkilisi
                                </span>
                              )}
                            </div>
                            <span className="text-charcoal-muted text-[10px]">{rep.date}</span>
                          </div>
                          <p className="text-xs text-charcoal leading-relaxed">
                            {rep.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ))}
            </div>

          </div>
        </section>

      </main>

      {/* New Rating & Review Submission Modal */}
      {isAddReviewModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF7F2] w-full max-w-lg rounded-3xl shadow-soft-lg flex flex-col overflow-hidden animate-scaleIn">
            
            {/* Modal Header */}
            <div className="p-6 bg-white flex items-center justify-between border-b border-[#E2DCD2]/60">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-bordeaux-700 block">
                  Yolcu Deneyimi
                </span>
                <h3 className="text-lg font-extrabold text-[#1E1B18]">
                  Seferi Değerlendir & Puan Ver
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsAddReviewModalOpen(false)}
                className="w-9 h-9 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
                title="Kapat"
              >
                <BileoClose className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitReview} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
              
              {/* Star Rating Selector */}
              <div className="space-y-2 text-center bg-white p-4 rounded-2xl shadow-soft">
                <span className="text-xs font-bold text-charcoal-muted block">Genel Sefer Memnuniyeti</span>
                
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                    >
                      <BileoStar
                        className={`w-7 h-7 ${
                          star <= (hoverRating || newRating)
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <span className="text-xs font-extrabold text-bordeaux-700 block">
                  {newRating === 5 && '5 - Mükemmel Deneyim'}
                  {newRating === 4 && '4 - Çok İyi'}
                  {newRating === 3 && '3 - Ortalama'}
                  {newRating === 2 && '2 - Geliştirilmeli'}
                  {newRating === 1 && '1 - Yetersiz'}
                </span>
              </div>

              {/* Sub Categories Sliders */}
              <div className="bg-white p-4 rounded-2xl shadow-soft space-y-3 text-xs">
                <span className="font-extrabold text-[#1E1B18] block pb-1 border-b border-[#E2DCD2]/40">
                  Kategori Puanları
                </span>

                <div className="flex justify-between items-center">
                  <span className="text-charcoal-muted font-medium">Araç Temizliği & Hijyen</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNewCleanliness(n)}
                        className={`w-6 h-6 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                          n <= newCleanliness ? 'bg-bordeaux-700 text-white' : 'bg-[#FAF7F2] text-charcoal-muted'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-charcoal-muted font-medium">Zamanında Kalkış & Varış</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNewPunctuality(n)}
                        className={`w-6 h-6 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                          n <= newPunctuality ? 'bg-bordeaux-700 text-white' : 'bg-[#FAF7F2] text-charcoal-muted'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-charcoal-muted font-medium">Koltuk Konforu</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNewComfort(n)}
                        className={`w-6 h-6 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                          n <= newComfort ? 'bg-bordeaux-700 text-white' : 'bg-[#FAF7F2] text-charcoal-muted'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-charcoal-muted font-medium">Personel & İkram Servisi</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNewService(n)}
                        className={`w-6 h-6 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                          n <= newService ? 'bg-bordeaux-700 text-white' : 'bg-[#FAF7F2] text-charcoal-muted'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Author & Travel Type */}
              <div className="space-y-3 text-xs">
                {currentUser ? (
                  <div className="bg-white p-3.5 rounded-2xl flex items-center justify-between shadow-soft border border-[#E2DCD2]/40">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-bordeaux-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {currentUser.avatarInitials || `${currentUser.name[0] || 'S'}${currentUser.surname[0] || 'Y'}`}
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-charcoal-muted block">
                          Yorum Yapan Yolcu (Giriş Yapıldı)
                        </span>
                        <span className="text-sm font-black text-[#1E1B18]">
                          {currentUser.name} {currentUser.surname}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                      <BileoCheck className="w-3 h-3 text-emerald-600" />
                      <span>Onaylı Yolcu</span>
                    </span>
                  </div>
                ) : (
                  <div>
                    <label className="block text-charcoal-muted font-bold mb-1">Adınız Soyadınız</label>
                    <input
                      type="text"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      className="w-full bg-white p-2.5 rounded-xl text-xs font-semibold text-charcoal focus:outline-none shadow-soft"
                      placeholder="Adınız Soyadınız"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-charcoal-muted font-bold mb-1">Seyahat Tipi</label>
                  <select
                    value={newTravelType}
                    onChange={(e) => setNewTravelType(e.target.value)}
                    className="w-full bg-white p-2.5 rounded-xl text-xs font-semibold text-charcoal focus:outline-none shadow-soft cursor-pointer"
                  >
                    <option value="2+1 VIP Otobüs">2+1 VIP Otobüs</option>
                    <option value="Ekonomi Seferi">Ekonomi Seferi</option>
                    <option value="İş Seyahati">İş Seyahati</option>
                    <option value="Aile Tatili">Aile Tatili</option>
                    <option value="Kişisel Gezi">Kişisel Gezi</option>
                  </select>
                </div>
              </div>

              {/* Comment Text Area */}
              <div className="space-y-1 text-xs">
                <label className="block text-charcoal-muted font-bold">Yolculuk Deneyiminiz & Yorumunuz</label>
                <textarea
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Yolculuk nasıldı? Araç durumu, ikramlar ve personelle ilgili deneyimlerinizi paylaşın..."
                  className="w-full bg-white p-3 rounded-2xl text-xs text-charcoal placeholder:text-charcoal-muted focus:outline-none shadow-soft resize-none"
                  required
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="w-full py-3.5 rounded-2xl bg-bordeaux-700 hover:bg-bordeaux-900 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase tracking-wider shadow-bordeaux transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Değerlendirmeyi Yayınla</span>
                  <BileoCheck className="w-4 h-4" />
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Dedicated All Tickets Modal (Alt Alta Listelenen Tam Biniş Kartı Listesi) */}
      {showAllTicketsModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF7F2] w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-soft-lg flex flex-col overflow-hidden animate-scaleIn">
            
            {/* Modal Header */}
            <div className="p-6 bg-white flex items-center justify-between border-b border-[#E2DCD2]/60">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-bordeaux-700 block">
                  Bilet Önizleme
                </span>
                <h3 className="text-lg font-extrabold text-[#1E1B18]">
                  Tüm Biniş Kartları ({passengerCount} Yolcu)
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowAllTicketsModal(false)}
                className="w-9 h-9 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
                title="Kapat"
              >
                <BileoClose className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable List */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {Array.from({ length: passengerCount }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl overflow-hidden shadow-soft"
                >
                  {/* Top Bordeaux Bar */}
                  <div className="bg-bordeaux-700 text-white p-5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider block">
                        Yolcu {idx + 1} / {passengerCount}
                      </span>
                      <h4 className="text-base font-extrabold text-white">
                        {route.from} → {route.to}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-white/90">
                      {route.date} • {route.departureTime}
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-charcoal-muted block">PNR Numarası:</span>
                      <span className="font-mono font-bold text-[#1E1B18]">
                        TR-{route.id.toUpperCase()}-0{idx + 1}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-charcoal-muted block">Koltuk Durumu:</span>
                      <span className="font-bold text-bordeaux-700">
                        Adım 2'de Belirlenecek
                      </span>
                    </div>

                    <div className="text-right space-y-1 ml-auto">
                      <span className="text-charcoal-muted block">Bilet Ücreti:</span>
                      <span className="text-base font-extrabold text-[#1E1B18]">
                        {route.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-white flex items-center justify-between border-t border-[#E2DCD2]/60">
              <span className="text-xs font-medium text-charcoal-muted">
                Toplam: {totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL ({passengerCount} Bilet)
              </span>

              <button
                type="button"
                onClick={() => setShowAllTicketsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-bordeaux-700 hover:bg-bordeaux-900 text-white font-extrabold text-xs transition-colors cursor-pointer"
              >
                Geri Dön
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
