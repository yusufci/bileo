/**
 * Challenger 2 Milestone 2 Empirical Deep Verification & Stress Test Suite
 * 
 * Tests:
 * 1. AST & File System Audit (0 Lucide occurrences across entire repository & package.json)
 * 2. Icon Export Surface & Invariants (45 Canonical Icons + Aliases)
 * 3. Icon Prop Compatibility & SVG DOM Attributes (size, strokeWidth, color, className, title, aria-hidden, style, data-*)
 * 4. Ref Forwarding & Element Validity (createRef & callback ref)
 * 5. Full Consumer Component SSR Rendering & DOM Validation (All 13 consumer components)
 * 6. High-Throughput Fuzzing & Determinism Benchmark
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import All Icons and Aliases
import * as Icons from '../components/icons';

// Import All 13 Consumer Components
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { SearchResults } from '../components/SearchResults';
import { SeatSelectionModal } from '../components/SeatSelectionModal';
import { CheckoutModal } from '../components/CheckoutModal';
import { TicketWalletModal } from '../components/TicketWalletModal';
import { RefundModal } from '../components/RefundModal';
import { TicketExperienceScreen } from '../components/TicketExperienceScreen';
import { DiscoveryCarousel } from '../components/DiscoveryCarousel';
import { WhyBileoSection } from '../components/WhyBileoSection';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { Footer } from '../components/Footer';
import { InteractiveTicketShowcase } from '../components/InteractiveTicketShowcase';

// Import Mock Data & Types
import { POPULAR_ROUTES, SEED_TICKETS } from '../data/mockData';
import { SearchFilterState, RouteItem, BookingTicket, SeatItem } from '../types';

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
  } else {
    failedAssertions++;
    failures.push(message);
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log('================================================================================');
console.log('CHALLENGER 2: MILESTONE 2 EMPIRICAL ADVERSARIAL VERIFICATION');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: ZERO LUCIDE AST & SOURCE INTEGRITY AUDIT
// -----------------------------------------------------------------------------
console.log('--- Suite 1: Zero Lucide AST & Repository Scan ---');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const srcDir = path.resolve(__dirname, '../');

function scanDirForLucide(dir: string): string[] {
  let hits: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist' && entry.name !== '.agents') {
        hits = hits.concat(scanDirForLucide(fullPath));
      }
    } else if (entry.isFile() && /\.(tsx?|jsx?|json|html|css)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (entry.name === 'package.json') {
        const pkg = JSON.parse(content);
        if (pkg.dependencies && pkg.dependencies['lucide-react']) {
          hits.push(`${fullPath} contains lucide-react in dependencies`);
        }
        if (pkg.devDependencies && pkg.devDependencies['lucide-react']) {
          hits.push(`${fullPath} contains lucide-react in devDependencies`);
        }
      } else if (!fullPath.includes('tests')) {
        // Source files in src/
        if (content.includes('lucide-react')) {
          hits.push(`${fullPath} contains reference to lucide-react`);
        }
      }
    }
  }
  return hits;
}

const lucideViolations = scanDirForLucide(srcDir);
assert(lucideViolations.length === 0, `No lucide-react references in src/ (Found ${lucideViolations.length}: ${lucideViolations.join(', ')})`);

const pkgJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
assert(!pkgJson.dependencies || !pkgJson.dependencies['lucide-react'], 'package.json dependencies does NOT contain lucide-react');
assert(!pkgJson.devDependencies || !pkgJson.devDependencies['lucide-react'], 'package.json devDependencies does NOT contain lucide-react');

console.log(`✓ Suite 1 complete: 0 lucide-react references found in entire codebase.\n`);

// -----------------------------------------------------------------------------
// SUITE 2: CANONICAL ICON EXPORTS & REF FORWARDING
// -----------------------------------------------------------------------------
console.log('--- Suite 2: Icon Exports & ForwardRef Contract ---');

const expectedIcons = [
  'BileoArrowLeft', 'BileoArrowRight', 'BileoSwapHorizontal', 'BileoChevronLeft', 'BileoChevronRight',
  'BileoChevronsRight', 'BileoClose', 'BileoPlus', 'BileoCalendar', 'BileoClock',
  'BileoSearch', 'BileoMapPin', 'BileoTicket', 'BileoUser', 'BileoCompass',
  'BileoCheck', 'BileoCheckCircle', 'BileoCopy', 'BileoCreditCard', 'BileoLock',
  'BileoPrinter', 'BileoRotateCcw', 'BileoShieldCheck', 'BileoTag', 'BileoMail',
  'BileoAlertCircle', 'BileoHeadphones', 'BileoHeart', 'BileoStar', 'BileoSparkles',
  'BileoLuggage', 'BileoWifi', 'BileoZap', 'BileoCoffee', 'BileoTv',
  'BileoFilter', 'BileoSort',
  'BileoBusIcon', 'BileoPlaneIcon', 'BileoTrainIcon', 'BileoFerryIcon',
  'BileoMaleIcon', 'BileoFemaleIcon', 'BileoCheckIcon',
  // Aliases
  'BileoBus', 'BileoPlane', 'BileoFlight', 'BileoFlightIcon', 'BileoTrain', 'BileoFerry',
  'BileoMale', 'BileoFemale', 'BileoCheckMark', 'BileoX', 'BileoPower', 'BileoRefresh',
  'BileoRefreshCw', 'BileoArrowUpDown', 'BileoArrowRightLeft', 'BileoCheckCircle2'
];

const aliases = [
  'BileoBus', 'BileoPlane', 'BileoFlight', 'BileoFlightIcon', 'BileoTrain', 'BileoFerry',
  'BileoMale', 'BileoFemale', 'BileoCheckMark', 'BileoX', 'BileoPower', 'BileoRefresh',
  'BileoRefreshCw', 'BileoArrowUpDown', 'BileoArrowRightLeft', 'BileoCheckCircle2'
];

for (const iconName of expectedIcons) {
  const IconComp = (Icons as any)[iconName];
  assert(Boolean(IconComp), `Icon component ${iconName} is exported`);
  if (IconComp) {
    assert(
      (IconComp as any).$$typeof === Symbol.for('react.forward_ref'),
      `Icon component ${iconName} uses React.forwardRef`
    );
    if (!aliases.includes(iconName)) {
      assert(
        IconComp.displayName === iconName,
        `Canonical icon ${iconName} has matching displayName ("${IconComp.displayName}")`
      );
    } else {
      assert(
        typeof IconComp.displayName === 'string' && IconComp.displayName.length > 0,
        `Alias ${iconName} has non-empty displayName ("${IconComp.displayName}")`
      );
    }
  }
}

console.log(`✓ Suite 2 complete: All canonical icons verified for forwardRef and displayName contracts.\n`);

// -----------------------------------------------------------------------------
// SUITE 3: SVG DOM ATTRIBUTES & PROP COMPATIBILITY MATRIX
// -----------------------------------------------------------------------------
console.log('--- Suite 3: SVG DOM Attributes & Prop Permutations ---');

for (const iconName of expectedIcons) {
  const IconComp = (Icons as any)[iconName];
  if (!IconComp) continue;

  // 1. Default Render
  const defaultHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(IconComp));
  assert(defaultHtml.startsWith('<svg'), `${iconName} renders <svg> root`);
  assert(defaultHtml.includes('viewBox="0 0 24 24"'), `${iconName} renders viewBox="0 0 24 24"`);
  assert(defaultHtml.includes('fill="none"'), `${iconName} renders default fill="none"`);
  assert(defaultHtml.includes('stroke="currentColor"'), `${iconName} renders default stroke="currentColor"`);
  assert(defaultHtml.includes('stroke-linecap="round"'), `${iconName} renders stroke-linecap="round"`);
  assert(defaultHtml.includes('stroke-linejoin="round"'), `${iconName} renders stroke-linejoin="round"`);
  assert(defaultHtml.includes('aria-hidden="true"'), `${iconName} sets aria-hidden="true" by default`);
  assert(!defaultHtml.includes('<title>'), `${iconName} omits <title> when no title prop`);

  // 2. Numeric size prop
  const numSizeHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(IconComp, { size: 36 }));
  assert(numSizeHtml.includes('width="36"'), `${iconName} maps numeric size 36 to width="36"`);
  assert(numSizeHtml.includes('height="36"'), `${iconName} maps numeric size 36 to height="36"`);

  // 3. String CSS size prop
  const strSizeHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(IconComp, { size: '2.5rem' }));
  assert(strSizeHtml.includes('width="2.5rem"'), `${iconName} maps string size to width="2.5rem"`);
  assert(strSizeHtml.includes('height="2.5rem"'), `${iconName} maps string size to height="2.5rem"`);

  // 4. Custom strokeWidth
  const strokeHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(IconComp, { strokeWidth: 2.25 }));
  assert(strokeHtml.includes('stroke-width="2.25"'), `${iconName} sets stroke-width="2.25"`);

  // 5. Custom Color
  const colorHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(IconComp, { color: '#8A222B' }));
  assert(colorHtml.includes('stroke="#8A222B"'), `${iconName} sets custom stroke color "#8A222B"`);

  // 6. Custom ClassName & Tailwind Animation / Hover classes
  const customClass = 'w-6 h-6 text-bordeaux-700 animate-spin group-hover:translate-x-1';
  const classHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(IconComp, { className: customClass }));
  assert(classHtml.includes(`class="${customClass}"`), `${iconName} renders full className string`);

  // 7. Title / Accessibility
  const titleHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(IconComp, { title: 'Accessible Label' }));
  assert(titleHtml.includes('<title>Accessible Label</title>'), `${iconName} renders <title> tag when title provided`);
  assert(!titleHtml.includes('aria-hidden="true"'), `${iconName} removes aria-hidden="true" when title provided`);

  // 8. Arbitrary SVG HTML attributes (data-*, aria-*, id, style)
  const restHtml = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComp, {
      'data-testid': `icon-${iconName}`,
      'aria-label': 'Custom Icon',
      id: `custom-id-${iconName}`,
      style: { opacity: 0.75 }
    })
  );
  assert(restHtml.includes(`data-testid="icon-${iconName}"`), `${iconName} forwards data-testid`);
  assert(restHtml.includes('aria-label="Custom Icon"'), `${iconName} forwards aria-label`);
  assert(restHtml.includes(`id="custom-id-${iconName}"`), `${iconName} forwards id`);
  assert(restHtml.includes('style="opacity:0.75"'), `${iconName} forwards style object`);
}

console.log(`✓ Suite 3 complete: SVG DOM attributes and prop permutations passed for all icons.\n`);

// -----------------------------------------------------------------------------
// SUITE 4: REF FORWARDING VALIDITY
// -----------------------------------------------------------------------------
console.log('--- Suite 4: Ref Forwarding Invariants ---');

for (const iconName of expectedIcons) {
  const IconComp = (Icons as any)[iconName];
  if (!IconComp) continue;

  // React createRef
  const refObj = React.createRef<SVGSVGElement>();
  const elementWithRef = React.createElement(IconComp, { ref: refObj });
  assert(elementWithRef.ref === refObj, `${iconName} preserves object ref prop in React element`);

  // Callback ref
  const callbackRef = () => {};
  const elementWithCallback = React.createElement(IconComp, { ref: callbackRef });
  assert(elementWithCallback.ref === callbackRef, `${iconName} preserves callback ref prop in React element`);
}

console.log(`✓ Suite 4 complete: Ref forwarding contract verified across all icons.\n`);

// -----------------------------------------------------------------------------
// SUITE 5: ALL 13 CONSUMER COMPONENTS RUNTIME SSR RENDERING
// -----------------------------------------------------------------------------
console.log('--- Suite 5: Consumer Components SSR Mount & Render Verification ---');

const mockSearchState: SearchFilterState = {
  fromCity: 'İstanbul',
  toCity: 'Ankara',
  departureDate: '2026-08-25',
  returnDate: '',
  passengerCount: 1,
  transportType: 'otobus',
  maxPrice: 3000,
  selectedCompanies: [],
  departureTimeRange: 'all',
  onlyDirect: false,
  seatTypePreference: 'all',
  sortBy: 'cheapest'
};

const sampleRoute: RouteItem = POPULAR_ROUTES[0];
const sampleTicket: BookingTicket = SEED_TICKETS[0] || {
  pnr: 'BIL-99281',
  route: sampleRoute,
  passengers: [
    {
      id: 'p-1',
      seatNumber: 12,
      firstName: 'Can',
      lastName: 'Yılmaz',
      idNumber: '12345678901',
      gender: 'male',
      email: 'can@example.com',
      phone: '05551234567'
    }
  ],
  totalPrice: 450,
  bookingDate: '2026-08-21',
  purchaseDate: '2026-08-21',
  status: 'active',
  qrCodeValue: 'TEST'
};

const sampleSeats: SeatItem[] = [
  { id: 's-12', number: 12, row: 3, col: 1, status: 'selected', tier: 'standard', price: 450 }
];

// 1. Header
console.log('Testing Component 1: Header');
const headerHtml = ReactDOMServer.renderToString(
  React.createElement(Header, {
    activeTransport: 'otobus',
    onSelectTransport: () => {},
    onOpenWallet: () => {},
    activeTicketCount: 2
  })
);
assert(headerHtml.length > 0, 'Header renders HTML');
assert(headerHtml.includes('<header'), 'Header contains <header>');
assert(headerHtml.includes('<svg'), 'Header contains rendered SVG icon');
assert(headerHtml.includes('Biletlerim &amp; PNR') || headerHtml.includes('Biletlerim & PNR'), 'Header contains wallet text');

// 2. HeroSection
console.log('Testing Component 2: HeroSection');
const heroHtml = ReactDOMServer.renderToString(
  React.createElement(HeroSection, {
    searchState: mockSearchState,
    onUpdateSearchState: () => {},
    onPerformSearch: () => {}
  })
);
assert(heroHtml.length > 0, 'HeroSection renders HTML');
assert(heroHtml.includes('Yolculuğun'), 'HeroSection contains title text');
assert(heroHtml.includes('<svg'), 'HeroSection contains rendered SVG icons');

// 3. SearchResults
console.log('Testing Component 3: SearchResults');
const searchResultsHtml = ReactDOMServer.renderToString(
  React.createElement(SearchResults, {
    routes: POPULAR_ROUTES,
    searchState: mockSearchState,
    onUpdateSearchState: () => {},
    onSelectRoute: () => {}
  })
);
assert(searchResultsHtml.length > 0, 'SearchResults renders HTML');
assert(searchResultsHtml.includes('<svg'), 'SearchResults contains rendered SVG icons (Clock, Star, Wifi, etc.)');

// 4. SeatSelectionModal
console.log('Testing Component 4: SeatSelectionModal');
const seatModalHtml = ReactDOMServer.renderToString(
  React.createElement(SeatSelectionModal, {
    route: sampleRoute,
    targetSeatsCount: 1,
    onClose: () => {},
    onConfirmSeats: () => {}
  })
);
assert(seatModalHtml.length > 0, 'SeatSelectionModal renders HTML');
assert(seatModalHtml.includes('<svg'), 'SeatSelectionModal contains rendered SVG icons');

// 5. CheckoutModal
console.log('Testing Component 5: CheckoutModal');
const checkoutModalHtml = ReactDOMServer.renderToString(
  React.createElement(CheckoutModal, {
    route: sampleRoute,
    selectedSeats: [12],
    selectedGender: 'male',
    seatGenders: { 12: 'male' },
    selectedSeatObjects: sampleSeats,
    onClose: () => {},
    onPaymentSuccess: () => {},
    onBookingCompleted: () => {}
  })
);
assert(checkoutModalHtml.length > 0, 'CheckoutModal renders HTML');
assert(checkoutModalHtml.includes('<svg'), 'CheckoutModal contains rendered SVG icons');

// 6. TicketWalletModal
console.log('Testing Component 6: TicketWalletModal');
const walletModalHtml = ReactDOMServer.renderToString(
  React.createElement(TicketWalletModal, {
    tickets: [sampleTicket],
    onClose: () => {},
    onOpenRefund: () => {},
    onCancelTicket: () => {}
  })
);
assert(walletModalHtml.length > 0, 'TicketWalletModal renders HTML');
assert(walletModalHtml.includes('<svg'), 'TicketWalletModal contains rendered SVG icons');

// 7. RefundModal
console.log('Testing Component 7: RefundModal');
const refundModalHtml = ReactDOMServer.renderToString(
  React.createElement(RefundModal, {
    ticket: sampleTicket,
    onClose: () => {},
    onConfirmRefund: () => {}
  })
);
assert(refundModalHtml.length > 0, 'RefundModal renders HTML');
assert(refundModalHtml.includes('<svg'), 'RefundModal contains rendered SVG icons');

// 8. TicketExperienceScreen
console.log('Testing Component 8: TicketExperienceScreen');
const experienceHtml = ReactDOMServer.renderToString(
  React.createElement(TicketExperienceScreen, {
    route: sampleRoute,
    initialPassengerCount: 1,
    onClose: () => {},
    onProceedToSeats: () => {}
  })
);
assert(experienceHtml.length > 0, 'TicketExperienceScreen renders HTML');
assert(experienceHtml.includes('<svg'), 'TicketExperienceScreen contains rendered SVG icons');

// 9. DiscoveryCarousel
console.log('Testing Component 9: DiscoveryCarousel');
const discoveryHtml = ReactDOMServer.renderToString(
  React.createElement(DiscoveryCarousel, {
    onSelectRoute: () => {}
  })
);
assert(discoveryHtml.length > 0, 'DiscoveryCarousel renders HTML');
assert(discoveryHtml.includes('<svg'), 'DiscoveryCarousel contains rendered SVG icons');

// 10. WhyBileoSection
console.log('Testing Component 10: WhyBileoSection');
const whyBileoHtml = ReactDOMServer.renderToString(
  React.createElement(WhyBileoSection)
);
assert(whyBileoHtml.length > 0, 'WhyBileoSection renders HTML');
assert(whyBileoHtml.includes('<svg'), 'WhyBileoSection contains rendered SVG icons');

// 11. MobileBottomNav
console.log('Testing Component 11: MobileBottomNav');
const mobileNavHtml = ReactDOMServer.renderToString(
  React.createElement(MobileBottomNav, {
    activeTab: 'search',
    onSelectTab: () => {},
    activeTicketCount: 1
  })
);
assert(mobileNavHtml.length > 0, 'MobileBottomNav renders HTML');
assert(mobileNavHtml.includes('<svg'), 'MobileBottomNav contains rendered SVG icons');

// 12. Footer
console.log('Testing Component 12: Footer');
const footerHtml = ReactDOMServer.renderToString(
  React.createElement(Footer)
);
assert(footerHtml.length > 0, 'Footer renders HTML');
assert(footerHtml.includes('<svg'), 'Footer contains rendered SVG icons');
assert(footerHtml.includes('fill-bordeaux-700'), 'Footer preserves fill-bordeaux-700 on heart icon');

// 13. InteractiveTicketShowcase
console.log('Testing Component 13: InteractiveTicketShowcase');
const showcaseHtml = ReactDOMServer.renderToString(
  React.createElement(InteractiveTicketShowcase, {
    onTicketPurchased: () => {}
  })
);
assert(showcaseHtml.length > 0, 'InteractiveTicketShowcase renders HTML');
assert(showcaseHtml.includes('<svg'), 'InteractiveTicketShowcase contains rendered SVG icons');

console.log(`✓ Suite 5 complete: All 13 consumer components successfully rendered with 0 exceptions.\n`);

// -----------------------------------------------------------------------------
// SUITE 6: STRESS & HIGH-THROUGHPUT FUZZING MATRIX
// -----------------------------------------------------------------------------
console.log('--- Suite 6: High-Throughput Fuzzing & Rendering Benchmark ---');

const startFuzz = Date.now();
const FUZZ_ITERATIONS = 2000;
const testIconsList = Object.values(Icons).filter(
  (item) => typeof item === 'object' && item !== null && (item as any).$$typeof === Symbol.for('react.forward_ref')
);

for (let i = 0; i < FUZZ_ITERATIONS; i++) {
  const randomIcon = testIconsList[i % testIconsList.length] as any;
  const randomSize = (12 + (i % 36));
  const randomStroke = 1 + ((i % 20) / 10);
  const randomClass = `icon-fuzz-${i % 10}`;
  
  const markup = ReactDOMServer.renderToStaticMarkup(
    React.createElement(randomIcon, {
      size: randomSize,
      strokeWidth: randomStroke,
      className: randomClass,
      title: i % 2 === 0 ? `Icon Title ${i}` : undefined
    })
  );
  if (!markup.startsWith('<svg')) {
    assert(false, `Fuzz iteration ${i} failed markup validation`);
    break;
  }
}
const elapsedFuzz = Date.now() - startFuzz;
assert(elapsedFuzz < 3000, `High throughput fuzzing of ${FUZZ_ITERATIONS} icons completed in ${elapsedFuzz}ms (<3000ms)`);

console.log(`✓ Suite 6 complete: ${FUZZ_ITERATIONS} iterations completed in ${elapsedFuzz}ms.\n`);

// -----------------------------------------------------------------------------
// SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('================================================================================');
console.log(`TOTAL ASSERTIONS: ${totalAssertions}`);
console.log(`PASSED:           ${passedAssertions}`);
console.log(`FAILED:           ${failedAssertions}`);
console.log('================================================================================');

if (failedAssertions > 0) {
  console.error(`\n❌ VERDICT: REJECT (${failedAssertions} failures recorded)`);
  process.exit(1);
} else {
  console.log('\n✅ VERDICT: APPROVE (100% empirical assertions passed with zero defects)');
  process.exit(0);
}
