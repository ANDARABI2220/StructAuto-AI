import test from 'node:test';
import assert from 'node:assert/strict';
import { createTenStoryRcBuilding } from './sampleModels.ts';
import { evaluateCompliance, getStandardClauses } from './standardsEngine.ts';

test('getStandardClauses returns required clauses including 2800, مبحث 9, and ACI 318', () => {
  const clauses = getStandardClauses('ایران');
  assert.ok(clauses.some((c) => c.id === 'ir-2800-drift'), 'Should contain 2800 drift clause');
  assert.ok(clauses.some((c) => c.id === 'ir-mabhath9-col-rebar'), 'Should contain mabhath 9 rebar clause');
  assert.ok(clauses.some((c) => c.id === 'aci-318-shear-capacity'), 'Should contain ACI 318 clause');
});

test('evaluateCompliance evaluates compliant status when drift is within 0.02', () => {
  const project = createTenStoryRcBuilding();
  project.stats.maxStoryDrift = 0.0084;
  const report = evaluateCompliance(project);

  assert.ok(report.overallScore >= 90, 'Score should be >= 90%');
  assert.ok(report.compliantCount > 5, 'Compliant count should be > 5');
});

test('evaluateCompliance flags non_compliant if drift exceeds allowable limit', () => {
  const project = createTenStoryRcBuilding();
  project.stats.maxStoryDrift = 0.026; // exceeds 0.02
  const report = evaluateCompliance(project);

  assert.ok(report.gapItems.some((g) => g.includes('دریفت سازه')), 'Should flag drift gap item');
});
