# IDE build script for the orchestrator — 2026-10-28, ltu-legion

The CE workflow **is** meant to be driven as `KEYMAN_DELPHI_CE=1 ./build.sh build` with an IDE build at each prompt (CE guide §4). This script follows that, with a workaround for defect X1 (packages): see delphi-cli.md.

Worktree A = `C:\Github\keyman-test-delphi` @ 331b0b3015 (B.4 full clear rebuild incl. TIKE).
Worktree B = `C:\Github\keyman-test-16462` @ 2d5bdf43bd (+ local uiAccess edit; keyman.exe only).

## 0. Before opening Delphi

### 0.1 Shell setup (every Git Bash used for builds)
```bash
unset NoDefaultCurrentDirectoryInExePath
export KEYMAN_DELPHI_CE=1 KEYMAN_DELPHI_VERSION=23.0
echo "CE='$KEYMAN_DELPHI_CE' VER='$KEYMAN_DELPHI_VERSION' NDCD='${NoDefaultCurrentDirectoryInExePath-unset}'"
```
For any **hand-run** devtools command, also export `KEYMAN_ROOT=/c/Github/keyman-test-delphi` (or `-16462`). The user env has `KEYMAN_ROOT=c:\Github\keyman`, and devtools.exe reads it directly. build.sh resets it itself.

### 0.2 Library path: point the IDE at the worktree (PROPOSAL, needs a go-ahead; not applied)
Without this, TIKE in A compiles the **main clone's** JCL/JVCL/jedi.inc/mbcolor, which is wrong for exactly the #16043 files under test. Close Delphi first, then run in PowerShell:
```powershell
$bk = 'C:\Github\keyman-test-evidence\keyman-evidence\results-2026-10-28\bds23-backup'
New-Item -ItemType Directory -Force $bk | Out-Null
reg export 'HKCU\Software\Embarcadero\BDS\23.0' "$bk\bds23.reg" /y
Copy-Item "$env:APPDATA\Embarcadero\BDS\23.0\EnvOptions.proj" "$bk\EnvOptions.proj"

$target = 'C:\Github\keyman-test-delphi'           # use C:\Github\keyman-test-16462 for the B phase
$rx = '(?i)^c:[\\/]Github[\\/]keyman(?=[\\/])'      # does NOT match keyman-test-* (lookahead needs a slash)
foreach ($p in 'Win32','Win64') {
  $k = "HKCU:\Software\Embarcadero\BDS\23.0\Library\$p"
  foreach ($v in 'Search Path','Browsing Path') {
    $seen = @{}; $out = @()
    foreach ($e in ((Get-ItemProperty $k).$v -split ';')) {
      if ($e -match $rx) { $e = ($e -replace $rx, $target) -replace '/', '\' }
      if ($e -and -not $seen.ContainsKey($e.ToLower())) { $seen[$e.ToLower()] = 1; $out += $e }
    }
    Set-ItemProperty $k -Name $v -Value ($out -join ';')
  }
}
$f = "$env:APPDATA\Embarcadero\BDS\23.0\EnvOptions.proj"
(Get-Content $f -Raw) -replace '(?i)c:[\\/]Github[\\/]keyman(?=[\\/])', $target | Set-Content $f -NoNewline -Encoding UTF8
# verify: no entry left pointing at the main clone
foreach ($p in 'Win32','Win64') { (Get-ItemProperty "HKCU:\Software\Embarcadero\BDS\23.0\Library\$p").'Search Path' -split ';' | Select-String -Pattern 'keyman(?![-])' }
```
Restore afterwards (Delphi closed): `reg import "$bk\bds23.reg"`, then copy `$bk\EnvOptions.proj` back. Note that `reg import` overwrites values but does not remove values added during the test, such as Known Packages added by `devtools -ip`, which is one more reason to skip `-ip`.
Leave **Known Packages** (main-clone common_components.bpl / keyman_components.bpl) alone. They're design-time only.
If the go-ahead is **not** given, record B.4/B.7/TIKE as BLOCKED(library path points at main clone) rather than PASS.

