# US1 / Phase 7 red records -- the tests that fail against the tree before their fix

Recorded 2026-08-28. Machine mleeloq, Windows 11 Pro 10.0.26200, debug x86.
Method: spec Development Method, inheriting 002/FR-000 -- each finding gets a test RUN AND RECORDED
AS FAILING first, and only then the fix. This file is the "recorded as failing" half for Phase 7.


## T069 (FR-002) and T070 (FR-006) -- the diagnostic seam is bound and nothing emits through it

State of the tree for this run: `serialkeyeventcommon.h` carries `ModifierDiagnosticCode` and
`PMODIFIERDIAGNOSTIC`, and `PrepareInjectedInputBatch` takes `pfnDiagnostic` -- but its body only
holds `UNREFERENCED_PARAMETER(pfnDiagnostic)`, so no code path emits anything. That transient exists
solely because `keyman32.vcxproj` treats warnings as errors (C2220), so an unreferenced parameter
cannot sit even for one commit; it is removed by the commit that adds the emission.

WHAT THE RED PROVES, and it is the point of separating the seam from the emission: the two failures
below are failures of the REPORT, not of the batch. Every behavioural assertion in both cases
passed, including the ones that pin FR-001 (the hold is still dropped) and FR-007 (the reconcile
still clears, and no KEYDOWN is manufactured). So the diagnostic cannot be confused with a
behaviour change, in either direction, and the three negative cases -- the restored hold, the
feed-off batch, and the single-modifier launch-seed case -- were green from the start, which is what
stops the fix from being "emit on every release".

    ./tests/bin/Win32/Debug/keyman32.tests.exe --gtest_filter=MODIFIER_DIAGNOSTIC.*

    Running main() from gtest_main.cpp with memory leak detection
    Note: Google Test filter = MODIFIER_DIAGNOSTIC.*
    [==========] Running 5 tests from 1 test case.
    [----------] Global test environment set-up.
    [----------] 5 tests from MODIFIER_DIAGNOSTIC
    [ RUN      ] MODIFIER_DIAGNOSTIC.ADroppedHoldIsNamedInTheDiagnostic
    D:\Github\_Projects\_KM\keyman\windows\src\engine\keyman32\tests\keybd_shift.tests.cpp(1912): error: Expected equality of these values:
      CountDiagnostics(ReleasedWithoutCacheClaim)
        Which is: 0
      1
    the batch dropped a hold and said nothing. That silence is FR-002's subject: a user reports a modifier that went dead and there is nothing in the log to match it against
    D:\Github\_Projects\_KM\keyman\windows\src\engine\keyman32\tests\keybd_shift.tests.cpp(1915): error: Value of: HasDiagnostic(ReleasedWithoutCacheClaim, VK_LCONTROL)
      Actual: false
    Expected: true
    the report must NAME the modifier -- 'a hold was dropped' does not let anyone correlate it with what the user was pressing
    [  FAILED  ] MODIFIER_DIAGNOSTIC.ADroppedHoldIsNamedInTheDiagnostic (2 ms)
    [ RUN      ] MODIFIER_DIAGNOSTIC.AHoldTheCacheClaimsIsRestoredAndNotReported
    [       OK ] MODIFIER_DIAGNOSTIC.AHoldTheCacheClaimsIsRestoredAndNotReported (0 ms)
    [ RUN      ] MODIFIER_DIAGNOSTIC.WithTheFeedOffThereIsNoDropToReport
    [       OK ] MODIFIER_DIAGNOSTIC.WithTheFeedOffThereIsNoDropToReport (0 ms)
    [ RUN      ] MODIFIER_DIAGNOSTIC.TwoHoldsLostAtOnceLookLikeADesktopSwitchAndAreReportedAsOne
    D:\Github\_Projects\_KM\keyman\windows\src\engine\keyman32\tests\keybd_shift.tests.cpp(1987): error: Expected equality of these values:
      CountDiagnostics(PossibleDesktopSwitch)
        Which is: 0
      2
    two holds were lost in one batch with cache and OS agreeing afterwards, and nothing was reported. FR-006 exists because that state is invisible to every other mechanism here
    D:\Github\_Projects\_KM\keyman\windows\src\engine\keyman32\tests\keybd_shift.tests.cpp(1990): error: Value of: HasDiagnostic(PossibleDesktopSwitch, VK_LSHIFT)
      Actual: false
    Expected: true
    the report must name what was lost
    D:\Github\_Projects\_KM\keyman\windows\src\engine\keyman32\tests\keybd_shift.tests.cpp(1991): error: Value of: HasDiagnostic(PossibleDesktopSwitch, VK_LCONTROL)
      Actual: false
    Expected: true
    [  FAILED  ] MODIFIER_DIAGNOSTIC.TwoHoldsLostAtOnceLookLikeADesktopSwitchAndAreReportedAsOne (0 ms)
    [ RUN      ] MODIFIER_DIAGNOSTIC.OneLostHoldIsTheLaunchSeedCaseAndIsNotReportedAsADesktopSwitch
    [       OK ] MODIFIER_DIAGNOSTIC.OneLostHoldIsTheLaunchSeedCaseAndIsNotReportedAsADesktopSwitch (0 ms)
    [----------] 5 tests from MODIFIER_DIAGNOSTIC (3 ms total)
    
    [----------] Global test environment tear-down
    [==========] 5 tests from 1 test case ran. (3 ms total)
    [  PASSED  ] 3 tests.
    [  FAILED  ] 2 tests, listed below:
    [  FAILED  ] MODIFIER_DIAGNOSTIC.ADroppedHoldIsNamedInTheDiagnostic
    [  FAILED  ] MODIFIER_DIAGNOSTIC.TwoHoldsLostAtOnceLookLikeADesktopSwitchAndAreReportedAsOne
    
     2 FAILED TESTS


