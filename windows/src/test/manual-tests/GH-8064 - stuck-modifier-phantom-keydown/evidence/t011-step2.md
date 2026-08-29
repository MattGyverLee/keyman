# GH-8064 raw input probe (FR-100) -- W0, spec 003-8064-audit-closeout

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
