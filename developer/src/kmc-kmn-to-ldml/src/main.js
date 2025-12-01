"use strict";
/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * KMN to LDML Keyboard Converter
 *
 * Converts Keyman .kmn keyboard source files to LDML Keyboard 3.0 XML format.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KmnToLdmlConverter = exports.generateLdmlFromTouchLayout = exports.TouchLayoutConverter = exports.generateLdml = exports.LdmlGenerator = exports.parseKmn = exports.KmnParser = void 0;
exports.convertKmnToLdml = convertKmnToLdml;
var kmn_parser_js_1 = require("./kmn-parser.js");
Object.defineProperty(exports, "KmnParser", { enumerable: true, get: function () { return kmn_parser_js_1.KmnParser; } });
Object.defineProperty(exports, "parseKmn", { enumerable: true, get: function () { return kmn_parser_js_1.parseKmn; } });
var ldml_generator_js_1 = require("./ldml-generator.js");
Object.defineProperty(exports, "LdmlGenerator", { enumerable: true, get: function () { return ldml_generator_js_1.LdmlGenerator; } });
Object.defineProperty(exports, "generateLdml", { enumerable: true, get: function () { return ldml_generator_js_1.generateLdml; } });
var touch_layout_converter_js_1 = require("./touch-layout-converter.js");
Object.defineProperty(exports, "TouchLayoutConverter", { enumerable: true, get: function () { return touch_layout_converter_js_1.TouchLayoutConverter; } });
Object.defineProperty(exports, "generateLdmlFromTouchLayout", { enumerable: true, get: function () { return touch_layout_converter_js_1.generateLdmlFromTouchLayout; } });
__exportStar(require("./kmn-ast.js"), exports);
var kmn_parser_js_2 = require("./kmn-parser.js");
var ldml_generator_js_2 = require("./ldml-generator.js");
var touch_layout_converter_js_2 = require("./touch-layout-converter.js");
/**
 * Convert a KMN keyboard source file to LDML XML.
 *
 * This is the primary entry point for converting legacy Keyman (.kmn) keyboard source
 * files to the modern LDML Keyboard 3.0 XML format. The conversion process:
 * 1. Parses the KMN source into an AST
 * 2. Generates LDML XML from the AST
 * 3. Optionally merges touch layout data
 *
 * @param kmnSource - Complete KMN keyboard source code as string
 * @param options - Conversion options including locale, hardware form, touch layout, etc.
 * @returns Complete LDML keyboard XML string ready to be saved as .xml file
 *
 * @throws {UnsupportedKeyboardError} If the KMN keyboard uses unsupported features
 *                                     (e.g., mnemonic layouts)
 *
 * @example
 * ```typescript
 * const kmnSource = fs.readFileSync('my_keyboard.kmn', 'utf8');
 * const ldmlXml = convertKmnToLdml(kmnSource, {
 *   locale: 'en',
 *   hardwareForm: 'us',
 *   useSetMapping: true
 * });
 * fs.writeFileSync('my_keyboard.xml', ldmlXml);
 * ```
 */
function convertKmnToLdml(kmnSource, options) {
    if (options === void 0) { options = {}; }
    // Parse KMN source
    var parser = new kmn_parser_js_2.KmnParser();
    var keyboard = parser.parse(kmnSource);
    // Generate base LDML from KMN
    var generator = new ldml_generator_js_2.LdmlGenerator(options);
    var ldml = generator.generate(keyboard);
    // If touch layout provided, merge it
    if (options.touchLayout || options.touchLayoutJson) {
        var touchLayout = options.touchLayout ||
            (options.touchLayoutJson ? JSON.parse(options.touchLayoutJson) : null);
        if (touchLayout) {
            var touchConverter = new touch_layout_converter_js_2.TouchLayoutConverter();
            var touchResult = touchConverter.convert(touchLayout);
            // Insert touch layout elements before closing tag
            var touchXml = (0, touch_layout_converter_js_2.generateLdmlFromTouchLayout)(touchResult);
            ldml = ldml.replace('</keyboard3>', touchXml + '</keyboard3>');
        }
    }
    return ldml;
}
/**
 * Object-oriented converter class for more control over the conversion process.
 *
 * This class provides a stateful interface to the KMN to LDML conversion pipeline,
 * allowing for finer-grained control and access to intermediate results. Use this
 * class when you need to:
 * - Inspect the parsed KMN AST before conversion
 * - Convert only specific parts (e.g., touch layout only)
 * - Reuse parser/generator instances for multiple conversions
 * - Access detailed conversion metadata
 *
 * For simple one-shot conversions, use the {@link convertKmnToLdml} function instead.
 *
 * @example
 * ```typescript
 * const converter = new KmnToLdmlConverter({ locale: 'fr', hardwareForm: 'iso' });
 *
 * // Parse and inspect AST
 * const ast = converter.parseKmn(kmnSource);
 * console.log(`Found ${ast.groups.length} groups`);
 *
 * // Convert to LDML
 * const ldml = converter.convert(kmnSource, touchLayout);
 * ```
 */
var KmnToLdmlConverter = /** @class */ (function () {
    function KmnToLdmlConverter(options) {
        if (options === void 0) { options = {}; }
        this.parser = new kmn_parser_js_2.KmnParser();
        this.generator = new ldml_generator_js_2.LdmlGenerator(options);
        this.touchConverter = new touch_layout_converter_js_2.TouchLayoutConverter();
    }
    /**
     * Convert KMN source to LDML XML.
     *
     * @param kmnSource - Complete KMN keyboard source code
     * @param touchLayout - Optional touch layout data to merge into the LDML
     * @returns Complete LDML keyboard XML string
     */
    KmnToLdmlConverter.prototype.convert = function (kmnSource, touchLayout) {
        var keyboard = this.parser.parse(kmnSource);
        var ldml = this.generator.generate(keyboard);
        if (touchLayout) {
            var touchResult = this.touchConverter.convert(touchLayout);
            var touchXml = (0, touch_layout_converter_js_2.generateLdmlFromTouchLayout)(touchResult);
            ldml = ldml.replace('</keyboard3>', touchXml + '</keyboard3>');
        }
        return ldml;
    };
    /**
     * Parse KMN source to AST without converting to LDML.
     *
     * Useful for debugging, inspection, or custom processing of the parsed structure.
     *
     * @param kmnSource - Complete KMN keyboard source code
     * @returns Parsed KMN AST with stores, groups, and rules
     */
    KmnToLdmlConverter.prototype.parseKmn = function (kmnSource) {
        return this.parser.parse(kmnSource);
    };
    /**
     * Convert only the touch layout to LDML structures without full keyboard conversion.
     *
     * Useful for testing touch layout conversion or when you only need the touch
     * layer definitions without the full keyboard.
     *
     * @param touchLayout - Touch layout JSON data
     * @returns Converted LDML structures (keys, flicks, layers)
     */
    KmnToLdmlConverter.prototype.convertTouchLayout = function (touchLayout) {
        return this.touchConverter.convert(touchLayout);
    };
    return KmnToLdmlConverter;
}());
exports.KmnToLdmlConverter = KmnToLdmlConverter;
