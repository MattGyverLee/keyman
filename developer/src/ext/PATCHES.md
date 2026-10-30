# Vendored patches — Keyman-local changes to third-party code

This file is the only record of Keyman-local patches to the vendored
trees under `developer/src/ext/`, plus the vendored files that are
straight upstream syncs, not patches (entries 2 and 4). An upstream refresh of any of
these trees will silently lose the patches below unless they are
re-applied after the refresh. That is the failure this file exists
to prevent: a refresh that drops a patch is a build failure waiting
to happen — the Delphi 11/12 build breaks without them — not a
silent success.

Rule on refresh: re-apply exactly the patches listed here, in this
file, and nothing else, and re-sync the entry 2 and entry 4 files from
upstream instead of hand-editing them. Do not
re-add a patch that is not listed here; an unlisted patch was
either never made or was reverted deliberately after review.

Each entry names the file, the trigger (the build error it fixes),
the change, and its removal-test status. Removal test means: remove
the patch, run a clear Delphi 11/12 CE rebuild, and confirm the
build breaks in the way the trigger describes. A patch whose
removal does NOT break the build goes back on the speculative
list and is removed, not kept "just in case".

## 1. JCL — `jedi/jcl/jcl/source/common/JclSynch.pas` — REMOVED 2026-10-28, do not re-add

`JclSynch.pas` is back to the vendored upstream file. This entry is kept as the record of why.

