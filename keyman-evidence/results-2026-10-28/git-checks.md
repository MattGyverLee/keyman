# Git / inspection checks — restack test list, 2026-10-28

Scope: the git/inspection-only items from
`keyman-evidence/restack-test-list-2026-10-27.md` (A.2, A.3, B.7 git part,
B.8 git part, E, F.16, F.20). No builds, no IDE, no admin, no keystroke
injection. Nothing was committed, pushed, rebased or edited on any PR branch
or PR body.

- Date: 2026-10-28
- Machine: `ltu-legion` (output of `hostname`)
- Repo: C:\Github\keyman, after `git fetch origin` and `git fetch upstream`.
  (The briefed `git fetch origin upstream` fails, with "couldn't find remote
  ref upstream", because it asks origin for a ref named `upstream`. I fetched
  the two remotes separately.)
- Tips under test (each one matches the current `origin/<branch>` head):

| PR | branch | tip | parent used for the layer diff |
|---|---|---|---|
| #16043 | chore/windows/delphi-11-12-compat | 9de382db06 | fcc0bd369d (= merge-base with upstream/master) |
| #16044 | feat/windows/delphi-ce-workflow | 09b2cbe558 | 9de382db06 |
| #16191 | chore/windows/delphi-ce-guard | 331b0b3015 | 09b2cbe558 |
| #16490 | fix/windows/8064-stuck-modifier | f58d9da489 | fcc0bd369d (= merge-base with upstream/master) |
| #16527 | fix/windows/16462-osk-sticky-modifier | c923e1e89d | f58d9da489 |

Ancestry check: each tip in the stack contains the tip below it, and
fcc0bd369d is an ancestor of both stacks. `git merge-base --is-ancestor`
returned 0 for every pair.

Superseded-tip claim: `git log 3f764e3133..9de382db06` shows exactly one
commit, `9de382db06 chore(windows): cite JEDI issue 6560 archive in JclSynch
comment and PATCHES.md`. Its diff touches 2 files (+15/-6): PATCHES.md
(prose) and JclSynch.pas, where only `//` comment lines change. The
executable `FHandle := ...CreateMutex(...)` line is unchanged context.
**The claim "comment-only JclSynch/PATCHES.md citation" is confirmed.**

GitHub note, not a test item: all five PRs are CLOSED. GitHub still shows the
old head SHAs (16043 90792cfa9c, 16044 f6a2c6357b, 16191 52ba14e474, 16490
f55c89979, 16527 df4317ec0), as the test list already recorded.

---

## A.2 — per-layer diff check

