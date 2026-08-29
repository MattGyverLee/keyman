# The case for the #8064 changes

Companion to [README.md](./README.md) (how to reproduce),
[MODIFIER-PRODUCERS.md](./MODIFIER-PRODUCERS.md) (what can produce it),
[TRIAGE.md](./TRIAGE.md) (how to tell the paths apart) and
[TIMELINE.md](./TIMELINE.md) (the four-year lineage, with release versions). Those three record what
was found. This one argues why it should be believed, and states what it does
not claim.

It is written against four objections, three of them raised verbatim in review:

1. *"Not convinced that freeze is same root cause."*
2. *"Freezing the keyman process should not impact tracking of modifiers."*
3. *"Messages are reliable in Windows - they don't get dropped under load."*
4. *"We do have code around resilience there."*

**The short version.** None of this is a new theory about freezes. Commit
`711541be60` (Marc Durdin, 2025-11-17, `Fixes: #8064`) already established the
freeze-to-stuck-modifier chain, named its field cause and frequency, and shipped
`fakefreeze` as the sanctioned way to simulate it. That commit lists two
consequences of hook loss and fixes one of them. This branch fixes the other. See
the next section before reading any further; it makes most of Claim 1 redundant.

## One invariant, and why the investigation looks so wide

The work touched chirality, timing, stalls, caches, provenance and the OSK, which
reads as six problems. It is one, and the others are axes rather than defects.

**The invariant:** for every modifier KEYDOWN that reaches the OS, a matching
KEYUP must also reach it. An unmatched KEYUP is harmless — it asserts nothing. An
unmatched KEYDOWN is the bug, and there is nothing else the bug can be.

Everything else in these documents answers one of four different questions about
that single invariant:

| axis | question it answers | why it looked like a separate problem |
|---|---|---|
| **the caches** | *what gets pressed* | `keybd_shift_reset` presses exactly what its cache says is held, and nothing else in the serializer can emit a modifier press. The cache is the actuator, so it is where the fix has to go |
| **stalls and timing** | *why the cache is wrong* | five routes reach the same wrong state: a hook bypassed during a stall, the launch seed, a NULL server window, an eaten event whose handoff failed, and the native pass-through paths. The reconcile does not care which |
| **chirality** | *whether the user can recover* | a phantom generic `VK_SHIFT` clears on the next keypress; a phantom extended `VK_RCONTROL` on hardware with no Right Ctrl key never clears. Same defect, and the difference between "it fixed itself" and "I had to reboot" |
| **provenance** | *whether the cache can be fed correctly at all* | the `0xFF` scan overload cannot mark an injected Right Shift, because Shift's chirality lives in the same field. So Keyman's own wrap events entered the cache as if the user had pressed them |

And the OSK is not an axis. It is a second, independent actuator — different
process, different language — violating the same invariant on its release side.
Hence three vectors, not one, and three fixes that could ship as three PRs.

**The reason it took this long, and the honest root cause.** Keyman for Windows
maintains at least seven separate representations of "which modifiers are down":

| representation | owner |
|---|---|
| `Globals::get_ShiftState()` | engine global — the one `I4843` added a log column for in 2015 |
| `SerialKeyEventServer::m_ModifierKeyboardState` | serializer cache, 2018 |
| `kbd.ShiftState` | OSK visual keyboard |
| `kbd.LRShift` | OSK chirality regime |
| `FShiftState` | OSK form |
| `FCachedShiftState` | OSK, what was clicked |
| `GetAsyncKeyState` / `GetKeyState` / `GetKeyboardState` | the OS, in three flavours with three different meanings |

None is authoritative, none is derived from another, and no two are compared
anywhere except in the `I4843` log columns and — now — in
`ReconcileModifierCache`.

**Every defect examined in detail on this branch is two of those representations
disagreeing** — row 1 is the cache against the OS, rows 2a/2b are
`FCachedShiftState` against `kbd.LRShift`. Whether that generalises to the whole
lineage is a reasonable guess and not a finding: #1620, #7337 and #7716 were not
root-caused here, only dated. What the seven do explain is why the defect cannot
be grepped for and why it is defined by a state rather than an event.

This branch does not unify them. It adds the missing comparison at the one point
where a disagreement becomes a machine-wide keypress, and it says so rather than
claiming more.

## What would change my mind

Stated first, because a claim that cannot be falsified is not worth reviewing.

- If `m_ModifierKeyboardState` has a third writer I have missed, the stale-cache
  mechanism is wrong. Two writers is the whole argument, and it is one grep.
- If `RestartLowLevelHook` or anything else on the reinstall path re-derives
  modifier state, the outage is self-healing and row 1 is not a defect.
- If a shipped `keyman32.dll` does not wedge under
  `host32.exe --probe 1x2x3x --iterations 5`, my measurement is an artifact of my
  harness. The harness is in this directory; it scores itself INCONCLUSIVE rather
  than PASS when its preconditions are unmet, and it wedged 5 of 5 on the shipped
  build and 0 of 5 on the fixed one with the DLL as the only variable.
- If a `debug`-enabled 18.0 build never logs `Attempting to reinstall hook
  because watchdog threshold exceeded` during ordinary loaded work, the
  precondition may be rarer than `711541be60` describes and the *relative*
  weight of the five divergence routes is wrong. It would not make the fix
  unnecessary — see *The fix does not rest on the freeze* — but it would change
  which route the field reports should be attributed to. **This is the cheapest
  outstanding check and it is one I can run myself; it should be done before
  arguing the point further.**
- If the enumeration in MODIFIER-PRODUCERS.md has missed a producer that can
  assert a modifier the user is not holding, the by-elimination attribution of a
  non-OSK field report to the serializer path is unsound.

## Nothing here claims one root cause

Agreed up front, because it was raised and it is correct: the OSK path and the
serializer path are **different causes**. They are not one bug reported twice.
What they share is a terminal state, and that is why users cannot tell them
apart:

| | serializer path | OSK path |
|---|---|---|
| process | `keyman32.dll`, in every hooked process | `keyman.exe` |
| language | C++ | Delphi |
| OSK open at the time | irrelevant | required |
| trigger | main thread stalls while a modifier KEYUP is in flight | click a sticky modifier, then switch keyboard or dismiss |
| what is emitted | side-agnostic `VK_SHIFT`/`VK_CONTROL`/`VK_MENU`, scan `0xFF` | chiral `VK_RCONTROL` etc., scan `0` |
| cleared by ordinary typing | yes | not if the key is absent from the hardware |
| fix | `ReconcileModifierCache` + post-batch verification | `FormDestroy` reachability + release by injected identity |

They are separately reviewable, and the branch can be split into three PRs on
those lines — OSK, hook pipeline, serializer — if that is easier to land. Nothing
in the serializer fix depends on the OSK fix or the reverse.

The rest of this document is about the vector that was doubted: the one needing
no OSK, which is the one matching the field report of *"arises without having OSK
ever open"*.

---

## The equivalence is already on record, and not mine

The argument I have been making badly is that the `fakefreeze` reproduction
stands in for a field condition. It does not need to stand in for anything. The
field condition, its mechanism, its cause, its frequency and its consequences
were all written down nine months ago, in the commit that created `fakefreeze`.

