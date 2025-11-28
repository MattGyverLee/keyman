# LDML to JavaScript Keyboard Compiler Specification

> **Target:** Keyman 18+ (verified against Keyman 19.0.167)

## Overview

This document specifies the mapping between three keyboard format representations:
1. **LDML Keyboard 3.0** (XML source - Unicode CLDR TR35)
2. **.keyman-touch-layout** (JSON - Keyman Developer format)
3. **Compiled .js** (JavaScript output - KeymanWeb runtime)

The goal is to enable direct compilation from LDML source to JavaScript for mobile/web platforms, which currently requires an intermediate KMN-based workflow.

---

## 1. Format Comparison Summary

| Feature | LDML 3.0 | .keyman-touch-layout | Compiled .js |
|---------|----------|---------------------|--------------|
| **Format** | XML | JSON | JavaScript |
| **Role** | Source | Intermediate | Runtime |
| **Touch Layers** | `<layers formId="touch">` | `tablet`/`phone` objects | `KVKL` property |
| **Long-Press** | `longPress` attr | `sk` array | `sk` array |
| **Flicks** | `<flicks>` element | `flick` object | `flick` object |
| **MultiTap** | `multiTap` attr | `multitap` array | `multitap` array |
| **Keyboard Rules** | `<transforms>` | N/A (in .kmn) | `gs()` function |
| **Hardware Layout** | `<layers formId="hardware">` | N/A (in .kvk) | `KLS` object |

All touch features (flicks, multitap, longpress) are **fully supported** in Keyman 17+.

---

## 2. Touch Layout Structure

### 2.1 Root Layout Mapping

**LDML 3.0:**
```xml
<keyboard3 locale="en-US" conformsTo="45">
  <layers formId="touch">
    <layer id="base">...</layer>
    <layer id="shift">...</layer>
  </layers>
</keyboard3>
```

**.keyman-touch-layout (JSON):**
```json
{
  "tablet": {
    "font": "Tahoma",
    "defaultHint": "longpress",
    "layer": [
      { "id": "default", "row": [...] },
      { "id": "shift", "row": [...] }
    ]
  },
  "phone": {
    "font": "Tahoma",
    "layer": [...]
  }
}
```

**Compiled .js:**
```javascript
this.KVKL = {
  "tablet": { "font": "Tahoma", "layer": [...] },
  "phone": { "font": "Tahoma", "layer": [...] }
};
```

### 2.2 Layer ID Mapping

| LDML `id` | LDML `modifiers` | JSON `id` |
|-----------|------------------|-----------|
| `base` | (none) | `default` |
| `shift` | `shift` | `shift` |
| `caps` | `caps` | `caps` |
| `alt` | `alt` | `rightalt` |
| `numeric` | N/A | `numeric` |
| `symbol` | N/A | `symbol` |

---

## 3. Key Definition Mapping

### 3.1 Basic Key Properties

**LDML 3.0:**
```xml
<keys>
  <key id="q" to="q"/>
  <key id="shift" layerId="shift"/>
  <key id="gap" gap="true" width="10"/>
</keys>

<layers formId="touch">
  <layer id="base">
    <row keys="q w e r t"/>
  </layer>
</layers>
```

**.keyman-touch-layout:**
```json
{
  "id": "K_Q",
  "text": "q"
}
```

**Compiled .js (in KVKL):**
```javascript
{"id": "K_Q", "text": "q"}
```

### 3.2 Property Mapping Table

| LDML 3.0 | JSON | Description |
|----------|------|-------------|
| `id="q"` | `"id": "K_Q"` | Key identifier (prefixed) |
| `to="q"` | `"text": "q"` | Output/display text |
| `output="..."` | `"text": "..."` | Alternative to `to` |
| `width="150"` | `"width": 150` | Key width (% of standard) |
| `gap="10"` | `"pad": 10` | Left padding |
| `layerId="shift"` | `"nextlayer": "shift"` | Layer to switch to |
| `switch="shift"` | `"layer": "shift"` | Derive modifiers from layer |
| `gap="true"` | `"sp": 10` | Spacer/gap key |

### 3.3 Special Key Types (`sp` enum)

