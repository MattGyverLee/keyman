/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Analyze functional differences between KMN source and generated LDML
 */

import * as fs from 'fs';
import * as path from 'path';
import { KmnParser } from '../src/kmn-parser.js';
import { LdmlGenerator, UnsupportedKeyboardError } from '../src/ldml-generator.js';
import { KmnGenerator, parseLdmlXml } from '../src/kmn-generator.js';

const keyboardsPath = '/home/user/keyboards-temp/release';

interface FeatureAnalysis {
  keyboard: string;
  skipped: boolean;
  skipReason?: string;
  // KMN features
  kmnFeatures: {
    totalRules: number;
    simpleKeyRules: number;
    contextRules: number;
    stores: number;
    systemStores: number;
    groups: number;
    deadkeys: number;
    anyIndexPairs: number;
    platformRules: number;
    setIfRules: number;
  };
  // LDML features generated
  ldmlFeatures: {
    keys: number;
    modifierCombinations: number;
    transforms: number;
    variables: number;
    layers: number;
  };
  // What's preserved vs lost
  preserved: string[];
  lost: string[];
  notes: string[];
}

function analyzeKeyboard(kmnPath: string): FeatureAnalysis {
  const keyboardName = path.basename(path.dirname(path.dirname(kmnPath)));
  const result: FeatureAnalysis = {
    keyboard: keyboardName,
    skipped: false,
    kmnFeatures: {
      totalRules: 0,
      simpleKeyRules: 0,
      contextRules: 0,
      stores: 0,
      systemStores: 0,
      groups: 0,
      deadkeys: 0,
      anyIndexPairs: 0,
      platformRules: 0,
      setIfRules: 0,
    },
    ldmlFeatures: {
      keys: 0,
      modifierCombinations: 0,
      transforms: 0,
      variables: 0,
      layers: 0,
    },
    preserved: [],
    lost: [],
    notes: [],
  };

  try {
    // Parse KMN
    const originalKmn = fs.readFileSync(kmnPath, 'utf-8');
    const parser = new KmnParser();
    const kmnAst = parser.parse(originalKmn, kmnPath);

    // Analyze KMN features
    result.kmnFeatures.stores = kmnAst.stores.filter(s => !s.isSystem).length;
    result.kmnFeatures.systemStores = kmnAst.stores.filter(s => s.isSystem).length;
    result.kmnFeatures.groups = kmnAst.groups.length;

    const deadkeySet = new Set<string>();
    let anyIndexPairs = 0;

    for (const group of kmnAst.groups) {
      for (const rule of group.rules) {
        result.kmnFeatures.totalRules++;

        // Simple key rules vs context rules
        const hasRealContext = rule.context.some(e => e.type !== 'if');
        if (hasRealContext || rule.key?.anyStoreName) {
          result.kmnFeatures.contextRules++;
        } else if (rule.key) {
          result.kmnFeatures.simpleKeyRules++;
        }

        // Platform-specific rules
        if (rule.platform) {
          result.kmnFeatures.platformRules++;
        }

        // Set/if rules
        const hasSetIf = rule.context.some(e => e.type === 'if') ||
                         rule.output.some(e => e.type === 'set');
        if (hasSetIf) {
          result.kmnFeatures.setIfRules++;
        }

        // Deadkeys
        for (const elem of [...rule.context, ...rule.output]) {
          if (elem.type === 'deadkey') {
            deadkeySet.add(elem.name);
          }
        }

        // Any/index pairs
        const anyCount = rule.context.filter(e => e.type === 'any').length +
                        (rule.key?.anyStoreName ? 1 : 0);
        const indexCount = rule.output.filter(e => e.type === 'index').length;
        if (anyCount > 0 && indexCount > 0) {
          anyIndexPairs += Math.min(anyCount, indexCount);
        }
      }
    }

    result.kmnFeatures.deadkeys = deadkeySet.size;
    result.kmnFeatures.anyIndexPairs = anyIndexPairs;

    // Generate LDML
    const ldmlGenerator = new LdmlGenerator({
      locale: 'und',
      conformsTo: '45',
    });

    let ldmlXml: string;
    try {
      ldmlXml = ldmlGenerator.generate(kmnAst);
    } catch (e) {
      if (e instanceof UnsupportedKeyboardError) {
        result.skipped = true;
        result.skipReason = e.featureType === 'mnemonic'
          ? 'Mnemonic keyboard'
          : `Unsupported: ${e.message}`;
        return result;
      }
      throw e;
    }

    // Analyze LDML output
    const ldmlData = parseLdmlXml(ldmlXml);
    result.ldmlFeatures.keys = ldmlData.keys.length;
    result.ldmlFeatures.transforms = ldmlData.transforms.length;
    result.ldmlFeatures.variables = ldmlData.variables.length;
    result.ldmlFeatures.layers = ldmlData.layers.length;

    // Count modifier combinations
    const modCombos = new Set<string>();
    for (const key of ldmlData.keys) {
      modCombos.add(key.modifiers || 'none');
    }
    result.ldmlFeatures.modifierCombinations = modCombos.size;

    // Determine what's preserved vs lost
    if (result.kmnFeatures.simpleKeyRules > 0) {
      const keyRatio = result.ldmlFeatures.keys / result.kmnFeatures.simpleKeyRules;
      if (keyRatio >= 0.9) {
        result.preserved.push(`Key mappings (${result.ldmlFeatures.keys}/${result.kmnFeatures.simpleKeyRules})`);
      } else if (keyRatio > 0) {
        result.notes.push(`Partial key mappings (${result.ldmlFeatures.keys}/${result.kmnFeatures.simpleKeyRules})`);
      } else {
        result.lost.push('Key mappings');
      }
    }

    if (result.kmnFeatures.contextRules > 0) {
      if (result.ldmlFeatures.transforms > 0) {
        result.preserved.push(`Context rules → transforms (${result.ldmlFeatures.transforms})`);
      } else {
        result.lost.push(`Context rules (${result.kmnFeatures.contextRules})`);
      }
    }

    if (result.kmnFeatures.deadkeys > 0) {
      // Check if deadkeys are in LDML markers
      const hasMarkers = ldmlXml.includes('\\m{');
      if (hasMarkers) {
        result.preserved.push(`Deadkeys as markers (${result.kmnFeatures.deadkeys})`);
      } else {
        result.lost.push(`Deadkeys (${result.kmnFeatures.deadkeys})`);
      }
    }

    if (result.kmnFeatures.anyIndexPairs > 0) {
      // Check for set mapping
      const hasSetMapping = ldmlXml.includes('($[') && ldmlXml.includes('$[');
      if (hasSetMapping) {
        result.preserved.push(`Any/index → set mapping (${result.kmnFeatures.anyIndexPairs} pairs)`);
      } else {
        result.notes.push(`Any/index expanded (${result.kmnFeatures.anyIndexPairs} pairs)`);
      }
    }

    if (result.kmnFeatures.stores > 0) {
      if (result.ldmlFeatures.variables > 0) {
        result.preserved.push(`Stores → variables (${result.ldmlFeatures.variables}/${result.kmnFeatures.stores})`);
      } else {
        result.notes.push('Stores inlined (not as variables)');
      }
    }

    if (result.kmnFeatures.platformRules > 0) {
      result.notes.push(`Platform-specific rules: desktop preferred (${result.kmnFeatures.platformRules} rules)`);
    }

    if (result.kmnFeatures.setIfRules > 0) {
      result.lost.push(`Runtime options (set/if) not fully supported (${result.kmnFeatures.setIfRules} rules)`);
    }

    if (result.kmnFeatures.groups > 1) {
      result.notes.push(`Multiple groups (${result.kmnFeatures.groups}) - processing order may differ`);
    }

  } catch (error) {
    result.notes.push(`Error: ${(error as Error).message}`);
  }

  return result;
}

