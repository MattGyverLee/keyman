/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Compiles a LDML keyboard to JavaScript for KeymanWeb (mobile/web platforms)
 *
 * REFACTORED VERSION - Clean, maintainable architecture with separated concerns
 */

import { LdmlKeyboardTypes } from '@keymanapp/common-types';
import { CompilerCallbacks, LDMLKeyboard } from '@keymanapp/developer-utils';
import { LdmlCompilerOptions } from './ldml-compiler-options.js';
import { JavaScriptBuilder } from './javascript-builder.js';
import { HardwareLayoutRegistry, HardwareForm } from './hardware-layout-registry.js';
import { VariableExpander } from './variable-expander.js';
import { KeySubKeyFactory } from './key-subkey-factory.js';
import { TouchLayoutCompiler } from './touch-layout-compiler.js';
import { TransformCompiler } from './transform-compiler.js';

import LKKeyboard = LDMLKeyboard.LKKeyboard;
import LKKey = LDMLKeyboard.LKKey;
import LKFlick = LDMLKeyboard.LKFlick;
import LKVariables = LDMLKeyboard.LKVariables;

/**
 * Compiles LDML keyboard XML to JavaScript for KeymanWeb (mobile/web platforms).
 *
 * This compiler transforms LDML keyboard specifications into JavaScript code that can
 * be executed by KeymanWeb on mobile and web platforms. It generates:
 * - Touch layouts (KVKL) for on-screen keyboards
 * - Hardware layer definitions (KLS) for physical keyboard support
 * - Transform functions (gs/gbs) for text processing and reordering
 * - Variable and marker data structures for runtime use
 *
 * Architecture:
 * The compiler uses a modular architecture with separated concerns:
 * - {@link JavaScriptBuilder}: Clean code generation with proper indentation
 * - {@link HardwareLayoutRegistry}: Centralized VK code mappings for different keyboard forms
 * - {@link VariableExpander}: Handles marker and variable expansion in patterns
 * - {@link KeySubKeyFactory}: Creates touch layout keys and subkeys
 * - {@link TouchLayoutCompiler}: Generates complete touch layouts with gestures
 * - {@link TransformCompiler}: Compiles transform rules and reorder logic
 *
 * @example
 * ```typescript
 * const compiler = new LdmlKeyboardKeymanWebCompiler(callbacks, options);
 * const jsCode = compiler.compile(ldmlKeyboard, 'my_keyboard');
 * ```
 */
export class LdmlKeyboardKeymanWebCompiler {
  private readonly options: LdmlCompilerOptions;
  private readonly callbacks: CompilerCallbacks;

  // Component instances
  private expander: VariableExpander | null = null;
  private keyFactory: KeySubKeyFactory | null = null;
  private touchCompiler: TouchLayoutCompiler | null = null;
  private transformCompiler: TransformCompiler | null = null;

  // Data caches
  private keyBag: Map<string, LKKey> = new Map();
  private flickBag: Map<string, LKFlick> = new Map();
  private variables: LKVariables | null = null;
  private markerMap: Map<string, number> = new Map();

  constructor(callbacks: CompilerCallbacks, options: LdmlCompilerOptions) {
    this.callbacks = callbacks;
    this.options = options;
  }

