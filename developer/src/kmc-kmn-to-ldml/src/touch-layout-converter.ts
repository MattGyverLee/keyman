/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Converts .keyman-touch-layout JSON to LDML keyboard format.
 */

import { TouchLayout } from '@keymanapp/common-types';

import TouchLayoutFile = TouchLayout.TouchLayoutFile;
import TouchLayoutPlatform = TouchLayout.TouchLayoutPlatform;
import TouchLayoutLayer = TouchLayout.TouchLayoutLayer;
import TouchLayoutKey = TouchLayout.TouchLayoutKey;
import TouchLayoutSubKey = TouchLayout.TouchLayoutSubKey;
import TouchLayoutFlick = TouchLayout.TouchLayoutFlick;

/**
 * Result of touch layout conversion
 */
export interface TouchLayoutConversionResult {
  /** LDML key definitions */
  keys: LdmlTouchKey[];
  /** LDML flick definitions */
  flicks: LdmlFlick[];
  /** LDML layer definitions */
  layers: LdmlTouchLayer[];
  /** Minimum device width for phone layout */
  phoneMinWidth?: number;
  /** Minimum device width for tablet layout */
  tabletMinWidth?: number;
}

export interface LdmlTouchKey {
  id: string;
  output?: string;
  longPressKeyIds?: string;
  longPressDefaultKeyId?: string;
  multiTapKeyIds?: string;
  flickId?: string;
  gap?: boolean;
  width?: number;
  layerId?: string;
}

export interface LdmlFlick {
  id: string;
  segments: LdmlFlickSegment[];
}

export interface LdmlFlickSegment {
  directions: string;
  keyId: string;
}

export interface LdmlTouchLayer {
  id: string;
  modifiers?: string;
  rows: string[][];
}

/**
 * Converts Keyman touch layout JSON to LDML keyboard structures.
 *
 * This class takes the .keyman-touch-layout JSON format (used by legacy Keyman keyboards)
 * and converts it to LDML keyboard elements (keys, flicks, layers). This enables migration
 * of existing touch layouts to the LDML format.
 *
 * The converter handles:
 * - Key definitions with outputs
 * - Long-press (subkey) gestures
 * - Multitap sequences
 * - Flick gestures (directional swipes)
 * - Gap/spacer keys
 * - Custom key widths
 * - Layer switching keys
 * - Special keys (shift, backspace, etc.)
 * - Phone and tablet layouts with different device widths
 *
 * @example
 * ```typescript
 * const converter = new TouchLayoutConverter();
 * const result = converter.convert(touchLayoutJson);
 * console.log(`Converted ${result.keys.length} keys and ${result.layers.length} layers`);
 * ```
 */
export class TouchLayoutConverter {
  private keys: Map<string, LdmlTouchKey> = new Map();
  private flicks: Map<string, LdmlFlick> = new Map();
  private flickCounter = 0;

  /**
   * Convert a touch layout file to LDML structures
   */
  public convert(layout: TouchLayoutFile): TouchLayoutConversionResult {
    this.keys.clear();
    this.flicks.clear();
    this.flickCounter = 0;

    const layers: LdmlTouchLayer[] = [];

    // Process phone layout
    if (layout.phone) {
      const phoneLayers = this.convertPlatform(layout.phone, 'phone');
      layers.push(...phoneLayers);
    }

    // Process tablet layout
    if (layout.tablet) {
      const tabletLayers = this.convertPlatform(layout.tablet, 'tablet');
      // Only add tablet layers if they differ from phone
      if (!layout.phone) {
        layers.push(...tabletLayers);
      }
    }

    return {
      keys: Array.from(this.keys.values()),
      flicks: Array.from(this.flicks.values()),
      layers,
      phoneMinWidth: layout.phone ? 0 : undefined,
      tabletMinWidth: layout.tablet ? 400 : undefined,
    };
  }

