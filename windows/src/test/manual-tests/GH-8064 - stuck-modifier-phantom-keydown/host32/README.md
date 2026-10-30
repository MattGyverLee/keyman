# host32 — self-driving repro host

This folder holds one tool. It is not production code, and
it is not built by the normal Keyman build.

The main manual-test documentation is in `../README.md`
(GH-8064: stuck modifier, phantom KEYDOWN). Read that first
for preconditions, hazards, and the oracle. This file only
covers how to build and run the program in this folder.

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
