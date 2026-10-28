# Stock arm of the GH-8064 gate (C.12) on the installed, official signed Keyman (log folder named after its keyman32.dll version).
# Starts keyman.exe and an empty Notepad, runs the three-arm gate (two arms: no MSKLC Cameroon),
# then the fakefreeze repro against charmap. Not elevated. Injects real input: hands off.
param([int]$DelaySeconds = 60)
$ErrorActionPreference = 'Continue'
$T   = 'C:\Github\keyman-test-8064\windows\src\test\manual-tests\GH-8064 - stuck-modifier-phantom-keydown'
$eng = 'C:\Program Files (x86)\Common Files\Keyman\Keyman Engine'
$Out = "C:\Github\keyman-test-evidence\keyman-evidence\results-2026-10-28\logs\stock-$((Get-Item "$eng\keyman32.dll").VersionInfo.FileVersion)"
New-Item -ItemType Directory -Force $Out | Out-Null
Start-Transcript -Path "$Out\transcript.txt" -Force | Out-Null

Start-Sleep -Seconds $DelaySeconds
"keyman32.dll: $((Get-Item "$eng\keyman32.dll").VersionInfo.FileVersion) sig=$((Get-AuthenticodeSignature "$eng\keyman32.dll").Status)"
if (-not (Get-Process keyman -ErrorAction SilentlyContinue)) { Start-Process "$eng\keyman.exe" -ArgumentList '-kmc','start'; Start-Sleep 6 }
"keyman running: $([bool](Get-Process keyman -ErrorAction SilentlyContinue))"
Get-Process notepad -ErrorAction SilentlyContinue | Out-Null
Start-Process notepad; Start-Sleep 3

Set-Location $T
"=== GATE (stock) $(Get-Date -Format o)"
powershell -NoProfile -ExecutionPolicy Bypass -File .\stuck-mod-test.ps1 -Gate -Arms English,Keyman -LogDir "$Out\gate"
"GATE EXIT: $LASTEXITCODE"

# Restart Keyman to clear any wedge before the repro
Get-Process keyman,keymanx64 -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep 2
Start-Process "$eng\keyman.exe" -ArgumentList '-kmc','start'; Start-Sleep 6

"=== REPRO run-8064-test (stock) $(Get-Date -Format o)"
powershell -NoProfile -ExecutionPolicy Bypass -File .\run-8064-test.ps1 -HostApp C:\Windows\SysWOW64\charmap.exe
"REPRO EXIT: $LASTEXITCODE"
"=== DONE $(Get-Date -Format o)"
Stop-Transcript | Out-Null
