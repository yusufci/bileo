import fs from 'fs';
import path from 'path';
import * as BileoIcons from '../components/icons';

const components = [
  'Header.tsx',
  'HeroSection.tsx',
  'SearchResults.tsx',
  'SeatSelectionModal.tsx',
  'CheckoutModal.tsx',
  'TicketWalletModal.tsx',
  'RefundModal.tsx',
  'TicketExperienceScreen.tsx',
  'DiscoveryCarousel.tsx',
  'WhyBileoSection.tsx',
  'MobileBottomNav.tsx',
  'Footer.tsx',
  'InteractiveTicketShowcase.tsx'
];

console.log('=== RUNNING CHALLENGER 1 CONSUMER DEEP AUDIT ===\n');

let totalBindings = 0;
const errors: string[] = [];

for (const comp of components) {
  const filePath = path.join('src/components', comp);
  if (!fs.existsSync(filePath)) {
    errors.push(`Component file missing: ${filePath}`);
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf8');

  // Check 1: Ensure zero references to lucide-react
  if (content.includes('lucide-react')) {
    errors.push(`Found leftover lucide-react reference in ${comp}`);
  }

  // Check 2: Extract all icon imports
  const importMatches = content.match(/import\s*\{([\s\S]*?)\}\s*from\s*['"](\.\/icons|\.\.\/components\/icons)['"]/g);
  if (!importMatches) {
    errors.push(`No icon imports found from ./icons in ${comp}`);
    continue;
  }

  const allImportedNames: string[] = [];
  for (const m of importMatches) {
    const inner = m.replace(/import\s*\{/, '').replace(/\}\s*from.*/, '');
    const names = inner.split(',').map(s => s.trim()).filter(Boolean);
    allImportedNames.push(...names);
  }

  console.log(`[${comp}] (${allImportedNames.length} icons imported):`);
  console.log(`  -> ${allImportedNames.join(', ')}`);

  // Check 3: Validate each imported icon exists and is a valid React component in BileoIcons
  for (const name of allImportedNames) {
    totalBindings++;
    const iconObj = (BileoIcons as any)[name];
    if (!iconObj) {
      errors.push(`Missing export in ./icons for '${name}' (used in ${comp})`);
    } else {
      const isComponent = typeof iconObj === 'function' || (typeof iconObj === 'object' && iconObj.$$typeof !== undefined);
      if (!isComponent) {
        errors.push(`Exported item '${name}' is not a valid React component`);
      }
    }
  }

  // Check 4: Validate JSX elements match imported icons and no dangling un-prefixed Lucide elements exist
  const jsxTagMatches = content.match(/<([A-Z][a-zA-Z0-9]+)[\s\/>]/g) || [];
  const knownOldLucideNames = [
    'ArrowLeft', 'ArrowRight', 'ArrowRightLeft', 'ChevronLeft', 'ChevronRight',
    'ChevronsRight', 'Search', 'Clock', 'Check', 'CheckCircle', 'CheckCircle2',
    'CreditCard', 'ShieldCheck', 'RotateCcw', 'RefreshCw', 'Luggage', 'Sparkles',
    'Wifi', 'Zap', 'Coffee', 'Tv', 'Star', 'User', 'Ticket', 'Compass', 'Headphones',
    'Heart', 'Printer', 'Copy', 'Tag', 'Mail', 'Lock', 'AlertCircle', 'Plus'
  ];

  for (const rawTag of jsxTagMatches) {
    const tagName = rawTag.replace(/[<\s\/>]/g, '');
    if (knownOldLucideNames.includes(tagName) && !allImportedNames.includes(tagName)) {
      // Check if this tag is a local component or Lucide leftover
      const isDeclaredLocally = content.includes(`const ${tagName}`) || content.includes(`function ${tagName}`) || content.includes(`import ${tagName}`) || content.includes(`import { ${tagName}`);
      if (!isDeclaredLocally) {
        errors.push(`Potential leftover unmigrated Lucide JSX element <${tagName}> in ${comp}`);
      }
    }
  }
}

console.log(`\n--------------------------------------------------`);
console.log(`Total consumer icon bindings audited: ${totalBindings}`);
console.log(`Total errors detected: ${errors.length}`);

if (errors.length > 0) {
  console.error('\n❌ AUDIT FAILED WITH ERRORS:');
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
} else {
  console.log('✅ 100% OF CONSUMER ICONS ARE RESOLVED, ACCURATE, AND TYPE-SAFE.');
  process.exit(0);
}