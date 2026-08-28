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
  [int]$WaitForRule = 120
)

$ErrorActionPreference = 'Stop'
$stamp       = '2026-08-28'
$root        = $PSScriptRoot
$evidence    = Join-Path $root 'evidence'
$host32      = Join-Path $root 'host32\host32.exe'
$deploy      = Join-Path $root 'deploy-8064.ps1'
$stateFile   = Join-Path $evidence '.t067-state.json'
$regKey      = 'HKCU:\Software\Keyman\Keyman Engine'
$engineDll   = 'C:\Program Files (x86)\Common Files\Keyman\Keyman Engine\keyman32.dll'
$SHIPPED_LEN = 1232504
$BRANCH_LEN  = 4197376

$SIGNALS = @(
  @{ Key = 'reconcile'; Pattern = 'cache says held but OS says up'; Row = 'keybd_shift reconcile clear';         Rare = $false },
  @{ Key = 'feed';      Pattern = 'Modifier cache feed';            Row = 'hook modifier cache feed';            Rare = $false },
  @{ Key = 'verify';    Pattern = 'verification: OS holds vkey';    Row = 'post-batch verification correction';  Rare = $true  },
  @{ Key = 'scan';      Pattern = 'scan=0x[Ff][Ff]|scan=[Ff][Ff]';  Row = 'injected scan code at the hook';      Rare = $false }
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

  Write-Host ''
  Write-Host '  Select the GH-8064 test keyboard in Keyman before continuing.' -ForegroundColor Yellow
  Write-Host '  host32 opens its own window and drives the sequence itself -- do not type into it,' -ForegroundColor Yellow
  Write-Host '  and do not touch the keyboard while it runs.' -ForegroundColor Yellow
  Read-Host '  Press Enter when the keyboard is selected'

  $cap = Start-Capture $logPath
  try {
    Write-Host "  running host32 ($label), $Iterations iterations ..." -ForegroundColor White
    # host32 is /SUBSYSTEM:WINDOWS, so '&' would return immediately and the capture
    # would stop before the run finished. Start-Process -Wait is required.
    $args = @('--probe', $Probe, '--wait-for-rule', $WaitForRule, '--iterations', $Iterations, '--out', $reportPath)
    $p = Start-Process -FilePath $host32 -ArgumentList $args -Wait -PassThru
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

    if ($b -gt 0) {
      $verdict = '[measured] discriminating'
    } elseif ($s.Rare) {
      $verdict = '[source-derived, rare by design] -- satisfies FR-012b'
    } else {
      $verdict = 'NOT OBSERVED -- investigate before recording'
    }
    Write-Host ('{0,-38} {1,-9} {2,-8} {3}' -f $s.Row, $a, $b, $verdict)
  }

  Write-Host ''
  Write-Host 'Expected shape: 0 on shipped (the code does not exist there), >0 on branch.' -ForegroundColor DarkGray
  Write-Host 'A non-rare signal at 0 on BOTH usually means the capture missed it rather than' -ForegroundColor DarkGray
  Write-Host 'that it did not fire. Check the Keyman-ish counts below before recording a verdict.' -ForegroundColor DarkGray
  Write-Host ''
  foreach ($p in @($logA, $logB)) {
    if (Test-Path $p) {
      $tot = (Get-Content $p | Measure-Object -Line).Lines
      $km = @(Select-String -Path $p -Pattern 'keyman|keybd_shift|serialkeyevent').Count
      Write-Host ('  {0}: {1} lines, {2} Keyman-ish' -f (Split-Path $p -Leaf), $tot, $km)
    } else {
      Write-Host ('  {0}: MISSING' -f (Split-Path $p -Leaf)) -ForegroundColor Yellow
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
    Write-Host '     host32 reads these when it starts, so arm before running it.'
    Set-State 'armed' $true
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
    Invoke-Host32 'shipped' (Join-Path $evidence "run-serializer-shipped-$stamp.txt") `
                            (Join-Path $evidence "dbgview-shipped-$stamp.log")
    Write-Host ''
    Write-Host '[expect] 5/5 FAIL (wedge reproduces) and NO serializer signals.' -ForegroundColor Yellow
    Write-Host '         This run re-establishes rows 1/1b as "mitigated, measured".'
    Set-State 'runA' $true
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
    Invoke-Host32 'branch' (Join-Path $evidence "run-serializer-branch-$stamp.txt") `
                           (Join-Path $evidence "dbgview-branch-$stamp.log")
    Write-Host ''
    Write-Host '[expect] 0/5 PASS, and the serializer signals present.' -ForegroundColor Yellow
    Set-State 'runB' $true
    Invoke-Analyze
  }

  'restore' {
    Assert-Elevation $true 'restore'
    & $deploy -Restore
    Show-InstalledBuild
    Write-Host '[NOTE] Do not skip this. The branch DLL is a Debug build and is loaded into' -ForegroundColor Yellow
    Write-Host '       every hooked 32-bit process on the machine.' -ForegroundColor Yellow
    Set-State 'restored' $true
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
