# Issue drafts for the #8064 producer audit

Four drafts, one per file, each paste-ready: title and body, nothing left to
write. They correspond to rows in
[`../MODIFIER-PRODUCERS.md`](../MODIFIER-PRODUCERS.md) *The producers*.

**These are not filed, and that is not a gap.** They are filed on the day the
#8064 PR is submitted, so the issue numbers and the PR reference each other in one
pass instead of the drafts going stale in a branch. Nothing in this branch's work
waits on them: FR-011a's requirement is that an accepted row carry a **complete
draft**, and that is what these are. The drafts are the deliverable; the filing is
an administrative step that happens later.

| # | row | draft | verdict on that row | why it is filed |
|---|---|---|---|---|
| 1 | `2a` | [`issue-1-osk-release-chirality.md`](./issue-1-osk-release-chirality.md) | `mitigated` on this branch | the defect is live in released builds; users are running those today |
| 2 | `2b` | [`issue-2-osk-resetshiftstates-press.md`](./issue-2-osk-resetshiftstates-press.md) | `mitigated` on this branch | same — filed for the record |
| 3 | `2c` | [`issue-3-osk-sticky-stranded-by-kill.md`](./issue-3-osk-sticky-stranded-by-kill.md) | **`UNMITIGATED`**, accepted not fixed (FR-011b) | unmitigated on every build, this one included |
| 4 | `8` | [`issue-4-postkeys-pair-split.md`](./issue-4-postkeys-pair-split.md) | **`UNMITIGATED`** (contrived), accepted not fixed | unguarded on every build |

## When you do file them

1. File each draft as-is on `keymanapp/keyman`.
2. Write the real number over the matching `#____` in
   [`../MODIFIER-PRODUCERS.md`](../MODIFIER-PRODUCERS.md) *The producers*.
3. The #8064 PR's own note — that the fix closes #8064's mechanism and **not**
   every producer of a stuck modifier — cites issues 3 and 4 by number, and points
   the reader at [`../TRIAGE.md`](../TRIAGE.md) for telling the paths apart.

## What these drafts are careful about

Two traps the 2026-08-27 and 2026-08-28 runs exposed, both of them easy to
reintroduce by editing a draft casually:

- **Issue 1 carries a constraint, not just a defect.** A release path may read
  `FCachedShiftState` and remove from it, but must not write into it — writing
  from `ShiftStateChange` is how I2177 comes back. Keep that paragraph.
- **Issue 4's "contrived" is about the split, not the reachability.**
  `AIWin2000Unicode::PostKeys` logged 245 times in a single five-iteration probe
  run. What is contrived is splitting the KEYDOWN/KEYUP pair under queue
  truncation. An earlier version of the draft opened with "Reachability is narrow"
  and invited exactly the wrong reading.
