param([int]$Wait = 240, [string]$Name = 'route-click')
. "C:\Github\keyman-test-evidence\keyman-evidence\results-2026-10-28\tools\ide.ps1"
Focus-Bds
$tb = Get-Date
Click 1100 678; "clicked $($tb.ToString('HH:mm:ss'))"
$t0 = Get-Date
while (((Get-Date) - $t0).TotalSeconds -lt $Wait) {
  Start-Sleep 3; $n = Dismiss-Nag; if ($n) { "nag: $n" }
  # build progress dialog present?
  $busy = Get-Process bds | Where-Object { $_.MainWindowTitle } | Out-Null
}
Shot $Name
"--- exes/bpls written since click:"
Get-ChildItem C:\Github\keyman-test-merge2 -Recurse -Include *.exe,*.bpl,*.dll -File -ErrorAction SilentlyContinue | Where-Object LastWriteTime -gt $tb | Sort-Object LastWriteTime | ForEach-Object { "  {0}  {1}" -f $_.LastWriteTime.ToString('HH:mm:ss'), $_.FullName }
