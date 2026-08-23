// Challenger M1.3 50,000+ Sample Fuzzing & Oracle Verification Harness
// Written by Challenger agent to independently verify zero false positives & zero false negatives

import { validateTCKN, validateLuhn, validatePassport, validateSeatGenderAdjacency, calculatePricing } from '../utils/validation';
import type { SeatItem } from '../types';

// ==========================================
// 1. INDEPENDENT TCKN MATHEMATICAL ORACLE
// ==========================================
function oracleTCKN(input: unknown): { isValid: boolean; reason?: string } {
  if (typeof input !== 'string') return { isValid: false, reason: 'not_string' };
  
  const clean = input.replace(/\D/g, '');
  if (clean.length !== 11) return { isValid: false, reason: 'length_not_11' };
  if (clean[0] === '0') return { isValid: false, reason: 'leading_zero' };

  const digits = clean.split('').map(Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  
  let diff = (oddSum * 7 - evenSum) % 10;
  if (diff < 0) diff += 10;
  if (digits[9] !== diff) return { isValid: false, reason: 'd10_mismatch' };

  let sum10 = 0;
  for (let i = 0; i < 10; i++) sum10 += digits[i];
  if (digits[10] !== (sum10 % 10)) return { isValid: false, reason: 'd11_mismatch' };

  return { isValid: true };
}

function generateValidTCKN(): string {
  const digits: number[] = [];
  digits[0] = Math.floor(1 + Math.random() * 9); // 1-9
  for (let i = 1; i < 9; i++) {
    digits[i] = Math.floor(Math.random() * 10);
  }
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  let d10 = (oddSum * 7 - evenSum) % 10;
  if (d10 < 0) d10 += 10;
  digits[9] = d10;

  let sum10 = 0;
  for (let i = 0; i < 10; i++) sum10 += digits[i];
  digits[10] = sum10 % 10;

  return digits.join('');
}

// ==========================================
// 2. INDEPENDENT LUHN MATHEMATICAL ORACLE
// ==========================================
function oracleLuhn(input: unknown): { isValid: boolean; brand: 'visa' | 'mastercard' | 'troy' | 'unknown'; formatted: string } {
  if (typeof input !== 'string') return { isValid: false, brand: 'unknown', formatted: '' };

  const clean = input.replace(/\D/g, '');
  let brand: 'visa' | 'mastercard' | 'troy' | 'unknown' = 'unknown';

  if (/^4/.test(clean)) {
    brand = 'visa';
  } else if (/^(5[1-5]|2[2-7])/.test(clean)) {
    brand = 'mastercard';
  } else if (/^(9792|65|589004)/.test(clean)) {
    brand = 'troy';
  }

  const formatted = clean.match(/.{1,4}/g)?.join(' ') || clean;

  if (clean.length < 13 || clean.length > 19) {
    return { isValid: false, brand, formatted };
  }

  let sum = 0;
  let double = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }

  return { isValid: sum % 10 === 0, brand, formatted };
}

function generateValidLuhn(prefix: string, length: number): string {
  const digits: number[] = prefix.split('').map(Number);
  while (digits.length < length - 1) {
    digits.push(Math.floor(Math.random() * 10));
  }

  let sum = 0;
  let double = true;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits[i];
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  digits.push(checkDigit);
  return digits.join('');
}

