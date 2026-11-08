# Path 6 and the `cannot latch` audit, 2026-08-28

Closes T070 (path 6 leg) and T070a, and records T072's standing. Companion to
[`serializer-signals-2026-08-28.md`](./serializer-signals-2026-08-28.md), whose
**Finding 2 is wrong** and is corrected here.

No new run. This is a re-reading of the two captures that run already produced,
`dbgview-shipped-2026-08-28.log` and `dbgview-branch-2026-08-28.log`, for a signal
the first pass missed.

## Finding A — path 6 *is* observable, on every build, and always was

`serializer-signals-2026-08-28.md` Finding 2 concluded that path 6 "cannot be
observed through the log", on the grounds that `UpdateLocalModifierState`
(`serialkeyeventserver.cpp:581`) is a three-line wrapper with no
`SendDebugMessage` of its own. That much is true and is not the question. The
question is whether *the pass through path 6* leaves a log line, and it does —
112 lines earlier, at the top of the same `WndProc`, before the input is even
built:

```
serialkeyeventserver.cpp:469
  SendDebugMessageFormat("hwnd=%x msg=%s wParam=%x lParam=%x
    m_ModifierKeyboardState=[LS:%x LC:%x LA:%x RS:%x RC:%x RA:%x]", ...)
```

It prints the message kind, the VK, **the flags word that becomes
`input.ki.dwFlags` verbatim** (`dwFlags = lParam & 0xFFFF`), and the modifier
cache as it stood on entry. Every `WM_KEYMAN_KEY_EVENT` and
`WM_KEYMAN_MODIFIER_EVENT` that reaches the re-injection emits one.

**It is not a branch signal.** The same line stands at
`serialkeyeventserver.cpp:442` on `origin/master`, so it is available on a
released build with `debug` = 1 — the only serializer-side signal that is. Both
captures carry it: **92 passes** shipped, **59** branch.

The first pass looked for a signal inside the callee and stopped there. The
lesson is the one FR-010a is built on: an absent signal has to be looked for at
the right frame before "absent" means anything.

## Finding B — row 6's `cannot latch` is now measured, not source-read

Row 6's verdict rested on a derivation: `dwFlags = lParam & 0xFFFF`, `lParam`
built by `LLKHFFlagstoWMKeymanKeyEventFlags`, which sets `KEYEVENTF_KEYUP` iff
`LLKHF_UP` — therefore direction is the user's direction. Three inference steps,
never observed. FR-010a asks for better, because `cannot latch` is the one verdict
that leaves nothing behind if it is wrong.

The branch capture supplies the observation directly. Two independent instruments
sit on either side of the `PostMessage` handoff:

- at the hook, `k32_lowlevelkeyboardhook.cpp:215` —
  `"Modifier cache feed posted [vkCode:%x isUp:%d]"`, the **source** direction
- at the serializer, `serialkeyeventserver.cpp:469` — `wParam` and `lParam`, the
  **mirrored** direction as path 6 will apply it

Matched in order, one to one:

| | branch |
|---|---|
| hook-side feed posts | **17** |
| serializer-side `WM_KEYMAN_MODIFIER_EVENT` passes | **17** |
| ordered `(vk, direction)` pairs compared | **17** |
| mismatches | **0** |

No pass inverted, duplicated, dropped or invented a direction. Across both
captures, **65** modifier-VK passes went through the re-injection and the low word
of `lParam` was only ever `0x0000` (down), `0x0002` (up) or `0x0003`
(extended up) — never any other value, and never an up where the hook had seen a
down:

| | shipped | branch |
|---|---|---|
| modifier-VK passes | 38 | 27 |
| `0x0000` — KEYDOWN | 2 | 12 |
| `0x0002` — KEYUP | 22 | 8 |
| `0x0003` — extended KEYUP | 14 | 7 |
| any other low word | **0** | **0** |

Row 6: **`cannot latch [measured]`**. The shipped run has no feed lines to pair
against — the feed signal is branch-only — so the 1:1 match is a branch
observation; the direction census holds on both.

**What this does not cover.** The 1:1 match is taken at the frame that *builds*
`input.ki.dwFlags`, not inside `UpdateLocalModifierState` itself. Between them lie
`dwFlags = lParam & 0xFFFF` and `dwFlags & KEYEVENTF_KEYUP ? TRUE : FALSE` — two
statements, still read rather than observed. That is a materially shorter
inference than the three-hop derivation it replaces, and it is as close as the
code allows without adding a log line.

## Finding C — the `cannot latch` audit (T070a)

Every row carrying `cannot latch`, and what its verdict actually rests on. The
distinction that matters is **structural literal** versus **inference**: a
`KEYEVENTF_KEYUP` written as a literal in the only call in the file is settled by
reading it, and a runtime observation adds nothing a compiler has not already
guaranteed. An inference chain is a different thing and is what FR-010a is aimed
at.

