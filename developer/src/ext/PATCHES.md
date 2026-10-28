# Vendored patches — Keyman-local changes to third-party code

This file is the only record of Keyman-local patches to the vendored
trees under `developer/src/ext/`. An upstream refresh of any of these
trees will silently lose the patches below unless they are re-applied
after the refresh. That is the failure this file exists to prevent:
a refresh that drops a patch is a build failure waiting to happen —
the Delphi 11/12 build breaks without them — not a silent success.

Rule on refresh: re-apply exactly the patches listed here, in this
file, and nothing else. Do not re-add a patch that is not listed
here; an unlisted patch was either never made or was reverted
deliberately after review.

Each entry names the file, the trigger (the build error it fixes),
the change, and its removal-test status. Removal test means: remove
the patch, run a clear Delphi 11/12 CE rebuild, and confirm the
build breaks in the way the trigger describes. A patch whose
removal does NOT break the build goes back on the speculative
list and is removed, not kept "just in case".

## 1. JCL — `jedi/jcl/jcl/source/common/JclSynch.pas`

- Trigger: Delphi 12, source-compiled JCL. `JclWin32.CreateMutex`
  is an external declaration with a BOOL parameter; Delphi 12
  rejects Boolean → BOOL there (E2010). Only bites when JCL is
  built from source.
- Change: in `TJclMutex.Create`, route via the RTL
  (`Winapi.Windows.CreateMutex`, with `BOOL(InitialOwner)`),
  like `OpenMutex` below it, instead of `JclWin32.CreateMutex`.
- Removal test: PENDING — run test-list item 8 on the #16043
  tip (clear Delphi 12 CE rebuild with this patch removed)
  and record the result here (date, machine, error seen).
  Do not mark this entry "verified" until that run is recorded.

## 2. JVCL — `jedi/jvcl/jvcl/run/JvComponent.pas`

- Trigger: Delphi 11/12, `OldCreateOrder` property handling in
  `TJvComponent` creation. History, because it matters here:
  the original patch (VER350/VER360 → unconditional `DoCreate`,
  else `if OldCreateOrder then DoCreate`) was motivated by a
  concrete Delphi 12 CE error in TIKE: `E2003 Undeclared
  identifier: 'OldCreateOrder'` at the then-line 126, via
  `JvDockControlForm`. It was later replaced with the upstream
  guard `{$IFDEF HAS_PROPERTY_OLDCREATEORDER}`.
- Change as written: call `DoCreate` when `OldCreateOrder` is
  true, guarded by `{$IFDEF HAS_PROPERTY_OLDCREATEORDER}`.
- OPEN QUESTION, flagged by a deep scan 2026-10-27, do not
  gloss over it: that conditional is defined nowhere in this
  tree's `jedi.inc` (unlike `HAS_PROPERTY_STYLEELEMENTS`, which
  has a definition there), so as written this block compiles
  to nothing on every Delphi version here. The PR body still
  describes the earlier VER350/VER360 unconditional form —
  that body text is stale and must be corrected (see the
  body, not this file, for the correction). Three outcomes
  are possible, and the TIKE build + removal test decide
  between them, not this file: (a) define the conditional
  in `jedi.inc` for the versions where the property exists,
  (b) restore the VER350/VER360 form, or (c) delete the
  patch entirely if TIKE builds on Delphi 12 CE without it
  (dead code compiles to nothing, so deleting it cannot
  break a build that currently passes with it in place).
- Removal test: PENDING — same procedure as entry 1, PLUS a
  TIKE build on Delphi 12 CE with and without this block.
  Record both runs here. Do not mark "verified" until those
  runs are recorded, and do not keep this entry on the
  strength of the earlier VER350 history alone: that history
  describes a different form of the patch than the one in
  the tree now.

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
patch as of the #16043 tip. If a diff on refresh shows a change
outside the three entries above, it is either an upstream change
to keep or a patch to record here with its trigger and removal
test — never a change to carry silently.
