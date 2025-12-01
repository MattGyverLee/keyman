/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * KMN Generator: Converts LDML keyboard XML to KMN source format
 *
 * This module provides reverse conversion from LDML (Locale Data Markup Language)
 * keyboard format to legacy KMN (Keyman) source format. It enables round-trip
 * conversion testing and migration paths from LDML back to KMN when needed.
 *
 * Key features:
 * - Parses LDML XML and generates equivalent KMN source code
 * - Converts LDML layers to KMN key rules with modifiers
 * - Maps LDML variables to KMN stores
 * - Transforms LDML transforms to KMN transform groups
 * - Handles markers (deadkeys), sets, and Unicode character output
 * - Preserves metadata (name, version, copyright, author)
 *
 * Limitations:
 * - Some LDML features may not have direct KMN equivalents
 * - Touch-specific features may be simplified
 * - Complex transforms may require manual adjustment
 * - Generated KMN may need manual refinement for production use
 *
 * @example
 * ```typescript
 * import { generateKmn } from '@keymanapp/kmc-kmn-to-ldml';
 *
 * const ldmlXml = fs.readFileSync('keyboard.xml', 'utf-8');
 * const kmnSource = generateKmn(ldmlXml);
 * fs.writeFileSync('keyboard.kmn', kmnSource, 'utf-8');
 * ```
 */

import { TouchLayout } from '@keymanapp/common-types';
import { extractTouchLayoutFromLdml, LdmlTouchKey, LdmlFlick, LdmlTouchLayer } from './touch-layout-converter.js';

/**
 * Simplified LDML keyboard representation for conversion.
 *
 * This interface represents the parsed structure of an LDML keyboard
 * that can be converted to KMN format.
 */
export interface LdmlKeyboardData {
  locale: string;
  name: string;
  version?: string;
  author?: string;
  keys: LdmlKeyData[];
  flicks: LdmlFlickData[];
  layers: LdmlLayerData[];
  variables: LdmlVariableData[];
  transforms: LdmlTransformData[];
}

export interface LdmlKeyData {
  id: string;
  output?: string;
  outputFormat?: Array<{ char: string; format: 'literal' | 'uplus' }>;
  longPressKeyIds?: string;
  multiTapKeyIds?: string;
  flickId?: string;
  gap?: boolean;
  width?: number;
  layerId?: string;
}

export interface LdmlFlickData {
  id: string;
  segments: { directions: string; keyId: string }[];
}

export interface LdmlLayerData {
  formId: string;
  id: string;
  modifiers?: string;
  rows: string[][];
}

export interface LdmlVariableData {
  type: 'string' | 'set' | 'uset';
  id: string;
  value: string;
  valueFormat?: Array<{ char: string; format: 'literal' | 'uplus' }>;
}

export interface LdmlTransformData {
  from: string;
  to: string;
  fromFormat?: Array<{ char: string; format: 'literal' | 'uplus' }>;
  toFormat?: Array<{ char: string; format: 'literal' | 'uplus' }>;
}

/**
 * KMN Generator Class
 *
 * Generates KMN keyboard source code from parsed LDML keyboard data.
 *
 * This class converts LDML structures to their KMN equivalents:
 * - LDML info → KMN system stores (&NAME, &VERSION, etc.)
 * - LDML variables (string/set/uset) → KMN user stores
 * - LDML layers with modifiers → KMN key rules with modifier combinations
 * - LDML transforms → KMN transform groups
 * - LDML markers → KMN deadkeys (dk)
 * - LDML variable references → KMN any()/index() functions
 *
 * The generated KMN follows standard Keyman keyboard conventions and
 * should compile successfully with the Keyman Developer compiler.
 *
 * @example
 * ```typescript
 * const generator = new KmnGenerator();
 * const ldmlData = parseLdmlXml(xmlString);
 * const kmnSource = generator.generate(ldmlData);
 * ```
 */
export class KmnGenerator {
  private indent = '';

