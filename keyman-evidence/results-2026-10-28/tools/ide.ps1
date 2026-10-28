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
function Maximize-Bds { $b = Get-Process bds | Where-Object MainWindowHandle -ne 0 | Select-Object -First 1; [void][IDE.U]::ShowWindow($b.MainWindowHandle, 3); Start-Sleep 1 }
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
  [IDE.U]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero); [IDE.U]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)
  [void][IDE.U]::SetForegroundWindow($b.MainWindowHandle); Start-Sleep -Milliseconds 400
  if ((Fg).Pid -ne $b.Id) { throw "bds is not foreground (foreground: $((Fg).Name) '$((Fg).Title)')" }
  # The Alt tap that unlocks SetForegroundWindow also arms the IDE's menu bar; Esc disarms it.
  [System.Windows.Forms.SendKeys]::SendWait('{ESC}'); Start-Sleep -Milliseconds 300
}
# SendKeys syntax: +{F9} = Shift+F9, ^{F11} = Ctrl+F11, {ENTER}. Refuses if bds is not foreground.
function Keys([string]$k) {
  $f = Fg; if ($f.Name -ne 'bds') { throw "refusing to send '$k': foreground is $($f.Name) '$($f.Title)'" }
  [System.Windows.Forms.SendKeys]::SendWait($k)
}
