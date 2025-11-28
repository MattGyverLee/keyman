/*
 * Round-trip test: KMN → LDML → KMN
 * Tests conversion fidelity by converting keyboards back and forth.
 */

import * as fs from 'fs';
import * as path from 'path';
import { KmnParser } from '../src/kmn-parser.js';
import { LdmlGenerator, UnsupportedKeyboardError } from '../src/ldml-generator.js';
import { KmnGenerator, parseLdmlXml } from '../src/kmn-generator.js';

const keyboardsPath = '/home/user/keyboards-temp/release';

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
  skipped: boolean;
  skipReason?: string;
  notes: string[];
}

async function testRoundTrip(kmnPath: string): Promise<RoundTripResult> {
  const keyboardName = path.basename(path.dirname(path.dirname(kmnPath)));
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
    skipped: false,
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
    let hasAnyStoreKeys = false;
    for (const group of originalAst.groups) {
      for (const rule of group.rules) {
        if (rule.key?.vkey) {
          // Skip beep-only keys (placeholders that don't produce output)
          const isBeepOnly = rule.output.length === 1 && rule.output[0].type === 'beep';
          if (!isBeepOnly) {
            originalKeys.add(rule.key.vkey);
          }
        }
        // Track if keyboard uses any(store) as key pattern
        if (rule.key?.anyStoreName) {
          hasAnyStoreKeys = true;
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
    // Extract base key IDs from LDML (e.g., K_A_shift_altR -> K_A)
    const ldmlBaseKeys = new Set<string>();
    for (const k of ldmlData.keys) {
      // Extract base key ID by removing all modifier suffixes
      let baseId = k.id;
      // Remove modifier suffixes iteratively
      while (baseId.match(/_(shift|ctrl|altR|caps|alt)$/i)) {
        baseId = baseId.replace(/_(shift|ctrl|altR|caps|alt)$/i, '');
      }
      ldmlBaseKeys.add(baseId);
      ldmlBaseKeys.add(k.id); // Also add full ID for exact matches
    }
    for (const key of originalKeys) {
      if (ldmlBaseKeys.has(key)) {
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

    // Success criteria:
    // - For keyboards with explicit keys: no keys missing and at least some preserved
    // - For keyboards with any(store) keys: stores preserved and transforms generated
    if (hasAnyStoreKeys && originalKeys.size === 0) {
      // Keyboard uses any(store) patterns - success if stores preserved and transforms exist
      result.success = result.storesPreserved > 0 && ldmlData.transforms.length > 0;
    } else {
      // Standard keyboard with explicit keys
      result.success = result.keysMissing === 0 && result.keysPreserved > 0;
    }

    // Write outputs for inspection
    const outputDir = '/tmp/round-trip';
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, `${keyboardName}.ldml.xml`), ldmlXml);
    fs.writeFileSync(path.join(outputDir, `${keyboardName}.round-trip.kmn`), roundTripKmn);

  } catch (error) {
    // Check if this is an expected unsupported keyboard type
    if (error instanceof UnsupportedKeyboardError) {
      result.skipped = true;
      if (error.featureType === 'mnemonic') {
        result.skipReason = 'Mnemonic keyboard (not supported by LDML)';
      } else {
        result.skipReason = `Unsupported feature: ${error.message}`;
      }
    } else {
      result.notes.push(`Error: ${(error as Error).message}`);
    }
  }

  return result;
}

async function runTests() {
  console.log('=== KMN → LDML → KMN Round-Trip Test ===\n');

  // Test keyboards (ordered by complexity)
  const testKeyboards = [
    'n/nandinagari_inscript',
    'sil/sil_tawallammat',
    'gff/gff_harari',
    'basic/basic_kbdsg',
    'fv/fv_onayotaaka',
    'basic/basic_kbdtuf',
    'bj/bj_cree_west_latn',
    'basic/basic_kbdtzm',
    'basic/basic_kbdsors1',
    'p/phonetic_farsi',
    'sil/sil_mali_qwertz',
    'basic/basic_kbdjav',
    'el/el_nuer',
    'basic/basic_kbdogham',
    'fv/fv_dene_zhatie',
    'n/newa_traditional_extended',
    'sil/sil_sgaw_karen',
    'basic/basic_kbdlisus',
    'basic/basic_kbdmonst',
    'basic/basic_kbdir',
    'p/phaistos_disc',
    'k/kmhmu_2008',
    'u/uma_phonetic',
    'fv/fv_dakota_sk',
    'sil/sil_devanagari_romanized',
    'fv/fv_skaru_re',
    'basic/basic_kbdughr',
    'basic/basic_kbdgeoqw',
    'fv/fv_tsuutina',
    'm/modi_inscript',
    'sil/sil_tagdal',
    'basic/basic_kbdgr1',
    'l/lycian',
    'o/old_turkic_udw21_qwerty',
    'd/devanagari_kagapa_phonetic',
    'a/aramaic_hebrew',
    's/sogdian_phonetic',
    'sil/sil_ethiopic_power_g',
    'basic/basic_kbdpo',
    'basic/basic_kbdosa',
    'rac/rac_wakhi',
    'p/postmodern_english_uk_natural',
    'n/numanggang',
    'c/cs_pinyin',
    'sil/sil_el_ethiopian_latin',
    'basic/basic_kbdkyr',
    'fv/fv_moose_cree',
    'm/manchu',
    'c/cypro_minoan',
    'sil/sil_vai',
  ];

  const results: RoundTripResult[] = [];

  for (const kb of testKeyboards) {
    const kbPath = path.join(keyboardsPath, kb);
    const sourcePath = path.join(kbPath, 'source');

    // Find .kmn file
    try {
      const files = fs.readdirSync(sourcePath);
      const kmnFile = files.find(f => f.endsWith('.kmn'));
      if (kmnFile) {
        console.log(`Testing: ${kb}`);
        const result = await testRoundTrip(path.join(sourcePath, kmnFile));
        results.push(result);

        // Print result
        if (result.skipped) {
          console.log(`  Status: ⊘ SKIPPED (${result.skipReason})`);
        } else {
          console.log(`  Original: ${result.originalLines} lines, ${result.originalRules} rules`);
          console.log(`  LDML: ${result.ldmlBytes} bytes`);
          console.log(`  Round-trip: ${result.roundTripLines} lines, ${result.roundTripRules} rules`);
          console.log(`  Keys: ${result.keysPreserved} preserved, ${result.keysMissing} missing`);
          console.log(`  Stores: ${result.storesPreserved} preserved, ${result.storesMissing} missing`);
          if (result.notes.length > 0) {
            console.log(`  Notes: ${result.notes.join(', ')}`);
          }
          console.log(`  Status: ${result.success ? '✓ SUCCESS' : '✗ PARTIAL'}`);
        }
        console.log('');
      }
    } catch (e) {
      console.log(`  Error: ${(e as Error).message}\n`);
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  const skipped = results.filter(r => r.skipped);
  const tested = results.filter(r => !r.skipped);
  const successful = tested.filter(r => r.success);
  const partial = tested.filter(r => !r.success);

  console.log(`Total: ${results.length} keyboards`);
  console.log(`Tested: ${tested.length} (skipped ${skipped.length})`);
  console.log(`Full success: ${successful.length}`);
  console.log(`Partial: ${partial.length}`);

  if (skipped.length > 0) {
    console.log(`\nSkipped keyboards:`);
    for (const r of skipped) {
      console.log(`  - ${r.keyboard}: ${r.skipReason}`);
    }
  }

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

  console.log('\nOutput files written to /tmp/round-trip/');
}

runTests().catch(console.error);
