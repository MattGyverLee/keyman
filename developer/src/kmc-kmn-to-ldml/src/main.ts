/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * KMN to LDML Keyboard Converter
 *
 * Converts Keyman .kmn keyboard source files to LDML Keyboard 3.0 XML format.
 */

export { KmnParser, parseKmn } from './kmn-parser.js';
export { LdmlGenerator, generateLdml, LdmlGeneratorOptions, UnsupportedKeyboardError } from './ldml-generator.js';
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
 * Options for the KMN to LDML converter
 */
export interface KmnToLdmlOptions extends LdmlGeneratorOptions {
  /** Touch layout JSON content (optional) */
  touchLayout?: TouchLayout.TouchLayoutFile;
  /** Touch layout JSON string (optional) */
  touchLayoutJson?: string;
}

/**
 * Convert a KMN keyboard to LDML XML
 *
 * @param kmnSource - KMN keyboard source text
 * @param options - Conversion options
 * @returns LDML XML string
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
 * Converter class for more control over the conversion process
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
   * Convert KMN source to LDML
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
   * Get the parsed KMN AST (for debugging/inspection)
   */
  public parseKmn(kmnSource: string) {
    return this.parser.parse(kmnSource);
  }

  /**
   * Convert only the touch layout (for debugging/inspection)
   */
  public convertTouchLayout(touchLayout: TouchLayout.TouchLayoutFile) {
    return this.touchConverter.convert(touchLayout);
  }
}