```typescript
enum TouchLayoutKeySp {
  normal = 0,           // Regular key
  special = 1,          // Frame key (Shift, Enter)
  specialActive = 2,    // Active frame key (Shift on shift layer)
  deadkey = 8,          // Deadkey styling
  blank = 9,            // Blank keycap
  spacer = 10           // Gap/spacer
}
```

---

## 4. Long-Press (Subkeys) Mapping

**LDML 3.0:**
```xml
<keys>
  <key id="e" to="e" longPress="e-grave e-acute e-circ e-uml"/>
  <key id="e-grave" to="&#x00E8;"/>
  <key id="e-acute" to="&#x00E9;"/>
  <key id="e-circ" to="&#x00EA;"/>
  <key id="e-uml" to="&#x00EB;"/>
</keys>
```

**.keyman-touch-layout:**
```json
{
  "id": "K_E",
  "text": "e",
  "sk": [
    {"id": "U_00E8", "text": "è"},
    {"id": "U_00E9", "text": "é"},
    {"id": "U_00EA", "text": "ê"},
    {"id": "U_00EB", "text": "ë"}
  ]
}
```

**Compiled .js:**
```javascript
{
  "id": "K_E",
  "text": "e",
  "sk": [
    {"id": "U_00E8", "text": "è"},
    {"id": "U_00E9", "text": "é"},
    {"id": "U_00EA", "text": "ê"},
    {"id": "U_00EB", "text": "ë"}
  ]
}
```

### 4.1 SubKey Interface (TypeScript)

```typescript
interface TouchLayoutSubKey {
  id: string;              // Key ID (required)
  text?: string;           // Display text
  layer?: string;          // Modifier layer override
  nextlayer?: string;      // Layer to switch to
  sp?: TouchLayoutKeySp;   // Key type
  default?: boolean;       // Default selection (longpress only)
}
```

---

## 5. Flick Gestures Mapping

### 5.1 Flick Definition

**LDML 3.0:**
```xml
<flicks>
  <flick id="period-flicks">
    <flickSegment directions="n" to="!"/>
    <flickSegment directions="e" to="?"/>
    <flickSegment directions="s" to=","/>
    <flickSegment directions="w" to=";"/>
    <flickSegment directions="ne" to="'"/>
    <flickSegment directions="se" to="&quot;"/>
  </flick>
</flicks>

<keys>
  <key id="period" to="." flickId="period-flicks"/>
</keys>
```

**.keyman-touch-layout:**
```json
{
  "id": "K_PERIOD",
  "text": ".",
  "flick": {
    "n":  {"id": "U_0021", "text": "!"},
    "e":  {"id": "U_003F", "text": "?"},
    "s":  {"id": "U_002C", "text": ","},
    "w":  {"id": "U_003B", "text": ";"},
    "ne": {"id": "U_0027", "text": "'"},
    "se": {"id": "U_0022", "text": "\""}
  }
}
```

**Compiled .js:**
```javascript
{
  "id": "K_PERIOD",
  "text": ".",
  "flick": {
    "n":  {"id": "U_0021", "text": "!"},
    "e":  {"id": "U_003F", "text": "?"},
    "s":  {"id": "U_002C", "text": ","},
    "w":  {"id": "U_003B", "text": ";"},
    "ne": {"id": "U_0027", "text": "'"},
    "se": {"id": "U_0022", "text": "\""}
  }
}
```

### 5.2 Flick Interface (TypeScript)

```typescript
interface TouchLayoutFlick {
  n?:  TouchLayoutSubKey;  // North (up)
  s?:  TouchLayoutSubKey;  // South (down)
  e?:  TouchLayoutSubKey;  // East (right)
  w?:  TouchLayoutSubKey;  // West (left)
  ne?: TouchLayoutSubKey;  // Northeast
  nw?: TouchLayoutSubKey;  // Northwest
  se?: TouchLayoutSubKey;  // Southeast
  sw?: TouchLayoutSubKey;  // Southwest
}
```

### 5.3 Flick Directions

| Direction | LDML | JSON | Angle |
|-----------|------|------|-------|
| North | `n` | `"n"` | 0° |
| Northeast | `ne` | `"ne"` | 45° |
| East | `e` | `"e"` | 90° |
| Southeast | `se` | `"se"` | 135° |
| South | `s` | `"s"` | 180° |
| Southwest | `sw` | `"sw"` | 225° |
| West | `w` | `"w"` | 270° |
| Northwest | `nw` | `"nw"` | 315° |

