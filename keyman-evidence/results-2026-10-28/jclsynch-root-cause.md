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
