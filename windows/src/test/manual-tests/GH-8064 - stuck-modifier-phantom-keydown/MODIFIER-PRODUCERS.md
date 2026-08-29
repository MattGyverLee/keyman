# Every production path that can emit a modifier KEYDOWN

Companion to [README.md](./README.md), [TRIAGE.md](./TRIAGE.md),
[JUSTIFICATION.md](./JUSTIFICATION.md) and [TIMELINE.md](./TIMELINE.md), for
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

**The bar for `mitigated`.** The fix is compiled, linked, and either covered by a
green automated test or confirmed by an executed manual reproduction. Uncompiled
source does not clear it, and neither does a manual procedure that has not been
run, however sound the source-level reasoning looks. That rule earned its keep:
the OSK run below found that the teardown fix had reintroduced I2177, which every
prior source read had missed.

**The bar for `cannot latch`** (FR-010a). It is the only verdict that leaves
nothing behind if it is wrong — `mitigated` is evidenced by its fix and
`UNMITIGATED` by its issue — so each one has to say what it rests on. Two things
qualify, and the distinction is recorded per row rather than assumed:

- a **structural literal** — a `KEYEVENTF_KEYUP` written into the only call in the
  file, or an unconditional adjacent down/up pair. A compiler already guarantees
  it; a runtime observation would add nothing.
- a **runtime observation**, required wherever the verdict rests on an *inference
  chain* instead. One row did: row `6`, now measured.

Audited row by row on 2026-08-28 in
`evidence/path6-cannot-latch-2026-08-28.md` *Finding C*. No row was found resting
on a hopeful reading.

## Status

### Before this branch

| path | behaviour |
|---|---|
| serializer batch restore | the modifier cache was not re-derived — a per-batch `GetKeyboardState` in `keybd_shift_release` was removed on 2018-10-10 (`738e1946a6`) and nothing replaced it; see [TIMELINE.md](./TIMELINE.md). One dropped KEYUP left a byte stale for the life of the process, and `keybd_shift_reset` pressed that modifier for real ahead of every injected batch, with no queued release |
| low level hook | ate every serialized key event once it decided to hand it to the serializer, *before* confirming `PostMessage` succeeded. A failed handoff destroyed the user's real key event outright |
| OSK cleanup reachability | `ResetShiftStates` ran only from `TfrmVisualKeyboard.FormClose`. The tray menu, tray double-click, `KMC_ONSCREENKEYBOARD` and Keyman shutdown all bypassed cleanup |
| OSK release chirality | both the teardown and a live click-off derived the release VK from the *current* `kbd.LRShift`. After a `SetLRShift` collapse they released unextended `VK_CONTROL` while the key actually held was extended `VK_RCONTROL` |
| OSK `kbdKeyPressed` | restored a suppressed modifier from an async snapshot taken before the character keys and a COM property read, so a physical release inside that window produced an unmatched KEYDOWN |

### On this branch

| change | commits |
|---|---|
| `ReconcileModifierCache` clears a cache byte the OS says is up, before the restore loop can press it | `4aff8fc10e` |
| `ComputeModifierReleaseState` releases the union of cache-held and OS-held modifiers, guarded by `feedIsConfigured` so an unfed cache degrades to the pre-union symmetry | `132210bd97`, `5ba72fa3c9` |
| `PrepareModifierVerificationCorrection`, scheduled by the self-posted `WM_KEYMAN_VERIFY_MODIFIER_EVENT`, releases a modifier the OS still holds that the cache no longer claims | `5ba72fa3c9` |
| `IsKeymanInjectedKeyEvent` keeps Keyman's own wrap events out of the cache, by scan flag and by `EXTRAINFO_FLAG_KEYMAN_MODIFIER_WRAP` for Right Shift | `d138f7e2ef` |
| the hook eats a key event only after a successful post to a non-NULL server window, and falls through to `CallNextHookEx` otherwise | `e245c41845` |
| every OSK dismissal path reaches `ResetShiftStates`, via `FormDestroy` | `cd2bd44dd0` |
| `ResetShiftStates` releases by exact chiral identity from `FCachedShiftState`, gated on live state, KEYUP only | `3d64aad790`, `4ca0945a12` |
| a live click-off releases the injected identity, not the one the current regime implies | `791c5f181a`, `ea530407c2` |
| `kbdKeyPressed` re-checks live state before its restore press, and freezes `kbd.LRShift` at entry | `3d64aad790` |

<a name="what-is-left"></a>

### What is left

