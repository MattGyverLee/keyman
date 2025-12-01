#!/usr/bin/env node
/**
 * Comprehensive KMN↔LDML Round-Trip Test
 *
 * Tests all keyboards in D:\Github\keyboards\release
 * - Converts KMN → LDML (to release-ldml)
 * - Converts LDML → KMN (to release-rt)
 * - Generates error summary and statistics
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { generateLdml } from './build/src/ldml-generator.js';
import { generateKmn } from './build/src/kmn-generator.js';
import { KmnParser } from './build/src/kmn-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const RELEASE_DIR = 'D:\\Github\\keyboards\\release';
const LDML_OUTPUT_DIR = 'D:\\Github\\keyboards\\release-ldml';
const RT_OUTPUT_DIR = 'D:\\Github\\keyboards\\release-rt';
const REPORT_FILE = path.join(__dirname, 'CONVERSION_REPORT.md');

// Statistics
const stats = {
  totalKeyboards: 0,
  kmnToLdmlSuccess: 0,
  kmnToLdmlErrors: 0,
  ldmlToKmnSuccess: 0,
  ldmlToKmnErrors: 0,
  ldmlSchemaValid: 0,
  ldmlSchemaInvalid: 0,
  roundTripSuccess: 0,
  errors: []
};

// Error tracking
class ConversionError {
  constructor(keyboard, stage, error) {
    this.keyboard = keyboard;
    this.stage = stage; // 'kmn-to-ldml' or 'ldml-to-kmn'
    this.error = error;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Find all .kmn files in release directory
 */
function findAllKmnFiles() {
  const keyboards = [];

  function scanDir(dir, relPath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const newRelPath = path.join(relPath, entry.name);

      if (entry.isDirectory()) {
        scanDir(fullPath, newRelPath);
      } else if (entry.isFile() && entry.name.endsWith('.kmn')) {
        keyboards.push({
          name: path.basename(entry.name, '.kmn'),
          projectPath: relPath.split(path.sep)[0] || entry.name,
          kmnPath: fullPath,
          relativePath: newRelPath
        });
      }
    }
  }

  scanDir(RELEASE_DIR);
  return keyboards;
}

/**
 * Create output directories
 */
function setupDirectories() {
  console.log('Setting up output directories...');

  if (!fs.existsSync(LDML_OUTPUT_DIR)) {
    fs.mkdirSync(LDML_OUTPUT_DIR, { recursive: true });
  }

  if (!fs.existsSync(RT_OUTPUT_DIR)) {
    fs.mkdirSync(RT_OUTPUT_DIR, { recursive: true });
  }

  console.log(`✓ LDML output: ${LDML_OUTPUT_DIR}`);
  console.log(`✓ Round-trip output: ${RT_OUTPUT_DIR}`);
}

/**
 * Convert KMN → LDML
 */
function convertKmnToLdml(keyboard) {
  try {
    // Read KMN source
    const kmnSource = fs.readFileSync(keyboard.kmnPath, 'utf-8');

    // Parse KMN
    const parser = new KmnParser();
    const ast = parser.parse(kmnSource, keyboard.kmnPath);

    // Generate LDML
    const ldmlXml = generateLdml(ast, {
      keyboardId: keyboard.name,
      locale: 'und', // Default locale
      conformsTo: '45'
    });

    // Create output directory structure
    const projectDir = path.join(LDML_OUTPUT_DIR, keyboard.projectPath);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    // Write LDML file
    const ldmlPath = path.join(projectDir, keyboard.name + '.xml');
    fs.writeFileSync(ldmlPath, ldmlXml, 'utf-8');

    stats.kmnToLdmlSuccess++;
    return { success: true, ldmlPath, ldmlXml };

  } catch (error) {
    stats.kmnToLdmlErrors++;
    stats.errors.push(new ConversionError(keyboard.name, 'kmn-to-ldml', error.message));
    return { success: false, error: error.message };
  }
}

/**
 * Convert LDML → KMN
 */
