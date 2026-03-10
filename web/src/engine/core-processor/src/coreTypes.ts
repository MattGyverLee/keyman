/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * TypeScript type definitions for the Keyman Core WASM bindings.
 * Mirrors the C types defined in keyman_core_api.h and keyman_core_api_actions.h.
 */

/**
 * Status codes returned by Core API functions.
 * Mirrors `km_core_status` from keyman_core_api.h.
 */
export enum CoreStatus {
  OK = 0,
  NoMem = 1,
  IOError = 2,
  InvalidArgument = 3,
  KeyError = 4,
}

/**
 * Caps lock state values.
 * Mirrors `km_core_caps_state` from keyman_core_api.h.
 */
export enum CapsLockState {
  Unchanged = -1,
  Off = 0,
  On = 1,
}

/**
 * Context status returned by `km_core_state_context_set_if_needed`.
 * Mirrors `km_core_context_status` from keyman_core_api.h.
 */
export enum CoreContextStatus {
  Updated = 0,
  Unchanged = 1,
  Error = 2,
  InvalidArgument = 3,
  ClearedByEmptyContext = 4,
}

/**
 * A persisted option emitted by the processor.
 */
export interface CoreOptionItem {
  readonly key: string;
  readonly value: string;
  readonly scope: number;
}

/**
 * The result of processing a single keystroke via Keyman Core.
 * Mirrors `km_core_actions` from keyman_core_api.h.
 */
export interface CoreActions {
  /** Number of codepoints to delete before insertion point. */
  readonly code_points_to_delete: number;
  /** UTF-32 codepoints to insert into the document. */
  readonly output: readonly number[];
  /** Codepoints that were deleted from context (for encoding fixups). */
  readonly deleted_context: readonly number[];
  /** Whether to emit a system beep/alert. */
  readonly do_alert: boolean;
  /** Whether to pass the keystroke through to the application. */
  readonly emit_keystroke: boolean;
  /** Caps lock state change: -1=unchanged, 0=off, 1=on. */
  readonly new_caps_lock_state: CapsLockState;
  /** Options that should be persisted by the platform layer. */
  readonly persist_options: readonly CoreOptionItem[];
  /** If present, indicates an error occurred. */
  readonly error?: CoreStatus;
}

/**
 * Keyboard attributes returned by the Core.
 */
export interface CoreKeyboardAttrs {
  readonly version_string: string;
  readonly id: string;
}

/**
 * Interface for the WASM-instantiated CoreKeyboardState class.
 * This matches the embind-registered C++ class in core_wasm_bindings.cpp.
 */
export interface WasmCoreKeyboardState {
  loadKeyboard(blob: Uint8Array): number;
  processEvent(vk: number, modifierState: number, isKeyDown: boolean): CoreActions | null;
  activateKeyboard(): number;
  setContext(context: string): number;
  clearContext(): void;
  getKeyboardAttrs(): CoreKeyboardAttrs | null;
  isKeyboardLoaded(): boolean;
  dispose(): void;
  delete(): void;  // Embind destructor
}

/**
 * Interface for the Emscripten-generated WASM module.
 */
export interface CoreWasmModule {
  CoreKeyboardState: { new(): WasmCoreKeyboardState };
  KM_CORE_STATUS_OK: number;
  KM_CORE_STATUS_NO_MEM: number;
  KM_CORE_STATUS_IO_ERROR: number;
  KM_CORE_STATUS_INVALID_ARGUMENT: number;
  KM_CORE_STATUS_KEY_ERROR: number;
  KM_CORE_CAPS_UNCHANGED: number;
  KM_CORE_CAPS_OFF: number;
  KM_CORE_CAPS_ON: number;
}
