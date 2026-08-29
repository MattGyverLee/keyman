# Mutation records, 2026-08-28

Why these runs exist, and what they do and do not establish.

Each record below deletes one production decision, runs the suite, and records
what the suite said. A mutation that turns a test **red** establishes that the
test is pinned to that decision. A mutation that leaves the suite **green**
establishes the opposite, and that green is the finding, not a passing grade.

## Machine

| | |
|---|---|
| Machine | `MLEELOQ` |
| OS | Windows 11 Pro 25H2, build 10.0.26200.9278 |
| Session | 1, `Console` (interactive) |
| Toolchain | VS 2022 17.14.38, MSVC 14.44.35207, SDK 10.0.26100.0 |
| Configuration | `--debug`, `test:x86` |

## A note on the filter every run here carries

Every run in this file was invoked with:

```
GTEST_FILTER=-KEYBD_SHIFT.ReconcileDoesNotRaceItsOwnInjectedRestorePress
```

This is not a convenience. Without it the suite does not finish: on this machine
`KEYBD_SHIFT.ReconcileDoesNotRaceItsOwnInjectedRestorePress` **blocks
indefinitely**. Measured while stuck — 1336 s elapsed against 3.44 s of CPU, zero
CPU delta across a 5 s sample, single thread. That is a thread parked in a wait
state, not the busy-wait the test is documented as performing.

The same filter appears in both Phase 1 baseline runs
(`/tmp/base-x86.txt`, `/tmp/base-x64.txt`), so the recorded baseline counts of 71
(x86) and 70 (x64) are **filtered counts**. The filter is recorded in neither
`build.sh`, the vcxproj, nor any spec document. It is recorded here so that the
counts below are comparable to something, and so the next person to run "the
suite" does not discover the block the way this run did.

Consequence for the plan: the four interactive probes have to leave the default
target (US5) before any gate in this spec can run unattended without a
hand-applied filter.

## Mutation B1 — the cache-feed gate's `!isKeymanInjected` term

**Requirement**: FR-016 (extraction), recorded per the B1 finding.

### The decision deleted

`windows/src/engine/keyman32/k32_lowlevelkeyboardhook.cpp:204`

```c
// before
if (flag_ShouldSerializeInput && !isKeymanInjected) {
// after
if (flag_ShouldSerializeInput) {
```

The deleted term is the whole of #8064's cache-feed gate: it is what stops
Keyman's own injected modifiers from feeding the modifier cache. With it gone, a
batch's restore press feeds the cache, can outlive the user's release, and leaves
the cache holding a modifier nobody holds — the defect the branch exists to fix.

`isKeymanInjected` remains referenced by the trace at `:218-219`, so the deletion
compiles warning-clean under warnings-as-errors. The mutation is therefore a
clean test of the gate and not of the compiler.

### Result

| | |
|---|---|
| Suite | **68 tests from 11 test cases ran. `[  PASSED  ] 68 tests.`** |
| Exit code | 0 |
| Red tests | **none** |
| Rebuild confirmed | `k32_lowlevelkeyboardhook.cpp` present in the compile output |

The rebuild check matters: a green result from a stale binary would establish
nothing at all. The compiler was observed recompiling the mutated file in the
same run that produced the green.

### What this establishes

**The suite does not test the production gate.** Deleting #8064's central
decision changes no test result. The two cases billed *"This is the fix for
#8064"* (`keybd_shift.tests.cpp:1222`, `:1238`) pass either way, because they do
not reach `k32_lowlevelkeyboardhook.cpp` at all — they exercise
`ApplyThroughTheGate`, a **test-local helper at `keybd_shift.tests.cpp:1146`
that reimplements the gate inside the test file**. The helper's own comment
concedes the mirroring.

So the tests pin a copy of the decision, and the copy cannot diverge from
production by failing — it can only diverge silently. Any edit to the real gate
is unprotected.

