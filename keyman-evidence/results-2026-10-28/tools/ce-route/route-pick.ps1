param([int]$Down = 1)
. "C:\Github\keyman-test-evidence\keyman-evidence\results-2026-10-28\tools\ide.ps1"
Add-Type -AssemblyName System.Windows.Forms
Focus-Bds
Click 910 680; Start-Sleep 1
for ($i = 0; $i -lt $Down; $i++) { [System.Windows.Forms.SendKeys]::SendWait('{DOWN}'); Start-Sleep -Milliseconds 300 }
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}'); Start-Sleep 2
Shot 'route-pick'
