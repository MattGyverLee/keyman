/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * LDML Reference Keyboard Tests
 * Tests using official CLDR LDML keyboard examples
 */

import * as fs from 'fs';
import * as path from 'path';
import { KmnGenerator, parseLdmlXml } from '../src/kmn-generator.js';
import { LdmlGenerator } from '../src/ldml-generator.js';
import { KmnParser } from '../src/kmn-parser.js';
import { getLdmlReferenceFiles, validateLdmlXml } from './helpers/index.js';

interface LdmlRoundTripResult {
  keyboard: string;
  originalValid: boolean;
  kmnGenerated: boolean;
  kmnLines: number;
  ldmlRegenerated: boolean;
  ldmlValid: boolean;
  roundTripSuccess: boolean;
  notes: string[];
  errors: string[];
}

async function testLdmlRoundTrip(ldmlPath: string): Promise<LdmlRoundTripResult> {
  const keyboardName = path.basename(ldmlPath, '.xml');
  const result: LdmlRoundTripResult = {
    keyboard: keyboardName,
    originalValid: false,
    kmnGenerated: false,
    kmnLines: 0,
    ldmlRegenerated: false,
    ldmlValid: false,
    roundTripSuccess: false,
    notes: [],
    errors: [],
  };

  try {
    // Step 1: Read and validate original CLDR LDML
    const originalLdml = fs.readFileSync(ldmlPath, 'utf-8');
    const validation = validateLdmlXml(originalLdml);
    result.originalValid = validation.isValid;

    if (!validation.isValid) {
      result.errors.push(...validation.errors);
      result.notes.push('Original CLDR LDML failed schema validation');
      return result;
    }

    // Step 2: Parse LDML to internal format
    const ldmlData = parseLdmlXml(originalLdml);
    result.notes.push(`LDML has ${ldmlData.keys.length} keys, ${ldmlData.transforms.length} transforms`);

    // Step 3: Generate KMN from LDML
    const kmnGenerator = new KmnGenerator();
    const kmnSource = kmnGenerator.generate(ldmlData);
    result.kmnGenerated = true;
    result.kmnLines = kmnSource.split('\n').length;
    result.notes.push(`Generated KMN: ${result.kmnLines} lines`);

    // Step 4: Parse generated KMN
    const kmnParser = new KmnParser();
    const kmnAst = kmnParser.parse(kmnSource, `${keyboardName}.kmn`);

    // Step 5: Extract conformsTo attribute from original LDML
    const conformsToMatch = originalLdml.match(/conformsTo="([^"]+)"/);
    const conformsTo = (conformsToMatch?.[1] === '46' ? '46' : '45') as '45' | '46';

    // Step 6: Generate LDML from KMN (round-trip back)
    const ldmlGenerator = new LdmlGenerator({
      locale: ldmlData.locale || 'und',
      conformsTo,
    });
    const roundTripLdml = ldmlGenerator.generate(kmnAst);
    result.ldmlRegenerated = true;

    // Step 7: Validate regenerated LDML
    const roundTripValidation = validateLdmlXml(roundTripLdml);
    result.ldmlValid = roundTripValidation.isValid;

    if (!roundTripValidation.isValid) {
      result.errors.push(...roundTripValidation.errors);
      result.notes.push('Round-trip LDML failed schema validation');
      return result;
    }

    // Check for features that may not round-trip perfectly
    if (originalLdml.includes('<import')) {
      result.notes.push('Uses imports (may affect round-trip)');
    }
    if (originalLdml.includes('<flicks')) {
      result.notes.push('Uses flick gestures');
    }
    if (originalLdml.includes('<layer')) {
      result.notes.push('Uses layers');
    }
    if (originalLdml.includes('<transform')) {
      result.notes.push('Uses transforms');
    }
    if (originalLdml.includes('<variables')) {
      result.notes.push('Uses variables');
    }

    result.roundTripSuccess = result.originalValid && result.kmnGenerated && result.ldmlValid;

  } catch (error) {
    result.errors.push(`Error: ${(error as Error).message}`);
    result.notes.push(`Exception during processing: ${(error as Error).name}`);
  }

  return result;
}

async function runTests() {
  console.log('=== LDML Reference Keyboard Round-Trip Tests ===');
  console.log('Testing official CLDR LDML keyboards\n');

  const ldmlFiles = getLdmlReferenceFiles();

  if (ldmlFiles.length === 0) {
    console.log('No LDML reference files found in fixtures/ldml-reference/');
    console.log('Expected CLDR LDML keyboards from resources/standards-data/ldml-keyboards/46/3.0/');
    return;
  }

  console.log(`Found ${ldmlFiles.length} CLDR reference keyboards\n`);

  const results: LdmlRoundTripResult[] = [];

  for (const ldmlPath of ldmlFiles) {
    console.log(`Testing: ${path.basename(ldmlPath)}`);

    const result = await testLdmlRoundTrip(ldmlPath);
    results.push(result);

    // Print result
    console.log(`  Original LDML valid: ${result.originalValid ? '✓' : '✗'}`);
    console.log(`  KMN generated: ${result.kmnGenerated ? '✓' : '✗'} (${result.kmnLines} lines)`);
    console.log(`  LDML regenerated: ${result.ldmlRegenerated ? '✓' : '✗'}`);
    console.log(`  Round-trip LDML valid: ${result.ldmlValid ? '✓' : '✗'}`);

    if (result.notes.length > 0) {
      console.log(`  Notes: ${result.notes.join(', ')}`);
    }
    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.slice(0, 3).join('; ')}`);
    }
    console.log(`  Status: ${result.roundTripSuccess ? '✓ SUCCESS' : '✗ PARTIAL/FAILED'}`);
    console.log('');
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Tested: ${results.length} CLDR keyboards`);
  console.log(`Original LDML valid: ${results.filter(r => r.originalValid).length}`);
  console.log(`KMN generated: ${results.filter(r => r.kmnGenerated).length}`);
  console.log(`LDML regenerated: ${results.filter(r => r.ldmlRegenerated).length}`);
  console.log(`Round-trip valid: ${results.filter(r => r.ldmlValid).length}`);
  console.log(`Full success (LDML→KMN→LDML): ${results.filter(r => r.roundTripSuccess).length}`);

  // Show feature coverage
  console.log('\nCLDR keyboard features:');
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
}

runTests().catch(console.error);