  /**
   * Generate KMN source string from LDML keyboard data.
   *
   * This method orchestrates the complete KMN generation process:
   * 1. Writes header comment with source information
   * 2. Generates system stores (NAME, VERSION, COPYRIGHT, etc.)
   * 3. Generates user stores from LDML variables
   * 4. Writes begin Unicode statement
   * 5. Generates main group with key rules from layers
   * 6. Generates transform group if transforms are present
   *
   * @param ldml - Parsed LDML keyboard data structure
   * @returns Complete KMN source code as a string
   */
  public generate(ldml: LdmlKeyboardData): string {
    const lines: string[] = [];

    // Header comment
    lines.push(`c Converted from LDML keyboard: ${ldml.locale}`);
    lines.push('');

    // System stores
    lines.push(`store(&NAME) '${this.escapeKmn(ldml.name)}'`);
    if (ldml.version) {
      lines.push(`store(&KEYBOARDVERSION) '${this.escapeKmn(ldml.version)}'`);
    }
    if (ldml.author) {
      lines.push(`store(&COPYRIGHT) '${this.escapeKmn(ldml.author)}'`);
    }
    lines.push(`store(&VERSION) '10.0'`);
    lines.push(`store(&TARGETS) 'any'`);
    lines.push('');

    // User stores from variables
    for (const variable of ldml.variables) {
      const value = this.formatStoreValue(variable.value, variable.type, variable.valueFormat);
      lines.push(`store(${variable.id}) ${value}`);
    }
    if (ldml.variables.length > 0) {
      lines.push('');
    }

    // Begin statement
    lines.push('begin Unicode > use(main)');
    lines.push('');

    // Main group with key rules
    lines.push('group(main) using keys');
    lines.push('');

    // Generate key rules from layers
    const keyRules = this.generateKeyRules(ldml);
    lines.push(...keyRules);

    // Process transforms - some may become key rules with context output
    if (ldml.transforms.length > 0) {
      const { keyTransforms, regularTransforms } = this.classifyTransforms(ldml);

      // Add key-triggered transforms as key rules with context output
      if (keyTransforms.length > 0) {
        lines.push('');
        for (const kt of keyTransforms) {
          lines.push(`${kt.context} + ${kt.key} > context`);
        }
      }

      // Generate transform group for remaining transforms
      if (regularTransforms.length > 0) {
        lines.push('');
        lines.push('match > use(transforms)');
        lines.push('');
        lines.push('group(transforms)');
        lines.push('');

        for (const transform of regularTransforms) {
          const from = this.formatTransformPattern(transform.from);
          const to = this.formatTransformOutput(transform.to, transform.toFormat);
          lines.push(`${from} > ${to}`);
        }
      }
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Classify transforms into key-triggered and regular transforms.
   *
   * Detects transforms that match pattern: ($[store])keyOutput → $[1:store]
   * These represent "context preservation" rules and convert to: any(store) + [KEY] > context
   *
   * @param ldml - Parsed LDML keyboard data
   * @returns Object with keyTransforms and regularTransforms arrays
   */
  private classifyTransforms(ldml: LdmlKeyboardData): {
    keyTransforms: Array<{ context: string; key: string }>;
    regularTransforms: LdmlTransformData[];
  } {
    const keyTransforms: Array<{ context: string; key: string }> = [];
    const regularTransforms: LdmlTransformData[] = [];

    // Build map of key outputs to key IDs
    const outputToKey = new Map<string, Array<{ keyId: string; modifiers: string }>>();
    for (const key of ldml.keys) {
      if (key.output && !key.gap) {
        if (!outputToKey.has(key.output)) {
          outputToKey.set(key.output, []);
        }
        // Extract modifiers from key ID (e.g., "K_A_shift" → "shift")
        const parts = key.id.split('_');
        const baseKey = parts.slice(0, 2).join('_'); // "K_A"
        const modifierParts = parts.slice(2); // ["shift"]
        const modifiers = modifierParts.join(' ').toUpperCase();
        outputToKey.get(key.output)!.push({ keyId: baseKey, modifiers });
      }
    }

    for (const transform of ldml.transforms) {
      // Pattern: ($[store])output → $[1:store]
      // This means: if output is typed after any(store), preserve just the store character
      const fromMatch = transform.from.match(/^\(\$\[([^\]]+)\]\)(.+)$/);
      const toMatch = transform.to.match(/^\$\[1:([^\]]+)\]$/);

      if (fromMatch && toMatch && fromMatch[1] === toMatch[1]) {
        const storeName = fromMatch[1];
        const keyOutput = fromMatch[2];

        // Find which key(s) produce this output
        const keyMatches = outputToKey.get(keyOutput);
        if (keyMatches && keyMatches.length > 0) {
          // Generate a rule for EACH key that produces this output
          // This handles both hardware keys (K_*) and touch keys (T_*)
          for (const { keyId, modifiers } of keyMatches) {
            const keySpec = modifiers ? `[${modifiers} ${keyId}]` : `[${keyId}]`;
            keyTransforms.push({
              context: `any(${storeName})`,
              key: keySpec,
            });
          }
          continue; // Don't add to regularTransforms
        }
      }

      // Not a key-triggered transform
      regularTransforms.push(transform);
    }

    return { keyTransforms, regularTransforms };
  }

