// Bileo Bespoke SVG Icon Design System - Empirical Challenger 1 Verification Suite
// Author: challenger_m1_1
// Comprehensive empirical stress tests and prop permutation matrix for all 38+ bespoke icons.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from './test_framework';

import * as BileoIconsExport from '../components/icons';
import {
  // Navigation & Controls (10)
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
  // Travel & Booking (7)
  BileoCalendar,
  BileoClock,
  BileoSearch,
  BileoMapPin,
  BileoTicket,
  BileoUser,
  BileoCompass,
  // Utilities & Verification (15)
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
  // Amenities & Highlights (6)
  BileoSparkles,
  BileoLuggage,
  BileoWifi,
  BileoZap,
  BileoCoffee,
  BileoTv,
  // Transport & Passenger marks (7)
  BileoBusIcon,
  BileoPlaneIcon,
  BileoTrainIcon,
  BileoFerryIcon,
  BileoMaleIcon,
  BileoFemaleIcon,
  BileoCheckIcon,
} from '../components/icons';

export const ALL_CANONICAL_ICONS: Array<{ name: string; component: React.ComponentType<any> }> = [
  // Navigation & Controls
  { name: 'BileoArrowLeft', component: BileoArrowLeft },
  { name: 'BileoArrowRight', component: BileoArrowRight },
  { name: 'BileoSwapHorizontal', component: BileoSwapHorizontal },
  { name: 'BileoChevronLeft', component: BileoChevronLeft },
  { name: 'BileoChevronRight', component: BileoChevronRight },
  { name: 'BileoChevronsRight', component: BileoChevronsRight },
  { name: 'BileoClose', component: BileoClose },
  { name: 'BileoPlus', component: BileoPlus },
  { name: 'BileoFilter', component: BileoFilter },
  { name: 'BileoSort', component: BileoSort },
  // Travel & Booking
  { name: 'BileoCalendar', component: BileoCalendar },
  { name: 'BileoClock', component: BileoClock },
  { name: 'BileoSearch', component: BileoSearch },
  { name: 'BileoMapPin', component: BileoMapPin },
  { name: 'BileoTicket', component: BileoTicket },
  { name: 'BileoUser', component: BileoUser },
  { name: 'BileoCompass', component: BileoCompass },
  // Utilities & Verification
  { name: 'BileoCheck', component: BileoCheck },
  { name: 'BileoCheckCircle', component: BileoCheckCircle },
  { name: 'BileoCopy', component: BileoCopy },
  { name: 'BileoCreditCard', component: BileoCreditCard },
  { name: 'BileoLock', component: BileoLock },
  { name: 'BileoPrinter', component: BileoPrinter },
  { name: 'BileoRotateCcw', component: BileoRotateCcw },
  { name: 'BileoRefresh', component: BileoRefresh },
  { name: 'BileoShieldCheck', component: BileoShieldCheck },
  { name: 'BileoTag', component: BileoTag },
  { name: 'BileoMail', component: BileoMail },
  { name: 'BileoAlertCircle', component: BileoAlertCircle },
  { name: 'BileoHeadphones', component: BileoHeadphones },
  { name: 'BileoHeart', component: BileoHeart },
  { name: 'BileoStar', component: BileoStar },
  // Amenities & Highlights
  { name: 'BileoSparkles', component: BileoSparkles },
  { name: 'BileoLuggage', component: BileoLuggage },
  { name: 'BileoWifi', component: BileoWifi },
  { name: 'BileoZap', component: BileoZap },
  { name: 'BileoCoffee', component: BileoCoffee },
  { name: 'BileoTv', component: BileoTv },
  // Transport Modalities & Passenger Marks
  { name: 'BileoBusIcon', component: BileoBusIcon },
  { name: 'BileoPlaneIcon', component: BileoPlaneIcon },
  { name: 'BileoTrainIcon', component: BileoTrainIcon },
  { name: 'BileoFerryIcon', component: BileoFerryIcon },
  { name: 'BileoMaleIcon', component: BileoMaleIcon },
  { name: 'BileoFemaleIcon', component: BileoFemaleIcon },
  { name: 'BileoCheckIcon', component: BileoCheckIcon },
];

