"use strict";
/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Parser for KMN keyboard source files.
 * Converts .kmn text to AST representation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KmnParser = void 0;
exports.parseKmn = parseKmn;
var kmn_ast_js_1 = require("./kmn-ast.js");
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
var KmnParser = /** @class */ (function () {
    function KmnParser() {
        this.lines = [];
        this.lineIndex = 0;
        this.filename = '';
    }
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
    KmnParser.prototype.parse = function (source, filename) {
        this.filename = filename || '';
        this.lines = source.split(/\r?\n/);
        this.lineIndex = 0;
        var keyboard = {
            stores: [],
            groups: [],
            filename: this.filename,
        };
        while (this.lineIndex < this.lines.length) {
            var line = this.currentLine();
            var trimmed = this.stripComment(line).trim();
            if (!trimmed) {
                this.lineIndex++;
                continue;
            }
            // Parse different line types
            if (trimmed.toLowerCase().startsWith('store(')) {
                var store = this.parseStore(trimmed);
                if (store)
                    keyboard.stores.push(store);
            }
            else if (trimmed.toLowerCase().startsWith('begin ')) {
                keyboard.begin = this.parseBegin(trimmed);
            }
            else if (trimmed.toLowerCase().startsWith('group(')) {
                var group = this.parseGroup(trimmed);
                keyboard.groups.push(group);
            }
            else if (this.isRuleLine(trimmed)) {
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
                var rule = this.parseRule(trimmed);
                if (rule) {
                    keyboard.groups[keyboard.groups.length - 1].rules.push(rule);
                }
            }
            this.lineIndex++;
        }
        return keyboard;
    };
    KmnParser.prototype.currentLine = function () {
        return this.lines[this.lineIndex] || '';
    };
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
    KmnParser.prototype.stripComment = function (line) {
        // Handle 'c ' at start of line (comment)
        if (/^c\s/i.test(line.trim())) {
            return '';
        }
        // Handle inline comments - but be careful not to strip 'c' inside strings
        var result = '';
        var inString = false;
        var stringChar = '';
        for (var i = 0; i < line.length; i++) {
            var ch = line[i];
            if (!inString && (ch === '"' || ch === "'")) {
                inString = true;
                stringChar = ch;
                result += ch;
            }
            else if (inString && ch === stringChar) {
                inString = false;
                result += ch;
            }
            else if (!inString && ch === 'c' && (i === 0 || /\s/.test(line[i - 1])) && i + 1 < line.length && /\s/.test(line[i + 1])) {
                // Found 'c ' comment marker
                break;
            }
            else {
                result += ch;
            }
        }
        return result;
    };
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
    KmnParser.prototype.parseStore = function (line) {
        // store(&NAME) 'value' or store(name) value
        // Note: Store names can include hyphens (e.g., comp-dia)
        var match = line.match(/^store\s*\(\s*(&?)([\w-]+)\s*\)\s*(.+)$/i);
        if (!match)
            return null;
        var isSystem = match[1] === '&';
        var name = match[2];
        var valueStr = match[3].trim();
        var parsed = this.parseStoreValue(valueStr);
        return {
            name: name,
            isSystem: isSystem,
            value: parsed.value,
            valueFormat: parsed.format,
            line: this.lineIndex + 1,
            storeType: isSystem ? kmn_ast_js_1.KmnStoreType.Reserved : kmn_ast_js_1.KmnStoreType.Normal,
        };
    };
    /**
     * Parse store value (handles strings, U+XXXX sequences, nul, ranges, etc.)
     */
    KmnParser.prototype.parseStoreValue = function (valueStr) {
        // Handle quoted strings
        if (valueStr.startsWith("'") || valueStr.startsWith('"')) {
            return this.parseQuotedString(valueStr);
        }
        // Handle space-separated U+XXXX sequences (and nul keywords)
        // e.g., "U+0020 U+0030 U+0029 nul nul"
        if (valueStr.match(/^(U\+[0-9A-Fa-f]+|nul)(\s|$)/i)) {
            return this.parseSpaceSeparatedValues(valueStr);
        }
        // Handle other value types (ranges, etc.) - treat as literals
        var format = [];
        for (var _i = 0, valueStr_1 = valueStr; _i < valueStr_1.length; _i++) {
            var char = valueStr_1[_i];
            format.push({ char: char, format: 'literal' });
        }
        return { value: valueStr, format: format };
    };
    /**
     * Parse space-separated U+XXXX codes and nul keywords
     */
    KmnParser.prototype.parseSpaceSeparatedValues = function (str) {
        var result = '';
        var format = [];
        var tokens = str.split(/\s+/).filter(function (t) { return t.length > 0; });
        for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
            var token = tokens_1[_i];
            if (token.match(/^U\+[0-9A-Fa-f]+$/i)) {
                // Unicode codepoint
                var codepoint = parseInt(token.substring(2), 16);
                var char = String.fromCodePoint(codepoint);
                result += char;
                format.push({ char: char, format: 'uplus' });
            }
            else if (token.toLowerCase() === 'nul') {
                // nul keyword - use special marker
                result += KmnParser.NUL_MARKER;
                format.push({ char: KmnParser.NUL_MARKER, format: 'uplus' });
            }
            else {
                // Unknown token - skip or could be end of values
                break;
            }
        }
        return { value: result, format: format };
    };
    /**
     * Parse a quoted string value
     */
    KmnParser.prototype.parseQuotedString = function (str) {
        var quote = str[0];
        var result = '';
        var format = [];
        var i = 1;
        while (i < str.length) {
            if (str[i] === quote) {
                // Check for continuation
                var rest = str.substring(i + 1).trim();
                if (rest.startsWith("'") || rest.startsWith('"') || rest.startsWith('U+') || rest.match(/^\[/) || rest.match(/^nul\b/i)) {
                    // Continuation - parse the rest
                    var parsed = this.parseStoreValue(rest);
                    result += parsed.value;
                    format.push.apply(format, parsed.format);
                }
                break;
            }
            var char = str[i];
            result += char;
            format.push({ char: char, format: 'literal' });
            i++;
        }
        return { value: result, format: format };
    };
    /**
     * Parse begin statement
     */
    KmnParser.prototype.parseBegin = function (line) {
        // begin Unicode > use(main)
        var match = line.match(/^begin\s+(unicode|ansi)\s*>\s*use\s*\(\s*(\w+)\s*\)/i);
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
    };
    /**
     * Parse group definition
     */
    KmnParser.prototype.parseGroup = function (line) {
        // group(name) [using keys] [readonly]
        var match = line.match(/^group\s*\(\s*(\w+)\s*\)\s*(.*)/i);
        var name = match ? match[1] : 'unknown';
        var rest = match ? match[2].toLowerCase() : '';
        var group = {
            name: name,
            usingKeys: rest.includes('using keys'),
            readonly: rest.includes('readonly'),
            rules: [],
            line: this.lineIndex + 1,
        };
        // Parse rules that follow this group
        this.lineIndex++;
        while (this.lineIndex < this.lines.length) {
            var ruleLine = this.stripComment(this.currentLine()).trim();
            // Stop at next group or store definition
            if (!ruleLine || ruleLine.toLowerCase().startsWith('group(') || ruleLine.toLowerCase().startsWith('store(')) {
                this.lineIndex--;
                break;
            }
            if (this.isRuleLine(ruleLine)) {
                var rule = this.parseRule(ruleLine);
                if (rule)
                    group.rules.push(rule);
            }
            this.lineIndex++;
        }
        return group;
    };
    /**
     * Check if a line looks like a rule
     */
    KmnParser.prototype.isRuleLine = function (line) {
        // Rules contain: + > or just > (for match/nomatch)
        return line.includes('>') || line.toLowerCase().startsWith('match') || line.toLowerCase().startsWith('nomatch');
    };
    /**
     * Parse a rule line
     */
    KmnParser.prototype.parseRule = function (line) {
        var rule = {
            context: [],
            output: [],
            line: this.lineIndex + 1,
        };
        // Handle match > use(group) and nomatch > use(group)
        if (line.toLowerCase().startsWith('match')) {
            rule.isMatch = true;
            var match = line.match(/^match\s*>\s*(.+)$/i);
            if (match) {
                rule.output = this.parseRuleElements(match[1]);
            }
            return rule;
        }
        if (line.toLowerCase().startsWith('nomatch')) {
            rule.isNomatch = true;
            var match = line.match(/^nomatch\s*>\s*(.+)$/i);
            if (match) {
                rule.output = this.parseRuleElements(match[1]);
            }
            return rule;
        }
        // Parse regular rules: [context] + [key] > output
        // Split on >
        var arrowPos = line.indexOf('>');
        if (arrowPos === -1)
            return null;
        var lhs = line.substring(0, arrowPos).trim();
        var rhs = line.substring(arrowPos + 1).trim();
        // Parse LHS: [context] + [key]
        var plusPos = lhs.lastIndexOf('+');
        if (plusPos !== -1) {
            var contextPart = lhs.substring(0, plusPos).trim();
            var keyPart = lhs.substring(plusPos + 1).trim();
            if (contextPart) {
                rule.context = this.parseRuleElements(contextPart);
            }
            rule.key = this.parseKeySpec(keyPart);
        }
        else {
            // No key, just context > output (readonly group rule)
            rule.context = this.parseRuleElements(lhs);
        }
        // Parse RHS (output)
        rule.output = this.parseRuleElements(rhs);
        return rule;
    };
    /**
     * Parse a key specification: [SHIFT K_A] or 'a'
     */
    KmnParser.prototype.parseKeySpec = function (keyStr) {
        var spec = {};
        // Handle virtual key in brackets: [SHIFT K_A]
        if (keyStr.startsWith('[')) {
            var content = keyStr.slice(1, -1).trim();
            var parts = content.split(/\s+/);
            for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
                var part = parts_1[_i];
                var upper = part.toUpperCase();
                if (upper === 'SHIFT')
                    spec.shift = true;
                else if (upper === 'CTRL' || upper === 'LCTRL' || upper === 'RCTRL')
                    spec.ctrl = true;
                else if (upper === 'ALT' || upper === 'LALT' || upper === 'RALT')
                    spec.alt = true;
                else if (upper === 'CAPS')
                    spec.caps = true;
                else if (upper === 'NCAPS')
                    spec.ncaps = true;
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
    };
    /**
     * Parse rule elements (context or output)
     */
    KmnParser.prototype.parseRuleElements = function (str) {
        var elements = [];
        var i = 0;
        while (i < str.length) {
            // Skip whitespace
            while (i < str.length && /\s/.test(str[i]))
                i++;
            if (i >= str.length)
                break;
            // Parse different element types
            var remaining = str.substring(i);
            // String literal
            if (remaining.startsWith("'") || remaining.startsWith('"')) {
                var quote = remaining[0];
                var j = 1;
                while (j < remaining.length && remaining[j] !== quote)
                    j++;
                var value = remaining.substring(1, j);
                elements.push({ type: 'char', value: value });
                i += j + 1;
            }
            // Unicode codepoint U+XXXX
            else if (remaining.match(/^U\+[0-9A-Fa-f]+/i)) {
                var match = remaining.match(/^U\+([0-9A-Fa-f]+)/i);
                var codepoint = parseInt(match[1], 16);
                elements.push({ type: 'char', value: String.fromCodePoint(codepoint) });
                i += match[0].length;
            }
            // Function calls
            else if (remaining.match(/^(any|notany|index|use|dk|deadkey|context|nul|beep|set|if|layer|platform)\s*\(/i)) {
                var funcMatch = remaining.match(/^(\w+)\s*\(([^)]*)\)/i);
                if (funcMatch) {
                    var funcName = funcMatch[1].toLowerCase();
                    var args = funcMatch[2].trim();
                    elements.push(this.parseFunctionElement(funcName, args));
                    i += funcMatch[0].length;
                }
                else {
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
    };
    /**
     * Parse a function element (any, index, use, etc.)
     */
    KmnParser.prototype.parseFunctionElement = function (funcName, args) {
        switch (funcName) {
            case 'any':
                return { type: 'any', storeName: args.trim() };
            case 'notany':
                return { type: 'notany', storeName: args.trim() };
            case 'index': {
                var parts = args.split(',').map(function (s) { return s.trim(); });
                return { type: 'index', storeName: parts[0], offset: parseInt(parts[1]) || 1 };
            }
            case 'use':
                return { type: 'use', groupName: args.trim() };
            case 'dk':
            case 'deadkey':
                return { type: 'deadkey', name: args.trim() };
            case 'context': {
                var offset = parseInt(args);
                return { type: 'context', offset: isNaN(offset) ? undefined : offset };
            }
            case 'nul':
                return { type: 'nul' };
            case 'beep':
                return { type: 'beep' };
            case 'set': {
                var setMatch = args.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/);
                if (setMatch) {
                    return { type: 'set', optionName: setMatch[1], value: setMatch[2] };
                }
                return { type: 'set', optionName: args, value: '' };
            }
            case 'if': {
                var ifMatch = args.match(/(\w+)\s*(=|!=|<|>|<=|>=)\s*['"]?([^'"]+)['"]?/);
                if (ifMatch) {
                    return { type: 'if', optionName: ifMatch[1], operator: ifMatch[2], value: ifMatch[3] };
                }
                return { type: 'if', optionName: args, operator: '=', value: '' };
            }
            case 'layer':
                return { type: 'layer', layerName: args.replace(/['"]/g, '').trim() };
            case 'platform':
                // platform() is a conditional, return as-is for now
                return { type: 'if', optionName: 'platform', operator: '=', value: args.replace(/['"]/g, '').trim() };
            default:
                return { type: 'output', value: "".concat(funcName, "(").concat(args, ")") };
        }
    };
    /**
     * Special marker for 'nul' entries in stores (U+FFFF is not a valid character)
     */
    KmnParser.NUL_MARKER = '\uFFFF';
    return KmnParser;
}());
exports.KmnParser = KmnParser;
/**
 * Convenience function to parse KMN source
 */
function parseKmn(source, filename) {
    var parser = new KmnParser();
    return parser.parse(source, filename);
}
