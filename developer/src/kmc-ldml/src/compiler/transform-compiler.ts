/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Compiles LDML transforms to JavaScript functions
 */

import { LDMLKeyboard } from '@keymanapp/developer-utils';
import { LdmlKeyboardTypes } from '@keymanapp/common-types';
import { JavaScriptBuilder } from './javascript-builder.js';
import { VariableExpander } from './variable-expander.js';

import LKKeyboard = LDMLKeyboard.LKKeyboard;
import LKTransformGroup = LDMLKeyboard.LKTransformGroup;
import LKTransform = LDMLKeyboard.LKTransform;
import LKReorder = LDMLKeyboard.LKReorder;
import LKVariables = LDMLKeyboard.LKVariables;

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
 * Compiled reorder rule
 */
interface CompiledReorder {
  pattern: string;
  orders: number[];
  before?: string;
  tertiary?: number[];
  tertiaryBase?: boolean[];
  preBase?: boolean[];
}

/**
 * Compiles LDML transform rules to JavaScript functions.
 *
 * This compiler transforms LDML transform specifications into executable JavaScript
 * functions that handle text processing in KeymanWeb. It supports:
 *
 * Transform types:
 * - Simple transforms: Pattern-based text substitution using regex
 * - Set mapping transforms: Character-to-character mapping via sets
 * - Reorder transforms: Script-specific character reordering (Thai, Lao, etc.)
 * - Backspace transforms: Special handling of backspace behavior
 *
 * Generated functions:
 * - gs(): Main transform function for text processing
 * - gbs(): Backspace transform function for special backspace behavior
 *
 * The compiler handles:
 * - Variable expansion (string, set, uset)
 * - Marker conversion to regex patterns or sentinel values
 * - Unicode escape processing
 * - Set-based character mapping with capture groups
 * - Complex reordering logic for scripts with non-phonetic character order
 *
 * @example
 * ```typescript
 * const compiler = new TransformCompiler(expander, variables, markerMap);
 * compiler.generateTransformFunction(keyboard, builder);
 * compiler.generateBackspaceFunction(keyboard, builder);
 * ```
 */
export class TransformCompiler {
  constructor(
    private readonly expander: VariableExpander,
    private readonly variables: LKVariables | null,
    private readonly markerMap: Map<string, number>
  ) {}

  /**
   * Generate the gs() transform function from LDML transforms
   */
  generateTransformFunction(keyboard: LKKeyboard, builder: JavaScriptBuilder): void {
    // Find simple transforms
    const simpleTransforms = keyboard.transforms?.find(t => t.type === 'simple');

    if (!simpleTransforms?.transformGroup?.length) {
      // No transforms - generate a simple passthrough function
      builder
        .openBlock('this.gs=function(t,e)')
          .append('return 0;')
        .closeBlock(';');
      return;
    }

    // Build the transform function
    builder.openBlock('this.gs=function(t,e)');
    builder.append('var k=KeymanWeb,r=0,m=0;');

    // Generate marker buffer helper
    if (this.markerMap.size > 0) {
      builder.append('var ctx=k.KC(0,t.length,t);');
    }

    // Process each transform group sequentially
    for (let groupIndex = 0; groupIndex < simpleTransforms.transformGroup.length; groupIndex++) {
      const group = simpleTransforms.transformGroup[groupIndex];

      if (group.transform && group.transform.length > 0) {
        builder.blankLine();
        builder.comment(`TransformGroup ${groupIndex + 1}`);
        this.generateTransformGroupCode(group, builder, groupIndex);
      }

      if (group.reorder && group.reorder.length > 0) {
        builder.blankLine();
        builder.comment(`Reorder Group ${groupIndex + 1}`);
        this.generateReorderGroupCode(group, builder);
      }
    }

    builder.append('return r;');
    builder.closeBlock(';');
  }

