/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Test helpers and utilities for kmc-kmn-to-ldml tests
 */

import { fileURLToPath } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import { LDMLKeyboardXMLSourceFileReader } from '@keymanapp/developer-utils';
import { TestCompilerCallbacks } from '@keymanapp/developer-test-helpers';

/**
 * Builds a path to the fixture with the given path components.
 *
 * e.g., makePathToFixture('keyboards', 'sil_cameroon_qwerty', 'sil_cameroon_qwerty.kmn')
 *
 * @param components One or more path components relative to test/fixtures/
 * @returns Absolute path to the fixture file
 */
export function makePathToFixture(...components: string[]): string {
  return fileURLToPath(new URL(
    path.join('..', '..', '..', 'test', 'fixtures', ...components),
    import.meta.url
  ));
}

/**
 * Get path to test keyboards directory
 * @returns Absolute path to test/fixtures/keyboards/
 */
export function getKeyboardsFixturePath(): string {
  return makePathToFixture('keyboards');
}

/**
 * Get all keyboard directories in fixtures
 * @returns Array of keyboard directory names
 */
export function getAvailableKeyboards(): string[] {
  const keyboardsPath = getKeyboardsFixturePath();
  if (!fs.existsSync(keyboardsPath)) {
    return [];
  }
  return fs.readdirSync(keyboardsPath).filter(name => {
    const fullPath = path.join(keyboardsPath, name);
    return fs.statSync(fullPath).isDirectory();
  });
}

/**
 * Find all .kmn files in a keyboard directory
 * @param keyboardName Name of keyboard directory in fixtures/keyboards/
 * @returns Array of absolute paths to .kmn files
 */
export function findKmnFiles(keyboardName: string): string[] {
  const keyboardDir = makePathToFixture('keyboards', keyboardName);
  if (!fs.existsSync(keyboardDir)) {
    return [];
  }
  return fs.readdirSync(keyboardDir)
    .filter(file => file.endsWith('.kmn'))
    .map(file => path.join(keyboardDir, file));
}

/**
 * Get all LDML reference keyboard files from CLDR standards
 * @returns Array of absolute paths to LDML XML files
 */
export function getLdmlReferenceFiles(): string[] {
  const ldmlDir = makePathToFixture('ldml-reference');
  if (!fs.existsSync(ldmlDir)) {
    return [];
  }
  return fs.readdirSync(ldmlDir)
    .filter(file => file.endsWith('.xml') && !file.includes('-test'))
    .map(file => path.join(ldmlDir, file));
}

/**
 * Validate LDML XML against the LDML Keyboard 3.0 JSON schema
 *
 * @param ldmlXml LDML XML string to validate
 * @param callbacks Optional callbacks for error reporting (if not provided, creates new instance)
 * @returns Object with isValid flag and any validation errors
 */
export function validateLdmlXml(ldmlXml: string, callbacks?: TestCompilerCallbacks): {
  isValid: boolean;
  errors: string[];
} {
  const cb = callbacks || new TestCompilerCallbacks();
  const reader = new LDMLKeyboardXMLSourceFileReader({
    cldrImportsPath: fileURLToPath(new URL('../../../../../../../resources/standards-data/ldml-keyboards/46/import/', import.meta.url)),
    localImportsPaths: []
  }, cb);

  try {
    const source = reader.load(Buffer.from(ldmlXml));
    if (!source) {
      return {
        isValid: false,
        errors: ['Failed to parse LDML XML']
      };
    }

    const isValid = reader.validate(source);
    const errors = cb.messages.map(m => `${m.message} (${m.code})`);

    return { isValid, errors };
  } catch (e) {
    return {
      isValid: false,
      errors: [(e as Error).message]
    };
  }
}