  /**
   * Convert a platform (phone/tablet) layout
   */
  private convertPlatform(platform: TouchLayoutPlatform, _platformType: string): LdmlTouchLayer[] {
    const layers: LdmlTouchLayer[] = [];

    for (const layer of platform.layer || []) {
      layers.push(this.convertLayer(layer));
    }

    return layers;
  }

  /**
   * Convert a single layer
   */
  private convertLayer(layer: TouchLayoutLayer): LdmlTouchLayer {
    const rows: string[][] = [];

    for (const row of layer.row || []) {
      const keyIds: string[] = [];

      for (const key of row.key || []) {
        const ldmlKey = this.convertKey(key);
        keyIds.push(ldmlKey.id);
      }

      rows.push(keyIds);
    }

    // Map layer ID to LDML conventions
    const ldmlLayerId = this.mapLayerId(layer.id);

    return {
      id: ldmlLayerId,
      modifiers: this.getModifiersForLayerId(layer.id),
      rows,
    };
  }

  /**
   * Convert a single key
   */
  private convertKey(key: TouchLayoutKey): LdmlTouchKey {
    const keyId = key.id || this.generateKeyId(key);

    // Check if we already have this key
    if (this.keys.has(keyId)) {
      return this.keys.get(keyId)!;
    }

    const ldmlKey: LdmlTouchKey = {
      id: keyId,
    };

    // Set output from text
    if (key.text && !key.text.startsWith('*')) {
      ldmlKey.output = key.text;
    }

    // Handle special key types
    if (key.sp === TouchLayout.TouchLayoutKeySp.spacer || key.sp === TouchLayout.TouchLayoutKeySp.blank) {
      ldmlKey.gap = true;
    }

    // Handle width
    if (key.width && key.width !== 100) {
      ldmlKey.width = key.width / 100; // Convert from percentage to ratio
    }

    // Handle layer switch
    if (key.nextlayer) {
      ldmlKey.layerId = this.mapLayerId(key.nextlayer);
    }

    // Handle long press (subkeys)
    if (key.sk && key.sk.length > 0) {
      const subkeyIds = key.sk.map(sk => this.convertSubkey(sk));
      ldmlKey.longPressKeyIds = subkeyIds.join(' ');

      // Find default subkey
      const defaultSk = key.sk.find(sk => sk.default);
      if (defaultSk) {
        ldmlKey.longPressDefaultKeyId = this.getSubkeyId(defaultSk);
      }
    }

    // Handle flicks
    if (key.flick) {
      const flickId = this.convertFlick(key.flick, keyId);
      if (flickId) {
        ldmlKey.flickId = flickId;
      }
    }

    // Handle multitap
    if (key.multitap && key.multitap.length > 0) {
      const multitapIds = key.multitap.map(mt => this.convertSubkey(mt));
      ldmlKey.multiTapKeyIds = multitapIds.join(' ');
    }

    this.keys.set(keyId, ldmlKey);
    return ldmlKey;
  }

  /**
   * Convert a subkey and return its ID
   */
  private convertSubkey(subkey: TouchLayoutSubKey): string {
    const id = this.getSubkeyId(subkey);

    // Add key definition if not exists
    if (!this.keys.has(id)) {
      this.keys.set(id, {
        id,
        output: subkey.text,
      });
    }

    return id;
  }

  /**
   * Get or generate subkey ID
   */
  private getSubkeyId(subkey: TouchLayoutSubKey): string {
    if (subkey.id) {
      return subkey.id;
    }
    // Generate from text
    if (subkey.text && subkey.text.length === 1) {
      const code = subkey.text.codePointAt(0)!;
      return `U_${code.toString(16).toUpperCase().padStart(4, '0')}`;
    }
    return `T_SK_${Date.now()}`;
  }

