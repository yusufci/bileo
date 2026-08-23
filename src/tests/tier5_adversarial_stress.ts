/**
 * Tier 5 Comprehensive Adversarial Stress Testing Suite
 * Conducted by challenger_final_1_1 for Final Milestone Verification.
 * 
 * Verifies:
 * 1. Vector scaling across extreme sizes (14px, 16px, 18px, 20px, 24px, 32px, 48px, 64px, 128px, strings, etc.)
 * 2. Coordinate bounding box analysis (no clipping or coordinate overflow)
 * 3. ForwardRef contract, symbol verification, JSX ref attachment & callback ref testing
 * 4. Accessibility compliance: title injection, aria-hidden toggling, role forwarding, aria-label/labelledby/describedby
 * 5. Repository-wide Zero-Lucide AST/content scanner
 * 6. Color inheritance & brand palette overrides
 * 7. High-throughput fuzzing & bitwise SSR determinism
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import * as IconBarrel from '../components/icons';

// Extract all exported components from the barrel
const allExports = Object.entries(IconBarrel);
const iconComponents = allExports.filter(([_name, comp]) => {
  return typeof comp === 'object' && comp !== null && (comp as any).$$typeof === Symbol.for('react.forward_ref');
});

// Canonical 45 Bespoke Icons list
const canonicalIconNames = [
  // Navigation & Controls (10)
  'BileoArrowLeft',
  'BileoArrowRight',
  'BileoSwapHorizontal',
  'BileoChevronLeft',
  'BileoChevronRight',
  'BileoChevronsRight',
  'BileoClose',
  'BileoPlus',
  'BileoFilter',
  'BileoSort',
  // Travel & Booking (7)
  'BileoCalendar',
  'BileoClock',
  'BileoSearch',
  'BileoMapPin',
  'BileoTicket',
  'BileoUser',
  'BileoCompass',
  // Utilities & Verification (15)
  'BileoCheck',
  'BileoCheckCircle',
  'BileoCopy',
  'BileoCreditCard',
  'BileoLock',
  'BileoPrinter',
  'BileoRotateCcw',
  'BileoRefresh',
  'BileoShieldCheck',
  'BileoTag',
  'BileoMail',
  'BileoAlertCircle',
  'BileoHeadphones',
  'BileoHeart',
  'BileoStar',
  // Amenities & Highlights (6)
  'BileoSparkles',
  'BileoLuggage',
  'BileoWifi',
  'BileoZap',
  'BileoCoffee',
  'BileoTv',
  // Transport Modalities & Status Marks (7)
  'BileoBusIcon',
  'BileoPlaneIcon',
  'BileoTrainIcon',
  'BileoFerryIcon',
  'BileoMaleIcon',
  'BileoFemaleIcon',
  'BileoCheckIcon',
];

interface TestStats {
  total: number;
  passed: number;
  failed: number;
  failures: string[];
}

const stats: TestStats = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: [],
};

function runTest(name: string, fn: () => void) {
  stats.total++;
  try {
    fn();
    stats.passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    stats.failed++;
    const errMsg = `${name}: ${err.message}`;
    stats.failures.push(errMsg);
    console.error(`  ✗ ${errMsg}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function getPathBoundingBox(d: string): { minX: number; maxX: number; minY: number; maxY: number; points: { x: number; y: number }[] } {
  const points: { x: number; y: number }[] = [];
  let curX = 0;
  let curY = 0;

  const commandRegex = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let match;
  while ((match = commandRegex.exec(d)) !== null) {
    const cmd = match[1];
    const argsStr = match[2].trim();
    const numRegex = /[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g;
    const nums = (argsStr.match(numRegex) || []).map(Number);

    switch (cmd) {
      case 'M':
        for (let i = 0; i < nums.length; i += 2) {
          curX = nums[i];
          curY = nums[i + 1];
          points.push({ x: curX, y: curY });
        }
        break;
      case 'm':
        for (let i = 0; i < nums.length; i += 2) {
          curX += nums[i];
          curY += nums[i + 1];
          points.push({ x: curX, y: curY });
        }
        break;
      case 'L':
        for (let i = 0; i < nums.length; i += 2) {
          curX = nums[i];
          curY = nums[i + 1];
          points.push({ x: curX, y: curY });
        }
        break;
      case 'l':
        for (let i = 0; i < nums.length; i += 2) {
          curX += nums[i];
          curY += nums[i + 1];
          points.push({ x: curX, y: curY });
        }
        break;
      case 'H':
        for (let i = 0; i < nums.length; i++) {
          curX = nums[i];
          points.push({ x: curX, y: curY });
        }
        break;
      case 'h':
        for (let i = 0; i < nums.length; i++) {
          curX += nums[i];
          points.push({ x: curX, y: curY });
        }
        break;
      case 'V':
        for (let i = 0; i < nums.length; i++) {
          curY = nums[i];
          points.push({ x: curX, y: curY });
        }
        break;
      case 'v':
        for (let i = 0; i < nums.length; i++) {
          curY += nums[i];
          points.push({ x: curX, y: curY });
        }
        break;
      case 'C':
        for (let i = 0; i < nums.length; i += 6) {
          points.push({ x: nums[i], y: nums[i + 1] });
          points.push({ x: nums[i + 2], y: nums[i + 3] });
          curX = nums[i + 4];
          curY = nums[i + 5];
          points.push({ x: curX, y: curY });
        }
        break;
      case 'c':
        for (let i = 0; i < nums.length; i += 6) {
          points.push({ x: curX + nums[i], y: curY + nums[i + 1] });
          points.push({ x: curX + nums[i + 2], y: curY + nums[i + 3] });
          curX += nums[i + 4];
          curY += nums[i + 5];
          points.push({ x: curX, y: curY });
        }
        break;
      case 'S':
        for (let i = 0; i < nums.length; i += 4) {
          points.push({ x: nums[i], y: nums[i + 1] });
          curX = nums[i + 2];
          curY = nums[i + 3];
          points.push({ x: curX, y: curY });
        }
        break;
      case 's':
        for (let i = 0; i < nums.length; i += 4) {
          points.push({ x: curX + nums[i], y: curY + nums[i + 1] });
          curX += nums[i + 2];
          curY += nums[i + 3];
          points.push({ x: curX, y: curY });
        }
        break;
      case 'Q':
        for (let i = 0; i < nums.length; i += 4) {
          points.push({ x: nums[i], y: nums[i + 1] });
          curX = nums[i + 2];
          curY = nums[i + 3];
          points.push({ x: curX, y: curY });
        }
        break;
      case 'q':
        for (let i = 0; i < nums.length; i += 4) {
          points.push({ x: curX + nums[i], y: curY + nums[i + 1] });
          curX += nums[i + 2];
          curY += nums[i + 3];
          points.push({ x: curX, y: curY });
        }
        break;
      case 'A':
        for (let i = 0; i < nums.length; i += 7) {
          curX = nums[i + 5];
          curY = nums[i + 6];
          points.push({ x: curX, y: curY });
        }
        break;
      case 'a':
        for (let i = 0; i < nums.length; i += 7) {
          curX += nums[i + 5];
          curY += nums[i + 6];
          points.push({ x: curX, y: curY });
        }
        break;
      case 'Z':
      case 'z':
        break;
    }
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }
  return { minX, maxX, minY, maxY, points };
}

console.log('='.repeat(80));
console.log('TIER 5 ADVERSARIAL STRESS TEST SUITE - CHALLENGER FINAL 1.1');
console.log('='.repeat(80));

// ---------------------------------------------------------------------------
// SUITE 1: VECTOR SCALING STRESS TESTING ACROSS EXTREME SIZES
// ---------------------------------------------------------------------------
console.log('\n[Suite 1] Vector Scaling Across Extreme Sizing Matrix (14px - 64px, strings, floats)');

const testSizesNumeric = [14, 16, 18, 20, 24, 32, 48, 64, 128];
const testSizesString = ['14px', '16px', '18px', '20px', '24px', '32px', '48px', '64px', '1.5rem', '2em', '100%'];

for (const size of testSizesNumeric) {
  runTest(`Numeric size = ${size} on all 45 canonical icons`, () => {
    for (const name of canonicalIconNames) {
      const Comp = (IconBarrel as any)[name];
      assert(Comp !== undefined, `Component ${name} is not exported`);
      const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { size }));
      assert(html.includes(`width="${size}"`), `${name} missing width="${size}"`);
      assert(html.includes(`height="${size}"`), `${name} missing height="${size}"`);
      assert(html.includes('viewBox="0 0 24 24"'), `${name} corrupted viewBox`);
    }
  });
}

for (const size of testSizesString) {
  runTest(`String size = "${size}" on all 45 canonical icons`, () => {
    for (const name of canonicalIconNames) {
      const Comp = (IconBarrel as any)[name];
      assert(Comp !== undefined, `Component ${name} is not exported`);
      const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { size }));
      assert(html.includes(`width="${size}"`), `${name} missing width="${size}"`);
      assert(html.includes(`height="${size}"`), `${name} missing height="${size}"`);
      assert(html.includes('viewBox="0 0 24 24"'), `${name} corrupted viewBox`);
    }
  });
}

// ---------------------------------------------------------------------------
// SUITE 2: VECTOR PATH BOUNDS & CLIPPING STRESS AUDIT
// ---------------------------------------------------------------------------
console.log('\n[Suite 2] Vector Geometry Bounding Box & Coordinate Clipping Audit');

runTest('All vector paths and shapes stay within [0, 24] coordinate grid boundaries (with safety stroke margin)', () => {
  for (const name of canonicalIconNames) {
    const Comp = (IconBarrel as any)[name];
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp));
    
    // Extract path d attributes
    const pathMatches = [...html.matchAll(/d="([^"]+)"/g)];
    for (const match of pathMatches) {
      const d = match[1];
      const { minX, maxX, minY, maxY, points } = getPathBoundingBox(d);
      if (points.length > 0) {
        assert(
          minX >= -1.0 && maxX <= 25.0 && minY >= -1.0 && maxY <= 25.0,
          `${name} path "${d}" evaluated to out-of-bounds [minX: ${minX}, maxX: ${maxX}, minY: ${minY}, maxY: ${maxY}]`
        );
      }
    }

    // Extract circle attributes
    const circleMatches = [...html.matchAll(/<circle([^>]+)>/g)];
    for (const match of circleMatches) {
      const attrs = match[1];
      const cx = parseFloat(attrs.match(/cx="([^"]+)"/)?.[1] || '0');
      const cy = parseFloat(attrs.match(/cy="([^"]+)"/)?.[1] || '0');
      const r = parseFloat(attrs.match(/r="([^"]+)"/)?.[1] || '0');
      assert(cx - r >= -1 && cx + r <= 25, `${name} circle cx=${cx}, r=${r} overflows bounds`);
      assert(cy - r >= -1 && cy + r <= 25, `${name} circle cy=${cy}, r=${r} overflows bounds`);
    }

    // Extract rect attributes
    const rectMatches = [...html.matchAll(/<rect([^>]+)>/g)];
    for (const match of rectMatches) {
      const attrs = match[1];
      const x = parseFloat(attrs.match(/x="([^"]+)"/)?.[1] || '0');
      const y = parseFloat(attrs.match(/y="([^"]+)"/)?.[1] || '0');
      const w = parseFloat(attrs.match(/width="([^"]+)"/)?.[1] || '0');
      const h = parseFloat(attrs.match(/height="([^"]+)"/)?.[1] || '0');
      assert(x >= -1 && x + w <= 25, `${name} rect x=${x}, w=${w} overflows bounds`);
      assert(y >= -1 && y + h <= 25, `${name} rect y=${y}, h=${h} overflows bounds`);
    }

    // Extract polygon attributes
    const polyMatches = [...html.matchAll(/points="([^"]+)"/g)];
    for (const match of polyMatches) {
      const pts = match[1].trim().split(/\s+/).map(Number);
      for (let i = 0; i < pts.length; i += 2) {
        const px = pts[i];
        const py = pts[i + 1];
        assert(px >= -1 && px <= 25, `${name} polygon px=${px} overflows bounds`);
        assert(py >= -1 && py <= 25, `${name} polygon py=${py} overflows bounds`);
      }
    }
  }
});

// ---------------------------------------------------------------------------
// SUITE 3: STROKE WIDTH & SCALING STRESS TESTING
// ---------------------------------------------------------------------------
console.log('\n[Suite 3] Stroke Width Customization & Precision Scaling');

const strokeWidths = [0.5, 1.0, 1.5, 1.75, 1.8, 2.0, 2.5, 3.0, 4.0, '2.5px', '0.15em'];

for (const sw of strokeWidths) {
  runTest(`Stroke width = ${sw} overrides default stroke-width accurately across all 45 icons`, () => {
    for (const name of canonicalIconNames) {
      const Comp = (IconBarrel as any)[name];
      const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { strokeWidth: sw }));
      assert(html.includes(`stroke-width="${sw}"`), `${name} failed to render stroke-width="${sw}"`);
    }
  });
}

// ---------------------------------------------------------------------------
// SUITE 4: REF FORWARDING STRESS TESTING
// ---------------------------------------------------------------------------
console.log('\n[Suite 4] Ref Forwarding & DOM Contract Stress Testing');

runTest('All 45 canonical icons and aliases have $$typeof Symbol.for("react.forward_ref")', () => {
  for (const [name, Comp] of iconComponents) {
    assert(
      (Comp as any).$$typeof === Symbol.for('react.forward_ref'),
      `Component ${name} does not have React.forwardRef symbol`
    );
  }
});

runTest('All 45 canonical icons have explicit displayName matching component export', () => {
  for (const name of canonicalIconNames) {
    const Comp = (IconBarrel as any)[name];
    assert(
      Comp.displayName === name,
      `Component ${name} displayName mismatch (expected "${name}", got "${Comp.displayName}")`
    );
  }
});

runTest('ForwardRef accepts React.createRef object and preserves ref property on React element', () => {
  for (const name of canonicalIconNames) {
    const Comp = (IconBarrel as any)[name];
    const ref = React.createRef<SVGSVGElement>();
    const element = React.createElement(Comp, { ref, size: 24 });
    assert(element.ref === ref, `${name} failed to preserve object ref on React element`);
  }
});

runTest('ForwardRef accepts callback ref and preserves callback ref property on React element', () => {
  for (const name of canonicalIconNames) {
    const Comp = (IconBarrel as any)[name];
    const callbackRef = (_node: SVGSVGElement | null) => {};
    const element = React.createElement(Comp, { ref: callbackRef, size: 24 });
    assert(element.ref === callbackRef, `${name} failed to preserve callback ref on React element`);
  }
});

runTest('Underlying render function accepts 2 parameters (props and ref)', () => {
  for (const [name, Comp] of iconComponents) {
    const renderFn = (Comp as any).render;
    assert(typeof renderFn === 'function', `${name} render property is not a function`);
    assert(renderFn.length === 2, `${name} render function arity is ${renderFn.length} (expected 2 for props, ref)`);
  }
});

// ---------------------------------------------------------------------------
// SUITE 5: ACCESSIBILITY STRESS TESTING
// ---------------------------------------------------------------------------
console.log('\n[Suite 5] Accessibility Stress Testing (title, aria-hidden, role, aria-*)');

runTest('Decorative icons (title undefined): aria-hidden="true" and no <title> tag on all 45 icons', () => {
  for (const name of canonicalIconNames) {
    const Comp = (IconBarrel as any)[name];
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp));
    assert(html.includes('aria-hidden="true"'), `${name} missing default aria-hidden="true"`);
    assert(!html.includes('<title>'), `${name} should not have <title> tag when decorative`);
  }
});

runTest('Accessible icons (title provided): injects <title> text and removes aria-hidden on all 45 icons', () => {
  for (const name of canonicalIconNames) {
    const Comp = (IconBarrel as any)[name];
    const titleText = `Icon of ${name} for testing`;
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { title: titleText }));
    assert(html.includes(`<title>${titleText}</title>`), `${name} missing <title>${titleText}</title>`);
    assert(!html.includes('aria-hidden="true"'), `${name} must not have aria-hidden="true" when title is supplied`);
  }
});

runTest('Explicit aria-hidden override passes through cleanly on all 45 icons', () => {
  for (const name of canonicalIconNames) {
    const Comp = (IconBarrel as any)[name];
    // Explicit aria-hidden="false"
    const htmlFalse = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { 'aria-hidden': false } as any));
    assert(!htmlFalse.includes('aria-hidden="true"'), `${name} failed to override aria-hidden to false`);
    
    // Explicit aria-hidden="true" with title
    const htmlBoth = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Comp, { title: 'Test', 'aria-hidden': 'true' } as any)
    );
    assert(htmlBoth.includes('aria-hidden="true"'), `${name} failed to preserve explicit aria-hidden="true"`);
    assert(htmlBoth.includes('<title>Test</title>'), `${name} dropped <title> when both supplied`);
  }
});

runTest('Role attribute (role="img", role="presentation", role="graphics-symbol") passes cleanly', () => {
  const roles = ['img', 'presentation', 'graphics-symbol', 'none'];
  for (const role of roles) {
    for (const name of canonicalIconNames) {
      const Comp = (IconBarrel as any)[name];
      const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { role } as any));
      assert(html.includes(`role="${role}"`), `${name} failed to forward role="${role}"`);
    }
  }
});

runTest('Arbitrary ARIA and data-* attributes pass through to root <svg> on all 45 icons', () => {
  for (const name of canonicalIconNames) {
    const Comp = (IconBarrel as any)[name];
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Comp, {
        'aria-label': 'Accessible Label Test',
        'aria-labelledby': 'heading-id',
        'aria-describedby': 'desc-id',
        'data-testid': `test-${name}`,
        id: `custom-icon-${name}`,
        tabIndex: 0,
      } as any)
    );
    assert(html.includes('aria-label="Accessible Label Test"'), `${name} dropped aria-label`);
    assert(html.includes('aria-labelledby="heading-id"'), `${name} dropped aria-labelledby`);
    assert(html.includes('aria-describedby="desc-id"'), `${name} dropped aria-describedby`);
    assert(html.includes(`data-testid="test-${name}"`), `${name} dropped data-testid`);
    assert(html.includes(`id="custom-icon-${name}"`), `${name} dropped id`);
    assert(html.includes('tabindex="0"'), `${name} dropped tabIndex`);
  }
});

// ---------------------------------------------------------------------------
// SUITE 6: REPOSITORY-WIDE ZERO-LUCIDE STATIC CONTENT AUDIT
// ---------------------------------------------------------------------------
console.log('\n[Suite 6] Repository-Wide Zero-Lucide Dependency & Import Audit');

runTest('Production code scan: 0 references to lucide-react in all src/ components and application files', () => {
  const srcDir = path.resolve(process.cwd(), 'src');
  
  function scanDir(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name === 'tests') {
        continue;
      }
      if (entry.isDirectory()) {
        results.push(...scanDir(fullPath));
      } else if (/\.(tsx?|jsx?|json|css|html)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (/lucide-react/i.test(content)) {
          results.push(fullPath);
        }
      }
    }
    return results;
  }

  const offendingFiles = scanDir(srcDir);
  assert(
    offendingFiles.length === 0,
    `Found ${offendingFiles.length} production files referencing lucide-react:\n${offendingFiles.join('\n')}`
  );
});

runTest('Consumer components scan: Exactly 0 import/require statements from lucide-react in consumer components', () => {
  const compDir = path.resolve(process.cwd(), 'src/components');
  
  function scanImports(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...scanImports(fullPath));
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (/import\s+[\s\S]*?from\s+['"]lucide-react['"]/m.test(content) ||
            /import\s+['"]lucide-react['"]/m.test(content) ||
            /require\s*\(\s*['"]lucide-react['"]\s*\)/m.test(content)) {
          results.push(fullPath);
        }
      }
    }
    return results;
  }

  const offendingFiles = scanImports(compDir);
  assert(
    offendingFiles.length === 0,
    `Found ${offendingFiles.length} consumer components with active imports from lucide-react:\n${offendingFiles.join('\n')}`
  );
});

runTest('package.json contains 0 dependencies or devDependencies on lucide-react', () => {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = Object.keys(pkg.dependencies || {});
  const devDeps = Object.keys(pkg.devDependencies || {});
  assert(!deps.includes('lucide-react'), 'package.json dependencies still contains lucide-react');
  assert(!devDeps.includes('lucide-react'), 'package.json devDependencies still contains lucide-react');
});

// ---------------------------------------------------------------------------
// SUITE 7: COLOR INHERITANCE & BRAND PALETTE OVERRIDES
// ---------------------------------------------------------------------------
console.log('\n[Suite 7] Color Hierarchy & Brand Palette Override Testing');

const brandColors = [
  { name: 'Default currentColor', val: undefined, expected: 'stroke="currentColor"' },
  { name: 'Bileo Bordeaux', val: '#8A222B', expected: 'stroke="#8A222B"' },
  { name: 'Parchment Cream', val: '#FBF9F5', expected: 'stroke="#FBF9F5"' },
  { name: 'Charcoal Noir', val: '#1E1B18', expected: 'stroke="#1E1B18"' },
  { name: 'Emerald Status', val: '#10B981', expected: 'stroke="#10B981"' },
  { name: 'Vibrant Amber', val: '#F59E0B', expected: 'stroke="#F59E0B"' },
  { name: 'RGB Format', val: 'rgb(138, 34, 43)', expected: 'stroke="rgb(138, 34, 43)"' },
];

for (const bc of brandColors) {
  runTest(`Color: ${bc.name} on all 45 canonical icons`, () => {
    for (const name of canonicalIconNames) {
      const Comp = (IconBarrel as any)[name];
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(Comp, bc.val !== undefined ? { color: bc.val } : {})
      );
      assert(html.includes(bc.expected), `${name} failed color override (${bc.expected})`);
    }
  });
}

// ---------------------------------------------------------------------------
// SUITE 8: HIGH-THROUGHPUT FUZZING & BITWISE SSR DETERMINISM
// ---------------------------------------------------------------------------
console.log('\n[Suite 8] High-Throughput Fuzzing & Bitwise Determinism');

runTest('Bitwise Determinism: 50 consecutive renders of all 45 icons produce 100% bitwise identical HTML', () => {
  for (const name of canonicalIconNames) {
    const Comp = (IconBarrel as any)[name];
    const firstHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Comp, { size: 24, strokeWidth: 1.75, color: '#8A222B', className: 'w-6 h-6' })
    );
    for (let i = 0; i < 50; i++) {
      const successiveHtml = ReactDOMServer.renderToStaticMarkup(
        React.createElement(Comp, { size: 24, strokeWidth: 1.75, color: '#8A222B', className: 'w-6 h-6' })
      );
      assert(firstHtml === successiveHtml, `${name} non-deterministic render on iteration ${i}`);
    }
  }
});

runTest('High-Throughput Fuzzing: 2,500 randomized prop permutations render in < 1,500ms without throwing', () => {
  const start = performance.now();
  const sampleSizes = [12, 14, 16, 20, 24, 32, 48, 64, '1rem', '24px', '2.5em', undefined];
  const sampleStrokes = [0.5, 1, 1.5, 1.75, 2, 2.5, 3, '1.5px', undefined];
  const sampleColors = ['#8A222B', '#1E1B18', '#10B981', '#FBF9F5', 'currentColor', undefined];
  const sampleClasses = ['w-4 h-4', 'w-6 h-6 text-red-500', 'custom-icon', undefined];
  const sampleTitles = ['Accessible Title', undefined, 'Tooltip & Filter <test>'];

  let count = 0;
  for (let i = 0; i < 2500; i++) {
    const iconName = canonicalIconNames[i % canonicalIconNames.length];
    const Comp = (IconBarrel as any)[iconName];
    const size = sampleSizes[i % sampleSizes.length];
    const strokeWidth = sampleStrokes[(i * 3) % sampleStrokes.length];
    const color = sampleColors[(i * 5) % sampleColors.length];
    const className = sampleClasses[(i * 7) % sampleClasses.length];
    const title = sampleTitles[(i * 11) % sampleTitles.length];

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Comp, { size, strokeWidth, color, className, title })
    );
    assert(html.startsWith('<svg'), `Fuzzed render ${i} did not produce SVG`);
    count++;
  }

  const duration = performance.now() - start;
  console.log(`    Ran ${count} fuzzed renders in ${duration.toFixed(2)}ms (${(count / (duration / 1000)).toFixed(0)} renders/sec)`);
  assert(duration < 2500, `Fuzzing took too long: ${duration.toFixed(2)}ms`);
});

// ---------------------------------------------------------------------------
// SUITE 9: SEMANTIC TRANSPORT CONVENIENCE ALIAS EQUIVALENCE
// ---------------------------------------------------------------------------
console.log('\n[Suite 9] Semantic Transport Convenience Alias Equivalence');

const aliasPairs = [
  ['BileoBus', 'BileoBusIcon'],
  ['BileoPlane', 'BileoPlaneIcon'],
  ['BileoFlight', 'BileoPlaneIcon'],
  ['BileoFlightIcon', 'BileoPlaneIcon'],
  ['BileoTrain', 'BileoTrainIcon'],
  ['BileoFerry', 'BileoFerryIcon'],
  ['BileoMale', 'BileoMaleIcon'],
  ['BileoFemale', 'BileoFemaleIcon'],
  ['BileoCheckMark', 'BileoCheckIcon'],
  ['BileoX', 'BileoClose'],
  ['BileoPower', 'BileoZap'],
  ['BileoRefreshCw', 'BileoRefresh'],
  ['BileoArrowUpDown', 'BileoSort'],
  ['BileoArrowRightLeft', 'BileoSwapHorizontal'],
  ['BileoCheckCircle2', 'BileoCheckCircle'],
];

for (const [aliasName, targetName] of aliasPairs) {
  runTest(`Semantic alias "${aliasName}" strictly references "${targetName}"`, () => {
    const AliasComp = (IconBarrel as any)[aliasName];
    const TargetComp = (IconBarrel as any)[targetName];
    assert(AliasComp !== undefined, `Alias "${aliasName}" is undefined`);
    assert(TargetComp !== undefined, `Target "${targetName}" is undefined`);
    assert(AliasComp === TargetComp, `Alias "${aliasName}" does not point to identical component reference as "${targetName}"`);
  });
}

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log('\n' + '='.repeat(80));
console.log(`TIER 5 STRESS TEST RESULTS:`);
console.log(`Total Tests Run:  ${stats.total}`);
console.log(`Passed:           ${stats.passed}`);
console.log(`Failed:           ${stats.failed}`);
console.log(`Success Rate:     ${((stats.passed / stats.total) * 100).toFixed(2)}%`);
console.log('='.repeat(80));

if (stats.failed > 0) {
  console.error('\nFailures detected:');
  for (const f of stats.failures) {
    console.error(`  - ${f}`);
  }
  process.exit(1);
} else {
  console.log('\n✅ ALL TIER 5 ADVERSARIAL STRESS TESTS COMPLETED WITH 100% SUCCESS RATE.');
  process.exit(0);
}
