/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Compare compiled outputs from original KMN vs converted LDML keyboards
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { KmnParser } from '../src/kmn-parser.js';
import { LdmlGenerator, UnsupportedKeyboardError } from '../src/ldml-generator.js';
import { LdmlKeyboardCompiler } from '@keymanapp/kmc-ldml';
import { KmnCompiler } from '@keymanapp/kmc-kmn';
import { TestCompilerCallbacks } from '@keymanapp/developer-test-helpers';
import { LDMLKeyboardXMLSourceFileReader } from '@keymanapp/developer-utils';
import { makePathToFixture, getAvailableKeyboards, findKmnFiles } from './helpers/index.js';

interface ComparisonResult {
  keyboard: string;
  skipped: boolean;
  skipReason?: string;
  kmnCompileSuccess: boolean;
  ldmlCompileSuccess: boolean;
  kmnErrors: string[];
  ldmlErrors: string[];
  differences: string[];
}

async function compareKeyboard(kmnPath: string): Promise<ComparisonResult> {
  const keyboardName = path.basename(path.dirname(kmnPath));
  const result: ComparisonResult = {
    keyboard: keyboardName,
    skipped: false,
    kmnCompileSuccess: false,
    ldmlCompileSuccess: false,
    kmnErrors: [],
    ldmlErrors: [],
    differences: [],
  };

  const kmnCallbacks = new TestCompilerCallbacks();
  const ldmlCallbacks = new TestCompilerCallbacks();

  try {
    // Step 1: Read and parse original KMN
    const originalKmn = fs.readFileSync(kmnPath, 'utf-8');
    const parser = new KmnParser();
    const kmnAst = parser.parse(originalKmn, kmnPath);

    // Step 2: Convert to LDML
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
          ? 'Mnemonic keyboard (not supported by LDML)'
          : `Unsupported: ${e.message}`;
        return result;
      }
      throw e;
    }

    // Step 3: Compile original KMN
    const kmnCompiler = new KmnCompiler();
    const kmnInitOk = await kmnCompiler.init(kmnCallbacks, {});
    if (!kmnInitOk) {
      result.kmnErrors.push('Failed to initialize KMN compiler');
      return result;
    }

    const kmnResult = await kmnCompiler.run(kmnPath, `${keyboardName}.kmx`);
    if (kmnResult?.artifacts?.kmx) {
      result.kmnCompileSuccess = true;
    } else {
      result.kmnErrors = kmnCallbacks.messages.map(m => m.message);
    }

    // Step 4: Write LDML to temp file and compile
    const outputDir = '/tmp/compile-compare';
    fs.mkdirSync(outputDir, { recursive: true });
    const ldmlPath = path.join(outputDir, `${keyboardName}.xml`);
    fs.writeFileSync(ldmlPath, ldmlXml);

    const ldmlCompiler = new LdmlKeyboardCompiler();
    const cldrImportsPath = fileURLToPath(new URL(...LDMLKeyboardXMLSourceFileReader.defaultImportsURL));
    const ldmlInitOk = await ldmlCompiler.init(ldmlCallbacks, {
      readerOptions: {
        cldrImportsPath,
        localImportsPaths: [outputDir],
      },
    });

    if (!ldmlInitOk) {
      result.ldmlErrors.push('Failed to initialize LDML compiler');
      return result;
    }

    const ldmlResult = await ldmlCompiler.run(ldmlPath, `${keyboardName}-ldml.kmx`);
    if (ldmlResult?.artifacts?.kmx) {
      result.ldmlCompileSuccess = true;
    } else {
      result.ldmlErrors = ldmlCallbacks.messages.map(m => m.message);
    }

    // Step 5: Compare the compiled outputs
    if (result.kmnCompileSuccess && result.ldmlCompileSuccess) {
      const kmnKmx = kmnResult.artifacts.kmx?.data;
      const ldmlKmx = ldmlResult.artifacts.kmx?.data;

      if (kmnKmx && ldmlKmx) {
        // Size comparison
        const sizeDiff = Math.abs(kmnKmx.length - ldmlKmx.length);
        const sizePct = Math.round((sizeDiff / kmnKmx.length) * 100);
        if (sizePct > 10) {
          result.differences.push(`Size: KMN=${kmnKmx.length} bytes, LDML=${ldmlKmx.length} bytes (${sizePct}% diff)`);
        }

        // Compare JS output if available
        const kmnJs = kmnResult.artifacts.js?.data;
        const ldmlJs = ldmlResult.artifacts.js?.data;
        if (kmnJs && ldmlJs) {
          const kmnJsStr = new TextDecoder().decode(kmnJs);
          const ldmlJsStr = new TextDecoder().decode(ldmlJs);

          // Extract key counts from JS
          const kmnKeyCount = (kmnJsStr.match(/"id"\s*:\s*"/g) || []).length;
          const ldmlKeyCount = (ldmlJsStr.match(/"id"\s*:\s*"/g) || []).length;
          if (kmnKeyCount !== ldmlKeyCount) {
            result.differences.push(`Key definitions: KMN=${kmnKeyCount}, LDML=${ldmlKeyCount}`);
          }

          // Check for transforms
          const kmnHasTransforms = kmnJsStr.includes('"type":"transform"') || kmnJsStr.includes('"rules"');
          const ldmlHasTransforms = ldmlJsStr.includes('"type":"transform"') || ldmlJsStr.includes('"rules"');
          if (kmnHasTransforms !== ldmlHasTransforms) {
            result.differences.push(`Transforms: KMN=${kmnHasTransforms}, LDML=${ldmlHasTransforms}`);
          }
        } else if (kmnJs && !ldmlJs) {
          result.differences.push('JS output: KMN has JS, LDML missing');
        } else if (!kmnJs && ldmlJs) {
          result.differences.push('JS output: LDML has JS, KMN missing');
        }
      }
    }

  } catch (error) {
    result.kmnErrors.push(`Error: ${(error as Error).message}`);
  }

  return result;
}

async function runComparison() {
  console.log('=== KMN vs LDML Compilation Comparison ===\n');

  // Get all available test keyboards from fixtures
  const keyboards = getAvailableKeyboards();

  if (keyboards.length === 0) {
    console.log('No test keyboards found in fixtures/keyboards/');
    console.log('Expected keyboards in: test/fixtures/keyboards/<keyboard_name>/');
    return;
  }

  const results: ComparisonResult[] = [];

  for (const keyboardName of keyboards) {
    const kmnFiles = findKmnFiles(keyboardName);

    if (kmnFiles.length === 0) {
      console.log(`Skipping ${keyboardName}: No .kmn file found`);
      continue;
    }

    // Test each .kmn file
    for (const kmnPath of kmnFiles) {
      console.log(`\nComparing: ${keyboardName} (${path.basename(kmnPath)})`);

      try {
        const result = await compareKeyboard(kmnPath);
        results.push(result);

        if (result.skipped) {
          console.log(`  ⊘ SKIPPED: ${result.skipReason}`);
        } else {
          console.log(`  KMN compile: ${result.kmnCompileSuccess ? '✓' : '✗'}`);
          console.log(`  LDML compile: ${result.ldmlCompileSuccess ? '✓' : '✗'}`);

          if (result.kmnErrors.length > 0) {
            console.log(`  KMN errors: ${result.kmnErrors.slice(0, 3).join('; ')}`);
          }
          if (result.ldmlErrors.length > 0) {
            console.log(`  LDML errors: ${result.ldmlErrors.slice(0, 3).join('; ')}`);
          }
          if (result.differences.length > 0) {
            console.log(`  Differences:`);
            for (const diff of result.differences) {
              console.log(`    - ${diff}`);
            }
          } else if (result.kmnCompileSuccess && result.ldmlCompileSuccess) {
            console.log(`  ✓ Outputs are functionally similar`);
          }
        }
      } catch (e) {
        console.log(`  Error: ${(e as Error).message}`);
      }
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  const skipped = results.filter(r => r.skipped);
  const tested = results.filter(r => !r.skipped);
  const bothCompiled = tested.filter(r => r.kmnCompileSuccess && r.ldmlCompileSuccess);
  const withDiffs = bothCompiled.filter(r => r.differences.length > 0);

  console.log(`Total: ${results.length} keyboards`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Both compiled successfully: ${bothCompiled.length}`);
  console.log(`With differences: ${withDiffs.length}`);
  console.log(`KMN compile failed: ${tested.filter(r => !r.kmnCompileSuccess).length}`);
  console.log(`LDML compile failed: ${tested.filter(r => r.kmnCompileSuccess && !r.ldmlCompileSuccess).length}`);

  if (withDiffs.length > 0) {
    console.log('\nFunctional differences found:');
    for (const r of withDiffs) {
      console.log(`  ${r.keyboard}:`);
      for (const diff of r.differences) {
        console.log(`    - ${diff}`);
      }
    }
  }
}

runComparison().catch(console.error);
