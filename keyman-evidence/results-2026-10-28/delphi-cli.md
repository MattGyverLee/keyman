# Delphi stack — CLI half of the test plan, 2026-10-28

- Machine: `ltu-legion` (Windows 11 Pro 10.0.26200), Delphi 12 Athens CE (BDS 23.0, `C:\Program Files (x86)\Embarcadero\Studio\23.0`)
- Worktree A: `C:\Github\keyman-test-delphi`, detached at **331b0b3015** (= `origin/chore/windows/delphi-ce-guard`, #16191 tip; ancestors 09b2cbe558 #16044 and 9de382db06 / 3f764e3133 #16043)
- Worktree B: `C:\Github\keyman-test-16462`, `test/16462-on-delphi-stack` at **2d5bdf43bd** (= 331b0b3015 + merge of c923e1e89d #16527, which carries #16490)
- Date: 2026-10-28. Nothing was committed or pushed. No IDE or GUI was opened. No admin rights were used.
- Logs: `results-2026-10-28/logs/` (`*.out` = console, `*.xtrace` = bash xtrace of every shell, used to count dcc32 spawns)
- Harness: `results-2026-10-28/tools/runb.sh`. Every run does `unset NoDefaultCurrentDirectoryInExePath`, `export KEYMAN_DELPHI_VERSION=23.0`, and **explicitly** sets or unsets `KEYMAN_DELPHI_CE`. The persistent user environment has `KEYMAN_DELPHI_CE=1`, so no run relied on it. Each log's header shows the values actually used.

## Result table

| ID | Tree / SHA | Result | Evidence |
|---|---|---|---|
| B.5a / E — CE machine, `KEYMAN_DELPHI_CE` unset (VERSION=23.0 kept) | A 331b0b3015 | **PASS** | logs/1a-ce-unset.out |
| B.5b / E — CE=1, output stale (missing), stdin closed → prompt names .dproj, pre-build ran first, dies loudly | A 331b0b3015 | **PASS** | logs/1b-ce1-stdin-closed-nodeps.out (+ logs/1b-ce1-stdin-closed.out, with deps) |
| item 6 — CE=1, Enter without building → dies loudly | A 331b0b3015 | **PASS** (missing output and stale-but-present output) | logs/1c-ce1-enter-missing.out, logs/1c-ce1-enter-stale.out |
| item 6 — CE=1, stdin closed → dies loudly | A 331b0b3015 | **PASS** | same as B.5b |
| item 6 / E — CE=1, output fresh → prompt auto-skipped | A | **PENDING-IDE** (simulated only; see below) | logs/1d-SIMULATED-fresh-placeholder.out |
| B.5 — "post-build steps run around it" (after a real IDE build) | A | **PENDING-IDE** | needs a real IDE build |
| NEW X1 — CE=1, **package** (.dpk) project, fresh .bpl at its real output path, Enter → should continue | A 331b0b3015 | **FAIL** (simulated; still to be confirmed with a real IDE build) | logs/X1-pkg-fresh-at-real-output-enter.out |
| F.20 — probe spawn count | A 331b0b3015 | **PASS for the CE paths seen; Pro path UNVERIFIED** | xtrace counts below |
| Stdin feeder for orchestrating prompts (trigger file → pipe → `read`) | A | **PASS** (plumbing) | logs/X2-feeder.out |
| Step 2 — CLI preflight, A | A | done, with listed exceptions | see "Preflight" |
| Step 2 — CLI preflight, B | B 2d5bdf43bd | done | see "Preflight" |
| Step 3 — B uiAccess edit + manifest.res regen | B 2d5bdf43bd | done | `git diff --stat`, below |

## B.5a — guard with KEYMAN_DELPHI_CE unset — PASS

```
cd /c/Github/keyman-test-delphi/common/windows/delphi/tools/devtools
unset NoDefaultCurrentDirectoryInExePath; export KEYMAN_DELPHI_VERSION=23.0; unset KEYMAN_DELPHI_CE
./build.sh build </dev/null
```
```
[common/windows/delphi] ## build:keymanversion completed successfully
[common/windows/delphi/tools/devtools] Delphi Community Edition detected at Studio\23.0\ but KEYMAN_DELPHI_CE is not set. CE blocks CLI compilation; msbuild would fake a success with no output. Run: export KEYMAN_DELPHI_CE=1 (see docs/build/windows-delphi-ce.md).
[common/windows/delphi/tools/devtools] ## build:project failed
# exit=1
```
- `grep -ciE "build succeeded|0 Error"` on the log returns 0. msbuild never ran, and `devtools/bin` was not created.
- The message names the CE guide by path.
- Setup note, per the coordinator: only `KEYMAN_DELPHI_CE` was unset. `KEYMAN_DELPHI_VERSION=23.0` was kept, so the probe looked at Studio\23.0. I did not do a run with both unset.

## B.5b + item 6 (stdin closed) — PASS

```
cd /c/Github/keyman-test-delphi/windows/src/engine/tsysinfox64
export KEYMAN_DELPHI_CE=1 KEYMAN_DELPHI_VERSION=23.0
./build.sh build --no-deps </dev/null
```
```
[windows/src/engine/tsysinfox64] ### visual_studio: rc version.rc
[windows/src/engine/tsysinfox64] ### visual_studio: rc manifest.rc
[windows/src/engine/tsysinfox64] Delphi CE: CLI compilation is not available.
[windows/src/engine/tsysinfox64] Please build tsysinfox64.dproj (Platform: Win64, Config: Debug) in the Delphi IDE now, then press Enter to continue (or Ctrl-C to abort).
[windows/src/engine/tsysinfox64] Tip: opening the parent .groupproj and running Build All ...
[windows/src/engine/tsysinfox64] Delphi CE: no Enter received (stdin closed or EOF) for tsysinfox64.dproj.
[windows/src/engine/tsysinfox64] Delphi CE: tsysinfox64.dproj (Win64) was not built in the IDE -- its Debug output is still older than its source (or missing). The build FAILS here ...
[windows/src/engine/tsysinfox64] ## build:project failed
# exit=1
```
The pre-build steps ran before the prompt. version.res, manifest.xml and manifest.res were all created at 10:29:38, ahead of the prompt.

The same test **with deps** (`./build.sh build </dev/null`) stopped at the first Delphi prompt in the dependency chain, `build_standards_data.dproj`, in a child build launched through `common/windows/delphi` → `tools`. It printed the same "no Enter received" warning, died, and the failure propagated (`child script ... failed with exit code 1` → `Dependency failed` → exit 1). This shows that child and dependency builds inherit the top-level stdin.

## item 6 — Enter without building — PASS (both variants)

`printf '\n' | ./build.sh build --no-deps` in tsysinfox64:
- **Missing output:** prompt, no "no Enter received" line (so the Enter was consumed), then the loud die, exit 1.
- **Stale-but-present output:** a placeholder `bin/Win64/Debug/tsysinfox64.exe` dated 2020-01-01 (setup in logs/1c-stale-setup.txt) behaves the same way: loud die, exit 1. The placeholder was deleted afterwards.

## item 6 / E — fresh output auto-skips — PENDING-IDE

Simulation only, not counted as a pass: a 12-byte placeholder `devtools/bin/Win32/Debug/devtools.exe`, newer than `devtools.dpr`, gave
`Delphi CE: devtools.dproj (Win32) — output is up-to-date, skipping prompt.` → `build:project completed successfully`, exit 0, with stdin closed. The placeholder was deleted afterwards. This proves the mtime branch works. It does not prove anything about a real IDE build.
The run the coordinator needs to do after the IDE phase is in ide-build-script.md, step A1-verify.

## NEW X1 — packages always die under CE=1, even after a real IDE build — FAIL (simulated)

`_delphi_ce_output_fresh` only looks at `bin/<Platform>/Debug/<base>.{exe,dll,bpl}`, relative to the build.sh working directory. Every `.dpk` package project writes its `.bpl` through `DCC_BplOutput` to a `lib` directory instead:

| Package step | Real output (DCC_BplOutput) |
|---|---|
| common/windows/delphi/components/common_components.dproj | common/windows/lib/common_components.bpl |
| common/windows/delphi/ext/cef4delphi/packages/CEF4Delphi.dproj | common/windows/lib/CEF4Delphi.bpl (the check also looks under `bin/Win32/Debug/packages/`) |
| windows/src/global/delphi/keyman_components.dproj | windows/lib/keyman_components.bpl |
| developer/src/common/delphi/components/developer_components.dproj | developer/lib/ |
| developer/src/ext/jedi/packages/{Jcl,JclVcl,JvCore,JvCoreDesign,JvDocking,JvDockingDesign}.dproj | developer/lib/ |
| developer/src/ext/{mbcolor/mbColorLibD10, scfontcombobox/scFontCombo, browse4folder/browse4folder}.dproj | developer/lib/ |

So for packages the prompt can **never** auto-skip, a gap that predates this commit (#16044). Since 331b0b3015 there is a worse problem: **after a successful IDE build plus Enter, the step dies anyway**. Before that commit, Enter returned 0.
The simulation put a placeholder `common/windows/lib/common_components.bpl` at 10:31:59, newer than `common_components.dpk` (10:23:29), then ran `printf '\n' | KEYMAN_DELPHI_CE=1 ./build.sh build --no-deps`:
```
Please build common_components.dproj (Platform: Win32, Config: Debug) in the Delphi IDE now, then press Enter ...
Delphi CE: common_components.dproj (Win32) was not built in the IDE -- its Debug output is still older than its source (or missing). The build FAILS here ...
## build:project failed     # exit=1
```
The placeholder was deleted afterwards. The post-prompt `devtools -ip` steps never run.

Impact on B.4: the documented "run build.sh and build at each prompt" flow cannot finish any package step. Builder does skip a **dependency** build whose declared output exists (`resources/builder.inc.sh:715`), so later top-level scripts get past these packages once the .bpl is on disk. Direct and child invocations still re-prompt and die. ide-build-script.md works around this and records each package die as an X1 data point. The IDE phase must confirm X1 with a real build: step A2 is that test.

Smaller related issues:
- `sentrytool/build.sh` test action passes `sentrytoolTests.dpr`, not a `.dproj`, so the `.dproj` strip finds no source and the step always dies under CE=1. This is a test action only, not part of `build`.
- Freshness compares the output only against the `.dpr`/`.dpk`, never against the `.pas` units. If a unit is edited after a build, the old binary still counts as fresh and the prompt auto-skips silently. This doesn't affect a clear rebuild, but warm rebuilds can ship a stale binary. That matters for re-testing the viskbd `.pas` changes in B.

## F.20 — probe spawn count

Counted in xtrace as executions of `'/c/Program Files (x86)/Embarcadero/Studio/23.0/bin/dcc32.exe'`:
- CE unset (1a): **1 spawn**, then it died. The probe is cached in shell variables, and builder child and dependency scripts are separate bash processes, so on a non-CE (Pro) run each build.sh process that reaches `delphi_msbuild` costs one spawn.
- CE=1 (1b, 1b with deps, 1c ×2, the simulated 1d, X1, B pre-build, 14 A pre-builds): **0 spawns**. The probe sits only in the non-CE branch of `delphi_msbuild`.
- So the #16191 body's "one dcc32 spawn per build.sh invocation, roughly 30 across a full clear rebuild" holds for the **non-CE** path only. A CE=1 full rebuild spawns dcc32 **zero** times. I couldn't count on the Pro path here because there is no Pro licence, so that part is UNVERIFIED. The wording would be exact if it said "on non-CE builds".

## Stdin feeder — PASS (plumbing)

The prompt is a plain `read -r _` on the **build.sh process's stdin**, which child and dependency builds inherit. The test used `tools/ce-drive.sh`, which runs `( loop: on trigger file, rm it, printf '\n' ) | ./build.sh ...`, with a watcher that touched the trigger 2 s after `press Enter` appeared in the log. The Enter was delivered: there was no "no Enter received" line, and the freshness re-check then died correctly because nothing had been built. Full usage is in ide-build-script.md.

## Library search paths — main clone hardcoded (finding)

`HKCU\Software\Embarcadero\BDS\23.0\Library\{Win32,Win64}`: **every** Keyman entry points at `C:\Github\keyman` (three spellings: `c:\Github\keyman\…`, `C:\Github\keyman\…`, `C:/Github/keyman/…`). The same values are mirrored into `%APPDATA%\Embarcadero\BDS\23.0\EnvOptions.proj` (DelphiLibraryPath, DelphiBrowsingPath).

- **Search Path (Win32 and Win64), 20 entries:** `common\windows\delphi\ext\{cef4delphi\source, dcpcrypt, jwa\Win32API, sentry}`, `developer\src\ext\{mbcolor, scfontcombobox}`, `developer\src\ext\jedi\jcl\jcl\source\{common, prototypes, vcl, windows, include}`, `developer\src\ext\jedi\jvcl\jvcl\{design, run, common, resources}`, `developer\src\ext\jedi\jedi`, `developer\src\ext\jedi`. On top of those are three duplicates in `C:/Github/keyman/common/windows/delphi/ext/{cef4delphi/source,dcpcrypt,jwa/Win32API}` form.
- **Browsing Path (Win32 and Win64):** the same set, in `C:\Github\keyman\…` and `C:/…` spellings.
- **Known Packages:** `C:/Github/keyman/common/windows/lib/common_components.bpl` and `C:/Github/keyman/windows/lib/keyman_components.bpl`. These are the main clone's design-time packages.
- **Process PATH** includes `/c/Github/keyman/windows/lib`, which windows.md says is needed so design-time packages load.
- **User env `KEYMAN_ROOT=c:\Github\keyman`.** `builder-basic.inc.sh:53-55` resets KEYMAN_ROOT from the script path, so build.sh runs are safe. But `devtools.exe` reads `KEYMAN_ROOT` itself (`SourceRootPath.CSourcePath`), so any devtools command run by hand, or from the IDE, targets the main clone unless KEYMAN_ROOT is exported first.

**What gets compiled from the main clone today:** no `.dproj` sets a unit search path for these directories (tike.dproj has no `DCC_UnitSearchPath`; keyman.dproj's points at a dead `c:\keyman\8.0` tree), and tike.dpr has no `in` clauses for JCL/JVCL/mbcolor. So the IDE resolves them **only** through the library path, which means the main clone. The main clone (`ef5991f6b5`, clean apart from skip-worktree files) **differs from A** in exactly the #16043 vendored files under test:
`jcl/source/common/JclSynch.pas`, `jedi/jedi.inc`, `jvcl/run/JvComponent.pas`, `mbcolor/mxs.inc`, `mbcolor/HTMLColors.pas`.
**A TIKE build from Worktree A with the current registry would silently compile the main clone's JCL/JVCL/mbcolor**, making B.4, B.7 (patch removal) and the JVCL-guard proof invalid. The `common/windows/delphi/ext/*` and `scfontcombobox` dirs are byte-identical between the main clone, A and B, so keyman.exe in B is not affected in practice.

**Does the stack's own build config override this?** No. `DELPHIINCLUDES` (`delphi_flags.inc.sh:8`, built from `$KEYMAN_ROOT`) only reaches the CLI `dcc32 -I/-U/-R` flags and `sentrytool -i`, and neither runs under CE. Also, several build.sh steps call `devtools -ai <worktree path>` (cef4delphi, dcpcrypt, jwa, mbcolor, scfontcombobox, jedi). `TIncludePaths.AddPathToIncludePath` **appends** and dedupes on exact string, so those worktree entries land **after** the main-clone ones, and the main clone still wins for the IDE. The same calls also **mutate the user's IDE registry and EnvOptions.proj** during the test, and `devtools -ip` adds Known Packages for worktree .bpls with the same names as the main-clone ones, which can cause an IDE package-load clash.

**Proposal (NOT applied):** close Delphi, back up the hive and EnvOptions.proj, then rewrite every `C:\Github\keyman\` prefix, in any slash or case form, to the worktree under test and restart Delphi. The script is in ide-build-script.md §0.2, along with the restore. Use A's root for the A phase. For the B phase, switching to B is cleanest; staying on A is defensible because the relevant dirs are byte-identical, but record the choice. Leave Known Packages alone and skip the `devtools -ip` post-steps; they are design-time only and not needed to compile.

## Preflight done (step 2)

Worktree A (331b0b3015):
- Generated env files (`resources/build/win/*_generated.inc.sh`) were created on the first build.sh run.
- Test certificates: the gitignored, generated `KeymanTest*.{cer,pfx,pvk}` files were copied from the main clone into `common/windows/delphi/tools/certificates/`. That avoids `certificates/build.sh`, which adds a root CA and raises a Windows GUI confirmation. The Keyman Test CA roots are already in the user Root store. `tsysinfo` needs them, through `tsysinfox64 publish` → `wrap-signcode`.
- `core/build.sh configure:x86 build:x86 --no-tests` → exit 0, `core/build/x86/debug/src/keymancore-2.dll`. TIKE's post-build copies it. Observation: meson's resource dependency scan prints `version.rc(2): fatal error C1083: ... keyman_core_api_version.h` but the build continues and links. This looks like a scan-only problem, with the same line in B's x86/x64/arm64 builds. logs/P-A-core-x86.out
- `npm ci` at the A root (needed for TIKE's `touch-layout-editor` `tsc` step) → exit 0. Side-effect: `git status` shows `M resources/gosh/gosh.js`. npm rewrote it (LF line endings/mode) at 10:37:53. The content diff is empty. I left it untouched.
- Each Delphi exe project's own build.sh was run with `KEYMAN_DELPHI_CE=1 ./build.sh build --no-deps </dev/null`. Each one runs all of its pre-build steps (version.res, manifest.res, other .rc, gentlb, xml copies), stops at its IDE prompt, and dies loudly. Results:
  - **Reached their prompt with pre-build complete:** keyman, kmcomapi (incl. `kbd_noicon.res` and `gentlb` → kmcomapi.tlb), insthelper, kmshell, kmconfig, insthelp, kmbrowserhost (desktop), kmconvert, kmdbrowserhost, developer setup, oskbulkrenderer, **tike** (after npm ci; logs/P-A-prebuild-developer_src_tike-rerun2.out).
  - **Blocked before the prompt, needing a Delphi-built tool first (expected):** tsysinfo needs tsysinfox64.exe (`mt.exe ... Failed to read the manifest ... windows\bin\engine\tsysinfox64.exe`); windows/src/desktop/setup needs `devtools.exe` (`-buildsetupstrings`).
  - The first TIKE attempt failed in `npm` with `IS_WSL: unbound variable`. That was my harness's fault: exporting `SHELLOPTS` for xtrace leaked `nounset` into npm's bash wrapper. The rerun without xtrace was clean.
- Not run because they need Delphi-built tools: devtools codegen (`-buildmessageconstants`, `-buildsetupstrings`), build_standards_data's 5 `.pas` files, the tsysinfox64 → .bin → `tsysinfo_x64.res` chain, and sentrytool post-steps. Their order is in ide-build-script.md.
- kmcmplib: TIKE does not compile against it. windows.md lists `kmcmplib-19.dll` as a **runtime** need for Developer, so it isn't needed for B.4's compile.

Worktree B (2d5bdf43bd):
- Env generated; test certificates copied the same way.
- `windows/src/engine/keyman32/build.sh configure build:x86 build:x64` (pulls in `@/core:win`) → exit 0. This produced `windows/bin/engine/keyman32.dll` (10:35:53) and `keyman64.dll` (10:35:57). **#16527's OSK code reads `KEYMAN_OSK_MODIFIER_FLAG_KEYMAN_INJECTED`, which only #16490's keyman32 sets** (`k32_visualkeyboardinterface.h`), so OSK tests need these DLLs overlaid alongside keyman.exe. logs/P-B-keyman32.out
- keyman.exe pre-build (`KEYMAN_DELPHI_CE=1 ./build.sh build --no-deps </dev/null`) generated version.res, manifest.xml, manifest.res, keymanmenuitem.res, icons.res, osktoolbar.res and langswitch/langswitchmanager.res, all gitignored. Then it stopped at the keyman.dproj prompt. logs/P-B-keyman-prebuild.out

## Step 3 — B uiAccess (local, uncommitted, throwaway branch)

```
$ git -C /c/Github/keyman-test-16462 diff --stat
 windows/src/engine/keyman/manifest.in | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
-				<requestedExecutionLevel level="asInvoker" uiAccess="true"/>
+				<requestedExecutionLevel level="asInvoker" uiAccess="false"/>
```
- The regenerated `manifest.xml` and `manifest.res` both contain `uiAccess="false"`. I checked with grep on the .res bytes.
- `keymanhp/manifesthp.in` is left at `uiAccess="true"`. keymanhp is C++, unchanged by B's diff, and not rebuilt, so the installed signed keymanhp.x64.exe stays in place.
- I chose a minimal edit over the CE guide §5 `debug-manifest` route because `debug-manifest.in` is **not** just uiAccess=false. It also drops DPI-awareness (`dpiAware=false`), the supportedOS compatibility GUIDs and the Common-Controls v6 dependency, any of which could change how the OSK renders. Doc finding: §5 says `./build.sh debug-manifest` "copies debug-manifest.in over manifest.in", but `do_build_debug_manifest` swaps the file and then restores it, so `manifest.in` is left unchanged. The guide's trade-off note also mentions only elevated-app injection.
- Final `git status` in B: `M windows/src/engine/keyman/manifest.in` and `?? core/subprojects/.wraplock` (meson lock, from the core build). In A: `M resources/gosh/gosh.js` (npm ci) and `?? core/subprojects/.wraplock`.
