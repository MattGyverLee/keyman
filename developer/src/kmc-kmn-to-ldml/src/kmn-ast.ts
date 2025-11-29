/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * AST (Abstract Syntax Tree) types for KMN keyboard source files.
 * These types represent the parsed structure of a .kmn file.
 */

/**
 * Root node of a parsed KMN file
 */
export interface KmnKeyboard {
  /** File-level metadata stores */
  stores: KmnStore[];
  /** Begin statement */
  begin?: KmnBegin;
  /** Group definitions */
  groups: KmnGroup[];
  /** Source filename */
  filename?: string;
}

/**
 * Store definition: store(name) 'value' or store(&SYSTEMSTORE) 'value'
 */
export interface KmnStore {
  /** Store name (without & prefix for system stores) */
  name: string;
  /** Whether this is a system store (prefixed with &) */
  isSystem: boolean;
  /** Store value - can be string literal, range, or list of values */
  value: string;
  /** Original line number for error reporting */
  line: number;
  /** Store type flags */
  storeType?: KmnStoreType;
}

export enum KmnStoreType {
  Normal = 0x01,
  Reserved = 0x02,
  Option = 0x04,
  Debug = 0x08,
  Call = 0x10,
}

/**
 * Begin statement: begin Unicode > use(groupname)
 */
export interface KmnBegin {
  /** Mode: 'Unicode' or 'ANSI' */
  mode: 'Unicode' | 'ANSI';
  /** Initial group to use */
  groupName: string;
  /** Line number */
  line: number;
}

/**
 * Group definition with rules
 */
export interface KmnGroup {
  /** Group name */
  name: string;
  /** Whether group uses keys */
  usingKeys: boolean;
  /** Whether group is readonly */
  readonly: boolean;
  /** Rules in this group */
  rules: KmnRule[];
  /** Line number */
  line: number;
}

/**
 * A single rule: [context] + key > output
 */
export interface KmnRule {
  /** Context match pattern (before the +) */
  context: KmnRuleElement[];
  /** Key to match (after the +) */
  key?: KmnKeySpec;
  /** Output pattern (after the >) */
  output: KmnRuleElement[];
  /** Line number */
  line: number;
  /** Whether this is a match rule */
  isMatch?: boolean;
  /** Whether this is a nomatch rule */
  isNomatch?: boolean;
}

/**
 * Key specification in a rule
 */
export interface KmnKeySpec {
  /** Virtual key code (e.g., 'K_A', 'K_SPACE') */
  vkey?: string;
  /** Character literal (e.g., 'a') */
  char?: string;
  /** Modifiers */
  shift?: boolean;
  ctrl?: boolean;
  alt?: boolean;
  caps?: boolean;
  ncaps?: boolean;
  /** For mnemonic keyboards */
  mnemonic?: boolean;
}

/**
 * Element in a rule context or output
 */
export type KmnRuleElement =
  | KmnCharElement
  | KmnStoreRef
  | KmnDeadkey
  | KmnContextElement
  | KmnIndexElement
  | KmnAnyElement
  | KmnNotAnyElement
  | KmnUseElement
  | KmnSetElement
  | KmnIfElement
  | KmnBeepElement
  | KmnNulElement
  | KmnLayerElement
  | KmnOutputElement;

/** Literal character or string */
export interface KmnCharElement {
  type: 'char';
  value: string;
}

/** Reference to a store: $store or store(name) */
export interface KmnStoreRef {
  type: 'storeRef';
  storeName: string;
}

/** Deadkey: dk(name) or deadkey(name) */
export interface KmnDeadkey {
  type: 'deadkey';
  name: string;
}

/** Context reference: context or context(n) */
export interface KmnContextElement {
  type: 'context';
  offset?: number;
}

/** Index into store: index(storename, offset) */
export interface KmnIndexElement {
  type: 'index';
  storeName: string;
  offset: number;
}

/** Match any character in store: any(storename) */
export interface KmnAnyElement {
  type: 'any';
  storeName: string;
}

/** Negative match: notany(storename) */
export interface KmnNotAnyElement {
  type: 'notany';
  storeName: string;
}

/** Call another group: use(groupname) */
export interface KmnUseElement {
  type: 'use';
  groupName: string;
}

/** Set option: set(optname = value) */
export interface KmnSetElement {
  type: 'set';
  optionName: string;
  value: string;
}

/** Conditional: if(optname = value) */
export interface KmnIfElement {
  type: 'if';
  optionName: string;
  operator: '=' | '!=' | '<' | '>' | '<=' | '>=';
  value: string;
}

/** Beep output */
export interface KmnBeepElement {
  type: 'beep';
}

/** Null output (swallow input) */
export interface KmnNulElement {
  type: 'nul';
}

/** Layer switch: layer(layername) */
export interface KmnLayerElement {
  type: 'layer';
  layerName: string;
}

/** Generic output element for Unicode values */
export interface KmnOutputElement {
  type: 'output';
  value: string;
}

/**
 * Known system store names
 */
export const SYSTEM_STORES = [
  'NAME',
  'VERSION',
  'COPYRIGHT',
  'MESSAGE',
  'BITMAP',
  'HOTKEY',
  'LANGUAGE',
  'LAYOUT',
  'TARGETS',
  'VISUALKEYBOARD',
  'LAYOUTFILE',
  'KEYBOARDVERSION',
  'KMW_RTL',
  'KMW_HELPFILE',
  'KMW_HELPTEXT',
  'KMW_EMBEDJS',
  'KMW_EMBEDCSS',
  'WINDOWSLANGUAGES',
  'ETHNOLOGUECODE',
  'MNEMONICLAYOUT',
  'CASEDKEYS',
  'AUTHOR',
  'CAPSONONLY',
  'CAPSALWAYSOFF',
  'SHIFTFREESCAPS',
  'INCLUDECODES',
  'TARGETS',
] as const;

export type SystemStoreName = typeof SYSTEM_STORES[number];
