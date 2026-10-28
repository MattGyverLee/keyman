# Controlled B.7 JclSynch test: fresh IDE session with only TIKE open, TIKE's obj folder emptied
# so every unit compiles from source, and the unpatched JclSynch.pas in place. Records which
# JclWin32 source was compiled (the prototypes\ copy includes win32api\WinBase.int; the windows\
# copy does not) and whether TIKE builds. Restores the file at the end.
param([switch]$Patched)   # -Patched: control run with the patch left in
. "$PSScriptRoot\ide.ps1"
$ErrorActionPreference = 'Continue'
$root = 'C:\Github\keyman-test-merge2'; $obj = "$root\developer\src\tike\obj\Win32\Debug"; $out = "$root\developer\src\tike\bin\Win32\Debug\tike.exe"
$file = 'developer/src/ext/jedi/jcl/jcl/source/common/JclSynch.pas'
function Dcu($n) { $f = Get-Item "$obj\$n.dcu" -ErrorAction SilentlyContinue; if (-not $f) { return "  $n.dcu: (none)" }; $t = [Text.Encoding]::ASCII.GetString([IO.File]::ReadAllBytes($f.FullName)); "  $n.dcu: $($f.LastWriteTime.ToString('HH:mm:ss')) includesWinBase.int(prototype)=$($t -match 'WinBase\.int')" }

Get-Process bds -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep 2
Remove-Item "$obj\*.dcu" -Force -ErrorAction SilentlyContinue; "obj emptied: $(@(Get-ChildItem $obj -Filter *.dcu -ErrorAction SilentlyContinue).Count) dcu left"
# '~1', not '^': cmd treats '^' as its escape character and the swap silently does nothing.
if (-not $Patched) { Push-Location $root; & cmd /c "git show fd04ceda6c~1:$file > `"$file`"" 2>$null; Pop-Location }
$call = (Select-String -Path "$root\$file" -Pattern 'FHandle := .*CreateMutex' | Select-Object -First 1).Line.Trim()
"JclSynch call: $call"
if (-not $Patched -and $call -notmatch 'JclWin32\.CreateMutex\(SecAttr, InitialOwner') { & git -C $root checkout -- $file 2>$null; throw 'swap to the unpatched JclSynch did not happen; refusing to build' }
$sp = (Get-ItemProperty 'HKCU:\Software\Embarcadero\BDS\23.0\Library\Win32').'Search Path' -split ';'
$order = $sp | Where-Object { $_ -match 'jcl.jcl.source.(prototypes|windows)$' } | ForEach-Object { Split-Path $_ -Leaf }
"search path JCL order: $($order -join ' before ')"

[void](Start-Bds -Root $root -Project "$root\developer\src\tike\tike.dproj"); $t0 = Get-Date
do { Start-Sleep 2 } until ((Get-Process bds -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -match 'tike' }) -or ((Get-Date) - $t0).TotalSeconds -gt 120)
Start-Sleep 10; Focus-Bds; Place-Bds; Focus-Bds; [void](Dismiss-Nag); Focus-Bds
$tb = Get-Date; Build-Project; "build clicked $($tb.ToString('HH:mm:ss'))"
$result = 'TIMEOUT'
while (((Get-Date) - $tb).TotalSeconds -lt 240) {
  Start-Sleep 3; $n = Dismiss-Nag; if ($n) { "  $n" }
  if ((Test-Path $out) -and (Get-Item $out).LastWriteTime -gt $tb) { $result = 'TIKE BUILT'; break }
  if (((Get-Date) - $tb).TotalSeconds -gt 25 -and (Test-Path "$obj\JclSynch.dcu" -PathType Leaf) -eq $false -and (Get-ChildItem $obj -Filter *.dcu).Count -gt 0 -and ((Get-Date) - (Get-ChildItem $obj -Filter *.dcu | Sort-Object LastWriteTime | Select-Object -Last 1).LastWriteTime).TotalSeconds -gt 15) { $result = 'FAILED (compile stopped; JclSynch.dcu not produced)'; break }
}
"result: $result"; Dcu JclWin32; Dcu JclSynch
"dcus compiled: $(@(Get-ChildItem $obj -Filter *.dcu).Count)"
Start-Sleep 2
$png = Shot "b7-controlled-$(if ($Patched) { 'patched' } else { 'unpatched' })-$(Get-Date -Format HHmmss)"
$keep = 'C:\Github\keyman-test-evidence\keyman-evidence\results-2026-10-28\logs\jclsynch-root-cause'; New-Item -ItemType Directory -Force $keep | Out-Null
Copy-Item $png $keep; "screenshot: $keep\$(Split-Path $png -Leaf)"
& git -C $root checkout -- $file 2>$null; "restored: diff [$(& git -C $root diff --stat -- $file 2>$null)]"
