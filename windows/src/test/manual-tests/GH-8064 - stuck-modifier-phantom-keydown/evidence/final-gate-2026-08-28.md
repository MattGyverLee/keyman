# Final gate — the default test target after Phases 5, 7 and 8

Recorded 2026-08-28. Machine mleeloq, Windows 11 Pro 10.0.26200, debug builds.

    ./windows/src/engine/keyman32/build.sh --debug test:x86   ->  96 tests / 17 cases, PASSED, exit 0, 13 ms
    ./windows/src/engine/keyman32/build.sh --debug test:x64   ->  95 tests / 16 cases, PASSED, exit 0, 14 ms

This file exists because two separate reviews of MODIFIER-PRODUCERS.md found the same gap: rows and
findings were citing tests that had no recorded green run, because the last gate in this directory
(`run-gate-x86-2026-08-28.txt`, 72 tests / 12 cases) predates every fixture added since. It does not
predate them any more.

## What the count is made of, against the Phase 1 baseline

    Phase 1 baseline, x86 (/tmp/base-x86.txt)   71 tests / 12 cases, 2326 ms
      -- and it required GTEST_FILTER=-KEYBD_SHIFT.ReconcileDoesNotRaceItsOwnInjectedRestorePress,
         because that test did not terminate. This run needs no filter: nothing in the default
         target can hang any more.

    Final, x86                                  96 tests / 17 cases,   13 ms

The wall clock fell by two orders of magnitude because the four keyboard-injecting probes left this
target (FR-023). They now live in `tests/keybd_shift.interactive.tests.cpp`, run by
`build.sh test-interactive:x86` / `:x64`, and their run is recorded in
`interactive-target-2026-08-28.txt`.

## The five fixtures added since the last recorded gate, and what each pins

    MODIFIER_DIAGNOSTIC                     5 cases  FR-002, FR-006, FR-007
    USER_HELD_SIGNAL                        7 cases  FR-101, FR-102, FR-103, FR-104, FR-105
    VERIFICATION_WITH_SIGNAL                3 cases  FR-103a, asserted together with FR-103
    USER_HELD_FROM_RAW                      5 cases  FR-100a, FR-104a, FR-104b
    (added to existing fixtures)                     FR-014 / A8, FR-015b / A9

The two the producer table specifically wanted a green for:

    PREPARE_MODIFIER_VERIFICATION_CORRECTION.AShiftOnlyCorrectionSendsNoPrefixKeystroke      (A8)
    PREPARE_MODIFIER_VERIFICATION_CORRECTION.AnAltCorrectionStillSendsThePrefixKeystroke     (A8)
    PREPARE_MODIFIER_VERIFICATION_CORRECTION.ACorrectionContainingAnyAltSendsThePrefixKeystroke (A8)
    PREPARE_INJECTED_INPUT_BATCH.TheBatchReleaseHalfStillSendsItsPrefixForAShiftOnlyRelease  (A8)
    PREPARE_INJECTED_INPUT_BATCH.EachRestorePressIsLocatableInTheBufferSoAShortSendIsExact   (A9)

All five are in the run below and all five passed. Every one of them was recorded RED first, against
the tree before its fix, in `us1-red-records-2026-08-28.md`.

## What this run does NOT establish, stated so no row leans on it

- **A9's mitigation is source-reasoned at the boundary.** No test forces a real `SendInput` to send
  short — that is not something a test can provoke on demand. What is tested is the mechanism the
  fix needs: that each restore press is locatable in the buffer, and that clearing by index is
  exact at BOTH send boundaries (every bit at the first press, no bit one past the last). A
  conservative whole-mask clear fails the second half.
- **Nothing about ARM64.** Still unverified; `IN-TREE.md` §6.
- **Nothing about the Delphi side.** Phase 6 never ran — no Delphi on this machine — so A2, A3, A4,
  A5 and A10 have no recorded run and SC-002 is unsatisfied. `research.md` R-14.

---

