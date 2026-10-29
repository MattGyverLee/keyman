# GH-8064 gate (C.12) on the installed Keyman, any arm (log folder named after -Label and its keyman32.dll version).
# Starts keyman.exe and an empty Notepad and runs the three-arm gate (two arms: no MSKLC Cameroon).
# The repro is run-host32.ps1. -GateOnly is accepted for old task definitions and changes nothing.
# Not elevated. Injects real input: hands off.
param([int]$DelaySeconds = 60, [string]$Label = 'stock', [switch]$GateOnly, [int]$Repeat = 3, [int]$LoadThreads = 0)
$ErrorActionPreference = 'Continue'
$T   = 'C:\Github\keyman-test-8064\windows\src\test\manual-tests\GH-8064 - stuck-modifier-phantom-keydown'
$eng = 'C:\Program Files (x86)\Common Files\Keyman\Keyman Engine'
$Out = "C:\Github\keyman-test-evidence\keyman-evidence\results-2026-10-28\logs\$Label-$((Get-Item "$eng\keyman32.dll").VersionInfo.FileVersion)"
New-Item -ItemType Directory -Force $Out | Out-Null
Start-Transcript -Path "$Out\transcript.txt" -Force | Out-Null

Start-Sleep -Seconds $DelaySeconds
"keyman32.dll: $((Get-Item "$eng\keyman32.dll").VersionInfo.FileVersion) sig=$((Get-AuthenticodeSignature "$eng\keyman32.dll").Status)"
if (-not (Get-Process keyman -ErrorAction SilentlyContinue)) { Start-Process "$eng\keyman.exe" -ArgumentList '-kmc','start'; Start-Sleep 6 }
"keyman running: $([bool](Get-Process keyman -ErrorAction SilentlyContinue))"
Get-Process notepad -ErrorAction SilentlyContinue | Out-Null
# Windows 11 Notepad hands the launch to the packaged app, so the process Start-Process returns
# is not the one that owns the window. Close every Notepad started from here on instead.
$npSince = Get-Date
$np = Start-Process notepad -PassThru; Start-Sleep 3

Set-Location $T
"=== GATE ($Label) $(Get-Date -Format o)"
powershell -NoProfile -ExecutionPolicy Bypass -File .\stuck-mod-test.ps1 -Gate -Arms English,Keyman -Repeat $Repeat -LoadThreads $LoadThreads -LogDir "$Out\gate$(if ($LoadThreads -or $Repeat -ne 3) { "-r$Repeat-l$LoadThreads" })"
"GATE EXIT: $LASTEXITCODE"
Get-Process notepad -ErrorAction SilentlyContinue | Where-Object StartTime -ge $npSince | Stop-Process -Force -ErrorAction SilentlyContinue
# The repro needs a Keyman restart a limited token cannot do: run tools/run-host32.ps1 (elevated).
"=== DONE (gate) $(Get-Date -Format o)"
Stop-Transcript | Out-Null
