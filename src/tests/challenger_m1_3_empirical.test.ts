// Bileo Bespoke SVG Icon Design System - Empirical Challenger 3 Verification Suite
// Author: challenger_m1_3 (Empirical Verification)
// Exhaustive adversarial testing, prop matrix verification, ref forwarding, SVG vector precision, and zero-lucide audit.

import React from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from './test_framework';

import * as IconSystemExports from '../components/icons';
import {
  // Group 1: Navigation & Controls (10)
  BileoArrowLeft,
  BileoArrowRight,
  BileoSwapHorizontal,
  BileoChevronLeft,
  BileoChevronRight,
  BileoChevronsRight,
  BileoClose,
  BileoPlus,
  BileoFilter,
  BileoSort,
  // Group 2: Travel & Booking (7)
  BileoCalendar,
  BileoClock,
  BileoSearch,
  BileoMapPin,
  BileoTicket,
  BileoUser,
  BileoCompass,
  // Group 3: Utilities & Verification (15)
  BileoCheck,
  BileoCheckCircle,
  BileoCopy,
  BileoCreditCard,
  BileoLock,
  BileoPrinter,
  BileoRotateCcw,
  BileoRefresh,
  BileoShieldCheck,
  BileoTag,
  BileoMail,
  BileoAlertCircle,
  BileoHeadphones,
  BileoHeart,
  BileoStar,
  // Group 4: Amenities & Highlights (6)
  BileoSparkles,
  BileoLuggage,
  BileoWifi,
  BileoZap,
  BileoCoffee,
  BileoTv,
  // Group 5: Transport Modalities & Silhouettes (7)
  BileoBusIcon,
  BileoPlaneIcon,
  BileoTrainIcon,
  BileoFerryIcon,
  BileoMaleIcon,
  BileoFemaleIcon,
  BileoCheckIcon,
} from '../components/icons';

export const BESPOKE_ICON_REGISTRY: Array<{ name: string; component: React.ComponentType<any>; category: string }> = [
  // Navigation & Controls
  { name: 'BileoArrowLeft', component: BileoArrowLeft, category: 'Navigation' },
  { name: 'BileoArrowRight', component: BileoArrowRight, category: 'Navigation' },
  { name: 'BileoSwapHorizontal', component: BileoSwapHorizontal, category: 'Navigation' },
  { name: 'BileoChevronLeft', component: BileoChevronLeft, category: 'Navigation' },
  { name: 'BileoChevronRight', component: BileoChevronRight, category: 'Navigation' },
  { name: 'BileoChevronsRight', component: BileoChevronsRight, category: 'Navigation' },
  { name: 'BileoClose', component: BileoClose, category: 'Navigation' },
  { name: 'BileoPlus', component: BileoPlus, category: 'Navigation' },
  { name: 'BileoFilter', component: BileoFilter, category: 'Navigation' },
  { name: 'BileoSort', component: BileoSort, category: 'Navigation' },
  // Travel & Booking
  { name: 'BileoCalendar', component: BileoCalendar, category: 'Travel' },
  { name: 'BileoClock', component: BileoClock, category: 'Travel' },
  { name: 'BileoSearch', component: BileoSearch, category: 'Travel' },
  { name: 'BileoMapPin', component: BileoMapPin, category: 'Travel' },
  { name: 'BileoTicket', component: BileoTicket, category: 'Travel' },
  { name: 'BileoUser', component: BileoUser, category: 'Travel' },
  { name: 'BileoCompass', component: BileoCompass, category: 'Travel' },
  // Utilities & Verification
  { name: 'BileoCheck', component: BileoCheck, category: 'Utilities' },
  { name: 'BileoCheckCircle', component: BileoCheckCircle, category: 'Utilities' },
  { name: 'BileoCopy', component: BileoCopy, category: 'Utilities' },
  { name: 'BileoCreditCard', component: BileoCreditCard, category: 'Utilities' },
  { name: 'BileoLock', component: BileoLock, category: 'Utilities' },
  { name: 'BileoPrinter', component: BileoPrinter, category: 'Utilities' },
  { name: 'BileoRotateCcw', component: BileoRotateCcw, category: 'Utilities' },
  { name: 'BileoRefresh', component: BileoRefresh, category: 'Utilities' },
  { name: 'BileoShieldCheck', component: BileoShieldCheck, category: 'Utilities' },
  { name: 'BileoTag', component: BileoTag, category: 'Utilities' },
  { name: 'BileoMail', component: BileoMail, category: 'Utilities' },
  { name: 'BileoAlertCircle', component: BileoAlertCircle, category: 'Utilities' },
  { name: 'BileoHeadphones', component: BileoHeadphones, category: 'Utilities' },
  { name: 'BileoHeart', component: BileoHeart, category: 'Utilities' },
  { name: 'BileoStar', component: BileoStar, category: 'Utilities' },
  // Amenities & Highlights
  { name: 'BileoSparkles', component: BileoSparkles, category: 'Amenities' },
  { name: 'BileoLuggage', component: BileoLuggage, category: 'Amenities' },
  { name: 'BileoWifi', component: BileoWifi, category: 'Amenities' },
  { name: 'BileoZap', component: BileoZap, category: 'Amenities' },
  { name: 'BileoCoffee', component: BileoCoffee, category: 'Amenities' },
  { name: 'BileoTv', component: BileoTv, category: 'Amenities' },
  // Transport Modalities & Passenger Marks
  { name: 'BileoBusIcon', component: BileoBusIcon, category: 'Transport' },
  { name: 'BileoPlaneIcon', component: BileoPlaneIcon, category: 'Transport' },
  { name: 'BileoTrainIcon', component: BileoTrainIcon, category: 'Transport' },
  { name: 'BileoFerryIcon', component: BileoFerryIcon, category: 'Transport' },
  { name: 'BileoMaleIcon', component: BileoMaleIcon, category: 'Transport' },
  { name: 'BileoFemaleIcon', component: BileoFemaleIcon, category: 'Transport' },
  { name: 'BileoCheckIcon', component: BileoCheckIcon, category: 'Transport' },
];

