# Restack test report — 2026-10-28, ltu-legion (Windows 11 Pro 26200, Delphi 12 Athens CE)

Covers every item in `restack-test-list-2026-10-27.md`. Verdicts: **PASS / FAIL / BLOCKED (reason) /
UNVERIFIED**. INCONCLUSIVE is never PASS. Evidence is in this folder; each line names the file.

## Tips under test (pushed to the fork, PRs untouched: no comments, no body edits)

| PR | Branch | Tip now | Was (start of day) |
|---|---|---|---|
| #16043 | chore/windows/delphi-11-12-compat | **08f7c90ff7** | 9de382db06 |
| #16044 | feat/windows/delphi-ce-workflow | **0f69720e46** | 09b2cbe558 |
| #16191 | chore/windows/delphi-ce-guard | **114e9405d0** | 331b0b3015 |
| #16490 | fix/windows/8064-stuck-modifier | f58d9da489 (unchanged) | |
| #16527 | fix/windows/16462-osk-sticky-modifier | c923e1e89d (unchanged) | |

Integration tree `C:\Github\keyman-test-merge2`, test2 = #16191 tip + c923e1e89d. The fixed arm was
built and installed at test2 3a514d526a. Since then only `developer/src/ext/**` and PATCHES.md
changed; nothing under `windows/`, `common/` or `core/`, so the fixed-arm results still apply.

## Headline

- **GH-8064 is fixed by the stack, and the A/B is clean.** Official 20.0.8 (code-identical to the
  fork base) FAILs the gate and the host32 repro 5/5. The signed dev 20.0.9 build of the stack PASSes
  the gate (18/18, stressed 30/30) and the host32 repro (0/5 stuck). Same machine, harness,
  keyboard and stimulus. `logs/stock-20.0.8.0/RESULT.md`, `logs/fixed-20.0.9.0/RESULT.md`.
- **The full Delphi stack builds on Delphi 12 CE, TIKE included**, but only after **three compile
  fixes found by the build** (fixes 5–7 below). All three are in #16043 and all three are pushed.
  Fix 7 matters most: the #16043 `jedi.inc` sync broke TIKE on **10.3 as well as 12**.
- **Still owed:** your hand tests (C.13, OSK C.14/C.15, B.8 T1/T2): `hand-tests-checklist.md`.
  Rulings: B.7 JclSynch, F.16. The 10.3 compile of fixes 5–7 is UNVERIFIED (no 10.3 here).

## Fixes made today (all on #16043 unless noted; details in fixes-2026-10-28.md)

