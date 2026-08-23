// Bileo Custom SVG Icon Design System - Challenger 1 Adversarial Testing Harness
// Author: challenger_test_1 (E2E Testing Track)
// Deep edge cases, AST scanner stress-testing, SVG component boundary fuzzing & oracles.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from './test_framework';
import { scanCodebaseForPackage, getTransportModeIcon } from './icon_system.test';

import {
  BileoBusIcon,
  BileoPlaneIcon,
  BileoTrainIcon,
  BileoFerryIcon,
  BileoMaleIcon,
  BileoFemaleIcon,
  BileoCheckIcon,
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
  BileoCalendar,
  BileoClock,
  BileoSearch,
  BileoMapPin,
  BileoTicket,
  BileoUser,
  BileoCompass,
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
  BileoSparkles,
  BileoLuggage,
  BileoWifi,
  BileoZap,
  BileoCoffee,
  BileoTv,
  // Aliases
  BileoX,
  BileoArrowRightLeft,
  BileoCheckCircle2,
  BileoRefreshCw,
  BileoPower,
  BileoArrowUpDown,
  BileoBus,
  BileoPlane,
  BileoFlight,
  BileoFlightIcon,
  BileoTrain,
  BileoFerry,
  BileoMale,
  BileoFemale,
  BileoCheckMark,
} from '../components/icons';

const ALL_BESPOKE_ICONS: Array<{ name: string; component: React.ComponentType<any> }> = [
  { name: 'BileoBusIcon', component: BileoBusIcon },
  { name: 'BileoPlaneIcon', component: BileoPlaneIcon },
  { name: 'BileoTrainIcon', component: BileoTrainIcon },
  { name: 'BileoFerryIcon', component: BileoFerryIcon },
  { name: 'BileoMaleIcon', component: BileoMaleIcon },
  { name: 'BileoFemaleIcon', component: BileoFemaleIcon },
  { name: 'BileoCheckIcon', component: BileoCheckIcon },
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
  { name: 'BileoCalendar', component: BileoCalendar },
  { name: 'BileoClock', component: BileoClock },
  { name: 'BileoSearch', component: BileoSearch },
  { name: 'BileoMapPin', component: BileoMapPin },
  { name: 'BileoTicket', component: BileoTicket },
  { name: 'BileoUser', component: BileoUser },
  { name: 'BileoCompass', component: BileoCompass },
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
  { name: 'BileoSparkles', component: BileoSparkles },
  { name: 'BileoLuggage', component: BileoLuggage },
  { name: 'BileoWifi', component: BileoWifi },
  { name: 'BileoZap', component: BileoZap },
  { name: 'BileoCoffee', component: BileoCoffee },
  { name: 'BileoTv', component: BileoTv },
];

