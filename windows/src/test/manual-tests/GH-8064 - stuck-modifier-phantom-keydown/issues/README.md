# Issue drafts for the #8064 producer audit

Five drafts, one per file, each paste-ready: title and body, nothing left to
write. The first four correspond to rows in
[`../MODIFIER-PRODUCERS.md`](../MODIFIER-PRODUCERS.md) *The producers*; the fifth
is not a producer row at all — it emits nothing, and is one of the three routes
by which the modifier cache's feed can be dead (`serialkeyeventcommon.h:209-217`).

**These are not filed, and that is not a gap — it is the finished state.** This
work does not open GitHub issues on the maintainer's behalf. FR-011a's requirement
is that an accepted producer row carry a **complete draft**, and that is what
these are: the draft *is* the deliverable, and a row that has one is handled. Draft
5 is over and above that requirement — it has no row to carry it — and it is
finished on the same terms. Nothing in this branch waits on an issue number, and
the producer table links each row to its draft file rather than to a number.

If the maintainer later decides to open one of these upstream, that is their own
step, taken outside this spec — see *If you choose to file them* below.

| # | row | draft | verdict on that row | why it is worth raising |
|---|---|---|---|---|
| 1 | `2a` | [`issue-1-osk-release-chirality.md`](./issue-1-osk-release-chirality.md) | `mitigated` on this branch | the defect is live in released builds; users are running those today |
| 2 | `2b` | [`issue-2-osk-resetshiftstates-press.md`](./issue-2-osk-resetshiftstates-press.md) | `mitigated` on this branch | same — filed for the record |
| 3 | `2c` | [`issue-3-osk-sticky-stranded-by-kill.md`](./issue-3-osk-sticky-stranded-by-kill.md) | **`UNMITIGATED`**, accepted not fixed (FR-011b) | unmitigated on every build, this one included |
| 4 | `8` | [`issue-4-postkeys-pair-split.md`](./issue-4-postkeys-pair-split.md) | **`UNMITIGATED`** (contrived), accepted not fixed | unguarded on every build |
| 5 | *no row* — feed-dead route 1 of 3, behind row `1`'s mitigation | [`issue-5-inithooks-return-value-discarded.md`](./issue-5-inithooks-return-value-discarded.md) | not a producer, so no row verdict; the discard is unfixed here and deliberately out of the #8064 fix's scope | a silent hook-install failure can leave the cache with no feed while `feedIsConfigured` still reads TRUE, so the batch releases a held modifier and never restores it; `LowLevelHookWatchDog` recovers only part of it |

## If you choose to file them

Optional, and owned by whoever maintains the branch — no task, gate, or success
criterion depends on it.

1. Paste each draft as-is on `keymanapp/keyman`. They are complete; nothing needs
   writing first.
2. Optionally add the resulting number alongside the draft link in
   [`../MODIFIER-PRODUCERS.md`](../MODIFIER-PRODUCERS.md) *The producers*. The link
   is what the table requires; a number is a bonus. Drafts 1-4 only — draft 5 has
   no row there.
3. The #8064 PR's own note — that the fix closes #8064's mechanism and **not**
   every producer of a stuck modifier — cites drafts 3 and 4, and points the reader
   at [`../TRIAGE.md`](../TRIAGE.md) for telling the paths apart.

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
