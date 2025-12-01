#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import from built files
const { KmnParser } = require('./build/kmn-parser.js');
const { generateLdml } = require('./build/ldml-generator.js');
const { generateKmn } = require('./build/kmn-generator.js');

const kmnPath = 'D:\\Github\\keyboards\\release\\sil\\sil_akebu\\source\\sil_akebu.kmn';
const ldmlPath = 'D:\\Github\\keyboards\\release-ldml\\sil\\sil_akebu\\source\\sil_akebu.xml';
const rtPath = 'D:\\Github\\keyboards\\release-rt\\sil\\sil_akebu\\source\\sil_akebu.kmn';

console.log('Testing sil_akebu keyboard conversion...\n');

// Step 1: Read and parse KMN
console.log('1. Reading original KMN...');
const kmnSource = fs.readFileSync(kmnPath, 'utf-8');
console.log(`   ${kmnSource.split('\n').length} lines\n`);

// Step 2: Parse to AST
console.log('2. Parsing KMN to AST...');
const parser = new KmnParser();
const ast = parser.parse(kmnSource, kmnPath);
console.log(`   ✓ Parsed successfully\n`);

// Step 3: Generate LDML
console.log('3. Generating LDML...');
const ldmlXml = generateLdml(ast, {
  keyboardId: 'sil_akebu',
  locale: 'und',
  conformsTo: '45'
});
console.log(`   ${ldmlXml.split('\n').length} lines\n`);

// Step 4: Generate KMN from LDML
console.log('4. Generating KMN from LDML (round-trip)...');
const kmnRoundTrip = generateKmn(ldmlXml);
console.log(`   ${kmnRoundTrip.split('\n').length} lines\n`);

// Step 5: Check stores
console.log('5. Checking store formatting...');
const originalStore = kmnSource.match(/store\(word\) (.+)/)?.[1];
const rtStore = kmnRoundTrip.match(/store\(word\) (.+)/)?.[1];

console.log('   Original:');
console.log(`   ${originalStore?.substring(0, 100)}...`);
console.log('\n   Round-trip:');
console.log(`   ${rtStore?.substring(0, 100)}...`);

// Check for spaces between characters (bug)
if (rtStore && rtStore.includes('" U+') && rtStore.includes(' "')) {
  console.log('\n   ❌ ERROR: Store has spaces between characters!');
} else {
  console.log('\n   ✓ Store formatting looks good');
}

// Step 6: Check key rules
console.log('\n6. Checking key rule formatting...');
const originalRule = kmnSource.match(/\+ \[SHIFT RALT K_1\] > (.+)/)?.[0];
const rtRule = kmnRoundTrip.match(/\+ \[.*K_1.*\] > U\+2018/)?.[0];

console.log(`   Original: ${originalRule}`);
console.log(`   Round-trip: ${rtRule}`);

if (rtRule && rtRule.includes('K_1_shift_altR')) {
  console.log('\n   ❌ ERROR: Key ID includes modifier suffix!');
} else if (rtRule && rtRule.includes('[SHIFT RALT K_1]')) {
  console.log('\n   ✓ Key rule formatting looks good');
} else {
  console.log('\n   ⚠ Warning: Key rule format differs');
}

console.log('\nDone!');
