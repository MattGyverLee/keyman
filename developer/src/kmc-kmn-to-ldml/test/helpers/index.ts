/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Test helpers and utilities for kmc-kmn-to-ldml tests
 */

import { fileURLToPath } from 'url';
import * as path from 'path';
import * as fs from 'fs';

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
