# Helpers for driving the Delphi 12 CE IDE (bds.exe) without computer use: start it with a tree's
# environment, screenshot the desktop, focus the IDE, and send keys only while the IDE is foreground.
# Dot-source: . .\ide.ps1
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type -Namespace IDE -Name U -MemberDefinition @'
[DllImport("user32.dll")] public static extern System.IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(System.IntPtr h, out uint pid);
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(System.IntPtr h);
[DllImport("user32.dll")] public static extern bool ShowWindow(System.IntPtr h, int cmd);
[DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, System.UIntPtr extra);
[DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(System.IntPtr h, System.Text.StringBuilder s, int n);
[DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
[DllImport("user32.dll")] public static extern void mouse_event(uint f, int dx, int dy, uint d, System.UIntPtr e);
'@
# Click at FULL-resolution screen coordinates (screenshots are half size: double what you read off them).
function Click([int]$x, [int]$y, [switch]$Right) {
  $f = Fg; if ($f.Name -ne 'bds') { throw "refusing to click: foreground is $($f.Name) '$($f.Title)'" }
  [void][IDE.U]::SetCursorPos($x, $y); Start-Sleep -Milliseconds 150
  if ($Right) { [IDE.U]::mouse_event(0x08, 0, 0, 0, [UIntPtr]::Zero); [IDE.U]::mouse_event(0x10, 0, 0, 0, [UIntPtr]::Zero) }
  else { [IDE.U]::mouse_event(0x02, 0, 0, 0, [UIntPtr]::Zero); [IDE.U]::mouse_event(0x04, 0, 0, 0, [UIntPtr]::Zero) }
  Start-Sleep -Milliseconds 500
}
Add-Type -Namespace IDE -Name N -MemberDefinition @'
public delegate bool CB(System.IntPtr h, System.IntPtr l);
[DllImport("user32.dll")] public static extern bool EnumWindows(CB cb, System.IntPtr l);
[DllImport("user32.dll")] public static extern bool EnumChildWindows(System.IntPtr p, CB cb, System.IntPtr l);
[DllImport("user32.dll")] public static extern bool IsWindowVisible(System.IntPtr h);
[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(System.IntPtr h, out uint pid);
[DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(System.IntPtr h, System.Text.StringBuilder s, int n);
[DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(System.IntPtr h, System.Text.StringBuilder s, int n);
[DllImport("user32.dll")] public static extern System.IntPtr SendMessage(System.IntPtr h, uint m, System.IntPtr w, System.IntPtr l);
'@
# The Delphi CE "Community Edition EULA Reminder" nag: an untitled bds top-level window with an OK
# button. Found by enumeration (not by focus, which it often lacks) and clicked with BM_CLICK.
# Returns a description of each dialog dismissed.
function Dismiss-Nag {
  $ids = @(Get-Process bds -ErrorAction SilentlyContinue).Id; if (-not $ids) { return }
  $tops = New-Object Collections.ArrayList
  [void][IDE.N]::EnumWindows({ param($h, $l) $p = 0; [void][IDE.N]::GetWindowThreadProcessId($h, [ref]$p)
    if ($ids -contains $p -and [IDE.N]::IsWindowVisible($h)) { [void]$tops.Add($h) }; $true }, [IntPtr]::Zero)
  foreach ($h in $tops) {
    $c = New-Object Text.StringBuilder 256; $t = New-Object Text.StringBuilder 256
    [void][IDE.N]::GetClassName($h, $c, 256); [void][IDE.N]::GetWindowText($h, $t, 256)
    if ("$t" -ne '' -or "$c" -in 'TApplication','TAppBuilder','TProgressForm') { continue }
    $ok = New-Object Collections.ArrayList
    [void][IDE.N]::EnumChildWindows($h, { param($ch, $l) $cc = New-Object Text.StringBuilder 64; $ct = New-Object Text.StringBuilder 64
      [void][IDE.N]::GetClassName($ch, $cc, 64); [void][IDE.N]::GetWindowText($ch, $ct, 64)
      if ("$cc" -match 'Button' -and "$ct" -match '^&?OK$') { [void]$ok.Add($ch) }; $true }, [IntPtr]::Zero)
    if ($ok.Count -eq 1) { Shot "nag-$(Get-Date -Format HHmmss)" | Out-Null; [void][IDE.N]::SendMessage($ok[0], 0xF5, [IntPtr]::Zero, [IntPtr]::Zero); "dismissed untitled IDE dialog class=$c (OK clicked)" }
  }
}
# Select the target platform in the toolbar platform box (maximized IDE): open it, then click the
# 1st entry (Windows 32-bit) or 2nd (Windows 64-bit). A project's saved default can be either.
# Layout: the IDE on the left half of the 2560x1552 work area, the console on the right (Matthew).
# Full-resolution click points for that layout, single project open (Projects pane, toolbar).
$Ide = @{ Node = @(796, 190); Build = @(842, 228); Platform = @(686, 80); Win32 = @(676, 104); Win64 = @(676, 124) }
function Select-Platform([string]$plat) { Click @($Ide.Platform)[0] @($Ide.Platform)[1]; Start-Sleep 1; $p = $Ide[$plat]; Click $p[0] $p[1]; Start-Sleep 2 }
function Build-Project { Click @($Ide.Node)[0] @($Ide.Node)[1] -Right; Start-Sleep 1; Click @($Ide.Build)[0] @($Ide.Build)[1] }
Add-Type -Namespace IDE -Name M -MemberDefinition '[DllImport("user32.dll")] public static extern bool MoveWindow(System.IntPtr h, int x, int y, int w, int hh, bool r);'
function Place-Bds {
  $b = Get-Process bds | Where-Object MainWindowHandle -ne 0 | Select-Object -First 1
  $wa = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
  [void][IDE.U]::ShowWindow($b.MainWindowHandle, 9); [void][IDE.M]::MoveWindow($b.MainWindowHandle, 0, 0, [int]($wa.Width / 2), $wa.Height, $true); Start-Sleep 1
}
$Shots = 'C:\Users\thoua\AppData\Local\Temp\claude\C--Github-keyman\d9a7fe69-9d19-45db-b14c-33b3f7474856\scratchpad\shots'
New-Item -ItemType Directory -Force $Shots | Out-Null

function Shot([string]$name = (Get-Date -Format HHmmss)) {
  $b = [System.Windows.Forms.SystemInformation]::VirtualScreen
  $bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height
  $g = [System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($b.Left, $b.Top, 0, 0, $bmp.Size)
  # Half size keeps the PNG readable without being huge.
  $s = New-Object System.Drawing.Bitmap ([int]($b.Width / 2)), ([int]($b.Height / 2))
  $g2 = [System.Drawing.Graphics]::FromImage($s); $g2.InterpolationMode = 'HighQualityBicubic'; $g2.DrawImage($bmp, 0, 0, $s.Width, $s.Height)
  $p = "$Shots\$name.png"; $s.Save($p, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $g2.Dispose(); $bmp.Dispose(); $s.Dispose(); $p
}
function Fg { $h = [IDE.U]::GetForegroundWindow(); $p = 0; [void][IDE.U]::GetWindowThreadProcessId($h, [ref]$p); $sb = New-Object Text.StringBuilder 512; [void][IDE.U]::GetWindowText($h, $sb, 512); [pscustomobject]@{ Hwnd = $h; Pid = $p; Name = (Get-Process -Id $p -ErrorAction SilentlyContinue).Name; Title = "$sb" } }
function Start-Bds([string]$Root, [string]$Project) {
  $env:KEYMAN_ROOT = $Root; $env:PATH = "$Root\windows\lib;" + (($env:PATH -split ';' | Where-Object { $_ -notmatch '(?i)Github\\keyman[^;]*\\windows\\lib' }) -join ';')
  $env:KEYMAN_DELPHI_CE = '1'; $env:KEYMAN_DELPHI_VERSION = '23.0'; Remove-Item Env:NoDefaultCurrentDirectoryInExePath -ErrorAction SilentlyContinue
  $a = @('-pDelphi'); if ($Project) { $a += "`"$Project`"" }
  Start-Process 'C:\Program Files (x86)\Embarcadero\Studio\23.0\bin\bds.exe' -ArgumentList $a -PassThru
}
function Focus-Bds {
  $b = Get-Process bds -ErrorAction SilentlyContinue | Where-Object MainWindowHandle -ne 0 | Select-Object -First 1
  if (-not $b) { throw 'no bds main window' }
  if ((Fg).Name -eq 'explorer' -and (Fg).Title -eq 'Snap Assist') { [System.Windows.Forms.SendKeys]::SendWait('{ESC}'); Start-Sleep 1 }
  [IDE.U]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero); [IDE.U]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)
  [void][IDE.U]::SetForegroundWindow($b.MainWindowHandle); Start-Sleep -Milliseconds 400
  if ((Fg).Pid -ne $b.Id) {
    # SetForegroundWindow refused: a real click on the IDE title bar always activates it.
    [void][IDE.U]::SetCursorPos(640, 12); Start-Sleep -Milliseconds 150
    [IDE.U]::mouse_event(0x02, 0, 0, 0, [UIntPtr]::Zero); [IDE.U]::mouse_event(0x04, 0, 0, 0, [UIntPtr]::Zero); Start-Sleep -Milliseconds 600
  }
  if ((Fg).Pid -ne $b.Id) { throw "bds is not foreground (foreground: $((Fg).Name) '$((Fg).Title)')" }
  # The Alt tap that unlocks SetForegroundWindow also arms the IDE's menu bar; Esc disarms it.
  [System.Windows.Forms.SendKeys]::SendWait('{ESC}'); Start-Sleep -Milliseconds 300
}
# SendKeys syntax: +{F9} = Shift+F9, ^{F11} = Ctrl+F11, {ENTER}. Refuses if bds is not foreground.
function Keys([string]$k) {
  $f = Fg; if ($f.Name -ne 'bds') { throw "refusing to send '$k': foreground is $($f.Name) '$($f.Title)'" }
  [System.Windows.Forms.SendKeys]::SendWait($k)
}