`711541be60`, Marc Durdin, 2025-11-17, `Fixes: #8064`. It added
`LowLevelHookWatchDog.{cpp,h}`, the `KMC_WATCHDOG_FAKEFREEZE` handler, and
`windows/src/support/fakefreeze` — all in one commit. Cherry-picked to
`stable-18.0` as `83251358b0` and shipped from **18.0.245** onward, so it is in
users' hands today. Its message:

> This change improves the stability of Keyman for Windows by monitoring the
> health of the low level keyboard hook. If keyman.exe is unresponsive at any
> time, Windows can silently uninstall its low level keyboard hook, which results
> in (at least) two problems:
>
> * Keyman's hotkeys stop working
> * **A modifier key can become stuck, if it was pressed around the time Keyman
>   became unresponsive.**
>
> The most common scenario in which Keyman can become unresponsive is high system
> load, e.g. rendering graphics, videoconference calls, compiling software.
>
> Restarting Keyman always resolved both of these two issues in the past, but
> with this patch, I hope that this will no longer be necessary.
>
> A related 'fakefreeze' project is included for simulating a keyman.exe hang by
> posting a `wm_keyman_control:KMC_WATCHDOG_FAKEFREEZE` message to it, which
> keyman.exe responds to by `Sleep()`ing for 5 seconds. **While keyman.exe is
> freezing, any keystroke will cause the low level hook to be uninstalled by
> Windows.**

Every question I was trying to answer with a harness is answered there, by the
person who wrote the code:

| question | answer, from `711541be60` |
|---|---|
| does keyman.exe become unresponsive in the field? | yes — *"If keyman.exe is unresponsive at any time"* |
| why? | *"high system load, e.g. rendering graphics, videoconference calls, compiling software"* |
| how often? | *"the most common scenario"* — the framing of a known, recurring condition |
| what does Windows do about it? | *"Windows can silently uninstall its low level keyboard hook"* |
| does that produce a stuck modifier? | yes — *"A modifier key can become stuck, if it was pressed around the time Keyman became unresponsive"* |
| what did users do about it? | *"Restarting Keyman always resolved both of these two issues in the past"* |
| is `fakefreeze` a valid simulation of it? | it was built for exactly that — *"for simulating a keyman.exe hang"* — and the commit asserts the consequence directly |

So using `fakefreeze` to wedge a modifier is using the tool for its stated
purpose, on the issue it was written for. The reproduction is not contrived
relative to the field; it is the author's own simulation of the field.

### What that commit fixed, and what it did not

It lists two consequences of hook loss. The watchdog closes one of them:

| consequence | reinstalling the hook fixes it? |
|---|---|
| Keyman's hotkeys stop working | **yes.** The hook returns and hotkeys resume |
| a modifier key can become stuck | **no.** `RestartLowLevelHook` restores the hook and does not touch `m_ModifierKeyboardState`. Nothing else re-derives it. The stale byte outlives the outage, and `keybd_shift_reset` presses it for real at the head of every later injected batch |

That is this branch's entire serializer-side contribution, and it is one
sentence: **the reinstall restores the hook but not the modifier cache.**

### The watchdog was present in the build that failed 5 of 5

This is the part that makes "not fixed" a measurement rather than an argument.
The reproduction in `evidence/run-before-release-build.txt` was run against the
installed shipped engine, identified in README.md only by
`keyman32.dll` = 1,232,504 bytes. That build is:

```
C:\Program Files (x86)\Common Files\Keyman\Keyman Engine\
  keyman.exe     size=4251768  ver=18.0.249.0
  keyman32.dll   size=1232504  ver=18.0.249.0
```

18.0.249 is downstream of the watchdog's cherry-pick: `83251358b0` is contained
by `release@18.0.245` through `release@18.0.249` (`git tag --contains
83251358b0`). The code is verifiably in the shipped binary, not merely in the
version range — its log strings are present in that exact DLL:

```
"Attempting to reinstall hook because watchdog threshold exceeded"  -> keyman32.dll
"Keyman_WatchDogKeyEvent"                                           -> keyman32.dll
"reinstall low level hook"                                          -> keyman32.dll
"kmc_fakefreeze begin" / "kmc_fakefreeze end"  (UTF-16)             -> keyman.exe
```

So: **the watchdog shipped, and its code is present in the build that wedged a
modifier on 5 of 5 iterations.** Present, not proven to have fired — that
distinction is the subject of *The one thing this demonstration does not yet
show*, below, and it is not a quibble. The same harness against the fixed engine wedged 0 of 5,
with the DLL as the only variable.

Note also, from the same binary check: `"Watchdog: low level hook reinstalled"` —
the Sentry message from `930ae121c4` — is **absent** from 18.0.249's
`keyman.exe`. That confirms by inspection what the branch history implies: the
18.0 population has the watchdog and no telemetry from it.

### Why reinstalling the hook cannot fix it

The watchdog's remedy is `RestartLowLevelHook`: `UninitLowLevelHook` then
`InitLowLevelHook`. That restores the **transport**. The stuck modifier is not
caused by the transport being down — it is caused by the **state that diverged
while it was down**, and that state lives somewhere the remedy never reaches:
`m_ModifierKeyboardState`, on the serializer's own thread, written only from the
hook's posted messages.

The two consequences in `711541be60` are different classes of failure with the
same trigger, which is why one remedy covers only one of them:

| | hotkeys stop working | a modifier key becomes stuck |
|---|---|---|
| failure class | transport | state |
| persists after the hook returns? | no — the next keystroke works | **yes** — the byte is still set |
| what would fix it | put the hook back | re-derive the state |
| `RestartLowLevelHook` does | exactly that | nothing |

Reinstalling the hook after the KEYUP has already been missed restores delivery of
future events. It does not recover the event that was missed, and nothing else
re-derives the cache from the OS, so `keybd_shift_reset` acts on the stale byte at
the head of the next injected batch and presses the modifier for real.

### The edit history of the two mechanisms

The claim that the watchdog and the modifier cache are separate concerns that
have never been connected is checkable, so here is the record. Both tables are
`git log` output over `windows/src/engine/keyman32`, mapped to the first release
tag containing each commit.

**Caveat on the release column.** The repository's earliest release tag is
`release@17.0.30-alpha`, created 2023-01-17. Every commit older than that reports
it as its first containing tag, which is a tagging-floor artifact rather than a
shipping version — so those rows are marked *pre-tagging* and dated instead.

#### The modifier cache and the batch wrapper

