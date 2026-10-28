# Keyman team — testing plan for the November revisit

**Location: this plan is stored on the evidence branch
`evidence/8064-16462` in MattGyverLee/keyman, at
`keyman-evidence/team-testing-plan-2026-10-27.md`, so it
is there even if the team picks the work up without
talking to Matthew first. The link to it from the PR
bodies is to be added at reopen, not before.**

**Status of this document: PREPARED, NOT POSTED.**
It is a reopen packet for Matthew to hand over when the team
signals bandwidth in November. Nothing in it has been posted
to keymanapp/keyman, no PR has been reopened, no comment has
been added, and no new PR has been opened. The five PRs below
are still closed, exactly as they were on 2026-09-04.

This plan is written as an ambassador's brief, not a sales
pitch. It tries to present Matthew's work in the form a small
artisan team can actually own: one job per PR, evidence first,
no speculative patches, proof that travels beyond one machine,
and every unverified leg labelled as unverified, with an
owner, rather than smoothed over.

## 1. What is being asked, in one paragraph per stack

### Delphi stack — #16043, #16044, #16191 (in that order, stacked)

#16043 is Delphi 11/12 source compatibility only: the
conditional forms that let the still-Delphi parts compile
under Delphi 11 and 12, plus three vendored patches that
each avoid a specific build crash (JCL, JVCL, mbcolor).
#16044, rebased onto #16043, is the Delphi 12 Community
Edition interactive build workflow plus a trimmed CE guide.
#16191, rebased onto #16044, is only the CE guard — about
28 lines in `resources/build/win/environment.inc.sh` — that
fails loudly when the CE variables are not set on a CE
machine, instead of letting the build fail later on a
missing file.

What changed since September: the three PRs are now a true
GitHub stack. As filed, all three were based on master, so
their diffs re-contained earlier work and #16191's compat
copies were divergent from #16043's final forms. That has
been fixed by rebasing, not by rewriting the work: #16043
onto upstream/master fcc0bd369d (tip 582a4dae73), #16044
onto #16043 (631327a507), #16191 onto #16044 (08278bd64a).
Four old #16191 docs commits (registry / DELPHIINCLUDES
correction, SETX style, cert setup, build-order table)
were dropped as superseded by #16044's guide; whether any
of that material needs porting back is an open question
for Matthew, listed in §6, not a decision made here.

The default path is untouched: with `KEYMAN_DELPHI_VERSION`
and `KEYMAN_DELPHI_CE` unset, the build takes the old
Delphi 10.3 Pro path, and CI — which runs only Delphi
10.3 Pro with both variables unset — covers none of the
new paths. That is stated plainly, not as a criticism:
it means the new paths need a human build, not a CI lane.

### 8064 stack — #16490, then #16527, never the reverse

#16490 fixes #8064, "modifier key occasionally is 'stuck
on'", for physical typing as reported. The defect: the
serializer's modifier cache is seeded once and then fed
only by the low-level hook; Windows drops a hook that
stalls past `LowLevelHooksTimeout`, a modifier KEYUP can
be lost, and nothing re-derives the cache, so the modifier
stays asserted machine-wide. The fix reconciles the cache
against live state and never sets it from a stale byte.
#16527, stacked on #16490, fixes #16462, the OSK half:
closing or navigating the OSK strands a sticky modifier,
because the OSK holds a modifier with a real chiral
`keybd_event` KEYDOWN and no matching KEYUP queued
anywhere, and teardown paths missed the cleanup or sent
it for the wrong chiral key.

Stack order is structural now, not just documented: #16527
redeclares `KEYMAN_OSK_MODIFIER_FLAG_KEYMAN_INJECTED` as a
Delphi literal for a flag only #16490 ever sets. Landed
alone, #16527 compiles clean and behaves worse. It must
not land before #16490.

