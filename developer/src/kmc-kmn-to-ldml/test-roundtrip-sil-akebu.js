#!/usr/bin/env node
/**
 * Test round-trip conversion with sil_akebu keyboard including touch layout
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { convertKmnToLdml } from './build/src/main.js';
import { extractTouchLayout } from './build/src/kmn-generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Paths
const kmnPath = 'D:/Github/keyboards/release/sil/sil_akebu/source/sil_akebu.kmn';
const touchPath = 'D:/Github/keyboards/release/sil/sil_akebu/source/sil_akebu.keyman-touch-layout';
const outputDir = 'D:/Github/keyboards/release-rt/sil/sil_akebu/source';

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });

// Read and convert
const kmnSource = fs.readFileSync(kmnPath, 'utf-8');
const touchLayout = JSON.parse(fs.readFileSync(touchPath, 'utf-8'));

console.log('Step 1: KMN + touch-layout → LDML');
const ldmlXml = convertKmnToLdml(kmnSource, {
  keyboardId: 'sil_akebu',
  locale: 'und',
  conformsTo: '45',
  touchLayout: touchLayout
});

console.log('  - LDML has touch layers:', ldmlXml.includes('formId="touch"'));
console.log('  - Original touch layout has', touchLayout.tablet?.layer?.length || 0, 'layers');

// Write LDML for inspection
const ldmlPath = path.join(outputDir, 'sil_akebu.xml');
fs.writeFileSync(ldmlPath, ldmlXml, 'utf-8');
console.log('  - LDML written to:', ldmlPath);

console.log('\nStep 2: LDML → touch-layout JSON');
const extractedTouchLayout = extractTouchLayout(ldmlXml);

if (extractedTouchLayout) {
  const touchLayoutPath = path.join(outputDir, 'sil_akebu.keyman-touch-layout');
  fs.writeFileSync(touchLayoutPath, JSON.stringify(extractedTouchLayout, null, 2), 'utf-8');
  console.log('  - Extracted touch layout written to:', touchLayoutPath);
  console.log('  - Has tablet platform:', extractedTouchLayout.tablet ? 'Yes' : 'No');
  console.log('  - Number of layers:', extractedTouchLayout.tablet?.layer?.length || 0);

  // Compare with original
  const originalLayers = touchLayout.tablet?.layer?.length || 0;
  const extractedLayers = extractedTouchLayout.tablet?.layer?.length || 0;

  console.log('\nComparison:');
  console.log('  - Original layers:', originalLayers);
  console.log('  - Extracted layers:', extractedLayers);
  console.log('  - Match:', originalLayers === extractedLayers ? '✓' : '✗');
} else {
  console.log('  - No touch layout found in LDML');
}

console.log('\n✓ Round-trip test complete!');
