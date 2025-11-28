/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Factory for creating touch layout keys and subkeys
 */

import { TouchLayout } from '@keymanapp/common-types';
import { LDMLKeyboard } from '@keymanapp/developer-utils';
import { VariableExpander } from './variable-expander.js';

import LKKey = LDMLKeyboard.LKKey;
import TouchLayoutSubKey = TouchLayout.TouchLayoutSubKey;

/**
 * Factory for creating TouchLayoutSubKey objects from key IDs.
 * Consolidates logic for subkeys, multitap, and flick generation.
 */
export class KeySubKeyFactory {
  constructor(
    private readonly keyBag: Map<string, LKKey>,
    private readonly expander: VariableExpander
  ) {}

  /**
   * Generate array of subkeys from space-separated key IDs
   * @param keyIds Space-separated key IDs
   * @param defaultKeyId Optional ID of the default key
   * @returns Array of subkeys
   */
  generateSubkeys(keyIds: string, defaultKeyId?: string): TouchLayoutSubKey[] {
    const subkeys: TouchLayoutSubKey[] = [];
    const ids = keyIds.trim().split(/\s+/);

    for (const id of ids) {
      const subkey = this.createSubKeyFromId(id);
      if (id === defaultKeyId) {
        subkey.default = true;
      }
      subkeys.push(subkey);
    }

    return subkeys;
  }

  /**
   * Generate multitap array from space-separated key IDs
   * @param keyIds Space-separated key IDs
   * @returns Array of subkeys for multitap
   */
  generateMultitap(keyIds: string): TouchLayoutSubKey[] {
    const multitap: TouchLayoutSubKey[] = [];
    const ids = keyIds.trim().split(/\s+/);

    for (const id of ids) {
      multitap.push(this.createSubKeyFromId(id));
    }

    return multitap;
  }

  /**
   * Create a single subkey from a key ID
   * @param id The key ID
   * @returns A TouchLayoutSubKey object
   */
  private createSubKeyFromId(id: string): TouchLayoutSubKey {
    const keyDef = this.keyBag.get(id);
    const subkey: TouchLayoutSubKey = {
      id: this.formatKeyId(id)
    };

    if (keyDef?.output) {
      subkey.text = this.processKeyOutput(keyDef.output);
    }

    return subkey;
  }

  /**
   * Process key output - convert markers to internal format
   * @param output The key output string
   * @returns Processed output with markers converted
   */
  processKeyOutput(output: string): string {
    return this.expander.convertMarkersToOutput(output);
  }

  /**
   * Format a key ID for the touch layout (add K_ or U_ prefix)
   * @param keyId The raw key ID
   * @returns Formatted key ID
   */
  formatKeyId(keyId: string): TouchLayoutSubKey['id'] {
    // If it's already formatted, return as-is
    if (keyId.match(/^[KkUu]_/)) {
      return keyId.toUpperCase() as TouchLayoutSubKey['id'];
    }

    // If it's a single character, format as Unicode
    if (keyId.length === 1) {
      const codepoint = keyId.codePointAt(0);
      return `U_${codepoint!.toString(16).toUpperCase().padStart(4, '0')}` as TouchLayoutSubKey['id'];
    }

    // Otherwise, format as K_ key
    return `K_${keyId.toUpperCase()}` as TouchLayoutSubKey['id'];
  }
}
