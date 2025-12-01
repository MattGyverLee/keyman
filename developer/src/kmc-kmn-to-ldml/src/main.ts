/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * KMN to LDML Keyboard Converter
 *
 * Converts Keyman .kmn keyboard source files to LDML Keyboard 3.0 XML format.
 */

export { KmnParser, parseKmn } from './kmn-parser.js';
export { LdmlGenerator, generateLdml, LdmlGeneratorOptions } from './ldml-generator.js';
export {
  TouchLayoutConverter,
  TouchLayoutConversionResult,
  generateLdmlFromTouchLayout,
} from './touch-layout-converter.js';
export * from './kmn-ast.js';

import { KmnParser } from './kmn-parser.js';
import { LdmlGenerator, LdmlGeneratorOptions } from './ldml-generator.js';
import { TouchLayoutConverter, generateLdmlFromTouchLayout } from './touch-layout-converter.js';
import { TouchLayout } from '@keymanapp/common-types';

/**
 * Options for the KMN to LDML converter.
 *
 * Extends LdmlGeneratorOptions with additional options for touch layout integration.
 */
export interface KmnToLdmlOptions extends LdmlGeneratorOptions {
  /** Touch layout JSON content (optional) */
  touchLayout?: TouchLayout.TouchLayoutFile;
  /** Touch layout JSON string (optional) */
  touchLayoutJson?: string;
}

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
 *   hardwareForm: 'iso',  // Default: 'iso' for maximum hardware compatibility
 *   useSetMapping: true
 * });
 * fs.writeFileSync('my_keyboard.xml', ldmlXml);
 * ```
 */
export function convertKmnToLdml(kmnSource: string, options: KmnToLdmlOptions = {}): string {
  // Parse KMN source
  const parser = new KmnParser();
  const keyboard = parser.parse(kmnSource);

  // Generate base LDML from KMN
  const generator = new LdmlGenerator(options);
  let ldml = generator.generate(keyboard);

  // If touch layout provided, merge it
  if (options.touchLayout || options.touchLayoutJson) {
    const touchLayout = options.touchLayout ||
      (options.touchLayoutJson ? JSON.parse(options.touchLayoutJson) : null);

    if (touchLayout) {
      const touchConverter = new TouchLayoutConverter();
      const touchResult = touchConverter.convert(touchLayout);

      // Insert touch layout elements before closing tag
      const touchXml = generateLdmlFromTouchLayout(touchResult);
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
export class KmnToLdmlConverter {
  private parser: KmnParser;
  private generator: LdmlGenerator;
  private touchConverter: TouchLayoutConverter;

  constructor(options: LdmlGeneratorOptions = {}) {
    this.parser = new KmnParser();
    this.generator = new LdmlGenerator(options);
    this.touchConverter = new TouchLayoutConverter();
  }

  /**
   * Convert KMN source to LDML XML.
   *
   * @param kmnSource - Complete KMN keyboard source code
   * @param touchLayout - Optional touch layout data to merge into the LDML
   * @returns Complete LDML keyboard XML string
   */
  public convert(kmnSource: string, touchLayout?: TouchLayout.TouchLayoutFile): string {
    const keyboard = this.parser.parse(kmnSource);
    let ldml = this.generator.generate(keyboard);

    if (touchLayout) {
      const touchResult = this.touchConverter.convert(touchLayout);
      const touchXml = generateLdmlFromTouchLayout(touchResult);
      ldml = ldml.replace('</keyboard3>', touchXml + '</keyboard3>');
    }

    return ldml;
  }

  /**
   * Parse KMN source to AST without converting to LDML.
   *
   * Useful for debugging, inspection, or custom processing of the parsed structure.
   *
   * @param kmnSource - Complete KMN keyboard source code
   * @returns Parsed KMN AST with stores, groups, and rules
   */
  public parseKmn(kmnSource: string) {
    return this.parser.parse(kmnSource);
  }

  /**
   * Convert only the touch layout to LDML structures without full keyboard conversion.
   *
   * Useful for testing touch layout conversion or when you only need the touch
   * layer definitions without the full keyboard.
   *
   * @param touchLayout - Touch layout JSON data
   * @returns Converted LDML structures (keys, flicks, layers)
   */
  public convertTouchLayout(touchLayout: TouchLayout.TouchLayoutFile) {
    return this.touchConverter.convert(touchLayout);
  }
}