## T071 (FR-015b / A9) and T072 (FR-014 / A8) -- the two stray-behaviour reds

State of the tree for this run: `pRestorePressIndex` is declared and documented on
`PrepareInjectedInputBatch` and never written (a second `UNREFERENCED_PARAMETER`, removed by the
commit that populates it), and `keybd_shift_release` still sends its prefix unconditionally.

Both reds come with positives that were green from the outset, which is what makes them fixes rather
than deletions:

  - A9's red is the index out-param never being written. Its positive half is in the same case: the
    two send boundaries. At the first restore press EVERY set bit must be reported dropped; one past
    the last one NONE may be. A conservative clear-the-whole-mask-on-any-short-send passes the first
    and fails the second, so the case rejects the easy wrong answer as well as today's.
  - A8's red is the prefix pair on a Shift-only standalone correction.
    `AnAltCorrectionStillSendsThePrefixKeystroke`, `ACorrectionContainingAnyAltSendsThePrefixKeystroke`
    and `TheBatchReleaseHalfStillSendsItsPrefixForAShiftOnlyRelease` were all green before the fix
    and pin the three things it must not break: the Alt case the prefix exists for, an Alt found
    anywhere in the set rather than only first, and the batch path being untouched.

    Running main() from gtest_main.cpp with memory leak detection
    Note: Google Test filter = PREPARE_INJECTED_INPUT_BATCH.EachRestorePress*:PREPARE_MODIFIER_VERIFICATION_CORRECTION.*Prefix*
    [==========] Running 5 tests from 2 test cases.
    [----------] Global test environment set-up.
    [----------] 1 test from PREPARE_INJECTED_INPUT_BATCH
    [ RUN      ] PREPARE_INJECTED_INPUT_BATCH.EachRestorePressIsLocatableInTheBufferSoAShortSendIsExact
    D:\Github\_Projects\_KM\keyman\windows\src\engine\keyman32\tests\keybd_shift.tests.cpp(2091): error: Expected: (restorePressIndex[i]) != (kRestorePressIndexUnwritten), actual: -2 vs -2
    slot 0: the index out-param was never written, so a caller facing a short send has no way to tell which of its restore presses actually went out. That is A9: the mask asserts presses the OS never received
    [  FAILED  ] PREPARE_INJECTED_INPUT_BATCH.EachRestorePressIsLocatableInTheBufferSoAShortSendIsExact (1 ms)
    [----------] 1 test from PREPARE_INJECTED_INPUT_BATCH (1 ms total)
    
    [----------] 4 tests from PREPARE_MODIFIER_VERIFICATION_CORRECTION
    [ RUN      ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.UsesThePrefixProtectionForAnIsolatedAltCorrection
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.UsesThePrefixProtectionForAnIsolatedAltCorrection (0 ms)
    [ RUN      ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.AShiftOnlyCorrectionSendsNoPrefixKeystroke
    D:\Github\_Projects\_KM\keyman\windows\src\engine\keyman32\tests\keybd_shift.tests.cpp(2167): error: Expected equality of these values:
      Count(PREFIX_VK, false)
        Which is: 1
      0
    a standalone correction that releases only Shift sent a prefix KEYDOWN into whatever has focus now. The prefix exists to stop an isolated ALT release opening the window menu; there is no Alt here, so this keystroke has no job and a destination nobody chose
    D:\Github\_Projects\_KM\keyman\windows\src\engine\keyman32\tests\keybd_shift.tests.cpp(2171): error: Expected equality of these values:
      Count(PREFIX_VK, true)
        Which is: 1
      0
    and its KEYUP likewise
    D:\Github\_Projects\_KM\keyman\windows\src\engine\keyman32\tests\keybd_shift.tests.cpp(2172): error: Expected equality of these values:
      n
        Which is: 3
      1
    one KEYUP is the whole correction; anything more is stray input
    [  FAILED  ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.AShiftOnlyCorrectionSendsNoPrefixKeystroke (0 ms)
    [ RUN      ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.AnAltCorrectionStillSendsThePrefixKeystroke
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.AnAltCorrectionStillSendsThePrefixKeystroke (1 ms)
    [ RUN      ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.ACorrectionContainingAnyAltSendsThePrefixKeystroke
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.ACorrectionContainingAnyAltSendsThePrefixKeystroke (0 ms)
    [----------] 4 tests from PREPARE_MODIFIER_VERIFICATION_CORRECTION (1 ms total)
    
    [----------] Global test environment tear-down
    [==========] 5 tests from 2 test cases ran. (3 ms total)
    [  PASSED  ] 3 tests.
    [  FAILED  ] 2 tests, listed below:
    [  FAILED  ] PREPARE_INJECTED_INPUT_BATCH.EachRestorePressIsLocatableInTheBufferSoAShortSendIsExact
    [  FAILED  ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.AShiftOnlyCorrectionSendsNoPrefixKeystroke
    
     2 FAILED TESTS
