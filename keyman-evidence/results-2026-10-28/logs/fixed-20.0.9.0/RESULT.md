# Fixed arm — signed dev build 20.0.9.0 from keyman-test-merge2 (fresh install), ltu-legion, 2026-10-28 15:04–15:20

**Build under test:** test2/16462-on-delphi-stack **3a514d526a** = fix2/16191 **e2c1048ced** (pushed as
chore/windows/delphi-ce-guard) + c923e1e89d (#16527, on #16490 f58d9da489). Built in the Delphi 12 CE IDE
(W3 `windows/src build`, exit 0) and `windows/src publish` (P1, exit 0; 122 signings, 0 timestamp errors).
Installed from `windows/src/desktop/inst/keymandesktop.msi`, after uninstalling official 20.0.8 and
removing its leftovers. All 17 Keyman-built binaries are signed by **Keyman Test Certificate** (Valid:
the Keyman Test CA is in LocalMachine Root) at 20.0.9.0. keyman.exe ships **uiAccess="true"** (not
stripped) and runs non-elevated, started through a limited-token task. The keyboards and language
layout are identical to the stock arm (Cameroon QWERTY on bkc-Latn-CM 0x2C00).

| Test | Stock 20.0.8 (official) | Fixed 20.0.9 (this build) |
|---|---|---|
| Gate C.12, 2 arms, Repeat 3 | **FAIL**, exit 1: Keyman freeze trials 3/3 wedged; arrived wedged from the English arm | **PASS**, exit 0: 18/18; Keyman freeze trials 0/3 wedged (Ascii + Deadkey clean); arrived clean |
| Gate, Repeat 5, LoadThreads 4 | not run | **PASS**, exit 0: 30/30; Keyman freeze trials 0/5 (10 readings clean), 0 flags |
| host32 repro, 5 iterations | **FAIL 5/5** stuck (SHIFT, LSHIFT), freeze 5/5, transformed 5/5 | **PASS**: stuck **0/5**, freeze 5/5, transformed 5/5 |

- **G.4 (repeat-up-to-3 loop, spurious modifier releases):** no spurious release in any fixed-arm
  trial. Every readback read `mods=none`, with no stray case change, across 9 + 15 freeze trials and 5
  host32 iterations. Recorded as **PASS on the gate**, which is the only coverage (unit tests do not cover it).
- **Caveat, recorded as the gate prints it:** a PASS gate verdict reads "[NOT REPRODUCED] … Nothing is
  proven either way". The evidence that the fix works is the A/B comparison: the same stimulus,
  settings, machine, keyboard and harness wedge the stock build every time and the fixed build never.
  The remaining variable is the code difference: the PR stack, plus the 20.0.8→20.0.9 version bump,
  whose engine diff is empty (see reinstall-2026-10-28.md).
- Two arms only (no MSKLC Cameroon layout), as on stock.
