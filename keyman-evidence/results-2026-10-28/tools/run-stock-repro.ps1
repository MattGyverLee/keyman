# Repro-only rerun of the stock arm (fakefreeze vs charmap). Run non-elevated, against a Keyman the
# orchestrator has just restarted (a limited token cannot stop the uiAccess keyman.exe). Hands off.
$T   = 'C:\Github\keyman-test-8064\windows\src\test\manual-tests\GH-8064 - stuck-modifier-phantom-keydown'
$eng = 'C:\Program Files (x86)\Common Files\Keyman\Keyman Engine'
$Out = "C:\Github\keyman-test-evidence\keyman-evidence\results-2026-10-28\logs\stock-$((Get-Item "$eng\keyman32.dll").VersionInfo.FileVersion)"
Start-Transcript -Path "$Out\repro-transcript.txt" -Force | Out-Null
"keyman: $((Get-Process keyman -ErrorAction SilentlyContinue | ForEach-Object { "$($_.Id) started $($_.StartTime)" }) -join '; ')"
Set-Location $T
"=== REPRO run-8064-test (stock) $(Get-Date -Format o)"
powershell -NoProfile -ExecutionPolicy Bypass -File .\run-8064-test.ps1 -HostApp C:\Windows\SysWOW64\charmap.exe *>&1 | Out-File -Encoding utf8 "$Out\repro-full.txt"
"REPRO EXIT: $LASTEXITCODE"
Stop-Transcript | Out-Null