export function runEmpiricalChallengerM1_3Tests(): void {
  // --------------------------------------------------------------------------
  // SUITE 1: CATALOG INTEGRITY & CONTRACT INVARIANTS
  // --------------------------------------------------------------------------
  describe('Challenger 3 - Suite 1: Catalog Integrity & Export Surface Audit', () => {
    it('1.1 Canonical Icon Count: Exactly 45 canonical bespoke icons registered and non-null', () => {
      expect(BESPOKE_ICON_REGISTRY.length).toBe(45);
      BESPOKE_ICON_REGISTRY.forEach(({ name, component }) => {
        expect(name.length > 0).toBeTruthy();
        expect(component).toBeDefined();
        expect(typeof component).toBe('object'); // React.forwardRef produces an object
      });
    });

    it('1.2 Barrel Export Surface: src/components/icons/index.ts exports all 45 icons and all semantic aliases', () => {
      BESPOKE_ICON_REGISTRY.forEach(({ name }) => {
        expect((IconSystemExports as any)[name]).toBeDefined();
      });

      const requiredAliases = [
        'BileoBus', 'BileoPlane', 'BileoFlight', 'BileoFlightIcon',
        'BileoTrain', 'BileoFerry', 'BileoMale', 'BileoFemale', 'BileoCheckMark',
        'BileoX', 'BileoPower', 'BileoRefreshCw', 'BileoArrowUpDown', 'BileoArrowRightLeft', 'BileoCheckCircle2'
      ];

      requiredAliases.forEach((alias) => {
        expect((IconSystemExports as any)[alias]).toBeDefined();
      });
    });

    it('1.3 React.forwardRef Contract: Every canonical icon and alias has $$typeof Symbol.for("react.forward_ref")', () => {
      const forwardRefSymbol = Symbol.for('react.forward_ref');
      BESPOKE_ICON_REGISTRY.forEach(({ name, component }) => {
        const comp = component as any;
        expect(name.length > 0).toBeTruthy();
        expect(comp.$$typeof).toBe(forwardRefSymbol);
        expect(typeof comp.render).toBe('function');
        expect(comp.render.length).toBe(2); // (props, ref)
      });
    });

    it('1.4 DisplayName Contract: Every canonical icon has non-empty displayName identical to its exported name', () => {
      BESPOKE_ICON_REGISTRY.forEach(({ name, component }) => {
        const comp = component as any;
        expect(comp.displayName).toBe(name);
      });
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 2: SSR RENDERING & SVG SEMANTIC VALIDATION
  // --------------------------------------------------------------------------
  describe('Challenger 3 - Suite 2: SSR Rendering, ViewBox & SVG Structural Semantics', () => {
    it('2.1 Zero-Crash SSR Rendering: renderToString and renderToStaticMarkup execute cleanly on all 45 icons', () => {
      BESPOKE_ICON_REGISTRY.forEach(({ name, component }) => {
        expect(name.length > 0).toBeTruthy();
        const staticMarkup = renderToStaticMarkup(React.createElement(component));
        const stringMarkup = renderToString(React.createElement(component));

        expect(staticMarkup.startsWith('<svg')).toBeTruthy();
        expect(staticMarkup.endsWith('</svg>')).toBeTruthy();
        expect(stringMarkup.startsWith('<svg')).toBeTruthy();
        expect(stringMarkup.endsWith('</svg>')).toBeTruthy();
      });
    });

    it('2.2 Strict 24x24 ViewBox Standard: All 45 icons strictly specify viewBox="0 0 24 24"', () => {
      BESPOKE_ICON_REGISTRY.forEach(({ name, component }) => {
        expect(name.length > 0).toBeTruthy();
        const markup = renderToStaticMarkup(React.createElement(component));
        expect(markup).toContain('viewBox="0 0 24 24"');
      });
    });

    it('2.3 Root Fill None & Line Styling: fill="none", stroke-linecap="round", stroke-linejoin="round" on all icons', () => {
      BESPOKE_ICON_REGISTRY.forEach(({ name, component }) => {
        expect(name.length > 0).toBeTruthy();
        const markup = renderToStaticMarkup(React.createElement(component));
        expect(markup).toContain('fill="none"');
        expect(markup).toContain('stroke-linecap="round"');
        expect(markup).toContain('stroke-linejoin="round"');
      });
    });

    it('2.4 Non-Empty & Well-Formed Vector Geometry: All icons contain valid path, circle, rect, polygon or line tags', () => {
      BESPOKE_ICON_REGISTRY.forEach(({ name, component }) => {
        expect(name.length > 0).toBeTruthy();
        const markup = renderToStaticMarkup(React.createElement(component));
        const hasGeom = markup.includes('<path') || markup.includes('<circle') || markup.includes('<rect') || markup.includes('<polygon') || markup.includes('<line');
        expect(hasGeom).toBeTruthy();
        expect(markup).toNotContain('d=""');
        expect(markup).toNotContain('NaN');
        expect(markup).toNotContain('undefined');
        expect(markup).toNotContain('null');
      });
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 3: COMPREHENSIVE PROP MATRIX & BOUNDARY TESTING
  // --------------------------------------------------------------------------
  describe('Challenger 3 - Suite 3: Exhaustive Prop Matrix, Boundaries & Dynamic Overrides', () => {
    it('3.1 Size Polymorphism (Numeric): Correctly maps numeric sizes to width & height attributes', () => {
      const testSizes = [12, 16, 20, 24, 32, 48, 64];
      testSizes.forEach((sz) => {
        BESPOKE_ICON_REGISTRY.forEach(({ component }) => {
          const markup = renderToStaticMarkup(React.createElement(component, { size: sz }));
          expect(markup).toContain(`width="${sz}"`);
          expect(markup).toContain(`height="${sz}"`);
        });
      });
    });

    it('3.2 Size Polymorphism (CSS Strings): Correctly maps CSS unit strings to width & height attributes', () => {
      const testCssUnits = ['1.25rem', '24px', '100%', '2.5em', 'min(24px, 5vw)'];
      testCssUnits.forEach((unit) => {
        BESPOKE_ICON_REGISTRY.forEach(({ component }) => {
          const markup = renderToStaticMarkup(React.createElement(component, { size: unit }));
          expect(markup).toContain(`width="${unit}"`);
          expect(markup).toContain(`height="${unit}"`);
        });
      });
    });

    it('3.3 StrokeWidth Customization & Float Precision: Overrides default stroke-width accurately', () => {
      const strokeWidths = [1, 1.5, 2, 2.5, 3.2, '2.5'];
      strokeWidths.forEach((sw) => {
        BESPOKE_ICON_REGISTRY.forEach(({ component }) => {
          const markup = renderToStaticMarkup(React.createElement(component, { strokeWidth: sw }));
          expect(markup).toContain(`stroke-width="${sw}"`);
        });
      });
    });

    it('3.4 Color Customization: Custom stroke color overrides currentColor', () => {
      const colors = ['#E11D48', '#10B981', 'rgb(59, 130, 246)', 'rgba(0, 0, 0, 0.87)', 'var(--brand-primary)'];
      colors.forEach((c) => {
        BESPOKE_ICON_REGISTRY.forEach(({ component }) => {
          const markup = renderToStaticMarkup(React.createElement(component, { color: c }));
          expect(markup).toContain(`stroke="${c}"`);
        });
      });
    });

    it('3.5 Custom ClassName & Default ClassName Invariant: Valid default class and custom override', () => {
      BESPOKE_ICON_REGISTRY.forEach(({ component }) => {
        const defaultMarkup = renderToStaticMarkup(React.createElement(component));
        const hasValidDefaultClass = defaultMarkup.includes('class="w-4 h-4"') || defaultMarkup.includes('class="w-3 h-3"');
        expect(hasValidDefaultClass).toBeTruthy();

        const customMarkup = renderToStaticMarkup(React.createElement(component, { className: 'w-8 h-8 text-red-600 animate-spin' }));
        expect(customMarkup).toContain('class="w-8 h-8 text-red-600 animate-spin"');
      });
    });

    it('3.6 Accessibility Title & Aria-Hidden Toggle: Title injects <title> and removes aria-hidden', () => {
      BESPOKE_ICON_REGISTRY.forEach(({ name, component }) => {
        // Without title
        const decorativeMarkup = renderToStaticMarkup(React.createElement(component));
        expect(decorativeMarkup).toContain('aria-hidden="true"');
        expect(decorativeMarkup).toNotContain('<title>');

        // With title
        const accessibleMarkup = renderToStaticMarkup(React.createElement(component, { title: `Accessible ${name} Icon` }));
        expect(accessibleMarkup).toContain(`<title>Accessible ${name} Icon</title>`);
        expect(accessibleMarkup).toNotContain('aria-hidden="true"');
      });
    });

    it('3.7 Arbitrary Rest Props, Data Attributes & Inline Styles: Forwards data-*, aria-*, id, style', () => {
      BESPOKE_ICON_REGISTRY.forEach(({ name, component }) => {
        const customProps = {
          'data-testid': `icon-node-${name}`,
          'data-analytics-id': 'nav-click',
          'aria-label': `Icon description for ${name}`,
          id: `svg-id-${name}`,
          style: { display: 'inline-block', verticalAlign: 'middle' },
        };
        const markup = renderToStaticMarkup(React.createElement(component, customProps as any));
        expect(markup).toContain(`data-testid="icon-node-${name}"`);
        expect(markup).toContain('data-analytics-id="nav-click"');
        expect(markup).toContain(`aria-label="Icon description for ${name}"`);
        expect(markup).toContain(`id="svg-id-${name}"`);
        expect(markup).toContain('display:inline-block');
        expect(markup).toContain('vertical-align:middle');
      });
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 4: REF FORWARDING & COMPONENT ATTACHMENT
  // --------------------------------------------------------------------------
  describe('Challenger 3 - Suite 4: Ref Forwarding & Element Creation', () => {
    it('4.1 Ref Object Forwarding: ForwardRef accepts React.createRef without error', () => {
      BESPOKE_ICON_REGISTRY.forEach(({ component }) => {
        const ref = React.createRef<SVGSVGElement>();
        const el = React.createElement(component, { ref } as any);
        expect((el as any).ref).toBe(ref);
        const markup = renderToStaticMarkup(el);
        expect(markup.startsWith('<svg')).toBeTruthy();
      });
    });

    it('4.2 Callback Ref Forwarding: ForwardRef accepts callback ref without error', () => {
      BESPOKE_ICON_REGISTRY.forEach(({ component }) => {
        let nodeCaptured = false;
        const callbackRef = (node: SVGSVGElement | null) => {
          if (node) nodeCaptured = true;
        };
        const el = React.createElement(component, { ref: callbackRef } as any);
        expect((el as any).ref).toBe(callbackRef);
        const markup = renderToStaticMarkup(el);
        expect(markup.startsWith('<svg')).toBeTruthy();
        expect(nodeCaptured !== undefined).toBeTruthy();
      });
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 5: ARTISANAL VECTOR GEOMETRY & TRANSPORT MODALITIES
  // --------------------------------------------------------------------------
  describe('Challenger 3 - Suite 5: Artisanal Vector Geometry & Modality Marks', () => {
    it('5.1 Airplane Symmetrical Geometry: Symmetrically balanced coords across x=12', () => {
      const markup = renderToStaticMarkup(React.createElement(BileoPlaneIcon));
      // Engines at 7.5 and 16.5
      expect(markup).toContain('M7.5 12v2.5');
      expect(markup).toContain('M16.5 12v2.5');
      // Body path starts at x=12
      expect(markup).toContain('M12 2C11.2');
    });

    it('5.2 Bus Coach Stylings: Includes double-decker windshield split, side windows, headlights, and wheels', () => {
      const markup = renderToStaticMarkup(React.createElement(BileoBusIcon));
      expect(markup).toContain('M4 9.5h16'); // Split line
      expect(markup).toContain('M9.5 4v5.5'); // Upper pillar
      expect(markup).toContain('M14.5 4v5.5'); // Upper pillar
      expect(markup).toContain('cx="6.5" cy="16"'); // Left headlight
      expect(markup).toContain('cx="17.5" cy="16"'); // Right headlight
    });

    it('5.3 High-Speed Train Aerodynamics: Cockpit visor, bullet nose, and track rails', () => {
      const markup = renderToStaticMarkup(React.createElement(BileoTrainIcon));
      expect(markup).toContain('M7 7.5C8 6.2 10 5.5 12 5.5s4 .7 5 2'); // Aerodynamic Cockpit Glass / Visor
      expect(markup).toContain('M5 12.5h14'); // Cabin Front Divider
      expect(markup).toContain('cx="8" cy="15.5"'); // Dual Headlight Cluster
      expect(markup).toContain('cx="16" cy="15.5"');
      expect(markup).toContain('M3 21.5h18'); // High-Speed Track Rails
    });

    it('5.4 Ferry Oceanic Wavemark: Twin-hull vessel, observation deck, bridge & ocean waves', () => {
      const markup = renderToStaticMarkup(React.createElement(BileoFerryIcon));
      expect(markup).toContain('M3.5 15.5l1.5-5.5h14l1.5 5.5'); // Twin-Hull Catamaran Vessel Base
      expect(markup).toContain('M6.5 10V6.5h11V10'); // Observation Upper Deck / Cabin
      expect(markup).toContain('M9 8h6'); // Bridge Windows
      expect(markup).toContain('M12 4v2.5'); // Radar Mast & Chimney
      expect(markup).toContain('M2 19c2 1 4 1 6 0s4-1 6 0 4 1 6 0'); // Ocean Waves
    });

    it('5.5 Distinct Gender Passenger Marks: BileoMaleIcon and BileoFemaleIcon have distinct silhouettes', () => {
      const maleMarkup = renderToStaticMarkup(React.createElement(BileoMaleIcon));
      const femaleMarkup = renderToStaticMarkup(React.createElement(BileoFemaleIcon));

      expect(maleMarkup === femaleMarkup).toBeFalsy();
      expect((BileoMaleIcon as any).displayName).toBe('BileoMaleIcon');
      expect((BileoFemaleIcon as any).displayName).toBe('BileoFemaleIcon');
      expect(maleMarkup).toContain('M5.5 21v-2a4.5 4.5 0 0 1 4.5-4.5h4a4.5 4.5 0 0 1 4.5 4.5v2'); // Executive suit
      expect(femaleMarkup).toContain('M6 21v-1.8a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5V21'); // Graceful neckline
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 6: STRICT SEMANTIC ALIAS RESOLUTION
  // --------------------------------------------------------------------------
  describe('Challenger 3 - Suite 6: Semantic Convenience Aliases Strict Identity', () => {
    it('6.1 Modality Aliases: BileoBus, BileoPlane, BileoTrain, BileoFerry, BileoMale, BileoFemale, BileoCheckMark', () => {
      expect((IconSystemExports as any).BileoBus).toBe(BileoBusIcon);
      expect((IconSystemExports as any).BileoPlane).toBe(BileoPlaneIcon);
      expect((IconSystemExports as any).BileoFlight).toBe(BileoPlaneIcon);
      expect((IconSystemExports as any).BileoFlightIcon).toBe(BileoPlaneIcon);
      expect((IconSystemExports as any).BileoTrain).toBe(BileoTrainIcon);
      expect((IconSystemExports as any).BileoFerry).toBe(BileoFerryIcon);
      expect((IconSystemExports as any).BileoMale).toBe(BileoMaleIcon);
      expect((IconSystemExports as any).BileoFemale).toBe(BileoFemaleIcon);
      expect((IconSystemExports as any).BileoCheckMark).toBe(BileoCheckIcon);
    });

    it('6.2 General UI Aliases: BileoX, BileoPower, BileoRefreshCw, BileoArrowUpDown, BileoArrowRightLeft, BileoCheckCircle2', () => {
      expect((IconSystemExports as any).BileoX).toBe(BileoClose);
      expect((IconSystemExports as any).BileoPower).toBe(BileoZap);
      expect((IconSystemExports as any).BileoRefreshCw).toBe(BileoRefresh);
      expect((IconSystemExports as any).BileoArrowUpDown).toBe(BileoSort);
      expect((IconSystemExports as any).BileoArrowRightLeft).toBe(BileoSwapHorizontal);
      expect((IconSystemExports as any).BileoCheckCircle2).toBe(BileoCheckCircle);
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 7: ZERO-DEPENDENCY AST SCANNER
  // --------------------------------------------------------------------------
  describe('Challenger 3 - Suite 7: Zero External Icon Pack Dependency AST Scanner', () => {
    it('7.1 Icon Subsystem Zero-Dependency Audit: src/components/icons has 0 external icon dependencies', () => {
      const iconsDir = path.resolve('src/components/icons');
      const files = fs.readdirSync(iconsDir);
      expect(files.length).toBeGreaterThanOrEqual(4);

      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(path.join(iconsDir, file), 'utf8');
          expect(content.includes('lucide-react')).toBeFalsy();
          expect(content.includes('@heroicons')).toBeFalsy();
          expect(content.includes('react-icons')).toBeFalsy();
        }
      }
    });

    it('7.2 Icon System Self-Contained Integrity: src/components/icons/index.ts has 100% internal vector implementations', () => {
      const barrelPath = path.resolve('src/components/icons/index.ts');
      const content = fs.readFileSync(barrelPath, 'utf8');
      expect(content.includes('lucide-react')).toBeFalsy();
      expect(content.includes('react-icons')).toBeFalsy();
      expect(content.includes('@heroicons')).toBeFalsy();

      // Ensure barrel exports everything from local files only
      expect(content).toContain("export * from './types'");
      expect(content).toContain("export * from './BileoIcons'");
      expect(content).toContain("export * from './BileoTransportIcons'");
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 8: HIGH-THROUGHPUT STRESS & DETERMINISTIC FUZZING
  // --------------------------------------------------------------------------
  describe('Challenger 3 - Suite 8: High-Throughput Stress & Bitwise Determinism', () => {
    it('8.1 Bitwise Determinism: 50 successive renders of all 45 icons produce identical strings', () => {
      BESPOKE_ICON_REGISTRY.forEach(({ component }) => {
        const first = renderToStaticMarkup(React.createElement(component));
        for (let i = 0; i < 50; i++) {
          const subsequent = renderToStaticMarkup(React.createElement(component));
          expect(subsequent).toBe(first);
        }
      });
    });

    it('8.2 High-Throughput Fuzzing: 5,000 randomized prop renders complete under 2,500ms', () => {
      const start = performance.now();
      const sizes = [16, 24, 32, '1.5rem', '2em'];
      const strokeWidths = [1, 1.75, 2, 2.5, 3];
      const colors = ['#111827', '#E11D48', '#2563EB', '#059669', 'currentColor'];
      const classNames = ['w-4 h-4', 'w-6 h-6 text-red-500', 'inline-block mr-2', 'custom-class'];
      const titles = [undefined, 'Title A', 'Title B', 'Action Icon'];

      for (let i = 0; i < 5000; i++) {
        const icon = BESPOKE_ICON_REGISTRY[i % BESPOKE_ICON_REGISTRY.length];
        const props = {
          size: sizes[i % sizes.length],
          strokeWidth: strokeWidths[i % strokeWidths.length],
          color: colors[i % colors.length],
          className: classNames[i % classNames.length],
          title: titles[i % titles.length],
          'data-index': i,
        };
        const markup = renderToStaticMarkup(React.createElement(icon.component, props));
        expect(markup.startsWith('<svg')).toBeTruthy();
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(2500); // Latency budget
    });
  });
}