  /**
   * Generate key rules from LDML layers.
   *
   * Converts LDML layer definitions to KMN key rules. Each layer represents
   * a modifier state (e.g., base, shift, ctrl+alt), and each key in the layer
   * generates a corresponding KMN rule.
   *
   * Hardware layers are converted to virtual key rules with modifiers:
   * - `+ [K_A] > 'a'` (base layer)
   * - `+ [SHIFT K_A] > 'A'` (shift layer)
   * - `+ [RALT K_A] > 'α'` (altGr layer)
   *
   * Touch-specific keys (T_ prefix) are generated as touch key rules.
   *
   * @param ldml - Parsed LDML keyboard data
   * @returns Array of KMN rule strings
   */
  private generateKeyRules(ldml: LdmlKeyboardData): string[] {
    const rules: string[] = [];
    const keyOutputs = new Map<string, Map<string, string>>();

    // Build key output map from keys
    for (const key of ldml.keys) {
      if (key.output) {
        if (!keyOutputs.has(key.id)) {
          keyOutputs.set(key.id, new Map());
        }
        keyOutputs.get(key.id)!.set('none', key.output);
      }
    }

    // Generate rules for hardware layers
    const hardwareLayers = ldml.layers.filter(l => l.formId !== 'touch');
    for (const layer of hardwareLayers) {
      const modifiers = this.ldmlModifiersToKmn(layer.modifiers);

      for (const row of layer.rows) {
        for (const keyId of row) {
          const key = ldml.keys.find(k => k.id === keyId);
          if (key?.output && !key.gap) {
            // Extract base key ID (remove modifier suffixes like "_shift_altR")
            const baseKeyId = this.extractBaseKeyId(keyId);
            const vkey = this.formatVKey(baseKeyId, modifiers);
            const output = this.formatOutput(key.output, key.outputFormat);
            rules.push(`+ ${vkey} > ${output}`);
          }
        }
      }
    }

    // Generate rules for touch keys with special features
    for (const key of ldml.keys) {
      // Touch-only keys (T_ prefix)
      if (key.id.startsWith('T_') && key.output) {
        const output = this.formatOutput(key.output, key.outputFormat);
        rules.push(`+ [${key.id}] > ${output}`);
      }
    }

    return rules;
  }

  /**
   * Extract base key ID from a potentially compound key ID.
   *
   * LDML key IDs may include modifier suffixes like "_shift", "_altR", "_shift_altR".
   * This function extracts the base key ID by removing these suffixes.
   *
   * @param keyId - Full key ID (e.g., "K_1_shift_altR", "K_A", "T_0030")
   * @returns Base key ID (e.g., "K_1", "K_A", "T_0030")
   *
   * @example
   * ```typescript
   * extractBaseKeyId("K_1_shift_altR") → "K_1"
   * extractBaseKeyId("K_A_shift") → "K_A"
   * extractBaseKeyId("K_SPACE") → "K_SPACE"
   * ```
   */
  private extractBaseKeyId(keyId: string): string {
    // Remove common modifier suffixes from key IDs
    return keyId
      .replace(/_shift_altR$/, '')
      .replace(/_shift_ctrl$/, '')
      .replace(/_ctrl_altR$/, '')
      .replace(/_shift$/, '')
      .replace(/_altR$/, '')
      .replace(/_ctrl$/, '')
      .replace(/_caps$/, '');
  }

