/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Generates LDML keyboard XML from KMN AST.
 */

import {
  KmnKeyboard,
  KmnStore,
  KmnGroup,
  KmnRule,
  KmnKeySpec,
  KmnRuleElement,
  KmnAnyElement,
  KmnIndexElement,
} from './kmn-ast.js';

import {
  TouchLayoutConverter,
  TouchLayoutConversionResult,
  LdmlTouchKey,
  LdmlFlick,
} from './touch-layout-converter.js';

/**
 * Error thrown when a KMN keyboard cannot be converted to LDML
 * due to fundamental incompatibilities (e.g., mnemonic keyboards)
 */
export class UnsupportedKeyboardError extends Error {
  /** Type of unsupported feature */
  public readonly featureType: 'mnemonic' | 'other';
  /** Name of the keyboard (if available) */
  public readonly keyboardName?: string;

  constructor(message: string, featureType: 'mnemonic' | 'other', keyboardName?: string) {
    super(message);
    this.name = 'UnsupportedKeyboardError';
    this.featureType = featureType;
    this.keyboardName = keyboardName;
  }
}

/**
 * Hardware form types supported by LDML
 */
export type HardwareForm = 'us' | 'iso' | 'jis' | 'abnt2' | 'ks';

/**
 * Display override for a character or key
 */
export interface DisplayOverride {
  /** Character output to override display for */
  output?: string;
  /** Key ID to override display for (mutually exclusive with output) */
  keyId?: string;
  /** Display text to show */
  display: string;
}

/**
 * Options for LDML generation
 */
export interface LdmlGeneratorOptions {
  /** Locale code for the keyboard */
  locale?: string;
  /** LDML version conformance */
  conformsTo?: '45' | '46';
  /** Include hardware layers */
  includeHardware?: boolean;
  /** Include touch layers */
  includeTouch?: boolean;
  /** Use set mapping for any()/index() patterns (more compact) */
  useSetMapping?: boolean;
  /** Hardware form type (default: 'us') */
  hardwareForm?: HardwareForm;
  /** Additional locales supported by this keyboard */
  additionalLocales?: string[];
  /** Layout type indicator (e.g., 'QWERTY', 'AZERTY') */
  layoutType?: string;
  /** Script indicator for status bar */
  indicator?: string;
  /** Display overrides for keytops */
  displayOverrides?: DisplayOverride[];
  /** Base character for displaying combining marks (default: U+25CC) */
  displayBaseCharacter?: string;
  /** Disable automatic normalization */
  disableNormalization?: boolean;
  /** Touch layout data (parsed JSON) */
  touchLayout?: unknown;
  /** CLDR imports to include */
  imports?: Array<{ base?: 'cldr'; path: string }>;
}

/**
 * Represents a set mapping pattern (any() -> index())
 */
interface SetMappingInfo {
  /** Position of any() in context (1-based) */
  contextPosition: number;
  /** Input store name (from any()) */
  inputStore: string;
  /** Output store name (from index()) */
  outputStore: string;
}

/**
 * Analyzed rule with set mapping information
 */
interface AnalyzedRule {
  rule: KmnRule;
  setMappings: SetMappingInfo[];
  canUseSetMapping: boolean;
}

/**
 * Information about a combining key (key used in context rules)
 */
interface CombiningKeyInfo {
  /** Key ID with modifiers (e.g., "T_R:shift") */
  keyWithMods: string;
  /** Marker name for this combining key */
  markerName: string;
  /** Rules that use this key for combining */
  rules: KmnRule[];
  /** Default output when no context (from rules without context) */
  defaultOutput?: string;
}

/**
 * Information about a skipped rule
 */
interface SkippedRuleInfo {
  /** Line number in original KMN */
  line: number;
  /** Reason for skipping */
  reason: string;
  /** Option names involved (for if/set) */
  options?: string[];
  /** Brief description of the rule */
  description: string;
}

/**
 * Generate LDML keyboard XML from KMN AST
 */
export class LdmlGenerator {
  private options: LdmlGeneratorOptions;
  private keyboard!: KmnKeyboard;
  private indent = '  ';

  // Collected key definitions
  private keys: Map<string, LdmlKey> = new Map();
  // Collected deadkey/marker mappings
  private markers: Map<string, string> = new Map();
  // Virtual key to hardware key mapping
  private vkeyToHardware: Map<string, string> = new Map();
  // Store lookup cache
  private storeMap: Map<string, KmnStore> = new Map();
  // Keys that are used in context rules (need marker output for combining)
  private combiningKeys: Map<string, CombiningKeyInfo> = new Map();
  // Touch layout converter
  private touchConverter: TouchLayoutConverter = new TouchLayoutConverter();
  // Touch layout conversion result
  private touchResult: TouchLayoutConversionResult | null = null;
  // Display overrides collected from keyboard
  private displayOverrides: DisplayOverride[] = [];
  // Backspace rules for custom deletion behavior
  private backspaceRules: Array<{ from: string; to: string }> = [];
  // Skipped rules (if/set conditions not supported by LDML)
  private skippedRules: SkippedRuleInfo[] = [];
  // Option names found in if/set rules
  private optionNames: Set<string> = new Set();

  constructor(options: LdmlGeneratorOptions = {}) {
    this.options = {
      locale: 'und',
      conformsTo: '45',
      includeHardware: true,
      includeTouch: true,
      useSetMapping: true, // Enable set mapping by default
      hardwareForm: 'us',
      ...options,
    };
  }

  /**
   * Check if keyboard is mnemonic (character-based rather than positional)
   */
  public isMnemonic(keyboard: KmnKeyboard): boolean {
    const mnemonicStore = keyboard.stores.find(
      s => s.isSystem && s.name.toUpperCase() === 'MNEMONICLAYOUT'
    );
    return mnemonicStore?.value === '1';
  }

  /**
   * Generate LDML XML string from KMN keyboard
   * @throws Error if keyboard is mnemonic (not supported by LDML)
   */
  public generate(keyboard: KmnKeyboard): string {
    this.keyboard = keyboard;
    this.keys.clear();
    this.markers.clear();
    this.storeMap.clear();
    this.combiningKeys.clear();
    this.displayOverrides = [...(this.options.displayOverrides || [])];
    this.backspaceRules = [];
    this.skippedRules = [];
    this.optionNames.clear();
    this.touchResult = null;
    this.initVkeyMapping();
    this.buildStoreMap();

    // Scan for if/set rules and collect option names
    this.scanForIfSetRules();

    // Check for mnemonic keyboard - LDML doesn't support this
    if (this.isMnemonic(keyboard)) {
      const name = this.getStoreValue('NAME') || keyboard.filename || 'Unknown';
      throw new UnsupportedKeyboardError(
        `Cannot convert mnemonic keyboard "${name}" to LDML. ` +
        `LDML uses positional key mapping (physical keys) while mnemonic keyboards ` +
        `use character-based mapping that adapts to the user's base keyboard layout. ` +
        `These concepts are fundamentally incompatible.`,
        'mnemonic',
        name
      );
    }

    // Identify combining keys (keys used in context rules for character combining)
    this.identifyCombiningKeys();

    // Collect backspace rules
    this.collectBackspaceRules();

    // Convert touch layout if provided
    if (this.options.touchLayout) {
      this.touchResult = this.touchConverter.convert(this.options.touchLayout as any);
    }

    // Extract metadata
    const name = this.getStoreValue('NAME') || 'Converted Keyboard';
    const version = this.getStoreValue('KEYBOARDVERSION') || '1.0';
    const author = this.getStoreValue('AUTHOR') || this.getStoreValue('COPYRIGHT') || '';

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;

    // Add warning comment if there are skipped rules
    xml += this.generateSkippedRulesComment();

    xml += `<keyboard3 xmlns="https://schemas.unicode.org/cldr/${this.options.conformsTo}/keyboard3" locale="${this.options.locale}" conformsTo="${this.options.conformsTo}">\n`;

    // Import section (must come first)
    xml += this.generateImportsSection();

    // Version section
    xml += `${this.indent}<version number="${this.escapeXml(version)}"/>\n`;

    // Info section with extended attributes
    xml += this.generateInfoSection(name, author);

    // Settings section (if needed)
    xml += this.generateSettingsSection();

    // Locales section (additional supported locales)
    xml += this.generateLocalesSection();

    // Displays section (keytop overrides)
    xml += this.generateDisplaysSection();

    // Process rules to collect keys (including combining key markers)
    this.collectKeysFromRules();

    // Keys section
    xml += this.generateKeysSection();

    // Flicks section
    xml += this.generateFlicksSection();

    // Layers section
    xml += this.generateLayersSection();

    // Variables section
    xml += this.generateVariablesSection();

    // Transforms section (simple)
    xml += this.generateTransformsSection();

    // Backspace transforms section
    xml += this.generateBackspaceTransformsSection();

    xml += `</keyboard3>\n`;

    return xml;
  }

