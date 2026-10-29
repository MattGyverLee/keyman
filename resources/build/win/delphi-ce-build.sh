#!/usr/bin/env bash
#
# Delphi Community Edition route: build the given top-level targets with one IDE
# build per wave instead of one prompt per Delphi project. Everything else runs
# unattended, from the same build.sh scripts, in the same order as CI.
# The IDE still shows its CE notification during a long build; click OK to go on.
#
#   resources/build/win/delphi-ce-build.sh windows/src developer/src
#
# Each wave: run some build.sh scripts with KEYMAN_DELPHI_CE_PHASE=prepare, so each
# runs its pre-steps, records its Delphi projects, and stops at its first compile not
# yet built; then build that wave's build group ("CE-<n>") in the generated project
# group, reopening it each time (the IDE does not notice the rewrite). The scripts in
# EARLY each get a wave of their own, because later pre-steps run what they build;
# the targets get the last wave. A wave with nothing to build is skipped.
# Finish: run the targets' build.sh normally. Every Delphi compile built since the
# start is skipped; any compile the groups missed falls back to its usual prompt.
#
set -eu
[[ $# -gt 0 ]] || { echo "usage: $0 <build dir relative to KEYMAN_ROOT>..." >&2; exit 2; }
: "${KEYMAN_ROOT:?set KEYMAN_ROOT to the tree to build}"
[[ "${KEYMAN_DELPHI_CE:-}" == "1" ]] || { echo "This route is for Delphi CE: export KEYMAN_DELPHI_CE=1" >&2; exit 2; }
unset NoDefaultCurrentDirectoryInExePath

# In dependency order: later pre-steps run devtools and the other tools (the
# tsysinfox64 dependency build among them), and tsysinfo's pre-step runs tsysinfox64.
# If one is missing, a later wave fails loudly at that pre-step.
EARLY=(common/windows/delphi/tools windows/src/engine/tsysinfox64)

work="$(mktemp -d)"
export KEYMAN_DELPHI_CE_SESSION="$work/session"
: > "$KEYMAN_DELPHI_CE_SESSION"
group="$work/keyman-ce.groupproj"
group_win="$(cygpath -w "$group")"

run_builds() { # $1 = log name, rest = build dirs; prepare phase if KEYMAN_DELPHI_CE_PHASE is set
  local log="$work/$1.log" d; shift
  for d in "$@"; do
    echo "--- $d/build.sh build ($(date +%H:%M:%S))"
    ( cd "$KEYMAN_ROOT/$d" && ./build.sh build < /dev/null ) >> "$log" 2>&1 || {
      echo "FAILED: $d/build.sh build -- see $log" >&2; tail -20 "$log" >&2; exit 1; }
  done
}

# Writes the project group: every recorded project once, in recorded (CI) order,
# with one build group per wave (CE-<n>). Each build group row carries its own
# platforms. No project depends on another: the IDE builds a project's dependencies
# for every platform being built, so a chain would pull Win32-only tools into Win64.
# The IDE builds a build group in the order the projects are listed. It needs the per-project
# targets to list the projects, and reads the build groups from the conditional ItemGroups.
write_group() {
  local list="$work/projects.txt" i n w t sfx all
  local -a names=() paths=() plats=() cfgs=() waves=() guids=()
  # project path|platforms|config|wave, first-seen order, platforms merged
  awk -F'|' '{ k=$1"/"$2; if (!(k in seen)) { seen[k]=++n; key[n]=k; cfg[k]=$4; wave[k]=$5 }
              if (index(";"plat[k]";", ";"$3";")==0) plat[k]=(plat[k]==""?$3:plat[k]";"$3) }
         END { for (i=1;i<=n;i++) print key[i]"|"plat[key[i]]"|"cfg[key[i]]"|"wave[key[i]] }' \
    "$work"/pending-*.txt > "$list"
  local path plat cfg wave guid
  while IFS='|' read -r path plat cfg wave; do
    # a build.sh may name a .dpr, or a path relative to another folder; the IDE needs
    # the .dproj, found by name in the recorded folder or below it
    path="${path%.dpr}"; path="${path%.dproj}.dproj"
    [[ -f "$path" ]] || path="$(find "$(dirname "$path")" -maxdepth 2 -name "$(basename "$path")" | head -1)"
    [[ -f "$path" ]] || { echo "No .dproj for a recorded project ($path); it will fall back to its prompt." >&2; continue; }
    # the IDE matches a group's projects to its targets by project name, so a second
    # project of the same name (Desktop and Developer both have setup.dproj) is left out
    [[ " ${names[*]} " != *" $(basename "${path%.dproj}") "* ]] || {
      echo "A project named $(basename "$path") is already in the group; $path will fall back to its prompt." >&2; continue; }
    guid="$(sed -n 's/.*<ProjectGuid>\([^<]*\)<.*/\1/p' "$path" | head -1)"
    # a row with an empty GUID makes the IDE load no projects at all
    [[ -n "$guid" ]] || { echo "No ProjectGuid in $path; it will fall back to its prompt." >&2; continue; }
    paths+=("$(cygpath -w "$path")"); names+=("$(basename "${path%.dproj}")")
    plats+=("$plat"); cfgs+=("$cfg"); waves+=("$wave"); guids+=("$guid")
  done < "$list"
  n=${#paths[@]}
  # the IDE stops on a "Duplicate GUID" dialog, offering to rewrite one .dproj
  local dup; dup="$(for ((i=0;i<n;i++)); do echo "${guids[i]} ${paths[i]}"; done | sort | awk '$1==g {print p; print $2} {g=$1; p=$2}')"
  [[ -z "$dup" ]] || { echo "These projects share a ProjectGuid; give one of each pair a new GUID:" >&2; echo "$dup" >&2; exit 1; }
  enabled() { [[ "${waves[$1]}" == "$2" ]] && echo True || echo False; }
  {
    printf '\xef\xbb\xbf'
    echo '<Project xmlns="http://schemas.microsoft.com/developer/msbuild/2003">'
    echo '    <PropertyGroup>'
    echo '        <ProjectGuid>{6D3C2A57-0C9E-4B71-9E52-5E1F4A7C0CE1}</ProjectGuid>'
    echo '    </PropertyGroup>'
    echo '    <ItemGroup>'
    for ((i=0;i<n;i++)); do
      echo "        <Projects Include=\"${paths[i]}\">"
      echo '            <Dependencies/>'
      echo '        </Projects>'
    done
    echo '    </ItemGroup>'
    echo '    <ProjectExtensions>'
    echo '        <Borland.Personality>Default.Personality.12</Borland.Personality>'
    echo '        <Borland.ProjectType/>'
    echo '        <BorlandProject>'
    echo '            <Default.Personality/>'
    echo '        </BorlandProject>'
    echo '    </ProjectExtensions>'
    for t in "" :Clean :Make; do
      for ((i=0;i<n;i++)); do
        echo "    <Target Name=\"${names[i]}$t\">"
        echo "        <MSBuild Projects=\"${paths[i]}\"$([[ -n $t ]] && echo " Targets=\"${t#:}\"")/>"
        echo '    </Target>'
      done
    done
    for t in Build Clean Make; do
      sfx=""; [[ $t != Build ]] && sfx=":$t"
      all=""; for ((i=0;i<n;i++)); do all+="${all:+;}${names[i]}$sfx"; done
      echo "    <Target Name=\"$t\">"
      echo "        <CallTarget Targets=\"$all\"/>"
      echo '    </Target>'
    done
    echo '    <Import Project="$(BDS)\Bin\CodeGear.Group.Targets" Condition="Exists('"'"'$(BDS)\Bin\CodeGear.Group.Targets'"'"')"/>'
    for w in $(printf '%s
' "${waves[@]}" | sort -un); do
      echo "    <ItemGroup Condition=\"'\$(BuildGroup)'=='CE-$w'\">"
      for ((i=0;i<n;i++)); do
        echo "        <BuildGroupProject Include=\"${paths[i]}\">"
        echo "            <ProjectGuid>${guids[i]}</ProjectGuid>"
        echo "            <Configurations>${cfgs[i]}</Configurations>"
        echo "            <Platforms>${plats[i]}</Platforms>"
        echo "            <Enabled>$(enabled $i $w)</Enabled>"
        echo '        </BuildGroupProject>'
      done
      echo '    </ItemGroup>'
    done
    echo '</Project>'
  } | sed 's/$/\r/' > "$group"
  echo "Project group: $group_win ($n projects)"
}

wait_click() { # $1 = build group name
  echo
  echo "=== In the Delphi IDE: open $group_win (if it is already open, close it and"
  echo "    open it again: the IDE does not notice that this script rewrote it),"
  echo "    show the Build Groups pane, pick Active Group '$1', and press its Build button."
  echo "    Then press Enter here. Ctrl-C aborts."
  read -r _ || { echo "No Enter received (stdin closed): stopping." >&2; exit 1; }
}

wave=0
prepare_wave() { # build dirs; records their compiles and asks for one IDE build of them
  wave=$((wave + 1))
  export KEYMAN_DELPHI_CE_PENDING="$work/pending-raw-$wave.txt"
  : > "$KEYMAN_DELPHI_CE_PENDING"
  run_builds "prepare-$wave" "$@"
  sed "s/\$/|$wave/" "$KEYMAN_DELPHI_CE_PENDING" > "$work/pending-$wave.txt"
  [[ -s "$work/pending-$wave.txt" ]] || { echo "Wave $wave: nothing to build."; return 0; }
  write_group
  wait_click "CE-$wave"
}

export KEYMAN_DELPHI_CE_PHASE=prepare
for d in "${EARLY[@]}"; do prepare_wave "$d"; done
prepare_wave "$@"

unset KEYMAN_DELPHI_CE_PHASE KEYMAN_DELPHI_CE_PENDING
echo "=== Finish: the normal build, CI order; Delphi compiles built since the start are skipped."
for d in "$@"; do
  echo "--- $d/build.sh build"
  ( cd "$KEYMAN_ROOT/$d" && ./build.sh build )
done
echo "Delphi CE route complete. Work files: $work"
