# Triage: which path stuck this modifier?

For [#8064](https://github.com/keymanapp/keyman/issues/8064). Companion to
[README.md](./README.md), [MODIFIER-PRODUCERS.md](./MODIFIER-PRODUCERS.md),
[JUSTIFICATION.md](./JUSTIFICATION.md) and [TIMELINE.md](./TIMELINE.md).

A user reports a modifier stuck down machine-wide. **Do not assume it is a
regression of the #8064 fix.** #8064's own repro was contrived, and the on-screen
keyboard can produce the identical symptom, including the unclearable Right
Control case that is the worst field report. This file tells the two apart.

**Triage against the build the user has, not against this tree.** The OSK
behaves differently on a released build than on this branch, and several rows
below turn on that difference:

| | released builds, including 18.0.249 | this branch |
|---|---|---|
| does any OSK dismissal run cleanup? | only the X button and a tab switch | every path |
| does cleanup release the right chiral VK? | no — by the current `kbd.LRShift` regime | yes — by the identity that was injected |
| does a manual click-off release the right chiral VK? | no | yes |
| `keyman.exe` killed while a sticky modifier is held | stranded | stranded |

**How far to trust each row.** `[measured]` verdicts come from an executed OSK
wedge on a `KLOGGING` build of `keyman.exe`, recorded in
[`evidence/run-osk-teardown-2026-08-27.txt`](evidence/run-osk-teardown-2026-08-27.txt)
and
[`evidence/run-osk-clickoff-2026-08-27.txt`](evidence/run-osk-clickoff-2026-08-27.txt).
`[source-derived]` verdicts are what the source predicts, with nothing yet
checked against a real occurrence — the standing of every serializer-side row.
The serializer wedge itself reproduces on demand (5 of 5 shipped, 0 of 5 fixed),
but no run has captured the *signals* this document tells a responder to read at
the moment it fires.

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

| signal | serializer path (1) | OSK path (2a/2b) | discriminating? |
|---|---|---|---|
| **Is the OSK open right now?** | irrelevant | required at the time of the wedge | **yes** `[source-derived]`. Window class `TfrmVisualKeyboard` exists and is visible iff the OSK is open (`k32_visualkeyboardinterface.cpp:46-48`). But see the trap below |
| **Has the OSK been open earlier this session?** | — | — | **no, and it cannot be made to.** The form is *freed* on every dismissal path, so the window class disappears and nothing in the process records that it once existed. Structural, not a prediction: this will not change |
| **`KL.Log` lines from `do_keybd_event` / `ShiftStateChange` / `tmrCheckTimer`** | absent — the serializer is C++ and logs through `SendDebugMessageFormat`/ETW, not `KL.Log` | **present and decisive, in a `KLOGGING` build only** | **yes on a rebuild, unavailable in the field** `[measured]`. `common/windows/delphi/general/klog.pas:26` reads `{DEFINE KLOGGING}` — a comment, the `$` is missing — so in any build you can download every `Log` body compiles to an empty procedure. The calls are already upstream; a `keyman.exe` rebuilt with `{$DEFINE KLOGGING}` emits `ShiftStateChange: kbdShift=… asyncShift=…`, `ResetShiftStates: FShiftState=… Cache=… kbd.ShiftState=…`, `kbdKeyPressed: keybd_event vk=%x scan=%x flags=%x` and `UpdateKeyboard: VKI…`. **Blind spot:** it instruments `keyman.exe` only. `keyman32.dll` injects from inside every hooked process through the C++ ETW path and is invisible to an `OutputDebugString` capture |
| **`SendDebugMessageFormat` from `keybd_shift`, and `"cache says held but OS says up, clearing vkey=…"`** | present, naming the exact VK | absent — the OSK emits no `SendDebugMessage*` at all | **yes** `[source-derived]`, once enabled. See *Turning the engine log on* below |
| **Scan code of the injected modifier, as seen by the hook** | `0xFF` (`SCAN_FLAG_KEYMAN_KEY_EVENT`, from `keybd_shift_reset` and the release path) | `0` — the OSK passes `bScan = 0` on every call | **yes for five of the six, and the practical replacement for `KL.Log` in the field** `[source-derived]`. Logged with every key event by the low level hook. **Right Shift is the exception, and the signal is absent for it:** `do_keybd_event` overwrites `SCAN_FLAG_KEYMAN_KEY_EVENT` with `SCANCODE_RSHIFT`, because `0x36` is what tells the receiving app which Shift it was, so an injected Right Shift is byte-identical at the hook to a physical one. Second caveat: whether Windows propagates the OSK's `bScan = 0` rather than back-filling a scan code for `keybd_event` is unverified. Confirm once before relying on it |
| **`SendDebugMessageFormat` from the hook's modifier cache feed** | present: `"Modifier cache feed posted/failed/skipped [...]"`, distinguishing a successful post, a failed `PostMessage`, a `NULL` server window, and a Keyman-own event filtered out | absent — same as the row above | **yes** `[source-derived]`. Only on this branch: `348b59803f` had deleted the earlier, thinner version of this signal |
| **`SendDebugMessageFormat("verification: OS holds vkey=%s that the cache says nobody holds, correcting", …)`** | present only when the post-batch verification pass actually corrects a disagreement — the pass-through race, or a release that raced a batch in flight | absent — the OSK does not reach this code path | **yes, but rare by design** `[source-derived]`. Its *absence* is uninformative, since most batches never trigger a correction; its *presence* is strong evidence the serializer's residual race fired, which previously could not be told from a plain reconcile-clear. Only on this branch |
| **Which modifier is stuck** | any of the six | chirally constrained by `kbd.LRShift`: `VK_SHIFT` (to Left Shift) plus, when `LRShift`, the four chiral Ctrl/Alt VKs; when not, `VK_CONTROL`/`VK_MENU` (both to left). **`kbd.LRShift` does not always follow the keyboard** `[measured]`: `UpdateKeyboard` pins it `True` whenever the OSK has no visual keyboard loaded (`VKI=nil`), a state that does not self-heal, so an OSK can emit chiral VKs under a keyboard whose `.kvk` has no `<usealtgr/>` at all | **weak.** A wedged **Right Ctrl** does not point at the serializer: the OSK emits extended `VK_RCONTROL` directly, and `SetLRShift`'s chirality collapse can strand one even on hardware that has the key. Corroboration only, never alone |
| **Does closing the OSK clear it?** | no | **yes on this branch — every dismissal path, releasing the right chiral VK** | **yes** `[measured]`. Tray-menu dismiss, Character Map tab (`FormDestroy`) and the X button each emitted the matching KEYUP. The sharper question is not *whether* cleanup runs but *what* it releases — see the trap below |

### The trap: "closing the OSK didn't clear it" does not exculpate the OSK

Two separate things have to hold for a dismissal to clear a sticky modifier —
cleanup has to *run*, and it has to release the *right chiral VK* — and on a
released build neither does reliably.

**Reachability.** `ResetShiftStates` used to be reached only from
`TfrmVisualKeyboard.FormClose`, so only the X button and a tab switch ran
cleanup; the tray menu, tray double-click, `KMC_ONSCREENKEYBOARD` and Keyman
shutdown all bypassed it. On this branch `TfrmVisualKeyboard.FormDestroy` also
calls it (`UfrmVisualKeyboard.pas:620`), and `OnDestroy` fires on every teardown
path — `Release`, `FreeAndNil`, and the `caFree` that `FormClose` itself requests
— so every dismissal reaches cleanup at least once.

**Correctness.** Both release paths used to derive the VK from the *current*
`kbd.LRShift`, so after a `SetLRShift` collapse they released unextended
`vk=11` while the key actually held was extended `VK_RCONTROL`. On this branch
both read the identity that was injected. The decisive trace is a press of
`vk=A3 flags=1` under an AltGr keyboard, a keyboard switch collapsing `LRShift`
True→False, and a release that still goes out as `vk=A3 flags=3` while the
engine's own view already reads the generic `essCtrl`.

So if the user reports "I closed the OSK and it stayed stuck", ask **how** they
closed it and **whether they clicked the modifier off by hand first**. On a
released build a manual click-off can leave the wrong chiral VK stuck even
though the later dismissal correctly tears down whatever `FCachedShiftState`
still names — the click already emptied or mislabelled it.

Two states survive teardown on **every** build, this one included: a
`keyman.exe` killed or crashed while a sticky modifier is held
([MODIFIER-PRODUCERS.md](./MODIFIER-PRODUCERS.md) row `2c`, `UNMITIGATED`), and
an OSK whose `VKI` has gone nil, which pins `kbd.LRShift` True and can make the
whole chirality story read backwards.

The test:

1. Switch the OSK to the **Character Map tab** (`UpdatePanels` calls
   `ResetShiftStates`, `UfrmVisualKeyboard.pas:1522`), or
2. Close the OSK with its **own X button** (`MnuOSK_Close`), or
3. Dismiss it any other way (tray menu, tray double-click,
   `KMC_ONSCREENKEYBOARD`, Keyman quit) — all three measured releasing.

If any of these clears the modifier, it was the OSK.

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
3. Ask which build they are on, how the OSK was last dismissed, and whether they
   clicked the stuck modifier off by hand before dismissing. Also ask whether
   `keyman.exe` was killed, crashed, or restarted while the OSK was open — row
   `2c` is unmitigated on every build.
4. If the OSK is open: switch it to the Character Map tab, or dismiss it any
   other way. If the modifier clears, it was the OSK — path 2a or 2b. If it does
   not clear, do not conclude "not the OSK" without also checking step 3.
5. Otherwise enable the engine log, reproduce, and read the scan code of the
   phantom KEYDOWN: `0xFF` means the serializer, `0` means the OSK. If you can
   rebuild, a `keyman.exe` compiled with `{$DEFINE KLOGGING}` is the better
   instrument for anything OSK-shaped — it prints the injected
   `vk`/`scan`/`flags` directly. It sees `keyman.exe` only; `keyman32.dll`'s
   injections are not in that capture.
6. Look for `"cache says held but OS says up, clearing vkey=…"`. Present means
   the serializer's reconcile is running and doing its job. Also look for
   `"verification: OS holds vkey=... correcting"` — present means the post-batch
   verification pass caught the OS still holding a modifier the cache had
   already cleared, which is a distinct, narrower signal than the reconcile
   line.
7. Recover with the sweep in [README.md](./README.md).

## If it is the serializer path after all

That is the path the #8064 fix owns, and it is pinned by
`PREPARE_INJECTED_INPUT_BATCH.*` and
`PREPARE_MODIFIER_VERIFICATION_CORRECTION.*` in
`windows/src/engine/keyman32/tests/keybd_shift.tests.cpp` — those go red if the
reconcile or the verification pass is removed. So a genuine serializer-path
recurrence means a case neither test class models. Capture the scan code, the
modifier, and the log line — including whether the
`"verification: OS holds vkey=..."` line fired — and add the case before
changing any code.