async function runAnalysis() {
  console.log('=== KMN to LDML Functional Difference Analysis ===\n');

  // Test keyboards from the round-trip test
  const testKeyboards = [
    'n/nandinagari_inscript',
    'sil/sil_tawallammat',
    'gff/gff_harari',
    'basic/basic_kbdsg',
    'fv/fv_onayotaaka',
    'basic/basic_kbdtuf',
    'bj/bj_cree_west_latn',
    'basic/basic_kbdtzm',
    'p/phonetic_farsi',
    'sil/sil_mali_qwertz',
    'basic/basic_kbdjav',
    'el/el_nuer',
    'basic/basic_kbdogham',
    'fv/fv_dene_zhatie',
    'sil/sil_sgaw_karen',
    'basic/basic_kbdlisus',
    'm/manchu',
    'c/cypro_minoan',
  ];

  const results: FeatureAnalysis[] = [];

  for (const kb of testKeyboards) {
    try {
      const keyboardDir = path.join(keyboardsPath, kb);
      const sourcePath = path.join(keyboardDir, 'source');

      if (!fs.existsSync(sourcePath)) continue;

      const files = fs.readdirSync(sourcePath);
      const kmnFile = files.find(f => f.endsWith('.kmn'));

      if (kmnFile) {
        const result = analyzeKeyboard(path.join(sourcePath, kmnFile));
        results.push(result);

        console.log(`\n${result.keyboard}`);
        console.log('─'.repeat(40));

        if (result.skipped) {
          console.log(`  ⊘ SKIPPED: ${result.skipReason}`);
          continue;
        }

        console.log('  KMN Features:');
        console.log(`    Rules: ${result.kmnFeatures.totalRules} (${result.kmnFeatures.simpleKeyRules} key, ${result.kmnFeatures.contextRules} context)`);
        console.log(`    Stores: ${result.kmnFeatures.stores} user + ${result.kmnFeatures.systemStores} system`);
        if (result.kmnFeatures.deadkeys > 0) console.log(`    Deadkeys: ${result.kmnFeatures.deadkeys}`);
        if (result.kmnFeatures.anyIndexPairs > 0) console.log(`    Any/Index: ${result.kmnFeatures.anyIndexPairs} pairs`);
        if (result.kmnFeatures.platformRules > 0) console.log(`    Platform rules: ${result.kmnFeatures.platformRules}`);

        console.log('  LDML Output:');
        console.log(`    Keys: ${result.ldmlFeatures.keys} (${result.ldmlFeatures.modifierCombinations} modifier combos)`);
        console.log(`    Transforms: ${result.ldmlFeatures.transforms}`);
        if (result.ldmlFeatures.variables > 0) console.log(`    Variables: ${result.ldmlFeatures.variables}`);

        if (result.preserved.length > 0) {
          console.log('  ✓ Preserved:');
          for (const p of result.preserved) console.log(`      ${p}`);
        }

        if (result.lost.length > 0) {
          console.log('  ✗ Lost/Unsupported:');
          for (const l of result.lost) console.log(`      ${l}`);
        }

        if (result.notes.length > 0) {
          console.log('  ⚠ Notes:');
          for (const n of result.notes) console.log(`      ${n}`);
        }
      }
    } catch (e) {
      console.log(`  Error: ${(e as Error).message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY: Functional Differences');
  console.log('='.repeat(50));

  const skipped = results.filter(r => r.skipped);
  const analyzed = results.filter(r => !r.skipped);

  console.log(`\nAnalyzed: ${analyzed.length} keyboards (${skipped.length} skipped)`);

  // Aggregate feature support
  const featureSupport = {
    keyMappings: analyzed.filter(r => r.preserved.some(p => p.includes('Key mappings'))).length,
    contextRules: analyzed.filter(r => r.preserved.some(p => p.includes('transforms'))).length,
    deadkeys: analyzed.filter(r => r.preserved.some(p => p.includes('Deadkeys'))).length,
    setMapping: analyzed.filter(r => r.preserved.some(p => p.includes('set mapping'))).length,
    variables: analyzed.filter(r => r.preserved.some(p => p.includes('variables'))).length,
  };

  const featureLost = {
    contextRules: analyzed.filter(r => r.lost.some(l => l.includes('Context rules'))).length,
    deadkeys: analyzed.filter(r => r.lost.some(l => l.includes('Deadkeys'))).length,
    setIf: analyzed.filter(r => r.lost.some(l => l.includes('set/if'))).length,
  };

  console.log('\nFeature Preservation:');
  console.log(`  Key mappings preserved: ${featureSupport.keyMappings}/${analyzed.length}`);
  console.log(`  Context → transforms: ${featureSupport.contextRules}/${analyzed.filter(r => r.kmnFeatures.contextRules > 0).length}`);
  console.log(`  Deadkeys → markers: ${featureSupport.deadkeys}/${analyzed.filter(r => r.kmnFeatures.deadkeys > 0).length}`);
  console.log(`  Any/index → set mapping: ${featureSupport.setMapping}/${analyzed.filter(r => r.kmnFeatures.anyIndexPairs > 0).length}`);
  console.log(`  Stores → variables: ${featureSupport.variables}/${analyzed.filter(r => r.kmnFeatures.stores > 0).length}`);

  console.log('\nKnown Limitations:');
  console.log(`  - Mnemonic keyboards: Not supported by LDML (${skipped.length} skipped)`);
  console.log(`  - Runtime options (set/if): ${featureLost.setIf} keyboards affected`);
  console.log('  - Platform conditionals: Desktop rules preferred, web-only rules may be lost');
  console.log('  - Multiple groups: Execution order preserved but transform grouping differs');

  console.log('\nKey Functional Differences:');
  console.log('  1. LDML is positional-only (no mnemonic support)');
  console.log('  2. LDML transforms are regex-based (more flexible than KMN context)');
  console.log('  3. LDML markers ≈ KMN deadkeys (conceptually similar)');
  console.log('  4. LDML variables/set-mapping ≈ KMN any/index (compact representation)');
  console.log('  5. LDML lacks runtime state (KMN set/if not fully convertible)');
}

runAnalysis().catch(console.error);