export function runChallengerIconAdversarialTests(): void {
  // =========================================================================
  // Adversarial Suite 1: AST Scanner Stress & Oracle Invariants
  // =========================================================================
  describe('Challenger 1 - Suite 1: AST Scanner Adversarial Edge Cases & Oracles', () => {
    const fixtureDir = path.resolve('node_modules/.temp_challenger_ast');

    function createFixture(fileName: string, fileContent: string): string {
      cleanupFixtures();
      if (!fs.existsSync(fixtureDir)) fs.mkdirSync(fixtureDir, { recursive: true });
      const filePath = path.join(fixtureDir, fileName);
      fs.writeFileSync(filePath, fileContent, 'utf8');
      return filePath;
    }

    function cleanupFixtures() {
      if (fs.existsSync(fixtureDir)) {
        try {
          fs.rmSync(fixtureDir, { recursive: true, force: true });
        } catch {
          // ignore
        }
      }
    }

    it('1.1 Multiline Static Imports: Should catch formatted multiline named imports with newlines and trailing commas', () => {
      const code = `
        import React from 'react';
        import {
          Search,
          ChevronRight,
          Bus as LucideBus,
          Ticket,
        } from 'lucide-react';
        
        export const TestComponent = () => <div />;
      `;
      createFixture('multiline_import.tsx', code);
      try {
        const { violations } = scanCodebaseForPackage(fixtureDir, 'lucide-react', []);
        expect(violations.length).toBe(1);
        expect(violations[0].type).toBe('static_import');
        expect(violations[0].startLine).toBe(3);
        expect(violations[0].endLine).toBe(8);
      } finally {
        cleanupFixtures();
      }
    });

    it('1.2 Default and Namespace Imports: Should catch namespace and default import syntax', () => {
      const code = `
        import * as LucideIcons from 'lucide-react';
        import LucideDefault from 'lucide-react';
      `;
      createFixture('namespace_import.tsx', code);
      try {
        const { violations } = scanCodebaseForPackage(fixtureDir, 'lucide-react', []);
        expect(violations.length).toBe(2);
        expect(violations.every((v) => v.type === 'static_import')).toBeTruthy();
      } finally {
        cleanupFixtures();
      }
    });

    it('1.3 Type-Only Static Imports: Should catch import type statements', () => {
      const code = `
        import type { LucideIcon, LucideProps } from 'lucide-react';
        import type LucideDefaultType from 'lucide-react';
      `;
      createFixture('type_import.tsx', code);
      try {
        const { violations } = scanCodebaseForPackage(fixtureDir, 'lucide-react', []);
        expect(violations.length).toBe(2);
        expect(violations.every((v) => v.type === 'static_import')).toBeTruthy();
      } finally {
        cleanupFixtures();
      }
    });

    it('1.4 Subpath / Deep Imports: Should catch deep nested module imports', () => {
      const code = `
        import { Bus } from 'lucide-react/dist/esm/icons/bus';
        import 'lucide-react/dist/cjs/lucide-react';
      `;
      createFixture('subpath_import.tsx', code);
      try {
        const { violations } = scanCodebaseForPackage(fixtureDir, 'lucide-react', []);
        expect(violations.length).toBe(2);
        expect(violations[0].type).toBe('static_import');
        expect(violations[1].type).toBe('static_import');
      } finally {
        cleanupFixtures();
      }
    });

    it('1.5 Multiline Dynamic Imports: Should catch dynamic import() with arbitrary whitespace & template literals', () => {
      const code = `
        const loadIcons = async () => {
          const mod1 = await import('lucide-react');
          const mod2 = await import(
            'lucide-react/dist/esm/icons/plane'
          );
          const mod3 = await import(\`lucide-react\`);
          return { mod1, mod2, mod3 };
        };
      `;
      createFixture('dynamic_import.tsx', code);
      try {
        const { violations } = scanCodebaseForPackage(fixtureDir, 'lucide-react', []);
        expect(violations.length).toBe(3);
        expect(violations.every((v) => v.type === 'dynamic_import')).toBeTruthy();
      } finally {
        cleanupFixtures();
      }
    });

    it('1.6 Multiline CommonJS Require: Should catch require() across varied spacing and subpaths', () => {
      const code = `
        const lucide = require('lucide-react');
        const { Bus } = require(
          "lucide-react/dist/cjs/icons/bus"
        );
        const dynamicReq = require(\`lucide-react\`);
      `;
      createFixture('require_import.tsx', code);
      try {
        const { violations } = scanCodebaseForPackage(fixtureDir, 'lucide-react', []);
        expect(violations.length).toBe(3);
        expect(violations.every((v) => v.type === 'require')).toBeTruthy();
      } finally {
        cleanupFixtures();
      }
    });

    it('1.7 Re-Export Statements: Should catch named, wildcard, and aliased re-exports', () => {
      const code = `
        export { Bus, Train } from 'lucide-react';
        export * from 'lucide-react';
        export * as LucideIcons from 'lucide-react';
        export type { LucideIcon } from 'lucide-react';
      `;
      createFixture('re_exports.tsx', code);
      try {
        const { violations } = scanCodebaseForPackage(fixtureDir, 'lucide-react', []);
        expect(violations.length).toBe(4);
        expect(violations.every((v) => v.type === 're_export')).toBeTruthy();
      } finally {
        cleanupFixtures();
      }
    });

    it('1.8 Comments and String Mentions: Ultra-strict zero-tolerance flags comments as string_reference violations', () => {
      const code = `
        // TODO: Purged lucide-react in favor of Bileo custom icons
        /* Note: lucide-react was previously used here */
        const notes = "This platform is 100% free of lucide-react";
      `;
      createFixture('comments_test.tsx', code);
      try {
        const { violations } = scanCodebaseForPackage(fixtureDir, 'lucide-react', []);
        expect(violations.length).toBe(3);
        expect(violations.every((v) => v.type === 'string_reference')).toBeTruthy();
      } finally {
        cleanupFixtures();
      }
    });

    it('1.9 False Positive Immunity: Clean codebases with similar words (lucid, reactor, @bileo/icons) produce 0 violations', () => {
      const cleanCode = `
        import React from 'react';
        import { BileoBusIcon } from '../components/icons';
        import { calculateLuhn } from '../utils/crypto';
        
        // This is a lucid and clear architectural implementation
        const reactorCore = { active: true, name: 'lucid-dream' };
        export function CleanComponent() {
          return <div className="lucid-ui"><BileoBusIcon size={24} /></div>;
        }
      `;
      createFixture('clean_file.tsx', cleanCode);
      try {
        const { violations } = scanCodebaseForPackage(fixtureDir, 'lucide-react', []);
        expect(violations.length).toBe(0);
      } finally {
        cleanupFixtures();
      }
    });

    it('1.10 Exact Line-Number Oracle: Verified line coordinates match exact code positions', () => {
      const padding = Array.from({ length: 40 }, (_, i) => `// Line ${i + 1}`).join('\n');
      const code = `${padding}\nimport { Search } from 'lucide-react';\n// Line 42\nconst req = require('lucide-react');`;
      createFixture('line_oracle.tsx', code);
      try {
        const { violations } = scanCodebaseForPackage(fixtureDir, 'lucide-react', []);
        expect(violations.length).toBe(2);
        expect(violations[0].startLine).toBe(41);
        expect(violations[0].endLine).toBe(41);
        expect(violations[0].type).toBe('static_import');

        expect(violations[1].startLine).toBe(43);
        expect(violations[1].endLine).toBe(43);
        expect(violations[1].type).toBe('require');
      } finally {
        cleanupFixtures();
      }
    });

    it('1.11 AST Scanner Consumer Audit: Confirms 0 remaining lucide-react imports across all consumer components', () => {
      const compDir = path.resolve('src/components');
      const { violations } = scanCodebaseForPackage(compDir, 'lucide-react', []);
      expect(violations.length).toBe(0);
    });
  });

  // =========================================================================
  // Adversarial Suite 2: Bespoke Icon Components Prop Matrix & Boundary Fuzzing
  // =========================================================================
  describe('Challenger 1 - Suite 2: Bespoke Icon Components Prop Matrix & SVG Geometry', () => {
    it('2.1 Numeric Size Boundaries: Handles size=0, size=-1, size=1024, size=0.5 across all 45 icons without crashing', () => {
      const boundarySizes = [0, -1, 1024, 0.5, 99999];
      for (const { component } of ALL_BESPOKE_ICONS) {
        for (const s of boundarySizes) {
          const html = renderToStaticMarkup(React.createElement(component, { size: s }));
          expect(html.startsWith('<svg')).toBeTruthy();
          expect(html).toContain(`width="${s}"`);
          expect(html).toContain(`height="${s}"`);
          expect(html).toNotContain('NaN');
        }
      }
    });

    it('2.2 String CSS Size Expressions: Handles CSS units, calc(), min(), and 100% without malformed markup', () => {
      const stringSizes = ['0px', '100%', 'calc(100vw - 32px)', '3.5rem', 'auto', 'clamp(16px, 2vw, 32px)'];
      for (const s of stringSizes) {
        const html = renderToStaticMarkup(React.createElement(BileoBusIcon, { size: s }));
        expect(html).toContain(`width="${s}"`);
        expect(html).toContain(`height="${s}"`);
      }
    });

    it('2.3 Extreme StrokeWidth Boundaries: Handles strokeWidth=0, strokeWidth=12, strokeWidth="0.25", and decimals', () => {
      const boundaryStrokes = [0, 0.001, 1.5, 2.8, 12, '0.5', '3.5px'];
      for (const { component } of ALL_BESPOKE_ICONS) {
        for (const sw of boundaryStrokes) {
          const html = renderToStaticMarkup(React.createElement(component, { strokeWidth: sw }));
          expect(html.startsWith('<svg')).toBeTruthy();
          expect(html).toContain(`stroke-width="${sw}"`);
        }
      }
    });

    it('2.4 Unusual and Extreme ClassNames: Preserves complex Tailwind modifiers, spaces, and special symbols', () => {
      const complexClasses = [
        '',
        '   ',
        'w-12 h-12 text-bordeaux-700 bg-paper-sand/50 shadow-lg transform -rotate-45',
        'p-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/80 active:scale-95 transition-all duration-300',
        'group-hover:translate-x-1 peer-checked:stroke-bordeaux-600',
      ];
      for (const cls of complexClasses) {
        const html = renderToStaticMarkup(React.createElement(BileoPlaneIcon, { className: cls }));
        expect(html).toContain(`class="${cls}"`);
      }
    });

    it('2.5 Inline Style Object Forwarding: Correctly serializes complex React CSSProperties', () => {
      const customStyle: React.CSSProperties = {
        display: 'inline-flex',
        transform: 'rotate(180deg)',
        opacity: 0.85,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
      };
      const html = renderToStaticMarkup(React.createElement(BileoTrainIcon, { style: customStyle }));
      expect(html).toContain('style="display:inline-flex;transform:rotate(180deg);opacity:0.85;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.15))"');
    });

    it('2.6 Accessibility & Title Invariant Matrix across all 45 icons: Injects <title> and toggles aria-hidden', () => {
      for (const { name, component } of ALL_BESPOKE_ICONS) {
        // Case A: With accessible title
        const testTitle = `Accessible ${name}`;
        const htmlWithTitle = renderToStaticMarkup(React.createElement(component, { title: testTitle }));
        expect(htmlWithTitle).toContain(`<title>${testTitle}</title>`);
        expect(htmlWithTitle).toNotContain('aria-hidden="true"');

        // Case B: Without title
        const htmlNoTitle = renderToStaticMarkup(React.createElement(component));
        expect(htmlNoTitle).toContain('aria-hidden="true"');
        expect(htmlNoTitle).toNotContain('<title>');
      }
    });

    it('2.7 ARIA Label, Role, and Data-TestId Pass-Through: Forwards semantic attributes cleanly', () => {
      for (const { component } of ALL_BESPOKE_ICONS) {
        const html = renderToStaticMarkup(
          React.createElement(component, {
            'data-testid': 'custom-bileo-icon',
            'aria-label': 'Bileo Verified Transit Vector',
            role: 'img',
            id: 'root-icon-node',
            tabIndex: 0,
          })
        );
        expect(html).toContain('data-testid="custom-bileo-icon"');
        expect(html).toContain('aria-label="Bileo Verified Transit Vector"');
        expect(html).toContain('role="img"');
        expect(html).toContain('id="root-icon-node"');
        expect(html).toContain('tabindex="0"');
      }
    });

    it('2.8 Vector Geometry Topology Oracle: All 45 icons have valid viewBox="0 0 24 24", fill="none", and valid linework', () => {
      for (const { component } of ALL_BESPOKE_ICONS) {
        const html = renderToStaticMarkup(React.createElement(component));
        expect(html.startsWith('<svg')).toBeTruthy();
        expect(html.endsWith('</svg>')).toBeTruthy();
        expect(html).toContain('viewBox="0 0 24 24"');
        expect(html).toContain('fill="none"');
        expect(html).toContain('stroke="currentColor"');
        expect(html).toNotContain('NaN');
        expect(html).toNotContain('undefined');
        expect(html).toNotContain('[object Object]');

        const hasGeometry =
          html.includes('<path') ||
          html.includes('<circle') ||
          html.includes('<line') ||
          html.includes('<rect') ||
          html.includes('<polyline') ||
          html.includes('<polygon');
        expect(hasGeometry).toBeTruthy();
      }
    });

    it('2.9 Ref Forwarding Integrity: React forwardRef properly decorates all bespoke icons', () => {
      for (const { component } of ALL_BESPOKE_ICONS) {
        expect(component).toBeDefined();
        const isForwardRef =
          typeof component === 'object' &&
          (component as any).$$typeof !== undefined;
        expect(isForwardRef).toBeTruthy();
      }
    });
  });

  // =========================================================================
  // Adversarial Suite 3: Modality Resolver & Semantic Alias Stress
  // =========================================================================
  describe('Challenger 1 - Suite 3: Modality Resolver & Semantic Alias Adversarial Stress', () => {
    it('3.1 Modality Case-Insensitivity & Whitespace Fuzzing: Accurately resolves all casing and whitespace variants', () => {
      const busVariants = ['bus', 'BUS', '  bus  ', 'Otobus', 'OTOBUS', '  otobus  ', 'Bus'];
      busVariants.forEach((v) => {
        expect(getTransportModeIcon(v)).toBe(BileoBusIcon);
      });

      const planeVariants = ['flight', 'FLIGHT', '  flight  ', 'plane', 'PLANE', 'ucak', 'UCAK'];
      planeVariants.forEach((v) => {
        expect(getTransportModeIcon(v)).toBe(BileoPlaneIcon);
      });

      const trainVariants = ['train', 'TRAIN', '  train  ', 'tren', 'TREN'];
      trainVariants.forEach((v) => {
        expect(getTransportModeIcon(v)).toBe(BileoTrainIcon);
      });

      const ferryVariants = ['ferry', 'FERRY', '  ferry  ', 'feribot', 'FERIBOT'];
      ferryVariants.forEach((v) => {
        expect(getTransportModeIcon(v)).toBe(BileoFerryIcon);
      });
    });

    it('3.2 Modality Unknown String & Falsy Fallback Oracle: Gracefully falls back to BileoBusIcon', () => {
      const invalidModalities = ['', '   ', 'submarine', 'teleport', 'hyperloop', null as any, undefined as any];
      invalidModalities.forEach((inv) => {
        expect(getTransportModeIcon(inv)).toBe(BileoBusIcon);
      });
    });

    it('3.3 15 Semantic Aliases Identity Oracle: Strict reference equality against canonical components', () => {
      const aliasTuples: Array<[React.ComponentType<any>, React.ComponentType<any>]> = [
        [BileoX, BileoClose],
        [BileoArrowRightLeft, BileoSwapHorizontal],
        [BileoCheckCircle2, BileoCheckCircle],
        [BileoRefreshCw, BileoRefresh],
        [BileoPower, BileoZap],
        [BileoArrowUpDown, BileoSort],
        [BileoBus, BileoBusIcon],
        [BileoPlane, BileoPlaneIcon],
        [BileoFlight, BileoPlaneIcon],
        [BileoFlightIcon, BileoPlaneIcon],
        [BileoTrain, BileoTrainIcon],
        [BileoFerry, BileoFerryIcon],
        [BileoMale, BileoMaleIcon],
        [BileoFemale, BileoFemaleIcon],
        [BileoCheckMark, BileoCheckIcon],
      ];

      aliasTuples.forEach(([aliasComp, canonicalComp]) => {
        expect(aliasComp).toBe(canonicalComp);
      });
    });

    it('3.4 Modality Pairwise Uniqueness Oracle: All 7 primary transport components have 100% unique markup', () => {
      const primaryIcons = [
        BileoBusIcon,
        BileoPlaneIcon,
        BileoTrainIcon,
        BileoFerryIcon,
        BileoMaleIcon,
        BileoFemaleIcon,
        BileoCheckIcon,
      ];

      const renderedMarkups = primaryIcons.map((Icon) => renderToStaticMarkup(React.createElement(Icon)));
      const uniqueMarkups = new Set(renderedMarkups);
      expect(uniqueMarkups.size).toBe(primaryIcons.length);
    });
  });

  // =========================================================================
  // Adversarial Suite 4: High-Throughput Fuzzing & Deterministic Oracle
  // =========================================================================
  describe('Challenger 1 - Suite 4: High-Throughput Rendering & Determinism Oracles', () => {
    it('4.1 High-Throughput Fuzzing Stress: 1,000 randomized icon renders execute in <1,000ms', () => {
      const start = performance.now();
      const sizes = [16, 20, 24, 32, '1.5rem', '2rem'];
      const strokeWeights = [1.5, 1.75, 2.0, 2.5, 2.8];
      const colors = ['#8A222B', '#1E1B18', '#0D5C3A', 'currentColor'];

      for (let i = 0; i < 1000; i++) {
        const iconEntry = ALL_BESPOKE_ICONS[i % ALL_BESPOKE_ICONS.length];
        const size = sizes[i % sizes.length];
        const strokeWidth = strokeWeights[i % strokeWeights.length];
        const color = colors[i % colors.length];

        const markup = renderToStaticMarkup(
          React.createElement(iconEntry.component, {
            size,
            strokeWidth,
            color,
            className: 'w-5 h-5 transition-colors',
            title: i % 2 === 0 ? `Icon ${i}` : undefined,
          })
        );
        expect(markup.length).toBeGreaterThan(50);
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    it('4.2 Deterministic SVG Markup Oracle: 50 successive renders of each icon yield 100% bitwise identical HTML', () => {
      for (const { component } of ALL_BESPOKE_ICONS) {
        const baseline = renderToStaticMarkup(
          React.createElement(component, { size: 24, strokeWidth: 1.75, color: '#8A222B', title: 'Deterministic Test' })
        );
        for (let j = 0; j < 50; j++) {
          const subsequent = renderToStaticMarkup(
            React.createElement(component, { size: 24, strokeWidth: 1.75, color: '#8A222B', title: 'Deterministic Test' })
          );
          expect(subsequent).toBe(baseline);
        }
      }
    });
  });
}
