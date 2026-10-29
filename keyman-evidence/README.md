# Keyman evidence — #8064 and #16462 (not a PR, not merged code)

This branch, `evidence/8064-16462` in MattGyverLee/keyman, is the
evidence archive for the restacked closed PRs #16490 (fix #8064,
stuck modifier) and #16527 (fix #16462, OSK sticky modifier).
It is NOT a pull request, it is NOT part of either PR's diff, and
nothing here is built by CI. It exists so the investigation trail
is not lost when the evidence logs are removed from the PR branches.

## What is here, and where it came from

- `16490-GH-8064/manual-tests-GH-8064/` — a faithful copy of
  `windows/src/test/manual-tests/GH-8064 - stuck-modifier-phantom-keydown/`
  as it stood on the restacked #16490 tip 289eb29eab (2026-10-27,
  rebased onto upstream/master fcc0bd369d). That includes:
  - `evidence/` — stock vs fixed run logs and CSVs (19.0.276 stock,
    19.0.277 fixed), `rawinput-delivery.md`. These are historical
    run outputs for one machine, not rerunnable tests. Do not
    treat a log here as proof for a later SHA — rerun the script
    that produced it.
  - `TRIAGE.md` — how to tell the serializer path from the OSK
    path when a stuck modifier is reported in the field.
  - `issues/` — paste-ready drafts for follow-on issues
    (init-hooks return discarded, PostKeys pair-splitting).
    They are drafts, not filed issues, until someone files them.
  - `host32/`, `stuck-mod-test.ps1`,
    `deploy-8064.ps1`, `README.md` — the tools and scripts
    themselves, copied so this snapshot is self-contained.
    The live, maintained copies stay in the PR branches under
    `windows/src/test/manual-tests/`; if the two disagree, the
    PR branch copy wins.
- `16527-GH-16462/manual-tests-GH-16462/` — a faithful copy of
  `windows/src/test/manual-tests/GH-16462 - osk-sticky-modifier/`
  as it stood on the restacked #16527 tip 67f9c23053. That includes:
  - `evidence/baseline-shipped-build.md` — the recorded red
    baseline on a shipped build.
  - `issues/issue-osk-sticky-stranded-by-kill.md` — draft for
    the crash-while-sticky-held path, which no in-process code
    can fix. Draft only, not a filed issue.
  - `pr-M.md`, `README.md`, `watch-modifiers.ps1` — PR-text
    draft, manual-test README, and the scripted oracle.
- `restack-test-list-2026-10-27.md` — the test / retest list
  for Matthew's Windows / Delphi 12 CE machine, after the
  restack. This is the checklist a future testing agent
  should start from. The same list also lives in the
  assistant's workspace at
  `~/workspace/keyman-restack-test-list-2026-10-27.md`
  and is recorded in the assistant's memory under the
  Keyman / mcdurdin notes, so it can be found by searching
  for "keyman restack test list" even without this branch.
- `team-testing-plan-2026-10-27.md` — the Keyman team's
  testing plan for the November revisit, stored here
  deliberately (no fork issue — Matthew's fork has
  issues disabled, and no issue was created) so it is
  there even if the team picks the work up without
  talking to Matthew first. It is PREPARED, NOT POSTED:
  it has not been added to any upstream PR, and the
  link to it from the PR bodies is to be added at
  reopen, not before. If you found this branch without
  a PR link, start here — it contains the reopen
  agenda, the honest proven/unverified table, and the
  still-open list.

## What moved out of the PR branches, and what stayed

Moved here (and removed from the PR branches in the same
cleanup): the `evidence/` logs, `TRIAGE.md`, the `issues/`
drafts, and `pr-M.md`.

Stayed in the PR branches, because they are rerunnable:
the production code, the automated tests
(`windows/src/engine/keyman32/tests/keybd_shift.tests.cpp`
and `keybd_shift.interactive.tests.cpp`), the manual-test
scripts (`stuck-mod-test.ps1`,
`watch-modifiers.ps1`, `deploy-8064.ps1`), the probe tools
(`host32/`, `fakefreeze`), and the manual-test READMEs.

## Tool READMEs — where to find them

- `host32/README.md` — in the PR branch, next to
  `host32.cpp` / `rawinput-probe.cpp`. host32 is the
  self-driving 32-bit repro host; rawinput-probe is a
  measurement only, not a fix and not a repro step.
- `windows/src/support/fakefreeze/README.md` — in the PR
  branch, next to `fakefreeze.cpp`. fakefreeze posts the
  5-second pause that makes Windows drop the low-level hook.
- The folder READMEs in the manual-test folders
  (`GH-8064 .../README.md`, `GH-16462 .../README.md`)
  remain the main documentation for the manual tests
  themselves, including preconditions, hazards, and oracles.
  The script headers (`stuck-mod-test.ps1`,
  `watch-modifiers.ps1`, `deploy-8064.ps1`) also carry their own usage and
  exit-code contracts — read the header before running
  a script, not just the folder README.

## How to use this branch when testing

1. Start from `restack-test-list-2026-10-27.md` in this
   branch (or the workspace copy). Record date, branch,
   head SHA, machine, and result for every item.
2. Run the tests from the PR branches, not from this
   branch — this branch is an archive snapshot, and its
   script copies may be older than the PR branches.
3. Come back here only when a result needs explaining:
   compare a new run against the stock/fixed logs, or
   read TRIAGE.md before concluding a new report is a
   regression.
4. INCONCLUSIVE is never a pass, and a log here is
   never a substitute for rerunning the test on the
   SHA under test.
