#!/usr/bin/env bash
#
# Delphi Community Edition route: build the given top-level targets with one IDE
# build per wave (two in all) instead of one prompt per Delphi project. Everything
# else runs unattended, from the same build.sh scripts, in the same order as CI.
# The IDE still shows its CE notification during a long build; click OK to go on.
#
#   resources/build/win/delphi-ce-build.sh windows/src developer/src
#
# 1. Prepare, wave 1: run the tool scripts whose outputs other scripts' pre-steps
#    use. With KEYMAN_DELPHI_CE_PHASE=prepare each script runs its pre-steps,
#    records its Delphi projects, and stops at its first compile not yet built.
# 2. Click 1: in the generated project group, build the build group "CE-1".
# 3. Prepare, wave 2: run the targets. The tools now exist, so their codegen runs;
#    every other script stops at its first compile, its projects recorded.
# 4. Click 2: reopen the regenerated group (the IDE does not notice the rewrite)
#    and build the build group "CE-2".
# 5. Finish: run the targets' build.sh normally. Every Delphi compile built since
#    step 1 is skipped; any compile the groups missed falls back to its usual prompt.
#
set -eu
[[ $# -gt 0 ]] || { echo "usage: $0 <build dir relative to KEYMAN_ROOT>..." >&2; exit 2; }
: "${KEYMAN_ROOT:?set KEYMAN_ROOT to the tree to build}"
[[ "${KEYMAN_DELPHI_CE:-}" == "1" ]] || { echo "This route is for Delphi CE: export KEYMAN_DELPHI_CE=1" >&2; exit 2; }
unset NoDefaultCurrentDirectoryInExePath

# Tool scripts whose outputs other scripts' pre-steps run (devtools codegen, the
# standards data, the tsysinfox64 resource). If one is missing, wave 2 fails loudly
# at that pre-step rather than building on a stale or missing input.
WAVE1=(common/windows/delphi/tools windows/src/engine/tsysinfox64)

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
# with one build group per wave (CE-1, CE-2). Each build group row carries its own
# platforms. No project depends on another: the IDE builds a project's dependencies
# for every platform being built, so a chain would pull Win32-only tools into Win64.
# The IDE builds a build group in the order the projects are listed.
write_group() {
  local list="$work/projects.txt" i n w t sfx all
  local -a names=() paths=() plats=() cfgs=() waves=() guids=()
  # project path|platforms|config|wave, first-seen order, platforms merged
  awk -F'|' '{ k=$1"/"$2; if (!(k in seen)) { seen[k]=++n; key[n]=k; cfg[k]=$4; wave[k]=$5 }
              if (index(";"plat[k]";", ";"$3";")==0) plat[k]=(plat[k]==""?$3:plat[k]";"$3) }
         END { for (i=1;i<=n;i++) print key[i]"|"plat[key[i]]"|"cfg[key[i]]"|"wave[key[i]] }' \
    "$work"/pending-*.txt > "$list"
  local path plat cfg wave
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
    paths+=("$(cygpath -w "$path")"); names+=("$(basename "${path%.dproj}")")
    plats+=("$plat"); cfgs+=("$cfg"); waves+=("$wave")
    guids+=("$(sed -n 's/.*<ProjectGuid>\([^<]*\)<.*/\1/p' "$path" | head -1)")
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
    echo '            <BuildGroups>'
    for w in 1 2; do
      echo "                <BuildGroup Name=\"CE-$w\" Active=\"$([[ $w == "$1" ]] && echo True || echo False)\">"
      for ((i=0;i<n;i++)); do
        echo "                    <BuildGroupProject Name=\"${paths[i]}\" ProjectGUID=\"${guids[i]}\" Configurations=\"${cfgs[i]}\" Platforms=\"${plats[i]}\" Enabled=\"$(enabled $i $w)\"/>"
      done
      echo '                </BuildGroup>'
    done
    echo '            </BuildGroups>'
    echo '        </BorlandProject>'
    echo '    </ProjectExtensions>'
    # the IDE does not list the projects of a group file without these targets
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
    for w in 1 2; do
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

export KEYMAN_DELPHI_CE_PHASE=prepare
export KEYMAN_DELPHI_CE_PENDING="$work/pending-raw-1.txt"
run_builds prepare-1 "${WAVE1[@]}"
sed 's/$/|1/' "$work/pending-raw-1.txt" > "$work/pending-1.txt"
write_group 1
wait_click CE-1

export KEYMAN_DELPHI_CE_PENDING="$work/pending-raw-2.txt"
run_builds prepare-2 "$@"
sed 's/$/|2/' "$work/pending-raw-2.txt" > "$work/pending-2.txt"
write_group 2
wait_click CE-2

unset KEYMAN_DELPHI_CE_PHASE KEYMAN_DELPHI_CE_PENDING
echo "=== Finish: the normal build, CI order; Delphi compiles built since the start are skipped."
for d in "$@"; do
  echo "--- $d/build.sh build"
  ( cd "$KEYMAN_ROOT/$d" && ./build.sh build )
done
echo "Delphi CE route complete. Work files: $work"
