# Stock arm, run 2 — official Keyman 20.0.8 (fresh install), ltu-legion, 2026-10-28 13:20–13:26

Ran as a limited-token interactive scheduled task (not elevated). Test scripts are from keyman-test-8064 @
f58d9da489. keyman32.dll is 20.0.8.0 with a Valid signature. Two arms (English, Keyman), because no MSKLC
Cameroon layout is installed.

## Gate (C.12): **FAIL, exit 1 — as expected for stock. GH-8064 is present in 20.0.8.**

- English arm: 0/6 wedged (3 no-freeze controls A, 3 freeze trials I). Exit probe CLEAN.
- Keyman arm (Cameroon QWERTY, HKL 0x04092C00): after recovery to CLEAN, **3/3 freeze trials (I) wedged**
  (Ascii read 'ABC', deadkey U+003A U+0045 U+014A, LShift held at readback), while **0/3 no-freeze
  controls (A) wedged**. Exit probe CLEAN.
- Gate verdict: "[PROOF] The wedge appeared ONLY on the Keyman arm. Keyman 3/6 wedged; English 0/6."

Caveats, all recorded by the gate itself:
1. **The gate's start-of-run Keyman restart did not happen.** A limited token cannot stop the uiAccess
   keyman.exe (Access Denied), and nobody restarted it within the 120 s wait. Its purpose, a clean
   start, was nonetheless **verified directly**: the gate's entry check typed on the Keyman arm and read
   CLEAN. That Keyman had been started fresh at 13:16:42.
2. **The Keyman arm arrived already wedged** after the English arm ran: the carry-over in which the
   control arms charge Keyman's modifier cache. The gate's source (stuck-mod-test.ps1, about line 1264)
   classes this as a RESULT, not a setup failure. Its fingerprints were taken while it was wedged, so the
   Ascii and Deadkey oracles were "not marked valid by fingerprinting". The gate lists these as "UNMET
   PRECONDITIONS — each of these on its own forbids a PASS". They forbid a PASS, not this FAIL.
3. Two arms only, so engine versus layout data is not separated (needs MSKLC Cameroon).

## Repro: **FAIL 5/5 — as expected for stock** (host32, 13:38)

`tools/run-host32.ps1 -Label stock`: Keyman restarted cleanly (pid 33212, non-elevated); `host32.exe
--fakefreeze <fakefreeze> --probe 1x2x3x --iterations 5 --wait-for-rule 60`, non-elevated and in the
foreground. Two Win+Space presses selected k_0301 (the edit showed `1=OK `), and the driver stopped
switching before the first trial. Result: **freeze confirmed 5/5, text transformed 5/5, stuck 5/5
(SHIFT, LSHIFT)**, `RESULT: FAIL - the defect reproduced`, exit 1. This matches the README's recorded
shipped-build row (5/5 FAIL). Files: `host32.txt` (host32's own --out) and `host32-driver.txt`.
Afterwards Shift was cleared (key-up) and Keyman restarted; no modifier held.

Superseded or void attempts, kept for the record:
- `run-8064-test.ps1 -HostApp charmap` (two runs): **INCONCLUSIVE, exit 2**. All preconditions passed
  (Cameroon TIP active in charmap), but every iteration read back "". The script brings charmap to
  the foreground but cannot give its Edit keyboard focus (SetFocus needs the caller to own the active
  window). The README documents this limit and recommends host32. Output: `repro-full.txt`.
- First host32 attempt: **VOID**, not counted. Task-launched host32 could not take the foreground (the
  driver refused to inject). The second attempt's driver could not read host32's locked --out file,
  so it kept pressing Win+Space during the trials (it read 1/5 stuck). Files `*-VOID*`.