| date | commit | first release | effect on the cache |
|---|---|---|---|
| 2018-10-02 | `eff9f834de` | pre-tagging | serializer introduced. `keybd_shift` / `keybd_shift_reset` begin wrapping every injected batch in a modifier release and restore |
| 2018-10-03 | `7e2c21b8a7` | pre-tagging | serialized input refactored onto `WH_KEYBOARD_LL`. The hook becomes the cache's only feeder |
| 2018-10-10 | `738e1946a6` | pre-tagging | **`m_ModifierKeyboardState` created**, with the one-time `GetKeyboardState` seed in `InitThread` — and in the same commit the per-batch `GetKeyboardState(kbd)` **deleted** from `keybd_shift_release`, the parameter changed to `LPBYTE const kbd`. **this is where the self-correction was lost** — see the caveat below |
| 2018-10-19 | `b395f7b122` | pre-tagging | `USE_SERIALEVENTSERVER` removed; `flag_ShouldSerializeInput` becomes the runtime gate |
| 2019-02-25 | `eb92df40de` | pre-tagging | **#1620** — AltGr causes sticky Left Control. First sticky-modifier fix in the serializer |
| 2020-10-02 | `0406cb1381` | pre-tagging | Coverity cleanups |
| 2022-10-13 | `90eb7c77ec` | pre-tagging | *"ensure all modifier events go to seralized queue"* — the #7337 fix |
| 2022-10-26 | `102f34ecb0` | pre-tagging | `WM_KEYMAN_MODIFIER_EVENT` converted to a private `WM_USER` message |
| 2022-12-21 | `2c02d34746` | pre-tagging | **#7716** — `isModifierKey` (nine VKs) added and the post lifted out of the hotkey branch, so every modifier event now feeds the cache |
| 2024-06-03 | `f7391e3a46` | **18.0.48-alpha** | #8064 debug logging on modifier press — the `//TODO: #8064` messages |
| 2024-07-03 | `1be73a9c2e` | **18.0.77-alpha** | logging cleanup across `keybd_shift` and the serializer |
| 2025-10-08 | `50ffbb2722` | **19.0.139-alpha** | AltGr's simulated `VK_LCONTROL` (scan `0x21D`) routed to the OSK; touches `isModifierKey` |
| this branch | — | — | `ReconcileModifierCache`, `ComputeModifierReleaseState`, `PrepareModifierVerificationCorrection`, `IsKeymanInjectedKeyEvent` |

#### How the managed modifier set got its shape

Not required for the fix, but it explains why Right Shift is the awkward one, and
it corrects a natural misreading of the history — that Shift came first and
Ctrl/Alt were added later. It is the other way round.

| date | tag | what entered `keybd_shift.cpp` |
|---|---|---|
| 2003-07-29 | — | **Right Ctrl / Right Alt chirality**, via the extended-key bit — dated only by a migrated in-code comment in `keybd_sendshift` (*"Handle sending correct Right C/A 'extendedkey' bit"*), not by repo history, which starts in 2017 |
| 2009-12-11 | I934 | file created, during the x64 work (`Create Date` in its header) |
| 2014-12-31 | I4548 | the chiral Alt and Ctrl branches in their modern shape — *"When Alt is down, release of Ctrl, Shift is not detectable within TIP in some languages"* |
| 2015-08-09 | I4843, I4844 | the `ModifierState` / `ActualModifierState` log columns; `PostDummyKeyEvent` tidy-up |
| **2017-08-08** | **#140** | **chiral Shift.** `VK_LSHIFT` / `VK_RSHIFT` enter the file, `do_keybd_event` gains `case VK_RSHIFT: scan = SCANCODE_RSHIFT`, and the long doc comment on that function is written |
| 2018-10-02 | — | `eff9f834de` gives the six-VK chiral array its current form |

So Ctrl and Alt have been handled chirally since well before the repo begins —
2003 per that comment. Shift was generic —
a single `VK_SHIFT` tested against `K_SHIFTFLAG` — until #140 in August 2017.

**And that ordering is why Right Shift is the blind spot.** Shift is the only
modifier whose chirality is carried *by the scan code*: Ctrl and Alt use the
extended-key flag, leaving their scan code free. Keyman's provenance trick also
uses the scan code — the `0xFF` `SCAN_FLAG_KEYMAN_KEY_EVENT` overload. So chiral
Shift and provenance-marking compete for the same field, and chirality has to
win, or the receiving app cannot tell which Shift it was.

`b296b7fa8f` says so at the time, in the comment it added:

> However, this will obviously not work with Right Shift, which is differentiated
> from Left Shift _only_ by scan code. Fortunately, we can afford to not care
> about this -- it means a little extra flag setting behind the scenes as the
> right shift key is released and re-pressed during key events, but nothing too
> dramatic.

That judgement was made in 2017, before the modifier cache existed. Once the cache
arrived in 2018 and started being fed from the hook, "a little extra flag setting
behind the scenes" became "the cache cannot tell its own Right Shift injections
from the user's" — which is what `EXTRAINFO_FLAG_KEYMAN_MODIFIER_WRAP` fixes, by
moving provenance onto `dwExtraInfo` where it does not compete with chirality.
rc-swag independently arrived at this same comment while reading the field logs.

#### The one commit that created the defect

Worth isolating, because it dates the bug precisely and because it makes the fix
look like a restoration rather than an invention.

From 2003 until 2018-10-10, `keybd_shift`'s release half re-derived modifier
state from the OS on every single batch. The 2017 open-source seed still shows it:

```cpp
BOOL keybd_shift(LPINPUT pInputs, int *n, BOOL FReset) {
  BYTE kbd[256];
  if (FReset) {
    memset(kbd, 0, sizeof(kbd));
    AShiftFlags = Globals::get_ShiftState();   // restore half: Keyman's tracked state
  } else {
    GetKeyboardState(kbd);                     // release half: a LIVE read, every batch
    AShiftFlags = 0;
  }
```

`eff9f834de` (2018-10-02) split it into `keybd_shift_release` /
`keybd_shift_reset` and **kept** the live read inside the release half. Eight days
later, `738e1946a6` removed it:

```diff
-void keybd_shift_release(LPINPUT pInputs, int *n, LPBYTE kbd) {
+void keybd_shift_release(LPINPUT pInputs, int *n, LPBYTE const kbd) {
-  GetKeyboardState(kbd);
-
```

The parameter became `LPBYTE const kbd` — deliberately read-only, so it could no
longer re-derive — and the same commit introduced
`GetKeyboardState(m_ModifierKeyboardState)` in `InitThread`. **A per-batch read
was traded for a once-per-process seed, in one commit, on 2018-10-10.** From that
day both halves of every wrap have trusted a cache that nothing re-derives.

**The caveat, and it limits the claim.** Whether that deleted line was *effective*
self-correction is unverified. `keybd_shift_release` runs on the serializer's own
thread, and `GetKeyboardState` reads the calling thread's processed input queue —
so the value it returned there may not have reflected live hardware state. This
branch's `FreshThreadKeyboardStateReflectsLiveModifiers` measures a thread that
has **never pumped input**, which is `InitThread`'s case, not this one: by the
time batches run, the serializer thread has a window and a message loop. So the
defensible claim is narrower than "the fix was removed": **a per-batch
re-derivation attempt existed until 2018-10-10 and has not existed since.**
Whether it worked is a separate question nobody has answered, and it could be
answered by the same probe run on a pumping thread.

Why it was removed is not stated, and the likely reason is sound: after the
split, `keybd_shift_release` runs on the serializer's own thread, and
`GetKeyboardState` documents itself as reading the *calling thread's* processed
input queue — which a thread that never pumps input should not have. Moving the
read to a single seed is the natural response to that. (Measured, a queue-less
thread's `GetKeyboardState` in fact returns live state —
`FreshThreadKeyboardStateReflectsLiveModifiers` — but that is a surprise, not
something to design against.)

