import test from 'node:test';
import assert from 'node:assert/strict';
import { createTenStoryRcBuilding } from './sampleModels.ts';
import { runIndependentVerification } from './verificationEngine.ts';
import { computeBenchmarkSummary, DEFAULT_BENCHMARK_TASKS } from './benchmarkEngine.ts';
import { auditLedger } from './auditEngine.ts';

test('runIndependentVerification verifies static equilibrium and zero silent errors', () => {
  const project = createTenStoryRcBuilding();
  const res = runIndependentVerification(project);

  assert.equal(res.silentErrorsDetected, 0, 'Silent error must be 0 for release readiness');
  assert.ok(res.accuracyRate >= 99.0, 'Accuracy rate must be >= 99.0%');
  assert.ok(res.checks.length >= 5, 'Should execute at least 5 independent checks');
  assert.equal(res.crossCheckResults.consistent, true, 'Cross-check between engines must be consistent');
});

test('computeBenchmarkSummary verifies >= 1000x Speedup KPI target', () => {
  const summary = computeBenchmarkSummary(DEFAULT_BENCHMARK_TASKS);

  assert.equal(summary.isKpiAchieved, true, 'Overall speedup must achieve the 1000x KPI target');
  assert.ok(summary.overallMedianSpeedup >= 1000, 'Median speedup must be >= 1000');
  assert.ok(summary.overallP95Speedup > 0, 'P95 speedup must be positive');
  assert.ok(summary.totalTimeSavedHours > 10, 'Total time saved should be significant');
});

test('auditLedger records events with hash-chain integrity', async () => {
  const block = await auditLedger.recordEvent('TEST_ACTION', 'UnitTester', 'proj-1', 'Test verification');
  assert.ok(block.hash.length >= 16, 'Hash should be computed');
  assert.ok(block.previousHash.length >= 16, 'Previous hash should be present');

  const check = await auditLedger.verifyIntegrity();
  assert.equal(check.valid, true, 'Audit ledger integrity must be valid');
});