What changed since September: both PRs were still drafts
at close, with no review comments, and both have been
rebased onto upstream/master fcc0bd369d (#16490 tip
a31a675567, #16527 tip 90329530cc, after the evidence
move described in §2). Production code is unchanged by
the evidence move. The two speculative patches the team
objected to in July — JCL `JclSynch.pas` ("total
nonsense") and JVCL `OldCreateOrder` ("wrong according
to the documentation") — were already reverted by Matthew
before close and are not in the restacked diffs. The
remaining vendored patches are the crash-driven ones,
each removal-tested; whether they are the most minimal
fix is still an open question, stated as such in §4.

### The other two closed PRs — not in this packet

#15324 (web subkey realignment) and #13678 (Android
height) are not part of this testing plan. #13678 is
already superseded (#13635, merged in #13712) and should
not be re-shipped. #15324 needs its own decision; it is
not bundled here, because bundling is exactly what this
packet is trying to avoid.

## 2. What was cleaned up before you are asked to look again

- **Restack, done and pushed to Matthew's fork only.**
  All five branches are on MattGyverLee/keyman, with
  lease, bottom-to-top. No PR was reopened, no comment
  was added, no new PR was opened. A verified backup
  bundle of the pre-restack heads exists and is held by
  Matthew, so nothing is lost by the rebase.
- **Evidence moved out of the PRs, preserved elsewhere.**
  The ~2,900 lines of evidence logs, TRIAGE.md, issue
  drafts and PR-text drafts that were in the PR diffs
  are now on a separate branch in Matthew's fork,
  `evidence/8064-16462` (tip b12192d0ff), indexed at
  `keyman-evidence/README.md` on that branch. Each PR's
  manual-test folder now holds only a pointer
  (`evidence/README.md`) and links to the archive.
  Rerunnable scripts, probe tools, automated tests and
  manual-test READMEs stayed in the PRs. This is the
  direct response to the review cost of the September
  diffs: the trail is still there, but it is no longer
  something a reviewer has to read as if it were code.
- **Tool READMEs added, for the tools that lacked them.**
  `host32/README.md` (the self-driving 32-bit repro host,
  and rawinput-probe as a measurement only, not a fix)
  and `windows/src/support/fakefreeze/README.md`
  (the 5-second pause that makes Windows drop the hook).
  The other tools already had folder READMEs or thorough
  script headers, so no README was duplicated for them.
- **Not done, and not claimed as done.** The CE prompt's
  silent-success behaviour, the silent 248-key batch
  truncation diagnostic, a vendor `PATCHES.md` with
  provenance per patch, PR body rewrites, and the
  follow-on issue filings are all still open. They are
  listed in §6 as work remaining, not hidden behind
  the restack.

## 3. What Matthew has done, and what he will do before reopen

Matthew's own test list is a separate document, held by
him, for his Windows / Delphi 12 CE machine. In brief,
before reopen he will run, and record by date, branch,
head SHA and machine:

- Full CLEAR rebuilds (never incremental) of each stack
  tip in order, plus a per-layer diff check.
- Delphi 12 CE: full clear rebuild including Tike.exe on
  the #16191 tip; the CE guard in both directions
  (unset → loud abort, set → IDE prompt naming the
  `.dproj`); the merged-helper behaviours from the
  #16191 rebase conflict (fresh output skips, stale
  output prompts, unset dies loudly); vendored-patch
  removal tests one at a time on the #16043 tip.
- 8064: the keybd_shift automated suite (including
  reconciling the old 95 vs 96 x64/x86 count), the opt-in
  interactive probes, the three-arm gate
  (`stuck-mod-test.ps1 -Gate`, expecting FAIL on stock
  and PASS on #16490), the hand tests
  (`TEST_MODIFIERS_BASELINE`,
  `TEST_MODIFIER_HELD_BEFORE_KEYMAN_STARTS`,
  `TEST_NO_LOST_KEYSTROKES` with a fixed 100-character
  string), and all OSK tests on the stacked #16527 tip,
  including the trap case `TEST_OSK_RIGHT_SHIFT_STICKY`.

Results will be reported as PASS, FAIL, or BLOCKED with
a reason. INCONCLUSIVE is never a pass, and a test not
run is UNVERIFIED, not "works". The evidence archive
contains the old stock-vs-fixed logs (19.0.276 / 19.0.277);
those are history for one machine, not proof for the new
SHAs, and Matthew's new runs are what count.

## 4. What only the team can do — the ask, in small pieces

Each item below is a separate, ownable job. None of them
requires accepting the whole stack first.

### A. Review the serializer fix on its own terms (#16490)

- Files: `windows/src/engine/keyman32/` — the serializer
  cache reconciliation, the user-held signal, and the
  batch handling, plus `keybd_shift.tests.cpp` and
  `keybd_shift.interactive.tests.cpp`.
- Questions the review should answer: is the reconcile
  direction safe (does it ever manufacture a press, or
  only drop a hold)? Is the user-held signal enforced by
  construction, or only by discipline (today: discipline,
  not construction — the `held & ~unknown` invariant and
  a drain accessor are not enforced, and that is a
  known Should-fix, not a hidden one)? What happens to
  a batch longer than 248 output keys (today: silent
  truncation, no diagnostic — also a known Should-fix)?
- The unit tests construct a stale cache in code. They
  pin batch shape and the reconcile rule, but they
  cannot prove real-machine staleness. That proof is
  the manual gate in §3, not the unit suite, and it
  should be judged as such.

### B. Run what Matthew cannot see: CI, manual build, user tests

- **CI / TeamCity.** Matthew has no TeamCity access and
  no visibility into the team's CI or user-testing
  schedule. He can state "local build passes at SHA X
  with command Y"; he cannot state a CI result. The
  team is asked to run the PRs through its normal CI
  and manual build, and to report the result — or, if
  external-repo PRs are not auto-built, to say so, so
  the gate is not mistaken for a pass.
- **User tests.** The PRs carry `# User Testing` sections
  with `TEST_` IDs. At close, all of them were open —
  open means unreported, not failed, in the team's
  system. The team is asked to assign testers and
  machines for: the three 8064 hand tests in §3, the
  OSK tests on #16527 (including teardown paths: tray
  menu, tray double-click, hotkey, exiting Keyman — not
  just the OSK close button), and, if a tester has the
  setup, `TEST_REMOTE_DESKTOP`. If no tester has it,
  that test stays BLOCKED, with the team as owner.
