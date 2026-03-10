/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Converts CoreActions (from WASM Core) to RuleBehavior (for the web engine pipeline).
 * This bridges the Core C++ processor output into the existing web engine's
 * action handling system.
 */

import { type CoreActions, CapsLockState } from './coreTypes.js';
import { codepointsToString } from './coreProcessor.js';

/**
 * Describes the result of converting CoreActions into web-engine-compatible
 * output directives. This is consumed by the InputProcessor integration layer
 * to build a RuleBehavior.
 */
export interface CoreActionResult {
  /** Characters to insert (as a JS string). */
  readonly outputText: string;
  /** Number of codepoints to delete before the insertion point. */
  readonly codePointsToDelete: number;
  /** Whether to trigger a beep/alert. */
  readonly beep: boolean;
  /** Whether to pass the keystroke through to the application. */
  readonly emitKeystroke: boolean;
  /** Caps lock change: null if unchanged, true=on, false=off. */
  readonly capsLockChange: boolean | null;
}

/**
 * Converts a CoreActions object (returned by the WASM Core after processing
 * a keystroke) into a CoreActionResult suitable for consumption by the web
 * engine's existing RuleBehavior/OutputTarget pipeline.
 *
 * @param actions  The actions returned by CoreProcessor.processEvent().
 * @returns        A simplified action result for the web engine.
 */
export function coreActionsToResult(actions: CoreActions): CoreActionResult {
  let capsLockChange: boolean | null = null;
  if (actions.new_caps_lock_state === CapsLockState.On) {
    capsLockChange = true;
  } else if (actions.new_caps_lock_state === CapsLockState.Off) {
    capsLockChange = false;
  }

  return {
    outputText: codepointsToString(actions.output),
    codePointsToDelete: actions.code_points_to_delete,
    beep: actions.do_alert,
    emitKeystroke: actions.emit_keystroke,
    capsLockChange,
  };
}
