# Keyman restack — test / retest list

Purpose: what Matthew can actually test on his own Windows / Delphi 12 CE
build machine, after the restack of #16043 / #16044 / #16191 and
#16490 / #16527 onto modern upstream/master. Not a PR body, not posted
anywhere.

Restack actually performed 2026-10-27, upstream base
fcc0bd369d (Merge PR #16910, auto/version-master-20.0.9):
- #16043 restack/16043 tip 582a4dae73 (14 commits, rebased from
  90792cfa9c). Conflicts resolved: .gitignore only, twice — once
  for upstream tsdoc/api-extractor lines vs the PR's wraplock line,
  once for the later commit that drops the wraplock rule. Final
  .gitignore keeps version*.res and the tsdoc lines, drops wraplock,
  and loses one blank line before the tsdoc comment (cosmetic
  rebase artifact, not a functional change).
- #16044 restack/16044 tip 631327a507 (2 commits on top of 16043,
  no conflicts). Diff vs 16043 is exactly its own layer.
- #16191 restack/16191 tip 08278bd64a (guard commit only, cherry-
  picked onto 16044). Conflict resolved in
  resources/build/win/environment.inc.sh: the old guard branch's
  _probe_delphi_ce helper and the new 16044 _delphi_ce_output_fresh
  helper occupied the same spot — both are now present, bash -n
  passes, diff vs 16044 is exactly 28 lines, 1 file.
  DROPPED from old 16191 in this restack (superseded, not lost
  silently — check whether any of it needs porting later):
  the old CE workflow commit ecc0aa81, the old compat subset, and
  four docs commits d36fc00f2e, 83a61b8b0c, 9603b1b562,
  b6b9b7ec1e (CE guide rework, registry/DELPHIINCLUDES correction,
  SETX style, cert setup, build-order table). The restacked
  16191 uses 16044's 412-line guide, not 16191's 359-line guide.
- #16490 restack/16490 tip 289eb29eab (17 commits, no conflicts).
  Diff vs upstream/master is byte-identical in file list to the
  old diff: 42 files, +12896 / -74.
- #16527 restack/16527 tip 67f9c23053 (7 commits on top of 16490,
  no conflicts). Diff vs 16490 is exactly its own layer: 7 files,
  +1042 / -45. The $00000010 literal in UfrmOSKOnScreenKeyboard.pas
  now sits on top of 16490's #define of the same flag in
  k32_visualkeyboardinterface.h — stack order is now structural,
  not just documented.

Ground rule for every item below: record date, branch, head SHA, machine,
and result (PASS / FAIL / BLOCKED with reason). INCONCLUSIVE is never a
pass. A test that was not run is UNVERIFIED, not "works".

## A. Retest after ANY rebase, both stacks (do first)

1. Full CLEAR rebuild, not incremental, on each stack tip in order:
   Delphi: 16043, then 16044 on top of it, then 16191 on top of that.
   8064: 16490, then 16527 on top of it.
   Reason: a rebase conflict resolution can silently change a file that
   an incremental build never recompiles.
2. Diff check per layer (no build needed, do it in git):
   - 16043 diff vs upstream/master = only Delphi 11/12 compat + vendored
     patches + .gitignore. No Emscripten bump, no groupproj edit.
   - 16044 diff vs 16043 = only CE workflow + trimmed CE guide.
   - 16191 diff vs 16044 = only the CE guard in environment.inc.sh.
   - 16490 diff vs upstream/master = only the serializer fix + tests.
   - 16527 diff vs 16490 = only the OSK viskbd changes + manual test.
   Any file outside those lists is a rebase leak — stop and fix it.
3. Default-path check: with KEYMAN_DELPHI_VERSION and
   KEYMAN_DELPHI_CE both unset, confirm the build scripts take the
   old default path (no new CE prompt, no new probe output in the
   normal flow). This is inspection + a build log diff, not a
   Delphi 10.3 Pro build — see section D, he cannot run Pro.

## B. Delphi stack — testable on Delphi 12 CE