Which is why `CaptureLiveModifierState` uses **`GetAsyncKeyState`**: it is
thread-independent by contract, so it does the job the deleted
`GetKeyboardState` was doing without the assumption that made removing it
reasonable. The reconcile is the 2018 live read put back, with the right API, and
clamped to clear-only.

Twelve edits over eight years. Every one of them either created the cache, widened
what feeds it, or logged it. **None added a way to correct it.** From
`738e1946a6` to today there has been no re-derivation, no resync, and no
comparison against live state — the cache is seeded once in `InitThread` and
thereafter trusted absolutely by `keybd_shift_reset`. That absence is the defect,
and it is what the last row fills.

Note also the two rows that widened the feed. #7337 and #7716 both made the cache
a *more* complete record of what the hook saw, which strengthened exactly the
assumption that fails when the hook sees nothing. Neither was wrong; both raised
the cost of the missing correction path.

#### The watchdog

| date | commit | first release | effect |
|---|---|---|---|
| 2025-11-17 | `711541be60` | **19.0.165-alpha** | `LowLevelHookWatchDog`, `RestartLowLevelHook`, the `KMC_WATCHDOG_FAKEFREEZE` handler and `support/fakefreeze`. Tagged `Fixes: #8064` |
| 2025-11-21 | `83251358b0` | **18.0.245** | cherry-picked to `stable-18.0` |
| 2025-12-10 | `930ae121c4` | **19.0.177-alpha** | Sentry event on reinstall. Master only; never cherry-picked to `stable-18.0` |

Three commits, all within four weeks, none of which touches
`m_ModifierKeyboardState`, `UpdateLocalModifierState`, `keybd_shift`, or
`serialkeyeventserver.cpp`. Confirm with
`git log -S RestartLowLevelHook -- windows/src/engine/keyman32` (one commit) and
by diffing `711541be60` against the file list in its own commit stat.

For completeness: `711541be60` *does* edit
`k32_lowlevelkeyboardhook.cpp`, by two lines. They are the liveness heartbeat —
`LowLevelHookWatchDog::HookIsAlive();`, now at line 144, plus its include. The
modifier cache-feed block further down the same function is untouched.

#### What the two tables show together

**The two mechanisms have never been edited in the same commit.** Hook liveness
and modifier-cache correctness have been maintained as unrelated concerns for
eight years, and they are not unrelated: the cache is downstream of hook
liveness, and it is the only consumer that cannot recover on its own when hook
liveness lapses. This branch does not touch the watchdog either; what it adds is the correction
the reinstall path never performed, which is the whole of its serializer-side
novelty.

It also puts the recurrence rate in view. Sticky-modifier fixes in this
neighbourhood: #1620 (2019), #7337 (2022), #7716 (2022), #8064 (2023, open),
`50ffbb2722` (2025). Five attempts in six years, none with a regression test
until this branch — which is the argument for the test count in Claim 3, not an
apology for it.

### The one thing this demonstration does not yet show

The 5 iterations were captured with the engine log **off** — README.md says so,
and the pass/fail oracle reads `GetAsyncKeyState` rather than a log. So what is
proven is that the watchdog *code* was in the failing build. It is not proven that
the watchdog *fired* during those five iterations.

Closing that is one re-run, and it would produce the strongest single artifact
available: with `debug` = 1 and `debug to console` = 1, one capture containing
both

```
Attempting to reinstall hook because watchdog threshold exceeded at N msec
```

and the wedge in the same timeline — the watchdog having run, and the modifier
having stuck anyway. Expect the reinstall line to appear *after*
the freeze ends rather than during it: detection runs through
`KMC_WATCHDOG_KEYEVENT`, posted to the master controller and handled in
`UfrmKeyman7Main.pas` on keyman.exe's main thread, which is the thread being
slept. That is a property of the detection path, not a defect in it, and it does
not change the outcome.

**This is the experiment to run before the next review round.**

And this was not left as an open question by anyone. Two days after the
cherry-pick merged, the bot auto-closed #8064 via #15219 and the commit's own
author reopened it the same day:

> **mcdurdin, 2025-11-26:** *"@rc-swag notes that stuck key logs still have
> lowlevelkeyboardproc messages, so this probably does not resolve that issue."*
>
> **mcdurdin, 2025-11-28**, on the bot's "Closed by #15219": *"Nope, see above.
> My bad"*

#8064 stands **open** at milestone **20.0**. So the branch does not have to argue
that #8064 is unfixed — that is the tracker's current state, on the author's own
assessment. See [TIMELINE.md](./TIMELINE.md).

**And the stated reason for it not being fixed is evidence I have to take
seriously rather than argue around.** rc-swag's field logs show
`lowlevelkeyboardproc` messages *present* during stuck-key events, so the hook
was alive in those captures and hook loss cannot explain them. That is why the
freeze story draws scepticism from someone holding those logs, and the scepticism
is well-founded as an objection to *the freeze being the route*. It is not an
objection to the fix, because the fix acts on the divergence rather than on its
cause, and four of the five known divergence routes need no hook loss at all —
see *The fix does not rest on the freeze* below.

The PR should therefore be framed as **completing `711541be60`**, not as proposing
a mechanism, and the freeze should be presented as the route that can be driven on
demand rather than as the route users hit. The serializer-side disagreement then
reduces to one checkable claim about which state `RestartLowLevelHook` restores,
settled by reading `keyman32.cpp:482`.

---

## Claim 1 — the mechanism, link by link

Supporting detail for the section above, kept because each link is separately
checkable and because the objections were raised against the mechanism rather
than against the commit that documents it.

### The cache has exactly two writers

`SerialKeyEventServer::m_ModifierKeyboardState` is written in two places and
nowhere else:

| writer | when |
|---|---|
| `GetKeyboardState(m_ModifierKeyboardState)` — `serialkeyeventserver.cpp:254` | once, in `InitThread` |
| `UpdateLocalModifierState` — `serialkeyeventserver.cpp:581` | on `WM_KEYMAN_MODIFIER_EVENT` and `WM_KEYMAN_KEY_EVENT` only |

Check with `grep -n m_ModifierKeyboardState serialkeyeventserver.cpp`; the
remaining hits are the constructor's `memset`, three reads, and a debug line.

Both of those messages are posted from exactly one place:
`_kmnLowLevelKeyboardProc` in `k32_lowlevelkeyboardhook.cpp`. The cache is
therefore a pure function of what that hook procedure sees. There is no periodic
resync, no re-seed, and no reconciliation against the OS anywhere in the file.

### The hook procedure runs on the thread the freeze blocks

Not my finding — `LowLevelHookWatchDog.cpp:16-20`, on master:

> These two hooks both receive key events, but the `WH_GETMESSAGE` hook runs in
> the focused thread context, whereas `WH_KEYBOARD_LL` runs in keyman.exe main
> thread context.

`KMC_WATCHDOG_FAKEFREEZE` is handled at `UfrmKeyman7Main.pas:868` with a bare
`Sleep(5000)` on that same main thread. So *"freezing the keyman process should
not impact tracking of modifiers"* has the causality inverted: modifier tracking
is **implemented in** the thread being frozen. While it is blocked, the hook
procedure cannot run, and the only writer of the cache is never called.

### "Messages are reliable in Windows" — agreed, and it is not a message problem