  /**
   * Generate XML comment documenting skipped rules (if/set not supported by LDML)
   */
  private generateSkippedRulesComment(): string {
    if (this.skippedRules.length === 0) {
      return '';
    }

    let comment = `<!--\n`;
    comment += `  WARNING: The following ${this.skippedRules.length} rule(s) were skipped during conversion.\n`;
    comment += `  LDML Keyboard 3.0 does not support runtime options (if/set conditions).\n`;
    comment += `\n`;

    // List unique option names
    if (this.optionNames.size > 0) {
      comment += `  Options used in original keyboard:\n`;
      for (const opt of this.optionNames) {
        comment += `    - ${opt}\n`;
      }
      comment += `\n`;
    }

    comment += `  Skipped rules:\n`;
    for (const skipped of this.skippedRules) {
      comment += `    Line ${skipped.line}: ${skipped.description}`;
      if (skipped.options && skipped.options.length > 0) {
        comment += ` [${skipped.options.join(', ')}]`;
      }
      comment += `\n`;
    }
    comment += `\n`;
    comment += `  To fully support this keyboard's functionality, these options would need\n`;
    comment += `  to be implemented as separate keyboard variants or through a future LDML\n`;
    comment += `  extension for user-configurable settings.\n`;
    comment += `-->\n`;

    return comment;
  }

  /**
   * Generate <import> elements
   */
  private generateImportsSection(): string {
    if (!this.options.imports || this.options.imports.length === 0) {
      return '';
    }

    let xml = '';
    for (const imp of this.options.imports) {
      xml += `${this.indent}<import`;
      if (imp.base) xml += ` base="${imp.base}"`;
      xml += ` path="${this.escapeXml(imp.path)}"/>\n`;
    }
    return xml;
  }

  /**
   * Generate <info> element with extended attributes
   */
  private generateInfoSection(name: string, author: string): string {
    let xml = `${this.indent}<info name="${this.escapeXml(name)}"`;
    if (author) xml += ` author="${this.escapeXml(author)}"`;
    if (this.options.layoutType) xml += ` layout="${this.escapeXml(this.options.layoutType)}"`;
    if (this.options.indicator) xml += ` indicator="${this.escapeXml(this.options.indicator)}"`;
    xml += `/>\n`;
    return xml;
  }

  /**
   * Generate <settings> element
   */
  private generateSettingsSection(): string {
    if (!this.options.disableNormalization) {
      return '';
    }
    return `${this.indent}<settings normalization="disabled"/>\n`;
  }

  /**
   * Generate <locales> element for additional supported locales
   */
  private generateLocalesSection(): string {
    // Get additional locales from options or from keyboard ethnologue codes
    const additionalLocales = this.options.additionalLocales || [];
    const ethnologue = this.getStoreValue('ETHNOLOGUECODE');

    // Parse ethnologue codes (can be space or comma separated)
    if (ethnologue) {
      const codes = ethnologue.split(/[,\s]+/).filter(c => c.length > 0);
      for (const code of codes) {
        if (!additionalLocales.includes(code)) {
          additionalLocales.push(code);
        }
      }
    }

    if (additionalLocales.length === 0) {
      return '';
    }

    let xml = `${this.indent}<locales>\n`;
    for (const locale of additionalLocales) {
      xml += `${this.indent}${this.indent}<locale id="${this.escapeXml(locale)}"/>\n`;
    }
    xml += `${this.indent}</locales>\n`;
    return xml;
  }

  /**
   * Generate <displays> element for keytop overrides
   */
  private generateDisplaysSection(): string {
    // Collect display overrides from combining marks and other special characters
    this.collectDisplayOverrides();

    if (this.displayOverrides.length === 0 && !this.options.displayBaseCharacter) {
      return '';
    }

    let xml = `${this.indent}<displays>\n`;

    // Add displayOptions if custom base character is specified
    if (this.options.displayBaseCharacter) {
      xml += `${this.indent}${this.indent}<displayOptions baseCharacter="${this.escapeXml(this.options.displayBaseCharacter)}"/>\n`;
    }

    // Add individual display overrides
    for (const override of this.displayOverrides) {
      xml += `${this.indent}${this.indent}<display`;
      if (override.output) {
        xml += ` output="${this.escapeXml(override.output)}"`;
      }
      if (override.keyId) {
        xml += ` keyId="${override.keyId}"`;
      }
      xml += ` display="${this.escapeXml(override.display)}"/>\n`;
    }

    xml += `${this.indent}</displays>\n`;
    return xml;
  }

  /**
   * Collect display overrides for combining marks and special characters
   */
  private collectDisplayOverrides(): void {
    // Look for combining marks in key outputs
    for (const [, key] of this.keys) {
      for (const [, output] of key.outputs) {
        if (!output || output.startsWith('\\m{')) continue;

        // Check if output is a combining mark (Unicode combining mark ranges)
        for (const char of output) {
          const code = char.codePointAt(0)!;
          // Combining Diacritical Marks: U+0300-U+036F
          // Combining Diacritical Marks Extended: U+1AB0-U+1AFF
          // Combining Diacritical Marks Supplement: U+1DC0-U+1DFF
          // Combining Diacritical Marks for Symbols: U+20D0-U+20FF
          // Combining Half Marks: U+FE20-U+FE2F
          if (
            (code >= 0x0300 && code <= 0x036F) ||
            (code >= 0x1AB0 && code <= 0x1AFF) ||
            (code >= 0x1DC0 && code <= 0x1DFF) ||
            (code >= 0x20D0 && code <= 0x20FF) ||
            (code >= 0xFE20 && code <= 0xFE2F)
          ) {
            // Add display override with dotted circle base
            const exists = this.displayOverrides.some(d => d.output === char);
            if (!exists) {
              this.displayOverrides.push({
                output: char,
                display: `◌${char}`, // U+25CC DOTTED CIRCLE
              });
            }
          }
        }
      }
    }
  }

  /**
   * Collect backspace rules from keyboard
   */
  private collectBackspaceRules(): void {
    // Look for rules with K_BKSP in the key position
    for (const group of this.keyboard.groups) {
      for (const rule of group.rules) {
        if (!rule.key) continue;

        // Check for backspace key
        const isBackspace = rule.key.vkey === 'K_BKSP' || rule.key.vkey === 'K_BACKSPACE';
        if (!isBackspace) continue;

        // Skip platform-specific rules we don't want
        if (rule.platform === 'web') continue;

        // Build the pattern from context
        let from = '';
        for (const elem of rule.context) {
          switch (elem.type) {
            case 'char':
              from += this.escapeRegexChars(elem.value);
              break;
            case 'deadkey':
              from += `\\m{${elem.name}}`;
              break;
            case 'any':
              from += `$[${(elem as KmnAnyElement).storeName}]`;
              break;
          }
        }

        // Build the output
        const to = this.getOutputString(rule.output);

        if (from) {
          this.backspaceRules.push({ from, to });
        }
      }
    }
  }

  /**
   * Generate <transforms type="backspace"> section
   */
  private generateBackspaceTransformsSection(): string {
    if (this.backspaceRules.length === 0) {
      return '';
    }

    let xml = `${this.indent}<transforms type="backspace">\n`;
    xml += `${this.indent}${this.indent}<transformGroup>\n`;

    for (const rule of this.backspaceRules) {
      xml += `${this.indent}${this.indent}${this.indent}<transform from="${this.escapeXml(rule.from)}" to="${this.escapeXml(rule.to)}"/>\n`;
    }

    xml += `${this.indent}${this.indent}</transformGroup>\n`;
    xml += `${this.indent}</transforms>\n`;
    return xml;
  }

