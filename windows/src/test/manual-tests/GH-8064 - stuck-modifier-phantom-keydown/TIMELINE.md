# #8064: one deleted line in 2018, three fixes since

Companion to [README.md](./README.md), [MODIFIER-PRODUCERS.md](./MODIFIER-PRODUCERS.md),
[TRIAGE.md](./TRIAGE.md) and [JUSTIFICATION.md](./JUSTIFICATION.md).

Why this file exists: the branch is easy to mistake for a new theory about
freezes. It is not.

The defect starts on **2018-10-10**, when `738e1946a6` deleted the per-batch
`GetKeyboardState(kbd)` from `keybd_shift_release` and replaced it with a
once-per-process seed. Three stuck-modifier issues have been filed and fixed in
that neighbourhood since (#7337, #7716, #8064), and every one of those fixes made
the resulting modifier cache *more* authoritative without restoring the live read
that had been removed. This branch restores it.

Everything below is sourced from the issue tracker, commit metadata, or
`git tag --contains`. No inference.

## The lineage

| # | opened | closed | milestone | title |
|---|---|---|---|---|
| [#7337](https://github.com/keymanapp/keyman/issues/7337) | 2022-09-21 | 2022-10-25 | A16S13 | bug(windows): [on behalf of user] Something causes the left Alt key to be 'stuck' |
| [#7716](https://github.com/keymanapp/keyman/issues/7716) | 2022-11-14 | 2022-12-21 | A17S2 | bug(windows): 'ALT' Key 'stuck' after changing keyboards with serialized input enabled |
| [#8064](https://github.com/keymanapp/keyman/issues/8064) | 2023-01-23 | **still open** | **20.0** | bug(windows): modifier key occasionally is 'stuck on' |

All three are the same symptom. #8064's own opening line names its parentage:

> After #7716 addressed the serialization of modifier keys, there is still seen
> an occasional case where the modifier key sticks on.

## The same block of code, three times

Each fix edited the modifier-cache feed in `_kmnLowLevelKeyboardProc`.

**#7337 introduced it.** The post that feeds
`SerialKeyEventServer::m_ModifierKeyboardState`, inside the hotkey branch:

```cpp
// #7337 Post the modifier state ensuring the serialized queue is in sync
if (flag_ShouldSerializeInput) {
  PostMessage(..., WM_KEYMAN_MODIFIER_EVENT, hs->vkCode, ...);
}
```

**#7716 generalised it** (`2c02d34746`, merged `4fe4fbc6f6`, 2022-12-22). Lifted
the post out of the hotkey branch and added `isModifierKey()` — the nine-VK
predicate still in use — so *every* modifier event fed the cache, not only
hotkey-relevant ones:

```cpp
if (isModifierKey(hs->vkCode) && flag_ShouldSerializeInput) {
  PostMessage(..., WM_KEYMAN_MODIFIER_EVENT, hs->vkCode, ...);
}
```

One file, 24 insertions. #8064 was opened one month later.

**This branch is the third edit to that block**: the `IsKeymanInjectedKeyEvent`
filter, so Keyman's own wrap events stop feeding the cache, and a NULL-window
guard so a misrouted post is visible rather than silent.

**What every prior fix left out.** Both #7337 and #7716 made the cache a more
complete record of what the hook saw. Neither added any way for the cache to be
corrected when the hook did not see something.

And there used to be one. From 2003 until **2018-10-10**, `keybd_shift`'s release
half called `GetKeyboardState(kbd)` — a live re-derivation on every batch.
`738e1946a6` deleted that line, changed the parameter to `LPBYTE const kbd` so it
could not re-derive, and introduced the once-per-process
`GetKeyboardState(m_ModifierKeyboardState)` seed in `InitThread`, all in one
commit. **That is the date the defect starts**, and it is a trade — per-batch live
read for a single seed — not an oversight. Details in
[JUSTIFICATION.md](./JUSTIFICATION.md).

So the answer to "how long has this been broken" is: the stuck-modifier *hazard*
is older than the cache — in 2015 the restore half already pressed modifiers from
`Globals::get_ShiftState()`, which is exactly the variable `I4843` added a log
column for — but *this* defect, the one #8064 describes and this branch fixes,
dates to 2018-10-10.

## Field reports, 2023-2025

Not a reproduction each, but the record that this is a live user-facing defect
rather than a theoretical one.

| date | source | detail |
|---|---|---|
| 2023-01-23 | #8064 body | Keyman **15.0.275**, Windows 11. Typed `Lonh does does`, got `LOnh DOes DOes`. Shift asserted intermittently and cleared itself |
| 2023-01-23 | #8064, rc-swag | signed logging build made via [#8033](https://github.com/keymanapp/keyman/issues/8033), "logging for each path the modifier key input can take in the low level hook" |
| 2023-12-01 | #8064, rc-swag | IPA keyboard with the keyboard option set to "Before"; logs captured. [keyboards#2466](https://github.com/keymanapp/keyboards/issues/2466) |
| 2024-03-06 | community | [t/keyman-causing-windows-10-to-crash/8516](https://community.software.sil.org/t/keyman-causing-windows-10-to-crash/8516) |
| 2024-05-28 | community, via mcdurdin | [t/8777](https://community.software.sil.org/t/8777) |
| 2025-03-31 | community | [Vedic Sanskrit keyboard continuously presses Alt key on Windows 11](https://community.software.sil.org/t/vedic-sanskrit-keyboard-continuously-presses-alt-key-on-windows-11/9977) |

Note the 2023 symptom shape: a transient Shift assertion that clears itself. That
is the cache path's signature, not the OSK's — an OSK-stranded chiral modifier
persists until the matching KEYUP, which is why it reads as "until reboot".

## The watchdog, and what it did and did not settle

| date | version | event |
|---|---|---|
| 2025-11-17 | first in **19.0.165-alpha** | `711541be60` (Marc Durdin) adds `LowLevelHookWatchDog`, the `KMC_WATCHDOG_FAKEFREEZE` handler and `support/fakefreeze`, tagged `Fixes: #8064`. PR [#15179](https://github.com/keymanapp/keyman/pull/15179), milestone A19S16 |
| 2025-11-21 | first in **18.0.245** | cherry-picked to `stable-18.0` as `83251358b0`. PR [#15219](https://github.com/keymanapp/keyman/pull/15219), milestone A19S17 |
| **2025-11-26** | — | **mcdurdin on #8064: "@rc-swag notes that stuck key logs still have lowlevelkeyboardproc messages, so this probably does not resolve that issue."** |
| 2025-11-27 | — | rc-swag attaches field logs to #8064: `RC_logs_1.zip`, `RC_logs_2.zip`, `test3_lowlevel.xlsx`, plus the scenario he believes produced it and his notes |
| **2025-11-28** | — | the bot auto-closes #8064 via #15219. mcdurdin reopens the same day: **"Nope, see above. My bad"** |
| 2025-12-10 | first in **19.0.177-alpha** | `930ae121c4` adds the Sentry event for hook reinstall, `Fixes: #15218`. **Master only — never cherry-picked to `stable-18.0`** |

Two consequences that matter for how the branch should be presented:

1. **Nobody currently believes the watchdog fixed #8064.** It was closed by
   automation for two days and reopened by its own author with "My bad". The
   issue stands open at milestone 20.0. So the branch does not have to argue that
   #8064 is unfixed — that is the tracker's current state.
2. **The reason given for it not being fixed is specific, and it is evidence
   against the freeze being the only route:** the field logs show
   `lowlevelkeyboardproc` messages present during stuck-key events, meaning the
   hook was *alive* in those captures. Hook loss cannot explain those cases. See
   *What the logs imply* below.

## What is running where, today

| | version | watchdog | hook-reinstall Sentry event |
|---|---|---|---|
| `stable-18.0`, shipped | 18.0.245 - 18.0.249+ | **yes** | **no** |
| `master` | 19.0.165-alpha onward | yes | yes, from 19.0.177-alpha |
| the machine that reproduced 5/5 | **18.0.249** (`keyman32.dll` 1,232,504 bytes) | yes, verified by strings in the binary | no, verified absent |

So the 18.0 field population runs the watchdog with no telemetry from it, and the
harness reproduced the wedge 5 of 5 against a build that has the watchdog active.
Details in [JUSTIFICATION.md](./JUSTIFICATION.md).

## Verdict on "the watchdog made it worse"

Three versions of that claim, scored honestly, because one of them is right and
it is not the one about the watchdog.

**"The watchdog created the cache issue."** **False.** `m_ModifierKeyboardState`
dates to 2018-10-10 (`738e1946a6`); `keybd_shift.cpp` to the 2017 open-source
seed. #8064 was opened 2023-01-23, two years before the watchdog and five years
after the cache. The watchdog touched neither.

**"A fix created the cache issue."** **True, but it was #7337 and #7716, not the
watchdog.** Those two fixes are what made the cache authoritative over injected
batches, and they added no correction path. The instinct is right; the culprit is
three years earlier.

**"The watchdog made the symptom worse."** **Probably backwards.** Before it,
hook loss was permanent until Keyman restarted — and the hook is the cache's only
feeder, so the cache froze at the moment the hook died and *every* later batch
wrapped itself in that frozen state. That matches `711541be60`'s own note that
*"Restarting Keyman always resolved both of these two issues in the past"*. After
it, the hook returns within about one keystroke, the cache resumes being fed, and
the stale byte is corrected the next time the user presses and releases that key.
So the watchdog shortened the divergence from "until restart" to "until you next
use that key" — a real improvement, which also made the defect **milder, rarer,
self-healing, and far harder to catch in the act**. That is a plausible reason it
was thought resolved, and a plausible reason it is hard to reproduce on a
developer's own machine.

**One narrow way it could add risk, unverified.** `RestartLowLevelHook` calls
`UninitLowLevelHook` then `InitLowLevelHook`, so each watchdog firing opens a
fresh, short window in which events bypass the hook — and firings happen under
load, which is when the user is typing. Whether any event is actually lost in
that window is untested. It is a hypothesis, listed so it is not mistaken for a
finding. The test: log the hook handle and the reinstall timestamps, drive
keystrokes continuously, and check whether any keystroke falls between the
uninstall and the install.

## What the logs on #8064 imply, and why they are the next thing to read

`RC_logs_1.zip`, `RC_logs_2.zip` and `test3_lowlevel.xlsx` (rc-swag, 2025-11-27)
are in-the-wild captures of the symptom with low level hook messages present.

**They have now been examined, and they corroborate rather than settle.** Full
assessment in
[`evidence/field-log-assessment-2026-08-27.md`](evidence/field-log-assessment-2026-08-27.md).
In short: both captures are on 18.0.228, which predates the watchdog, so they say
nothing about the shipped build; the sheets are process-filtered Excel extracts
with most rows hidden, so event-pairing counts are not usable on them — a caveat
that applies to rc-swag's own "746 pressed / 221 released" figure as much as to
anything computed here; and his headline note that the cache *"never returns to
RS:0"* did not reproduce in the file attached, though it may hold in
`test3_others.xlsx`, whose line numbering differs. What they do show is that the
cache dwells on Right Shift held for much of one session, that the Right Shift
provenance blind spot is present in volume, and that on two independent systems
only Right Shift cleared the stick.

Still worth pursuing, with the raw unfiltered logs. Because the hook was alive in
those captures, the divergence should have arrived by a route other than hook
loss. The candidates, from [MODIFIER-PRODUCERS.md](./MODIFIER-PRODUCERS.md):

- a batch's own restore press outliving a user release that raced it (row 1
  residual) — look for a `SCAN_FLAG_KEYMAN_KEY_EVENT` modifier KEYDOWN
  interleaved with a real user KEYUP for the same VK
- the native pass-through routes: mstsc `dwExtraInfo != 0`, the touch panel,
  console focus, `GetGUIThreadInfo` failure (row 1b)
- the launch seed: a modifier held as Keyman started
- an eaten event whose handoff failed (row 9)
- the OSK, if it was open (rows 2a/2b) — check for scan `0` rather than `0xFF`

If it is one of those, identifying which would replace this branch's weakest
claim — source-reasoned attribution — with a field-confirmed one. If it is none of
them, that is a new producer and the enumeration in
[MODIFIER-PRODUCERS.md](./MODIFIER-PRODUCERS.md) is incomplete. Both outcomes are
worth the work; only the first is the one to hope for.

## One-line summary for a PR body

> #8064 is the third stuck-modifier issue on the same block of code (#7337 2022,
> #7716 2022, #8064 2023, still open at milestone 20.0). A per-batch
> re-derivation of modifier state existed in `keybd_shift_release` until
> 2018-10-10 (`738e1946a6`) and has not existed since; each fix after that made
> the serializer's modifier cache more authoritative without restoring it. The 2025 watchdog (`711541be60`) fixed the hook-loss half of the problem
> and was reopened by its author two days after merging because the stuck-modifier
> half remained. This branch adds the correction path, in both directions, plus
> the OSK release fixes, with tests.
