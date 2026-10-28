# Marc's case: the same controlled unpatched-JclSynch TIKE build, but with ONE change to the
# library search path: jcl\source\prototypes removed (upstream developer/src/ext/jedi/build.sh never
# registers it; only the CE guide's list does). The search path is backed up first and restored exactly.
$ErrorActionPreference = 'Stop'
$R = 'C:\Github\keyman-test-evidence\keyman-evidence\results-2026-10-28'
$envOpts = "$env:APPDATA\Embarcadero\BDS\23.0\EnvOptions.proj"
$bk = "$R\logs\searchpath-backup-before-prototypes-test"
Get-Process bds -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep 3
New-Item -ItemType Directory -Force $bk | Out-Null
$keys = 'Win32','Win64' | ForEach-Object { "HKCU:\Software\Embarcadero\BDS\23.0\Library\$_" }
$orig = @{}; foreach ($k in $keys) { $orig[$k] = (Get-ItemProperty $k).'Search Path' }
$orig | ConvertTo-Json | Set-Content "$bk\registry-search-paths.json" -Encoding utf8
Copy-Item $envOpts "$bk\EnvOptions.proj" -Force
$isProto = { param($p) $p -match 'jcl[\\/]jcl[\\/]source[\\/]prototypes$' }
try {
  foreach ($k in $keys) { Set-ItemProperty $k -Name 'Search Path' -Value ((($orig[$k] -split ';') | Where-Object { -not (& $isProto $_) }) -join ';') }
  $text = [IO.File]::ReadAllText($envOpts)
  $text = [regex]::Replace($text, '(<DelphiLibraryPath>)([^<]*)(</DelphiLibraryPath>)', { param($m) $m.Groups[1].Value + ((($m.Groups[2].Value -split ';') | Where-Object { -not (& $isProto $_) }) -join ';') + $m.Groups[3].Value })
  [IO.File]::WriteAllText($envOpts, $text, (New-Object Text.UTF8Encoding($true)))
  foreach ($k in $keys) { "$(Split-Path $k -Leaf) prototypes entries now: $(@(((Get-ItemProperty $k).'Search Path' -split ';') | Where-Object { & $isProto $_ }).Count)" }
  "EnvOptions prototypes in DelphiLibraryPath now: $(([regex]::Matches([IO.File]::ReadAllText($envOpts), '<DelphiLibraryPath>[^<]*prototypes[^<]*</DelphiLibraryPath>')).Count)"
  & "$R\tools\b7-jclsynch-controlled.ps1" @args
} finally {
  Get-Process bds -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep 3
  foreach ($k in $keys) { Set-ItemProperty $k -Name 'Search Path' -Value $orig[$k] }
  Copy-Item "$bk\EnvOptions.proj" $envOpts -Force
  "RESTORED search paths: Win32 identical=$(((Get-ItemProperty $keys[0]).'Search Path') -eq $orig[$keys[0]]) Win64 identical=$(((Get-ItemProperty $keys[1]).'Search Path') -eq $orig[$keys[1]]) EnvOptions identical=$((Get-FileHash $envOpts).Hash -eq (Get-FileHash "$bk\EnvOptions.proj").Hash)"
}
