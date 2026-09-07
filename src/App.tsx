import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { LiveTransitTicker } from './components/LiveTransitTicker';
import { HeroSection } from './components/HeroSection';
import { PartnerLogosRibbon, FooterPartnerRibbon } from './components/PartnerLogosRibbon';
import { FeaturedCarriersShowcase } from './components/FeaturedCarriersShowcase';
import { SearchResults, preloadCityResults } from './components/SearchResults';
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
const TravelGuidesModal = lazy(() => import('./components/TravelGuidesModal').then(m => ({ default: m.TravelGuidesModal })));
const FrequentTravelerRewardsModal = lazy(() => import('./components/FrequentTravelerRewardsModal').then(m => ({ default: m.FrequentTravelerRewardsModal })));
const LiveRoadWeatherRadarModal = lazy(() => import('./components/LiveRoadWeatherRadarModal').then(m => ({ default: m.LiveRoadWeatherRadarModal })));
const CampusTransitModal = lazy(() => import('./components/CampusTransitModal').then(m => ({ default: m.CampusTransitModal })));
const MultiModalComparisonModal = lazy(() => import('./components/MultiModalComparisonModal').then(m => ({ default: m.MultiModalComparisonModal })));
const CityTransitCardsModal = lazy(() => import('./components/CityTransitCardsModal').then(m => ({ default: m.CityTransitCardsModal })));
const OvernightTravelModal = lazy(() => import('./components/OvernightTravelModal').then(m => ({ default: m.OvernightTravelModal })));
const WinterSkiTransitModal = lazy(() => import('./components/WinterSkiTransitModal').then(m => ({ default: m.WinterSkiTransitModal })));
const SeasonalDealsCalendarModal = lazy(() => import('./components/SeasonalDealsCalendarModal').then(m => ({ default: m.SeasonalDealsCalendarModal })));
const LiveFlightRadarModal = lazy(() => import('./components/LiveFlightRadarModal').then(m => ({ default: m.LiveFlightRadarModal })));
const AirportMetroTransitModal = lazy(() => import('./components/AirportMetroTransitModal').then(m => ({ default: m.AirportMetroTransitModal })));
const InteractiveRouteNetworkModal = lazy(() => import('./components/InteractiveRouteNetworkModal').then(m => ({ default: m.InteractiveRouteNetworkModal })));
const LiveOccupancyRadarModal = lazy(() => import('./components/LiveOccupancyRadarModal').then(m => ({ default: m.LiveOccupancyRadarModal })));
const AllProvincesTransitModal = lazy(() => import('./components/AllProvincesTransitModal').then(m => ({ default: m.AllProvincesTransitModal })));
const SmartTransferPlannerModal = lazy(() => import('./components/SmartTransferPlannerModal').then(m => ({ default: m.SmartTransferPlannerModal })));
const SeatComfortGuideModal = lazy(() => import('./components/SeatComfortGuideModal').then(m => ({ default: m.SeatComfortGuideModal })));
const TicketRescheduleModal = lazy(() => import('./components/TicketRescheduleModal').then(m => ({ default: m.TicketRescheduleModal })));
const OnboardEntertainmentModal = lazy(() => import('./components/OnboardEntertainmentModal').then(m => ({ default: m.OnboardEntertainmentModal })));
const ExpressParcelTransitModal = lazy(() => import('./components/ExpressParcelTransitModal').then(m => ({ default: m.ExpressParcelTransitModal })));
const SleeperTrainGuideModal = lazy(() => import('./components/SleeperTrainGuideModal').then(m => ({ default: m.SleeperTrainGuideModal })));
const SeaTransitFerryGuideModal = lazy(() => import('./components/SeaTransitFerryGuideModal').then(m => ({ default: m.SeaTransitFerryGuideModal })));
const BicycleTransitGuideModal = lazy(() => import('./components/BicycleTransitGuideModal').then(m => ({ default: m.BicycleTransitGuideModal })));
const CarRentalTransitGuideModal = lazy(() => import('./components/CarRentalTransitGuideModal').then(m => ({ default: m.CarRentalTransitGuideModal })));
const LiveTransitScraperModal = lazy(() => import('./components/LiveTransitScraperModal').then(m => ({ default: m.LiveTransitScraperModal })));
const SmartTravelBudgetCalculatorModal = lazy(() => import('./components/SmartTravelBudgetCalculatorModal').then(m => ({ default: m.SmartTravelBudgetCalculatorModal })));
const HighwayPassesLiveRadarModal = lazy(() => import('./components/HighwayPassesLiveRadarModal').then(m => ({ default: m.HighwayPassesLiveRadarModal })));
const SeatUpgradeComfortPlannerModal = lazy(() => import('./components/SeatUpgradeComfortPlannerModal').then(m => ({ default: m.SeatUpgradeComfortPlannerModal })));
const EcoTreeOffsetCertificateModal = lazy(() => import('./components/EcoTreeOffsetCertificateModal').then(m => ({ default: m.EcoTreeOffsetCertificateModal })));
const AirportExpressBusGuideModal = lazy(() => import('./components/AirportExpressBusGuideModal').then(m => ({ default: m.AirportExpressBusGuideModal })));
const ElectricVehicleChargingGuideModal = lazy(() => import('./components/ElectricVehicleChargingGuideModal').then(m => ({ default: m.ElectricVehicleChargingGuideModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
import {
  TransportType,
  SearchFilterState,
  RouteItem,
  BookingTicket,
  SeatGender,
  SeatItem,
  RefundDetails,
  User,
} from './types';
import type { LiveSearchState, SearchKind } from './types';
import type { TurnaKind, TurnaQuery } from './lib/turna/types';
import { fetchTurna } from './lib/turna/client';
import { fetchSearch } from './lib/sources/client';
import type { SourceKind } from './lib/sources/types';
import type { OtherSourcesState } from './components/results/OtherSourcesPanel';
import { searchKindToTurnaKind } from './lib/turna/adapter';
import { isCityKind, resolveTurnaTarget, slugifyTr, TurnaQueryError } from './lib/turna/urls';
import { formatTrClock, priceTL } from './lib/turna/format';
import { checkPriceAlerts } from './lib/turna/alerts';
import { writeRecentSearch } from './lib/turna/places';
import { SEED_TICKETS } from './data/mockData';

/** Re-run the last query when the tab becomes visible and the result is older than this. */
const REVALIDATE_AFTER_MS = 600000;
/** Client-side cooldown between manual refreshes (the server also throttles per URL). */
const REFRESH_COOLDOWN_MS = 30000;
const TRAIN_UNSUPPORTED_REASON = 'Turna.com tren bileti sunmuyor; bu sekmede canlı veri yok.';

/** Auth-gate copy for the search button, per tab (Otel and Araç list neither trips nor departure times). */
/** Turna kinds that have a non-Turna landing-page source as well (KAYNAK_GENISLETME_PLANI.md Faz A). */
function sourceKindOfTurna(kind: TurnaKind): SourceKind | null {
  return kind === 'bus' || kind === 'flight' || kind === 'hotel' ? kind : null;
}

function searchAuthReason(kind: SearchKind): string {
  if (kind === 'otel') return 'Otel listesini görmek için lütfen giriş yapın veya kayıt olun.';
  if (kind === 'arac') return 'Araç kiralama listesini görmek için lütfen giriş yapın veya kayıt olun.';
  return 'Sefer aramak ve sefer saatlerini listelemek için lütfen giriş yapın veya kayıt olun.';
}

/** Display context of the last submitted search; reused by refresh and revalidation. */
interface SearchIntent {
  transportType: TransportType;
  /** Tab the search was made from; `otel` and `arac` are not transport types. */
  searchKind: SearchKind;
  fromCity: string;
  /** Empty for the single-city tabs (hotel, car). */
  toCity: string;
}

export function App() {
  const [searchState, setSearchState] = useState<SearchFilterState>({
    transportType: 'otobus',
    fromCity: 'İstanbul',
    toCity: 'Ankara',
    departureDate: '',
    passengerCount: 1,
    maxPrice: 3000,
    selectedCompanies: [],
    departureTimeRange: 'all',
    onlyDirect: true,
    seatTypePreference: 'all',
    sortBy: 'cheapest',
  });

  // One live Turna.com search lifecycle; `routes` is derived from the `ok` branch only.
  const [live, setLive] = useState<LiveSearchState>({ status: 'idle' });
  /** Results of the non-Turna landing-page sources for the same query (obilet, biletall); undefined for kinds without a source. */
  const [otherSources, setOtherSources] = useState<OtherSourcesState | undefined>(undefined);
  const otherSourcesAbortRef = useRef<AbortController | null>(null);
  const routes: RouteItem[] = live.status === 'ok' ? live.routes : [];
  const isLiveScraping = live.status === 'loading';
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchIntentRef = useRef<SearchIntent | null>(null);
  const lastRefreshAtRef = useRef<number>(0);

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

  // Restore user dark/light mode preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('bileo_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);


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

  // Popular Holiday & City Travel Guides Modal State
  const [isGuidesModalOpen, setIsGuidesModalOpen] = useState(false);

  // Loyalty Program, Bileo Miles & Frequent Traveler Modal State
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);

  // Live Road, Maritime & Weather Radar Modal State
  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);

  // University Campus & Student Dorm Transit Network Modal State
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);

  // Multi-Modal Corridor Comparison & Optimization Modal State
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Urban Transit Cards, Fares & NFC Top-up Modal State
  const [isCityCardModalOpen, setIsCityCardModalOpen] = useState(false);

  // Overnight Travel, Sleeper Train Compartments & Checklist Modal State
  const [isOvernightModalOpen, setIsOvernightModalOpen] = useState(false);

  // Winter & Ski Resort Transit, Snow Depth & Equipment Modal State
  const [isSkiModalOpen, setIsSkiModalOpen] = useState(false);

  // Seasonal Peak & Holiday Early Booking Calendar Modal State
  const [isSeasonsModalOpen, setIsSeasonsModalOpen] = useState(false);

  // Live Aircraft Radar Telemetry & Highway Corridors Modal State
  const [isFlightRadarOpen, setIsFlightRadarOpen] = useState(false);

  // Airport Metro Lines, Shuttles & Last-Mile Transfers Modal State
  const [isAirportMetroOpen, setIsAirportMetroOpen] = useState(false);

  // Main Intercity Transport Corridors & Visual Route Network Modal State
  const [isRouteNetworkOpen, setIsRouteNetworkOpen] = useState(false);

  // Live Real-Time Seat Occupancy & Scarcity Radar Modal State
  const [isOccupancyOpen, setIsOccupancyOpen] = useState(false);

  // Turkey 81 Provinces & Transit Directory Modal State
  const [isProvincesModalOpen, setIsProvincesModalOpen] = useState(false);

  // Smart Multi-Leg Layover & Transfer Planner Modal State
  const [isTransfersModalOpen, setIsTransfersModalOpen] = useState(false);

  // Seat Comfort & Sun Direction Simulator Modal State
  const [isSeatComfortModalOpen, setIsSeatComfortModalOpen] = useState(false);

  // Self-Service Ticket Reschedule & Departure Change Modal State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  // Onboard Media & Wi-Fi Entertainment Guide Modal State
  const [isEntertainmentModalOpen, setIsEntertainmentModalOpen] = useState(false);

  // Express Bus & Flight Parcel Cargo Tracking Modal State
  const [isParcelModalOpen, setIsParcelModalOpen] = useState(false);

  // Sleeper & Scenic Train Guide Modal State
  const [isSleeperTrainModalOpen, setIsSleeperTrainModalOpen] = useState(false);

  // Sea Transit & Ferry Guide Modal State
  const [isFerryGuideModalOpen, setIsFerryGuideModalOpen] = useState(false);

  // Bicycle & E-Scooter Transit Guide Modal State
  const [isBicycleModalOpen, setIsBicycleModalOpen] = useState(false);

  // Car Rental & Hub Transfer Guide Modal State
  const [isCarRentalModalOpen, setIsCarRentalModalOpen] = useState(false);

  // Live Transit Scraper & Ingestion Status Modal State
  const [isScraperModalOpen, setIsScraperModalOpen] = useState(false);

  // Smart Travel Budget Calculator Modal State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Critical Mountain Passes & Highway Tunnels Radar Modal State
  const [isHighwayPassesModalOpen, setIsHighwayPassesModalOpen] = useState(false);

  // Seat Upgrade & Extra Comfort Assistant Modal State
  const [isSeatUpgradeModalOpen, setIsSeatUpgradeModalOpen] = useState(false);

  // Carbon Offset & Digital Green Tree Certificate Modal State
  const [isEcoCertificateModalOpen, setIsEcoCertificateModalOpen] = useState(false);

  // Airport Express Shuttle Guide Modal State
  const [isAirportShuttleModalOpen, setIsAirportShuttleModalOpen] = useState(false);

  // Highway EV Fast Charging Corridor Guide Modal State
  const [isEvChargingModalOpen, setIsEvChargingModalOpen] = useState(false);

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

  /**
   * Run one Turna.com search. Starting a new run aborts the previous one, and every outcome
   * replaces the previous result so stale rows never survive a new query. `quiet` suppresses
   * toasts and the recent-search write (used by the visibility revalidation).
   */
  /** Fetch the other sources in parallel with Turna; the newest query always wins, stale answers are dropped. */
  const runOtherSources = useCallback(async (query: TurnaQuery, refresh: boolean) => {
    otherSourcesAbortRef.current?.abort();
    const kind = sourceKindOfTurna(query.kind);
    if (!kind) {
      otherSourcesAbortRef.current = null;
      setOtherSources(undefined);
      return;
    }
    const controller = new AbortController();
    otherSourcesAbortRef.current = controller;
    setOtherSources({ status: 'loading' });
    const next = await fetchSearch(kind === 'hotel' ? { kind, city: query.city } : { kind, from: query.from, to: query.to }, { signal: controller.signal, refresh });
    if (controller.signal.aborted || otherSourcesAbortRef.current !== controller) return;
    otherSourcesAbortRef.current = null;
    setOtherSources(next);
  }, []);

  const runSearch = useCallback(
    async (query: TurnaQuery, opts: { refresh?: boolean; quiet?: boolean } = {}) => {
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      const intent = searchIntentRef.current;
      // Hotel/car queries address one city (carried as fromCity); they have no destination.
      const cityQuery = isCityKind(query.kind);
      setLive({ status: 'loading', query, startedAt: Date.now() });
      void runOtherSources(query, opts.refresh === true);

      const next = await fetchTurna(query, {
        signal: controller.signal,
        refresh: opts.refresh === true,
        fromCity: intent?.fromCity,
        toCity: cityQuery ? undefined : intent?.toCity,
      });

      // A newer search superseded this one; its result must not overwrite the newer state.
      if (controller.signal.aborted || searchAbortRef.current !== controller) return;
      searchAbortRef.current = null;
      setLive(next);

      if (opts.quiet) return;

      if ((next.status === 'ok' || next.status === 'facts-only') && intent) {
        writeRecentSearch({
          transportType: intent.transportType,
          searchKind: intent.searchKind,
          fromCity: intent.fromCity,
          toCity: cityQuery ? '' : intent.toCity,
          fromSlug: cityQuery ? next.query.city ?? '' : next.query.from ?? '',
          toSlug: cityQuery ? '' : next.query.to ?? '',
          at: next.receivedAt,
        });
      }

      if (next.status === 'ok') {
        // Local price alerts: compare the real page-wide minimum with the targets stored in this browser.
        const liveMin = next.result.stats?.min;
        for (const hit of checkPriceAlerts(next.result)) {
          const seen = typeof liveMin === 'number' ? `en düşük fiyat ${priceTL(liveMin)}, ` : '';
          showToast('Fiyat alarmı: hedefe ulaşıldı', `${hit.label}: ${seen}hedefiniz ${priceTL(hit.targetPrice)}.`, 'success', 8000);
        }
        const via = next.result.fetchedVia === 'cache' ? 'önbellek' : 'canlı';
        const clock = formatTrClock(next.result.scrapedAt);
        const stamp = `${via}${clock ? `, ${clock}` : ''}`;
        if (next.result.kind === 'hotel') {
          // Hotel landing pages publish no prices, so the count is the only headline number.
          showToast(
            `Turna.com: ${next.result.items.length} otel listelendi (${stamp})`,
            'Otel fiyatları tarih seçimine bağlıdır; Turna sayfasında görüntülenir.',
            'promo'
          );
        } else if (next.result.kind === 'car') {
          // stats.min is the page-wide minimum daily price; omitted when Turna did not publish stats.
          const minDaily = next.result.stats?.min;
          showToast(
            `Turna.com: ${next.result.items.length} araç listelendi (${stamp})`,
            typeof minDaily === 'number' && Number.isFinite(minDaily) ? `En düşük günlük fiyat ${priceTL(minDaily)}` : undefined,
            'promo'
          );
        } else {
          showToast(
            `Turna.com: ${next.routes.length} teklif alındı (${stamp})`,
            next.droppedItems > 0 ? `${next.droppedItems} teklif doğrulanamadı ve listelenmedi.` : undefined,
            'promo'
          );
        }
      } else if (next.status === 'facts-only') {
        showToast(
          'Turna.com: teklif listesi yok',
          cityQuery
            ? 'Bu şehir için Turna sayfası liste yayımlamamış; kaynak bağlantısı gösteriliyor.'
            : next.query.kind === 'ferry'
              ? 'Feribot sayfası fiyat listesi yayımlamıyor; rota bilgileri gösteriliyor.'
              : 'Bu rota için yapısal teklif yayımlanmamış; rota bilgileri gösteriliyor.',
          'info'
        );
      } else if (next.status === 'error') {
        const retry = next.retryAfterSeconds !== undefined ? ` ${next.retryAfterSeconds} sn sonra tekrar deneyin.` : '';
        showToast('Arama tamamlanamadı', `${next.message}${retry}`, 'error', 6000);
      }
    },
    [showToast, runOtherSources]
  );

  // Abort any in-flight search (Turna and the other sources) if the app unmounts.
  useEffect(
    () => () => {
      searchAbortRef.current?.abort();
      otherSourcesAbortRef.current?.abort();
    },
    [],
  );

  /**
   * Manual refresh: bypasses the server cache for the current query (30 s client cooldown).
   * From an error state it is a plain retry (no cache bypass, no cooldown).
   */
  const handleRefresh = useCallback(() => {
    if (live.status === 'idle' || live.status === 'loading' || live.status === 'unsupported') return;
    if (live.query === null) return;
    const isRetry = live.status === 'error';
    if (!isRetry) {
      const elapsed = Date.now() - lastRefreshAtRef.current;
      if (elapsed < REFRESH_COOLDOWN_MS) {
        const wait = Math.ceil((REFRESH_COOLDOWN_MS - elapsed) / 1000);
        showToast('Yenileme sınırı', `Turna.com verisi 30 saniyede bir yenilenebilir; ${wait} sn sonra tekrar deneyin.`, 'info');
        return;
      }
      lastRefreshAtRef.current = Date.now();
    }
    void runSearch(live.query, { refresh: !isRetry });
  }, [live, runSearch, showToast]);

  // Revalidate a result older than 10 minutes when the tab becomes visible again: only for a
  // signed-in user and only while no detail/seat/checkout handoff screen is open.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (!currentUser) return;
      if (selectedRouteForExperience || selectedRouteForSeat || checkoutData) return;
      if (live.status !== 'ok' && live.status !== 'facts-only') return;
      const receivedAt = Date.parse(live.receivedAt);
      if (Number.isNaN(receivedAt) || Date.now() - receivedAt <= REVALIDATE_AFTER_MS) return;
      void runSearch(live.query, { quiet: true });
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [live, currentUser, selectedRouteForExperience, selectedRouteForSeat, checkoutData, runSearch]);

  const handleUpdateSearchState = (updates: Partial<SearchFilterState>) => {
    // City tabs render lazily loaded panels; start the download as soon as the tab is chosen.
    if (updates.searchKind === 'otel' || updates.searchKind === 'arac') void preloadCityResults();
    // A writer that sets a city without stating its slug (guide modals, fare matrix) must not
    // leave a stale autocomplete slug/code behind; the Hero always sends both keys together.
    const next: Partial<SearchFilterState> = { ...updates };
    if ('fromCity' in updates && !('fromSlug' in updates)) {
      next.fromSlug = undefined;
      next.fromCode = undefined;
    }
    if ('toCity' in updates && !('toSlug' in updates)) {
      next.toSlug = undefined;
      next.toCode = undefined;
    }
    // A writer that sets a transport type without naming the tab (Header, keyboard shortcuts,
    // guide modals) means that tab; otherwise a stale Otel/Araç tab would outlive the handoff.
    if (updates.transportType !== undefined && !('searchKind' in updates)) {
      next.searchKind = updates.transportType;
    }
    setSearchState((prev) => {
      const merged: SearchFilterState = { ...prev, ...next };
      const prevKind: SearchKind = prev.searchKind ?? prev.transportType;
      const nextKind: SearchKind = merged.searchKind ?? merged.transportType;
      // The day chip belongs to the previous tab's result; a tab change starts on "Tümü".
      if (nextKind !== prevKind) merged.selectedDay = undefined;
      return merged;
    });
  };

  const handlePerformSearch = () => {
    setHasSearched(true);
    const { transportType, fromCity, toCity, fromSlug, toSlug } = searchState;
    const activeKind: SearchKind = searchState.searchKind ?? transportType;
    if (
      !requireAuth(searchAuthReason(activeKind), () => {
        const resultsElement = document.getElementById('search-results-section');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      })
    ) {
      return;
    }

    const resultsElement = document.getElementById('search-results-section');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth' });
    }

    const kind = searchKindToTurnaKind(activeKind);
    if (activeKind === 'tren' || kind === null) {
      searchAbortRef.current?.abort();
      searchAbortRef.current = null;
      setLive({ status: 'unsupported', transportType: 'tren', reason: TRAIN_UNSUPPORTED_REASON });
      return;
    }

    // Slugs come from the autocomplete selection; free-typed text falls back to slugifyTr.
    // Otel/Araç address a single city, which the Hero keeps in fromCity/fromSlug; `city` alone is
    // sent so an empty city can never fall back to a stale origin slug inside resolveTurnaTarget.
    const query: TurnaQuery = isCityKind(kind)
      ? { kind, city: fromSlug || slugifyTr(fromCity) }
      : { kind, from: fromSlug || slugifyTr(fromCity), to: toSlug || slugifyTr(toCity) };
    try {
      resolveTurnaTarget(query);
    } catch (err) {
      if (err instanceof TurnaQueryError) {
        searchAbortRef.current?.abort();
        searchAbortRef.current = null;
        showToast('Arama yapılamadı', err.message, 'error');
        setLive({ status: 'error', query, httpStatus: null, errorCode: err.errorCode, message: err.message });
        return;
      }
      throw err;
    }

    searchIntentRef.current = { transportType, searchKind: activeKind, fromCity, toCity: isCityKind(kind) ? '' : toCity };
    // A new query starts on the "Tümü" day chip; the previous selection belongs to the old result.
    if (searchState.selectedDay !== undefined) {
      setSearchState((prev) => ({ ...prev, selectedDay: undefined }));
    }
    void runSearch(query);
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
    // Demo purchase: the code is a preview, never a carrier PNR.
    showToast('Demo bilet oluşturuldu', `Önizleme kodu: ${newTicket.pnr}. Gerçek bir PNR değildir.`, 'info', 5000);
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
        setSearchState((prev) => ({ ...prev, transportType: 'otobus', searchKind: 'otobus' }));
      } else if (e.key === '2') {
        sound.playTick();
        setSearchState((prev) => ({ ...prev, transportType: 'ucak', searchKind: 'ucak' }));
      } else if (e.key === '3') {
        sound.playTick();
        setSearchState((prev) => ({ ...prev, transportType: 'tren', searchKind: 'tren' }));
      } else if (e.key === '4') {
        sound.playTick();
        setSearchState((prev) => ({ ...prev, transportType: 'feribot', searchKind: 'feribot' }));
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
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#12100E] text-charcoal dark:text-[#F5F2EB] flex flex-col selection:bg-bordeaux-700 selection:text-white">
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

        {/* Turna.com live search results (rendered only after the first search) */}
        {hasSearched && (
          <div id="search-results-section">
            <SearchResults
              routes={routes}
              searchState={searchState}
              live={live}
              otherSources={otherSources}
              onRefresh={handleRefresh}
              isLiveScraping={isLiveScraping}
              onTriggerLiveScrape={handleRefresh}
              onUpdateSearchState={handleUpdateSearchState}
              onSelectRoute={handleSelectRouteFromResults}
              onOpenPriceAlert={(minPrice) =>
                setPriceAlertData({
                  isOpen: true,
                  // Prefer the page-wide minimum from Turna's stats over the filtered list minimum.
                  minPrice: live.status === 'ok' ? live.result.stats?.min ?? minPrice : minPrice,
                })
              }
            />
          </div>
        )}

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
        onOpenGuidesModal={() => setIsGuidesModalOpen(true)}
        onOpenRewardsModal={() => setIsRewardsModalOpen(true)}
        onOpenRadarModal={() => setIsRadarModalOpen(true)}
        onOpenCampusModal={() => setIsCampusModalOpen(true)}
        onOpenCompareModal={() => setIsCompareModalOpen(true)}
        onOpenCityCardModal={() => setIsCityCardModalOpen(true)}
        onOpenOvernightModal={() => setIsOvernightModalOpen(true)}
        onOpenSkiModal={() => setIsSkiModalOpen(true)}
        onOpenSeasonsModal={() => setIsSeasonsModalOpen(true)}
        onOpenFlightRadarModal={() => setIsFlightRadarOpen(true)}
        onOpenAirportMetroModal={() => setIsAirportMetroOpen(true)}
        onOpenRouteNetworkModal={() => setIsRouteNetworkOpen(true)}
        onOpenOccupancyModal={() => setIsOccupancyOpen(true)}
        onOpenProvincesModal={() => setIsProvincesModalOpen(true)}
        onOpenTransfersModal={() => setIsTransfersModalOpen(true)}
        onOpenSeatComfortModal={() => setIsSeatComfortModalOpen(true)}
        onOpenRescheduleModal={() => setIsRescheduleModalOpen(true)}
        onOpenEntertainmentModal={() => setIsEntertainmentModalOpen(true)}
        onOpenParcelModal={() => setIsParcelModalOpen(true)}
        onOpenSleeperTrainModal={() => setIsSleeperTrainModalOpen(true)}
        onOpenFerryGuideModal={() => setIsFerryGuideModalOpen(true)}
        onOpenBicycleModal={() => setIsBicycleModalOpen(true)}
        onOpenCarRentalModal={() => setIsCarRentalModalOpen(true)}
        onOpenScraperModal={() => setIsScraperModalOpen(true)}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onOpenHighwayPassesModal={() => setIsHighwayPassesModalOpen(true)}
        onOpenSeatUpgradeModal={() => setIsSeatUpgradeModalOpen(true)}
        onOpenEcoCertificateModal={() => setIsEcoCertificateModalOpen(true)}
        onOpenAirportShuttleModal={() => setIsAirportShuttleModalOpen(true)}
        onOpenEvChargingModal={() => setIsEvChargingModalOpen(true)}
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
          initialCity={searchState.toCity || searchState.fromCity || undefined}
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

        {/* Global Holiday & City Travel Guides Modal */}
        <TravelGuidesModal
          isOpen={isGuidesModalOpen}
          onClose={() => setIsGuidesModalOpen(false)}
          onSelectRoute={(from, to, mode) => {
            handleUpdateSearchState({ fromCity: from, toCity: to, transportType: mode });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Global Loyalty Rewards & Bileo Miles Modal */}
        <FrequentTravelerRewardsModal
          isOpen={isRewardsModalOpen}
          onClose={() => setIsRewardsModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Live Road, Maritime & Weather Radar Modal */}
        <LiveRoadWeatherRadarModal
          isOpen={isRadarModalOpen}
          onClose={() => setIsRadarModalOpen(false)}
        />

        {/* Global University Campus & Student Dorm Transit Modal */}
        <CampusTransitModal
          isOpen={isCampusModalOpen}
          onClose={() => setIsCampusModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Multi-Modal Corridor Comparison & Optimization Modal */}
        <MultiModalComparisonModal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          onSelectRoute={(from, to, mode) => {
            handleUpdateSearchState({ fromCity: from, toCity: to, transportType: mode });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Global Urban Transit Cards, Fares & NFC Top-up Modal */}
        <CityTransitCardsModal
          isOpen={isCityCardModalOpen}
          onClose={() => setIsCityCardModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Overnight Travel & Sleeper Train Experience Modal */}
        <OvernightTravelModal
          isOpen={isOvernightModalOpen}
          onClose={() => setIsOvernightModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Winter & Ski Resort Transit & Equipment Modal */}
        <WinterSkiTransitModal
          isOpen={isSkiModalOpen}
          onClose={() => setIsSkiModalOpen(false)}
          onSelectRoute={(from, to, mode) => {
            handleUpdateSearchState({ fromCity: from, toCity: to, transportType: mode });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Global Seasonal Peak & Holiday Early Booking Calendar Modal */}
        <SeasonalDealsCalendarModal
          isOpen={isSeasonsModalOpen}
          onClose={() => setIsSeasonsModalOpen(false)}
          onSelectRoute={(from, to, mode) => {
            handleUpdateSearchState({ fromCity: from, toCity: to, transportType: mode });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onShowToast={showToast}
        />

        {/* Global Live Aircraft Radar Telemetry & Highway Corridors Modal */}
        <LiveFlightRadarModal
          isOpen={isFlightRadarOpen}
          onClose={() => setIsFlightRadarOpen(false)}
          onSelectRoute={(from, to, mode) => {
            handleUpdateSearchState({ fromCity: from, toCity: to, transportType: mode });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Global Airport Metro Lines, Shuttles & Last-Mile Transfers Modal */}
        <AirportMetroTransitModal
          isOpen={isAirportMetroOpen}
          onClose={() => setIsAirportMetroOpen(false)}
        />

        {/* Global Main Intercity Transport Corridors & Visual Route Network Modal */}
        <InteractiveRouteNetworkModal
          isOpen={isRouteNetworkOpen}
          onClose={() => setIsRouteNetworkOpen(false)}
          onSelectRoute={(from, to, mode) => {
            handleUpdateSearchState({ fromCity: from, toCity: to, transportType: mode });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Global Live Real-Time Seat Occupancy & Scarcity Radar Modal */}
        <LiveOccupancyRadarModal
          isOpen={isOccupancyOpen}
          onClose={() => setIsOccupancyOpen(false)}
          onSelectRoute={(from, to, mode) => {
            handleUpdateSearchState({ fromCity: from, toCity: to, transportType: mode });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onShowToast={showToast}
        />

        {/* Global Turkey 81 Provinces & Transit Directory Modal */}
        <AllProvincesTransitModal
          isOpen={isProvincesModalOpen}
          onClose={() => setIsProvincesModalOpen(false)}
          onSelectRoute={(from, to, mode) => {
            handleUpdateSearchState({ fromCity: from, toCity: to, transportType: mode });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Global Smart Multi-Leg Layover & Transfer Planner Modal */}
        <SmartTransferPlannerModal
          isOpen={isTransfersModalOpen}
          onClose={() => setIsTransfersModalOpen(false)}
          onSelectRoute={(from, to, mode) => {
            handleUpdateSearchState({ fromCity: from, toCity: to, transportType: mode });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onShowToast={showToast}
        />

        {/* Global Vehicle Seating Comfort & Sun Direction Simulator Modal */}
        <SeatComfortGuideModal
          isOpen={isSeatComfortModalOpen}
          onClose={() => setIsSeatComfortModalOpen(false)}
        />

        {/* Global Self-Service Ticket Reschedule & Departure Change Modal */}
        <TicketRescheduleModal
          isOpen={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          tickets={tickets}
          onShowToast={showToast}
        />

        {/* Global Onboard Multimedia & Wi-Fi Entertainment Guide Modal */}
        <OnboardEntertainmentModal
          isOpen={isEntertainmentModalOpen}
          onClose={() => setIsEntertainmentModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Express Bus & Flight Parcel Cargo Tracking Modal */}
        <ExpressParcelTransitModal
          isOpen={isParcelModalOpen}
          onClose={() => setIsParcelModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global TCDD Sleeper & Scenic Train Guide Modal */}
        <SleeperTrainGuideModal
          isOpen={isSleeperTrainModalOpen}
          onClose={() => setIsSleeperTrainModalOpen(false)}
          onSelectRoute={(from, to) => {
            handleUpdateSearchState({ fromCity: from, toCity: to, transportType: 'tren' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onShowToast={showToast}
        />

        {/* Global Sea Transit & Island Ferry Guide Modal */}
        <SeaTransitFerryGuideModal
          isOpen={isFerryGuideModalOpen}
          onClose={() => setIsFerryGuideModalOpen(false)}
          onSelectRoute={(from, to) => {
            handleUpdateSearchState({ fromCity: from, toCity: to, transportType: 'feribot' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onShowToast={showToast}
        />

        {/* Global Bicycle & E-Scooter Transit Guide Modal */}
        <BicycleTransitGuideModal
          isOpen={isBicycleModalOpen}
          onClose={() => setIsBicycleModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Car Rental & Hub Transfer Guide Modal */}
        <CarRentalTransitGuideModal
          isOpen={isCarRentalModalOpen}
          onClose={() => setIsCarRentalModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Live Transit Scraper & Ingestion Status Modal */}
        <LiveTransitScraperModal
          isOpen={isScraperModalOpen}
          onClose={() => setIsScraperModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Smart Travel Budget Calculator Modal */}
        <SmartTravelBudgetCalculatorModal
          isOpen={isBudgetModalOpen}
          onClose={() => setIsBudgetModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Critical Mountain Passes & Highway Tunnels Radar Modal */}
        <HighwayPassesLiveRadarModal
          isOpen={isHighwayPassesModalOpen}
          onClose={() => setIsHighwayPassesModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Seat Upgrade & Extra Comfort Assistant Modal */}
        <SeatUpgradeComfortPlannerModal
          isOpen={isSeatUpgradeModalOpen}
          onClose={() => setIsSeatUpgradeModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Carbon Offset & Green Tree Certificate Modal */}
        <EcoTreeOffsetCertificateModal
          isOpen={isEcoCertificateModalOpen}
          onClose={() => setIsEcoCertificateModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Airport Express Shuttle Guide Modal */}
        <AirportExpressBusGuideModal
          isOpen={isAirportShuttleModalOpen}
          onClose={() => setIsAirportShuttleModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Highway EV Charging Corridor Guide Modal */}
        <ElectricVehicleChargingGuideModal
          isOpen={isEvChargingModalOpen}
          onClose={() => setIsEvChargingModalOpen(false)}
          onShowToast={showToast}
        />

        {/* Global Price Drop Alert Modal */}
        <PriceAlertModal
          isOpen={priceAlertData.isOpen}
          onClose={() => setPriceAlertData((prev) => ({ ...prev, isOpen: false }))}
          fromCity={searchState.fromCity}
          toCity={searchState.toCity}
          currentMinPrice={priceAlertData.minPrice}
          routeKey={live.status === 'ok' ? live.result.routeKey : null}
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
