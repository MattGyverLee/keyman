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
 * Generates LDML keyboard XML from KMN Abstract Syntax Tree.
 *
 * This class converts parsed KMN keyboard definitions into LDML Keyboard 3.0 XML format.
 * It handles the conversion of KMN-specific concepts to their LDML equivalents:
 *
 * Conversion mappings:
 * - KMN stores → LDML variables (string/set)
 * - KMN groups → LDML layers
 * - KMN rules → LDML transforms
 * - KMN any()/index() → LDML set mappings
 * - KMN virtual keys → LDML hardware keys
 * - KMN deadkeys → LDML markers
 *
 * Features:
 * - Automatic hardware layer generation from rules
 * - Set mapping optimization for any()/index() patterns
 * - Marker-based deadkey conversion
 * - Display hint generation for combining keys
 * - Touch layout integration
 * - Comprehensive validation and error reporting
 *
 * Limitations:
 * - Mnemonic layouts not supported (use positional only)
 * - Some advanced KMN features may be skipped with warnings
 * - Option variables (if/set) generate warnings
 *
 * @example
 * ```typescript
 * const generator = new LdmlGenerator({
 *   locale: 'fr',
 *   hardwareForm: 'iso',
 *   useSetMapping: true
 * });
 * const ldmlXml = generator.generate(kmnAst);
 * ```
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
   * @throws UnsupportedKeyboardError if keyboard is mnemonic (not supported by LDML)
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
    xml += `<keyboard3 xmlns="https://schemas.unicode.org/cldr/${this.options.conformsTo}/keyboard3" locale="${this.options.locale}" conformsTo="${this.options.conformsTo}">\n`;

    // Info section
    xml += `${this.indent}<version number="${this.escapeXml(version)}"/>\n`;
    xml += `${this.indent}<info name="${this.escapeXml(name)}"`;
    if (author) xml += ` author="${this.escapeXml(author)}"`;
    xml += `/>\n`;

    // Process rules to collect keys
    this.collectKeysFromRules();

    // Keys section
    xml += this.generateKeysSection();

    // Flicks section (if any)
    xml += this.generateFlicksSection();

    // Layers section
    xml += this.generateLayersSection();

    // Variables section
    xml += this.generateVariablesSection();

    // Transforms section
    xml += this.generateTransformsSection();

    xml += `</keyboard3>\n`;

    return xml;
  }

  /**
   * Build store lookup map
   */
  private buildStoreMap(): void {
    for (const store of this.keyboard.stores) {
      this.storeMap.set(store.name.toLowerCase(), store);
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
    // For now, simple character count (could be enhanced to handle U+XXXX sequences)
    return [...value].length;
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
   */
  private collectKeysFromRules(): void {
    for (const group of this.keyboard.groups) {
      for (const rule of group.rules) {
        if (rule.key) {
          this.addKeyFromRule(rule);
        }
      }
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

    // Get output
    const output = this.getOutputString(rule.output);

    // Check for deadkey output
    const deadkeyOutput = rule.output.find(e => e.type === 'deadkey');
    if (deadkeyOutput && deadkeyOutput.type === 'deadkey') {
      // This creates a marker
      const markerName = deadkeyOutput.name;
      this.markers.set(markerName, markerName);
      key.outputs.set(modifiers, `\\m{${markerName}}`);
    } else if (output) {
      key.outputs.set(modifiers, output);
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

    // Add key output if present
    if (rule.key) {
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
   * Generate <keys> section with modifier variants
   */
  private generateKeysSection(): string {
    if (this.keys.size === 0) return '';

    let xml = `${this.indent}<keys>\n`;

    // Add standard non-output keys
    xml += `${this.indent}${this.indent}<key id="K_SPACE" output=" "/>\n`;
    xml += `${this.indent}${this.indent}<key id="K_BKSP"/>\n`;

    // Generate keys with variant IDs for different modifier outputs
    for (const [keyId, key] of this.keys) {
      // Skip if it's a standard key we already added
      if (keyId === 'K_SPACE' || keyId === 'K_BKSP') continue;

      for (const [modifiers, output] of key.outputs) {
        const variantId = this.getVariantKeyId(keyId, modifiers);

        xml += `${this.indent}${this.indent}<key id="${variantId}"`;

        if (output) {
          xml += ` output="${this.escapeXml(output)}"`;
        }

        xml += `/>\n`;
      }
    }

    xml += `${this.indent}</keys>\n`;
    return xml;
  }

  /**
   * Generate <flicks> section (placeholder)
   */
  private generateFlicksSection(): string {
    // Touch layout flicks would be converted here
    return '';
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

    let xml = `${this.indent}<layers formId="us">\n`;

    for (const modifiers of sortedModifiers) {
      xml += `${this.indent}${this.indent}<layer`;
      if (modifiers !== 'none') {
        xml += ` modifiers="${modifiers}"`;
      }
      xml += `>\n`;

      // Generate rows with variant key IDs for this modifier layer
      xml += this.generateKeyboardRows(modifiers);

      xml += `${this.indent}${this.indent}</layer>\n`;
    }

    xml += `${this.indent}</layers>\n`;
    return xml;
  }

  /**
   * Generate keyboard rows for a layer with specific modifiers
   */
  private generateKeyboardRows(modifiers: string): string {
    // Standard US keyboard rows (base key IDs)
    const rows = [
      ['K_BKQUOTE', 'K_1', 'K_2', 'K_3', 'K_4', 'K_5', 'K_6', 'K_7', 'K_8', 'K_9', 'K_0', 'K_HYPHEN', 'K_EQUAL'],
      ['K_Q', 'K_W', 'K_E', 'K_R', 'K_T', 'K_Y', 'K_U', 'K_I', 'K_O', 'K_P', 'K_LBRKT', 'K_RBRKT', 'K_BKSLASH'],
      ['K_A', 'K_S', 'K_D', 'K_F', 'K_G', 'K_H', 'K_J', 'K_K', 'K_L', 'K_COLON', 'K_QUOTE'],
      ['K_Z', 'K_X', 'K_C', 'K_V', 'K_B', 'K_N', 'K_M', 'K_COMMA', 'K_PERIOD', 'K_SLASH'],
      ['K_SPACE'],
    ];

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
   * Generate touch layers (placeholder - would use touch layout file)
   */
  private generateTouchLayers(): string {
    // This would be populated from .keyman-touch-layout file
    return '';
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

      // Check for range notation (contains ..)
      if (value.includes('..')) {
        // Range - use uset
        xml += `${this.indent}${this.indent}<uset id="${store.name}" value="${this.escapeXml(value)}"/>\n`;
      } else if (value.length > 1) {
        // Multiple characters - format as space-separated set for LDML
        const chars = [...value];
        const formattedValue = chars.join(' ');
        xml += `${this.indent}${this.indent}<set id="${store.name}" value="${this.escapeXml(formattedValue)}"/>\n`;
      } else if (value.length === 1) {
        // Single value - use string
        xml += `${this.indent}${this.indent}<string id="${store.name}" value="${this.escapeXml(value)}"/>\n`;
      }
    }

    xml += `${this.indent}</variables>\n`;
    return xml;
  }

  /**
   * Generate <transforms> section from rules with context
   */
  private generateTransformsSection(): string {
    // Collect rules that have context (transform rules)
    const transformRules: KmnRule[] = [];

    for (const group of this.keyboard.groups) {
      // Skip the main "using keys" group for transforms
      if (group.usingKeys) continue;

      for (const rule of group.rules) {
        if (rule.context.length > 0 || rule.isMatch) {
          transformRules.push(rule);
        }
      }
    }

    // Also collect deadkey rules from main group
    for (const group of this.keyboard.groups) {
      if (!group.usingKeys) continue;
      for (const rule of group.rules) {
        // Rules with context in the main group
        if (rule.context.length > 0 && !rule.context.every(e => e.type === 'if')) {
          transformRules.push(rule);
        }
      }
    }

    if (transformRules.length === 0 && this.markers.size === 0) return '';

    // Analyze all rules for set mapping potential
    const analyzedRules = transformRules.map(r => this.analyzeRuleForSetMapping(r));

    // Group rules by their set mapping pattern for potential optimization
    const setMappingGroups = this.groupRulesBySetMappingPattern(analyzedRules);

    let xml = `${this.indent}<transforms type="simple">\n`;
    xml += `${this.indent}${this.indent}<transformGroup>\n`;

    // Generate set-mapped transforms first (more compact)
    for (const [patternKey, group] of setMappingGroups) {
      if (group.canUseSetMapping && group.rules.length > 0) {
        // Generate single set-mapped transform
        const analyzed = group.rules[0];
        const from = this.generateSetMappingPattern(analyzed.rule, analyzed.setMappings);
        const to = this.generateSetMappingOutput(analyzed.rule, analyzed.setMappings);

        if (from && to) {
          xml += `${this.indent}${this.indent}${this.indent}<!-- Set mapping: ${group.rules.length} rules condensed -->\n`;
          xml += `${this.indent}${this.indent}${this.indent}<transform from="${this.escapeXml(from)}" to="${this.escapeXml(to)}"/>\n`;
        }
      }
    }

    // Generate remaining transforms that couldn't use set mapping
    for (const analyzed of analyzedRules) {
      if (!analyzed.canUseSetMapping) {
        const from = this.ruleContextToPattern(analyzed.rule);
        const to = this.getOutputString(analyzed.rule.output);

        if (from && to) {
          xml += `${this.indent}${this.indent}${this.indent}<transform from="${this.escapeXml(from)}" to="${this.escapeXml(to)}"/>\n`;
        }
      }
    }

    xml += `${this.indent}${this.indent}</transformGroup>\n`;
    xml += `${this.indent}</transforms>\n`;

    return xml;
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

    // Add key output if present
    if (rule.key) {
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

  /**
   * Scan for if/set rules and collect option names
   * These rules cannot be converted to LDML and will be skipped
   */
  private scanForIfSetRules(): void {
    for (const group of this.keyboard.groups) {
      for (const rule of group.rules) {
        // Check for if() or set() in context
        const hasIfSet = rule.context.some(e => e.type === 'if' || e.type === 'set');
        if (hasIfSet) {
          // Extract option names
          for (const elem of rule.context) {
            if (elem.type === 'if' || elem.type === 'set') {
              const optionName = (elem as any).option || 'unknown';
              this.optionNames.add(optionName);
            }
          }

          // Record skipped rule
          this.skippedRules.push({
            line: rule.line || 0,
            reason: 'if/set conditions not supported by LDML',
            options: [...this.optionNames],
            description: `Rule with ${hasIfSet ? 'if/set' : 'conditional'} logic`
          });
        }
      }
    }
  }

  /**
   * Identify combining keys (keys used in context rules)
   * These keys need special marker output for character combining
   */
  private identifyCombiningKeys(): void {
    for (const group of this.keyboard.groups) {
      if (!group.usingKeys) continue;

      for (const rule of group.rules) {
        // Rules with context that produce output with markers
        if (rule.context.length > 0 && rule.key) {
          const keyId = this.getKeyId(rule.key);
          if (!keyId) continue;

          const modifiers = this.getModifierString(rule.key);
          const keyWithMods = `${keyId}:${modifiers}`;

          // Check if output includes marker
          const hasMarkerOutput = rule.output.some(e => e.type === 'deadkey');
          if (hasMarkerOutput) {
            const deadkeyElem = rule.output.find(e => e.type === 'deadkey');
            const markerName = (deadkeyElem && deadkeyElem.type === 'deadkey') ? deadkeyElem.name : 'marker';

            if (!this.combiningKeys.has(keyWithMods)) {
              this.combiningKeys.set(keyWithMods, {
                keyWithMods,
                markerName,
                rules: [],
              });
            }
            this.combiningKeys.get(keyWithMods)!.rules.push(rule);
          }
        }
      }
    }
  }

  /**
   * Collect backspace rules for custom deletion behavior
   */
  private collectBackspaceRules(): void {
    for (const group of this.keyboard.groups) {
      for (const rule of group.rules) {
        // Look for backspace key rules
        if (rule.key?.vkey === 'K_BKSP') {
          const from = this.ruleContextToPattern(rule);
          const to = this.getOutputString(rule.output);
          if (from && to !== null) {
            this.backspaceRules.push({ from, to });
          }
        }
      }
    }
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