  /**
   * Build store lookup map
   * Prefers desktop ($keymanonly) stores over web stores when both exist
   */
  private buildStoreMap(): void {
    for (const store of this.keyboard.stores) {
      const key = store.name.toLowerCase();
      const existing = this.storeMap.get(key);
      if (!existing) {
        // First occurrence of this store
        this.storeMap.set(key, store);
      } else {
        // Store already exists - prefer desktop over web
        if (store.platform === 'desktop' && existing.platform === 'web') {
          // Replace web store with desktop store
          this.storeMap.set(key, store);
        } else if (store.platform === 'desktop' && !existing.platform) {
          // Desktop replaces non-platform-specific
          this.storeMap.set(key, store);
        }
        // Otherwise keep existing (desktop or non-platform-specific)
      }
    }
  }

  /**
   * Scan all rules for if/set conditions and record skipped rules
   * LDML Keyboard 3.0 does not support runtime options/settings
   */
  private scanForIfSetRules(): void {
    for (const group of this.keyboard.groups) {
      for (const rule of group.rules) {
        // Check for if() conditions in context
        const ifElements = rule.context.filter(e => e.type === 'if');
        // Check for set() in output
        const setElements = rule.output.filter(e => e.type === 'set');

        if (ifElements.length > 0 || setElements.length > 0) {
          // Collect option names
          const options: string[] = [];
          for (const elem of ifElements) {
            if (elem.type === 'if') {
              const ifElem = elem as import('./kmn-ast.js').KmnIfElement;
              options.push(ifElem.optionName);
              this.optionNames.add(ifElem.optionName);
            }
          }
          for (const elem of setElements) {
            if (elem.type === 'set') {
              const setElem = elem as import('./kmn-ast.js').KmnSetElement;
              options.push(setElem.optionName);
              this.optionNames.add(setElem.optionName);
            }
          }

          // Build description of the rule
          let desc = '';
          if (ifElements.length > 0) {
            const conditions = ifElements.map(e => {
              if (e.type === 'if') {
                const ifElem = e as import('./kmn-ast.js').KmnIfElement;
                return `if(${ifElem.optionName}${ifElem.operator}${ifElem.value})`;
              }
              return '';
            }).filter(s => s).join(' ');
            desc = conditions;
          }
          if (rule.key) {
            desc += desc ? ' + ' : '';
            desc += rule.key.vkey || rule.key.char || 'key';
          }

          this.skippedRules.push({
            line: rule.line,
            reason: ifElements.length > 0 ? 'if/set conditions' : 'set output',
            options: options.length > 0 ? options : undefined,
            description: desc,
          });
        }
      }
    }
  }

  /**
   * Check if a rule has if/set conditions (should be skipped)
   */
  private ruleHasIfSet(rule: KmnRule): boolean {
    const hasIf = rule.context.some(e => e.type === 'if');
    const hasSet = rule.output.some(e => e.type === 'set');
    return hasIf || hasSet;
  }

  /**
   * Identify keys that are used in context rules for character combining.
   * These keys need marker outputs so transforms can combine context + marker → output.
   * Skips rules with if/set conditions (not supported by LDML)
   */
  private identifyCombiningKeys(): void {
    // First pass: identify all keys used in context rules
    for (const group of this.keyboard.groups) {
      if (!group.usingKeys) continue;

      for (const rule of group.rules) {
        if (!rule.key) continue;

        // Skip rules with if/set conditions
        if (this.ruleHasIfSet(rule)) continue;

        // Check if rule has real context (not just if conditions)
        const hasCharContext = rule.context.some(e =>
          e.type === 'char' || e.type === 'any' || e.type === 'deadkey'
        );

        if (hasCharContext) {
          const keyId = this.getKeyId(rule.key);
          if (!keyId) continue;

          const modifiers = this.getModifierString(rule.key);
          const keyWithMods = `${keyId}:${modifiers}`;

          // Create or update combining key info
          let info = this.combiningKeys.get(keyWithMods);
          if (!info) {
            // Generate a unique marker name for this combining key
            const markerName = `ck_${keyId}${modifiers !== 'none' ? '_' + modifiers.replace(/ /g, '_') : ''}`;
            info = {
              keyWithMods,
              markerName,
              rules: [],
            };
            this.combiningKeys.set(keyWithMods, info);
          }
          info.rules.push(rule);
        }
      }
    }

    // Second pass: find default outputs for combining keys (from rules without context)
    for (const group of this.keyboard.groups) {
      if (!group.usingKeys) continue;

      for (const rule of group.rules) {
        if (!rule.key) continue;

        // Skip rules with if/set conditions
        if (this.ruleHasIfSet(rule)) continue;

        const keyId = this.getKeyId(rule.key);
        if (!keyId) continue;

        const modifiers = this.getModifierString(rule.key);
        const keyWithMods = `${keyId}:${modifiers}`;

        // Check if this key is a combining key
        const info = this.combiningKeys.get(keyWithMods);
        if (!info) continue;

        // Check if this rule has no context (default output)
        const hasCharContext = rule.context.some(e =>
          e.type === 'char' || e.type === 'any' || e.type === 'deadkey'
        );

        if (!hasCharContext) {
          // This is the default output for this combining key
          const output = this.getOutputString(rule.output);
          if (output && !info.defaultOutput) {
            info.defaultOutput = output;
          }
        }
      }
    }
  }

  /**
   * Get store by name
   */
  private getStore(name: string): KmnStore | undefined {
    return this.storeMap.get(name.toLowerCase());
  }

  /**
   * Check if two stores have the same length (for set mapping)
   */
  private storesHaveSameLength(store1Name: string, store2Name: string): boolean {
    const store1 = this.getStore(store1Name);
    const store2 = this.getStore(store2Name);
    if (!store1 || !store2) return false;

    // Count characters/elements in each store
    const len1 = this.countStoreElements(store1.value);
    const len2 = this.countStoreElements(store2.value);
    return len1 === len2 && len1 > 0;
  }

  /**
   * Count elements in a store value
   */
  private countStoreElements(value: string): number {
    return this.parseStoreElements(value).length;
  }

  /**
   * Parse a store value into individual elements
   * Handles: virtual keys [K_A], [SHIFT K_A], unicode U+XXXX, ranges U+XXXX..U+YYYY, characters
   */
  private parseStoreElements(value: string): string[] {
    const elements: string[] = [];
    let i = 0;

    while (i < value.length) {
      // Skip whitespace
      if (/\s/.test(value[i])) {
        i++;
        continue;
      }

      // Virtual key in brackets: [K_A] or [SHIFT K_A]
      if (value[i] === '[') {
        const end = value.indexOf(']', i);
        if (end !== -1) {
          elements.push(value.substring(i, end + 1));
          i = end + 1;
          continue;
        }
      }

      // Unicode escape: U+XXXX or u+xxxx
      if ((value[i] === 'U' || value[i] === 'u') && value[i + 1] === '+') {
        // Parse hex digits
        let j = i + 2;
        while (j < value.length && /[0-9a-fA-F]/.test(value[j])) {
          j++;
        }
        const codePoint = parseInt(value.substring(i + 2, j), 16);

        // Check for range: U+XXXX .. U+YYYY
        let rangeEnd = j;
        while (rangeEnd < value.length && /\s/.test(value[rangeEnd])) rangeEnd++;

        if (value.substring(rangeEnd, rangeEnd + 2) === '..') {
          rangeEnd += 2;
          while (rangeEnd < value.length && /\s/.test(value[rangeEnd])) rangeEnd++;

          if ((value[rangeEnd] === 'U' || value[rangeEnd] === 'u') && value[rangeEnd + 1] === '+') {
            let k = rangeEnd + 2;
            while (k < value.length && /[0-9a-fA-F]/.test(value[k])) {
              k++;
            }
            const endCodePoint = parseInt(value.substring(rangeEnd + 2, k), 16);

            // Expand the range
            for (let cp = codePoint; cp <= endCodePoint; cp++) {
              elements.push(String.fromCodePoint(cp));
            }
            i = k;
            continue;
          }
        }

        // Single unicode character
        elements.push(String.fromCodePoint(codePoint));
        i = j;
        continue;
      }

      // Regular character (including Unicode surrogate pairs)
      const cp = value.codePointAt(i);
      if (cp !== undefined) {
        elements.push(String.fromCodePoint(cp));
        i += cp > 0xFFFF ? 2 : 1;
      } else {
        i++;
      }
    }

    return elements;
  }