export function runEmpiricalChallengerM1Tests(): void {
  describe('Challenger 1 Empirical - Suite 1: Canonical Catalog & Export Verification', () => {
    it('1.1 Exact Catalog Count: Verifies at least 45 canonical bespoke icons are implemented', () => {
      expect(ALL_CANONICAL_ICONS.length).toBeGreaterThanOrEqual(45);
    });

    it('1.2 Barrel Export Completeness: All 45 canonical icons and all aliases are exported from src/components/icons', () => {
      ALL_CANONICAL_ICONS.forEach(({ name }) => {
        expect((BileoIconsExport as any)[name]).toBeDefined();
      });

      const requiredAliases = [
        'BileoX', 'BileoArrowRightLeft', 'BileoCheckCircle2', 'BileoRefreshCw',
        'BileoPower', 'BileoArrowUpDown', 'BileoBus', 'BileoPlane', 'BileoFlight',
        'BileoFlightIcon', 'BileoTrain', 'BileoFerry', 'BileoMale', 'BileoFemale', 'BileoCheckMark',
        'BusIcon', 'PlaneIcon', 'FlightIcon', 'TrainIcon', 'FerryIcon', 'MaleIcon', 'FemaleIcon', 'CheckIcon'
      ];
      requiredAliases.forEach((alias) => {
        expect((BileoIconsExport as any)[alias]).toBeDefined();
      });
    });

    it('1.3 React forwardRef Attachment: Every canonical icon has $$typeof forwardRef symbol and explicit displayName', () => {
      ALL_CANONICAL_ICONS.forEach(({ name, component }) => {
        const isForwardRef = typeof component === 'object' && (component as any).$$typeof !== undefined;
        expect(isForwardRef).toBeTruthy();
        expect((component as any).displayName).toBe(name);
      });
    });
  });

  describe('Challenger 1 Empirical - Suite 2: Exhaustive Prop Permutations across ALL 45 Canonical Icons', () => {
    it('2.1 Numeric Size ({size: 28}): Every icon injects width="28" and height="28"', () => {
      ALL_CANONICAL_ICONS.forEach(({ component }) => {
        const markup = renderToStaticMarkup(React.createElement(component, { size: 28 }));
        expect(markup).toContain('width="28"');
        expect(markup).toContain('height="28"');
      });
    });

    it('2.2 String CSS Size ({size: "1.75rem"}): Every icon injects width="1.75rem" and height="1.75rem"', () => {
      ALL_CANONICAL_ICONS.forEach(({ component }) => {
        const markup = renderToStaticMarkup(React.createElement(component, { size: '1.75rem' }));
        expect(markup).toContain('width="1.75rem"');
        expect(markup).toContain('height="1.75rem"');
      });
    });

    it('2.3 Custom StrokeWidth ({strokeWidth: 2.5}): Every icon injects stroke-width="2.5"', () => {
      ALL_CANONICAL_ICONS.forEach(({ component }) => {
        const markup = renderToStaticMarkup(React.createElement(component, { strokeWidth: 2.5 }));
        expect(markup).toContain('stroke-width="2.5"');
      });
    });

    it('2.4 Custom Hex Color ({color: "#8A222B"}): Every icon overrides stroke with "#8A222B"', () => {
      ALL_CANONICAL_ICONS.forEach(({ component }) => {
        const markup = renderToStaticMarkup(React.createElement(component, { color: '#8A222B' }));
        expect(markup).toContain('stroke="#8A222B"');
      });
    });

    it('2.5 Custom ClassName ({className: "test-class"}): Every icon renders custom className', () => {
      ALL_CANONICAL_ICONS.forEach(({ component }) => {
        const markup = renderToStaticMarkup(React.createElement(component, { className: 'test-class' }));
        expect(markup).toContain('class="test-class"');
      });
    });

    it('2.6 Accessibility Title Injection ({title: "Accessible Title"}): Every icon injects <title> and removes aria-hidden', () => {
      ALL_CANONICAL_ICONS.forEach(({ component }) => {
        const markup = renderToStaticMarkup(React.createElement(component, { title: 'Accessible Title' }));
        expect(markup).toContain('<title>Accessible Title</title>');
        expect(markup).toNotContain('aria-hidden="true"');
      });
    });

    it('2.7 Decorative Icon Default ({title: undefined}): Every icon sets aria-hidden="true" and omits <title>', () => {
      ALL_CANONICAL_ICONS.forEach(({ component }) => {
        const markup = renderToStaticMarkup(React.createElement(component));
        expect(markup).toContain('aria-hidden="true"');
        expect(markup).toNotContain('<title>');
      });
    });

    it('2.8 Ref Forwarding Verification: Instantiating with ref forwarding creates valid element with ref prop preserved', () => {
      ALL_CANONICAL_ICONS.forEach(({ name, component }) => {
        const refCallback = (_el: SVGSVGElement | null) => {};
        const element = React.createElement(component, { ref: refCallback, 'data-testid': `icon-${name}` });
        expect(element).toBeDefined();
        expect(element.props['data-testid']).toBe(`icon-${name}`);
        // Render markup to ensure rendering with ref does not fail
        const markup = renderToStaticMarkup(element);
        expect(markup.startsWith('<svg')).toBeTruthy();
        expect(markup).toContain(`data-testid="icon-${name}"`);
      });
    });

    it('2.9 Simultaneous Compound Props Permutation: All 7 props applied together render correctly without conflicts', () => {
      ALL_CANONICAL_ICONS.forEach(({ name, component }) => {
        const compoundProps = {
          size: '2.25rem',
          strokeWidth: 2.2,
          color: '#0D5C3A',
          className: 'custom-icon-class shadow-sm',
          title: `Compound ${name}`,
          'data-custom-attr': 'bileo-verified',
          style: { opacity: 0.95 },
        };
        const markup = renderToStaticMarkup(React.createElement(component, compoundProps as any));
        expect(markup).toContain('width="2.25rem"');
        expect(markup).toContain('height="2.25rem"');
        expect(markup).toContain('stroke-width="2.2"');
        expect(markup).toContain('stroke="#0D5C3A"');
        expect(markup).toContain('custom-icon-class shadow-sm');
        expect(markup).toContain(`<title>Compound ${name}</title>`);
        expect(markup).toContain('data-custom-attr="bileo-verified"');
        expect(markup).toContain('opacity:0.95');
        expect(markup).toNotContain('aria-hidden="true"');
      });
    });
  });

  describe('Challenger 1 Empirical - Suite 3: Zero-Defect Codebase & Subsystem Audit', () => {
    it('3.1 Subsystem Source Code lucide-react Scan: src/components/icons/ has exactly 0 external icon dependencies', () => {
      const iconsDir = path.resolve('src/components/icons');
      const files = fs.readdirSync(iconsDir);
      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(path.join(iconsDir, file), 'utf8');
          expect(content.includes('lucide-react')).toBeFalsy();
          expect(content.includes('@heroicons')).toBeFalsy();
          expect(content.includes('react-icons')).toBeFalsy();
        }
      }
    });

    it('3.2 Vector Geometry Sanity Check: All 45 canonical icons have viewBox="0 0 24 24" and non-empty paths/polygons', () => {
      ALL_CANONICAL_ICONS.forEach(({ component }) => {
        const markup = renderToStaticMarkup(React.createElement(component));
        expect(markup).toContain('viewBox="0 0 24 24"');
        expect(markup).toContain('fill="none"');
        expect(markup).toContain('stroke-linecap="round"');
        expect(markup).toContain('stroke-linejoin="round"');
        expect(markup.includes('<path') || markup.includes('<circle') || markup.includes('<rect') || markup.includes('<polygon') || markup.includes('<line')).toBeTruthy();
      });
    });
  });
}