4. CE full clear rebuild, in the documented order, including Tike.exe,
   on 16191 tip (cumulative stack). This is the one end-to-end proof
   for the whole Delphi stack. Record Delphi version (12 Athens CE),
   GetIt packages installed, and whether any step needed a manual
   IDE intervention beyond the documented prompt.
5. CE guard, both directions, on 16191 tip:
   - CE machine, KEYMAN_DELPHI_CE unset -> delphi_msbuild must abort
     LOUDLY, pointing at the CE guide. Must NOT print a silent
     "Build succeeded / 0 errors" and then fail later on a missing file.
   - CE machine, KEYMAN_DELPHI_CE=1 -> IDE prompt appears naming the
     .dproj, pre-build and post-build steps run around it.
6. CE prompt honesty, on 16044 tip: dismiss / close stdin without
   building in the IDE -> the script must NOT report success.
   Log the exact output; if it still reports success, that is a
   FAIL for the cleanup, not a quirk.
7. Vendored-patch removal tests, on 16043 tip, one at a time:
   revert JCL JclSynch, JVCL JvComponent, mbcolor mxs.inc in turn,
   rebuild, and record the exact error each revert produces.
   A patch with no error on this machine goes back on the
   "speculative, remove" list — that was the JclSynch/OldCreateOrder
   lesson. The two already-reverted patches must stay reverted;
   confirm they are not back in the restacked diff.
8. Source-compat spot check: FixedTrackbar.pas and
   Keyman.System.HttpServer.Base.pas compile under VER360 with the
   Defined(VER340/350/360) forms, and the VER330 arms are byte-identical
   to before (git diff on those arms must be empty).
9. engine.groupproj: only if it survived the cleanup as a separate
   item — IDE "Build All" on the engine group must not fail on the
   inst/insthelper path. If it was dropped from the stack, skip and
   note it as dropped, not as passed.

## C. 8064 stack — testable on Windows

10. Automated unit suite: run keybd_shift tests (and the full
    keyman32 test target if it runs locally) on 16490 tip.
    Reconcile the x64/x86 count difference seen in the old logs
    (95 vs 96) — rerun both and explain the delta in the log, or
    a reviewer will find it.
11. Interactive probes: run the opt-in test-interactive probes on
    16490 tip (the four probes that inject real input). These do
    NOT run on CI, so a local pass is the only pass that counts.
12. Three-arm gate (primary regression check):
    windows/src/test/manual-tests/GH-8064 - stuck-modifier-phantom-keydown/stuck-mod-test.ps1 -Gate
    Needs: sil_cameroon_qwerty + a Microsoft English QWERTY,
    interactive desktop, running keyman.exe, machine left alone
    while it runs (it injects real keystrokes into Notepad).
    Expect: FAIL on a released/stock build, PASS on 16490 tip.
    Also rerun the repro script (run-8064-test.ps1, fakefreeze stall
    past LowLevelHooksTimeout, modifier released during stall):
    stock = FAIL on all five iterations, fixed = PASS on all five.
13. Hand tests from the PR's User Testing section, on 16490 tip:
    - TEST_MODIFIERS_BASELINE: each hardware modifier in turn,
      transformed output correct, release returns to unmodified.
    - TEST_MODIFIER_HELD_BEFORE_KEYMAN_STARTS: hold Left Ctrl,
      start Keyman, release before typing — first injected output
      must be unmodified.
    - TEST_NO_LOST_KEYSTROKES: type a FIXED ten-character string
      ten times (100 characters expected, unbroken) while
      triggering fakefreeze stalls. No script covers this yet —
      do it by hand with a known string and diff the result;
      "typed continuously, nothing seemed lost" is not a test.