This is the justification for FR-016: `ShouldFeedModifierCache` has to become
production code the suite calls, and the mirror at `:1146` has to be deleted
rather than kept in sync. A mirror that is kept in sync by discipline is a mirror
that will stop being in sync.

### Revert

Reverted with `git checkout --`; verified byte-identical to the pre-mutation
backup and `git diff` empty. The tree carried no other change to this file, so
the revert is exact rather than merely plausible.

---

## Mutation B1, repeated after the FR-016 extraction

**Requirement**: FR-016 acceptance. Same decision deleted, same suite, same
filter — run again once T028-T032 had moved the decision into production code
the tests call.

### What moved

The extraction relocates the decision. It is no longer a term inside the hook;
it is `ShouldFeedModifierCache` in `windows/src/engine/keyman32/keybd_shift.cpp`,
which the hook calls at `k32_lowlevelkeyboardhook.cpp:204` and which the tests
now call through `FeedThroughTheGate`. The test-local mirror
`ApplyThroughTheGate` is deleted.

**The mutation site therefore moves with it.** Deleting the term at the old hook
site is no longer the mutation this record is about, and a future repeat of B1
must be taken against `keybd_shift.cpp`.

### First attempt did not compile — recorded, but it is not the result

```c
BOOL ShouldFeedModifierCache(BOOL serializeInput, DWORD scanCode, ULONG_PTR extraInfo) {
  return serializeInput;   // term deleted
}
```

```
keybd_shift.cpp(491,77): warning C4100: 'extraInfo': unreferenced parameter
keybd_shift.cpp(491,57): warning C4100: 'scanCode': unreferenced parameter
keybd_shift.cpp(491,77): error C2220: the following warning is treated as an error
```

With the decision extracted, the naive deletion **cannot be built**: the two
parameters exist only to serve the deleted term, and `/W4 /WX` rejects them.
Before the extraction the same deletion compiled cleanly and passed.

This is worth recording, but it is **not** evidence that a test pins the
behaviour — it is an artifact of the warning configuration, and it would
disappear the moment someone silenced the warning. It is reported here so it is
not mistaken for the mutation result, and not claimed as one.

### The faithful mutation

The parameters are kept and silenced with the codebase's own idiom
(`appint/aiTIP.cpp:315`), so that the **decision** is the only thing deleted:

```c
BOOL ShouldFeedModifierCache(BOOL serializeInput, DWORD scanCode, ULONG_PTR extraInfo) {
  UNREFERENCED_PARAMETER(scanCode);
  UNREFERENCED_PARAMETER(extraInfo);
  return serializeInput;
}
```

### Result — red

| | |
|---|---|
| Suite | **68 tests ran. `[  PASSED  ] 66 tests.` `[  FAILED  ] 2 tests`** |
| `build.sh` exit code | **1**, with `## test:x86 failed` |
| Rebuild confirmed | `keybd_shift.cpp` present in the compile output |

```
[  FAILED  ] MODIFIER_CACHE_EVENT_ORDER.TheGateLeavesTheCacheFollowingTheUserAlone
[  FAILED  ] MODIFIER_CACHE_EVENT_ORDER.TheGateCoversRightShiftThroughDwExtraInfo
```

Exactly the two cases billed *"This is the fix for #8064"*, and nothing else.
The blast radius is the right size: a decision about the cache-feed gate turns
the gate's own tests red and leaves the other 66 alone.

`build.sh`'s exit code was checked directly rather than inferred, because a
harness that printed failures but exited 0 would let a red suite pass CI. It
exits 1.

### What this establishes

**The suite now tests the production gate.** The identical deletion that left the
suite at 68/68 before the extraction turns two tests red after it. That is the
green -> red pair FR-016 exists to produce, measured rather than argued.

The mirror is gone in the sense that matters: `FeedThroughTheGate` calls
`ShouldFeedModifierCache` rather than reimplementing it, so the tests can no
longer agree with a production gate that has changed underneath them.

