/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Compiles a LDML keyboard to JavaScript for KeymanWeb (mobile/web platforms)
 */

import { TouchLayout, KMXPlus, LdmlKeyboardTypes } from '@keymanapp/common-types';
import { CompilerCallbacks, LDMLKeyboard } from '@keymanapp/developer-utils';
import { LdmlCompilerOptions } from './ldml-compiler-options.js';

import LKKeyboard = LDMLKeyboard.LKKeyboard;
import LKKey = LDMLKeyboard.LKKey;
import LKFlick = LDMLKeyboard.LKFlick;
import LKLayers = LDMLKeyboard.LKLayers;
import LKLayer = LDMLKeyboard.LKLayer;
import LKRow = LDMLKeyboard.LKRow;
import LKTransforms = LDMLKeyboard.LKTransforms;
import LKTransformGroup = LDMLKeyboard.LKTransformGroup;
import LKTransform = LDMLKeyboard.LKTransform;
import LKVariables = LDMLKeyboard.LKVariables;

import TouchLayoutFile = TouchLayout.TouchLayoutFile;
import TouchLayoutPlatform = TouchLayout.TouchLayoutPlatform;
import TouchLayoutLayer = TouchLayout.TouchLayoutLayer;
import TouchLayoutRow = TouchLayout.TouchLayoutRow;
import TouchLayoutKey = TouchLayout.TouchLayoutKey;
import TouchLayoutSubKey = TouchLayout.TouchLayoutSubKey;
import TouchLayoutFlick = TouchLayout.TouchLayoutFlick;

/**
 * Hardware form types with their scancode-to-VK mappings
 */
type HardwareForm = 'us' | 'iso' | 'jis' | 'abnt2' | 'ks';

/**
 * Scancode to virtual key mapping for different hardware forms
 * Maps row index (0-4) and column index to VK codes
 */
interface HardwareFormLayout {
  formId: HardwareForm;
  rows: number[][]; // VK codes for each key position
}

/**
 * Compiled transform rule
 */
interface CompiledTransform {
  pattern: string;  // Compiled regex pattern
  replacement: string;  // Replacement string
  mapFrom?: string; // Set name for capture group mapping
  mapTo?: string;   // Set name for output mapping
}

/**
 * Compiles LDML keyboard XML to JavaScript for KeymanWeb
 */
export class LdmlKeyboardKeymanWebCompiler {
  private readonly callbacks: CompilerCallbacks;
  private readonly options: LdmlCompilerOptions;

  // Cache of key definitions for lookup
  private keyBag: Map<string, LKKey> = new Map();
  // Cache of flick definitions for lookup
  private flickBag: Map<string, LKFlick> = new Map();
  // Variable definitions cache
  private variables: LKVariables | null = null;
  // Marker name to index mapping
  private markerMap: Map<string, number> = new Map();

  constructor(callbacks: CompilerCallbacks, options: LdmlCompilerOptions) {
    this.callbacks = callbacks;
    this.options = options;
  }

  /**
   * Compile LDML keyboard to JavaScript string
   * @param keyboard - The parsed LDML keyboard
   * @param keyboardId - The keyboard identifier (e.g., "sil_cameroon_qwerty")
   * @returns JavaScript string or null on error
   */
  public compile(keyboard: LKKeyboard, keyboardId: string): string | null {
    // Build lookup caches
    this.buildKeyBag(keyboard);
    this.buildFlickBag(keyboard);
    this.buildMarkerMap(keyboard);
    this.variables = keyboard.variables || null;

    const debug = this.options.saveDebug;
    const nl = debug ? '\n' : '';
    const tab = debug ? '  ' : '';

    // Extract metadata
    const name = keyboard.info?.name || keyboardId;
    const version = keyboard.version?.number || '1.0';
    const rtl = this.detectRTL(keyboard);

    // Build the keyboard function name
    const funcName = `Keyboard_${this.sanitizeId(keyboardId)}`;

    // Generate touch layout (KVKL)
    const kvkl = this.generateTouchLayout(keyboard);
    const kvklJson = kvkl ? JSON.stringify(kvkl) : 'null';

    // Generate hardware layer strings (KLS)
    const kls = this.generateHardwareLayerStrings(keyboard);
    const klsJson = kls ? JSON.stringify(kls) : 'null';

    // Build the JavaScript output
    let result = '';

    // Prolog
    result += `KeymanWeb.KR(new ${funcName}());${nl}`;
    result += `function ${funcName}() {${nl}`;

    // Metadata properties
    result += `${tab}this.KI="${funcName}";${nl}`;
    result += `${tab}this.KN="${this.escapeString(name)}";${nl}`;
    result += `${tab}this.KBVER="${version}";${nl}`;
    result += `${tab}this.KMBM=0x0010;${nl}`; // Default modifier bitmask
    result += `${tab}this.KV=null;${nl}`; // Visual keyboard (desktop)
    result += `${tab}this.KDU=0;${nl}`; // Display underlying

    if (rtl) {
      result += `${tab}this.KRTL=1;${nl}`;
    }

    // Touch layout
    if (kvkl) {
      result += `${tab}this.KVKL=${kvklJson};${nl}`;
    }

    // Hardware layer strings (for hardware keyboard support)
    if (kls) {
      result += `${tab}this.KLS=${klsJson};${nl}`;
    }

    // Generate variables as data
    const varsData = this.generateVariablesData(keyboard, tab, nl);
    if (varsData) {
      result += varsData;
    }

    // Generate marker data
    const markerData = this.generateMarkerData(tab, nl);
    if (markerData) {
      result += markerData;
    }

    // Generate transforms as gs() function
    const gsFunction = this.generateTransformFunction(keyboard, tab, nl);
    result += gsFunction;

    // Generate backspace transforms as gbs() function
    const gbsFunction = this.generateBackspaceFunction(keyboard, tab, nl);
    if (gbsFunction) {
      result += gbsFunction;
    }

    // Close the function
    result += `}${nl}`;

    return result;
  }

