/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Generates KMN keyboard source from LDML AST.
 * This is the reverse of the LDML generator - for round-trip testing.
 */

/**
 * Simplified LDML keyboard representation for conversion
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
}

export interface LdmlTransformData {
  from: string;
  to: string;
}

/**
 * Generate KMN source from LDML keyboard data
 */
export class KmnGenerator {
  private indent = '';

  /**
   * Generate KMN source string from LDML data
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
      const value = this.formatStoreValue(variable.value, variable.type);
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

    // Generate transform rules if any
    if (ldml.transforms.length > 0) {
      lines.push('');
      lines.push('match > use(transforms)');
      lines.push('');
      lines.push('group(transforms)');
      lines.push('');

      for (const transform of ldml.transforms) {
        const from = this.formatTransformPattern(transform.from);
        const to = this.formatTransformOutput(transform.to);
        lines.push(`${from} > ${to}`);
      }
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Generate key rules from layers
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
            const vkey = this.formatVKey(keyId, modifiers);
            const output = this.formatOutput(key.output);
            rules.push(`+ ${vkey} > ${output}`);
          }
        }
      }
    }

    // Generate rules for touch keys with special features
    for (const key of ldml.keys) {
      // Touch-only keys (T_ prefix)
      if (key.id.startsWith('T_') && key.output) {
        const output = this.formatOutput(key.output);
        rules.push(`+ [${key.id}] > ${output}`);
      }
    }

    return rules;
  }

  /**
   * Convert LDML modifiers to KMN format
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
   * Format a virtual key for KMN
   */
  private formatVKey(keyId: string, modifiers: string): string {
    if (modifiers) {
      return `[${modifiers} ${keyId}]`;
    }
    return `[${keyId}]`;
  }

  /**
   * Format output for KMN
   */
  private formatOutput(output: string): string {
    // Check for markers
    if (output.includes('\\m{')) {
      const match = output.match(/\\m\{([^}]+)\}/);
      if (match) {
        return `dk(${match[1]})`;
      }
    }

    // Check for simple single character
    if (output.length === 1) {
      const code = output.codePointAt(0)!;
      if (code < 0x80 && /[a-zA-Z0-9]/.test(output)) {
        return `'${output}'`;
      }
      return `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
    }

    // Multi-character output
    let result = '';
    for (const char of output) {
      const code = char.codePointAt(0)!;
      if (result) result += ' ';
      if (code < 0x80 && /[a-zA-Z0-9]/.test(char)) {
        result += `'${char}'`;
      } else {
        result += `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
      }
    }
    return result;
  }

  /**
   * Format store value
   */
  private formatStoreValue(value: string, type: string): string {
    if (type === 'uset') {
      // Unicode set - keep as-is or convert to range
      return `"${this.escapeKmn(value)}"`;
    }

    // For strings and sets, output each character
    if (value.length <= 1) {
      return `'${this.escapeKmn(value)}'`;
    }

    // Multi-character - could be a character class
    let result = '"';
    for (const char of value) {
      const code = char.codePointAt(0)!;
      if (code >= 0x20 && code < 0x7F && char !== '"' && char !== '\\') {
        result += char;
      } else {
        result += `" U+${code.toString(16).toUpperCase().padStart(4, '0')} "`;
      }
    }
    result += '"';
    return result.replace(/"" /g, '').replace(/ ""/g, '').replace(/^""/,'').replace(/""$/,'');
  }

  /**
   * Format transform pattern (context)
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
   * Format transform output
   */
  private formatTransformOutput(to: string): string {
    return this.formatOutput(to);
  }

  /**
   * Escape special characters for KMN strings
   */
  private escapeKmn(str: string): string {
    return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
  }
}

/**
 * Parse LDML XML to LdmlKeyboardData
 * Simplified parser for testing purposes
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
    if (output) key.output = unescapeXml(output);
    const gap = extractAttr(attrs, 'gap');
    if (gap === 'true') key.gap = true;
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
    data.variables.push({
      type: varMatch[1] as 'string' | 'set' | 'uset',
      id: varMatch[2],
      value: unescapeXml(varMatch[3]),
    });
  }

  // Extract transforms
  const transformRegex = /<transform\s+from="([^"]+)"\s+to="([^"]+)"/g;
  let transformMatch;
  while ((transformMatch = transformRegex.exec(xml)) !== null) {
    data.transforms.push({
      from: unescapeXml(transformMatch[1]),
      to: unescapeXml(transformMatch[2]),
    });
  }

  return data;
}

function extractAttr(attrs: string, name: string): string | undefined {
  const match = attrs.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1] : undefined;
}

function unescapeXml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Convenience function to convert LDML XML to KMN
 */
export function generateKmn(ldmlXml: string): string {
  const data = parseLdmlXml(ldmlXml);
  const generator = new KmnGenerator();
  return generator.generate(data);
}
