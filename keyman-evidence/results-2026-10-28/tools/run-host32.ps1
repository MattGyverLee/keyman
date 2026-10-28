# GH-8064 repro with host32.exe (the README's recommended, self-driving 32-bit host), run from the
# ELEVATED orchestrator: restarts Keyman cleanly (a limited token cannot stop the uiAccess keyman.exe),
# starts keyman.exe and host32 non-elevated through limited-token tasks, then presses Win+Space for
# host32 until it reports that rules fire on the probe (k_0301 on en-US: US -> akan -> k_0301).
# host32 then runs by itself and scores its own result. Injects real input: hands off.
param([string]$Label = 'stock', [int]$Iterations = 5, [switch]$Control)
$ErrorActionPreference = 'Stop'
$T   = 'C:\Github\keyman-test-8064\windows\src\test\manual-tests\GH-8064 - stuck-modifier-phantom-keydown'
$ff  = 'C:\Github\keyman-test-8064\windows\src\support\fakefreeze\bin\Win32\Debug\fakefreeze.exe'
$eng = 'C:\Program Files (x86)\Common Files\Keyman\Keyman Engine'
$ver = (Get-Item "$eng\keyman32.dll").VersionInfo.FileVersion
$Out = "C:\Github\keyman-test-evidence\keyman-evidence\results-2026-10-28\logs\$Label-$ver"
New-Item -ItemType Directory -Force $Out | Out-Null
$res = "$Out\host32$(if ($Control) { '-control' }).txt"

Add-Type -Namespace H32 -Name U -MemberDefinition @'
[DllImport("user32.dll")] public static extern System.IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(System.IntPtr h, out uint pid);
[DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(System.IntPtr h, System.Text.StringBuilder s, int n);
[DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, System.UIntPtr extra);
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(System.IntPtr h);
[DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern System.IntPtr FindWindowEx(System.IntPtr p, System.IntPtr a, string c, string n);
[DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern System.IntPtr SendMessage(System.IntPtr h, uint m, System.IntPtr w, System.Text.StringBuilder l);
'@
function EditText($edit) { $sb = New-Object Text.StringBuilder 1024; [void][H32.U]::SendMessage($edit, 0x000D, [IntPtr]1024, $sb); "$sb" }
function Start-Limited($name, $exe, $arguments) {
  $a = New-ScheduledTaskAction -Execute $exe -Argument $arguments
  $p = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
  Register-ScheduledTask -TaskName $name -Action $a -Principal $p -Force | Out-Null
  Start-ScheduledTask -TaskName $name
}
function Foreground { $h = [H32.U]::GetForegroundWindow(); $p = 0; [void][H32.U]::GetWindowThreadProcessId($h, [ref]$p); $sb = New-Object Text.StringBuilder 256; [void][H32.U]::GetWindowText($h, $sb, 256); [pscustomobject]@{ Pid = $p; Title = "$sb" } }

"[$(Get-Date -Format o)] $Label host32 run on keyman32.dll $ver (signature $((Get-AuthenticodeSignature "$eng\keyman32.dll").Status))"
Get-Process keyman, keymanx64, keymanhp.x64 -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep 2
# ShellExecute (Start-Process) is required: CreateProcess refuses a uiAccess binary.
Start-Limited 'keyman-start' 'powershell.exe' "-NoProfile -Command `"Start-Process '$eng\keyman.exe' -ArgumentList '-kmc','start'`""
Start-Sleep 8
$k = Get-Process keyman -ErrorAction SilentlyContinue
if (-not $k) { throw 'keyman.exe did not start' }
"keyman restarted: pid $($k.Id) at $($k.StartTime)"

Remove-Item $res -ErrorAction SilentlyContinue
$h32args = "--fakefreeze `"$ff`" --probe 1x2x3x --iterations $Iterations --wait-for-rule 60 --out `"$res`"$(if ($Control) { ' --control' })"
Start-Limited 'keyman-host32' "$T\host32\host32.exe" $h32args
$h = $null
for ($i = 0; $i -lt 20 -and -not ($h -and $h.MainWindowHandle -ne 0); $i++) { Start-Sleep -Milliseconds 250; $h = Get-Process host32 -ErrorAction SilentlyContinue | Select-Object -First 1 }
if (-not $h) { throw 'host32.exe did not start' }
$null = $h.Handle  # open the handle now, or ExitCode is unreadable for a process we did not start
# A task-launched window cannot take the foreground itself. An Alt tap makes this process the last
# input source, which lets SetForegroundWindow through (Windows' foreground-lock rule).
[H32.U]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero); [H32.U]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)
[void][H32.U]::SetForegroundWindow($h.MainWindowHandle)
Start-Sleep -Milliseconds 500
$fg = Foreground
"host32 pid $($h.Id); foreground pid $($fg.Pid) '$($fg.Title)'"
if ($fg.Pid -ne $h.Id) { throw 'host32 is not the foreground window; refusing to inject Win+Space into another app' }

# host32's --out file is locked and its stdout goes nowhere (GUI app), so watch its Edit control:
# its probe types 1x2x3x every 2 s, and text that is not a prefix of 1x2x3x means a rule fired.
# Win+Space only while that has not happened, and never once it has: a switch mid-trial voids the run.
$edit = [H32.U]::FindWindowEx($h.MainWindowHandle, [IntPtr]::Zero, 'Edit', $null)
if ($edit -eq [IntPtr]::Zero) { throw 'host32 Edit control not found' }
function Fired { $t = EditText $edit; $t.Length -gt 0 -and -not '1x2x3x'.StartsWith($t) }
$fired = $false
for ($i = 0; $i -le 8 -and -not $fired; $i++) {
  if ($i -gt 0) {
    if ((Foreground).Pid -ne $h.Id) { throw 'lost foreground before Win+Space' }
    [H32.U]::keybd_event(0x5B, 0, 0, [UIntPtr]::Zero); [H32.U]::keybd_event(0x20, 0, 0, [UIntPtr]::Zero)
    [H32.U]::keybd_event(0x20, 0, 2, [UIntPtr]::Zero); [H32.U]::keybd_event(0x5B, 0, 2, [UIntPtr]::Zero)
    "Win+Space #$i"
  }
  for ($w = 0; $w -lt 30 -and -not $fired; $w++) { Start-Sleep -Milliseconds 150; if (Fired) { $fired = $true; "rule fired: edit shows '$(EditText $edit)'" } }
}
if (-not $fired) { "no rule fired after 8 switches; host32 will time out (INCONCLUSIVE)" }
$h.WaitForExit(600000) | Out-Null
"host32 exit: $($h.ExitCode)  (0 PASS, 1 FAIL, 2 INCONCLUSIVE, 3 setup error)"
if (Test-Path $res) { Get-Content $res } else { "no --out file at $res" }
