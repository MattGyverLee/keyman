# kmc-kmn-to-ldml: KMN ↔ LDML Bidirectional Converter

**Status:** Development (feat/ldml-js-compile-clean branch)

## Overview

This package provides bidirectional conversion between Keyman's legacy KMN keyboard format and the Unicode LDML Keyboard 3.0 standard. It enables keyboard developers to:

- **Migrate KMN keyboards to LDML** for cross-platform compatibility
- **Generate KMN from LDML** for testing and round-trip validation
- **Validate LDML output** against the official LDML Keyboard 3.0 schema

## Architecture

### Core Components

1. **KMN Parser** (`src/kmn-parser.ts`)
   - Parses KMN source files into an Abstract Syntax Tree (AST)
   - Handles stores, groups, rules, and metadata
   - Supports KMN 17.0 syntax

2. **LDML Generator** (`src/ldml-generator.ts`)
   - Converts KMN AST to LDML XML
   - Generates hardware and touch layouts
   - Handles transforms, variables, and markers
   - Produces schema-compliant LDML Keyboard 3.0

3. **KMN Generator** (`src/kmn-generator.ts`)
   - Converts LDML XML back to KMN source
   - Enables round-trip testing
   - Preserves keyboard semantics

4. **Touch Layout Converter** (`src/touch-layout-converter.ts`)
   - Specialized conversion for touch keyboard layouts
   - Handles `.keyman-touch-layout` JSON format

## Test Infrastructure

### CLDR Reference Keyboard Testing

The package includes comprehensive testing using official CLDR LDML keyboards:

**Test Fixtures** (`test/fixtures/ldml-reference/`)
- 8 official CLDR keyboards: Bengali, French, Japanese, Maltese, Nigerian Pidgin, Portuguese
- Covers diverse features: imports, transforms, variables, flicks, multiple layers

**Validation Infrastructure** (`test/helpers/index.ts`)
- `validateLdmlXml()`: Validates LDML against official LDML Keyboard 3.0 JSON schema
- `getLdmlReferenceFiles()`: Discovers CLDR test keyboards
- Uses `LDMLKeyboardXMLSourceFileReader` and `SchemaValidators.ldmlKeyboard3()`

**Test Suites**
- `test/ldml-reference-test.ts`: Tests LDML→KMN→LDML round-trip with CLDR keyboards
- `test/round-trip-test.ts`: Tests KMN→LDML→KMN round-trip with schema validation
- `test/compile-compare-test.ts`: Compares compiled output (requires monorepo build)

### Round-Trip Validation

Both test suites validate:
1. ✅ Original LDML/KMN parses correctly
2. ✅ Conversion generates valid output
3. ✅ Round-trip preserves keyboard functionality
4. ✅ Generated LDML passes LDML Keyboard 3.0 schema validation

## Building

### From Monorepo Root (Recommended)

```bash
cd /path/to/keyman
./build.sh configure
./build.sh build:developer
```

### Standalone (Limited)

```bash
cd developer/src/kmc-kmn-to-ldml
npm install  # Will fail for workspace dependencies
npx tsc      # Compiles source (tests require monorepo)
```

**Note:** This package depends on workspace packages (`@keymanapp/kmc-kmn`, `@keymanapp/developer-utils`) that must be built from the monorepo root.

## Usage

### Convert KMN → LDML

```bash
kmc build <keyboard.kmn>  # Generates keyboard.xml
```

### Convert LDML → KMN (for testing)

```typescript
import { generateKmn } from '@keymanapp/kmc-kmn-to-ldml';

const ldmlXml = fs.readFileSync('keyboard.xml', 'utf-8');
const kmnSource = generateKmn(ldmlXml);
fs.writeFileSync('keyboard.kmn', kmnSource);
```

## Relationship to LDML Mobile Support

### Why No JavaScript Compilation?

This package **does not** compile LDML to JavaScript, despite LDML keyboards needing to run on web/mobile platforms. Here's why:

**The Official Plan: epic/web-core**

Keyman's architecture direction is to support LDML keyboards via **native processing**:
- **Desktop (Windows/macOS/Linux):** LDML → KMX+ binary → Keyman Core (C++)
- **Mobile/Web:** LDML → KMX+ binary → **Keyman Core WASM**

