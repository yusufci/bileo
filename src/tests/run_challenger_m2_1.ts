import { runner } from './test_framework';
import { runAuthServiceTests } from './auth_service.test';
import { runChallengerM2_1EmpiricalTests } from './challenger_m2_1_empirical.test';

async function run() {
  console.log('🚀 Running M2 AuthService & Empirical Challenger Tests...');
  runAuthServiceTests();
  runChallengerM2_1EmpiricalTests();

  await runner.runAll();
  const passed = runner.printSummary();
  if (!passed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
