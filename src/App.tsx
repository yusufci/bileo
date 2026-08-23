import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { LiveTransitTicker } from './components/LiveTransitTicker';
import { HeroSection } from './components/HeroSection';
import { PartnerLogosRibbon, FooterPartnerRibbon } from './components/PartnerLogosRibbon';
import { FeaturedCarriersShowcase } from './components/FeaturedCarriersShowcase';
import { DiscoveryCarousel } from './components/DiscoveryCarousel';
import { SearchResults } from './components/SearchResults';
import { WhyBileoSection } from './components/WhyBileoSection';
import { TicketExperienceScreen } from './components/TicketExperienceScreen';
import { CarrierDetailScreen } from './components/CarrierDetailScreen';
import { OfflineBanner } from './components/common/OfflineBanner';
import { ToastNotification, ToastMessage } from './components/common/ToastNotification';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { sound } from './utils/sound';

// Lazy Loaded Modals for Ultra-Fast Initial Page Load & Minimal Bundle Size
const SeatSelectionModal = lazy(() => import('./components/SeatSelectionModal').then(m => ({ default: m.SeatSelectionModal })));
const CheckoutModal = lazy(() => import('./components/CheckoutModal').then(m => ({ default: m.CheckoutModal })));
const TicketWalletModal = lazy(() => import('./components/TicketWalletModal').then(m => ({ default: m.TicketWalletModal })));
const RefundModal = lazy(() => import('./components/RefundModal').then(m => ({ default: m.RefundModal })));
const PnrQueryModal = lazy(() => import('./components/PnrQueryModal').then(m => ({ default: m.PnrQueryModal })));
const PriceAlertModal = lazy(() => import('./components/PriceAlertModal').then(m => ({ default: m.PriceAlertModal })));
const TerminalGuideModal = lazy(() => import('./components/TerminalGuideModal').then(m => ({ default: m.TerminalGuideModal })));
const FleetExperienceModal = lazy(() => import('./components/FleetExperienceModal').then(m => ({ default: m.FleetExperienceModal })));
const FareMatrixModal = lazy(() => import('./components/FareMatrixModal').then(m => ({ default: m.FareMatrixModal })));
const EcoCarbonModal = lazy(() => import('./components/EcoCarbonModal').then(m => ({ default: m.EcoCarbonModal })));
const KeyboardShortcutsModal = lazy(() => import('./components/KeyboardShortcutsModal').then(m => ({ default: m.KeyboardShortcutsModal })));
const CurrencyConverterModal = lazy(() => import('./components/CurrencyConverterModal').then(m => ({ default: m.CurrencyConverterModal })));
const LuggageAllowanceModal = lazy(() => import('./components/LuggageAllowanceModal').then(m => ({ default: m.LuggageAllowanceModal })));
const DestinationWeatherModal = lazy(() => import('./components/DestinationWeatherModal').then(m => ({ default: m.DestinationWeatherModal })));
const ShuttleTimetableModal = lazy(() => import('./components/ShuttleTimetableModal').then(m => ({ default: m.ShuttleTimetableModal })));
const PetTravelModal = lazy(() => import('./components/PetTravelModal').then(m => ({ default: m.PetTravelModal })));
const TravelInsuranceModal = lazy(() => import('./components/TravelInsuranceModal').then(m => ({ default: m.TravelInsuranceModal })));
const TaxiEstimatorModal = lazy(() => import('./components/TaxiEstimatorModal').then(m => ({ default: m.TaxiEstimatorModal })));
const RestStopGuideModal = lazy(() => import('./components/RestStopGuideModal').then(m => ({ default: m.RestStopGuideModal })));
const DiscountsGuideModal = lazy(() => import('./components/DiscountsGuideModal').then(m => ({ default: m.DiscountsGuideModal })));
const LuggageStorageModal = lazy(() => import('./components/LuggageStorageModal').then(m => ({ default: m.LuggageStorageModal })));
const LiveJourneyTrackerModal = lazy(() => import('./components/LiveJourneyTrackerModal').then(m => ({ default: m.LiveJourneyTrackerModal })));
const CateringMenuModal = lazy(() => import('./components/CateringMenuModal').then(m => ({ default: m.CateringMenuModal })));
const AccessibilityGuideModal = lazy(() => import('./components/AccessibilityGuideModal').then(m => ({ default: m.AccessibilityGuideModal })));
const StudentTravelModal = lazy(() => import('./components/StudentTravelModal').then(m => ({ default: m.StudentTravelModal })));
const OnboardTechModal = lazy(() => import('./components/OnboardTechModal').then(m => ({ default: m.OnboardTechModal })));
const LostAndFoundModal = lazy(() => import('./components/LostAndFoundModal').then(m => ({ default: m.LostAndFoundModal })));
const HighwayTollModal = lazy(() => import('./components/HighwayTollModal').then(m => ({ default: m.HighwayTollModal })));
const GroupBookingModal = lazy(() => import('./components/GroupBookingModal').then(m => ({ default: m.GroupBookingModal })));
const MedicalTravelModal = lazy(() => import('./components/MedicalTravelModal').then(m => ({ default: m.MedicalTravelModal })));
const RouteStopsModal = lazy(() => import('./components/RouteStopsModal').then(m => ({ default: m.RouteStopsModal })));
const PassengerRightsModal = lazy(() => import('./components/PassengerRightsModal').then(m => ({ default: m.PassengerRightsModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
import {
  TransportType,
  SearchFilterState,
  RouteItem,
  BookingTicket,
  SeatGender,
  SeatItem,
  RefundDetails,
  DiscoveryCardItem,
  User,
} from './types';
import { POPULAR_ROUTES, SEED_TICKETS } from './data/mockData';

export function App() {
  const [searchState, setSearchState] = useState<SearchFilterState>({
    transportType: 'otobus',
    fromCity: 'İstanbul',
    toCity: 'Ankara',
    departureDate: '24 Mayıs Cuma',
    passengerCount: 1,
    maxPrice: 3000,
    selectedCompanies: [],
    departureTimeRange: 'all',
    onlyDirect: true,
    seatTypePreference: 'all',
    sortBy: 'cheapest',
  });

  const [routes] = useState<RouteItem[]>(POPULAR_ROUTES);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('sefer_auth_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState<string | undefined>(undefined);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // PNR Query Modal State
  const [isPnrQueryOpen, setIsPnrQueryOpen] = useState(false);

  // Terminal Guide Modal State
  const [isTerminalGuideOpen, setIsTerminalGuideOpen] = useState(false);

  // Fleet Experience Modal State
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);

  // Multimodal Fare Matrix Modal State
  const [isFareMatrixOpen, setIsFareMatrixOpen] = useState(false);

  // Eco Carbon Footprint Modal State
  const [isEcoModalOpen, setIsEcoModalOpen] = useState(false);

  // Keyboard Shortcuts Modal State
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Multi-Currency Converter Modal State
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  // Luggage Allowance Modal State
  const [isLuggageModalOpen, setIsLuggageModalOpen] = useState(false);

  // Destination Weather Modal State
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);

  // Shuttle Timetable Modal State
  const [isShuttleModalOpen, setIsShuttleModalOpen] = useState(false);

  // Pet Travel Regulations Modal State
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);

  // Travel Insurance & Trip Protection Modal State
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);

  // Taxi & Ride Fare Estimator Modal State
  const [isTaxiModalOpen, setIsTaxiModalOpen] = useState(false);

  // Highway Rest Stop & Food Guide Modal State
  const [isRestStopModalOpen, setIsRestStopModalOpen] = useState(false);

  // Student, Senior, Military & Special Discounts Modal State
  const [isDiscountsModalOpen, setIsDiscountsModalOpen] = useState(false);

  // Left Luggage & Storage Locker Modal State
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  // Live GPS Journey Tracker Modal State
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);

  // Special Dietary & In-Transit Catering Menu Modal State
  const [isCateringModalOpen, setIsCateringModalOpen] = useState(false);

  // Reduced Mobility & Accessibility Guide Modal State
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);

  // Student & Youth Travel Club Modal State
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // Onboard Power Outlets, Wi-Fi & Tech Specs Modal State
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);

  // Lost & Found Luggage & Belongings Tracking Modal State
  const [isLostFoundModalOpen, setIsLostFoundModalOpen] = useState(false);

  // Highway Tolls, Bridges & HGS Estimator Modal State
  const [isHighwayModalOpen, setIsHighwayModalOpen] = useState(false);

  // Group & Corporate Charter Booking Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Travel Health, Medication & Medical Clearance Modal State
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);

  // Route Intermediate Stops & Timeline Modal State
  const [isRouteStopsModalOpen, setIsRouteStopsModalOpen] = useState(false);

  // Passenger Legal Rights, Delays & Compensation Modal State
  const [isRightsModalOpen, setIsRightsModalOpen] = useState(false);

  // Price Alert Modal State
  const [priceAlertData, setPriceAlertData] = useState<{ isOpen: boolean; minPrice: number }>({
    isOpen: false,
    minPrice: 400,
  });

  // Toast Notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (title: string, description?: string, type: 'success' | 'error' | 'info' | 'promo' = 'info', duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [...prev, { id, title, description, type, duration }]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const [tickets, setTickets] = useState<BookingTicket[]>(() => {
    try {
      const stored = localStorage.getItem('bileo_wallet_tickets');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return SEED_TICKETS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('bileo_wallet_tickets', JSON.stringify(tickets));
    } catch {
      // ignore
    }
  }, [tickets]);

  const [selectedRouteForExperience, setSelectedRouteForExperience] = useState<RouteItem | null>(null);
  const [selectedRouteForSeat, setSelectedRouteForSeat] = useState<{
    route: RouteItem;
    passengerCount: number;
  } | null>(null);
  const [checkoutData, setCheckoutData] = useState<{
    route: RouteItem;
    selectedSeats: (number | string)[];
    seatGenders: Record<string | number, 'male' | 'female'>;
    selectedSeatObjects?: SeatItem[];
    gender?: SeatGender;
  } | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [refundTicket, setRefundTicket] = useState<BookingTicket | null>(null);
  const [mobileActiveTab, setMobileActiveTab] = useState<'search' | 'discover' | 'wallet'>('search');
  const [selectedCarrierForDetail, setSelectedCarrierForDetail] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const c = params.get('carrier');
      return c ? decodeURIComponent(c) : null;
    } catch {
      return null;
    }
  });

  /**
   * Gatekeeper Guard: Checks if user is authenticated.
   * If not, opens AuthModal with the specified reason and queues the action.
   */
  const requireAuth = (reason: string, actionOnSuccess?: () => void): boolean => {
    if (currentUser) {
      if (actionOnSuccess) actionOnSuccess();
      return true;
    }
    setAuthPromptReason(reason);
    if (actionOnSuccess) {
      setPendingAction(() => actionOnSuccess);
    } else {
      setPendingAction(null);
    }
    setIsAuthModalOpen(true);
    return false;
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('sefer_auth_user', JSON.stringify(user));
    } catch {
      // ignore
    }

    showToast('Giriş Başarılı', `Hoş geldiniz, ${user.name}!`, 'success');

    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      setTimeout(() => {
        action();
      }, 150);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('sefer_auth_user');
    } catch {
      // ignore
    }
    setIsWalletOpen(false);
    setSelectedRouteForExperience(null);
    setSelectedRouteForSeat(null);
    setCheckoutData(null);
    setSelectedCarrierForDetail(null);
    showToast('Çıkış Yapıldı', 'Oturumunuz güvenli bir şekilde kapatıldı.', 'info');
  };

  const handleSelectCarrierDirect = (carrierName: string) => {
    const url = `${window.location.origin}${window.location.pathname}?carrier=${encodeURIComponent(carrierName)}`;
    window.open(url, '_blank');
  };

  const handleUpdateSearchState = (updates: Partial<SearchFilterState>) => {
    setSearchState((prev) => ({ ...prev, ...updates }));
  };

  const handlePerformSearch = () => {
    if (
      !requireAuth(
        'Sefer aramak ve sefer saatlerini listelemek için lütfen giriş yapın veya kayıt olun.',
        () => {
          const resultsElement = document.getElementById('search-results-section');
          if (resultsElement) {
            resultsElement.scrollIntoView({ behavior: 'smooth' });
          }
        }
      )
    ) {
      return;
    }

    const resultsElement = document.getElementById('search-results-section');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectDiscoveryRoute = (card: DiscoveryCardItem) => {
    if (
      !requireAuth(
        'Öne çıkan rotaları incelemek ve biletinizi almak için lütfen giriş yapın.',
        () => {
          setSearchState((prev) => ({
            ...prev,
            transportType: card.transportType,
            fromCity: card.from,
            toCity: card.to,
            departureDate: card.date,
          }));

          const match =
            routes.find(
              (r) =>
                r.from === card.from &&
                r.to === card.to &&
                r.transportType === card.transportType
            ) || routes[0];

          setSelectedRouteForExperience(match);
        }
      )
    ) {
      return;
    }

    setSearchState((prev) => ({
      ...prev,
      transportType: card.transportType,
      fromCity: card.from,
      toCity: card.to,
      departureDate: card.date,
    }));

    const match =
      routes.find(
        (r) =>
          r.from === card.from &&
          r.to === card.to &&
          r.transportType === card.transportType
      ) || routes[0];

    setSelectedRouteForExperience(match);
  };

  const handleSelectRouteFromResults = (route: RouteItem) => {
    if (
      !requireAuth(
        'Sefer detaylarını görüntülemek ve koltuk seçmek için lütfen giriş yapın.',
        () => {
          setSelectedRouteForExperience(route);
        }
      )
    ) {
      return;
    }

    setSelectedRouteForExperience(route);
  };

  const handleProceedToSeats = (route: RouteItem, passengerCount: number) => {
    setSelectedRouteForExperience(null);
    setSelectedRouteForSeat({ route, passengerCount });
  };

  const handleConfirmSeats = (
    selectedSeats: (number | string)[],
    seatGenders: Record<string | number, 'male' | 'female'>,
    selectedSeatObjects?: SeatItem[]
  ) => {
    if (!selectedRouteForSeat) return;
    setCheckoutData({
      route: selectedRouteForSeat.route,
      selectedSeats,
      seatGenders,
      selectedSeatObjects,
      gender: selectedSeats.length > 0 ? seatGenders[selectedSeats[0]] || 'male' : 'male',
    });
    setSelectedRouteForSeat(null);
  };

  const handleTicketPurchased = (newTicket: BookingTicket) => {
    setTickets((prev) => [newTicket, ...prev.filter((t) => t.pnr !== newTicket.pnr)]);
    setCheckoutData(null);
    setSelectedRouteForSeat(null);
    setSelectedRouteForExperience(null);
    setIsWalletOpen(true);
    showToast('Tebrikler!', `Biletiniz başarıyla oluşturuldu. PNR: ${newTicket.pnr}`, 'success', 5000);
  };

  const handleOpenRefund = (ticket: BookingTicket) => {
    setRefundTicket(ticket);
  };

  const handleConfirmRefund = (pnr: string, refundDetails: RefundDetails) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.pnr === pnr
          ? {
              ...t,
              status: 'refunded' as const,
              refundDetails,
            }
          : t
      )
    );
    showToast('İade Talebiniz Alındı', `${pnr} numaralı bilet için ${refundDetails.refundedAmount} TL iade onaylandı.`, 'info', 5000);
  };

  const handleSelectCarrierShowcase = (carrierName: string, _transportType?: TransportType) => {
    handleSelectCarrierDirect(carrierName);
  };

  const handleOpenWalletWithAuth = () => {
    if (
      !requireAuth(
        'Biletlerinizi ve dijital cüzdanınızı görüntülemek için lütfen giriş yapın.',
        () => {
          setIsWalletOpen(true);
        }
      )
    ) {
      return;
    }
    setIsWalletOpen(true);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === '1') {
        sound.playTick();
        setSearchState((prev) => ({ ...prev, transportType: 'otobus' }));
      } else if (e.key === '2') {
        sound.playTick();
        setSearchState((prev) => ({ ...prev, transportType: 'ucak' }));
      } else if (e.key === '3') {
        sound.playTick();
        setSearchState((prev) => ({ ...prev, transportType: 'tren' }));
      } else if (e.key === '4') {
        sound.playTick();
        setSearchState((prev) => ({ ...prev, transportType: 'feribot' }));
      } else if (e.key.toLowerCase() === 'w') {
        e.preventDefault();
        handleOpenWalletWithAuth();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPnrQueryOpen(true);
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsTerminalGuideOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpenWalletWithAuth]);

  if (selectedCarrierForDetail) {
    return (
      <CarrierDetailScreen
        carrierName={selectedCarrierForDetail}
        onClose={() => {
          setSelectedCarrierForDetail(null);
          if (window.location.search.includes('carrier=')) {
            try {
              window.close();
            } catch {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }
        }}
        onSelectRoute={(route) => {
          setSelectedCarrierForDetail(null);
          setSelectedRouteForExperience(route);
        }}
      />
    );
  }

  if (selectedRouteForExperience) {
    return (
      <TicketExperienceScreen
        route={selectedRouteForExperience}
        initialPassengerCount={searchState.passengerCount}
        currentUser={currentUser}
        onRequireAuth={requireAuth}
        onClose={() => {
          if (window.location.search.includes('carrier=')) {
            try {
              window.close();
            } catch {
              // fallback
            }
          }
          setSelectedRouteForExperience(null);
          try {
            const params = new URLSearchParams(window.location.search);
            const carrierParam = params.get('carrier');
            if (carrierParam) {
              setSelectedCarrierForDetail(decodeURIComponent(carrierParam));
            }
          } catch {
            // ignore
          }
        }}
        onProceedToSeats={handleProceedToSeats}
      />
    );
  }

  if (selectedRouteForSeat) {
    return (
      <Suspense fallback={null}>
        <SeatSelectionModal
          route={selectedRouteForSeat.route}
          targetSeatsCount={selectedRouteForSeat.passengerCount}
          onClose={() => {
            setSelectedRouteForExperience(selectedRouteForSeat.route);
            setSelectedRouteForSeat(null);
          }}
          onConfirmSeats={handleConfirmSeats}
        />
      </Suspense>
    );
  }

  if (checkoutData) {
    return (
      <Suspense fallback={null}>
        <CheckoutModal
          route={checkoutData.route}
          selectedSeats={checkoutData.selectedSeats}
          seatGenders={checkoutData.seatGenders}
          selectedSeatObjects={checkoutData.selectedSeatObjects}
          selectedGender={checkoutData.gender}
          onClose={() => setCheckoutData(null)}
          onPaymentSuccess={handleTicketPurchased}
          onBookingCompleted={handleTicketPurchased}
        />
      </Suspense>
    );
  }

  if (isWalletOpen) {
    return (
      <Suspense fallback={null}>
        <TicketWalletModal
          tickets={tickets}
          onClose={() => setIsWalletOpen(false)}
          onOpenRefund={handleOpenRefund}
        />
        {refundTicket && (
          <RefundModal
            ticket={refundTicket}
            onClose={() => setRefundTicket(null)}
            onConfirmRefund={handleConfirmRefund}
          />
        )}
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-charcoal flex flex-col selection:bg-bordeaux-700 selection:text-white">
      <Header
        activeTransport={searchState.transportType}
        onSelectTransport={(type) => handleUpdateSearchState({ transportType: type })}
        onOpenWallet={handleOpenWalletWithAuth}
        onOpenAuth={() => {
          setAuthPromptReason(undefined);
          setIsAuthModalOpen(true);
        }}
        onOpenPnrQuery={() => setIsPnrQueryOpen(true)}
        onOpenTerminalGuide={() => setIsTerminalGuideOpen(true)}
        onLogout={handleLogout}
        user={currentUser}
        activeTicketCount={tickets.filter((t) => t.status === 'active' || t.status === 'confirmed').length}
      />

      <main className="flex-grow pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HeroSection
            searchState={searchState}
            onUpdateSearchState={handleUpdateSearchState}
            onPerformSearch={handlePerformSearch}
            onSelectCarrier={handleSelectCarrierDirect}
            onOpenPnrQuery={() => setIsPnrQueryOpen(true)}
          />
        </div>

        {/* 100+ Transport Brands Infinite Scrolling Ribbon */}
        <PartnerLogosRibbon onSelectCarrier={handleSelectCarrierDirect} />

        {/* Creative Editorial Travel Discovery Passes */}
        <div id="discover-section">
          <DiscoveryCarousel onSelectRoute={handleSelectDiscoveryRoute} />
        </div>

        <SearchResults
          routes={routes}
          searchState={searchState}
          onUpdateSearchState={handleUpdateSearchState}
          onSelectRoute={handleSelectRouteFromResults}
          onOpenPriceAlert={(minPrice) => setPriceAlertData({ isOpen: true, minPrice })}
        />

        <WhyBileoSection
          onSelectCarrier={(carrier, type) => {
            if (
              !requireAuth('Firma seferlerini listelemek için lütfen giriş yapın.', () => {
                if (carrier) {
                  handleSelectCarrierDirect(carrier);
                } else {
                  handleUpdateSearchState({ transportType: type });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              })
            ) {
              return;
            }
            if (carrier) {
              handleSelectCarrierDirect(carrier);
            } else {
              handleUpdateSearchState({ transportType: type });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onOpenFareMatrix={() => setIsFareMatrixOpen(true)}
        />

        {/* Featured Premier Carrier Showcase & Fleet Experience */}
        <FeaturedCarriersShowcase
          onSelectCarrier={handleSelectCarrierShowcase}
          onOpenFleetModal={() => setIsFleetModalOpen(true)}
        />

        {/* Real-time Dynamic Live Transit & Travel Insights Ticker Tape (Placed at bottom) */}
        <div className="pt-6 pb-2">
          <LiveTransitTicker />
        </div>
      </main>

      <MobileBottomNav
        activeTab={mobileActiveTab}
        onSelectTab={(tab) => {
          setMobileActiveTab(tab);
          if (tab === 'wallet') handleOpenWalletWithAuth();
        }}
        user={currentUser}
        onOpenAuth={() => {
          setAuthPromptReason(undefined);
          setIsAuthModalOpen(true);
        }}
        activeTicketCount={tickets.filter((t) => t.status === 'active' || t.status === 'confirmed').length}
        onOpenSupport={() => {
          showToast(
            'Bileo 7/24 Müşteri Hizmetleri',
            '0850 800 00 00 hattımızdan seyahat danışmanlarımıza anında bağlanabilirsiniz.',
            'info'
          );
        }}
      />

      {/* Footer Top Distinct Partner Carriers Ribbon */}
      <FooterPartnerRibbon onSelectCarrier={handleSelectCarrierDirect} />

      <Footer
        onOpenEcoModal={() => setIsEcoModalOpen(true)}
        onOpenTerminalGuide={() => setIsTerminalGuideOpen(true)}
        onOpenCurrencyModal={() => setIsCurrencyModalOpen(true)}
        onOpenLuggageModal={() => setIsLuggageModalOpen(true)}
        onOpenWeatherModal={() => setIsWeatherModalOpen(true)}
        onOpenShuttleModal={() => setIsShuttleModalOpen(true)}
        onOpenPetModal={() => setIsPetModalOpen(true)}
        onOpenInsuranceModal={() => setIsInsuranceModalOpen(true)}
        onOpenTaxiModal={() => setIsTaxiModalOpen(true)}
        onOpenRestStopModal={() => setIsRestStopModalOpen(true)}
        onOpenDiscountsModal={() => setIsDiscountsModalOpen(true)}
        onOpenStorageModal={() => setIsStorageModalOpen(true)}
        onOpenTrackerModal={() => setIsTrackerModalOpen(true)}
        onOpenCateringModal={() => setIsCateringModalOpen(true)}
        onOpenAccessibilityModal={() => setIsAccessibilityModalOpen(true)}
        onOpenStudentModal={() => setIsStudentModalOpen(true)}
        onOpenTechModal={() => setIsTechModalOpen(true)}
        onOpenLostFoundModal={() => setIsLostFoundModalOpen(true)}
        onOpenHighwayModal={() => setIsHighwayModalOpen(true)}
        onOpenGroupModal={() => setIsGroupModalOpen(true)}
        onOpenMedicalModal={() => setIsMedicalModalOpen(true)}
        onOpenRouteStopsModal={() => setIsRouteStopsModalOpen(true)}
        onOpenRightsModal={() => setIsRightsModalOpen(true)}
      />

      {/* Lazy-Loaded Secondary Modals & Tools for Maximum Performance */}
      <Suspense fallback={null}>
        {/* Global Authentication Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => {
            setIsAuthModalOpen(false);
            setPendingAction(null);
          }}
          onLoginSuccess={handleLoginSuccess}
          promptReason={authPromptReason}
        />

        {/* Global PNR Query & Self-Service Management Modal */}
        <PnrQueryModal
          isOpen={isPnrQueryOpen}
          onClose={() => setIsPnrQueryOpen(false)}
          tickets={tickets}
          onOpenRefund={handleOpenRefund}
          onShowToast={showToast}
        />

        {/* Global Terminal & Station Guide Modal */}
        <TerminalGuideModal
          isOpen={isTerminalGuideOpen}
          onClose={() => setIsTerminalGuideOpen(false)}
        />

        {/* Global Fleet & Vehicle Standards Modal */}
        <FleetExperienceModal
          isOpen={isFleetModalOpen}
          onClose={() => setIsFleetModalOpen(false)}
        />

        {/* Global Multimodal Fare Matrix Modal */}
        <FareMatrixModal
          isOpen={isFareMatrixOpen}
          onClose={() => setIsFareMatrixOpen(false)}
          onSelectRouteMode={(from, to, mode) => {
            handleUpdateSearchState({ fromCity: from, toCity: to, transportType: mode });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Global Eco Carbon Footprint Modal */}
        <EcoCarbonModal
          isOpen={isEcoModalOpen}
          onClose={() => setIsEcoModalOpen(false)}
        />

        {/* Global Keyboard Shortcuts Modal */}
        <KeyboardShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />

        {/* Global Multi-Currency Converter Modal */}
        <CurrencyConverterModal
          isOpen={isCurrencyModalOpen}
          onClose={() => setIsCurrencyModalOpen(false)}
        />

        {/* Global Luggage Allowance & Rules Modal */}
        <LuggageAllowanceModal
          isOpen={isLuggageModalOpen}
          onClose={() => setIsLuggageModalOpen(false)}
        />

        {/* Global Destination Weather Forecast Modal */}
        <DestinationWeatherModal
          isOpen={isWeatherModalOpen}
          onClose={() => setIsWeatherModalOpen(false)}
          initialCity={searchState.toCity || 'İstanbul'}
        />

        {/* Global Shuttle & Airport Transfer Timetable Modal */}
        <ShuttleTimetableModal
          isOpen={isShuttleModalOpen}
          onClose={() => setIsShuttleModalOpen(false)}
        />

        {/* Global Pet Travel Regulations Modal */}
        <PetTravelModal
          isOpen={isPetModalOpen}
          onClose={() => setIsPetModalOpen(false)}
        />

        {/* Global Travel Insurance & Trip Protection Modal */}
        <TravelInsuranceModal
          isOpen={isInsuranceModalOpen}
          onClose={() => setIsInsuranceModalOpen(false)}
        />

        {/* Global Taxi & Ride Fare Estimator Modal */}
        <TaxiEstimatorModal
          isOpen={isTaxiModalOpen}
          onClose={() => setIsTaxiModalOpen(false)}
        />

        {/* Global Highway Rest Stop & Food Guide Modal */}
        <RestStopGuideModal
          isOpen={isRestStopModalOpen}
          onClose={() => setIsRestStopModalOpen(false)}
        />

        {/* Global Special Passenger Discounts Guide Modal */}
        <DiscountsGuideModal
          isOpen={isDiscountsModalOpen}
          onClose={() => setIsDiscountsModalOpen(false)}
        />

        {/* Global Left Luggage & Storage Lockers Modal */}
        <LuggageStorageModal
          isOpen={isStorageModalOpen}
          onClose={() => setIsStorageModalOpen(false)}
        />

        {/* Global Live GPS Journey Tracker Modal */}
        <LiveJourneyTrackerModal
          isOpen={isTrackerModalOpen}
          onClose={() => setIsTrackerModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Special Dietary & Catering Menu Modal */}
        <CateringMenuModal
          isOpen={isCateringModalOpen}
          onClose={() => setIsCateringModalOpen(false)}
        />

        {/* Global Accessibility & Reduced Mobility Guide Modal */}
        <AccessibilityGuideModal
          isOpen={isAccessibilityModalOpen}
          onClose={() => setIsAccessibilityModalOpen(false)}
        />

        {/* Global Student & Youth Travel Club Modal */}
        <StudentTravelModal
          isOpen={isStudentModalOpen}
          onClose={() => setIsStudentModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Onboard Power Outlets, Wi-Fi & Tech Specs Modal */}
        <OnboardTechModal
          isOpen={isTechModalOpen}
          onClose={() => setIsTechModalOpen(false)}
        />

        {/* Global Lost & Found Luggage & Items Modal */}
        <LostAndFoundModal
          isOpen={isLostFoundModalOpen}
          onClose={() => setIsLostFoundModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Highway & Bridge Tolls Estimator Modal */}
        <HighwayTollModal
          isOpen={isHighwayModalOpen}
          onClose={() => setIsHighwayModalOpen(false)}
        />

        {/* Global Group & Corporate Charter Booking Modal */}
        <GroupBookingModal
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Travel Health & Medical Clearance Modal */}
        <MedicalTravelModal
          isOpen={isMedicalModalOpen}
          onClose={() => setIsMedicalModalOpen(false)}
        />

        {/* Global Intermediate Route Stops & Timeline Modal */}
        <RouteStopsModal
          isOpen={isRouteStopsModalOpen}
          onClose={() => setIsRouteStopsModalOpen(false)}
        />

        {/* Global Passenger Legal Rights & Delay Compensation Modal */}
        <PassengerRightsModal
          isOpen={isRightsModalOpen}
          onClose={() => setIsRightsModalOpen(false)}
        />

        {/* Global Price Drop Alert Modal */}
        <PriceAlertModal
          isOpen={priceAlertData.isOpen}
          onClose={() => setPriceAlertData((prev) => ({ ...prev, isOpen: false }))}
          fromCity={searchState.fromCity || 'İstanbul'}
          toCity={searchState.toCity || 'Ankara'}
          currentMinPrice={priceAlertData.minPrice}
          onShowToast={showToast}
        />
      </Suspense>

      {/* Global Toast Notification Engine */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />

      {/* Offline Status & Cached Wallet Banner */}
      <OfflineBanner onOpenWallet={handleOpenWalletWithAuth} />
    </div>
  );
}

export default App;