The `epic/web-core` branch implements:
- ✅ Complete KMX+ binary format compiler (all sections implemented)
- ✅ Keyman Core compiled to WASM
- ✅ Core WASM integration into KeymanWeb
- ⚠️ Touch layout processing (in progress, issue #8093)

**Stopgap Solution: feat/ldml-js-stopgap Branch**

A temporary LDML→JS compiler exists on the `feat/ldml-js-stopgap` branch for interim use while epic/web-core is being completed. However:
- ❌ It was intentionally disabled in Keyman 17.0 (commit 6672f0a019, issue #10547)
- ❌ Reason: "stubbed and incomplete .js files that don't actually work"
- ❌ Duplicates the epic/web-core effort

**This Branch's Focus**

This branch (`feat/ldml-js-compile-clean`) focuses on:
- ✅ KMN↔LDML conversion for keyboard migration
- ✅ CLDR reference keyboard testing
- ✅ LDML schema validation
- ❌ Not JavaScript compilation (use epic/web-core instead)

## Features & Limitations

### Supported KMN Features

- ✅ System stores (&NAME, &VERSION, etc.)
- ✅ User stores (converted to LDML variables)
- ✅ Key rules with modifiers
- ✅ Transform rules (context matching)
- ✅ Deadkeys (converted to LDML markers)
- ✅ Touch layouts
- ✅ Virtual key codes

### Limitations

- ⚠️ Some KMN features may not have direct LDML equivalents
- ⚠️ Platform-specific features may be simplified
- ⚠️ Complex transforms may require manual adjustment
- ⚠️ Generated keyboards should be tested before production use

### LDML Features

- ✅ LDML Keyboard 3.0 spec compliance
- ✅ Hardware and touch layers
- ✅ Transforms with reordering
- ✅ Variables (string, set, uset)
- ✅ Markers (deadkeys)
- ✅ Imports from CLDR
- ✅ Flick gestures
- ✅ Long-press (subkeys)
- ✅ Schema validation

## Dependencies

### Runtime Dependencies
- `@keymanapp/developer-utils` - LDML reader, schema validators
- `@keymanapp/common-types` - Type definitions
- `@keymanapp/kmc-kmn` - KMN compiler (for comparison tests)

### Development Dependencies
- `typescript` - Compiler
- `mocha`, `chai` - Testing framework
- `@keymanapp/developer-test-helpers` - Test utilities

## Testing

### Run All Tests (from monorepo)

```bash
cd developer/src/kmc-kmn-to-ldml
npm test
```

### Run Specific Test Suite

```bash
npx mocha build/test/ldml-reference-test.js  # CLDR keyboards
npx mocha build/test/round-trip-test.js      # Round-trip validation
```

## Project Status

**Current Branch:** `feat/ldml-js-compile-clean`

**Completed:**
- ✅ KMN ↔ LDML bidirectional conversion
- ✅ CLDR reference keyboard testing infrastructure
- ✅ LDML schema validation in tests
- ✅ Integration with kmc build system

**Pending:**
- 🔲 Additional KMN feature coverage
- 🔲 More comprehensive LDML feature testing
- 🔲 Performance optimization
- 🔲 Production testing with real keyboards

**Related Branches:**
- `feat/ldml-js-stopgap` - LDML→JS compiler (temporary stopgap)
- `epic/web-core` - Native LDML support via Core WASM (official direction)

## Contributing

This package is part of the Keyman project. For contributions:

1. Ensure TypeScript compiles without errors
2. Add tests for new features
3. Validate LDML output against schema
4. Test round-trip conversion
5. Follow Keyman coding standards

## References

- [LDML Keyboard 3.0 Specification](https://unicode.org/reports/tr35/tr35-keyboards.html)
- [KMX+ Binary Format](../../../docs/file-formats/kmx-plus-file-format.md)
- [Keyman Developer Documentation](https://help.keyman.com/developer/)
- [CLDR Keyboards](https://github.com/unicode-org/cldr-keyboards)
- [Issue #10547: Disable LDML .js output](https://github.com/keymanapp/keyman/issues/10547)
- [Issue #8093: LDML processor touch support](https://github.com/keymanapp/keyman/issues/8093)
- [Issue #13424: OSK support epic](https://github.com/keymanapp/keyman/issues/13424)
