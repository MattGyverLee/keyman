# KMN ↔ LDML Full Project Conversion Test Report

**Generated:** 2025-12-01T03:00:47.181Z
**Source:** D:\Github\keyboards\release
**LDML Projects:** D:\Github\keyboards\release-ldml
**Round-Trip Projects:** D:\Github\keyboards\release-rt

## Summary Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Projects** | 861 | 100% |
| **Total Keyboards** | 861 | 100% |
| Files Copied | 31846 | - |
| kmp.json Updated | 0 | - |
| KMN → LDML Success | 843 | 97.9% |
| KMN → LDML Errors | 18 | 2.1% |
| LDML → KMN Success | 843 | 97.9% |
| LDML → KMN Errors | 0 | 0.0% |
| **Complete Round-Trip** | 843 | 97.9% |

## Project Structure

Each converted project includes:
- ✅ Complete source directory
- ✅ All assets (icons, fonts, welcome.htm, etc.)
- ✅ Updated kmp.json referencing .xml files
- ✅ Original .kmn preserved as .kmn.orig
- ✅ Generated .xml LDML keyboard
- ✅ Updated README with conversion notice
- ✅ All other project files preserved

### Example: LDML Project Structure
```
release-ldml/sil_cameroon_qwerty/
├── source/
│   ├── sil_cameroon_qwerty.xml        # Generated LDML
│   ├── sil_cameroon_qwerty.kmn.orig   # Original KMN
│   ├── kmp.json                        # Updated package
│   ├── welcome.htm
│   ├── *.ttf                          # Fonts
│   └── *.ico                          # Icons
├── README.md                           # Updated with notice
└── HISTORY.md
```

## Error Analysis

### KMN → LDML Errors (18)

**Cannot convert mnemonic keyboard "BU Phonetic" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
bu_phonetic
```

**Cannot convert mnemonic keyboard "Simplified Chinese" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
cs_pinyin
```

**Cannot convert mnemonic keyboard "Dazaga Gourane Karra" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
dazaga_gourane_karra
```

**Cannot convert mnemonic keyboard "Enggano" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
enggano
```

**Cannot convert mnemonic keyboard "Korean Phonetic" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
korean_phonetic
```

**Cannot convert mnemonic keyboard "IPA (NLCI)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
nlci_ipa
```

**Cannot convert mnemonic keyboard "Buang (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
sil_buang
```

**Cannot convert mnemonic keyboard "Indic Roman Transliter while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
sil_indic_roman
```

**Cannot convert mnemonic keyboard "IPA (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
sil_ipa
```

**Cannot convert mnemonic keyboard "Korean KORDA Jamo (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
sil_korda_jamo
```

**Cannot convert mnemonic keyboard "Korean KORDA L while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
sil_korda_latin
```

**Cannot convert mnemonic keyboard "Korean Morse (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
sil_korean_morse
```

**Cannot convert mnemonic keyboard "Lepcha (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
sil_lepcha
```

**Cannot convert mnemonic keyboard "Pan Africa Mnemonic (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
sil_pan_africa_mnemonic
```

**Cannot convert mnemonic keyboard "Philippines (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
sil_philippines
```

**Cannot convert mnemonic keyboard "Sahu (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
sil_sahu
```

**Cannot convert mnemonic keyboard "Vai (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
sil_vai
```

**Cannot convert mnemonic keyboard "Yorùbá 8" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
sil_yoruba8
```

## Successful Conversions

843 keyboards successfully completed the full round-trip with complete project structure.

### What You Get

**LDML Projects** (`release-ldml/`):
- Complete keyboard projects ready to build
- LDML .xml files instead of .kmn
- Updated kmp.json metadata
- All fonts, icons, documentation preserved
- Original .kmn saved as .kmn.orig for reference

**Round-Trip Projects** (`release-rt/`):
- Regenerated .kmn from LDML
- Can be compared with originals
- Validates conversion accuracy

## Testing Converted Projects

To test a converted LDML project:

```bash
cd D:\Github\keyboards\release-ldml\<project_name>
kmc build source/<keyboard>.xml
```

To compare round-trip results:
```bash
diff D:\Github\keyboards\release\<project>\source\<keyboard>.kmn \
     D:\Github\keyboards\release-rt\<project>\source\<keyboard>.kmn
```
