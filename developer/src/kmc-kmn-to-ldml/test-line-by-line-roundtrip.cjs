#!/usr/bin/env node
/**
 * Line-by-Line KMN Round-Trip Test
 *
 * For each KMN keyboard in the sil collection:
 * 1. Read the KMN source
 * 2. Convert KMN → LDML
 * 3. Convert LDML → KMN
 * 4. Compare each line of original vs roundtripped
 * 5. Classify and report all differences
 */

const fs = require('fs');
const path = require('path');

// Direct imports from src (compiled CJS files)
const { KmnParser } = require('./src/kmn-parser.cjs');
const { LdmlGenerator } = require('./src/ldml-generator.cjs');
const { generateKmn } = require('./src/kmn-generator.cjs');

// Configuration
const SIL_KEYBOARDS_DIR = '/home/user/keyboards-test/release/sil';
const REPORT_FILE = path.join(__dirname, 'LINE_BY_LINE_REPORT.md');

// Classification categories
const CLASSIFICATIONS = {
  WHITESPACE: 'whitespace',           // Only whitespace differences
  COMMENT_REMOVED: 'comment_removed', // Comments not preserved
  STORE_REORDERED: 'store_reordered', // Store order changed
  STORE_FORMAT: 'store_format',       // Store value formatting (U+ vs literal)
  RULE_REORDERED: 'rule_reordered',   // Rules reordered within group
  RULE_FORMAT: 'rule_format',         // Rule formatting differences
  KEY_FORMAT: 'key_format',           // Key format differences (+ vs [])
  MODIFIER_FORMAT: 'modifier_format', // Modifier format differences
  OUTPUT_FORMAT: 'output_format',     // Output format differences
  HEADER_CHANGED: 'header_changed',   // Header metadata changed
  GROUP_STRUCTURE: 'group_structure', // Group structure changed
  SEMANTIC_CHANGE: 'semantic_change', // Actual semantic difference
  LINE_ADDED: 'line_added',           // New line in roundtrip
  LINE_REMOVED: 'line_removed',       // Line removed in roundtrip
  UNKNOWN: 'unknown'                  // Cannot classify
};

// Statistics
const stats = {
  totalFiles: 0,
  successfulConversions: 0,
  failedConversions: 0,
  totalOriginalLines: 0,
  totalRoundtripLines: 0,
  identicalLines: 0,
  differentLines: 0,
  classifications: {},
  errors: [],
  fileResults: []
};

// Initialize classification counts
Object.values(CLASSIFICATIONS).forEach(c => stats.classifications[c] = 0);

/**
 * Normalize a line for comparison (trim whitespace)
 */
function normalizeLine(line) {
  return line.trim();
}

/**
 * Classify the difference between two lines
 */
function classifyDifference(original, roundtrip, lineNum) {
  const origNorm = normalizeLine(original);
  const rtNorm = normalizeLine(roundtrip || '');

  // If lines are identical after normalization, it's whitespace
  if (origNorm === rtNorm) {
    return CLASSIFICATIONS.WHITESPACE;
  }

  // Check if original is a comment
  if (origNorm.startsWith('c ') || origNorm.startsWith('C ')) {
    return CLASSIFICATIONS.COMMENT_REMOVED;
  }

  // Check for blank line differences
  if (origNorm === '' || rtNorm === '') {
    return origNorm === '' ? CLASSIFICATIONS.LINE_ADDED : CLASSIFICATIONS.LINE_REMOVED;
  }

  // Check for store differences
  if (origNorm.toLowerCase().startsWith('store(')) {
    // Check if it's just format differences in the value
    const origMatch = origNorm.match(/store\(([^)]+)\)\s*(.*)/i);
    const rtMatch = rtNorm.match(/store\(([^)]+)\)\s*(.*)/i);
    if (origMatch && rtMatch) {
      if (origMatch[1].toLowerCase() === rtMatch[1].toLowerCase()) {
        // Same store name, value changed
        return CLASSIFICATIONS.STORE_FORMAT;
      }
    }
    return CLASSIFICATIONS.STORE_REORDERED;
  }

  // Check for header/system store differences
  if (origNorm.match(/^&[A-Za-z]+\s/i) || origNorm.match(/^store\(&/i)) {
    return CLASSIFICATIONS.HEADER_CHANGED;
  }

  // Check for group structure
  if (origNorm.toLowerCase().startsWith('group(') ||
      origNorm.toLowerCase().startsWith('begin ')) {
    return CLASSIFICATIONS.GROUP_STRUCTURE;
  }

  // Check for rule differences (lines with + or >)
  if (origNorm.includes('+') && origNorm.includes('>')) {
    // This is a rule line
    // Check if it's just formatting
    const origParts = parseRule(origNorm);
    const rtParts = parseRule(rtNorm);

    if (origParts && rtParts) {
      // Compare context
      if (normalizeContext(origParts.context) !== normalizeContext(rtParts.context)) {
        return CLASSIFICATIONS.RULE_FORMAT;
      }
      // Compare key
      if (normalizeKey(origParts.key) !== normalizeKey(rtParts.key)) {
        return CLASSIFICATIONS.KEY_FORMAT;
      }
      // Compare output
      if (normalizeOutput(origParts.output) !== normalizeOutput(rtParts.output)) {
        return CLASSIFICATIONS.OUTPUT_FORMAT;
      }
    }
    return CLASSIFICATIONS.RULE_FORMAT;
  }

  // Check for modifier differences
  if (origNorm.match(/\b(SHIFT|CTRL|ALT|RALT|LALT|CAPS)\b/i)) {
    return CLASSIFICATIONS.MODIFIER_FORMAT;
  }

  return CLASSIFICATIONS.UNKNOWN;
}