### 0.3 Build-script orchestration (stdin)
The prompt is `read -r _` on build.sh's stdin. Child and dependency builds inherit it (verified). Use `tools/ce-drive.sh`:
```bash
T=/c/Github/keyman-test-evidence/keyman-evidence/results-2026-10-28/tools
export CE_TRIGGER=/tmp/ce.trigger CE_DONE=/tmp/ce.done      # any writable path
$T/ce-drive.sh <dir> <logfile> build [targets...] &        # runs KEYMAN_DELPHI_CE=1 ./build.sh in <dir>
# loop: wait until the count of "press Enter to continue" lines in <logfile> grows,
#       read the ".dproj (Platform: X, Config: Debug)" on that line, build it in the IDE,
#       verify the expected output file exists and is new, THEN: touch "$CE_TRIGGER"   (sends exactly one Enter)
# finish when "$CE_DONE" exists (holds build.sh exit code)
```
Never queue more than one Enter. A spare newline would be read by the **next** prompt before you build it, and that prompt would then (correctly) die. `printf '\n'` piped up front is only safe for single-prompt runs.

**IDE rules for every step:** open the `.dproj` by its **full worktree path** and check that the title bar or Project Manager shows `keyman-test-delphi` / `keyman-test-16462`, not `C:\Github\keyman`. Check Config = **Debug** and Platform = what the prompt says. Do right-click → **Clean**, then **Build**. This is a clear rebuild, and `.res` files changed. Use Shift+F9 for Build; F9 is Run.

## 1. Worktree A — B.4 full clear rebuild (incl. Tike.exe)

All paths below are relative to `/c/Github/keyman-test-delphi`. Already done on the CLI: env configured, certs, core x86, npm ci, and pre-build `.res` for all exe projects. These steps regenerate them anyway, which is harmless.

