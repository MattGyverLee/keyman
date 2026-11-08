# Assessment of the #8064 field-log attachments, 2026-08-27

What the attachments on [#8064](https://github.com/keymanapp/keyman/issues/8064)
contain, what can be concluded from them, and what cannot. Written because the
next person to open them should not have to redo this.

Attachments analysed (rc-swag, 2025-11-27):

| file | size | contents |
|---|---|---|
| `RC_Logs_1.zip` | 15.5 MB | `Observations_so_far.txt`, `system3_information.txt`, `test3_others.xlsx` |
| `RC_logs_2.zip` | 6.4 MB | `Observations_so_far.txt`, `system8_info.txt`, `test8.xlsx` |
| `test3_lowlevel.xlsx` | 17.0 MB | the low level extract from system 3 |

## The finding that matters most, and it is not in the logs

Every Keyman debug log line already carries a cache-versus-live modifier
comparison. `DebugEventTrace.cpp:81-82`:

```cpp
DWORD shiftState       = Globals::get_ShiftState();
DWORD actualShiftState = GetActualShiftState();
```

and `GetActualShiftState()` (`DebugEventTrace.cpp:19`, tagged `I4843` — Marc
Durdin, 09 Aug 2015, shipped in Keyman Desktop **9.0.512 stable**: *"Log reported
modifier state as well as Keyman current modifier state in debug logs"*) reads the
OS directly, **including chirality**:

```cpp
if (GetKeyState(VK_SHIFT)    < 0) state |= K_SHIFTFLAG;   // 0x10
...
if (GetKeyState(VK_LSHIFT)   < 0) state |= 0x10000;
if (GetKeyState(VK_RSHIFT)   < 0) state |= 0x20000;
```

These surface in a captured log as the `ModifierState` and
`ActualModifierState` columns. So **a divergence between Keyman's tracked shift
state and the OS is directly observable in any Keyman debug capture, on any
shipped build, and has been since I4843** — no new instrumentation, no rebuild,
no `KLOGGING`. It is an adjacent measurement to the one this branch fixes, not
the same one; the caveat below is load-bearing, not decorative.

Practical consequence: the "never caught in the wild with logs" gap can be closed
against *our own* reproduction. Re-run `run-8064-test.ps1` with `debug` = 1 and
`debug to console` = 1 and compare those two columns across the wedge, on the
shipped engine and on the fixed one. That is a far better artifact than these
attachments, and it does not depend on anyone else's capture.

**Caveat, and it is a real one.** `Globals::get_ShiftState()` is Keyman's global
shift state, **not** `SerialKeyEventServer::m_ModifierKeyboardState`. The two are
related but not the same variable, and `ModifierState` carries no chirality bits
at all, so a raw column comparison conflates "Keyman does not track which Shift"
with "Keyman disagrees about whether Shift is down". Any claim built on these
columns has to be restricted to the unambiguous direction — see below.

## What the attachments do establish

- **Both captures are pre-watchdog.** `test3` records
  `InitDebugging: Keyman version: 18.0.228.0`. The watchdog first shipped in
  **18.0.245**. So these logs cannot speak to post-watchdog behaviour either way,
  and they are not evidence about the build users run today.
- **The cache does record Right Shift held for large stretches.** In `test8`,
  `[LS:0 LC:0 LA:0 RS:80 RC:0 RA:0]` is the second most common distinct
  `m_ModifierKeyboardState` vector in the capture, behind all-zero.
- **The Right Shift provenance blind spot is present in volume.** Filtering
  removes rows rather than inventing them, so counts here are a lower bound and
  not a rate. Both captures contain many `_kmnLowLevelKeyboardProc` Right Shift events with
  `scan:36 extra:0` — the class that is byte-identical at the hook whether Keyman
  injected it or the user pressed it, because `do_keybd_event` overwrites
  `SCAN_FLAG_KEYMAN_KEY_EVENT` with `SCANCODE_RSHIFT`. That is the gap
  `EXTRAINFO_FLAG_KEYMAN_MODIFIER_WRAP` closes.
- **Right Shift, not Left Shift, is what clears it.** rc-swag records this on two
  independent systems: *"The last two keys was the left shift, which did not clear
  the shift stuck, followed by the right shift which did free the key"* (system
  8), and the same on system 1. That is the chirality-specific persistence the
  branch predicts, observed by a third party before this work started.
- **rc-swag reached the same conclusion about `do_keybd_event` independently**,
  and quotes the same upstream comment (*"Fortunately, we can afford to not care
  about this"*) in his notes.

## What the attachments do NOT establish, and why

**Event-pairing counts are not usable on these files.** Counting KEYDOWN against
KEYUP for the shift keys gives contradictory answers between the two captures:

| capture | Right Shift `extra=0` | Right Shift `extra=4b4d0000` |
|---|---|---|
| test3 | 37 DOWN / 3 UP (+34) | 190 DOWN / 118 UP (+72) |
| test8 | 101 DOWN / 556 UP (-455) | 75 DOWN / 106 UP (-31) |

An imbalance of +34 in one capture and -455 in the other cannot both describe
reality. Three defects in the data source explain it:

1. **The sheets are process-filtered.** `test3_lowlevel.xlsx` carries an
   `autoFilter` on the Process column selecting `keyman`, `keyman[host]` and
   `keymanx64`, and **155,383 of its 223,134 rows are marked hidden**. Keyman logs
   from inside every hooked process, so filtering by process splits event pairs.
2. **The sheets are row subsets.** `test3_lowlevel` holds one contiguous chunk —
   original log lines 276,049 to 499,158 — of a roughly 499k-line log. `test8`
   holds about 101k of roughly 504k lines.
3. **Column alignment is unreliable in places.** Empty cells and inconsistent
   import leave message text in the Process column on some rows.

This caveat applies equally to rc-swag's own note that there are *"746 `Key
pressed` and only 221 `Key released` log messages"* — measured on the same
filtered view, so that figure needs re-checking before it is relied on.

**His headline observation did not reproduce in the file supplied.** *"There is
never a return to RS:0"* does not hold across `test3_lowlevel.xlsx`: the cache
returns to all-zero repeatedly, and `RS:80` never appears in two consecutive
`SerialKeyEventServer` log lines anywhere in the file. His line numbers
(489171, 489194, 489214) also do not align with this file's `Index` column, so he
was almost certainly reading `test3_others.xlsx`, whose numbering differs. The
observation may well hold there; it is unverified, not refuted.

## What to do next, and it is mostly not "get the raw logs"

Reordered after asking what these files could still settle that the harness in
this directory cannot. The answer is narrow.

**The harness beats these captures on every axis except one.** It is contiguous
and unfiltered, on a current build, with a known modifier and known timing, and
it can be run twice — shipped and fixed — with identical instrumentation. With
`debug` = 1 it yields the `I4843` columns, the `m_ModifierKeyboardState` server
lines and the low level hook events in one timeline.

**The exception, and it is the one that matters:** the harness *manufactures* the
stall, so it can show that route exists and that the fix closes it. It cannot show
which route real users hit. That is exactly the open question, and it is the
substance of the review objection that the field logs show the hook alive.

So, cheapest first:

1. **Capture our own.** Set `debug` = 1 and `debug to console` = 1 and leave a
   capture running through ordinary work on a machine that has produced the
   symptom. That yields an unfiltered, complete, current-build, in-the-wild
   capture with both `I4843` columns — strictly better than anything in these
   zips, and it needs nobody else.
2. **Ask the route question rather than re-deriving it.** "In your captures, did
   the divergence arrive as an unmatched Keyman-tagged modifier press, or as the
   user's own KEYUP going missing?" The people who captured those logs have read
   them and are better placed to answer than a fresh reader of the extracts.
3. **Run the `debug` = 1 harness wedge**, which puts the watchdog reinstall line
   and the wedge in one timeline.
4. **Only then, the raw unfiltered logs** — or the original `.log` / ETW capture.
   They are the only way to settle pairing counts, but they are from a
   pre-watchdog build and are unlikely to be decisive on their own. Worth having,
   not worth blocking on. If asking anyway, also ask **which file and line** the
   `489171` / `489194` / `489214` references point into, and whether any capture
   exists on **18.0.245 or later**.

**The risk in skipping step 4 entirely**, stated so it is a decision and not an
oversight: if the route users hit is outside the five in
[MODIFIER-PRODUCERS.md](../MODIFIER-PRODUCERS.md), this work claims coverage it
does not have. Steps 1 and 2 address that more directly and more cheaply than
step 4 would.

## Working copies

Downloaded and flattened to tab-separated text so no one has to fight Excel
again. Not committed — regenerate with the script in this file's history, or
re-download from the issue.

```
<scratch>/8064-logs/
  test3_flat.txt        223,134 rows, tab-separated, Message in the last column
  t3/, t8/              unzipped xlsx parts (sharedStrings.xml, sheet1.xml)
```

Reproduce the flatten: unzip `xl/sharedStrings.xml` and
`xl/worksheets/sheet1.xml`, resolve `t="s"` cell values against the shared-string
table in document order, and key cells by their `r="<col><row>"` reference rather
than by position — positional parsing misaligns wherever a cell is empty.
