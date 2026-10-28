# Point Delphi 12 (BDS 23.0) library paths at a Keyman tree, per docs/build/windows-delphi-ce.md §3.
# Backs up first; removes every entry under C:\Github\keyman* (any slash/case form) from the Win32/Win64
# Search + Browsing paths (registry and EnvOptions.proj) and from Known Packages; then re-registers the
# guide's 17 paths with devtools -ai against $Root. Delphi must be closed.
param(
  [Parameter(Mandatory)][string]$Root,
  [string]$Devtools = 'C:\Github\keyman\common\windows\delphi\tools\devtools\bin\Win32\Debug\devtools.exe',
  [string]$BackupDir = "$env:USERPROFILE\Documents\keyman-delphi-registry-backup-2026-10-28"
)
$ErrorActionPreference = 'Stop'
if (Get-Process bds -ErrorAction SilentlyContinue) { throw 'Close Delphi first: it caches library paths and rewrites them on exit.' }

$hive    = 'HKCU\Software\Embarcadero\BDS\23.0'
$envOpts = "$env:APPDATA\Embarcadero\BDS\23.0\EnvOptions.proj"
$keyman  = '^[A-Za-z]:[\\/]Github[\\/]keyman([\\/-]|$)'

# 1. Backup (never overwrite an existing backup)
if (-not (Test-Path "$BackupDir\BDS-23.0.reg")) {
  New-Item -ItemType Directory -Force $BackupDir | Out-Null
  reg export $hive "$BackupDir\BDS-23.0.reg" /y | Out-Null
  Copy-Item $envOpts "$BackupDir\EnvOptions.proj"
  Set-Content "$BackupDir\RESTORE.ps1" -Encoding utf8 -Value @"
# Restore Delphi 12 library paths to their state before 2026-10-28. Close Delphi first.
if (Get-Process bds -ErrorAction SilentlyContinue) { throw 'Close Delphi first.' }
reg delete '$hive\Library' /f
reg delete '$hive\Known Packages' /f
reg import '$BackupDir\BDS-23.0.reg'
Copy-Item '$BackupDir\EnvOptions.proj' '$envOpts' -Force
'Restored.'
"@
  "Backup written to $BackupDir"
} else { "Backup already exists at $BackupDir (kept, not overwritten)" }

function Strip([string]$list) { (($list -split ';') | Where-Object { $_ -and ($_ -notmatch $keyman) }) -join ';' }

# 2. Registry: strip Keyman entries
foreach ($plat in 'Win32','Win64') {
  $k = "HKCU:\Software\Embarcadero\BDS\23.0\Library\$plat"
  foreach ($v in 'Search Path','Browsing Path') {
    $cur = (Get-ItemProperty $k).$v
    if ($null -ne $cur) { Set-ItemProperty $k -Name $v -Value (Strip $cur) }
  }
}

# 3. EnvOptions.proj: strip Keyman entries from every DelphiLibraryPath / DelphiBrowsingPath element
$text = [IO.File]::ReadAllText($envOpts)
$text = [regex]::Replace($text, '(<Delphi(?:Library|Browsing)Path>)([^<]*)(</Delphi(?:Library|Browsing)Path>)',
  { param($m) $m.Groups[1].Value + (Strip $m.Groups[2].Value) + $m.Groups[3].Value })
[IO.File]::WriteAllText($envOpts, $text, (New-Object Text.UTF8Encoding($true)))

# 4. Known Packages: drop main-clone design-time packages (a fresh build registers its own)
$kp = 'HKCU:\Software\Embarcadero\BDS\23.0\Known Packages'
(Get-Item $kp).Property | Where-Object { $_ -match $keyman } | ForEach-Object { Remove-ItemProperty $kp -Name $_; "Removed known package $_" }

# 5. Re-register the CE guide's paths for $Root: DELPHIINCLUDES, plus the JEDI paths read from the
#    devtools -ai calls in developer/src/ext/jedi/build.sh (as the guide does; no hand list, so no
#    jcl\source\prototypes, which makes TIKE compile the DWORD JclWin32 and fail E2010).
$Root = (Resolve-Path $Root).Path
$inc = (Select-String -Path "$Root\resources\build\win\delphi_flags.inc.sh" -Pattern '^DELPHIINCLUDES="(.*)"').Matches[0].Groups[1].Value
$jedi = Select-String -Path "$Root\developer\src\ext\jedi\build.sh" -Pattern '^\s*"\$DEVTOOLS" -ai "(.*)"$' | ForEach-Object { $_.Matches[0].Groups[1].Value -replace '\$DEVELOPER_ROOT', "$Root\developer" -replace '/', '\' }
$paths = @($inc -split ';' | ForEach-Object { $_ -replace '\$KEYMAN_ROOT', $Root -replace '/', '\' }) + @($jedi)
# Remove any jcl\source\prototypes entry a previous version of the guide registered (step 2 strips all Keyman entries anyway).
if ($paths -match 'prototypes') { throw 'prototypes must not be registered' }
foreach ($p in $paths) {
  if (-not (Test-Path $p)) { throw "Guide path missing in tree: $p" }
  & $Devtools -ai $p
  if ($LASTEXITCODE) { throw "devtools -ai failed ($LASTEXITCODE) for $p" }
}
"Registered $($paths.Count) paths under $Root"