/**
 * Parse a rule line into context, key, and output
 */
function parseRule(line) {
  // Rule format: context + key > output
  const match = line.match(/^(.+?)\s*\+\s*(.+?)\s*>\s*(.*)$/);
  if (match) {
    return {
      context: match[1].trim(),
      key: match[2].trim(),
      output: match[3].trim()
    };
  }
  return null;
}

/**
 * Normalize context string for comparison
 */
function normalizeContext(context) {
  if (!context) return '';
  // Normalize whitespace, case-insensitive store names
  return context.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Normalize key string for comparison
 */
function normalizeKey(key) {
  if (!key) return '';
  // Normalize key format
  return key.toUpperCase().replace(/\s+/g, ' ').trim();
}

/**
 * Normalize output string for comparison
 */
function normalizeOutput(output) {
  if (!output) return '';
  // Normalize output format
  return output.replace(/\s+/g, ' ').trim();
}

/**
 * Find all KMN files in the sil keyboards directory
 */
function findKmnFiles() {
  const files = [];

  function scanDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.kmn')) {
          files.push(fullPath);
        }
      }
    } catch (e) {
      console.error(`Error scanning ${dir}:`, e.message);
    }
  }

  scanDir(SIL_KEYBOARDS_DIR);
  return files;
}

/**
 * Process a single KMN file
 */
function processKmnFile(kmnPath) {
  const keyboardName = path.basename(kmnPath, '.kmn');
  console.log(`Processing: ${keyboardName}`);

  const result = {
    name: keyboardName,
    path: kmnPath,
    success: false,
    error: null,
    originalLines: 0,
    roundtripLines: 0,
    identicalLines: 0,
    differences: []
  };

  try {
    // Read original KMN
    const originalSource = fs.readFileSync(kmnPath, 'utf-8');
    const originalLines = originalSource.split('\n');
    result.originalLines = originalLines.length;

    // Parse KMN
    const parser = new KmnParser();
    const keyboard = parser.parse(originalSource);

    // Generate LDML
    const generator = new LdmlGenerator({
      keyboardId: keyboardName,
      locale: 'und',
      conformsTo: '46'
    });
    const ldmlXml = generator.generate(keyboard);

    // Convert back to KMN
    const roundtripSource = generateKmn(ldmlXml);
    const roundtripLines = roundtripSource.split('\n');
    result.roundtripLines = roundtripLines.length;

    result.success = true;

    // Compare line by line
    const maxLines = Math.max(originalLines.length, roundtripLines.length);

    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i] || '';
      const rtLine = roundtripLines[i] || '';

      if (normalizeLine(origLine) === normalizeLine(rtLine)) {
        result.identicalLines++;
        stats.identicalLines++;
      } else {
        const classification = classifyDifference(origLine, rtLine, i + 1);
        result.differences.push({
          lineNum: i + 1,
          original: origLine,
          roundtrip: rtLine,
          classification
        });
        stats.differentLines++;
        stats.classifications[classification]++;
      }
    }

    stats.successfulConversions++;

  } catch (e) {
    result.error = e.message;
    stats.errors.push({
      keyboard: keyboardName,
      error: e.message
    });
    stats.failedConversions++;
  }

  stats.totalOriginalLines += result.originalLines;
  stats.totalRoundtripLines += result.roundtripLines;
  stats.fileResults.push(result);

  return result;
}

/**
 * Generate the report
 */