  /**
   * Convert LDML modifier string to KMN modifier format.
   *
   * LDML uses modifier names like "shift", "ctrl", "altR", "caps".
   * KMN uses uppercase names like "SHIFT", "CTRL", "RALT", "CAPS".
   *
   * @param modifiers - LDML modifier string (e.g., "shift", "ctrl+shift")
   * @returns KMN modifier string (e.g., "SHIFT", "CTRL SHIFT")
   *
   * @example
   * ```typescript
   * ldmlModifiersToKmn("shift") → "SHIFT"
   * ldmlModifiersToKmn("ctrl+altR") → "CTRL RALT"
   * ldmlModifiersToKmn("none") → ""
   * ```
   */
  private ldmlModifiersToKmn(modifiers?: string): string {
    if (!modifiers || modifiers === 'none') {
      return '';
    }

    const parts: string[] = [];
    if (modifiers.includes('shift')) parts.push('SHIFT');
    if (modifiers.includes('ctrl')) parts.push('CTRL');
    if (modifiers.includes('altR') || modifiers.includes('alt')) parts.push('RALT');
    if (modifiers.includes('caps')) parts.push('CAPS');

    return parts.join(' ');
  }

  /**
   * Format a virtual key code for KMN rule syntax.
   *
   * Combines a key ID with optional modifiers into KMN virtual key format.
   *
   * @param keyId - Virtual key identifier (e.g., "K_A", "K_SPACE")
   * @param modifiers - KMN modifier string (e.g., "SHIFT", "CTRL RALT")
   * @returns Formatted virtual key (e.g., "[K_A]", "[SHIFT K_A]")
   */
  private formatVKey(keyId: string, modifiers: string): string {
    if (modifiers) {
      return `[${modifiers} ${keyId}]`;
    }
    return `[${keyId}]`;
  }

  /**
   * Format output text for KMN rule syntax.
   *
   * Converts LDML output strings to KMN output format:
   * - Markers (\m{name}) → deadkeys (dk(name))
   * - Single ASCII characters → quoted literals ('a')
   * - Unicode characters → U+xxxx format
   * - Multi-character output → space-separated sequence
   *
   * @param output - LDML output string
   * @returns KMN-formatted output string
   *
   * @example
   * ```typescript
   * formatOutput("a") → "'a'"
   * formatOutput("α") → "U+03B1"
   * formatOutput("abc") → "'a' 'b' 'c'"
   * formatOutput("\\m{acute}") → "dk(acute)"
   * ```
   */
  private formatOutput(output: string, format?: Array<{ char: string; format: 'literal' | 'uplus' }>): string {
    // Check for markers
    if (output.includes('\\m{')) {
      const match = output.match(/\\m\{([^}]+)\}/);
      if (match) {
        return `dk(${match[1]})`;
      }
    }

    // Build output using format metadata to preserve original representation
    const chars = Array.from(output);
    const parts: string[] = [];
    let currentGroup: string[] = [];
    let currentFormat: 'literal' | 'uplus' | null = null;

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const charFormat = format && i < format.length ? format[i].format : 'uplus';

