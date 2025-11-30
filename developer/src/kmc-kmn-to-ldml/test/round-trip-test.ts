/*
 * Round-trip test: KMN → LDML → KMN
 * Tests conversion fidelity by converting keyboards back and forth.
 */

import * as fs from 'fs';
import * as path from 'path';
import { KmnParser } from '../src/kmn-parser.js';
import { LdmlGenerator } from '../src/ldml-generator.js';
import { KmnGenerator, parseLdmlXml } from '../src/kmn-generator.js';
import { makePathToFixture, getAvailableKeyboards, findKmnFiles } from './helpers/index.js';

interface RoundTripResult {
  keyboard: string;
  originalLines: number;
  originalRules: number;
  ldmlBytes: number;
  roundTripLines: number;
  roundTripRules: number;
  keysPreserved: number;
  keysMissing: number;
  storesPreserved: number;
  storesMissing: number;
  success: boolean;
  notes: string[];
}

async function testRoundTrip(kmnPath: string): Promise<RoundTripResult> {
  const keyboardName = path.basename(path.dirname(kmnPath));
  const result: RoundTripResult = {
    keyboard: keyboardName,
    originalLines: 0,
    originalRules: 0,
    ldmlBytes: 0,
    roundTripLines: 0,
    roundTripRules: 0,
    keysPreserved: 0,
    keysMissing: 0,
    storesPreserved: 0,
    storesMissing: 0,
    success: false,
    notes: [],
  };

  try {
    // Read original KMN
    const originalKmn = fs.readFileSync(kmnPath, 'utf-8');
    result.originalLines = originalKmn.split('\n').length;
    result.originalRules = (originalKmn.match(/>/g) || []).length;

    // Parse original KMN
    const parser = new KmnParser();
    const originalAst = parser.parse(originalKmn, kmnPath);

    // Count original features
    const originalStores = originalAst.stores.filter(s => !s.isSystem);
    const originalKeys = new Set<string>();
    for (const group of originalAst.groups) {
      for (const rule of group.rules) {
        if (rule.key?.vkey) {
          originalKeys.add(rule.key.vkey);
        }
      }
    }

    // Convert to LDML
    const ldmlGenerator = new LdmlGenerator({
      locale: 'und',
      conformsTo: '45',
    });
    const ldmlXml = ldmlGenerator.generate(originalAst);
    result.ldmlBytes = ldmlXml.length;

    // Parse LDML
    const ldmlData = parseLdmlXml(ldmlXml);

    // Check preserved keys
    const ldmlKeys = new Set(ldmlData.keys.map(k => k.id));
    for (const key of originalKeys) {
      if (ldmlKeys.has(key)) {
        result.keysPreserved++;
      } else {
        result.keysMissing++;
      }
    }

    // Check preserved stores (as variables)
    const ldmlVars = new Set(ldmlData.variables.map(v => v.id));
    for (const store of originalStores) {
      if (ldmlVars.has(store.name)) {
        result.storesPreserved++;
      } else {
        result.storesMissing++;
      }
    }

    // Convert back to KMN
    const kmnGenerator = new KmnGenerator();
    const roundTripKmn = kmnGenerator.generate(ldmlData);
    result.roundTripLines = roundTripKmn.split('\n').length;
    result.roundTripRules = (roundTripKmn.match(/>/g) || []).length;

    // Analyze differences
    if (result.keysMissing > 0) {
      result.notes.push(`${result.keysMissing} keys not preserved`);
    }
    if (result.storesMissing > 0) {
      result.notes.push(`${result.storesMissing} stores not preserved`);
    }

    // Check for complex features that may not round-trip perfectly
    if (originalKmn.includes('any(') || originalKmn.includes('index(')) {
      result.notes.push('Uses any/index (complex context matching)');
    }
    if (originalKmn.includes('if(') || originalKmn.includes('set(')) {
      result.notes.push('Uses if/set (options)');
    }
    if (originalKmn.includes('use(')) {
      result.notes.push('Uses multiple groups');
    }
    if (originalKmn.includes('dk(') || originalKmn.includes('deadkey(')) {
      result.notes.push('Uses deadkeys');
    }
    if (originalKmn.includes('platform(')) {
      result.notes.push('Uses platform conditions');
    }

    result.success = result.keysMissing === 0 && result.keysPreserved > 0;

    // Write outputs for inspection (optional - comment out if not needed)
    // const outputDir = path.join(__dirname, '../build/round-trip');
    // fs.mkdirSync(outputDir, { recursive: true });
    // fs.writeFileSync(path.join(outputDir, `${keyboardName}.ldml.xml`), ldmlXml);
    // fs.writeFileSync(path.join(outputDir, `${keyboardName}.round-trip.kmn`), roundTripKmn);

  } catch (error) {
    result.notes.push(`Error: ${(error as Error).message}`);
  }

  return result;
}

async function runTests() {
  console.log('=== KMN → LDML → KMN Round-Trip Test ===\n');

  // Get all available test keyboards from fixtures
  const keyboards = getAvailableKeyboards();

  if (keyboards.length === 0) {
    console.log('No test keyboards found in fixtures/keyboards/');
    console.log('Expected keyboards in: test/fixtures/keyboards/<keyboard_name>/');
    return;
  }

  const results: RoundTripResult[] = [];

  for (const keyboardName of keyboards) {
    const kmnFiles = findKmnFiles(keyboardName);

    if (kmnFiles.length === 0) {
      console.log(`Skipping ${keyboardName}: No .kmn file found\n`);
      continue;
    }

    // Test each .kmn file (usually just one per keyboard)
    for (const kmnPath of kmnFiles) {
      console.log(`Testing: ${keyboardName} (${path.basename(kmnPath)})`);

      try {
        const result = await testRoundTrip(kmnPath);
        results.push(result);

        // Print result
        console.log(`  Original: ${result.originalLines} lines, ${result.originalRules} rules`);
        console.log(`  LDML: ${result.ldmlBytes} bytes`);
        console.log(`  Round-trip: ${result.roundTripLines} lines, ${result.roundTripRules} rules`);
        console.log(`  Keys: ${result.keysPreserved} preserved, ${result.keysMissing} missing`);
        console.log(`  Stores: ${result.storesPreserved} preserved, ${result.storesMissing} missing`);
        if (result.notes.length > 0) {
          console.log(`  Notes: ${result.notes.join(', ')}`);
        }
        console.log(`  Status: ${result.success ? '✓ SUCCESS' : '✗ PARTIAL'}`);
        console.log('');
      } catch (e) {
        console.log(`  Error: ${(e as Error).message}\n`);
      }
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Tested: ${results.length} keyboards`);
  console.log(`Full success: ${results.filter(r => r.success).length}`);
  console.log(`Partial: ${results.filter(r => !r.success).length}`);

  // Show feature coverage
  console.log('\nComplex features encountered:');
  const features = new Map<string, number>();
  for (const r of results) {
    for (const note of r.notes) {
      if (note.startsWith('Uses ')) {
        features.set(note, (features.get(note) || 0) + 1);
      }
    }
  }
  for (const [feature, count] of features) {
    console.log(`  ${feature}: ${count} keyboards`);
  }

  // console.log('\nOutput files written to build/round-trip/ (if enabled)');
}

runTests().catch(console.error);