1. **Row `2c`** — `keyman.exe` killed or crashed while an OSK sticky modifier is
   held. No destructor runs, nothing is persisted, there is no restore-on-start.
   Needs a decision: an accepted persisted-state-and-reconcile-at-startup
   design, a supervising watchdog, or an explicit acceptance that no in-process
   mitigation exists. [Finding 5](#finding-5).
2. **Row `8`** — `PostKeys` pair-splitting under queue truncation. Needs a
   decision: guard the three unguarded truncation points, or accept the
   contrived-but-real risk. [Finding 3](#finding-3).
3. **Five issues to file**, drafted in full under [`issues/`](./issues/), of which
   **four are producer drafts** — rows `2a`, `2b`, `2c` and `8`. That four is the
   `N` in *mitigated, with 4 producers drafted*. The fifth is deliberately **not**
   a producer: [issue 5](./issues/issue-5-inithooks-return-value-discarded.md),
   the discarded `InitHooks()` return value, which emits nothing and sits behind
   row `1`'s mitigation instead — see
   [The feed can be dead while the flag says it is on](#feed-dead).
   Two of the four producer drafts are for rows now `mitigated`: `2a` and `2b`
   were `UNMITIGATED` in a released build, users are running that build today, and
   the record should say so. **Every row now links its draft instead of carrying a
   placeholder**; the issue number is written beside the link on the day it is
   filed.
   **Not a gate on this work.** FR-011a asks an accepted row to carry a complete
   draft, and each does; the filing itself happens on the day the #8064 PR is
   submitted, so numbers and PR reference each other in one pass.

**Settled 2026-08-28, and previously listed here.** The serializer-side signals
this document's triage procedure depends on were captured on a live engine, so
[TRIAGE.md](./TRIAGE.md)'s serializer column is measured rather than
source-derived; and the `cannot latch` audit FR-010a asks for was run row by row.
Row `6` was the only one resting on an inference chain, and it is now measured.
`evidence/serializer-signals-2026-08-28.md`,
`evidence/path6-cannot-latch-2026-08-28.md`.
4. **The serializer harness has not been re-run** since the residual-gap commits
   landed. Row `1`'s original defect was measured end to end (5 of 5 wedged on
   the shipped build, 0 of 5 on the fixed one); `1`'s residual, `1b` and `9` are
   source-reasoned and covered by unit tests and a clean build. Re-running is
   cheap — `host32.exe --probe 1x2x3x --iterations 5`, per
   [README.md](./README.md) — and it is the difference between "mitigated,
   measured" and "mitigated, reasoned" for the two rows the headline claim rests
   on.
5. **The serializer path has never been wedged with the engine log on**, so the
   signals [TRIAGE.md](./TRIAGE.md) tells a responder to read at the moment of a
   wedge are what the source predicts, not what was observed.
6. **One unattributed observation** — the 60 ms poller recorded
   clear-and-reassert transients during three OSK cases that the engine log does
   not account for. See [Evidence](#evidence).

Items 1 and 2 are **accepted, not fixed**, under FR-011b, each carrying a complete
draft in [`issues/`](./issues/). Item 3 is the filing itself. So the outcome to
claim is **#8064 mitigated, with 4 producers drafted** — and never "#8064
closed", which would be honest only at `N = 0`. `N` is 4: rows `2c` and `8` are
unmitigated on every build, and rows `2a`/`2b` are unmitigated on every
*released* build. Prevention is complete in the sense this document set out to
establish — every path enumerated, every verdict evidenced by a fix, a draft, or
an observation — and the four drafted rows are named, not absorbed. That is the
claim to make, and no more: see
[A recurrence is triaged, not assumed to be a regression](#a-recurrence-is-triaged-not-assumed-to-be-a-regression).

## The producers

| # | path | emits | mitigation | verdict | evidence |
|---|---|---|---|---|---|
| 1 | serializer batch restore — `keybd_shift_reset` (`keyman32/keybd_shift.cpp`), called from `PrepareInjectedInputBatch`, emitted by `SendInput` (`serialkeyeventserver.cpp`) | modifier KEYDOWNs from the cache, no queued KEYUP | `ReconcileModifierCache` before the restore loop; `ComputeModifierReleaseState` for the release half; `PrepareModifierVerificationCorrection` after the batch, scheduled via the self-posted `WM_KEYMAN_VERIFY_MODIFIER_EVENT` | **mitigated** — measured for the original gap, source-reasoned for the residual | The reconcile runs before the restore loop, so a byte that was already stale when the batch began is cleared, and the restore half is handed `kbd`, never `releaseState`. Pinned by `PREPARE_INJECTED_INPUT_BATCH.*`. Measured end to end: `host32.exe --probe 1x2x3x --iterations 5` wedged Shift on 5 of 5 iterations against the shipped build and 0 of 5 against the fixed build, reports in `evidence/`. **The residual the reconcile cannot see**: a byte the *same batch* makes stale. The `WM_KEYMAN_MODIFIER_EVENT` post feeds the cache from the user's own release before the pass-through check later in the hook, so a release that races a batch in flight leaves the restore press outliving it — cache says up, OS says held, and `ReconcileModifierCache` cannot see it because cache and OS now *agree*. `PrepareModifierVerificationCorrection` runs **behind** every already-queued `WM_KEYMAN_MODIFIER_EVENT` (posted-message FIFO), rechecks exactly the VKs the restore half touched, and injects a corrective KEYUP for any the OS still holds that the cache no longer claims. Pinned by `PREPARE_MODIFIER_VERIFICATION_CORRECTION.*`. Its own residual is in its doc comment: a user re-press landing between the verify post and its dispatch is itself released — an unmatched KEYUP, the safe-direction error. The FIFO guarantee is **posted-to-posted only**: `WM_INPUT` is retrieved in the input class, *behind* posted messages regardless of arrival time, so the user-held signal FR-103a consults could be missing a KEYUP older than the verify message itself and would then decline the correction. `ProcessModifierVerification` drains pending `WM_INPUT` (`DrainPendingRawInput`) before reading the signal |
| 1b | **the pass-through race** — mstsc/RDP (`hs->dwExtraInfo != 0`), the touch panel, console focus (`IsConsoleWindow`), or a `GetGUIThreadInfo` failure route the user's own modifier event through `CallNextHookEx` instead of Keyman's eat-and-reinject path, while the earlier unconditional `if (isModifierKey(hs->vkCode))` block still feeds the cache | the modifier is released natively, outside Keyman's control, while a batch's own restore press for the same VK can still land afterward | the same `PrepareModifierVerificationCorrection` pass as row 1, which does not care which mechanism produced the disagreement | **mitigated**, source-reasoned | A distinct mechanism from row 1's — native pass-through, not a race inside Keyman's own eat/reinject cycle — that happens to close under the same fix, listed separately so it is not folded into row 1's evidence unnamed. Mechanism at the `dwExtraInfo`/`SCAN_FLAG_KEYMAN_KEY_EVENT`/`VK_PROCESSKEY`/`VK_PACKET`/`!isKeymanKeyboardActive` check, the touch-panel check, and the `GetGUIThreadInfo` + `IsConsoleWindow` block in `k32_lowlevelkeyboardhook.cpp` |
| 1c | **the release/restore asymmetry inside one batch** — the release half is derived from **live OS state** (`CaptureLiveModifierState`, then `keybd_shift(..., FALSE, live)`; `keyman32/keybd_shift.cpp:349,422`), the restore half from the **modifier cache** (`keybd_shift(..., TRUE, kbd)`; `keybd_shift.cpp:438`), both inside `PrepareInjectedInputBatch` | **nothing unmatched — this row is the inverse, and it is here because the inverse has a user-visible cost too.** A modifier the OS reports held that the cache does not claim is released by the release half and never pressed back by the restore half. **That hold is dropped**: the user experiences a modifier that went dead under their finger, and it stays dead until they let go and press it again | none, and deliberately none — the behaviour is correct and unchanged (FR-001). What was added instead is a **detection signal**, so the drop stops being silent (FR-002, FR-006). `ReleasedWithoutCacheClaim` (`serialkeyeventcommon.h:142`) is emitted once per VK, **naming the modifier**, whenever the release set holds a VK the cache does not claim (`keybd_shift.cpp:409-415`; guarded on `feedIsConfigured`, because with the feed off both halves read the same `kbd` and the condition cannot arise). `PossibleDesktopSwitch` (`serialkeyeventcommon.h:162`) is emitted **once per batch, with `vk = 0`** — per `contracts/modifier-state.md` §4 — when all six managed modifiers read up live while the cache claims **two or more** held; which keys were lost is named by `ReconcileModifierCache`'s own per-VK clearing lines immediately below it (`keybd_shift.cpp:364-384`) — the shape a desktop switch leaves, and the one state `ReconcileModifierCache` is structurally blind to forever, since it tests for cache-up-and-live-down and this *is* cache-up-and-live-down. Two or more, never one: exactly one modifier held at launch and released before the feed was live is the ordinary launch-seed case, and firing there would cry wolf every session. Production binds `ReportModifierDiagnostic` (`serialkeyeventserver.cpp:54-74`, bound at `:469`), a thunk over `SendDebugMessageFormat`, so both codes reach a debug/ETW trace — that is what a support engineer greps | **cannot latch** — **a deliberate accepted cost, scored so it is not invisible** (FR-004), not a producer that got a pass. Rests on a **structural literal**: the only modifier event the release half emits carries `KEYEVENTF_KEYUP` as a literal (`keybd_shift.cpp:158`; the prefix pair beside it is row `5`'s), so the failure direction is a *missing press*, never an extra one. Accepted, not fixed, and carries **no issue number** — unlike rows `2c` and `8` it is not a defect awaiting a decision but a trade with a recorded refutation on each side. Read it with the *Verdicts* definition, not as "harmless": it cannot strand a modifier, which is the only question this table asks | Both live-state-only alternatives are refuted in `specs/003-8064-audit-closeout/spec.md` under *Rejected alternatives*. **Releasing on the cache alone** reinstates `002/FR-001`'s target: a lost KEYDOWN leaves Keyman believing nothing is held, so it does not release before emitting Backspace, and **Ctrl+Backspace deletes a whole word while Alt+Backspace triggers Undo** — trading a recoverable dropped hold for silent text destruction, the wrong direction. **Restoring from live state** is refuted by trace as a **no-op**: the restore press is itself what makes the live reading held while the cache still does not claim the VK, which is exactly the condition `PrepareModifierVerificationCorrection` releases (`keybd_shift.cpp:512-516`), so the net state is identical at the cost of two extra injected events — and making it stick means exempting those VKs from the verification pass, an unmatched press with no correction, #8064 itself, unclearable on hardware with no physical Right Ctrl. **So losing a hold is the accepted direction; manufacturing a press is never one** (the same sentence stands in the code at `keybd_shift.cpp:397-398`). The window where it bites is where the cache feed never saw the KEYDOWN: a console window, the secure desktop (UAC), and row `1b`'s pass-through paths. **This row also covers the OSK's `FinalState` drop** (`viskbd/UfrmOSKOnScreenKeyboard.pas:142-157`) — the same trade in miniature on the Delphi side, and there **not** signalled. [Finding 6](#finding-6) |
| 2a | **OSK sticky modifier click** — `kbdShiftChange` → `ShiftStateChange` → `PrepState` → `do_keybd_event` (`viskbd/UfrmOSKOnScreenKeyboard.pas`, `OnScreenKeyboard.pas:117-121`) | a real chiral modifier KEYDOWN with **no KEYUP anywhere in the call** — `ShiftStateChange` invokes only `PrepState`, never `FinalState`. Deliberate: a sticky OSK modifier is *meant* to be real machine-wide | `TfrmVisualKeyboard.FormDestroy` → `ResetShiftStates` covers every dismissal path (`cd2bd44dd0`); `ResetShiftStates` releases by exact chiral identity from `FCachedShiftState`, gated on live `GetAsyncKeyState`, instead of routing through `ShiftStateChange`'s regime-derived VK selection; the live click-off does the same. [Finding 1](#finding-1) | **mitigated, draft carried in-tree** — measured. Fixed on this branch; the draft exists because every *released* build still carries the defect: [`issues/issue-1-osk-release-chirality.md`](./issues/issue-1-osk-release-chirality.md), filed for the record on the day the #8064 PR is submitted | All three gaps in this family are fixed, and each was confirmed by an executed reproduction rather than a source read: the teardown-dismissal case ([Finding 1](#finding-1)), the stale-async restore race ([Finding 4a](#finding-4)), and the live click-off ([Finding 4b](#finding-4)). Both release paths release by recorded chiral identity, verified through a `SetLRShift` collapse in **both** directions — True→False via the click-off, False→True via teardown. The run also caught an I2177 regression the teardown fix had introduced, fixed in `4ca0945a12` |
| 2b | **OSK `ResetShiftStates` itself** | previously a bare modifier KEYDOWN on the cleanup path, from a stale `FShiftState`/`kbd.ShiftState` mismatch inside the 50 ms window | the rewrite: `ReleaseCached` only ever calls `do_keybd_event` with `KEYEVENTF_KEYUP` baked into its flags, so there is no press branch left in the function at all | **mitigated, draft carried in-tree** — measured. Fixed on this branch; the draft exists because every *released* build still carries the defect: [`issues/issue-2-osk-resetshiftstates-press.md`](./issues/issue-2-osk-resetshiftstates-press.md), filed for the record on the day the #8064 PR is submitted | Structurally impossible rather than timing-avoided. Steps 2, 3 and 5 of the manual sequence exercise the path and pass, and the `KLOGGING` traces show the teardown emitting only `KEYUP` (`flags=2`/`flags=3`), never a press, in every recorded run |
| 2c | **process termination while an OSK sticky modifier is held** — `TerminateProcess`/Task Manager "End task", or the Sentry crash handler (`sceaTerminate`), skip Delphi destructors entirely | whatever chiral modifier KEYDOWN was last injected by an OSK sticky click, with the matching KEYUP now unreachable in-process | none in-process; user-level only. See the recovery caveat | **UNMITIGATED** — issue drafted, pending filing: [`issues/issue-3-osk-sticky-stranded-by-kill.md`](./issues/issue-3-osk-sticky-stranded-by-kill.md). No fix attempted; in scope to draft and out of scope to fix for the #8064 work ([Finding 5](#finding-5)) | `sceaTerminate` skips `FormDestroy`/`ResetShiftStates`; no persisted record of an outstanding sticky modifier survives process death; no startup reconciliation exists. **Recovery caveat:** on this branch either route recovers — reopening the OSK and dismissing it, or clicking the modifier off. On **any released build** only dismissal does, because a click-off there goes through the unfixed regime-derived path and can release the wrong chiral VK. The advice that holds on both builds, and the one to give a user whose version you do not know, is: reopen the OSK, then dismiss it (any path) **without** first trying to click the stuck modifier off by hand. On hardware with no physical Right Ctrl/Right Alt key that is the only in-process recovery; a reboot is the fallback if the OSK cannot be reopened |
| 3 | language-switch shift release — `keyman32/kmhook_keyboard.cpp:147` | `keybd_event(VK_SHIFT, 0xFF, KEYEVENTF_KEYUP, 0)` | none needed | **cannot latch** | `KEYEVENTF_KEYUP` is a literal in the only call in the file. An unmatched KEYUP asserts nothing |
| 4 | Caps Lock sync — `keyman32/kmprocessactions.cpp:101-102` | `VK_CAPITAL` down then up | adjacency | **cannot latch** | Both statements unconditional and adjacent inside one `if`; no return or call between them, and `keybd_event` is `void WINAPI` so cannot throw. Also outside the managed six |
| 5 | `PostDummyKeyEvent` — `keyman32/keyman32.cpp:923-926` | prefix VK down then up | adjacency | **cannot latch** | Same structure. `Globals::get_vk_prefix()` is registry-overridable and could in principle be a modifier VK, but the pair stays balanced either way |
| 6 | user-event re-injection — `serialkeyeventserver.cpp`, `UpdateLocalModifierState` | mirrors the user's own event | the mirror itself | **cannot latch**, measured | **Runtime-confirmed 2026-08-28**, the one `cannot latch` row that rested on inference rather than on a literal. Two instruments straddle the `PostMessage` handoff: `"Modifier cache feed posted [vkCode:%x isUp:%d]"` at the hook (`k32_lowlevelkeyboardhook.cpp:215`) for the source direction, and `SerialKeyEventServer::WndProc`'s `wParam`/`lParam` (`serialkeyeventserver.cpp:469`) for the mirrored one. **17 feed posts, 17 serializer passes, matched in order, 0 mismatches**; across both captures 65 modifier-VK passes carried a low word of only `0x0000`, `0x0002` or `0x0003` and never anything else. The source reading it replaces: `dwFlags = lParam & 0xFFFF`, `lParam` from `LLKHFFlagstoWMKeymanKeyEventFlags`, which sets `KEYEVENTF_KEYUP` iff `LLKHF_UP`. Two statements between the observed frame and the callee remain read rather than observed — as close as the code allows without adding a log line (`evidence/path6-cannot-latch-2026-08-28.md` Findings A and B) |
| 7 | AltGr Left Ctrl simulation — `serialkeyeventserver.cpp`, the same batch path as row 1 | two **releases** | none needed | **cannot latch** | `KEYEVENTF_KEYUP` literal in the branch that requires it in `lParam`. Both events are releases by construction |
| 8 | `AIWin2000Unicode::PostKeys` — `keyman32/appint/aiWin2000Unicode.cpp:138-153` | `QIT_VKEYDOWN` writes a KEYDOWN whose KEYUP exists only if a separate `QIT_VKEYUP` follows; VK is `Queue[n].dwData & 0xFF` | the sole producer queues a balanced pair (`kmprocess.cpp:181-182`) | **UNMITIGATED** (contrived) — issue drafted, pending filing: [`issues/issue-4-postkeys-pair-split.md`](./issues/issue-4-postkeys-pair-split.md). No fix attempted. [Finding 3](#finding-3) | Three unguarded truncation points can split the pair: `QueueAction` returns FALSE at `MAXACTIONQUEUE` and the result is ignored (`appint.cpp:51-57`); `SignalServer` silently clamps to 256 (`serialkeyeventclient.cpp:87-90`); the output-key copy stops at `MAX_KEYEVENT_INPUTS - MAX_KEYEVENT_INPUTS_MODIFIERS` with nothing preventing a pair straddling the bound |
| 9 | **eaten-event pipeline loss** — the hook ate every serialized key event once it decided to hand it to the serializer, before confirming the handoff succeeded | if the `PostMessage(hwndServer, WM_KEYMAN_KEY_EVENT, ...)` handoff failed — `hwndServer == NULL` during server startup/shutdown, a full posted-message queue, or a client wedged holding `KeymanEngine_KeyMutex` while `ProcessQueuedKeyEvents` waits `INFINITE` on it — the real key event was destroyed outright. For a modifier KEYUP that meant the OS kept an earlier re-injected KEYDOWN latched, the cache still said down, cache and OS agreed, and the clear-only reconcile could never see it again | the hook now eats the event only once `PostMessage` to a **non-NULL** server window has succeeded; otherwise it falls through to `CallNextHookEx`, so the keystroke reaches the app unserialized rather than being lost. The same NULL-window guard covers the modifier cache-feed post | **mitigated**, source-reasoned and covered by a clean warnings-as-errors build, not by a test that forces the handoff to fail | This closes the *loss* half — the event is no longer silently destroyed — but not *why* a handoff can fail. `ProcessQueuedKeyEvents` waiting `INFINITE` on `KeymanEngine_KeyMutex`, and `MessageLoop` returning on the exit event with events still pending, remain the underlying reasons a handoff degrades. They are what the hook now degrades safely into, not reasons that have been removed |
| A8 | **the standalone correction's prefix pair** — `PrepareModifierVerificationCorrection` (`keyman32/keybd_shift.cpp:530`) emits through `keybd_shift_release`, which sent `keybd_sendprefix`'s `vk_prefix` down/up pair (`keybd_shift.cpp:118-126`, the two `do_keybd_event` calls at `:122-123`) ahead of the first release on **every** standalone correction | a `vk_prefix` KEYDOWN **and its adjacent KEYUP** — balanced, but landing in whatever had focus by the time the self-posted `WM_KEYMAN_VERIFY_MODIFIER_EVENT` was dispatched, not inside Keyman's own transaction the way the batch's prefix does. The prefix VK is registry-overridable (`REGSZ_ZapVirtualKeyCode`, `k32_globals.cpp:377-378`), so it **cannot be assumed unassigned** on every machine | **implemented on this branch.** `keybd_shift_release` now takes `sendPrefix`, defaulted TRUE so the batch path is untouched (`keybd_shift.cpp:147`; the gate is at `:153-156`), and the correction passes it only when an Alt-family VK is in the correction set — `hasAlt` over `VK_LMENU`/`VK_RMENU`, then `keybd_shift_release(pInputs, &n, correction, hasAlt)` (`keybd_shift.cpp:576-578`). **Any** Alt in the set, not just the first VK in it: Shift sorts before Alt in `KeymanModifierVks`, so a first-VK test would suppress the prefix on exactly the Shift+Alt correction that needs it | **cannot latch** — a **stray-input** finding, not a stuck-modifier one, scored here so that distinction is visible rather than used as a reason to leave it out (FR-014) | Rests on a **structural literal**: the pair is two unconditional adjacent statements in `keybd_sendprefix` (`keybd_shift.cpp:122-123`) with nothing between them and the second carrying `KEYEVENTF_KEYUP` — the same structure that decides rows `4` and `5`. So the cost was never a latch; it was a keystroke delivered into a document, and the prefix exists for exactly one reason — an isolated **Alt** release opens the window menu — which is why the condition is Alt-family membership and not "anything is being released". A correction releasing only Shift or only Ctrl needs no protection from a menu that cannot open, and now sends nothing at all. Pinned by `PREPARE_MODIFIER_VERIFICATION_CORRECTION.AShiftOnlyCorrectionSendsNoPrefixKeystroke`, `.AnAltCorrectionStillSendsThePrefixKeystroke`, `.ACorrectionContainingAnyAltSendsThePrefixKeystroke` and `PREPARE_INJECTED_INPUT_BATCH.TheBatchReleaseHalfStillSendsItsPrefixForAShiftOnlyRelease` — **no recorded green run of these four is in `evidence/` yet**; the last full gate on record (`evidence/run-gate-x86-2026-08-28.txt`, and the 71-test re-count in `evidence/session0-default-target-2026-08-28.txt`) predates them |
| A9 | **the batch's own short send** — `SendInput` in `SerialKeyEventServer` (`serialkeyeventserver.cpp:668`) was checked as `== 0`, which is false only for a *total* failure and says nothing about a **partial** one | nothing new of its own, and that is what made it easy to miss. The restore KEYDOWNs are laid down **last** (`keybd_shift.cpp:468`), so a short send drops exactly those presses — while `restorePressedMask` still named them. The verification pass corrects on cache-up-and-live-down, and for a press that was never sent live *is* down, so it would have released a modifier on the strength of an event the OS never received: a **dropped hold** in row `1c`'s family, needing no stall and no hook eviction | **fixed on this branch.** The check is now `sent != m_nInputs`, reported with **both** counts because "SendInput failed" and "SendInput sent 251 of 256" need different responses and `GetLastError` does not distinguish them (`serialkeyeventserver.cpp:668-671`); and `PrepareInjectedInputBatch` reports a per-bit `pRestoreEventIndex` — the buffer index of each restore KEYDOWN, recorded at the point of emission (`keybd_shift.cpp:313-330`, filled at `:468`, held in `m_restoreEventIndex`, `serialkeyeventserver.cpp:141`) — so the caller clears **exactly** the mask bits whose press fell at or past the send boundary (`serialkeyeventserver.cpp:677-685`) | **mitigated**, source-reasoned | **Exact, not conservative, and that is the whole reason the indices are carried.** Clearing the whole mask on any short send would suppress the correction for the presses that *did* land, which is a second dropped hold rather than a fix for the first — the same sentence stands in the code at `serialkeyeventserver.cpp:673-676`. The old check conceded the gap in its own comment ("not a latch source: the restore KEYDOWNs are last, so truncation drops presses, never releases"), which is true about latching and false about the mask; the deleted line is in `git diff` on this branch. Pinned by `PREPARE_INJECTED_INPUT_BATCH.EachRestorePressIsLocatableInTheBufferSoAShortSendIsExact`, which asserts every restore press is locatable; **no recorded green run of it is in `evidence/` yet**, and no test forces a real `SendInput` to send short |
| — | `USendInputString` — `global/delphi/general/USendInputString.pas:60` | `KEYEVENTF_UNICODE` with `ki.wVk := 0` always | n/a | **cannot latch** | Cannot express a modifier VK at all |

<a name="feed-dead"></a>

### The feed can be dead while the flag says it is on — not a producer, and behind row `1`

**Read this with rows `1`, `1b` and `1c`, and with [Finding 6](#finding-6).** Each
of them assumes the modifier cache is being fed. `feedIsConfigured` says the feed
is *configured*, never that it is *working*, and the parameter's own declaration
names three same-process ways it reads TRUE while the feed is dead
(`serialkeyeventcommon.h:209-217`): `InitHooks()`'s return value is discarded
(`keyman32.cpp:401`), `FSingleApp=TRUE` makes the global-only low level install
structurally fail (`keyman32.cpp:279,367`), and Windows' silent hook removal is
not detected until a later keystroke observes the gap
(`LowLevelHookWatchDog.cpp`).

The first of those now has a paste-ready draft:
[`issues/issue-5-inithooks-return-value-discarded.md`](./issues/issue-5-inithooks-return-value-discarded.md)
(FR-015d). `Keyman_Initialise` calls `InitHooks()` at `keyman32.cpp:401`, ignores
what it returns, sets `Keyman_Initialised` TRUE and returns TRUE whether three
hooks installed, one, or none — so a failed hook installation is silent, and the
low level keyboard hook is the cache's **only** feed.

**It gets no row, and that is deliberate.** This table scores paths that can
*emit* a modifier KEYDOWN, and this one emits nothing at all. What it does is
remove the feed underneath row `1`'s mitigation while row `1`'s premise still
reads TRUE: with no feed the cache can only decay towards empty, so the release
half releases from
live state what the restore half will not press back — row `1c`'s accepted trade,
except arrived at by a broken assumption rather than by a choice, and biting a
modifier the user is genuinely holding. Inventing a producer row for it would put
a stuck-modifier verdict on something whose failure direction is an unmatched
**KEYUP**.

Out of scope for a fix here, on the same terms as row `2c` — see *Out of Scope* in
`specs/003-8064-audit-closeout/spec.md`, which links the draft — and it does not
change `N`: the draft is the fifth in [`issues/`](./issues/), and the four in
*mitigated, with 4 producers drafted* are the producer rows `2a`, `2b`, `2c` and
`8`.

### Known theoretical gap, not a producer, deliberately not hardened

**Generic-VK reconcile.** `isModifierKey` accepts nine VKs at the hook — the six
chiral ones plus generic `VK_SHIFT`/`VK_CONTROL`/`VK_MENU`, "because perhaps
some app will send them through `SendInput`" (comment on
`UpdateModifierCacheFromKeyEvent`). `CaptureLiveModifierState` only ever reads
the six chiral VKs. If a third party's `SendInput(wVk=VK_SHIFT, wScan=0)` set the
generic async key state without Windows also asserting the chiral one,
`ReconcileModifierCache` could erase a cache byte a generic injection had just
set correctly.

**Not exercised, and now that is a count rather than an expectation.** Neither
2026-08-28 capture contains a single serializer pass for generic `0x10`, `0x11` or
`0x12` — 151 passes, every one chiral or non-modifier
(`evidence/path6-cannot-latch-2026-08-28.md` Finding E). The gap stays
theoretical.

This is **not a new producer** — it would be a false-clear in the reconcile,
which can only ever turn into a skipped restore or an extra release, never an
unmatched KEYDOWN — so it gets no table row and no issue. The reasoning is
recorded in `keybd_shift.cpp` above `CaptureLiveModifierState` and pinned from
two sides: `MODIFIER_CACHE_EVENT_ORDER.GenericVkEventReconcilesAgainstTheChiralLiveReading`
proves the reconcile is correct **given** the chirality assumption, and
`GenericShiftSendInputReflectsInBothAsyncKeyStates` measures whether the
assumption itself holds. The second is in the suite, not `DISABLED_`, gated on a
runtime hook-round-trip capability check that logs a WARNING and `SUCCEED()`s
where the capability is absent — so it runs, but whether it *evaluated* on a
given run is visible only in that run's log, not in the pass count.

**It evaluated on 2026-08-27, and the assumption holds.** A generic
`SendInput(wVk=VK_SHIFT, wScan=0)` read back as `VK_LSHIFT=0x8001` with the hook
observing `vk=0xA0` — Windows resolves the side on the way in. Recorded, with
the other two capability-gated probes, in
[`evidence/run-capability-probes-2026-08-27.txt`](evidence/run-capability-probes-2026-08-27.txt).
So this gap is measured shut on this machine, not merely argued shut; the probe
remains the guard against a future Windows changing it.

If that probe ever shows the assumption false, the fix is sketched in the same
comment: OR the generic reading into both chiral halves when neither already
reports held. It was not added speculatively against an unconfirmed claim.

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

**Mechanism.** `SetLRShift`
(`common/windows/delphi/components/OnScreenKeyboard.pas:885-937`) collapses
chirality when `LRShift` goes False, rewriting
`FShiftState - [essLCtrl, essRCtrl] + [essCtrl]`. So: click R Ctrl on an AltGr
visual keyboard, then select a non-AltGr one. `kbd.ShiftState` now says
`essCtrl`, and any release derived from that representation goes out as
`VK_CONTROL` — Left — while the real, stuck key is extended `VK_RCONTROL`,
unclearable on hardware without that physical key.

**`tmrCheckTimer` is not a mitigation for this.** It runs every 50 ms
(`UfrmOSKOnScreenKeyboard.dfm:37-42`; no `Enabled` property, so it defaults on,
and nothing in the tree ever writes `tmrCheck.Enabled`). But it reconciles the
OSK's *cache* **toward** the OS, never the reverse: absorbing live state
unconditionally, and emitting a key event only when the both-chiral-Alt or
both-chiral-Ctrl collapse guard fires. For a single stuck modifier the timer
emits nothing — and once `FShiftState` has absorbed the stuck bit, the
`GetAsyncShiftState <> FShiftState` guard means the handler stops doing anything
at all. Cache and OS agree, forever. **The timer cannot clear a modifier the OS
agrees is down, which is exactly this failure mode.**

**Before this branch**, two things went wrong independently. Cleanup was reached
only from `TfrmVisualKeyboard.FormClose`, so every dismissal except the X button
and a tab switch bypassed it. And when it did run, `ResetShiftStates` routed
through `ShiftStateChange`, which branches on the current `kbd.LRShift`, so after
a collapse it released the wrong side.

**On this branch**, `FormDestroy` also calls `ResetShiftStates`, which covers
`Release`, `FreeAndNil` and `Close`/`FormClose` alike. And `ResetShiftStates` no
longer routes through `ShiftStateChange` at all: it releases each of the seven
cached identities directly via a nested `ReleaseCached(shift, vk, extended)`,
gated on `shift in FCachedShiftState` — only true for something the OSK itself
clicked — **and** on a live `GetAsyncKeyState(vk)` check, which is what makes a
second call a no-op.

**Those two gates were once described here as preserving the I2177 guarantee
that a physically-held modifier is never touched. They do not, and the claim is
withdrawn.** Cache membership proves the OSK *pressed* the key; it does not prove
the OSK is the only thing *holding* it, because Windows keeps one down state per
key and not one per holder. If the user physically presses the same modifier
after the sticky click, the live read is down for two reasons at once and the
teardown `KEYUP` cancels the user's hold along with the OSK's press — the
modifier goes dead in the user's hand until they release and press it again.
Neither gate can see the difference: membership was decided before the user's
press, and the live read cannot count holders.

What carries the guarantee now is `FUserHeldShiftState`, fed from the
`WM_KEYMAN_OSK_MODIFIER_EVENT` hook feed in `UpdateUserHeldModifiers` — the only
place the overlap is observable at all, since polling sees a key that is already
down. The OSK's own events are excluded by an explicit injection ledger
(`FOskPendingEcho`) rather than by scan code, because this document's own
measurement is that `scan == 0` identifies a `bScan = 0` injector but the
converse does not hold, so a scan test would let the OSK's echo mark its own key
user-held and strand it. `ResetShiftStates` declines the `KEYUP` on an overlap
and emits it otherwise. The asymmetry that makes declining correct: the user's
own physical release clears the single shared down state and takes the OSK's
press with it, so a decline costs nothing, while a release is unrecoverable
without user action. The suppression is matched to the key the `KEYUP` actually
lands on, never to the family — a family test would let a Left Ctrl hold suppress
a Right Ctrl release, which is the one identity a user without that physical key
cannot clear. `FCachedShiftState` is written only by a live click
and is never touched by `SetLRShift`'s collapse, so it still names the exact
chiral VK that was injected regardless of what `kbd.ShiftState`/`kbd.LRShift` say
by the time teardown runs. The function can only emit a `KEYUP` — there is no
press branch left in it, which also closes row `2b` structurally.

`kbd.ShiftState` is cleared afterward, widened across the whole Ctrl/Alt family
before subtracting since the cache may name a modifier in a representation
`SetLRShift` has since collapsed or expanded, then `FCachedShiftState := []`,
preserving the idempotency contract. A trailing `UpdateKeyboard(False)` makes the
OSK's own rendering pick up the cleared state.

<a name="finding-4"></a>

### Finding 4 — two further OSK gaps

**4a — `kbdKeyPressed` restored from a stale async sample.** `FinalState`
(nested in `kbdKeyPressed`) samples `ass := GetAsyncShiftState` once, before the
character keydown/keyup and the `koReleaseShiftKeysAfterKeyPress` COM property
read that follow. If the user physically released a modifier in that window, the
restore-press branch re-pressed it from the stale sample with nothing left to
match it with a KEYUP — a genuine unmatched KEYDOWN in the #8064 class, on a path
this document had not previously enumerated. Now fixed by a live
`GetAsyncKeyState` re-check immediately before that one press call. The
release-of-our-own-temporary-press branch just above it needs no such check,
since undoing Keyman's own temporary press is safe regardless of what happens
physically in between.

Alongside it, `kbd.LRShift` is now sampled once into a local `LLRShift` at entry
and used for both the `PrepState` and `FinalState` branch selection, instead of
being re-read live for each. `fkcss`/`ass` are frozen snapshots taken under
whatever regime was current at entry; if `kbd.LRShift` were re-read separately
for `FinalState` after a keyboard switch landed mid-keystroke, `FinalState` could
select `essCtrl`/`essAlt` while `fkcss`/`ass` still encoded the chiral variants,
and a `PrepState` suppression could go unrestored under a membership test that
would never match.

**4b — the live click-off released by the wrong chirality.**
`kbdShiftChange` → `ShiftStateChange` is reached both from an explicit OSK click
and from `UpdateShiftStates`' 50 ms resync. `ShiftStateChange` selected the
release VK from the *current* `kbd.LRShift` — the same flaw `ResetShiftStates`
had. So after a `SetLRShift` collapse, a user who clicked the now-generic "Ctrl"
key on the OSK to toggle it off *before* dismissing got the wrong-chirality
release: unextended `VK_CONTROL` went out, and the actually-stuck extended
`VK_RCONTROL` stayed held.

Now fixed: `ShiftStateChange`'s release branch consults `FCachedShiftState` for
the identity that was injected, and falls back to the regime-derived `vk` when
the cache names nothing in the family, so the OSK-did-not-press-it case is
unchanged. The one write it makes is a **removal** of what it released.

Two things the fix depends on, both easy to get wrong:

- `ShiftStateChange` must run **before** `kbdShiftChange`'s mask. After a
  collapse, a click-off leaves `fkcss` carrying nothing from that family, so
  `* fkcss` strips `essRCtrl` from the cache one line before the release would
  read it. With the mask first, the click-off falls back to unextended
  `VK_CONTROL` and leaves extended `VK_RCONTROL` held — the very defect the
  release branch exists to fix (`ea530407c2` reordered the two).
- the mask must widen across the Ctrl/Alt families, or a still-held chiral entry
  is dropped merely because an unrelated modifier was clicked under a new regime.

<a name="finding-3"></a>

### Finding 3 — `PostKeys` pair-splitting, contrived but not impossible

Unchanged by this branch. `QIT_VKEYDOWN` (`aiWin2000Unicode.cpp:138-153`) emits a
KEYDOWN for an unconstrained VK. Its only production producer queues a balanced
pair (`kmprocess.cpp:181-182`), and `calldll.cpp:126-135` refuses any VK that is
not the current key — but three separate truncation points can drop the KEYUP
half, and none checks or reports it.

Reachability is narrow. `aiTIP.cpp:186-202` returns early for `VK_MENU` and
`VK_CONTROL` before `_td->state.vkey` is assigned, but **`VK_SHIFT` falls
through**. So the emission is `VK_SHIFT` in practice, which maps to Left
Shift — releasable on every keyboard, and therefore not the unproducible-KEYUP
shape. It is recorded as `UNMITIGATED` rather than `cannot latch` because the
pair-splitting is genuinely unguarded, not because a latch has been observed.

**"Contrived" is about the split, not about reaching the code.** `PostKeys`
logged **245 times** in a single five-iteration probe run
(`evidence/path6-cannot-latch-2026-08-28.md` Finding F) — it is on the hot path
constantly. What is contrived is *splitting the KEYDOWN/KEYUP pair* under queue
truncation. Anyone reading `UNMITIGATED (contrived)` as "hardly ever runs" has
misread the row, and the issue draft says so too.

**Source alone cannot settle** whether the required conditions are co-reachable:
a legacy/ANSI target, `use(final)`, 248 or more output events, and `VK_SHIFT`.
The runtime observation that would settle it: with `debug=1`, drive such a
target with a keyboard whose Shift rule outputs 250 or more characters and look
for `"Too many INPUT events for queue"` (`serialkeyeventclient.cpp:88-90`)
immediately followed by a `VK_SHIFT` down with no matching up. The 2026-08-28 run
did **not** meet those conditions — no truncation line appears in either
capture — so the split itself is still unobserved.

<a name="finding-5"></a>

### Finding 5 — process kill or crash strands an OSK sticky modifier, with no in-process recovery

**Not recoverable automatically.** `TerminateProcess` and the Sentry crash
handler's `sceaTerminate` path both skip Delphi destructors, so
`ResetShiftStates` never runs and nothing is flushed. No persisted record
(registry/disk) of an outstanding sticky modifier survives the process boundary.
No watchdog.

**User-facing recovery, in order of reliability:**

1. If the stuck key has a physical counterpart on the user's keyboard, pressing
   and releasing that *same physical key* clears it directly. Works for any of
   the six chiral VKs, including Right Ctrl/Alt, **if the hardware has that
   key**.
2. On hardware without that physical key: reopen Keyman's OSK and **dismiss it**
   (any path — X button, tab switch, tray menu). On a released build, do this
   **without** first clicking the stuck modifier by hand: that click routes
   through the unfixed click-off path and can release the wrong chiral VK.
   This route also depends on the fresh instance's `FCachedShiftState` naming
   the stuck identity, which it only does if the user re-clicks the same
   modifier — reopening the OSK does not by itself repopulate the cache for a
   modifier stranded by a *previous* process, because it starts empty. In that
   sub-case (fresh OSK, empty cache, nothing re-clicked) route 2 does not clear
   the modifier at all.
3. Otherwise: reboot.

**Explicitly rejected mitigation:** "release all managed modifiers at startup" —
would release a modifier the user is genuinely, physically holding down at the
moment Keyman launches, a new bug in the same family. No safe blind mitigation
was found. The two structurally-safe candidates are a persisted "outstanding
sticky modifier" record reconciled only against live `GetAsyncKeyState` at
startup, or a supervising watchdog process. Neither is attempted here.

<a name="finding-6"></a>

### Finding 6 — the batch drops a hold it cannot tell from a phantom, and now names it

Row `1c`. This is the one entry in the table that is **not** a defect and
**not** a candidate for a fix. It is a trade the engine makes on every batch, in
the direction this whole document argues for, and it is written down because a
trade nobody records is indistinguishable from an oversight the next reader
"corrects".

**Mechanism.** `PrepareInjectedInputBatch` (`keybd_shift.cpp:332`) lays a batch
down in three parts, and the two modifier halves read different sources:

| half | source | line |
|---|---|---|
| release | the **live OS** reading, `CaptureLiveModifierState` | `keybd_shift.cpp:349`, used at `:422` |
| restore | the **modifier cache**, `kbd` | `keybd_shift.cpp:438` |

So when the OS reports a modifier held that the cache does not claim, the
release half releases it and the restore half does not press it back. **That
hold is dropped.** Modifiers do not auto-repeat once another key becomes the
most-recently-pressed one, so nothing re-asserts it: what the user experiences
is a modifier that went dead while they were still holding it, until they let go
and press it again.

**Where it bites.** Wherever the cache feed never saw the KEYDOWN — a console
window, the secure desktop (UAC), and row `1b`'s pass-through paths. Note that
`feedIsConfigured` says the feed is *configured*, never that it is *working*
(`serialkeyeventcommon.h:209-217` lists three same-process ways it reads TRUE
while the feed is dead), so the trade bites hardest exactly where the cache is
least trustworthy — and the `!feedIsConfigured` degradation cannot help, because
with the feed off both halves read the same `kbd` and the condition cannot arise
at all.

**Both ways out are refuted, and that is what makes this a trade rather than a
gap.** Recorded in `specs/003-8064-audit-closeout/spec.md` under *Rejected
alternatives*:

- **Release from the cache alone**, so no held modifier is ever dropped.
  Refuted: it is the pre-branch behaviour and it reinstates `002/FR-001`'s
  target. A lost KEYDOWN leaves Keyman believing nothing is held, so it does not
  release before emitting Backspace — **Ctrl+Backspace deletes a whole word,
  Alt+Backspace triggers Undo**. Silent text destruction traded for a
  recoverable dropped hold is the wrong direction.
- **Restore from live state**, so the release is always balanced. Refuted by
  trace as a **no-op**: the restore press is itself what makes the live reading
  held while the cache still does not claim the VK, which is the condition
  `PrepareModifierVerificationCorrection` releases (`keybd_shift.cpp:512-516`),
  so the net state is identical at the cost of two extra injected events. Making
  it stick requires exempting those VKs from the verification pass, and that is
  an unmatched press with no correction — #8064 itself, unclearable on hardware
  with no physical Right Ctrl.

**Losing a hold is the accepted direction; manufacturing a press is never one.**
The same sentence stands in the code, at the FR-007a invariant
(`keybd_shift.cpp:397-398`), because an earlier draft violated it: skipping the
reconcile when the state looked like a desktop switch, while leaving the restore
half in, reintroduced #8064 with **cache and OS agreeing** — the one state
`ReconcileModifierCache` can never detect, since it tests for
cache-up-and-live-down and that is its opposite.

**The detection signal, which is what makes this a score rather than an
admission.** Two typed codes, `ModifierDiagnosticCode` in
`serialkeyeventcommon.h:132-163`, reported through the `PMODIFIERDIAGNOSTIC`
seam:

- **`ReleasedWithoutCacheClaim`** (`:142`) — emitted once per VK, **naming the
  modifier**, whenever the release set holds a VK the cache does not claim
  (`keybd_shift.cpp:409-415`). Guarded on `feedIsConfigured`, because reporting
  it on a degraded batch would be a lie about every degraded batch.
- **`PossibleDesktopSwitch`** (`:162`) — emitted **once per batch, with
  `vk = 0`**, when all six managed modifiers read up live while the cache claims
  **two or more** held (`keybd_shift.cpp:364-384`). Once per batch and not once
  per lost key, per `contracts/modifier-state.md` §4: the condition is a property
  of the batch, and `ReconcileModifierCache` already logs a `clearing vkey=` line
  for each byte it clears — which in this state is exactly the claimed set — so
  the per-key detail follows immediately either way. Two or more, never one: exactly one modifier
  held at launch and released before the feed was live is the ordinary
  launch-seed case the reconcile exists to clear, and firing there would put a
  warning in a normal session's log. A diagnostic that cries wolf is one nobody
  reads when it matters.

A **code and a VK, never a string**, so the wording can be rewritten without
turning the suite's assertions into tautologies. Production binds
`ReportModifierDiagnostic` (`serialkeyeventserver.cpp:54-74`, passed at `:469`),
a thunk over `SendDebugMessageFormat`, so both codes appear in a debug/ETW trace
— that is what a support engineer greps, and it is the whole of the remedy.

**What the signal is not.** It is not a mitigation and does not change a single
event: the desktop-switch guard runs **before** the reconcile precisely because
the reconcile is about to clear the bytes it reads, it emits and returns, and
the reconcile still runs (FR-007). The suite asserts unchanged behaviour
alongside each report, since a diagnostic that quietly altered the batch would
be a worse bug than the silence it replaced.

**The OSK half of the same trade, and there it is not signalled.** `FinalState`
(nested in `kbdKeyPressed`, `viskbd/UfrmOSKOnScreenKeyboard.pas:142-157`)
decides whether to re-press a modifier `PrepState` suppressed, from a
`GetAsyncKeyState` read taken *after* `PrepState` has already released the key
(`:153`). That read returns the same value for "the user let go" and "we
released it ourselves", so the safe direction is the only one available and the
hold is dropped — [Finding 4a](#finding-4)'s fix and this row's cost are the
same line of code seen from two sides. **The Delphi-side work of this spec is
not implemented on this branch** (no Delphi toolchain on the machine these runs
were made on), so score that half as *documented*, not *fixed*: no equivalent of
`ReportModifierDiagnostic` exists on the OSK path, and a dropped hold there
still leaves nothing in the log beyond the absence of a `keybd_event` line.

**Status of the signal itself, stated exactly.** The two codes, their emission
points and the production thunk are present in the working tree and
**uncommitted** at the time of writing. Red-first is recorded — the two positive
cases failed on `HEAD` and the three negative cases were green from the start,
in `evidence/us1-red-records-2026-08-28.md`. **A green run of
`MODIFIER_DIAGNOSTIC.*` is not yet in `evidence/`**: the last recorded full gate
(`evidence/run-gate-x86-2026-08-28.txt`, 72 tests from 12 test cases) predates
that suite, which is a thirteenth. The row's verdict does not rest on it —
`cannot latch` rests on the `KEYEVENTF_KEYUP` literal — but the *signal* is so
far source-verified and red-recorded, not green-recorded.

---

## The `FCachedShiftState` invariant

**Additive writes to `FCachedShiftState` are the hazard; reads and removals are
not.** Anyone changing the OSK modifier paths needs this, because it is what
keeps the two of them from composing into an I2177 regression — a teardown that
releases a key the user is physically holding.

`FCachedShiftState` must name **only what a click is holding**, never what the
user is physically holding. `ReleaseCached`'s `GetAsyncKeyState` gate cannot
enforce that: a physically-held key genuinely *is* down, so the gate passes and
the release goes through. The guarantee comes from the value instead —
`kbdShiftChange` records `(FCachedShiftState + (fkcss - ass)) * FMask`, and the
additive term `fkcss - ass` already excludes anything physically held.

The trap is that `UpdateShiftStates`' 50 ms resync ends with
`kbd.ShiftState := GetAsyncShiftState`, so `kbd.ShiftState` continuously carries
physically-held modifiers. Assigning it wholesale (`FCachedShiftState :=
kbd.ShiftState`) therefore caches `essShift` alongside the key actually clicked
whenever a click is made while the user holds Shift, and the next teardown
releases it. **The hazard travels in the value, not the call
path**: the resync never has to reach the handler to poison it, so "written from
a click and only from a click" is not a defence.

Two corollaries:

- A release path may **read** the cache to pick the right chiral VK, and may
  **remove** what it released. Removal can only make a later teardown release
  less, never more.
- A release path must not **write into** the cache. `ShiftStateChange` is called
  from the resync as well as from a click, and its press branch fires for
  modifiers the user is physically holding; a write from there is exactly how a
  physically-held key ends up recorded as OSK-outstanding.

Review a change to `ResetShiftStates`/teardown and a change to
`kbdShiftChange`/`ShiftStateChange` **together** against I2177. The hazard is in
what each writes for the other to read, not in either one's local correctness.

---

<a name="evidence"></a>

## Evidence

### Serializer path

`host32.exe --probe 1x2x3x --wait-for-rule 120 --iterations 5`, Left Shift held
and released 1500 ms into the stall, Windows 11 Pro 26200. Full reports in
`evidence/run-before-release-build.txt` and `evidence/run-after-branch-build.txt`.

| engine | modifier wedged |
|---|---|
| shipped build | **5/5 FAIL** |
| branch build | **0/5 PASS** |

Taken **without** the engine log on, and that is load-bearing rather than
incidental. The verdict is read from `GetAsyncKeyState`, so it does not depend on
the log — and it must not, because enabling the log closes the race window: the
same shipped build wedged 5/5 unlogged and 0/5 logged
(`evidence/serializer-signals-2026-08-28.md` Finding 1). The two runs have strictly
separate jobs. **Fix evidence is the unlogged pair above.** **Signal evidence is
the logged run**, 2026-08-28, recorded in
`evidence/serializer-signals-2026-08-28.md` and
`evidence/path6-cannot-latch-2026-08-28.md`, with its cited lines in
`evidence/dbgview-excerpt-2026-08-28.txt`. Citing the logged run's PASS as fix
evidence is a misreading — logging alone produces a PASS on the *unfixed* build.

### OSK path

Delphi 12.0 CE build of `keyman.exe`, 2026-08-27. Keyboards:
`sil_cameroon_qwerty` (its `.kvk` carries `<usealtgr/>`, so `kbd.LRShift` is True
and the OSK draws separate L/R Ctrl) and `akan` as the non-AltGr counterpart;
switching between them is what drives the `SetLRShift` collapse these cases turn
on. Transcripts:
[`run-osk-teardown-2026-08-27.txt`](evidence/run-osk-teardown-2026-08-27.txt),
[`run-osk-clickoff-2026-08-27.txt`](evidence/run-osk-clickoff-2026-08-27.txt).
The click-off transcript was taken on a rebuild **with `KLOGGING` defined**, so
every verdict in it rests on the injected `keybd_event` (`vk`/`scan`/`flags`)
rather than on inference from the 60 ms poller.

**Teardown, and the I2177 check:**

| # | case | result |
|---|------|--------|
| 1 | it compiles, and `ReleaseCached` is present in `keyman.map` | PASS |
| 2 | R Ctrl, tray dismiss | PASS — no `LCTRL` contamination |
| 3 | R Ctrl, Character Map tab (`FormDestroy`) | PASS |
| 4 | generic Ctrl, False→True `SetLRShift` collapse, dismiss | PASS — modifier survived the switch, released at teardown |
| 5 | R Ctrl, X button (idempotency) | PASS, qualified — see below |
| 6 | I2177: a physically held modifier must not be released | PASS after `4ca0945a12` |
| 7 | Finding 4a timing repro | PASS, best-effort — 4 attempts, none stranded |
| 8 | OSK still works normally | PASS — sticky applies to next key; held modifier survives a tab switch |

**Click-off, `KLOGGING` build:**

| # | case | result |
|---|------|--------|
| A | plain click-off, no keyboard switch (the common path) | PASS — `vk=A3 flags=1` then `vk=A3 flags=3`, identical to the pre-existing fallback, which is what this case had to show |
| B | click R Ctrl, dismiss from the tray menu | PASS — `ResetShiftStates: … Cache=essRCtrl …` then `vk=A3 flags=3`, released *from the cache* |
| C | click R Ctrl, dismiss via the Character Map tab (`FormDestroy`) | PASS |
| D | **Finding 4b: True→False collapse, live click-off** | **PASS — the decisive case.** Press `vk=A3 flags=1`, the switch collapses the regime, release still `vk=A3 flags=3` while `asyncShift=essCtrl`. The old behaviour emitted unextended `vk=11`, which cannot clear an extended `VK_RCONTROL`. Reproduced clean three further times |
| E | False→True expansion, teardown | PASS — `kbd.ShiftState=essLCtrl` but `Cache=essCtrl`, released as `vk=11 flags=2`, matching the press rather than the expanded representation |

The decisive trace for case D:

```
[15:20:17.381] keybd_event vk=A3 scan=0 flags=1              press, under an AltGr keyboard
[15:20:31.256] UpdateKeyboard: VKI<>nil ... [akan]           switch: LRShift True->False
[15:20:40.911] ShiftStateChange: kbdShift= asyncShift=essCtrl
[15:20:40.915] keybd_event vk=A3 scan=0 flags=3              release, STILL EXTENDED
```

**Precondition, and it is not optional.** These cases cannot be run while the
OSK's `VKI` is nil: `UpdateKeyboard` pins `kbd.LRShift := True` when there is no
visual keyboard, the True→False transition is unreachable, and the run returns a
null result that reads like a pass. `VKI` was confirmed loaded before both runs.
It does not self-heal; restarting `keyman.exe` is the recovery.

**Where these results stop short.** Three of them carry a limit worth naming, so
none is read as stronger than it is:

- Case 5 is qualified. The poller samples at 60 ms and the two
  `ResetShiftStates` calls fire milliseconds apart, so a re-press/re-release
  inside one window would be invisible. What carries the result is structural:
  `ReleaseCached` is gated on `FCachedShiftState`, the first call ends with
  `FCachedShiftState := []`, and the procedure can only emit `KEYUP` — a missed
  double would be a redundant key-up, which is inert.
- Case 7 can falsify but not confirm. Only the fixed build exists, so a clean run
  cannot distinguish "the fix worked" from "the window was never hit". What it
  establishes is that no attempt produced a *stuck* modifier, and a stuck
  modifier is not transient — it would show as a `HELD` line that never resolves.
- **One observation is unattributed, and deliberately not written off.** The
  60 ms poller recorded clear-and-reassert transients during B, D and E that the
  engine log does not account for — the modifier reads up, then down again, with
  no intervening `keybd_event` from `keyman.exe`. That rules out the code under
  change; it does **not** rule out `keyman32.dll`, which injects from inside
  every hooked process via the C++ ETW path that an `OutputDebugString` capture
  cannot see. A blind spot of the instrument, not evidence of absence. One
  correlation, on three observations and offered as a hypothesis rather than a
  finding: the transient appeared in the cases involving the tray menu and/or a
  keyboard switch, and not in those without either. An unattributed modifier
  producer is exactly what this document exists to enumerate, so it stays open.

No verdict should be strengthened on the basis of a null result from an
unvalidated stimulus. Case 6 needed its protocol corrected before it could mean
anything: sending a chat message required pressing Enter, which meant releasing
the very key under test, and the log cannot separate "the fix released your
Shift" from "the tester let go". Pre-typing the message and sending it with the
mouse fixed it, and the decisive line is then unambiguous —
`SHIFT,CTRL,LSHIFT,RCTRL` → `SHIFT,LSHIFT`. A tester releasing Shift produces
`CTRL,RCTRL`; it can never produce `SHIFT,LSHIFT`.

### Not this branch's, and not to be folded into it

- **OSK character case depends on modifier release timing.** With a modifier
  physically held and nothing latched, clicking a character key on the OSK yields
  a different character depending on how quickly the modifier is released
  afterwards — lowercase if released immediately, uppercase a moment later — even
  though the mouse has already gone down *and* up on the key before the release.
  The character injection path is textually unchanged by these commits, and in
  that scenario `PrepState` and `FinalState` are both no-ops, because the 50 ms
  resync has already put `essShift` into `kbd.ShiftState`. Inspection, not
  measurement. Tracked as `I18`.
- **Three environment defects**, recorded in `../kmrepro/TODO.md`: **I19** (the
  OSK's `VKI` goes nil and never recovers, pinning `kbd.LRShift` True — the
  dangerous one, because it makes a test unrunnable while still looking like a
  pass), **I20** (`keymanhp.x64.exe` does not start), **I21**
  (`Shell_NotifyIcon` returning -1 for the tray icon refresh).

---

## A recurrence is triaged, not assumed to be a regression

**#8064's original repro was contrived, not observed.** There is no evidence
that the field reports which opened the issue came from path 1 at all. Given
Finding 1, the OSK is a live candidate for at least some of them: it produces
exactly the reported symptom, including the unclearable Right Control case.

So a stuck modifier reported after this fix ships must be triaged through
[TRIAGE.md](./TRIAGE.md) before anyone concludes the fix regressed. Rows `2c` and
`8` are unmitigated on every build, and rows `2a`/`2b` are unmitigated on every
*released* build.

---

<a name="issues-to-file"></a>

## Issues to file

Five, drafted in full as paste-ready files under [`issues/`](./issues/) —
one per file, title and body, nothing left to write. **Four of them are producer
drafts**, which is the `N` in *mitigated, with 4 producers drafted*; the fifth is
not a producer and is scored nowhere in the table. **Filing them is a
PR-submission step, not a gate on this work**: they are created the day the
#8064 PR is submitted, and until then the drafts are the deliverable. See
[`issues/README.md`](./issues/README.md).

Issues 1 and 2 are for rows now marked `mitigated`, and are still required: `2a`
and `2b` were `UNMITIGATED` in a released build, users are running that build
today, and the record should say so. Issues 3 and 4 are the rows accepted rather
than fixed here, `2c` and `8`. Issue 5 is the odd one out and is listed so it is
not mistaken for a producer: it emits nothing, and it is the first of the three
feed-dead routes named at `serialkeyeventcommon.h:209-217` — a hole *behind* row
`1`'s mitigation rather than beside it. See
[The feed can be dead while the flag says it is on](#feed-dead).

| # | row | draft | subject |
|---|---|---|---|
| 1 | `2a` | [`issues/issue-1-osk-release-chirality.md`](./issues/issue-1-osk-release-chirality.md) | OSK sticky modifier can be released with the wrong chirality after a keyboard switch, stranding Right Ctrl/Right Alt |
| 2 | `2b` | [`issues/issue-2-osk-resetshiftstates-press.md`](./issues/issue-2-osk-resetshiftstates-press.md) | OSK `ResetShiftStates` could press a modifier during its own cleanup (fixed on the #8064 branch; filed for the record) |
| 3 | `2c` | [`issues/issue-3-osk-sticky-stranded-by-kill.md`](./issues/issue-3-osk-sticky-stranded-by-kill.md) | OSK sticky modifier can be stranded machine-wide by a keyman.exe crash or kill, with no watchdog or restore-on-start |
| 4 | `8` | [`issues/issue-4-postkeys-pair-split.md`](./issues/issue-4-postkeys-pair-split.md) | `PostKeys`'s modifier KEYDOWN/KEYUP pair can be split by three unguarded truncation points |
| 5 | *none — not a producer* | [`issues/issue-5-inithooks-return-value-discarded.md`](./issues/issue-5-inithooks-return-value-discarded.md) | `Keyman_Initialise` discards `InitHooks()`'s return value and reports success, so a failed hook installation is silent and the serializer's modifier cache can run with no feed |

**No row carries a placeholder.** Each of the four producer rows links its draft
directly — `2a` → [issue 1](./issues/issue-1-osk-release-chirality.md), `2b` →
[issue 2](./issues/issue-2-osk-resetshiftstates-press.md), `2c` →
[issue 3](./issues/issue-3-osk-sticky-stranded-by-kill.md), `8` →
[issue 4](./issues/issue-4-postkeys-pair-split.md) — and the fifth draft,
[issue 5](./issues/issue-5-inithooks-return-value-discarded.md), is linked from
[The feed can be dead while the flag says it is on](#feed-dead) rather than from a
row, because it produces nothing. Write the real number beside a row's link on
the day that issue is filed; do not replace the link with it, since the draft
stays the thing a reader needs.
