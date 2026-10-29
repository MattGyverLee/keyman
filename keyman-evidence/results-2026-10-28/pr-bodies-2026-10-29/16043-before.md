## Summary

Lets the existing tree compile under Delphi 11 (`VER350`) and Delphi 12 (`VER360`) without breaking Delphi 10.3 (`VER330`). Lowers contributor friction on #4599. A future build-server bump to a paid Delphi 11/12 license would be an environment change, if/when a licence is available — no team member currently has a Delphi 12/13 paid licence (as of 2026-10-27), so Pro verification is not claimed here; see the team testing plan linked at the end of this body. **CI is unchanged**: with `KEYMAN_DELPHI_VERSION` unset, every build script keeps defaulting to Delphi 10.3 (BDS 20.0) exactly as before.

Split off from #16039 per @mcdurdin's review — that PR bundled the 11/12 compat work with the CE-specific build-chain workarounds. This PR is the compat half; the CE half is a separate PR.

## Why this is in scope for the Delphi removal roadmap

Delphi 10.3 Pro is no longer obtainable, and CE 10.3 has been removed from Embarcadero's downloads. Any future build-server bump or new contributor onboarding must go to Delphi 11/12. This PR makes that bump a pure environment change rather than a chase for compile errors in vendored third-party code.

## What's in the change

### 1. Build-script knob (CI-safe)

| File | Change |
| --- | --- |
| [`resources/build/win/configure_environment.inc.sh`](resources/build/win/configure_environment.inc.sh) | `DELPHI_VERSION` reads `\${KEYMAN_DELPHI_VERSION:-20.0}` |
| [`resources/build/win/delphi_environment.inc.sh`](resources/build/win/delphi_environment.inc.sh) | Same |
| [`resources/builder.inc.sh`](resources/builder.inc.sh) | `builder_describe_platform` delphi-tool probe also respects `KEYMAN_DELPHI_VERSION`. Without this, machines with only Delphi 12 installed had all `win,delphi`-gated targets silently skipped |

**Default unchanged.** CI doesn't set the var; nothing about the canonical 10.3 flow changes.

### 2. Delphi 11/12 source compat in Keyman-owned code

Five files under `common/windows/delphi/`. Every change is additive IFDEF arms for `VER350` / `VER360`; the `VER330` (10.3) paths are untouched. Each was hit by a real compile failure on Delphi 12; the patch is the minimum needed to keep the existing code shape on 10.3 while letting it compile on 11/12.

| File | Change | Why |
| --- | --- | --- |
| [`tools/devtools/SourceRootPath.pas`](common/windows/delphi/tools/devtools/SourceRootPath.pas) | Add VER350/VER360 -> `'22.0'`/`'23.0'` | `DelphiMajorVersion` needs to know the new BDS install dirs |
| [`web/Keyman.System.HttpServer.Base.pas`](common/windows/delphi/web/Keyman.System.HttpServer.Base.pas) | Extend the `IFNDEF VER330` tripwire to also accept VER340/350/360 | Existing comment says "may need to check this with updated versions of Delphi" — this is that check |
| [`components/FixedTrackbar.pas`](common/windows/delphi/components/FixedTrackbar.pas) | Same tripwire extension | Same pattern |
| [`general/CleartypeDrawCharacter.pas`](common/windows/delphi/general/CleartypeDrawCharacter.pas) | `EnumFontFamiliesEx` integer-return comparison on VER340/350/360 (was VER340-only) | The Win32 wrapper return type changed in 10.4+; existing guard only covered 10.4 |
| [`general/JsonUtil.pas`](common/windows/delphi/general/JsonUtil.pas) | Pass `[]` options arg to `TJSONAncestor.ToChars` on VER350/360 | Delphi 11+ added a required `Options` parameter |

### 3. Vendored third-party patches (please look here first)