      if (charFormat === 'literal' && currentFormat === 'literal') {
        currentGroup.push(char);
      } else if (charFormat === 'uplus' && currentFormat === 'uplus') {
        const code = char.codePointAt(0)!;
        currentGroup.push(`U+${code.toString(16).toUpperCase().padStart(4, '0')}`);
      } else {
        // Format changed, flush current group
        if (currentGroup.length > 0) {
          if (currentFormat === 'literal') {
            parts.push(`'${this.escapeKmn(currentGroup.join(''))}'`);
          } else {
            parts.push(...currentGroup);
          }
        }
        // Start new group
        currentGroup = [];
        currentFormat = charFormat;
        if (charFormat === 'literal') {
          currentGroup.push(char);
        } else {
          const code = char.codePointAt(0)!;
          currentGroup.push(`U+${code.toString(16).toUpperCase().padStart(4, '0')}`);
        }
      }
    }

    // Flush final group
    if (currentGroup.length > 0) {
      if (currentFormat === 'literal') {
        parts.push(`'${this.escapeKmn(currentGroup.join(''))}'`);
      } else {
        parts.push(...currentGroup);
      }
    }

    return parts.join(' ');
  }

  /**
   * Format a value for KMN store definition.
   *
   * Converts LDML variable values to KMN store syntax based on type:
   * - string: Single-quoted literal
   * - set: Double-quoted character sequence
   * - uset: Unicode set notation (preserved)
   *
   * @param value - Variable value string
   * @param type - Variable type ('string', 'set', or 'uset')
   * @returns KMN-formatted store value
   */
  private formatStoreValue(value: string, type: string, format?: Array<{ char: string; format: 'literal' | 'uplus' }>): string {
    if (type === 'uset') {
      // Unicode set - keep as-is or convert to range
      return `"${this.escapeKmn(value)}"`;
    }

    // For strings and sets, output each character
    if (value.length <= 1) {
      return `'${this.escapeKmn(value)}'`;
    }

    // LDML stores set values as space-separated characters
    // Example LDML: "  a ɛ b ɓ" means [space, space, 'a', 'ɛ', 'b', 'ɓ']
    // Split on space, then convert empty strings back to spaces
    const chars = value.split(' ');
    const cleanValue = chars.map(c => c === '' ? ' ' : c).join('');

    // Build a clean format array that corresponds to cleanValue (without LDML separator spaces)
    const cleanFormat: Array<{ char: string; format: 'literal' | 'uplus' }> = [];
    if (format) {
      let formatIndex = 0;
      for (let i = 0; i < chars.length; i++) {
        const char = chars[i] === '' ? ' ' : chars[i];
        // Find the next matching character in the format array
        while (formatIndex < format.length && format[formatIndex].char === ' ' && char !== ' ') {
          formatIndex++; // Skip LDML separator spaces
        }
        if (formatIndex < format.length) {
          cleanFormat.push(format[formatIndex]);
          formatIndex++;
        }
      }
    }

    // Build output using format metadata to preserve original representation
    const parts: string[] = [];
    let charIndex = 0;

    // Group consecutive characters by format type
    let currentGroup: string[] = [];
    let currentFormat: 'literal' | 'uplus' | null = null;

    for (const char of cleanValue) {
      const charFormat = cleanFormat && charIndex < cleanFormat.length ? cleanFormat[charIndex].format : 'uplus';

      if (charFormat === 'literal' && currentFormat === 'literal') {
        // Continue building literal string
        currentGroup.push(char);
      } else if (charFormat === 'uplus' && currentFormat === 'uplus') {
        // Continue building U+ codes
        const code = char.codePointAt(0)!;
        currentGroup.push(`U+${code.toString(16).toUpperCase().padStart(4, '0')}`);
      } else {
        // Format changed, flush current group
        if (currentGroup.length > 0) {
          if (currentFormat === 'literal') {
            parts.push(`"${this.escapeKmn(currentGroup.join(''))}"`);
          } else {
            parts.push(...currentGroup);
          }
        }
        // Start new group
        currentGroup = [];
        currentFormat = charFormat;
        if (charFormat === 'literal') {
          currentGroup.push(char);
        } else {
          const code = char.codePointAt(0)!;
          currentGroup.push(`U+${code.toString(16).toUpperCase().padStart(4, '0')}`);
        }
      }
      charIndex++;
    }

    // Flush final group
    if (currentGroup.length > 0) {
      if (currentFormat === 'literal') {
        parts.push(`"${this.escapeKmn(currentGroup.join(''))}"`);
      } else {
        parts.push(...currentGroup);
      }
    }

    return parts.join(' ');
  }

  /**
   * Format LDML transform pattern (context) to KMN format.
   *
   * Converts LDML transform 'from' attribute to KMN context:
   * - Markers (\m{name}) → deadkeys (dk(name))
   * - Variable references ($[name]) → any(name)
   * - Literal text → quoted strings
   *
   * @param from - LDML transform 'from' attribute
   * @returns KMN context pattern
   */
  private formatTransformPattern(from: string): string {
    // Convert LDML markers to KMN deadkeys
    let result = from.replace(/\\m\{([^}]+)\}/g, 'dk($1)');

    // Convert variable references
    result = result.replace(/\$\[([^\]]+)\]/g, 'any($1)');

    // Quote literal characters
    if (!result.includes('dk(') && !result.includes('any(')) {
      result = `'${this.escapeKmn(result)}'`;
    }

    return result;
  }

  /**
   * Format transform output, converting LDML backreferences to KMN index() syntax.
   *
   * LDML uses $[n:varname] for backreferences, KMN uses index(varname,n)
   */
  private formatTransformOutput(to: string, format?: Array<{ char: string; format: 'literal' | 'uplus' }>): string {
    // Convert LDML backreferences ($[n:varname]) to KMN index() syntax
    let result = to.replace(/\$\[(\d+):([^\]]+)\]/g, (match, num, varname) => {
      return `index(${varname},${num})`;
    });

    // After converting backreferences, handle remaining literal text
    // Split on index() to preserve it
    const parts = result.split(/(index\([^)]+\))/);
    const formatted = parts.map(part => {
      if (part.startsWith('index(')) {
        return part; // Keep index() as-is
      } else if (part) {
        return this.formatOutput(part, format); // Convert using format metadata
      }
      return '';
    }).filter(p => p).join(' ');

    return formatted;
  }

  /**
   * Escape special characters for KMN string literals.
   *
   * KMN requires escaping:
   * - Single quotes (') → doubled ('') in single-quoted strings
   * - Double quotes (") → backslash-escaped (\") in double-quoted strings
   * - Backslashes (\) → doubled (\\)
   *
   * @param str - String to escape
   * @param quoteStyle - 'single' or 'double' quote style
   * @returns Escaped string safe for KMN
   */
  private escapeKmn(str: string, quoteStyle: 'single' | 'double' = 'single'): string {
    let result = str.replace(/\\/g, '\\\\');
    if (quoteStyle === 'single') {
      result = result.replace(/'/g, "''");
    } else {
      result = result.replace(/"/g, '\\"');
    }
    return result;
  }
}

/**
 * Parse LDML XML to LdmlKeyboardData structure.
 *
 * This is a simplified XML parser that extracts essential LDML keyboard
 * elements using regex patterns. It's designed for conversion purposes
 * and may not handle all edge cases.
 *
 * Extracted elements:
 * - Keyboard metadata (locale, name, version, author)
 * - Key definitions with output and attributes
 * - Layer definitions (hardware and touch)
 * - Variables (string, set, uset)
 * - Transform rules
 *
 * @param xml - LDML keyboard XML string
 * @returns Parsed keyboard data structure
 *
 * @remarks
 * This parser uses regex for simplicity. For production use with complex
 * LDML files, consider using a full XML parser.
 */
export function parseLdmlXml(xml: string): LdmlKeyboardData {
  const data: LdmlKeyboardData = {
    locale: 'und',
    name: 'Converted Keyboard',
    keys: [],
    flicks: [],
    layers: [],
    variables: [],
    transforms: [],
  };

  // Extract locale
  const localeMatch = xml.match(/locale="([^"]+)"/);
  if (localeMatch) data.locale = localeMatch[1];

  // Extract name
  const nameMatch = xml.match(/<info[^>]+name="([^"]+)"/);
  if (nameMatch) data.name = nameMatch[1];

  // Extract version
  const versionMatch = xml.match(/<version[^>]+number="([^"]+)"/);
  if (versionMatch) data.version = versionMatch[1];

  // Extract author
  const authorMatch = xml.match(/<info[^>]+author="([^"]+)"/);
  if (authorMatch) data.author = authorMatch[1];

  // Extract keys
  const keyRegex = /<key\s+([^>]+)\/>/g;
  let keyMatch;
  while ((keyMatch = keyRegex.exec(xml)) !== null) {
    const attrs = keyMatch[1];
    const key: LdmlKeyData = {
      id: extractAttr(attrs, 'id') || '',
    };
    const output = extractAttr(attrs, 'output');
    if (output) {
      const parsed = unescapeXml(output);
      key.output = parsed.value;
      key.outputFormat = parsed.format;
    }
    const gap = extractAttr(attrs, 'gap');
    if (gap === 'true') key.gap = true;
    const width = extractAttr(attrs, 'width');
    if (width) key.width = parseFloat(width);
    const longPress = extractAttr(attrs, 'longPressKeyIds');
    if (longPress) key.longPressKeyIds = longPress;
    const multiTap = extractAttr(attrs, 'multiTapKeyIds');
    if (multiTap) key.multiTapKeyIds = multiTap;
    const flickId = extractAttr(attrs, 'flickId');
    if (flickId) key.flickId = flickId;
    const layerId = extractAttr(attrs, 'layerId');
    if (layerId) key.layerId = layerId;

    if (key.id) data.keys.push(key);
  }

  // Extract layers
  const layersRegex = /<layers\s+formId="([^"]+)"[^>]*>([\s\S]*?)<\/layers>/g;
  let layersMatch;
  while ((layersMatch = layersRegex.exec(xml)) !== null) {
    const formId = layersMatch[1];
    const layersContent = layersMatch[2];

    const layerRegex = /<layer\s*([^>]*)>([\s\S]*?)<\/layer>/g;
    let layerMatch;
    while ((layerMatch = layerRegex.exec(layersContent)) !== null) {
      const layerAttrs = layerMatch[1];
      const layerContent = layerMatch[2];

      const layer: LdmlLayerData = {
        formId,
        id: extractAttr(layerAttrs, 'id') || 'base',
        modifiers: extractAttr(layerAttrs, 'modifiers'),
        rows: [],
      };

      const rowRegex = /<row\s+keys="([^"]+)"/g;
      let rowMatch;
      while ((rowMatch = rowRegex.exec(layerContent)) !== null) {
        layer.rows.push(rowMatch[1].split(/\s+/));
      }

      data.layers.push(layer);
    }
  }

  // Extract variables
  const varRegex = /<(string|set|uset)\s+id="([^"]+)"\s+value="([^"]+)"/g;
  let varMatch;
  while ((varMatch = varRegex.exec(xml)) !== null) {
    const parsed = unescapeXml(varMatch[3]);
    data.variables.push({
      type: varMatch[1] as 'string' | 'set' | 'uset',
      id: varMatch[2],
      value: parsed.value,
      valueFormat: parsed.format,
    });
  }

  // Extract transforms
  const transformRegex = /<transform\s+from="([^"]+)"\s+to="([^"]+)"/g;
  let transformMatch;
  while ((transformMatch = transformRegex.exec(xml)) !== null) {
    const fromParsed = unescapeXml(transformMatch[1]);
    const toParsed = unescapeXml(transformMatch[2]);
    data.transforms.push({
      from: fromParsed.value,
      to: toParsed.value,
      fromFormat: fromParsed.format,
      toFormat: toParsed.format,
    });
  }

  return data;
}

function extractAttr(attrs: string, name: string): string | undefined {
  const match = attrs.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1] : undefined;
}

