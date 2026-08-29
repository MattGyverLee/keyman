# IN-TREE: what the gate covers, and what it does not

Companion to [README.md](./README.md). The files under [evidence/](./evidence/) cite
this document by section number, so the numbering here is inherited from the working
record the branch was developed against rather than renumbered from 1. Only the
sections those files cite are reproduced.

## 2a. The recorded gate figures

Held in evidence, not restated here:
[evidence/post-rebase-gate-2026-08-28.md](./evidence/post-rebase-gate-2026-08-28.md) —
`test:x86` 72 passed, `test:x64` 71 passed, 1 disabled and 0 warnings on each, and
both `keyman32.dll` and `keyman64.dll` linking clean. Logs:
[run-gate-x86-2026-08-28.txt](./evidence/run-gate-x86-2026-08-28.txt),
[run-gate-x64-2026-08-28.txt](./evidence/run-gate-x64-2026-08-28.txt),
[run-link-x86-2026-08-28.txt](./evidence/run-link-x86-2026-08-28.txt),
[run-link-x64-2026-08-28.txt](./evidence/run-link-x64-2026-08-28.txt).

19/19 (x86) and 18/18 (x64) are the *entry* figures the work started from, not the
current gate.

**Those figures are x86 and x64. They are not ARM64.** See §6.

---

## 6. Still open

### ARM64 is carried forward as unverified, with the reason

**This is a deliberate carry-forward, not a silent drop.** ARM64 was verified on
neither leg of this work. It is recorded here so a reviewer can see the gap and price
it, rather than infer coverage from the two architectures that were measured.

Three facts, each independently checkable in this tree:

**1. The engine build script does not run the ARM64 tests.**
`windows/src/engine/keyman32/build.sh:144-148`, upstream's text, untouched by this
branch:

```sh
builder_run_action test:x86         do_test Win32
builder_run_action test:x64         do_test x64
# Next line is currently disabled until we do processor-level checks on the executable,
# as we have no arm64 build agents yet (#15065)
# builder_run_action test:arm64       do_test arm64
```

Worth noting for anyone who tries to run it anyway: `:arm64` is still declared as a
target for `test` in `builder_describe` (`build.sh:8-12`), so `./build.sh test:arm64`
is *accepted* on the command line and then dispatches to no handler at all. It cannot
report a failure. It also cannot report a pass. Only the test leg is off — `build:arm64`
is wired at `build.sh:142` and `builder_describe_outputs` names `keymanarm64.dll`
(`build.sh:23-27`) — so the absence of a red ARM64 result is not evidence of a green one.

**2. There are no ARM64 build agents.** That is what
[keymanapp/keyman#15065](https://github.com/keymanapp/keyman/issues/15065) tracks, and
it is why the line above is commented out rather than merely skipped. Nor was there an
ARM64 MSVC toolset on the machine this branch was built and gated on, so a local run
could not stand in for CI.

**3. The predecessor work already recorded this leg unverified, and this branch does
not change that.** The same statement is made in the two evidence files that record
the runs: [post-rebase-gate-2026-08-28.md](./evidence/post-rebase-gate-2026-08-28.md)
("Nothing about ARM64, which remains unverified") and
[serializer-signals-2026-08-28.md](./evidence/serializer-signals-2026-08-28.md)
("Nothing about ARM64, still unverified"). This entry is the record they point at.

### What that means for reading the gate

The x86 and x64 results in §2a do not speak for ARM64. Read them as covering the two
architectures named and no others.

The expectation is nonetheless that ARM64 behaves as x64 does, and it is worth saying
why so the risk is sized rather than left open-ended. No change on this branch adds or
alters an `_M_ARM64` conditional; the only architecture guard the diff introduces is a
`#ifndef _WIN64` around one test in `tests/keybd_shift.tests.cpp`, and `_WIN64` is
defined on ARM64 exactly as it is on x64. The two files that carry the hook and
serializer changes — `k32_lowlevelkeyboardhook.cpp:31` and
`serialkeyeventserver.cpp:7` — are wholly inside `#ifndef _WIN64` and so compile to
nothing on ARM64, just as on x64. The reconcile functions in `keybd_shift.cpp` sit
outside that guard by design and are architecture-neutral C++.

**That is an expectation, not a measurement.** It is also not the thing #15065 is
waiting on: the comment in `build.sh` says the blocker is *processor-level checks on
the executable*, which is precisely the class of difference a green x64 run cannot
stand in for.

### What would close this

#15065 landing an ARM64 agent, after which uncommenting `build.sh:148` and a green
`test:arm64` retires this entry. Nothing in this branch is a prerequisite for that, and
nothing in this branch should be read as having done it.

---

## 7. The production delta against the two style gates (T115)

Two separate gates, and they came out differently. Both are recorded, because the second
one is a conflict a reader will otherwise rediscover the hard way.

### Warnings-as-errors: PASSES

`keyman32.vcxproj` compiles with warnings treated as errors (`C2220`), so a bare
`C4100` unreferenced-parameter fails the build outright. The whole production delta
builds clean on both architectures, and the gate is demonstrably live rather than
merely configured: it fired twice during this work, both times on an unreferenced
parameter added ahead of the code that would use it, and both were fixed rather than
suppressed.

Final gate, on the tree this section describes:

```
./windows/src/engine/keyman32/build.sh --debug test:x86   ->  96 tests / 17 cases, PASSED, exit 0
./windows/src/engine/keyman32/build.sh --debug test:x64   ->  95 tests / 16 cases, PASSED, exit 0
```

### The root `.clang-format`: the delta follows the FILE's style, which the config contradicts

`ColumnLimit: 130` is met. The delta introduces **zero** lines over 130 columns in any
touched file, and `tests/keybd_shift.tests.cpp` has one fewer than at `HEAD`. Every
over-length line in these files predates this branch.

The remaining settings are a different matter, and the honest report is that **these
files have never conformed to them**, so the delta was written to match the file rather
than the config:

| setting | config wants | these files use |
|---|---|---|
| `PointerAlignment` | `Left` — `int* n` | `int *n` |
| `ContinuationIndentWidth` | `4` | 2, for wrapped parameter lists |
| `SpacesBeforeTrailingComments` | `2` | 1 |
| function definitions | return type on the same line | return type on its own line |

Checkable rather than asserted. In `keybd_shift.cpp` at `HEAD`, the right-aligned
pointer style the config forbids appears **6** times and the left-aligned style it asks
for appears **0**. Across `windows/src/engine/keyman32` at `HEAD` the split is **44**
right-aligned to **12** left-aligned. Running `clang-format --style=file` over the
untouched `HEAD` versions of the five files this branch edits rewrites 69, 36, 157, 155
and 345 lines respectively — before this branch changed anything.

So reformatting only the delta would put two pointer styles, two continuation indents
and two comment spacings inside single functions, and would leave the file no closer to
conforming than it is now. The delta reads like its surroundings instead. Verified with
`clang-format --lines`, restricted to the ranges `git diff` reports as changed: every
divergence it reports is one of the four rows above, and each one matches the
surrounding code.

### What would close this

A repository-wide `clang-format` pass over `windows/src/engine/keyman32`, as its own
change with no behaviour in it. That is a reasonable thing to want and a bad thing to
bury inside a bug fix: it would rewrite roughly 760 lines across these five files and
make the #8064 diff unreviewable. It is named here so the choice is visible rather than
inferred from the absence of one.
