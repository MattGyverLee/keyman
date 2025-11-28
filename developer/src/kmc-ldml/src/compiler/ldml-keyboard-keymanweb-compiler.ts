/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Compiles a LDML keyboard to JavaScript for KeymanWeb (mobile/web platforms)
 */

import { TouchLayout } from '@keymanapp/common-types';
import { CompilerCallbacks, LDMLKeyboard } from '@keymanapp/developer-utils';
import { LdmlCompilerOptions } from './ldml-compiler-options.js';

import LKKeyboard = LDMLKeyboard.LKKeyboard;
import LKKey = LDMLKeyboard.LKKey;
import LKFlick = LDMLKeyboard.LKFlick;
import LKLayers = LDMLKeyboard.LKLayers;
import LKLayer = LDMLKeyboard.LKLayer;
import LKRow = LDMLKeyboard.LKRow;
import LKTransforms = LDMLKeyboard.LKTransforms;

import TouchLayoutFile = TouchLayout.TouchLayoutFile;
import TouchLayoutPlatform = TouchLayout.TouchLayoutPlatform;
import TouchLayoutLayer = TouchLayout.TouchLayoutLayer;
import TouchLayoutRow = TouchLayout.TouchLayoutRow;
import TouchLayoutKey = TouchLayout.TouchLayoutKey;
import TouchLayoutSubKey = TouchLayout.TouchLayoutSubKey;
import TouchLayoutFlick = TouchLayout.TouchLayoutFlick;

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

    const debug = this.options.saveDebug;
    const nl = debug ? '\n' : '';
    const tab = debug ? '  ' : '';

    // Extract metadata
    const name = keyboard.info?.name || keyboardId;
    const version = keyboard.version?.number || '1.0';
    const rtl = false; // TODO: detect from locale

    // Build the keyboard function name
    const funcName = `Keyboard_${this.sanitizeId(keyboardId)}`;

    // Generate touch layout (KVKL)
    const kvkl = this.generateTouchLayout(keyboard);
    const kvklJson = kvkl ? JSON.stringify(kvkl) : 'null';

    // Generate hardware layer strings (KLS) - optional
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

    // Generate transforms as gs() function
    const gsFunction = this.generateTransformFunction(keyboard, tab, nl);
    result += gsFunction;

    // Close the function
    result += `}${nl}`;

    return result;
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
      result.text = keyDef.output;
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
        subkey.text = keyDef.output;
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
        subkey.text = keyDef.output;
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
        subkey.text = keyDef.output;
      }

      multitap.push(subkey);
    }

    return multitap;
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
      for (const layer of layers.layer || []) {
        const layerId = this.mapLayerId(layer.id, layer.modifiers);

        // Initialize with 65 empty strings (standard keyboard key count)
        const layerStrings: string[] = new Array(65).fill('');

        // TODO: Map row keys to VK positions
        // This requires the scancode-to-VK mapping from the form

        kls[layerId] = layerStrings;
      }
    }

    return Object.keys(kls).length > 0 ? kls : null;
  }

  /**
   * Generate the gs() transform function from LDML transforms
   */
  private generateTransformFunction(keyboard: LKKeyboard, tab: string, nl: string): string {
    let result = '';

    // Find simple transforms
    const simpleTransforms = keyboard.transforms?.find(t => t.type === 'simple');

    if (!simpleTransforms?.transformGroup?.length) {
      // No transforms - generate a simple passthrough function
      result += `${tab}this.gs=function(t,e) {${nl}`;
      result += `${tab}${tab}return 0;${nl}`;
      result += `${tab}};${nl}`;
      return result;
    }

    // Generate transform rules
    // This is a simplified implementation - full transform support would require
    // more complex rule matching logic

    result += `${tab}this.gs=function(t,e) {${nl}`;
    result += `${tab}${tab}var k=KeymanWeb,r=0,m=0;${nl}`;

    // Process each transform group
    for (const group of simpleTransforms.transformGroup) {
      if (group.transform) {
        for (const transform of group.transform) {
          // Generate a simple context match and output
          // This is simplified - full implementation would need proper context matching
          result += `${tab}${tab}// Transform: "${this.escapeString(transform.from || '')}" -> "${this.escapeString(transform.to || '')}"${nl}`;
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
      .replace(/\r/g, '\\r');
  }

  /**
   * Sanitize an ID for use as a JavaScript identifier
   */
  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }
}