  /**
   * Generate code for a transform group
   */
  private generateTransformGroupCode(group: LKTransformGroup, builder: JavaScriptBuilder, groupIndex: number): void {
    const transforms = group.transform || [];

    // Compile transforms to patterns
    const compiledTransforms = transforms.map(t => this.compileTransform(t));

    // Generate match attempts for each transform
    for (let i = 0; i < compiledTransforms.length; i++) {
      const ct = compiledTransforms[i];
      const original = transforms[i];

      builder.comment(`"${this.escapeString(original.from || '')}" -> "${this.escapeString(original.to || '')}"`);

      if (ct.mapFrom && ct.mapTo) {
        // Set mapping transform
        this.generateSetMappingTransform(ct, builder, i);
      } else {
        // Simple regex transform
        this.generateSimpleTransform(ct, builder, i);
      }
    }
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
    pattern = this.expander.expandStringVariables(pattern);
    replacement = this.expander.expandStringVariables(replacement);

    // Expand set variables in pattern (not for capture)
    if (!mapFrom) {
      pattern = this.expander.expandSetVariables(pattern);
    }

    // Convert markers to regex patterns
    pattern = this.expander.convertMarkersToPattern(pattern);

    // Convert markers in replacement to sentinel values
    replacement = this.expander.convertMarkersToOutput(replacement);

    // Handle Unicode escapes
    pattern = this.expander.convertUnicodeEscapes(pattern);
    replacement = this.expander.convertUnicodeEscapes(replacement);

    // Escape special regex chars (except what LDML uses)
    pattern = this.expander.escapePatternForRegex(pattern);

    // Add end anchor
    pattern = pattern + '$';

    return { pattern, replacement, mapFrom, mapTo };
  }

  /**
   * Generate code for a simple (non-set-mapping) transform
   */
  private generateSimpleTransform(ct: CompiledTransform, builder: JavaScriptBuilder, index: number): void {
    const varName = `m${index}`;

    builder.openBlock(`if((${varName}=/${ct.pattern}/.exec(k.KC(0,t.length,t))))`);
    builder.append(`k.KO(0,t,${varName}[0].length,"${this.escapeString(ct.replacement)}");`);
    builder.append('r=1;');
    builder.closeBlock();
  }

  /**
   * Generate code for a set-mapping transform
   */
  private generateSetMappingTransform(ct: CompiledTransform, builder: JavaScriptBuilder, index: number): void {
    const varName = `m${index}`;

    // Get the sets
    const fromSet = this.variables?.set?.find(v => v.id === ct.mapFrom);
    const toSet = this.variables?.set?.find(v => v.id === ct.mapTo);

    if (!fromSet || !toSet) {
      builder.comment('Warning: Missing set for mapping');
      return;
    }

    const fromItems = LdmlKeyboardTypes.VariableParser.setSplitter(fromSet.value);

    // Build the pattern with capture group
    const capturePattern = ct.pattern.replace(
      /\$\[([^\]]+)\]/,
      `(${fromItems.map((i: string) => this.escapeRegexChar(i)).join('|')})`
    );