/**
 * Helper type for tracking character format when parsing LDML
 */
type ParsedXmlValue = {
  value: string;
  format: Array<{ char: string; format: 'literal' | 'uplus' }>;
};

function unescapeXml(str: string): ParsedXmlValue {
  let result = '';
  const format: Array<{ char: string; format: 'literal' | 'uplus' }> = [];
  let i = 0;

  while (i < str.length) {
    if (str[i] === '&') {
      // Handle XML entities and numeric character references
      if (str.substr(i, 5) === '&amp;') {
        result += '&';
        format.push({ char: '&', format: 'literal' });
        i += 5;
      } else if (str.substr(i, 4) === '&lt;') {
        result += '<';
        format.push({ char: '<', format: 'literal' });
        i += 4;
      } else if (str.substr(i, 4) === '&gt;') {
        result += '>';
        format.push({ char: '>', format: 'literal' });
        i += 4;
      } else if (str.substr(i, 6) === '&quot;') {
        result += '"';
        format.push({ char: '"', format: 'literal' });
        i += 6;
      } else if (str.substr(i, 6) === '&apos;') {
        result += "'";
        format.push({ char: "'", format: 'literal' });
        i += 6;
      } else if (str.substr(i, 3) === '&#x' || str.substr(i, 2) === '&#') {
        // Numeric character reference
        const isHex = str.substr(i, 3) === '&#x';
        const startOffset = isHex ? 3 : 2;
        let endIndex = i + startOffset;
        while (endIndex < str.length && str[endIndex] !== ';') {
          endIndex++;
        }
        if (endIndex < str.length && str[endIndex] === ';') {
          const codeStr = str.substring(i + startOffset, endIndex);
          const code = parseInt(codeStr, isHex ? 16 : 10);
          const char = String.fromCodePoint(code);
          result += char;
          format.push({ char, format: 'uplus' }); // Numeric refs represent U+ codes
          i = endIndex + 1;
        } else {
          // Malformed reference, treat as literal
          result += str[i];
          format.push({ char: str[i], format: 'literal' });
          i++;
        }
      } else {
        // Unknown entity, treat as literal
        result += str[i];
        format.push({ char: str[i], format: 'literal' });
        i++;
      }
    } else {
      // Regular character
      result += str[i];
      format.push({ char: str[i], format: 'literal' });
      i++;
    }
  }

  return { value: result, format };
}