---

## 6. MultiTap Mapping

### 6.1 MultiTap Definition (T9-style cycling)

**LDML 3.0:**
```xml
<keys>
  <key id="key2" to="a" multiTap="b c 2"/>
</keys>
```

Behavior: Tap cycles through `a` → `b` → `c` → `2` → `a` → ...

**.keyman-touch-layout:**
```json
{
  "id": "K_2",
  "text": "a",
  "multitap": [
    {"id": "U_0062", "text": "b"},
    {"id": "U_0063", "text": "c"},
    {"id": "U_0032", "text": "2"}
  ]
}
```

**Compiled .js:**
```javascript
{
  "id": "K_2",
  "text": "a",
  "multitap": [
    {"id": "U_0062", "text": "b"},
    {"id": "U_0063", "text": "c"},
    {"id": "U_0032", "text": "2"}
  ]
}
```

**Timing:** Double-tap threshold is **300ms**.

### 6.2 MultiTap for Caps Lock (Layer Switching)

**LDML 3.0:**
```xml
<key id="shift" layerId="shift" multiTap="caps"/>
```

**.keyman-touch-layout:**
```json
{
  "id": "K_SHIFT",
  "text": "*Shift*",
  "sp": 1,
  "nextlayer": "shift",
  "multitap": [
    {"id": "T_*_MT_SHIFT_TO_CAPS", "nextlayer": "caps", "sp": 2}
  ]
}
```

---

## 7. Default Hints

The `defaultHint` property indicates what gesture hint to show by default:

```typescript
type TouchLayoutDefaultHint =
  | "none"
  | "dot"
  | "longpress"
  | "multitap"
  | "flick"
  | "flick-n" | "flick-ne" | "flick-e" | "flick-se"
  | "flick-s" | "flick-sw" | "flick-w" | "flick-nw";
```

Individual keys can override with the `hint` property.

---

## 8. Keyboard Rules Mapping

### 8.1 Simple Character Rules

**LDML 3.0:**
```xml
<layers formId="hardware">
  <layer id="base">
    <row keys="q w e r t"/>
  </layer>
</layers>
```

**Compiled .js (KLS - hardware layer strings):**
```javascript
this.KLS = {
  "default": ["", "", "", ..., "q", "w", "e", ...],  // 65 entries
  "shift":   ["", "", "", ..., "Q", "W", "E", ...]
};
```

### 8.2 Transform Rules (Dead Keys)

**LDML 3.0:**
```xml
<transforms type="simple">
  <transformGroup>
    <transform from="`a" to="à"/>
    <transform from="`e" to="è"/>
    <transform from="``" to="`"/>
  </transformGroup>
</transforms>
```

**Compiled .js:**
```javascript
this.gs = function(t, e) {
  var k = KeymanWeb, r = 0, m = 0;

  // Backtick produces deadkey
  if (k.KKM(e, 16384, 192)) {
    r = m = 1;
    k.KDO(0, t, 0);  // Deadkey 0
  }

  if (m) { r = this.g_transforms(t, e); }
  return r;
};

this.g_transforms = function(t, e) {
  var k = KeymanWeb, r = 1, m = 0;

  // dk(0) + 'a' → 'à'
  if (k.KDM(1, t, 0) && k.KA(0, k.KC(1, 1, t), this.s_vowels)) {
    m = 1;
    k.KIO(1, this.s_vowels_grave, 1, t);
  }

  return r;
};

