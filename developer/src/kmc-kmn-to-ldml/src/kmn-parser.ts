/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Parser for KMN keyboard source files.
 * Converts .kmn text to AST representation.
 */

import {
  KmnKeyboard,
  KmnStore,
  KmnBegin,
  KmnGroup,
  KmnRule,
  KmnKeySpec,
  KmnRuleElement,
  KmnStoreType,
  SYSTEM_STORES,
} from './kmn-ast.js';

/**
 * Parser for Keyman KMN keyboard source files.
 *
 * This class parses legacy .kmn keyboard source files into an Abstract Syntax Tree (AST)
 * representation that can be used for conversion to LDML format or other processing.
 *
 * The parser handles:
 * - Store definitions (system and user-defined)
 * - Begin statements (Unicode/ANSI mode and initial group)
 * - Group definitions (using keys, readonly flags)
 * - Rules (context + key > output)
 * - Comments (c ...)
 * - Unicode escapes (U+XXXX)
 * - Virtual keys (K_, T_, U_ codes)
 * - Modifiers (SHIFT, CTRL, ALT, CAPS, NCAPS)
 * - Functions (any, index, use, deadkey, etc.)
 *
 * @example
 * ```typescript
 * const parser = new KmnParser();
 * const ast = parser.parse(kmnSource, 'my_keyboard.kmn');
 * console.log(`Found ${ast.groups.length} groups`);
 * ```
 */
export class KmnParser {
  private lines: string[] = [];
  private lineIndex = 0;
  private filename: string = '';

  /**
   * Parse KMN source text into an Abstract Syntax Tree.
   *
   * Processes the entire KMN source file line by line, extracting stores, groups,
   * and rules. The parser maintains line number information for error reporting
   * and debugging.
   *
   * @param source - The complete KMN keyboard source code
   * @param filename - Optional filename for error reporting
   * @returns Parsed keyboard AST containing stores, groups, and metadata
   */
  public parse(source: string, filename?: string): KmnKeyboard {
    this.filename = filename || '';
    this.lines = source.split(/\r?\n/);
    this.lineIndex = 0;

    const keyboard: KmnKeyboard = {
      stores: [],
      groups: [],
      filename: this.filename,
    };

    while (this.lineIndex < this.lines.length) {
      const line = this.currentLine();
      const trimmed = this.stripComment(line).trim();

      if (!trimmed) {
        this.lineIndex++;
        continue;
      }

      // Parse different line types
      if (trimmed.toLowerCase().startsWith('store(')) {
        const store = this.parseStore(trimmed);
        if (store) keyboard.stores.push(store);
      } else if (trimmed.toLowerCase().startsWith('begin ')) {
        keyboard.begin = this.parseBegin(trimmed);
      } else if (trimmed.toLowerCase().startsWith('group(')) {
        const group = this.parseGroup(trimmed);
        keyboard.groups.push(group);
      } else if (this.isRuleLine(trimmed)) {
        // Rule outside of a group - add to last group or create implicit main group
        if (keyboard.groups.length === 0) {
          keyboard.groups.push({
            name: 'main',
            usingKeys: true,
            readonly: false,
            rules: [],
            line: this.lineIndex + 1,
          });
        }
        const rule = this.parseRule(trimmed);
        if (rule) {
          keyboard.groups[keyboard.groups.length - 1].rules.push(rule);
        }
      }

      this.lineIndex++;
    }

    return keyboard;
  }

  private currentLine(): string {
    return this.lines[this.lineIndex] || '';
  }

