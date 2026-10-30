# #16490 without the raw-input signal, on the signed dev 20.0.9 install, ltu-legion, 2026-10-30 13:44–14:05

**Build under test:** #16490 at **23c165666e**. That is `7681e589d0` (parked unchanged on the fork
as `parked/8064-rawinput-user-held`) plus:

- `d32ad10d29` takes the raw-input user-held signal out: the signal and its accessor/mutators, the
  `WM_INPUT` registration, drain and session handling, the bounded re-verify loop (it existed only to
  re-drain the signal between passes), 16 signal-only unit tests and `host32/rawinput-probe.cpp`.
  Kept: `KEYMAN_OSK_MODIFIER_FLAG_KEYMAN_INJECTED` (#16527 reads it), the test seams, FR-015b and
  the `#8064 dropped hold` line (computed from live state and the cache).
- `bc4e2613ec` trims comments only (63% → 35% of added production lines); stripping comments gives
  identical files.
- `23c165666e` rewords the `test-interactive` help string.

#16527 rebased on it as **278467746e** (retag `#8064:` → `#16462:`, comment trim; comments only,
proven by a comment-stripped comparison). keyman.exe was not rebuilt: #16527's code is unchanged
since the installed build.

`keyman32.dll` and `keyman64.dll` built Debug in `C:\Github\keyman-8064-split`
(`build.sh build:x86 build:x64 test:x86 test:x64 --debug`, /W4 /WX clean), signed with the Keyman
test certificates (SHA1 plus appended SHA256), and overlaid on the install. The previous (trim)
DLLs are beside them as `*.old-trim`. DLL strings: `#8064 dropped hold` present; `raw input` and
`WTSRegisterSessionNotification` absent (one `RegisterRawInputDevices` string remains in the x86
DLL; it is not in Keyman's source, and the trim build had it too, beside its own).

| Test | Trimmed (7681e589d0) | Split (23c165666e) |
|---|---|---|
| keyman32 unit tests | x86 96/96, x64 95/95 | **x86 80/80, x64 79/79**: the 16 signal-only tests removed (`unit-tests.log`) |
| Gate C.12, 2 arms, Repeat 3 | PASS 18/18 | **PASS 18/18**, exit 0; control A 0/3 wedged (`gate-r3/`) |
| Gate, Repeat 5, LoadThreads 4 | PASS 30/30 | **PASS 30/30**, exit 0; control A 0/5 wedged (`gate-r5-l4/`) |
| host32 repro, 5 iterations | PASS, 0/5 stuck | **PASS, 0/5 stuck**, freeze 5/5, transformed 5/5 (`host32/`) |

Not measured here: the dropped-hold behaviour itself (a hold the cache never saw is released and not
pressed back). It is the accepted cost in TRIAGE.md, unchanged by this build.
