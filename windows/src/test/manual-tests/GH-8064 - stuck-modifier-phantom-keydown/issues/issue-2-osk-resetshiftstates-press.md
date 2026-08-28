# Issue 2 — OSK `ResetShiftStates` cleanup path itself (row `2b`)

Draft, not filed. Producer row `2b` in
[`../MODIFIER-PRODUCERS.md`](../MODIFIER-PRODUCERS.md). Filed on the day the
#8064 PR is submitted; see [README.md](./README.md).

---

**Title:** OSK `ResetShiftStates` could press a modifier during its own cleanup (fixed on the #8064 branch; filed for the record)

**Body:**

`ResetShiftStates`'s cleanup routed the release through `ShiftStateChange`'s
`PrepState`, which emits a KEYDOWN when a modifier is in one shift-state set and
not another. A modifier-off click could mutate `kbd.ShiftState` without touching
`FShiftState`, and until the next 50 ms resync tick equalised them,
`ResetShiftStates` could press a modifier the user was no longer holding —
chiral, so potentially Right Control.

**Status.** Fixed on `fix/windows/8064-reconcile-modifier-cache`. The rewrite
removes the press branch from this function's code path entirely: the
`ReleaseCached` helper only ever calls `do_keybd_event` with `KEYEVENTF_KEYUP`,
so the failure mode is structurally impossible rather than timing-avoided. Steps
2, 3 and 5 of the manual sequence exercise the path and pass, and the `KLOGGING`
traces show the teardown emitting only `KEYUP` (`flags=2`/`flags=3`), never a
press, in every recorded run.

**Why file it at all, given it is fixed:** the defect is present in released
builds and users are running those today. This is a report-and-close, not a
request for work.

**Ask:** confirm the fix is acceptable as landed, and note for anyone reproducing
it that `keyman.exe` must be built with `{$DEFINE KLOGGING}`
(`common/windows/delphi/general/klog.pas:26`) for the traces above to appear at
all.
