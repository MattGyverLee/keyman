# Keyman reinstall for the stock arm — 2026-10-28, ltu-legion (elevated session)

**Why.** The "official 19.0.289" install was not stock: `Keyman Engine\insthelper.dll` and
`tsysinfox64.exe` were unsigned 19.0.168.0 dev builds dated 2026-05-28 (left by the May overlay;
the 289 MSI upgrade never replaced them). Every other Keyman-built binary was signed 289.

**Which version.** The fork base `fcc0bd369d` is the merge that bumped master to **20.0.9**; its
parent is the 20.0.8 build, and `git diff fcc0bd369d~1 fcc0bd369d -- windows/src/engine
common/windows/cpp core/src` is empty. So official **20.0.8** is the unfixed code the PRs edit.
Matthew agreed. (19.0.289 was installed briefly and removed.)

**Steps (all exit 0).**
1. Backup: `%USERPROFILE%\Documents\keyman-reinstall-backup-2026-10-28\` (ProgramData, Roaming
   and Local Keyman, gh8064-backup, HKCU/HKLM `.reg` exports, the Windows language list, MSI logs).
2. `msiexec /x` Keyman 19.0 {34C4D146-…}. Removed the leftovers: Engine folder (16 files incl. the
   two strays and gh8064-backup), Roaming/ProgramData `Keyman Engine`, `UpdateCache`. **Keyman
   Developer 19.0.289 and its data were kept.**
3. Note: running `keyman-19.0.289.exe -s` installs the **latest alpha online (20.0.8)**, not
   289. To pin a version: `keyman-X.exe -x <dir>`, then `msiexec /i keymandesktop.msi`.
4. Installed from `https://downloads.keyman.com/windows/alpha/20.0.8/keyman-20.0.8.exe`
   (signed SIL, SHA-256 DBB4655A713AF453BFFD6839DDCBFE0BE3962C3E20AAC9B73A4E9CDCFA666815),
   via its extracted MSI (setup.inf Version=20.0.8.0, MSI signature Valid).
5. **Verified:** Keyman 20.0 20.0.8.0 registered; all 17 Keyman-built binaries in Keyman Engine and
   Keyman Desktop are signed (Valid) at 20.0.8 (cef, sentry and crashpad are third-party and
   unsigned, as shipped).
6. Keyboards, via `kmshell -i <file> -s -nowelcome`: sil_cameroon_qwerty and akan (from
   keyman.com, stable); sil_bafut (not on keyman.com, so re-zipped from the backed-up installed
   package); k_0301 (`common/test/keyboards/baseline/k_0301___multiple_deadkeys.kmx`, hash ==
   the previously installed copy).
7. Languages restored to the pre-uninstall layout: `kmshell -ikl sil_cameroon_qwerty bkc-Latn-CM`,
   `-ukl` for the Cameroon profile that the silent install put on en-US, and 4 orphan TIPs from the
   old install removed. Result: en-US = US + akan + k_0301; bkc-Latn-CM 0x2C00 = Cameroon QWERTY;
   bfd-Latn-CM 0x2000 = Bafut; ewo, fr-CH, gba and fr-FR unchanged.

**Reboot.** No Keyman reboot is required: MSI status 0 for all three operations, and no Keyman
entries in PendingFileRenameOperations. Windows itself has an unrelated update reboot pending
(CBS/WU flags).

**Stock arm.** `tools/run-stock-arm.ps1` now names its log folder after the installed
keyman32.dll version (`logs/stock-20.0.8.0`). This counts as a fresh install of the stock build,
not the old existing install.
