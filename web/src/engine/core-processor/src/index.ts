/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Barrel exports for the core-processor module.
 */

export { CoreProcessor, codepointsToString, stringToCodepoints } from './coreProcessor.js';
export {
  CoreStatus,
  CapsLockState,
  CoreContextStatus,
  type CoreActions,
  type CoreKeyboardAttrs,
  type CoreOptionItem,
  type CoreWasmModule,
  type WasmCoreKeyboardState
} from './coreTypes.js';
