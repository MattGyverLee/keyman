# fix(windows): stop the serializer stranding a modifier key (#8064)

Fixes: #8064
Related: #16462

Closes [#8064](https://github.com/keymanapp/keyman/issues/8064), *bug(windows): modifier key occasionally is "stuck on"*. That report is entirely about physical typing (Stuck keys on OSK are in https://github.com/keymanapp/keyman/issues/16462). Its simplest reproduction is a hardware Right Shift released a few milliseconds late. Scope of this close: physical typing as reported. Remote Desktop, secure desktop, higher-integrity focus and ARM64 are follow-ons, not claimed here (see 'Carried forward as unverified' below and the team testing plan linked at the end of this body).

## Why I'm interested in this #8064 bug

I've been chasing a reproduction for this issue for years since I experienced it the first time. At a FLEx Parsing workshop in Kenya this month, this bug was affecting nearly every Keyman user several times a day. Some had figured out that a reboot would fix it (even 2-3 times per day). A few knew that some modifier key was "stuck" and would go hunting for it. Some would just only use Keyman in Notepad where the bug seemed to happen less, then copy/paste. I suppose that some of the seeming uptick in cases was related to old machines working hard to parse.

From my previous interaction with this bug, I knew that it was difficult/impossible to reproduce on virtual machines. And, since logging produces a LOT of data (and slows down even a fast machine), one was unlikely to leave logging on while "waiting" for the bug to happen. Instead, the last day of the workshop, I set Claude to experimentally write a script that could force the bug 10/10 (a more robust version of this is `windows\src\test\manual-tests\GH-8064 - stuck-modifier-phantom-keydown\stuck-mod-test.ps1`).

With a repro in hand, I needed to decide whether to hand that off to Ross and Marc or try to tackle/trace it myself. Marc mentioned that Ross was continuing to research #8064. Since this bug keeps coming back, and with time-zone challenges, I decided to try to resolve it myself with AI from a clean slate, looking at only what was in the repo and what I could generate myself. After this PR is in draft, I do want to read Ross's research to see if this solution is complete and follows his line of reasoning/design, and this code can be refactored if it isn't in line with established directions.

## What #8064 is

A modifier key gets stuck down **machine-wide**. Not a Keyman typing glitch: every application on the machine behaves as though Ctrl, Alt or Shift were held, on every keyboard layout (MS or Keyman), until the exact matching KEYUP arrives. Tapping the physical key that is virtually stuck usually clears the issue, which is why the bug appears to "fix itself" and why it has been so hard to catch in the act. The most troublesome case is a stuck virtual RCTRL on hardware with no physical Right Ctrl key and only a restart clears it. Even in cases where the user CAN clear the stuck key, Keyman should automagically detect and clear it within one keypress or less. The biggest "over-fix" risk is accidentally clearing a physically-held key.

## Notes from Matthew:

- If a review finds KEYMAN_OSK_MODIFIER_FLAG_KEYMAN_INJECTED is incomplete, that is correct as it is exercised by the sister PR https://github.com/keymanapp/keyman/pull/16527.
- Please, if something seems strange, contradictory, counterproductive, or outright wrong, please let me know and I will examine it more closely. I don't want to waste your time on rabbit trails.
- Where the branch describes existing engine behaviour, it is reporting what we read in the source, not a verdict — if any of it is wrong or missing context you have, I'd rather hear it than have it stand.
- The evidence logs have been moved to the evidence branch linked at the end of this body (they can be recreated if needed), and much of the GH8064 folder's evidence/draft material has been removed from this PR's diff; the rerunnable scripts and READMEs stay.
- I'll wait to see how this review goes before filing the related issues.

## Caches

`SerialKeyEventServer` keeps its own copy of the modifier state, getting its initial status from the OS via `initThread` and fed updates via the low-level keyboard hook. When the machine slows down, Windows removes and reinstalls our hook (missing Keyman inputs), so the OS genuinely thinks the key is stuck.
The issue cannot be triggered on a MS keyboard, and `UpdateLocalModifierState` only runs when KM is active, so any non-manual fix needs to happen while Keyman is active.
The OS wins on releasing, the cache wins on restoring, and the OS no longer knows whether a key is stuck or being held.

Sometimes keys that are genuinely held are programmatically released and retriggered during a batch of processing. `serialkeyeventserver.cpp:872` tells of temporarily releasing a user-held CTRL so that Keyman can rewrite preceding context without deleting whole words. There are now two populations of "Ctrl is down" in the system — ones a human caused, and ones Keyman caused — and Windows cannot tell you which is which.

This fix considers fixes already in place and tackles user and automatic keypresses creating the "stuck" situation and provides some remediation when it happens.

## Running the regression gate

`windows/src/test/manual-tests/GH-8064 - stuck-modifier-phantom-keydown/stuck-mod-test.ps1 -Gate` is a three-arm controlled test: it holds the stimulus constant and varies only the active keyboard, so a wedge on the Keyman arm that does not appear on the Microsoft arms points at Keyman rather than at the layout, Windows, or the harness. It exits 0 PASS, 1 FAIL, 2 INCONCLUSIVE, 3 setup error, and is expected to FAIL on a released build and PASS on the complete branch.

It needs the `sil_cameroon_qwerty` keyboard and any Microsoft English QWERTY installed, an interactive desktop, and a running `keyman.exe`. It injects real keystrokes into Notepad, so the machine must be left alone while it runs.

## Outline of the fix by commit

| Commit | Origin of the divergence |
|---|---|
| `3e82082` adds a manual powershell script that can be run on a "vanilla" Keyman to show that the bug (in at least one vector) is open or closed.| Show the bug is still there and trigger it on command, show when it is closed.|
| `4ffc285` adds targeted logging for this bug needed to track down where it leads| difficult logging |
| `588ae12` keeps Keyman's injected modifiers out of the cache | Keyman poisoning its own record |
| `baa6473` passes a key event through when handoff fails | Keyman destroying the user's KEYUP itself |
| `06459c7` verifies modifier state after an injected batch and outputs a keyup for any "open" modifier not currently being held | catching the manufactured press right after making it |
| `47e960a` tracks and distinguishes user-held modifiers from generated input | the outside witness |

Initially, anecdotally, I thought the issue had become more pronounced after 18.0.240, but now I think the user's computers were just working harder later in the week and producing more stalls.

I have compiled and installed local versions of the DLLs for manual and automated testing on my local machine. I can confirm that the observed bugs go away, and the fixes are intended to be as un-intrusive as possible, but in absence of any old failing tests, I can't prove for sure that these changes haven't introduced any new weirdness. There is a new battery of tests (mostly `keybd_shift.interactive.tests.cpp`) intended to make sure that any progress made here doesn't get accidentally undone.

## What has changed (written by Claude)

- **The cache is reconciled against live state before every batch.** `ReconcileModifierCache` clears any cached byte the OS reports up. It clears and never sets: live state cannot tell the user's finger from Keyman's own press one message ago, so setting from it would manufacture the very unmatched press this work exists to remove.
- **The release half releases the union of cache-held and OS-held modifiers.** Clearing alone would let a modifier the OS holds but the cache never recorded survive into the batch's own output keys.
- **Keyman's own injected modifiers no longer feed the cache.** They are tagged with `EXTRAINFO_FLAG_KEYMAN_MODIFIER_WRAP` at injection and filtered at the hook. `dwExtraInfo` and not a scan code, because `do_keybd_event` rewrites an injected Right Shift's scan code to `SCANCODE_RSHIFT`, making it byte-identical at the hook to a physical one.
- **The low level hook now confirms the handoff before eating a key event.** It previously returned 1 unconditionally, without reading `PostMessage`'s result, and took the server window straight from `GetServer()` without a null check. As far as we can tell that means a failed or misrouted handoff destroys the keystroke, and for a modifier KEYUP that is #8064 arriving from a second direction.
- **A post-batch verification pass** catches a release that raced a batch in flight, and releases only modifiers named in that batch's own restore mask. It is posted rather than run inline, so the hook's earlier posts have reached the cache by the time it reads it.
- **A user-held signal fed from `WM_INPUT`** on the serializer's own thread lets a hold the cache never saw be restored. It reports *unknown* rather than stale, is not authoritative alone, and widens what the cache justifies without vetoing it.
- **Tests.** `keybd_shift.tests.cpp` on the default target, and a separate opt-in `test-interactive` action for four probes that inject real keyboard input, which CI cannot observe, so on CI they could only have reported PASSED without asserting anything.

## Evidence, tiered (written by Claude)

**Measured end to end.** The defect reproduced and fixed on the same machine with one variable changed: `host32.exe --probe 1x2x3x --iterations 5`, Left Shift held and released 1500 ms into a five second stall, Windows 11 Pro 26200. Shipped engine **5 of 5 wedged**; fixed engine **0 of 5**. All preconditions confirmed on every iteration. The fixed half of that pair is recorded in the evidence archive as [host32-fixed-19.0.277.txt](https://github.com/MattGyverLee/keyman/blob/evidence/8064-16462/keyman-evidence/16490-GH-8064/manual-tests-GH-8064/evidence/host32-fixed-19.0.277.txt); the stock half was observed at the time but its log is not in the tree. The recorded stock evidence is a different route to the same wedge -- the three-arm gate ([gate-fail-stock-19.0.276.txt](https://github.com/MattGyverLee/keyman/blob/evidence/8064-16462/keyman-evidence/16490-GH-8064/manual-tests-GH-8064/evidence/gate-fail-stock-19.0.276.txt), OVERALL: FAIL) plus the sweep and switch-stress `*-stock-19.0.276` sets in the same evidence archive folder. The rerunnable scripts themselves stay in this PR under `windows/src/test/manual-tests/GH-8064 - stuck-modifier-phantom-keydown/`.

**Measured, separately.** That `WM_INPUT` reaches a message-only window on a worker thread while the process is unfocused (164 records) and while the main thread is stalled (42 records during an 8000 ms block, with `fakefreeze` holding `keyman.exe` too), and that the Keyman tag survives `SendInput` to raw input in both the `0xFF` and the `SCANCODE_RSHIFT` shapes. That is the only evidence the user-held signal rests on, and it is in the evidence archive as [rawinput-delivery.md](https://github.com/MattGyverLee/keyman/blob/evidence/8064-16462/keyman-evidence/16490-GH-8064/manual-tests-GH-8064/evidence/rawinput-delivery.md).

**Carried forward as unverified, with reasons.** Not dropped silently:
- **Mac, Linux, Android, iOS** I haven't tested any OS but Windows, but #8064 is only tagged as a Windows bug.
- **ARM64.** No build agent, in line with #15065; the `test` and `test-interactive`
  actions have no arm64 leg for that reason.
- **The physical-keystroke column baseline** of the raw-input probe. No physical
  keystroke arrived inside the wait window on the decisive capture, and the row is
  left blank rather than inferred. 206 physical-key records in the delivery legs
  stand in for delivery; the classification side is pinned in the suite.
- **The RDP, OSK, higher-integrity-focus and secure-desktop legs** of that probe.
  Not run. Each population is pinned in the unit suite, and the policy is tag
  equality rather than an `hDevice` or injected-versus-physical filter — so there
  is no RDP-specific code path to get wrong — but these are unverified, not
  satisfied. `TEST_REMOTE_DESKTOP` below exists because of this.

# User Testing (Mixed Claude and Matthew)

**Timing-critical steps are cited to a script rather than described by hand.** Holding a modifier, firing a five second stall and releasing inside it is hard to perform reliably by hand, and mistiming produces no stuck modifier, which reads as a pass. So those steps are left to the script.

TEST_MODIFIERS_BASELINE: Select a Keyman keyboard with rules that transform modified keystrokes. Hold each modifier in turn on the hardware keyboard — Left Shift, Right Shift, Left Ctrl, Right Ctrl, Left Alt, Right Alt — and type a character the keyboard transforms. Verify the modified output is correct in every case, and that releasing the modifier returns to unmodified output. This passes on a released build and must still pass here.

TEST_STUCK_MODIFIER_GATE: Run `windows/src/test/manual-tests/GH-8064 - stuck-modifier-phantom-keydown/stuck-mod-test.ps1 -Gate`. This is the primary regression check. It applies one stimulus — a five second Keyman freeze crossed with a modifier release — identically across three arms, varying only the active keyboard, so a wedge on the Keyman arm that does not appear on the two Microsoft arms points at Keyman rather than at the layout, Windows, or the harness. Exit codes are 0 PASS, 1 FAIL, 2 INCONCLUSIVE, 3 setup error. Expect FAIL on a released build and PASS on this branch. INCONCLUSIVE is never a pass: it means a precondition was unmet and the report names which. It needs the `sil_cameroon_qwerty` keyboard and any Microsoft English QWERTY installed, an interactive desktop, and a running `keyman.exe`, and it injects real keystrokes into Notepad, so leave the machine alone while it runs.

TEST_STUCK_MODIFIER_REPRO: Follow README.md in `windows/src/test/manual-tests/GH-8064 - stuck-modifier-phantom-keydown/` to build `fakefreeze` and run `run-8064-test.ps1`. It holds a modifier, stalls Keyman past `LowLevelHooksTimeout` so Windows drops the hook, releases the modifier during the stall, then makes Keyman produce output. On a released build it reports FAIL on all five iterations with the modifier still reading down after the run; with this change it reports PASS on all five. INCONCLUSIVE means the preconditions were not met and is not a pass — the script says which one.

TEST_MODIFIER_HELD_BEFORE_KEYMAN_STARTS: Exit Keyman. Hold Left Ctrl down, and while still holding it start Keyman, then release Left Ctrl before typing anything. Select a Keyman keyboard and type a character the keyboard transforms. On a released build the modifier state Keyman captured at startup is now stale and the first injected output can carry a phantom Ctrl. With this change the output is unmodified and correct. Safe to perform by hand: there is no sub-second window, and getting the order wrong is visible rather than silent.

TEST_NO_LOST_KEYSTROKES: With a Keyman keyboard selected, type the same ten character sequence ten times — a fixed, known string, not free text — while triggering repeated `fakefreeze` stalls, then verify the result is exactly one hundred characters with the sequence unbroken. The fixed string matters, because "type continuously and check nothing was lost" has no oracle: during a stall the tester has no record of what they intended to type. Output may arrive late or out of order during a stall; every keystroke must still appear. This exercises the change that stops the low level hook suppressing a key event before it has confirmed the handoff. No script covers this case yet, and one that types a known string and diffs the result would be stronger than the procedure above.

TEST_REMOTE_DESKTOP: Connect to the machine over Remote Desktop, select a Keyman keyboard and type, using modifiers. Verify that typing and modified output work normally. Remote Desktop stamps its own marker on genuine user input, and this change reads that field to tell Keyman's own injected events from the user's, so this confirms real remote input is not misread as Keyman's own.

---

## Testing plan — November revisit (added 2026-10-27, PR still closed)

Team testing plan for this stack, stored on the author's fork (not a fork issue, not part of the PR diff):
https://github.com/MattGyverLee/keyman/blob/evidence/8064-16462/keyman-evidence/team-testing-plan-2026-10-27.md

It covers the Delphi stack (#16043/#16044/#16191) and the 8064 stack (#16490/#16527): what changed since September, what the author will test on his own machine, what only the team can test (CI/manual build/user tests, Delphi licence decision, vendored patches), an honest proven/unverified table, and the still-open list. Evidence logs and drafts are on the same branch, indexed at:
https://github.com/MattGyverLee/keyman/blob/evidence/8064-16462/keyman-evidence/README.md

This link was added while the PR is closed; it does not reopen the PR, request review, or change the PR's code.
