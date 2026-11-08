<#
.SYNOPSIS
  Captures the serializer-path signals TRIAGE.md tells a responder to read
  (T067, T069, T070 path 6, T070a). Interactive and phase-driven.

.DESCRIPTION
  Why this is two runs, not one. ReconcileModifierCache and all three
  SendDebugMessageFormat signals are BRANCH-ONLY -- none exist on origin/master, so
  none exist in the installed shipped engine:

    shipped build (1,232,504 bytes)   wedges 5/5    emits NO signals
    branch  build (4,197,376 bytes)   wedges 0/5    emits all three

  The build that wedges has no signals; the build with signals does not wedge. So a
  single run cannot "produce a wedge and record every signal at that moment". These
  are PATH signals, not WEDGE signals: they identify the serializer as the actor and
  fire on ordinary batch assembly. TRIAGE.md triages reports AFTER this ships, when
  every user is on a build that has them -- so Run B is authoritative and Run A is
  the contrast.

  The log is captured by an embedded OutputDebugString listener; DebugView is not
  required and is not installed here. 'debug to console' routes through
  OutputDebugStringW (DebugEventTrace.cpp:112), which the listener reads from the
  DBWIN_BUFFER shared section.

.PARAMETER Phase
  Omit for the interactive menu. Phases: arm, keyboard, runA, deploy, runB,
  restore, disarm, analyze, status.

.NOTES
  ELEVATION IS SPLIT ON PURPOSE. host32 must NOT be elevated: keyman.exe runs as
  the user, and UIPI stops a lower-integrity process's low level hook from seeing
  input destined for a higher-integrity window. An elevated host32 would therefore
  assemble no batch at all and report a clean PASS for the wrong reason -- exactly
  the false negative README.md warns about.

  Phases keyboard/deploy/restore need admin. Phases runA/runB must NOT have it.
  Phases arm/disarm work either way: they write HKCU, which is the same hive for an
  elevated process of the same user. The script refuses a phase run at the wrong
  integrity level rather than producing a misleading result.
#>
[CmdletBinding()]
param(
  [ValidateSet('menu','arm','keyboard','runA','deploy','runB','restore','disarm','analyze','status')]
  [string]$Phase = 'menu',
  [int]$Iterations = 5,
  [string]$Probe = '1x2x3x',
  [int]$WaitForRule = 120,
  # Skip the "press Enter" pause, for driving from a non-interactive shell. The
  # keyboard still has to be selected -- host32's --wait-for-rule window is what
  # gives you time to do it after its window appears.
  [switch]$NoPrompt
)

$ErrorActionPreference = 'Stop'
$stamp       = '2026-08-28'
$root        = $PSScriptRoot
$evidence    = Join-Path $root 'evidence'
$host32      = Join-Path $root 'host32\host32.exe'
$deploy      = Join-Path $root 'deploy-8064.ps1'
$kmshell     = 'C:\Program Files (x86)\Keyman\Keyman Desktop\kmshell.exe'
# four levels up from this directory is windows/, matching deploy-8064.ps1
$winRoot     = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $root)))
$fakefreeze  = Join-Path $winRoot 'src\support\fakefreeze\bin\Win32\Debug\fakefreeze.exe'
$stateFile   = Join-Path $evidence '.t067-state.json'
$regKey      = 'HKCU:\Software\Keyman\Keyman Engine'
$engineDll   = 'C:\Program Files (x86)\Common Files\Keyman\Keyman Engine\keyman32.dll'
$SHIPPED_LEN = 1232504
$BRANCH_LEN  = 4197376