- What it was: `TJclMutex.Create` routed through `Winapi.Windows.CreateMutex(…, BOOL(InitialOwner), …)`
  instead of `JclWin32.CreateMutex`. It was added for TIKE's
  `JclSynch.pas(1078): E2010 Incompatible types: 'Cardinal' and 'Boolean'` (July 2026; JEDI
  issue 6560, archived at
  https://web.archive.org/web/20240425060944/https://issuetracker.delphi-jedi.org/view.php?id=6560).
- Why it was removed: the error comes from the **search path**, not from Delphi 12 or JclSynch.
  There are two `JclWin32.pas`. `jcl/source/windows/JclWin32.pas` declares
  `CreateMutex(…; bInitialOwner: BOOL; …)`. `jcl/source/prototypes/JclWin32.pas` includes
  `win32api/WinBase.int`, which declares `bInitialOwner: DWORD` (an old WinNT4 workaround),
  and that is what rejects the Boolean. TIKE finds `JclWin32` through the IDE library
  search path. `developer/src/ext/jedi/build.sh` never registers `jcl/source/prototypes`. An
  earlier version of the CE guide (#16044) did, ahead of `windows`, so TIKE compiled the
  prototype and failed. A machine set up by the build scripts never needed this patch.
- Proof (2026-10-28, ltu-legion, Delphi 12 Athens CE, standalone TIKE IDE Build, fresh IDE
  session, obj emptied): CE-guide path + this patch → built; CE-guide path, unpatched →
  E2010 as above; CE-guide path minus `jcl/source/prototypes`, unpatched → built. Details on
  the evidence branch, `results-2026-10-28/jclsynch-root-cause.md`. The CE guide now reads
  its JEDI paths from `jedi/build.sh`, so `prototypes` is no longer registered.
- If this E2010 appears again: check the Delphi Search Path (Win32 and Win64) for
  `…\jcl\jcl\source\prototypes` and remove it. Do not re-add the patch.

## 2. JVCL + jedi.inc — SYNCED FROM UPSTREAM, NOT A KEYMAN PATCH

- What changed, 2026-10-27: `jedi/jedi/jedi.inc` was replaced
  with upstream project-jedi/jedi `jedi.inc` at commit
  `a09411655fb3aef7a095f8c2d10ab8535b277c95` (the repo JCL's
  own readme points to for jedi.inc; it is a submodule of
  upstream JCL, not part of the JCL repo itself). That file
  defines `HAS_PROPERTY_OLDCREATEORDER` for D5–D27 and
  undefines it from `RTL350_UP` (Delphi 11+), where
  Embarcadero removed the property. The `JvComponent.pas`
  guard `{$IFDEF HAS_PROPERTY_OLDCREATEORDER} if
  OldCreateOrder then DoCreate;` is byte-identical to
  upstream JVCL's guard (project-jedi/jvcl, HEAD `b045b99`),
  and now works exactly as upstream intends: active on
  Delphi 10.3 and earlier, inactive on Delphi 11/12, where
  the property does not exist. The earlier deep-scan open
  question — the guard was undefined in the old vendored
  jedi.inc, so it compiled to nothing — is resolved by this
  sync, not by a hand edit to either file.
- History, kept because it explains the earlier VER350 form:
  the original Keyman patch (VER350/VER360 → unconditional
  `DoCreate`) was motivated by a concrete Delphi 12 CE
  error in TIKE: `E2003 Undeclared identifier:
  'OldCreateOrder'` at the then-line 126, via
  `JvDockControlForm`. That form is superseded by the
  upstream guard + synced jedi.inc; do not restore it.
- What was NOT synced, deliberately: the full JCL and JVCL
  trees were not refreshed. Upstream JCL at HEAD still
  calls `JclWin32.CreateMutex` with a Boolean, which is fine
  against `source/windows/JclWin32.pas` (see entry 1, removed),
  and upstream JVCL HEAD carries unrelated
  changes (e.g. `FSearchTickCount: Int64`) that would
  enlarge this PR without a Delphi build in this VM to
  check them against. Sync only jedi.inc, which is the
  file the guard depends on.
- Verified 2026-10-28 on Delphi 12 Athens CE: TIKE builds (IDE Build, Success,
  no E2003 at `JvComponent.pas`) with this jedi.inc, **together with entry 4**.
  The synced jedi.inc on its own broke TIKE on 10.3 as well as 12: see entry 4.

## 3. mbcolor — `mbcolor/mxs.inc`

- Trigger: Delphi 11 (VER350) / Delphi 12 (VER360), vendored
  mbcolor. Without `DELPHI_*_UP` defines for VER350/VER360,
  `HTMLColors.pas` drops `uses Variants` and `Null` does not
  resolve, breaking the build.
- Change: define `DELPHI_5_UP` through `DELPHI_10_UP` under
  `{$ifdef VER350}` and under `{$ifdef VER360}`, matching the
  existing VER330 block.
- Removal test, 2026-10-28, ltu-legion, Delphi 12 Athens CE, IDE Build of TIKE without
  this patch: **breaks as described**, `HTMLColors.pas(290): E2003 Undeclared identifier:
  'null'`, then `mbColorPalette.pas(111): F2063`. **VERIFIED: needed.**

## 4. JCL + JVCL configuration for Delphi 10.3 and later — SYNCED FROM UPSTREAM, NOT A KEYMAN PATCH

- Why: entry 2's jedi.inc correctly defines `DELPHI26`/`BDS20` (10.3) … `DELPHI29`/`BDS23` (12).
  The old vendored JCL/JVCL only knew up to 10.2, so TIKE stopped, on 10.3 as well as 12, at
  `jvcl.inc(335)`, `JvConsts.pas(115)` and `jcl.inc(387)`, each `F1054 … not supported`.
- What changed, 2026-10-30:
  - Whole-file syncs, each the old vendored file plus upstream's per-version blocks (no line
    removed): `jedi/jcl/jcl/source/include/jcl.inc` from project-jedi/jcl `5ac00df9da`;
    `jedi/jvcl/jvcl/common/jvcl.inc` and `jedi/jvcl/jvcl/run/JvConsts.pas` from
    project-jedi/jvcl `b045b99e13`.
  - `jedi/jvcl/jvcl/common/jvcld26.inc` … `jvcld29.inc` and their `_x64` files, from
    project-jedi/jvcl `b045b99e13`. Upstream's copies are byte-identical to `jvcld25`.
  - `jedi/jcld26win32.inc` … `jcld29win64.inc`: copies of Keyman's `jcld25win32.inc`. Upstream
    JCL does not ship these; `jcl.inc` says the JCL installer creates them and that a manual
    installation copies and adjusts `jcl.template.inc`, which is how `jcld25*` were made.
- Effect: 10.3 and later compile with the same configuration as before (the 10.2 one), now
  selected by upstream's own blocks. `SDelphiKey` is now the right registry key per version.
- Verified 2026-10-30, Delphi 12 Athens CE: see the #16043 PR. 10.3 compile UNVERIFIED.
- On refresh: re-sync these files; add the next version's `jcld*` copy if upstream adds a block.

## 5. JCL — `jedi/jcl/jcl/source/windows/JclSvcCtrl.pas`

- Trigger: the JCL package (`packages/Jcl.dproj`, via `jedi/build.sh`) on Delphi 12 CE:
  `JclSvcCtrl.pas(529)` and `(1090): E2010 Incompatible types: 'LPENUM_SERVICE_STATUSW' and
  '_ENUM_SERVICE_STATUS…'`, then `Jcl.dpk(102): F2063`. Delphi 10.4 changed
  `EnumDependentServices` / `EnumServicesStatus` to take a pointer, and this code skipped the `^`
  dereference on **exactly** VER340, so 11 and 12, which also take a pointer, still
  dereferenced. TIKE does not use JclSvcCtrl, so only the package build hits it.
- Change: `{$IFNDEF VER340}^{$ENDIF}` → `{$IFNDEF RTL340_UP}^{$ENDIF}` at both call sites.
  10.3 and earlier still dereference, as before. These are upstream JCL's lines, from
  project-jedi/jcl `d1e64c6ca8` ("Introduce RAD Studio 10.4 support").
- Removal test, 2026-10-28, Delphi 12 Athens CE: without it, the IDE Build of Jcl.dproj fails as
  above. With it, Jcl.dproj (Debug, Win32) builds, Success. 10.3 compile UNVERIFIED.

## 6. JCL — `jedi/jcl/jcl/source/vcl/JclGraphUtils.pas`

- Trigger: the JclVcl package (`packages/JclVcl.dproj`, via `jedi/build.sh`) on Delphi 12 CE: 109
  errors, `JclGraphUtils.pas(1480…1716): E2251 Ambiguous overloaded call to 'Min'` / `'Max'`, then
  `JclVcl.dpk(43): F2063`. The unit uses both `System.Math` and `JclLogic`, and both declare
  overloaded `Min`/`Max` with identical signatures. The 18 unqualified clamps
  `Max(0, Min(255, Byte(x)))` are ambiguous on Delphi 12. (An `Integer(…)` cast does not help,
  and was tried.) The file's other calls are already written `JclLogic.Max(…)` / `JclLogic.Min(…)`.
- Change: qualify those 18 calls the same way: `JclLogic.Max(0, JclLogic.Min(255, Byte(x)))`. This
  selects JclLogic's `Byte` overload, and the results are unchanged. These are upstream JCL's
  lines, from project-jedi/jcl `b7776e318e` ("Support for Delphi 12").
- Removal test, 2026-10-29, Delphi 12 Athens CE: without it, JclVcl.dproj fails as above. With it,
  all six JEDI packages build (Debug, Win32) and `jedi/build.sh build` completes, exit 0. 10.3 compile
  UNVERIFIED.

## What is NOT patched

No other file under `developer/src/ext/` differs from what is described above. Entries 2 and 4
are upstream syncs, entries 5 and 6 are upstream JCL lines applied on their own, and entry 1
was removed, so the only Keyman-authored change to vendored code is entry 3 (mbcolor, which has
no live upstream and follows the VER330/VER340 blocks already there). If a diff on refresh shows
a change outside the entries above, it is either an upstream change to keep or a patch to
record here with its trigger and removal test — never a change to carry silently.
