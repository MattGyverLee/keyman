# Post-rebase gate, 2026-08-28

Why this run exists, and what it does and does not establish.

## Occasion

PR [#16423](https://github.com/keymanapp/keyman/pull/16423) (Cache B / Caps Lock)
merged upstream. This branch was rebased from `origin/master @ deeff0456f` onto
`origin/master @ 15e91ab452` — 26 upstream commits, replayed across all 38 branch
commits with **zero conflicts**, and `git range-diff` reporting **38 identical, 0
changed**.

The rebase was textually clean because the two changesets are disjoint: this
branch touches `keybd_shift.cpp`, `serialkeyeventserver.cpp` and
`k32_lowlevelkeyboardhook.cpp`; #16423 touches `capsstate.cpp/.h`,
`appint/aiTIP.cpp` and `kmhook_getmessage.cpp`. That separation is the one the
spec's *Out of Scope* predicted when it recorded Caps Lock as "already PR #16423".

Textual cleanliness is not behavioural cleanliness, which is why this gate was
run rather than assumed.

## Result — FR-015, no regression

| | x86 | x64 |
|---|---|---|
| tests | **72 passed** | **71 passed** |
| disabled | 1 | 1 |
| warnings | 0 | 0 |
| `keyman32.dll` / `keyman64.dll` link | clean, 0 warnings | clean, 0 warnings |

Unchanged from the pre-rebase figures in `IN-TREE.md` §2a. Per FR-015 the gate is
**no regression**, not the raw total; the counts are recorded here rather than
pinned. 19/19 and 18/18 remain the *entry* figures only.

Logs: `run-gate-x86-2026-08-28.txt`, `run-gate-x64-2026-08-28.txt`,
`run-link-x86-2026-08-28.txt`, `run-link-x64-2026-08-28.txt`.

## Result — FR-015a, read from the log rather than the tally

Three tests carry runtime capability detection: where the desktop denies real
modifier injection they log a WARNING and `SUCCEED()`, so a skip is
indistinguishable from a pass in the count. All three were **exercised, not
skipped**, on both architectures. No WARNING line appears in either log.

| test | evidence it ran |
|---|---|
| `FreshThreadKeyboardStateReflectsLiveModifiers` | `SEED PROBE this thread : GetKeyboardState ok=1 byte=0x00, GetAsyncKeyState=0x8001` / `SEED PROBE fresh thread: GetKeyboardState ok=1 byte=0x81, GetAsyncKeyState=0x8000` |
| `ReconcileDoesNotRaceItsOwnInjectedRestorePress` | 35689 ms (x86), 35100 ms (x64) — a capability skip returns immediately |
| `GenericShiftSendInputReflectsInBothAsyncKeyStates` | `GENERIC VK PROBE hook saw vk=0xA0 scan=0x00 extra=0x00000000 flags=0x10` |

The fresh-thread reading reproduces the measurement the spec's **Evidence** table
cites for the seed — fresh thread `0x81`, main thread `0x00`, with the key held —
so the US6 amendment survives the rebase unchanged.

## What this run does NOT establish

- **Nothing about the serializer triage signals.** `TRIAGE.md`'s serializer rows
  remain `[source-derived]`; this is a unit-test gate, not the logged `host32`
  run FR-012b requires (T067, T069, T070 path 6).
- **Nothing about rows `1`/`1b`.** The `host32` harness was not re-run here.
- **Nothing about ARM64**, which remains unverified per `IN-TREE.md` §6.