### A1. Common tools: all exe projects, expected to PASS normally
`ce-drive.sh common/windows/delphi/tools <log> build`
| # | Prompt (.dproj, platform) | Expected output to verify before Enter | Post-steps the script then runs |
|---|---|---|---|
| 1 | build_standards_data.dproj, Win32 | common/windows/delphi/tools/build_standards_data/bin/Win32/Debug/build_standards_data.exe | 5 codegen runs → common/windows/delphi/standards/Keyman.System.Standards.{ISO6393ToBCP47,BCP47SuppressScript,BCP47Subtag,LCIDToBCP47,LangTags}Registry.pas |
| 2 | buildunidata.dproj, Win32 | …/tools/buildunidata/bin/Win32/Debug/buildunidata.exe | — |
| 3 | devtools.dproj, Win32 | …/tools/devtools/bin/Win32/Debug/devtools.exe | — |
| 4 | sentrytool.dproj, Win32 | …/tools/sentrytool/bin/Win32/Debug/sentrytool.exe | — |
| 5 | test_klog.dproj, Win32 | …/tools/test-klog/bin/Win32/Debug/test_klog.exe | — |
| 6 | verify_signatures.dproj, Win32 | …/tools/verify_signatures/bin/Win32/Debug/verify_signatures.exe | — |
These steps also give the B.5 evidence: pre-build runs, then the prompt, then post-build (the codegen after #1). The expected exit is 0.
The `@/common/windows/delphi:keymanversion` dependency may relaunch; its prompts auto-skip once outputs are fresh.

**A1-verify = test item 6/E "fresh output auto-skips" (currently PENDING-IDE):**
```bash
cd /c/Github/keyman-test-delphi/common/windows/delphi/tools/devtools
KEYMAN_DELPHI_CE=1 KEYMAN_DELPHI_VERSION=23.0 ./build.sh build </dev/null; echo "exit=$?"
```
PASS = the log shows `devtools.dproj (Win32) — output is up-to-date, skipping prompt.`, **no** "Please build" line, `## build:project completed successfully`, exit 0. Repeat with `--no-deps`.

### A2. common_components (package): this is the X1 confirmation
`ce-drive.sh common/windows/delphi/components <log> build`
- Prompt: common_components.dproj, Win32. Expected output: **common/windows/lib/common_components.bpl** (+ .dcp).
- Expected result on 331b0b3015: **dies after Enter** even though the .bpl is fresh. That is the X1 FAIL; record the log.
- Skipped post-step: `devtools -ip common_components.bpl`. **Don't run it by hand.** It adds a Known Package that clashes with the main clone's.
- Also record: rerunning the same command re-prompts (no auto-skip for packages).

### A3. common ext
`ce-drive.sh common/windows/delphi/ext <log> build`
- Child order: cef4delphi, dcpcrypt, jwa, sentry, tds2dbg. cef4delphi first runs `devtools -ai <A>/…/cef4delphi/source`, which **writes to the IDE registry (append)**.
- Prompt: `packages/CEF4Delphi.dproj`, Win32. Output: **common/windows/lib/CEF4Delphi.bpl**. Expected: dies (X1).
- Then finish the rest: `ce-drive.sh common/windows/delphi/ext <log> build:dcpcrypt build:jwa build:sentry build:tds2dbg`. No Delphi prompts expected.
- Requires `KEYMAN_CEF4DELPHI_ROOT=c:\Github\CEF4Delphi_Binary` (set in the user env).

### A4. global Delphi (keyman_components + MessageIdentifierConsts)
`ce-drive.sh windows/src/global/delphi <log> build`
- Prompt: keyman_components.dproj, Win32. Output: **windows/lib/keyman_components.bpl**. Expected: dies (X1), before the message-identifiers target runs.
- Then: `ce-drive.sh windows/src/global/delphi <log> build:message-identifiers`. No prompt. Output: **windows/src/global/delphi/cust/MessageIdentifierConsts.pas**.

From here on, the `@/common/windows/delphi` and `@/windows/src/global/delphi` dependency builds skip the packages, because their declared outputs exist (builder.inc.sh:715).

### A5. Engine
`ce-drive.sh windows/src/engine <log> build:insthelper build:keyman build:keyman32 build:keymanmc build:keymanhp build:kmcomapi build:kmrefresh build:kmtip build:mcompile build:testhost build:tsysinfo build:tsysinfox64`
(`inst` is excluded because it's an installer and not in the Delphi scope. The C++ children build on the CLI with no prompt.)
| Prompt (in order) | Platform | Output to verify | Notes |
|---|---|---|---|
| insthelper.dproj | Win32 | windows/src/engine/insthelper/bin/Win32/Debug/insthelper.dll | not in engine.groupproj; open it on its own |
| keyman.dproj | Win32 | windows/src/engine/keyman/bin/Win32/Debug/keyman.exe | post: sentrytool, copy → windows/bin/engine/ |
| kmcomapi.dproj | **Win32** | windows/src/engine/kmcomapi/bin/Win32/Debug/kmcomapi.dll | |
| kmcomapi.dproj (2nd prompt) | **Win64**, switch the dropdown | windows/src/engine/kmcomapi/bin/Win64/Debug/kmcomapi.dll | post: renamed to kmcomapi.x64.dll |
| tsysinfox64.dproj (launched from tsysinfo via `tsysinfox64 publish`) | **Win64** | windows/src/engine/tsysinfox64/bin/Win64/Debug/tsysinfox64.exe | post: copy → windows/bin/engine, mt validate, **signcode (test certs, present)**, then tsysinfo copies it to tsysinfox64.bin → `rc tsysinfo_x64.rc` |
| tsysinfo.dproj | Win32 | windows/src/engine/tsysinfo/bin/Win32/Debug/tsysinfo.exe | needs tsysinfo_x64.res (produced just above) |
| (tsysinfox64 child) | — | auto-skip expected | second fresh-skip data point |

### A6. Desktop
`ce-drive.sh windows/src/desktop <log> build:kmbrowserhost build:kmconfig build:kmshell build:setup build:insthelp`
| Prompt | Platform | Output |
|---|---|---|
| kmbrowserhost.dproj | Win32 | windows/src/desktop/kmbrowserhost/bin/Win32/Debug/kmbrowserhost.exe |
| kmconfig.dproj | Win32 | windows/src/desktop/kmconfig/bin/Win32/Debug/kmconfig.exe |
| kmshell.dproj | Win32 | windows/src/desktop/kmshell/bin/Win32/Debug/kmshell.exe |
| setup.dproj (pre-build: `devtools -buildsetupstrings` → ~32 Keyman.Setup.System.Locale.*.pas) | Win32 | windows/src/desktop/setup/bin/Win32/Debug/setup.exe |
| insthelp.dproj | Win32 | windows/src/desktop/insthelp/bin/Win32/Debug/insthelp.exe |

### A7. TIKE: this is the B.4 headline; needs §0.2 applied
`ce-drive.sh developer/src/tike <log> build`
- Dependencies: common/include, core:x86 (already built: core/build/x86/debug/src/keymancore-2.dll), common/windows/delphi (skips).
- `build:touch-layout-editor` runs `tsc` with no prompt.
- Prompt: tike.dproj, Win32. Output: **developer/src/tike/bin/Win32/Debug/tike.exe**. Post: sentrytool, copy → developer/bin/, keymancore-2.dll copied alongside.
- Record: no E2003 at the old JvComponent line 126 via JvDockControlForm (the jedi.inc sync proof), and whether the IDE's Messages pane shows units compiled from `keyman-test-delphi\developer\src\ext\jedi\…` (Ctrl+click a JCL unit to confirm the path).

### A8. Rest of Developer (optional for B.4; packages die per X1)
- `ce-drive.sh developer/src/kmconvert <log> build`: kmconvert.dproj, Win32 → developer/src/kmconvert/bin/Win32/Debug/kmconvert.exe
- `ce-drive.sh developer/src/kmdbrowserhost <log> build`: kmdbrowserhost.dproj → …/bin/Win32/Debug/kmdbrowserhost.exe
- `ce-drive.sh developer/src/setup <log> build`: setup.dproj → developer/src/setup/bin/Win32/Debug/setup.exe
- `developer/src/ext/build.sh build` (browse4folder, jedi ×6, mbcolor, scFontCombo) and `developer/src/common/delphi/build.sh build` (developer_components) are all packages, so each dies after Enter (X1). These are not needed to compile TIKE, which compiles JCL/JVCL from source via the library path.

After A: `git -C /c/Github/keyman-test-delphi status --short` should show only `M resources/gosh/gosh.js` (npm) and `?? core/subprojects/.wraplock`; anything else is a .gitignore finding (E).

## 2. Worktree B — keyman.exe with the OSK fix

Already done on the CLI: env, certs, keyman32.dll + keyman64.dll (`windows/bin/engine/`), and keyman pre-build `.res` with the **uiAccess="false"** manifest.res.

B1. Make tools available. They are gitignored, and the tool sources are identical in A and B. After A1:
```bash
for t in devtools sentrytool; do mkdir -p /c/Github/keyman-test-16462/common/windows/delphi/tools/$t/bin/Win32/Debug
  cp /c/Github/keyman-test-delphi/common/windows/delphi/tools/$t/bin/Win32/Debug/$t.exe /c/Github/keyman-test-16462/common/windows/delphi/tools/$t/bin/Win32/Debug/; done
```
B2. `cd /c/Github/keyman-test-16462/windows/src/global/delphi && KEYMAN_DELPHI_CE=1 ./build.sh build:message-identifiers --no-deps`. Output: windows/src/global/delphi/cust/MessageIdentifierConsts.pas. Use `--no-deps` so the common tools and packages are not rebuilt in B.
B3. Library path: re-run §0.2 with `$target='C:\Github\keyman-test-16462'` (recommended), or keep A's paths and record that. The ext dirs keyman.exe uses are byte-identical across main, A and B. Restart Delphi either way.
B4. `ce-drive.sh /c/Github/keyman-test-16462/windows/src/engine/keyman <log> build --no-deps`
- Pre-build regenerates manifest.res from the edited manifest.in (uiAccess=false). **Don't** pass `--debug-manifest`.
- Prompt: keyman.dproj, Win32. In the IDE, open **C:\Github\keyman-test-16462\windows\src\engine\keyman\keyman.dproj**, Debug/Win32, **Clean then Build**. Clean is mandatory because manifest.res changed and an incremental build keeps the stale .res.
- Output: C:\Github\keyman-test-16462\windows\src\engine\keyman\bin\Win32\Debug\keyman.exe, newer than every `viskbd\*.pas`. Freshness only checks the .dpr, so check this by eye.
- After Enter: sentrytool delphiprep, copy → windows/bin/engine/keyman.exe, and sentry dlls/crashpad copied alongside.
B5. Verify the embedded manifest:
```bash
cd /c/Github/keyman-test-16462/windows/bin/engine
"$(ls -d '/c/Program Files (x86)/Windows Kits/10/bin/'10.*/x64 | tail -1)/mt.exe" -nologo -inputresource:keyman.exe -out:/tmp/k.manifest && grep -o 'uiAccess="[a-z]*"' /tmp/k.manifest   # expect uiAccess="false"
```
B6. The overlay (elevated, not done here) needs **keyman.exe + keyman32.dll + keyman64.dll** from `C:\Github\keyman-test-16462\windows\bin\engine\`. The OSK fix reads a flag that only the new keyman32 sets. Leave the installed signed keymanhp.x64.exe alone (manifesthp.in is still uiAccess=true and not rebuilt).
B7. Undo afterwards: `git -C /c/Github/keyman-test-16462 checkout -- windows/src/engine/keyman/manifest.in`, and restore the IDE registry per §0.2.
