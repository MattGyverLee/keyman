# KMN ↔ LDML Conversion Test Report

**Generated:** 2025-11-30T21:46:28.822Z
**Source:** D:\Github\keyboards\release
**LDML Output:** D:\Github\keyboards\release-ldml
**Round-Trip Output:** D:\Github\keyboards\release-rt

## Summary Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Keyboards** | 874 | 100% |
| KMN → LDML Success | 853 | 97.6% |
| KMN → LDML Errors | 21 | 2.4% |
| LDML → KMN Success | 853 | 97.6% |
| LDML → KMN Errors | 0 | 0.0% |
| **Complete Round-Trip** | 853 | 97.6% |

## Error Analysis

### KMN → LDML Errors (21)

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

**Cannot convert mnemonic keyboard "Ximtanga" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
gff-ximtanga-7
```

**Cannot convert mnemonic keyboard "Silt'e" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
gff-xst-7
```

**Cannot convert mnemonic keyboard "Harari" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.** (1 keyboards)

```
gff-har-7
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

### LDML → KMN Errors (0)

## Successful Conversions

853 keyboards successfully completed the full round-trip:
- KMN → LDML conversion
- LDML → KMN conversion

These keyboards can be found in:
- LDML: `D:\Github\keyboards\release-ldml`
- Round-trip KMN: `D:\Github\keyboards\release-rt`

## Recommendations

✅ **Excellent conversion rate!** The converter handles the vast majority of keyboards successfully.

### KMN → LDML Issues
Focus on improving:
- KMN parser to handle edge cases
- LDML generator to map all KMN features
