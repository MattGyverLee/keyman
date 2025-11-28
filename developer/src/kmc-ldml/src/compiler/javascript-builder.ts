/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Utility for building JavaScript code programmatically with proper indentation
 */

/**
 * Builder for generating properly indented JavaScript code.
 *
 * This utility class provides a fluent API for programmatically generating JavaScript
 * code with consistent indentation and formatting. It supports both minified and
 * pretty-printed output based on the debug option.
 *
 * Features:
 * - Automatic indentation management with block nesting
 * - Method chaining for fluent code construction
 * - Conditional formatting (debug vs. production)
 * - Support for comments and blank lines in debug mode
 *
 * @example
 * ```typescript
 * const builder = new JavaScriptBuilder({ debug: true });
 * builder
 *   .openBlock('function myFunc()')
 *     .append('var x = 1;')
 *     .comment('Process the value')
 *     .append('return x * 2;')
 *   .closeBlock();
 * const code = builder.toString();
 * ```
 */
export class JavaScriptBuilder {
  private result: string = '';
  private indentLevel: number = 0;
  private readonly indentString: string;
  private readonly newline: string;

  /**
   * Create a new JavaScript builder
   * @param options Configuration options
   */
  constructor(options: { debug?: boolean } = {}) {
    this.indentString = options.debug ? '  ' : '';
    this.newline = options.debug ? '\n' : '';
  }

  /**
   * Append a line of code with current indentation
   * @param code The code to append (newline will be added automatically)
   * @returns this for method chaining
   */
  append(code: string): this {
    this.result += this.indent() + code + this.newline;
    return this;
  }

  /**
   * Append raw text without indentation or newline
   * @param text The text to append as-is
   * @returns this for method chaining
   */
  appendRaw(text: string): this {
    this.result += text;
    return this;
  }

  /**
   * Open a new block with a statement (e.g., "if (condition)" or "function foo()")
   * Adds opening brace and increases indentation
   * @param statement The statement before the opening brace
   * @returns this for method chaining
   */
  openBlock(statement: string = ''): this {
    if (statement) {
      this.result += this.indent() + statement + ' {' + this.newline;
    } else {
      this.result += this.indent() + '{' + this.newline;
    }
    this.indentLevel++;
    return this;
  }

  /**
   * Close the current block
   * Decreases indentation and adds closing brace
   * @param suffix Optional suffix after closing brace (e.g., ';' for IIFE)
   * @returns this for method chaining
   */
  closeBlock(suffix: string = ''): this {
    this.indentLevel--;
    this.result += this.indent() + '}' + suffix + this.newline;
    return this;
  }

  /**
   * Append a blank line (only in debug mode)
   * @returns this for method chaining
   */
  blankLine(): this {
    if (this.newline) {
      this.result += this.newline;
    }
    return this;
  }

  /**
   * Append a comment line
   * @param comment The comment text (without // prefix)
   * @returns this for method chaining
   */
  comment(comment: string): this {
    this.result += this.indent() + '// ' + comment + this.newline;
    return this;
  }

  /**
   * Get the current indentation string
   */
  private indent(): string {
    return this.indentString.repeat(this.indentLevel);
  }

  /**
   * Get the tab string (single indent unit)
   */
  get tab(): string {
    return this.indentString;
  }

  /**
   * Get the newline string
   */
  get nl(): string {
    return this.newline;
  }

  /**
   * Convert the builder to a string
   * @returns The generated JavaScript code
   */
  toString(): string {
    return this.result;
  }

  /**
   * Get the current indentation level
   */
  get currentIndentLevel(): number {
    return this.indentLevel;
  }

  /**
   * Temporarily increase indent without opening a block
   * Use with caution - prefer openBlock/closeBlock when possible
   */
  increaseIndent(): this {
    this.indentLevel++;
    return this;
  }

  /**
   * Temporarily decrease indent without closing a block
   * Use with caution - prefer openBlock/closeBlock when possible
   */
  decreaseIndent(): this {
    this.indentLevel--;
    return this;
  }
}
