# Stock arm, run 1 — BLOCKED (nothing measured)

- 2026-10-28 13:14–13:15, ltu-legion, official Keyman 20.0.8 (keyman32.dll 20.0.8.0, signature Valid),
  via a limited-token interactive scheduled task (not elevated). Test scripts from keyman-test-8064 @ f58d9da489.
- Gate exit 3 (`[SETUP ERROR] keyman.exe TApplication window not found`); repro exit 2
  (`INCONCLUSIVE - preconditions not met`).
- **Cause: a script bug, not Keyman.** run-stock-arm.ps1 launched `keyman.exe` with no arguments.
  keyman.exe exits unless it gets `-kmc start` (windows/src/engine/keyman/main.pas:168). The earlier
  session only ever ran it with Keyman already up from login, so the bug went unseen. After a silent
  MSI install nothing had started Keyman.
- Fixed: both launches in the script now pass `-kmc start`. Rerun needed.
