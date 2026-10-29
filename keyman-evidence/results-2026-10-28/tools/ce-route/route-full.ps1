param([string]$Group, [int]$Down = 0, [int]$Wait = 60, [string]$Name = 'route-full', [string]$Root = 'C:\Github\keyman-test-merge2')
$s = $PSScriptRoot
powershell -NoProfile -ExecutionPolicy Bypass -File "$s\route-open.ps1" -Group $Group -Root $Root | Out-Null
. "C:\Github\keyman-test-evidence\keyman-evidence\results-2026-10-28\tools\ide.ps1"
Focus-Bds; Place-Bds; Focus-Bds; Start-Sleep 1
Click 897 145; Start-Sleep 2
if ($Down -gt 0) { powershell -NoProfile -ExecutionPolicy Bypass -File "$s\route-pick.ps1" -Down $Down | Out-Null }
Shot "$Name-pane"
powershell -NoProfile -ExecutionPolicy Bypass -File "$s\route-click.ps1" -Wait $Wait -Name $Name -Root $Root