- Refs: listed in the table above. Date 2026-10-28. Machine ltu-legion.
- **Result: FAIL (literal scope).** I found no rebase artifacts. Two hunks
  fall outside the plan's stated allowed contents, and both are deliberate
  commits, not rebase leaks. The owner needs to rule on each (keep and amend
  the plan, or drop):
  1. **#16043, `docs/build/windows.md`: an emsdk version change,
     3.1.58 → 3.1.64** (4 lines, commit 25873aed19 "sync emsdk install
     version with the pinned minimum"). The plan says for 16043: "No
     Emscripten bump". This is a docs-only change that matches upstream's
     own pin (`resources/build/minimum-versions.inc.sh:31
     KEYMAN_MIN_VERSION_EMSCRIPTEN=3.1.64` at fcc0bd369d), so it bumps no
     toolchain. It is still an Emscripten change in a Delphi-compat PR, and
     it was already in the pre-restack 16043 (90792cfa9c), so the restack
     did not add it.
  2. **#16044, `windows/src/engine/engine.groupproj`**: the insthelper
     project path changes from `inst\insthelper\insthelper.dproj` to
     `insthelper\insthelper.dproj` (commit 3c25428f5f, "Delphi CE
     interactive build workflow"). The plan says 16044 is "only CE workflow
     + trimmed CE guide", and the 16043 rule says "no groupproj edit". The
     fix itself is real: `windows/src/engine/insthelper/insthelper.dproj`
     exists and `inst/insthelper/` does not. B.9 expected this item to
     possibly survive. It survived inside 16044's CE-workflow commit, not as
     a separate item.

Evidence:

```
$ git diff --stat fcc0bd369d 9de382db06          # 16043 layer: 17 files, +760/-158
 .gitignore                                                  |   2 +-     .gitignore (allowed)
 common/windows/delphi/components/FixedTrackbar.pas          |  14 +--     D11/12 compat
 common/windows/delphi/general/CleartypeDrawCharacter.pas    |   4 +-     D11/12 compat
 common/windows/delphi/general/JsonUtil.pas                  |   4 +      D11/12 compat
 common/windows/delphi/tools/devtools/DevIncludePaths.pas    |  23 +++--  D12 compat (EnvOptions.proj Null attrs)
 common/windows/delphi/tools/devtools/SourceRootPath.pas     |   8 ++     D11/12 compat
 common/windows/delphi/web/Keyman.System.HttpServer.Base.pas |  13 ++-    D11/12 compat
 developer/src/ext/PATCHES.md                                | 106 +++    vendored (expected, G.5)
 developer/src/ext/jedi/jcl/jcl/source/common/JclSynch.pas   |   9 +-     vendored patch
 developer/src/ext/jedi/jedi/jedi.inc                        | 675 ++--   vendored upstream sync (expected)
 developer/src/ext/jedi/jvcl/jvcl/run/JvComponent.pas        |   6 ++     vendored (upstream guard)
 developer/src/ext/mbcolor/mxs.inc                           |  20 ++++   vendored patch
 docs/build/windows.md                                       |  13 ++-    KEYMAN_DELPHI_VERSION note = compat; emsdk 3.1.58->3.1.64 = OUT OF SCOPE (finding 1)
 resources/build/win/configure_environment.inc.sh            |   6 +-     compat (KEYMAN_DELPHI_VERSION, default 20.0)
 resources/build/win/delphi_environment.inc.sh               |   5 +-     compat (same)
 resources/builder.inc.sh                                    |   3 +-     compat (same)
 windows/src/global/delphi/cust/CustomisationStorage.pas     |   7 +-     D12 dcc64 compat

$ git diff --stat 9de382db06 09b2cbe558          # 16044 layer: 4 files, +494/-4
 docs/build/windows-delphi-ce.md        | 412 +++   CE guide
 docs/build/windows.md                  |  31 +++   CE pointer + build-order table (CE workflow docs)
 resources/build/win/environment.inc.sh |  47 +++   CE workflow (_delphi_ce_output_fresh, CE prompt)
 windows/src/engine/engine.groupproj    |   8 +--  OUT OF LITERAL SCOPE (finding 2)

$ git diff --stat 09b2cbe558 331b0b3015          # 16191 layer: 1 file, +41/-2
 resources/build/win/environment.inc.sh | 43 ++-  CE guard + "CE prompt must fail the build" (expected, G.3)
$ git log --oneline 09b2cbe558..331b0b3015
331b0b3015 fix(windows): CE prompt must fail the build when the IDE did not build
cd3d317433 feat(windows): guard delphi_msbuild against silent CE build failures

$ git diff --stat fcc0bd369d f58d9da489          # 16490 layer: 24 files, +10651/-74
 windows/src/engine/keyman32/{build.sh, k32_lowlevelkeyboardhook.cpp, k32_visualkeyboardinterface.h,
   keybd_shift.cpp, keyman64.h, keymanengine.h, serialkeyeventcommon.h, serialkeyeventserver.cpp}   serializer fix
 windows/src/engine/keyman32/tests/{keybd_shift.tests.cpp, keybd_shift.interactive.tests.cpp,
   keyman32.tests.vcxproj, keyman32.interactive.tests.vcxproj}                                     tests
 windows/src/support/fakefreeze/{README.md, build.sh, fakefreeze.vcxproj}                          test tool (README + build plumbing)
 windows/src/test/manual-tests/GH-8064 - stuck-modifier-phantom-keydown/{README.md, deploy-8064.ps1,
   evidence/README.md, host32/{.gitignore, README.md, host32.cpp, rawinput-probe.cpp},
   run-8064-test.ps1, stuck-mod-test.ps1}                                                          manual test
 -> all in scope: serializer fix + tests (incl. Section G truncation diagnostic, user-held
    accessor, bounded release-only verification loop: commits cb954e5ba6, a3caa084fc, 0cc6984ff9).
    keyman32/build.sh adds the opt-in `test-interactive` action; keyman32.tests.vcxproj adds
    keybd_shift.tests.cpp. evidence/ holds only the pointer README.md, no logs.

$ git diff --stat f58d9da489 c923e1e89d          # 16527 layer: 5 files, +754/-45
 windows/src/engine/keyman/viskbd/UfrmOSKOnScreenKeyboard.pas                     | 548   OSK viskbd
 windows/src/engine/keyman/viskbd/UfrmVisualKeyboard.pas                          |   5   OSK viskbd
 windows/src/test/manual-tests/GH-16462 - osk-sticky-modifier/README.md           | 206   manual test
 windows/src/test/manual-tests/GH-16462 - osk-sticky-modifier/evidence/README.md  |  17   manual test (pointer)
 windows/src/test/manual-tests/GH-16462 - osk-sticky-modifier/watch-modifiers.ps1 |  23   manual test
 -> all in scope. Matches the list's "exactly 5 files, +754 / -45".
```

Differences from the list's restack numbers, explained by later commits the
list records: the 16191 layer is now +41/-2 (the list said 28 lines), because
of the G.3 fix in 331b0b3015. The 16490 layer is now 24 files, +10651/-74
(the restack said 42 files, +12896/-74), because of the evidence move and the
Section G fixes.

Cosmetic doc observation, not a scope finding: in #16044's
`docs/build/windows.md` build-order table, the line "All generated `.pas`
files are `.gitignored` ..." comes directly after the last table row with no
blank line. In GFM that line is most likely rendered as an extra table row.
I did not check the rendering.

---

## A.3 — default-path check (inspection only)

- Ref: 331b0b3015 (cumulative Delphi stack). Date 2026-10-28. Machine
  ltu-legion. Method: read the code only. Nothing was executed.
- **Result: PASS by inspection.** I did not run a build or diff a build log,
  so the build-log half of A.3 is UNVERIFIED. No Pro machine is available
  (Section D).

On a non-CE (Pro) machine with KEYMAN_DELPHI_VERSION and KEYMAN_DELPHI_CE
both unset, the code behaves as follows:

1. Every script the Delphi layers touch falls back to the old 20.0 default:
   ```
   resources/build/win/configure_environment.inc.sh:  DELPHI_VERSION="${KEYMAN_DELPHI_VERSION:-20.0}"   (was DELPHI_VERSION=20.0)
   resources/build/win/delphi_environment.inc.sh:     DELPHI_VERSION="${KEYMAN_DELPHI_VERSION:-20.0}"   (was DELPHI_VERSION=20.0)
   resources/builder.inc.sh:  local _delphi_version="${KEYMAN_DELPHI_VERSION:-20.0}"
                              if [[ -x "$(cygpath -u "$ProgramFilesx86\\Embarcadero\\Studio\\$_delphi_version\\bin\\dcc32.exe")" ]]; then
   ```
2. In `delphi_msbuild` (environment.inc.sh at 331b0b3015, lines 144–190),
   the CE branch is skipped, so there is no prompt, no `read`, and no
   freshness output:
   ```
   147:  if [[ "${KEYMAN_DELPHI_CE:-}" == "1" ]]; then
   ...      (CE prompt / freshness re-check / builder_die — all inside this block)
   180:  fi
   185:  _probe_delphi_ce
   186:  if [[ "$_KEYMAN_DELPHI_IS_CE" == "1" ]]; then
   187:    builder_die "Delphi Community Edition detected at Studio\\${KEYMAN_DELPHI_VERSION:-20.0}\\ ..."
   188:  fi
   189:  run_in_delphi_env msbuild.exe "$@" "$DELPHI_MSBUILD_FLAG_DEBUG"
   ```
   Line 189 is byte-identical to the whole upstream body (fcc0bd369d,
   environment.inc.sh:103): `run_in_delphi_env msbuild.exe "$@"
   "$DELPHI_MSBUILD_FLAG_DEBUG"`.
3. The probe prints nothing in the normal flow:
   ```
   129: _probe_delphi_ce() {
   130:   [[ -n "$_KEYMAN_DELPHI_CE_PROBED" ]] && return
   131:   _KEYMAN_DELPHI_CE_PROBED=1
   133:   version="${KEYMAN_DELPHI_VERSION:-20.0}"
   134:   dcc32="$(cygpath -u "$ProgramFilesx86\\Embarcadero\\Studio\\$version\\bin\\dcc32.exe")"
   135:   [[ -x "$dcc32" ]] || return
   138:   output="$("$dcc32" 2>&1 || true)"
   139:   if [[ "$output" == *"does not support command line compiling"* ]]; then
   140:     _KEYMAN_DELPHI_IS_CE=1
   ```
   dcc32's stdout and stderr are both captured into a variable, so nothing is
   echoed. On Pro the CE marker is absent, so the script does not die.

Precise caveat: the default path is not side-effect-free. On a machine with
`Studio\20.0\bin\dcc32.exe`, the first `delphi_msbuild` call in each
build.sh process now spawns `dcc32.exe` with no arguments, a new process
that did not run before. It produces no visible output. I did not observe
how Pro's dcc32 behaves with no arguments (exit time, any GUI). That needs a
Pro machine (Section D).

This-machine note, for B.5 and not part of A.3: ltu-legion has only
`Studio\23.0` installed, and the user environment holds
`KEYMAN_DELPHI_VERSION=23.0` and `KEYMAN_DELPHI_CE=1`. The probe reads
`${KEYMAN_DELPHI_VERSION:-20.0}`. So for B.5's "CE unset → guard fires"
test, **unset KEYMAN_DELPHI_CE but keep KEYMAN_DELPHI_VERSION=23.0**. If both
are unset, the probe looks for `Studio\20.0\bin\dcc32.exe`, which does not
exist here. It then returns silently and the guard does NOT fire. That would
be a test-setup error, not a guard failure.

```
$ ls "/c/Program Files (x86)/Embarcadero/Studio/"     -> 23.0
$ [User env] KEYMAN_DELPHI_VERSION=23.0  KEYMAN_DELPHI_CE=1
$ bash -n on environment.inc.sh at fcc0bd369d and 331b0b3015 -> both OK
```

---

## B.7 (git part) — reverted speculative patches; vendored files changed; PATCHES.md

- Ref: 9de382db06 (#16043) vs fcc0bd369d. Date 2026-10-28. Machine
  ltu-legion. This covers only the git part. The removal builds (the main
  B.7 test) are UNVERIFIED, because nothing was built.
- **Result: FAIL (literal) for 1 of 7 call sites of reverted patch #1. PASS
  for the other 6 sites and for reverted patch #2.** The owner needs to rule
  on the CreateMutex site; the B.7 removal build is what decides it.

The two reverted speculative patches, identified from history:
- Patch #1, commit 69c52bd36e "revert: drop unnecessary JclSynch.pas
  Boolean/BOOL cast patches". BOOL() casts at 7 sites: CreateEvent,
  OpenEvent, CreateWaitableTimer, OpenWaitableTimer, OpenSemaphore,
  CreateMutex (rerouted to `Winapi.Windows.CreateMutex`), OpenMutex. It was
  reapplied in e8cd874d18 and reverted again in 71a9cf2d91 ("match
  project-jedi/jcl upstream verbatim at all 7 call sites ... TIKE builds
  without it once the JvComponent.pas ... guard ... is in place").
- Patch #2, commit e11efea0ac "revert: drop JvComponent.pas OldCreateOrder
  patch pending verification". It was the `{$IF Defined(VER350) or
  Defined(VER360)} DoCreate; {$ELSE} ...` form. Reapplied in 62a68021ca,
  then replaced by the upstream guard in e8c0138913.

Current state in the 16043 layer:
- Patch #2 is **NOT back**. JvComponent.pas now carries only the upstream
  guard plus a 4-line comment:
  ```
  +      {$IFDEF HAS_PROPERTY_OLDCREATEORDER}
         if OldCreateOrder then
           DoCreate;
  +      {$ENDIF HAS_PROPERTY_OLDCREATEORDER}
  ```
  There is no VER350/VER360 arm. The guard lines are identical to upstream
  JVCL b045b99, `jvcl/run/JvComponent.pas:126-129` (fetched with `gh api`).
- Patch #1: 6 of its 7 sites are **NOT back**. `git diff fcc0bd369d
  9de382db06 -- developer/src/ext/jedi/jcl | grep -c 'BOOL('` returns 1. **The
  CreateMutex site IS back**, and the line is byte-identical to the
  reverted line:
  ```
  reverted (69c52bd36e, "-" side): FHandle := {$IFDEF HAS_UNITSCOPE}Winapi.{$ENDIF}Windows.CreateMutex(SecAttr, BOOL(InitialOwner), PChar(Name));
  now at 9de382db06:               FHandle := {$IFDEF HAS_UNITSCOPE}Winapi.{$ENDIF}Windows.CreateMutex(SecAttr, BOOL(InitialOwner), PChar(Name));
  ```
  It was reinstated on purpose in 582a4dae73 and is documented as PATCHES.md
  entry 1, citing a concrete error (E2010 at JclSynch.pas(1078), JEDI issue
  6560). The record is contradictory, though: commit 71a9cf2d91's message
  says TIKE builds without any JclSynch patch, and PATCHES.md marks the
  removal test PENDING. On this plan's own rule ("a patch with no error on
  this machine goes back on the speculative list"), this site is
  unverified until the B.7 removal build runs.

Vendored files changed by the 16043 layer (`git diff --name-only fcc0bd369d
9de382db06 -- developer/src/ext`), exactly 5:
```
developer/src/ext/PATCHES.md                                  (new, 106 lines)
developer/src/ext/jedi/jcl/jcl/source/common/JclSynch.pas     (+8/-1: CreateMutex site only)
developer/src/ext/jedi/jedi/jedi.inc                          (upstream sync)
developer/src/ext/jedi/jvcl/jvcl/run/JvComponent.pas          (+6: upstream guard + comment)
developer/src/ext/mbcolor/mxs.inc                             (+20: VER350 / VER360 DELPHI_5..10_UP blocks)
```
jedi.inc sync check: the blob at 9de382db06 is `298ca8ff097a...`, and
`gh api repos/project-jedi/jedi/contents/jedi.inc?ref=a09411655fb3...`
returns sha `298ca8ff097a...`. **They are byte-identical to upstream at the
cited commit.** It defines `HAS_PROPERTY_OLDCREATEORDER` (line 2095) and
undefines it (line 2166).

PATCHES.md per-entry status, as written at 9de382db06:
- Entry 1, JCL `JclSynch.pas` (TJclMutex.Create → RTL CreateMutex with
  BOOL): "Removal test: **PENDING** ... Do not mark this entry 'verified'
  until that run is recorded."
- Entry 2, JVCL + jedi.inc: "**SYNCED FROM UPSTREAM, NOT A KEYMAN PATCH**"
  and "until then this entry is **SYNCED, not VERIFIED** on Delphi 12 CE"
  (owed: a TIKE build on D12 CE with the guard inactive and no E2003).
- Entry 3, mbcolor `mxs.inc`: "Removal test: **PENDING** — same procedure as
  entry 1."
- "What is NOT patched": it says the Keyman-local patches are entries 1 and 3
  only.

---

## B.8 (git part) — FixedTrackbar.pas and Keyman.System.HttpServer.Base.pas

- Ref: 9de382db06 vs fcc0bd369d. Date 2026-10-28. Machine ltu-legion. The
  VER360 compile half of B.8 is UNVERIFIED, because nothing was built.
- **Result: FAIL (literal criterion).** The criterion is "git diff on [the
  VER330] arms must be empty". It cannot be met: the old code had no VER330
  arm. Both files rewrite nested `{$IFNDEF}` chains into `{$IF Defined()}
  / {$ELSEIF} / {$ELSE} / {$IFEND}`, so the diff covers the whole
  conditional. I compared what each version actually emits under VER330:
  - **HttpServer.Base.pas: same.** Old: `{$IFNDEF VER330}` is false, so
    nothing is emitted. New: the `{$ELSEIF Defined(VER330)}` arm holds only
    a comment, so nothing is emitted.
  - **FixedTrackbar.pas: DIFFERENT, at the diagnostic level only.** Old: on
    VER330, `{$IFNDEF VER340}` is true, so the compiler emits `{$MESSAGE WARN
    'Not yet checked against Delphi 10.4'}`. The inner `IFNDEF VER330` is
    false. New: the VER330 arm holds only a comment, so **the VER330 build
    no longer emits that warning**. No code is generated inside either
    conditional, and the procedure bodies after the blocks are untouched.
    This changes a compiler message on VER330, not codegen. Under the
    criterion as written it is still a non-empty VER330 difference.

Hunks:
```
--- a/common/windows/delphi/components/FixedTrackbar.pas
+++ b/common/windows/delphi/components/FixedTrackbar.pas
@@ -64,16 +64,16 @@ end;
   Tested on VER320 (10.2)
   Tested on VER330 (10.3) - 29 Oct 2019 - mcdurdin
+  TODO: Not yet fully verified against Vcl.Grids.pas in VER350 (11) or VER360 (12)
 }
-{$IFNDEF VER340}
-{$MESSAGE WARN 'Not yet checked against Delphi 10.4'}
-{$IFNDEF VER330}
-{$IFNDEF VER320}
+{$IF Defined(VER340) or Defined(VER350) or Defined(VER360)}
+{$MESSAGE WARN 'TODO: Trackbar scrolling on bottom cell not yet checked against Delphi 10.4, 11.0 or 12.0'}
+{$ELSEIF Defined(VER320) or Defined(VER330)}
+// Tested on Delphi 10.2 (VER320) and 10.3 (VER330)
+{$ELSE}
 {$MESSAGE ERROR 'Check that this fix is still applicable for a new version of Delphi. Checked against Delphi 10.2, 10.3' }
-{$ENDIF}
-{$ENDIF}
-{$ENDIF}
+{$IFEND}

--- a/common/windows/delphi/web/Keyman.System.HttpServer.Base.pas
+++ b/common/windows/delphi/web/Keyman.System.HttpServer.Base.pas
@@ -44,10 +44,15 @@ begin
   // Indy's UTF8 handling of URLs is *completely* broken.
-  // We may need to check this with updated versions of Delphi
-{$IFNDEF VER330}
-  ERROR! Check if this is still needed with Delphi update
-{$ENDIF}
+  // We may need to check this with updated versions of Delphi.
+  // VER340/VER350/VER360 (10.4/11/12): unblocked but not re-verified; workaround kept.
+{$IF Defined(VER340) or Defined(VER350) or Defined(VER360)}
+  {$MESSAGE WARN 'TODO: Check if Indy URL UTF-8 handling is still needed with Delphi 10.4/11.0/12.0'}
+{$ELSEIF Defined(VER330)}
+  // Verified against Delphi 10.3 (VER330)
+{$ELSE}
+  {$MESSAGE ERROR 'Check if Indy URL UTF-8 handling is still needed with Delphi update'}
+{$IFEND}
```

Side observation, outside VER330: under old FixedTrackbar, VER340 emitted no
message at all. The outer IFNDEF VER340 was false, so the "Not yet checked
against 10.4" warning was silent on 10.4 itself. The new code warns on
340/350/360, which looks like the intended behaviour.

---

## E — .gitignore at #16043

- Ref: 9de382db06. 09b2cbe558 and 331b0b3015 have an identical .gitignore
  (`git diff --quiet` returned 0). Date 2026-10-28. Machine ltu-legion.
- **Result: PASS.**

```
$ git show 9de382db06:.gitignore | grep -n -i 'version\*\.res\|tsdoc\|api-extractor\|wraplock'
22:/windows/src/**/version*.res
190:# see common/tools/api-extractor/README.md
191:tsdoc.json
192:api-extractor.json
   (no wraplock line)

# Rule test using ONLY the 16043 .gitignore, in an isolated scratch repo:
$ git check-ignore -v --no-index windows/src/engine/keyman/version64.res windows/src/desktop/kmshell/version.res \
    windows/src/engine/keyman32/version.rc tsdoc.json api-extractor.json common/x/tsdoc.json
.gitignore:22:/windows/src/**/version*.res  windows/src/engine/keyman/version64.res
.gitignore:22:/windows/src/**/version*.res  windows/src/desktop/kmshell/version.res
.gitignore:191:tsdoc.json                   tsdoc.json
.gitignore:192:api-extractor.json           api-extractor.json
.gitignore:191:tsdoc.json                   common/x/tsdoc.json
   (version.rc is correctly NOT ignored)
```
The layer diff also shows the cosmetic rebase artifact the list documented:
one blank line before `# see common/tools/api-extractor/README.md` was
removed. It has no functional effect. The post-build `git status` part of E
is UNVERIFIED, because nothing was built.

---

## F.16 — link check (PR bodies + manual-test READMEs)

- Refs: PR bodies fetched live on 2026-10-28 with `gh pr view N -R
  keymanapp/keyman --json body`. Rendered HTML came from `gh api
  repos/keymanapp/keyman/pulls/N` with `Accept:
  application/vnd.github.html+json`. Evidence branch:
  `origin/evidence/8064-16462` = eae9164f79 (matches `git ls-remote`). PR
  trees: the tips under test. Machine ltu-legion.
- **Result: FAIL.** Every target file exists. Two kinds of link are broken
  as links:

**Broken #1: repo-relative links in PR bodies (16043, 16044, 16191). 18
links in total.** The files exist on the PR tips. But GitHub renders them
with relative hrefs, for example `href="common/windows/delphi/components/FixedTrackbar.pas"`
from the rendered body_html. A browser resolves those against the PR page
URL (`https://github.com/keymanapp/keyman/pull/<N>`), not against the repo
tree, so they point to `https://github.com/keymanapp/keyman/pull/common/...`.
I checked the rendered hrefs. I did not click the links.
- #16043, 11 links: common/windows/delphi/components/FixedTrackbar.pas,
  common/windows/delphi/general/CleartypeDrawCharacter.pas,
  common/windows/delphi/general/JsonUtil.pas,
  common/windows/delphi/tools/devtools/SourceRootPath.pas,
  common/windows/delphi/web/Keyman.System.HttpServer.Base.pas,
  developer/src/ext/jedi/jcl/jcl/source/common/JclSynch.pas,
  developer/src/ext/jedi/jvcl/jvcl/run/JvComponent.pas,
  developer/src/ext/mbcolor/mxs.inc,
  resources/build/win/configure_environment.inc.sh,
  resources/build/win/delphi_environment.inc.sh, resources/builder.inc.sh.
  All 11 exist at 9de382db06.
- #16044, 4 links: docs/build/windows-delphi-ce.md, docs/build/windows.md,
  resources/build/win/environment.inc.sh,
  windows/src/engine/engine.groupproj. All 4 exist at 09b2cbe558.
- #16191, 2 links: docs/build/windows-delphi-ce.md,
  resources/build/win/environment.inc.sh. Both exist at 331b0b3015.
- Fix direction (not applied, because PR bodies are not to be edited here):
  use absolute blob URLs, either on the fork branch or on upstream after
  merge.

**Broken #2: malformed link in the #16527 body, line 35.**
```
[`windows\src\test\manual-tests\GH-16462 - osk-sticky-modifier\watch-modifiers.ps1`]('./windows\src\test\manual-tests\GH-16462 - osk-sticky-modifier\watch-modifiers.ps1')
```
It does not render as a link. The rendered HTML shows the raw
`]('./windows\src\...` text, and GitHub auto-links "GH-16462" inside it to an
issue. The target file itself exists at c923e1e89d
(`windows/src/test/manual-tests/GH-16462 - osk-sticky-modifier/watch-modifiers.ps1`).

**Evidence-branch links: all OK** (`git cat-file -e origin/evidence/8064-16462:<path>`):
```
OK keyman-evidence/README.md                                         (linked from all 5 bodies)
OK keyman-evidence/team-testing-plan-2026-10-27.md                   (linked from all 5 bodies)
OK keyman-evidence/restack-test-list-2026-10-27.md                   (F.16 checklist item)
OK keyman-evidence/16490-GH-8064/manual-tests-GH-8064/               (folder)
OK keyman-evidence/16527-GH-16462/manual-tests-GH-16462/             (folder)
OK .../16490-GH-8064/manual-tests-GH-8064/evidence/gate-fail-stock-19.0.276.txt   (16490 body)
OK .../16490-GH-8064/manual-tests-GH-8064/evidence/host32-fixed-19.0.277.txt      (16490 body, GH-8064 README:280)
OK .../16490-GH-8064/manual-tests-GH-8064/evidence/rawinput-delivery.md           (16490 body, GH-8064 README:96, host32 README:74 path text)
OK .../16490-GH-8064/manual-tests-GH-8064/TRIAGE.md                               (GH-8064 README:9)
OK .../16527-GH-16462/manual-tests-GH-16462/evidence/baseline-shipped-build.md    (GH-16462 README:135,198)
OK .../16527-GH-16462/manual-tests-GH-16462/issues/issue-osk-sticky-stranded-by-kill.md (16527 body, GH-16462 README:206)
OK https://github.com/MattGyverLee/keyman/tree/chore/windows/delphi-11-12-compat  (16527 body; branch exists on origin, = 9de382db06)
```
The paths named in the backticked text of the evidence index
(`keyman-evidence/README.md`) also all exist: evidence/, TRIAGE.md, issues/,
host32/, run-8064-test.ps1, stuck-mod-test.ps1, deploy-8064.ps1, README.md,
pr-M.md, watch-modifiers.ps1.

**Manual-test READMEs on the PR branches: all relative links OK.**
```
GH-8064 README (f58d9da489): ./stuck-mod-test.ps1                        OK
GH-16462 README (c923e1e89d): ./watch-modifiers.ps1                     OK
                              ../GH-140%20-%20shift%20states/            OK (decoded: "GH-140 - shift states")
                              ../test_i3762%20modifier%20tests/          OK (decoded: "test_i3762 modifier tests")
evidence/README.md pointers (both): no markdown links. The branch name, folder and index
  are given as backticked text, and each named folder exists on origin/evidence/8064-16462.
host32/README.md, fakefreeze/README.md: no markdown links; the one path mention resolves (above).
```
External issue/PR links (keymanapp/keyman #8064, #16462, #4599, #15065,
#16039 plus its issuecomment anchor, and the PR cross-links) are outside the
scope of this check and were not fetched.

Staleness observation, not a broken link: the evidence index README says the
team-testing-plan link "is to be added at reopen, not before". All five PR
bodies already carry that link.

---

## F.20 — CE probe spawn count wording vs code

- Ref: 331b0b3015 (`resources/build/win/environment.inc.sh`) and the #16191
  body fetched 2026-10-28. Machine ltu-legion.
- **Result: PASS for the mechanism.** The "roughly 30" count is UNVERIFIED,
  because no build log exists. The body says:
  > "Result cached per shell — subsequent `delphi_msbuild` calls in the same
  > shell don't re-spawn dcc32, so a full clear rebuild costs about one spawn
  > per build.sh invocation (roughly 30 across the whole rebuild), not one
  > spawn ever." and "The added overhead is one dcc32 spawn per build.sh invocation".

The code matches:
- The cache flags are reset each time the file is sourced
  (`_KEYMAN_DELPHI_CE_PROBED=""` at line 127, top level), and each build.sh
  is a new bash process that sources environment.inc.sh. So the cache lives
  for one process.
- `_probe_delphi_ce` returns early once `_KEYMAN_DELPHI_CE_PROBED` is set
  (line 130). That gives at most one dcc32 spawn per process.
- `builder_run_action` runs the action function in the same shell (`"$@"`,
  builder.inc.sh:682). No caller of `delphi_msbuild` runs it inside `$(...)`,
  a pipe, or a `( )` subshell (grep across the 41 `.sh` callers at
  331b0b3015 found none). The cache therefore is not lost to a subshell.

Imprecisions in the body. These are wording only and do not count as FAIL:
- The spawn count is "at most one" per build.sh, not exactly one. The probe
  is reached only when that build.sh calls `delphi_msbuild` with
  KEYMAN_DELPHI_CE≠1, and dcc32 is spawned only if `dcc32.exe` exists at
  `Studio\${KEYMAN_DELPHI_VERSION:-20.0}`. In the CE=1 workflow there are 0
  spawns, because the CE branch returns or dies before line 185.
- "runs `dcc32.exe` once per shell, captures stderr": the code captures
  stdout and stderr together (`2>&1`), and runs dcc32 lazily on the first
  non-CE `delphi_msbuild` call, not once per shell unconditionally.
- "roughly 30": 41 build.sh files call `delphi_msbuild`. How many of them a
  full clear rebuild invokes cannot be confirmed by inspection.
