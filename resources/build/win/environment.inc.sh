# Define the generic build environment for Windows builds, including how to
# launch a Delphi build environment and a Visual Studio build environment

if ! _builder_has_function_been_called builder_parse; then
  builder_die "environment.inc.sh must be sourced after builder_parse is called (for debug flags)"
fi

source "$KEYMAN_ROOT/resources/build/win/configure_environment.inc.sh"

# We always build the generated enviroment files, even in a non-configure step,
# because e.g. clean may require visual studio environment to run
if [[ ! -f "$KEYMAN_ROOT/resources/build/win/environment_generated.inc.sh" ]] ||
  [[ ! -f "$KEYMAN_ROOT/resources/build/win/delphi_environment_generated.inc.sh" ]] ||
  [[ ! -f "$KEYMAN_ROOT/resources/build/win/visualstudio_environment_generated.inc.sh" ]]; then
  configure_windows_build_environment
fi

# We always source the global generated environment but not the compiler-specific generated environments
source "$KEYMAN_ROOT/resources/build/win/environment_generated.inc.sh"

# Windows common environment variables

WINDOWS_ROOT="$KEYMAN_ROOT/windows"
WINDOWS_PROGRAM_APP="$WINDOWS_ROOT/bin/desktop"
WINDOWS_PROGRAM_ENGINE="$WINDOWS_ROOT/bin/engine"
WINDOWS_PROGRAM_SUPPORT="$WINDOWS_ROOT/bin/support"
WINDOWS_DEBUGPATH_APP="$WINDOWS_ROOT/debug/desktop"
WINDOWS_DEBUGPATH_ENGINE="$WINDOWS_ROOT/debug/engine"
WINDOWS_DEBUGPATH_SUPPORT="$WINDOWS_ROOT/debug/support"

COMMON_ROOT="$KEYMAN_ROOT/common/windows/delphi"
OUTLIB="$WINDOWS_ROOT/lib"
COMMON_OUTLIB="$KEYMAN_ROOT/common/windows/lib"

if builder_is_debug_build || [[ $KEYMAN_VERSION_ENVIRONMENT == local ]] || builder_is_ci_test_build; then
  # We do a fast build for debug builds, local builds, test PR builds but not for master/beta/stable release builds
  GO_FAST=1
else
  GO_FAST=0
fi

# Import additional tool-specific variables

source "$KEYMAN_ROOT/resources/build/win/delphi_flags.inc.sh"
source "$KEYMAN_ROOT/resources/build/win/vs_flags.inc.sh"
source "$KEYMAN_ROOT/resources/build/win/signtime.inc.sh"

VERIFY_SIGNATURES_PATH="$KEYMAN_ROOT/common/windows/delphi/tools/verify_signatures"
VERIFY_SIGNATURES="$VERIFY_SIGNATURES_PATH/$WIN32_TARGET_PATH/verify_signatures.exe"
SIGCHECK="$VERIFY_SIGNATURES_PATH/$WIN32_TARGET_PATH/sigcheck.exe"

generate_uuid() {
  (
    source "$KEYMAN_ROOT/resources/build/win/visualstudio_environment.inc.sh"
    uuidgen
  )
}

run_in_vs_env() {
  (
    if [[ "${1-x}" == "--quiet" ]]; then
      shift
    else
      builder_echo heading "### visual_studio: $*"
    fi
    source "$KEYMAN_ROOT/resources/build/win/visualstudio_environment.inc.sh"
    "$@"
  )
}

run_in_delphi_env() {
  (
    if [[ "${1-x}" == "--quiet" ]]; then
      shift
    else
      builder_echo heading "### delphi: $*"
    fi
    source "$KEYMAN_ROOT/resources/build/win/delphi_environment.inc.sh"
    "$@"
  )
}

sentrytool_delphiprep() {
  if builder_is_ci_build && builder_is_ci_build_level_build; then
    builder_echo "Skipping sentrytool_delphiprep - buildLevel=build: $@"
    return 0
  fi

  local EXE_PATH="$1"
  local DPR_PATH="$2"
  (
    builder_echo heading "### delphi: sentrytool_delphiprep $1 $2"
    source "$KEYMAN_ROOT/resources/build/win/delphi_environment.inc.sh"
    "$SENTRYTOOL" delphiprep -r "$KEYMAN_ROOT" -i "$DELPHIINCLUDES" "$(cygpath -w "$EXE_PATH")" -dpr "$DPR_PATH"
  )
}

