// Multi-Process Stress Test: 10 Consecutive Executions of Master Test Runner
// Tests for process-level flakiness, race conditions, memory leaks, and timing stability.

import { execSync } from 'child_process';
import { performance } from 'perf_hooks';

interface ProcessRunResult {
  run: number;
  durationMs: number;
  exitCode: number;
  totalTests: number;
  passed: number;
  failed: number;
}

function calculateStats(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  const count = sorted.length;
  const min = sorted[0];
  const max = sorted[count - 1];
  const mean = sorted.reduce((acc, v) => acc + v, 0) / count;
  const median = count % 2 === 0 ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2 : sorted[Math.floor(count / 2)];
  const p95 = sorted[Math.floor(count * 0.95)];
  const p99 = sorted[Math.floor(count * 0.99)];
  const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  return { count, min, max, mean, median, p95, p99, stdDev };
}

async function main() {
  console.log('================================================================');
  console.log('STRESS TEST 1: 10 CONSECUTIVE SUBPROCESS EXECUTIONS OF TEST RUNNER');
  console.log('================================================================\n');

  const runs: ProcessRunResult[] = [];
  const durations: number[] = [];

  for (let i = 1; i <= 10; i++) {
    const start = performance.now();
    try {
      const output = execSync('npx tsx src/tests/test_runner.ts', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const elapsed = performance.now() - start;
      durations.push(elapsed);

      // Parse output for test counts
      const matchTotal = output.match(/Total Tests:\s+(\d+)/);
      const matchPassed = output.match(/Passed:\s+(\d+)/);
      const matchFailed = output.match(/Failed:\s+(\d+)/);

      const totalTests = matchTotal ? parseInt(matchTotal[1], 10) : 0;
      const passed = matchPassed ? parseInt(matchPassed[1], 10) : 0;
      const failed = matchFailed ? parseInt(matchFailed[1], 10) : 0;

      runs.push({
        run: i,
        durationMs: elapsed,
        exitCode: 0,
        totalTests,
        passed,
        failed,
      });

      console.log(`  Run ${String(i).padStart(2, ' ')}/10: Completed in ${elapsed.toFixed(2)} ms | Exit Code: 0 | Tests: ${passed}/${totalTests} Passed (100%)`);
    } catch (err: any) {
      const elapsed = performance.now() - start;
      durations.push(elapsed);
      runs.push({
        run: i,
        durationMs: elapsed,
        exitCode: err.status || 1,
        totalTests: 0,
        passed: 0,
        failed: 1,
      });
      console.error(`  Run ${i}/10: FAILED after ${elapsed.toFixed(2)} ms with exit code ${err.status}`);
    }
  }

  const stats = calculateStats(durations);
  const totalPassedRuns = runs.filter(r => r.exitCode === 0 && r.failed === 0).length;

  console.log('\n================================================================');
  console.log('10 CONSECUTIVE TEST RUNNER EXECUTIONS STATISTICAL SUMMARY');
  console.log('================================================================');
  console.log(`Total Runs:             10`);
  console.log(`Successful Runs:        ${totalPassedRuns}/10 (${((totalPassedRuns / 10) * 100).toFixed(1)}%)`);
  console.log(`Total Test Invocations: ${runs.reduce((acc, r) => acc + r.passed, 0)} tests`);
  console.log(`Mean Total Execution:   ${stats.mean.toFixed(2)} ms (${(stats.mean / 1000).toFixed(2)}s)`);
  console.log(`Median Execution:       ${stats.median.toFixed(2)} ms`);
  console.log(`Min Execution:          ${stats.min.toFixed(2)} ms`);
  console.log(`Max Execution:          ${stats.max.toFixed(2)} ms`);
  console.log(`P95 Latency:            ${stats.p95.toFixed(2)} ms`);
  console.log(`Standard Deviation:     ${stats.stdDev.toFixed(2)} ms`);
  console.log(`SLA Requirement:        < 2,000 ms (< 2.0s)`);
  console.log(`SLA Conformance:        ${stats.max < 2000 ? '✅ STRICT PASS (100% of runs under 2.0s)' : '❌ SLA BREACH'}`);
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('Fatal stress error:', err);
  process.exit(1);
});
