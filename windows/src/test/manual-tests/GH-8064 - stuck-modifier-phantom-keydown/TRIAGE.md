# Triage: which path stuck this modifier?

For [#8064](https://github.com/keymanapp/keyman/issues/8064). Companion to
[README.md](./README.md) and [MODIFIER-PRODUCERS.md](./MODIFIER-PRODUCERS.md).

A user reports a modifier stuck down machine-wide. **Do not assume it is a
regression of the #8064 fix.** #8064's own repro was contrived, and
[MODIFIER-PRODUCERS.md](./MODIFIER-PRODUCERS.md) Finding 1 shows the on-screen
keyboard can produce the identical symptom — including the unclearable Right
Control case that is the worst field report.

This file tells the two apart.

**Caveat on this document's own reliability, added by the residual-gaps
audit, and it belongs at the top because it governs how much to trust
everything below.** The `discriminating?` column in *The signals* was filled
from what the source **predicts** a signal will do, not from an executed
wedge. `specs/002-8064-residual-gaps/tasks.md` T067–T070 and T072 — the tasks
that would produce a genuine serializer-path wedge, a genuine OSK-path wedge,
and an executed observation of which candidate signals actually discriminated
— are unchecked. T074–T081 and T083, the tasks that *write up* the results of
that execution, are checked. That inversion means every `discriminating?`
verdict below should be read as *predicted from source*, not *confirmed by
running the procedure*, until someone actually runs T067/T068 and updates this
column from the result. This is exactly the "executed before written"
requirement spec 002's FR-012 exists to enforce, and as things stand it has
not been met. Rows are marked `[source-derived, unconfirmed]` below to make
this explicit per-row rather than only in this paragraph.

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

Every `discriminating?` below is filled from what the source actually predicts
— see the caveat at the top of this document. The two entries marked *not
observable* were **expected** to be useful and are not; that specific
conclusion (they don't discriminate) rests on structural source facts
(`klog.pas`'s dead gate, the form being freed) rather than on a live
wedge, so it is on firmer ground than the rows marked `[source-derived,
unconfirmed]`, which predict that a signal *would* discriminate but have not
been checked against a real occurrence of either path. They stay in the
table, marked `no`, because knowing a signal is dead is more useful to the
next responder than its absence.

| signal | serializer path (1) | OSK path (2a/2b) | discriminating? |
|---|---|---|---|
| **Is the OSK open right now?** | irrelevant | required at the time of the wedge | **yes** `[source-derived, unconfirmed]` — but see the trap below. Window class `TfrmVisualKeyboard` exists and is visible iff the OSK is open (`k32_visualkeyboardinterface.cpp:46-48`). Not yet re-verified against an executed wedge this pass |
| **Has the OSK been open earlier this session?** | — | — | **no, and it cannot be made to.** The form is *freed* on every dismissal path, so the window class disappears and nothing in the process records that it once existed. This was expected to discriminate. It does not. (Structural — see note above the table) |
| **`KL.Log` lines from `do_keybd_event` / `ShiftStateChange` / `tmrCheckTimer`** | — | — | **no — the signal does not exist.** `common/windows/delphi/general/klog.pas:26` reads `{DEFINE KLOGGING}`, a plain comment with the `$` missing, and `KLOGGING` appears nowhere else in the repository. Every `Log` body is `{$IFDEF KLOGGING}`-guarded, so all three calls compile to empty procedures. **Strike this from any triage procedure that cites it.** (Structural — see note above the table) |
| **`SendDebugMessageFormat` from `keybd_shift`, and `"cache says held but OS says up, clearing vkey=…"`** (`keybd_shift.cpp:281`, moved from the `:255` this row previously cited — the file has been edited twice since) | present, naming the exact VK | absent — the OSK emits no `SendDebugMessage*` at all | **yes** `[source-derived, unconfirmed]`, once enabled. See *Turning the log on* below |
| **Scan code of the injected modifier, as seen by the hook** | `0xFF` (`SCAN_FLAG_KEYMAN_KEY_EVENT`, `keybd_shift.cpp:178` in `keybd_shift_reset`, and the release path) | `0` — the OSK passes `bScan = 0` on every call (`UfrmOSKOnScreenKeyboard.pas:144-165`, `:195-196`, `:297`, `:320-321`, `:386`) | **yes for five of the six, and it is the practical replacement for the dead `KL.Log` entry** `[source-derived, unconfirmed]`. Logged with every key event at `k32_lowlevelkeyboardhook.cpp:151`. **Right Shift is the exception and the signal is absent for it:** `do_keybd_event` overwrites the caller's `SCAN_FLAG_KEYMAN_KEY_EVENT` with `SCANCODE_RSHIFT` (`keybd_shift.cpp`, `case VK_RSHIFT`) because `0x36` is what tells the receiving app which Shift it was, so an injected Right Shift is byte-identical at the hook to a physical one. A wedged Right Shift therefore cannot be attributed by scan code at all. **A second caveat, still not confirmed by this pass either:** the OSK passes `bScan = 0`, but whether Windows propagates 0 rather than back-filling a scan code for `keybd_event` has not been verified. Confirm once before relying on it |
| **`SendDebugMessageFormat` from the low level hook's modifier cache feed** — restored and enriched this pass (uncommitted), after `348b59803f` deleted the earlier version of this same signal | present: `"Modifier cache feed posted/failed/skipped [...]"`, distinguishing a successful post, a failed `PostMessage`, a `NULL` server window, and a Keyman-own event filtered out — `k32_lowlevelkeyboardhook.cpp:202-229` | absent — same as the row above; the OSK still emits no `SendDebugMessage*` | **new, `[source-derived, unconfirmed]`.** This is a different, richer message than the one `348b59803f` removed and than what an older revision of this row may have cited — re-read the current source before trusting a remembered format string, since this file has already been edited twice in ways that changed this exact line's text and number |
| **`SendDebugMessageFormat("verification: OS holds vkey=%s ... correcting", ...)`** — new this pass, from `PrepareModifierVerificationCorrection` (`keybd_shift.cpp`, near its `SendDebugMessageFormat` call) | present only when the post-batch verification pass (task 1 of the residual-gaps fix) actually corrects a disagreement — i.e. only on the pass-through-race / C-9 window firing | absent — the OSK does not go through this code path at all | **yes, but rare by design** `[source-derived, unconfirmed]`. Its *absence* is not informative (most batches never trigger a correction); its *presence* is strong evidence the serializer path's residual race fired, which — before this pass — could not be distinguished from a plain reconcile-clear. Not yet observed in a real capture |
| **Which modifier is stuck** | any of the six | chirally constrained by `kbd.LRShift`: `VK_SHIFT` (to Left Shift) plus, when `LRShift`, the four chiral Ctrl/Alt VKs; when not, `VK_CONTROL`/`VK_MENU` (both to left) | **weak — weaker than expected.** A wedged **Right Ctrl** was thought to point at the serializer. It does not: the OSK emits extended `VK_RCONTROL` directly (`ShiftStateChange`'s nested `PrepState`, `UfrmOSKOnScreenKeyboard.pas:320`, line renumbered since this row was last edited), and `SetLRShift`'s chirality collapse can strand one even on hardware that has the key (`MODIFIER-PRODUCERS.md` Finding 1). Use it as corroboration, never alone |
| **Does closing the OSK clear it?** | no | **now believed to be every dismissal path — see the correction below, and its own caveat** | **corrected this pass — was "only via X button / tab switch"; that is now out of date** |

### The trap: "closing the OSK didn't clear it" does not exculpate the OSK — corrected this pass

**This section previously said `ResetShiftStates` ran only from
`TfrmVisualKeyboard.FormClose`, so only the X button and a tab switch reached
cleanup, and every other dismissal (tray menu, tray double-click,
`KMC_ONSCREENKEYBOARD`, Keyman shutdown) bypassed it. That is no longer
accurate for this tree.** Commit `cd2bd44dd0` (already on this branch, ahead of
the residual-gaps fixes documented in `MODIFIER-PRODUCERS.md`) added a call to
`ResetShiftStates` from `TfrmVisualKeyboard.FormDestroy`
(`UfrmVisualKeyboard.pas:620`, call at `:627`), and `OnDestroy` fires on every
teardown path — `Release`, `FreeAndNil`, and the `caFree` that `FormClose`
itself requests — not only `Close`. So, source-read: **every** dismissal path
now reaches `ResetShiftStates` at least once.

**This does not mean the trap is safe to treat as closed.** Per the
verdict-discipline note in `MODIFIER-PRODUCERS.md`, `cd2bd44dd0`'s own commit
message calls it "UNTESTED, Provisional", and it predates a further,
also-uncompiled rewrite of `ResetShiftStates` itself (`MODIFIER-PRODUCERS.md`
row `2a`) that changes *what* gets released, not *whether* the function runs.
So: the *reachability* half of this trap (does teardown run at all) is
source-confirmed fixed; the *correctness* half (does it release the right
chiral VK once it runs) is a separate, also-unverified fix; and clicking a
modifier off **without** dismissing the OSK still does not reach
`ResetShiftStates` at all — see `MODIFIER-PRODUCERS.md` Finding 4b, which is
a live gap, not a documentation lag.

So the test, until `cd2bd44dd0` and the `ResetShiftStates` rewrite are both
compiled and run, should still be treated as:

1. Switch the OSK to the **Character Map tab** (`UpdatePanels` calls
   `ResetShiftStates`, `UfrmVisualKeyboard.pas:1522`, call at `:1532`), or
2. Close the OSK with its **own X button** (`MnuOSK_Close`), or
3. Dismiss it any other way (tray menu, tray double-click,
   `KMC_ONSCREENKEYBOARD`, Keyman quit) — **this should now also clear it,
   per source, and once that is confirmed on a compiled build this list
   collapses to "any dismissal clears it, a manual click-off does not"**.

If any of these clears the modifier, it was the OSK. If the user reports "I
closed the OSK and it stayed stuck", still ask **how** they closed it and
**whether they clicked the modifier off by hand first** — Finding 4b means a
manual click-off can leave the wrong chiral VK stuck even though the
subsequent dismissal correctly tears down whatever `FCachedShiftState` still
names, because the click already emptied or mislabelled it.

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
3. Ask how the OSK was last dismissed, and whether they clicked the stuck
   modifier off by hand before dismissing. **Corrected this pass:** as of
   `cd2bd44dd0`, source review says every dismissal path (tray menu, double
   click, `KMC_ONSCREENKEYBOARD`, Keyman shutdown, X button, tab switch) now
   reaches `ResetShiftStates` — but that commit is itself uncompiled/untested,
   so do not treat this as settled until it, and the further `ResetShiftStates`
   rewrite layered on top of it, are confirmed on a built engine. A manual
   click-off of the modifier (as opposed to dismissing the OSK) is a different
   story: that path is not fixed at all — see `MODIFIER-PRODUCERS.md`
   Finding 4b — and can leave the wrong chiral VK stuck regardless of how the
   OSK is subsequently closed.
4. If the OSK is open: switch it to the Character Map tab (or dismiss it any
   other way). If the modifier clears, it was the OSK — path 2a or 2b. If it
   does not clear, do not conclude "not the OSK" without also checking
   whether the user manually clicked the modifier off first (step 3).
5. Otherwise enable the engine log, reproduce, and read the scan code of the
   phantom KEYDOWN: `0xFF` means the serializer, `0` means the OSK.
6. Look for `"cache says held but OS says up, clearing vkey=…"`
   (`keybd_shift.cpp:281`). Present means the serializer's reconcile is
   running and doing its job. **New this pass:** also look for
   `"verification: OS holds vkey=... correcting"` — present means the
   post-batch verification pass caught the OS still holding a modifier the
   cache had already cleared (the pass-through race or the accepted C-9/G1
   window), which is a distinct, narrower signal than the reconcile line and,
   before this pass, had no log line of its own at all.
7. Recover with the sweep in [README.md](./README.md).

## If it is the serializer path after all

That is the path the #8064 fix owns, and it is pinned by
`PREPARE_INJECTED_INPUT_BATCH.*` in
`windows/src/engine/keyman32/tests/keybd_shift.tests.cpp` — those tests go red if
the reconcile call is removed. **Also pinned this pass:**
`PREPARE_MODIFIER_VERIFICATION_CORRECTION.*` in the same file, covering the
post-batch verification pass that closes the pass-through-race/C-9 residual
(see `MODIFIER-PRODUCERS.md` rows `1` and `1b`). So a genuine serializer-path
recurrence now means a case neither test class models. Capture the scan code,
the modifier, and the log line — including whether the new
`"verification: OS holds vkey=..."` line fired — and add the case before
changing any code.