  /**
   * Convert flick gestures
   */
  private convertFlick(flick: TouchLayoutFlick, keyId: string): string | null {
    const segments: LdmlFlickSegment[] = [];

    // Map each direction
    const directions: (keyof TouchLayoutFlick)[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

    for (const dir of directions) {
      const subkey = flick[dir];
      if (subkey) {
        const subkeyId = this.convertSubkey(subkey);
        segments.push({
          directions: dir,
          keyId: subkeyId,
        });
      }
    }

    if (segments.length === 0) {
      return null;
    }

    const flickId = `flick_${keyId}_${this.flickCounter++}`;
    this.flicks.set(flickId, {
      id: flickId,
      segments,
    });

    return flickId;
  }

  /**
   * Generate a key ID from key properties
   */
  private generateKeyId(key: TouchLayoutKey): string {
    if (key.text && key.text.length === 1 && !key.text.startsWith('*')) {
      const code = key.text.codePointAt(0)!;
      return `U_${code.toString(16).toUpperCase().padStart(4, '0')}`;
    }
    return `T_KEY_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  }

  /**
   * Map touch layout layer ID to LDML layer ID
   */
  private mapLayerId(layerId: string): string {
    // Common mappings
    const mapping: Record<string, string> = {
      'default': 'base',
      'shift': 'shift',
      'caps': 'caps',
      'symbol': 'symbol',
      'numeric': 'numeric',
      'rightalt': 'altR',
      'rightalt-shift': 'altR-shift',
    };
    return mapping[layerId.toLowerCase()] || layerId;
  }

  /**
   * Get LDML modifiers for a layer ID
   */
  private getModifiersForLayerId(layerId: string): string | undefined {
    const mapping: Record<string, string> = {
      'shift': 'shift',
      'caps': 'caps',
      'rightalt': 'altR',
      'rightalt-shift': 'shift altR',
    };
    return mapping[layerId.toLowerCase()];
  }
}

/**
 * Generate LDML XML fragments from touch layout conversion
 */
export function generateLdmlFromTouchLayout(result: TouchLayoutConversionResult, indent = '  '): string {
  let xml = '';

  // Generate keys section
  if (result.keys.length > 0) {
    xml += `${indent}<keys>\n`;
    for (const key of result.keys) {
      xml += `${indent}${indent}<key id="${key.id}"`;
      if (key.output) xml += ` output="${escapeXml(key.output)}"`;
      if (key.gap) xml += ` gap="true"`;
      if (key.width) xml += ` width="${key.width}"`;
      if (key.layerId) xml += ` layerId="${key.layerId}"`;
      if (key.longPressKeyIds) xml += ` longPressKeyIds="${key.longPressKeyIds}"`;
      if (key.longPressDefaultKeyId) xml += ` longPressDefaultKeyId="${key.longPressDefaultKeyId}"`;
      if (key.multiTapKeyIds) xml += ` multiTapKeyIds="${key.multiTapKeyIds}"`;
      if (key.flickId) xml += ` flickId="${key.flickId}"`;
      xml += `/>\n`;
    }
    xml += `${indent}</keys>\n`;
  }

  // Generate flicks section
  if (result.flicks.length > 0) {
    xml += `${indent}<flicks>\n`;
    for (const flick of result.flicks) {
      xml += `${indent}${indent}<flick id="${flick.id}">\n`;
      for (const seg of flick.segments) {
        xml += `${indent}${indent}${indent}<flickSegment directions="${seg.directions}" keyId="${seg.keyId}"/>\n`;
      }
      xml += `${indent}${indent}</flick>\n`;
    }
    xml += `${indent}</flicks>\n`;
  }

  // Generate layers section
  if (result.layers.length > 0) {
    const minWidth = result.phoneMinWidth ?? 0;
    xml += `${indent}<layers formId="touch" minDeviceWidth="${minWidth}">\n`;
    for (const layer of result.layers) {
      xml += `${indent}${indent}<layer id="${layer.id}"`;
      if (layer.modifiers) xml += ` modifiers="${layer.modifiers}"`;
      xml += `>\n`;
      for (const row of layer.rows) {
        xml += `${indent}${indent}${indent}<row keys="${row.join(' ')}"/>\n`;
      }
      xml += `${indent}${indent}</layer>\n`;
    }
    xml += `${indent}</layers>\n`;
  }

  return xml;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