tds2dbg() {
  builder_if_release_build_level "$TDS2DBG" "$@"
}

# Delphi CE: an IDE build is invisible to this script, so the only evidence
# that it happened is the mtime of the output file at the location the .dproj
# really writes it to.
#
# Session marker: one per top-level build.sh run, shared by every nested
# child/dependency build.sh of that run. It is keyed on builder's per-run
# $_builder_deps_built temp file, which every new top-level run replaces, so a
# marker is never inherited across separate top-level runs. Output older than
# the marker was not built during this run and is never trusted, whatever the
# .dpr/.pas mtimes say. The empty marker file is left in the temp folder.
if [[ "${KEYMAN_DELPHI_CE:-}" == "1" ]]; then
  if [[ -n "${_builder_deps_built:-}" ]]; then
    _KEYMAN_DELPHI_CE_SESSION="${_builder_deps_built}.delphi-ce-session"
  else
    # Not under a builder top-level run: this process is the session
    _KEYMAN_DELPHI_CE_SESSION="$(mktemp)"
  fi
  [[ -e "$_KEYMAN_DELPHI_CE_SESSION" ]] || : > "$_KEYMAN_DELPHI_CE_SESSION"
fi

# Print the files an IDE build of a project writes, one per line: <name>.bpl
# in DCC_BplOutput for a package (.dpk), else <name>.exe/.dll in
# DCC_ExeOutput, with $(Platform) and $(Config) expanded and resolved against
# the .dproj's folder. With no DCC_ExeOutput, assumes bin/<Platform>/<Config>.
# A package also gets the IDE's default package folder, $(BDSCOMMONDIR)\Bpl:
# that is where it goes in a configuration with no DCC_BplOutput (e.g. Jcl and
# JclVcl set one for Release only, so a Debug build lands there).
_delphi_ce_output_files() {
  local project="$1" platform="$2" config="$3"
  local base="${project%.dproj}"
  base="${base%.dpr}"
  local dir name tag exts outdir ext
  dir="$(dirname "$base")"
  name="$(basename "$base")"
  if [[ -f "${base}.dpk" ]]; then
    tag=DCC_BplOutput; exts="bpl"
  else
    tag=DCC_ExeOutput; exts="exe dll"
  fi
  local outdirs=()
  if [[ -f "${base}.dproj" ]]; then
    mapfile -t outdirs < <(sed -n "s|.*<${tag}>\([^<]*\)</${tag}>.*|\1|p" "${base}.dproj" | tr -d '\r' | sort -u)
  fi
  if [[ ${#outdirs[@]} -eq 0 && $tag == DCC_ExeOutput ]]; then
    outdirs=('bin\$(Platform)\$(Config)')
  fi
  for outdir in "${outdirs[@]}"; do
    outdir="${outdir//\$(Platform)/$platform}"
    outdir="${outdir//\$(Config)/$config}"
    outdir="${outdir//\\//}"
    [[ "$outdir" == *'$('* ]] && continue  # other MSBuild macro: not resolvable here
    outdir="${outdir#./}"
    [[ "$outdir" =~ ^(/|[A-Za-z]:/) ]] || [[ "$dir" == "." ]] || outdir="$dir/$outdir"
    for ext in $exts; do
      echo "$outdir/$name.$ext"
    done
  done
  if [[ $tag == DCC_BplOutput ]]; then
    echo "$(cygpath -u "${PUBLIC:-C:\\Users\\Public}")/Documents/Embarcadero/Studio/${KEYMAN_DELPHI_VERSION:-20.0}/Bpl/$name.bpl"
  fi
}

# Returns 0 if any output file of the project is newer than the marker file.
_delphi_ce_output_newer_than() {
  local project="$1" platform="$2" config="$3" marker="$4" output
  while IFS= read -r output; do
    [[ -f "$output" && "$output" -nt "$marker" ]] && return 0
  done < <(_delphi_ce_output_files "$project" "$platform" "$config")
  return 1
}

delphi_msbuild() {
  # When KEYMAN_DELPHI_CE=1 the Delphi Community Edition blocks CLI
  # compilation. Pause and prompt the developer to build in the IDE.
  if [[ "${KEYMAN_DELPHI_CE:-}" == "1" ]]; then
    local project="${1:-<project.dproj>}"
    local platform="Win32"
    local config="${TARGET_PATH:-Debug}"
    local arg
    for arg in "$@"; do
      [[ "$arg" == *Platform=Win64* ]] && platform="Win64"
    done

    # Skip prompt if the output was written earlier in this same top-level
    # run — supports the "Build All in the .groupproj at the first prompt,
    # then the remaining prompts skip themselves" workflow. Output from
    # before this run is never trusted.
    if _delphi_ce_output_newer_than "$project" "$platform" "$config" "$_KEYMAN_DELPHI_CE_SESSION"; then
      builder_echo "Delphi CE: $project ($platform) — output was built earlier in this run, skipping prompt."
      return 0
    fi

    builder_echo warning "Delphi CE: CLI compilation is not available."
    builder_echo warning "Please build ${project} (Platform: ${platform}, Config: ${config}) in the Delphi IDE now, then press Enter to continue (or Ctrl-C to abort)."
    builder_echo warning "Tip: opening the parent .groupproj and running Build All now pre-builds all sibling projects at once; later CE prompts in this run will auto-skip for outputs built during the run."
    read -r _
    return 0
  fi
  run_in_delphi_env msbuild.exe "$@" "$DELPHI_MSBUILD_FLAG_DEBUG"
}

vs_msbuild() {
  run_in_vs_env msbuild.exe "$@" "$VS_MSBUILD_FLAG_DEBUG"
}

build_version.res() {
  run_in_vs_env rc version.rc
}

build_manifest.res() {
  replaceVersionStrings_Mkver manifest.in manifest.xml
  run_in_vs_env rc manifest.rc
}

clean_windows_project_files() {
  rm -rf bin obj manifest.res manifest.xml *.dproj.local version.res icons.RES icons.res *.identcache
}

wrap-signcode() {
  if builder_is_ci_build && builder_is_ci_build_level_build; then
    builder_echo "Skipping code signing - buildLevel=build: $@"
    return 0
  fi

  # CI will usually pass in a full path for signtool.exe; for local builds we
  # will hopefully find what we want on the path already
  if [[ -z "${SIGNTOOL+x}" ]]; then
    local SIGNTOOL=signtool.exe
  fi
  signtime "$SIGNTOOL" "$SC_PFX_SHA1" "$SC_PFX_SHA256" "$SC_URL" "$SC_PWD" "$@"
}

wrap-symstore() {
  local target="$1"
  local slasht="$2"
  local product="$3"

  if builder_is_ci_build && builder_is_ci_build_level_build; then
    builder_echo "Skipping symstore - buildLevel=build"
    return 0
  fi

  if [[  -z "${KEYMAN_SYMSTOREPATH+x}" ]]; then
    builder_warn "\$KEYMAN_SYMSTOREPATH is not set. Skipping symstore for $@"
    return 0
  fi

  "$ProgramFilesx86/Windows Kits/10/Debuggers/x64/symstore.exe" \
    add \
    //s "$(cygpath -w "$KEYMAN_SYMSTOREPATH")" \
    //v "$KEYMAN_VERSION_WIN" \
    //c "Version: $KEYMAN_VERSION_WITH_TAG" \
    //compress //f "$(cygpath -w "$target")" "$slasht" "$product"
}

wrap-mt() {
  run_in_vs_env mt.exe "$@"
}

create-developer-output-folders() {
  mkdir -p "$DEVELOPER_PROGRAM/xml"
  mkdir -p "$DEVELOPER_DEBUGPATH"
}

create-windows-output-folders() {
  mkdir -p "$OUTLIB"
  mkdir -p "$WINDOWS_PROGRAM_APP"
  mkdir -p "$WINDOWS_PROGRAM_ENGINE"
  mkdir -p "$WINDOWS_PROGRAM_SUPPORT"
  mkdir -p "$WINDOWS_DEBUGPATH_APP"
  mkdir -p "$WINDOWS_DEBUGPATH_ENGINE"
  mkdir -p "$WINDOWS_DEBUGPATH_SUPPORT"
}