WARNING: **This is the highest-risk piece of the PR.** Three files under `developer/src/ext/`. Each hunk is annotated with a `// Keyman local patch` comment plus a refresh strategy noting the upstream package and what to re-apply when those projects ship Delphi 12-compatible releases.

| File | Change | Why |
| --- | --- | --- |
| [`jedi/jcl/jcl/source/common/JclSynch.pas`](developer/src/ext/jedi/jcl/jcl/source/common/JclSynch.pas) | In `TJclMutex.Create` only: switch `JclWin32.CreateMutex` -> `Winapi.Windows.CreateMutex`, with the `Boolean` arg wrapped in explicit `BOOL()` | Delphi 12 tightened implicit Boolean->BOOL conversion at call sites. `BOOL()` is an ordinal-preserving typecast, equivalent to the implicit conversion 10.3 was doing — no runtime semantic change. The CreateMutex unit-resolution switch matches the file's existing pattern for the other Winapi calls |
| [`jedi/jvcl/jvcl/run/JvComponent.pas`](developer/src/ext/jedi/jvcl/jvcl/run/JvComponent.pas) | No local patch: the upstream JVCL guard `{$IFDEF HAS_PROPERTY_OLDCREATEORDER}` — enabled by a synced jedi.inc (see Why) | The earlier VER350/VER360 unconditional form is superseded. `jedi/jedi/jedi.inc` is synced from upstream project-jedi/jedi (commit `a094116`), which defines `HAS_PROPERTY_OLDCREATEORDER` for D5–D27 and undefines it from RTL350_UP (Delphi 11+), where Embarcadero removed the property — so the guard is active on Delphi 10.3 and earlier, inactive on Delphi 11/12, exactly as upstream intends. See `developer/src/ext/PATCHES.md` entry 2, now a sync, not a Keyman patch. A TIKE build on Delphi 12 CE with this tip (guard inactive, no E2003) is still the proof owed |
| [`mbcolor/mxs.inc`](developer/src/ext/mbcolor/mxs.inc) | Add VER350/VER360 blocks defining `DELPHI_5_UP` ... `DELPHI_10_UP` | Without these, `HTMLColors.pas` silently drops `Variants` from its `uses` clause and breaks with `"Undeclared identifier: 'null'"` |

### 4. .gitignore

Add patterns for per-arch `version*.res` and meson `wraplock` files. General build-output cleanup; not tied to either Delphi tier.

## Reviewer notes

* The vendored ext patches in section 3 are the only place real behaviour potentially shifts. The intent is no runtime change — every cast is value-preserving, and the JVCL entry is now upstream code enabled by a synced jedi.inc, not a Keyman invention (see the JVCL row above and PATCHES.md entry 2). The remaining Keyman-local vendored patches are JCL (CreateMutex) and mbcolor, both still removal-test-pending.
* Untouched on purpose: the compiler stack (`kmcmplib`, `kmc-*`, Keyman Core). Those are already Delphi-free per #4599 progress and aren't in this PR's blast radius.

## User Testing

User testing not required: build-environment / source-compat change with no runtime behaviour modification. CI will exercise the 10.3 default path.

## Relates-to

Relates-to: #4599
Replaces: #16039 (split into this PR + #16044)

---

## Testing plan — November revisit (added 2026-10-27, PR still closed)

Team testing plan for this stack, stored on the author's fork (not a fork issue, not part of the PR diff):
https://github.com/MattGyverLee/keyman/blob/evidence/8064-16462/keyman-evidence/team-testing-plan-2026-10-27.md

It covers the Delphi stack (#16043/#16044/#16191) and the 8064 stack (#16490/#16527): what changed since September, what the author will test on his own machine, what only the team can test (CI/manual build/user tests, Delphi licence decision, vendored patches), an honest proven/unverified table, and the still-open list. Evidence logs and drafts are on the same branch, indexed at:
https://github.com/MattGyverLee/keyman/blob/evidence/8064-16462/keyman-evidence/README.md

This link was added while the PR is closed; it does not reopen the PR, request review, or change the PR's code.


