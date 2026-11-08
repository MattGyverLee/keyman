# Issue 1 — OSK sticky modifier can be released with the wrong chirality (row `2a`, includes Finding 4b)

Draft, not filed. Producer row `2a` in
[`../MODIFIER-PRODUCERS.md`](../MODIFIER-PRODUCERS.md). Filing is an OPTIONAL
step a maintainer may take; no PR is opened by the change that wrote this draft, so nothing here is
waiting on one. See [README.md](./README.md).

---

**Title:** OSK sticky modifier can be released with the wrong chirality after a keyboard switch, stranding Right Ctrl/Right Alt

**Body:**

A modifier "clicked sticky" on the on-screen keyboard is held via a real,
chiral `keybd_event` KEYDOWN with no matching KEYUP queued anywhere — release
depends entirely on Keyman correctly identifying *which side* to release.

`SetLRShift` (`common/windows/delphi/components/OnScreenKeyboard.pas:885-938`)
collapses `kbd.ShiftState`'s chiral representation (`essLCtrl`/`essRCtrl` →
`essCtrl`, and the Alt equivalent) whenever the active keyboard's AltGr-ness
changes — e.g. the user switches keyboards while the OSK stays open. After that
collapse, `kbd.ShiftState` can no longer say which chiral VK is actually down.

Two release paths read that representation, and both were affected:

1. **OSK teardown** (`ResetShiftStates`, on dismissal).
2. **A live click-off** — the user clicks the now-generic "Ctrl"/"Alt" key on the
   OSK itself, before dismissing it, to toggle the sticky modifier off directly
   (`kbdShiftChange` → `ShiftStateChange`).

**User impact — measured, and worse than "a modifier is stranded".** On hardware
without a physical Right Ctrl or Right Alt key there is **no in-session recovery
at all**. This was hit for real during the 2026-08-27 run, on a keyboard with no
right Ctrl:

- The OSK cannot clear it. The OSK's own click-off is the very path that carries
  this defect, so the obvious remedy is the one that does not work.
- The physical key cannot clear it. It does not exist.
- Every keystroke is meanwhile swallowed as a Ctrl chord, so the machine cannot
  be driven by keyboard to fix itself — including to run any recovery script the
  user might otherwise type.

Recovery required an external tool injecting the matching event shape
(`keybd_event(VK_CONTROL, 0x1D, KEYUP | EXTENDEDKEY)` — side-agnostic VK with the
extended bit, mirroring what `do_keybd_event` sent going down). An unextended
`VK_CONTROL` keyup does not match and leaves it held. Absent such a tool the
realistic user remedy is a reboot.

Compact and 60% layouts commonly ship without a right Ctrl, so this is not a rare
hardware configuration.

**Status.** Both halves are fixed and measured on
`fix/windows/8064-reconcile-modifier-cache`: the teardown by `3d64aad790` +
`4ca0945a12`, the click-off by `791c5f181a` + `ea530407c2`. Both now release the
identity that was injected, read from `FCachedShiftState`, rather than deriving
the VK from the current `kbd.LRShift`. Evidence:
`evidence/run-osk-teardown-2026-08-27.txt` and
`evidence/run-osk-clickoff-2026-08-27.txt`.

**Constraint for any future change here**, because it is what makes this area
hazardous: a release path may read `FCachedShiftState` and remove from it, but
must not write into it. `ShiftStateChange` is called from `UpdateShiftStates`'
50 ms resync as well as from a click, and that path's press branch fires for
modifiers the user is **physically** holding — so a write from there causes a
later teardown to release a key the user is genuinely holding, which is I2177.
See *The `FCachedShiftState` invariant* in `MODIFIER-PRODUCERS.md`.

**Why file it at all, given it is fixed:** the defect is present in released
builds and users are running those today.
