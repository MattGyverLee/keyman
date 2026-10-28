# Hand-test checklist for Matthew — fixed build (signed dev 20.0.9.0, merge2 3a514d526a)

Installed now: the **fixed** build (keyman.exe uiAccess="true", test-signed, running non-elevated).
Keyboards: Cameroon QWERTY on bkc-Latn-CM, Bafut, akan, and k_0301 on en-US. Record every case as
PASS / FAIL / BLOCKED (reason) / UNVERIFIED, with the time. Paste the oracle log lines.

## Before you start
1. Start the oracle in its own PowerShell window and leave it running:
   `powershell -ExecutionPolicy Bypass -File "C:\Github\keyman-test-merge2\windows\src\test\manual-tests\GH-16462 - osk-sticky-modifier\watch-modifiers.ps1" -Minutes 60`
   It logs to `osk-watch.txt` in the same folder.
2. **Calibrate:** press and release physical Left Shift. You should see `HELD: SHIFT,LSHIFT`, then `ALL CLEAR`.
3. fakefreeze (for C.13-3): `C:\Github\keyman-test-8064\windows\src\support\fakefreeze\bin\Win32\Debug\fakefreeze.exe`
   (one run is one stall, past LowLevelHooksTimeout).
4. If anything wedges, recover with a plain modifier KEYUP (8064 README, "Recovery"), or ask me to restart Keyman.

## C.13 — #16490 hand tests (User Testing section)
- [ ] **TEST_MODIFIERS_BASELINE**, Cameroon QWERTY in Notepad: try each hardware modifier in turn (L/R Shift,
      L/R Ctrl, L/R Alt, AltGr) with a letter. The output must be correct, and releasing must return to
      unmodified typing. The oracle must end each one at `ALL CLEAR`.   Result: ____
- [ ] **TEST_MODIFIER_HELD_BEFORE_KEYMAN_STARTS**: exit Keyman. Hold **Left Ctrl**, start Keyman (Start menu),
      and release Ctrl before typing. The first output must be unmodified.   Result: ____
- [ ] **TEST_NO_LOST_KEYSTROKES**: in Notepad with Cameroon QWERTY, type `qwertyuiop` ten times on one line
      (100 characters). During it, run fakefreeze.exe at least 3 times (from a second window or a
      shortcut). Then count: the line must be exactly `qwertyuiop` x10, with nothing missing, doubled or
      capitalised. Paste the line here, or save it as `results-2026-10-28/logs/fixed-C13-nolost.txt`.   Result: ____

## C.14 / C.15 — #16527 OSK tests (README "GH-16462 - osk-sticky-modifier")
Preconditions for each: a Keyman keyboard active, the OSK visible (Keyman menu → On Screen Keyboard),
the oracle at `ALL CLEAR`. For the chiral cases use Cameroon QWERTY (it has separate L Ctrl / R Ctrl on the OSK).
- [ ] **TEST_OSK-1, every dismissal path:** latch `Ctrl` on the OSK (the oracle shows `HELD: CTRL,…`), then
      dismiss by: (a) the tray menu, (b) a tray icon double-click, (c) the Keyman hotkey, (d) switching to the
      Character Map tab, (e) exiting Keyman. Each must end at `ALL CLEAR`.
      a ____ b ____ c ____ d ____ e ____
- [ ] **TEST_OSK-2, chiral release:** latch `R Ctrl` (`HELD: CTRL,RCTRL`). Switch to k_0301, then back to
      Cameroon. Click `Ctrl` on the OSK to unlatch it. It must end at `ALL CLEAR` (not stuck at `RCTRL`).   Result: ____
- [ ] **TEST_OSK-3, teardown never presses:** needs a `{$DEFINE KLOGGING}` keyman.exe build to capture the
      events. **Not runnable on this build. Tell me if you want me to make a KLOGGING build.**   Result: BLOCKED (needs KLOGGING build)
- [ ] **TEST_OSK-4, user-held Shift survives teardown:** pre-type a message first. Hold physical **Left Shift**
      throughout. Latch `R Ctrl` (`HELD: SHIFT,CTRL,LSHIFT,RCTRL`), then dismiss the OSK **with the mouse**,
      still holding Shift. You must see `HELD: SHIFT,LSHIFT` (Ctrl released, Shift kept), and `ALL CLEAR`
      only when you let go.   Result: ____
- [ ] **TEST_OSK-5, Keyman's injected Right Shift is not "user-held":** latch `Shift` on the OSK, type several
      characters through Cameroon QWERTY (so the engine injects output), then dismiss the OSK. It must end at
      `ALL CLEAR`. **This is the case that only counts on the stacked tip, which this build is.**   Result: ____
- [ ] **TEST_OSK-6, a user-held Shift survives an OSK character click:** hold physical Left Shift
      (`HELD: SHIFT,LSHIFT`), leave the OSK's Shift unlatched, click a character key on the OSK, and keep
      holding for a few seconds. You must see a momentary `ALL CLEAR`, then `HELD: SHIFT,LSHIFT` again.
      Hardware typing must stay capitals until you let go.   Result: ____
- [ ] **TEST_RELEASE_MODIFIERS_OPTION** (Keyman Configuration → Options, release modifiers on OSK close, if
      present): repeat OSK-1 (a) with the option on, then off. Record what each setting does.   Result: ____
- [ ] **C.15 oracle record:** keep the `osk-watch.txt` transitions for all of the above. Don't summarise as
      "looked right".

## B.8 — version-guarded workarounds on Delphi 12 (see b8-hand-tests.md for full steps)
- [ ] **T1 Character Map bottom-row click** in keyman.exe and TIKE (TIKE once it is built): a click on a
      partly visible bottom row selects it without scrolling, and holding the button does no timer scroll.   keyman ____ TIKE ____
- [ ] **T2 non-ASCII URLs:** a TIKE project in `C:\Temp\b8-ŋgɔ̀m-тест\`, with a file named `ŋkɔ̀.kmn`. The Project
      page renders and opens the file. For kmshell, BLOCKED if no package with a non-ASCII path is available.   TIKE ____ kmshell ____
