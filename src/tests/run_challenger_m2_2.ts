// Standalone Runner for Challenger M2.2 Empirical Test Suite
import { runner } from './test_framework';
import { runChallengerM2_2EmpiricalTests } from './challenger_m2_2_empirical.test';

async function run() {
  console.log('🚀 RUNNING CHALLENGER M2.2 EMPIRICAL TESTS...\n');
  runChallengerM2_2EmpiricalTests();
  await runner.runAll();
  const allPassed = runner.printSummary();
  if (!allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