| row | producer | rests on | verdict |
|---|---|---|---|
| 3 | language-switch shift release, `kmhook_keyboard.cpp:147` | **structural literal** — `KEYEVENTF_KEYUP` written in the only call in the file | source-read is decisive; not exercised in either capture |
| 4 | Caps Lock sync, `kmprocessactions.cpp:101-102` | **structural literal** — unconditional adjacent down/up in one `if`, no return or call between, `keybd_event` is `void WINAPI` | source-read is decisive; `VK_CAPITAL` never appeared in either capture, and is outside the managed six |
| 5 | `PostDummyKeyEvent`, `keyman32.cpp:923-926` | **structural literal** — same adjacency | source-read is decisive; not exercised |
| 6 | user-event re-injection, `serialkeyeventserver.cpp` | **was inference, now measured** | **[measured]**, Finding B |
| 7 | AltGr Left Ctrl simulation, `serialkeyeventserver.cpp` | **structural literal** — `KEYEVENTF_KEYUP` literal on `input[0]`, both events releases by construction | source-read is decisive. Its guard (`VK_RMENU` + extended + KEYUP + `GetKeyState(VK_LCONTROL) < 0`) was **never satisfied** in either capture: the trigger VK and flags occurred, `LC` was `0` on all 151 passes, so the branch was not entered. Not observable without an AltGr layout in the loop |
| — | `USendInputString`, `USendInputString.pas:60` | **structural literal** — `ki.wVk := 0` always; cannot express a modifier VK | source-read is decisive |

**Audit result:** one row rested on inference and now rests on an observation. The
other five rest on compile-time structure, and the audit records that as the
reason rather than leaving them looking unexamined. No row was found to be resting
on a hopeful reading.

## Finding D — `keybd_event` with `bScan = 0` does propagate as scan `0`

[`TRIAGE.md`](../TRIAGE.md)'s scan-code row carried an open caveat: *"whether
Windows propagates the OSK's `bScan = 0` rather than back-filling a scan code for
`keybd_event` is unverified. Confirm once before relying on it."*

Half-answered, and the half that is answered is the useful direction. At the end
of the shipped capture the recovery sweep's `keybd_event(vk, 0, KEYEVENTF_KEYUP,
0)` arrived with scan `0` intact for `a0`, `a2` and `a4` — `lParam=2`, high word
empty. Windows did not back-fill.

It does not always leave it alone. Earlier events in the same run, including
sweep-shaped `a0` releases, carried real scan codes (`0x2a`, `0x1d`, `0x36`,
`0x38`). So:

- **`scan == 0` at the hook is trustworthy as a positive**: something injected
  with `bScan = 0`, which on a released build means the OSK.
- **`scan != 0` does not exculpate a `bScan = 0` injector.** The absence is not
  evidence.

That is a weaker signal than the row implied and it is now recorded as such.

## Finding E — the generic-VK gap was not exercised

`MODIFIER-PRODUCERS.md` *Known theoretical gap* turns on a third party injecting
generic `VK_SHIFT`/`VK_CONTROL`/`VK_MENU`. Neither capture contains a single pass
for `0x10`, `0x11` or `0x12` — 151 passes, all of them chiral or non-modifier. The
gap stays theoretical, and now says so from a count rather than from an
expectation.

## Finding F — `PostKeys` is on the hot path (row `8`)

Recorded here because it is the shape of misreading the issue draft invites.
`AIWin2000Unicode::PostKeys` logged **245 times** in the five-iteration run. Row
`8`'s `UNMITIGATED (contrived)` label describes the *pair-splitting under queue
truncation*, not the reachability of the function, which is constant. Folded into
Finding 3 and Issue 4 in `MODIFIER-PRODUCERS.md`.

## T072 — a Keyman-only restart: still unmeasured, and deliberately so

Neither capture bears on it. Nothing was restarted mid-run, so this is an
expectation to test, not a result, and it stays that way per
`specs/002-8064-residual-gaps/spec.md`, which leaves the question open on purpose
and forbids building anything on it:

- For an **OSK-stranded** modifier a Keyman-only restart should **not** clear it.
  Row `2c` establishes there is no persisted record of an outstanding sticky
  modifier and no restore-on-start reconciliation, so a restart has nothing to
  reconcile from.
- For the **serializer** path the cache dies with the process, so a restart clears
  the *cache* — but the OS still holds the key the dead process pressed. Expect
  the modifier to stay down.
- **The confusable case:** restarting `keyman.exe` *does* recover the separate
  `VKI=nil` fault (`../kmrepro/TODO.md` I19). A responder who restarts, sees
  something improve, and concludes the stuck modifier cleared has measured the
  wrong fault.

Recorded as an observation-only gap. No procedure in [`TRIAGE.md`](../TRIAGE.md)
depends on the answer.

## Method

Re-read only; no engine was run. Both captures parsed for
`serialkeyeventserver.cpp:469` and `k32_lowlevelkeyboardhook.cpp:215`, matched in
file order by `(vk, direction)`.

**Where to check the counts.** The raw captures are **not in the repository** and
cannot be: the root `.gitignore:28` ignores `/windows/src/**/*.log`, and they are
1.0 MB and 0.8 MB. Every line cited by this document and by
`serializer-signals-2026-08-28.md` is extracted verbatim, with its original line
number, into [`dbgview-excerpt-2026-08-28.txt`](./dbgview-excerpt-2026-08-28.txt) —
151 `SerialKeyEventServer::WndProc` passes, 17 `Modifier cache feed` posts, the 4
`ReconcileModifierCache` clears, in file order. That file is tracked, so the counts
above are checkable without the originals. What it does **not** carry is the
denominators — the 7362 and 6115 total engine lines, and Finding F's 245 `PostKeys`
calls, which are properties of the whole capture.