This is the objection worth answering most precisely, because it is true and it
does not apply.

The cache does not go stale because a posted message was dropped. It goes stale
because **no message is ever posted**. Per the `LowLevelKeyboardProc` remarks,
Windows does not wait on a hook that exceeds `LowLevelHooksTimeout`: it passes
the event along, and may remove the offending hook. The watchdog's own header
states the consequence:

> The hook can be uninstalled when keyman.exe becomes unresponsive for more than
> 200msec (default timeout) -- this can be due to something Keyman is doing, but
> it could also happen during high system load. The hook will only be
> uninstalled if a key is pressed while Keyman is unresponsive.

That is the precondition, documented on master before this branch existed. The
event never enters `_kmnLowLevelKeyboardProc`, so `PostMessage` is never reached,
so `UpdateLocalModifierState` is never called for it. Message reliability is not
in the chain.

There is one narrower case where a message genuinely is lost while `PostMessage`
reports success, worth naming because it is the single place where "messages are
reliable" could have been the defence:

```cpp
PostMessage(ISerialKeyEventServer::GetServer()->GetWindow(), WM_KEYMAN_MODIFIER_EVENT, ...)
```

`GetWindow()` returns `NULL` during server startup and after `CleanupThread`
nulls `m_hwnd`. `PostMessage(NULL, ...)` does not fail — it is documented to
behave as `PostThreadMessage` to the *calling* thread, which here is keyman.exe's
main thread, not the server thread. It returns TRUE and the modifier update is
never seen. That is what the NULL guard in `e245c41845` is for.

### "We do have code around resilience there" — it restores the hook, not the state

This is the load-bearing point, and it is checkable in one file.

`LowLevelHookWatchDog::ReinstallHook` calls `RestartLowLevelHook`
(`keyman32.cpp:482`), which calls `UninitLowLevelHook`, then `InitLowLevelHook`,
posts `KMC_WATCHDOG_HOOK_REINSTALL` to the master controller, and returns. It
does not touch `m_ModifierKeyboardState`. Nothing on that path does, and nothing
anywhere in the tree re-derives the cache after the seed.

So the existing resilience code is correct and complete for what it was built to
do — it notices the hook is gone and puts it back — and it leaves the cache
holding whatever the outage made it hold. Every keystroke after the reinstall
behaves normally; the stale byte is invisible until the next injected batch, and
then `keybd_shift_reset` presses that modifier for real:

```
keybd_shift_reset(pInputs, n, kbd)      // keybd_shift.cpp:166
  for each of the six managed VKs
    if (kbd[vk] & 0x80)                 // the stale byte
      do_keybd_event(..., flags = 0)    // a KEYDOWN, with no KEYUP queued anywhere
```

`do_keybd_event` maps it to the side-agnostic VK on the way out, which is why the
oracle in README.md reads all nine VKs, and why the observed wedge reports as
`SHIFT, LSHIFT` rather than only `LSHIFT`.

**The chain, each link independently checkable:**

1. the cache is written only by the hook procedure — `grep`, two writers
2. the hook procedure runs on keyman.exe's main thread — watchdog header, master
3. a blocked thread plus a keypress past the timeout means the event bypasses the
   hook — MSDN, and the watchdog header, master
4. therefore no post, therefore no cache update — reading the hook, master
5. reinstall restores the hook and not the cache — `RestartLowLevelHook`, master
6. `keybd_shift_reset` presses the stale byte for real, unmatched —
   `keybd_shift.cpp`, master
7. machine-wide latch — measured, 5 of 5

Links 1 to 6 are all statements about **master**, not about this branch.

### Routes to the same state with no freeze at all

The freeze is how the wedge was made repeatable, not the only way in. Three
routes need no stall:

- **The launch seed.** `InitThread` seeds the cache from `GetKeyboardState` on a
  thread that has never pumped input. The natural reading is that this returns
  nothing useful; measured, it returns live state — `byte=0x81` on the fresh
  thread while the process main thread reads `byte=0x00` for the same physically
  held key (`FreshThreadKeyboardStateReflectsLiveModifiers`, output in
  `evidence/run-capability-probes-2026-08-27.txt`). So a modifier held while
  Keyman starts is seeded as held, and if the user lets go before the hook feed
  is running, the byte is stale from the first batch onward.
- **The NULL server window**, above: server startup or shutdown, meaning Keyman
  starting or restarting.
- **The eaten-event loss** (row 9). Before this branch the hook returned 1 —
  event consumed — *before* confirming the handoff succeeded, so a failed or
  misrouted post destroyed the user's real key event. For a modifier KEYUP that
  reaches the same terminal state by a different route: the OS stays latched, the
  cache still says held, and a clear-only reconcile can never see it because the
  two now agree.

### What the stimulus actually is

Worth stating plainly, since "contrived" is a fair description of the *timing*
and not of the mechanism:

- The stimulus is not new instrumentation. `KMC_WATCHDOG_FAKEFREEZE` (19.0) and
  `windows/src/support/fakefreeze` are both upstream, added by the team, and the
  header comment says what for: *"pause Keyman for 5 seconds for debug purposes
  to test stability"*.
- The handler is `Sleep(5000)` on the main thread. There is no path by which that
  thread's state differs from a real block on the same thread — a slow COM call,
  a keyboard load, disk contention, an AV filter, or the high system load the
  watchdog header itself names.
- 5 seconds against a 200 ms threshold makes the coincidence *reliable*, not
  different. The mechanism fires at 201 ms; the remaining 4.8 s exists so a human
  or a script can land the KEYUP inside the window on demand.
- What is genuinely contrived is step 5 of the procedure: releasing the modifier
  *during* the stall. In the field that is chance. It is also why no smoke test
  has ever found this, and why field frequency looks nothing like harness
  frequency.

### How often, and why: what is established, and what is still not measured

The honest position, because this is the weakest part of the case and pretending
otherwise would be the fastest way to lose it.

**Established, from `711541be60`:** that keyman.exe becomes unresponsive in the
field, that high system load is the most common cause, and that a modifier can
stick as a result. That is the author's own statement, not an inference of mine.

**Established, from this branch:** that the resulting cache divergence produces a
machine-wide latch, on demand, 5 of 5 against a shipped build and 0 of 5 against
the fixed one.

**Not established by anyone:** a distribution. Nobody has a number for how often
the main thread stalls past the timeout, how long for, or what fraction of those
stalls have a modifier KEYUP in flight. I have not caught one in the wild with
logs, and I should not claim to have.

Four ways to close that, cheapest first.

**0. The instrument already exists in every log line, and I had missed it.**
`DebugEventTrace.cpp:81-82` stamps *every* Keyman debug line with both
`Globals::get_ShiftState()` and `GetActualShiftState()`, and the latter
(`DebugEventTrace.cpp:19`, `I4843` — Marc Durdin, 09 Aug 2015, shipped in Keyman
Desktop 9.0.512) reads the OS directly including chirality
(`0x10000` for `VK_LSHIFT`, `0x20000` for `VK_RSHIFT`). They appear in a capture
as the `ModifierState` and `ActualModifierState` columns. So a disagreement
between *Keyman's tracked shift state* and the OS is observable in any debug
capture on any shipped build, with no rebuild and no `KLOGGING`. That is an
adjacent measurement, not the cache one — see the caveat two paragraphs down.

