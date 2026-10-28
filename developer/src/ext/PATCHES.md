# Vendored patches — Keyman-local changes to third-party code

This file is the only record of Keyman-local patches to the vendored
trees under `developer/src/ext/`, plus the one vendored file that is
a straight upstream sync, not a patch. An upstream refresh of any of
these trees will silently lose the patches below unless they are
re-applied after the refresh. That is the failure this file exists
to prevent: a refresh that drops a patch is a build failure waiting
to happen — the Delphi 11/12 build breaks without them — not a
silent success.

Rule on refresh: re-apply exactly the patches listed here, in this
file, and nothing else, and re-sync `jedi/jedi/jedi.inc` from
project-jedi/jedi (entry 2) instead of hand-editing it. Do not
re-add a patch that is not listed here; an unlisted patch was
either never made or was reverted deliberately after review.

Each entry names the file, the trigger (the build error it fixes),
the change, and its removal-test status. Removal test means: remove
the patch, run a clear Delphi 11/12 CE rebuild, and confirm the
build breaks in the way the trigger describes. A patch whose
removal does NOT break the build goes back on the speculative
list and is removed, not kept "just in case".

## 1. JCL — `jedi/jcl/jcl/source/common/JclSynch.pas`

- Trigger: source-compiled JCL, fuller dependency graph. The
  `JclWin32.CreateMutex` call fails with E2010
  'Cardinal'/'Boolean'. External reference: JEDI issue 6560
  (archived at
  https://web.archive.org/web/20240425060944/https://issuetracker.delphi-jedi.org/view.php?id=6560),
  reported 2017, 2019, and again on TIKE in 2026 — so this is
  not Delphi-12-specific, and not a claim that Delphi 12
  rejects Boolean → BOOL as such. Only bites when JCL is
  built from source.
- Change: in `TJclMutex.Create`, route via the RTL
  (`Winapi.Windows.CreateMutex`, with `BOOL(InitialOwner)`),
  like `OpenMutex` below it, instead of `JclWin32.CreateMutex`.
- Removal test, 2026-10-28, ltu-legion, Delphi 12 Athens CE: **needed.** A standalone TIKE
  IDE Build (fresh IDE session, TIKE's obj emptied) with the unpatched call fails exactly as
  in July: `JclSynch.pas(1078): E2010 Incompatible types: 'Cardinal' and 'Boolean'`, then
  `JclSysUtils.pas(3124): F2063`. (An earlier run that day reported "not needed": that
  test had built the patched file by mistake, so disregard it.)
- Root cause (proven 2026-10-28 by three controlled TIKE builds; see the evidence branch,
  `results-2026-10-28/jclsynch-root-cause.md`): there are two `JclWin32.pas`.
  `jcl/source/windows/JclWin32.pas` declares `bInitialOwner: BOOL`.
  `jcl/source/prototypes/JclWin32.pas` includes `win32api/WinBase.int`, which declares
  `bInitialOwner: DWORD` (the old WinNT4 LongInt workaround), and that is what rejects the
  Boolean. TIKE finds `JclWin32` through the library search path. Upstream
  `developer/src/ext/jedi/build.sh` never registers `jcl/source/prototypes`, so a machine set
  up by the build scripts compiles the `windows/` copy and needs no patch (Marc's July result).
  The CE guide's path list (#16044) adds `jcl/source/prototypes` before `windows`, and with
  that path TIKE compiles the prototype and fails. With only that path removed, unpatched
  TIKE builds. So this patch compensates for the CE guide's path list. Once the guide
  registers what upstream registers, it can be removed (Matthew's decision).

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
  calls `JclWin32.CreateMutex` with a Boolean (entry 1's
  trigger is unchanged upstream), so a JCL sync would not
  remove entry 1, and upstream JVCL HEAD carries unrelated
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

## 4. JCL + JVCL configuration for Delphi 10.3 and later — needed by entry 2's jedi.inc

- Trigger: TIKE on Delphi 12 CE, after the entry 2 sync. The vendored JCL/JVCL
  predate Delphi 10.3 and only know up to 10.2. The old vendored jedi.inc hid that:
  its `UNKNOWN_COMPILER_VERSION` fallback defined `DELPHI25`/`BDS19` (10.2) for
  **every** newer compiler, 10.3 included. The upstream jedi.inc correctly defines
  `DELPHI26`/`BDS20` (10.3) … `DELPHI29`/`BDS23` (12), so the build stopped at, in order:
  - `jvcl.inc(335): F1054 Your Delphi/BCB version is not supported by this JVCL version!`
  - `JvConsts.pas(115): F1054 Declaration for SDelphiKey is missing`
  - `jcl.inc(387): F1054 Your Delphi/BCB version is not supported by this JCL version!`
  These hit 10.3 too (it gets `DELPHI26`/`BDS20` now), so without this entry the
  sync breaks the 10.3 build chain.
- Change:
  - `jedi/jvcl/jvcl/common/jvcl.inc`: `{$IFDEF DELPHI26_UP}` uses `jvcld25.inc` /
    `jvcld25_x64.inc` and defines `JVCL_CONFIGURED`.
  - `jedi/jcl/jcl/source/include/jcl.inc`: `{$IFDEF BDS20_UP}` uses
    `jcld25win32.inc` / `jcld25win64.inc` and defines `JCL_CONFIGURED`.
  - `jedi/jvcl/jvcl/run/JvConsts.pas`: `SDelphiKey` for `DELPHI26`..`DELPHI29`
    (`BDS\20.0`..`BDS\23.0`, the real registry keys; the old fallback gave
    `BDS\19.0` to every newer compiler). Delphi 13+ still hits the FATAL.
  The two config patches give 10.3 and later exactly the JCL/JVCL configuration they
  had before the sync (the 10.2 one). The only behavioural change is the SDelphiKey
  value, now correct.
- Removal test: each patch was added because the TIKE build failed at its line,
  in the order above, on Delphi 12 CE. The 10.3 compile is UNVERIFIED (no 10.3 here).
- On refresh: an upstream JCL/JVCL refresh that knows 10.3+ makes this entry
  unnecessary. Remove it then, not before.

## What is NOT patched

No other file under `developer/src/ext/` carries a Keyman-local
patch as of the #16043 tip — the JVCL entry above is a sync,
not a patch, so the Keyman-local patches are entries 1 and 3
only. If a diff on refresh shows a change outside the entries
above, it is either an upstream change to keep or a patch to
record here with its trigger and removal test — never a change
to carry silently.