// ==========================================
// 3. 50,000 TCKN FUZZING ENGINE
// ==========================================
export function runTCKNFuzzing50k(): {
  total: number;
  falsePositives: number;
  falseNegatives: number;
  validTested: number;
  invalidTested: number;
  negativeModuloTested: number;
  durationMs: number;
} {
  const start = performance.now();
  let falsePositives = 0;
  let falseNegatives = 0;
  let validTested = 0;
  let invalidTested = 0;
  let negativeModuloTested = 0;

  // Phase A: 25,000 mathematically valid TCKNs
  for (let i = 0; i < 25000; i++) {
    const tckn = generateValidTCKN();
    const oracleResult = oracleTCKN(tckn);
    const actualResult = validateTCKN(tckn);

    const d = tckn.split('').map(Number);
    const oddSum = d[0] + d[2] + d[4] + d[6] + d[8];
    const evenSum = d[1] + d[3] + d[5] + d[7];
    if (oddSum * 7 < evenSum) {
      negativeModuloTested++;
    }

    if (!actualResult.isValid && oracleResult.isValid) {
      falseNegatives++;
    }
    if (actualResult.isValid && !oracleResult.isValid) {
      falsePositives++;
    }
    validTested++;
  }

  // Phase B: 25,000 adversarial invalid / mutated / edge candidates
  for (let i = 0; i < 25000; i++) {
    let candidate = '';
    const strategy = i % 6;

    if (strategy === 0) {
      const valid = generateValidTCKN();
      const pos = Math.floor(Math.random() * 11);
      const orig = parseInt(valid[pos], 10);
      const mutatedDigit = (orig + Math.floor(1 + Math.random() * 9)) % 10;
      candidate = valid.slice(0, pos) + mutatedDigit + valid.slice(pos + 1);
    } else if (strategy === 1) {
      const valid = generateValidTCKN();
      const pos = Math.floor(Math.random() * 10);
      const arr = valid.split('');
      const tmp = arr[pos];
      arr[pos] = arr[pos + 1];
      arr[pos + 1] = tmp;
      candidate = arr.join('');
    } else if (strategy === 2) {
      candidate = '0' + Math.floor(1000000000 + Math.random() * 9000000000);
    } else if (strategy === 3) {
      candidate = String(Math.floor(10000000000 + Math.random() * 90000000000));
    } else if (strategy === 4) {
      const len = Math.floor(Math.random() * 20);
      if (len === 11) candidate = '12345678901';
      else candidate = '9'.repeat(len);
    } else {
      candidate = '1234a567-890';
    }

    const oracleResult = oracleTCKN(candidate);
    const actualResult = validateTCKN(candidate);

    if (actualResult.isValid && !oracleResult.isValid) {
      falsePositives++;
    }
    if (!actualResult.isValid && oracleResult.isValid) {
      falseNegatives++;
    }
    invalidTested++;
  }

  const durationMs = performance.now() - start;
  return {
    total: validTested + invalidTested,
    falsePositives,
    falseNegatives,
    validTested,
    invalidTested,
    negativeModuloTested,
    durationMs,
  };
}