That means the wedge can be captured *with the divergence visible* using the
existing harness: run `run-8064-test.ps1` with `debug` = 1 and read those two
columns across the wedge on the shipped engine and on the fixed one. Caveat that
has to travel with any such claim: `Globals::get_ShiftState()` is Keyman's global
shift state, **not** `m_ModifierKeyboardState`, and it carries no chirality bits —
so only the unambiguous direction counts (Keyman's state naming a modifier held
that `ActualModifierState` says is up). Assessment of what this does and does not
support, and of the #8064 field-log attachments, is in
[`evidence/field-log-assessment-2026-08-27.md`](evidence/field-log-assessment-2026-08-27.md).

**1. The watchdog's own log, on any 18.0 build, no rebuild.** `ReinstallHook`
emits, through `SendDebugMessageFormat`:

```
Attempting to reinstall hook because watchdog threshold exceeded at N msec (last LL=... last GM=...)
```

Every one of those lines is a **real, in-the-wild hook loss with a duration
attached** — no `fakefreeze` involved. Enable it with
`HKCU\Software\Keyman\Keyman Engine`, `debug` = 1 and `debug to console` = 1
(`registry.h:100-101`), then leave a DebugView capture running through ordinary
work: a videoconference, a build, anything that loads the machine. This is
exactly the evidence I am missing, it costs only wall-clock, and it is the thing
to do before arguing any further.

**2. Sentry, but only on 19.0.** `930ae121c4` (2025-12-10, `Fixes: #15218`)
reports `Watchdog: low level hook reinstalled, threshold exceeded at N msec` to
Sentry. It is on master and **was not cherry-picked to `stable-18.0`** — so the
18.0 population that has the watchdog has no telemetry from it, and the only
reporting population is 19.0 alpha/beta. Worth pulling, but the sample is small
and I should not have presented it as decisive.

**3. A stall monitor that needs no Keyman change at all.** Sample keyman.exe's
main window every 50 ms with `SendMessageTimeout(hwnd, WM_NULL, 0, 0, SMTO_BLOCK,
timeout)` and log any round trip over ~150 ms with its duration, the wall clock,
and the foreground process name. That measures message-pump latency on the exact
thread `LowLevelHooksTimeout` is measured against, which is why it is the right
proxy. It yields a distribution rather than an anecdote, it is read-only and safe,
and it can be handed to a user who reports the symptom. Do **not** pass
`SMTO_ABORTIFHUNG` — it returns early on a hung window and destroys the
measurement.

**4. Correlate with the symptom.** Run 1 or 3 on a machine that has produced the
symptom. A stuck modifier whose timestamp sits inside a logged stall window is
the in-the-wild capture, and it needs no new engine code.

**What the missing distribution does and does not affect.** It determines *how
many* users are affected and by which route. It does not determine whether the
fix is correct, because of the next point.

### The fix does not rest on the freeze

`keybd_shift_reset` presses only what the cache says is held. There is no other
way for that function to emit a modifier KEYDOWN. So for any serializer-path
stuck modifier, cache/OS divergence is a **necessary condition**, not a
hypothesis about one — and reconciling the cache is necessary regardless of what
caused the divergence.

The stall is one cause of divergence. It is the one that can be driven on demand,
and the one already documented. There are at least four others, none of which
needs a stall at all:

| route | needs a stall? |
|---|---|
| hook bypassed while the main thread is blocked | yes |
| the launch seed: a modifier held as Keyman starts, released before the feed is live | no |
| `GetWindow()` NULL during server startup or shutdown, so the post misroutes to the calling thread | no |
| the hook ate and destroyed an event whose handoff failed (row 9) | no |
| the user's own event took a native pass-through route — mstsc, touch panel, console focus, `GetGUIThreadInfo` failure (row 1b) | no |

So if the stall turns out to be rare in the field, the conclusion is not that the
fix is unnecessary — it is that a different one of these five routes accounts for
the reports. All five converge on the same divergence, and the reconcile plus the
verification pass cover the divergence in both directions.

---

## Claim 2 — three vectors, and why none folds into another

The unifying definition, and what makes the enumeration in
MODIFIER-PRODUCERS.md a finding rather than a list: a modifier is stuck iff some
component asserted a KEYDOWN machine-wide with no reachable matching KEYUP. An
unmatched KEYUP is harmless — it asserts nothing. Every producer row is scored
against that test.

### Vector A — a KEYUP that never reached the hook

Cache stale-held, so `keybd_shift_reset` presses for real. The chain above.
Measured end to end, 5 of 5 shipped and 0 of 5 fixed. Closed by
`ReconcileModifierCache`, which clears a cache byte the OS reports up **before**
the restore loop can act on it. Clears only, never sets.

### Vector B — a KEYDOWN Keyman lost track of, or one of its own that outlived a release

The mirror direction: the OS holds a modifier the cache does **not** claim. Three
sub-cases, one state:

- the hook ate and destroyed the event (row 9, before `e245c41845`),
- the user's own event took a native pass-through route — mstsc stamps
  `dwExtraInfo = 0x4321DCBA` and the hook passes those through, as it does for
  the touch panel, console windows, and a `GetGUIThreadInfo` failure (row 1b),
- a batch's own restore press outlived a user release that raced it (row 1
  residual).

**This is why Vector B is not Vector A restated.** `ReconcileModifierCache` is
structurally blind to it: cache and OS *agree* — both say up — so a comparison
has nothing to find, while the OS is physically holding the key. It needs a
second pass of opposite polarity, `PrepareModifierVerificationCorrection`, posted
so it lands behind the already-queued modifier events, because posted-message
FIFO ordering is what places it behind the modifier events already queued. Two vectors
needing two fixes of opposite polarity is the evidence that they are two vectors.

### Vector C — the OSK

Conceded as a different cause. Note that the OSK's unmatched KEYDOWN is not
itself the bug: `ShiftStateChange` calls only `PrepState` and never `FinalState`,
on purpose, because a sticky OSK modifier is *meant* to be real machine-wide. The
defect is entirely on the release side, and it is two defects:

- **reachability** — `ResetShiftStates` was reached only from
  `TfrmVisualKeyboard.FormClose`, so only the X button and a tab switch ran
  cleanup. The tray menu, tray double-click, `KMC_ONSCREENKEYBOARD` and Keyman
  shutdown all bypassed it. `FormDestroy` now calls it, and `OnDestroy` fires on
  every teardown path including the `caFree` that `FormClose` itself requests.
- **chirality** — both release paths derived the VK from the *current*
  `kbd.LRShift`. A keyboard switch runs `SetLRShift`, which collapses the chiral
  Ctrl/Alt entries, so the release went out as unextended `VK_CONTROL` while the
  key actually held was extended `VK_RCONTROL`. Both paths now release the
  identity that was injected, recorded in `FCachedShiftState`, which survives the
  collapse. Verified through a collapse in both directions — True to False via
  the click-off, False to True via teardown.

