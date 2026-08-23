// Bileo Bespoke SVG Icon Design System - Empirical Challenger 2 Verification Suite
// Author: challenger_m1_2
// Stress-tests architecture, forwardRef, displayName, SVG attributes, and zero-lucide invariants.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from './test_framework';
import * as IconExports from '../components/icons';

export function runEmpiricalChallengerM1_2Tests(): void {
  // Extract all runtime component exports from src/components/icons/index.ts
  const exportEntries = Object.entries(IconExports).filter(
    ([, value]) => typeof value === 'object' || typeof value === 'function'
  );

  describe('Challenger 2 - Suite 1: Universal Export & DisplayName Invariants', () => {
    it('1.1 Non-Empty Export Catalog: Exports contain at least 45 icon components and aliases', () => {
      expect(exportEntries.length).toBeGreaterThanOrEqual(45);
    });

    it('1.2 Defined DisplayName on Every Exported Component: All runtime icons have non-empty displayName', () => {
      exportEntries.forEach(([exportName, component]) => {
        const comp = component as any;
        expect(comp).toBeDefined();
        // Check displayName
        expect(typeof comp.displayName).toBe('string');
        expect(comp.displayName.length).toBeGreaterThan(0);
        expect(comp.displayName).toBeDefined();
        expect(exportName).toBeDefined();
      });
    });

    it('1.3 React.forwardRef Symbol Validation: All exported components use React.forwardRef', () => {
      exportEntries.forEach(([exportName, component]) => {
        const comp = component as any;
        const forwardRefSymbol = Symbol.for('react.forward_ref');
        expect(comp.$$typeof).toBe(forwardRefSymbol);
        expect(exportName).toBeDefined();
      });
    });

    it('1.4 Ref Forwarding to <svg>: The underlying render function expects 2 arguments (props, ref)', () => {
      exportEntries.forEach(([exportName, component]) => {
        const comp = component as any;
        expect(typeof comp.render).toBe('function');
        // forwardRef render function takes (props, ref)
        expect(comp.render.length).toBe(2);
        expect(exportName).toBeDefined();
      });
    });
  });

  describe('Challenger 2 - Suite 2: SVG Structural & Geometric Linework Invariants', () => {
    it('2.1 Standard 24x24 ViewBox: Every exported icon renders with viewBox="0 0 24 24"', () => {
      exportEntries.forEach(([exportName, component]) => {
        const markup = renderToStaticMarkup(React.createElement(component as any));
        expect(markup.startsWith('<svg')).toBeTruthy();
        expect(markup.endsWith('</svg>')).toBeTruthy();
        expect(markup).toContain('viewBox="0 0 24 24"');
        expect(exportName).toBeDefined();
      });
    });

    it('2.2 Rounded Stroke Caps & Joins: Every exported icon includes stroke-linecap="round" and stroke-linejoin="round"', () => {
      exportEntries.forEach(([exportName, component]) => {
        if (exportName === 'BileoGoogleIcon' || exportName === 'BileoGoogle') return; // Filled multi-color brand icon
        const markup = renderToStaticMarkup(React.createElement(component as any));
        expect(markup).toContain('stroke-linecap="round"');
        expect(markup).toContain('stroke-linejoin="round"');
        expect(exportName).toBeDefined();
      });
    });

    it('2.3 Root Fill None: Every exported icon sets fill="none" on the root <svg>', () => {
      exportEntries.forEach(([exportName, component]) => {
        if (exportName === 'BileoGoogleIcon' || exportName === 'BileoGoogle') return; // Filled multi-color brand icon
        const markup = renderToStaticMarkup(React.createElement(component as any));
        expect(markup).toContain('fill="none"');
        expect(exportName).toBeDefined();
      });
    });

    it('2.4 Non-Empty Vector Paths / Shapes: Every icon contains at least one substantive vector element', () => {
      exportEntries.forEach(([exportName, component]) => {
        const markup = renderToStaticMarkup(React.createElement(component as any));
        const hasPaths = markup.includes('<path') || markup.includes('<circle') || markup.includes('<rect') || markup.includes('<polygon') || markup.includes('<line');
        expect(hasPaths).toBeTruthy();
        // Ensure no empty path tags like <path d="" />
        expect(markup).toNotContain('d=""');
        expect(exportName).toBeDefined();
      });
    });
  });

  describe('Challenger 2 - Suite 3: Zero-Dependency & Source Integrity', () => {
    it('3.1 Zero Lucide-React in src/components/icons/: No files import or reference lucide-react', () => {
      const iconsDir = path.resolve('src/components/icons');
      const files = fs.readdirSync(iconsDir);
      expect(files.length).toBeGreaterThanOrEqual(4);

      for (const file of files) {
        const fullPath = path.join(iconsDir, file);
        if (fs.statSync(fullPath).isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
          const content = fs.readFileSync(fullPath, 'utf8');
          expect(content.toLowerCase().includes('lucide-react')).toBeFalsy();
          expect(content.toLowerCase().includes('@heroicons')).toBeFalsy();
          expect(content.toLowerCase().includes('react-icons')).toBeFalsy();
        }
      }
    });

    it('3.2 Barrel Export Consistency: types.ts, BileoIcons.tsx, and BileoTransportIcons.tsx are fully exported in index.ts', () => {
      const indexPath = path.resolve('src/components/icons/index.ts');
      const content = fs.readFileSync(indexPath, 'utf8');
      expect(content).toContain("export * from './types'");
      expect(content).toContain("export * from './BileoIcons'");
      expect(content).toContain("export * from './BileoTransportIcons'");
    });
  });

  describe('Challenger 2 - Suite 4: Stress & Edge Cases Permutation Matrix', () => {
    it('4.1 Ref Passthrough Invariant: Passing ref callback and ref object renders cleanly without runtime exceptions', () => {
      exportEntries.forEach(([exportName, component]) => {
        const refObj: { current: SVGSVGElement | null } = { current: null };
        const el = React.createElement(component as any, { ref: refObj as any });
        const markup = renderToStaticMarkup(el);
        expect(markup.startsWith('<svg')).toBeTruthy();
        expect(exportName).toBeDefined();
      });
    });

    it('4.2 High Throughput Stress: Rendering 1,000 icons consecutively executes in < 500ms', () => {
      const startTime = Date.now();
      const compList = exportEntries.map(([, c]) => c as any);
      for (let i = 0; i < 1000; i++) {
        const Comp = compList[i % compList.length];
        renderToStaticMarkup(React.createElement(Comp, { size: 16, color: '#111' }));
      }
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });

    it('4.3 Semantic Aliases Strict Equivalence: All semantic aliases strictly match their target component', () => {
      expect(IconExports.BileoX).toBe(IconExports.BileoClose);
      expect(IconExports.BileoArrowRightLeft).toBe(IconExports.BileoSwapHorizontal);
      expect(IconExports.BileoCheckCircle2).toBe(IconExports.BileoCheckCircle);
      expect(IconExports.BileoRefreshCw).toBe(IconExports.BileoRefresh);
      expect(IconExports.BileoPower).toBe(IconExports.BileoZap);
      expect(IconExports.BileoArrowUpDown).toBe(IconExports.BileoSort);
      expect(IconExports.BileoBus).toBe(IconExports.BileoBusIcon);
      expect(IconExports.BileoPlane).toBe(IconExports.BileoPlaneIcon);
      expect(IconExports.BileoFlight).toBe(IconExports.BileoPlaneIcon);
      expect(IconExports.BileoFlightIcon).toBe(IconExports.BileoPlaneIcon);
      expect(IconExports.BileoTrain).toBe(IconExports.BileoTrainIcon);
      expect(IconExports.BileoFerry).toBe(IconExports.BileoFerryIcon);
      expect(IconExports.BileoMale).toBe(IconExports.BileoMaleIcon);
      expect(IconExports.BileoFemale).toBe(IconExports.BileoFemaleIcon);
      expect(IconExports.BileoCheckMark).toBe(IconExports.BileoCheckIcon);
      expect(IconExports.BusIcon).toBe(IconExports.BileoBusIcon);
      expect(IconExports.PlaneIcon).toBe(IconExports.BileoPlaneIcon);
      expect(IconExports.FlightIcon).toBe(IconExports.BileoPlaneIcon);
      expect(IconExports.TrainIcon).toBe(IconExports.BileoTrainIcon);
      expect(IconExports.FerryIcon).toBe(IconExports.BileoFerryIcon);
      expect(IconExports.MaleIcon).toBe(IconExports.BileoMaleIcon);
      expect(IconExports.FemaleIcon).toBe(IconExports.BileoFemaleIcon);
      expect(IconExports.CheckIcon).toBe(IconExports.BileoCheckIcon);
    });
  });
}
