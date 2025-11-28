/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Tests for the LDML keyboard to JavaScript (KeymanWeb) compiler.
 */
import 'mocha';
import { assert } from 'chai';
import { stripIndent } from 'common-tags';

import { checkMessages, compilerTestCallbacks, compilerTestOptions, makePathToFixture } from './helpers/index.js';

import { LDMLKeyboardXMLSourceFileReader } from '@keymanapp/developer-utils';
import { LdmlKeyboardCompiler } from '../src/main.js';
import { LdmlKeyboardKeymanWebCompiler } from '../src/compiler/ldml-keyboard-keymanweb-compiler.js';

describe('ldml-keyboard-keymanweb-compiler', function() {
  this.slow(500); // 0.5 sec -- json schema validation takes a while

  it('should compile basic keyboard to JavaScript', async function() {
    const inputFilename = makePathToFixture('basic.xml');

    const k = new LdmlKeyboardCompiler();
    assert.isTrue(await k.init(compilerTestCallbacks, {...compilerTestOptions, saveDebug: true}));
    const source = k.load(inputFilename);
    checkMessages();
    assert.isNotNull(source, 'k.load should not have returned null');

    const kmwCompiler = new LdmlKeyboardKeymanWebCompiler(compilerTestCallbacks, {...compilerTestOptions, saveDebug: true});
    const jsOutput = kmwCompiler.compile(source.keyboard3, 'basic');

    // For now, just check that we get output
    // A more complete test would verify the structure
    // Note: basic.xml may not have touch layers, so output could be minimal
    assert.isNotNull(jsOutput);
    assert.isString(jsOutput);
    assert.include(jsOutput, 'KeymanWeb.KR');
    assert.include(jsOutput, 'Keyboard_basic');
  });

  it('should compile keyboard with touch layers', async function() {
    const xml = stripIndent`
      <?xml version="1.0" encoding="UTF-8"?>
      <keyboard3 xmlns="https://schemas.unicode.org/cldr/45/keyboard3" locale="mt" conformsTo="45">
        <info name="test-touch"/>
        <keys>
          <key id="a" output="a" />
          <key id="b" output="b" />
          <key id="c" output="c" />
          <key id="d" output="d" />
        </keys>
        <layers formId="touch" minDeviceWidth="300">
          <layer id="base">
            <row keys="a b" />
            <row keys="c d" />
          </layer>
        </layers>
      </keyboard3>
    `;

    const jsOutput = await compileXmlToJs(xml, 'test_touch');

    assert.isNotNull(jsOutput);
    assert.include(jsOutput, 'this.KVKL=');
    assert.include(jsOutput, '"phone"');
    assert.include(jsOutput, '"tablet"');
    assert.include(jsOutput, '"default"'); // layer id
  });

  it('should compile keyboard with flicks', async function() {
    const inputFilename = makePathToFixture('sections/keys/maximal.xml');

    const k = new LdmlKeyboardCompiler();
    assert.isTrue(await k.init(compilerTestCallbacks, {...compilerTestOptions, saveDebug: true}));
    const source = k.load(inputFilename);
    checkMessages();
    assert.isNotNull(source, 'k.load should not have returned null');

    const kmwCompiler = new LdmlKeyboardKeymanWebCompiler(compilerTestCallbacks, {...compilerTestOptions, saveDebug: true});
    const jsOutput = kmwCompiler.compile(source.keyboard3, 'maximal');

    assert.isNotNull(jsOutput);
    assert.isString(jsOutput);

    // The maximal.xml fixture has flicks
    assert.include(jsOutput, 'this.KVKL=');
    // Check for flick directions in the JSON
    assert.include(jsOutput, '"nw"');
    assert.include(jsOutput, '"se"');
    assert.include(jsOutput, '"ne"');
    assert.include(jsOutput, '"sw"');
  });

  it('should compile keyboard with long press', async function() {
    const xml = stripIndent`
      <?xml version="1.0" encoding="UTF-8"?>
      <keyboard3 xmlns="https://schemas.unicode.org/cldr/45/keyboard3" locale="mt" conformsTo="45">
        <info name="test-longpress"/>
        <keys>
          <key id="a" output="a" longPressKeyIds="a-acute a-grave" longPressDefaultKeyId="a-acute"/>
          <key id="a-acute" output="á" />
          <key id="a-grave" output="à" />
        </keys>
        <layers formId="touch" minDeviceWidth="300">
          <layer id="base">
            <row keys="a" />
          </layer>
        </layers>
      </keyboard3>
    `;

    const jsOutput = await compileXmlToJs(xml, 'test_longpress');

    assert.isNotNull(jsOutput);
    // Check for subkeys (sk) in the output
    assert.include(jsOutput, '"sk"');
    assert.include(jsOutput, '"default":true');
  });

  it('should compile keyboard with multitap', async function() {
    const xml = stripIndent`
      <?xml version="1.0" encoding="UTF-8"?>
      <keyboard3 xmlns="https://schemas.unicode.org/cldr/45/keyboard3" locale="mt" conformsTo="45">
        <info name="test-multitap"/>
        <keys>
          <key id="a" output="a" multiTapKeyIds="b c"/>
          <key id="b" output="b" />
          <key id="c" output="c" />
        </keys>
        <layers formId="touch" minDeviceWidth="300">
          <layer id="base">
            <row keys="a" />
          </layer>
        </layers>
      </keyboard3>
    `;

    const jsOutput = await compileXmlToJs(xml, 'test_multitap');

    assert.isNotNull(jsOutput);
    // Check for multitap in the output
    assert.include(jsOutput, '"multitap"');
  });

  it('should generate gs() function for transforms', async function() {
    const xml = stripIndent`
      <?xml version="1.0" encoding="UTF-8"?>
      <keyboard3 xmlns="https://schemas.unicode.org/cldr/45/keyboard3" locale="mt" conformsTo="45">
        <info name="test-transforms"/>
        <keys>
          <key id="a" output="a" />
        </keys>
        <layers formId="touch" minDeviceWidth="300">
          <layer id="base">
            <row keys="a" />
          </layer>
        </layers>
        <transforms type="simple">
          <transformGroup>
            <transform from="aa" to="ā"/>
          </transformGroup>
        </transforms>
      </keyboard3>
    `;

    const jsOutput = await compileXmlToJs(xml, 'test_transforms');

    assert.isNotNull(jsOutput);
    // Check for gs function
    assert.include(jsOutput, 'this.gs=function');
  });

  it('should handle layer switching', async function() {
    const xml = stripIndent`
      <?xml version="1.0" encoding="UTF-8"?>
      <keyboard3 xmlns="https://schemas.unicode.org/cldr/45/keyboard3" locale="mt" conformsTo="45">
        <info name="test-layers"/>
        <keys>
          <key id="a" output="a" />
          <key id="shift" layerId="shift" />
          <key id="A" output="A" />
        </keys>
        <layers formId="touch" minDeviceWidth="300">
          <layer id="base">
            <row keys="a shift" />
          </layer>
          <layer id="shift" modifiers="shift">
            <row keys="A shift" />
          </layer>
        </layers>
      </keyboard3>
    `;

    const jsOutput = await compileXmlToJs(xml, 'test_layers');

    assert.isNotNull(jsOutput);
    // Check for layers
    assert.include(jsOutput, '"default"');
    assert.include(jsOutput, '"shift"');
    assert.include(jsOutput, '"nextlayer"');
  });

  it('should set correct keyboard metadata', async function() {
    const xml = stripIndent`
      <?xml version="1.0" encoding="UTF-8"?>
      <keyboard3 xmlns="https://schemas.unicode.org/cldr/45/keyboard3" locale="mt" conformsTo="45">
        <version number="2.0"/>
        <info name="Test Keyboard" author="Test"/>
        <keys>
          <key id="a" output="a" />
        </keys>
        <layers formId="touch" minDeviceWidth="300">
          <layer id="base">
            <row keys="a" />
          </layer>
        </layers>
      </keyboard3>
    `;

    const jsOutput = await compileXmlToJs(xml, 'test_metadata');

    assert.isNotNull(jsOutput);
    // Check for metadata
    assert.include(jsOutput, 'this.KI="Keyboard_test_metadata"');
    assert.include(jsOutput, 'this.KN="Test Keyboard"');
    assert.include(jsOutput, 'this.KBVER="2.0"');
  });

  it('should handle gap keys as spacers', async function() {
    const xml = stripIndent`
      <?xml version="1.0" encoding="UTF-8"?>
      <keyboard3 xmlns="https://schemas.unicode.org/cldr/45/keyboard3" locale="mt" conformsTo="45">
        <info name="test-gap"/>
        <keys>
          <key id="a" output="a" />
          <key id="gap" gap="true" width="2"/>
          <key id="b" output="b" />
        </keys>
        <layers formId="touch" minDeviceWidth="300">
          <layer id="base">
            <row keys="a gap b" />
          </layer>
        </layers>
      </keyboard3>
    `;

    const jsOutput = await compileXmlToJs(xml, 'test_gap');

    assert.isNotNull(jsOutput);
    // Check for spacer key type (sp: 10)
    assert.include(jsOutput, '"sp":10');
  });

  it('should integrate with LdmlKeyboardCompiler.run() to produce js artifact', async function() {
    const inputFilename = makePathToFixture('sections/keys/maximal.xml');

    const k = new LdmlKeyboardCompiler();
    assert.isTrue(await k.init(compilerTestCallbacks, {...compilerTestOptions, saveDebug: true}));

    const result = await k.run(inputFilename, inputFilename.replace('.xml', '.kmx'));

    assert.isNotNull(result);
    assert.isNotNull(result.artifacts);
    assert.isNotNull(result.artifacts.js, 'js artifact should be generated');
    assert.isNotNull(result.artifacts.js.data);
    assert.isNotNull(result.artifacts.js.filename);
    assert.match(result.artifacts.js.filename, /\.js$/);

    // Verify the JS content
    const jsContent = new TextDecoder().decode(result.artifacts.js.data);
    assert.include(jsContent, 'KeymanWeb.KR');
    assert.include(jsContent, 'Keyboard_maximal');
  });
});

async function compileXmlToJs(xml: string, id: string): Promise<string | null> {
  const data = new TextEncoder().encode(xml);
  assert.isOk(data);

  const reader = new LDMLKeyboardXMLSourceFileReader(compilerTestOptions.readerOptions, compilerTestCallbacks);
  const source = reader.load(data);
  assert.isEmpty(compilerTestCallbacks.messages);
  assert.isOk(source);

  const k = new LdmlKeyboardCompiler();
  assert.isTrue(await k.init(compilerTestCallbacks, {...compilerTestOptions, saveDebug: true}));

  const kmwCompiler = new LdmlKeyboardKeymanWebCompiler(compilerTestCallbacks, {...compilerTestOptions, saveDebug: true});
  const jsOutput = kmwCompiler.compile(source.keyboard3, id);

  return jsOutput;
}
