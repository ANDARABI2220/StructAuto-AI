/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Unit test for PDF report data preparation and generation
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { createTenStoryRcBuilding } from './sampleModels.ts';
import { evaluateCompliance } from './standardsEngine.ts';
import { jsPDF } from 'jspdf';

test('PDF generation constructs valid jsPDF instance with compliance content', () => {
  const project = createTenStoryRcBuilding();
  const report = evaluateCompliance(project);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.text('STRUCTAUTO AI — TEST REPORT', 10, 10);
  doc.text(`Score: ${report.overallScore}%`, 10, 20);
  doc.text(`Stories: ${project.stories.length}`, 10, 30);

  const output = doc.output('arraybuffer');
  assert.ok(output.byteLength > 100, 'PDF buffer should be non-empty');
  assert.strictEqual(doc.getNumberOfPages(), 1);
});
