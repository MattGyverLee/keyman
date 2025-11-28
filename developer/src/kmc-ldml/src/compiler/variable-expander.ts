/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Utility for expanding variables and markers in LDML patterns
 */

import { LDMLKeyboard } from '@keymanapp/developer-utils';
import { LdmlKeyboardTypes } from '@keymanapp/common-types';

import LKVariables = LDMLKeyboard.LKVariables;

/**
 * Expansion mode determines how markers are converted
 */
export type ExpansionMode = 'pattern' | 'output' | 'text';

/**
 * Handles expansion of string variables, set variables, and markers in LDML keyboard
 * patterns and outputs.
 *
 * This class is responsible for transforming LDML-specific syntax into runtime
 * representations that can be used in JavaScript code:
 *
 * - String variables: ${varname} → expanded literal value
 * - Set variables: $[setname] → regex alternation (?:a|b|c)
 * - Unicode sets: $[usetname] → character class [a-z]
 * - Markers: \m{markername} → sentinel values for runtime matching
 * - Unicode escapes: \u{XXXX} → actual Unicode characters
 *
 * The class handles different expansion modes:
 * - Pattern mode: For transform 'from' patterns (markers become regex patterns)
 * - Output mode: For transform 'to' and key outputs (markers become sentinel values)
 * - Text mode: For display strings (no special processing)
 *
 * @example
 * ```typescript
 * const expander = new VariableExpander(variables, markerMap);
 * const pattern = expander.convertMarkersToPattern('\\m{vowel}a');
 * const output = expander.convertMarkersToOutput('b\\m{consonant}');
 * ```
 */
export class VariableExpander {
  constructor(
    private readonly variables: LKVariables | null,
    private readonly markerMap: Map<string, number>
  ) {}

  /**
   * Expand string variables ${name} in a string
   * @param s The string containing variable references
   * @returns The string with variables expanded
   */
  expandStringVariables(s: string): string {
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
   * Converts sets to regex alternation patterns: (?:a|b|c)
   * @param s The string containing set references
   * @returns The string with sets expanded to regex
   */
  expandSetVariables(s: string): string {
    if (!this.variables?.set && !this.variables?.uset) return s;

    return s.replace(LdmlKeyboardTypes.VariableParser.SET_REFERENCE, (match, name) => {
      // Check regular sets first
      const setVar = this.variables?.set?.find(v => v.id === name);
      if (setVar) {
        const items = LdmlKeyboardTypes.VariableParser.setSplitter(setVar.value);
        return `(?:${items.map((i: string) => this.escapeRegexChar(i)).join('|')})`;
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
   * Used in transform 'from' patterns
   * @param s The string containing marker references
   * @returns The string with markers converted to regex
   */
  convertMarkersToPattern(s: string): string {
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
   * Used in transform 'to' patterns and key outputs
   * @param s The string containing marker references
   * @returns The string with markers converted to sentinels
   */
  convertMarkersToOutput(s: string): string {
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
   * @param s The string containing Unicode escapes
   * @returns The string with escapes converted
   */
  convertUnicodeEscapes(s: string): string {
    return s.replace(/\\u\{([0-9a-fA-F]{1,6})\}/g, (match, hex) => {
      return String.fromCodePoint(parseInt(hex, 16));
    });
  }

  /**
   * Escape a single character for use in regex
   * @param s The character to escape
   * @returns The escaped character
   */
  private escapeRegexChar(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Escape special regex characters but preserve LDML syntax
   * @param s The pattern to escape
   * @returns The escaped pattern
   */
  escapePatternForRegex(s: string): string {
    // Escape these: . * + ? ^ $ { } | [ ] ( ) \
    // But not when they're part of LDML syntax
    return s.replace(/([.+?^${}|[\]\\])/g, '\\$1')
            .replace(/\\\*/g, '*'); // Restore * for regex use if needed
  }

  /**
   * Convert LDML reorder pattern to JavaScript regex
   * Handles unicode sets, escapes, and literal characters
   * @param pattern The LDML reorder pattern
   * @returns The regex pattern string
   */
  convertReorderPatternToRegex(pattern: string): string {
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
}