# BranchOnly: the code emitting it does not exist on origin/master, so 0 on the shipped
# build is the CORRECT reading, not a miss. The scan-code signal is pre-existing and
# should fire on both -- scoring it "expected 0 on shipped" was wrong.
$SIGNALS = @(
  @{ Key = 'reconcile'; Pattern = 'cache says held but OS says up'; Row = 'keybd_shift reconcile clear';         Rare = $false; BranchOnly = $true  },
  @{ Key = 'feed';      Pattern = 'Modifier cache feed';            Row = 'hook modifier cache feed';            Rare = $false; BranchOnly = $true  },
  @{ Key = 'verify';    Pattern = 'verification: OS holds vkey';    Row = 'post-batch verification correction';  Rare = $true;  BranchOnly = $true  },
  # 'scan:' with a COLON is the low level hook's own view of an event. 'scan=' with an
  # equals is the OSK's Pascal do_keybd_event, logged through Keyman_WriteDebugEvent2W
  # -- a different producer entirely. Matching 'scan=' scored 6 OSK hits on the shipped
  # run and 0 on the branch run, and read as "the pre-existing signal vanished".
  @{ Key = 'scan';      Pattern = 'scan:[Ff][Ff]';                  Row = 'injected scan code at the hook';      Rare = $false; BranchOnly = $false },
  # Path 6 emits NOTHING. UpdateLocalModifierState (serialkeyeventserver.cpp:581) is a
  # thin wrapper straight into UpdateModifierCacheFromKeyEvent with no SendDebugMessage
  # of its own, so no amount of running will make it appear in a log. FR-010a wants
  # every 'cannot latch' verdict runtime-confirmed; this one cannot be, as the code
  # stands. That is a decision to record, not a result to keep re-measuring.
  @{ Key = 'path6';     Pattern = 'UpdateLocalModifierState';       Row = 'path 6 user-event re-injection';      Rare = $false; BranchOnly = $false; Unloggable = $true }
)