/**
 * Convert LDML keyboard XML to KMN source code.
 *
 * This is a convenience function that combines parsing and generation
 * into a single operation. It parses the LDML XML and generates the
 * equivalent KMN source code.
 *
 * @param ldmlXml - LDML keyboard XML string
 * @returns KMN source code string
 *
 * @example
 * ```typescript
 * import { generateKmn } from '@keymanapp/kmc-kmn-to-ldml';
 * import * as fs from 'fs';
 *
 * const ldmlXml = fs.readFileSync('my-keyboard.xml', 'utf-8');
 * const kmnSource = generateKmn(ldmlXml);
 * fs.writeFileSync('my-keyboard.kmn', kmnSource, 'utf-8');
 * ```
 */
export function generateKmn(ldmlXml: string): string {
  const data = parseLdmlXml(ldmlXml);
  const generator = new KmnGenerator();
  return generator.generate(data);
}

/**
 * Extract touch layout data from LDML XML and convert to .keyman-touch-layout JSON format.
 *
 * This enables round-trip conversion: KMN + touch-layout → LDML → KMN + touch-layout
 *
 * @param ldmlXml - LDML keyboard XML string
 * @returns TouchLayoutFile object that can be serialized to .keyman-touch-layout JSON,
 *          or null if no touch layout data is present in the LDML
 *
 * @example
 * ```typescript
 * import { extractTouchLayout } from '@keymanapp/kmc-kmn-to-ldml';
 * import * as fs from 'fs';
 *
 * const ldmlXml = fs.readFileSync('my-keyboard.xml', 'utf-8');
 * const touchLayout = extractTouchLayout(ldmlXml);
 * if (touchLayout) {
 *   fs.writeFileSync('my-keyboard.keyman-touch-layout', JSON.stringify(touchLayout, null, 2), 'utf-8');
 * }
 * ```
 */
