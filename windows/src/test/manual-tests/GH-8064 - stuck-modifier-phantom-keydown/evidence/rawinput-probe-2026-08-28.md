# W0 probe run -- 2026-08-28 -- COMPLETE for the decision rule (T011), verdict recorded (T012)

**This is a measurement.** No production code changed. It gates only W5 / Phase 8.

**FR-100a.** `hDevice` below is recorded **for completeness only**. Keying the signal on
it is **refuted**, because genuine user input from RDP and from the Keyman OSK is
OS-injected. The admissible policy is **tag equality, identical to
`IsKeymanInjectedKeyEvent(MakeCode, ExtraInformation)`**. The `hDevice` column is not a
licence for an injected-versus-physical filter.

| | |
|---|---|
| machine | MLEELOQ |
| OS | 10.0 build 26200 |
| probe bitness | 32-bit |
| session is remote (SM_REMOTESESSION) | no |
| runs | step 1 at 2026-08-28 16:09:45; step 3 at 16:10:24; step 2 at 16:36:01 (all local) |
| `keyman.exe` running during step 2 | yes, PID 22000, Session 1 / Console |

## What this run establishes, leg by leg

| leg | state |
|---|---|
| registration: `RIDEV_INPUTSINK` against a message-only window on a **worker** thread | **MEASURED -- succeeds** (`GetLastError` 0) |
| step 3 (b): tag + scan `0xFF` survives `SendInput` -> raw input | **MEASURED -- survives**, `ExtraInformation` `0x4B4D0001`, `MakeCode` `0x00FF` |
| step 3 (c): tag + `SCANCODE_RSHIFT` survives -- the shape the scan arm cannot carry | **MEASURED -- survives**, `ExtraInformation` `0x4B4D0001`, `MakeCode` `0x0036` |
| step 2 case 1: `WM_INPUT` delivered while **unfocused** | **MEASURED -- DELIVERED**, 164 raw keyboard records, foreground owned by another process |
| step 2 case 2: `WM_INPUT` delivered while the **main thread is stalled** | **MEASURED -- DELIVERED**, 42 records *during* an 8000 ms busy-block, with `fakefreeze` also stalling `keyman.exe`'s main thread |
| step 3 (a): the physical-keystroke **column baseline** | **NOT MEASURED** -- carried forward with the reason below |
| step 4: RDP, Keyman OSK, higher-integrity focus, secure desktop | **NOT MEASURED** -- carried forward with the reason below |

### Carried forward as unverified, with the reason -- not dropped silently

This follows the same discipline `002` and FR-033 apply to the ARM64 leg: an unrun leg is
recorded as unrun, with its reason, and is never written up as a pass.

- **step 3 (a), the physical column baseline.** Not run. It is **not** a clause of the
  decision rule -- the rule's first clause is about the tag surviving `SendInput` to raw
  input, and (b)/(c) are injected by construction. What 3 (a) would add is the recorded
  column values for a physical key. Two things already stand in for it: step 2 delivered
  **206 physical-key records** (164 + 42), so physical delivery to the message-only
  worker window is measured, not assumed; and `IS_KEYMAN_INJECTED_KEY_EVENT.PhysicalKeystrokesAreNotKeymans`
  pins the classification side in the suite (green, 72/72 on x86 at this commit).
- **step 4: RDP.** Deliberately not run -- operator decision, 2026-08-28. Admissible
  because per FR-100a the policy is **tag equality**, not `hDevice`: RDP input is
  OS-injected and carries mstsc's own `dwExtraInfo`, so it is classified by the same tag
  test as any other input and there is no RDP-specific code path to get wrong.
  `IS_KEYMAN_INJECTED_KEY_EVENT.RemoteDesktopInputIsNotKeymans` pins that population in
  the suite. **This leg is unverified, not satisfied.**
