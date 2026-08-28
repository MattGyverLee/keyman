# Serializer signal capture, 2026-08-28

Closes T067 and T069. `TRIAGE.md`'s serializer column was `[source-derived]` — the
wedge reproduced on demand but no run had ever captured the signals the document
tells a responder to read. This is that run.

Harness: `capture-8064-serializer.ps1`. Engine log captured by an embedded
`OutputDebugString` listener over `DBWIN_BUFFER`; no DebugView involved.

## Result

| signal | shipped | branch | verdict |
|---|---|---|---|
| `"cache says held but OS says up, clearing vkey=…"` | 0 | **4** | **`[measured]`** discriminating |
| `"Modifier cache feed posted/failed/skipped"` | 0 | **17** | **`[measured]`** discriminating |
| `"verification: OS holds vkey=… correcting"` | 0 | 0 | `[source-derived, rare by design]` (FR-012b) |
| injected scan code at the hook (`scan:ff`) | **37** | **24** | **`[measured]`** discriminating |
| path 6 — user-event re-injection | 0 | 0 | **not loggable** — see below |

Engine lines captured: **7362** shipped, **6115** branch.

The fourth row is the control. It is a *pre-existing* signal, present on both
builds, and it fires on both. That is what makes the zeros above it meaningful:
the log was demonstrably live on the shipped run, and the three branch-only
signals were absent because the code that emits them does not exist on
`origin/master`, not because nobody was listening.

Sample of the decisive branch line:

```
[48604] x86  keyman  ...  _kmnLowLevelKeyboardProc
        Modifier cache feed posted [vkCode:a0 isUp:0]
```

and the hook's own view of a Keyman-injected event:

```
sending input [i=12, input[0]=vk:['Backspace' 0x8] scan:ff flags:0
```

## Finding 1 — the engine log suppresses the defect

**The instrument changes the outcome.** Same shipped build, same machine, same
harness, one variable:

| run | engine log | result |
|---|---|---|
| A1 | off | **5/5 FAIL** |
| A2 | off | **5/5 FAIL** |
| A3 | **on** | **0/5 PASS** |

7362 `OutputDebugStringW` calls across five iterations add enough latency to close
the race window. Corroborated by the probe text: the unlogged runs transformed
cleanly to `1=OK 2=OK 3=OK `, the logged runs came back as `1=OK2=OK x` and
`1=OK 3=OK ` — keystrokes dropped, timing visibly disturbed.

**Consequence, and it is a trap worth naming.** A `0/5 PASS` on the branch build
*with logging on* proves nothing about the fix, because logging alone produces
`0/5` on the **unfixed** build. The two runs have strictly separate jobs and
neither can do the other's:

- **fix evidence** — unlogged only: `run-before-release-build.txt` 5/5 versus
  `run-after-branch-build.txt` 0/5, plus the two unlogged 5/5 runs of 2026-08-28
- **signal evidence** — logged only: this document

Anyone citing Run B's PASS as fix evidence is reading it wrong.

## Finding 2 — path 6 cannot be observed through the log

`UpdateLocalModifierState` (`serialkeyeventserver.cpp:581`) is a three-line
wrapper straight into `UpdateModifierCacheFromKeyEvent`, with no
`SendDebugMessage` of its own. It emits nothing, so no amount of running will make
it appear.

FR-010a requires every `cannot latch` verdict to be runtime-confirmed rather than
source-read, on the grounds that `cannot latch` is the only verdict leaving
nothing behind if it is wrong. Path 6 **cannot** meet that bar as the code stands.
It needs either one added log line, or a recorded decision to accept
`cannot latch [source-derived, not loggable]` with the reason it cannot be
forced — the same carve-out the rare-by-design signal gets. **Outstanding.**

## Finding 3 — "contrived" does not mean "rarely executed"

`AIWin2000Unicode::PostKeys` logged **245 times** in a five-iteration run. That is
producer row `8`, recorded as `UNMITIGATED (contrived)`. What is contrived is
*splitting the KEYDOWN/KEYUP pair* under queue truncation — not reaching the
function, which is on the hot path constantly. The issue draft should say so, or a
reader will take "contrived" to mean "hardly ever runs".

## Conditions

- Engine: stock released `keyman.exe`, branch `keyman32.dll` (4,197,376 bytes).
  Correct for the serializer, and `TRIAGE.md` says to triage against the build the
  user has — but this was **not** a full-branch run.
- Debug flags: `HKCU\Software\Keyman\Keyman Engine`, `debug` = 1,
  `debug to console` = 1. They are read **once**, at `Keyman_Initialise`
  (`keyman32.cpp:347`), so Keyman must be restarted after arming them. Arming under
  a running Keyman leaves `debug=FALSE` in `.SHARDATA` and the engine logs nothing —
  a silence indistinguishable from a signal that did not fire.
- Keyman is started by `kmshell.exe -s`. Launching `keyman.exe` directly returns
  success and then exits without ever appearing in the process list.
- `host32` must not be elevated, and neither must the shell that launches it.

## Finding 4 — `-Restore` restored the branch build and said `[OK]`

Deploying twice poisons the backup chain, and the restore then reinstates the very
thing it is meant to undo.

`-DeployBranchBuild` copies the *currently installed* DLL to
`gh8064-backup\keyman32.dll.<stamp>` before overwriting it. Run it a second time
while the branch build is already installed and the "backup" is the branch build.
`-Restore` takes `Sort-Object Name -Descending | Select-Object -First 1` — newest by
name — and picks it.

Observed on 2026-08-28, nine seconds apart:

```
keyman32.dll.20260828-120633   1,232,504   shipped
keyman32.dll.20260828-120642   4,197,376   branch, backed up over itself
```

The restore ran, printed `[OK] restored`, and left the machine on the branch Debug
DLL. Nothing in the chain checked the *size* of what it had restored.

Both halves are now guarded: `-DeployBranchBuild` refuses to back up a DLL that is
already the branch build (a second deploy is a no-op, not an error), `-Restore`
skips backups matching the branch size and says which it skipped, and the harness's
`restore` phase verifies the installed size afterwards instead of recording itself
done.

**Machine state at the end of this session:** the restore was re-run against a
genuine shipped backup. Anyone re-reading this should confirm
`keyman32.dll` is 1,232,504 bytes rather than assume it.

## What this run does NOT establish

- **Nothing about the fix.** See Finding 1. The fix evidence is the unlogged pair.
- **Nothing about path 6.** See Finding 2.
- **Nothing about ARM64**, still unverified per `IN-TREE.md` §6.
- **Nothing about the OSK rows.** Those were measured 2026-08-27 and are unchanged.