  /**
   * Parse a virtual key spec like "[SHIFT K_A]" into key ID and modifiers
   */
  private parseVirtualKeySpec(spec: string): { keyId: string; modifiers: string } | null {
    // Remove brackets
    const inner = spec.replace(/^\[|\]$/g, '').trim();
    if (!inner) return null;

    const parts = inner.split(/\s+/);
    let keyId = '';
    const mods: string[] = [];

    for (const part of parts) {
      const upper = part.toUpperCase();
      if (upper === 'SHIFT') {
        mods.push('shift');
      } else if (upper === 'CTRL' || upper === 'CONTROL') {
        mods.push('ctrl');
      } else if (upper === 'ALT') {
        mods.push('alt');
      } else if (upper === 'RALT') {
        mods.push('altR');
      } else if (upper === 'LALT') {
        mods.push('alt');
      } else if (upper === 'CAPS') {
        mods.push('caps');
      } else if (upper.startsWith('K_') || upper.startsWith('T_')) {
        keyId = upper;
      }
    }

    if (!keyId) return null;

    return {
      keyId,
      modifiers: mods.length > 0 ? mods.join(' ') : 'none',
    };
  }

  /**
   * Initialize virtual key to hardware key mapping
   */
  private initVkeyMapping(): void {
    // Standard US QWERTY mapping
    const mapping: Record<string, string> = {
      // Number row
      'K_BKQUOTE': 'grave', 'K_1': '1', 'K_2': '2', 'K_3': '3', 'K_4': '4',
      'K_5': '5', 'K_6': '6', 'K_7': '7', 'K_8': '8', 'K_9': '9', 'K_0': '0',
      'K_HYPHEN': 'hyphen', 'K_EQUAL': 'equal',
      // Top row
      'K_Q': 'q', 'K_W': 'w', 'K_E': 'e', 'K_R': 'r', 'K_T': 't',
      'K_Y': 'y', 'K_U': 'u', 'K_I': 'i', 'K_O': 'o', 'K_P': 'p',
      'K_LBRKT': 'bracketLeft', 'K_RBRKT': 'bracketRight', 'K_BKSLASH': 'backslash',
      // Home row
      'K_A': 'a', 'K_S': 's', 'K_D': 'd', 'K_F': 'f', 'K_G': 'g',
      'K_H': 'h', 'K_J': 'j', 'K_K': 'k', 'K_L': 'l',
      'K_COLON': 'semicolon', 'K_QUOTE': 'apostrophe',
      // Bottom row
      'K_Z': 'z', 'K_X': 'x', 'K_C': 'c', 'K_V': 'v', 'K_B': 'b',
      'K_N': 'n', 'K_M': 'm',
      'K_COMMA': 'comma', 'K_PERIOD': 'period', 'K_SLASH': 'slash',
      // Space
      'K_SPACE': 'space',
    };
    for (const [vkey, hw] of Object.entries(mapping)) {
      this.vkeyToHardware.set(vkey, hw);
    }
  }

  /**
   * Get a store value by name
   */
  private getStoreValue(name: string): string | undefined {
    const store = this.keyboard.stores.find(
      s => s.name.toUpperCase() === name.toUpperCase()
    );
    return store?.value;
  }

  /**
   * Collect key definitions from rules
   * Prefers desktop ($keymanonly) rules over web rules when both exist
   * Skips rules with if/set conditions (not supported by LDML)
   */
  private collectKeysFromRules(): void {
    // Track which keys have been defined with their modifiers
    const definedKeys = new Set<string>();

    // First pass: Process desktop and non-platform-specific rules
    for (const group of this.keyboard.groups) {
      for (const rule of group.rules) {
        // Skip rules with if/set conditions
        if (this.ruleHasIfSet(rule)) continue;

        if (rule.key && rule.platform !== 'web') {
          // Handle any(store) as key - expand to individual key definitions
          if (rule.key.anyStoreName) {
            this.expandAnyKeyRule(rule, definedKeys);
          } else {
            const keyId = this.getKeyId(rule.key);
            const modifiers = this.getModifierString(rule.key);
            const keyWithMods = `${keyId}:${modifiers}`;
            definedKeys.add(keyWithMods);
            this.addKeyFromRule(rule);
          }
        }
      }
    }

    // Second pass: Process web-only rules that don't conflict
    for (const group of this.keyboard.groups) {
      for (const rule of group.rules) {
        // Skip rules with if/set conditions
        if (this.ruleHasIfSet(rule)) continue;

        if (rule.key && rule.platform === 'web') {
          if (rule.key.anyStoreName) {
            this.expandAnyKeyRule(rule, definedKeys);
          } else {
            const keyId = this.getKeyId(rule.key);
            const modifiers = this.getModifierString(rule.key);
            const keyWithMods = `${keyId}:${modifiers}`;
            if (!definedKeys.has(keyWithMods)) {
              this.addKeyFromRule(rule);
            }
          }
        }
      }
    }
  }

  /**
   * Expand a rule with any(store) as key into individual key definitions
   * For rules like: + any(ConsK) > index(ConsU,1)
   */
  private expandAnyKeyRule(rule: KmnRule, definedKeys: Set<string>): void {
    if (!rule.key?.anyStoreName) return;

    const keyStore = this.getStore(rule.key.anyStoreName);
    if (!keyStore) return;

    // Find the index() output that references this key
    const indexOutput = rule.output.find(e => e.type === 'index') as KmnIndexElement | undefined;
    if (!indexOutput) return;

    const outputStore = this.getStore(indexOutput.storeName);
    if (!outputStore) return;

    // Parse both stores into elements
    const keyElements = this.parseStoreElements(keyStore.value);
    const outputElements = this.parseStoreElements(outputStore.value);

    // They must have the same number of elements
    if (keyElements.length !== outputElements.length) {
      // Mismatch - can't expand (will be handled as transform if possible)
      return;
    }

    // Create a key definition for each mapping
    for (let i = 0; i < keyElements.length; i++) {
      const keySpec = keyElements[i];
      const output = outputElements[i];

      // Parse the key spec (it might be [SHIFT K_A] or just a character)
      let keyId: string;
      let modifiers: string;

      if (keySpec.startsWith('[')) {
        // Virtual key spec
        const parsed = this.parseVirtualKeySpec(keySpec);
        if (!parsed) continue;
        keyId = parsed.keyId;
        modifiers = parsed.modifiers;
      } else {
        // Character - convert to key ID (this would be a character key)
        const code = keySpec.codePointAt(0);
        if (!code) continue;
        keyId = `U_${code.toString(16).toUpperCase().padStart(4, '0')}`;
        modifiers = 'none';
      }

      const keyWithMods = `${keyId}:${modifiers}`;

      // Skip if already defined
      if (definedKeys.has(keyWithMods)) continue;
      definedKeys.add(keyWithMods);

      // Get or create key
      let key = this.keys.get(keyId);
      if (!key) {
        key = { id: keyId, outputs: new Map() };
        this.keys.set(keyId, key);
      }

      // Set the output for this modifier
      const variantId = this.getVariantKeyId(keyId, modifiers);
      if (!this.keys.has(variantId) && modifiers !== 'none') {
        // Create variant key for modified key
        this.keys.set(variantId, { id: variantId, outputs: new Map() });
      }
      key.outputs.set(modifiers, output);
    }
  }

  /**
   * Add a key definition from a rule
   */
  private addKeyFromRule(rule: KmnRule): void {
    if (!rule.key) return;

    const keyId = this.getKeyId(rule.key);
    if (!keyId) return;

    // Get existing key or create new
    let key = this.keys.get(keyId);
    if (!key) {
      key = { id: keyId, outputs: new Map() };
      this.keys.set(keyId, key);
    }

    // Determine modifier combination
    const modifiers = this.getModifierString(rule.key);
    const keyWithMods = `${keyId}:${modifiers}`;

    // Check if this is a combining key that needs marker output
    const combiningInfo = this.combiningKeys.get(keyWithMods);

    // Check for deadkey output
    const deadkeyOutput = rule.output.find(e => e.type === 'deadkey');
    if (deadkeyOutput && deadkeyOutput.type === 'deadkey') {
      // This creates a marker
      const markerName = deadkeyOutput.name;
      this.markers.set(markerName, markerName);
      key.outputs.set(modifiers, `\\m{${markerName}}`);
    } else if (combiningInfo) {
      // This key is used in context rules - ALWAYS output marker
      // Transforms will handle both:
      // 1. context + marker → combined output (from context rules)
      // 2. marker → default output (from non-context rule, if any)
      this.markers.set(combiningInfo.markerName, combiningInfo.markerName);
      // Only set once (first rule wins)
      if (!key.outputs.has(modifiers)) {
        key.outputs.set(modifiers, `\\m{${combiningInfo.markerName}}`);
      }
    } else {
      // Regular key output - not a combining key
      const output = this.getOutputString(rule.output);
      if (output) {
        key.outputs.set(modifiers, output);
      }
    }
  }

