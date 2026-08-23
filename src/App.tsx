import { useState, useEffect, useCallback } from 'react';
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
import { SeatSelectionModal } from './components/SeatSelectionModal';
import { CheckoutModal } from './components/CheckoutModal';
import { TicketWalletModal } from './components/TicketWalletModal';
import { RefundModal } from './components/RefundModal';
import { PnrQueryModal } from './components/PnrQueryModal';
import { ToastNotification, ToastMessage } from './components/common/ToastNotification';
import { AuthModal } from './components/AuthModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
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
      <SeatSelectionModal
        route={selectedRouteForSeat.route}
        targetSeatsCount={selectedRouteForSeat.passengerCount}
        onClose={() => {
          setSelectedRouteForExperience(selectedRouteForSeat.route);
          setSelectedRouteForSeat(null);
        }}
        onConfirmSeats={handleConfirmSeats}
      />
    );
  }

  if (checkoutData) {
    return (
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
    );
  }

  if (isWalletOpen) {
    return (
      <>
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
      </>
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
        />

        {/* Featured Premier Carrier Showcase & Fleet Experience */}
        <FeaturedCarriersShowcase onSelectCarrier={handleSelectCarrierShowcase} />

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
      />

      {/* Footer Top Distinct Partner Carriers Ribbon */}
      <FooterPartnerRibbon onSelectCarrier={handleSelectCarrierDirect} />

      <Footer />

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

      {/* Global Toast Notification Engine */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
