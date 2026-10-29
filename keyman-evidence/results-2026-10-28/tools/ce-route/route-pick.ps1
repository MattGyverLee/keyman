param([int]$Down = 1)
. "C:\Github\keyman-test-evidence\keyman-evidence\results-2026-10-28\tools\ide.ps1"
Add-Type -AssemblyName System.Windows.Forms
Focus-Bds
Click 910 680; Start-Sleep 1
# keystrokes into the dropped list are unreliable; click the item (rows are ~13 px apart)
Click 850 (701 + 13 * $Down); Start-Sleep 2
Shot 'route-pick'