  /**
   * Compile LDML keyboard to JavaScript string for KeymanWeb.
   *
   * This method orchestrates the complete compilation process:
   * 1. Builds lookup caches for keys, flicks, markers, and variables
   * 2. Initializes component instances (expander, factory, compilers)
   * 3. Generates touch layout (KVKL) from touch or hardware layers
   * 4. Generates hardware layer strings (KLS) for physical keyboard support
   * 5. Generates transform functions for text processing
   * 6. Assembles all components into a complete JavaScript keyboard file
   *
   * @param keyboard - The parsed LDML keyboard specification
   * @param keyboardId - The keyboard identifier (e.g., "sil_cameroon_qwerty")
   *                     Used to generate the JavaScript function name
   * @returns JavaScript string containing the complete keyboard implementation,
   *          or null if compilation fails
   */
  public compile(keyboard: LKKeyboard, keyboardId: string): string | null {
    // Build lookup caches
    this.buildKeyBag(keyboard);
    this.buildFlickBag(keyboard);
    this.buildMarkerMap(keyboard);
    this.variables = keyboard.variables || null;

    // Initialize component instances
    this.expander = new VariableExpander(this.variables, this.markerMap);
    this.keyFactory = new KeySubKeyFactory(this.keyBag, this.expander);
    this.touchCompiler = new TouchLayoutCompiler(this.keyFactory, this.keyBag, this.flickBag, this.callbacks);
    this.transformCompiler = new TransformCompiler(this.expander, this.variables, this.markerMap);

    // Create JavaScript builder
    const builder = new JavaScriptBuilder({ debug: this.options.saveDebug });

    // Extract metadata
    const name = keyboard.info?.name || keyboardId;
    const version = keyboard.version?.number || '1.0';
    const rtl = this.detectRTL(keyboard);
    const funcName = `Keyboard_${this.sanitizeId(keyboardId)}`;

    // Generate touch layout (KVKL)
    const kvkl = this.touchCompiler.generateTouchLayout(keyboard);
    const kvklJson = kvkl ? JSON.stringify(kvkl) : 'null';

    // Generate hardware layer strings (KLS)
    const kls = this.generateHardwareLayerStrings(keyboard);
    const klsJson = kls ? JSON.stringify(kls) : 'null';

    // Build the JavaScript output
    // Prolog
    builder.append(`KeymanWeb.KR(new ${funcName}());`);
    builder.openBlock(`function ${funcName}()`);

    // Metadata properties
    builder.append(`this.KI="${funcName}";`);
    builder.append(`this.KN="${this.escapeString(name)}";`);
    builder.append(`this.KBVER="${version}";`);
    builder.append('this.KMBM=0x0010;'); // Default modifier bitmask
    builder.append('this.KV=null;'); // Visual keyboard (desktop)
    builder.append('this.KDU=0;'); // Display underlying

    if (rtl) {
      builder.append('this.KRTL=1;');
    }

    // Touch layout
    if (kvkl) {
      builder.append(`this.KVKL=${kvklJson};`);
    }

    // Hardware layer strings (for hardware keyboard support)
    if (kls) {
      builder.append(`this.KLS=${klsJson};`);
    }

    // Generate variables as data
    const varsData = this.generateVariablesData(keyboard, builder);
    if (varsData) {
      builder.appendRaw(varsData);
    }

    // Generate marker data
    const markerData = this.generateMarkerData(builder);
    if (markerData) {
      builder.appendRaw(markerData);
    }

    // Generate transforms as gs() function
    this.transformCompiler.generateTransformFunction(keyboard, builder);

    // Generate backspace transforms as gbs() function
    this.transformCompiler.generateBackspaceFunction(keyboard, builder);

    // Close the function
    builder.closeBlock();

    return builder.toString();
  }

  /**
   * Detect if keyboard uses right-to-left (RTL) text direction.
   *
   * Checks the keyboard's locale against a list of known RTL language codes.
   * This information is used to set the KRTL property in the generated JavaScript.
   *
   * @param keyboard - The LDML keyboard specification
   * @returns true if the keyboard should use RTL text direction
   */
  private detectRTL(keyboard: LKKeyboard): boolean {
    // Check locale for RTL scripts
    const locale = keyboard.locale || '';
    const rtlLocales = ['ar', 'he', 'fa', 'ur', 'yi', 'ps', 'sd', 'ug', 'ku', 'ckb'];
    const primaryLocale = locale.split('-')[0].toLowerCase();
    return rtlLocales.includes(primaryLocale);
  }

  /**
   * Build a lookup map of key definitions by ID for fast access.
   *
   * Creates an index of all key elements from the LDML keyboard specification,
   * allowing O(1) lookup by key ID during layout generation and compilation.
   *
   * @param keyboard - The LDML keyboard specification
   */
  private buildKeyBag(keyboard: LKKeyboard): void {
    this.keyBag.clear();
    if (keyboard.keys?.key) {
      for (const key of keyboard.keys.key) {
        if (key.id) {
          this.keyBag.set(key.id, key);
        }
      }
    }
  }

  /**
   * Build a lookup map of flick gesture definitions by ID for fast access.
   *
   * Creates an index of all flick gesture elements from the LDML keyboard,
   * allowing efficient lookup when processing keys that reference flick gestures.
   *
   * @param keyboard - The LDML keyboard specification
   */
  private buildFlickBag(keyboard: LKKeyboard): void {
    this.flickBag.clear();
    if (keyboard.flicks?.flick) {
      for (const flick of keyboard.flicks.flick) {
        if (flick.id) {
          this.flickBag.set(flick.id, flick);
        }
      }
    }
  }