// ==========================================
// 4. 50,000 LUHN FUZZING ENGINE
// ==========================================
export function runLuhnFuzzing50k(): {
  total: number;
  falsePositives: number;
  falseNegatives: number;
  brandMismatches: number;
  visaTested: number;
  mastercardTested: number;
  troyTested: number;
  durationMs: number;
} {
  const start = performance.now();
  let falsePositives = 0;
  let falseNegatives = 0;
  let brandMismatches = 0;
  let visaTested = 0;
  let mastercardTested = 0;
  let troyTested = 0;

  const prefixesVisa = ['4'];
  const prefixesMC = ['51', '52', '53', '54', '55', '2221', '2300', '2500', '2720'];
  const prefixesTroy = ['9792', '65', '589004'];

  // Phase A: 25,000 valid cards across brands and lengths
  for (let i = 0; i < 25000; i++) {
    const brandSelector = i % 3;
    let card = '';
    let expectedBrand: 'visa' | 'mastercard' | 'troy' = 'visa';

    if (brandSelector === 0) {
      const len = Math.random() > 0.5 ? 16 : 13;
      card = generateValidLuhn(prefixesVisa[0], len);
      expectedBrand = 'visa';
      visaTested++;
    } else if (brandSelector === 1) {
      const pfx = prefixesMC[Math.floor(Math.random() * prefixesMC.length)];
      card = generateValidLuhn(pfx, 16);
      expectedBrand = 'mastercard';
      mastercardTested++;
    } else {
      const pfx = prefixesTroy[Math.floor(Math.random() * prefixesTroy.length)];
      card = generateValidLuhn(pfx, 16);
      expectedBrand = 'troy';
      troyTested++;
    }

    const actual = validateLuhn(card);
    const oracle = oracleLuhn(card);

    if (!actual.isValid && oracle.isValid) {
      falseNegatives++;
    }
    if (actual.isValid && !oracle.isValid) {
      falsePositives++;
    }
    if (actual.brand !== expectedBrand || actual.brand !== oracle.brand) {
      brandMismatches++;
    }
  }

  // Phase B: 25,000 invalid / mutated / corrupted check digit / boundary candidates
  for (let i = 0; i < 25000; i++) {
    let candidate = '';
    const strategy = i % 5;

    if (strategy === 0) {
      const validCard = generateValidLuhn('4', 16);
      const lastDigit = parseInt(validCard[15], 10);
      const mutatedLast = (lastDigit + Math.floor(1 + Math.random() * 9)) % 10;
      candidate = validCard.slice(0, 15) + mutatedLast;
    } else if (strategy === 1) {
      candidate = String(Math.floor(1000000000000000 + Math.random() * 9000000000000000));
    } else if (strategy === 2) {
      const validCard = generateValidLuhn('54', 16);
      const pos = Math.floor(Math.random() * 15);
      const arr = validCard.split('');
      const tmp = arr[pos];
      arr[pos] = arr[pos + 1];
      arr[pos + 1] = tmp;
      candidate = arr.join('');
    } else if (strategy === 3) {
      const len = Math.random() > 0.5 ? Math.floor(1 + Math.random() * 11) : Math.floor(20 + Math.random() * 10);
      candidate = '4'.repeat(len);
    } else {
      const validCard = generateValidLuhn('9792', 16);
      candidate = validCard.slice(0, 4) + ' ' + validCard.slice(4, 8) + '-' + validCard.slice(8, 12) + ' ' + validCard.slice(12);
    }

    const actual = validateLuhn(candidate);
    const oracle = oracleLuhn(candidate);

    if (actual.isValid && !oracle.isValid) {
      falsePositives++;
    }
    if (!actual.isValid && oracle.isValid) {
      falseNegatives++;
    }
  }

  const durationMs = performance.now() - start;
  return {
    total: 50000,
    falsePositives,
    falseNegatives,
    brandMismatches,
    visaTested,
    mastercardTested,
    troyTested,
    durationMs,
  };
}

// ==========================================
// 5. ADDITIONAL ADVERSARIAL STRESS SUITES
// ==========================================
export function runAuxiliaryStressTests(): { passed: boolean; message: string } {
  // A. Passport tests
  const validPassports = ['P12345', 'U12345678', 'TR987654', 'A00000000'];
  for (const p of validPassports) {
    if (!validatePassport(p).isValid) {
      return { passed: false, message: `Valid passport failed: ${p}` };
    }
  }

  const invalidPassports = ['', 'P1234', 'TOOLONG12345', 'P12 345', 'P12-345', 'P12_345'];
  for (const p of invalidPassports) {
    if (validatePassport(p).isValid) {
      return { passed: false, message: `Invalid passport accepted: ${p}` };
    }
  }

  // B. Seat gender adjacency tests
  const testSeats: SeatItem[] = [
    { id: 's1', number: 1, row: 1, col: 1, tier: 'single', status: 'empty', gender: 'none', price: 400 },
    { id: 's2', number: 2, row: 1, col: 3, tier: 'window', status: 'taken_male', gender: 'male', price: 400 },
    { id: 's3', number: 3, row: 1, col: 4, tier: 'aisle', status: 'empty', gender: 'none', price: 400 },
  ];
  if (!validateSeatGenderAdjacency(testSeats, testSeats[0], 'female').allowed) {
    return { passed: false, message: 'Single seat falsely rejected female' };
  }
  if (validateSeatGenderAdjacency(testSeats, testSeats[2], 'female').allowed) {
    return { passed: false, message: 'Double seat next to male falsely allowed female' };
  }
  if (!validateSeatGenderAdjacency(testSeats, testSeats[2], 'female', ['s2']).allowed) {
    return { passed: false, message: 'Co-booking companion exemption failed' };
  }

  // C. Pricing engine tests
  const pricing = calculatePricing(500, [testSeats[0]], { luggageKg: 20, insurance: false });
  if (pricing.luggageFare !== 0 || pricing.seatSurcharges !== 30 || pricing.total !== 530) {
    return { passed: false, message: `Pricing calculation mismatch: ${JSON.stringify(pricing)}` };
  }

  const pricing25 = calculatePricing(500, [testSeats[0]], { luggageKg: 25, insurance: true }, 'BILEO50');
  if (pricing25.luggageFare !== 95 || pricing25.insuranceFare !== 45 || pricing25.discount !== 50 || pricing25.total !== 620) {
    return { passed: false, message: `Pricing 25kg + insurance + BILEO50 mismatch: ${JSON.stringify(pricing25)}` };
  }

  return { passed: true, message: 'All auxiliary stress suites passed.' };
}

