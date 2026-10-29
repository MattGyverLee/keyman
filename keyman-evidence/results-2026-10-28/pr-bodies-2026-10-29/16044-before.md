## Summary

Lets developers on the free **Delphi Community Edition** tier build the still-Delphi parts of the tree, even though CE 11+ deliberately blocks the `dcc32` CLI that `build.sh` normally drives. None of the compiler / runtime stack moves; this is purely build-environment work plus docs.

**CI is unchanged.** `KEYMAN_DELPHI_CE` is unset by default, so `build.sh` keeps invoking `msbuild.exe` exactly as before.

Split off from #16039 per @mcdurdin's review — that PR bundled the CE workflow with the Delphi 11/12 source-compat patches. This PR is the CE half; the compat half is #16043.

Depends on #16043 for the source-compat patches and the `KEYMAN_DELPHI_VERSION` knob that lets the IDE find Delphi 11/12.

## Why this matters for the Delphi removal roadmap

Delphi 10.3 Pro is no longer obtainable, and CE 10.3 has been removed from Embarcadero's downloads. New contributors who want to help finish #4599 currently hit a wall: they can install CE 12, but CE blocks `dcc32` and `build.sh` falls over before reaching any Delphi project. This PR fixes the wall — without committing to keep Delphi alive.

## What's in the change

### 1. CE-aware `delphi_msbuild`

[`resources/build/win/environment.inc.sh`](resources/build/win/environment.inc.sh): `delphi_msbuild()` now checks `KEYMAN_DELPHI_CE`. When `=1`, it prints an IDE-build prompt naming the `.dproj` and waits for Enter instead of invoking `msbuild.exe`. After Enter, it re-checks that the IDE output is fresh; if the IDE did not build it (Enter without building, or stdin closed), the build fails loudly with `builder_die` — success is defined by fresh output, not by the keypress. The pre-build (rc.exe, manifest gen) and post-build (binary copy, codegen) steps in `build.sh` run normally around the prompt, so the developer only has to drive the Delphi compile by hand.

This is the approach @mcdurdin proposed in [#16039 (comment)](https://github.com/keymanapp/keyman/pull/16039#issuecomment-4590110414) — gate by version in the existing shell script rather than parallel PowerShell helpers.

### 2. Docs

* [`docs/build/windows.md`](docs/build/windows.md): one-line pointer to `windows-delphi-ce.md` from the existing "Delphi 10.3 CE no longer available" warning, so future CE users find the workaround instead of dead-ending.
* [`docs/build/windows-delphi-ce.md`](docs/build/windows-delphi-ce.md): ~940-line guide — prerequisites, registry library-path setup, source patches required on #16043, the canonical build order (including the `tsysinfox64` -> `.bin` -> `tsysinfo_x64.res` chicken-and-egg), install-and-overlay workflow, debugging, troubleshooting catalog, and a section labeling which patches are safe to upstream. Written against Delphi 12 Athens CE specifically (currently the only free tier); Delphi 11 CE works with the same approach modulo a couple of paths.

### 3. `engine.groupproj` fix

[`windows/src/engine/engine.groupproj`](windows/src/engine/engine.groupproj): drop the `inst\insthelper` reference. The path doesn't resolve — `insthelper.dproj` lives at `windows/src/engine/insthelper`, not `.../inst/insthelper` — and IDE "Build All" was failing on it. `build.sh`-based builds were never affected because they don't walk the groupproj.

Technically independent of the CE work, but bundled here because IDE "Build All" is the path CE users actually exercise. Happy to split into its own PR if reviewers prefer.

### 4. `.gitignore`

Patterns for the per-script log files that the CE workflow writes (`configure.log`, `core-build.log`, etc.).

## Reviewer notes

* The PR's behaviour-changing surface is exactly one `if [[ "${KEYMAN_DELPHI_CE:-}" == "1" ]]` branch in `delphi_msbuild()`. Everything else is docs / .gitignore / the orthogonal `engine.groupproj` cleanup.
* The PowerShell helper scripts from the original #16039 are gone in this revision; the workflow runs entirely through `KEYMAN_DELPHI_CE=1 ./build.sh`.
* The doc file is named `windows-delphi-ce.md` (not `windows-d12.md`) so the same workflow guide applies if/when a future Delphi 11 CE user shows up; the body is Delphi 12-specific because that's what's been actually tested.

## User Testing

User testing not required: build-environment / docs change with no runtime behaviour modification. CI will exercise the non-CE default path (`KEYMAN_DELPHI_CE` unset); the CE flow is manually validated via the steps in `docs/build/windows-delphi-ce.md`.

## Relates-to

Relates-to: #4599
Depends-on: #16043
Replaces: #16039 (split into #16043 + this PR)

---

## Testing plan — November revisit (added 2026-10-27, PR still closed)

Team testing plan for this stack, stored on the author's fork (not a fork issue, not part of the PR diff):
https://github.com/MattGyverLee/keyman/blob/evidence/8064-16462/keyman-evidence/team-testing-plan-2026-10-27.md

It covers the Delphi stack (#16043/#16044/#16191) and the 8064 stack (#16490/#16527): what changed since September, what the author will test on his own machine, what only the team can test (CI/manual build/user tests, Delphi licence decision, vendored patches), an honest proven/unverified table, and the still-open list. Evidence logs and drafts are on the same branch, indexed at:
https://github.com/MattGyverLee/keyman/blob/evidence/8064-16462/keyman-evidence/README.md

This link was added while the PR is closed; it does not reopen the PR, request review, or change the PR's code.

