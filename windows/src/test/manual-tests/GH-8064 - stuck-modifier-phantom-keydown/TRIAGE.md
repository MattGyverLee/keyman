# Triage: which path stuck this modifier?

For [#8064](https://github.com/keymanapp/keyman/issues/8064). Companion to
[README.md](./README.md) and [MODIFIER-PRODUCERS.md](./MODIFIER-PRODUCERS.md).

A user reports a modifier stuck down machine-wide. **Do not assume it is a
regression of the #8064 fix.** #8064's own repro was contrived, and
[MODIFIER-PRODUCERS.md](./MODIFIER-PRODUCERS.md) Finding 1 shows the on-screen
keyboard can produce the identical symptom — including the unclearable Right
Control case that is the worst field report.

This file tells the two apart.

## First, before anything else

Confirm the symptom, and recover:

```powershell
# Oracle. Reads all nine, not just the six chiral VKs.
Add-Type -Name Km8064 -Namespace Probe -MemberDefinition '[DllImport("user32.dll")] public static extern short GetAsyncKeyState(int vKey);'
$mods = [ordered]@{ SHIFT=0x10; CTRL=0x11; ALT=0x12; LSHIFT=0xA0; RSHIFT=0xA1; LCTRL=0xA2; RCTRL=0xA3; LALT=0xA4; RALT=0xA5 }
foreach ($m in $mods.GetEnumerator()) {
  '{0,-7} {1}' -f $m.Key, $(if ([Probe.Km8064]::GetAsyncKeyState($m.Value) -lt 0) { 'DOWN  <-- held' } else { 'up' })
}
```

Record **which** modifier and whether it is chiral before you clear it — that is
signal, and the recovery sweep destroys it.

## The signals

Every `discriminating?` below is filled from what the source actually predicts,
and the two entries marked *not observable* were **expected** to be useful and
are not. They stay in the table, marked `no`, because knowing a signal is dead is
more useful to the next responder than its absence.

| signal | serializer path (1) | OSK path (2a/2b) | discriminating? |
|---|---|---|---|
| **Is the OSK open right now?** | irrelevant | required at the time of the wedge | **yes** — but see the trap below. Window class `TfrmVisualKeyboard` exists and is visible iff the OSK is open (`k32_visualkeyboardinterface.cpp:46-48`). Verified both directions |
| **Has the OSK been open earlier this session?** | — | — | **no, and it cannot be made to.** The form is *freed* on every dismissal path, so the window class disappears and nothing in the process records that it once existed. This was expected to discriminate. It does not |
| **`KL.Log` lines from `do_keybd_event` / `ShiftStateChange` / `tmrCheckTimer`** | — | — | **no — the signal does not exist.** `common/windows/delphi/general/klog.pas:26` reads `{DEFINE KLOGGING}`, a plain comment with the `$` missing, and `KLOGGING` appears nowhere else in the repository. Every `Log` body is `{$IFDEF KLOGGING}`-guarded, so all three calls compile to empty procedures. **Strike this from any triage procedure that cites it** |
| **`SendDebugMessageFormat` from `keybd_shift`, and `"cache says held but OS says up, clearing vkey=…"`** (`keybd_shift.cpp:255`) | present, naming the exact VK | absent — the OSK emits no `SendDebugMessage*` at all | **yes**, once enabled. See *Turning the log on* below |
| **Scan code of the injected modifier, as seen by the hook** | `0xFF` (`SCAN_FLAG_KEYMAN_KEY_EVENT`, `keybd_shift.cpp:160`/`:184`) | `0` — the OSK passes `bScan = 0` on every call (`UfrmOSKOnScreenKeyboard.pas:134`/`:143`/`:285`/`:299`/`:308`) | **yes for five of the six, and it is the practical replacement for the dead `KL.Log` entry.** Logged with every key event at `k32_lowlevelkeyboardhook.cpp:151`. **Right Shift is the exception and the signal is absent for it:** `do_keybd_event` overwrites the caller's `SCAN_FLAG_KEYMAN_KEY_EVENT` with `SCANCODE_RSHIFT` (`keybd_shift.cpp`, `case VK_RSHIFT`) because `0x36` is what tells the receiving app which Shift it was, so an injected Right Shift is byte-identical at the hook to a physical one. A wedged Right Shift therefore cannot be attributed by scan code at all. **A second caveat, not confirmed:** the OSK passes `bScan = 0`, but whether Windows propagates 0 rather than back-filling a scan code for `keybd_event` has not been verified. Confirm once before relying on it |
| **Which modifier is stuck** | any of the six | chirally constrained by `kbd.LRShift`: `VK_SHIFT` (to Left Shift) plus, when `LRShift`, the four chiral Ctrl/Alt VKs; when not, `VK_CONTROL`/`VK_MENU` (both to left) | **weak — weaker than expected.** A wedged **Right Ctrl** was thought to point at the serializer. It does not: the OSK emits extended `VK_RCONTROL` directly (`:299`), and `SetLRShift`'s chirality collapse can strand one even on hardware that has the key (Finding 1). Use it as corroboration, never alone |
| **Does closing the OSK clear it?** | no | **only via the OSK's own X button, or by switching the OSK to another tab** | **yes, but only if you close it the right way — this is the correction that matters most.** See the trap below |

### The trap: "closing the OSK didn't clear it" does not exculpate the OSK

`ResetShiftStates` runs only from `TfrmVisualKeyboard.FormClose`, which fires only
on `TCustomForm.Close`. Dismissing the OSK from the **tray menu**, by **tray
double-click**, via `KMC_ONSCREENKEYBOARD`, or by **quitting Keyman** all free the
form via `Release` / `FreeAndNil` without raising `OnClose`
(`UfrmKeyman7Main.pas:1763`, `:561`). Those paths leave the modifier asserted.

So the test must be, in this order:

1. Switch the OSK to the **Character Map tab** (`UpdatePanels` calls
   `ResetShiftStates`, `UfrmVisualKeyboard.pas:1527`), or
2. Close the OSK with its **own X button** (`MnuOSK_Close`).

If either clears the modifier, it was the OSK. If the user reports "I closed the
OSK and it stayed stuck", ask **how** they closed it before drawing any
conclusion.

## Turning the engine log on

`SendDebugMessageFormat` is gated on `ShouldDebug()`
(`keymanengine.h:180` to `k32_dbg.cpp:130-137`) and routed to **ETW** by
`Keyman_WriteDebugEvent2W` (`DebugEventTrace.cpp:50`), which early-returns unless
debug logging is enabled.

- `HKCU\Software\Keyman\Keyman Engine`, value `debug` = `1`
  (`REGSZ_Debug`, `registry.h:100`) — enables the log.
- Same key, `debug to console` = `1` (`registry.h:101`) — also emits via
  `OutputDebugStringW`, which is far easier to capture.

Collect with `windows/src/support/etl2log`, or any `OutputDebugString` viewer.

**An absent log line is not proof of an absent event**: `ShouldDebug_1` and
`Keyman_WriteDebugEvent2W` both bail out when `ThreadGlobals()` is NULL.

## Procedure

1. Run the oracle. Record which modifier, and whether it is chiral.
2. Check for a visible `TfrmVisualKeyboard`. **OSK open** puts 2a/2b in play;
   **not open** does not rule them out, because the form is freed on close.
3. Ask how the OSK was last dismissed. Tray menu, double-click, hotkey or a
   Keyman restart all bypass the cleanup.
4. If the OSK is open: switch it to the Character Map tab. If the modifier
   clears, it was the OSK — path 2a or 2b.
5. Otherwise enable the engine log, reproduce, and read the scan code of the
   phantom KEYDOWN: `0xFF` means the serializer, `0` means the OSK.
6. Look for `"cache says held but OS says up, clearing vkey=…"`. Present means
   the serializer's reconcile is running and doing its job.
7. Recover with the sweep in [README.md](./README.md).

## If it is the serializer path after all

That is the path the #8064 fix owns, and it is pinned by
`PREPARE_INJECTED_INPUT_BATCH.*` in
`windows/src/engine/keyman32/tests/keybd_shift.tests.cpp` — those tests go red if
the reconcile call is removed. So a genuine serializer-path recurrence means a
case the tests do not model. Capture the scan code, the modifier, and the log
line, and add the case before changing any code.
