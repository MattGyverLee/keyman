#!/usr/bin/env node

const fs = require('fs');
const { KmnParser } = require('./src/kmn-parser.cjs');
const { LdmlGenerator } = require('./src/ldml-generator.cjs');
const { generateKmn } = require('./src/kmn-generator.cjs');

// Test single keyboard
const kmnPath = '/home/user/keyboards-test/release/sil/sil_akebu/source/sil_akebu.kmn';
const kmnContent = fs.readFileSync(kmnPath, 'utf-8');

console.log('=== ROUNDTRIP TEST: sil_akebu ===\n');

// Parse original KMN
const parser = new KmnParser();
const keyboard = parser.parse(kmnContent);

// Convert to LDML
const generator = new LdmlGenerator({ useSetMapping: true });
const ldml = generator.generate(keyboard);

// Convert LDML back to KMN
const roundtripKmn = generateKmn(ldml);

// Compare
const origLines = kmnContent.split('\n');
const rtLines = roundtripKmn.split('\n');

console.log(`Original lines: ${origLines.length}`);
console.log(`Roundtrip lines: ${rtLines.length}`);
console.log('');

// Count differences
let identical = 0;
let different = 0;
let added = 0;
let removed = 0;

const maxLen = Math.max(origLines.length, rtLines.length);
for (let i = 0; i < maxLen; i++) {
  const orig = origLines[i] || '';
  const rt = rtLines[i] || '';

  if (orig.trim() === rt.trim()) {
    identical++;
  } else if (!origLines[i]) {
    added++;
  } else if (!rtLines[i]) {
    removed++;
  } else {
    different++;
  }
}

console.log('Comparison results:');
console.log(`  Identical (ignoring whitespace): ${identical}`);
console.log(`  Different: ${different}`);
console.log(`  Lines added in roundtrip: ${added}`);
console.log(`  Lines removed in roundtrip: ${removed}`);

// Show first 10 differences
console.log('\n=== FIRST 10 DIFFERENCES ===\n');
let diffCount = 0;
for (let i = 0; i < maxLen && diffCount < 10; i++) {
  const orig = (origLines[i] || '').trim();
  const rt = (rtLines[i] || '').trim();

  if (orig !== rt) {
    console.log(`Line ${i + 1}:`);
    console.log(`  ORIG: ${orig.substring(0, 100)}`);
    console.log(`  RT:   ${rt.substring(0, 100)}`);
    console.log('');
    diffCount++;
  }
}

// Write files for inspection
fs.writeFileSync('/tmp/sil_akebu-roundtrip.kmn', roundtripKmn);
console.log('\nRoundtrip KMN written to /tmp/sil_akebu-roundtrip.kmn');