  /**
   * Get key ID from key spec
   */
  private getKeyId(key: KmnKeySpec): string | null {
    if (key.vkey) {
      return key.vkey;
    }
    if (key.char) {
      // Convert character to key ID
      const code = key.char.codePointAt(0);
      if (code !== undefined) {
        return `U_${code.toString(16).toUpperCase().padStart(4, '0')}`;
      }
    }
    return null;
  }

  /**
   * Get modifier string for LDML
   */
  private getModifierString(key: KmnKeySpec): string {
    const mods: string[] = [];
    if (key.shift) mods.push('shift');
    if (key.ctrl) mods.push('ctrl');
    if (key.alt) mods.push('altR'); // RALT in KMN is typically altR in LDML
    if (key.caps) mods.push('caps');
    return mods.length > 0 ? mods.join(' ') : 'none';
  }

  /**
   * Get output string from rule elements (without set mapping)
   */
  private getOutputString(elements: KmnRuleElement[]): string {
    let result = '';
    for (const elem of elements) {
      switch (elem.type) {
        case 'char':
          result += elem.value;
          break;
        case 'deadkey':
          result += `\\m{${elem.name}}`;
          break;
        case 'nul':
          // NUL output - key produces nothing
          break;
        case 'beep':
          // BEEP - no output
          break;
        case 'context':
          // Context in output - preserve previous
          break;
        // For other types, we may need special handling
      }
    }
    return result;
  }

  /**
   * Analyze a rule for set mapping patterns
   */
  private analyzeRuleForSetMapping(rule: KmnRule): AnalyzedRule {
    const setMappings: SetMappingInfo[] = [];
    let canUseSetMapping = this.options.useSetMapping || false;

    // Find all any() elements in context with their CONTEXT positions (1-based)
    // Note: KMN index() offset refers to context position, not any() count
    const anyElements: { elem: KmnAnyElement; contextPosition: number }[] = [];
    let contextPosition = 0;
    for (const elem of rule.context) {
      contextPosition++;
      if (elem.type === 'any') {
        anyElements.push({ elem, contextPosition });
      }
    }

    // If key is any(store), add it as the last context position + 1
    if (rule.key?.anyStoreName) {
      contextPosition++;
      anyElements.push({
        elem: { type: 'any', storeName: rule.key.anyStoreName },
        contextPosition,
      });
    }

    // Find all index() elements in output
    const indexElements: KmnIndexElement[] = [];
    for (const elem of rule.output) {
      if (elem.type === 'index') {
        indexElements.push(elem);
      }
    }

    // Match index() references to any() elements by context position
    for (const indexElem of indexElements) {
      // index(store, N) refers to context position N
      const anyMatch = anyElements.find(a => a.contextPosition === indexElem.offset);
      if (anyMatch) {
        const inputStore = anyMatch.elem.storeName;
        const outputStore = indexElem.storeName;

        // Check if stores have same length (required for set mapping)
        if (this.storesHaveSameLength(inputStore, outputStore)) {
          setMappings.push({
            contextPosition: anyMatch.contextPosition,
            inputStore,
            outputStore,
          });
        } else {
          // Stores don't match in length - can't use set mapping for this rule
          canUseSetMapping = false;
        }
      }
    }

    // Can only use set mapping if all index() elements have matching any() with valid stores
    if (indexElements.length !== setMappings.length) {
      canUseSetMapping = false;
    }

    return { rule, setMappings, canUseSetMapping };
  }

  /**
   * Generate transform pattern with set mapping capturing groups
   */
  private generateSetMappingPattern(rule: KmnRule, setMappings: SetMappingInfo[]): string {
    let pattern = '';
    let contextPosition = 0;

    for (const elem of rule.context) {
      contextPosition++;
      switch (elem.type) {
        case 'char':
          pattern += elem.value;
          break;
        case 'deadkey':
          pattern += `\\m{${elem.name}}`;
          break;
        case 'any':
          // Check if this any() is part of a set mapping (by context position)
          const mapping = setMappings.find(m => m.contextPosition === contextPosition);
          if (mapping) {
            // Use capturing group for set mapping: ($[storeName])
            pattern += `($[${elem.storeName}])`;
          } else {
            // Regular any() without set mapping
            pattern += `$[${elem.storeName}]`;
          }
          break;
        // Handle other context types
      }
    }

    // Handle key
    if (rule.key) {
      if (rule.key.anyStoreName) {
        // any(store) as key - add to pattern
        contextPosition++;
        const mapping = setMappings.find(m => m.contextPosition === contextPosition);
        if (mapping) {
          pattern += `($[${rule.key.anyStoreName}])`;
        } else {
          pattern += `$[${rule.key.anyStoreName}]`;
        }
      } else {
        // Regular key - add its output
        const keyId = this.getKeyId(rule.key);
        if (keyId) {
          const key = this.keys.get(keyId);
          const modifiers = this.getModifierString(rule.key);
          const output = key?.outputs.get(modifiers);
          if (output) {
            pattern += output;
          }
        }
      }
    }

    return pattern;
  }

  /**
   * Generate output with set mapping references
   */
  private generateSetMappingOutput(rule: KmnRule, setMappings: SetMappingInfo[]): string {
    let result = '';
    let captureIndex = 0;

    // Track which captures we've used
    const captureMap = new Map<number, number>(); // contextPosition -> captureIndex
    for (const mapping of setMappings) {
      captureIndex++;
      captureMap.set(mapping.contextPosition, captureIndex);
    }

    for (const elem of rule.output) {
      switch (elem.type) {
        case 'char':
          result += elem.value;
          break;
        case 'deadkey':
          result += `\\m{${elem.name}}`;
          break;
        case 'index':
          // Find the corresponding set mapping
          const mapping = setMappings.find(m => m.contextPosition === elem.offset);
          if (mapping) {
            const idx = captureMap.get(mapping.contextPosition);
            // Use LDML set mapping output syntax: $[N:targetStore]
            result += `$[${idx}:${mapping.outputStore}]`;
          }
          break;
        case 'context':
          // Context reference - would need more complex handling
          break;
        case 'nul':
        case 'beep':
          // No output
          break;
      }
    }
    return result;
  }

  /**
   * Generate variant key ID for a modifier combination
   */
  private getVariantKeyId(baseKeyId: string, modifiers: string): string {
    if (modifiers === 'none') {
      return baseKeyId;
    }
    // Generate variant ID like K_A_shift, K_A_altR, K_A_shift_altR
    const modSuffix = modifiers.replace(/ /g, '_');
    return `${baseKeyId}_${modSuffix}`;
  }

  /**
   * Generate <keys> section with modifier variants and touch keys
   */
  private generateKeysSection(): string {
    const hasTouchKeys = this.touchResult && this.touchResult.keys.length > 0;
    if (this.keys.size === 0 && !hasTouchKeys) return '';

    let xml = `${this.indent}<keys>\n`;

    // Add standard non-output keys
    xml += `${this.indent}${this.indent}<key id="K_SPACE" output=" "/>\n`;
    xml += `${this.indent}${this.indent}<key id="K_BKSP"/>\n`;

    // Track which key IDs we've added
    const addedKeys = new Set<string>(['K_SPACE', 'K_BKSP']);

    // Generate keys with variant IDs for different modifier outputs
    for (const [keyId, key] of this.keys) {
      // Skip if it's a standard key we already added
      if (addedKeys.has(keyId)) continue;

      for (const [modifiers, output] of key.outputs) {
        const variantId = this.getVariantKeyId(keyId, modifiers);

        if (addedKeys.has(variantId)) continue;
        addedKeys.add(variantId);

        xml += `${this.indent}${this.indent}<key id="${variantId}"`;

        if (output) {
          xml += ` output="${this.escapeXml(output)}"`;
        }

        xml += `/>\n`;
      }
    }

    // Add touch layout keys
    if (hasTouchKeys) {
      for (const touchKey of this.touchResult!.keys) {
        // Skip if we already have this key
        if (addedKeys.has(touchKey.id)) continue;
        addedKeys.add(touchKey.id);

        xml += `${this.indent}${this.indent}<key id="${touchKey.id}"`;

        if (touchKey.output) {
          xml += ` output="${this.escapeXml(touchKey.output)}"`;
        }
        if (touchKey.gap) {
          xml += ` gap="true"`;
        }
        if (touchKey.width) {
          xml += ` width="${touchKey.width}"`;
        }
        if (touchKey.layerId) {
          xml += ` layerId="${touchKey.layerId}"`;
        }
        if (touchKey.longPressKeyIds) {
          xml += ` longPressKeyIds="${touchKey.longPressKeyIds}"`;
        }
        if (touchKey.longPressDefaultKeyId) {
          xml += ` longPressDefaultKeyId="${touchKey.longPressDefaultKeyId}"`;
        }
        if (touchKey.multiTapKeyIds) {
          xml += ` multiTapKeyIds="${touchKey.multiTapKeyIds}"`;
        }
        if (touchKey.flickId) {
          xml += ` flickId="${touchKey.flickId}"`;
        }

        xml += `/>\n`;
      }
    }

    xml += `${this.indent}</keys>\n`;
    return xml;
  }