| # | What | Found by | State |
|---|---|---|---|
| 1 | X1/freshness: CE auto-skip only for output built in this run, at its real path; post-prompt check uses a prompt marker (#16044/#16191) | delphi-cli X1 | PASS (simulated T1–T7b; real IDE: packages accepted) |
| 2 | CE guide §5: debug-manifest described correctly; test-signed uiAccess route (#16044) | review | done; uiAccess needs LocalMachine Root (Microsoft docs; used today) |
| 3 | Dropped the emsdk 3.1.64 hunk | scope | done |
| 4 | B.8 tripwires warn, never error; 10.2/10.3 unchanged | Matthew's ruling | PASS: W1054 seen on D12 in kmshell and TIKE |
| 5 | CustomisationStorage `AddCustFile` under dcc64 (kmcomapi Win64, E2010) | IDE build | PASS (kmcomapi Win64 built) |
| 6 | kmshell NetworkConnection: `get_NetworkCostType` (D12 import has no property, E2003) | IDE build | PASS (kmshell built) |
| 7 | JCL/JVCL configure for 10.3+ (jvcl.inc, jcl.inc, JvConsts SDelphiKey), PATCHES.md entry 4 | TIKE IDE build (F1054 ×3) | PASS (TIKE built) |

## A. Retest after any rebase
- **A.1 full clear rebuild:** C++ side PASS (`8064-cli.md`). Delphi side **PASS cumulatively**: the
  integration tree (#16191 + #16527) was built from a fresh tree in the IDE. `windows/src build` exit
  0 with 20 IDE prompts (`logs/M-W3-*`), `publish` exit 0 (`logs/M-P1-*`), TIKE exit 0 (`logs/M-T1-*`).
  **Per-layer builds (16043 alone, then 16044) UNVERIFIED:** only the stacked tip was built.
- **A.2 per-layer scope:** PASS on today's tips. 16043 = compat + vendored + PATCHES.md + .gitignore +
  docs note + env scripts. 16044 = CE guide, windows.md, environment.inc.sh, engine.groupproj.
  16191 = environment.inc.sh only. The earlier literal FAIL items are in `git-checks.md`.
- **A.3 default path:** PASS by inspection (`git-checks.md`). Not run on a Pro install (section D).

## B. Delphi stack on Delphi 12 CE
- **B.4 full rebuild incl. TIKE: PASS**, after fixes 5–7. Record:
  - Delphi 12 Athens CE, BDS 23.0, with no GetIt packages.
  - **Manual steps beyond the prompts:**
    1. Library paths re-pointed to the tree (`tools/set-delphi-dev-paths.ps1`).
    2. **DUnitX v0.5.1** cloned to `C:\Github\DUnitX` and added to the search path. CE ships no
       Win32 DUnitX, and the unit tests need it.
    3. Test certificates copied from the earlier tree.
    4. `npm ci` and the Core x86 build.
    5. The CE EULA nag dismissed whenever it appears (the driver does this).
  - Projects with a Win64 default needed the platform switched in the IDE.
- **B.5 CE guard both ways:** PASS (`delphi-cli.md`). Real IDE runs: prompt → build → Enter accepted
  every time, and each package `.bpl` was accepted at its real path (X1 fixed).
- **B.6 prompt honesty:** PASS (stdin closed, and Enter without building, both die), `delphi-cli.md` + fix 1 tests.
- **B.7 removal tests** (`fixes-2026-10-28.md`):
  - **mxs.inc: needed.** Removing it gives E2003 `null` in HTMLColors.
  - **JclSynch: NOT needed** on D12 CE with the synced jedi.inc. The unpatched source recompiled and
    TIKE built. **Your ruling**; the patch stays for now.
  - JvComponent: no longer a Keyman patch.
  - The git part of B.7 is in `git-checks.md`.
- **B.8:** tripwires as ruled. The VER360 compile is **PASS** (warnings only). Behaviour
  (T1 Character Map, T2 non-ASCII URLs) is **UNVERIFIED**: hand tests in `b8-hand-tests.md`.
- **B.9 engine.groupproj:** insthelper is in the group (#16044). The engine prompts built in W3. A
  groupproj "Build All" was not used, so that path is **UNVERIFIED**.

## C. 8064 stack
- **C.10 unit suite:** PASS, x64 98/98, x86 99/99; the count difference is explained (`8064-cli.md`).
- **C.11 interactive probes:** **PASS** 4/4 x86 and 4/4 x64 on the merge tree (`logs/fixed-C11-*`).
- **C.12 gate + repro:**
  - Stock 20.0.8: gate **FAIL** (expected). The repro FAILs 5/5 via host32.
  - Fixed: gate **PASS** 18/18 and stressed 30/30. The repro **PASSes**, 0/5 stuck.
  - `run-8064-test.ps1 -HostApp charmap` is **INCONCLUSIVE by design**: it cannot give charmap's Edit
    focus. The README says to use host32.
  - Two arms only: no MSKLC Cameroon layout is installed.
- **C.13 hand tests: UNVERIFIED**, checklist ready.
- **C.14 OSK tests / C.15 oracle: UNVERIFIED**, checklist ready. TEST_OSK-3 is BLOCKED: it needs a
  KLOGGING build.
- **G.4 (repeat-up-to-3 loop):** PASS on the gate. No spurious modifier release in any fixed-arm trial
  (the gate is the only coverage).

## D. Not testable here
Delphi 12 Pro, **Delphi 13** (never claimed; B.8 makes it visible as a warning), **10.3**
(fixes 5–7 compile UNVERIFIED), Linux CE, ARM64, RDP (TEST_REMOTE_DESKTOP is BLOCKED without a
second machine), and upstream CI. The fixed arm ran on a fresh install on this machine, not on a
clean contributor machine.

## E–G
- **E .gitignore:** PASS (`git-checks.md`).
- **F.16 links:** FAIL (17 relative PR-body links, 1 malformed). Not edited, by rule. **Your ruling.**
- **F.17/G.1 batch truncation:** known behaviour, PASS as recorded.
- **F.18 user-held signal:** open. OSK-4/5/6 are the hand tests for it.
- **F.19** closed. **F.20:** PASS for the mechanism.
- **F.21 PR bodies:** **stale.** #16044/#16191 still describe the old `.dpr` freshness rule and the old §5,
  and #16043 does not mention fixes 5–7. Not edited, by rule. Bring them up to date when you reopen
  the PRs.

## Machine state left behind (all reversible)
- Installed: **signed dev Keyman 20.0.9** from merge2. Keyman Developer 19.0.289 is untouched. The
  backup and reinstall record are in `reinstall-2026-10-28.md`.
- **Keyman Test CA (SHA256 + SHA1) in LocalMachine Root.** Remove with
  `certutil -delstore Root 0C6CBAB8C18ACE81645F1ED513107805FC9E2178` and `… 82F98AACD081E32BED5409A7A0D4B4C613B2523D`.
- Delphi library paths point at `keyman-test-merge2`, plus `C:\Github\DUnitX\Source`. Restore with
  `RESTORE.ps1` in `Documents\keyman-delphi-registry-backup-2026-10-28`.
- Scheduled tasks `keyman-start`, `keyman-stock-arm`, `keyman-stock-repro` and `keyman-host32`
  (limited-token test launchers) can be deleted with `Unregister-ScheduledTask`.
- A stray 0.5 KB log at `C:\Program Files\Git\M-core-x86.out`; the safety check blocked my removal.
