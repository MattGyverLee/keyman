"use strict";
/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * KMN Generator: Converts LDML keyboard XML to KMN source format
 *
 * This module provides reverse conversion from LDML (Locale Data Markup Language)
 * keyboard format to legacy KMN (Keyman) source format. It enables round-trip
 * conversion testing and migration paths from LDML back to KMN when needed.
 *
 * Key features:
 * - Parses LDML XML and generates equivalent KMN source code
 * - Converts LDML layers to KMN key rules with modifiers
 * - Maps LDML variables to KMN stores
 * - Transforms LDML transforms to KMN transform groups
 * - Handles markers (deadkeys), sets, and Unicode character output
 * - Preserves metadata (name, version, copyright, author)
 *
 * Limitations:
 * - Some LDML features may not have direct KMN equivalents
 * - Touch-specific features may be simplified
 * - Complex transforms may require manual adjustment
 * - Generated KMN may need manual refinement for production use
 *
 * @example
 * ```typescript
 * import { generateKmn } from '@keymanapp/kmc-kmn-to-ldml';
 *
 * const ldmlXml = fs.readFileSync('keyboard.xml', 'utf-8');
 * const kmnSource = generateKmn(ldmlXml);
 * fs.writeFileSync('keyboard.kmn', kmnSource, 'utf-8');
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KmnGenerator = void 0;
exports.parseLdmlXml = parseLdmlXml;
exports.generateKmn = generateKmn;
/**
 * KMN Generator Class
 *
 * Generates KMN keyboard source code from parsed LDML keyboard data.
 *
 * This class converts LDML structures to their KMN equivalents:
 * - LDML info → KMN system stores (&NAME, &VERSION, etc.)
 * - LDML variables (string/set/uset) → KMN user stores
 * - LDML layers with modifiers → KMN key rules with modifier combinations
 * - LDML transforms → KMN transform groups
 * - LDML markers → KMN deadkeys (dk)
 * - LDML variable references → KMN any()/index() functions
 *
 * The generated KMN follows standard Keyman keyboard conventions and
 * should compile successfully with the Keyman Developer compiler.
 *
 * @example
 * ```typescript
 * const generator = new KmnGenerator();
 * const ldmlData = parseLdmlXml(xmlString);
 * const kmnSource = generator.generate(ldmlData);
 * ```
 */
var KmnGenerator = /** @class */ (function () {
    function KmnGenerator() {
        this.indent = '';
    }
    /**
     * Generate KMN source string from LDML keyboard data.
     *
     * This method orchestrates the complete KMN generation process:
     * 1. Writes header comment with source information
     * 2. Generates system stores (NAME, VERSION, COPYRIGHT, etc.)
     * 3. Generates user stores from LDML variables
     * 4. Writes begin Unicode statement
     * 5. Generates main group with key rules from layers
     * 6. Generates transform group if transforms are present
     *
     * @param ldml - Parsed LDML keyboard data structure
     * @returns Complete KMN source code as a string
     */
    KmnGenerator.prototype.generate = function (ldml) {
        var lines = [];
        // Header comment
        lines.push("c Converted from LDML keyboard: ".concat(ldml.locale));
        lines.push('');
        // System stores
        lines.push("store(&NAME) '".concat(this.escapeKmn(ldml.name), "'"));
        if (ldml.version) {
            lines.push("store(&KEYBOARDVERSION) '".concat(this.escapeKmn(ldml.version), "'"));
        }
        if (ldml.author) {
            lines.push("store(&COPYRIGHT) '".concat(this.escapeKmn(ldml.author), "'"));
        }
        lines.push("store(&VERSION) '10.0'");
        lines.push("store(&TARGETS) 'any'");
        lines.push('');
        // User stores from variables
        for (var _i = 0, _a = ldml.variables; _i < _a.length; _i++) {
            var variable = _a[_i];
            var value = this.formatStoreValue(variable.value, variable.type, variable.valueFormat);
            lines.push("store(".concat(variable.id, ") ").concat(value));
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
        var keyRules = this.generateKeyRules(ldml);
        lines.push.apply(lines, keyRules);
        // Process transforms - some may become key rules with context output
        if (ldml.transforms.length > 0) {
            var _b = this.classifyTransforms(ldml), keyTransforms = _b.keyTransforms, regularTransforms = _b.regularTransforms;
            // Add key-triggered transforms as key rules with context output
            if (keyTransforms.length > 0) {
                lines.push('');
                for (var _c = 0, keyTransforms_1 = keyTransforms; _c < keyTransforms_1.length; _c++) {
                    var kt = keyTransforms_1[_c];
                    lines.push("".concat(kt.context, " + ").concat(kt.key, " > context"));
                }
            }
            // Generate transform group for remaining transforms
            if (regularTransforms.length > 0) {
                lines.push('');
                lines.push('match > use(transforms)');
                lines.push('');
                lines.push('group(transforms)');
                lines.push('');
                for (var _d = 0, regularTransforms_1 = regularTransforms; _d < regularTransforms_1.length; _d++) {
                    var transform = regularTransforms_1[_d];
                    var from = this.formatTransformPattern(transform.from);
                    var to = this.formatTransformOutput(transform.to, transform.toFormat);
                    lines.push("".concat(from, " > ").concat(to));
                }
            }
        }
        return lines.join('\n') + '\n';
    };
    /**
     * Classify transforms into key-triggered and regular transforms.
     *
     * Detects transforms that match pattern: ($[store])keyOutput → $[1:store]
     * These represent "context preservation" rules and convert to: any(store) + [KEY] > context
     *
     * @param ldml - Parsed LDML keyboard data
     * @returns Object with keyTransforms and regularTransforms arrays
     */
    KmnGenerator.prototype.classifyTransforms = function (ldml) {
        var keyTransforms = [];
        var regularTransforms = [];
        // Build map of key outputs to key IDs
        var outputToKey = new Map();
        for (var _i = 0, _a = ldml.keys; _i < _a.length; _i++) {
            var key = _a[_i];
            if (key.output && !key.gap) {
                if (!outputToKey.has(key.output)) {
                    outputToKey.set(key.output, []);
                }
                // Extract modifiers from key ID (e.g., "K_A_shift" → "shift")
                var parts = key.id.split('_');
                var baseKey = parts.slice(0, 2).join('_'); // "K_A"
                var modifierParts = parts.slice(2); // ["shift"]
                var modifiers = modifierParts.join(' ').toUpperCase();
                outputToKey.get(key.output).push({ keyId: baseKey, modifiers: modifiers });
            }
        }
        for (var _b = 0, _c = ldml.transforms; _b < _c.length; _b++) {
            var transform = _c[_b];
            // Pattern: ($[store])output → $[1:store]
            // This means: if output is typed after any(store), preserve just the store character
            var fromMatch = transform.from.match(/^\(\$\[([^\]]+)\]\)(.+)$/);
            var toMatch = transform.to.match(/^\$\[1:([^\]]+)\]$/);
            if (fromMatch && toMatch && fromMatch[1] === toMatch[1]) {
                var storeName = fromMatch[1];
                var keyOutput = fromMatch[2];
                // Find which key(s) produce this output
                var keyMatches = outputToKey.get(keyOutput);
                if (keyMatches && keyMatches.length > 0) {
                    // Generate a rule for EACH key that produces this output
                    // This handles both hardware keys (K_*) and touch keys (T_*)
                    for (var _d = 0, keyMatches_1 = keyMatches; _d < keyMatches_1.length; _d++) {
                        var _e = keyMatches_1[_d], keyId = _e.keyId, modifiers = _e.modifiers;
                        var keySpec = modifiers ? "[".concat(modifiers, " ").concat(keyId, "]") : "[".concat(keyId, "]");
                        keyTransforms.push({
                            context: "any(".concat(storeName, ")"),
                            key: keySpec,
                        });
                    }
                    continue; // Don't add to regularTransforms
                }
            }
            // Not a key-triggered transform
            regularTransforms.push(transform);
        }
        return { keyTransforms: keyTransforms, regularTransforms: regularTransforms };
    };
    /**
     * Generate key rules from LDML layers.
     *
     * Converts LDML layer definitions to KMN key rules. Each layer represents
     * a modifier state (e.g., base, shift, ctrl+alt), and each key in the layer
     * generates a corresponding KMN rule.
     *
     * Hardware layers are converted to virtual key rules with modifiers:
     * - `+ [K_A] > 'a'` (base layer)
     * - `+ [SHIFT K_A] > 'A'` (shift layer)
     * - `+ [RALT K_A] > 'α'` (altGr layer)
     *
     * Touch-specific keys (T_ prefix) are generated as touch key rules.
     *
     * @param ldml - Parsed LDML keyboard data
     * @returns Array of KMN rule strings
     */
    KmnGenerator.prototype.generateKeyRules = function (ldml) {
        var rules = [];
        var keyOutputs = new Map();
        // Build key output map from keys
        for (var _i = 0, _a = ldml.keys; _i < _a.length; _i++) {
            var key = _a[_i];
            if (key.output) {
                if (!keyOutputs.has(key.id)) {
                    keyOutputs.set(key.id, new Map());
                }
                keyOutputs.get(key.id).set('none', key.output);
            }
        }
        // Generate rules for hardware layers
        var hardwareLayers = ldml.layers.filter(function (l) { return l.formId !== 'touch'; });
        for (var _b = 0, hardwareLayers_1 = hardwareLayers; _b < hardwareLayers_1.length; _b++) {
            var layer = hardwareLayers_1[_b];
            var modifiers = this.ldmlModifiersToKmn(layer.modifiers);
            for (var _c = 0, _d = layer.rows; _c < _d.length; _c++) {
                var row = _d[_c];
                var _loop_1 = function (keyId) {
                    var key = ldml.keys.find(function (k) { return k.id === keyId; });
                    if ((key === null || key === void 0 ? void 0 : key.output) && !key.gap) {
                        // Extract base key ID (remove modifier suffixes like "_shift_altR")
                        var baseKeyId = this_1.extractBaseKeyId(keyId);
                        var vkey = this_1.formatVKey(baseKeyId, modifiers);
                        var output = this_1.formatOutput(key.output, key.outputFormat);
                        rules.push("+ ".concat(vkey, " > ").concat(output));
                    }
                };
                var this_1 = this;
                for (var _e = 0, row_1 = row; _e < row_1.length; _e++) {
                    var keyId = row_1[_e];
                    _loop_1(keyId);
                }
            }
        }
        // Generate rules for touch keys with special features
        for (var _f = 0, _g = ldml.keys; _f < _g.length; _f++) {
            var key = _g[_f];
            // Touch-only keys (T_ prefix)
            if (key.id.startsWith('T_') && key.output) {
                var output = this.formatOutput(key.output, key.outputFormat);
                rules.push("+ [".concat(key.id, "] > ").concat(output));
            }
        }
        return rules;
    };
    /**
     * Extract base key ID from a potentially compound key ID.
     *
     * LDML key IDs may include modifier suffixes like "_shift", "_altR", "_shift_altR".
     * This function extracts the base key ID by removing these suffixes.
     *
     * @param keyId - Full key ID (e.g., "K_1_shift_altR", "K_A", "T_0030")
     * @returns Base key ID (e.g., "K_1", "K_A", "T_0030")
     *
     * @example
     * ```typescript
     * extractBaseKeyId("K_1_shift_altR") → "K_1"
     * extractBaseKeyId("K_A_shift") → "K_A"
     * extractBaseKeyId("K_SPACE") → "K_SPACE"
     * ```
     */
    KmnGenerator.prototype.extractBaseKeyId = function (keyId) {
        // Remove common modifier suffixes from key IDs
        return keyId
            .replace(/_shift_altR$/, '')
            .replace(/_shift_ctrl$/, '')
            .replace(/_ctrl_altR$/, '')
            .replace(/_shift$/, '')
            .replace(/_altR$/, '')
            .replace(/_ctrl$/, '')
            .replace(/_caps$/, '');
    };
    /**
     * Convert LDML modifier string to KMN modifier format.
     *
     * LDML uses modifier names like "shift", "ctrl", "altR", "caps".
     * KMN uses uppercase names like "SHIFT", "CTRL", "RALT", "CAPS".
     *
     * @param modifiers - LDML modifier string (e.g., "shift", "ctrl+shift")
     * @returns KMN modifier string (e.g., "SHIFT", "CTRL SHIFT")
     *
     * @example
     * ```typescript
     * ldmlModifiersToKmn("shift") → "SHIFT"
     * ldmlModifiersToKmn("ctrl+altR") → "CTRL RALT"
     * ldmlModifiersToKmn("none") → ""
     * ```
     */
    KmnGenerator.prototype.ldmlModifiersToKmn = function (modifiers) {
        if (!modifiers || modifiers === 'none') {
            return '';
        }
        var parts = [];
        if (modifiers.includes('shift'))
            parts.push('SHIFT');
        if (modifiers.includes('ctrl'))
            parts.push('CTRL');
        if (modifiers.includes('altR') || modifiers.includes('alt'))
            parts.push('RALT');
        if (modifiers.includes('caps'))
            parts.push('CAPS');
        return parts.join(' ');
    };
    /**
     * Format a virtual key code for KMN rule syntax.
     *
     * Combines a key ID with optional modifiers into KMN virtual key format.
     *
     * @param keyId - Virtual key identifier (e.g., "K_A", "K_SPACE")
     * @param modifiers - KMN modifier string (e.g., "SHIFT", "CTRL RALT")
     * @returns Formatted virtual key (e.g., "[K_A]", "[SHIFT K_A]")
     */
    KmnGenerator.prototype.formatVKey = function (keyId, modifiers) {
        if (modifiers) {
            return "[".concat(modifiers, " ").concat(keyId, "]");
        }
        return "[".concat(keyId, "]");
    };
    /**
     * Format output text for KMN rule syntax.
     *
     * Converts LDML output strings to KMN output format:
     * - Markers (\m{name}) → deadkeys (dk(name))
     * - Single ASCII characters → quoted literals ('a')
     * - Unicode characters → U+xxxx format
     * - Multi-character output → space-separated sequence
     *
     * @param output - LDML output string
     * @returns KMN-formatted output string
     *
     * @example
     * ```typescript
     * formatOutput("a") → "'a'"
     * formatOutput("α") → "U+03B1"
     * formatOutput("abc") → "'a' 'b' 'c'"
     * formatOutput("\\m{acute}") → "dk(acute)"
     * ```
     */
    KmnGenerator.prototype.formatOutput = function (output, format) {
        // Check for markers
        if (output.includes('\\m{')) {
            var match = output.match(/\\m\{([^}]+)\}/);
            if (match) {
                return "dk(".concat(match[1], ")");
            }
        }
        // Build output using format metadata to preserve original representation
        var chars = Array.from(output);
        var parts = [];
        var currentGroup = [];
        var currentFormat = null;
        for (var i = 0; i < chars.length; i++) {
            var char = chars[i];
            var charFormat = format && i < format.length ? format[i].format : 'uplus';
            if (charFormat === 'literal' && currentFormat === 'literal') {
                currentGroup.push(char);
            }
            else if (charFormat === 'uplus' && currentFormat === 'uplus') {
                var code = char.codePointAt(0);
                currentGroup.push("U+".concat(code.toString(16).toUpperCase().padStart(4, '0')));
            }
            else {
                // Format changed, flush current group
                if (currentGroup.length > 0) {
                    if (currentFormat === 'literal') {
                        parts.push("'".concat(this.escapeKmn(currentGroup.join('')), "'"));
                    }
                    else {
                        parts.push.apply(parts, currentGroup);
                    }
                }
                // Start new group
                currentGroup = [];
                currentFormat = charFormat;
                if (charFormat === 'literal') {
                    currentGroup.push(char);
                }
                else {
                    var code = char.codePointAt(0);
                    currentGroup.push("U+".concat(code.toString(16).toUpperCase().padStart(4, '0')));
                }
            }
        }
        // Flush final group
        if (currentGroup.length > 0) {
            if (currentFormat === 'literal') {
                parts.push("'".concat(this.escapeKmn(currentGroup.join('')), "'"));
            }
            else {
                parts.push.apply(parts, currentGroup);
            }
        }
        return parts.join(' ');
    };
    /**
     * Format a value for KMN store definition.
     *
     * Converts LDML variable values to KMN store syntax based on type:
     * - string: Single-quoted literal
     * - set: Double-quoted character sequence
     * - uset: Unicode set notation (preserved)
     *
     * @param value - Variable value string
     * @param type - Variable type ('string', 'set', or 'uset')
     * @returns KMN-formatted store value
     */
    KmnGenerator.prototype.formatStoreValue = function (value, type, format) {
        if (type === 'uset') {
            // Unicode set - keep as-is or convert to range
            return "\"".concat(this.escapeKmn(value), "\"");
        }
        // For strings and sets, output each character
        if (value.length <= 1) {
            return "'".concat(this.escapeKmn(value), "'");
        }
        // LDML stores set values as space-separated characters
        // Example LDML: "  a ɛ b ɓ" means [space, space, 'a', 'ɛ', 'b', 'ɓ']
        // Split on space, then convert empty strings back to spaces
        var chars = value.split(' ');
        var cleanValue = chars.map(function (c) { return c === '' ? ' ' : c; }).join('');
        // Build a clean format array that corresponds to cleanValue (without LDML separator spaces)
        var cleanFormat = [];
        if (format) {
            var formatIndex = 0;
            for (var i = 0; i < chars.length; i++) {
                var char = chars[i] === '' ? ' ' : chars[i];
                // Find the next matching character in the format array
                while (formatIndex < format.length && format[formatIndex].char === ' ' && char !== ' ') {
                    formatIndex++; // Skip LDML separator spaces
                }
                if (formatIndex < format.length) {
                    cleanFormat.push(format[formatIndex]);
                    formatIndex++;
                }
            }
        }
        // Build output using format metadata to preserve original representation
        var parts = [];
        var charIndex = 0;
        // Group consecutive characters by format type
        var currentGroup = [];
        var currentFormat = null;
        for (var _i = 0, cleanValue_1 = cleanValue; _i < cleanValue_1.length; _i++) {
            var char = cleanValue_1[_i];
            var charFormat = cleanFormat && charIndex < cleanFormat.length ? cleanFormat[charIndex].format : 'uplus';
            if (charFormat === 'literal' && currentFormat === 'literal') {
                // Continue building literal string
                currentGroup.push(char);
            }
            else if (charFormat === 'uplus' && currentFormat === 'uplus') {
                // Continue building U+ codes
                var code = char.codePointAt(0);
                currentGroup.push("U+".concat(code.toString(16).toUpperCase().padStart(4, '0')));
            }
            else {
                // Format changed, flush current group
                if (currentGroup.length > 0) {
                    if (currentFormat === 'literal') {
                        parts.push("\"".concat(this.escapeKmn(currentGroup.join('')), "\""));
                    }
                    else {
                        parts.push.apply(parts, currentGroup);
                    }
                }
                // Start new group
                currentGroup = [];
                currentFormat = charFormat;
                if (charFormat === 'literal') {
                    currentGroup.push(char);
                }
                else {
                    var code = char.codePointAt(0);
                    currentGroup.push("U+".concat(code.toString(16).toUpperCase().padStart(4, '0')));
                }
            }
            charIndex++;
        }
        // Flush final group
        if (currentGroup.length > 0) {
            if (currentFormat === 'literal') {
                parts.push("\"".concat(this.escapeKmn(currentGroup.join('')), "\""));
            }
            else {
                parts.push.apply(parts, currentGroup);
            }
        }
        return parts.join(' ');
    };
    /**
     * Format LDML transform pattern (context) to KMN format.
     *
     * Converts LDML transform 'from' attribute to KMN context:
     * - Markers (\m{name}) → deadkeys (dk(name))
     * - Variable references ($[name]) → any(name)
     * - Literal text → quoted strings
     *
     * @param from - LDML transform 'from' attribute
     * @returns KMN context pattern
     */
    KmnGenerator.prototype.formatTransformPattern = function (from) {
        // Convert LDML markers to KMN deadkeys
        var result = from.replace(/\\m\{([^}]+)\}/g, 'dk($1)');
        // Convert variable references
        result = result.replace(/\$\[([^\]]+)\]/g, 'any($1)');
        // Quote literal characters
        if (!result.includes('dk(') && !result.includes('any(')) {
            result = "'".concat(this.escapeKmn(result), "'");
        }
        return result;
    };
    /**
     * Format transform output, converting LDML backreferences to KMN index() syntax.
     *
     * LDML uses $[n:varname] for backreferences, KMN uses index(varname,n)
     */
    KmnGenerator.prototype.formatTransformOutput = function (to, format) {
        var _this = this;
        // Convert LDML backreferences ($[n:varname]) to KMN index() syntax
        var result = to.replace(/\$\[(\d+):([^\]]+)\]/g, function (match, num, varname) {
            return "index(".concat(varname, ",").concat(num, ")");
        });
        // After converting backreferences, handle remaining literal text
        // Split on index() to preserve it
        var parts = result.split(/(index\([^)]+\))/);
        var formatted = parts.map(function (part) {
            if (part.startsWith('index(')) {
                return part; // Keep index() as-is
            }
            else if (part) {
                return _this.formatOutput(part, format); // Convert using format metadata
            }
            return '';
        }).filter(function (p) { return p; }).join(' ');
        return formatted;
    };
    /**
     * Escape special characters for KMN string literals.
     *
     * KMN requires escaping:
     * - Single quotes (') → doubled ('') in single-quoted strings
     * - Double quotes (") → backslash-escaped (\") in double-quoted strings
     * - Backslashes (\) → doubled (\\)
     *
     * @param str - String to escape
     * @param quoteStyle - 'single' or 'double' quote style
     * @returns Escaped string safe for KMN
     */
    KmnGenerator.prototype.escapeKmn = function (str, quoteStyle) {
        if (quoteStyle === void 0) { quoteStyle = 'single'; }
        var result = str.replace(/\\/g, '\\\\');
        if (quoteStyle === 'single') {
            result = result.replace(/'/g, "''");
        }
        else {
            result = result.replace(/"/g, '\\"');
        }
        return result;
    };
    return KmnGenerator;
}());
exports.KmnGenerator = KmnGenerator;
/**
 * Parse LDML XML to LdmlKeyboardData structure.
 *
 * This is a simplified XML parser that extracts essential LDML keyboard
 * elements using regex patterns. It's designed for conversion purposes
 * and may not handle all edge cases.
 *
 * Extracted elements:
 * - Keyboard metadata (locale, name, version, author)
 * - Key definitions with output and attributes
 * - Layer definitions (hardware and touch)
 * - Variables (string, set, uset)
 * - Transform rules
 *
 * @param xml - LDML keyboard XML string
 * @returns Parsed keyboard data structure
 *
 * @remarks
 * This parser uses regex for simplicity. For production use with complex
 * LDML files, consider using a full XML parser.
 */
function parseLdmlXml(xml) {
    var data = {
        locale: 'und',
        name: 'Converted Keyboard',
        keys: [],
        flicks: [],
        layers: [],
        variables: [],
        transforms: [],
    };
    // Extract locale
    var localeMatch = xml.match(/locale="([^"]+)"/);
    if (localeMatch)
        data.locale = localeMatch[1];
    // Extract name
    var nameMatch = xml.match(/<info[^>]+name="([^"]+)"/);
    if (nameMatch)
        data.name = nameMatch[1];
    // Extract version
    var versionMatch = xml.match(/<version[^>]+number="([^"]+)"/);
    if (versionMatch)
        data.version = versionMatch[1];
    // Extract author
    var authorMatch = xml.match(/<info[^>]+author="([^"]+)"/);
    if (authorMatch)
        data.author = authorMatch[1];
    // Extract keys
    var keyRegex = /<key\s+([^>]+)\/>/g;
    var keyMatch;
    while ((keyMatch = keyRegex.exec(xml)) !== null) {
        var attrs = keyMatch[1];
        var key = {
            id: extractAttr(attrs, 'id') || '',
        };
        var output = extractAttr(attrs, 'output');
        if (output) {
            var parsed = unescapeXml(output);
            key.output = parsed.value;
            key.outputFormat = parsed.format;
        }
        var gap = extractAttr(attrs, 'gap');
        if (gap === 'true')
            key.gap = true;
        var longPress = extractAttr(attrs, 'longPressKeyIds');
        if (longPress)
            key.longPressKeyIds = longPress;
        var multiTap = extractAttr(attrs, 'multiTapKeyIds');
        if (multiTap)
            key.multiTapKeyIds = multiTap;
        var flickId = extractAttr(attrs, 'flickId');
        if (flickId)
            key.flickId = flickId;
        var layerId = extractAttr(attrs, 'layerId');
        if (layerId)
            key.layerId = layerId;
        if (key.id)
            data.keys.push(key);
    }
    // Extract layers
    var layersRegex = /<layers\s+formId="([^"]+)"[^>]*>([\s\S]*?)<\/layers>/g;
    var layersMatch;
    while ((layersMatch = layersRegex.exec(xml)) !== null) {
        var formId = layersMatch[1];
        var layersContent = layersMatch[2];
        var layerRegex = /<layer\s*([^>]*)>([\s\S]*?)<\/layer>/g;
        var layerMatch = void 0;
        while ((layerMatch = layerRegex.exec(layersContent)) !== null) {
            var layerAttrs = layerMatch[1];
            var layerContent = layerMatch[2];
            var layer = {
                formId: formId,
                id: extractAttr(layerAttrs, 'id') || 'base',
                modifiers: extractAttr(layerAttrs, 'modifiers'),
                rows: [],
            };
            var rowRegex = /<row\s+keys="([^"]+)"/g;
            var rowMatch = void 0;
            while ((rowMatch = rowRegex.exec(layerContent)) !== null) {
                layer.rows.push(rowMatch[1].split(/\s+/));
            }
            data.layers.push(layer);
        }
    }
    // Extract variables
    var varRegex = /<(string|set|uset)\s+id="([^"]+)"\s+value="([^"]+)"/g;
    var varMatch;
    while ((varMatch = varRegex.exec(xml)) !== null) {
        var parsed = unescapeXml(varMatch[3]);
        data.variables.push({
            type: varMatch[1],
            id: varMatch[2],
            value: parsed.value,
            valueFormat: parsed.format,
        });
    }
    // Extract transforms
    var transformRegex = /<transform\s+from="([^"]+)"\s+to="([^"]+)"/g;
    var transformMatch;
    while ((transformMatch = transformRegex.exec(xml)) !== null) {
        var fromParsed = unescapeXml(transformMatch[1]);
        var toParsed = unescapeXml(transformMatch[2]);
        data.transforms.push({
            from: fromParsed.value,
            to: toParsed.value,
            fromFormat: fromParsed.format,
            toFormat: toParsed.format,
        });
    }
    return data;
}
function extractAttr(attrs, name) {
    var match = attrs.match(new RegExp("".concat(name, "=\"([^\"]*)\"")));
    return match ? match[1] : undefined;
}
function unescapeXml(str) {
    var result = '';
    var format = [];
    var i = 0;
    while (i < str.length) {
        if (str[i] === '&') {
            // Handle XML entities and numeric character references
            if (str.substr(i, 5) === '&amp;') {
                result += '&';
                format.push({ char: '&', format: 'literal' });
                i += 5;
            }
            else if (str.substr(i, 4) === '&lt;') {
                result += '<';
                format.push({ char: '<', format: 'literal' });
                i += 4;
            }
            else if (str.substr(i, 4) === '&gt;') {
                result += '>';
                format.push({ char: '>', format: 'literal' });
                i += 4;
            }
            else if (str.substr(i, 6) === '&quot;') {
                result += '"';
                format.push({ char: '"', format: 'literal' });
                i += 6;
            }
            else if (str.substr(i, 6) === '&apos;') {
                result += "'";
                format.push({ char: "'", format: 'literal' });
                i += 6;
            }
            else if (str.substr(i, 3) === '&#x' || str.substr(i, 2) === '&#') {
                // Numeric character reference
                var isHex = str.substr(i, 3) === '&#x';
                var startOffset = isHex ? 3 : 2;
                var endIndex = i + startOffset;
                while (endIndex < str.length && str[endIndex] !== ';') {
                    endIndex++;
                }
                if (endIndex < str.length && str[endIndex] === ';') {
                    var codeStr = str.substring(i + startOffset, endIndex);
                    var code = parseInt(codeStr, isHex ? 16 : 10);
                    var char = String.fromCodePoint(code);
                    result += char;
                    format.push({ char: char, format: 'uplus' }); // Numeric refs represent U+ codes
                    i = endIndex + 1;
                }
                else {
                    // Malformed reference, treat as literal
                    result += str[i];
                    format.push({ char: str[i], format: 'literal' });
                    i++;
                }
            }
            else {
                // Unknown entity, treat as literal
                result += str[i];
                format.push({ char: str[i], format: 'literal' });
                i++;
            }
        }
        else {
            // Regular character
            result += str[i];
            format.push({ char: str[i], format: 'literal' });
            i++;
        }
    }
    return { value: result, format: format };
}
/**
 * Convert LDML keyboard XML to KMN source code.
 *
 * This is a convenience function that combines parsing and generation
 * into a single operation. It parses the LDML XML and generates the
 * equivalent KMN source code.
 *
 * @param ldmlXml - LDML keyboard XML string
 * @returns KMN source code string
 *
 * @example
 * ```typescript
 * import { generateKmn } from '@keymanapp/kmc-kmn-to-ldml';
 * import * as fs from 'fs';
 *
 * const ldmlXml = fs.readFileSync('my-keyboard.xml', 'utf-8');
 * const kmnSource = generateKmn(ldmlXml);
 * fs.writeFileSync('my-keyboard.kmn', kmnSource, 'utf-8');
 * ```
 */
function generateKmn(ldmlXml) {
    var data = parseLdmlXml(ldmlXml);
    var generator = new KmnGenerator();
    return generator.generate(data);
}
