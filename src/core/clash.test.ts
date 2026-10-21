/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Unit tests for 3D Geometric Clash Detection Engine
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { createTenStoryRcBuilding } from './sampleModels.ts';
import { runClashDetection } from './clashDetectionEngine.ts';

test('runClashDetection executes on 10-story building with valid structural clearances', () => {
  const project = createTenStoryRcBuilding();
  const res = runClashDetection(project);

  assert.ok(typeof res.totalClashes === 'number', 'totalClashes should be a number');
  assert.ok(res.executionTimeMs >= 0, 'executionTime should be recorded');
  assert.ok(Array.isArray(res.clashes), 'clashes should be an array');
});

test('runClashDetection detects hard clash when two duplicate overlapping elements are injected', () => {
  const project = createTenStoryRcBuilding();

  // Inject duplicate beam element on identical nodes
  const dupBeam = {
    ...project.elements[0],
    id: 'dup-clash-beam-test',
    name: 'تیر متداخل تستی',
  };
  project.elements.push(dupBeam);

  const res = runClashDetection(project);
  assert.ok(res.totalClashes > 0, 'Should detect at least 1 clash');
  const found = res.clashes.some((c) => c.severity === 'hard');
  assert.ok(found, 'Should flag duplicate overlap as hard clash');
});