  /**
   * Generate <flicks> section from touch layout
   */
  private generateFlicksSection(): string {
    if (!this.touchResult || this.touchResult.flicks.length === 0) {
      return '';
    }

    let xml = `${this.indent}<flicks>\n`;

    for (const flick of this.touchResult.flicks) {
      xml += `${this.indent}${this.indent}<flick id="${flick.id}">\n`;
      for (const seg of flick.segments) {
        xml += `${this.indent}${this.indent}${this.indent}<flickSegment directions="${seg.directions}" keyId="${seg.keyId}"/>\n`;
      }
      xml += `${this.indent}${this.indent}</flick>\n`;
    }

    xml += `${this.indent}</flicks>\n`;
    return xml;
  }

  /**
   * Generate <layers> section
   */
  private generateLayersSection(): string {
    let xml = '';

    if (this.options.includeHardware) {
      xml += this.generateHardwareLayers();
    }

    if (this.options.includeTouch) {
      xml += this.generateTouchLayers();
    }

    return xml;
  }

  /**
   * Generate hardware layers from rules
   */
  private generateHardwareLayers(): string {
    // Collect all modifier combinations used by any key
    const modifierSets = new Set<string>();
    for (const [, key] of this.keys) {
      for (const [modifiers] of key.outputs) {
        modifierSets.add(modifiers);
      }
    }

    if (modifierSets.size === 0) return '';

    // Sort modifiers: 'none' first, then alphabetically
    const sortedModifiers = [...modifierSets].sort((a, b) => {
      if (a === 'none') return -1;
      if (b === 'none') return 1;
      return a.localeCompare(b);
    });

    const formId = this.options.hardwareForm || 'us';
    let xml = `${this.indent}<layers formId="${formId}">\n`;

    for (const modifiers of sortedModifiers) {
      xml += `${this.indent}${this.indent}<layer`;
      if (modifiers !== 'none') {
        xml += ` modifiers="${modifiers}"`;
      }
      xml += `>\n`;

      // Generate rows with variant key IDs for this modifier layer
      xml += this.generateKeyboardRows(modifiers, formId);

      xml += `${this.indent}${this.indent}</layer>\n`;
    }

    xml += `${this.indent}</layers>\n`;
    return xml;
  }

  /**
   * Generate keyboard rows for a layer with specific modifiers and form
   */
  private generateKeyboardRows(modifiers: string, formId: HardwareForm = 'us'): string {
    const rows = this.getKeyboardRowsForForm(formId);

    let xml = '';
    for (const rowKeys of rows) {
      // For each base key, find the variant key ID that has an output for this modifier
      const layerKeys: string[] = [];
      for (const baseKeyId of rowKeys) {
        const key = this.keys.get(baseKeyId);
        if (key && key.outputs.has(modifiers)) {
          // Use the variant key ID for this modifier
          layerKeys.push(this.getVariantKeyId(baseKeyId, modifiers));
        }
      }
      if (layerKeys.length > 0) {
        xml += `${this.indent}${this.indent}${this.indent}<row keys="${layerKeys.join(' ')}"/>\n`;
      }
    }
    return xml;
  }

  /**
   * Get keyboard row layouts for different hardware forms
   */
  private getKeyboardRowsForForm(formId: HardwareForm): string[][] {
    // US ANSI layout (default)
    const usRows = [
      ['K_BKQUOTE', 'K_1', 'K_2', 'K_3', 'K_4', 'K_5', 'K_6', 'K_7', 'K_8', 'K_9', 'K_0', 'K_HYPHEN', 'K_EQUAL'],
      ['K_Q', 'K_W', 'K_E', 'K_R', 'K_T', 'K_Y', 'K_U', 'K_I', 'K_O', 'K_P', 'K_LBRKT', 'K_RBRKT', 'K_BKSLASH'],
      ['K_A', 'K_S', 'K_D', 'K_F', 'K_G', 'K_H', 'K_J', 'K_K', 'K_L', 'K_COLON', 'K_QUOTE'],
      ['K_Z', 'K_X', 'K_C', 'K_V', 'K_B', 'K_N', 'K_M', 'K_COMMA', 'K_PERIOD', 'K_SLASH'],
      ['K_SPACE'],
    ];

    // ISO layout (European) - has extra key between left shift and Z
    const isoRows = [
      ['K_BKQUOTE', 'K_1', 'K_2', 'K_3', 'K_4', 'K_5', 'K_6', 'K_7', 'K_8', 'K_9', 'K_0', 'K_HYPHEN', 'K_EQUAL'],
      ['K_Q', 'K_W', 'K_E', 'K_R', 'K_T', 'K_Y', 'K_U', 'K_I', 'K_O', 'K_P', 'K_LBRKT', 'K_RBRKT'],
      ['K_A', 'K_S', 'K_D', 'K_F', 'K_G', 'K_H', 'K_J', 'K_K', 'K_L', 'K_COLON', 'K_QUOTE', 'K_BKSLASH'],
      ['K_oE2', 'K_Z', 'K_X', 'K_C', 'K_V', 'K_B', 'K_N', 'K_M', 'K_COMMA', 'K_PERIOD', 'K_SLASH'],
      ['K_SPACE'],
    ];

    // JIS layout (Japanese) - has extra keys
    const jisRows = [
      ['K_BKQUOTE', 'K_1', 'K_2', 'K_3', 'K_4', 'K_5', 'K_6', 'K_7', 'K_8', 'K_9', 'K_0', 'K_HYPHEN', 'K_EQUAL', 'K_oE1'],
      ['K_Q', 'K_W', 'K_E', 'K_R', 'K_T', 'K_Y', 'K_U', 'K_I', 'K_O', 'K_P', 'K_LBRKT', 'K_RBRKT'],
      ['K_A', 'K_S', 'K_D', 'K_F', 'K_G', 'K_H', 'K_J', 'K_K', 'K_L', 'K_COLON', 'K_QUOTE', 'K_BKSLASH'],
      ['K_Z', 'K_X', 'K_C', 'K_V', 'K_B', 'K_N', 'K_M', 'K_COMMA', 'K_PERIOD', 'K_SLASH', 'K_oE0'],
      ['K_SPACE'],
    ];

    // ABNT2 layout (Brazilian) - has extra key
    const abnt2Rows = [
      ['K_BKQUOTE', 'K_1', 'K_2', 'K_3', 'K_4', 'K_5', 'K_6', 'K_7', 'K_8', 'K_9', 'K_0', 'K_HYPHEN', 'K_EQUAL'],
      ['K_Q', 'K_W', 'K_E', 'K_R', 'K_T', 'K_Y', 'K_U', 'K_I', 'K_O', 'K_P', 'K_LBRKT', 'K_RBRKT'],
      ['K_A', 'K_S', 'K_D', 'K_F', 'K_G', 'K_H', 'K_J', 'K_K', 'K_L', 'K_COLON', 'K_QUOTE', 'K_BKSLASH'],
      ['K_oE2', 'K_Z', 'K_X', 'K_C', 'K_V', 'K_B', 'K_N', 'K_M', 'K_COMMA', 'K_PERIOD', 'K_SLASH', 'K_oC1'],
      ['K_SPACE'],
    ];

    // KS layout (Korean) - similar to US with extra keys
    const ksRows = [
      ['K_BKQUOTE', 'K_1', 'K_2', 'K_3', 'K_4', 'K_5', 'K_6', 'K_7', 'K_8', 'K_9', 'K_0', 'K_HYPHEN', 'K_EQUAL'],
      ['K_Q', 'K_W', 'K_E', 'K_R', 'K_T', 'K_Y', 'K_U', 'K_I', 'K_O', 'K_P', 'K_LBRKT', 'K_RBRKT', 'K_BKSLASH'],
      ['K_A', 'K_S', 'K_D', 'K_F', 'K_G', 'K_H', 'K_J', 'K_K', 'K_L', 'K_COLON', 'K_QUOTE'],
      ['K_Z', 'K_X', 'K_C', 'K_V', 'K_B', 'K_N', 'K_M', 'K_COMMA', 'K_PERIOD', 'K_SLASH'],
      ['K_SPACE'],
    ];

    switch (formId) {
      case 'iso': return isoRows;
      case 'jis': return jisRows;
      case 'abnt2': return abnt2Rows;
      case 'ks': return ksRows;
      case 'us':
      default: return usRows;
    }
  }