## x86 — Win32, Debug

    Running main() from gtest_main.cpp with memory leak detection
    [==========] Running 96 tests from 17 test cases.
    [----------] Global test environment set-up.
    [----------] 5 tests from AppContext
    [       OK ] AppContext.Get_Max_buff (0 ms)
    [       OK ] AppContext.Get_small_buff (0 ms)
    [       OK ] AppContext.Get_split_surrogate (0 ms)
    [       OK ] AppContext.BufMax_LastChar (0 ms)
    [       OK ] AppContext.AppContext_Delete (0 ms)
    [----------] 5 tests from AppContext (0 ms total)
    [----------] 1 test from KEYBOARDOPTIONS
    [       OK ] KEYBOARDOPTIONS.SetupCoreEnvironment (1 ms)
    [----------] 1 test from KEYBOARDOPTIONS (1 ms total)
    [----------] 1 test from KMPROCESSACTIONS
    [       OK ] KMPROCESSACTIONS.processUnicodeChartest (0 ms)
    [----------] 1 test from KMPROCESSACTIONS (0 ms total)
    [----------] 5 tests from KEYBD_SHIFT
    [       OK ] KEYBD_SHIFT.ResetRepressesFromCache (0 ms)
    [       OK ] KEYBD_SHIFT.ReleaseEmitsPrefixThenKeyups (0 ms)
    [       OK ] KEYBD_SHIFT.RightControlCollapsesToExtendedControl (0 ms)
    [       OK ] KEYBD_SHIFT.RightShiftCollapsesToShiftWithRightScanCode (0 ms)
    [       OK ] KEYBD_SHIFT.ModifierEventCountNeverExceedsReserve (0 ms)
    [----------] 5 tests from KEYBD_SHIFT (1 ms total)
    [----------] 1 test from K32LowLevelKeyboardHook
    [       OK ] K32LowLevelKeyboardHook.IsModifierKeyAcceptsExactlyNineVks (0 ms)
    [----------] 1 test from K32LowLevelKeyboardHook (0 ms total)
    [----------] 5 tests from CAPTURE_LIVE_MODIFIER_STATE
    [       OK ] CAPTURE_LIVE_MODIFIER_STATE.SetsAByteForEachModifierTheOsHolds (0 ms)
    [       OK ] CAPTURE_LIVE_MODIFIER_STATE.OnlyTheSignBitCountsAsHeld (0 ms)
    [       OK ] CAPTURE_LIVE_MODIFIER_STATE.ZeroesTheWholeArrayFirst (0 ms)
    [       OK ] CAPTURE_LIVE_MODIFIER_STATE.SetsNoByteOutsideTheManagedSet (0 ms)
    [       OK ] CAPTURE_LIVE_MODIFIER_STATE.TakesExactlyOneReadingPerManagedModifier (0 ms)
    [----------] 5 tests from CAPTURE_LIVE_MODIFIER_STATE (0 ms total)
    [----------] 9 tests from RECONCILE_MODIFIER_CACHE
    [       OK ] RECONCILE_MODIFIER_CACHE.ClearsCachedModifierTheOsReportsUp (0 ms)
    [       OK ] RECONCILE_MODIFIER_CACHE.KeepsCachedModifierTheOsReportsDown (0 ms)
    [       OK ] RECONCILE_MODIFIER_CACHE.NeverSetsAModifierTheCacheDoesNotHold (0 ms)
    [       OK ] RECONCILE_MODIFIER_CACHE.ClearsAllSixSlots (0 ms)
    [       OK ] RECONCILE_MODIFIER_CACHE.LeavesNonModifierBytesAlone (0 ms)
    [       OK ] RECONCILE_MODIFIER_CACHE.ReconcileThenResetPressesNothing (0 ms)
    [       OK ] RECONCILE_MODIFIER_CACHE.ReconcileLeavesTheCacheASubsetOfLiveState (0 ms)
    [       OK ] RECONCILE_MODIFIER_CACHE.ZeroesTheWholeArrayFirst (0 ms)
    [       OK ] RECONCILE_MODIFIER_CACHE.ModifierEventCountNeverExceedsReserveForTheUnion (0 ms)
    [----------] 9 tests from RECONCILE_MODIFIER_CACHE (1 ms total)
    [----------] 21 tests from PREPARE_INJECTED_INPUT_BATCH
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.StaleCachedModifierYieldsNoKeydownInTheBatch (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.StaleRightControlYieldsNoExtendedKeydownInTheBatch (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.NoStaleSlotProducesAKeydownInTheBatch (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.EventOrderIsReleaseThenOutputThenRestore (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.NeverWritesPastTheBufferWhenTheSharedBufferOverflows (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.WorstCaseBatchFillsTheBufferToItsLastSlotAndNotOneFurther (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.OsHeldModifierIsReleasedBeforeTheOutputKeys (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.OsHeldModifierIsNotRestoredAfterTheOutputKeys (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.AgreementCasesAreUnchanged (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.BatchTakesOneLiveReadingPerManagedModifier (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.EveryWrapEventIsIdentifiableAsKeymanInjected (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.RestorePressedMaskIsZeroWhenNothingIsRestored (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.RestorePressedMaskNamesExactlyTheVkTheRestoreHalfPressed (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.RestorePressedMaskCoversAllSixWhenAllAreRestored (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.RestorePressedMaskExcludesAModifierTheReconcileCleared (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.RestorePressedMaskExcludesAModifierReleasedOnlyOnTheOssWord (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.CacheNotFedLeavesALiveHeldModifierUntouched (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.CacheNotFedStillReleasesAndRestoresWhatTheCacheAloneHolds (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.CacheNotFedStillReconciles (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.EachRestorePressIsLocatableInTheBufferSoAShortSendIsExact (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.TheBatchReleaseHalfStillSendsItsPrefixForAShiftOnlyRelease (0 ms)
    [----------] 21 tests from PREPARE_INJECTED_INPUT_BATCH (2 ms total)
    [----------] 12 tests from PREPARE_MODIFIER_VERIFICATION_CORRECTION
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.CorrectsAModifierTheOsHoldsThatTheCacheSaysNobodyHolds (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.DoesNotTouchAVkOutsideTheRestorePressedMask (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.DoesNotCorrectWhenTheCacheStillReportsItHeld (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.DoesNotCorrectWhenTheOsAlsoReportsItUp (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.CorrectsRightControlAsExtendedControl (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.UsesThePrefixProtectionForAnIsolatedAltCorrection (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.TheCorrectionIsIdentifiableAsKeymanInjected (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.TheRightShiftCorrectionIsIdentifiableThroughDwExtraInfoAlone (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.CorrectsEveryManagedVkInTurn (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.AShiftOnlyCorrectionSendsNoPrefixKeystroke (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.AnAltCorrectionStillSendsThePrefixKeystroke (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.ACorrectionContainingAnyAltSendsThePrefixKeystroke (1 ms)
    [----------] 12 tests from PREPARE_MODIFIER_VERIFICATION_CORRECTION (2 ms total)
    [----------] 4 tests from DEFECT_CHARACTERISATION_MODIFIER_CACHE_EVENT_ORDER
    [       OK ] DEFECT_CHARACTERISATION_MODIFIER_CACHE_EVENT_ORDER.KeymanOwnRestorePressOutlivesTheUsersRealRelease (0 ms)
    [       OK ] DEFECT_CHARACTERISATION_MODIFIER_CACHE_EVENT_ORDER.TheUsersReleaseArrivingLastLeavesTheCacheCorrect (0 ms)
    [       OK ] DEFECT_CHARACTERISATION_MODIFIER_CACHE_EVENT_ORDER.ABalancedBatchLeavesTheCacheUnchanged (0 ms)
    [       OK ] DEFECT_CHARACTERISATION_MODIFIER_CACHE_EVENT_ORDER.TheStaleByteSurvivesTheReconcileBecauseTheOsAgrees (0 ms)
    [----------] 4 tests from DEFECT_CHARACTERISATION_MODIFIER_CACHE_EVENT_ORDER (0 ms total)
    [----------] 4 tests from MODIFIER_CACHE_EVENT_ORDER
    [       OK ] MODIFIER_CACHE_EVENT_ORDER.TheGateLeavesTheCacheFollowingTheUserAlone (0 ms)
    [       OK ] MODIFIER_CACHE_EVENT_ORDER.TheGateCoversRightShiftThroughDwExtraInfo (0 ms)
    [       OK ] MODIFIER_CACHE_EVENT_ORDER.GenericVkEventReconcilesAgainstTheChiralLiveReading (0 ms)
    [       OK ] MODIFIER_CACHE_EVENT_ORDER.ExtendedBitChiralisesControlAndAltIntoTheSlotTheLiveReadingUses (0 ms)
    [----------] 4 tests from MODIFIER_CACHE_EVENT_ORDER (1 ms total)
    [----------] 6 tests from IS_KEYMAN_INJECTED_KEY_EVENT
    [       OK ] IS_KEYMAN_INJECTED_KEY_EVENT.TheScanFlagAloneIsEnough (0 ms)
    [       OK ] IS_KEYMAN_INJECTED_KEY_EVENT.TheWrapTagAloneIsEnough (0 ms)
    [       OK ] IS_KEYMAN_INJECTED_KEY_EVENT.PhysicalKeystrokesAreNotKeymans (0 ms)
    [       OK ] IS_KEYMAN_INJECTED_KEY_EVENT.RemoteDesktopInputIsNotKeymans (0 ms)
    [       OK ] IS_KEYMAN_INJECTED_KEY_EVENT.TheOnScreenKeyboardIsNotKeymans (0 ms)
    [       OK ] IS_KEYMAN_INJECTED_KEY_EVENT.ReInjectedUserKeystrokesAreNotKeymans (0 ms)
    [----------] 6 tests from IS_KEYMAN_INJECTED_KEY_EVENT (0 ms total)
    [----------] 2 tests from POST_KEY_EVENT_AND_DECIDE_EAT
    [       OK ] POST_KEY_EVENT_AND_DECIDE_EAT.AFailingPostPassesTheEventThroughInsteadOfEatingIt (0 ms)
    [       OK ] POST_KEY_EVENT_AND_DECIDE_EAT.NeitherHandoffFailureRouteEatsTheEvent (0 ms)
    [----------] 2 tests from POST_KEY_EVENT_AND_DECIDE_EAT (0 ms total)
    [----------] 5 tests from MODIFIER_DIAGNOSTIC
    [       OK ] MODIFIER_DIAGNOSTIC.ADroppedHoldIsNamedInTheDiagnostic (1 ms)
    [       OK ] MODIFIER_DIAGNOSTIC.AHoldTheCacheClaimsIsRestoredAndNotReported (0 ms)
    [       OK ] MODIFIER_DIAGNOSTIC.WithTheFeedOffThereIsNoDropToReport (0 ms)
    [       OK ] MODIFIER_DIAGNOSTIC.TwoHoldsLostAtOnceLookLikeADesktopSwitchAndAreReportedAsOne (0 ms)
    [       OK ] MODIFIER_DIAGNOSTIC.OneLostHoldIsTheLaunchSeedCaseAndIsNotReportedAsADesktopSwitch (0 ms)
    [----------] 5 tests from MODIFIER_DIAGNOSTIC (1 ms total)
    [----------] 7 tests from USER_HELD_SIGNAL
    [       OK ] USER_HELD_SIGNAL.AHoldOnlyTheSignalKnowsAboutIsRestored (0 ms)
    [       OK ] USER_HELD_SIGNAL.ALiveOnlyHoldIsStillNotRestored (0 ms)
    [       OK ] USER_HELD_SIGNAL.APoisonedKeyIsNotRestoredEvenThoughTheSignalSaysHeld (1 ms)
    [       OK ] USER_HELD_SIGNAL.NoSignalMeansTheCacheAloneAndNotAnEmptyOne (0 ms)
    [       OK ] USER_HELD_SIGNAL.TheMaskCoversAPressMadeOnTheSignalAlone (0 ms)
    [       OK ] USER_HELD_SIGNAL.TheStaleCacheByteIsStillClearedAndNothingIsPressed (0 ms)
    [       OK ] USER_HELD_SIGNAL.ASignalClaimNotBackedByLiveStateStillPressesAndIsCoveredByTheMask (0 ms)
    [----------] 7 tests from USER_HELD_SIGNAL (1 ms total)
    [----------] 3 tests from VERIFICATION_WITH_SIGNAL
    [       OK ] VERIFICATION_WITH_SIGNAL.ThePassDoesNotUndoAPressItMadeOnTheSignalsWord (0 ms)
    [       OK ] VERIFICATION_WITH_SIGNAL.ThePassStillCorrectsWhatNeitherTheCacheNorTheSignalClaims (0 ms)
    [       OK ] VERIFICATION_WITH_SIGNAL.APoisonedClaimDoesNotBlockACorrection (0 ms)
    [----------] 3 tests from VERIFICATION_WITH_SIGNAL (0 ms total)
    [----------] 5 tests from USER_HELD_FROM_RAW
    [       OK ] USER_HELD_FROM_RAW.DerivesChiralityFromTheExtendedFlagAndTheMakeCode (0 ms)
    [       OK ] USER_HELD_FROM_RAW.ABreakFlagIsAReleaseAndNothingOutsideTheManagedSixIsWritten (0 ms)
    [       OK ] USER_HELD_FROM_RAW.KeymansOwnEventsAreIgnoredButRdpAndOskInputIsNot (0 ms)
    [       OK ] USER_HELD_FROM_RAW.PoisonPersistsUntilAFreshObservationOfThatVeryKey (0 ms)
    [       OK ] USER_HELD_FROM_RAW.ADisplacedRegistrationPoisonsEveryKey (0 ms)
    [----------] 5 tests from USER_HELD_FROM_RAW (0 ms total)
    [----------] Global test environment tear-down
    [==========] 96 tests from 17 test cases ran. (13 ms total)
    [  PASSED  ] 96 tests.
      YOU HAVE 1 DISABLED TEST

---

## x64 — x64, Debug

    Running main() from gtest_main.cpp with memory leak detection
    [==========] Running 95 tests from 16 test cases.
    [----------] Global test environment set-up.
    [----------] 5 tests from AppContext
    [       OK ] AppContext.Get_Max_buff (0 ms)
    [       OK ] AppContext.Get_small_buff (0 ms)
    [       OK ] AppContext.Get_split_surrogate (0 ms)
    [       OK ] AppContext.BufMax_LastChar (0 ms)
    [       OK ] AppContext.AppContext_Delete (0 ms)
    [----------] 5 tests from AppContext (1 ms total)
    [----------] 1 test from KEYBOARDOPTIONS
    [       OK ] KEYBOARDOPTIONS.SetupCoreEnvironment (1 ms)
    [----------] 1 test from KEYBOARDOPTIONS (2 ms total)
    [----------] 1 test from KMPROCESSACTIONS
    [       OK ] KMPROCESSACTIONS.processUnicodeChartest (0 ms)
    [----------] 1 test from KMPROCESSACTIONS (0 ms total)
    [----------] 5 tests from KEYBD_SHIFT
    [       OK ] KEYBD_SHIFT.ResetRepressesFromCache (0 ms)
    [       OK ] KEYBD_SHIFT.ReleaseEmitsPrefixThenKeyups (0 ms)
    [       OK ] KEYBD_SHIFT.RightControlCollapsesToExtendedControl (0 ms)
    [       OK ] KEYBD_SHIFT.RightShiftCollapsesToShiftWithRightScanCode (0 ms)
    [       OK ] KEYBD_SHIFT.ModifierEventCountNeverExceedsReserve (0 ms)
    [----------] 5 tests from KEYBD_SHIFT (1 ms total)
    [----------] 5 tests from CAPTURE_LIVE_MODIFIER_STATE
    [       OK ] CAPTURE_LIVE_MODIFIER_STATE.SetsAByteForEachModifierTheOsHolds (0 ms)
    [       OK ] CAPTURE_LIVE_MODIFIER_STATE.OnlyTheSignBitCountsAsHeld (0 ms)
    [       OK ] CAPTURE_LIVE_MODIFIER_STATE.ZeroesTheWholeArrayFirst (0 ms)
    [       OK ] CAPTURE_LIVE_MODIFIER_STATE.SetsNoByteOutsideTheManagedSet (0 ms)
    [       OK ] CAPTURE_LIVE_MODIFIER_STATE.TakesExactlyOneReadingPerManagedModifier (0 ms)
    [----------] 5 tests from CAPTURE_LIVE_MODIFIER_STATE (0 ms total)
    [----------] 9 tests from RECONCILE_MODIFIER_CACHE
    [       OK ] RECONCILE_MODIFIER_CACHE.ClearsCachedModifierTheOsReportsUp (0 ms)
    [       OK ] RECONCILE_MODIFIER_CACHE.KeepsCachedModifierTheOsReportsDown (0 ms)
    [       OK ] RECONCILE_MODIFIER_CACHE.NeverSetsAModifierTheCacheDoesNotHold (0 ms)
    [       OK ] RECONCILE_MODIFIER_CACHE.ClearsAllSixSlots (1 ms)
    [       OK ] RECONCILE_MODIFIER_CACHE.LeavesNonModifierBytesAlone (0 ms)
    [       OK ] RECONCILE_MODIFIER_CACHE.ReconcileThenResetPressesNothing (0 ms)
    [       OK ] RECONCILE_MODIFIER_CACHE.ReconcileLeavesTheCacheASubsetOfLiveState (0 ms)
    [       OK ] RECONCILE_MODIFIER_CACHE.ZeroesTheWholeArrayFirst (0 ms)
    [       OK ] RECONCILE_MODIFIER_CACHE.ModifierEventCountNeverExceedsReserveForTheUnion (0 ms)
    [----------] 9 tests from RECONCILE_MODIFIER_CACHE (1 ms total)
    [----------] 21 tests from PREPARE_INJECTED_INPUT_BATCH
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.StaleCachedModifierYieldsNoKeydownInTheBatch (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.StaleRightControlYieldsNoExtendedKeydownInTheBatch (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.NoStaleSlotProducesAKeydownInTheBatch (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.EventOrderIsReleaseThenOutputThenRestore (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.NeverWritesPastTheBufferWhenTheSharedBufferOverflows (1 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.WorstCaseBatchFillsTheBufferToItsLastSlotAndNotOneFurther (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.OsHeldModifierIsReleasedBeforeTheOutputKeys (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.OsHeldModifierIsNotRestoredAfterTheOutputKeys (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.AgreementCasesAreUnchanged (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.BatchTakesOneLiveReadingPerManagedModifier (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.EveryWrapEventIsIdentifiableAsKeymanInjected (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.RestorePressedMaskIsZeroWhenNothingIsRestored (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.RestorePressedMaskNamesExactlyTheVkTheRestoreHalfPressed (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.RestorePressedMaskCoversAllSixWhenAllAreRestored (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.RestorePressedMaskExcludesAModifierTheReconcileCleared (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.RestorePressedMaskExcludesAModifierReleasedOnlyOnTheOssWord (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.CacheNotFedLeavesALiveHeldModifierUntouched (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.CacheNotFedStillReleasesAndRestoresWhatTheCacheAloneHolds (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.CacheNotFedStillReconciles (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.EachRestorePressIsLocatableInTheBufferSoAShortSendIsExact (0 ms)
    [       OK ] PREPARE_INJECTED_INPUT_BATCH.TheBatchReleaseHalfStillSendsItsPrefixForAShiftOnlyRelease (0 ms)
    [----------] 21 tests from PREPARE_INJECTED_INPUT_BATCH (2 ms total)
    [----------] 12 tests from PREPARE_MODIFIER_VERIFICATION_CORRECTION
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.CorrectsAModifierTheOsHoldsThatTheCacheSaysNobodyHolds (1 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.DoesNotTouchAVkOutsideTheRestorePressedMask (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.DoesNotCorrectWhenTheCacheStillReportsItHeld (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.DoesNotCorrectWhenTheOsAlsoReportsItUp (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.CorrectsRightControlAsExtendedControl (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.UsesThePrefixProtectionForAnIsolatedAltCorrection (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.TheCorrectionIsIdentifiableAsKeymanInjected (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.TheRightShiftCorrectionIsIdentifiableThroughDwExtraInfoAlone (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.CorrectsEveryManagedVkInTurn (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.AShiftOnlyCorrectionSendsNoPrefixKeystroke (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.AnAltCorrectionStillSendsThePrefixKeystroke (0 ms)
    [       OK ] PREPARE_MODIFIER_VERIFICATION_CORRECTION.ACorrectionContainingAnyAltSendsThePrefixKeystroke (0 ms)
    [----------] 12 tests from PREPARE_MODIFIER_VERIFICATION_CORRECTION (2 ms total)
    [----------] 4 tests from DEFECT_CHARACTERISATION_MODIFIER_CACHE_EVENT_ORDER
    [       OK ] DEFECT_CHARACTERISATION_MODIFIER_CACHE_EVENT_ORDER.KeymanOwnRestorePressOutlivesTheUsersRealRelease (0 ms)
    [       OK ] DEFECT_CHARACTERISATION_MODIFIER_CACHE_EVENT_ORDER.TheUsersReleaseArrivingLastLeavesTheCacheCorrect (0 ms)
    [       OK ] DEFECT_CHARACTERISATION_MODIFIER_CACHE_EVENT_ORDER.ABalancedBatchLeavesTheCacheUnchanged (0 ms)
    [       OK ] DEFECT_CHARACTERISATION_MODIFIER_CACHE_EVENT_ORDER.TheStaleByteSurvivesTheReconcileBecauseTheOsAgrees (0 ms)
    [----------] 4 tests from DEFECT_CHARACTERISATION_MODIFIER_CACHE_EVENT_ORDER (1 ms total)
    [----------] 4 tests from MODIFIER_CACHE_EVENT_ORDER
    [       OK ] MODIFIER_CACHE_EVENT_ORDER.TheGateLeavesTheCacheFollowingTheUserAlone (0 ms)
    [       OK ] MODIFIER_CACHE_EVENT_ORDER.TheGateCoversRightShiftThroughDwExtraInfo (0 ms)
    [       OK ] MODIFIER_CACHE_EVENT_ORDER.GenericVkEventReconcilesAgainstTheChiralLiveReading (0 ms)
    [       OK ] MODIFIER_CACHE_EVENT_ORDER.ExtendedBitChiralisesControlAndAltIntoTheSlotTheLiveReadingUses (0 ms)
    [----------] 4 tests from MODIFIER_CACHE_EVENT_ORDER (0 ms total)
    [----------] 6 tests from IS_KEYMAN_INJECTED_KEY_EVENT
    [       OK ] IS_KEYMAN_INJECTED_KEY_EVENT.TheScanFlagAloneIsEnough (0 ms)
    [       OK ] IS_KEYMAN_INJECTED_KEY_EVENT.TheWrapTagAloneIsEnough (0 ms)
    [       OK ] IS_KEYMAN_INJECTED_KEY_EVENT.PhysicalKeystrokesAreNotKeymans (0 ms)
    [       OK ] IS_KEYMAN_INJECTED_KEY_EVENT.RemoteDesktopInputIsNotKeymans (0 ms)
    [       OK ] IS_KEYMAN_INJECTED_KEY_EVENT.TheOnScreenKeyboardIsNotKeymans (0 ms)
    [       OK ] IS_KEYMAN_INJECTED_KEY_EVENT.ReInjectedUserKeystrokesAreNotKeymans (0 ms)
    [----------] 6 tests from IS_KEYMAN_INJECTED_KEY_EVENT (1 ms total)
    [----------] 2 tests from POST_KEY_EVENT_AND_DECIDE_EAT
    [       OK ] POST_KEY_EVENT_AND_DECIDE_EAT.AFailingPostPassesTheEventThroughInsteadOfEatingIt (0 ms)
    [       OK ] POST_KEY_EVENT_AND_DECIDE_EAT.NeitherHandoffFailureRouteEatsTheEvent (0 ms)
    [----------] 2 tests from POST_KEY_EVENT_AND_DECIDE_EAT (0 ms total)
    [----------] 5 tests from MODIFIER_DIAGNOSTIC
    [       OK ] MODIFIER_DIAGNOSTIC.ADroppedHoldIsNamedInTheDiagnostic (0 ms)
    [       OK ] MODIFIER_DIAGNOSTIC.AHoldTheCacheClaimsIsRestoredAndNotReported (0 ms)
    [       OK ] MODIFIER_DIAGNOSTIC.WithTheFeedOffThereIsNoDropToReport (0 ms)
    [       OK ] MODIFIER_DIAGNOSTIC.TwoHoldsLostAtOnceLookLikeADesktopSwitchAndAreReportedAsOne (0 ms)
    [       OK ] MODIFIER_DIAGNOSTIC.OneLostHoldIsTheLaunchSeedCaseAndIsNotReportedAsADesktopSwitch (0 ms)
    [----------] 5 tests from MODIFIER_DIAGNOSTIC (0 ms total)
    [----------] 7 tests from USER_HELD_SIGNAL
    [       OK ] USER_HELD_SIGNAL.AHoldOnlyTheSignalKnowsAboutIsRestored (1 ms)
    [       OK ] USER_HELD_SIGNAL.ALiveOnlyHoldIsStillNotRestored (0 ms)
    [       OK ] USER_HELD_SIGNAL.APoisonedKeyIsNotRestoredEvenThoughTheSignalSaysHeld (0 ms)
    [       OK ] USER_HELD_SIGNAL.NoSignalMeansTheCacheAloneAndNotAnEmptyOne (0 ms)
    [       OK ] USER_HELD_SIGNAL.TheMaskCoversAPressMadeOnTheSignalAlone (0 ms)
    [       OK ] USER_HELD_SIGNAL.TheStaleCacheByteIsStillClearedAndNothingIsPressed (0 ms)
    [       OK ] USER_HELD_SIGNAL.ASignalClaimNotBackedByLiveStateStillPressesAndIsCoveredByTheMask (0 ms)
    [----------] 7 tests from USER_HELD_SIGNAL (1 ms total)
    [----------] 3 tests from VERIFICATION_WITH_SIGNAL
    [       OK ] VERIFICATION_WITH_SIGNAL.ThePassDoesNotUndoAPressItMadeOnTheSignalsWord (0 ms)
    [       OK ] VERIFICATION_WITH_SIGNAL.ThePassStillCorrectsWhatNeitherTheCacheNorTheSignalClaims (0 ms)
    [       OK ] VERIFICATION_WITH_SIGNAL.APoisonedClaimDoesNotBlockACorrection (0 ms)
    [----------] 3 tests from VERIFICATION_WITH_SIGNAL (0 ms total)
    [----------] 5 tests from USER_HELD_FROM_RAW
    [       OK ] USER_HELD_FROM_RAW.DerivesChiralityFromTheExtendedFlagAndTheMakeCode (0 ms)
    [       OK ] USER_HELD_FROM_RAW.ABreakFlagIsAReleaseAndNothingOutsideTheManagedSixIsWritten (0 ms)
    [       OK ] USER_HELD_FROM_RAW.KeymansOwnEventsAreIgnoredButRdpAndOskInputIsNot (0 ms)
    [       OK ] USER_HELD_FROM_RAW.PoisonPersistsUntilAFreshObservationOfThatVeryKey (0 ms)
    [       OK ] USER_HELD_FROM_RAW.ADisplacedRegistrationPoisonsEveryKey (0 ms)
    [----------] 5 tests from USER_HELD_FROM_RAW (0 ms total)
    [----------] Global test environment tear-down
    [==========] 95 tests from 16 test cases ran. (14 ms total)
    [  PASSED  ] 95 tests.
      YOU HAVE 1 DISABLED TEST