- **step 4: Keyman OSK, higher-integrity focus, secure desktop.** Not run in this pass.
  `TheOnScreenKeyboardIsNotKeymans` pins the OSK population in the suite. The
  secure-desktop leg is the empirical counterpart to FR-104 / FR-104a ("the active
  desktop is not the user's" -> poison); W5's T099 tests that in the suite, so the
  requirement is not unpinned, but the *field* confirmation is outstanding.

## T012 -- the verdict, against `plan.md` W0's decision rule

The rule was written before the run (`plan.md:289-296`) so the result could not be
rationalised afterwards. Applying it:

| clause | measured? |
|---|---|
| the tag survives `SendInput` to raw input | **YES** -- both shapes, (b) and (c), `0x4B4D0001` recovered intact |
| `WM_INPUT` reaches a message-only worker-thread window while the main thread is stalled **and** the window unfocused | **YES** -- both cases DELIVERED; the stalled case with `keyman.exe`'s own main thread stalled by `fakefreeze`, not only the probe's |

**Verdict: ROUTE 2 CARRIES. W5 implements FR-101 ... FR-105. Phase 8 is LIVE.**

Consequences, recorded so no later phase re-litigates them:

- Row 2 of the rule ("the tag survives but delivery fails in the stalled or unfocused
  case") does **not** apply: delivery held in both cases.
- Row 3 ("the tag is zeroed or rewritten on the raw-input path") does **not** apply: the
  tag was recovered byte-identical, including for the Right Shift shape.
- **Route 1 is not probed.** FR-100b's two questions are reached only if Route 2 is
  refuted. It is not.
- **FR-106 does not fire.** The FR-100 ... FR-106 block is **not** struck. T013's
  condition did not obtain.
- **T081's FR-102a declaration stands** -- it is withdrawn only under FR-106.

Why the stalled case is the load-bearing one: the low level hook marshals every event to
the thread that installed it -- `keyman.exe`'s **main** thread (`keyman32.cpp:275-280`) --
which is the thread whose stall causes the eviction. Raw input queues on the
**registering** thread. 42 records arriving during an 8000 ms block of that main thread,
with `fakefreeze` holding `keyman.exe` as well, is the direct measurement that the feed
survives exactly the window in which the hook does not.

---

## Appendix A -- raw probe output, step 1 (registration), run 16:09:45

﻿# GH-8064 raw input probe (FR-100) -- W0, spec 003-8064-audit-closeout

**This is a measurement.** No production code changed. It gates only W5.

**FR-100a.** `hDevice` below is recorded **for completeness only**. Keying the signal on
it is **refuted**, because genuine user input from RDP and from the Keyman OSK is
OS-injected. The admissible policy is **tag equality, identical to
`IsKeymanInjectedKeyEvent(MakeCode, ExtraInformation)`**. The `hDevice` column is not a
licence for an injected-versus-physical filter.

| | |
|---|---|
| machine | MLEELOQ |
| OS | 10.0 build 26200 |
| probe bitness | 32-bit |
| session is remote (SM_REMOTESESSION) | no |
| run at | 2026-08-28 16:09:45 local |
| operator wait per prompt | 5 s |

## Step 1 -- registration, and delivery to a message-only window (plan.md W0 step 1)

| item | value |
|---|---|
| worker thread id | 29316 |
| main thread id | 1692 |
| message-only window (HWND_MESSAGE) | 0x000000000008090A |
| CreateWindowEx GetLastError | 0 |
| RegisterRawInputDevices(page 0x01, usage 0x06, RIDEV_INPUTSINK) | succeeded |
| RegisterRawInputDevices GetLastError | 0 |
| GetRegisteredRawInputDevices readback | unavailable (count 1) |

[OK] RegisterRawInputDevices succeeded against a message-only window.
[INFO] Press and release a few keys now, anywhere on this machine.
[INFO] watching for 5 s ...
       5 s remaining (raw keyboard records so far: 0)
       3 s remaining (raw keyboard records so far: 0)
       2 s remaining (raw keyboard records so far: 0)
       1 s remaining (raw keyboard records so far: 0)

| question | answer | records |
|---|---|---|
| is WM_INPUT delivered to a message-only window at all | no | 0 |
[FAIL] WM_INPUT delivery to HWND_MESSAGE: NOT observed.
RESULT: INCONCLUSIVE - no keys were seen. Either none were pressed, or WM_INPUT does
        not reach a message-only window on this OS build. Re-run and press keys.

---
Paste the whole of the above into evidence/rawinput-probe-<date>.md, keeping the
FR-100a paragraph with it. T012 then applies plan.md W0's decision rule -- written
before the run -- and records the verdict in the same file.

---


---

## Appendix B -- raw probe output, step 2 (delivery), run 16:36:01

﻿# GH-8064 raw input probe (FR-100) -- W0, spec 003-8064-audit-closeout

**This is a measurement.** No production code changed. It gates only W5.

**FR-100a.** `hDevice` below is recorded **for completeness only**. Keying the signal on
it is **refuted**, because genuine user input from RDP and from the Keyman OSK is
OS-injected. The admissible policy is **tag equality, identical to
`IsKeymanInjectedKeyEvent(MakeCode, ExtraInformation)`**. The `hDevice` column is not a
licence for an injected-versus-physical filter.

| | |
|---|---|
| machine | MLEELOQ |
| OS | 10.0 build 26200 |
| probe bitness | 32-bit |
| session is remote (SM_REMOTESESSION) | no |
| run at | 2026-08-28 16:36:01 local |
| operator wait per prompt | 15 s |

## Step 2 -- delivery while unfocused, and with the MAIN thread stalled (W0 step 2)

This is the property Route 2 rests on. The low level hook marshals every event to the
thread that installed it -- keyman.exe's MAIN thread (keyman32.cpp:275-280) -- which is
the thread whose stall causes the eviction. Raw input queues on the REGISTERING thread.
If WM_INPUT still arrives here while this process's main thread is going nowhere, the
feed survives exactly the window in which the hook does not.

### Case 1 -- unfocused
[INFO] this probe owns no visible window at all, so it can never take focus: a
       message-only window is not focusable by construction. The check below confirms
       another process owned the foreground while the keys were pressed.
[INFO] Click into another application and type there now.
[INFO] watching for 15 s ...
       15 s remaining (raw keyboard records so far: 0)
       10 s remaining (raw keyboard records so far: 77)
       5 s remaining (raw keyboard records so far: 116)
       3 s remaining (raw keyboard records so far: 147)
       2 s remaining (raw keyboard records so far: 159)
       1 s remaining (raw keyboard records so far: 164)

| case | foreground is another process | raw keyboard records | verdict |
|---|---|---|---|
| unfocused | yes | 164 | DELIVERED |
[OK] case 1: WM_INPUT is delivered while unfocused.

### Case 2 -- the MAIN thread stalled
[INFO] fakefreeze started: D:\Github\_Projects\_KM\keyman\windows\src\support\fakefreeze\bin\Win32\Debug\fakefreeze.exe
       It stalls keyman.exe's main thread -- the thread the low level hook is
       marshalled to, and so the thread whose stall causes the eviction.
[INFO] Press and release keys CONTINUOUSLY for the next few seconds. This thread is
       about to busy-block for 8000 ms; the worker thread keeps its own queue.

| case | staller | raw keyboard records DURING the stall | verdict |
|---|---|---|---|
| main thread stalled | self-stall + fakefreeze | 42 | DELIVERED |
[OK] case 2: WM_INPUT is delivered while the main thread was blocked.

RESULT: step 2 recorded. Delivery holds unfocused AND with the main thread stalled.

---
Paste the whole of the above into evidence/rawinput-probe-<date>.md, keeping the
FR-100a paragraph with it. T012 then applies plan.md W0's decision rule -- written
before the run -- and records the verdict in the same file.

---

## Appendix C -- raw probe output, step 3 (the decisive capture), run 16:10:24

﻿# GH-8064 raw input probe (FR-100) -- W0, spec 003-8064-audit-closeout

**This is a measurement.** No production code changed. It gates only W5.

**FR-100a.** `hDevice` below is recorded **for completeness only**. Keying the signal on
it is **refuted**, because genuine user input from RDP and from the Keyman OSK is
OS-injected. The admissible policy is **tag equality, identical to
`IsKeymanInjectedKeyEvent(MakeCode, ExtraInformation)`**. The `hDevice` column is not a
licence for an injected-versus-physical filter.

| | |
|---|---|
| machine | MLEELOQ |
| OS | 10.0 build 26200 |
| probe bitness | 32-bit |
| session is remote (SM_REMOTESESSION) | no |
| run at | 2026-08-28 16:10:24 local |
| operator wait per prompt | 6 s |

## Step 3 -- THE DECISIVE CAPTURE (W0 step 3)

dwExtraInfo has survived SendInput -> the low level hook since 2018
(keyman64.h:137-144). The raw input leg has never been measured, and it is what Route 2
needs: RAWKEYBOARD carries ExtraInformation per event, which is the second reason W0
probes Route 2 before Route 1 -- WM_KEY* exposes no per-event dwExtraInfo at all.

Note on widths: RAWKEYBOARD.ExtraInformation is a 32-bit ULONG, while the hook's
dwExtraInfo is ULONG_PTR. EXTRAINFO_FLAG_KEYMAN_MODIFIER_WRAP is 0x4B4D0001 and fits, so the
tag itself is unaffected; the column is printed to 8 hex digits for that reason.

### Capture -- local desktop, no RDP, no OSK
[INFO] Press and release Left Shift (or any key) now.
[INFO] watching for 6 s ...
       5 s remaining (raw keyboard records so far: 0)
       3 s remaining (raw keyboard records so far: 0)
       2 s remaining (raw keyboard records so far: 0)
       1 s remaining (raw keyboard records so far: 0)

| shape | RAWKEYBOARD.ExtraInformation | RAWKEYBOARD.MakeCode | RAWINPUTHEADER.hDevice | IsKeymanInjectedKeyEvent |
|---|---|---|---|---|
| (a) physical keystroke | *(nothing captured)* | *(nothing captured)* | *(nothing captured)* | *(not measured)* |
| (b) injected, tag + scan 0xFF | 0x4B4D0001 | 0x00FF | 0x0000000000000000 | TRUE |
| (c) injected, tag + SCANCODE_RSHIFT | 0x4B4D0001 | 0x0036 | 0x0000000000000000 | TRUE |

FR-100a: the hDevice column above is recorded FOR COMPLETENESS ONLY. Keying the signal
on it is refuted -- genuine user input from RDP and from the Keyman OSK is OS-injected.
The admissible policy is tag equality, identical to IsKeymanInjectedKeyEvent.

- (a) physical keystroke: nothing arrived within the wait. Nothing is claimed about this shape.
- (b) injected, tag + scan 0xFF: VKey 0x10, Flags 0x0000 (E0 no, E1 no, MAKE), Message 0x0100
- (c) injected, tag + SCANCODE_RSHIFT: VKey 0x10, Flags 0x0000 (E0 no, E1 no, MAKE), Message 0x0100

[OK] (b) the tag SURVIVED the SendInput -> raw input trip (got 0x4B4D0001, wanted 0x4B4D0001).
[OK] (c) the tag SURVIVED for the Right Shift shape (got 0x4B4D0001, wanted 0x4B4D0001). This is the
     shape the scan arm cannot carry, so the tag arm is the ONLY cover for it.
[INFO] (c) MakeCode arrived as 0x0036; SCANCODE_RSHIFT is 0x0036.
[INFO] (a) not measured -- no physical keystroke arrived within the wait.
RESULT: INCONCLUSIVE - at least one shape produced no record, so the decisive
        question is unanswered. Re-run; do not read a missing row as a negative.

---
Paste the whole of the above into evidence/rawinput-probe-<date>.md, keeping the
FR-100a paragraph with it. T012 then applies plan.md W0's decision rule -- written
before the run -- and records the verdict in the same file.