function convertLdmlToKmn(keyboard, ldmlPath, ldmlXml) {
  try {
    // Generate KMN from LDML
    const kmnSource = generateKmn(ldmlXml);

    // Create output directory structure
    const projectDir = path.join(RT_OUTPUT_DIR, keyboard.projectPath);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    // Write round-trip KMN file
    const rtKmnPath = path.join(projectDir, keyboard.name + '.kmn');
    fs.writeFileSync(rtKmnPath, kmnSource, 'utf-8');

    stats.ldmlToKmnSuccess++;
    return { success: true, rtKmnPath };

  } catch (error) {
    stats.ldmlToKmnErrors++;
    stats.errors.push(new ConversionError(keyboard.name, 'ldml-to-kmn', error.message));
    return { success: false, error: error.message };
  }
}

/**
 * Process a single keyboard
 */
function processKeyboard(keyboard, index, total) {
  const progress = `[${index + 1}/${total}]`;
  process.stdout.write(`\r${progress} Processing ${keyboard.name}...`);

  stats.totalKeyboards++;

  // Step 1: KMN → LDML
  const ldmlResult = convertKmnToLdml(keyboard);
  if (!ldmlResult.success) {
    return { kmnToLdml: false, ldmlToKmn: false };
  }

  // Step 2: LDML → KMN
  const kmnResult = convertLdmlToKmn(keyboard, ldmlResult.ldmlPath, ldmlResult.ldmlXml);
  if (!kmnResult.success) {
    return { kmnToLdml: true, ldmlToKmn: false };
  }

  stats.roundTripSuccess++;
  return { kmnToLdml: true, ldmlToKmn: true };
}

/**
 * Generate error summary report
 */
function generateReport() {
  console.log('\n\nGenerating report...');

  const report = [];

  // Header
  report.push('# KMN ↔ LDML Conversion Test Report');
  report.push('');
  report.push(`**Generated:** ${new Date().toISOString()}`);
  report.push(`**Source:** ${RELEASE_DIR}`);
  report.push(`**LDML Output:** ${LDML_OUTPUT_DIR}`);
  report.push(`**Round-Trip Output:** ${RT_OUTPUT_DIR}`);
  report.push('');

  // Summary Statistics
  report.push('## Summary Statistics');
  report.push('');
  report.push(`| Metric | Count | Percentage |`);
  report.push(`|--------|-------|------------|`);
  report.push(`| **Total Keyboards** | ${stats.totalKeyboards} | 100% |`);
  report.push(`| KMN → LDML Success | ${stats.kmnToLdmlSuccess} | ${((stats.kmnToLdmlSuccess/stats.totalKeyboards)*100).toFixed(1)}% |`);
  report.push(`| KMN → LDML Errors | ${stats.kmnToLdmlErrors} | ${((stats.kmnToLdmlErrors/stats.totalKeyboards)*100).toFixed(1)}% |`);
  report.push(`| LDML → KMN Success | ${stats.ldmlToKmnSuccess} | ${((stats.ldmlToKmnSuccess/stats.totalKeyboards)*100).toFixed(1)}% |`);
  report.push(`| LDML → KMN Errors | ${stats.ldmlToKmnErrors} | ${((stats.ldmlToKmnErrors/stats.totalKeyboards)*100).toFixed(1)}% |`);
  report.push(`| **Complete Round-Trip** | ${stats.roundTripSuccess} | ${((stats.roundTripSuccess/stats.totalKeyboards)*100).toFixed(1)}% |`);
  report.push('');

  // Error Analysis
  if (stats.errors.length > 0) {
    report.push('## Error Analysis');
    report.push('');

    // Group errors by stage
    const kmnToLdmlErrors = stats.errors.filter(e => e.stage === 'kmn-to-ldml');
    const ldmlToKmnErrors = stats.errors.filter(e => e.stage === 'ldml-to-kmn');

    report.push(`### KMN → LDML Errors (${kmnToLdmlErrors.length})`);
    report.push('');

    // Group by error message
    const kmnErrorGroups = groupByError(kmnToLdmlErrors);
    for (const [error, keyboards] of Object.entries(kmnErrorGroups)) {
      report.push(`**${error}** (${keyboards.length} keyboards)`);
      report.push('');
      report.push('```');
      keyboards.slice(0, 10).forEach(kb => report.push(kb));
      if (keyboards.length > 10) {
        report.push(`... and ${keyboards.length - 10} more`);
      }
      report.push('```');
      report.push('');
    }

    report.push(`### LDML → KMN Errors (${ldmlToKmnErrors.length})`);
    report.push('');

    const ldmlErrorGroups = groupByError(ldmlToKmnErrors);
    for (const [error, keyboards] of Object.entries(ldmlErrorGroups)) {
      report.push(`**${error}** (${keyboards.length} keyboards)`);
      report.push('');
      report.push('```');
      keyboards.slice(0, 10).forEach(kb => report.push(kb));
      if (keyboards.length > 10) {
        report.push(`... and ${keyboards.length - 10} more`);
      }
      report.push('```');
      report.push('');
    }
  }

  // Success Stories
  report.push('## Successful Conversions');
  report.push('');
  report.push(`${stats.roundTripSuccess} keyboards successfully completed the full round-trip:`);
  report.push('- KMN → LDML conversion');
  report.push('- LDML → KMN conversion');
  report.push('');
  report.push('These keyboards can be found in:');
  report.push(`- LDML: \`${LDML_OUTPUT_DIR}\``);
  report.push(`- Round-trip KMN: \`${RT_OUTPUT_DIR}\``);
  report.push('');

  // Recommendations
  report.push('## Recommendations');
  report.push('');

  const successRate = (stats.roundTripSuccess / stats.totalKeyboards) * 100;
  if (successRate >= 90) {
    report.push('✅ **Excellent conversion rate!** The converter handles the vast majority of keyboards successfully.');
  } else if (successRate >= 70) {
    report.push('⚠️ **Good conversion rate** with room for improvement. Review common error patterns above.');
  } else {
    report.push('❌ **Low conversion rate.** Significant work needed to handle common keyboard patterns.');
  }
  report.push('');

  if (stats.kmnToLdmlErrors > 0) {
    report.push('### KMN → LDML Issues');
    report.push('Focus on improving:');
    report.push('- KMN parser to handle edge cases');
    report.push('- LDML generator to map all KMN features');
    report.push('');
  }

  if (stats.ldmlToKmnErrors > 0) {
    report.push('### LDML → KMN Issues');
    report.push('Focus on improving:');
    report.push('- LDML parser to handle generated XML');
    report.push('- KMN generator to reconstruct valid KMN');
    report.push('');
  }

  // Write report
  fs.writeFileSync(REPORT_FILE, report.join('\n'), 'utf-8');
  console.log(`✓ Report saved to: ${REPORT_FILE}`);
}