  /**
   * Generate touch layers from touch layout conversion
   */
  private generateTouchLayers(): string {
    if (!this.touchResult || this.touchResult.layers.length === 0) {
      return '';
    }

    const minWidth = this.touchResult.phoneMinWidth ?? 0;
    let xml = `${this.indent}<layers formId="touch" minDeviceWidth="${minWidth}">\n`;

    for (const layer of this.touchResult.layers) {
      xml += `${this.indent}${this.indent}<layer id="${layer.id}"`;
      if (layer.modifiers) {
        xml += ` modifiers="${layer.modifiers}"`;
      }
      xml += `>\n`;

      for (const row of layer.rows) {
        xml += `${this.indent}${this.indent}${this.indent}<row keys="${row.join(' ')}"/>\n`;
      }

      xml += `${this.indent}${this.indent}</layer>\n`;
    }

    xml += `${this.indent}</layers>\n`;
    return xml;
  }

  /**
   * Generate <variables> section from KMN stores
   */
  private generateVariablesSection(): string {
    // Convert non-system stores to variables
    const userStores = this.keyboard.stores.filter(s => !s.isSystem);
    if (userStores.length === 0) return '';

    let xml = `${this.indent}<variables>\n`;

    for (const store of userStores) {
      // Determine variable type based on content
      const value = store.value;

      // Parse store into elements (handles virtual keys [K_A], unicode, ranges properly)
      const elements = this.parseStoreElements(value);

      if (elements.length === 0) {
        // Empty store - skip
        continue;
      } else if (elements.length === 1) {
        // Single value - use string
        xml += `${this.indent}${this.indent}<string id="${store.name}" value="${this.escapeXml(elements[0])}"/>\n`;
      } else {
        // Multiple elements - format as space-separated set for LDML
        const formattedValue = elements.join(' ');
        xml += `${this.indent}${this.indent}<set id="${store.name}" value="${this.escapeXml(formattedValue)}"/>\n`;
      }
    }

    xml += `${this.indent}</variables>\n`;
    return xml;
  }

  /**
   * Generate <transforms> section from rules with context
   * Uses multiple transformGroups for different KMN groups
   */
  private generateTransformsSection(): string {
    // Check if we need transforms at all
    const hasCombiningKeys = this.combiningKeys.size > 0;
    const hasNonUsingKeysGroups = this.keyboard.groups.some(g => !g.usingKeys);
    const hasContextRulesInMain = this.keyboard.groups.some(g =>
      g.usingKeys && g.rules.some(r =>
        r.context.length > 0 && !r.context.every(e => e.type === 'if')
      )
    );

    if (!hasCombiningKeys && !hasNonUsingKeysGroups && !hasContextRulesInMain && this.markers.size === 0) {
      return '';
    }

    let xml = `${this.indent}<transforms type="simple">\n`;

    // TransformGroup 1: Combining key transforms (context + marker → output)
    if (hasCombiningKeys) {
      xml += `${this.indent}${this.indent}<!-- Combining key transforms -->\n`;
      xml += `${this.indent}${this.indent}<transformGroup>\n`;
      xml += this.generateCombiningKeyTransforms();
      xml += `${this.indent}${this.indent}</transformGroup>\n`;
    }

    // TransformGroup 2+: Non-usingKeys groups (in order)
    for (const group of this.keyboard.groups) {
      if (group.usingKeys) continue;

      const groupTransforms = this.generateGroupTransforms(group);
      if (groupTransforms) {
        xml += `${this.indent}${this.indent}<!-- Group: ${group.name} -->\n`;
        xml += `${this.indent}${this.indent}<transformGroup>\n`;
        xml += groupTransforms;
        xml += `${this.indent}${this.indent}</transformGroup>\n`;
      }
    }

    // Final group: Any additional context rules from main group (any/index patterns)
    const mainGroupTransforms = this.generateMainGroupContextTransforms();
    if (mainGroupTransforms) {
      xml += `${this.indent}${this.indent}<!-- Main group context rules -->\n`;
      xml += `${this.indent}${this.indent}<transformGroup>\n`;
      xml += mainGroupTransforms;
      xml += `${this.indent}${this.indent}</transformGroup>\n`;
    }

    xml += `${this.indent}</transforms>\n`;
    return xml;
  }

  /**
   * Generate transforms for combining keys (context + marker → output)
   */
  private generateCombiningKeyTransforms(): string {
    let xml = '';

    // First pass: Generate context-based transforms (context + marker → combined output)
    for (const [keyWithMods, info] of this.combiningKeys) {
      // Group rules by context pattern for potential set mapping
      const rulesByContext = new Map<string, KmnRule[]>();

      for (const rule of info.rules) {
        if (rule.platform === 'web') continue; // Skip web-only rules

        // Get context signature
        const contextSig = rule.context.map(e => {
          if (e.type === 'char') return `c:${e.value}`;
          if (e.type === 'any') return `a:${(e as KmnAnyElement).storeName}`;
          if (e.type === 'deadkey') return `d:${e.name}`;
          return JSON.stringify(e);
        }).join('|');

        if (!rulesByContext.has(contextSig)) {
          rulesByContext.set(contextSig, []);
        }
        rulesByContext.get(contextSig)!.push(rule);
      }

      // Generate transforms for each context pattern
      for (const [_contextSig, rules] of rulesByContext) {
        // Check if we can use set mapping for these rules
        if (rules.length > 1) {
          // Try to use set mapping
          const analyzed = this.analyzeRuleForSetMapping(rules[0]);
          if (analyzed.canUseSetMapping && analyzed.setMappings.length > 0) {
            const from = this.generateCombiningSetMappingPattern(rules[0], analyzed.setMappings, info.markerName);
            const to = this.generateSetMappingOutput(rules[0], analyzed.setMappings);
            if (from && to) {
              xml += `${this.indent}${this.indent}${this.indent}<!-- Set mapping: ${rules.length} combining rules -->\n`;
              xml += `${this.indent}${this.indent}${this.indent}<transform from="${this.escapeXml(from)}" to="${this.escapeXml(to)}"/>\n`;
              continue;
            }
          }
        }

        // Generate individual transforms
        for (const rule of rules) {
          const from = this.generateCombiningPattern(rule, info.markerName);
          const to = this.getOutputString(rule.output);

          if (from && to) {
            xml += `${this.indent}${this.indent}${this.indent}<transform from="${this.escapeXml(from)}" to="${this.escapeXml(to)}"/>\n`;
          }
        }
      }
    }

    // Second pass: Generate default transforms (marker → default output)
    // These come AFTER context rules so context rules get priority
    for (const [keyWithMods, info] of this.combiningKeys) {
      if (info.defaultOutput) {
        // This combining key has a default output (from a rule without context)
        // Generate: marker → defaultOutput
        xml += `${this.indent}${this.indent}${this.indent}<!-- Default output for ${keyWithMods} -->\n`;
        xml += `${this.indent}${this.indent}${this.indent}<transform from="\\m{${info.markerName}}" to="${this.escapeXml(info.defaultOutput)}"/>\n`;
      }
    }

    return xml;
  }

