# JclSynch E2010: root cause found. The CE guide's search path causes it, not Delphi 12

2026-10-28, ltu-legion, Delphi 12 Athens CE (BDS 23.0). Tree `C:\Github\keyman-test-merge2` @ a4922794f1
(its code is identical to today's pushed tips; the later commits only touch PATCHES.md).

## The question
In July, Marc (`@mcdurdin`) built Keyman on Delphi 12 with an **unmodified** `JclSynch.pas` and it compiled
(revert 69c52bd36e). Days later the same unmodified file broke TIKE on this machine with
`JclSynch.pas(1078): E2010 Incompatible types: 'Cardinal' and 'Boolean'` (678a6b0258). The patch went back in
(today: `TJclMutex.Create` routed through `Winapi.Windows.CreateMutex`). Why did one machine need it and
the other not?

## Answer
**There are two `JclWin32.pas` in the vendored JCL, and the library search path decides which one TIKE compiles.**

| File | `CreateMutex` 2nd parameter | Who compiles it |
|---|---|---|
| `jcl/jcl/source/windows/JclWin32.pas` | `bInitialOwner: BOOL` | `packages/Jcl.dpk` (names it explicitly), and TIKE when `prototypes` is *not* on the search path |
| `jcl/jcl/source/prototypes/JclWin32.pas` → `{$I win32api\WinBase.int}` (line 103) | `bInitialOwner: DWORD` (the 1999 WinNT4 "declare it as a LongInt" workaround in the comment above it) | TIKE, **when `jcl\source\prototypes` comes before `jcl\source\windows` on the search path** |

Unpatched JclSynch calls `JclWin32.CreateMutex(SecAttr, InitialOwner, …)` with a `Boolean`. Against the
`BOOL` declaration that compiles. Against the `DWORD` one it gives E2010 'Cardinal' and 'Boolean'.

**Upstream Keyman never puts `prototypes` on the path.** `developer/src/ext/jedi/build.sh` registers
`jcl/source/{common,include,vcl,windows}` (plus jvcl common/resources/run, `jedi`, `packages`).
**The CE guide (#16044, `docs/build/windows-delphi-ce.md` §3) adds `jcl/source/prototypes`**. It also adds
`jvcl/design` and `jedi/jedi`, omits `packages`, and wrongly says these paths have "no build-side equivalent".
A machine set up by Keyman's build scripts, like Marc's long-lived one, resolves `JclWin32` to `windows/`
(`BOOL`), so it never needed the patch. A machine set up from the CE guide, like this one, resolves it to
`prototypes/` (`DWORD`), so it does. The July search-path backup on this machine already lists
`…\jcl\jcl\source\prototypes`.

**JclWin32.pas has not changed since 2022, and Delphi 12 is not stricter here.** What decides the result
is the search path, not the code and not the compiler version.

## The three controlled runs (same procedure for all three)
Each run: a fresh IDE session with only `developer/src/tike/tike.dproj` open, TIKE's
`obj\Win32\Debug\*.dcu` deleted first so every unit compiles from source, then an IDE Build. A compiled
`JclWin32.dcu` that records `WinBase.int` was built from the prototypes copy. Script:
`tools/b7-jclsynch-controlled.ps1`; for run C, `tools/b7-without-prototypes.ps1`.

| Run | Search path | JclSynch.pas | JclWin32 compiled from | Result | Evidence |
|---|---|---|---|---|---|
| **A** 16:14:57 | CE guide (`prototypes` before `windows`) | patched (RTL route) | prototypes (WinBase.int: yes) | **BUILT**, 522 units | `logs/jclsynch-root-cause/run-A-guide-path-patched.txt`, `b7-controlled-patched-161520.png` |
| **B** 16:15:43 | CE guide | **unpatched** (`JclWin32.CreateMutex(SecAttr, InitialOwner, …)` verified in place) | prototypes (WinBase.int: yes) | **FAIL**, 83 units: `JclSynch.pas(1078): E2010 Incompatible types: 'Cardinal' and 'Boolean'`, `JclSysUtils.pas(3124): F2063` (the July error, exactly) | `logs/jclsynch-root-cause/run-B-guide-path-unpatched.txt`, `b7-controlled-unpatched-161612.png` |
| **C** 16:16:39 | CE guide **minus `jcl\source\prototypes`** (the only change) | **unpatched** (verified) | **windows** (WinBase.int: no) | **BUILT**, 522 units | `logs/jclsynch-root-cause/run-C-no-prototypes-unpatched.txt`, `b7-controlled-unpatched-161659.png` |

The same three outcomes were seen in a first series at 16:05/16:07/16:13 (logs overwritten; this series replaces it).

- **The bug is reproduced (B), the fix is reproduced (A), and Marc's case is reproduced (C).** Each pair
  differs in one variable.
- Run C changed the Win32 and Win64 registry Search Path and `EnvOptions.proj`, and restored them
  byte-for-byte afterwards (checked: identical=True for all three).
- Not verified on Marc's machine itself. The explanation fits his result and upstream's scripts. To
  confirm, check whether his Delphi Search Path contains `…\jcl\jcl\source\prototypes`. We expect it doesn't.

## Correction to today's earlier record
At 15:42 I reported "JclSynch not needed". That run was invalid: `cmd` treats `^` as an escape
character, so `git show fd04ceda6c^:…` read `fd04ceda6c`, the **patched** file. The scripts now use `~1`
and refuse to build unless the unpatched call is verified in place. PATCHES.md entry 1 was corrected
(8a5d561b5a).

## What this means for the stack (recommendation; Matthew's call)
1. **Fix the CE guide §3 path list (#16044)** to register exactly what upstream's build scripts register:
   drop `jcl/source/prototypes` (and `jvcl/design`, `jedi/jedi`, which upstream doesn't register either),
   add `packages`, and remove the "no build-side equivalent" claim. Better still, have the guide run the
   existing `build.sh configure` steps, which do the `devtools -ai` calls, instead of keeping a second list.
2. **Then the JclSynch patch (#16043, PATCHES.md entry 1) is unnecessary.** It was compensating for (1).
   PATCHES.md's own rule says a patch whose removal does not break the documented build is removed.
   Keeping it is harmless (it makes JclSynch work with either `JclWin32`), but it would be kept for a
   reason that no longer applies.
3. Anyone already set up from the current guide should remove `…\jcl\jcl\source\prototypes` from their
   Delphi Search Path (Win32 and Win64).

## Resolution — applied 2026-10-28 16:20–16:45 (Matthew: "make it so"), pushed

- **#16044 CE guide §3** (commit "CE guide registers the JEDI paths jedi/build.sh registers"): the hand list is
  gone. The guide now reads the nine JEDI paths from the `devtools -ai` calls in
  `developer/src/ext/jedi/build.sh`, as it already did for `DELPHIINCLUDES`, and warns against adding
  `jcl/source/prototypes`. Result: `prototypes`, `jvcl/design` and `jedi/jedi` are removed, and `packages`
  is added. `tools/set-delphi-dev-paths.ps1` now derives its list the same way (15 paths per platform;
  0 prototypes).
- **#16043 JclSynch patch removed**: `JclSynch.pas` is byte-identical to the fork base again. PATCHES.md
  entry 1 is kept as the removal record ("do not re-add; if E2010 reappears, check the Search Path for
  prototypes").
- **Run D, verification of the final state** (`logs/jclsynch-root-cause/run-D-final-tree-new-guide-paths.txt`):
  the tree has unpatched JclSynch, the search path comes from the corrected guide, fresh IDE session, obj
  emptied. **TIKE BUILT**, 522 units, JclWin32 compiled from `windows/` (WinBase.int: no).
- Pushed tips: #16043 **4f42a2c9f3**, #16044 **e11f229f53**, #16191 **e73e8a1290** (with the two fixes below).

## Found while checking the JEDI packages with the new paths (`developer/src/ext/jedi/build.sh`)

The guide change dropped `jvcl/design`, so I built the six JCL/JVCL packages. These packages had
never been built on Delphi 12 in this stack, because TIKE compiles JCL/JVCL from source.
1. **`Jcl.dproj`** failed: `JclSvcCtrl.pas(529)/(1090): E2010 'LPENUM_SERVICE_STATUSW' and '_ENUM_SERVICE_STATUS…'`.
   The code dereferenced on every compiler except exactly VER340, but 11 and 12 take a pointer too.
   **Fixed** (#16043, PATCHES.md entry 5, `RTL340_UP`). **PASS:** Jcl.dproj Debug Win32 builds.
   The search path is not involved: Jcl.dpk names the file.
2. **CE post-prompt check (fix 1)** rejected the correct Debug `Jcl.bpl`. Jcl/JclVcl set `DCC_BplOutput` for
   Release only, so a Debug build lands in `$(BDSCOMMONDIR)\Bpl`. **Fixed** (#16044: packages also accept
   that folder; a candidate must still be newer than the prompt). **PASS:** the prompt accepted Jcl.bpl.
3. **`JclVcl.dproj` fails with 109 errors**: `JclGraphUtils.pas(1712…): E2251 Ambiguous overloaded call to
   'Min'/'Max'`, then `JclVcl.dpk(43): F2063`. These are Delphi 12 RTL overloads that the 10.2-era JCL
   cannot disambiguate. **NOT fixed. Waiting for Matthew's ruling** on whether the JEDI packages must build
   on Delphi 12. They are needed for the IDE form designer, through the `devtools -ip` design packages,
   but not to compile TIKE.
   JvCore, JvCoreDesign, JvDocking and JvDockingDesign are **UNVERIFIED** (not reached).

## Update 2026-10-29 — should the JEDI packages build? Yes; they now do on Delphi 12

- **They are part of the normal 10.3 build.** Upstream `developer/src/build.sh` has the child `:ext`
  (win,delphi), and `developer/src/ext/build.sh` runs `:browse4folder :jedi :mbcolor :scfontcombobox`.
  `jedi/build.sh build` compiles Jcl, JclVcl, JvCore, JvCoreDesign, JvDocking and JvDockingDesign, then
  `devtools -ip` installs the two design packages into the IDE (needed by the form designer for TIKE's
  docking forms; TIKE itself compiles JCL/JVCL from source). Delphi 12 should match.
- **JclVcl fixed** (#16043, PATCHES.md entry 6): `JclGraphUtils.pas` uses both `System.Math` and `JclLogic`,
  which declare `Min`/`Max` overloads with identical signatures, so on Delphi 12 the 18 unqualified
  `Max(0, Min(255, Byte(x)))` were ambiguous (E2251 ×109). They are now qualified `JclLogic.Max/Min`, as
  the file already does elsewhere. A first attempt with an `Integer(…)` cast did not fix it: it hit the
  same 109 errors.
- **PASS:** `developer/src/ext/jedi/build.sh build` ran, with all six packages built in the IDE in Debug
  (09:30–09:38), the two design packages installed, and **exit 0**. Log: `logs/M-J3-jedi-packages.*`.
  This also confirms that dropping `jvcl/design` from the search path is fine.
- **Design packages would not load at IDE start-up**: `Can't load package …\developer\lib\JvCoreDesign.bpl.
  The specified module could not be found.` `JvCore.bpl` beside it is found only through PATH, and
  `windows.md` asks for `windows\lib` on PATH but never `developer\lib`. **CE guide updated** (#16044):
  put both on PATH, with a troubleshooting entry. The driver's IDE launcher now adds
  `developer\lib` for its own process. **PASS:** relaunched IDE showed no load error, and a clean TIKE
  build gave Success, 522 units (`logs/jclsynch-root-cause/run-E-…`). TIKE does not compile JclGraphUtils.
- Pushed: #16043 **dcefa58340**, #16044 **d0bc028801**, #16191 **22512237d6** (the #16191 layer patch-id is
  unchanged, 15d4bd60644b). test2 a1a8cf91a5.