### Revert

Restored from the pre-mutation backup; verified byte-identical.

---

## Mutations for FR-017 (T041)

All four measured against the **final** tree — after the FR-016 extraction
(T028-T032), the four positives (T033-T036) and the FR-018 pairing work
(T039-T040). Earlier runs of the same four exist from the T039 sweep, but they
were taken at 73 tests and the tree now stands at 74, so they are superseded
rather than cited: a record whose counts do not reconcile with the shipped code
invites exactly the "is this current?" doubt the record exists to remove.

### Conditions common to all four

| | |
|---|---|
| Baseline | **x86 74 tests / 13 fixtures, all passing** |
| Filter | `GTEST_FILTER=-KEYBD_SHIFT.ReconcileDoesNotRaceItsOwnInjectedRestorePress` |
| Harness | one mutation at a time; both production files restored from backup between each |
| Restoration | verified byte-identical after the last mutation (`RESTORED-OK`) |

Each mutation reverts exactly one production decision. Nothing else changes, so
the red set is attributable to that decision alone.

### The four

| # | Mutation | Production change | Passed | Went red |
|---|---|---|---|---|
| 1 | `M19` | `ShouldFeedModifierCache` loses its `!IsKeymanInjectedKeyEvent(scanCode, extraInfo)` term | 72 | `MODIFIER_CACHE_EVENT_ORDER.TheGateLeavesTheCacheFollowingTheUserAlone`<br>`MODIFIER_CACHE_EVENT_ORDER.TheGateCoversRightShiftThroughDwExtraInfo` |
| 2 | `M21` | `PostKeyEventAndDecideEat` eats unconditionally instead of only on a successful post | 72 | `POST_KEY_EVENT_AND_DECIDE_EAT.AFailingPostPassesTheEventThroughInsteadOfEatingIt`<br>`POST_KEY_EVENT_AND_DECIDE_EAT.NeitherHandoffFailureRouteEatsTheEvent` |
| 3 | `M24` | `UpdateModifierCacheFromKeyEvent`'s Ctrl extended-bit arm inverted (`fIsExtendedKey ? VK_LCONTROL : VK_RCONTROL`) | 73 | `MODIFIER_CACHE_EVENT_ORDER.ExtendedBitChiralisesControlAndAltIntoTheSlotTheLiveReadingUses` |
| 4 | `M8` | `keybd_shift_release` / `keybd_shift_reset` stop tagging their wrap events with `EXTRAINFO_FLAG_KEYMAN_MODIFIER_WRAP` | 72 | `PREPARE_INJECTED_INPUT_BATCH.EveryWrapEventIsIdentifiableAsKeymanInjected`<br>`PREPARE_MODIFIER_VERIFICATION_CORRECTION.TheRightShiftCorrectionIsIdentifiableThroughDwExtraInfoAlone` |

Every count above sums to 74 with its red set, so no mutation silently dropped or
added a test.

### What this establishes, and what it does not

**Establishes**: each of the four production decisions FR-017 names is now pinned
by at least one test that fails when it is reverted, and the blast radius of each
is small and specific — one or two tests, in the fixture that owns that decision.
That is the green -> red -> revert -> green cycle SC-004 asks for, measured four
times.

**Does not establish**: that the suite is complete. It establishes coverage of
these four decisions only. The FR-018 ledger (T039) records, separately and
empirically, which tests still pass with their own fix reverted; that ledger is
the honest statement of what remains unpinned, and it is not superseded by this
table.

Three of the four reds are cases added by this spec (T034, T035, T036 and their
siblings). Before them, mutations 2, 3 and 4 left the whole suite green. Mutation
3 is the starkest: no test in the file passed `VK_CONTROL` or `VK_MENU` to
`UpdateModifierCacheFromKeyEvent` at all, so the chirality arm was not weakly
covered, it was **uncovered**.
