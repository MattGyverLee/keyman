# Triage: which path stuck this modifier?

For [#8064](https://github.com/keymanapp/keyman/issues/8064). Companion to
[README.md](./README.md), [MODIFIER-PRODUCERS.md](./MODIFIER-PRODUCERS.md),
[JUSTIFICATION.md](./JUSTIFICATION.md) and [TIMELINE.md](./TIMELINE.md).

A user reports a modifier stuck down machine-wide. **Do not assume it is a
regression of the #8064 fix.** #8064's own repro was contrived, and the on-screen
keyboard can produce the identical symptom, including the unclearable Right
Control case that is the worst field report. This file tells the two apart.
**And before either: check that the modifier is stuck at all.** A modifier that
went *dead* while the user was holding it is the opposite failure and draws the
same sentence out of a user; see *Two opposite failures* below first.

**Triage against the build the user has, not against this tree.** The OSK
behaves differently on a released build than on this branch, and several rows
below turn on that difference:

| | released builds, including 18.0.249 | this branch |
|---|---|---|
| does any OSK dismissal run cleanup? | only the X button and a tab switch | every path |
| does cleanup release the right chiral VK? | no — by the current `kbd.LRShift` regime | yes — by the identity that was injected |
| does a manual click-off release the right chiral VK? | no | yes |
| `keyman.exe` killed while a sticky modifier is held | stranded | stranded |

**How far to trust each row.** `[measured]` verdicts come from an executed wedge,
now on both sides:

- **OSK**, 2026-08-27, a `KLOGGING` build of `keyman.exe` —
  [`evidence/run-osk-teardown-2026-08-27.txt`](evidence/run-osk-teardown-2026-08-27.txt)
  and
  [`evidence/run-osk-clickoff-2026-08-27.txt`](evidence/run-osk-clickoff-2026-08-27.txt).
- **serializer**, 2026-08-28, `host32.exe --probe 1x2x3x --iterations 5` with the
  engine log on —
  [`evidence/serializer-signals-2026-08-28.md`](evidence/serializer-signals-2026-08-28.md)
  and
  [`evidence/path6-cannot-latch-2026-08-28.md`](evidence/path6-cannot-latch-2026-08-28.md),
  cited lines in
  [`evidence/dbgview-excerpt-2026-08-28.txt`](evidence/dbgview-excerpt-2026-08-28.txt).

`[source-derived]` verdicts are what the source predicts, with nothing yet checked
against a real occurrence. Until 2026-08-28 that was the standing of every
serializer-side row; four of them are now measured and the remainder say why not.

**Read the two warnings before you run anything.** *Turning the engine log on* below
carries both, and they cost a day between them: enabling the log can **stop the
defect reproducing**, and a signal looked for in the wrong function reads exactly
like a signal that is not there.

## Two opposite failures: stuck down, or dead while held

**Everything else in this file is about a modifier stuck *down*.** There is a
second failure with the opposite mechanism and the *same* user sentence — "my
Ctrl key is broken" — and if you do not sort them first, every report of one gets
triaged as the other. Sort before you run the oracle: the oracle answers the
stuck question and is silent on the other.

- **STUCK** — a phantom KEYDOWN. A modifier the user is **not** holding behaves
  as though held, so every keystroke becomes a chord. This is #8064.
- **DEAD WHILE HELD** — a dropped hold. A modifier the user **is** holding stops
  taking effect part way through, because the batch released it and did not press
  it back.

| | **STUCK** — phantom KEYDOWN | **DEAD WHILE HELD** — dropped hold |
|---|---|---|
| what the user says | "my keyboard types nothing", "everything is a shortcut" | "my Ctrl stopped working", "shift stopped capitalising" |
| what the user was doing at the moment it failed | **not touching** the modifier | **holding** the modifier, and typing through it |
| mechanism | the cache retained a byte for a modifier whose KEYUP was dropped, and the restore half pressed it for real via `SendInput` — latched machine-wide | the release half reads **live** state (`keybd_shift.cpp:422`), the restore half reads the **cache** (`keybd_shift.cpp:438`). A modifier the OS reports held that the cache does not claim is released and never pressed back |
| does releasing and re-pressing the key fix it? | yes | yes, immediately and permanently — the next real event re-feeds the cache |
| with **no** further input at all | persists; it stays asserted machine-wide until something releases it | nothing more happens. It takes a batch to drop a hold, so no output means no failure |
| does it recur? | only if the wedge happens again | not within the same physical press — see *once per press* below. A fresh press in the same window is dropped again |
| worst case | on hardware with no physical Right Ctrl the user may be unable to clear it at all, and a restart is the only route | none. The key works on the very next press |
| log line | **none.** Nothing is emitted when the cache retains a byte | `#8064 dropped hold:`, naming the VK |
| full scoring | row `1` of [MODIFIER-PRODUCERS.md](./MODIFIER-PRODUCERS.md) | the release-half half of that same row `1`, and `1b` for the pass-through variant |

**Recovery is not on its own a discriminator.** Press-and-release clears *both*,
so "I pressed Ctrl again and it came good" tells you nothing about which one you
have. Use it only alongside rows 2 and 3 above.

**Once per press, and this is the useful behavioural discriminator.** The release
half's own KEYUP goes out through `SendInput`, so the live state then reads *up*
even while the user's finger is still down. The condition at
`keybd_shift.cpp:411` — live held, cache not claiming — therefore cannot fire a
second time for the same physical press, and the modifier stays dead until the
user lets go and presses again. A stuck modifier, by contrast, needs no input at
all to keep being wrong.

### The log lines, which are the only unambiguous discriminator

New on this branch, and the reason this section can be more than a guess. Two
codes, `ModifierDiagnosticCode` (`serialkeyeventcommon.h:132-163`), rendered by
`ReportModifierDiagnostic` (`serialkeyeventserver.cpp:53-75`), bound to the batch
at `serialkeyeventserver.cpp:466-469`. Both reach a debug/ETW trace through
`SendDebugMessageFormat` (`keymanengine.h:180`), so *Turning the engine log on*
below applies in full, warning box included.

**Grep for `#8064 `** — one string catches both, and the fallback line for an
unknown code. The two literals, exactly as they stand in the source:

- `#8064 dropped hold: released vkey=%s that the OS reports held and the cache does not claim, so the restore half will not press it back. Expect the user to report this modifier dead until they press it again`
  (`serialkeyeventserver.cpp:58-62`, code `ReleasedWithoutCacheClaim`).
  **This line means dead-while-held, and it names the key.** Emitted once per
  such VK from `keybd_shift.cpp:409-415`, and only when the feed is configured —
  with the feed off both halves read the same `kbd` and the condition cannot
  arise.
- `#8064 possible desktop switch: every managed modifier reads up live while the cache claimed two or more held. The reconcile is clearing them and the restore half will press nothing, so those holds are lost. The 'clearing vkey=' lines that follow name them`
  (`serialkeyeventserver.cpp:65-69`, code `PossibleDesktopSwitch`). Emitted once
  per cache-claimed VK when all six managed modifiers read up live and the cache
  claims **two or more** (`keybd_shift.cpp:364-384`, threshold at `:374`). Two or
  more, never one: exactly one modifier held at launch and released before the
  feed was live is the ordinary launch-seed case, and firing there would cry wolf
  on every session. It is not itself either signature. It says the cache went
  stale in the shape a secure desktop or a console leaves, which is the
  precondition for dead-while-held — and which on a released build is where the
  restore half would instead have pressed those modifiers for real.

`%s` is `Debug_VirtualKey` (`k32_dbg.cpp:256-263`), so each line names the VK in
the same `['<name>' 0x<vk>]` form as every other line in the log.

**Read the asymmetry exactly.** Presence of `#8064 dropped hold:` rules
dead-while-held **in**. Absence rules **nothing** out in either direction: the
stuck signature emits no line at all — nothing is logged when the cache merely
retains a byte — and on a released build neither code exists in the binary.
Everything in *An absent log line is not proof of an absent event* below applies
here too.

The behaviour is pinned by the `MODIFIER_DIAGNOSTIC` fixture in
`windows/src/engine/keyman32/tests/keybd_shift.tests.cpp:1916-2056`, including
the feed-off case and the one-modifier launch-seed case that must **not** report.

### Where a dead-while-held window exists

It needs a KEYDOWN the cache feed never saw. The feed post
(`k32_lowlevelkeyboardhook.cpp:199-222`) sits **ahead** of the pass-through check
(`:253-260`), the touch-panel check (`:263-266`) and the console check (`:278`),
deliberately, so modifiers stay tracked with no Keyman keyboard active (comment
at `:195-198`). So focus alone — a console, mstsc, no active keyboard — does
*not* by itself blind the feed. What does:

- **The hook was not running.** The secure desktop, UAC, the lock screen. The
  hook's own `#5190` note at `:153-154` says modifier change events are sometimes
  not received there. Nothing in-process can see a KEYDOWN it was never given.
- **The feed was configured but dead.** `flag_ShouldSerializeInput` reads TRUE in
  at least three same-process ways while nothing arrives: `InitHooks()`'s return
  value discarded (`keyman32.cpp:279`, `:401`), `FSingleApp=TRUE` making the
  global-only install structurally fail (`keyman32.cpp:367`), and Windows' silent
  hook removal at 200 ms, unnoticed until a later keystroke sees a >= 1000 ms gap
  (`LowLevelHookWatchDog.cpp`). Enumerated at `serialkeyeventcommon.h:165-172`.
- **The post did not land.** Both failures are logged, so both are greppable:
  `Modifier cache feed skipped, no serializer window` and
  `Modifier cache feed failed` (`k32_lowlevelkeyboardhook.cpp:213`, `:215`).
- **The launch seed.** A modifier already held when the feed came up was never
  fed a KEYDOWN for it.

### Do not escalate dead-while-held as a regression

It is a deliberate accepted cost, not a defect to file. Both alternatives are
worse, and both are refuted in the spec:

- Release on the **cache** alone, and a modifier the OS holds that the cache does
  not know about survives the batch — reopening silent text destruction, of which
  Ctrl+Backspace eating a word is the cheap example.
- Restore from **live** state, and a modifier the user let go of mid-batch is
  pressed back with no queued release — which is #8064's unmatched KEYDOWN, from
  a third direction.

Losing a hold is the accepted direction; manufacturing a press is never one
(`keybd_shift.cpp:391-398`, `:401-406`). What FR-002 and FR-006 change is only
that the drop stops being silent. The full scoring is in row `1` of
[MODIFIER-PRODUCERS.md](./MODIFIER-PRODUCERS.md); read it there rather than
re-deriving it here.

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
| **`SendDebugMessageFormat` from `keybd_shift`, and `"cache says held but OS says up, clearing vkey=…"`** | present, naming the exact VK | absent — the OSK emits no `SendDebugMessage*` at all | **yes** `[measured]`, once enabled. 4 lines on the branch, 0 on the shipped build, each naming `['?LShift' 0xa0]` — the exact wedged VK — about 8 s after the phantom press. See *Turning the engine log on* below |
| **Scan code of the injected modifier, as seen by the hook** | `0xFF` (`SCAN_FLAG_KEYMAN_KEY_EVENT`, from `keybd_shift_reset` and the release path) | `0` — the OSK passes `bScan = 0` on every call | **yes for five of the six, and the practical replacement for `KL.Log` in the field** `[source-derived]`. Logged with every key event by the low level hook. **Right Shift is the exception, and the signal is absent for it:** `do_keybd_event` overwrites `SCAN_FLAG_KEYMAN_KEY_EVENT` with `SCANCODE_RSHIFT`, because `0x36` is what tells the receiving app which Shift it was, so an injected Right Shift is byte-identical at the hook to a physical one. Second caveat, now **half-answered** `[measured]`: Windows *can* propagate `bScan = 0` untouched — the recovery sweep's `keybd_event(vk, 0, KEYEVENTF_KEYUP, 0)` arrived with scan `0` for `a0`/`a2`/`a4` in the 2026-08-28 capture — but it does not always, since other sweep-shaped events in the same run carried real scan codes. So read the signal one way only: **`scan == 0` means a `bScan = 0` injector, which on a released build means the OSK; `scan != 0` exculpates nobody.** |
| **`SendDebugMessageFormat` from the hook's modifier cache feed** | present: `"Modifier cache feed posted/failed/skipped [...]"`, distinguishing a successful post, a failed `PostMessage`, a `NULL` server window, and a Keyman-own event filtered out | absent — same as the row above | **yes** `[measured]`. 17 posts on the branch, 0 on the shipped build; every one carried `isUp` and a chiral `vkCode`, and all 17 matched the serializer's own view of the same event one-to-one. Only on this branch: `348b59803f` had deleted the earlier, thinner version of this signal |
| **`SendDebugMessageFormat("verification: OS holds vkey=%s that the cache says nobody holds, correcting", …)`** | present only when the post-batch verification pass actually corrects a disagreement — the pass-through race, or a release that raced a batch in flight | absent — the OSK does not reach this code path | **yes, but rare by design** `[source-derived, rare by design]`. **Looked for and not found**: 0 lines in 5 logged iterations, alongside 4 reconcile-clears in the same run — which is the expected shape, not a failure to fire. Its *absence* is uninformative, since most batches never trigger a correction; its *presence* is strong evidence the serializer's residual race fired, which previously could not be told from a plain reconcile-clear. Only on this branch |
| **`SerialKeyEventServer::WndProc` — `hwnd=… msg=… wParam=… lParam=… m_ModifierKeyboardState=[LS:… LC:… LA:… RS:… RC:… RA:…]`** | present, one line per key or modifier event reaching the re-injection, printing the VK, the flags word, **and the modifier cache itself** | absent — the OSK never reaches the serializer | **yes, and it is the one serializer-side signal a released build has** `[measured]`. `serialkeyeventserver.cpp:469` on this branch, `:442` on `origin/master` — so it works on the build the user actually has, unlike every other row in this table. 92 passes in the shipped capture, 59 in the branch one. **Read `m_ModifierKeyboardState` directly:** a byte stuck at `80` across many consecutive events, with no matching KEYUP for it in the same log, *is* the wedge. x86 only (`serialkeyeventserver.cpp` is `#ifndef _WIN64`) |
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

**Do not use a Keyman-only restart as a test. It is unmeasured, and it is
actively confusable.** Nothing here turns on the answer and nothing should: the
expectation is that a restart clears neither an OSK-stranded modifier (row `2c` —
nothing is persisted, there is no restore-on-start reconciliation) nor a
serializer-stranded one (the cache dies with the process, but the OS still holds
the key the dead process pressed). The trap is that restarting `keyman.exe` *does*
recover the separate `VKI=nil` fault (`../kmrepro/TODO.md` I19), so a responder can
restart, watch something improve, and conclude the stuck modifier cleared having
measured a different fault entirely. Recorded, with the reasoning, in
[`evidence/path6-cannot-latch-2026-08-28.md`](evidence/path6-cannot-latch-2026-08-28.md)
*T072*.

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
The capture must be **process-wide**: `keyman32.dll` logs from inside every hooked
process, not just from `keyman.exe`.

The flags are read **once**, at `Keyman_Initialise` (`keyman32.cpp:347`), so
**Keyman must be restarted after arming them.** Arming them under a running Keyman
leaves `debug=FALSE` in `.SHARDATA` and the engine logs nothing — a silence
indistinguishable from a signal that did not fire.

> ### The log can stop the defect reproducing `[measured]`
>
> Same shipped build, same machine, same harness, one variable — the log:
>
> | run | engine log | wedged |
> |---|---|---|
> | A1 | off | **5/5** |
> | A2 | off | **5/5** |
> | A3 | **on** | **0/5** |
>
> 7362 `OutputDebugStringW` calls across five iterations add enough latency to
> close the race window
> ([`evidence/serializer-signals-2026-08-28.md`](evidence/serializer-signals-2026-08-28.md)
> Finding 1). Two consequences for a responder:
>
> - **A wedge that stops reproducing once you enable the log has not been
>   diagnosed.** It is the most likely outcome for a serializer-path wedge, and it
>   is not evidence about the fix in either direction.
> - If you need to establish *whether* it wedges, run **unlogged** and read
>   `GetAsyncKeyState`. The log is for finding out *which path*, on a wedge you can
>   already produce.

**An absent log line is not proof of an absent event.** Three separate ways it
lies:

- `ShouldDebug_1` and `Keyman_WriteDebugEvent2W` both bail out when
  `ThreadGlobals()` is NULL.
- Three of the rows above exist **only on this branch**. Absent on a released
  build means the code is not there, not that the event did not happen.
- **You may be looking in the wrong function.** Path 6 was recorded as
  "not loggable" on 2026-08-28 after reading `UpdateLocalModifierState`, which
  emits nothing — while the same captures already held 151 lines logging every
  pass through it, from the top of the enclosing `WndProc` 112 lines earlier
  ([`evidence/path6-cannot-latch-2026-08-28.md`](evidence/path6-cannot-latch-2026-08-28.md)
  Finding A). Check the callers before writing "absent".

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
5. Otherwise enable the engine log — **reading the warning box in
   *Turning the engine log on* first; the log can stop the wedge reproducing** —
   reproduce, and read the scan code of the phantom KEYDOWN: `0xFF` means the
   serializer, `0` means the OSK, and `scan != 0` on its own rules nothing out.
   If you can rebuild, a `keyman.exe` compiled with `{$DEFINE KLOGGING}` is the
   better instrument for anything OSK-shaped — it prints the injected
   `vk`/`scan`/`flags` directly. It sees `keyman.exe` only; `keyman32.dll`'s
   injections are not in that capture.

   **On a released build, go straight to `SerialKeyEventServer::WndProc`.** It is
   the only serializer-side signal a shipped build has, and it prints the modifier
   cache on every pass. A byte pinned at `80` across consecutive events, with no
   KEYUP for it anywhere in the log, is the wedge — no rebuild, no branch
   required. x86 only.
6. Look for `"cache says held but OS says up, clearing vkey=…"`. Present means
   the serializer's reconcile is running and doing its job — on the 2026-08-28
   branch capture it fired 4 times, each naming the wedged VK about 8 s after the
   phantom press, against 0 times on the shipped build. Also look for
   `"verification: OS holds vkey=... correcting"` — present means the post-batch
   verification pass caught the OS still holding a modifier the cache had
   already cleared, which is a distinct, narrower signal than the reconcile
   line. It did **not** fire in that run, which is its expected shape: it is rare
   by design and its absence tells you nothing.
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
