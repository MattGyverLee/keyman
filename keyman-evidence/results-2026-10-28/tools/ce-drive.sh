#!/usr/bin/env bash
# ce-drive.sh <worktree-relative-dir> <logfile> [build.sh args...]
# Runs KEYMAN_DELPHI_CE=1 ./build.sh with stdin fed by a trigger file:
#   touch "$CE_TRIGGER"  -> sends exactly one Enter to the waiting CE prompt.
# Finishes when build.sh exits; exit code written to "$CE_DONE".
dir=$1; log=$2; shift 2
: "${CE_TRIGGER:?}"; : "${CE_DONE:?}"
rm -f "$CE_TRIGGER" "$CE_DONE"
unset NoDefaultCurrentDirectoryInExePath
export KEYMAN_DELPHI_CE=1 KEYMAN_DELPHI_VERSION=23.0
cd "$dir" || exit 2
( while [ ! -e "$CE_DONE" ]; do
    if [ -e "$CE_TRIGGER" ]; then rm -f "$CE_TRIGGER"; printf '\n'; fi
    sleep 1
  done ) | ( ./build.sh "$@" >"$log" 2>&1; echo $? > "$CE_DONE" )
cat "$CE_DONE"
