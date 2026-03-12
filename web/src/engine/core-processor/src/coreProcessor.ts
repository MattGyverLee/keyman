/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * TypeScript wrapper around the Keyman Core WASM module.
 * Provides keyboard loading, state management, and keystroke processing
 * for LDML and KMX keyboards via the compiled Core library.
 */

import {
  type CoreActions,
  type CoreKeyboardAttrs,
  CoreContextStatus,
  CoreStatus,
  type CoreWasmModule,
  type WasmCoreKeyboardState
} from './coreTypes.js';

/**
 * Converts an array of UTF-32 codepoints to a JavaScript string.
 */
function codepointsToString(codepoints: readonly number[]): string {
  return String.fromCodePoint(...codepoints);
}

/**
 * Converts a JavaScript string to an array of UTF-32 codepoints.
 */
function stringToCodepoints(str: string): number[] {
  return [...str].map(ch => ch.codePointAt(0)!);
}

/**
 * High-level wrapper around a Keyman Core WASM keyboard instance.
 * Manages the lifecycle of a single loaded keyboard and its processing state.
 *
 * Usage:
 * ```ts
 * const processor = await CoreProcessor.create(wasmModuleFactory);
 * processor.loadKeyboard(keyboardBlob);
 * const actions = processor.processEvent(vkey, modifiers, true);
 * processor.dispose();
 * ```
 */
export class CoreProcessor {
  private wasmModule: CoreWasmModule;
  private state: WasmCoreKeyboardState | null = null;

  private constructor(wasmModule: CoreWasmModule) {
    this.wasmModule = wasmModule;
  }

  /**
   * Creates a CoreProcessor by loading the WASM module from the given URL.
   *
   * @param wasmModuleFactory  An async factory that returns the initialized WASM module.
   *                           This is typically the default export of the Emscripten-generated JS.
   */
  static async create(wasmModuleFactory: () => Promise<CoreWasmModule>): Promise<CoreProcessor> {
    const module = await wasmModuleFactory();
    return new CoreProcessor(module);
  }

  /**
   * Creates a CoreProcessor from an already-initialized WASM module.
   */
  static fromModule(wasmModule: CoreWasmModule): CoreProcessor {
    return new CoreProcessor(wasmModule);
  }

  /**
   * Loads a keyboard from a compiled binary blob (.kmx file contents).
   * Disposes any previously loaded keyboard.
   *
   * @param blob  The keyboard binary data as a Uint8Array.
   * @returns     CoreStatus.OK on success, or an error status code.
   */
  loadKeyboard(blob: Uint8Array): CoreStatus {
    this.disposeState();
    this.state = new this.wasmModule.CoreKeyboardState();
    const status = this.state.loadKeyboard(blob);
    if (status !== CoreStatus.OK) {
      this.disposeState();
    }
    return status;
  }

  /**
   * Processes a single keystroke event through the loaded keyboard.
   *
   * @param vk            Virtual key code (matches Windows VK codes).
   * @param modifierState Modifier key bitmask.
   * @param isKeyDown     True for key-down, false for key-up.
   * @returns             The resulting actions, or null if no keyboard is loaded.
   */
  processEvent(vk: number, modifierState: number, isKeyDown: boolean): CoreActions | null {
    if (!this.state || !this.state.isKeyboardLoaded()) {
      return null;
    }
    return this.state.processEvent(vk, modifierState, isKeyDown);
  }

  /**
   * Sends the KEYBOARD_ACTIVATED event to the processor.
   * Should be called after loading a keyboard and before processing events.
   *
   * @returns CoreStatus.OK on success.
   */
  activateKeyboard(): CoreStatus {
    if (!this.state) {
      return CoreStatus.InvalidArgument;
    }
    return this.state.activateKeyboard();
  }

  /**
   * Sets the context (text before the insertion point) for the processor.
   * The Core will compare with its cached context and only update if different.
   *
   * @param context  The current application context as a string.
   * @returns        A CoreContextStatus value.
   */
  setContext(context: string): CoreContextStatus {
    if (!this.state) {
      return CoreContextStatus.InvalidArgument;
    }
    return this.state.setContext(context);
  }

  /**
   * Clears the processor's cached context.
   */
  clearContext(): void {
    if (this.state) {
      this.state.clearContext();
    }
  }

  /**
   * Returns attributes of the currently loaded keyboard, or null if none loaded.
   */
  getKeyboardAttrs(): CoreKeyboardAttrs | null {
    if (!this.state) {
      return null;
    }
    return this.state.getKeyboardAttrs();
  }

  /**
   * Whether a keyboard is currently loaded and ready for event processing.
   */
  get isReady(): boolean {
    return this.state !== null && this.state.isKeyboardLoaded();
  }

  /**
   * Releases all WASM resources held by this processor.
   * After calling dispose(), the processor cannot be reused.
   */
  dispose(): void {
    this.disposeState();
  }

  private disposeState(): void {
    if (this.state) {
      // delete() invokes the C++ destructor which calls dispose() internally
      this.state.delete();
      this.state = null;
    }
  }
}

export { codepointsToString, stringToCodepoints };
