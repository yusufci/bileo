// Bileo Ultra-Robust Test Framework & Assertion Library
// Zero external dependency, high-performance, colored TAP & summary reporter.

export interface TestItem {
  suiteName: string;
  testName: string;
  fn: () => void | Promise<void>;
}

export interface TestResult {
  suiteName: string;
  testName: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

export class TestRunner {
  private currentSuite = 'Default Suite';
  private queuedTests: TestItem[] = [];
  private results: TestResult[] = [];

  suite(name: string, fn: () => void) {
    this.currentSuite = name;
    fn();
  }

  test(name: string, fn: () => void | Promise<void>) {
    this.queuedTests.push({
      suiteName: this.currentSuite,
      testName: name,
      fn,
    });
  }

  async runAll(): Promise<TestResult[]> {
    this.results = [];
    for (const item of this.queuedTests) {
      const start = performance.now();
      try {
        await item.fn();
        const durationMs = performance.now() - start;
        this.results.push({
          suiteName: item.suiteName,
          testName: item.testName,
          passed: true,
          durationMs,
        });
      } catch (err: any) {
        const durationMs = performance.now() - start;
        this.results.push({
          suiteName: item.suiteName,
          testName: item.testName,
          passed: false,
          durationMs,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    }
    return this.results;
  }

  printSummary(): boolean {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = total - passed;
    const totalDuration = this.results.reduce((acc, r) => acc + r.durationMs, 0);

    console.log('\n' + '='.repeat(80));
    console.log(` BILEO TEST SUITE EXECUTION SUMMARY`);
    console.log('='.repeat(80));

    // Group by suite
    const suites = new Map<string, TestResult[]>();
    for (const r of this.results) {
      if (!suites.has(r.suiteName)) {
        suites.set(r.suiteName, []);
      }
      suites.get(r.suiteName)!.push(r);
    }

    for (const [suiteName, tests] of suites.entries()) {
      const suitePassed = tests.filter((t) => t.passed).length;
      const suiteTotal = tests.length;
      const suiteStatus = suitePassed === suiteTotal ? '✓ PASS' : '✗ FAIL';
      console.log(`\n[${suiteStatus}] ${suiteName} (${suitePassed}/${suiteTotal} passed)`);
      for (const t of tests) {
        if (t.passed) {
          console.log(`  ✓ ${t.testName} (${t.durationMs.toFixed(2)}ms)`);
        } else {
          console.log(`  ✗ ${t.testName} (${t.durationMs.toFixed(2)}ms)`);
          console.log(`    Error: ${t.error?.message}`);
          if (t.error?.stack) {
            const stackLines = t.error.stack.split('\n').slice(1, 4).join('\n    ');
            console.log(`    Stack:\n    ${stackLines}`);
          }
        }
      }
    }

    console.log('\n' + '-'.repeat(80));
    console.log(`Total Tests:    ${total}`);
    console.log(`Passed:         ${passed}`);
    console.log(`Failed:         ${failed}`);
    console.log(`Duration:       ${totalDuration.toFixed(2)}ms`);
    console.log(`Overall Status: ${failed === 0 ? 'ALL TESTS PASSED (100%)' : 'TESTS FAILED'}`);
    console.log('='.repeat(80) + '\n');

    return failed === 0;
  }
}

// Global runner instance
export const runner = new TestRunner();
export const describe = (name: string, fn: () => void) => runner.suite(name, fn);
export const it = (name: string, fn: () => void | Promise<void>) => runner.test(name, fn);
export const test = it;

// Assertion utilities
export const expect = (actual: any) => ({
  toBe(expected: any) {
    if (actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    }
  },
  toEqual(expected: any) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) {
      throw new Error(`Expected deep equality:\nExpected: ${b}\nActual:   ${a}`);
    }
  },
  toBeTruthy() {
    if (!actual) {
      throw new Error(`Expected truthy value but got ${JSON.stringify(actual)}`);
    }
  },
  toBeFalsy() {
    if (actual) {
      throw new Error(`Expected falsy value but got ${JSON.stringify(actual)}`);
    }
  },
  toBeGreaterThan(expected: number) {
    if (typeof actual !== 'number' || actual <= expected) {
      throw new Error(`Expected ${actual} to be greater than ${expected}`);
    }
  },
  toBeGreaterThanOrEqual(expected: number) {
    if (typeof actual !== 'number' || actual < expected) {
      throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
    }
  },
  toBeLessThan(expected: number) {
    if (typeof actual !== 'number' || actual >= expected) {
      throw new Error(`Expected ${actual} to be less than ${expected}`);
    }
  },
  toBeLessThanOrEqual(expected: number) {
    if (typeof actual !== 'number' || actual > expected) {
      throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
    }
  },
  toContain(expected: any) {
    if (Array.isArray(actual)) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected array to contain ${JSON.stringify(expected)}`);
      }
    } else if (typeof actual === 'string') {
      if (!actual.includes(expected)) {
        throw new Error(`Expected string "${actual}" to contain "${expected}"`);
      }
    } else {
      throw new Error(`toContain called on non-collection type ${typeof actual}`);
    }
  },
  toNotContain(expected: any) {
    if (Array.isArray(actual)) {
      if (actual.includes(expected)) {
        throw new Error(`Expected array NOT to contain ${JSON.stringify(expected)}`);
      }
    } else if (typeof actual === 'string') {
      if (actual.includes(expected)) {
        throw new Error(`Expected string NOT to contain "${expected}"`);
      }
    }
  },
  toMatch(pattern: RegExp) {
    if (typeof actual !== 'string' || !pattern.test(actual)) {
      throw new Error(`Expected "${actual}" to match pattern ${pattern}`);
    }
  },
  toBeNull() {
    if (actual !== null) {
      throw new Error(`Expected null but got ${JSON.stringify(actual)}`);
    }
  },
  toBeDefined() {
    if (actual === undefined) {
      throw new Error(`Expected defined value but got undefined`);
    }
  },
  toBeUndefined() {
    if (actual !== undefined) {
      throw new Error(`Expected undefined but got ${JSON.stringify(actual)}`);
    }
  },
  toHaveLength(expectedLen: number) {
    if (!actual || typeof actual.length !== 'number' || actual.length !== expectedLen) {
      const len = actual ? actual.length : 'undefined';
      throw new Error(`Expected length ${expectedLen} but got ${len}`);
    }
  },
  toThrow(expectedMessage?: string | RegExp) {
    if (typeof actual !== 'function') {
      throw new Error(`toThrow must be called on a function, but got ${typeof actual}`);
    }
    let threw = false;
    let caughtError: any = null;
    try {
      actual();
    } catch (e: any) {
      threw = true;
      caughtError = e;
    }
    if (!threw) {
      throw new Error(`Expected function to throw an error, but it returned normally.`);
    }
    if (expectedMessage) {
      const msg = caughtError instanceof Error ? caughtError.message : String(caughtError);
      if (typeof expectedMessage === 'string' && !msg.includes(expectedMessage)) {
        throw new Error(`Expected error message to contain "${expectedMessage}", but got "${msg}"`);
      } else if (expectedMessage instanceof RegExp && !expectedMessage.test(msg)) {
        throw new Error(`Expected error message to match ${expectedMessage}, but got "${msg}"`);
      }
    }
  },
});