- **A manual build on a team machine.** Matthew's proof
  is one machine. A second machine — ideally one that
  is not a long-lived development machine with non-default
  flags — is the single most valuable additional data
  point, for both stacks. It also adjudicates the one
  disputed fact in the Delphi stack: whether the
  vendored patches reproduce on a clean environment
  (see §4D).

### C. Decide the Delphi licence question, before reviewing the code

As of 2026-10-27, no one on the team has access to a
Delphi 12 or 13 paid licence, and Matthew can test only
Delphi 12 CE. That makes "verified on Pro" an incoherent
bar for these PRs. The team is asked to choose, explicitly,
one of:

1. **CE-only, opt-in, Pro labelled unverified.** The
   gating already does this: the new variables are unset
   by default, the default path is untouched, and the CE
   workflow is opt-in. Pro, Delphi 13, Delphi 10
   regression and CE on Linux would then be labelled
   UNVERIFIED in the PR bodies, not claimed.
2. **Acquire a licence, then verify Pro.** In that case
   the Pro and Delphi 10 regression tests become real
   team jobs, and the PRs should wait for them.

Either answer is coherent. What is not coherent is to
hold the PRs to a Pro bar nobody can run, or to merge
them while implying Pro was verified. Matthew has stated
the CE-only limitation in the docs; the team is asked to
confirm which bar it is actually applying.

### D. Review the vendored patches patch by patch (#16043)

Each remaining patch should be judged on its own trigger,
not as a group:

- What specific build crash does it avoid, and on which
  Delphi version?
- Does removal on a clean(ish) machine reproduce that
  crash? Matthew removal-tested each on his machine and
  the build still breaks; the team's clean-machine build
  in §4B is the independent check.
- Is there an upstream reference for a similar change?
  Matthew's claim is that most patches follow upstream
  code that made similar changes; the review should
  verify that claim patch by patch, and any patch that
  fails it goes back on the speculative list — as the
  two July patches already did.
- Will the patch be lost on the next upstream refresh
  of JCL / JVCL / mbcolor, and if so, is that loss
  tracked somewhere (a `PATCHES.md` is proposed, not
  yet written — see §6)?

Two items are explicitly unverified on Delphi 11/12 Pro:
FixedTrackbar and HttpServer.Base. They are not claimed
as verified, and the default 10.3 path that most
contributors use is untouched by them.

### E. Scope the 8064 claim honestly

#8064 as reported is physical typing only (Right Shift
release slightly late, output `LOnh DOes DOes`, Keyman
15.0.275, Windows 11). Remote Desktop, secure desktop,
higher-integrity focus, ARM64 and the OSK-kill path were
raised by Matthew's research, not by the original report,
and they are not proven by the physical-typing fix.

The packet therefore proposes: close #8064 on physical
typing when §3 and §4A–B pass, with RDP / secure-desktop /
higher-integrity / ARM64 as follow-ons, and the
OSK-kill crash as its own follow-on issue (draft in the
evidence archive, not yet filed). If the team prefers to
hold #8064 open until those legs are proven, that is
also coherent — but it should be a stated decision, not
a default, because the follow-on legs need different
machines and different testers from the physical-typing
fix.

The OSK leftover the team already knows is #16462,
filed 2026-08-30 and still open, "Related issues: #8064".
That is the OSK leftover, not the RDP leftover: no filed
RDP leftover issue was found in the searches done in
October, and none is claimed to exist.

## 5. Honest state table — what is proven, what is not, who owns it

