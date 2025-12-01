"use strict";
/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Generates LDML keyboard XML from KMN AST.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LdmlGenerator = exports.UnsupportedKeyboardError = void 0;
exports.generateLdml = generateLdml;
var touch_layout_converter_js_1 = require("./touch-layout-converter.cjs");
/**
 * Error thrown when a KMN keyboard cannot be converted to LDML
 * due to fundamental incompatibilities (e.g., mnemonic keyboards)
 */
var UnsupportedKeyboardError = /** @class */ (function (_super) {
    __extends(UnsupportedKeyboardError, _super);
    function UnsupportedKeyboardError(message, featureType, keyboardName) {
        var _this = _super.call(this, message) || this;
        _this.name = 'UnsupportedKeyboardError';
        _this.featureType = featureType;
        _this.keyboardName = keyboardName;
        return _this;
    }
    return UnsupportedKeyboardError;
}(Error));
exports.UnsupportedKeyboardError = UnsupportedKeyboardError;
/**
 * Generates LDML keyboard XML from KMN Abstract Syntax Tree.
 *
 * This class converts parsed KMN keyboard definitions into LDML Keyboard 3.0 XML format.
 * It handles the conversion of KMN-specific concepts to their LDML equivalents:
 *
 * Conversion mappings:
 * - KMN stores → LDML variables (string/set)
 * - KMN groups → LDML layers
 * - KMN rules → LDML transforms
 * - KMN any()/index() → LDML set mappings
 * - KMN virtual keys → LDML hardware keys
 * - KMN deadkeys → LDML markers
 *
 * Features:
 * - Automatic hardware layer generation from rules
 * - Set mapping optimization for any()/index() patterns
 * - Marker-based deadkey conversion
 * - Display hint generation for combining keys
 * - Touch layout integration
 * - Comprehensive validation and error reporting
 *
 * Limitations:
 * - Mnemonic layouts not supported (use positional only)
 * - Some advanced KMN features may be skipped with warnings
 * - Option variables (if/set) generate warnings
 *
 * @example
 * ```typescript
 * const generator = new LdmlGenerator({
 *   locale: 'fr',
 *   hardwareForm: 'iso',
 *   useSetMapping: true
 * });
 * const ldmlXml = generator.generate(kmnAst);
 * ```
 */