  /**
   * Generate pattern for a combining rule: context + marker
   */
  private generateCombiningPattern(rule: KmnRule, markerName: string): string {
    let pattern = '';

    for (const elem of rule.context) {
      switch (elem.type) {
        case 'char':
          pattern += this.escapeRegexChars(elem.value);
          break;
        case 'deadkey':
          pattern += `\\m{${elem.name}}`;
          break;
        case 'any':
          pattern += `$[${(elem as KmnAnyElement).storeName}]`;
          break;
      }
    }

    // Add the combining key marker
    pattern += `\\m{${markerName}}`;

    return pattern;
  }

  /**
   * Generate set mapping pattern for combining rule
   */
  private generateCombiningSetMappingPattern(rule: KmnRule, setMappings: SetMappingInfo[], markerName: string): string {
    let pattern = '';
    let contextPosition = 0;

    for (const elem of rule.context) {
      contextPosition++;
      switch (elem.type) {
        case 'char':
          pattern += this.escapeRegexChars(elem.value);
          break;
        case 'deadkey':
          pattern += `\\m{${elem.name}}`;
          break;
        case 'any':
          const mapping = setMappings.find(m => m.contextPosition === contextPosition);
          if (mapping) {
            pattern += `($[${(elem as KmnAnyElement).storeName}])`;
          } else {
            pattern += `$[${(elem as KmnAnyElement).storeName}]`;
          }
          break;
      }
    }

    // Add the combining key marker
    pattern += `\\m{${markerName}}`;

    return pattern;
  }

  /**
   * Escape regex special characters in a string
   */
  private escapeRegexChars(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Generate transforms for a non-usingKeys group
   */
  private generateGroupTransforms(group: KmnGroup): string {
    let xml = '';
    const processedPatterns = new Set<string>();

    // Collect and analyze rules
    const rules = group.rules.filter(r =>
      (r.context.length > 0 || r.isMatch) && r.platform !== 'web'
    );

    // Also include web rules that don't conflict
    for (const rule of group.rules) {
      if (rule.platform === 'web' && (rule.context.length > 0 || rule.isMatch)) {
        const sig = this.getRuleSignature(rule);
        if (!processedPatterns.has(sig)) {
          rules.push(rule);
        }
      }
    }

    const analyzedRules = rules.map(r => this.analyzeRuleForSetMapping(r));
    const setMappingGroups = this.groupRulesBySetMappingPattern(analyzedRules);

    // Generate set-mapped transforms
    for (const [_patternKey, grp] of setMappingGroups) {
      if (grp.canUseSetMapping && grp.rules.length > 0) {
        const analyzed = grp.rules[0];
        const from = this.generateSetMappingPattern(analyzed.rule, analyzed.setMappings);
        const to = this.generateSetMappingOutput(analyzed.rule, analyzed.setMappings);

        if (from && to) {
          const sig = this.getRuleSignature(analyzed.rule);
          processedPatterns.add(sig);
          xml += `${this.indent}${this.indent}${this.indent}<transform from="${this.escapeXml(from)}" to="${this.escapeXml(to)}"/>\n`;
        }
      }
    }

    // Generate remaining transforms
    for (const analyzed of analyzedRules) {
      const sig = this.getRuleSignature(analyzed.rule);
      if (processedPatterns.has(sig)) continue;
      if (analyzed.canUseSetMapping) continue;

      const from = this.ruleContextToPattern(analyzed.rule);
      const to = this.getOutputString(analyzed.rule.output);

      if (from && to) {
        processedPatterns.add(sig);
        xml += `${this.indent}${this.indent}${this.indent}<transform from="${this.escapeXml(from)}" to="${this.escapeXml(to)}"/>\n`;
      }
    }

    return xml;
  }

  /**
   * Generate transforms for context rules in main (usingKeys) group
   * These are rules with any(store) as key or other special patterns
   */
  private generateMainGroupContextTransforms(): string {
    let xml = '';
    const processedPatterns = new Set<string>();

    for (const group of this.keyboard.groups) {
      if (!group.usingKeys) continue;

      for (const rule of group.rules) {
        if (rule.platform === 'web') continue;

        // Skip rules that are handled by combining key transforms
        if (rule.key) {
          const keyId = this.getKeyId(rule.key);
          const modifiers = this.getModifierString(rule.key);
          const keyWithMods = `${keyId}:${modifiers}`;
          if (this.combiningKeys.has(keyWithMods) && rule.context.length > 0) {
            continue; // Already handled
          }
        }

        // Rules with any(store) as key
        if (rule.key?.anyStoreName) {
          const analyzed = this.analyzeRuleForSetMapping(rule);
          if (analyzed.canUseSetMapping) {
            const from = this.generateSetMappingPattern(rule, analyzed.setMappings);
            const to = this.generateSetMappingOutput(rule, analyzed.setMappings);
            if (from && to) {
              xml += `${this.indent}${this.indent}${this.indent}<transform from="${this.escapeXml(from)}" to="${this.escapeXml(to)}"/>\n`;
            }
          } else {
            const from = this.ruleContextToPattern(rule);
            const to = this.getOutputString(rule.output);
            if (from && to) {
              xml += `${this.indent}${this.indent}${this.indent}<transform from="${this.escapeXml(from)}" to="${this.escapeXml(to)}"/>\n`;
            }
          }
        }
      }
    }

    return xml;
  }

  /**
   * Get a rule signature for deduplication
   */
  private getRuleSignature(rule: KmnRule): string {
    const contextStr = rule.context.map(e => JSON.stringify(e)).join(',');
    const keyStr = rule.key ? JSON.stringify(rule.key) : '';
    return `${contextStr}|${keyStr}`;
  }

  /**
   * Group rules by their set mapping pattern signature
   */
  private groupRulesBySetMappingPattern(
    analyzedRules: AnalyzedRule[]
  ): Map<string, { canUseSetMapping: boolean; rules: AnalyzedRule[] }> {
    const groups = new Map<string, { canUseSetMapping: boolean; rules: AnalyzedRule[] }>();

    for (const analyzed of analyzedRules) {
      if (!analyzed.canUseSetMapping || analyzed.setMappings.length === 0) continue;

      // Create a signature for the set mapping pattern
      const signature = analyzed.setMappings
        .map(m => `${m.inputStore}:${m.outputStore}:${m.contextPosition}`)
        .sort()
        .join('|');

      // Also include non-any context elements in signature
      let contextSignature = '';
      for (const elem of analyzed.rule.context) {
        if (elem.type === 'char') {
          contextSignature += elem.value;
        } else if (elem.type === 'deadkey') {
          contextSignature += `\\m{${elem.name}}`;
        } else if (elem.type === 'any') {
          contextSignature += '$[]'; // Placeholder for any
        }
      }

      const fullSignature = `${contextSignature}||${signature}`;

      if (!groups.has(fullSignature)) {
        groups.set(fullSignature, { canUseSetMapping: true, rules: [] });
      }
      groups.get(fullSignature)!.rules.push(analyzed);
    }

    return groups;
  }

  /**
   * Convert rule context to transform pattern (without set mapping)
   */
  private ruleContextToPattern(rule: KmnRule): string | null {
    let pattern = '';

    for (const elem of rule.context) {
      switch (elem.type) {
        case 'char':
          pattern += elem.value;
          break;
        case 'deadkey':
          pattern += `\\m{${elem.name}}`;
          break;
        case 'any':
          pattern += `$[${elem.storeName}]`;
          break;
        // Handle other context types
      }
    }

    // Handle key
    if (rule.key) {
      if (rule.key.anyStoreName) {
        // any(store) as key
        pattern += `$[${rule.key.anyStoreName}]`;
      } else {
        // Find what this key outputs
        const keyId = this.getKeyId(rule.key);
        if (keyId) {
          const key = this.keys.get(keyId);
          const modifiers = this.getModifierString(rule.key);
          const output = key?.outputs.get(modifiers);
          if (output) {
            pattern += output;
          }
        }
      }
    }

    return pattern || null;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

/**
 * Internal key definition with outputs per modifier
 */
interface LdmlKey {
  id: string;
  outputs: Map<string, string>;
}

/**
 * Convenience function to convert KMN to LDML
 */
export function generateLdml(keyboard: KmnKeyboard, options?: LdmlGeneratorOptions): string {
  const generator = new LdmlGenerator(options);
  return generator.generate(keyboard);
}
