/*
 * Test the KMN to LDML converter with real keyboards
 */

import * as fs from 'fs';
import * as path from 'path';
import { KmnParser } from '../src/kmn-parser.js';
import { LdmlGenerator } from '../src/ldml-generator.js';
import { makePathToFixture } from './helpers/index.js';

async function testConverter() {
  console.log('Testing KMN to LDML converter...\n');

  // Read KMN file from fixtures
  const kmnPath = makePathToFixture('keyboards', 'sil_cameroon_qwerty', 'sil_cameroon_qwerty.kmn');
  console.log(`Reading: ${kmnPath}`);

  const kmnSource = fs.readFileSync(kmnPath, 'utf-8');
  console.log(`KMN source: ${kmnSource.length} bytes\n`);

  // Parse KMN
  console.log('Parsing KMN...');
  const parser = new KmnParser();
  const keyboard = parser.parse(kmnSource, 'sil_cameroon_qwerty.kmn');

  console.log(`\nParsed keyboard:`);
  console.log(`  Stores: ${keyboard.stores.length}`);
  console.log(`  Groups: ${keyboard.groups.length}`);

  // Show stores
  console.log('\n  System stores:');
  for (const store of keyboard.stores.filter(s => s.isSystem)) {
    console.log(`    &${store.name} = "${store.value.substring(0, 50)}${store.value.length > 50 ? '...' : ''}"`);
  }

  console.log('\n  User stores:');
  for (const store of keyboard.stores.filter(s => !s.isSystem)) {
    console.log(`    ${store.name} = "${store.value.substring(0, 30)}${store.value.length > 30 ? '...' : ''}"`);
  }

  // Show groups
  console.log('\n  Groups:');
  for (const group of keyboard.groups) {
    console.log(`    ${group.name}: ${group.rules.length} rules (usingKeys: ${group.usingKeys})`);
  }

  // Generate LDML
  console.log('\n\nGenerating LDML...');
  const generator = new LdmlGenerator({
    locale: 'und-Latn-CM',
    conformsTo: '45',
  });
  const ldml = generator.generate(keyboard);

  console.log(`\nGenerated LDML: ${ldml.length} bytes`);

  // Show first part of output
  console.log('\n--- LDML Output (first 100 lines) ---');
  const lines = ldml.split('\n').slice(0, 100);
  console.log(lines.join('\n'));
  console.log('...\n');

  // Write output for inspection (optional - comment out if not needed)
  // const outputPath = path.join(process.cwd(), 'sil_cameroon_qwerty.xml');
  // fs.writeFileSync(outputPath, ldml);
  // console.log(`Full output written to: ${outputPath}`);
}

testConverter().catch(console.error);