export function extractTouchLayout(ldmlXml: string): TouchLayout.TouchLayoutFile | null {
  const data = parseLdmlXml(ldmlXml);

  // Filter touch layers and keys
  const touchLayers = data.layers.filter(l => l.formId === 'touch');

  if (touchLayers.length === 0) {
    return null;
  }

  // Build set of key IDs actually used in touch layers
  const touchKeyIds = new Set<string>();
  for (const layer of touchLayers) {
    for (const row of layer.rows) {
      for (const keyId of row) {
        touchKeyIds.add(keyId);
      }
    }
  }

  // Build a map of keys, only including keys used in touch layers
  // Also collect keys referenced by longPress/multiTap
  const keyMap = new Map<string, LdmlTouchKey>();
  const keysToInclude = new Set<string>(touchKeyIds);

  // Find all keys that are referenced by longPress or multiTap from touch keys
  for (const k of data.keys) {
    if (touchKeyIds.has(k.id)) {
      if (k.longPressKeyIds) {
        k.longPressKeyIds.split(/\s+/).forEach(id => keysToInclude.add(id));
      }
      if (k.multiTapKeyIds) {
        k.multiTapKeyIds.split(/\s+/).forEach(id => keysToInclude.add(id));
      }
    }
  }

  // Now build the key map with only the keys we need
  for (const k of data.keys) {
    if (!keysToInclude.has(k.id)) {
      continue; // Skip keys not used in touch layers
    }

    const existing = keyMap.get(k.id);
    const current: LdmlTouchKey = {
      id: k.id,
      output: k.output,
      gap: k.gap,
      width: k.width,
      layerId: k.layerId,
      longPressKeyIds: k.longPressKeyIds,
      multiTapKeyIds: k.multiTapKeyIds,
      flickId: k.flickId
    };

    // Prefer keys with touch-specific attributes (width, longPress, multiTap, flick, gap, layerId)
    // Also prefer keys with different/longer output (touch keys often have display variations)
    const hasTouchAttributes = current.width || current.longPressKeyIds || current.multiTapKeyIds ||
                                current.flickId || current.gap || current.layerId;
    const hasDifferentOutput = existing && current.output && existing.output !== current.output;
    const hasLongerOutput = existing && current.output &&
                           (current.output.length > (existing.output?.length || 0));

    if (!existing || hasTouchAttributes || hasDifferentOutput || hasLongerOutput) {
      keyMap.set(k.id, current);
    }
  }

  const ldmlKeys: LdmlTouchKey[] = Array.from(keyMap.values());

  const ldmlFlicks: LdmlFlick[] = data.flicks.map(f => ({
    id: f.id,
    segments: f.segments
  }));

  const ldmlTouchLayers: LdmlTouchLayer[] = touchLayers.map(l => ({
    id: l.id,
    modifiers: l.modifiers,
    rows: l.rows
  }));

  return extractTouchLayoutFromLdml(ldmlKeys, ldmlFlicks, ldmlTouchLayers);
}
