# host32 — self-driving repro host, and rawinput-probe

Two tools live in this folder. They are not production code,
they are not built by the normal Keyman build, and they serve
different purposes. Do not confuse them.

The main manual-test documentation is in `../README.md`
(GH-8064: stuck modifier, phantom KEYDOWN). Read that first
for preconditions, hazards, and the oracle. This file only
covers how to build and run the two programs in this folder.

## host32.exe — the repro host

Self-driving 32-bit host for the GH-8064 reproduction.

Why 32-bit: the modifier cache lives in
`serialkeyeventserver.cpp`, which is `#ifndef _WIN64`.

Why self-driving: a background process cannot give another
process's window keyboard focus (`SetFocus` needs the calling
thread to own the active window), so the host drives the whole
sequence itself, in its own window.

### Build

32-bit, with the Keyman build environment sourced:

```
cl /nologo /W4 /EHsc /MT /DUNICODE /D_UNICODE host32.cpp \
   /link /SUBSYSTEM:WINDOWS user32.lib gdi32.lib shell32.lib /OUT:host32.exe
```

### Run

```
host32.exe --fakefreeze PATH [--iterations N] [--release-delay MS] [--control]
           [--modifier LSHIFT|RSHIFT|LCTRL|RCTRL|LALT|RALT] [--out PATH]
           [--allow-no-transform]
```

`--fakefreeze PATH` is the path to a built `fakefreeze.exe`
(see `windows/src/support/fakefreeze/README.md`). The host
holds a modifier, triggers the freeze, releases the modifier
during the stall, and reads the oracle (all nine modifier
virtual keys, not just the probe text — a stuck Ctrl or Alt
swallows keys and produces no case change, so text alone
would score a wedged machine as clean).

Preconditions: a real Keyman for Windows install, running,
with a Keyman keyboard active, and a probe string the active
keyboard actually transforms (the default probe is
`aeiouknsd`; a probe the keyboard passes through unchanged
makes the run inconclusive, not passing).

### Exit codes

- `0` PASS
- `1` FAIL — defect reproduced
- `2` INCONCLUSIVE — a precondition was unmet, or the probe
  was not transformed. INCONCLUSIVE is never a pass.
- `3` setup error

## rawinput-probe.exe — a measurement, not a fix

`rawinput-probe.cpp` changes no production file, repairs
nothing, and is not a repro step. It answers one design
question: does a `WM_INPUT` feed on a worker thread keep
delivering, with Keyman's `dwExtraInfo` tag intact, while
the thread the low-level hook was installed on is stalled?
That question gated the user-held signal (Route 2, the
serializer's `WM_INPUT` shadow). Its result is recorded in
the evidence archive (branch `evidence/8064-16462` in
MattGyverLee/keyman, at
`keyman-evidence/16490-GH-8064/manual-tests-GH-8064/evidence/rawinput-delivery.md`);
the evidence logs were moved out of this PR branch, so
they are not in this folder anymore.

### Build

```
cl /nologo /W4 /EHsc /MT /DUNICODE /D_UNICODE rawinput-probe.cpp /link /SUBSYSTEM:WINDOWS user32.lib gdi32.lib /OUT:rawinput-probe.exe
```

### Reading its output

The `hDevice` column is recorded for completeness only.
Keying the user-held signal on `hDevice` (or on
`LLKHF_INJECTED`, or on a device allowlist) is refuted, not
merely discouraged: genuine user input from Remote Desktop
and from the Keyman On Screen Keyboard is OS-injected, and
both populations are deliberately protected. The admissible
policy is tag equality, as in
`IsKeymanInjectedKeyEvent` — see the header comment in
`rawinput-probe.cpp` and `keybd_shift.tests.cpp` for the
full argument. Do not reuse this probe as a licence for a
device-provenance filter.
