# GH-8064: stuck modifier, phantom KEYDOWN

Manual end-to-end test for [#8064](https://github.com/keymanapp/keyman/issues/8064),
*bug(windows): modifier key occasionally is "stuck on"*.

There is no app to build here. The two tools this test needs already exist in the
tree, and the pass/fail oracle is two PowerShell snippets given below.

## Companion documents

| file | what it is for |
|---|---|
| [MODIFIER-PRODUCERS.md](./MODIFIER-PRODUCERS.md) | every production path that can emit a modifier KEYDOWN, with a verdict on each. Read this before concluding that a stuck modifier came from the serializer |
| [TRIAGE.md](./TRIAGE.md) | how to tell the serializer path from the on-screen keyboard path when a stuck modifier is reported in the field |

**The enumeration found paths the fix does not cover.** The on-screen keyboard can
strand a modifier machine-wide, including an unclearable Right Control, and its
cleanup does not run on the common ways of dismissing it. See
MODIFIER-PRODUCERS.md Finding 1. A stuck modifier reported after this fix ships is
therefore triaged, not assumed to be a regression.

## What is being tested

`SerialKeyEventServer` keeps its own copy of the modifier state,
`m_ModifierKeyboardState`. It is seeded from the OS once, in `InitThread`, and
thereafter fed only by messages posted from the low level keyboard hook. Windows
bypasses a low level hook that does not return within `LowLevelHooksTimeout`, so
a modifier KEYUP can be lost, and nothing ever re-derives the cache, so that one
stale byte survives for the life of the process. `keybd_shift_reset` then presses
that modifier for real, with no matching KEYUP, ahead of every injected batch.

The seed is real, and that is worth stating because it is easy to assume
otherwise. `InitThread` calls `GetKeyboardState`, which reports the *calling
thread's* processed input queue rather than the live hardware state — so the
natural reading is that a worker thread which has never pumped input gets
nothing useful. Measured, it gets the opposite.
`KEYBD_SHIFT.DISABLED_FreshThreadKeyboardStateReflectsLiveModifiers` in
`windows/src/engine/keyman32/tests/keybd_shift.tests.cpp` holds Left Shift down
and reads both threads:

```
this thread : GetKeyboardState ok=1 byte=0x00, GetAsyncKeyState=0x8001
fresh thread: GetKeyboardState ok=1 byte=0x81, GetAsyncKeyState=0x8000
```

A thread that has never pumped input reports the key **held** (high bit set);
the process main thread, whose queue the event never reached, reports it **up**.
`InitThread` reads the state before it calls `RegisterClass` or `CreateWindow`,
so it is exactly that queue-less case and the seed reflects whatever is
genuinely held at launch.

That gives the cache a second way to go stale, independent of any dropped
KEYUP: a modifier held as Keyman starts is seeded into the cache, and if the
user releases it before the hook is feeding events, nothing clears it.
`ReconcileModifierCache` closes both routes, since it compares the cache
against the live state without caring how the two came to disagree.

The result is not a Keyman typing glitch. It is a modifier stuck down
**machine-wide**, in every application and on every keyboard layout, until the
exact matching KEYUP arrives.

The automated counterpart is `KEYBD_SHIFT.*` and `RECONCILE_MODIFIER_CACHE.*` in
`windows/src/engine/keyman32/tests/keybd_shift.tests.cpp`. Those construct the
stale byte directly. This test is the only one that exercises the real path: a
genuinely stalled hook, a genuinely dropped event, and `SendInput` reaching the
whole machine.

## Why a smoke test never finds it

Two things have to coincide, and on an idle or merely-busy machine they do not:

1. keyman.exe's main thread has to stall past `LowLevelHooksTimeout`, and
2. the event lost to that stall has to be a **modifier KEYUP**.

CPU load alone does not do it. Step 3 of the procedure below, releasing the
modifier *during* the stall, is the step that has to be arranged deliberately,
and it is the step no ordinary test performs.

## Tools

| tool | role |
|---|---|
| `windows/src/support/fakefreeze` | the stimulus. Posts `KMC_WATCHDOG_FAKEFREEZE` to keyman.exe, which pauses for five seconds. Build with `./windows/src/support/fakefreeze/build.sh --debug build:x86` |
| `windows/src/test/manual-tests/keyboard_ll_identifier` | the wire logger. A `WH_KEYBOARD_LL` hook that logs `vkCode scanCode flags` for the nine modifier virtual keys. Delphi, and no binary is committed, so it has to be built |
| the snippets below | the pass/fail oracle, and the recovery |

> `keyboard_ll_identifier` installs a **global** low level hook and logs every
> modifier keystroke on the machine while it runs. It does not log character
> keys, but close it before typing anything sensitive.

## Preconditions

- A real Keyman for Windows install, running, with a **Keyman** keyboard active:
  not a Microsoft or MSKLC layout of the same language. Confirm the active layout
  from the focused control, not the top-level window: Windows 11 Notepad's frame
  window sits on a thread pinned to its original input locale while the focused
  edit control tracks the real one.
- `Flag_ShouldSerializeInput` not disabled (it defaults to on).
- A 32-bit host application. `serialkeyeventserver.cpp` is `#ifndef _WIN64`, so
  the cache being tested exists only in the 32-bit engine.
- Notepad open. Nothing more elaborate is needed, and nothing that holds real
  data should be used. See Hazards.

## Result

Reproduced and fixed, measured on the same machine with one variable changed:

| engine | freeze active | rules firing | modifier wedged |
|---|---|---|---|
| shipped build, `keyman32.dll` 1,232,504 bytes | 5/5 | 5/5 | **5/5 FAIL** |
| fixed build, `keyman32.dll` 4,197,376 bytes | 5/5 | 5/5 | **0/5 PASS** |

`host32.exe --probe 1x2x3x --wait-for-rule 120 --iterations 5`, Left Shift held and
released 1500 ms into the stall, Windows 11 Pro 26200. Full reports in `evidence/`.

The wedged modifier was reported as `SHIFT, LSHIFT` -- both the side-agnostic and
the chiral VK. Reading only the six cache slots would have scored the wedged
machine clean, which is why the oracle reads all nine.

## Automated harness

`run-8064-test.ps1` performs steps 3 to 7 below: it holds the modifier, posts the
freeze, releases inside the stall, types a probe string, reads the oracle, and
clears any modifier it left asserted.

It requires `-HostApp`, a path to a **32-bit** application with a text field, and
verifies that rather than assuming it. There is no default, because on Windows 11
both `notepad.exe` and `SysWOW64\notepad.exe` report `IsWow64Process` false: they
resolve to the 64-bit packaged Notepad, whose engine is `keymanx64.dll`, where
`serialkeyeventserver.cpp` is compiled out and the cache under test does not
exist.

`host32/` supplies one. It is a minimal 32-bit window with a single Edit control,
a fixed class and title, and it publishes its active keyboard layout in that title
because `GetKeyboardLayout(idThread)` returns 0 for a thread in another process and
the harness cannot otherwise tell which layout is selected. Build it with the
Keyman build environment sourced:

```
cl /nologo /W4 /EHsc /MT /DUNICODE /D_UNICODE host32.cpp \
   /link /SUBSYSTEM:WINDOWS user32.lib gdi32.lib /OUT:host32.exe
```

### Known blocker: synthetic input needs real keyboard focus

Driving the host from the harness does not yet work, and the reason is a Windows
constraint rather than a bug in either. A background process cannot reliably grant
another process's window keyboard focus: `SetForegroundWindow` succeeds and
`GetForegroundWindow` confirms the host is foreground, yet `GetFocus` in the host's
thread stays 0 and `SendInput` keystrokes go nowhere. `WM_CHAR` posted directly to
the Edit does arrive, which is how we know the control and the read-back are fine.
Claiming focus from `WM_ACTIVATE` inside the host does not help either, because
`SetFocus` needs the calling thread to own the active window.

This is why the procedure was manual: a person pressing keys has focus by
construction.

The fix is to move the sequence **into** `host32` and let it drive itself. It owns
its own window, so it can focus its Edit, hold a modifier with `SendInput`, spawn
`fakefreeze`, release inside the stall, type the probe, and read `GetAsyncKeyState`
without any cross-process focus handover. That is the next step and it removes the
blocker entirely rather than working around it.

The harness reports **INCONCLUSIVE** rather than PASS unless it confirms all four
of: the freeze took effect, the host is a verified 32-bit process it actually
brought to the foreground, a Keyman TIP is selected in that host, and Keyman
transformed the probe text. Each check exists because the first version lacked it
and produced a false PASS -- it checked only that a host executable existed on
disk, `MainWindowHandle` stayed 0 so `SetForegroundWindow` did nothing, and the
keystrokes went to whatever window had focus while three iterations reported PASS
with the freeze confirmed active. A false PASS on this defect is worse than no
test.

```
./run-8064-test.ps1 -HostApp <32-bit editor> -Control    # harness sanity check
./run-8064-test.ps1 -HostApp <32-bit editor>
./run-8064-test.ps1 -HostApp <32-bit editor> -Modifier RSHIFT
```

`-Modifier RSHIFT` is the interesting case: Right Shift is the one modifier whose
`SCAN_FLAG_KEYMAN_KEY_EVENT` is overwritten with `SCANCODE_RSHIFT`, so only the
`dwExtraInfo` arm of the provenance gate covers it.

## Procedure

1. Start `keyboard_ll_identifier`. Press and release Left Shift once and confirm
   a matched KEYDOWN/KEYUP pair appears.
2. Focus Notepad and type a few characters. Confirm the Keyman keyboard is
   producing its own output, not the base layout's.
3. **Press and hold Left Shift.**
4. With Shift still held, run `fakefreeze.exe`. It prints `Sleeping 5 seconds...`.
5. **Release Left Shift while the freeze is still running.** This is the whole
   test. Releasing before or after proves nothing.
6. When `fakefreeze` reports Keyman is responsive again, type a key sequence that
   matches a rule in the active keyboard, so that Keyman produces output and an
   injected batch is assembled.
7. Run the oracle snippet below **without touching the keyboard**.

## The oracle

Not the text in Notepad. A stuck Ctrl or Alt swallows keys and produces no case
change at all, so a text-only check scores a genuinely wedged machine as clean.
Read the modifier state instead:

```ps1
Add-Type -Name Km8064 -Namespace Probe -MemberDefinition '[DllImport("user32.dll")] public static extern short GetAsyncKeyState(int vKey);'
$mods = [ordered]@{ SHIFT=0x10; CTRL=0x11; ALT=0x12; LSHIFT=0xA0; RSHIFT=0xA1; LCTRL=0xA2; RCTRL=0xA3; LALT=0xA4; RALT=0xA5 }
foreach ($m in $mods.GetEnumerator()) {
  $down = [Probe.Km8064]::GetAsyncKeyState($m.Value) -lt 0
  '{0,-7} {1}' -f $m.Key, $(if ($down) { 'DOWN  <-- held' } else { 'up' })
}
```

All nine, not the six cache slots. `do_keybd_event` maps every modifier to the
side-agnostic virtual key before injecting it -- `VK_LSHIFT` and `VK_RSHIFT` both
leave as `VK_SHIFT`, `VK_LCONTROL` and `VK_RCONTROL` as `VK_CONTROL`, `VK_LMENU`
and `VK_RMENU` as `VK_MENU` -- so the phantom press is never an `0xA0`..`0xA5`
event. Reading only those six can report everything `up` on a machine that is
holding `VK_SHIFT` down, which is a false PASS.

**FAIL**, the defect reproduced, is any modifier reported `DOWN` while nothing
is physically pressed, together with, in `keyboard_ll_identifier`:

- a `VK_SHIFT` KEYDOWN carrying `scanCode = 0xFF`
  (`SCAN_FLAG_KEYMAN_KEY_EVENT`, i.e. Keyman synthesized it), and
- **no matching KEYUP** anywhere after it.

**PASS**, with the fix in place, is all nine reported `up`, and no unmatched
synthesized KEYDOWN in the log. `ReconcileModifierCache` cleared the stale byte
at the top of `PrepareInjectedInput`, before `keybd_shift_reset` could act on it.

Note what the fix does and does not do. It prevents the latch from ever forming,
because it runs before the first phantom press. It cannot *recover* a process
that has already latched: once the phantom KEYDOWN has been sent the modifier is
genuinely held at the OS, cache and OS agree, and there is nothing left for a
`GetAsyncKeyState` check to see.

## Recovery

A plain KEYUP clears it, and no press is needed -- but it has to be the *same*
event shape Keyman injected, so this mirrors `do_keybd_event`: side-agnostic
virtual key, `KEYEVENTF_EXTENDEDKEY` for right Ctrl and right Alt, and
`SCANCODE_RSHIFT` for right Shift.

```ps1
Add-Type -Name Recover8064 -Namespace Probe -MemberDefinition '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, System.UIntPtr dwExtraInfo);'
$KEYEVENTF_EXTENDEDKEY = 0x01; $KEYEVENTF_KEYUP = 0x02
# vk, scan, extended
$ups = @(
  @(0x10, 0x2A, $false),  # VK_SHIFT   + SCANCODE_LSHIFT
  @(0x10, 0x36, $false),  # VK_SHIFT   + SCANCODE_RSHIFT
  @(0x11, 0x00, $false),  # VK_CONTROL            = left
  @(0x11, 0x00, $true),   # VK_CONTROL + extended = right
  @(0x12, 0x00, $false),  # VK_MENU               = left
  @(0x12, 0x00, $true)    # VK_MENU    + extended = right
)
foreach ($u in $ups) {
  $flags = $KEYEVENTF_KEYUP
  if ($u[2]) { $flags = $flags -bor $KEYEVENTF_EXTENDEDKEY }
  [Probe.Recover8064]::keybd_event([byte]$u[0], [byte]$u[1], [uint32]$flags, [UIntPtr]::Zero)
}
```

Ordinary physical typing does the same, which is why the bug appears to "fix
itself" once a user starts interacting, and why it has been so hard to catch in
the act. Restarting Keyman is the fallback.

The *typing* workaround is not available for a modifier the keyboard does not
physically have. `keybd_shift` emits a latched Right Ctrl as
`VK_CONTROL | KEYEVENTF_EXTENDEDKEY`, and only the exact matching KEYUP clears
it; tapping Left Ctrl does not. On a keyboard with no Right Ctrl key the user
cannot produce that event at all, which is the shape of the field reports that
say the symptom persists until a restart. The snippet above is not limited that
way -- synthesizing the extended KEYUP is exactly what it is for.

## Hazards

Each of these has already produced a false result.

- **Do not test with a bare Alt press and release.** That is the Windows
  menu-activation gesture and gives a near-perfect impersonation of this bug with
  Keyman uninvolved. Use Left Shift.
- **Do not clear the test field with keystrokes.** `Ctrl+A` then `Delete` works
  on a clean machine and fails silently the instant the wedge fires: with Shift
  latched it arrives as `Ctrl+Shift+A` and `Shift+Delete`, the field is never
  emptied, and every later reading includes the whole accumulated buffer. Select
  and retype, or restart Notepad.
- **Compare output case-sensitively** if you do read the text as a secondary
  signal. PowerShell's `-eq`, `-ne` and `-match` are case-insensitive, so wedged
  output compares equal to clean output; the symptom *is* a case change. Use
  `-ceq` / `-cne`.
- **Do not run this against an application holding real data.** Notepad is all
  the repro needs. Injected navigation keys sent without `KEYEVENTF_EXTENDEDKEY`
  insert characters instead of moving the caret, which has corrupted real
  documents during this investigation.
- **A negative result is not proof of a fix.** If step 5 was mistimed the stall
  and the KEYUP never coincided, and the test simply did not run. Repeat until
  `keyboard_ll_identifier` shows the Shift KEYUP genuinely missing from the log
  during the freeze window.