function Test-Elevated {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  return (New-Object Security.Principal.WindowsPrincipal($id)).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Assert-Elevation([bool]$want, [string]$phaseName) {
  if ((Test-Elevated) -eq $want) { return }
  if ($want) {
    throw "Phase '$phaseName' needs an ELEVATED shell. Re-run it from an admin PowerShell."
  }
  throw "Phase '$phaseName' must run WITHOUT elevation, or the result is misleading: keyman32.dll is injected into host32, and UIPI blocks a non-elevated engine from driving an elevated window. Re-run it from a normal PowerShell."
}

function Get-State {
  if (Test-Path $stateFile) { return (Get-Content $stateFile -Raw | ConvertFrom-Json) }
  return [pscustomobject]@{
    armed = $false; keyboard = $false; runA = $false
    deployed = $false; runB = $false; restored = $false
  }
}

function Set-State([string]$name, $value) {
  $s = Get-State
  $s.$name = $value
  if (-not (Test-Path $evidence)) { New-Item -ItemType Directory $evidence | Out-Null }
  $s | ConvertTo-Json | Out-File -FilePath $stateFile -Encoding utf8
}

# Globals::LoadDebugSettings() runs from Keyman_Initialise (keyman32.cpp:347) -- once,
# when the engine initialises. Arming the registry under a Keyman that is already
# running leaves it with debug=FALSE in memory, so the engine logs nothing and the
# absence looks exactly like "the signal did not fire". Restart it.
function Restart-Keyman {

  # Identity, not existence. The first version of this asked "is a keyman.exe running
  # afterwards?" -- which is true when the kill silently failed and the ORIGINAL process
  # is still there. It reported [OK] over a restart that never happened, and the whole
  # capture then read as "the signal did not fire" instead of "the log was never on".
  $before = @(Get-Process keyman -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
  Write-Host ("  restarting Keyman so it reloads the debug flags (was pid {0}) ..." -f ($before -join ','))

  # Ask politely first: force-killing keyman.exe while a modifier is held is
  # MODIFIER-PRODUCERS.md row 2c, the very defect this harness measures.
  foreach ($n in @('keyman', 'keymanx64')) {
    Get-Process $n -ErrorAction SilentlyContinue | ForEach-Object {
      try { $_.CloseMainWindow() | Out-Null } catch { }
    }
  }
  Start-Sleep -Seconds 3
  foreach ($n in @('keyman', 'keymanx64')) {
    foreach ($p in @(Get-Process $n -ErrorAction SilentlyContinue)) {
      try { Stop-Process -Id $p.Id -Force -ErrorAction Stop }
      catch { Write-Host ("  [WARN] cannot stop {0} (pid {1}): {2}" -f $n, $p.Id, $_.Exception.Message) -ForegroundColor Yellow }
    }
  }
  Start-Sleep -Seconds 2

  $survivors = @(Get-Process keyman -ErrorAction SilentlyContinue | Where-Object { $before -contains $_.Id })
  if ($survivors.Count -gt 0) {
    Write-Host ''
    Write-Host ("  [FAIL] Keyman pid {0} is still running -- the restart did NOT happen." -f ($survivors.Id -join ',')) -ForegroundColor Red
    Write-Host '         Globals::LoadDebugSettings() runs once at Keyman_Initialise, so the'
    Write-Host '         engine still holds debug=FALSE and will log nothing.'
    Write-Host '         Exit Keyman from its tray icon menu, relaunch it, then re-run this phase.' -ForegroundColor Yellow
    return $false
  }

  # Start through kmshell, not keyman.exe. Launching keyman.exe directly returns a
  # success from Start-Process and then exits immediately without ever appearing in
  # the process list -- kmshell is the supported entry point, and is what the Start
  # menu shortcut uses.
  if (-not (Test-Path $kmshell)) { Write-Host "  [WARN] kmshell.exe not found at $kmshell" -ForegroundColor Yellow; return $false }
  Start-Process -FilePath $kmshell -ArgumentList '-s' | Out-Null
  Start-Sleep -Seconds 8
  $after = @(Get-Process keyman -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
  $fresh = @($after | Where-Object { $before -notcontains $_ })
  if ($fresh.Count -gt 0) {
    Write-Host ("  [OK] Keyman restarted (now pid {0})" -f ($fresh -join ',')) -ForegroundColor Green
    return $true
  }
  Write-Host '  [WARN] Keyman did not come back; start it from the Start menu' -ForegroundColor Yellow
  return $false
}

function Get-InstalledDllLength {
  if (-not (Test-Path $engineDll)) { return -1 }
  return (Get-Item $engineDll).Length
}

function Show-InstalledBuild {
  $len = Get-InstalledDllLength
  if ($len -eq $SHIPPED_LEN) {
    Write-Host "  installed keyman32.dll : $len  (SHIPPED)" -ForegroundColor Yellow
  } elseif ($len -eq $BRANCH_LEN) {
    Write-Host "  installed keyman32.dll : $len  (BRANCH)" -ForegroundColor Green
  } elseif ($len -eq -1) {
    Write-Host "  installed keyman32.dll : NOT FOUND" -ForegroundColor Red
  } else {
    Write-Host "  installed keyman32.dll : $len  (UNRECOGNISED)" -ForegroundColor Red
  }
}

# ---------------------------------------------------------------------------------
# OutputDebugString listener. Reads the DBWIN_BUFFER section OutputDebugStringW
# feeds. Only one listener may own it at a time -- close DebugView / detach any
# debugger first, or Start-Capture will say so rather than silently capturing zero.
# ---------------------------------------------------------------------------------
$listenerSource = @'
using System;
using System.IO;
using System.Text;
using System.Runtime.InteropServices;

public class DbWin {
  [DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  static extern IntPtr CreateEventW(IntPtr attr, bool manualReset, bool initialState, string name);
  [DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  static extern IntPtr CreateFileMappingW(IntPtr hFile, IntPtr attr, uint protect, uint maxHi, uint maxLo, string name);
  [DllImport("kernel32.dll", SetLastError=true)]
  static extern IntPtr MapViewOfFile(IntPtr hMap, uint access, uint offHi, uint offLo, UIntPtr bytes);
  [DllImport("kernel32.dll", SetLastError=true)]
  static extern bool SetEvent(IntPtr h);
  [DllImport("kernel32.dll", SetLastError=true)]
  static extern uint WaitForSingleObject(IntPtr h, uint ms);
  [DllImport("kernel32.dll", SetLastError=true)]
  static extern bool UnmapViewOfFile(IntPtr p);
  [DllImport("kernel32.dll", SetLastError=true)]
  static extern bool CloseHandle(IntPtr h);

  public static int Run(string outPath, string stopPath) {
    IntPtr bufReady  = CreateEventW(IntPtr.Zero, false, true,  "DBWIN_BUFFER_READY");
    IntPtr dataReady = CreateEventW(IntPtr.Zero, false, false, "DBWIN_DATA_READY");
    if (bufReady == IntPtr.Zero || dataReady == IntPtr.Zero)
      throw new Exception("Could not create DBWIN events; another debugger may own them.");

    IntPtr map = CreateFileMappingW(new IntPtr(-1), IntPtr.Zero, 0x04, 0, 4096, "DBWIN_BUFFER");
    if (map == IntPtr.Zero) throw new Exception("Could not create DBWIN_BUFFER.");
    IntPtr view = MapViewOfFile(map, 0x0004, 0, 0, (UIntPtr)4096);
    if (view == IntPtr.Zero) throw new Exception("Could not map DBWIN_BUFFER.");

    int count = 0;
    using (StreamWriter w = new StreamWriter(outPath, false, new UTF8Encoding(false))) {
      w.AutoFlush = true;
      while (!File.Exists(stopPath)) {
        SetEvent(bufReady);
        if (WaitForSingleObject(dataReady, 250) != 0) continue;
        int pid = Marshal.ReadInt32(view);
        string msg = Marshal.PtrToStringAnsi(new IntPtr(view.ToInt64() + 4));
        if (msg == null) msg = "";
        w.WriteLine("[" + pid + "] " + msg.TrimEnd('\r', '\n'));
        count++;
      }
    }
    UnmapViewOfFile(view); CloseHandle(map); CloseHandle(bufReady); CloseHandle(dataReady);
    return count;
  }
}
'@

function Start-Capture([string]$logPath) {
  $stopPath = "$logPath.stop"
  if (Test-Path $stopPath) { Remove-Item $stopPath -Force }
  if (-not (Test-Path $evidence)) { New-Item -ItemType Directory $evidence | Out-Null }

  $job = Start-Job -ScriptBlock {
    param($src, $out, $stop)
    Add-Type -TypeDefinition $src -Language CSharp | Out-Null
    [DbWin]::Run($out, $stop)
  } -ArgumentList $listenerSource, $logPath, $stopPath

  Start-Sleep -Milliseconds 1200
  if ($job.State -eq 'Failed') {
    $err = (Receive-Job $job -ErrorAction SilentlyContinue) 2>&1
    Remove-Job $job -Force -ErrorAction SilentlyContinue
    throw "Listener failed to start: $err`nClose DebugView or any attached debugger and retry."
  }
  Write-Host "  [capture] listening -> $logPath" -ForegroundColor Cyan
  return @{ Job = $job; Stop = $stopPath; Log = $logPath }
}

function Stop-Capture($cap) {
  New-Item -ItemType File -Path $cap.Stop -Force | Out-Null
  Wait-Job $cap.Job -Timeout 15 | Out-Null
  Receive-Job $cap.Job -ErrorAction SilentlyContinue | Out-Null
  Remove-Job $cap.Job -Force -ErrorAction SilentlyContinue
  Remove-Item $cap.Stop -Force -ErrorAction SilentlyContinue
  $lines = 0
  if (Test-Path $cap.Log) { $lines = (Get-Content $cap.Log | Measure-Object -Line).Lines }
  Write-Host "  [capture] stopped, $lines lines -> $($cap.Log)" -ForegroundColor Cyan
  return $lines
}

function Invoke-Host32([string]$label, [string]$reportPath, [string]$logPath) {
  if (-not (Test-Path $host32)) { throw "host32.exe not found at $host32" }
  # Checked before the capture starts, so a missing tool does not waste a run.
  if (-not (Test-Path $fakefreeze)) {
    throw "fakefreeze.exe not found at $fakefreeze`nBuild it: ./windows/src/support/fakefreeze/build.sh --debug build:x86"
  }

  Write-Host ''
  Write-Host '  Select the GH-8064 test keyboard in Keyman before continuing.' -ForegroundColor Yellow
  Write-Host '  host32 opens its own window and drives the sequence itself -- do not type into it,' -ForegroundColor Yellow
  Write-Host '  and do not touch the keyboard while it runs.' -ForegroundColor Yellow
  if ($NoPrompt) {
    Write-Host '  -NoPrompt: starting immediately. Select the keyboard once host32 appears --' -ForegroundColor Yellow
    Write-Host "  it waits up to $WaitForRule s for a rule to fire." -ForegroundColor Yellow
  } else {
    Read-Host '  Press Enter when the keyboard is selected'
  }

  $cap = Start-Capture $logPath
  try {
    Write-Host "  running host32 ($label), $Iterations iterations ..." -ForegroundColor White
    # Two things this line has to get right, both of which bit once:
    #  - host32 is /SUBSYSTEM:WINDOWS, so '&' returns immediately and the capture would
    #    stop before the run finished. Start-Process -Wait is required.
    #  - -ArgumentList with an ARRAY joins the elements unquoted, so a path containing
    #    spaces (this directory has two) splits into several tokens. host32's ParseArgs
    #    sets ok=FALSE on any token it does not recognise and prints usage, which reads
    #    like a wrong flag rather than a quoting fault. Build one quoted string instead.
    $argString = '--fakefreeze "{0}" --probe {1} --wait-for-rule {2} --iterations {3} --out "{4}"' -f `
      $fakefreeze, $Probe, $WaitForRule, $Iterations, $reportPath
    Write-Host "  args: $argString" -ForegroundColor DarkGray
    $p = Start-Process -FilePath $host32 -ArgumentList $argString -Wait -PassThru
    Write-Host "  host32 exit code: $($p.ExitCode)"
  } finally {
    Start-Sleep -Seconds 1
    Stop-Capture $cap | Out-Null
  }

  if (Test-Path $reportPath) {
    Write-Host ''
    Write-Host '  --- host32 report tail ---' -ForegroundColor Cyan
    Get-Content $reportPath -Tail 15 | ForEach-Object { Write-Host "  $_" }
  } else {
    Write-Host '  [WARN] host32 wrote no report file' -ForegroundColor Yellow
  }

  # A phase must not record itself done when the run did not happen. host32 exiting 3
  # on a usage error once left runA marked complete with no report and an empty log --
  # a false green of exactly the kind this spec exists to prevent.
  # host32 exit codes: 0 PASS, 1 FAIL (reproduced), 2 INCONCLUSIVE, 3 usage error.
  # Only 0 and 1 are runs that happened. 2 means no rule fired, so no batch was ever
  # assembled and a clean modifier state proves nothing -- recording that as done was
  # the same false green as before, one exit code further along.
  $ok = ($p.ExitCode -eq 0 -or $p.ExitCode -eq 1) -and (Test-Path $reportPath)
  if (-not $ok) {
    Write-Host '  [NOT RECORDED] the run did not produce a report; phase left incomplete' -ForegroundColor Red
  }
  return $ok
}

function Invoke-Analyze {
  $logA = Join-Path $evidence "dbgview-shipped-$stamp.log"
  $logB = Join-Path $evidence "dbgview-branch-$stamp.log"

  Write-Host ''
  Write-Host '=== Signal verdicts ===' -ForegroundColor Cyan
  Write-Host ''
  Write-Host ('{0,-38} {1,-9} {2,-8} {3}' -f 'signal', 'shipped', 'branch', 'verdict')
  Write-Host ('{0,-38} {1,-9} {2,-8} {3}' -f '------', '-------', '------', '-------')

  foreach ($s in $SIGNALS) {
    $a = 0; $b = 0
    if (Test-Path $logA) { $a = @(Select-String -Path $logA -Pattern $s.Pattern).Count }
    if (Test-Path $logB) { $b = @(Select-String -Path $logB -Pattern $s.Pattern).Count }

    if ($s.Unloggable) {
      $verdict = 'NOT LOGGABLE -- the code emits no log line; needs instrumentation or a recorded decision'
    } elseif ($b -gt 0) {
      $verdict = '[measured] discriminating'
      if ($s.BranchOnly -and $a -gt 0) { $verdict = '[measured] but ALSO on shipped -- not branch-only after all' }
    } elseif ($s.Rare) {
      $verdict = '[source-derived, rare by design] -- satisfies FR-012b'
    } elseif (-not (Test-Path $logB)) {
      $verdict = 'pending -- branch run not done yet'
    } else {
      $verdict = 'NOT OBSERVED -- investigate before recording'
    }
    $scope = 'both builds'
    if ($s.BranchOnly) { $scope = 'branch only' }
    Write-Host ('{0,-38} {1,-9} {2,-8} {3}' -f $s.Row, $a, $b, $verdict)
    Write-Host ('{0,-38} {1}' -f '', "   exists on: $scope") -ForegroundColor DarkGray
  }

  Write-Host ''
  Write-Host 'Branch-only signals: 0 on shipped is CORRECT, not a miss. The scan-code signal' -ForegroundColor DarkGray
  Write-Host 'is pre-existing and should fire on both builds.' -ForegroundColor DarkGray
  Write-Host 'A non-rare signal at 0 on BOTH usually means the capture missed it rather than' -ForegroundColor DarkGray
  Write-Host 'that it did not fire. Check the Keyman-ish counts below before recording a verdict.' -ForegroundColor DarkGray
  Write-Host ''
  # Count ENGINE lines specifically. Two looser attempts both scored an empty engine
  # log as healthy: matching /keyman/ caught host32's own status text, and matching
  # /\.cpp:\d+/ caught an unrelated process on this machine that logs file:line the
  # same way. DebugEventTrace writes DEBUG_PLATFORM_STRINGW then TAB as the first
  # field of every engine line, so anchor on that after the listener's [pid] prefix.
  foreach ($p in @($logA, $logB)) {
    if (-not (Test-Path $p)) {
      Write-Host ('  {0}: MISSING' -f (Split-Path $p -Leaf)) -ForegroundColor Yellow
      continue
    }
    $tot = (Get-Content $p | Measure-Object -Line).Lines
    $eng = @(Select-String -Path $p -Pattern '^\[\d+\] (x86|x64|arm64)\t').Count
    Write-Host ('  {0}: {1} lines, {2} engine lines' -f (Split-Path $p -Leaf), $tot, $eng)
    if ($eng -eq 0) {
      Write-Host '    [WARN] no engine log lines at all. Every verdict above is uninformative:' -ForegroundColor Yellow
      Write-Host '           the flags are read once at Keyman_Initialise, so run -Phase arm' -ForegroundColor Yellow
      Write-Host '           (which restarts Keyman) and repeat this run.' -ForegroundColor Yellow
    }
  }
  Write-Host ''
  Write-Host 'Path 6 (UpdateLocalModifierState) is driven by ordinary pass-through traffic in' -ForegroundColor DarkGray
  Write-Host 'the same run -- that closes T070 and feeds T070a (FR-010a).' -ForegroundColor DarkGray
}

function Invoke-Status {
  $s = Get-State
  Write-Host ''
  Write-Host '=== T067 capture status ===' -ForegroundColor Cyan
  Show-InstalledBuild
  $elev = 'no'; if (Test-Elevated) { $elev = 'YES' }
  Write-Host "  this shell elevated    : $elev"

  $dbg = '(unset)'; $dbc = '(unset)'
  if (Test-Path $regKey) {
    $p = Get-ItemProperty $regKey -ErrorAction SilentlyContinue
    if ($null -ne $p.'debug') { $dbg = $p.'debug' }
    if ($null -ne $p.'debug to console') { $dbc = $p.'debug to console' }
  }
  Write-Host "  debug / to console     : $dbg / $dbc"
  Write-Host ''
  $m = @{ $true = 'x'; $false = ' ' }
  Write-Host ("  [{0}] 1 arm       (either)  registry flags on" -f $m[[bool]$s.armed])
  Write-Host ("  [{0}] 2 keyboard  (ADMIN)   test keyboard installed" -f $m[[bool]$s.keyboard])
  Write-Host ("  [{0}] 3 runA      (normal)  shipped build: expect 5/5 FAIL, no signals" -f $m[[bool]$s.runA])
  Write-Host ("  [{0}] 4 deploy    (ADMIN)   branch DLL installed" -f $m[[bool]$s.deployed])
  Write-Host ("  [{0}] 5 runB      (normal)  branch build: expect 0/5 PASS, signals fire" -f $m[[bool]$s.runB])
  Write-Host ("  [{0}] 6 restore   (ADMIN)   shipped DLL back" -f $m[[bool]$s.restored])
  Write-Host ''
}

switch ($Phase) {

  'arm' {
    if (-not (Test-Path $regKey)) { New-Item -Path $regKey -Force | Out-Null }
    Set-ItemProperty -Path $regKey -Name 'debug'            -Value 1 -Type DWord
    Set-ItemProperty -Path $regKey -Name 'debug to console' -Value 1 -Type DWord
    Write-Host '[OK] debug + debug to console = 1 (HKCU)' -ForegroundColor Green
    $restarted = Restart-Keyman
    Write-Host '     The flags are read once, at Keyman_Initialise. Without the restart the'
    Write-Host '     engine keeps debug=FALSE and logs nothing, and that silence is'
    Write-Host '     indistinguishable from a signal that did not fire.'
    # Only record armed when the engine actually reloaded. Setting the registry is not
    # the same as the engine having read it.
    if ($restarted) { Set-State 'armed' $true }
    else { Write-Host '[NOT RECORDED] arm incomplete: the engine did not reload the flags' -ForegroundColor Red }
  }

  'keyboard' {
    Assert-Elevation $true 'keyboard'
    & $deploy -InstallKeyboard
    Set-State 'keyboard' $true
  }

  'runA' {
    Assert-Elevation $false 'runA'
    $len = Get-InstalledDllLength
    if ($len -ne $SHIPPED_LEN) {
      Write-Host "[WARN] installed DLL is $len, expected the SHIPPED $SHIPPED_LEN." -ForegroundColor Yellow
      Write-Host '       Run A is the contrast run and must use the shipped engine.' -ForegroundColor Yellow
      if ((Read-Host '       Continue anyway? (y/N)') -ne 'y') { return }
    }
    $ok = Invoke-Host32 'shipped' (Join-Path $evidence "run-serializer-shipped-$stamp.txt") `
                                  (Join-Path $evidence "dbgview-shipped-$stamp.log")
    Write-Host ''
    Write-Host '[expect] 5/5 FAIL (wedge reproduces) and NO serializer signals.' -ForegroundColor Yellow
    Write-Host '         This run re-establishes rows 1/1b as "mitigated, measured".'
    if ($ok) { Set-State 'runA' $true }
  }

  'deploy' {
    Assert-Elevation $true 'deploy'
    & $deploy -DeployBranchBuild
    Show-InstalledBuild
    Set-State 'deployed' $true
  }

  'runB' {
    Assert-Elevation $false 'runB'
    $len = Get-InstalledDllLength
    if ($len -ne $BRANCH_LEN) {
      Write-Host "[WARN] installed DLL is $len, expected the BRANCH $BRANCH_LEN." -ForegroundColor Yellow
      Write-Host '       Run B is the authoritative capture and must use the branch engine.' -ForegroundColor Yellow
      if ((Read-Host '       Continue anyway? (y/N)') -ne 'y') { return }
    }
    $ok = Invoke-Host32 'branch' (Join-Path $evidence "run-serializer-branch-$stamp.txt") `
                                 (Join-Path $evidence "dbgview-branch-$stamp.log")
    Write-Host ''
    Write-Host '[expect] 0/5 PASS, and the serializer signals present.' -ForegroundColor Yellow
    if ($ok) { Set-State 'runB' $true }
    Invoke-Analyze
  }

  'restore' {
    Assert-Elevation $true 'restore'
    & $deploy -Restore
    Show-InstalledBuild
    # Verify by size, do not take the script's word for it. A poisoned backup chain
    # once made -Restore reinstate the BRANCH build while printing [OK] restored, and
    # this phase recorded itself done over the top of that.
    $len = Get-InstalledDllLength
    if ($len -eq $SHIPPED_LEN) {
      Write-Host '[OK] shipped engine is back' -ForegroundColor Green
      Set-State 'restored' $true
    } else {
      Write-Host ''
      Write-Host ("[FAIL] installed DLL is {0}, expected the shipped {1}." -f $len, $SHIPPED_LEN) -ForegroundColor Red
      Write-Host '       The restore did NOT happen. Check gh8064-backup for a backup whose size' -ForegroundColor Red
      Write-Host '       is the shipped one; a backup taken while the branch build was already' -ForegroundColor Red
      Write-Host '       installed will restore the branch build.' -ForegroundColor Red
      Write-Host '[NOT RECORDED] restore incomplete' -ForegroundColor Red
    }
  }

  'disarm' {
    Remove-ItemProperty -Path $regKey -Name 'debug' -ErrorAction SilentlyContinue
    Remove-ItemProperty -Path $regKey -Name 'debug to console' -ErrorAction SilentlyContinue
    Write-Host '[OK] debug flags removed' -ForegroundColor Green
    Set-State 'armed' $false
  }

  'analyze' { Invoke-Analyze }
  'status'  { Invoke-Status }

  'menu' {
    $map = @{
      '1' = 'arm'; '2' = 'keyboard'; '3' = 'runA'; '4' = 'deploy'
      '5' = 'runB'; '6' = 'restore'; '7' = 'disarm'; '8' = 'analyze'; '9' = 'status'
    }
    while ($true) {
      Invoke-Status
      Write-Host 'Choose a phase (q to quit):'
      Write-Host '  1 arm       2 keyboard*  3 runA      4 deploy*'
      Write-Host '  5 runB      6 restore*   7 disarm    8 analyze    9 status'
      Write-Host '  (* = needs ADMIN; 3 and 5 must NOT be elevated; 1/7 either)' -ForegroundColor DarkGray
      $c = Read-Host '>'
      if ($c -eq 'q') { break }
      if (-not $map.ContainsKey($c)) { Write-Host 'not a phase' -ForegroundColor Red; continue }
      try {
        & $PSCommandPath -Phase $map[$c] -Iterations $Iterations -Probe $Probe -WaitForRule $WaitForRule
      } catch {
        Write-Host "[ERROR] $_" -ForegroundColor Red
      }
      Write-Host ''
      Read-Host 'Enter to return to the menu' | Out-Null
    }
  }
}
