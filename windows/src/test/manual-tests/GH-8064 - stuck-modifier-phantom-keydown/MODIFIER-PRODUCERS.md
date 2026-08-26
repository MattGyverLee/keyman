# Every production path that can emit a modifier KEYDOWN

Companion to [README.md](./README.md) and [TRIAGE.md](./TRIAGE.md), for
[#8064](https://github.com/keymanapp/keyman/issues/8064).

The #8064 fix stops *one* path from emitting a modifier KEYDOWN with no matching
KEYUP. This file answers the question that makes "prevention is complete" a
finding rather than an assumption: **is that the only path, and is every other
one mitigated?**

A path is dangerous only if it can leave a modifier asserted machine-wide with no
queued release. An unmatched **KEYUP** is harmless — it asserts nothing.

## Verdicts

- `mitigated` — can emit an unmatched KEYDOWN, but something reliably clears it.
- `cannot latch` — structurally incapable, by something in the code and not by
  the absence of a bug report.
- `UNMITIGATED` — can strand a modifier. Must carry an issue number.

**FR-011 is not yet satisfied.** Three rows are `UNMITIGATED`. Issues are drafted
and awaiting filing; each `#____` below is a placeholder to be replaced with the
real number. Until then this work must not be described as completing prevention.

| # | path | emits | mitigation | verdict | evidence |
|---|---|---|---|---|---|
| 1 | serializer batch restore — `keybd_shift_reset` (`keyman32/keybd_shift.cpp:177-193`), called from `PrepareInjectedInputBatch` (`:371`), emitted by `SendInput` (`serialkeyeventserver.cpp:390`) | modifier KEYDOWNs from the cache, no queued KEYUP (`keybd_shift.cpp:184`) | `ReconcileModifierCache` (`keybd_shift.cpp:250`) called at `:337`; `ComputeModifierReleaseState` (`:290`) called at `:343` | **mitigated** | `:337` runs before `:371`, so the cache is a subset of live OS state when the restore loop reads it. The restore half is handed `kbd`, never `releaseState` (`:366-370`). Pinned by `PREPARE_INJECTED_INPUT_BATCH.*` in `keyman32/tests/keybd_shift.tests.cpp`, which go red if the reconcile call is deleted |
| 2a | **OSK sticky modifier click** — `kbdShiftChange` (`viskbd/UfrmOSKOnScreenKeyboard.pas:198`) then `ShiftStateChange` (`:293`) then `PrepState` (`:299`) then `do_keybd_event` (`:117-121`) | a real chiral modifier KEYDOWN with **no KEYUP anywhere in the call** — `ShiftStateChange` invokes only `PrepState`, never `FinalState` (`:303`). Deliberate: a sticky OSK modifier is *meant* to be real machine-wide | `FormClose` then `ResetShiftStates` (`UfrmVisualKeyboard.pas:297-301`, `:608-612`); `UpdatePanels` then `ResetShiftStates` (`:1527`); `tmrCheckTimer` (`UfrmOSKOnScreenKeyboard.pas:360-367`); #12611 forced LSHIFT KEYUP (`:277-287`) | **UNMITIGATED** — issue drafted, pending filing (`#____`). Provisional fix landed, **untested** — see [Provisional fix](#provisional-fix). [Finding 1](#finding-1) | `FormClose` fires only on `TCustomForm.Close`, i.e. the OSK's own X button. The tray menu, tray double-click, `KMC_ONSCREENKEYBOARD` and Keyman shutdown all reach `frmVisualKeyboard.Release` (`UfrmKeyman7Main.pas:1763`) or `FreeAndNil(frmVisualKeyboard)` (`:561`) instead, neither of which raises `OnClose`. `tmrCheckTimer` cannot clear it. The set includes `VK_RCONTROL` with `KEYEVENTF_EXTENDEDKEY` |
| 2b | **OSK `ResetShiftStates` itself** — `UfrmOSKOnScreenKeyboard.pas:356` | a bare modifier KEYDOWN, on the *cleanup* path | none; this *is* the cleanup | **UNMITIGATED** (50 ms race) — issue drafted, pending filing (`#____`). Provisional fix landed, **untested** — see [Provisional fix](#provisional-fix). [Finding 2](#finding-2) | `PrepState` emits a KEYDOWN when `shift in fkcss` and `not (shift in ass)`. A modifier-off click mutates `kbd.ShiftState` without touching `FShiftState`; until the next 50 ms tick equalises them, `ResetShiftStates` presses a modifier the user is no longer holding |
| 3 | language-switch shift release — `keyman32/kmhook_keyboard.cpp:147` | `keybd_event(VK_SHIFT, 0xFF, KEYEVENTF_KEYUP, 0)` | none needed | **cannot latch** | `KEYEVENTF_KEYUP` is a literal in the only call in the file. An unmatched KEYUP asserts nothing |
| 4 | Caps Lock sync — `keyman32/kmprocessactions.cpp:101-102` | `VK_CAPITAL` down then up | adjacency | **cannot latch** | Both statements unconditional and adjacent inside one `if` (`:99`); no return or call between them, and `keybd_event` is `void WINAPI` so cannot throw. Also outside the managed six |
| 5 | `PostDummyKeyEvent` — `keyman32/keyman32.cpp:923-926` | prefix VK down then up | adjacency | **cannot latch** | Same structure. `Globals::get_vk_prefix()` is registry-overridable (`k32_globals.cpp:378`) and could in principle be a modifier VK, but the pair stays balanced either way |
| 6 | user-event re-injection — `keyman32/serialkeyeventserver.cpp:540-560` and `:503-539`; cache at `UpdateLocalModifierState` (`:574-602`) | mirrors the user's own event | the mirror itself | **cannot latch** | `dwFlags = lParam & 0xFFFF` (`:547`), and `lParam` comes from `LLKHFFlagstoWMKeymanKeyEventFlags` (`k32_lowlevelkeyboardhook.cpp:83-87`), which sets `KEYEVENTF_KEYUP` iff `LLKHF_UP`. Direction is the user's direction, structurally |
| 7 | AltGr Left Ctrl simulation — `serialkeyeventserver.cpp:467`, `:503-509`, `SendInput` `:522` | two **releases** | none needed | **cannot latch** | `KEYEVENTF_KEYUP` literal at `:509`; the branch condition at `:467` requires `KEYEVENTF_KEYUP` in `lParam`. Both events are releases by construction |
| 8 | `AIWin2000Unicode::PostKeys` — `keyman32/appint/aiWin2000Unicode.cpp:138-153`, signalled at `:235` | `QIT_VKEYDOWN` writes a KEYDOWN whose KEYUP exists only if a separate `QIT_VKEYUP` follows; VK is `Queue[n].dwData & 0xFF` | the sole producer queues a balanced pair (`kmprocess.cpp:181-182`) | **UNMITIGATED** (contrived) — issue drafted, pending filing (`#____`). No fix attempted. [Finding 3](#finding-3) | Three unguarded truncation points can split the pair: `QueueAction` returns FALSE at `MAXACTIONQUEUE` and the result is ignored (`appint.cpp:51-57`, `kmprocess.cpp:181-182`); `SignalServer` silently clamps to 256 (`serialkeyeventclient.cpp:87-90`); the output-key copy stops at 248 (`keybd_shift.cpp:353`) with nothing preventing a pair straddling the bound |
| — | `USendInputString` — `global/delphi/general/USendInputString.pas:60` | `KEYEVENTF_UNICODE` with `ki.wVk := 0` always (`:41`, `:50`) | n/a | **cannot latch** | Cannot express a modifier VK at all |

### Out of scope, listed so the enumeration is visibly complete rather than silently partial

Not shipped production code, so excluded by definition — but named, because "we
checked and excluded these" and "we did not look" are different claims:

`test/manual-tests/regressiontest/UfrmRegressionTests.pas:613-630`,
`.../UfrmRegressionTestsWaitForIdle.pas:74`,
`test/manual-tests/test_i1940/UfrmPumpKeys.pas:68-112`,
`test/manual-tests/GH-140 - shift states/ShiftStateMap.pas:138`,
`test/manual-tests/test_i3035.../UfrmSendInputTest.pas:91,124`,
`test/manual-tests/test_i3358.../UfrmMediaKeysMain.pas:37`,
`test/manual-tests/test_i4793/test_i4793.pas:101`,
`test/manual-tests/test_i5394.../ui5394.pas:64`,
`support/sendinputtimer/UfrmSendInputTimer.pas:81` (support tool, not in
`support/build.sh`'s target list, and emits `VK_BACK` pairs only),
`engine/keyman32/tests/keybd_shift.tests.cpp` (gtest).

Two more excluded on structural grounds rather than location:

- `engine/testhost/testhost.cpp:258` posts `WM_KEYDOWN` to its own edit control.
  A posted window message cannot alter global key state.
- `aiWin2000Unicode.cpp:156-164` calls `SetKeyboardState`, which only clears, and
  only in the calling thread's processed state. Cannot latch machine-wide.

A grep for `PostMessage`/`SendMessage` of `WM_KEYDOWN`/`WM_SYSKEYDOWN` across
`windows/src` and `common/windows` returns exactly one hit, the `testhost.cpp`
line above. No Delphi production code posts synthetic key messages.

---

## Findings

<a name="finding-1"></a>

### Finding 1 — the OSK can strand a modifier, including Right Control

**Why `tmrCheckTimer` is not a mitigation for this.** It runs every 50 ms
(`UfrmOSKOnScreenKeyboard.dfm:37-42`; no `Enabled` property, so it defaults on,
and nothing in the tree ever writes `tmrCheck.Enabled`). But it reconciles the
OSK's *cache* **toward** the OS, never the reverse:

```pascal
392    FShiftState := FNewShiftState;      // absorb live state unconditionally
393    kbd.ShiftState := FShiftState;
```

A key event is emitted only when `FChanged` is set, and `FChanged` is set only in
the both-chiral-Alt (`:377`) and both-chiral-Ctrl (`:383`) collapse. For a single
stuck modifier the timer emits nothing — and once `FShiftState` has absorbed the
stuck bit, the guard at `:362` (`if GetAsyncShiftState <> FShiftState`) means the
handler stops doing anything at all. Cache and OS agree, forever. **The timer
cannot clear a modifier the OS agrees is down, which is exactly this failure
mode.**

**Why the cleanup does not run.** `ResetShiftStates` is reached from
`TfrmVisualKeyboard.FormClose` (`UfrmVisualKeyboard.pas:297-301`), which fires
only on `TCustomForm.Close` — the OSK's own X button (`MnuOSK_Close`, `:1399`).
Every other way of dismissing the OSK frees the form without raising `OnClose`:

| dismissal | code path | reaches `ResetShiftStates`? |
|---|---|---|
| the OSK's own X button | `MnuOSK_Close` then `Close` then `FormClose` | **yes** |
| switching the OSK to another tab | `UpdatePanels` (`UfrmVisualKeyboard.pas:1527`) | **yes** |
| tray menu OSK toggle | `UfrmKeyman7Main.pas:1714` then `HideVisualKeyboard` then `Release` (`:1763`) | no |
| tray icon double-click | `:1143` then same | no |
| `KMC_ONSCREENKEYBOARD` from another process | `:801` then same | no |
| `KMC_HideVisualKeyboard` | `:1283` then same | no |
| Keyman shutdown | `FormDestroy` then `FreeAndNil(frmVisualKeyboard)` (`:561`) | no |

`Release` posts `CM_RELEASE`, whose handler calls `Free`; `Free` runs `OnDestroy`,
never `OnClose`. `TfrmVisualKeyboard.FormDestroy` (`:620-632`) does not reset
shift states. Once the form is freed, `tmrCheck` is gone with it, so nothing left
in the process can release the modifier.

**Right Control is reachable, which is what makes this the #8064 signature.**
`PrepState` sets `KEYEVENTF_EXTENDEDKEY` for `VK_RCONTROL` and `VK_RMENU`
(`:299`), and chiral emission is the common case: `kbd.LRShift := True`
unconditionally when there is no visual keyboard (`:489`), otherwise from the
AltGr flag (`:496`). Clicking **R Ctrl** on the OSK therefore asserts a real
extended `VK_RCONTROL`. On a keyboard with no Right Ctrl key the matching KEYUP
is unproducible.

There is also a route that strands Right Control **on hardware that has the
key**. `SetLRShift` (`common/windows/delphi/components/OnScreenKeyboard.pas:885-937`) collapses chirality
when `LRShift` goes False, rewriting `FShiftState - [essLCtrl, essRCtrl] +
[essCtrl]` (`:915`). So: click R Ctrl on an AltGr visual keyboard, then select a
non-AltGr one. The model now says `essCtrl`, and every later release goes out as
`VK_CONTROL`, i.e. Left Control (`:324`). The real Right Control is never
released, and `GetAsyncShiftState`'s non-`LRShift` branch reads
`GetAsyncKeyState(VK_CONTROL)` (`:447`), true for either side, so the OSK keeps
believing Ctrl is down and keeps releasing the wrong one. *Inferred from the two
code paths; not yet observed.*

**Minimal reproduction to confirm at runtime:** open the OSK, click **R Ctrl**,
close the OSK **from the tray menu** (not its X button), then read
`GetAsyncKeyState(0xA3)`.

<a name="finding-2"></a>

### Finding 2 — the OSK's cleanup routine is itself a producer

`ResetShiftStates` calls
`ShiftStateChange(FShiftState - FCachedShiftState, kbd.ShiftState)` (`:356`), and
`ShiftStateChange` only ever calls `PrepState`, which **emits a KEYDOWN** when a
modifier is in the first set and not the second. `UpdateShiftStates:393` normally
keeps the two equal, but a modifier-off click mutates `kbd.ShiftState` and
`FCachedShiftState` without touching `FShiftState`. In the window before the next
50 ms tick, the cleanup path presses a modifier the user is no longer holding.
Chiral, so it can be Right Control.

<a name="finding-3"></a>

### Finding 3 — `PostKeys` pair-splitting, contrived but not impossible

`QIT_VKEYDOWN` (`aiWin2000Unicode.cpp:138-153`) emits a KEYDOWN for an
unconstrained VK. Its only production producer queues a balanced pair
(`kmprocess.cpp:181-182`), and `calldll.cpp:126-135` refuses any VK that is not
the current key — but three separate truncation points can drop the KEYUP half,
and none checks or reports it.

Reachability is narrow. `aiTIP.cpp:186-202` returns early for `VK_MENU` and
`VK_CONTROL` before `_td->state.vkey` is assigned at `:215`, but **`VK_SHIFT`
falls through** (`:200-202`, no `return`). So the emission is `VK_SHIFT` in
practice, which maps to Left Shift — releasable on every keyboard, and therefore
not the unproducible-KEYUP shape. It is recorded as `UNMITIGATED` rather than
`cannot latch` because the pair-splitting is genuinely unguarded, not because a
latch has been observed.

**Source alone cannot settle** whether the required conditions are co-reachable:
a legacy/ANSI target, `use(final)`, 248 or more output events, and `VK_SHIFT`. The
runtime observation that would settle it: with `debug=1`, drive such a target with
a keyboard whose Shift rule outputs 250 or more characters and look for
`"Too many INPUT events for queue"` (`serialkeyeventclient.cpp:88`) immediately
followed by a `VK_SHIFT` down with no matching up.

---

## FR-012a — a recurrence is triaged, not assumed to be a regression

**#8064's original repro was contrived, not observed.** There is no evidence that
the field reports which opened the issue came from path 1 at all. Given Finding 1,
the OSK is a live candidate for at least some of them: it produces exactly the
reported symptom, including the unclearable Right Control case.

So a stuck modifier reported after this fix ships must be triaged through
[TRIAGE.md](./TRIAGE.md) before anyone concludes the fix regressed.

## Status of this enumeration

Paths 1 and 3 to 8 were settled from source. Paths 2a, 2b and the `SetLRShift`
chirality route were settled from source and **have not yet been confirmed at
runtime**; each carries its minimal reproduction above. Runtime confirmation is
owed, and no row's verdict should be strengthened on the basis of a null result
from an unvalidated stimulus.

---

<a name="provisional-fix"></a>

## Provisional fix for Findings 1 and 2 — **not compiled, not tested**

Delphi is not installed on the machine this audit was performed on, so the two
changes below **have never been compiled or run**. They are recorded here, and
landed in a separate commit, so they can be reviewed on a machine with Delphi or
dropped wholesale. Treat them as a reviewed proposal, not as a fix.

**Finding 1** — `TfrmVisualKeyboard.FormDestroy`
(`windows/src/engine/keyman/viskbd/UfrmVisualKeyboard.pas`) now calls
`ResetShiftStates` before `FreeAndNil(FOnScreenKeyboard)`. `OnDestroy` fires on
every destruction path, including the `caFree` that `FormClose` requests, so it is
the one place that covers `Release` and `FreeAndNil` as well as `Close`.

**Finding 2** — `TfrmOSKOnScreenKeyboard.ResetShiftStates`
(`.../UfrmOSKOnScreenKeyboard.pas`) now computes
`FRemaining := kbd.ShiftState - FCachedShiftState` and passes that as
`ShiftStateChange`'s first argument. Because `FRemaining` is a subset of
`kbd.ShiftState`, `PrepState`'s press branch is unreachable **by construction**
rather than by timing, while its release branch still fires for exactly the
clicked set — so I2177's intent is preserved. Assigning `kbd.ShiftState :=
FRemaining` afterwards makes the routine idempotent, which is what allows Finding
1's fix to reach it twice on the X-button path.

**What these two do not fix:** the `SetLRShift` chirality collapse (Finding 1, second
half) strands the modifier while the OSK is still open, so neither change touches
it. It needs its own fix.

**Verification owed before this can be believed:**

1. It compiles.
2. Open the OSK, click **R Ctrl**, dismiss from the **tray menu**, confirm
   `GetAsyncKeyState(0xA3)` is now clear where it previously was not.
3. Click a modifier **on** then **off**, then dismiss within 50 ms, and confirm no
   modifier is left asserted.
4. Close via the OSK's **own X button** and confirm the doubled
   `ResetShiftStates` emits nothing the second time.
5. The OSK still works normally: sticky modifiers still apply to the next clicked
   key, and physically-held modifiers are still not released by a tab switch.
