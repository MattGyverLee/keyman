#!/usr/bin/env bash
# fix2-ce-tests.sh <test-id> — CLI tests for the fix2/16191 CE prompt changes.
# Simulated outputs only (no IDE build). Every run: NoDefaultCurrentDirectoryInExePath
# unset, KEYMAN_DELPHI_VERSION=23.0, KEYMAN_DELPHI_CE set or unset explicitly.
# "drive" runs build.sh with stdin fed one Enter per touch of a trigger file
# (same approach as ce-drive.sh); a background watcher waits for the Nth
# "press Enter" prompt in the log, runs a setup action (touch outputs), then
# sends Enter.
W=/c/Github/keyman-fix-delphi
LOGS=/c/Github/keyman-test-evidence/keyman-evidence/results-2026-10-28/logs
unset NoDefaultCurrentDirectoryInExePath
export KEYMAN_DELPHI_VERSION=23.0

hdr() { # log dir ce stdin cmd
  echo "# test=$1 cwd=$2 date=$(date -Is) host=$(hostname) HEAD=$(git -C $W rev-parse --short=10 HEAD) branch=$(git -C $W branch --show-current)"
  echo "# KEYMAN_DELPHI_CE='${KEYMAN_DELPHI_CE-<unset>}' KEYMAN_DELPHI_VERSION='$KEYMAN_DELPHI_VERSION' NoDefaultCurrentDirectoryInExePath='${NoDefaultCurrentDirectoryInExePath-<unset>}' stdin=$3"
  echo "# cmd: ./build.sh $4"
}

# drive <log> <dir> <action-for-prompt-1> [<action-for-prompt-2> ...] -- build args
drive() {
  local log=$1 dir=$2; shift 2
  local actions=()
  while [[ $1 != -- ]]; do actions+=("$1"); shift; done; shift
  local trig=$(mktemp -u) done=$(mktemp -u)
  hdr "$(basename $log)" "$dir" drive "$*" > "$log"
  ( cd "$dir"
    ( while [ ! -e "$done" ]; do
        if [ -e "$trig" ]; then rm -f "$trig"; printf '\n'; fi
        sleep 0.2
      done ) | ( ./build.sh "$@" >>"$log" 2>&1; echo $? > "$done" ) ) &
  local n=0 a
  for a in "${actions[@]}"; do
    n=$((n+1))
    until [[ -e $done ]] || (( $(grep -c 'press Enter' "$log") >= n )); do sleep 0.3; done
    [[ -e $done ]] && break
    sleep 1
    echo "# [watcher $(date +%T.%N)] prompt $n seen; action: $a" >> "$log"
    ( cd "$dir"; eval "$a" ) >> "$log" 2>&1
    sleep 1
    echo "# [watcher $(date +%T.%N)] sending Enter for prompt $n" >> "$log"
    touch "$trig"
  done
  wait
  echo "# exit=$(cat $done)" >> "$log"
  rm -f "$done" "$trig"
}

plain() { # <log> <dir> <stdin null|enter> -- args
  local log=$1 dir=$2 mode=$3; shift 4
  hdr "$(basename $log)" "$dir" "$mode" "$*" > "$log"
  ( cd "$dir"
    case $mode in
      null)  ./build.sh "$@" </dev/null >>"$log" 2>&1 ;;
      enter) printf '\n' | ./build.sh "$@" >>"$log" 2>&1 ;;
    esac
    echo "# exit=$?" >> "$log" )
}

DEVT=$W/common/windows/delphi/tools/devtools
TOOLS=$W/common/windows/delphi/tools
TSX=$W/windows/src/engine/tsysinfox64
COMP=$W/common/windows/delphi/components
BPL=$W/common/windows/lib/common_components.bpl
fake() { mkdir -p "$(dirname "$1")"; printf 'SIMULATED\n' > "$1"; }

case $1 in
  T1) unset KEYMAN_DELPHI_CE
      plain $LOGS/fix2-T1-ce-unset.out $DEVT null -- build ;;
  T2) export KEYMAN_DELPHI_CE=1
      plain $LOGS/fix2-T2-ce1-stdin-closed.out $TSX null -- build --no-deps ;;
  T3) export KEYMAN_DELPHI_CE=1
      plain $LOGS/fix2-T3-ce1-enter-no-build.out $TSX enter -- build --no-deps ;;
  T3b) # stale-but-present output (2020) + Enter without building
      export KEYMAN_DELPHI_CE=1
      fake $TSX/bin/Win64/Debug/tsysinfox64.exe; touch -d 2020-01-01 $TSX/bin/Win64/Debug/tsysinfox64.exe
      plain $LOGS/fix2-T3b-ce1-enter-stale-output.out $TSX enter -- build --no-deps
      ls -l --time-style=full-iso $TSX/bin/Win64/Debug/tsysinfox64.exe >> $LOGS/fix2-T3b-ce1-enter-stale-output.out
      rm -f $TSX/bin/Win64/Debug/tsysinfox64.exe ;;
  T4) # output written AFTER the prompt by the background watcher, then Enter
      export KEYMAN_DELPHI_CE=1
      rm -rf $DEVT/bin
      drive $LOGS/fix2-T4-ce1-output-after-prompt.out $DEVT \
        'fake bin/Win32/Debug/devtools.exe; ls -l --time-style=full-iso bin/Win32/Debug/devtools.exe' -- build
      rm -rf $DEVT/bin ;;
  T5) # package: .bpl at its real DCC_BplOutput location, written after the prompt
      export KEYMAN_DELPHI_CE=1
      rm -f $BPL
      drive $LOGS/fix2-T5-ce1-package-bpl-after-prompt.out $COMP \
        "fake $BPL; ls -l --time-style=full-iso $BPL" -- build --no-deps
      rm -f $BPL ;;
  T6) # output older than the session marker (written before this top-level
      # run started, and newer than devtools.dpr) -> must NOT be skipped
      export KEYMAN_DELPHI_CE=1
      rm -rf $DEVT/bin; fake $DEVT/bin/Win32/Debug/devtools.exe
      { ls -l --time-style=full-iso $DEVT/devtools.dpr $DEVT/bin/Win32/Debug/devtools.exe; } > $LOGS/fix2-T6-setup.txt
      sleep 2
      plain $LOGS/fix2-T6-ce1-output-older-than-session.out $DEVT null -- build
      rm -rf $DEVT/bin ;;
  T7) # same top-level run: at the buildunidata prompt (child 1), simulate a
      # Build All that also writes devtools.exe (child 2) -> devtools prompt skipped
      export KEYMAN_DELPHI_CE=1
      rm -rf $DEVT/bin $TOOLS/buildunidata/bin
      drive $LOGS/fix2-T7-ce1-same-run-skip.out $TOOLS \
        'fake buildunidata/bin/Win32/Debug/buildunidata.exe; fake devtools/bin/Win32/Debug/devtools.exe; ls -l --time-style=full-iso buildunidata/bin/Win32/Debug/buildunidata.exe devtools/bin/Win32/Debug/devtools.exe' \
        'echo UNEXPECTED second prompt' -- build:buildunidata build:devtools
      # T7b: a NEW top-level run right after: same outputs, now from a previous run
      hdr fix2-T7b "$DEVT" null build > $LOGS/fix2-T7b-new-run-not-skipped.out
      ( cd $DEVT; ./build.sh build </dev/null >> $LOGS/fix2-T7b-new-run-not-skipped.out 2>&1; echo "# exit=$?" >> $LOGS/fix2-T7b-new-run-not-skipped.out )
      rm -rf $DEVT/bin $TOOLS/buildunidata/bin ;;
esac