  /**
   * Build marker name to index mapping from transforms and key outputs.
   *
   * Scans the entire keyboard specification to find all marker references and assigns
   * them sequential indices starting from 1 (as per LDML spec). These indices are used
   * in the generated JavaScript to represent markers as sentinel values in the text.
   *
   * Markers are special placeholders in LDML that can be used in transforms to match
   * or insert invisible position markers in the text buffer.
   *
   * @param keyboard - The LDML keyboard specification
   */
  private buildMarkerMap(keyboard: LKKeyboard): void {
    this.markerMap.clear();
    const markers = new Set<string>();

    // Collect all marker references from transforms
    for (const transforms of keyboard.transforms || []) {
      for (const group of transforms.transformGroup || []) {
        for (const transform of group.transform || []) {
          // Find markers in from and to patterns
          const fromMarkers = LdmlKeyboardTypes.MarkerParser.allReferences(transform.from || '');
          const toMarkers = LdmlKeyboardTypes.MarkerParser.allReferences(transform.to || '');
          for (const m of [...fromMarkers, ...toMarkers]) {
            if (m !== '.') { // Skip wildcard marker
              markers.add(m);
            }
          }
        }
      }
    }

    // Collect markers from key outputs
    for (const key of keyboard.keys?.key || []) {
      const outputMarkers = LdmlKeyboardTypes.MarkerParser.allReferences(key.output || '');
      for (const m of outputMarkers) {
        if (m !== '.') {
          markers.add(m);
        }
      }
    }

    // Assign indices (1-based to match LDML spec)
    let index = 1;
    for (const marker of Array.from(markers).sort()) {
      this.markerMap.set(marker, index++);
    }
  }

  /**
   * Generate JavaScript code for variables data structures.
   *
   * Converts LDML variable definitions (string, set, uset) into JavaScript objects
   * that can be accessed at runtime by the transform functions. Variables are stored
   * as properties on the keyboard object:
   * - this._vs: string variables (as object with name -> value mapping)
   * - this._vset: set variables (as object with name -> array mapping)
   * - this._vuset: Unicode set variables (as object with name -> regex string mapping)
   *
   * @param keyboard - The LDML keyboard specification
   * @param builder - The JavaScript builder to append code to
   * @returns Generated JavaScript code string, or empty string if no variables
   */
  private generateVariablesData(keyboard: LKKeyboard, builder: JavaScriptBuilder): string {
    if (!this.variables) return '';

    let result = '';
    const tab = builder.tab;
    const nl = builder.nl;

    // Generate string variables
    const strings: Record<string, string> = {};
    for (const s of this.variables.string || []) {
      strings[s.id] = s.value;
    }
    if (Object.keys(strings).length > 0) {
      result += `${tab}this._vs=${JSON.stringify(strings)};${nl}`;
    }

    // Generate set variables (as arrays)
    const sets: Record<string, string[]> = {};
    for (const s of this.variables.set || []) {
      sets[s.id] = LdmlKeyboardTypes.VariableParser.setSplitter(s.value);
    }
    if (Object.keys(sets).length > 0) {
      result += `${tab}this._vset=${JSON.stringify(sets)};${nl}`;
    }

    // Generate uset variables (as regex strings)
    const usets: Record<string, string> = {};
    for (const s of this.variables.uset || []) {
      usets[s.id] = s.value;
    }
    if (Object.keys(usets).length > 0) {
      result += `${tab}this._vuset=${JSON.stringify(usets)};${nl}`;
    }

    return result;
  }

  /**
   * Generate JavaScript code for marker data structure.
   *
   * Converts the marker map into a JavaScript object (this._mk) that maps
   * marker names to their assigned indices. This allows runtime code to
   * access marker indices by name.
   *
   * @param builder - The JavaScript builder to append code to
   * @returns Generated JavaScript code string, or empty string if no markers
   */
  private generateMarkerData(builder: JavaScriptBuilder): string {
    if (this.markerMap.size === 0) return '';

    const markers: Record<string, number> = {};
    this.markerMap.forEach((index, name) => {
      markers[name] = index;
    });

    const tab = builder.tab;
    const nl = builder.nl;
    return `${tab}this._mk=${JSON.stringify(markers)};${nl}`;
  }

