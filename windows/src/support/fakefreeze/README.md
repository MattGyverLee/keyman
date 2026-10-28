# fakefreeze — pause keyman.exe so Windows drops the low-level hook

A small pre-existing tool (created by mcdurdin, 2025-11-17),
used by the GH-8064 manual tests. It is not a fix, and it
is not specific to #8064: it is a general way to force the
condition Windows documents for low-level hooks.

## What it does

It finds Keyman's master controller window
(`TfrmKeyman7Main`), posts it `WM_KEYMAN_CONTROL` with
`KMC_WATCHDOG_FAKEFREEZE` (20), and then sleeps 5 seconds
while Keyman is paused. Per the Windows documentation for
`LowLevelKeyboardProc`, a low-level hook that does not
return within `LowLevelHooksTimeout` is silently uninstalled
by Windows — so any KEYUP that arrives during those
5 seconds is lost to Keyman's hook, and Keyman's cached
modifier state can go stale. That is the stimulus the
GH-8064 tests need; CPU load alone does not produce it.

If the controller window is not found, it prints
"Keyman master controller window not found" and exits 1.
If the post fails, it prints the `KMC_WATCHDOG_FAKEFREEZE`
error. On success it prints a countdown and
"Keyman should be responsive again now", and exits 0.

## Build

From the repo root, with the Keyman build environment:

```
./windows/src/support/fakefreeze/build.sh --debug build:x86
```

`build.sh` also supports `build:x64`, plus the standard
`clean` / `configure` actions. See `build.sh` for the
output paths (`fakefreeze.exe` under the Win32 / x64
target paths). No test action is wired up; the commented-out
test lines in `build.sh` are not a test suite.

## Run

Keyman for Windows must already be running. Run the built
`fakefreeze.exe` on its own, or let a harness drive it:
`host32.exe --fakefreeze PATH` and
`stuck-mod-test.ps1 -Gate` both invoke it. Do not run it
while typing anything sensitive or while Keyman is
mid-operation you care about — Keyman is genuinely paused
for 5 seconds, and input during the pause is the point
of the test, not an accident.

## Where it is used

- `windows/src/test/manual-tests/GH-8064 - stuck-modifier-phantom-keydown/`
  — the GH-8064 manual test, its README, `host32.exe`,
  `run-8064-test.ps1`, and `stuck-mod-test.ps1 -Gate`.
- `LowLevelHookWatchDog.cpp` in the engine — see that file
  for more detail on the watchdog mechanism itself.
