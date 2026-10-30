## Summary

Lets developers on the free **Delphi Community Edition** tier build the still-Delphi parts of the tree, even though CE 11+ deliberately blocks the `dcc32` CLI that `build.sh` normally drives. None of the compiler / runtime stack moves; this is purely build-environment work plus docs.

**CI is unchanged.** `KEYMAN_DELPHI_CE` is unset by default, so `build.sh` keeps invoking `msbuild.exe` exactly as before.

Split off from #16039 per @mcdurdin's review — that PR bundled the CE workflow with the Delphi 11/12 source-compat patches. This PR is the CE half; the compat half is #16043.

Depends on #16043 for the source-compat patches and the `KEYMAN_DELPHI_VERSION` knob that lets the IDE find Delphi 11/12.

## Why this matters for the Delphi removal roadmap

Delphi 10.3 Pro is no longer obtainable, and CE 10.3 has been removed from Embarcadero's downloads. New contributors who want to help finish #4599 currently hit a wall: they can install CE 12, but CE blocks `dcc32` and `build.sh` falls over before reaching any Delphi project. This PR fixes the wall — without committing to keep Delphi alive.

## What's in the change

### 1. CE-aware `delphi_msbuild`

`resources/build/win/environment.inc.sh`: `delphi_msbuild()` now checks `KEYMAN_DELPHI_CE`. When `=1`, it prints an IDE-build prompt naming the `.dproj` and waits for Enter instead of invoking `msbuild.exe`. The pre-build (rc.exe, manifest gen) and post-build (binary copy, codegen) steps in `build.sh` run normally around the prompt, so the developer only has to drive the Delphi compile by hand.

**Auto-skip for output built in this run.** The prompt is skipped when the project's output, at the path its `.dproj` really writes (`DCC_ExeOutput` for an `.exe`/`.dll`, `DCC_BplOutput` for a package), is newer than a session marker created when the outermost `build.sh` starts and shared with every nested and dependency `build.sh`. Output from an earlier run, or an IDE build done before the script started, is never trusted.

This is the approach @mcdurdin proposed in [#16039 (comment)](https://github.com/keymanapp/keyman/pull/16039#issuecomment-4590110414) — gate by version in the existing shell script rather than parallel PowerShell helpers. (Failing the build when the IDE did not build the project is #16191.)

### 2. The two-build route: `resources/build/win/delphi-ce-build.sh`

```bash
export KEYMAN_DELPHI_CE=1
resources/build/win/delphi-ce-build.sh windows/src developer/src
```

Runs the same `build.sh` scripts, in the same order as CI, and collects their Delphi compiles into one generated project group, so the IDE work is one build per wave instead of one prompt per project:

1. **Prepare, wave 1** (unattended): the tool scripts run their pre-steps. With `KEYMAN_DELPHI_CE_PHASE=prepare`, `delphi_msbuild` records every compile in the calling script and stops it at its first compile not yet built.
2. **IDE build 1**: in the generated group, Build Groups pane, build group `CE-1`.
3. **Prepare, wave 2** (unattended): the targets run; the tools now exist, so their codegen runs.
4. **IDE build 2**: reopen the group, build group `CE-2`.
5. **Finish** (unattended): the normal `build.sh build`. Compiles built since step 1 are skipped; anything the group could not hold gets its usual prompt.

The group declares no project dependencies (the IDE builds dependencies for every platform being built), leaves out a second project of the same name (the IDE matches projects to targets by name), and refuses to write a group with duplicate ProjectGuids. Measured on Delphi 12 CE for `windows/src developer/src`: 8 projects in wave 1 (~5 s), 37 in wave 2 (~2 min), and the finish skipped 38 compiles with one prompt (Developer `setup`, by design). Run on a working tree with a fresh session; a fresh-clone run is not yet verified. Record: [ce-route-2026-10-29.md](https://github.com/MattGyverLee/keyman/blob/evidence/8064-16462/keyman-evidence/results-2026-10-28/ce-route-2026-10-29.md).

### 3. Two duplicate ProjectGuids

`developer/src/kmdbrowserhost/kmdbrowserhost.dproj` and `developer/src/setup/setup.dproj` were copies of the Desktop projects and shared their GUIDs, so the IDE refused to load both into one group ("Duplicate GUID Found"). They get new GUIDs. The GUID is used only by the IDE; msbuild and dcc ignore it.

### 4. Docs

* `docs/build/windows.md`: a pointer to `windows-delphi-ce.md` from the existing "Delphi 10.3 CE no longer available" warning, and the Delphi build-order dependencies, which apply to every Windows build.
* `docs/build/windows-delphi-ce.md` (~590 lines): prerequisites, environment, the IDE library search paths (read from `developer/src/ext/jedi/build.sh`), building under CE including the two-build route, running a dev `keyman.exe` (uiAccess), debugging, and a troubleshooting catalog. Written against Delphi 12 Athens CE specifically (currently the only free tier).

### 5. `engine.groupproj` fix

`windows/src/engine/engine.groupproj`: point the insthelper entry at `insthelper\insthelper.dproj`. The old `inst\insthelper` path doesn't resolve, and IDE "Build All" was failing on it. `build.sh`-based builds were never affected because they don't walk the groupproj.

Technically independent of the CE work, but bundled here because IDE "Build All" is a path CE users exercise. Happy to split into its own PR if reviewers prefer.

## Reviewer notes

* The behaviour-changing surface is inside `delphi_msbuild()` and only runs when `KEYMAN_DELPHI_CE=1`: the prompt, the auto-skip, and the prepare phase (`KEYMAN_DELPHI_CE_PHASE=prepare`, set only by `delphi-ce-build.sh`). Everything else is the new script, docs, two dproj GUIDs and the orthogonal `engine.groupproj` fix.
* The PowerShell helper scripts from the original #16039 are gone; the workflow runs entirely through `build.sh`.

## User Testing

User testing not required: build-environment / docs change with no runtime behaviour modification. CI will exercise the non-CE default path (`KEYMAN_DELPHI_CE` unset); the CE flow is manually validated via the steps in `docs/build/windows-delphi-ce.md`.

## Relates-to

Relates-to: #4599
Depends-on: #16043
Replaces: #16039 (split into #16043 + this PR)

---

## Testing plan and evidence (updated 2026-10-29, PR still closed)

Team testing plan for this stack, stored on the author's fork (not a fork issue, not part of the PR diff):
https://github.com/MattGyverLee/keyman/blob/evidence/8064-16462/keyman-evidence/team-testing-plan-2026-10-27.md

Test report for the current tips (Delphi stack and 8064 stack):
https://github.com/MattGyverLee/keyman/blob/evidence/8064-16462/keyman-evidence/results-2026-10-28/REPORT.md

Evidence index:
https://github.com/MattGyverLee/keyman/blob/evidence/8064-16462/keyman-evidence/README.md

These links were added while the PR is closed; they do not reopen the PR, request review, or change the PR's code.

