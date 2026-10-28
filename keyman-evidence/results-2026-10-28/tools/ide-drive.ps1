# Drives Delphi CE IDE builds for a running ce-drive.sh build: for each new "press Enter" prompt in the
# build log, opens the prompted project in the IDE (Ctrl+F11 + full path), builds it (Shift+F9), waits
# for its output at the .dproj's real output path to be written AFTER the prompt, then sends exactly one
# Enter via the ce-drive trigger file. Stops (exit 1, with a screenshot) on anything it cannot verify.
param(
  [Parameter(Mandatory)][string]$Log,
  [string]$Root = 'C:\Github\keyman-test-merge2',
  [string]$Trigger = 'C:\Users\thoua\AppData\Local\Temp\claude\C--Github-keyman\d9a7fe69-9d19-45db-b14c-33b3f7474856\scratchpad\ce.trigger',
  [string]$Done = 'C:\Users\thoua\AppData\Local\Temp\claude\C--Github-keyman\d9a7fe69-9d19-45db-b14c-33b3f7474856\scratchpad\ce.done',
  [int]$BuildTimeoutSec = 900,
  [int]$Skip = 0   # prompts already handled by hand in this log
)
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\ide.ps1"

# Same rules as _delphi_ce_output_files in resources/build/win/environment.inc.sh (fix2/16044).
function Output-Files([string]$dproj, [string]$platform, [string]$config) {
  $dir = Split-Path $dproj; $name = [IO.Path]::GetFileNameWithoutExtension($dproj)
  $isPkg = Test-Path (Join-Path $dir "$name.dpk")
  $tag = if ($isPkg) { 'DCC_BplOutput' } else { 'DCC_ExeOutput' }; $exts = if ($isPkg) { @('bpl') } else { @('exe','dll') }
  $outs = @([regex]::Matches((Get-Content $dproj -Raw), "<$tag>([^<]*)</$tag>") | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
  if (-not $outs -and -not $isPkg) { $outs = @('bin\$(Platform)\$(Config)') }
  foreach ($o in $outs) {
    $o = $o.Replace('$(Platform)', $platform).Replace('$(Config)', $config)
    if ($o -match '\$\(') { continue }
    if (-not [IO.Path]::IsPathRooted($o)) { $o = Join-Path $dir $o }
    foreach ($e in $exts) { [IO.Path]::GetFullPath((Join-Path $o "$name.$e")) }
  }
}

$seen = $Skip
while (-not (Test-Path $Done)) {
  Start-Sleep 2
  $lines = @(Get-Content $Log -ErrorAction SilentlyContinue)
  $prompts = @($lines | Where-Object { $_ -match 'Please build (\S+) \(Platform: (\w+), Config: (\w+)\)' })
  if ($prompts.Count -le $seen) { continue }
  $line = $prompts[$seen]; $seen++
  $promptAt = Get-Date
  [void]($line -match '^\[([^\]]+)\] .*Please build (\S+) \(Platform: (\w+), Config: (\w+)\)')
  $rel = $Matches[1]; $proj = $Matches[2]; $plat = $Matches[3]; $cfg = $Matches[4]
  $dproj = [IO.Path]::GetFullPath((Join-Path (Join-Path $Root $rel) $proj))
  $outs = @(Output-Files $dproj $plat $cfg)
  "[$(Get-Date -Format HH:mm:ss)] prompt #${seen}: $rel/$proj ($plat, $cfg) -> expect one of: $($outs -join ' | ')"
  if (-not (Test-Path $dproj)) { Shot "stop-$seen"; throw "project not found: $dproj" }
  if (-not $outs) { Shot "stop-$seen"; throw "no output path derivable for $dproj" }

  # Relaunch the IDE with the project on its command line: no dialogs, and nothing typed that the
  # active (possibly Keyman) keyboard could transform. Killing bds discards IDE edits to the .dproj.
  Get-Process bds -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep 2
  [void](Start-Bds -Root $Root -Project $dproj)
  $name = [IO.Path]::GetFileNameWithoutExtension($dproj); $t0 = Get-Date
  do { Start-Sleep 2; $b = Get-Process bds -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -match [regex]::Escape($name) } } until ($b -or ((Get-Date) - $t0).TotalSeconds -gt 120)
  if (-not $b) { Shot "stop-$seen"; throw "IDE did not open $name within 120 s" }
  Start-Sleep 8   # let the project finish loading
  Focus-Bds; Maximize-Bds; Focus-Bds
  # The CE EULA reminder can also appear at IDE start-up.
  for ($n = 0; $n -lt 3; $n++) { $d = Dismiss-Nag; if (-not $d) { break }; "  $d"; Start-Sleep 2; Focus-Bds }
  $f = Fg
  if ($f.Title -notmatch [regex]::Escape($name)) { Shot "stop-$seen"; throw "foreground is '$($f.Title)', not the $name project (a dialog?)" }
  if ($plat -eq 'Win64') { Select-Win64; Shot "win64-$seen" | Out-Null; "  selected Windows 64-bit" }
  elseif ($plat -ne 'Win32') { Shot "platform-$seen"; throw "prompt wants ${plat}: not automated" }
  # Projects pane, maximized IDE, single project: right-click the project node, then "Build" in its
  # context menu (Matthew: builds are triggered from the Projects tab). Shift+F9 did not build.
  Click 2144 182 -Right; Start-Sleep 1; Click 2190 220
  "  building..."

  # Success: the output appears and the Build dialog auto-closes (box ticked). Failure: no output,
  # and the dialog stays up showing the errors.
  $t0 = Get-Date; $hit = $null
  while (-not $hit -and ((Get-Date) - $t0).TotalSeconds -lt $BuildTimeoutSec) {
    Start-Sleep 3
    $hit = $outs | Where-Object { (Test-Path $_) -and (Get-Item $_).LastWriteTime -gt $promptAt } | Select-Object -First 1
    if (-not $hit) {
      $d = Dismiss-Nag; if ($d) { "  $d"; continue }
      $f = Fg
      if ($f.Name -eq 'bds' -and $f.Title -eq '') { continue }   # TApplication: not a dialog
      if ($f.Name -eq 'bds' -and $f.Title -notmatch '^Build$' -and $f.Title -notmatch [regex]::Escape($name)) { Shot "dialog-$seen"; throw "unexpected IDE dialog: '$($f.Title)'" }
      if ($f.Title -match [regex]::Escape($name) -and ((Get-Date) - $t0).TotalSeconds -gt 20) { Start-Sleep 5; if (-not ($outs | Where-Object { (Test-Path $_) -and (Get-Item $_).LastWriteTime -gt $promptAt })) { Shot "nobuild-$seen"; throw "the Build dialog closed but no output was written for $proj" } }
    }
  }
  if (-not $hit) { Shot "timeout-$seen"; throw "no output within $BuildTimeoutSec s for $proj (Build dialog still up = compile errors; see screenshot)" }
  do { $len = (Get-Item $hit).Length; Start-Sleep 3 } until ((Get-Item $hit).Length -eq $len)
  Start-Sleep 3
  "  built: $hit ($((Get-Item $hit).Length) bytes, $((Get-Item $hit).LastWriteTime.ToString('HH:mm:ss'))) after $([int]((Get-Date) - $t0).TotalSeconds)s; sending Enter"
  New-Item -ItemType File -Force $Trigger | Out-Null
}
"build.sh finished: exit $(Get-Content $Done)"