  /**
   * Strip KMN comments from a line while preserving strings.
   *
   * KMN uses 'c ' (with space) as a comment marker. This method carefully
   * removes comments while not stripping 'c' characters that appear inside
   * quoted strings.
   *
   * @param line - The line to process
   * @returns Line with comments removed
   */
  private stripComment(line: string): string {
    // Handle 'c ' at start of line (comment)
    if (/^c\s/i.test(line.trim())) {
      return '';
    }
    // Handle inline comments - but be careful not to strip 'c' inside strings
    let result = '';
    let inString = false;
    let stringChar = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (!inString && (ch === '"' || ch === "'")) {
        inString = true;
        stringChar = ch;
        result += ch;
      } else if (inString && ch === stringChar) {
        inString = false;
        result += ch;
      } else if (!inString && ch === 'c' && (i === 0 || /\s/.test(line[i - 1])) && i + 1 < line.length && /\s/.test(line[i + 1])) {
        // Found 'c ' comment marker
        break;
      } else {
        result += ch;
      }
    }
    return result;
  }

  /**
   * Parse a store definition from a KMN line.
   *
   * Stores in KMN can be system stores (prefixed with &) or user-defined stores.
   * Format: store(name) value or store(&NAME) value
   *
   * System stores include: &NAME, &VERSION, &COPYRIGHT, &TARGETS, etc.
   * User stores can be used with any(), index(), etc. in rules.
   *
   * @param line - The store definition line
   * @returns Parsed store object or null if invalid
   */
  private parseStore(line: string): KmnStore | null {
    // store(&NAME) 'value' or store(name) value
    // Note: Store names can include hyphens (e.g., comp-dia)
    const match = line.match(/^store\s*\(\s*(&?)([\w-]+)\s*\)\s*(.+)$/i);
    if (!match) return null;

    const isSystem = match[1] === '&';
    const name = match[2];
    const valueStr = match[3].trim();

    return {
      name,
      isSystem,
      value: this.parseStoreValue(valueStr),
      line: this.lineIndex + 1,
      storeType: isSystem ? KmnStoreType.Reserved : KmnStoreType.Normal,
    };
  }

  /**
   * Special marker for 'nul' entries in stores (U+FFFF is not a valid character)
   */
  public static readonly NUL_MARKER = '\uFFFF';

  /**
   * Parse store value (handles strings, U+XXXX sequences, nul, ranges, etc.)
   */
  private parseStoreValue(valueStr: string): string {
    // Handle quoted strings
    if (valueStr.startsWith("'") || valueStr.startsWith('"')) {
      return this.parseQuotedString(valueStr);
    }

    // Handle space-separated U+XXXX sequences (and nul keywords)
    // e.g., "U+0020 U+0030 U+0029 nul nul"
    if (valueStr.match(/^(U\+[0-9A-Fa-f]+|nul)(\s|$)/i)) {
      return this.parseSpaceSeparatedValues(valueStr);
    }

    // Handle other value types (ranges, etc.)
    return valueStr;
  }

  /**
   * Parse space-separated U+XXXX codes and nul keywords
   */
  private parseSpaceSeparatedValues(str: string): string {
    let result = '';
    const tokens = str.split(/\s+/).filter(t => t.length > 0);

    for (const token of tokens) {
      if (token.match(/^U\+[0-9A-Fa-f]+$/i)) {
        // Unicode codepoint
        const codepoint = parseInt(token.substring(2), 16);
        result += String.fromCodePoint(codepoint);
      } else if (token.toLowerCase() === 'nul') {
        // nul keyword - use special marker
        result += KmnParser.NUL_MARKER;
      } else {
        // Unknown token - skip or could be end of values
        break;
      }
    }

    return result;
  }

  /**
   * Parse a quoted string value
   */
  private parseQuotedString(str: string): string {
    const quote = str[0];
    let result = '';
    let i = 1;
    while (i < str.length) {
      if (str[i] === quote) {
        // Check for continuation
        const rest = str.substring(i + 1).trim();
        if (rest.startsWith("'") || rest.startsWith('"') || rest.startsWith('U+') || rest.match(/^\[/) || rest.match(/^nul\b/i)) {
          // Continuation - parse the rest
          result += this.parseStoreValue(rest);
        }
        break;
      }
      result += str[i];
      i++;
    }
    return result;
  }

  /**
   * Parse begin statement
   */
  private parseBegin(line: string): KmnBegin {
    // begin Unicode > use(main)
    const match = line.match(/^begin\s+(unicode|ansi)\s*>\s*use\s*\(\s*(\w+)\s*\)/i);
    if (!match) {
      return {
        mode: 'Unicode',
        groupName: 'main',
        line: this.lineIndex + 1,
      };
    }
    return {
      mode: match[1].toLowerCase() === 'unicode' ? 'Unicode' : 'ANSI',
      groupName: match[2],
      line: this.lineIndex + 1,
    };
  }

  /**
   * Parse group definition
   */
  private parseGroup(line: string): KmnGroup {
    // group(name) [using keys] [readonly]
    const match = line.match(/^group\s*\(\s*(\w+)\s*\)\s*(.*)/i);
    const name = match ? match[1] : 'unknown';
    const rest = match ? match[2].toLowerCase() : '';

    const group: KmnGroup = {
      name,
      usingKeys: rest.includes('using keys'),
      readonly: rest.includes('readonly'),
      rules: [],
      line: this.lineIndex + 1,
    };

    // Parse rules that follow this group
    this.lineIndex++;
    while (this.lineIndex < this.lines.length) {
      const ruleLine = this.stripComment(this.currentLine()).trim();

      // Stop at next group or store definition
      if (!ruleLine || ruleLine.toLowerCase().startsWith('group(') || ruleLine.toLowerCase().startsWith('store(')) {
        this.lineIndex--;
        break;
      }

      if (this.isRuleLine(ruleLine)) {
        const rule = this.parseRule(ruleLine);
        if (rule) group.rules.push(rule);
      }

      this.lineIndex++;
    }

    return group;
  }

  /**
   * Check if a line looks like a rule
   */
  private isRuleLine(line: string): boolean {
    // Rules contain: + > or just > (for match/nomatch)
    return line.includes('>') || line.toLowerCase().startsWith('match') || line.toLowerCase().startsWith('nomatch');
  }

  /**
   * Parse a rule line
   */
  private parseRule(line: string): KmnRule | null {
    const rule: KmnRule = {
      context: [],
      output: [],
      line: this.lineIndex + 1,
    };

    // Handle match > use(group) and nomatch > use(group)
    if (line.toLowerCase().startsWith('match')) {
      rule.isMatch = true;
      const match = line.match(/^match\s*>\s*(.+)$/i);
      if (match) {
        rule.output = this.parseRuleElements(match[1]);
      }
      return rule;
    }
    if (line.toLowerCase().startsWith('nomatch')) {
      rule.isNomatch = true;
      const match = line.match(/^nomatch\s*>\s*(.+)$/i);
      if (match) {
        rule.output = this.parseRuleElements(match[1]);
      }
      return rule;
    }

    // Parse regular rules: [context] + [key] > output
    // Split on >
    const arrowPos = line.indexOf('>');
    if (arrowPos === -1) return null;

    const lhs = line.substring(0, arrowPos).trim();
    const rhs = line.substring(arrowPos + 1).trim();

    // Parse LHS: [context] + [key]
    const plusPos = lhs.lastIndexOf('+');
    if (plusPos !== -1) {
      const contextPart = lhs.substring(0, plusPos).trim();
      const keyPart = lhs.substring(plusPos + 1).trim();

      if (contextPart) {
        rule.context = this.parseRuleElements(contextPart);
      }
      rule.key = this.parseKeySpec(keyPart);
    } else {
      // No key, just context > output (readonly group rule)
      rule.context = this.parseRuleElements(lhs);
    }

    // Parse RHS (output)
    rule.output = this.parseRuleElements(rhs);

    return rule;
  }

  /**
   * Parse a key specification: [SHIFT K_A] or 'a'
   */
  private parseKeySpec(keyStr: string): KmnKeySpec {
    const spec: KmnKeySpec = {};

    // Handle virtual key in brackets: [SHIFT K_A]
    if (keyStr.startsWith('[')) {
      const content = keyStr.slice(1, -1).trim();
      const parts = content.split(/\s+/);

      for (const part of parts) {
        const upper = part.toUpperCase();
        if (upper === 'SHIFT') spec.shift = true;
        else if (upper === 'CTRL' || upper === 'LCTRL' || upper === 'RCTRL') spec.ctrl = true;
        else if (upper === 'ALT' || upper === 'LALT' || upper === 'RALT') spec.alt = true;
        else if (upper === 'CAPS') spec.caps = true;
        else if (upper === 'NCAPS') spec.ncaps = true;
        else if (upper.startsWith('K_') || upper.startsWith('T_') || upper.startsWith('U_')) {
          spec.vkey = upper;
        }
      }
    }
    // Handle character literal: 'a'
    else if (keyStr.startsWith("'") || keyStr.startsWith('"')) {
      spec.char = keyStr.slice(1, -1);
      spec.mnemonic = true;
    }

    return spec;
  }

  /**
   * Parse rule elements (context or output)
   */
  private parseRuleElements(str: string): KmnRuleElement[] {
    const elements: KmnRuleElement[] = [];
    let i = 0;

    while (i < str.length) {
      // Skip whitespace
      while (i < str.length && /\s/.test(str[i])) i++;
      if (i >= str.length) break;

      // Parse different element types
      const remaining = str.substring(i);

      // String literal
      if (remaining.startsWith("'") || remaining.startsWith('"')) {
        const quote = remaining[0];
        let j = 1;
        while (j < remaining.length && remaining[j] !== quote) j++;
        const value = remaining.substring(1, j);
        elements.push({ type: 'char', value });
        i += j + 1;
      }
      // Unicode codepoint U+XXXX
      else if (remaining.match(/^U\+[0-9A-Fa-f]+/i)) {
        const match = remaining.match(/^U\+([0-9A-Fa-f]+)/i)!;
        const codepoint = parseInt(match[1], 16);
        elements.push({ type: 'char', value: String.fromCodePoint(codepoint) });
        i += match[0].length;
      }
      // Function calls
      else if (remaining.match(/^(any|notany|index|use|dk|deadkey|context|nul|beep|set|if|layer|platform)\s*\(/i)) {
        const funcMatch = remaining.match(/^(\w+)\s*\(([^)]*)\)/i);
        if (funcMatch) {
          const funcName = funcMatch[1].toLowerCase();
          const args = funcMatch[2].trim();
          elements.push(this.parseFunctionElement(funcName, args));
          i += funcMatch[0].length;
        } else {
          i++;
        }
      }
      // BEEP (without parentheses)
      else if (remaining.match(/^beep\b/i)) {
        elements.push({ type: 'beep' });
        i += 4;
      }
      // nul (without parentheses)
      else if (remaining.match(/^nul\b/i)) {
        elements.push({ type: 'nul' });
        i += 3;
      }
      // context (without parentheses)
      else if (remaining.match(/^context\b/i)) {
        elements.push({ type: 'context' });
        i += 7;
      }
      else {
        i++;
      }
    }

    return elements;
  }

  /**
   * Parse a function element (any, index, use, etc.)
   */
  private parseFunctionElement(funcName: string, args: string): KmnRuleElement {
    switch (funcName) {
      case 'any':
        return { type: 'any', storeName: args.trim() };
      case 'notany':
        return { type: 'notany', storeName: args.trim() };
      case 'index': {
        const parts = args.split(',').map(s => s.trim());
        return { type: 'index', storeName: parts[0], offset: parseInt(parts[1]) || 1 };
      }
      case 'use':
        return { type: 'use', groupName: args.trim() };
      case 'dk':
      case 'deadkey':
        return { type: 'deadkey', name: args.trim() };
      case 'context': {
        const offset = parseInt(args);
        return { type: 'context', offset: isNaN(offset) ? undefined : offset };
      }
      case 'nul':
        return { type: 'nul' };
      case 'beep':
        return { type: 'beep' };
      case 'set': {
        const setMatch = args.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/);
        if (setMatch) {
          return { type: 'set', optionName: setMatch[1], value: setMatch[2] };
        }
        return { type: 'set', optionName: args, value: '' };
      }
      case 'if': {
        const ifMatch = args.match(/(\w+)\s*(=|!=|<|>|<=|>=)\s*['"]?([^'"]+)['"]?/);
        if (ifMatch) {
          return { type: 'if', optionName: ifMatch[1], operator: ifMatch[2] as any, value: ifMatch[3] };
        }
        return { type: 'if', optionName: args, operator: '=', value: '' };
      }
      case 'layer':
        return { type: 'layer', layerName: args.replace(/['"]/g, '').trim() };
      case 'platform':
        // platform() is a conditional, return as-is for now
        return { type: 'if', optionName: 'platform', operator: '=', value: args.replace(/['"]/g, '').trim() };
      default:
        return { type: 'output', value: `${funcName}(${args})` };
    }
  }
}

/**
 * Convenience function to parse KMN source
 */
export function parseKmn(source: string, filename?: string): KmnKeyboard {
  const parser = new KmnParser();
  return parser.parse(source, filename);
}