14. OSK tests, on 16527 tip (after 16490, never before it):
    - TEST_OSK_MODIFIERS_BASELINE, TEST_RIGHT_SHIFT (behaviour
      from #16361 must be unchanged), TEST_RELEASE_MODIFIERS_OPTION
      (on and off), TEST_OSK_TEARDOWN_PATHS (tray menu, tray
      double-click, Keyman hotkey, exiting Keyman — not just the
      OSK close button / tab switch).
    - TEST_OSK_CHIRAL_RELEASE with test_chirality.kmx: Right Ctrl
      held on OSK, click a -> RC_a; switch keyboards and back,
      click Ctrl off -> a gives DF_a, not RC_a.
    - TEST_OSK_USER_HELD_MODIFIER: OSK Shift held + hardware
      Shift held, dismiss OSK -> hardware Shift still held until
      you release it yourself, then nothing stuck.
    - TEST_OSK_RIGHT_SHIFT_STICKY: the trap case — OSK Shift
      held, engine injects output several times, dismiss OSK ->
      Shift must be released, not mistaken for user-held.
      This test is meaningless on 16527 alone (the flag bit is
      never set without 16490), so a pass here only counts on
      the stacked tip.
15. OSK manual oracle: watch-modifiers.ps1 in
    GH-16462 - osk-sticky-modifier, toggling the OSK and reading
    stored state, on 16527 tip. Record the state transitions,
    not just "looked right".

## D. What he CANNOT test on this machine — label, do not claim

- Delphi 12 Pro, Delphi 13, Delphi 10.3 Pro regression, Delphi 12 CE
  on Linux. He has Delphi 12 CE only; no team member has a
  Delphi 12/13 paid licence (as of 2026-10-27).
- A clean machine with no preinstalled binaries / no long-lived
  Delphi registry. Closest available: a fresh Windows VM/sandbox
  with only Delphi 12 CE + the documented GetIt packages, and
  record exactly what was installed. Even that is "fresh VM",
  not "clean contributor machine".
- ARM64 (no build agent, per #15065), secure desktop,
  higher-integrity focus, Mac/Linux/Android/iOS for 8064
  (8064 is Windows-tagged, so the last group is out of scope,
  not a failure).
- TEST_REMOTE_DESKTOP: testable ONLY if he has a second machine
  or VM to RDP from, with a Keyman keyboard selected and
  modifiers typed over the session. If he does not have that
  setup, it stays BLOCKED (needs a team tester with RDP), not
  PASSED and not failed.
- TeamCity / upstream CI, the team's manual build, and any user
  test run by someone else. He can define the tests and run his
  own; he cannot see or schedule theirs.
- No-new-bugs in Keyman areas with few handwritten tests.
  Covered-behaviour tests do not prove that.

## E. Retest triggers — as actually hit by this rebase

- environment.inc.sh (16191 conflict, both helpers merged) ->
  rerun B.5 (guard, both directions) AND the 16044 auto-skip
  behaviour: CE=1, output already fresh -> prompt must skip;
  CE=1, output stale -> prompt must appear; CE unset on a CE
  machine -> guard must die loudly, not skip. A merge that
  broke either helper would pass one of these and fail the
  other, so run all three, not just the guard.
- .gitignore (16043 conflicts) -> no functional test; just
  confirm `git status` shows no unexpected ignored files after
  a build (version*.res outputs ignored, tsdoc/api-extractor
  outputs ignored).
- No conflicts in 16490 or 16527, and no upstream file they
  touch changed in a way that altered their diffs — so for
  those two stacks the retest is the standard full clear
  rebuild (A.1) plus C.10–C.15, not a conflict-driven extra.
- keyman32 / k32_visualkeyboardinterface.h touched -> rerun
  C.10–C.13 and C.14 TEST_OSK_RIGHT_SHIFT_STICKY. (Not touched
  by a conflict here, but touched by the stack itself.)
- viskbd .pas files touched -> rerun all of C.14 and C.15.
- Vendored ext files touched -> rerun B.7 for that file.
- If upstream/master moved a file the PR also touches and the
  merge was non-trivial, rerun the full clear rebuild (A.1)
  for that stack, even if the diff looks clean. (Only
  .gitignore and environment.inc.sh qualified here, above.)
