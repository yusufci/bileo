/**
 * Tier 5 Comprehensive Adversarial Stress Testing Suite
 * Conducted by challenger_final_2_1 for Final Milestone Verification.
 * 
 * Focus Areas:
 * 1. Color inheritance & theme styling (currentColor propagation, explicit color props, Bileo brand colors, CSS classes)
 * 2. Theme switching & dark mode stress tests (dark/light/contrast wrappers, contrast ratio math, 1000-cycle stress)
 * 3. Dynamic strokeWidth & boundary precision (numeric, string, float, boundary cases, vent math)
 * 4. Custom className merging & size polymorphism
 * 5. Repository-wide zero lucide-react & package.json audit
 * 6. High-throughput fuzzing & bitwise SSR determinism
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from './test_framework';
import * as IconBarrel from '../components/icons';

// Extract all canonical icons
const canonicalIcons: Record<string, React.ComponentType<any>> = {
  // Navigation & Controls (10)
  BileoArrowLeft: IconBarrel.BileoArrowLeft,
  BileoArrowRight: IconBarrel.BileoArrowRight,
  BileoSwapHorizontal: IconBarrel.BileoSwapHorizontal,
  BileoChevronLeft: IconBarrel.BileoChevronLeft,
  BileoChevronRight: IconBarrel.BileoChevronRight,
  BileoChevronsRight: IconBarrel.BileoChevronsRight,
  BileoClose: IconBarrel.BileoClose,
  BileoPlus: IconBarrel.BileoPlus,
  BileoFilter: IconBarrel.BileoFilter,
  BileoSort: IconBarrel.BileoSort,

  // Travel & Booking (7)
  BileoCalendar: IconBarrel.BileoCalendar,
  BileoClock: IconBarrel.BileoClock,
  BileoSearch: IconBarrel.BileoSearch,
  BileoMapPin: IconBarrel.BileoMapPin,
  BileoTicket: IconBarrel.BileoTicket,
  BileoUser: IconBarrel.BileoUser,
  BileoCompass: IconBarrel.BileoCompass,

  // Utilities & Verification (15)
  BileoCheck: IconBarrel.BileoCheck,
  BileoCheckCircle: IconBarrel.BileoCheckCircle,
  BileoCopy: IconBarrel.BileoCopy,
  BileoCreditCard: IconBarrel.BileoCreditCard,
  BileoLock: IconBarrel.BileoLock,
  BileoPrinter: IconBarrel.BileoPrinter,
  BileoRotateCcw: IconBarrel.BileoRotateCcw,
  BileoRefresh: IconBarrel.BileoRefresh,
  BileoShieldCheck: IconBarrel.BileoShieldCheck,
  BileoTag: IconBarrel.BileoTag,
  BileoMail: IconBarrel.BileoMail,
  BileoAlertCircle: IconBarrel.BileoAlertCircle,
  BileoHeadphones: IconBarrel.BileoHeadphones,
  BileoHeart: IconBarrel.BileoHeart,
  BileoStar: IconBarrel.BileoStar,

  // Amenities & Highlights (6)
  BileoSparkles: IconBarrel.BileoSparkles,
  BileoLuggage: IconBarrel.BileoLuggage,
  BileoWifi: IconBarrel.BileoWifi,
  BileoZap: IconBarrel.BileoZap,
  BileoCoffee: IconBarrel.BileoCoffee,
  BileoTv: IconBarrel.BileoTv,

  // Transport Modalities & Passenger Marks (7)
  BileoBusIcon: IconBarrel.BileoBusIcon,
  BileoPlaneIcon: IconBarrel.BileoPlaneIcon,
  BileoTrainIcon: IconBarrel.BileoTrainIcon,
  BileoFerryIcon: IconBarrel.BileoFerryIcon,
  BileoMaleIcon: IconBarrel.BileoMaleIcon,
  BileoFemaleIcon: IconBarrel.BileoFemaleIcon,
  BileoCheckIcon: IconBarrel.BileoCheckIcon,
};

const canonicalIconList = Object.entries(canonicalIcons);

// Brand colors definitions
const BRAND_COLORS = {
  BORDEAUX: '#8A222B',
  EMERALD: '#10B981',
  PARCHMENT: '#FBF9F5',
  CHARCOAL: '#1E1B18',
  WHITE: '#FFFFFF',
};

// Helper: Calculate relative luminance for WCAG contrast calculations
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const [R, G, B] = [r, g, b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

// Helper: Calculate WCAG contrast ratio between two hex colors
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (brighter + 0.05) / (darker + 0.05);
}

export function runChallengerFinal2_1AdversarialTests() {
  // ============================================================================
  // SUITE 1: Color Inheritance & Brand Color Propagation Oracles
  // ============================================================================
  describe('Challenger Final 2.1 - Suite 1: Color Inheritance & Brand Color Oracles', () => {
    it('1.1 Universal currentColor Propagation: Every icon defaults to stroke="currentColor" without explicit color prop', () => {
      for (const [_name, Component] of canonicalIconList) {
        const html = renderToStaticMarkup(React.createElement(Component));
        expect(html.includes('stroke="currentColor"')).toBeTruthy();
      }
    });

    it('1.2 Explicit Hex Color Override: Primary Bordeaux (#8A222B) overrides stroke on all 45 icons', () => {
      for (const [_name, Component] of canonicalIconList) {
        const html = renderToStaticMarkup(React.createElement(Component, { color: BRAND_COLORS.BORDEAUX }));
        expect(html.includes('stroke="#8A222B"')).toBeTruthy();
        expect(html.includes('stroke="currentColor"')).toBeFalsy();
      }
    });

    it('1.3 Explicit Hex Color Override: Emerald Transit Accent (#10B981) overrides stroke on all 45 icons', () => {
      for (const [_name, Component] of canonicalIconList) {
        const html = renderToStaticMarkup(React.createElement(Component, { color: BRAND_COLORS.EMERALD }));
        expect(html.includes('stroke="#10B981"')).toBeTruthy();
      }
    });

    it('1.4 Explicit Hex Color Override: Charcoal (#1E1B18) and Parchment (#FBF9F5) override stroke accurately', () => {
      for (const [_name, Component] of canonicalIconList) {
        const charcoalHtml = renderToStaticMarkup(React.createElement(Component, { color: BRAND_COLORS.CHARCOAL }));
        expect(charcoalHtml.includes('stroke="#1E1B18"')).toBeTruthy();

        const parchmentHtml = renderToStaticMarkup(React.createElement(Component, { color: BRAND_COLORS.PARCHMENT }));
        expect(parchmentHtml.includes('stroke="#FBF9F5"')).toBeTruthy();
      }
    });

    it('1.5 Diverse Color Formats (rgb, rgba, hsl, named) propagate without distortion', () => {
      const testColors = [
        'rgb(138, 34, 43)',
        'rgba(16, 185, 129, 0.85)',
        'hsl(352, 60%, 34%)',
        'transparent',
        'white',
      ];
      for (const color of testColors) {
        for (const [_name, Component] of canonicalIconList) {
          const html = renderToStaticMarkup(React.createElement(Component, { color }));
          expect(html.includes(`stroke="${color}"`)).toBeTruthy();
        }
      }
    });

    it('1.6 CSS Variable / Inline Style Stroke and Color propagation is preserved', () => {
      for (const [_name, Component] of canonicalIconList) {
        const html = renderToStaticMarkup(
          React.createElement(Component, {
            style: { stroke: 'var(--brand-bordeaux)', color: 'var(--bileo-charcoal)' },
          })
        );
        expect(html.includes('stroke:var(--brand-bordeaux)')).toBeTruthy();
        expect(html.includes('color:var(--bileo-charcoal)')).toBeTruthy();
      }
    });
  });

  // ============================================================================
  // SUITE 2: CSS Class Styling & Tailwind Utility Integration
  // ============================================================================
  describe('Challenger Final 2.1 - Suite 2: CSS Class Styling & Tailwind Utility Integration', () => {
    it('2.1 Tailwind Brand Color Classes (text-bordeaux-700, text-emerald-600, text-charcoal)', () => {
      const colorClasses = [
        'text-bordeaux-700',
        'text-emerald-600',
        'text-charcoal',
        'text-cream-100',
        'text-white',
        'text-charcoal-muted',
      ];
      for (const cls of colorClasses) {
        for (const [_name, Component] of canonicalIconList) {
          const html = renderToStaticMarkup(React.createElement(Component, { className: `w-4 h-4 ${cls}` }));
          expect(html.includes(`class="w-4 h-4 ${cls}"`)).toBeTruthy();
        }
      }
    });

    it('2.2 Tailwind Advanced Utility Classes (hover, focus, transition, scale, opacity)', () => {
      const advancedClass = 'w-5 h-5 text-bordeaux-700 hover:text-bordeaux-800 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer';
      for (const [_name, Component] of canonicalIconList) {
        const html = renderToStaticMarkup(React.createElement(Component, { className: advancedClass }));
        expect(html.includes(`class="${advancedClass}"`)).toBeTruthy();
      }
    });

    it('2.3 Tailwind Responsive Sizing Classes (sm:w-5 md:w-6 lg:w-8)', () => {
      const responsiveClass = 'w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 shrink-0';
      for (const [_name, Component] of canonicalIconList) {
        const html = renderToStaticMarkup(React.createElement(Component, { className: responsiveClass }));
        expect(html.includes(`class="${responsiveClass}"`)).toBeTruthy();
      }
    });

    it('2.4 SVG Custom Fill and Stroke Classes (fill-current, stroke-2, stroke-bordeaux-700)', () => {
      const svgUtilityClass = 'w-6 h-6 fill-current stroke-2 stroke-bordeaux-700';
      for (const [_name, Component] of canonicalIconList) {
        const html = renderToStaticMarkup(React.createElement(Component, { className: svgUtilityClass }));
        expect(html.includes(`class="${svgUtilityClass}"`)).toBeTruthy();
      }
    });
  });

  // ============================================================================
  // SUITE 3: Theme Switching, Dark Mode & High-Contrast Stress Tests
  // ============================================================================
  describe('Challenger Final 2.1 - Suite 3: Theme Switching, Dark Mode & High-Contrast Container Stress', () => {
    it('3.1 Dark Mode Container Wrapper: Icons render cleanly inside .dark container', () => {
      for (const [_name, Component] of canonicalIconList) {
        const container = React.createElement(
          'div',
          { className: 'dark bg-charcoal text-cream-100 p-4' },
          React.createElement(Component, { className: 'w-5 h-5 text-cream-100' })
        );
        const html = renderToStaticMarkup(container);
        expect(html.includes('class="dark bg-charcoal text-cream-100 p-4"')).toBeTruthy();
        expect(html.includes('class="w-5 h-5 text-cream-100"')).toBeTruthy();
        expect(html.includes('<svg')).toBeTruthy();
        expect(html.includes('</svg>')).toBeTruthy();
      }
    });

    it('3.2 Light Mode Container Wrapper: Icons render cleanly inside .light / cream container', () => {
      for (const [_name, Component] of canonicalIconList) {
        const container = React.createElement(
          'div',
          { className: 'light bg-[#FBF9F5] text-[#1E1B18] p-4' },
          React.createElement(Component, { className: 'w-5 h-5 text-charcoal' })
        );
        const html = renderToStaticMarkup(container);
        expect(html.includes('class="light bg-[#FBF9F5] text-[#1E1B18] p-4"')).toBeTruthy();
        expect(html.includes('class="w-5 h-5 text-charcoal"')).toBeTruthy();
      }
    });

    it('3.3 High-Contrast Container Wrapper: Forced high contrast classes', () => {
      for (const [_name, Component] of canonicalIconList) {
        const container = React.createElement(
          'div',
          { className: 'high-contrast forced-colors:active bg-black text-white border-2 border-white' },
          React.createElement(Component, { className: 'w-6 h-6 text-white' })
        );
        const html = renderToStaticMarkup(container);
        expect(html.includes('forced-colors:active')).toBeTruthy();
        expect(html.includes('class="w-6 h-6 text-white"')).toBeTruthy();
      }
    });

    it('3.4 Brand Color Contrast Ratio Mathematical Invariants (WCAG AA & AAA standards)', () => {
      // 1. Bordeaux (#8A222B) on Parchment Cream (#FBF9F5)
      const bordeauxOnParchment = getContrastRatio(BRAND_COLORS.BORDEAUX, BRAND_COLORS.PARCHMENT);
      expect(bordeauxOnParchment >= 4.5).toBeTruthy(); // Exceeds WCAG AA 4.5:1 threshold (approx 7.2:1)

      // 2. Charcoal (#1E1B18) on Parchment Cream (#FBF9F5)
      const charcoalOnParchment = getContrastRatio(BRAND_COLORS.CHARCOAL, BRAND_COLORS.PARCHMENT);
      expect(charcoalOnParchment >= 12.0).toBeTruthy(); // Exceeds WCAG AAA 7.0:1 threshold (approx 14.5:1)

      // 3. Emerald (#10B981) on Charcoal (#1E1B18)
      const emeraldOnCharcoal = getContrastRatio(BRAND_COLORS.EMERALD, BRAND_COLORS.CHARCOAL);
      expect(emeraldOnCharcoal >= 4.5).toBeTruthy(); // Exceeds WCAG AA 4.5:1 threshold (approx 5.1:1)

      // 4. White (#FFFFFF) on Bordeaux (#8A222B)
      const whiteOnBordeaux = getContrastRatio(BRAND_COLORS.WHITE, BRAND_COLORS.BORDEAUX);
      expect(whiteOnBordeaux >= 4.5).toBeTruthy(); // Exceeds WCAG AA 4.5:1 threshold (approx 6.8:1)
    });

    it('3.5 Rapid Theme Toggle Stress Oracle: 1,000 continuous theme alternation cycles render deterministically', () => {
      const themes = [
        { name: 'dark', containerClass: 'dark bg-charcoal text-cream-100', iconClass: 'w-5 h-5 text-cream-100' },
        { name: 'light', containerClass: 'light bg-cream-100 text-charcoal', iconClass: 'w-5 h-5 text-charcoal' },
        { name: 'luxury', containerClass: 'bg-bordeaux-950 text-cream-50', iconClass: 'w-5 h-5 text-bordeaux-400' },
        { name: 'high-contrast', containerClass: 'bg-black text-white', iconClass: 'w-5 h-5 text-white' },
      ];

      const baselineMap = new Map<string, string>();

      // Record baselines
      for (const theme of themes) {
        for (const [name, Component] of canonicalIconList) {
          const key = `${theme.name}_${name}`;
          const el = React.createElement(
            'div',
            { className: theme.containerClass },
            React.createElement(Component, { className: theme.iconClass })
          );
          baselineMap.set(key, renderToStaticMarkup(el));
        }
      }

      // Execute 1,000 rapid cycles across all icons
      for (let i = 0; i < 1000; i++) {
        const theme = themes[i % themes.length];
        const [name, Component] = canonicalIconList[i % canonicalIconList.length];
        const key = `${theme.name}_${name}`;
        const el = React.createElement(
          'div',
          { className: theme.containerClass },
          React.createElement(Component, { className: theme.iconClass })
        );
        const result = renderToStaticMarkup(el);
        const baseline = baselineMap.get(key);
        expect(result === baseline).toBeTruthy();
      }
    });
  });

  // ============================================================================
  // SUITE 4: Dynamic StrokeWidth & Boundary Invariants
  // ============================================================================
  describe('Challenger Final 2.1 - Suite 4: Dynamic StrokeWidth & Boundary Invariants', () => {
    it('4.1 Default StrokeWidth Invariant: 1.75 on UI icons, 1.8 on transport icons, 2.0/2.8 on check icons', () => {
      // General UI icon test
      const arrowHtml = renderToStaticMarkup(React.createElement(canonicalIcons.BileoArrowLeft));
      expect(arrowHtml.includes('stroke-width="1.75"')).toBeTruthy();

      // Transport icon test
      const busHtml = renderToStaticMarkup(React.createElement(canonicalIcons.BileoBusIcon));
      expect(busHtml.includes('stroke-width="1.8"')).toBeTruthy();

      // Checkmark icon test
      const checkHtml = renderToStaticMarkup(React.createElement(canonicalIcons.BileoCheckIcon));
      expect(checkHtml.includes('stroke-width="2.8"') || checkHtml.includes('stroke-width="2.0"') || checkHtml.includes('stroke-width="2"')).toBeTruthy();
    });

    it('4.2 Numeric StrokeWidth Spectrum (0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0)', () => {
      const widths = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0];
      for (const sw of widths) {
        for (const [_name, Component] of canonicalIconList) {
          const html = renderToStaticMarkup(React.createElement(Component, { strokeWidth: sw }));
          expect(html.includes(`stroke-width="${sw}"`)).toBeTruthy();
        }
      }
    });

    it('4.3 String CSS StrokeWidth Polymorphism ("1.5px", "2", "0.25rem", "inherit")', () => {
      const stringWidths = ['1.5px', '2', '0.25rem', 'inherit'];
      for (const sw of stringWidths) {
        for (const [_name, Component] of canonicalIconList) {
          const html = renderToStaticMarkup(React.createElement(Component, { strokeWidth: sw }));
          expect(html.includes(`stroke-width="${sw}"`)).toBeTruthy();
        }
      }
    });

    it('4.4 Bus AC Vent Adaptive StrokeWidth Calculation: Handles both numeric and string values cleanly', () => {
      const busNumeric = renderToStaticMarkup(React.createElement(canonicalIcons.BileoBusIcon, { strokeWidth: 2.5 }));
      expect(busNumeric.includes('stroke-width="2.2"')).toBeTruthy(); // 2.5 - 0.3 = 2.2

      const busString = renderToStaticMarkup(React.createElement(canonicalIcons.BileoBusIcon, { strokeWidth: '2.5' }));
      expect(busString.includes('stroke-width="1.5"')).toBeTruthy(); // Fallback for string strokeWidth
    });

    it('4.5 Boundary StrokeWidth Values (0, 0.05, 10.0) render without NaN or exceptions', () => {
      const boundaryWidths = [0, 0.05, 10.0];
      for (const sw of boundaryWidths) {
        for (const [_name, Component] of canonicalIconList) {
          const html = renderToStaticMarkup(React.createElement(Component, { strokeWidth: sw }));
          expect(html.includes(`stroke-width="${sw}"`)).toBeTruthy();
          expect(!html.includes('NaN')).toBeTruthy();
        }
      }
    });
  });

  // ============================================================================
  // SUITE 5: Custom ClassName Merging & Size Polymorphism
  // ============================================================================
  describe('Challenger Final 2.1 - Suite 5: Custom ClassName Merging & Size Polymorphism', () => {
    it('5.1 Default ClassName Invariant: Standard icons default to "w-4 h-4", BileoCheckIcon defaults to "w-3 h-3"', () => {
      for (const [name, Component] of canonicalIconList) {
        const html = renderToStaticMarkup(React.createElement(Component));
        if (name === 'BileoCheckIcon') {
          expect(html.includes('class="w-3 h-3"')).toBeTruthy();
        } else {
          expect(html.includes('class="w-4 h-4"')).toBeTruthy();
        }
      }
    });

    it('5.2 Custom ClassName Override: Custom classes completely replace default "w-4 h-4"', () => {
      for (const [_name, Component] of canonicalIconList) {
        const customClass = 'w-10 h-10 text-emerald-600 shadow-md';
        const html = renderToStaticMarkup(React.createElement(Component, { className: customClass }));
        expect(html.includes(`class="${customClass}"`)).toBeTruthy();
        expect(!html.includes('class="w-4 h-4"')).toBeTruthy();
      }
    });

    it('5.3 Empty and Whitespace ClassName values handle gracefully', () => {
      for (const [_name, Component] of canonicalIconList) {
        const emptyHtml = renderToStaticMarkup(React.createElement(Component, { className: '' }));
        expect(emptyHtml.includes('class=""')).toBeTruthy();
      }
    });

    it('5.4 Dual Size Prop + ClassName Coexistence: Both width/height attributes and className are injected', () => {
      for (const [_name, Component] of canonicalIconList) {
        const html = renderToStaticMarkup(
          React.createElement(Component, { size: 32, className: 'text-bordeaux-700 transition-transform' })
        );
        expect(html.includes('width="32"')).toBeTruthy();
        expect(html.includes('height="32"')).toBeTruthy();
        expect(html.includes('class="text-bordeaux-700 transition-transform"')).toBeTruthy();
      }
    });
  });

  // ============================================================================
  // SUITE 6: Repository-Wide Zero-Lucide & Package Dependency Audit
  // ============================================================================
  describe('Challenger Final 2.1 - Suite 6: Zero Lucide-React & Architecture Integrity Audit', () => {
    it('6.1 Zero Lucide-React in Production Source Files (src/components/, src/data/, App.tsx, main.tsx)', () => {
      const srcDir = path.resolve(process.cwd(), 'src');
      const scanDirs = ['components', 'data'];
      const topFiles = ['App.tsx', 'main.tsx', 'index.css'];

      const checkFile = (filePath: string) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('lucide-react') && !line.includes('// note') && !line.includes('* note')) {
            throw new Error(`Forbidden 'lucide-react' reference found in ${filePath}:${i + 1} -> ${line}`);
          }
        }
      };

      for (const dir of scanDirs) {
        const fullDir = path.join(srcDir, dir);
        if (fs.existsSync(fullDir)) {
          const files = fs.readdirSync(fullDir, { recursive: true }) as string[];
          for (const file of files) {
            const fullPath = path.join(fullDir, file);
            if (fs.statSync(fullPath).isFile() && /\.(tsx?|jsx?)$/.test(fullPath)) {
              checkFile(fullPath);
            }
          }
        }
      }

      for (const f of topFiles) {
        const fullPath = path.join(srcDir, f);
        if (fs.existsSync(fullPath)) {
          checkFile(fullPath);
        }
      }
    });

    it('6.2 package.json Dependency Audit: zero lucide-react in dependencies or devDependencies', () => {
      const pkgPath = path.resolve(process.cwd(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

      expect(pkg.dependencies?.['lucide-react']).toBe(undefined);
      expect(pkg.devDependencies?.['lucide-react']).toBe(undefined);
      expect(pkg.peerDependencies?.['lucide-react']).toBe(undefined);
      expect(pkg.optionalDependencies?.['lucide-react']).toBe(undefined);
    });

    it('6.3 Consumer Components Icon Import Standard: All 13 consumer components import from icon subsystem', () => {
      const compDir = path.resolve(process.cwd(), 'src/components');
      const consumerFiles = [
        'CheckoutModal.tsx',
        'DiscoveryCarousel.tsx',
        'Footer.tsx',
        'Header.tsx',
        'HeroSection.tsx',
        'InteractiveTicketShowcase.tsx',
        'MobileBottomNav.tsx',
        'RefundModal.tsx',
        'SearchResults.tsx',
        'SeatSelectionModal.tsx',
        'TicketExperienceScreen.tsx',
        'TicketWalletModal.tsx',
        'WhyBileoSection.tsx',
      ];

      for (const file of consumerFiles) {
        const filePath = path.join(compDir, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          // Must not have any lucide-react import
          expect(content.includes('lucide-react')).toBeFalsy();
        }
      }
    });
  });

  // ============================================================================
  // SUITE 7: High-Throughput Fuzzing & Bitwise SSR Determinism
  // ============================================================================
  describe('Challenger Final 2.1 - Suite 7: High-Throughput Fuzzing & Bitwise SSR Determinism', () => {
    it('7.1 High-Throughput Randomized Fuzzing: 2,500 prop renders execute in <1,500ms', () => {
      const start = performance.now();
      const sizes = [12, 16, 20, 24, 28, 32, '1.5rem', '2rem', undefined];
      const strokeWidths = [1.0, 1.5, 1.75, 2.0, 2.5, '1.8', undefined];
      const colors = ['#8A222B', '#10B981', '#1E1B18', '#FBF9F5', 'currentColor', undefined];
      const classNames = ['w-4 h-4', 'w-6 h-6 text-bordeaux-700', 'hover:scale-110', undefined];
      const titles = ['Accessible Icon', 'Action Button', undefined];

      for (let i = 0; i < 2500; i++) {
        const [_name, Component] = canonicalIconList[i % canonicalIconList.length];
        const size = sizes[i % sizes.length];
        const strokeWidth = strokeWidths[(i * 3) % strokeWidths.length];
        const color = colors[(i * 7) % colors.length];
        const className = classNames[(i * 11) % classNames.length];
        const title = titles[(i * 13) % titles.length];

        const html = renderToStaticMarkup(
          React.createElement(Component, { size, strokeWidth, color, className, title })
        );
        expect(html.length > 50).toBeTruthy();
      }

      const duration = performance.now() - start;
      expect(duration < 1500).toBeTruthy();
    });

    it('7.2 Bitwise SSR Markup Determinism: 50 successive renders of all 45 icons produce bitwise identical HTML', () => {
      for (const [name, Component] of canonicalIconList) {
        const baseline = renderToStaticMarkup(
          React.createElement(Component, {
            size: 24,
            strokeWidth: 2.0,
            color: BRAND_COLORS.BORDEAUX,
            className: 'w-6 h-6 text-bordeaux-700',
            title: `${name} Determinism Test`,
            'data-testid': `icon-${name}`,
          })
        );

        for (let i = 0; i < 50; i++) {
          const current = renderToStaticMarkup(
            React.createElement(Component, {
              size: 24,
              strokeWidth: 2.0,
              color: BRAND_COLORS.BORDEAUX,
              className: 'w-6 h-6 text-bordeaux-700',
              title: `${name} Determinism Test`,
              'data-testid': `icon-${name}`,
            })
          );
          expect(current === baseline).toBeTruthy();
        }
      }
    });
  });
}
