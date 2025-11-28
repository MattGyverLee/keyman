/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Compiles LDML touch layers to TouchLayoutFile (KVKL) format
 */

import { TouchLayout } from '@keymanapp/common-types';
import { CompilerCallbacks, LDMLKeyboard } from '@keymanapp/developer-utils';
import { KeySubKeyFactory } from './key-subkey-factory.js';
import { LdmlCompilerMessages } from './ldml-compiler-messages.js';

import LKKeyboard = LDMLKeyboard.LKKeyboard;
import LKKey = LDMLKeyboard.LKKey;
import LKFlick = LDMLKeyboard.LKFlick;
import LKLayers = LDMLKeyboard.LKLayers;
import LKLayer = LDMLKeyboard.LKLayer;
import LKRow = LDMLKeyboard.LKRow;

import TouchLayoutFile = TouchLayout.TouchLayoutFile;
import TouchLayoutPlatform = TouchLayout.TouchLayoutPlatform;
import TouchLayoutLayer = TouchLayout.TouchLayoutLayer;
import TouchLayoutRow = TouchLayout.TouchLayoutRow;
import TouchLayoutKey = TouchLayout.TouchLayoutKey;
import TouchLayoutSubKey = TouchLayout.TouchLayoutSubKey;
import TouchLayoutFlick = TouchLayout.TouchLayoutFlick;

/**
 * Compiles LDML touch layers to KeymanWeb TouchLayoutFile format.
 * Handles layers, rows, keys, flicks, long-press, and multitap.
 */
export class TouchLayoutCompiler {
  constructor(
    private readonly keyFactory: KeySubKeyFactory,
    private readonly keyBag: Map<string, LKKey>,
    private readonly flickBag: Map<string, LKFlick>,
    private readonly callbacks: CompilerCallbacks
  ) {}

  /**
   * Generate the TouchLayoutFile (KVKL) from LDML layers
   * @param keyboard The LDML keyboard
   * @returns TouchLayoutFile or null if no touch layers
   */
  generateTouchLayout(keyboard: LKKeyboard): TouchLayoutFile | null {
    const touchLayers = keyboard.layers?.filter((l: LKLayers) => l.formId === 'touch');
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

    // Map LDML layer id to touch layout id first so we can pass it to generateRow
    const layerId = this.mapLayerId(layer.id, layer.modifiers);

    for (let rowIndex = 0; rowIndex < (layer.row || []).length; rowIndex++) {
      const row = layer.row[rowIndex];
      rows.push(this.generateRow(row, rowIndex + 1, keyboard, layerId));
    }

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
  private generateRow(row: LKRow, rowId: number, keyboard: LKKeyboard, layerId?: string): TouchLayoutRow {
    const keys: TouchLayoutKey[] = [];
    const keyIds = (row.keys || '').trim().split(/\s+/);

    for (const keyId of keyIds) {
      if (keyId) {
        keys.push(this.generateKey(keyId, keyboard, layerId));
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
  private generateKey(keyId: string, keyboard: LKKeyboard, layerId?: string): TouchLayoutKey {
    const keyDef = this.keyBag.get(keyId);

    if (!keyDef) {
      // Key not found in keybag - might be a special key or undefined
      // Warn if it's not a known special key
      if (!this.isSpecialKey(keyId)) {
        this.callbacks.reportMessage(
          LdmlCompilerMessages.Warn_KeyNotFoundForTouchLayout({
            keyId: keyId,
            layerId: layerId || 'unknown'
          })
        );
      }
      return this.generateSpecialKey(keyId);
    }

    const result: TouchLayoutKey = {
      id: this.keyFactory.formatKeyId(keyId),
    };

    // Set the display text
    if (keyDef.output) {
      result.text = this.keyFactory.processKeyOutput(keyDef.output);
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
      result.sk = this.keyFactory.generateSubkeys(keyDef.longPressKeyIds, keyDef.longPressDefaultKeyId);
    }

    // Handle flicks
    if (keyDef.flickId) {
      result.flick = this.generateFlick(keyDef.flickId, keyId);
    }

    // Handle multitap
    if (keyDef.multiTapKeyIds) {
      result.multitap = this.keyFactory.generateMultitap(keyDef.multiTapKeyIds);
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
      id: this.keyFactory.formatKeyId(keyId),
      text: keyId
    };
  }

  /**
   * Generate flick object from flick ID
   */
  private generateFlick(flickId: string, keyId: string): TouchLayoutFlick | undefined {
    const flickDef = this.flickBag.get(flickId);
    if (!flickDef || !flickDef.flickSegment) {
      // Warn that the flick definition was not found
      this.callbacks.reportMessage(
        LdmlCompilerMessages.Warn_FlickNotFoundInFlickBag({
          flickId: flickId,
          keyId: keyId
        })
      );
      return undefined;
    }

    const flick: TouchLayoutFlick = {};

    for (const segment of flickDef.flickSegment) {
      if (!segment.directions || !segment.keyId) continue;

      const keyDef = this.keyBag.get(segment.keyId);
      const subkey: TouchLayoutSubKey = {
        id: this.keyFactory.formatKeyId(segment.keyId)
      };

      if (keyDef?.output) {
        subkey.text = this.keyFactory.processKeyOutput(keyDef.output);
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
   * Check if a keyId is a known special key (shift, bksp, space, etc.)
   * Used to avoid warnings for undefined special keys
   */
  private isSpecialKey(keyId: string): boolean {
    const specialKeys = ['shift', 'bksp', 'space', 'enter', 'numeric', 'menu'];
    return specialKeys.includes(keyId.toLowerCase());
  }
}