/**
 * Group errors by message
 */
function groupByError(errors) {
  const groups = {};
  for (const err of errors) {
    // Simplify error message (remove paths, line numbers)
    const simplified = err.error
      .replace(/at.*\(.*\)/g, '')
      .replace(/line \d+/g, 'line X')
      .replace(/D:\\.*?\\keyboards/g, 'keyboards')
      .trim();

    if (!groups[simplified]) {
      groups[simplified] = [];
    }
    groups[simplified].push(err.keyboard);
  }
  return groups;
}

/**
 * Main execution
 */
async function main() {
  console.log('KMN ↔ LDML Comprehensive Conversion Test');
  console.log('=========================================\n');

  // Setup
  setupDirectories();

  // Find all keyboards
  console.log('\nScanning for keyboards...');
  const keyboards = findAllKmnFiles();
  console.log(`✓ Found ${keyboards.length} keyboard files\n`);

  // Process all keyboards
  console.log('Processing keyboards...');
  const startTime = Date.now();

  for (let i = 0; i < keyboards.length; i++) {
    processKeyboard(keyboards[i], i, keyboards.length);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✓ Processed ${keyboards.length} keyboards in ${elapsed}s`);

  // Generate report
  generateReport();

  // Print summary to console
  console.log('\n=== SUMMARY ===');
  console.log(`Total Keyboards: ${stats.totalKeyboards}`);
  console.log(`KMN → LDML Success: ${stats.kmnToLdmlSuccess} (${((stats.kmnToLdmlSuccess/stats.totalKeyboards)*100).toFixed(1)}%)`);
  console.log(`LDML → KMN Success: ${stats.ldmlToKmnSuccess} (${((stats.ldmlToKmnSuccess/stats.totalKeyboards)*100).toFixed(1)}%)`);
  console.log(`Complete Round-Trip: ${stats.roundTripSuccess} (${((stats.roundTripSuccess/stats.totalKeyboards)*100).toFixed(1)}%)`);
  console.log(`\nDetailed report: ${REPORT_FILE}`);
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
