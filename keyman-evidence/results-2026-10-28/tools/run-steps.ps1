# Runs build steps in order: each is ce-drive.sh (build.sh with KEYMAN_DELPHI_CE=1, Enter via trigger)
# plus ide-drive.ps1 answering its prompts from the IDE. Stops at the first step that does not exit 0.
param([Parameter(Mandatory)][string[]]$Steps, [string]$Root = 'C:\Github\keyman-test-merge2', [int]$Skip = 0)
# Each step: "LABEL|relative/dir|build.sh args"
$ErrorActionPreference = 'Stop'
$R = 'C:\Github\keyman-test-evidence\keyman-evidence\results-2026-10-28'
$S = 'C:\Users\thoua\AppData\Local\Temp\claude\C--Github-keyman\d9a7fe69-9d19-45db-b14c-33b3f7474856\scratchpad'
$bashS = '/c/Users/thoua/AppData/Local/Temp/claude/C--Github-keyman/d9a7fe69-9d19-45db-b14c-33b3f7474856/scratchpad'
foreach ($st in $Steps) {
  $label, $dir, $args_ = $st -split '\|', 3
  $log = "$R\logs\M-$label.out"; $logB = "/c/Github/keyman-test-evidence/keyman-evidence/results-2026-10-28/logs/M-$label.out"
  Remove-Item "$S\ce.done", "$S\ce.trigger" -ErrorAction SilentlyContinue
  "=== [$(Get-Date -Format HH:mm:ss)] $label : $dir ./build.sh $args_"
  $cmd = "export KEYMAN_ROOT=/c/Github/keyman-test-merge2 PATH=/c/Github/keyman-test-merge2/windows/lib:`$PATH CE_TRIGGER=$bashS/ce.trigger CE_DONE=$bashS/ce.done; cd /c/Github/keyman-test-merge2 && /c/Github/keyman-test-evidence/keyman-evidence/results-2026-10-28/tools/ce-drive.sh $dir $logB $args_"
  $bp = Start-Process 'C:\Program Files\Git\bin\bash.exe' -ArgumentList '-lc', "`"$cmd`"" -WindowStyle Hidden -PassThru
  Start-Sleep 3
  & "$R\tools\ide-drive.ps1" -Log $log -Root $Root -Skip $Skip 2>&1 | Tee-Object -FilePath "$R\logs\M-$label.drive.txt"
  $Skip = 0
  $bp.WaitForExit()
  $rc = Get-Content "$S\ce.done" -ErrorAction SilentlyContinue
  "=== $label exit: $rc"
  if ($rc -ne '0') { Get-Content $log -Tail 15; throw "$label failed (exit $rc)" }
}
"ALL STEPS OK"