    builder.openBlock(`if((${varName}=/${capturePattern}/.exec(k.KC(0,t.length,t))))`);
    builder.append(`var _i=this._vset["${ct.mapFrom}"].indexOf(${varName}[1]);`);
    builder.openBlock('if(_i>=0 && _i<this._vset["' + ct.mapTo + '"].length)');
    builder.append(`k.KO(0,t,${varName}[0].length,this._vset["${ct.mapTo}"][_i]);`);
    builder.append('r=1;');
    builder.closeBlock();
    builder.closeBlock();
  }

  /**
   * Generate code for a reorder group
   *
   * Reorder transforms handle scripts where visual/phonetic order differs from
   * logical typing order (e.g., Thai, Lao, Bengali, Khmer). Characters are
   * assigned order values and sorted accordingly after each keystroke.
   */
  private generateReorderGroupCode(group: LKTransformGroup, builder: JavaScriptBuilder): void {
    const reorders = group.reorder || [];

    if (reorders.length === 0) {
      return;
    }

    // Compile reorder rules
    const rules: CompiledReorder[] = [];
    for (const reorder of reorders) {
      const rule = this.compileReorderRule(reorder);
      if (rule) {
        rules.push(rule);
      }
    }

    if (rules.length === 0) {
      return;
    }

    // Generate the reorder data as a JSON structure
    builder.comment('Reorder rules for script ordering');
    builder.append('var _rord=[');
    builder.increaseIndent();

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
      const comma = i < rules.length - 1 ? ',' : '';
      builder.append(`${JSON.stringify(ruleObj)}${comma}`);
    }

    builder.decreaseIndent();
    builder.append('];');

    // Generate the reorder processing function using IIFE
    builder.comment('Process reorder: match characters and sort by order values');
    builder.openBlock('(function(ctx)');
    builder.append('if (!ctx || ctx.length === 0) return;');
    builder.append('var matched = [], orders = [], positions = [];');
    builder.comment('Scan context for reorderable characters');

    builder.openBlock('for (var i = 0; i < ctx.length; i++)');
    builder.append('var ch = ctx.charAt(i);');
    builder.comment('Handle surrogate pairs');
    builder.openBlock('if (ch.charCodeAt(0) >= 0xD800 && ch.charCodeAt(0) <= 0xDBFF && i + 1 < ctx.length)');
    builder.append('ch = ctx.substring(i, i + 2); i++;');
    builder.closeBlock();
    builder.append('var ord = 0, tert = 0, found = false;');
    builder.comment('Check each reorder rule');

    builder.openBlock('for (var ri = 0; ri < _rord.length; ri++)');
    builder.append('var rule = _rord[ri];');
    builder.comment('Check before constraint if present');
    builder.openBlock('if (rule.b)');
    builder.append('var beforeCtx = ctx.substring(0, positions.length > 0 ? positions[0] : i);');
    builder.append("if (!new RegExp(rule.b + '$').test(beforeCtx)) continue;");
    builder.closeBlock();
    builder.comment('Match character against pattern');
    builder.append("var m = new RegExp('^(' + rule.p + ')').exec(ch);");
    builder.openBlock('if (m)');
    builder.comment('Find which element matched (for multi-element patterns)');
    builder.append('ord = rule.o[0] || 0;');
    builder.append('if (rule.t) tert = rule.t[0] || 0;');
    builder.append('found = true; break;');
    builder.closeBlock();
    builder.closeBlock();

    builder.append('matched.push(ch);');
    builder.append('orders.push({o: ord, t: tert, c: ch, i: positions.length});');
    builder.append('positions.push(i - (ch.length - 1));');
    builder.closeBlock();

    builder.comment('Sort by order (primary) then tertiary (secondary) then original position (stable)');
    builder.openBlock('orders.sort(function(a, b)');
    builder.append('if (a.o !== b.o) return a.o - b.o;');
    builder.append('if (a.t !== b.t) return a.t - b.t;');
    builder.append('return a.i - b.i;');
    builder.closeBlock(');');

    builder.comment('Build reordered string');
    builder.append("var reordered = '';");
    builder.append('for (var j = 0; j < orders.length; j++) reordered += orders[j].c;');
    builder.comment('If changed, output the reordered text');
    builder.openBlock('if (reordered !== ctx)');
    builder.append('k.KO(0, t, ctx.length, reordered);');
    builder.append('r = 1;');
    builder.closeBlock();

    builder.closeBlock(')(k.KC(0, t.length, t));');
  }

  /**
   * Compile a single reorder rule to pattern and order values
   */
  private compileReorderRule(reorder: LKReorder): CompiledReorder | null {
    if (!reorder.from) return null;

    // Parse the 'from' pattern into elements
    let pattern = reorder.from;

    // Expand string variables
    pattern = this.expander.expandStringVariables(pattern);

    // Convert unicode escapes
    pattern = this.expander.convertUnicodeEscapes(pattern);

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
    const regexPattern = this.expander.convertReorderPatternToRegex(pattern);

    // Compile before constraint if present
    let before: string | undefined;
    if (reorder.before) {
      let beforePattern = reorder.before;
      beforePattern = this.expander.expandStringVariables(beforePattern);
      beforePattern = this.expander.convertUnicodeEscapes(beforePattern);
      before = this.expander.convertReorderPatternToRegex(beforePattern);
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
   * Generate the gbs() backspace transform function
   */
  generateBackspaceFunction(keyboard: LKKeyboard, builder: JavaScriptBuilder): void {
    // Find backspace transforms
    const bkspTransforms = keyboard.transforms?.find(t => t.type === 'backspace');

    if (!bkspTransforms?.transformGroup?.length) {
      return; // No backspace transforms
    }

    builder.openBlock('this.gbs=function(t,e)');
    builder.append('var k=KeymanWeb,r=0,m=0;');

    // Process each transform group
    for (let groupIndex = 0; groupIndex < bkspTransforms.transformGroup.length; groupIndex++) {
      const group = bkspTransforms.transformGroup[groupIndex];

      if (group.transform && group.transform.length > 0) {
        builder.blankLine();
        builder.comment(`Backspace TransformGroup ${groupIndex + 1}`);

        for (let i = 0; i < group.transform.length; i++) {
          const transform = group.transform[i];
          const ct = this.compileTransform(transform);

          builder.comment(`"${this.escapeString(transform.from || '')}" -> "${this.escapeString(transform.to || '')}"`);
          this.generateSimpleTransform(ct, builder, i);
        }
      }
    }

    builder.append('return r;');
    builder.closeBlock(';');
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
   * Escape a single character for regex
   */
  private escapeRegexChar(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
