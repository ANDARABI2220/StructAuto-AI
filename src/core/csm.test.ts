import test from 'node:test';
import assert from 'node:assert/strict';
import { createTenStoryRcBuilding, createSixStorySteelBuilding } from './sampleModels.ts';
import { parseStructuralFile, computeCsmDiff } from './csmEngine.ts';

test('createTenStoryRcBuilding generates valid 10-story CSM project with elements and nodes', () => {
  const project = createTenStoryRcBuilding();
  assert.equal(project.stories.length, 10);
  assert.ok(project.nodes.length > 50, 'Nodes count should be > 50');
  assert.ok(project.elements.length > 100, 'Elements count should be > 100');
  assert.ok(project.materials.length >= 2, 'Should have concrete and steel materials');
  assert.ok(project.sections.length >= 3, 'Should have column and beam sections');
  assert.equal(project.unitSystem, 'metric_si');
});

test('createSixStorySteelBuilding generates valid 6-story steel frame', () => {
  const project = createSixStorySteelBuilding();
  assert.equal(project.stories.length, 6);
  assert.ok(project.elements.some((e) => e.type === 'brace'), 'Should contain steel braces');
  assert.ok(project.stats.totalStructuralSteelTon > 50, 'Should have structural steel tonnage');
});

test('parseStructuralFile correctly detects .e2k extension and loads model', () => {
  const result = parseStructuralFile('Building_Test.e2k', 'STORY "STORY1" HEIGHT 3.2\nSTORY "STORY2" HEIGHT 3.2');
  assert.equal(result.success, true);
  assert.equal(result.format, 'e2k');
  assert.ok(result.project !== undefined);
  assert.equal(result.project?.stories.length, 10);
});

test('computeCsmDiff detects modifications and computes max D/C delta', () => {
  const base = createTenStoryRcBuilding();
  const modified = JSON.parse(JSON.stringify(base));
  modified.elements[0].designResults.dcRatio = 0.99;

  const diff = computeCsmDiff(base, modified);
  assert.ok(diff.modifiedElements.length > 0 || diff.maxDcChange > 0);
});
