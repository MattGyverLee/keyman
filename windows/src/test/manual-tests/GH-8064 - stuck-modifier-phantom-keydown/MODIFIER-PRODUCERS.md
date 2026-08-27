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

**Verdict discipline, restated because it governs every edit below.** A row is
promoted to `mitigated` only when the fix is compiled, linked, and either
covered by a green automated test or confirmed by an executed manual
reproduction. A change that exists only as **uncompiled source**, or that rests
on a manual-test procedure that has **not been run**, does not clear that bar,
however sound the source-level reasoning looks.

**As of 2026-08-27 the Delphi fixes clear that bar.** They compile under Delphi
12.0 CE and the manual sequence has been executed and recorded in
[`evidence/run-osk-teardown-2026-08-27.txt`](evidence/run-osk-teardown-2026-08-27.txt).
The rule earned its keep in the process: the run found that the teardown fix had
reintroduced I2177, which every prior source read had missed.

`2a` and `2b` nonetheless remain `UNMITIGATED`, now for substantive reasons
rather than for want of a compiler — see their rows, and note that `2a`'s live
click-off half is not merely unfixed but **confirmed broken at runtime**.

**FR-011 is not yet satisfied.** Four rows are `UNMITIGATED`: `2a`, `2b`, `2c`
and `8`. A fifth open item — the live click-off chirality gap described under
[Finding 4](#finding-4) — has no row of its own because it is not itself a new
*producer* (its parent row is `2a`), but it needs its own issue and is listed
below. **What is still required before this work can honestly be described as
completing prevention:**

1. ~~A machine with Delphi to compile `UfrmOSKOnScreenKeyboard.pas`, and an
   execution of every scenario in the *Manual test sequence*.~~ **Done
   2026-08-27** — compiled under Delphi 12.0 CE, all nine steps executed, one
   defect found and fixed (`4ca0945a12`), results in
   [`evidence/run-osk-teardown-2026-08-27.txt`](evidence/run-osk-teardown-2026-08-27.txt).
   Whether that is sufficient to move `2a` and `2b` off `UNMITIGATED` is a
   verdict decision still to be taken; the compile-and-run precondition no
   longer blocks it.
2. A decision and, if accepted, an implementation for the live click-off
   chirality gap ([Finding 4](#finding-4)) — distinguishing a click-originated
   `ShiftStateChange` call from `UpdateShiftStates`' 50 ms resync call is a
   real design task, not a one-line fix, and it was deliberately not attempted
   under this pass's time and tooling constraints. **Now the highest-priority
   of the five**: it is confirmed broken at runtime, and on hardware without a
   physical Right Ctrl it leaves no in-session recovery at all — see
   [Issue 1](#issues-to-file).
3. A decision on `2c` (process termination while an OSK sticky modifier is
   held): either an accepted persisted-state-and-reconcile-at-startup design,
   a supervising watchdog, or an explicit acceptance that no in-process
   mitigation exists and the row closes only by filing and referencing the
   issue.
4. A decision on `8` (`PostKeys` pair-splitting): fix the three unguarded
   truncation points, or accept the contrived-but-real risk and close the row
   by filing the issue.
5. Filing the four issues drafted in [Issues to file](#issues-to-file) below,
   and replacing every `#____` placeholder with the real number.

Until all five are done, this work must not be described as completing
prevention.

| # | path | emits | mitigation | verdict | evidence |
|---|---|---|---|---|---|
| 1 | serializer batch restore — `keybd_shift_reset` (`keyman32/keybd_shift.cpp:171-187`), called from `PrepareInjectedInputBatch` (`:395`), emitted by `SendInput` (`serialkeyeventserver.cpp:377`) | modifier KEYDOWNs from the cache, no queued KEYUP (`keybd_shift.cpp:178`) | `ReconcileModifierCache` (`:275`) called at `:368`; `ComputeModifierReleaseState` (`:302`) called at `:373`; **new this pass:** `PrepareModifierVerificationCorrection` (`:459`), scheduled via the self-posted `WM_KEYMAN_VERIFY_MODIFIER_EVENT` (`serialkeyeventcommon.h`, handled in `SerialKeyEventServer::WndProc`) | **mitigated, measured for the original gap; the newly-closed residual is source-reasoned, not yet independently re-run against the live harness** | The reconcile runs before the restore loop, so a cache byte that was already stale when the batch began is cleared, and the restore half is handed `kbd`, never `releaseState`. Pinned by `PREPARE_INJECTED_INPUT_BATCH.*` in `keyman32/tests/keybd_shift.tests.cpp`. **Verified end to end on a live engine** for the original gap: `host32.exe --probe 1x2x3x --iterations 5` wedged Shift on 5 of 5 iterations against the shipped build and 0 of 5 against the fixed build. Reports in `evidence/`. **What was not mitigated as of that measurement**, and is addressed this pass: a byte the *same batch* makes stale. The `WM_KEYMAN_MODIFIER_EVENT` post at `k32_lowlevelkeyboardhook.cpp:202` feeds the cache from the user's own release before the pass-through check at `:257`, so if the user releases while a batch is in flight, the restore press can outlive that release — cache says up, OS says held, and `ReconcileModifierCache` cannot see it because cache and OS now *agree*. `PrepareModifierVerificationCorrection`, scheduled to run **behind** every already-queued `WM_KEYMAN_MODIFIER_EVENT` (posted-message FIFO ordering — see the comment on `WM_KEYMAN_VERIFY_MODIFIER_EVENT`), re-checks exactly the VKs the batch's restore half touched and injects a corrective KEYUP for any the OS still holds that the cache no longer claims. Pinned by `PREPARE_MODIFIER_VERIFICATION_CORRECTION.*`. Its own known residual is documented in its doc comment: a user re-press landing in the few milliseconds between the verify post and its dispatch is itself released — an unmatched KEYUP, which is the safe-direction error, not a repeat of #8064 |
| 1b | **the pass-through race** — mstsc/RDP (`hs->dwExtraInfo != 0`), the touch panel, console focus (`IsConsoleWindow`), or a `GetGUIThreadInfo` failure all route the user's own modifier event through `CallNextHookEx` (`k32_lowlevelkeyboardhook.cpp:257-306`) instead of Keyman's eat-and-reinject path, **while the earlier, unconditional `if (isModifierKey(hs->vkCode))` block at `:202` still feeds the cache** | the modifier is released natively, outside Keyman's control, while a batch's own restore press (possibly for the same VK, from an unrelated in-flight batch) can still land afterward | same `PrepareModifierVerificationCorrection` pass as row 1 — it does not care which mechanism produced the disagreement, only that cache says up and OS says held for a VK this batch's restore touched | **mitigated, same caveat as row 1: source-reasoned closure of a previously-open residual, not yet independently re-run** | This path was previously folded into row 1's evidence without being named; naming it separately because it is a distinct mechanism (native pass-through, not a race inside Keyman's own eat/reinject cycle) that happens to close under the same fix. Mechanism: `k32_lowlevelkeyboardhook.cpp:257` (`dwExtraInfo`/`SCAN_FLAG_KEYMAN_KEY_EVENT`/`VK_PROCESSKEY`/`VK_PACKET`/`!isKeymanKeyboardActive`), `:270` (touch panel), `:277-306` (`GetGUIThreadInfo` + `IsConsoleWindow`) |
| 2a | **OSK sticky modifier click** — `kbdShiftChange` (`viskbd/UfrmOSKOnScreenKeyboard.pas:221`) then `ShiftStateChange` (`:305`) then `PrepState` (`:320` block) then `do_keybd_event` (`OnScreenKeyboard.pas:117-121`) | a real chiral modifier KEYDOWN with **no KEYUP anywhere in the call** — `ShiftStateChange` invokes only `PrepState`, never `FinalState`. Deliberate: a sticky OSK modifier is *meant* to be real machine-wide | `TfrmVisualKeyboard.FormDestroy` → `ResetShiftStates` (committed, `cd2bd44dd0` — covers every dismissal path, not only `FormClose`); **fix this pass, now compiled and measured**: `ResetShiftStates` (`UfrmOSKOnScreenKeyboard.pas:364`) now releases by exact chiral identity from `FCachedShiftState`, gated on live `GetAsyncKeyState`, instead of routing through `ShiftStateChange`'s current-`kbd.LRShift` VK selection — see [Finding 1](#finding-1) and *Fix for Findings 1 and 4a* below | **UNMITIGATED** — issue drafted, pending filing (`#____`). Both fixes are now **compiled and measured** (2026-08-27) and both pass: the teardown-dismissal case (this row, [Finding 1](#finding-1)) and the stale-async restore race ([Finding 4a](#finding-4)) — the run also caught and fixed an I2177 regression in the former (`4ca0945a12`). The row stays open for the third gap in the same family, the **live click-off** case, which is deliberately unfixed and now **confirmed broken at runtime** (step 8) — see [Finding 4b](#finding-4) | `cd2bd44dd0` makes every dismissal path (tray menu, tray double-click, `KMC_ONSCREENKEYBOARD`, Keyman shutdown, the OSK's own X button) reach `ResetShiftStates`, closing the *reachability* gap this row's evidence used to describe. What remains open is *correctness at the point ResetShiftStates runs* (chirality) and a case `ResetShiftStates` never runs for at all (a live click-off) — see Findings below |
| 2b | **OSK `ResetShiftStates` itself** — `UfrmOSKOnScreenKeyboard.pas:364` | previously: a bare modifier KEYDOWN on the cleanup path, from a stale `FShiftState`/`kbd.ShiftState` mismatch inside the 50 ms window. **The rewritten `ResetShiftStates` has no press branch left at all** — `ReleaseCached` only ever calls `do_keybd_event` with `KEYEVENTF_KEYUP` baked into its flags, so this specific failure mode is structurally impossible in the new source, not merely timing-avoided | the rewrite itself | **UNMITIGATED, pending a verdict decision** — issue drafted, pending filing (`#____`). The compile-and-run precondition is met as of 2026-08-27, and steps 3 and 5 of that run exercise this path and pass, so the reason for keeping it open is no longer evidential. Promoting it is a decision still to be taken | Compare the current source (`ReleaseCached`, `UfrmOSKOnScreenKeyboard.pas:389-431`) against the *Fix for Findings 1 and 4a* section below for what changed and why the earlier (already-committed, `cd2bd44dd0`) provisional text describing a `kbd.ShiftState - FCachedShiftState` subtraction is now superseded and should not be relied on as the current implementation |
| 2c | **process termination while an OSK sticky modifier is held** — `TerminateProcess`/Task Manager "End task", or the Sentry crash handler (`sceaTerminate`), skip Delphi destructors entirely | whatever chiral modifier KEYDOWN was last injected by an OSK sticky click, with the matching KEYUP now unreachable in-process | none in-process; user-level only — same physical key press/release, or reopening the OSK and clicking the same modifier off. **The chirality fix in row `2a` does not extend this recovery as far as it might look like it should** — see the caveat below | **UNMITIGATED** — issue drafted, pending filing (`#____`). No fix attempted; explicitly out of scope for this pass ([Finding 5](#finding-5)) | `sceaTerminate` skips `FormDestroy`/`ResetShiftStates`; no persisted record of an outstanding sticky modifier survives process death; no startup reconciliation exists. **Caveat on the recovery column, stated plainly because getting this wrong matters**: reopening the OSK and clicking the stranded modifier off recovers it only via a *dismissal* of the fresh OSK instance (which now correctly reaches the chirality-exact `ResetShiftStates`), not via directly clicking the generic "Ctrl"/"Alt" key to toggle it off — that click goes through the **still-unfixed** live click-off path ([Finding 4](#finding-4)), which can release the wrong chiral VK. So the reliable recovery sequence is: reopen OSK, then dismiss it (X button, tab switch, tray menu — any path, now that `2a`'s teardown fix covers all of them) **without** first trying to click the stuck modifier off by hand. On hardware with no physical Right Ctrl/Right Alt key, that is still the only in-process recovery; a reboot is the fallback if the OSK cannot be reopened |
| 3 | language-switch shift release — `keyman32/kmhook_keyboard.cpp:147` | `keybd_event(VK_SHIFT, 0xFF, KEYEVENTF_KEYUP, 0)` | none needed | **cannot latch** | `KEYEVENTF_KEYUP` is a literal in the only call in the file. An unmatched KEYUP asserts nothing |
| 4 | Caps Lock sync — `keyman32/kmprocessactions.cpp:101-102` | `VK_CAPITAL` down then up | adjacency | **cannot latch** | Both statements unconditional and adjacent inside one `if` (`:99`); no return or call between them, and `keybd_event` is `void WINAPI` so cannot throw. Also outside the managed six |
| 5 | `PostDummyKeyEvent` — `keyman32/keyman32.cpp:923-926` | prefix VK down then up | adjacency | **cannot latch** | Same structure. `Globals::get_vk_prefix()` is registry-overridable (`k32_globals.cpp:378`) and could in principle be a modifier VK, but the pair stays balanced either way |
| 6 | user-event re-injection — `keyman32/serialkeyeventserver.cpp` (`UpdateLocalModifierState` at `:590`, called from `:544`/`:550`/`:571`) | mirrors the user's own event | the mirror itself | **cannot latch** | `dwFlags = lParam & 0xFFFF`, and `lParam` comes from `LLKHFFlagstoWMKeymanKeyEventFlags` (`k32_lowlevelkeyboardhook.cpp:83-87`), which sets `KEYEVENTF_KEYUP` iff `LLKHF_UP`. Direction is the user's direction, structurally |
| 7 | AltGr Left Ctrl simulation — `serialkeyeventserver.cpp`, `SendInput` at `:377` (the same batch path as row 1) | two **releases** | none needed | **cannot latch** | `KEYEVENTF_KEYUP` literal in the branch that requires it in `lParam`. Both events are releases by construction. (Line numbers for this specific branch were not re-derived individually this pass; re-confirm before citing to the line if this row is revisited) |
| 8 | `AIWin2000Unicode::PostKeys` — `keyman32/appint/aiWin2000Unicode.cpp:138-153`, signalled at `:235` | `QIT_VKEYDOWN` writes a KEYDOWN whose KEYUP exists only if a separate `QIT_VKEYUP` follows; VK is `Queue[n].dwData & 0xFF` | the sole producer queues a balanced pair (`kmprocess.cpp:181-182`) | **UNMITIGATED** (contrived) — issue drafted, pending filing (`#____`). No fix attempted. [Finding 3](#finding-3) | Three unguarded truncation points can split the pair: `QueueAction` returns FALSE at `MAXACTIONQUEUE` and the result is ignored (`appint.cpp:51-57`, `kmprocess.cpp:181-182`); `SignalServer` silently clamps to 256 (`serialkeyeventclient.cpp:87-90`); the output-key copy stops at `MAX_KEYEVENT_INPUTS - MAX_KEYEVENT_INPUTS_MODIFIERS` (`keybd_shift.cpp:383`) with nothing preventing a pair straddling the bound. Not touched by this pass — this row's status is unchanged from before it |
| 9 | **eaten-event pipeline loss** — the low level hook used to eat every serialized key event unconditionally (`return_SendDebugExit(1)`) once it decided to hand it to the serializer, *before* confirming the handoff succeeded (`k32_lowlevelkeyboardhook.cpp:277-306`) | if the `PostMessage(hwndServer, WM_KEYMAN_KEY_EVENT, ...)` handoff failed — `hwndServer == NULL` during server startup/shutdown, a full posted-message queue, or a client wedged holding `KeymanEngine_KeyMutex` while `ProcessQueuedKeyEvents` waits `INFINITE` on it (`serialkeyeventserver.cpp`) — the real key event was destroyed outright. For a modifier KEYUP specifically, that meant the OS kept an earlier re-injected KEYDOWN latched, the cache still said down, cache and OS agreed, and the clear-only reconcile could never see it again | **fixed this pass**: the hook now only eats the event (`return_SendDebugExit(1)`) once `PostMessage` to a **non-NULL** server window has actually succeeded; otherwise it falls through to `CallNextHookEx`, so the keystroke reaches the app unserialized rather than being lost. The same NULL-window guard was added to the modifier cache-feed post at `:202-229` | **mitigated, source-reasoned and covered by the existing `keyman32.dll`/`keyman64.dll` build (links clean, warnings-as-errors) but not independently exercised by a new automated test that forces the handoff to fail** | `k32_lowlevelkeyboardhook.cpp:296-305` (key event path), `:202-229` (modifier cache-feed path). This closes the *loss* half of the defect — the event is no longer silently destroyed — but does not by itself close *why* a handoff can fail: `ProcessQueuedKeyEvents` waiting `INFINITE` on `KeymanEngine_KeyMutex` and `MessageLoop` returning on the exit event with events still pending (both in `serialkeyeventserver.cpp`) remain the underlying reasons a handoff degrades. Those are the reasons the hook now degrades safely into, not reasons that have themselves been removed |
| — | `USendInputString` — `global/delphi/general/USendInputString.pas:60` | `KEYEVENTF_UNICODE` with `ki.wVk := 0` always (`:41`, `:50`) | n/a | **cannot latch** | Cannot express a modifier VK at all |

### Known theoretical gap, not a producer, deliberately not hardened

**Generic-VK reconcile.** `isModifierKey` accepts nine VKs at the hook — the six
chiral ones plus generic `VK_SHIFT`/`VK_CONTROL`/`VK_MENU`, "because perhaps
some app will send them through `SendInput`" (comment on
`UpdateModifierCacheFromKeyEvent`). `CaptureLiveModifierState`
(`keybd_shift.cpp:252`) only ever reads the six chiral VKs. If a third party's
`SendInput(wVk=VK_SHIFT, wScan=0)` set the generic async key state without
Windows also asserting the chiral one, `ReconcileModifierCache` could erase a
cache byte a generic injection had just set correctly. This is **not a new
producer** — it would be a false-clear in the reconcile, which can only ever
turn into a skipped restore or an extra release, never an unmatched KEYDOWN —
so it does not get its own table row or issue. It is deliberately left
unhardened, with the reasoning recorded in `keybd_shift.cpp`'s comment above
`CaptureLiveModifierState` (~`:232-250`) and pinned by
`MODIFIER_CACHE_EVENT_ORDER.GenericVkEventReconcilesAgainstTheChiralLiveReading`
(a real, CI-safe test that proves the reconcile is correct **given** the
chirality assumption) plus a new `DISABLED_GenericShiftSendInputReflectsInBothAsyncKeyStates`
live probe that measures whether the assumption itself holds — **not yet run**.
If that probe ever shows the assumption false, the fix is sketched in the same
comment (OR the generic reading into both chiral halves when neither already
reports held) but was not spec­ulatively added against an unconfirmed claim.

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
OSK's *cache* **toward** the OS, never the reverse: absorbing live state
unconditionally, and emitting a key event only when the both-chiral-Alt or
both-chiral-Ctrl collapse guard fires. For a single stuck modifier the timer
emits nothing — and once `FShiftState` has absorbed the stuck bit, the
`GetAsyncShiftState <> FShiftState` guard means the handler stops doing
anything at all. Cache and OS agree, forever. **The timer cannot clear a
modifier the OS agrees is down, which is exactly this failure mode.**

**Reachability is now closed.** `TfrmVisualKeyboard.FormDestroy` (`:620`, the
call at `:627`) reaches `ResetShiftStates` on every dismissal path — `Release`,
`FreeAndNil`, and `Close`/`FormClose` alike — as of the already-committed
`cd2bd44dd0`. Before that commit, every path except the OSK's own X button and
a tab switch bypassed cleanup entirely; that gap is closed.

**What is left is correctness at the point `ResetShiftStates` runs, and a case
it never runs for at all.** `SetLRShift`
(`common/windows/delphi/components/OnScreenKeyboard.pas:885-937`) collapses
chirality when `LRShift` goes False, rewriting
`FShiftState - [essLCtrl, essRCtrl] + [essCtrl]`. So: click R Ctrl on an AltGr
visual keyboard, then select a non-AltGr one. `kbd.ShiftState` now says
`essCtrl`, and the *old* teardown path (`ShiftStateChange`, branching on the
current `kbd.LRShift`) released `VK_CONTROL` — Left — while the real, stuck key
was extended `VK_RCONTROL`, unclearable on hardware without that physical key.

**Fixed this pass; compiled and measured 2026-08-27.** `ResetShiftStates`
(`UfrmOSKOnScreenKeyboard.pas:364`) no longer routes through `ShiftStateChange`
at all. It releases each of the seven cached identities directly via a new
local `ReleaseCached(shift, vk, extended)`, gated on `shift in FCachedShiftState`
(only true for something the OSK itself clicked, preserving the I2177 guarantee
that a physically-held modifier is never touched) **and** a live
`GetAsyncKeyState(vk)` check (only releases something still actually down,
which is what makes a second call a no-op). `FCachedShiftState` is written only
by a live click (`kbdShiftChange`, `:221`) and is never touched by
`SetLRShift`'s collapse, so it still names the exact chiral VK that was
actually injected, regardless of what `kbd.ShiftState`/`kbd.LRShift` say by the
time teardown runs. The function can only ever emit a `KEYUP` — there is no
press branch left in it at all, which also closes row `2b`'s original defect
structurally rather than by timing.

**This has now been compiled and run** (2026-08-27); see
*Fix for Findings 1 and 4a* below for the current source and the measured
results. The row stays `UNMITIGATED` for the live click-off gap it does not
address, not for want of evidence on this half.

<a name="finding-4"></a>

### Finding 4 — two more OSK gaps, one fixed and measured, one deliberately left open

**4a — `kbdKeyPressed`'s stale-async restore race. Fixed this pass; compiled and measured 2026-08-27.**
`FinalState` (nested in `kbdKeyPressed`, `UfrmOSKOnScreenKeyboard.pas:123`)
samples `ass := GetAsyncShiftState` once, before the character keydown/keyup
and the `koReleaseShiftKeysAfterKeyPress` COM property read that follow. If the
user physically releases a modifier in that window, the restore-press branch
would previously re-press it from the stale sample with nothing left to match
it with a KEYUP — a genuine unmatched-KEYDOWN in the #8064 class, on a path
this document had not previously enumerated. Fixed by adding a live
`GetAsyncKeyState` re-check immediately before that one press call; the
release-of-our-own-temporary-press branch just above it needs no such check,
since undoing Keyman's own temporary press is safe regardless of what happens
physically in between.

A second, related fix landed alongside it: `kbd.LRShift` is now sampled once
into a local `LLRShift` at entry to `kbdKeyPressed` (`:139`) and used for both
the `PrepState` and `FinalState` branch selection, instead of being re-read
live for each. `fkcss`/`ass` are frozen snapshots taken under whatever regime
was current at entry; if `kbd.LRShift` were re-read separately for `FinalState`
after a keyboard switch landed mid-keystroke, `FinalState` could select
`essCtrl`/`essAlt` while `fkcss`/`ass` still encoded the chiral variants (or
vice versa), and a `PrepState` suppression could go unrestored under a
membership test that would never match. Neither of these two fixes is
compiled or run; same caveat as Finding 1.

**4b — the live click-off chirality gap. Deliberately left open, not fixed
this pass.** `kbdShiftChange` (`:221`) → `ShiftStateChange` (`:305`) is
reached both from an explicit OSK click **and** from `UpdateShiftStates`'
50 ms resync (`:452`, calling `ShiftStateChange` at `:473`). `ShiftStateChange`
still selects the release VK from the *current* `kbd.LRShift` — the same flaw
`ResetShiftStates` no longer has. So after a `SetLRShift` collapse, a user who
clicks the now-generic "Ctrl" key on the OSK itself, to try to toggle it off
*before* dismissing the OSK, still gets the wrong-chirality release: unextended
`VK_CONTROL` (Left) goes out, and the actually-stuck extended `VK_RCONTROL`
stays held. Two independently-drafted fixes for this were considered and
**rejected during this pass**:

- Making `FCachedShiftState` an injection-accurate record maintained by
  `ShiftStateChange` itself, so a click-off could release by recorded
  identity the same way `ResetShiftStates` now does. **This was actually
  implemented and then reverted within this session**, because composed with
  the `ResetShiftStates` teardown fix it produced a real I2177 regression:
  `ShiftStateChange`'s *press* branch also fires from `UpdateShiftStates`'
  50 ms resync for a modifier the user has **physically** pressed since the
  last tick, and if that path also wrote `FCachedShiftState`, a later
  teardown would treat a physically-held modifier as "OSK outstanding" and
  release it — releasing a key the user is still genuinely holding down. See
  *Composition hazard, caught before commit* below; this is recorded there in
  more detail because two independently-correct-looking changes to the same
  file produced a regression neither author could see alone.
- Blindly emitting both chiral VKs whenever a generic release fires. Rejected
  as unsafe on its own for the same reason `(c)` was rejected in the original
  audit of `ResetShiftStates`: it can release a modifier the user is
  genuinely, physically holding on the *other* side at that instant.

The comment now in `ShiftStateChange`'s source (`UfrmOSKOnScreenKeyboard.pas:305-314`)
records the decision to leave it open and points here. It needs its own issue
— see [Issues to file](#issues-to-file) — because a correct fix requires
distinguishing a click-originated `ShiftStateChange` call from a
resync-originated one, which is a larger, riskier change than either OSK fix
landed this pass, and was out of scope for a pass working without a Delphi
compiler.

**Minimal reproduction to confirm both, once compiled:** for 4a, hold a
physical modifier, click a character key on the OSK with
`koReleaseShiftKeysAfterKeyPress` off, and release the physical modifier as
fast as possible right after the click (narrow timing window, best effort).
For 4b, click **R Ctrl** on an AltGr OSK, switch to a non-AltGr keyboard, then
click the now-generic **Ctrl** key on the OSK to try to toggle it off —
confirm `GetAsyncKeyState(0xA3)` (`VK_RCONTROL`) stays asserted.

<a name="finding-3"></a>

### Finding 3 — `PostKeys` pair-splitting, contrived but not impossible

Unchanged by this pass. `QIT_VKEYDOWN` (`aiWin2000Unicode.cpp:138-153`) emits a
KEYDOWN for an unconstrained VK. Its only production producer queues a balanced
pair (`kmprocess.cpp:181-182`), and `calldll.cpp:126-135` refuses any VK that is
not the current key — but three separate truncation points can drop the KEYUP
half, and none checks or reports it.

Reachability is narrow. `aiTIP.cpp:186-202` returns early for `VK_MENU` and
`VK_CONTROL` before `_td->state.vkey` is assigned, but **`VK_SHIFT` falls
through**. So the emission is `VK_SHIFT` in practice, which maps to Left
Shift — releasable on every keyboard, and therefore not the
unproducible-KEYUP shape. It is recorded as `UNMITIGATED` rather than
`cannot latch` because the pair-splitting is genuinely unguarded, not because a
latch has been observed.

**Source alone cannot settle** whether the required conditions are co-reachable:
a legacy/ANSI target, `use(final)`, 248 or more output events, and `VK_SHIFT`.
The runtime observation that would settle it: with `debug=1`, drive such a
target with a keyboard whose Shift rule outputs 250 or more characters and look
for `"Too many INPUT events for queue"` (`serialkeyeventclient.cpp:88-90`)
immediately followed by a `VK_SHIFT` down with no matching up.

<a name="finding-5"></a>

### Finding 5 — process kill or crash strands an OSK sticky modifier, with no in-process recovery

**Not recoverable automatically.** `TerminateProcess` and the Sentry crash
handler's `sceaTerminate` path both skip Delphi destructors, so
`ResetShiftStates` never runs and nothing is flushed. No persisted record
(registry/disk) of an outstanding sticky modifier survives the process
boundary. No watchdog.

**User-facing recovery, in order of reliability:**

1. If the stuck key has a physical counterpart on the user's keyboard, pressing
   and releasing that *same physical key* clears it directly. Works for any of
   the six chiral VKs, including Right Ctrl/Alt, **if the hardware has that
   key**.
2. On hardware without that physical key: reopen Keyman's OSK and **dismiss
   it** (any path — X button, tab switch, tray menu, all now reach
   `ResetShiftStates` per `cd2bd44dd0`) **without first clicking the stuck
   modifier by hand**. Clicking the generic modifier key to try to toggle it
   off routes through the still-open [Finding 4b](#finding-4) gap and can
   release the wrong chiral VK, leaving the real problem untouched. This
   recovery is reliable for the *dismissal* path once the OSK reaches the
   chirality-exact `ResetShiftStates`; it is **not** reliable via a manual
   click-off, and that distinction did not exist as clearly before this pass's
   fixes landed. It also still depends on the fresh OSK instance's own
   `kbd.LRShift` at the time it is dismissed correctly reflecting the stuck
   chiral identity, which `FCachedShiftState` will only hold if the user
   re-clicks the same modifier in the fresh instance — reopening the OSK does
   not, by itself, repopulate `FCachedShiftState` for a modifier that was
   stranded by a *previous* process's crash, because the cache starts empty in
   a fresh process. In that specific sub-case (fresh OSK, empty
   `FCachedShiftState`, nothing re-clicked), route (2) does not clear the
   modifier at all.
3. Otherwise: reboot.

**Explicitly rejected mitigation:** "release all managed modifiers at
startup" — would release a modifier the user is genuinely, physically holding
down at the moment Keyman launches, a new bug in the same family. No safe
blind mitigation was found; the two structurally-safe candidates are a
persisted "outstanding sticky modifier" record reconciled only against live
`GetAsyncKeyState` at startup, or a supervising watchdog process. Neither is
attempted here.

---

## Composition hazard, caught before commit

Recorded here because it is a review lesson, not only a code fact, and this is
the document that tracks the OSK fix history in enough detail for the next
person touching this file to benefit from it.

Two independently-reasonable Delphi changes to the same file, each correct in
isolation, composed into an I2177 regression that neither author's own
reasoning surfaced:

- Change A (teardown): `ResetShiftStates` treats every modifier named in
  `FCachedShiftState` as "OSK outstanding" and releases it whenever
  `GetAsyncKeyState` confirms it is still down.
- Change B (live click-off, drafted and then reverted): `ShiftStateChange`
  writes `FCachedShiftState` on every call, including calls that originate
  from `UpdateShiftStates`' 50 ms resync rather than from an explicit click.
  The resync's press branch fires for a modifier the user has **physically**
  pressed since the last tick.

Composed: a modifier the user is genuinely, physically holding gets recorded
in `FCachedShiftState` by the resync, and the next OSK teardown releases it —
exactly the I2177 regression both changes' own commentary says it must not
reintroduce, produced by their combination rather than by either alone. Change
B was reverted for this reason; see [Finding 4b](#finding-4). The general
lesson: a fix to `ResetShiftStates`/teardown and a fix to
`kbdShiftChange`/`ShiftStateChange`/the live-click path must be reviewed
**together** against I2177, not in separate sessions or by separate agents,
because the hazard is in what each writes into `FCachedShiftState` for the
other to read, not in either change's own local correctness.

---

## FR-012a — a recurrence is triaged, not assumed to be a regression

**#8064's original repro was contrived, not observed.** There is no evidence
that the field reports which opened the issue came from path 1 at all. Given
Finding 1, the OSK is a live candidate for at least some of them: it produces
exactly the reported symptom, including the unclearable Right Control case.

So a stuck modifier reported after this fix ships must be triaged through
[TRIAGE.md](./TRIAGE.md) before anyone concludes the fix regressed.

## Status of this enumeration

Paths 1, 1b, 3–9 were settled from source; 1 and 1b's newly-closed residual and
9 are source-reasoned and covered by a clean build, but not yet independently
re-run against the live `host32` harness the original row-1 gap was measured
against. Paths 2b and 2c were settled from source and **have not yet been
confirmed at runtime**; each carries its minimal reproduction above.

Row `2a` and both Finding 4 gaps are **no longer in that category**. They were
measured on 2026-08-27 against a live Delphi 12 build of `keyman.exe`, and the
run is recorded in
[`evidence/run-osk-teardown-2026-08-27.txt`](evidence/run-osk-teardown-2026-08-27.txt).
Finding 4b reproduced exactly as reasoned, chirality included — the first row in
this document to be confirmed rather than argued.

Runtime confirmation is still owed for 2b and 2c. No row's verdict should be
strengthened on the basis of a null result from an unvalidated stimulus — a rule
this run had to apply to itself twice, at steps 5 and 7 below.

---

<a name="provisional-fix"></a>

## Fix for Findings 1 and 4a — compiled and measured, 2026-08-27

**This section replaces an earlier version of itself.** That version said the
changes had never been compiled or run, because Delphi was not installed on the
machine that pass was done on, and described them as sitting uncommitted in the
working tree. All three statements are now false: they are committed
(`cd2bd44dd0`, `3d64aad790`, `4ca0945a12`), they compile under Delphi 12.0 CE,
and they have been run.

**Finding 1** — `TfrmOSKOnScreenKeyboard.ResetShiftStates` no longer calls
`ShiftStateChange` at all. A nested `ReleaseCached(shift, vk, extended)` releases
each of the seven tracked identities directly, gated on membership in
`FCachedShiftState` and a live `GetAsyncKeyState` check. `kbd.ShiftState` is
cleared afterward — widened across the whole Ctrl/Alt family before subtracting,
since `FCachedShiftState` may name a modifier in a representation `SetLRShift`
has since collapsed or expanded — then `FCachedShiftState := []`, preserving the
idempotency contract. A trailing `UpdateKeyboard(False)` makes the OSK's own
rendering pick up the cleared state. `UfrmVisualKeyboard.FormDestroy` also calls
`ResetShiftStates`, closing the `Release`/`FreeAndNil` teardown path that runs
`OnDestroy` and never `OnClose`.

**Finding 4a** — `kbdKeyPressed`'s nested `FinalState` re-checks
`GetAsyncKeyState(vk)` immediately before its restore press instead of trusting
the `ass` snapshot, and `kbd.LRShift` is frozen into a local `LLRShift` at entry
so a keyboard switch landing mid-keystroke cannot leave a `PrepState`
suppression unrestored under a mismatched regime.

### The checklist found a defect. It was I2177, reintroduced.

Step 6 failed on the first build. Holding physical Left Shift, clicking `R Ctrl`
on the OSK and dismissing released **both**:

```
[09:11:28.153] HELD: SHIFT,CTRL,LSHIFT,RCTRL
[09:11:35.396] ALL CLEAR                        <-- dismissal took both
```

`UpdateShiftStates` runs on a 50 ms timer and ends with
`kbd.ShiftState := GetAsyncShiftState`, so `kbd.ShiftState` continuously carries
physically-held modifiers. `kbdShiftChange` assigned it wholesale into
`FCachedShiftState`, so a click made while Shift was held cached `essShift`
alongside the key actually clicked, and `ReleaseCached` released it.
`ReleaseCached`'s `GetAsyncKeyState` gate cannot catch this — a physically-held
key genuinely *is* down, so the gate passes.

The comment then in place argued the resync could not contaminate the cache
because `FCachedShiftState` is written "from a click and only from a click".
That is true of *when* it is written and irrelevant to *what* it captures. **The
hazard travels in the value, not the call path**, and the resync never has to
reach that handler to poison it.

Fixed in `4ca0945a12` by recording only the clicked set:

```pascal
FCachedShiftState := (FCachedShiftState + (fkcss - ass)) * fkcss;
```

The snapshot precedes injection, so the just-clicked modifier is not physically
down yet and survives the subtraction while a held one is excluded. Accumulate
rather than assign: by the time a second modifier is clicked the first has
genuinely been injected and reads as down, and a plain subtraction would drop
it. Masking with `kbd.ShiftState` drops anything clicked back off.

### Results

Measured with `sil_cameroon_qwerty` active — its `.kvk` carries `<usealtgr/>`,
so `kbd.LRShift` is True and the OSK draws separate L/R Ctrl — and `akan` as the
non-AltGr counterpart. Instrument: [`watch-modifiers.ps1`](watch-modifiers.ps1),
calibrated against a physical keypress before any null result was trusted.

| # | Step | Result |
|---|------|--------|
| 1 | It compiles | PASS — and `ReleaseCached` confirmed present in `keyman.map`, not assumed |
| 2 | R Ctrl, tray dismiss | PASS — no `LCTRL` contamination |
| 3 | R Ctrl, Character Map tab (`FormDestroy`) | PASS |
| 4 | Generic Ctrl, False→True `SetLRShift` collapse, dismiss | PASS — modifier survived the switch, released at teardown |
| 5 | R Ctrl, X button (idempotency) | PASS, qualified — see below |
| 6 | I2177: held modifier must not be released | PASS **after** `4ca0945a12` |
| 7 | Finding 4a timing repro | PASS, best-effort — 4 attempts, none stranded |
| 8 | Finding 4b (expected still-broken) | **Still broken, as designed** — `RCTRL` survived |
| 9 | OSK still works normally | PASS — sticky applies to next key; held modifier survives a tab switch |

**Step 5 is qualified.** The poller samples at 60 ms and the two
`ResetShiftStates` calls fire milliseconds apart, so a re-press/re-release inside
one window would be invisible. What carries the result is structural:
`ReleaseCached` is gated on `FCachedShiftState`, the first call ends with
`FCachedShiftState := []`, and the procedure can only ever emit `KEYUP` — a
missed double would be a redundant key-up, which is inert.

**Step 7 can falsify but not confirm.** Only the fixed build exists, so a clean
run cannot distinguish "the fix worked" from "the window was never hit". What it
does establish is that no attempt produced a *stuck* modifier, and a stuck
modifier is not transient — it would show as a `HELD` line that never resolves.

**Step 6 needed its protocol corrected before it could mean anything.** The first
two attempts were INCONCLUSIVE, not failures: sending a message required pressing
Enter, which meant releasing the very key under test, and the log cannot separate
"the fix released your Shift" from "the tester let go". Pre-typing the message
and sending it with the mouse fixed it, and the decisive line is unambiguous —
`SHIFT,CTRL,LSHIFT,RCTRL` → `SHIFT,LSHIFT`. A tester releasing Shift produces
`CTRL,RCTRL`; it can never produce `SHIFT,LSHIFT`.

### What this does not fix

The live click-off chirality gap ([Finding 4b](#finding-4)), now confirmed at
runtime rather than merely reasoned. See [Issue 1](#issues-to-file), whose
severity this run also revised upward.

Separately, the run surfaced a **pre-existing** defect that is not this work's
and must not be folded into it: with a modifier physically held and nothing
latched, clicking a character key on the OSK yields a different character
depending on how quickly the modifier is released afterwards — lowercase if
released immediately, uppercase a moment later — even though the mouse has
already gone down *and* up on the key before the release. The character
injection path is textually unchanged by these commits, and in that scenario
`PrepState` and `FinalState` are both no-ops, because the 50 ms resync has
already put `essShift` into `kbd.ShiftState`. That is inspection, not
measurement. Tracked as `I18` for filing as its own issue.
---

<a name="issues-to-file"></a>

## Issues to file

Four issues, one per `UNMITIGATED` row above plus the Finding 4b gap folded
into the first. These are ready to paste; replace each `#____` in the table
above with the real issue number once filed, and remove the "pending filing"
qualifier from the corresponding row's verdict once it has a green compiled
and tested fix, not merely a filed issue.

### Issue 1 — OSK sticky modifier can be released with the wrong chirality (row `2a`, includes Finding 4b)

**Title:** OSK sticky modifier can be released with the wrong chirality after a keyboard switch, stranding Right Ctrl/Right Alt

**Body:**

A modifier "clicked sticky" on the on-screen keyboard is held via a real,
chiral `keybd_event` KEYDOWN with no matching KEYUP queued anywhere — release
depends entirely on Keyman correctly identifying *which side* to release.

`SetLRShift` (`common/windows/delphi/components/OnScreenKeyboard.pas:885-937`)
collapses `kbd.ShiftState`'s chiral representation (`essLCtrl`/`essRCtrl` →
`essCtrl`, and the Alt equivalent) whenever the active keyboard's AltGr-ness
changes — e.g. the user switches keyboards while the OSK stays open. After
that collapse, `kbd.ShiftState` can no longer say which chiral VK is actually
down.

Two release paths read that representation:

1. **OSK teardown** (`ResetShiftStates`, on dismissal). **This half is fixed,
   compiled and measured** (2026-08-27): it releases by exact chiral identity
   from `FCachedShiftState` instead of through the collapsed representation.
   See Finding 1, the *Fix for Findings 1 and 4a* section, and
   [`evidence/run-osk-teardown-2026-08-27.txt`](evidence/run-osk-teardown-2026-08-27.txt).
   Step 4 of that run is this exact scenario and passes.
2. **A live click-off** — the user clicks the now-generic "Ctrl"/"Alt" key on
   the OSK itself, before dismissing it, to try to toggle the sticky modifier
   off directly. This path (`kbdShiftChange` → `ShiftStateChange`) is **not**
   fixed. It still selects the release VK from the current `kbd.LRShift`, so
   it releases the wrong (Left) chiral VK while the actually-stuck extended
   Right Ctrl/Alt stays held. **Confirmed at runtime**, step 8 of the same run:
   `RCTRL` survived the click-off, chirality and all.

**User impact — measured, and worse than "a modifier is stranded".** On
hardware without a physical Right Ctrl or Right Alt key there is **no
in-session recovery at all**. This was hit for real during the 2026-08-27 run,
on a keyboard with no right Ctrl:

- The OSK cannot clear it. The OSK's own click-off is the very path that
  carries this defect, so the obvious remedy is the one that does not work.
- The physical key cannot clear it. It does not exist.
- Every keystroke is meanwhile swallowed as a Ctrl chord, so the machine
  cannot be driven by keyboard to fix itself — including to run any recovery
  script the user might otherwise type.

Recovery required an external tool injecting the matching event shape
(`keybd_event(VK_CONTROL, 0x1D, KEYUP | EXTENDEDKEY)` — side-agnostic VK with
the extended bit, mirroring what `do_keybd_event` sent going down). An
unextended `VK_CONTROL` keyup does not match and leaves it held. Absent such a
tool the realistic user remedy is a reboot.

Compact and 60% layouts commonly ship without a right Ctrl, so this is not a
rare hardware configuration. The teardown fix does not mitigate it: the user
who clicks the modifier off rather than dismissing the OSK never reaches the
fixed path.

**Why the live click-off case is harder than it looks:** `ShiftStateChange` is
called both from an explicit click and from the periodic 50 ms resync
(`UpdateShiftStates`), whose press branch fires for a modifier the user is
**physically** holding. A fix attempted during this pass — making
`FCachedShiftState` an injection-accurate record maintained by
`ShiftStateChange` — was implemented and then reverted within the same
session, because composed with the teardown fix it let a resync-triggered
write of `FCachedShiftState` cause teardown to release a modifier the user was
genuinely, physically holding: a real I2177 regression. See
`MODIFIER-PRODUCERS.md`'s "Composition hazard, caught before commit" section
for the detail. A correct fix needs to distinguish a click-originated
`ShiftStateChange` call from a resync-originated one before it touches
`FCachedShiftState`.

**Scope for a fix:** (a) is **done** — the teardown fix is compiled, run and
recorded. What remains is (b): design and implement a click-vs-resync
distinction for the live click-off path, reviewed against I2177 rather than in
isolation.

Note that (a) landing changes what (b) must contend with. The teardown fix
initially reintroduced I2177 by exactly the route this section warns about, and
the correction — `FCachedShiftState := (FCachedShiftState + (fkcss - ass)) *
fkcss` in `kbdShiftChange` — is a *value-level* filter: it subtracts the live
async state so a physically-held modifier is never recorded, regardless of which
call path did the recording. That is a weaker requirement than distinguishing
click from resync by provenance, and it is already in the tree and measured
(step 6). Whether (b) can be built on the same subtraction rather than needing
true provenance tracking is the first thing to establish, and it would be
cheaper if so.

### Issue 2 — OSK `ResetShiftStates` cleanup path itself (row `2b`)

**Title:** Confirm OSK `ResetShiftStates` no longer presses a modifier during its own cleanup, once compiled

**Body:**

`ResetShiftStates`'s cleanup previously routed the release through
`ShiftStateChange`'s `PrepState`, which emits a KEYDOWN when a modifier is in
one shift-state set and not another. A modifier-off click could mutate
`kbd.ShiftState` without touching `FShiftState`, and until the next 50 ms
resync tick equalised them, `ResetShiftStates` could press a modifier the user
was no longer holding — chiral, so potentially Right Control.

The rewrite landed this session (see `MODIFIER-PRODUCERS.md` row `2a`/Finding
1 and the *Fix for Findings 1 and 4a* section) removes the press branch from this
function's code path entirely: the new `ReleaseCached` helper only ever calls
`do_keybd_event` with `KEYEVENTF_KEYUP`. Source review is confident this
specific defect can no longer occur, but the change has not been compiled —
Delphi is unavailable on the machine that wrote it — and has not been run.

**Ask:** on a machine with Delphi, compile
`windows/src/engine/keyman/viskbd/UfrmOSKOnScreenKeyboard.pas`, run the
9-step verification procedure in `MODIFIER-PRODUCERS.md`'s *Fix for Findings 1 and 4a*
section, and close this issue (or reopen with findings) based on that run —
not on this source review alone.

### Issue 3 — OSK sticky modifier stranded machine-wide by a keyman.exe crash or kill, with no watchdog or restore-on-start (row `2c`)

**Title:** OSK sticky modifier can be stranded machine-wide by a keyman.exe crash or kill, with no watchdog or restore-on-start

**Body:**

A modifier "clicked sticky" on the on-screen keyboard is deliberately held via
a real, chiral `keybd_event` KEYDOWN with no matching KEYUP queued anywhere —
release only happens when Keyman itself runs `ResetShiftStates` (OSK
dismissal, tab switch, or normal process shutdown).

If keyman.exe is terminated abnormally — Task Manager "End task",
`TerminateProcess`, or the Sentry crash handler, which sets `sceaTerminate`
specifically so destructors don't run — that release never happens. There is
no persisted record of the outstanding modifier across the process boundary,
and no watchdog checks or reconciles global modifier state on the next launch.

**User impact:** a modifier (potentially Right Ctrl/Alt, unclearable on
hardware without that physical key) stays asserted machine-wide until the user
presses the same physical key themselves, successfully reopens the OSK and
dismisses it (not a manual click-off — see Issue 1 above, which currently
governs whether that recovery even releases the right VK), or reboots.

**Explicitly rejected mitigation:** releasing all managed modifiers
unconditionally at Keyman startup, since that would release a modifier the
user is genuinely, physically holding down at the moment Keyman launches — a
new bug in the same family.

**Scope for a fix:** would need either (a) a small persisted "outstanding
sticky modifier" record written when injected and cleared when released,
checked once at startup and reconciled only against live `GetAsyncKeyState`
(never blindly), or (b) a supervising watchdog process. Out of scope for the
current #8064 Delphi-side fix pass.

### Issue 4 — `AIWin2000Unicode::PostKeys` can split a KEYDOWN/KEYUP pair under queue truncation (row `8`)

**Title:** `PostKeys`'s modifier KEYDOWN/KEYUP pair can be split by three unguarded truncation points

**Body:**

`QIT_VKEYDOWN` (`windows/src/engine/keyman32/appint/aiWin2000Unicode.cpp:138-153`)
writes a synthesized KEYDOWN for a VK carried in `Queue[n].dwData & 0xFF`. Its
matching release only exists if a separate `QIT_VKEYUP` action follows in the
same queue. The one production producer of this pair
(`kmprocess.cpp:181-182`) queues both together, but three separate points can
silently drop the second half without either queuing the pair atomically or
reporting the drop:

- `QueueAction` returns `FALSE` at `MAXACTIONQUEUE` and the caller
  (`kmprocess.cpp:181-182`) ignores the result.
- `SignalServer` silently clamps the outgoing count to 256
  (`serialkeyeventclient.cpp:87-90`).
- The output-key copy in `PrepareInjectedInputBatch` stops short of
  `MAX_KEYEVENT_INPUTS` to reserve room for the modifier restore half
  (`keybd_shift.cpp:383`), with nothing preventing a `QIT_VKEYDOWN`/`QIT_VKEYUP`
  pair from straddling that boundary.

**Reachability is narrow but not zero.** `aiTIP.cpp:186-202` returns early for
`VK_MENU` and `VK_CONTROL` before the VK is assigned, but **`VK_SHIFT` falls
through** — so in practice this can only emit `VK_SHIFT`, which maps to Left
Shift and is releasable on every keyboard by a physical keypress, unlike the
chiral Right-side cases elsewhere in this document. That is why this row is
`UNMITIGATED (contrived)` rather than a top field-severity concern, and why no
runtime observation has confirmed it: it requires a legacy/ANSI target,
`use(final)`, 248 or more output events in one batch, and a rule that emits
`VK_SHIFT` specifically — source alone cannot establish these are
co-reachable.

**Ask:** either guard the three truncation points so a split pair cannot
happen (e.g. reject or flush atomically rather than silently clamping), or
run the runtime observation described in `MODIFIER-PRODUCERS.md` Finding 3
(`debug=1`, a keyboard whose Shift rule outputs 250+ characters, watch for
`"Too many INPUT events for queue"` immediately followed by an unmatched
`VK_SHIFT` KEYDOWN) to establish real-world reachability before prioritising
a fix.