async function main() {
  console.log('================================================================================');
  console.log(' 🔬 BILEO EMPIRICAL CHALLENGER: 50,000-SAMPLE FUZZING & ORACLE AUDIT');
  console.log('================================================================================\n');

  console.log('▶ [1/3] Running 50,000 TCKN Modulo Arithmetic Fuzzing & Oracle Validation...');
  const tcknStats = runTCKNFuzzing50k();
  console.log(`  ✓ Total Samples Tested:      ${tcknStats.total.toLocaleString()}`);
  console.log(`  ✓ Valid Vectors Tested:      ${tcknStats.validTested.toLocaleString()}`);
  console.log(`  ✓ Invalid Vectors Tested:    ${tcknStats.invalidTested.toLocaleString()}`);
  console.log(`  ✓ Negative Modulo Scenarios: ${tcknStats.negativeModuloTested.toLocaleString()}`);
  console.log(`  ✓ False Positives (FP):      ${tcknStats.falsePositives}`);
  console.log(`  ✓ False Negatives (FN):      ${tcknStats.falseNegatives}`);
  console.log(`  ✓ Duration:                  ${tcknStats.durationMs.toFixed(2)}ms\n`);

  console.log('▶ [2/3] Running 50,000 Luhn Card Checksum & Multi-Brand Oracle Fuzzing...');
  const luhnStats = runLuhnFuzzing50k();
  console.log(`  ✓ Total Samples Tested:      ${luhnStats.total.toLocaleString()}`);
  console.log(`  ✓ Visa Tested:               ${luhnStats.visaTested.toLocaleString()}`);
  console.log(`  ✓ Mastercard Tested:         ${luhnStats.mastercardTested.toLocaleString()}`);
  console.log(`  ✓ Troy Tested:               ${luhnStats.troyTested.toLocaleString()}`);
  console.log(`  ✓ False Positives (FP):      ${luhnStats.falsePositives}`);
  console.log(`  ✓ False Negatives (FN):      ${luhnStats.falseNegatives}`);
  console.log(`  ✓ Brand Mismatches:          ${luhnStats.brandMismatches}`);
  console.log(`  ✓ Duration:                  ${luhnStats.durationMs.toFixed(2)}ms\n`);

  console.log('▶ [3/3] Running Auxiliary Boundary & Pricing Stress Tests...');
  const aux = runAuxiliaryStressTests();
  console.log(`  ✓ Status: ${aux.passed ? 'PASSED' : 'FAILED'} - ${aux.message}\n`);

  const passTCKN = tcknStats.falsePositives === 0 && tcknStats.falseNegatives === 0;
  const passLuhn = luhnStats.falsePositives === 0 && luhnStats.falseNegatives === 0 && luhnStats.brandMismatches === 0;

  console.log('================================================================================');
  if (passTCKN && passLuhn && aux.passed) {
    console.log(' 🟢 VERDICT: ALL 100,000+ STRESS & FUZZ SAMPLES PASSED WITH 0 DEFECTS (100% ACCURACY)');
    console.log('================================================================================');
    process.exit(0);
  } else {
    console.error(' 🔴 VERDICT: DEFECTS DETECTED IN VALIDATION ENGINE');
    console.log('================================================================================');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fuzzer crashed:', err);
  process.exit(1);
});
