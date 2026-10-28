# B.7 removal test: put back the pre-patch version of one vendored file in keyman-test-merge2, build
# TIKE in the open IDE (side-by-side layout), screenshot the result, then restore the file.
param([Parameter(Mandatory)][string]$Name, [Parameter(Mandatory)][string]$File, [Parameter(Mandatory)][string]$Rev)
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\ide.ps1"
$ErrorActionPreference = 'Continue'   # git writes CRLF warnings to stderr; they must not abort mid-swap
$env:GIT_CONFIG_PARAMETERS = "'core.safecrlf=false'"
$root = 'C:\Github\keyman-test-merge2'; $out = "$root\developer\src\tike\bin\Win32\Debug\tike.exe"
function Click-DialogButton([string]$class, [string]$textRegex) {
  $ids = @(Get-Process bds).Id; $hit = $false
  [void][IDE.N]::EnumWindows({ param($h, $l) $p = 0; [void][IDE.N]::GetWindowThreadProcessId($h, [ref]$p)
    $c = New-Object Text.StringBuilder 64; [void][IDE.N]::GetClassName($h, $c, 64)
    if ($ids -contains $p -and [IDE.N]::IsWindowVisible($h) -and ("$c" -eq $class -or -not $class)) {
      [void][IDE.N]::EnumChildWindows($h, { param($ch, $l2) $t = New-Object Text.StringBuilder 64; [void][IDE.N]::GetWindowText($ch, $t, 64)
        if ("$t" -match $textRegex) { [void][IDE.N]::SendMessage($ch, 0xF5, [IntPtr]::Zero, [IntPtr]::Zero); $script:hit = $true }; $true }, [IntPtr]::Zero) }
    $true }, [IntPtr]::Zero)
  $script:hit
}
# cmd redirection keeps the bytes exact (a PowerShell pipeline would re-encode the lines).
# cmd treats '^' as an escape character, so spell parent revisions as '~1'.
Push-Location $root; & cmd /c "git show $($Rev -replace '\^$','~1'):$File > `"$File`""; Pop-Location
"[$Name] pre-patch $File from $Rev; git diff:"; & git -C $root diff --stat -- $File
[void](Click-DialogButton 'TProgressForm' '^&?OK$'); Focus-Bds
$tb = Get-Date; Build-Project; "[$Name] build clicked $($tb.ToString('HH:mm:ss'))"
$result = 'TIMEOUT'
while (((Get-Date) - $tb).TotalSeconds -lt 240) {
  Start-Sleep 3; $n = Dismiss-Nag; if ($n) { "  $n" }
  if (Click-DialogButton 'TMessageForm' '^Yes to &All$') { '  answered a reload prompt: Yes to All' }
  if ((Test-Path $out) -and (Get-Item $out).LastWriteTime -gt $tb) { $result = 'BUILT (patch removal did NOT break the build)'; break }
  if (((Get-Date) - $tb).TotalSeconds -gt 90) { $result = 'FAILED (no output 90 s after Build; see screenshot)'; break }
}
"[$Name] result: $result"
Start-Sleep 2; Shot "b7-$Name"
[void](Click-DialogButton 'TProgressForm' '^&?OK$')
& git -C $root checkout -- $File; "[$Name] restored; git diff now: [$(& git -C $root diff --stat -- $File)]"