This vector is also the answer to why one class of report says *"until you
reboot"*. `keybd_shift` emits a latched Right Ctrl as
`VK_CONTROL | KEYEVENTF_EXTENDEDKEY`, and only that exact event's KEYUP clears
it — tapping Left Ctrl does not. On a keyboard with no physical Right Ctrl the
user cannot produce it at all. Vector A and B latches, by contrast, are cleared
by ordinary typing, which is why they appear to "fix themselves" and why they
have been so hard to catch in the act. Same symptom, different persistence, and
the difference is diagnostic rather than incidental — it is what TRIAGE.md is
built on.

**The existence of TRIAGE.md is itself the argument that these are three.** If
they were one cause there would be nothing to triage: the phantom KEYDOWN's scan
code is `0xFF` for the serializer and `0` for the OSK, the OSK path requires a
visible `TfrmVisualKeyboard`, and only the serializer path emits
`SendDebugMessageFormat` from `keybd_shift`. Three distinguishable signatures.

---

## Claim 3 — minimal, and sufficient for what it claims

### Size

Production code, excluding tests and this directory:

| | lines |
|---|---|
| added | 565 |
| of which comment | 120 |
| of which blank | 72 |
| of which code | 373 |
| removed | 101 |
| net code | ~272, across 8 files |

Of the 373 added code lines, roughly 42 are verbatim relocations: the
`PrepareInjectedInput` copy loop and the `UpdateLocalModifierState` switch, moved
into `keybd_shift.cpp` unchanged so the gtest project can reach them
(`serialkeyeventserver.cpp` is `#ifndef _WIN64` and both were private members).
Compare the diff hunks — the switch is character-identical.

### The argument that replaces "prove nothing broke"

Proving the absence of regression in behaviour that has no test is not possible.
Here is the structural claim instead, checkable by reading rather than by
running: **every new emission is a KEYUP, or is a KEYDOWN gated on live state.**
The changes can remove an asserted modifier or decline to press one. None of them
can add an unmatched press.

| new path | what it can emit | worst case |
|---|---|---|
| `ReconcileModifierCache` | nothing; clears cache bytes only | a restore press is skipped |
| `ComputeModifierReleaseState` | unions into the release set only | an extra KEYUP |
| `PrepareModifierVerificationCorrection` | KEYUP only, via `keybd_shift_release` | an extra KEYUP |
| OSK `ReleaseCached` | `KEYEVENTF_KEYUP` baked into the flags; the function has no press branch | nothing |
| OSK `FinalState` restore | KEYDOWN, gated on `GetAsyncKeyState` | a press is skipped |
| hook handoff failure | nothing; falls through to `CallNextHookEx` | the keystroke arrives unserialized instead of destroyed |

The failure mode this branch can introduce is therefore a **missing** modifier —
recoverable by pressing the key again, and self-correcting on the next event. The
failure mode it removes is an **unmatched press**, which on hardware lacking the
key is recoverable only by reboot. The asymmetry is deliberate and is stated in
each function's comment.

### Behaviour changes that are real, declared rather than left to be found

1. **`EXTRAINFO_FLAG_KEYMAN_MODIFIER_WRAP` on the wrap events.** The hook's
   existing pass-through gate keys on `hs->dwExtraInfo != 0`
   (`k32_lowlevelkeyboardhook.cpp:248`), so tagging changes which branch these
   events take. For five of the six it does not: they carry scan `0xFF` and were
   already caught by the `SCAN_FLAG_KEYMAN_KEY_EVENT` arm. For **Right Shift** it
   does — `do_keybd_event` overwrites the `0xFF` with `SCANCODE_RSHIFT` so the
   receiving app can tell which Shift it was, so those wrap events were
   previously indistinguishable from user input and were eaten and re-serialized.
   `do_keybd_event`'s own upstream comment names this exact blind spot and judges
   it acceptable: *"this will obviously not work with Right Shift ... Fortunately,
   we can afford to not care about this."* The tag closes it, and Right Shift's
   new behaviour is the behaviour the other five already had.
2. **`ResetShiftStates` now writes `kbd.ShiftState` and calls
   `UpdateKeyboard(False)`**, replacing the `ShiftStateChange(FShiftState -
   FCachedShiftState, kbd.ShiftState)` call. This is visible in OSK rendering,
   not only in key state. Measured on a live `KLOGGING` engine —
   `evidence/run-osk-teardown-2026-08-27.txt` and
   `evidence/run-osk-clickoff-2026-08-27.txt`. That run is also what caught the
   first attempt reintroducing I2177, fixed in `4ca0945a12`; the release is now
   gated on live state, so a key the user physically holds is left alone.
3. **Hook debug output.** The modifier block is now entered for every modifier
   event rather than only when `flag_ShouldSerializeInput`, so it logs a "cache
   feed skipped" line where it previously logged nothing. The cost is log noise
   only, behind `ShouldDebug()`. Say the word and the skip line goes.
4. **`MAX_KEYEVENT_INPUTS_MODIFIERS`** is now `(KEYMAN_MODIFIER_VK_COUNT + 2)`
   rather than a literal `8`. Identical value; the point is that it and the
   modifier table can no longer drift apart.

### What did not change

- **Zero existing tests were modified.** `keybd_shift.tests.cpp` is a new file;
  the only change to an existing test artifact is one line in
  `keyman32.tests.vcxproj` adding it to the build. The pre-existing suite is
  still testing exactly what it was.
- **x64 is unaffected in practice.** The new functions live in `keybd_shift.cpp`
  outside any architecture guard, so both builds compile them, but the only
  caller is `serialkeyeventserver.cpp`, which is `#ifndef _WIN64`. `keybd_shift`
  itself has no other caller in the tree — `git grep keybd_shift` returns the
  declaration, the definition, and one comment.
- **The release and restore loops keep their original shape.** The only edits are
  the extracted table and the `extraInfo` argument.
- Gate, both architectures, after the comment condensation pass: x86 72 passed /
  1 disabled; x64 71 passed / 1 disabled / 0 warnings; `keyman32.vcxproj` links
  Win32 and x64 Debug. Recorded in
  `evidence/run-capability-probes-2026-08-27.txt`.

### One known environmental flake, recorded rather than hidden

Three tests inject real modifiers and round-trip a real low level hook, and one
x64 run reported them as plain FAILURES rather than skips
(`ReconcileDoesNotRaceItsOwnInjectedRestorePress`,
`DwExtraInfoSurvivesSendInputWhereTheScanCodeDoesNot`,
`GenericShiftSendInputReflectsInBothAsyncKeyStates`). All three passed in
isolation immediately afterwards with correct probe output, the next full x64 run
passed 71/71, no modifier was left stuck, and the only source change since the
previous clean run was comments. Another process disturbing the input queue is
enough. This matters for review because from a CI log alone an environmental
false failure of those three is indistinguishable from a real regression: re-run
the failures in isolation before believing them. Full account at the end of
`evidence/run-capability-probes-2026-08-27.txt`.

### What is not claimed

MODIFIER-PRODUCERS.md sets a deliberately awkward bar for `mitigated` —
compiled, linked, and either covered by a green test or confirmed by an executed
reproduction, with source-level reasoning explicitly not sufficient — then scores
this branch against it. Which is why its status section ends:

> Until 1-3 are done, this work must not be described as completing prevention.

