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
- Removal test: PENDING — run test-list item 8 on the #16043
  tip (clear Delphi 12 CE rebuild with this patch removed)
  and record the result here (date, machine, error seen).
  Do not mark this entry "verified" until that run is recorded.

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
- Verification still owed: a TIKE build on Delphi 12 CE
  with this tip (guard inactive, no E2003) — that is the
  test that proves the sync, not a removal test of a
  patch that no longer exists as a Keyman patch. Record
  it here when run; until then this entry is SYNCED, not
  VERIFIED on Delphi 12 CE.

## 3. mbcolor — `mbcolor/mxs.inc`

- Trigger: Delphi 11 (VER350) / Delphi 12 (VER360), vendored
  mbcolor. Without `DELPHI_*_UP` defines for VER350/VER360,
  `HTMLColors.pas` drops `uses Variants` and `Null` does not
  resolve, breaking the build.
- Change: define `DELPHI_5_UP` through `DELPHI_10_UP` under
  `{$ifdef VER350}` and under `{$ifdef VER360}`, matching the
  existing VER330 block.
- Removal test: PENDING — same procedure as entry 1, record
  here. Do not mark "verified" until that run is recorded.

## What is NOT patched

No other file under `developer/src/ext/` carries a Keyman-local
patch as of the #16043 tip — the JVCL entry above is a sync,
not a patch, so the Keyman-local patches are entries 1 and 3
only. If a diff on refresh shows a change outside the entries
above, it is either an upstream change to keep or a patch to
record here with its trigger and removal test — never a change
to carry silently.