  /**
   * Detect RTL from locale or keyboard settings
   */
  private detectRTL(keyboard: LKKeyboard): boolean {
    // Check locale for RTL scripts
    const locale = keyboard.locale || '';
    const rtlLocales = ['ar', 'he', 'fa', 'ur', 'yi', 'ps', 'sd', 'ug', 'ku', 'ckb'];
    const primaryLocale = locale.split('-')[0].toLowerCase();
    return rtlLocales.includes(primaryLocale);
  }

  /**
   * Build a lookup map of key definitions by ID
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
   * Build a lookup map of flick definitions by ID
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
   * Build marker name to index mapping from transforms
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
   * Generate variables data structure
   */
  private generateVariablesData(keyboard: LKKeyboard, tab: string, nl: string): string {
    if (!this.variables) return '';

    let result = '';

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
   * Generate marker data structure
   */
  private generateMarkerData(tab: string, nl: string): string {
    if (this.markerMap.size === 0) return '';

    const markers: Record<string, number> = {};
    for (const [name, index] of this.markerMap) {
      markers[name] = index;
    }

    return `${tab}this._mk=${JSON.stringify(markers)};${nl}`;
  }

  /**
   * Generate the TouchLayoutFile (KVKL) from LDML layers
   */
  private generateTouchLayout(keyboard: LKKeyboard): TouchLayoutFile | null {
    const touchLayers = keyboard.layers?.filter(l => l.formId === 'touch');
    if (!touchLayers || touchLayers.length === 0) {
      return null;
    }

    const result: TouchLayoutFile = {};

    // Generate layouts for different device widths
    for (const layers of touchLayers) {
      const minWidth = layers.minDeviceWidth || 0;
      const platform = this.generatePlatformLayout(layers, keyboard);

      // Map minDeviceWidth to platform
      // Typical values: phone < 400, tablet >= 400
      if (minWidth >= 400) {
        result.tablet = platform;
      } else {
        result.phone = platform;
      }
    }

    // If only one layout provided, copy to both platforms
    if (result.phone && !result.tablet) {
      result.tablet = result.phone;
    } else if (result.tablet && !result.phone) {
      result.phone = result.tablet;
    }

    return result;
  }

  /**
   * Generate a TouchLayoutPlatform from LDML layers
   */
  private generatePlatformLayout(layers: LKLayers, keyboard: LKKeyboard): TouchLayoutPlatform {
    const platformLayers: TouchLayoutLayer[] = [];

    for (const layer of layers.layer || []) {
      platformLayers.push(this.generateLayer(layer, keyboard));
    }

    return {
      font: 'Tahoma', // Default font, could be extracted from keyboard settings
      layer: platformLayers,
      defaultHint: 'longpress'
    };
  }

  /**
   * Generate a TouchLayoutLayer from an LDML layer
   */
  private generateLayer(layer: LKLayer, keyboard: LKKeyboard): TouchLayoutLayer {
    const rows: TouchLayoutRow[] = [];

    for (let rowIndex = 0; rowIndex < (layer.row || []).length; rowIndex++) {
      const row = layer.row[rowIndex];
      rows.push(this.generateRow(row, rowIndex + 1, keyboard));
    }

    // Map LDML layer id to touch layout id
    const layerId = this.mapLayerId(layer.id, layer.modifiers);

    return {
      id: layerId,
      row: rows
    };
  }

  /**
   * Map LDML layer id/modifiers to touch layout layer id
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
   * Generate a TouchLayoutRow from an LDML row
   */
  private generateRow(row: LKRow, rowId: number, keyboard: LKKeyboard): TouchLayoutRow {
    const keys: TouchLayoutKey[] = [];
    const keyIds = (row.keys || '').trim().split(/\s+/);

    for (const keyId of keyIds) {
      if (keyId) {
        keys.push(this.generateKey(keyId, keyboard));
      }
    }

    return {
      id: rowId,
      key: keys
    };
  }

  /**
   * Generate a TouchLayoutKey from an LDML key reference
   */
  private generateKey(keyId: string, keyboard: LKKeyboard): TouchLayoutKey {
    const keyDef = this.keyBag.get(keyId);

    if (!keyDef) {
      // Key not found in keybag - might be a special key or undefined
      return this.generateSpecialKey(keyId);
    }

    const result: TouchLayoutKey = {
      id: this.formatKeyId(keyId),
    };

    // Set the display text
    if (keyDef.output) {
      result.text = this.processKeyOutput(keyDef.output);
    }

    // Handle gap keys
    if (keyDef.gap) {
      result.sp = TouchLayout.TouchLayoutKeySp.spacer;
      result.width = (keyDef.width || 1) * 100; // Convert to percentage
      return result;
    }

    // Handle width
    if (keyDef.width && keyDef.width !== 1) {
      result.width = keyDef.width * 100; // Convert to percentage
    }

    // Handle layer switch
    if (keyDef.layerId) {
      result.nextlayer = this.mapLayerId(keyDef.layerId, '');
    }

    // Handle long press (subkeys)
    if (keyDef.longPressKeyIds) {
      result.sk = this.generateSubkeys(keyDef.longPressKeyIds, keyDef.longPressDefaultKeyId);
    }

    // Handle flicks
    if (keyDef.flickId) {
      result.flick = this.generateFlick(keyDef.flickId);
    }

    // Handle multitap
    if (keyDef.multiTapKeyIds) {
      result.multitap = this.generateMultitap(keyDef.multiTapKeyIds);
    }

    return result;
  }

  /**
   * Process key output - convert markers to internal format
   */
  private processKeyOutput(output: string): string {
    // Replace marker references with sentinel values
    return output.replace(LdmlKeyboardTypes.MarkerParser.REFERENCE, (match, name) => {
      if (name === '.') {
        // Wildcard marker - shouldn't be in output, return empty
        return '';
      }
      const index = this.markerMap.get(name);
      if (index !== undefined) {
        // Return sentinel + marker code + index
        return String.fromCharCode(0xFFFF, 0x0008, index);
      }
      return match; // Unknown marker, return as-is
    });
  }

  /**
   * Generate a special key (shift, backspace, etc.)
   */
  private generateSpecialKey(keyId: string): TouchLayoutKey {
    // Handle common special keys
    const specialKeys: Record<string, Partial<TouchLayoutKey>> = {
      'shift': { id: 'K_SHIFT', text: '*Shift*', sp: TouchLayout.TouchLayoutKeySp.special, nextlayer: 'shift' },
      'bksp': { id: 'K_BKSP', text: '*BkSp*', sp: TouchLayout.TouchLayoutKeySp.special },
      'space': { id: 'K_SPACE', text: '', width: 600 },
      'enter': { id: 'K_ENTER', text: '*Enter*', sp: TouchLayout.TouchLayoutKeySp.special },
      'numeric': { id: 'K_NUMLOCK', text: '*123*', sp: TouchLayout.TouchLayoutKeySp.special, nextlayer: 'numeric' },
      'menu': { id: 'K_LOPT', text: '*Menu*', sp: TouchLayout.TouchLayoutKeySp.special },
    };

    if (specialKeys[keyId]) {
      return specialKeys[keyId] as TouchLayoutKey;
    }

    // Default to a regular key
    return {
      id: this.formatKeyId(keyId),
      text: keyId
    };
  }

  /**
   * Format a key ID for the touch layout (add K_ or U_ prefix)
   */
  private formatKeyId(keyId: string): string {
    // If it's already formatted, return as-is
    if (keyId.match(/^[KkUu]_/)) {
      return keyId.toUpperCase();
    }

    // If it's a single character, format as Unicode
    if (keyId.length === 1) {
      const codepoint = keyId.codePointAt(0);
      return `U_${codepoint.toString(16).toUpperCase().padStart(4, '0')}`;
    }

    // Otherwise, format as K_ key
    return `K_${keyId.toUpperCase()}`;
  }

  /**
   * Generate subkeys (long press) from space-separated key IDs
   */
  private generateSubkeys(keyIds: string, defaultKeyId?: string): TouchLayoutSubKey[] {
    const subkeys: TouchLayoutSubKey[] = [];
    const ids = keyIds.trim().split(/\s+/);

    for (const id of ids) {
      const keyDef = this.keyBag.get(id);
      const subkey: TouchLayoutSubKey = {
        id: this.formatKeyId(id)
      };

      if (keyDef?.output) {
        subkey.text = this.processKeyOutput(keyDef.output);
      }

      if (id === defaultKeyId) {
        subkey.default = true;
      }

      subkeys.push(subkey);
    }

    return subkeys;
  }

  /**
   * Generate flick object from flick ID
   */
  private generateFlick(flickId: string): TouchLayoutFlick | undefined {
    const flickDef = this.flickBag.get(flickId);
    if (!flickDef || !flickDef.flickSegment) {
      return undefined;
    }

    const flick: TouchLayoutFlick = {};

    for (const segment of flickDef.flickSegment) {
      if (!segment.directions || !segment.keyId) continue;

      const keyDef = this.keyBag.get(segment.keyId);
      const subkey: TouchLayoutSubKey = {
        id: this.formatKeyId(segment.keyId)
      };

      if (keyDef?.output) {
        subkey.text = this.processKeyOutput(keyDef.output);
      }

      // Parse directions (can be space-separated for multiple directions)
      const directions = segment.directions.trim().split(/\s+/);
      for (const dir of directions) {
        const normalizedDir = dir.toLowerCase() as keyof TouchLayoutFlick;
        if (['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].includes(normalizedDir)) {
          flick[normalizedDir] = subkey;
        }
      }
    }

    return Object.keys(flick).length > 0 ? flick : undefined;
  }

  /**
   * Generate multitap array from space-separated key IDs
   */
  private generateMultitap(keyIds: string): TouchLayoutSubKey[] {
    const multitap: TouchLayoutSubKey[] = [];
    const ids = keyIds.trim().split(/\s+/);

    for (const id of ids) {
      const keyDef = this.keyBag.get(id);
      const subkey: TouchLayoutSubKey = {
        id: this.formatKeyId(id)
      };

      if (keyDef?.output) {
        subkey.text = this.processKeyOutput(keyDef.output);
      }

      multitap.push(subkey);
    }

    return multitap;
  }

  /**
   * Get hardware form layout definition
   */
  private getHardwareFormLayout(formId: HardwareForm): HardwareFormLayout {
    // VK codes for standard US keyboard positions
    // Row 0: backtick, 1-9, 0, -, =
    // Row 1: Q-P, [, ], \
    // Row 2: A-L, ;, '
    // Row 3: Z-M, comma, period, /
    // Row 4: space

    const usLayout: HardwareFormLayout = {
      formId: 'us',
      rows: [
        [192, 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 189, 187], // ` 1-9 0 - =
        [81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 219, 221, 220], // Q-P [ ] \
        [65, 83, 68, 70, 71, 72, 74, 75, 76, 186, 222],          // A-L ; '
        [90, 88, 67, 86, 66, 78, 77, 188, 190, 191],              // Z-M , . /
        [32]                                                      // space
      ]
    };

    // ISO layout adds extra key E02 (between left shift and Z)
    const isoLayout: HardwareFormLayout = {
      formId: 'iso',
      rows: [
        [192, 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 189, 187],
        [81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 219, 221],
        [65, 83, 68, 70, 71, 72, 74, 75, 76, 186, 222, 220],      // \ moved to row 2
        [226, 90, 88, 67, 86, 66, 78, 77, 188, 190, 191],         // E02 + Z-M
        [32]
      ]
    };

    // JIS layout has extra keys
    const jisLayout: HardwareFormLayout = {
      formId: 'jis',
      rows: [
        [192, 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 189, 187, 220], // + yen key
        [81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 219, 221],
        [65, 83, 68, 70, 71, 72, 74, 75, 76, 186, 222, 191],
        [90, 88, 67, 86, 66, 78, 77, 188, 190, 226, 193],           // extra keys
        [32]
      ]
    };

    // ABNT2 layout (Brazilian)
    const abnt2Layout: HardwareFormLayout = {
      formId: 'abnt2',
      rows: [
        [192, 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 189, 187],
        [81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 219, 221],
        [65, 83, 68, 70, 71, 72, 74, 75, 76, 186, 222, 220],
        [226, 90, 88, 67, 86, 66, 78, 77, 188, 190, 191, 193],     // extra C1 key
        [32]
      ]
    };

    // KS layout (Korean)
    const ksLayout: HardwareFormLayout = {
      formId: 'ks',
      rows: [
        [192, 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 189, 187],
        [81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 219, 221, 220],
        [65, 83, 68, 70, 71, 72, 74, 75, 76, 186, 222],
        [90, 88, 67, 86, 66, 78, 77, 188, 190, 191],
        [32]
      ]
    };

    switch (formId) {
      case 'iso': return isoLayout;
      case 'jis': return jisLayout;
      case 'abnt2': return abnt2Layout;
      case 'ks': return ksLayout;
      default: return usLayout;
    }
  }

  /**
   * Generate hardware layer strings (KLS) from LDML hardware layers
   */
  private generateHardwareLayerStrings(keyboard: LKKeyboard): Record<string, string[]> | null {
    const hardwareLayers = keyboard.layers?.filter(l => l.formId !== 'touch');
    if (!hardwareLayers || hardwareLayers.length === 0) {
      return null;
    }

    const kls: Record<string, string[]> = {};

    for (const layers of hardwareLayers) {
      const formId = (layers.formId || 'us') as HardwareForm;
      const formLayout = this.getHardwareFormLayout(formId);

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
              if (keyDef?.output) {
                // Map VK to KLS index (VK codes are not sequential)
                const klsIndex = this.vkToKlsIndex(vk);
                if (klsIndex >= 0 && klsIndex < 65) {
                  layerStrings[klsIndex] = this.processKeyOutput(keyDef.output);
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
   * Convert VK code to KLS array index
   */
  private vkToKlsIndex(vk: number): number {
    // Standard mapping of VK codes to KLS indices
    // This follows KeymanWeb's expected layout
    const vkMap: Record<number, number> = {
      192: 0,   // `
      49: 1,    // 1
      50: 2,    // 2
      51: 3,    // 3
      52: 4,    // 4
      53: 5,    // 5
      54: 6,    // 6
      55: 7,    // 7
      56: 8,    // 8
      57: 9,    // 9
      48: 10,   // 0
      189: 11,  // -
      187: 12,  // =
      81: 13,   // Q
      87: 14,   // W
      69: 15,   // E
      82: 16,   // R
      84: 17,   // T
      89: 18,   // Y
      85: 19,   // U
      73: 20,   // I
      79: 21,   // O
      80: 22,   // P
      219: 23,  // [
      221: 24,  // ]
      220: 25,  // \
      65: 26,   // A
      83: 27,   // S
      68: 28,   // D
      70: 29,   // F
      71: 30,   // G
      72: 31,   // H
      74: 32,   // J
      75: 33,   // K
      76: 34,   // L
      186: 35,  // ;
      222: 36,  // '
      90: 37,   // Z
      88: 38,   // X
      67: 39,   // C
      86: 40,   // V
      66: 41,   // B
      78: 42,   // N
      77: 43,   // M
      188: 44,  // ,
      190: 45,  // .
      191: 46,  // /
      32: 47,   // space
      226: 48,  // E02 (ISO key)
      193: 49,  // C1 (ABNT2 key)
    };
    return vkMap[vk] ?? -1;
  }

  /**
   * Generate the gs() transform function from LDML transforms
   */
  private generateTransformFunction(keyboard: LKKeyboard, tab: string, nl: string): string {
    // Find simple transforms
    const simpleTransforms = keyboard.transforms?.find(t => t.type === 'simple');

    if (!simpleTransforms?.transformGroup?.length) {
      // No transforms - generate a simple passthrough function
      return `${tab}this.gs=function(t,e) {${nl}${tab}${tab}return 0;${nl}${tab}};${nl}`;
    }

    let result = '';
    result += `${tab}this.gs=function(t,e) {${nl}`;
    result += `${tab}${tab}var k=KeymanWeb,r=0,m=0;${nl}`;

    // Generate marker buffer helper
    if (this.markerMap.size > 0) {
      result += `${tab}${tab}var ctx=k.KC(0,t.length,t);${nl}`;
    }

    // Process each transform group sequentially
    for (let groupIndex = 0; groupIndex < simpleTransforms.transformGroup.length; groupIndex++) {
      const group = simpleTransforms.transformGroup[groupIndex];

      if (group.transform && group.transform.length > 0) {
        result += `${nl}${tab}${tab}// TransformGroup ${groupIndex + 1}${nl}`;
        result += this.generateTransformGroupCode(group, tab, nl, groupIndex);
      }

      if (group.reorder && group.reorder.length > 0) {
        result += `${nl}${tab}${tab}// Reorder Group ${groupIndex + 1}${nl}`;
        result += this.generateReorderGroupCode(group, tab, nl);
      }
    }

    result += `${tab}${tab}return r;${nl}`;
    result += `${tab}};${nl}`;

    return result;
  }

  /**
   * Generate code for a transform group
   */
  private generateTransformGroupCode(group: LKTransformGroup, tab: string, nl: string, groupIndex: number): string {
    let result = '';
    const transforms = group.transform || [];

    // Compile transforms to patterns
    const compiledTransforms = transforms.map(t => this.compileTransform(t));

    // Generate match attempts for each transform
    for (let i = 0; i < compiledTransforms.length; i++) {
      const ct = compiledTransforms[i];
      const original = transforms[i];

      result += `${tab}${tab}// "${this.escapeString(original.from || '')}" -> "${this.escapeString(original.to || '')}"${nl}`;

      if (ct.mapFrom && ct.mapTo) {
        // Set mapping transform
        result += this.generateSetMappingTransform(ct, tab, nl, i);
      } else {
        // Simple regex transform
        result += this.generateSimpleTransform(ct, tab, nl, i);
      }
    }

    return result;
  }

  /**
   * Compile a transform rule to a pattern
   */
  private compileTransform(transform: LKTransform): CompiledTransform {
    let pattern = transform.from || '';
    let replacement = transform.to || '';

    // Check for set mapping pattern
    const mapFromMatch = LdmlKeyboardTypes.VariableParser.CAPTURE_SET_REFERENCE.exec(pattern);
    const mapToMatch = LdmlKeyboardTypes.VariableParser.MAPPED_SET_REFERENCE.exec(replacement);

    let mapFrom: string | undefined;
    let mapTo: string | undefined;

    if (mapFromMatch && mapToMatch) {
      mapFrom = mapFromMatch[1];
      mapTo = mapToMatch[1];
    }

    // Expand string variables
    pattern = this.expandStringVariables(pattern);
    replacement = this.expandStringVariables(replacement);

    // Expand set variables in pattern (not for capture)
    if (!mapFrom) {
      pattern = this.expandSetVariables(pattern);
    }

    // Convert markers to regex patterns
    pattern = this.convertMarkersToPattern(pattern);

    // Convert markers in replacement to sentinel values
    replacement = this.convertMarkersToOutput(replacement);

    // Handle Unicode escapes
    pattern = this.convertUnicodeEscapes(pattern);
    replacement = this.convertUnicodeEscapes(replacement);

    // Escape special regex chars (except what LDML uses)
    pattern = this.escapePatternForRegex(pattern);

    // Add end anchor
    pattern = pattern + '$';

    return { pattern, replacement, mapFrom, mapTo };
  }

  /**
   * Expand string variables ${name} in a string
   */
  private expandStringVariables(s: string): string {
    if (!this.variables?.string) return s;

    return s.replace(LdmlKeyboardTypes.VariableParser.STRING_REFERENCE, (match, name) => {
      const stringVar = this.variables?.string?.find(v => v.id === name);
      if (stringVar) {
        return stringVar.value;
      }
      return match;
    });
  }

  /**
   * Expand set variables $[name] in a pattern
   */
  private expandSetVariables(s: string): string {
    if (!this.variables?.set && !this.variables?.uset) return s;

    return s.replace(LdmlKeyboardTypes.VariableParser.SET_REFERENCE, (match, name) => {
      // Check regular sets first
      const setVar = this.variables?.set?.find(v => v.id === name);
      if (setVar) {
        const items = LdmlKeyboardTypes.VariableParser.setSplitter(setVar.value);
        return `(?:${items.map(i => this.escapeRegexChar(i)).join('|')})`;
      }

      // Check unicode sets
      const usetVar = this.variables?.uset?.find(v => v.id === name);
      if (usetVar) {
        // Unicode set - return as character class
        return usetVar.value;
      }

      return match;
    });
  }

  /**
   * Convert marker references to regex patterns
   */
  private convertMarkersToPattern(s: string): string {
    return s.replace(LdmlKeyboardTypes.MarkerParser.REFERENCE, (match, name) => {
      if (name === '.') {
        // Match any marker
        return `\\uffff\\u0008[\\u0001-\\u${this.markerMap.size.toString(16).padStart(4, '0')}]`;
      }
      const index = this.markerMap.get(name);
      if (index !== undefined) {
        // Match specific marker
        return `\\uffff\\u0008\\u${index.toString(16).padStart(4, '0')}`;
      }
      return match;
    });
  }

  /**
   * Convert marker references to output sentinel values
   */
  private convertMarkersToOutput(s: string): string {
    return s.replace(LdmlKeyboardTypes.MarkerParser.REFERENCE, (match, name) => {
      if (name === '.') {
        // Wildcard marker - shouldn't be in output
        return '';
      }
      const index = this.markerMap.get(name);
      if (index !== undefined) {
        return String.fromCharCode(0xFFFF, 0x0008, index);
      }
      return match;
    });
  }

  /**
   * Convert \u{XXXX} escapes to actual characters
   */
  private convertUnicodeEscapes(s: string): string {
    return s.replace(/\\u\{([0-9a-fA-F]{1,6})\}/g, (match, hex) => {
      return String.fromCodePoint(parseInt(hex, 16));
    });
  }

  /**
   * Escape special regex characters but preserve LDML syntax
   */
  private escapePatternForRegex(s: string): string {
    // Escape these: . * + ? ^ $ { } | [ ] ( ) \
    // But not when they're part of LDML syntax
    return s.replace(/([.+?^${}|[\]\\])/g, '\\$1')
            .replace(/\\\*/g, '*'); // Restore * for regex use if needed
  }

  /**
   * Escape a single character for regex
   */
  private escapeRegexChar(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Generate code for a simple (non-set-mapping) transform
   */
  private generateSimpleTransform(ct: CompiledTransform, tab: string, nl: string, index: number): string {
    let result = '';
    const varName = `m${index}`;

    result += `${tab}${tab}if((${varName}=/${ct.pattern}/.exec(k.KC(0,t.length,t)))) {${nl}`;
    result += `${tab}${tab}${tab}k.KO(0,t,${varName}[0].length,"${this.escapeString(ct.replacement)}");${nl}`;
    result += `${tab}${tab}${tab}r=1;${nl}`;
    result += `${tab}${tab}}${nl}`;

    return result;
  }

  /**
   * Generate code for a set-mapping transform
   */
  private generateSetMappingTransform(ct: CompiledTransform, tab: string, nl: string, index: number): string {
    let result = '';
    const varName = `m${index}`;

    // Get the sets
    const fromSet = this.variables?.set?.find(v => v.id === ct.mapFrom);
    const toSet = this.variables?.set?.find(v => v.id === ct.mapTo);

    if (!fromSet || !toSet) {
      result += `${tab}${tab}// Warning: Missing set for mapping${nl}`;
      return result;
    }

    const fromItems = LdmlKeyboardTypes.VariableParser.setSplitter(fromSet.value);
    const toItems = LdmlKeyboardTypes.VariableParser.setSplitter(toSet.value);

    // Build the pattern with capture group
    const capturePattern = ct.pattern.replace(
      /\$\[([^\]]+)\]/,
      `(${fromItems.map(i => this.escapeRegexChar(i)).join('|')})`
    );

    result += `${tab}${tab}if((${varName}=/${capturePattern}/.exec(k.KC(0,t.length,t)))) {${nl}`;
    result += `${tab}${tab}${tab}var _i=this._vset["${ct.mapFrom}"].indexOf(${varName}[1]);${nl}`;
    result += `${tab}${tab}${tab}if(_i>=0 && _i<this._vset["${ct.mapTo}"].length) {${nl}`;
    result += `${tab}${tab}${tab}${tab}k.KO(0,t,${varName}[0].length,this._vset["${ct.mapTo}"][_i]);${nl}`;
    result += `${tab}${tab}${tab}${tab}r=1;${nl}`;
    result += `${tab}${tab}${tab}}${nl}`;
    result += `${tab}${tab}}${nl}`;

    return result;
  }

  /**
   * Generate code for a reorder group
   *
   * Reorder transforms handle scripts where visual/phonetic order differs from
   * logical typing order (e.g., Thai, Lao, Bengali, Khmer). Characters are
   * assigned order values and sorted accordingly after each keystroke.
   */
  private generateReorderGroupCode(group: LKTransformGroup, tab: string, nl: string): string {
    let result = '';
    const reorders = group.reorder || [];

    if (reorders.length === 0) {
      return result;
    }

    // Build the reorder rules data structure
    // Each rule maps characters to their order values
    const rules: Array<{
      pattern: string;      // Regex pattern for 'from'
      orders: number[];     // Order values for each element
      before?: string;      // Optional context constraint pattern
      tertiary?: number[];  // Optional tertiary values
      tertiaryBase?: boolean[];
      preBase?: boolean[];
    }> = [];

    for (const reorder of reorders) {
      const rule = this.compileReorderRule(reorder);
      if (rule) {
        rules.push(rule);
      }
    }

    if (rules.length === 0) {
      return result;
    }

    // Generate the reorder data as a JSON structure
    result += `${tab}${tab}// Reorder rules for script ordering${nl}`;
    result += `${tab}${tab}var _rord=[${nl}`;
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const ruleObj: Record<string, unknown> = {
        p: rule.pattern,
        o: rule.orders
      };
      if (rule.before) {
        ruleObj.b = rule.before;
      }
      if (rule.tertiary && rule.tertiary.some(t => t !== 0)) {
        ruleObj.t = rule.tertiary;
      }
      if (rule.tertiaryBase && rule.tertiaryBase.some(t => t)) {
        ruleObj.tb = rule.tertiaryBase;
      }
      if (rule.preBase && rule.preBase.some(t => t)) {
        ruleObj.pb = rule.preBase;
      }
      result += `${tab}${tab}${tab}${JSON.stringify(ruleObj)}${i < rules.length - 1 ? ',' : ''}${nl}`;
    }
    result += `${tab}${tab}];${nl}`;

    // Generate the reorder processing function
    result += `${tab}${tab}// Process reorder: match characters and sort by order values${nl}`;
    result += `${tab}${tab}(function(ctx) {${nl}`;
    result += `${tab}${tab}${tab}if (!ctx || ctx.length === 0) return;${nl}`;
    result += `${tab}${tab}${tab}var matched = [], orders = [], positions = [];${nl}`;
    result += `${tab}${tab}${tab}// Scan context for reorderable characters${nl}`;
    result += `${tab}${tab}${tab}for (var i = 0; i < ctx.length; i++) {${nl}`;
    result += `${tab}${tab}${tab}${tab}var ch = ctx.charAt(i);${nl}`;
    result += `${tab}${tab}${tab}${tab}// Handle surrogate pairs${nl}`;
    result += `${tab}${tab}${tab}${tab}if (ch.charCodeAt(0) >= 0xD800 && ch.charCodeAt(0) <= 0xDBFF && i + 1 < ctx.length) {${nl}`;
    result += `${tab}${tab}${tab}${tab}${tab}ch = ctx.substring(i, i + 2); i++;${nl}`;
    result += `${tab}${tab}${tab}${tab}}${nl}`;
    result += `${tab}${tab}${tab}${tab}var ord = 0, tert = 0, found = false;${nl}`;
    result += `${tab}${tab}${tab}${tab}// Check each reorder rule${nl}`;
    result += `${tab}${tab}${tab}${tab}for (var ri = 0; ri < _rord.length; ri++) {${nl}`;
    result += `${tab}${tab}${tab}${tab}${tab}var rule = _rord[ri];${nl}`;
    result += `${tab}${tab}${tab}${tab}${tab}// Check before constraint if present${nl}`;
    result += `${tab}${tab}${tab}${tab}${tab}if (rule.b) {${nl}`;
    result += `${tab}${tab}${tab}${tab}${tab}${tab}var beforeCtx = ctx.substring(0, positions.length > 0 ? positions[0] : i);${nl}`;
    result += `${tab}${tab}${tab}${tab}${tab}${tab}if (!new RegExp(rule.b + '$').test(beforeCtx)) continue;${nl}`;
    result += `${tab}${tab}${tab}${tab}${tab}}${nl}`;
    result += `${tab}${tab}${tab}${tab}${tab}// Match character against pattern${nl}`;
    result += `${tab}${tab}${tab}${tab}${tab}var m = new RegExp('^(' + rule.p + ')').exec(ch);${nl}`;
    result += `${tab}${tab}${tab}${tab}${tab}if (m) {${nl}`;
    result += `${tab}${tab}${tab}${tab}${tab}${tab}// Find which element matched (for multi-element patterns)${nl}`;
    result += `${tab}${tab}${tab}${tab}${tab}${tab}ord = rule.o[0] || 0;${nl}`;
    result += `${tab}${tab}${tab}${tab}${tab}${tab}if (rule.t) tert = rule.t[0] || 0;${nl}`;
    result += `${tab}${tab}${tab}${tab}${tab}${tab}found = true; break;${nl}`;
    result += `${tab}${tab}${tab}${tab}${tab}}${nl}`;
    result += `${tab}${tab}${tab}${tab}}${nl}`;
    result += `${tab}${tab}${tab}${tab}matched.push(ch);${nl}`;
    result += `${tab}${tab}${tab}${tab}orders.push({o: ord, t: tert, c: ch, i: positions.length});${nl}`;
    result += `${tab}${tab}${tab}${tab}positions.push(i - (ch.length - 1));${nl}`;
    result += `${tab}${tab}${tab}}${nl}`;
    result += `${tab}${tab}${tab}// Sort by order (primary) then tertiary (secondary) then original position (stable)${nl}`;
    result += `${tab}${tab}${tab}orders.sort(function(a, b) {${nl}`;
    result += `${tab}${tab}${tab}${tab}if (a.o !== b.o) return a.o - b.o;${nl}`;
    result += `${tab}${tab}${tab}${tab}if (a.t !== b.t) return a.t - b.t;${nl}`;
    result += `${tab}${tab}${tab}${tab}return a.i - b.i;${nl}`;
    result += `${tab}${tab}${tab}});${nl}`;
    result += `${tab}${tab}${tab}// Build reordered string${nl}`;
    result += `${tab}${tab}${tab}var reordered = '';${nl}`;
    result += `${tab}${tab}${tab}for (var j = 0; j < orders.length; j++) reordered += orders[j].c;${nl}`;
    result += `${tab}${tab}${tab}// If changed, output the reordered text${nl}`;
    result += `${tab}${tab}${tab}if (reordered !== ctx) {${nl}`;
    result += `${tab}${tab}${tab}${tab}k.KO(0, t, ctx.length, reordered);${nl}`;
    result += `${tab}${tab}${tab}${tab}r = 1;${nl}`;
    result += `${tab}${tab}${tab}}${nl}`;
    result += `${tab}${tab}})(k.KC(0, t.length, t));${nl}`;

    return result;
  }

  /**
   * Compile a single reorder rule to pattern and order values
   */
  private compileReorderRule(reorder: LDMLKeyboard.LKReorder): {
    pattern: string;
    orders: number[];
    before?: string;
    tertiary?: number[];
    tertiaryBase?: boolean[];
    preBase?: boolean[];
  } | null {
    if (!reorder.from) return null;

    // Parse the 'from' pattern into elements
    let pattern = reorder.from;

    // Expand string variables
    pattern = this.expandStringVariables(pattern);

    // Convert unicode escapes
    pattern = this.convertUnicodeEscapes(pattern);

    // Parse order values (space-separated)
    const orderStrs = (reorder.order || '0').trim().split(/\s+/);
    const orders = orderStrs.map(s => parseInt(s, 10) || 0);

    // Parse tertiary values if present
    let tertiary: number[] | undefined;
    if (reorder.tertiary) {
      const tertiaryStrs = reorder.tertiary.trim().split(/\s+/);
      tertiary = tertiaryStrs.map(s => parseInt(s, 10) || 0);
    }

    // Parse tertiaryBase flags if present
    let tertiaryBase: boolean[] | undefined;
    if (reorder.tertiaryBase) {
      const tbStrs = reorder.tertiaryBase.trim().split(/\s+/);
      tertiaryBase = tbStrs.map(s => s === '1' || s === 'true');
    }

    // Parse preBase flags if present
    let preBase: boolean[] | undefined;
    if (reorder.preBase) {
      const pbStrs = reorder.preBase.trim().split(/\s+/);
      preBase = pbStrs.map(s => s === '1' || s === 'true');
    }

    // Convert pattern to regex
    // Unicode sets like [\u{1A75}-\u{1A79}] stay as character classes
    // Single characters become literal matches
    const regexPattern = this.convertReorderPatternToRegex(pattern);

    // Compile before constraint if present
    let before: string | undefined;
    if (reorder.before) {
      let beforePattern = reorder.before;
      beforePattern = this.expandStringVariables(beforePattern);
      beforePattern = this.convertUnicodeEscapes(beforePattern);
      before = this.convertReorderPatternToRegex(beforePattern);
    }

    return {
      pattern: regexPattern,
      orders,
      before,
      tertiary,
      tertiaryBase,
      preBase
    };
  }

  /**
   * Convert LDML reorder pattern to JavaScript regex
   * Handles unicode sets, escapes, and literal characters
   */
  private convertReorderPatternToRegex(pattern: string): string {
    // The pattern may contain:
    // - Literal characters
    // - Unicode character classes like [\u1A75-\u1A79]
    // - Already converted unicode from \u{XXXX}

    let result = '';
    let i = 0;

    while (i < pattern.length) {
      const ch = pattern[i];

      if (ch === '[') {
        // Unicode character class - find matching ]
        let classEnd = pattern.indexOf(']', i);
        if (classEnd === -1) classEnd = pattern.length;
        result += pattern.substring(i, classEnd + 1);
        i = classEnd + 1;
      } else if (ch === '\\' && i + 1 < pattern.length) {
        // Escape sequence
        result += pattern.substring(i, i + 2);
        i += 2;
      } else {
        // Literal character - escape if it's a regex special char
        if ('.+*?^${}()|[]\\'.includes(ch)) {
          result += '\\' + ch;
        } else {
          result += ch;
        }
        i++;
      }
    }

    return result;
  }

  /**
   * Generate the gbs() backspace transform function
   */
  private generateBackspaceFunction(keyboard: LKKeyboard, tab: string, nl: string): string {
    // Find backspace transforms
    const bkspTransforms = keyboard.transforms?.find(t => t.type === 'backspace');

    if (!bkspTransforms?.transformGroup?.length) {
      return ''; // No backspace transforms
    }

    let result = '';
    result += `${tab}this.gbs=function(t,e) {${nl}`;
    result += `${tab}${tab}var k=KeymanWeb,r=0,m=0;${nl}`;

    // Process each transform group
    for (let groupIndex = 0; groupIndex < bkspTransforms.transformGroup.length; groupIndex++) {
      const group = bkspTransforms.transformGroup[groupIndex];

      if (group.transform && group.transform.length > 0) {
        result += `${nl}${tab}${tab}// Backspace TransformGroup ${groupIndex + 1}${nl}`;

        for (let i = 0; i < group.transform.length; i++) {
          const transform = group.transform[i];
          const ct = this.compileTransform(transform);

          result += `${tab}${tab}// "${this.escapeString(transform.from || '')}" -> "${this.escapeString(transform.to || '')}"${nl}`;
          result += this.generateSimpleTransform(ct, tab, nl, i);
        }
      }
    }

    result += `${tab}${tab}return r;${nl}`;
    result += `${tab}};${nl}`;

    return result;
  }

  /**
   * Escape a string for JavaScript output
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
   * Sanitize an ID for use as a JavaScript identifier
   */
  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }
}