| Item | State | Owner |
|---|---|---|
| Physical-typing fix, three-arm gate (stock 5/5 wedged → fixed 0/5) | Proven on Matthew's machine at the old SHAs; to be rerun at the new tips (§3) | Matthew |
| Automated keybd_shift suite | Proven at old SHAs (95 x64 / 96 x86, delta unexplained); to be reconciled at new tips | Matthew, then team CI |
| Interactive probes (opt-in, not CI) | Passed at old SHAs; local-only by design | Matthew |
| Delphi 12 CE clear rebuild incl. Tike.exe | Proven at old SHAs on Matthew's machine; to be rerun at new tips | Matthew |
| CE guard, both directions; merged helpers | To be rerun (rebase conflict touched this file) | Matthew |
| Vendored patches, removal-tested | Proven on Matthew's machine; clean-machine check outstanding | Team (§4B, §4D) |
| Delphi 12 Pro, Delphi 13, Delphi 10 regression, CE on Linux | UNVERIFIED — no licence, no machine | Team decision (§4C) |
| Clean contributor machine | UNVERIFIED — closest is a fresh VM, recorded | Team, if available |
| ARM64, secure desktop, higher-integrity | UNVERIFIED | Follow-on / team tester |
| RDP (`TEST_REMOTE_DESKTOP`) | UNVERIFIED — needs a second machine/VM to RDP from | Team tester, or follow-on |
| OSK-kill (crash while sticky held) | UNVERIFIED by design — no in-process code can fix it | Follow-on issue, not this PR |
| CI / TeamCity result, team's manual build | UNSEEN by Matthew | Team (§4B) |
| User tests by other testers | UNREPORTED at close (not failed) | Team (§4B) |
| No-new-bugs in sparsely tested areas | UNPROVEN — Keyman has few handwritten tests there | Stated, not claimed |
| Minimality of the fixes | UNPROVEN — Matthew claims complete, not most-minimal | Team review (§4D) |

## 6. Still open — not wrapped, not hidden

1. **Dropped #16191 guide material.** Four docs commits
   (registry / DELPHIINCLUDES correction, SETX style,
   cert setup, build-order table) were superseded by
   #16044's guide. Matthew must decide whether any of
   it needs porting back into #16044's guide.
2. **CE prompt silent success.** Dismissing / closing
   stdin without building in the IDE must not report
   success. Matthew's test list includes it as a FAIL
   condition; the fix itself is not yet written.
3. **248-key batch truncation.** Long batches are
   silently truncated at 248 output keys with no
   diagnostic. Fix or document — not yet done.
4. **Vendor `PATCHES.md`.** Provenance, upstream
   reference and removal-test log per vendored patch.
   Proposed, not yet written.
5. **PR body rewrites.** The PR bodies still carry the
   September claims, including "Closes #8064" without
   the physical-typing scope caveat and the CE probe
   described as one-time (it is per build step, about
   30 `dcc32` spawns). Bodies should be rewritten at
   reopen to carry the summary table (test, result,
   SHA, evidence-branch link) and the honest
   PASSED / BLOCKED states — not before, because
   editing a closed PR's body now would be work in
   the team's queue before they signalled bandwidth.
6. **Follow-on issue filings.** RDP / secure-desktop /
   higher-integrity, PostKeys pair-splitting, init-hooks
   return discarded, and OSK-stranded-by-kill all have
   drafts in the evidence archive. None has been filed.
   Filing them is a reopen-time decision, not a
   background one.
7. **#15324.** Needs its own decision, outside this packet.
8. **November reopen mechanics.** At reopen, first
   confirm each PR's head/diff actually recomputes to
   the fork tips in §1 (GitHub's closed-PR head fields
   still show the old SHAs, a discrepancy that predates
   the restack). Only then edit bodies, request review,
   or flip a draft to ready — and only on Matthew's
   explicit go-ahead at that time.

## 7. How to use this packet at reopen

1. Confirm the five fork tips in §1 are the heads the
   reopened PRs actually show. If any does not recompute,
   stop — do not review a stale diff.
2. Take §4 as the review agenda, in order: serializer
   review, CI/manual build, licence decision, vendored
   patches, scope decision. Each is a separate
   conversation; none requires accepting the others.
3. Take §5 as the shared state table. Update it in
   place as results come in, with SHA and machine
   attached to every PASS. A PASS without a SHA is
   not a PASS.
4. Take §6 as the remaining-work list. Nothing there
   is a surprise to be discovered mid-review; it is
   the work Matthew already knows is outstanding.

Thank you for the bandwidth to look again — and for
the work in July that made the speculative patches
visible, so they could be reverted rather than defended.
The aim of this packet is to make the next review
shorter than the last one, by making each PR smaller
to hold, each claim checkable, and each gap owned.