this.s_vowels = "aeiou";
this.s_vowels_grave = "àèìòù";
```

---

## 9. Metadata Mapping

| LDML 3.0 | Compiled .js Property |
|----------|----------------------|
| `<info name="...">` | `this.KN` |
| `<info version="...">` | `this.KBVER` |
| `locale="..."` | `this.KLC` |
| `<keyboard3 ...>` id | `this.KI` |
| font (from forms) | `this.KV.F` |
| RTL | `this.KRTL` |

---

## 10. Complete Example

### 10.1 LDML Source

```xml
<?xml version="1.0" encoding="UTF-8"?>
<keyboard3 xmlns="https://schemas.unicode.org/cldr/45/keyboard3"
           locale="en-US" conformsTo="45">

  <info name="Example Touch Keyboard" version="1.0"/>

  <layers formId="touch">
    <layer id="base">
      <row keys="q w e r t y u i o p"/>
      <row keys="a s d f g h j k l"/>
      <row keys="shift z x c v b n m bksp"/>
      <row keys="numeric space enter"/>
    </layer>
  </layers>

  <keys>
    <key id="e" to="e" longPress="e-grave e-acute e-circ"/>
    <key id="period" to="." flickId="period-flicks" longPress="comma"/>
    <key id="shift" layerId="shift" multiTap="caps"/>

    <key id="e-grave" to="è"/>
    <key id="e-acute" to="é"/>
    <key id="e-circ" to="ê"/>
    <key id="comma" to=","/>
  </keys>

  <flicks>
    <flick id="period-flicks">
      <flickSegment directions="n" to="!"/>
      <flickSegment directions="s" to="?"/>
    </flick>
  </flicks>

</keyboard3>
```

### 10.2 Equivalent .keyman-touch-layout

```json
{
  "phone": {
    "font": "Tahoma",
    "defaultHint": "longpress",
    "layer": [
      {
        "id": "default",
        "row": [
          {
            "id": 1,
            "key": [
              {"id": "K_Q", "text": "q"},
              {"id": "K_W", "text": "w"},
              {"id": "K_E", "text": "e", "sk": [
                {"id": "U_00E8", "text": "è"},
                {"id": "U_00E9", "text": "é"},
                {"id": "U_00EA", "text": "ê"}
              ]},
              ...
            ]
          },
          ...
          {
            "id": 3,
            "key": [
              {"id": "K_SHIFT", "text": "*Shift*", "sp": 1,
               "nextlayer": "shift",
               "multitap": [{"nextlayer": "caps", "sp": 2}]},
              ...
              {"id": "K_PERIOD", "text": ".",
               "sk": [{"id": "U_002C", "text": ","}],
               "flick": {
                 "n": {"id": "U_0021", "text": "!"},
                 "s": {"id": "U_003F", "text": "?"}
               }},
              ...
            ]
          }
        ]
      }
    ]
  }
}
```

---

## 11. Implementation Notes

### 11.1 Current Compilation Path

```
.kmn + .keyman-touch-layout
          ↓
    [kmc-kmn compiler]
          ↓
    keyboard.js (KVKL embedded)
```

### 11.2 Proposed LDML Compilation Path

```
.ldml (LDML Keyboard 3.0)
          ↓
    [kmc-ldml compiler]  ← NEEDS: JS output target
          ↓
    keyboard.js (KVKL + gs() embedded)
```

### 11.3 Key Files in Keyman 19

| Component | Location |
|-----------|----------|
| Touch layout types | `common/web/types/src/keyman-touch-layout/` |
| LDML compiler | `developer/src/kmc-ldml/src/compiler/` |
| KMN→JS compiler | `developer/src/kmc-kmn/src/kmw-compiler/` |
| Flick runtime | `web/src/engine/osk/src/input/gestures/browser/flick.ts` |
| Gesture handler | `web/src/engine/osk/src/input/gestures/gestureHandler.ts` |

### 11.4 What Needs to Be Built

The LDML compiler (`kmc-ldml`) currently outputs KMX+. To support mobile/web:

1. **Add JS output target** to kmc-ldml
2. **Generate KVKL** from `<layers formId="touch">`
3. **Convert `<flicks>`** to `flick` objects
4. **Convert `longPress`** to `sk` arrays
5. **Convert `multiTap`** to `multitap` arrays
6. **Generate `gs()`** from `<transforms>`
7. **Generate `KLS`** from `<layers formId="hardware">`

---

## References

- [CLDR Keyboard Spec (TR35)](https://unicode.org/reports/tr35/tr35-keyboards.html)
- [Keyman Touch Layout Schema](common/schemas/keyman-touch-layout/)
- [Keyman Developer kmc-ldml](developer/src/kmc-ldml/)
- [GitHub Issue #5029 - Flick/MultiTap spec](https://github.com/keymanapp/keyman/issues/5029)
