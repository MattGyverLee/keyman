param([string]$Group)
. "C:\Github\keyman-test-evidence\keyman-evidence\results-2026-10-28\tools\ide.ps1"
Get-Process bds -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep 2
[void](Start-Bds -Root 'C:\Github\keyman-test-merge2' -Project $Group); $t0 = Get-Date
do { Start-Sleep 2 } until ((Get-Process bds -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -match 'Delphi 12' }) -or ((Get-Date) - $t0).TotalSeconds -gt 150)
Start-Sleep 15; Focus-Bds; Place-Bds; Focus-Bds; [void](Dismiss-Nag)
"title: $((Fg).Title)"
Shot 'route-open'