var LdmlGenerator = /** @class */ (function () {
    function LdmlGenerator(options) {
        if (options === void 0) { options = {}; }
        this.indent = '  ';
        // Collected key definitions
        this.keys = new Map();
        // Collected deadkey/marker mappings
        this.markers = new Map();
        // Virtual key to hardware key mapping
        this.vkeyToHardware = new Map();
        // Store lookup cache
        this.storeMap = new Map();
        // Keys that are used in context rules (need marker output for combining)
        this.combiningKeys = new Map();
        // Touch layout converter
        this.touchConverter = new touch_layout_converter_js_1.TouchLayoutConverter();
        // Touch layout conversion result
        this.touchResult = null;
        // Display overrides collected from keyboard
        this.displayOverrides = [];
        // Backspace rules for custom deletion behavior
        this.backspaceRules = [];
        // Skipped rules (if/set conditions not supported by LDML)
        this.skippedRules = [];
        // Option names found in if/set rules
        this.optionNames = new Set();
        this.options = __assign({ locale: 'und', conformsTo: '45', includeHardware: true, includeTouch: true, useSetMapping: true, hardwareForm: 'us' }, options);
    }
    /**
     * Check if keyboard is mnemonic (character-based rather than positional)
     */
    LdmlGenerator.prototype.isMnemonic = function (keyboard) {
        var mnemonicStore = keyboard.stores.find(function (s) { return s.isSystem && s.name.toUpperCase() === 'MNEMONICLAYOUT'; });
        return (mnemonicStore === null || mnemonicStore === void 0 ? void 0 : mnemonicStore.value) === '1';
    };
    /**
     * Generate LDML XML string from KMN keyboard
     * @throws UnsupportedKeyboardError if keyboard is mnemonic (not supported by LDML)
     */
    LdmlGenerator.prototype.generate = function (keyboard) {
        this.keyboard = keyboard;
        this.keys.clear();
        this.markers.clear();
        this.storeMap.clear();
        this.combiningKeys.clear();
        this.displayOverrides = __spreadArray([], (this.options.displayOverrides || []), true);
        this.backspaceRules = [];
        this.skippedRules = [];
        this.optionNames.clear();
        this.touchResult = null;
        this.initVkeyMapping();
        this.buildStoreMap();
        // Scan for if/set rules and collect option names
        this.scanForIfSetRules();
        // Check for mnemonic keyboard - LDML doesn't support this
        if (this.isMnemonic(keyboard)) {
            var name_1 = this.getStoreValue('NAME') || keyboard.filename || 'Unknown';
            throw new UnsupportedKeyboardError("Cannot convert mnemonic keyboard \"".concat(name_1, "\" to LDML. ") +
                "LDML uses positional key mapping (physical keys) while mnemonic keyboards " +
                "use character-based mapping that adapts to the user's base keyboard layout. " +
                "These concepts are fundamentally incompatible.", 'mnemonic', name_1);
        }
        // Identify combining keys (keys used in context rules for character combining)
        this.identifyCombiningKeys();
        // Collect backspace rules
        this.collectBackspaceRules();
        // Convert touch layout if provided
        if (this.options.touchLayout) {
            this.touchResult = this.touchConverter.convert(this.options.touchLayout);
        }
        // Extract metadata
        var name = this.getStoreValue('NAME') || 'Converted Keyboard';
        var version = this.getStoreValue('KEYBOARDVERSION') || '1.0';
        var author = this.getStoreValue('AUTHOR') || this.getStoreValue('COPYRIGHT') || '';
        // Build XML
        var xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
        xml += "<keyboard3 xmlns=\"https://schemas.unicode.org/cldr/".concat(this.options.conformsTo, "/keyboard3\" locale=\"").concat(this.options.locale, "\" conformsTo=\"").concat(this.options.conformsTo, "\">\n");
        // Info section
        xml += "".concat(this.indent, "<version number=\"").concat(this.escapeXml(version), "\"/>\n");
        xml += "".concat(this.indent, "<info name=\"").concat(this.escapeXml(name), "\"");
        if (author)
            xml += " author=\"".concat(this.escapeXml(author), "\"");
        xml += "/>\n";
        // Process rules to collect keys
        this.collectKeysFromRules();
        // Keys section
        xml += this.generateKeysSection();
        // Flicks section (if any)
        xml += this.generateFlicksSection();
        // Layers section
        xml += this.generateLayersSection();
        // Variables section
        xml += this.generateVariablesSection();
        // Transforms section
        xml += this.generateTransformsSection();
        xml += "</keyboard3>\n";
        return xml;
    };
    /**
     * Build store lookup map
     */
    LdmlGenerator.prototype.buildStoreMap = function () {
        for (var _i = 0, _a = this.keyboard.stores; _i < _a.length; _i++) {
            var store = _a[_i];
            this.storeMap.set(store.name.toLowerCase(), store);
        }
    };
    /**
     * Get store by name
     */
    LdmlGenerator.prototype.getStore = function (name) {
        return this.storeMap.get(name.toLowerCase());
    };
    /**
     * Check if two stores have the same length (for set mapping)
     */
    LdmlGenerator.prototype.storesHaveSameLength = function (store1Name, store2Name) {
        var store1 = this.getStore(store1Name);
        var store2 = this.getStore(store2Name);
        if (!store1 || !store2)
            return false;
        // Count characters/elements in each store
        var len1 = this.countStoreElements(store1.value);
        var len2 = this.countStoreElements(store2.value);
        return len1 === len2 && len1 > 0;
    };
    /**
     * Count elements in a store value
     */
    LdmlGenerator.prototype.countStoreElements = function (value) {
        // For now, simple character count (could be enhanced to handle U+XXXX sequences)
        return Array.from(value).length;
    };
    /**
     * Initialize virtual key to hardware key mapping
     */
    LdmlGenerator.prototype.initVkeyMapping = function () {
        // Standard US QWERTY mapping
        var mapping = {
            // Number row
            'K_BKQUOTE': 'grave', 'K_1': '1', 'K_2': '2', 'K_3': '3', 'K_4': '4',
            'K_5': '5', 'K_6': '6', 'K_7': '7', 'K_8': '8', 'K_9': '9', 'K_0': '0',
            'K_HYPHEN': 'hyphen', 'K_EQUAL': 'equal',
            // Top row
            'K_Q': 'q', 'K_W': 'w', 'K_E': 'e', 'K_R': 'r', 'K_T': 't',
            'K_Y': 'y', 'K_U': 'u', 'K_I': 'i', 'K_O': 'o', 'K_P': 'p',
            'K_LBRKT': 'bracketLeft', 'K_RBRKT': 'bracketRight', 'K_BKSLASH': 'backslash',
            // Home row
            'K_A': 'a', 'K_S': 's', 'K_D': 'd', 'K_F': 'f', 'K_G': 'g',
            'K_H': 'h', 'K_J': 'j', 'K_K': 'k', 'K_L': 'l',
            'K_COLON': 'semicolon', 'K_QUOTE': 'apostrophe',
            // Bottom row
            'K_Z': 'z', 'K_X': 'x', 'K_C': 'c', 'K_V': 'v', 'K_B': 'b',
            'K_N': 'n', 'K_M': 'm',
            'K_COMMA': 'comma', 'K_PERIOD': 'period', 'K_SLASH': 'slash',
            // Space
            'K_SPACE': 'space',
        };
        for (var _i = 0, _a = Object.entries(mapping); _i < _a.length; _i++) {
            var _b = _a[_i], vkey = _b[0], hw = _b[1];
            this.vkeyToHardware.set(vkey, hw);
        }
    };
    /**
     * Get a store value by name
     */
    LdmlGenerator.prototype.getStoreValue = function (name) {
        var store = this.keyboard.stores.find(function (s) { return s.name.toUpperCase() === name.toUpperCase(); });
        return store === null || store === void 0 ? void 0 : store.value;
    };
    /**
     * Collect key definitions from rules
     */
    LdmlGenerator.prototype.collectKeysFromRules = function () {
        for (var _i = 0, _a = this.keyboard.groups; _i < _a.length; _i++) {
            var group = _a[_i];
            for (var _b = 0, _c = group.rules; _b < _c.length; _b++) {
                var rule = _c[_b];
                if (rule.key) {
                    this.addKeyFromRule(rule);
                }
            }
        }
    };
    /**
     * Add a key definition from a rule
     */
    LdmlGenerator.prototype.addKeyFromRule = function (rule) {
        if (!rule.key)
            return;
        var keyId = this.getKeyId(rule.key);
        if (!keyId)
            return;
        // Get existing key or create new
        var key = this.keys.get(keyId);
        if (!key) {
            key = { id: keyId, outputs: new Map() };
            this.keys.set(keyId, key);
        }
        // Determine modifier combination
        var modifiers = this.getModifierString(rule.key);
        // Get output
        var output = this.getOutputString(rule.output);
        // Check for deadkey output
        var deadkeyOutput = rule.output.find(function (e) { return e.type === 'deadkey'; });
        if (deadkeyOutput && deadkeyOutput.type === 'deadkey') {
            // This creates a marker
            var markerName = deadkeyOutput.name;
            this.markers.set(markerName, markerName);
            key.outputs.set(modifiers, "\\m{".concat(markerName, "}"));
        }
        else if (output) {
            key.outputs.set(modifiers, output);
        }
    };
    /**
     * Get key ID from key spec
     */
    LdmlGenerator.prototype.getKeyId = function (key) {
        if (key.vkey) {
            return key.vkey;
        }
        if (key.char) {
            // Convert character to key ID
            var code = key.char.codePointAt(0);
            if (code !== undefined) {
                return "U_".concat(code.toString(16).toUpperCase().padStart(4, '0'));
            }
        }
        return null;
    };
    /**
     * Get modifier string for LDML
     */
    LdmlGenerator.prototype.getModifierString = function (key) {
        var mods = [];
        if (key.shift)
            mods.push('shift');
        if (key.ctrl)
            mods.push('ctrl');
        if (key.alt)
            mods.push('altR'); // RALT in KMN is typically altR in LDML
        if (key.caps)
            mods.push('caps');
        return mods.length > 0 ? mods.join(' ') : 'none';
    };
    /**
     * Get output string from rule elements (without set mapping)
     */
    LdmlGenerator.prototype.getOutputString = function (elements) {
        var result = '';
        for (var _i = 0, elements_1 = elements; _i < elements_1.length; _i++) {
            var elem = elements_1[_i];
            switch (elem.type) {
                case 'char':
                    result += elem.value;
                    break;
                case 'deadkey':
                    result += "\\m{".concat(elem.name, "}");
                    break;
                case 'nul':
                    // NUL output - key produces nothing
                    break;
                case 'beep':
                    // BEEP - no output
                    break;
                case 'context':
                    // Context in output - preserve previous
                    break;
                // For other types, we may need special handling
            }
        }
        return result;
    };
    /**
     * Analyze a rule for set mapping patterns
     */
    LdmlGenerator.prototype.analyzeRuleForSetMapping = function (rule) {
        var setMappings = [];
        var canUseSetMapping = this.options.useSetMapping || false;
        // Find all any() elements in context with their CONTEXT positions (1-based)
        // Note: KMN index() offset refers to context position, not any() count
        var anyElements = [];
        var contextPosition = 0;
        for (var _i = 0, _a = rule.context; _i < _a.length; _i++) {
            var elem = _a[_i];
            contextPosition++;
            if (elem.type === 'any') {
                anyElements.push({ elem: elem, contextPosition: contextPosition });
            }
        }
        // Check if output is just 'context' (implicit identity mapping)
        var hasContextOutput = rule.output.length === 1 && rule.output[0].type === 'context';
        // Find all index() elements in output
        var indexElements = [];
        for (var _b = 0, _c = rule.output; _b < _c.length; _b++) {
            var elem = _c[_b];
            if (elem.type === 'index') {
                indexElements.push(elem);
            }
        }
        if (hasContextOutput && anyElements.length > 0) {
            // Rule has '> context' output - create identity mappings for all any() elements
            // This means: any(store) + [KEY] > context becomes transform: ($[store])keyOutput → $[1:store]
            for (var _d = 0, anyElements_1 = anyElements; _d < anyElements_1.length; _d++) {
                var anyElem = anyElements_1[_d];
                setMappings.push({
                    contextPosition: anyElem.contextPosition,
                    inputStore: anyElem.elem.storeName,
                    outputStore: anyElem.elem.storeName, // Identity mapping (same store)
                });
            }
            canUseSetMapping = true;
        }
        else {
            var _loop_1 = function (indexElem) {
                // index(store, N) refers to context position N
                var anyMatch = anyElements.find(function (a) { return a.contextPosition === indexElem.offset; });
                if (anyMatch) {
                    var inputStore = anyMatch.elem.storeName;
                    var outputStore = indexElem.storeName;
                    // Check if stores have same length (required for set mapping)
                    if (this_1.storesHaveSameLength(inputStore, outputStore)) {
                        setMappings.push({
                            contextPosition: anyMatch.contextPosition,
                            inputStore: inputStore,
                            outputStore: outputStore,
                        });
                    }
                    else {
                        // Stores don't match in length - can't use set mapping for this rule
                        canUseSetMapping = false;
                    }
                }
            };
            var this_1 = this;
            // Match index() references to any() elements by context position
            for (var _e = 0, indexElements_1 = indexElements; _e < indexElements_1.length; _e++) {
                var indexElem = indexElements_1[_e];
                _loop_1(indexElem);
            }
            // Can only use set mapping if all index() elements have matching any() with valid stores
            if (indexElements.length !== setMappings.length) {
                canUseSetMapping = false;
            }
            // If no set mappings were created, can't use set mapping
            // This fixes rules like dk(0021) dk(0021) > '!' that have no any()/index() pairs
            if (setMappings.length === 0) {
                canUseSetMapping = false;
            }
        }
        return { rule: rule, setMappings: setMappings, canUseSetMapping: canUseSetMapping };
    };
    /**
     * Generate transform pattern with set mapping capturing groups
     */
    LdmlGenerator.prototype.generateSetMappingPattern = function (rule, setMappings) {
        var pattern = '';
        var contextPosition = 0;
        for (var _i = 0, _a = rule.context; _i < _a.length; _i++) {
            var elem = _a[_i];
            contextPosition++;
            switch (elem.type) {
                case 'char':
                    pattern += elem.value;
                    break;
                case 'deadkey':
                    pattern += "\\m{".concat(elem.name, "}");
                    break;
                case 'any':
                    // Check if this any() is part of a set mapping (by context position)
                    var mapping = setMappings.find(function (m) { return m.contextPosition === contextPosition; });
                    if (mapping) {
                        // Use capturing group for set mapping: ($[storeName])
                        pattern += "($[".concat(elem.storeName, "])");
                    }
                    else {
                        // Regular any() without set mapping
                        pattern += "$[".concat(elem.storeName, "]");
                    }
                    break;
                // Handle other context types
            }
        }
        // Add key output if present
        if (rule.key) {
            var keyId = this.getKeyId(rule.key);
            if (keyId) {
                var key = this.keys.get(keyId);
                var modifiers = this.getModifierString(rule.key);
                var output = key === null || key === void 0 ? void 0 : key.outputs.get(modifiers);
                if (output) {
                    pattern += output;
                }
            }
        }
        return pattern;
    };
    /**
     * Generate output with set mapping references
     */
    LdmlGenerator.prototype.generateSetMappingOutput = function (rule, setMappings) {
        var result = '';
        var captureIndex = 0;
        // Track which captures we've used
        var captureMap = new Map(); // contextPosition -> captureIndex
        for (var _i = 0, setMappings_1 = setMappings; _i < setMappings_1.length; _i++) {
            var mapping = setMappings_1[_i];
            captureIndex++;
            captureMap.set(mapping.contextPosition, captureIndex);
        }
        var _loop_2 = function (elem) {
            switch (elem.type) {
                case 'char':
                    result += elem.value;
                    break;
                case 'deadkey':
                    result += "\\m{".concat(elem.name, "}");
                    break;
                case 'index':
                    // Find the corresponding set mapping
                    var mapping = setMappings.find(function (m) { return m.contextPosition === elem.offset; });
                    if (mapping) {
                        var idx = captureMap.get(mapping.contextPosition);
                        // Use LDML set mapping output syntax: $[N:targetStore]
                        result += "$[".concat(idx, ":").concat(mapping.outputStore, "]");
                    }
                    break;
                case 'context':
                    // Output all captured groups in order
                    // For rules like: any(store) + [KEY] > context
                    // This outputs the captured store, consuming the key output
                    for (var i = 1; i <= setMappings.length; i++) {
                        result += "$[".concat(i, ":").concat(setMappings[i - 1].inputStore, "]");
                    }
                    break;
                case 'nul':
                case 'beep':
                    // No output
                    break;
            }
        };
        for (var _a = 0, _b = rule.output; _a < _b.length; _a++) {
            var elem = _b[_a];
            _loop_2(elem);
        }
        return result;
    };
    /**
     * Generate variant key ID for a modifier combination
     */
    LdmlGenerator.prototype.getVariantKeyId = function (baseKeyId, modifiers) {
        if (modifiers === 'none') {
            return baseKeyId;
        }
        // Generate variant ID like K_A_shift, K_A_altR, K_A_shift_altR
        var modSuffix = modifiers.replace(/ /g, '_');
        return "".concat(baseKeyId, "_").concat(modSuffix);
    };
    /**
     * Generate <keys> section with modifier variants
     */
    LdmlGenerator.prototype.generateKeysSection = function () {
        if (this.keys.size === 0)
            return '';
        var xml = "".concat(this.indent, "<keys>\n");
        // Add standard non-output keys
        xml += "".concat(this.indent).concat(this.indent, "<key id=\"K_SPACE\" output=\" \"/>\n");
        xml += "".concat(this.indent).concat(this.indent, "<key id=\"K_BKSP\"/>\n");
        // Generate keys with variant IDs for different modifier outputs
        // Use forEach for Map iteration (for...of on Maps compiles incorrectly to ES5)
        var self = this;
        this.keys.forEach(function(key, keyId) {
            // Skip if it's a standard key we already added
            if (keyId === 'K_SPACE' || keyId === 'K_BKSP')
                return;
            key.outputs.forEach(function(output, modifiers) {
                var variantId = self.getVariantKeyId(keyId, modifiers);
                xml += "".concat(self.indent).concat(self.indent, "<key id=\"").concat(variantId, "\"");
                if (output) {
                    xml += " output=\"".concat(self.escapeXml(output), "\"");
                }
                xml += "/>\n";
            });
        });
        xml += "".concat(this.indent, "</keys>\n");
        return xml;
    };
    /**
     * Generate <flicks> section (placeholder)
     */
    LdmlGenerator.prototype.generateFlicksSection = function () {
        // Touch layout flicks would be converted here
        return '';
    };
    /**
     * Generate <layers> section
     */
    LdmlGenerator.prototype.generateLayersSection = function () {
        var xml = '';
        if (this.options.includeHardware) {
            xml += this.generateHardwareLayers();
        }
        if (this.options.includeTouch) {
            xml += this.generateTouchLayers();
        }
        return xml;
    };
    /**
     * Generate hardware layers from rules
     */
    LdmlGenerator.prototype.generateHardwareLayers = function () {
        // Collect all modifier combinations used by any key
        // Use forEach for Map iteration (for...of on Maps compiles incorrectly to ES5)
        var modifierSets = new Set();
        this.keys.forEach(function(key) {
            key.outputs.forEach(function(output, modifiers) {
                modifierSets.add(modifiers);
            });
        });
        if (modifierSets.size === 0)
            return '';
        // Sort modifiers: 'none' first, then alphabetically
        var sortedModifiers = Array.from(modifierSets).sort(function (a, b) {
            if (a === 'none')
                return -1;
            if (b === 'none')
                return 1;
            return a.localeCompare(b);
        });
        var xml = "".concat(this.indent, "<layers formId=\"us\">\n");
        for (var _e = 0, sortedModifiers_1 = sortedModifiers; _e < sortedModifiers_1.length; _e++) {
            var modifiers = sortedModifiers_1[_e];
            xml += "".concat(this.indent).concat(this.indent, "<layer");
            if (modifiers !== 'none') {
                xml += " modifiers=\"".concat(modifiers, "\"");
            }
            xml += ">\n";
            // Generate rows with variant key IDs for this modifier layer
            xml += this.generateKeyboardRows(modifiers);
            xml += "".concat(this.indent).concat(this.indent, "</layer>\n");
        }
        xml += "".concat(this.indent, "</layers>\n");
        return xml;
    };
    /**
     * Generate keyboard rows for a layer with specific modifiers
     */
    LdmlGenerator.prototype.generateKeyboardRows = function (modifiers) {
        // Standard US keyboard rows (base key IDs)
        var rows = [
            ['K_BKQUOTE', 'K_1', 'K_2', 'K_3', 'K_4', 'K_5', 'K_6', 'K_7', 'K_8', 'K_9', 'K_0', 'K_HYPHEN', 'K_EQUAL'],
            ['K_Q', 'K_W', 'K_E', 'K_R', 'K_T', 'K_Y', 'K_U', 'K_I', 'K_O', 'K_P', 'K_LBRKT', 'K_RBRKT', 'K_BKSLASH'],
            ['K_A', 'K_S', 'K_D', 'K_F', 'K_G', 'K_H', 'K_J', 'K_K', 'K_L', 'K_COLON', 'K_QUOTE'],
            ['K_Z', 'K_X', 'K_C', 'K_V', 'K_B', 'K_N', 'K_M', 'K_COMMA', 'K_PERIOD', 'K_SLASH'],
            ['K_SPACE'],
        ];
        var xml = '';
        for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
            var rowKeys = rows_1[_i];
            // For each base key, find the variant key ID that has an output for this modifier
            var layerKeys = [];
            for (var _a = 0, rowKeys_1 = rowKeys; _a < rowKeys_1.length; _a++) {
                var baseKeyId = rowKeys_1[_a];
                var key = this.keys.get(baseKeyId);
                if (key && key.outputs.has(modifiers)) {
                    // Use the variant key ID for this modifier
                    layerKeys.push(this.getVariantKeyId(baseKeyId, modifiers));
                }
            }
            if (layerKeys.length > 0) {
                xml += "".concat(this.indent).concat(this.indent).concat(this.indent, "<row keys=\"").concat(layerKeys.join(' '), "\"/>\n");
            }
        }
        return xml;
    };
    /**
     * Generate touch layers (placeholder - would use touch layout file)
     */
    LdmlGenerator.prototype.generateTouchLayers = function () {
        // This would be populated from .keyman-touch-layout file
        return '';
    };
    /**
     * Generate <variables> section from KMN stores
     */
    LdmlGenerator.prototype.generateVariablesSection = function () {
        // Convert non-system stores to variables
        var userStores = this.keyboard.stores.filter(function (s) { return !s.isSystem; });
        if (userStores.length === 0)
            return '';
        var xml = "".concat(this.indent, "<variables>\n");
        for (var _i = 0, userStores_1 = userStores; _i < userStores_1.length; _i++) {
            var store = userStores_1[_i];
            // Determine variable type based on content
            var value = store.value;
            var format = store.valueFormat;
            // Check for range notation (contains ..)
            if (value.includes('..')) {
                // Range - use uset
                xml += "".concat(this.indent).concat(this.indent, "<uset id=\"").concat(store.name, "\" value=\"").concat(this.escapeXml(value, format), "\"/>\n");
            }
            else if (value.length > 1) {
                // Multiple characters - format as space-separated set for LDML
                var chars = Array.from(value);
                var formattedValue = chars.join(' ');
                // Build format array including spaces between characters
                var formattedFormat = [];
                for (var i = 0; i < chars.length; i++) {
                    if (i > 0) {
                        formattedFormat.push({ char: ' ', format: 'literal' }); // Space separator is always literal
                    }
                    // Use original format for this character
                    var charFormat = format && i < format.length ? format[i].format : 'literal';
                    formattedFormat.push({ char: chars[i], format: charFormat });
                }
                xml += "".concat(this.indent).concat(this.indent, "<set id=\"").concat(store.name, "\" value=\"").concat(this.escapeXml(formattedValue, formattedFormat), "\"/>\n");
            }
            else if (value.length === 1) {
                // Single value - use string
                xml += "".concat(this.indent).concat(this.indent, "<string id=\"").concat(store.name, "\" value=\"").concat(this.escapeXml(value, format), "\"/>\n");
            }
        }
        xml += "".concat(this.indent, "</variables>\n");
        return xml;
    };
    /**
     * Generate <transforms> section from rules with context
     */
    LdmlGenerator.prototype.generateTransformsSection = function () {
        var _this = this;
        // Collect rules that have context (transform rules)
        var transformRules = [];
        for (var _i = 0, _a = this.keyboard.groups; _i < _a.length; _i++) {
            var group = _a[_i];
            // Skip the main "using keys" group for transforms
            if (group.usingKeys)
                continue;
            for (var _b = 0, _c = group.rules; _b < _c.length; _b++) {
                var rule = _c[_b];
                if (rule.context.length > 0 || rule.isMatch) {
                    transformRules.push(rule);
                }
            }
        }
        // Also collect deadkey rules from main group
        for (var _d = 0, _e = this.keyboard.groups; _d < _e.length; _d++) {
            var group = _e[_d];
            if (!group.usingKeys)
                continue;
            for (var _f = 0, _g = group.rules; _f < _g.length; _f++) {
                var rule = _g[_f];
                // Rules with context in the main group
                if (rule.context.length > 0 && !rule.context.every(function (e) { return e.type === 'if'; })) {
                    transformRules.push(rule);
                }
            }
        }
        if (transformRules.length === 0 && this.markers.size === 0)
            return '';
        // Analyze all rules for set mapping potential
        var analyzedRules = transformRules.map(function (r) { return _this.analyzeRuleForSetMapping(r); });
        // Group rules by their set mapping pattern for potential optimization
        var setMappingGroups = this.groupRulesBySetMappingPattern(analyzedRules);
        var xml = "".concat(this.indent, "<transforms type=\"simple\">\n");
        xml += "".concat(this.indent).concat(this.indent, "<transformGroup>\n");
        // Generate set-mapped transforms first (more compact)
        // Use forEach for Map iteration (for...of on Maps compiles incorrectly to ES5)
        var self = this;
        setMappingGroups.forEach(function(group, patternKey) {
            if (group.canUseSetMapping && group.rules.length > 0) {
                // Generate single set-mapped transform
                var analyzed = group.rules[0];
                var from = self.generateSetMappingPattern(analyzed.rule, analyzed.setMappings);
                var to = self.generateSetMappingOutput(analyzed.rule, analyzed.setMappings);
                if (from && to) {
                    // Check for platform/layer conditions in any of the grouped rules
                    var conditions = self.extractConditions(group.rules.map(function (r) { return r.rule; }));
                    if (conditions.length > 0) {
                        xml += "".concat(self.indent).concat(self.indent).concat(self.indent, "<!-- Original KMN conditions (not representable in LDML): ").concat(conditions.join(', '), " -->\n");
                    }
                    xml += "".concat(self.indent).concat(self.indent).concat(self.indent, "<!-- Set mapping: ").concat(group.rules.length, " rules condensed -->\n");
                    xml += "".concat(self.indent).concat(self.indent).concat(self.indent, "<transform from=\"").concat(self.escapeXml(from), "\" to=\"").concat(self.escapeXml(to), "\"/>\n");
                }
            }
        });
        // Generate remaining transforms that couldn't use set mapping
        for (var _k = 0, analyzedRules_1 = analyzedRules; _k < analyzedRules_1.length; _k++) {
            var analyzed = analyzedRules_1[_k];
            if (!analyzed.canUseSetMapping) {
                var from = this.ruleContextToPattern(analyzed.rule);
                var to = this.getOutputString(analyzed.rule.output);
                if (from && to) {
                    // Check for platform/layer conditions
                    var conditions = this.extractConditions([analyzed.rule]);
                    if (conditions.length > 0) {
                        xml += "".concat(this.indent).concat(this.indent).concat(this.indent, "<!-- Original KMN conditions (not representable in LDML): ").concat(conditions.join(', '), " -->\n");
                    }
                    xml += "".concat(this.indent).concat(this.indent).concat(this.indent, "<transform from=\"").concat(this.escapeXml(from), "\" to=\"").concat(this.escapeXml(to), "\"/>\n");
                }
            }
        }
        xml += "".concat(this.indent).concat(this.indent, "</transformGroup>\n");
        xml += "".concat(this.indent, "</transforms>\n");
        return xml;
    };
    /**
     * Extract platform and layer conditions from rules
     * Returns array of condition strings like "platform('touch')", "layer('shift')"
     */
    LdmlGenerator.prototype.extractConditions = function (rules) {
        var conditions = new Set();
        for (var _i = 0, rules_1 = rules; _i < rules_1.length; _i++) {
            var rule = rules_1[_i];
            // Check context for if() conditions
            for (var _a = 0, _b = rule.context; _a < _b.length; _a++) {
                var elem = _b[_a];
                if (elem.type === 'if') {
                    var ifElem = elem;
                    // Check for platform or layer conditions
                    if (ifElem.optionName === 'platform' || ifElem.optionName === 'layer') {
                        var op = ifElem.operator === '=' ? '' : ifElem.operator;
                        conditions.add("".concat(ifElem.optionName, "(").concat(op, "'").concat(ifElem.value, "')"));
                    }
                }
            }
            // Check output for layer() calls
            for (var _c = 0, _d = rule.output; _c < _d.length; _c++) {
                var elem = _d[_c];
                if (elem.type === 'layer') {
                    var layerElem = elem;
                    conditions.add("layer('".concat(layerElem.layerName, "')"));
                }
            }
        }
        return Array.from(conditions);
    };
    /**
     * Group rules by their set mapping pattern signature
     */
    LdmlGenerator.prototype.groupRulesBySetMappingPattern = function (analyzedRules) {
        var groups = new Map();
        for (var _i = 0, analyzedRules_2 = analyzedRules; _i < analyzedRules_2.length; _i++) {
            var analyzed = analyzedRules_2[_i];
            if (!analyzed.canUseSetMapping || analyzed.setMappings.length === 0)
                continue;
            // Create a signature for the set mapping pattern
            var signature = analyzed.setMappings
                .map(function (m) { return "".concat(m.inputStore, ":").concat(m.outputStore, ":").concat(m.contextPosition); })
                .sort()
                .join('|');
            // Also include non-any context elements in signature
            var contextSignature = '';
            for (var _a = 0, _b = analyzed.rule.context; _a < _b.length; _a++) {
                var elem = _b[_a];
                if (elem.type === 'char') {
                    contextSignature += elem.value;
                }
                else if (elem.type === 'deadkey') {
                    contextSignature += "\\m{".concat(elem.name, "}");
                }
                else if (elem.type === 'any') {
                    contextSignature += '$[]'; // Placeholder for any
                }
            }
            // Include key output in signature to prevent merging rules with different key outputs
            var keyOutput = '';
            if (analyzed.rule.key) {
                var keyId = this.getKeyId(analyzed.rule.key);
                if (keyId) {
                    var key = this.keys.get(keyId);
                    var modifiers = this.getModifierString(analyzed.rule.key);
                    var output = key === null || key === void 0 ? void 0 : key.outputs.get(modifiers);
                    if (output) {
                        keyOutput = output;
                    }
                }
            }
            var fullSignature = "".concat(contextSignature, "||").concat(signature, "||").concat(keyOutput);
            if (!groups.has(fullSignature)) {
                groups.set(fullSignature, { canUseSetMapping: true, rules: [] });
            }
            groups.get(fullSignature).rules.push(analyzed);
        }
        return groups;
    };
    /**
     * Convert rule context to transform pattern (without set mapping)
     */
    LdmlGenerator.prototype.ruleContextToPattern = function (rule) {
        var pattern = '';
        for (var _i = 0, _a = rule.context; _i < _a.length; _i++) {
            var elem = _a[_i];
            switch (elem.type) {
                case 'char':
                    pattern += elem.value;
                    break;
                case 'deadkey':
                    pattern += "\\m{".concat(elem.name, "}");
                    break;
                case 'any':
                    pattern += "$[".concat(elem.storeName, "]");
                    break;
                // Handle other context types
            }
        }
        // Add key output if present
        if (rule.key) {
            // Find what this key outputs
            var keyId = this.getKeyId(rule.key);
            if (keyId) {
                var key = this.keys.get(keyId);
                var modifiers = this.getModifierString(rule.key);
                var output = key === null || key === void 0 ? void 0 : key.outputs.get(modifiers);
                if (output) {
                    pattern += output;
                }
            }
        }
        return pattern || null;
    };
    /**
     * Escape XML special characters, preserving original KMN format (literal vs U+)
     */
    LdmlGenerator.prototype.escapeXml = function (str, format) {
        var result = '';
        var charIndex = 0;
        for (var _i = 0, str_1 = str; _i < str_1.length; _i++) {
            var char = str_1[_i];
            var code = char.codePointAt(0);
            // Determine if this character should use numeric reference based on original format
            var charFormat = format && charIndex < format.length ? format[charIndex].format : null;
            var useNumericRef = charFormat === 'uplus';
            // Standard XML entities (always use named entities)
            if (char === '&') {
                result += '&amp;';
            }
            else if (char === '<') {
                result += '&lt;';
            }
            else if (char === '>') {
                result += '&gt;';
            }
            else if (char === '"') {
                result += '&quot;';
            }
            else if (char === "'") {
                result += '&apos;';
            }
            // Use numeric character references if original was U+ format
            else if (useNumericRef) {
                result += "&#x".concat(code.toString(16).toUpperCase().padStart(4, '0'), ";");
            }
            else {
                // Use literal character
                result += char;
            }
            charIndex++;
        }
        return result;
    };
    /**
     * Scan for if/set rules and collect option names
     * These rules cannot be converted to LDML and will be skipped
     */
    LdmlGenerator.prototype.scanForIfSetRules = function () {
        for (var _i = 0, _a = this.keyboard.groups; _i < _a.length; _i++) {
            var group = _a[_i];
            for (var _b = 0, _c = group.rules; _b < _c.length; _b++) {
                var rule = _c[_b];
                // Check for if() or set() in context
                var hasIfSet = rule.context.some(function (e) { return e.type === 'if' || e.type === 'set'; });
                if (hasIfSet) {
                    // Extract option names
                    for (var _d = 0, _e = rule.context; _d < _e.length; _d++) {
                        var elem = _e[_d];
                        if (elem.type === 'if' || elem.type === 'set') {
                            var optionName = elem.option || 'unknown';
                            this.optionNames.add(optionName);
                        }
                    }
                    // Record skipped rule
                    this.skippedRules.push({
                        line: rule.line || 0,
                        reason: 'if/set conditions not supported by LDML',
                        options: Array.from(this.optionNames),
                        description: "Rule with ".concat(hasIfSet ? 'if/set' : 'conditional', " logic")
                    });
                }
            }
        }
    };
    /**
     * Identify combining keys (keys used in context rules)
     * These keys need special marker output for character combining
     */
    LdmlGenerator.prototype.identifyCombiningKeys = function () {
        for (var _i = 0, _a = this.keyboard.groups; _i < _a.length; _i++) {
            var group = _a[_i];
            if (!group.usingKeys)
                continue;
            for (var _b = 0, _c = group.rules; _b < _c.length; _b++) {
                var rule = _c[_b];
                // Rules with context that produce output with markers
                if (rule.context.length > 0 && rule.key) {
                    var keyId = this.getKeyId(rule.key);
                    if (!keyId)
                        continue;
                    var modifiers = this.getModifierString(rule.key);
                    var keyWithMods = "".concat(keyId, ":").concat(modifiers);
                    // Check if output includes marker
                    var hasMarkerOutput = rule.output.some(function (e) { return e.type === 'deadkey'; });
                    if (hasMarkerOutput) {
                        var deadkeyElem = rule.output.find(function (e) { return e.type === 'deadkey'; });
                        var markerName = (deadkeyElem && deadkeyElem.type === 'deadkey') ? deadkeyElem.name : 'marker';
                        if (!this.combiningKeys.has(keyWithMods)) {
                            this.combiningKeys.set(keyWithMods, {
                                keyWithMods: keyWithMods,
                                markerName: markerName,
                                rules: [],
                            });
                        }
                        this.combiningKeys.get(keyWithMods).rules.push(rule);
                    }
                }
            }
        }
    };
    /**
     * Collect backspace rules for custom deletion behavior
     */
    LdmlGenerator.prototype.collectBackspaceRules = function () {
        var _a;
        for (var _i = 0, _b = this.keyboard.groups; _i < _b.length; _i++) {
            var group = _b[_i];
            for (var _c = 0, _d = group.rules; _c < _d.length; _c++) {
                var rule = _d[_c];
                // Look for backspace key rules
                if (((_a = rule.key) === null || _a === void 0 ? void 0 : _a.vkey) === 'K_BKSP') {
                    var from = this.ruleContextToPattern(rule);
                    var to = this.getOutputString(rule.output);
                    if (from && to !== null) {
                        this.backspaceRules.push({ from: from, to: to });
                    }
                }
            }
        }
    };
    return LdmlGenerator;
}());
exports.LdmlGenerator = LdmlGenerator;
/**
 * Convenience function to convert KMN to LDML
 */
function generateLdml(keyboard, options) {
    var generator = new LdmlGenerator(options);
    return generator.generate(keyboard);
}
