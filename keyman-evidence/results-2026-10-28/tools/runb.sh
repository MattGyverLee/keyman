#!/usr/bin/env bash
# usage: runb.sh <logname> <dir> <stdin-mode: null|enter|tty> <ce: set|unset> -- build.sh args
log=/c/Github/keyman-test-evidence/keyman-evidence/results-2026-10-28/logs/$1; dir=$2; mode=$3; ce=$4; shift 5
unset NoDefaultCurrentDirectoryInExePath
export KEYMAN_DELPHI_VERSION=23.0
if [[ $ce == set ]]; then export KEYMAN_DELPHI_CE=1; else unset KEYMAN_DELPHI_CE; fi
cd "$dir"
echo "# cwd=$PWD date=$(date -Is) host=$(hostname) HEAD=$(git rev-parse --short=10 HEAD)" > $log.out
echo "# KEYMAN_DELPHI_CE='${KEYMAN_DELPHI_CE-<unset>}' KEYMAN_DELPHI_VERSION='$KEYMAN_DELPHI_VERSION' NoDefaultCurrentDirectoryInExePath='${NoDefaultCurrentDirectoryInExePath-<unset>}' stdin=$mode" >> $log.out
echo "# cmd: ./build.sh $*" >> $log.out
# trace every bash (incl. child build.sh) to count dcc32 probe spawns
exec 9>>$log.xtrace; export BASH_XTRACEFD=9; export PS4='+[$$] '
set -x; export SHELLOPTS
case $mode in
  null)  ./build.sh "$@" </dev/null >>$log.out 2>&1 ;;
  enter) printf '\n' | ./build.sh "$@" >>$log.out 2>&1 ;;
esac
rc=$?
set +x
echo "# exit=$rc" >> $log.out
n=$(grep -cE "^\+\+\[[0-9]+\] '/c/Program Files \(x86\)/Embarcadero/Studio/23.0/bin/dcc32.exe'$" $log.xtrace)
echo "dcc32 spawns (probe exec lines in xtrace): $n" >> $log.out
