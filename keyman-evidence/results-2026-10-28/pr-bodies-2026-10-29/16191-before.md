## Summary

Third and smallest of the Delphi 12 CE workflow PRs. Detects Delphi Community Edition via a `dcc32.exe` probe and aborts `delphi_msbuild` with a clear message when the developer is on CE but hasn't set `KEYMAN_DELPHI_CE=1`. **Turns the single most confusing failure mode in the CE workflow into a loud, obvious error.**

## The problem

If a contributor is on Delphi 12 CE and forgets to `export KEYMAN_DELPHI_CE=1` in their shell (easy to do — SETX only affects new shells), `delphi_msbuild` falls through to `msbuild.exe`. On CE, msbuild reports:

```
Build succeeded.
    0 Warning(s)
    0 Error(s)

Time Elapsed 00:00:01.23
```

...and produces **no output**. Downstream `cp`, `mv`, `mt.exe`, `sentrytool_delphiprep` steps then fail with "file not found" errors pointing at paths Delphi never wrote to. Diagnosing this from the symptom takes considerable time — you chase the missing file assuming Delphi's build worked, when really Delphi never ran.

Discovered while running the CE workflow walkthrough for [#16044](https://github.com/keymanapp/keyman/pull/16044); every "Delphi silently succeeded but no output" issue I hit traced back to a lost `KEYMAN_DELPHI_CE` env var.

## What the change does

Adds a `dcc32.exe` probe, cached per shell in [`resources/build/win/environment.inc.sh`](resources/build/win/environment.inc.sh):

- CE's `dcc32.exe` is a 23KB stub that prints `This version of the product does not support command line compiling.` and exits non-zero.
- Pro/Enterprise's `dcc32.exe` is the real compiler and accepts flags.

`_probe_delphi_ce` runs `dcc32.exe` once per shell, captures stderr, and sets `_KEYMAN_DELPHI_IS_CE=1` if the marker string is present. Result cached per shell — subsequent `delphi_msbuild` calls in the same shell don't re-spawn dcc32, so a full clear rebuild costs about one spawn per build.sh invocation (roughly 30 across the whole rebuild), not one spawn ever.

`delphi_msbuild` then checks: if we're not in CE mode (`KEYMAN_DELPHI_CE != 1`) but the probe detected CE, `builder_die` with a message pointing at [`docs/build/windows-delphi-ce.md`](docs/build/windows-delphi-ce.md).

## CI impact

**None.** CI runs on Delphi 10.3 Pro. The probe hits Pro's real `dcc32.exe`, doesn't see the CE marker, sets `_KEYMAN_DELPHI_IS_CE=""`, and `delphi_msbuild` proceeds to msbuild normally. The added overhead is one dcc32 spawn per build.sh invocation — trivial.

## Relates-to / Depends-on

Relates-to: #4599
Depends-on: #16044 (that PR introduces the `KEYMAN_DELPHI_CE=1` env var and the CE prompt branch this guard sits alongside)

Once #16044 lands, this can merge without conflicts (based on that branch).

## User Testing

User testing not required: build-environment change with no runtime behaviour modification. CI exercises the Pro-path.

---

## Testing plan — November revisit (added 2026-10-27, PR still closed)

Team testing plan for this stack, stored on the author's fork (not a fork issue, not part of the PR diff):
https://github.com/MattGyverLee/keyman/blob/evidence/8064-16462/keyman-evidence/team-testing-plan-2026-10-27.md

It covers the Delphi stack (#16043/#16044/#16191) and the 8064 stack (#16490/#16527): what changed since September, what the author will test on his own machine, what only the team can test (CI/manual build/user tests, Delphi licence decision, vendored patches), an honest proven/unverified table, and the still-open list. Evidence logs and drafts are on the same branch, indexed at:
https://github.com/MattGyverLee/keyman/blob/evidence/8064-16462/keyman-evidence/README.md

This link was added while the PR is closed; it does not reopen the PR, request review, or change the PR's code.
