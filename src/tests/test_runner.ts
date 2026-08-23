// Master Test Runner for Bileo Multi-Modal Transport Platform
// Executes 4-tier comprehensive test suite plus Challenger, Adversarial, and Bespoke Icon System suites.

import { runner } from './test_framework';
import { runTier1Tests } from './tier1_features.test';
import { runTier2Tests } from './tier2_boundaries.test';
import { runTier3Tests } from './tier3_interactions.test';
import { runTier4Tests } from './tier4_scenarios.test';
import { runChallengerStressTests } from './challenger_m1_2_stress.test';
import { runAdversarialTests } from './adversarial_m1_stress';
import { runM2M3ChallengerSuite } from './challenger_m2_m3_stress';
import { runE2EUserJourneyTests } from './e2e_user_journeys.test';
import { runIconSystemTests } from './icon_system.test';
import { runChallengerIconAdversarialTests } from './challenger_icon_adversarial';
import { runEmpiricalChallengerM1Tests } from './challenger_m1_1_empirical.test';
import { runEmpiricalChallengerM1_2Tests } from './challenger_m1_2_empirical';
import { runChallengerM1_2SQLiFuzzTests } from './challenger_m1_2_sqli_fuzz.test';
import { runEmpiricalChallengerM1_3Tests } from './challenger_m1_3_empirical.test';
import { runChallengerFinal2_1AdversarialTests } from './challenger_final_2_1_adversarial.test';
import { runAuthGatekeepingTests } from './auth_gatekeeping.test';
import { runDatabaseTests } from './db_tests';
import { runDbServiceTests } from './db_service.test';
import { runChallengerM1ConcurrencyTests } from './challenger_m1_concurrency.test';
import { runSecurityHardeningTests } from './security_tests';
import { runAuthServiceTests } from './auth_service.test';
import { runChallengerM2_1EmpiricalTests } from './challenger_m2_1_empirical.test';
import { runChallengerM2_2EmpiricalTests } from './challenger_m2_2_empirical.test';
import { runGoogleAuthAndReviewTests } from './google_auth_and_review.test';

async function main() {
  console.log('🚀 INITIALIZING BILEO COMPREHENSIVE E2E TEST SUITE...\n');

  // Register Google OAuth 2.0 & Review Identity Tests (7 tests)
  runGoogleAuthAndReviewTests();

  // Register Milestone 2: Cryptographic Auth, Token Security & Rate Limiting Tests (35 tests)
  runAuthServiceTests();

  // Register Challenger M2.1: Empirical Bcrypt, Timing Defense & Password Complexity Suite (15 tests)
  runChallengerM2_1EmpiricalTests();

  // Register Challenger M2.2: Empirical JWT Subsystem, Tamper Immunity, alg: "none" & Burst Rate Limiting (22 tests)
  runChallengerM2_2EmpiricalTests();

  // Register Enterprise Security Hardening & SQLi Immunity Tests (20 tests)
  runSecurityHardeningTests();

  // Register Database Layer & Parameterized Query Engine Tests
  runDatabaseTests();
  runDbServiceTests();

  // Register Challenger M1: Relational DB Concurrency, OCC & Transaction Rollback Stress (10 tests)
  runChallengerM1ConcurrencyTests();

  // Register Challenger M1.2: Empirical SQL Injection Fuzz Testing Suites (12 tests)
  runChallengerM1_2SQLiFuzzTests();

  // Register Tier 1: Feature Coverage (57 tests)
  runTier1Tests();

  // Register Tier 2: Boundary & Corner Cases (55 tests)
  runTier2Tests();

  // Register Tier 3: Cross-Feature Interactions (12 tests)
  runTier3Tests();

  // Register Tier 4: Real-World Workload Scenarios (5 tests)
  runTier4Tests();

  // Register Challenger M1.2: Multi-Modal Seat & Audio Stress Tests (22 tests)
  runChallengerStressTests();

  // Register Adversarial M1: Fuzzing & Checksum Oracle Stress Tests (21 tests)
  runAdversarialTests();

  // Register Challenger M2/M3: Component hierarchy, physics, modals & cabins (12 tests)
  runM2M3ChallengerSuite();

  // Register Challenger M2/M3 Instance 2: E2E User Journeys (8 tests)
  runE2EUserJourneyTests();

  // Register Icon System: Bespoke SVG Design System & Zero-Lucide Verification (26 tests)
  runIconSystemTests();

  // Register Challenger 1: Adversarial AST Scanner & SVG Component Boundary Suites (26 tests)
  runChallengerIconAdversarialTests();

  // Register Challenger 1 Empirical: 45+ Icon Matrix, ForwardRef & Compound Permutations (14 tests)
  runEmpiricalChallengerM1Tests();

  // Register Challenger 2 Empirical: Universal Exports, DisplayName, SVG LineCaps/Joins & Ref Passthrough (11 tests)
  runEmpiricalChallengerM1_2Tests();

  // Register Challenger 3 Empirical: 45+ Icon Matrix, SSR, ViewBox, Prop Boundaries, Artisanal Vectors & Fuzzing
  runEmpiricalChallengerM1_3Tests();

  // Register Challenger Final 2.1: Tier 5 Adversarial Color, Theme, Dark Mode & StrokeWidth Stress (29 tests)
  runChallengerFinal2_1AdversarialTests();

  // Register Auth & Gatekeeping System Tests (8 tests)
  runAuthGatekeepingTests();

  // Run all registered tests
  await runner.runAll();

  // Print results and evaluate
  const allPassed = runner.printSummary();

  if (!allPassed) {
    console.error('❌ TEST SUITE FAILED WITH ERRORS.');
    process.exit(1);
  } else {
    console.log('✅ ALL TEST TIERS & ICON SYSTEM PASSED WITH 100% SUCCESS RATE.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unhandled runner error:', err);
  process.exit(1);
});
