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
    const ldmlLayerId = this.mapLayerId(layer.id);

    for (const row of layer.row || []) {
      const keyIds: string[] = [];

      for (const key of row.key || []) {
        const ldmlKey = this.convertKey(key, ldmlLayerId);
        keyIds.push(ldmlKey.id);
      }

      rows.push(keyIds);
    }

    return {
      id: ldmlLayerId,
      modifiers: this.getModifiersForLayerId(layer.id),
      rows,
    };
  }

  /**
   * Convert a single key
   */
  private convertKey(key: TouchLayoutKey, currentLayerId: string): LdmlTouchKey {
    const baseKeyId = key.id || this.generateKeyId(key);

    // Check if we already have this key
    if (this.keys.has(baseKeyId)) {
      const existing = this.keys.get(baseKeyId)!;

      // Check if properties match
      const currentText = key.text && !key.text.startsWith('*') ? key.text : undefined;
      const currentNextLayer = key.nextlayer ? this.mapLayerId(key.nextlayer) : undefined;
      const currentWidth = key.width ? key.width / 100 : undefined;
      const hasSubkeys = key.sk && key.sk.length > 0;

      // If key properties differ, create a layer-specific variant
      const textDiffers = existing.output !== currentText;
      const nextLayerDiffers = existing.layerId !== currentNextLayer;
      const widthDiffers = existing.width !== currentWidth;
      const subkeysDiffer = (!!existing.longPressKeyIds) !== hasSubkeys;

      if (textDiffers || nextLayerDiffers || widthDiffers || subkeysDiffer) {
        // Create a unique variant ID
        const variantId = `${baseKeyId}_${currentLayerId}`;

        // Check if this variant already exists
        if (this.keys.has(variantId)) {
          return this.keys.get(variantId)!;
        }

        // Create new variant with unique ID
        // Fall through to create it below, using variantId
        const keyId = variantId;

        // Continue with creation using the variant ID
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
        if (key.width) {
          ldmlKey.width = key.width / 100;
        }

        // Handle layer switch
        if (key.nextlayer) {
          ldmlKey.layerId = this.mapLayerId(key.nextlayer);
        }

        // Handle long press, flicks, multitap (same as below)
        if (key.sk && key.sk.length > 0) {
          const subkeyIds = key.sk.map(sk => this.convertSubkey(sk, currentLayerId));
          ldmlKey.longPressKeyIds = subkeyIds.join(' ');
          const defaultSk = key.sk.find(sk => sk.default);
          if (defaultSk) {
            ldmlKey.longPressDefaultKeyId = this.getSubkeyId(defaultSk);
          }
        }

        if (key.flick) {
          const flickId = this.convertFlick(key.flick, keyId);
          if (flickId) {
            ldmlKey.flickId = flickId;
          }
        }

        if (key.multitap && key.multitap.length > 0) {
          const multitapIds = key.multitap.map(mt => this.convertSubkey(mt, currentLayerId));
          ldmlKey.multiTapKeyIds = multitapIds.join(' ');
        }

        this.keys.set(keyId, ldmlKey);
        return ldmlKey;
      }

      // Properties match, reuse existing
      return existing;
    }

    const keyId = baseKeyId;

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
    if (key.width) {
      ldmlKey.width = key.width / 100; // Convert from percentage to ratio
    }

    // Handle layer switch
    if (key.nextlayer) {
      ldmlKey.layerId = this.mapLayerId(key.nextlayer);
    }

    // Handle long press (subkeys)
    if (key.sk && key.sk.length > 0) {
      const subkeyIds = key.sk.map(sk => this.convertSubkey(sk, currentLayerId));
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
      const multitapIds = key.multitap.map(mt => this.convertSubkey(mt, currentLayerId));
      ldmlKey.multiTapKeyIds = multitapIds.join(' ');
    }

    this.keys.set(keyId, ldmlKey);
    return ldmlKey;
  }

  /**
   * Convert a subkey and return its ID
   * @param subkey The subkey to convert
   * @param parentLayerId The layer ID where this subkey is being used (for multitap context)
   */
  private convertSubkey(subkey: TouchLayoutSubKey, parentLayerId?: string): string {
    let id = this.getSubkeyId(subkey);

    // If the subkey has a layer attribute, it means we need to use the version of this key
    // from that layer's modifier context (e.g., K_A with layer="shift" means K_A_shift)
    if (subkey.layer) {
      // Check if the ID already has a modifier suffix (e.g., K_A_shift)
      const hasModifierSuffix = /_(shift|ctrl|alt|altR|caps)$/.test(id);

      if (!hasModifierSuffix) {
        // Standard key (K_*) without a modifier - append the layer as modifier
        const modifierSuffix = subkey.layer.replace('default', '');
        if (modifierSuffix) {
          id = `${id}_${modifierSuffix}`;
        }
      }
    }

    // Check if a key definition already exists
    if (this.keys.has(id)) {
      const existing = this.keys.get(id)!;
      // Reuse existing key if output matches or no special handling needed
      if (existing.output === subkey.text || (!subkey.nextlayer && !subkey.layer)) {
        return id;
      }
    }

    // For multitap/subkeys with nextlayer that have different output, create layer-specific key
    const needsLayerSpecificKey = subkey.nextlayer && parentLayerId;
    const keyLookupId = needsLayerSpecificKey ? `${id}@${parentLayerId}` : id;

    // Add key definition if not exists
    if (!this.keys.has(keyLookupId)) {
      const keyDef: LdmlTouchKey = {
        id,
        output: subkey.text,
      };

      // Store the nextlayer context for multitap items
      if (needsLayerSpecificKey && subkey.nextlayer) {
        keyDef.layerId = this.mapLayerId(subkey.nextlayer);
      }

      this.keys.set(keyLookupId, keyDef);
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
        // Flicks don't need layer context since they're not layer-specific
        const subkeyId = this.convertSubkey(subkey, undefined);
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

/**
 * Extracts touch layout data from LDML and converts it back to .keyman-touch-layout JSON format.
 *
 * This enables round-trip conversion: KMN + touch-layout → LDML → KMN + touch-layout
 *
 * @param ldmlKeys - Array of LDML key definitions
 * @param ldmlFlicks - Array of LDML flick definitions
 * @param ldmlLayers - Array of LDML layer definitions (only touch layers)
 * @returns TouchLayoutFile object that can be serialized to .keyman-touch-layout JSON
 */
export function extractTouchLayoutFromLdml(
  ldmlKeys: LdmlTouchKey[],
  ldmlFlicks: LdmlFlick[],
  ldmlLayers: LdmlTouchLayer[]
): TouchLayoutFile {
  const result: TouchLayoutFile = {};

  // Build key lookup map
  const keyMap = new Map<string, LdmlTouchKey>();
  for (const key of ldmlKeys) {
    keyMap.set(key.id, key);
  }

  // Build flick lookup map
  const flickMap = new Map<string, LdmlFlick>();
  for (const flick of ldmlFlicks) {
    flickMap.set(flick.id, flick);
  }

  // For now, assume tablet layout (most common)
  // TODO: Support phone vs tablet detection based on minDeviceWidth
  const platform: TouchLayoutPlatform = {
    layer: [],
    defaultHint: 'none'
  };

  for (const ldmlLayer of ldmlLayers) {
    const touchLayer: TouchLayoutLayer = {
      id: mapLdmlLayerIdToTouch(ldmlLayer.id),
      row: []
    };

    for (const rowKeys of ldmlLayer.rows) {
      const row: { id: number; key: TouchLayoutKey[] } = {
        id: touchLayer.row.length + 1,
        key: []
      };

      for (const keyId of rowKeys) {
        const ldmlKey = keyMap.get(keyId);
        if (!ldmlKey) continue;

        const touchKey = convertLdmlKeyToTouch(ldmlKey, keyMap, flickMap);
        row.key.push(touchKey);
      }

      if (row.key.length > 0) {
        touchLayer.row.push(row);
      }
    }

    if (touchLayer.row.length > 0) {
      platform.layer!.push(touchLayer);
    }
  }

  if (platform.layer && platform.layer.length > 0) {
    result.tablet = platform;
  }

  return result;
}

/**
 * Convert an LDML key back to touch layout key format
 */
function convertLdmlKeyToTouch(
  ldmlKey: LdmlTouchKey,
  keyMap: Map<string, LdmlTouchKey>,
  flickMap: Map<string, LdmlFlick>
): TouchLayoutKey {
  // Strip layer suffix from variant keys (e.g., K_LOWER_symbol_caps -> K_LOWER)
  let baseKeyId = ldmlKey.id;
  const variantMatch = ldmlKey.id.match(/^([A-Z_0-9]+)_(default|shift|symbol|caps|symbol-caps)$/);
  if (variantMatch) {
    baseKeyId = variantMatch[1];
  }

  const touchKey: TouchLayoutKey = {
    id: baseKeyId as TouchLayout.TouchLayoutKeyId
  };

  // Set text from output
  if (ldmlKey.output) {
    touchKey.text = ldmlKey.output;
  }

  // Handle special keys by ID pattern
  // Only set default text if not already set from LDML output
  if (baseKeyId === 'K_BKSP') {
    if (!touchKey.text) touchKey.text = '*BkSp*';
    touchKey.sp = TouchLayout.TouchLayoutKeySp.special;
  } else if (baseKeyId === 'K_SHIFT') {
    if (!touchKey.text) touchKey.text = '*Shift*';
    touchKey.sp = TouchLayout.TouchLayoutKeySp.special;
    if (ldmlKey.layerId) {
      touchKey.nextlayer = mapLdmlLayerIdToTouch(ldmlKey.layerId);
    }
  } else if (baseKeyId === 'K_ENTER') {
    if (!touchKey.text) touchKey.text = '*Enter*';
    touchKey.sp = TouchLayout.TouchLayoutKeySp.special;
  } else if (baseKeyId === 'K_SPACE') {
    if (!touchKey.text) touchKey.text = ' ';
    touchKey.sp = TouchLayout.TouchLayoutKeySp.normal;
  } else if (baseKeyId === 'K_SYMBOLS') {
    if (!touchKey.text) touchKey.text = '*Symbol*';
    touchKey.sp = TouchLayout.TouchLayoutKeySp.special;
    if (ldmlKey.layerId) {
      touchKey.nextlayer = mapLdmlLayerIdToTouch(ldmlKey.layerId);
    }
  } else if (baseKeyId === 'K_LOWER') {
    if (!touchKey.text) touchKey.text = '*abc*';
    touchKey.sp = TouchLayout.TouchLayoutKeySp.specialActive; // K_LOWER uses sp=2
    if (ldmlKey.layerId) {
      touchKey.nextlayer = mapLdmlLayerIdToTouch(ldmlKey.layerId);
    }
  } else if (ldmlKey.id === 'K_LOPT') {
    touchKey.text = '*Menu*';
    touchKey.sp = TouchLayout.TouchLayoutKeySp.special;
  }

  // Handle gap keys
  if (ldmlKey.gap) {
    // LDML gap="true" maps to spacer (10), not blank (9)
    // spacer = invisible spacing, blank = visible empty keycap
    touchKey.sp = TouchLayout.TouchLayoutKeySp.spacer;
    touchKey.text = '';
  }

  // Handle width
  if (ldmlKey.width) {
    touchKey.width = Math.round(ldmlKey.width * 100);
  }

  // Handle layer switching
  if (ldmlKey.layerId && !touchKey.nextlayer) {
    touchKey.nextlayer = mapLdmlLayerIdToTouch(ldmlKey.layerId);
  }

  // Handle long press (subkeys)
  if (ldmlKey.longPressKeyIds) {
    const subkeyIds = ldmlKey.longPressKeyIds.split(/\s+/);
    touchKey.sk = [];

    for (const skId of subkeyIds) {
      const subkey = keyMap.get(skId);
      if (subkey) {
        // Check if the key ID has a modifier suffix (e.g., K_A_shift -> K_A with layer="shift")
        const modifierMatch = skId.match(/^(K_[A-Z0-9]+)_(shift|ctrl|alt|altR|caps)$/);
        const baseId = modifierMatch ? modifierMatch[1] : skId;
        const layerModifier = modifierMatch ? modifierMatch[2] : undefined;

        const touchSubkey: TouchLayoutSubKey = {
          id: baseId as TouchLayout.TouchLayoutKeyId,
          text: subkey.output || ''
        };

        // Add layer attribute if this key has a modifier suffix
        if (layerModifier) {
          touchSubkey.layer = layerModifier as TouchLayout.TouchLayoutLayerId;
        }

        // Add nextlayer from the subkey's layerId attribute
        if (subkey.layerId) {
          touchSubkey.nextlayer = mapLdmlLayerIdToTouch(subkey.layerId);
        }

        // Mark default subkey
        if (ldmlKey.longPressDefaultKeyId === skId) {
          touchSubkey.default = true;
        }

        touchKey.sk.push(touchSubkey);
      }
    }
  }

  // Handle multitap
  if (ldmlKey.multiTapKeyIds) {
    const multitapIds = ldmlKey.multiTapKeyIds.split(/\s+/);
    touchKey.multitap = [];

    for (const mtId of multitapIds) {
      const mtKey = keyMap.get(mtId);
      if (mtKey) {
        const multitapItem: TouchLayout.TouchLayoutSubKey = {
          id: mtId as TouchLayout.TouchLayoutKeyId,
          text: mtKey.output || ''
        };

        // Restore nextlayer from the key's layerId attribute
        if (mtKey.layerId) {
          multitapItem.nextlayer = mapLdmlLayerIdToTouch(mtKey.layerId);
        }

        // Set sp to 1 (special) for special keys (matching original format)
        if (mtKey.output && mtKey.output.startsWith('*')) {
          multitapItem.sp = TouchLayout.TouchLayoutKeySp.special;
        }

        touchKey.multitap.push(multitapItem);
      }
    }
  }

  // Handle flicks
  if (ldmlKey.flickId) {
    const flick = flickMap.get(ldmlKey.flickId);
    if (flick) {
      touchKey.flick = convertLdmlFlickToTouch(flick, keyMap);
    }
  }

  return touchKey;
}

/**
 * Convert LDML flick to touch layout flick
 */
function convertLdmlFlickToTouch(
  ldmlFlick: LdmlFlick,
  keyMap: Map<string, LdmlTouchKey>
): TouchLayoutFlick {
  const touchFlick: TouchLayoutFlick = {};

  for (const segment of ldmlFlick.segments) {
    const dir = segment.directions as keyof TouchLayoutFlick;
    const key = keyMap.get(segment.keyId);

    if (key) {
      touchFlick[dir] = {
        id: key.id as TouchLayout.TouchLayoutKeyId,
        text: key.output || ''
      };
    }
  }

  return touchFlick;
}

/**
 * Map LDML layer ID back to touch layout layer ID
 */
function mapLdmlLayerIdToTouch(ldmlLayerId: string): string {
  const reverseMapping: Record<string, string> = {
    'base': 'default',
    'shift': 'shift',
    'caps': 'caps',
    'symbol': 'symbol',
    'numeric': 'numeric',
    'altR': 'rightalt',
    'altR-shift': 'rightalt-shift'
  };
  return reverseMapping[ldmlLayerId] || ldmlLayerId;
}