Still open, specifically: two `UNMITIGATED` rows (`keyman.exe` killed while an
OSK sticky modifier is held; `PostKeys` pair-splitting under queue truncation),
four issues to file, the serializer harness not re-run since the residual-gap
commits landed, and the serializer path never having been wedged with the engine
log on — so TRIAGE.md's serializer-side signals are what the source predicts
rather than what was observed. Each is listed with what it would take to close.

### Why 66 tests for ~270 lines

The count is a fair thing to flinch at. What they are for:

- They pin **invariants that are otherwise invisible**: clear-only, union-only,
  KEYUP-only, mask-scoped. Those are exactly the properties the monotonicity
  argument above rests on, and without a test each one is only a comment.
- Each fix has at least one test that goes **red if the fix is removed** —
  `PREPARE_INJECTED_INPUT_BATCH.*` for the reconcile,
  `PREPARE_MODIFIER_VERIFICATION_CORRECTION.*` for the verification pass. That is
  what makes them worth their maintenance cost: a later change that quietly
  undoes one of these does not ship silently.
- Two are **oracles against Windows, not against Keyman**.
  `ReconcileDoesNotRaceItsOwnInjectedRestorePress` runs 300 trials across three
  queue-depth regimes (mean `SendInput` cost from 1.7 ms to 321 ms) to establish
  that `SendInput` does not return before the injected press is visible to
  `GetAsyncKeyState` — the assumption the reconcile depends on.
  `GenericShiftSendInputReflectsInBothAsyncKeyStates` establishes that Windows
  re-chiralises a generic `wVk = VK_SHIFT` injection on the way in, which is why
  `CaptureLiveModifierState` deliberately reads only the six chiral VKs and not
  the nine the hook accepts. Both go red if a future Windows changes, which is
  the point of having them rather than a comment asserting them.
- Three assert real modifiers machine-wide and so cannot run on a Session-0 CI
  account. gtest 1.8.1 has no `GTEST_SKIP()`, so each detects its own capability
  and falls back to a logged WARNING plus `SUCCEED()` — meaning a skip is
  indistinguishable from a pass in the tally.
  `evidence/run-capability-probes-2026-08-27.txt` exists to record that on one
  real machine they actually evaluated, with the probe output to prove it.

If a smaller suite is preferred, the subset that must survive is the
remove-the-fix-and-it-goes-red set plus the two Windows oracles. The rest can go.

### Two alternatives a reviewer will propose

**"Does this depend on the watchdog?"** No, in both directions, and that is worth
being explicit about because the two changes are easy to conflate.

- `ReconcileModifierCache` runs at the top of every batch and compares the cache
  against `GetAsyncKeyState`. It does not ask, and cannot tell, whether the hook
  is alive, dead, or freshly reinstalled. Remove the watchdog entirely and the
  reconcile behaves identically.
- Without the watchdog it is *more* necessary, not less. Hook loss was permanent
  until restart, and the hook is the cache's only feeder, so the cache froze at
  hook-death with nothing able to correct it. The reconcile reads the OS, so it
  corrects that case too.
- Conversely, this branch does not make the watchdog redundant. It cannot restore
  a lost hook, so it does nothing for the other half of `711541be60`'s problem
  statement — *"Keyman's hotkeys stop working"*. Transport and state are separate
  failures needing separate fixes, and neither change subsumes the other.

**"Why keep a cache you have just admitted you cannot trust — why not read live
state and delete it?"** A fair design question, and the answer is that the fix
already gets most of the way there, deliberately without going all the way.

What the batch now computes, for the six managed VKs:

```
release half  =  cache  ∪  live        (ComputeModifierReleaseState)
restore half  =  cache  ∩  live        (ReconcileModifierCache, then keybd_shift(TRUE, kbd))
```

So the cache is already clamped to live state before anything is pressed. A
cache-free redesign would make the restore half simply `live`, and that is
**strictly more aggressive on the press side**: it would re-press a modifier the
OS happens to hold that Keyman never saw go down — including one Keyman itself
put down earlier in the same batch, and including a modifier the user pressed
during the batch and does not want re-asserted afterward. The intersection is the
conservative choice, and the asymmetry between the two halves is the whole safety
argument: union when releasing, intersection when pressing.

There are two further reasons not to delete the cache in this change:

- it is not only a batch-local snapshot. `UpdateLocalModifierState` is also fed
  from `WM_KEYMAN_KEY_EVENT` re-injection, so the cache records the state of the
  *serialized* stream, which can legitimately differ from live OS state while
  Keyman is mid-manipulation. Reading live state naively would capture Keyman's
  own in-flight events as user intent.
- with `flag_ShouldSerializeInput` off, the cache is the only record there is,
  which is why the batch path carries `feedIsConfigured` rather than assuming a feed.

Deleting it is a redesign of the serialized-stream semantics, with a blast radius
that includes the AltGr Left Control simulation and the `0x21D` handling from
`50ffbb2722`. That cannot be presented as minimal, and it is not what a still-open
2023 defect needs. If the team wants the cache gone, the reconcile is a safe
intermediate step and not an obstacle to it.

### Reproduce the failure yourself

The fastest way to stop needing to trust any of the above:

```
# 1. build the 32-bit host (Keyman build env sourced)
cd "windows/src/test/manual-tests/GH-8064 - stuck-modifier-phantom-keydown/host32"
cl /nologo /W4 /EHsc /MT /DUNICODE /D_UNICODE host32.cpp \
   /link /SUBSYSTEM:WINDOWS user32.lib gdi32.lib /OUT:host32.exe

# 2. against a SHIPPED keyman32.dll, with a Keyman keyboard selected in the host
host32.exe --probe 1x2x3x --wait-for-rule 120 --iterations 5
```

A 32-bit host is required, and the harness verifies rather than assumes it: on
Windows 11 both `notepad.exe` and `SysWOW64\notepad.exe` resolve to the 64-bit
packaged Notepad, whose engine is `keymanx64.dll`, where
`serialkeyeventserver.cpp` is compiled out and the cache under test does not
exist. The harness reports INCONCLUSIVE unless it confirms the freeze took
effect, the host is a verified 32-bit process it brought to the foreground, a
Keyman TIP is selected in it, and Keyman transformed the probe text — because a
false PASS on this defect is worse than no test.

To break each fix individually: revert the commit, run the named test class, and
watch it go red.

---

## Claim 4 — where the explanations live

The rule this branch follows: **rationale lives in these documents; code comments
carry only what a maintainer needs at that line and cannot recover from the code
itself.** Mechanism, measurement and rejected alternatives go here. The comment
says which invariant the line is holding, and where it matters, which direction
the error falls in.

On comment volume, since it is a fair thing to check:

- 120 of the 565 added production lines are comment.
- The pre-existing upstream doc comment on `do_keybd_event`, in the same file, is
  38 lines of comment for 37 lines of code. The new code is lighter than the
  convention it sits in, not heavier.
- A condensation pass has already been run over the engine and test sources, with
  the code verified byte-identical to the pre-pass state once comments are
  stripped, and the full gate re-run afterwards to confirm the figures were
  unchanged. Recorded at the end of
  `evidence/run-capability-probes-2026-08-27.txt`.

If a specific comment is still carrying more than its line needs, it should move
into this file rather than be deleted, and the pointer left behind should be one
line.
