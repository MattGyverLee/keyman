# Trimmed diagnostics: #16490 7681e589d0 on the signed dev 20.0.9 install, ltu-legion, 2026-10-29 15:05–15:25

**Build under test:** #16490 at **7681e589d0** ("trim the #8064 diagnostics to the one triage needs"),
which is ff79d29257 minus the diagnostic seam, the desktop-switch and truncation reports, the
truncation out-param and the hook's feed trace. #16527 restacked on it as **fd5ec76b3c** with no
other change.

`keyman32.dll` and `keyman64.dll` were built Debug in the worktree `C:\Github\keyman-trim-8064`
(`build.sh build:x86 build:x64 --debug`, /W4 /WX clean), signed with the Keyman test certificates
(SHA1 plus appended SHA256, as `signtime.bat` does), and overlaid on the fixed-arm install
(`logs/fixed-20.0.9.0`). keyman.exe was not rebuilt: the trim does not touch it, and the installed
one already carries #16527. So the binaries under test are exactly what the restacked branches
build. keyman.exe (pid 26148, started 15:07:22) and keymanhp.x64 both loaded the trimmed DLLs
(4,213,576 and 5,309,768 bytes). The DLL strings confirm the trim: `#8064 dropped hold` and
`isModifierKey [` present, `possible desktop switch`, `#8064 batch truncated` and
`Modifier cache feed posted` absent.

| Test | Fixed 20.0.9 (ff79d29257) | Trimmed (7681e589d0) |
|---|---|---|
| keyman32 unit tests | x86 99/99, x64 98/98 | **x86 96/96, x64 95/95**: the 3 removed tests, nothing else (`unit-tests.log`) |
| Gate C.12, 2 arms, Repeat 3 | PASS 18/18 | **PASS 18/18**, exit 0. Keyman freeze trials 0/3 wedged, each freeze confirmed active, Ascii and Deadkey clean (`gate/`) |
| Gate, Repeat 5, LoadThreads 4 | PASS 30/30 | **PASS 30/30**, exit 0. 10 freeze-confirmed Keyman readings, all clean, `mods=none` (`gate-r5-l4/`) |
| host32 repro, 5 iterations | PASS, 0/5 stuck | **PASS, 0/5 stuck**, freeze 5/5, transformed 5/5 (`host32.txt`, `host32-driver.txt`) |

- **One INCONCLUSIVE host32 attempt** (`host32-inconclusive-1.txt`) is not a result: the test
  keyboard never became active in host32 (transformed 0/5), so no batch was assembled. Two earlier
  attempts aborted before starting, because the gate's scratch Notepad kept the foreground. The
  gate driver only closed the launcher process; it now closes every Notepad it started
  (`tools/run-stock-arm.ps1`).
- **Not re-measured:** the debug-log lines themselves. Capturing ETW was not part of this run, so
  TRIAGE.md's feed row is marked `[source-derived]`.
- `transcript.txt` holds the stressed gate run only; the Repeat 3 run's transcript was overwritten,
  and its full log is in `gate/`.