  /**
   * Generate hardware layer strings (KLS) from LDML hardware layers.
   *
   * Converts hardware keyboard layer definitions into the KLS format expected by
   * KeymanWeb. The KLS structure maps layer IDs to arrays of 65 output strings,
   * where each index corresponds to a specific virtual key code position.
   *
   * This enables hardware keyboard support by defining what each physical key outputs
   * in different modifier states (base, shift, alt, etc.).
   *
   * @param keyboard - The LDML keyboard specification
   * @returns Object mapping layer IDs to string arrays, or null if no hardware layers
   */
  private generateHardwareLayerStrings(keyboard: LKKeyboard): Record<string, string[]> | null {
    const hardwareLayers = keyboard.layers?.filter(l => l.formId !== 'touch');
    if (!hardwareLayers || hardwareLayers.length === 0) {
      return null;
    }

    const kls: Record<string, string[]> = {};

    for (const layers of hardwareLayers) {
      const formId = (layers.formId || 'us') as HardwareForm;
      const formLayout = HardwareLayoutRegistry.getLayout(formId);

      for (const layer of layers.layer || []) {
        const layerId = this.mapLayerId(layer.id, layer.modifiers);

        // Initialize with 65 empty strings (standard keyboard key count)
        const layerStrings: string[] = new Array(65).fill('');

        // Map keys to VK positions
        for (let rowIndex = 0; rowIndex < (layer.row || []).length; rowIndex++) {
          const row = layer.row[rowIndex];
          const keyIds = (row.keys || '').trim().split(/\s+/);
          const vkRow = formLayout.rows[rowIndex] || [];

          for (let colIndex = 0; colIndex < keyIds.length; colIndex++) {
            const keyId = keyIds[colIndex];
            const vk = vkRow[colIndex];

            if (keyId && vk !== undefined) {
              const keyDef = this.keyBag.get(keyId);
              if (keyDef?.output && this.expander) {
                // Map VK to KLS index (VK codes are not sequential)
                const klsIndex = HardwareLayoutRegistry.vkToKlsIndex(vk);
                if (klsIndex >= 0 && klsIndex < 65) {
                  layerStrings[klsIndex] = this.expander.convertMarkersToOutput(keyDef.output);
                }
              }
            }
          }
        }

        kls[layerId] = layerStrings;
      }
    }

    return Object.keys(kls).length > 0 ? kls : null;
  }

  /**
   * Map LDML layer id/modifiers to KeymanWeb layer id.
   *
   * Translates LDML layer identifiers and modifier combinations into the
   * standardized layer IDs expected by KeymanWeb (e.g., 'default', 'shift',
   * 'rightalt', 'rightalt-shift'). Custom layer IDs are passed through unchanged.
   *
   * @param id - The LDML layer ID
   * @param modifiers - Space-separated list of modifiers (e.g., 'shift', 'alt')
   * @returns KeymanWeb layer identifier
   */
  private mapLayerId(id: string, modifiers: string): string {
    // Handle common mappings
    if (id === 'base' && (!modifiers || modifiers === '')) {
      return 'default';
    }
    if (modifiers?.includes('shift') && !modifiers?.includes('alt')) {
      return 'shift';
    }
    if (modifiers?.includes('alt') && !modifiers?.includes('shift')) {
      return 'rightalt';
    }
    if (modifiers?.includes('alt') && modifiers?.includes('shift')) {
      return 'rightalt-shift';
    }
    // Return the id as-is for custom layers
    return id || 'default';
  }

  /**
   * Escape a string for safe inclusion in JavaScript string literals.
   *
   * Handles special characters, control characters, and ensures the resulting
   * string can be safely embedded in double-quoted JavaScript strings.
   *
   * @param s - The string to escape
   * @returns Escaped string safe for JavaScript
   */
  private escapeString(s: string): string {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x1f]/g, (c) => `\\x${c.charCodeAt(0).toString(16).padStart(2, '0')}`);
  }

  /**
   * Sanitize an ID for use as a JavaScript identifier.
   *
   * Replaces all non-alphanumeric characters (except underscore) with underscores
   * to ensure the resulting string is a valid JavaScript identifier.
   *
   * @param id - The ID to sanitize
   * @returns Sanitized identifier safe for use in JavaScript
   */
  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }
}