function generateReport() {
  const lines = [];

  lines.push('# Line-by-Line KMN Round-Trip Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Total Files**: ${stats.totalFiles}`);
  lines.push(`- **Successful Conversions**: ${stats.successfulConversions}`);
  lines.push(`- **Failed Conversions**: ${stats.failedConversions}`);
  lines.push(`- **Total Original Lines**: ${stats.totalOriginalLines}`);
  lines.push(`- **Total Roundtrip Lines**: ${stats.totalRoundtripLines}`);
  lines.push(`- **Identical Lines**: ${stats.identicalLines}`);
  lines.push(`- **Different Lines**: ${stats.differentLines}`);
  lines.push('');

  // Classification breakdown
  lines.push('## Difference Classifications');
  lines.push('');
  lines.push('| Classification | Count | Description |');
  lines.push('|---------------|-------|-------------|');

  const classificationDescriptions = {
    [CLASSIFICATIONS.WHITESPACE]: 'Whitespace/formatting only',
    [CLASSIFICATIONS.COMMENT_REMOVED]: 'Comments not preserved',
    [CLASSIFICATIONS.STORE_REORDERED]: 'Store order changed',
    [CLASSIFICATIONS.STORE_FORMAT]: 'Store value format changed (U+ vs literal)',
    [CLASSIFICATIONS.RULE_REORDERED]: 'Rules reordered within group',
    [CLASSIFICATIONS.RULE_FORMAT]: 'Rule formatting changed',
    [CLASSIFICATIONS.KEY_FORMAT]: 'Key format changed',
    [CLASSIFICATIONS.MODIFIER_FORMAT]: 'Modifier format changed',
    [CLASSIFICATIONS.OUTPUT_FORMAT]: 'Output format changed',
    [CLASSIFICATIONS.HEADER_CHANGED]: 'Header/metadata changed',
    [CLASSIFICATIONS.GROUP_STRUCTURE]: 'Group structure changed',
    [CLASSIFICATIONS.SEMANTIC_CHANGE]: 'Semantic difference detected',
    [CLASSIFICATIONS.LINE_ADDED]: 'Line added in roundtrip',
    [CLASSIFICATIONS.LINE_REMOVED]: 'Line removed in roundtrip',
    [CLASSIFICATIONS.UNKNOWN]: 'Unclassified difference'
  };

  for (const [classification, count] of Object.entries(stats.classifications)) {
    if (count > 0) {
      const desc = classificationDescriptions[classification] || classification;
      lines.push(`| ${classification} | ${count} | ${desc} |`);
    }
  }
  lines.push('');

  // Conversion errors
  if (stats.errors.length > 0) {
    lines.push('## Conversion Errors');
    lines.push('');
    for (const err of stats.errors) {
      lines.push(`### ${err.keyboard}`);
      lines.push('');
      lines.push('```');
      lines.push(err.error);
      lines.push('```');
      lines.push('');
    }
  }

  // Detailed differences by file
  lines.push('## Detailed Differences by File');
  lines.push('');

  for (const result of stats.fileResults) {
    if (!result.success) continue;
    if (result.differences.length === 0) continue;

    lines.push(`### ${result.name}`);
    lines.push('');
    lines.push(`- Original lines: ${result.originalLines}`);
    lines.push(`- Roundtrip lines: ${result.roundtripLines}`);
    lines.push(`- Identical: ${result.identicalLines}`);
    lines.push(`- Different: ${result.differences.length}`);
    lines.push('');

    // Group differences by classification
    const byClassification = {};
    for (const diff of result.differences) {
      if (!byClassification[diff.classification]) {
        byClassification[diff.classification] = [];
      }
      byClassification[diff.classification].push(diff);
    }

    for (const [classification, diffs] of Object.entries(byClassification)) {
      lines.push(`#### ${classification} (${diffs.length})`);
      lines.push('');

      // Show first 5 examples of each classification
      const examples = diffs.slice(0, 5);
      for (const diff of examples) {
        lines.push(`Line ${diff.lineNum}:`);
        lines.push('```');
        lines.push(`- ${diff.original}`);
        lines.push(`+ ${diff.roundtrip}`);
        lines.push('```');
      }

      if (diffs.length > 5) {
        lines.push(`... and ${diffs.length - 5} more`);
      }
      lines.push('');
    }
  }

  // Write report
  const report = lines.join('\n');
  fs.writeFileSync(REPORT_FILE, report, 'utf-8');
  console.log(`\nReport written to: ${REPORT_FILE}`);

  return report;
}

/**
 * Main entry point
 */
function main() {
  console.log('='.repeat(60));
  console.log('Line-by-Line KMN Round-Trip Test');
  console.log('='.repeat(60));
  console.log('');

  // Find all KMN files
  console.log('Finding KMN files...');
  const kmnFiles = findKmnFiles();
  stats.totalFiles = kmnFiles.length;
  console.log(`Found ${kmnFiles.length} KMN files\n`);

  // Process each file
  for (const kmnPath of kmnFiles) {
    processKmnFile(kmnPath);
  }

  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('Generating report...');
  generateReport();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total files: ${stats.totalFiles}`);
  console.log(`Successful: ${stats.successfulConversions}`);
  console.log(`Failed: ${stats.failedConversions}`);
  console.log(`Identical lines: ${stats.identicalLines}`);
  console.log(`Different lines: ${stats.differentLines}`);
  console.log('');
  console.log('Classification breakdown:');
  for (const [classification, count] of Object.entries(stats.classifications)) {
    if (count > 0) {
      console.log(`  ${classification}: ${count}`);
    }
  }
}

main();
