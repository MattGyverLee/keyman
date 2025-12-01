# Line-by-Line KMN Round-Trip Report

Generated: 2025-12-01T15:34:55.628Z

## Summary

- **Total Files**: 111
- **Successful Conversions**: 99
- **Failed Conversions**: 12
- **Total Original Lines**: 29856
- **Total Roundtrip Lines**: 15910
- **Identical Lines**: 1641
- **Different Lines**: 25715

## Difference Classifications

| Classification | Count | Description |
|---------------|-------|-------------|
| comment_removed | 4589 | Comments not preserved |
| store_reordered | 1465 | Store order changed |
| store_format | 5 | Store value format changed (U+ vs literal) |
| rule_format | 8551 | Rule formatting changed |
| key_format | 98 | Key format changed |
| modifier_format | 44 | Modifier format changed |
| group_structure | 173 | Group structure changed |
| line_added | 2094 | Line added in roundtrip |
| line_removed | 8163 | Line removed in roundtrip |
| unknown | 533 | Unclassified difference |

## Conversion Errors

### sil_buang

```
Cannot convert mnemonic keyboard "Buang (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.
```

### sil_indic_roman

```
Cannot convert mnemonic keyboard "Indic Roman Transliteration (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.
```

### sil_ipa

```
Cannot convert mnemonic keyboard "IPA (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.
```

### sil_korda_jamo

```
Cannot convert mnemonic keyboard "Korean KORDA Jamo (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.
```

### sil_korda_latin

```
Cannot convert mnemonic keyboard "Korean KORDA Latin (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.
```

### sil_korean_morse

```
Cannot convert mnemonic keyboard "Korean Morse (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.
```

### sil_lepcha

```
Cannot convert mnemonic keyboard "Lepcha (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.
```

### sil_pan_africa_mnemonic

```
Cannot convert mnemonic keyboard "Pan Africa Mnemonic (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.
```

### sil_philippines

```
Cannot convert mnemonic keyboard "Philippines (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.
```

### sil_sahu

```
Cannot convert mnemonic keyboard "Sahu (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.
```

### sil_vai

```
Cannot convert mnemonic keyboard "Vai (SIL)" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.
```

### sil_yoruba8

```
Cannot convert mnemonic keyboard "Yorùbá 8" to LDML. LDML uses positional key mapping (physical keys) while mnemonic keyboards use character-based mapping that adapts to the user's base keyboard layout. These concepts are fundamentally incompatible.
```

## Detailed Differences by File

### sil_akebu

- Original lines: 333
- Roundtrip lines: 219
- Identical: 26
- Different: 307

#### store_reordered (17)

Line 1:
```
- ﻿store(&COPYRIGHT) '(c) 2023 SIL International'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&MESSAGE) 'Use ! or AltGr to access special characters.'
+ store(&NAME) 'Akebu'
```
Line 4:
```
- store(&LAYOUTFILE) 'sil_akebu.keyman-touch-layout'
+ store(&KEYBOARDVERSION) '1.0.0'
```
Line 5:
```
- store(&KEYBOARDVERSION) '1.0.0'
+ store(&COPYRIGHT) '(c) 2023 SIL International'
```
Line 6:
```
- store(&TARGETS) 'any'
+ store(&VERSION) '10.0'
```
... and 12 more

#### line_removed (94)

Line 2:
```
- store(&BITMAP) 'sil_akebu.ico'
+ 
```
Line 8:
```
- store(&KMW_EMBEDCSS) 'sil_akebu.css'
+ 
```
Line 22:
```
- store(composed) "àèìǹòùẁỳÀÈÌǸÒÙẀỲᾺáćéǵíḱĺḿńóṕŕśúẃýźÁĆÉǴÍḰĹḾŃÓṔŔŚÚẂÝŹΆâĉêĝĥîĵôŝûŵŷẑÂĈÊĜĤÎĴÔŜÛŴŶẐāēḡīōūȳĀĒḠĪŌŪȲᾹäëḧïöẗüẍÿÄËḦÏÖÜẌŸạḅḍẹḥịḳḷṃṇọṛṣṭụṿẉỵẓẠḄḌẸḤỊḲḶṂṆỌṚṢṬỤṾẈỴẒçḑȩģḩķļņŗşţÇḐȨĢḨĶĻŅŖŞŢḛḭṵḚḬṴãẽĩñõũṽỹÃẼĨÑÕŨṼỸḉḈậệộẬỆỘẫễỗẪỄỖṻṺḹṝḸṜﬀﬃﬄﬁﬂĲĳǇǈǉǊǋǌﬆﬅ"
+ 
```
Line 24:
```
- store(nfpunct) "',:;"
+ 
```
Line 26:
```
- store(num) "0123456789"
+ 
```
... and 89 more

#### comment_removed (6)

Line 11:
```
- c Technically, [K_SLASH] should be in the above list, but I'm choosing not to add it to avoid confusion.  
+ store(lc) "aɛbɓcdɖeǝfghiɩjklmnŋoɔprstuʊvwyzqx◌"
```
Line 54:
```
- c ??
+ + [K_S] > 's'
```
Line 305:
```
- c + [T_UPPER] > layer('default')
+ 
```
Line 307:
```
- c Handle Touch Diacritics (ignoring on non-letters)
+ 
```
Line 330:
```
- c CAM U not listed as possibility.
+ 
```
... and 1 more

#### line_added (38)

Line 13:
```
- 
+ store(composed) "àèìǹòùẁỳÀÈÌǸÒÙẀỲᾺáćéǵíḱĺḿńóṕŕśúẃýźÁĆÉǴÍḰĹḾŃÓṔŔŚÚẂÝŹΆâĉêĝĥîĵôŝûŵŷẑÂĈÊĜĤÎĴÔŜÛŴŶẐāēḡīōūȳĀĒḠĪŌŪȲᾹäëḧïöẗüẍÿÄËḦÏÖÜẌŸạḅḍẹḥịḳḷṃṇọṛṣṭụṿẉỵẓẠḄḌẸḤỊḲḶṂṆỌṚṢṬỤṾẈỴẒçḑȩģḩķļņŗşţÇḐȨĢḨĶĻŅŖŞŢḛḭṵḚḬṴãẽĩñõũṽỹÃẼĨÑÕŨṼỸḉḈậệộẬỆỘẫễỗẪỄỖṻṺḹṝḸṜﬀﬃﬄﬁﬂĲĳǇǈǉǊǋǌﬆﬅ"
```
Line 15:
```
- 
+ store(nfpunct) "'',:;"
```
Line 17:
```
- 
+ store(num) "0123456789"
```
Line 29:
```
- 
+ + [K_2] > 'é'
```
Line 33:
```
- 
+ + [K_6] > '-'
```
... and 33 more

#### group_structure (2)

Line 14:
```
- begin Unicode > use(main)
+ store(comp-dia) "aeinouwyAEINOUWYΑacegiklmnoprsuwyzACEGIKLMNOPRSUWYZΑaceghijosuwyzACEGHIJOSUWYZaegiouyAEGIOUYΑaehiotuxyAEHIOUXYabdehiklmnorstuvwyzABDEHIKLMNORSTUVWYZcdeghklnrstCDEGHKLNRSTeiuEIUaeinouvyAEINOUVYçÇạẹọẠẸỌâêôÂÊÔūŪḷṛḶṚfﬀﬀffIiLLlNNnsf"
```
Line 16:
```
- group(main) using keys
+ store(final) "!?."
```

#### rule_format (150)

Line 30:
```
- platform('touch') any(word) any(final) + [K_SPACE] > index(word,2) index(final,3) " " layer('shift')
+ + [K_3] > '"'
```
Line 31:
```
- platform('touch') any(word) U+0020 + [K_SPACE] > index(word,2) U+002E " " layer('shift')
+ + [K_4] > ''''
```
Line 32:
```
- any(composed) + [K_BKSP] > index(comp-dia,1)
+ + [K_5] > '('
```
Line 35:
```
- + [LCTRL K_SPACE] > U+00A0
+ + [K_8] > '_'
```
Line 36:
```
- + [K_SPACE] > U+0020
+ + [K_9] > 'ç'
```
... and 145 more

### sil_akha_act

- Original lines: 48
- Roundtrip lines: 41
- Identical: 6
- Different: 42

#### comment_removed (4)

Line 1:
```
- ﻿c sil_akha_act generated from template at 2022-03-16 08:38:08
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c with name "Akha ACT"
+ 
```
Line 33:
```
- c vowels with diacritics
+ group(transforms)
```
Line 47:
```
- c EOF
+ 
```

#### store_reordered (15)

Line 3:
```
- store(&VERSION) '10.0'
+ store(&NAME) 'Akha ACT'
```
Line 4:
```
- store(&NAME) 'Akha ACT'
+ store(&KEYBOARDVERSION) '1.0'
```
Line 6:
```
- store(&KEYBOARDVERSION) '1.0'
+ store(&VERSION) '10.0'
```
Line 9:
```
- store(&LAYOUTFILE) 'sil_akha_act.keyman-touch-layout'
+ store(symbolkeys) "`1234567890-=~!@#$%^&*()_+"
```
Line 10:
```
- store(&BITMAP) 'sil_akha_act.ico'
+ store(symbols) "`1234567890-=~!@#$%^&*()_+"
```
... and 10 more

#### line_removed (10)

Line 8:
```
- store(&VISUALKEYBOARD) 'sil_akha_act.kvks'
+ 
```
Line 19:
```
- store(symbols) "`1234567890-=~!@#$%^&*()_+"
+ 
```
Line 21:
```
-                         [SHIFT K_COLON] [SHIFT K_QUOTE] [SHIFT K_COMMA] [SHIFT K_PERIOD] [SHIFT K_SLASH]
+ 
```
Line 23:
```
-                     U+003A U+0022 U+003C U+003E U+003F     
+ 
```
Line 30:
```
- + any(akhatonekeys) > index(akhatones,1)
+ 
```
... and 5 more

#### line_added (4)

Line 13:
```
- 
+ store(akhatonekeys) "[K_LBRKT]  [K_RBRKT]  [K_BKSLASH]  [SHIFT  K_LBRKT]  [SHIFT  K_RBRKT]  [SHIFT  K_BKSLASH]"
```
Line 15:
```
- 
+ store(alphakeys) "[K_A] .. [K_Z]"
```
Line 17:
```
- 
+ store(vowdiackeys) "[ALT  K_LBRKT]  [ALT  K_RBRKT]  [ALT  K_PERIOD]  [ALT  K_COLON]  [ALT  K_QUOTE]  [ALT  K_SLASH]  \\"
```
Line 38:
```
- 
+ 'ˇ{' > '{'
```

#### group_structure (2)

Line 14:
```
- begin Unicode > use(main)
+ store(akhatones) U+02EC U+A788 U+02CD U+02C7 U+02C6 U+02C9
```
Line 16:
```
- group(main) using keys
+ store(alphabet) 'a'
```

#### rule_format (6)

Line 28:
```
- + any(symbolkeys) > index(symbols,1)
+ + [SHIFT K_RBRKT] > '}'
```
Line 29:
```
- + any(othersymbolkeys) > index(othersymbols,1)
+ + [SHIFT K_BKSLASH] > '|'
```
Line 31:
```
- + any(alphakeys) > index(alphabet, 1)
+ match > use(transforms)
```
Line 37:
```
- + any(vowdiackeys) > index(vowdiacs,1)
+ 'ꞈ]' > ']'
```
Line 39:
```
- U+02EC + [K_LBRKT] > "[" 
+ 'ˉ|' > '|'
```
... and 1 more

#### modifier_format (1)

Line 35:
```
-                    [SHIFT ALT K_LBRKT] [SHIFT ALT K_RBRKT] [SHIFT ALT K_PERIOD] [SHIFT ALT K_COLON] [SHIFT ALT K_QUOTE] [SHIFT ALT K_SLASH] 
+ 'ˬ[' > '['
```

### sil_arabic_phonetic

- Original lines: 163
- Roundtrip lines: 67
- Identical: 21
- Different: 142

#### store_reordered (9)

Line 1:
```
- ﻿store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '© 2007-2020 SIL International'
+ store(&NAME) 'Arabic Phonetic (SIL)'
```
Line 5:
```
- store(&VISUALKEYBOARD) 'sil_arabic_phonetic.kvks'
+ store(&COPYRIGHT) '© 2007-2020 SIL International'
```
Line 10:
```
- store(&BITMAP) 'sil_arabic_phonetic.ico'
+ store(a_rot1) "َاآأإىع"
```
Line 11:
```
- store(&KMW_RTL) '1'
+ store(a_rot2) "اآأإىعَ"
```
... and 4 more

#### line_removed (79)

Line 2:
```
- store(&NAME) 'Arabic Phonetic (SIL)'
+ 
```
Line 22:
```
-   'د' 'س' 'ع' 'ي' 'ت' 'ر' 'و' 'ق'
+ 
```
Line 24:
```
- group(main) using keys
+ 
```
Line 26:
```
- + '=' > '='
+ 
```
Line 45:
```
- + [SHIFT K_0] > ")"
+ 
```
... and 74 more

#### line_added (6)

Line 4:
```
- 
+ store(&KEYBOARDVERSION) '1.0.2'
```
Line 6:
```
- 
+ store(&VERSION) '10.0'
```
Line 15:
```
- 
+ store(h_rot2) "هخح"
```
Line 17:
```
- 
+ store(s_rot2) "صشس"
```
Line 19:
```
- 
+ store(t_rot2) "طةثظذت"
```
... and 1 more

#### comment_removed (9)

Line 7:
```
- c store(&WINDOWSLANGUAGES) 'x0401 x1401 x3C01 x0C01 x0801 x2C01 x3401 x3001 x1001 x1801 x2001 x4001 x2801 x3801 x1C01 x2401'
+ store(&TARGETS) 'any'
```
Line 8:
```
- c store(&LANGUAGE) 'x0401'
+ 
```
Line 9:
```
- c store(&ETHNOLOGUECODE) 'arb ara aao arq bbz abv shu acy adf avl arz afb ayh acw ayl acm ary ars apc ayp acx aec ayn ssh ajp pga apd acq abh aeb auz'
+ store(cons) '\\'
```
Line 18:
```
- c store(&mnemoniclayout) '1'
+ store(t_rot1) "تطةثظذ"
```
Line 58:
```
- c + 'X' > 'ْ'
+ 'َا' > 'ا'
```
... and 4 more

#### group_structure (1)

Line 16:
```
- begin Unicode > use(main)
+ store(s_rot1) "سصش"
```

#### unknown (1)

Line 21:
```
-   'ذ' 'ظ' 'خ' 'ح' 'ض' 'ص' 'ى' 'ط' 'م' 'ن' 'ب' 'ث' 'ش' 'ء' 'ز' 'ل' 'ك' 'ج' 'ه' 'غ' 'ف' \
+ store(digit) "٠١٢٣٤٥٦٧٨٩"
```

#### rule_format (37)

Line 25:
```
- + '-' > '-'
+ group(main) using keys
```
Line 27:
```
- + [K_LBRKT]  > '['
+ + [K_LBRKT] > '['
```
Line 28:
```
- + [K_RBRKT]  > ']'
+ + [K_RBRKT] > ']'
```
Line 29:
```
- + [K_BKSLASH]  > '\'
+ + [K_BKSLASH] > '\\'
```
Line 30:
```
- + [SHIFT K_LBRKT]  > '{'
+ + [SHIFT K_BKQUOTE] > '~'
```
... and 32 more

### sil_areare

- Original lines: 22
- Roundtrip lines: 17
- Identical: 2
- Different: 20

#### comment_removed (3)

Line 1:
```
- ﻿c This keyboard is designed for the ?are?are language spoken in Solomon Islands.
+ c Converted from LDML keyboard: und
```
Line 5:
```
- c store(&ETHNOLOGUECODE) 'alu'
+ store(&COPYRIGHT) '© SIL International'
```
Line 9:
```
- c store(&WINDOWSLANGUAGES) 'x0409'
+ begin Unicode > use(main)
```

#### line_removed (8)

Line 2:
```
- store(&VERSION) '9.0'
+ 
```
Line 8:
```
- store(&MESSAGE) 'The Ɂareɂare Unicode keyboard is distributed under The MIT License (MIT).'
+ 
```
Line 10:
```
- store(&BITMAP) 'sil_areare.ico'
+ 
```
Line 12:
```
- store(&LAYOUTFILE) 'sil_areare.keyman-touch-layout'
+ 
```
Line 18:
```
- + [K_G] > U+0242
+ 
```
... and 3 more

#### store_reordered (5)

Line 3:
```
- store(&TARGETS) 'any'
+ store(&NAME) 'Ɂareɂare'
```
Line 4:
```
- store(&NAME) 'Ɂareɂare'
+ store(&KEYBOARDVERSION) '1.1'
```
Line 6:
```
- store(&COPYRIGHT) '© SIL International'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&KEYBOARDVERSION) '1.1'
+ store(&TARGETS) 'any'
```
Line 11:
```
- store(&VISUALKEYBOARD) 'sil_areare.kvks'
+ group(main) using keys
```

#### group_structure (2)

Line 13:
```
- begin Unicode > use(main)
+ + [K_G] > 'ɂ'
```
Line 16:
```
- group(main) using keys
+ + [SHIFT CTRL RALT K_G] > 'G'
```

#### line_added (2)

Line 14:
```
- 
+ + [CTRL RALT K_G] > 'g'
```
Line 15:
```
- 
+ + [SHIFT K_G] > 'Ɂ'
```

### sil_bari

- Original lines: 116
- Roundtrip lines: 107
- Identical: 6
- Different: 110

#### comment_removed (4)

Line 1:
```
- ﻿c bfa-Latn.kmn
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c Author:   Lorna Evans
+ 
```
Line 3:
```
- c Date:     12-DEC-2016
+ store(&NAME) 'Bari (SIL)'
```
Line 7:
```
- c store(&MESSAGE) "The Bari Unicode keyboard is distributed under the X11 free software license (http://scripts.sil.org/X11License)."
+ store(&TARGETS) 'any'
```

#### store_reordered (5)

Line 4:
```
- store(&VERSION) '9.0'
+ store(&KEYBOARDVERSION) '1.1.2'
```
Line 5:
```
- store(&NAME) 'Bari (SIL)'
+ store(&COPYRIGHT) '© 2016-2021 SIL International'
```
Line 6:
```
- store(&COPYRIGHT) '© 2016-2021 SIL International'
+ store(&VERSION) '10.0'
```
Line 9:
```
- store(&KEYBOARDVERSION) '1.1.2'
+ begin Unicode > use(main)
```
Line 11:
```
- store(&VISUALKEYBOARD) 'sil_bari.kvks'
+ group(main) using keys
```

#### line_removed (8)

Line 8:
```
- store(&ETHNOLOGUECODE) 'bfa'
+ 
```
Line 10:
```
- store(&TARGETS) 'any'
+ 
```
Line 12:
```
- store(&LAYOUTFILE) 'sil_bari.keyman-touch-layout'
+ 
```
Line 108:
```
- + [K_C] > U+00F6
+ 
```
Line 109:
```
- + [K_H] > U+A78C
+ 
```
... and 3 more

#### line_added (3)

Line 13:
```
- 
+ + [K_BKQUOTE] > '`'
```
Line 15:
```
- 
+ + [K_2] > '2'
```
Line 16:
```
- 
+ + [K_3] > '3'
```

#### group_structure (2)

Line 14:
```
- begin Unicode > use(main)
+ + [K_1] > '1'
```
Line 17:
```
- group(main) using keys
+ + [K_4] > '4'
```

#### rule_format (88)

Line 18:
```
- + [SHIFT K_Z] > 'Z'
+ + [K_5] > '5'
```
Line 19:
```
- + [SHIFT K_H] > 'ꞌ'
+ + [K_6] > '6'
```
Line 20:
```
- + [SHIFT K_SLASH] > '?'
+ + [K_7] > '7'
```
Line 21:
```
- + [SHIFT K_PERIOD] > '>'
+ + [K_8] > '8'
```
Line 22:
```
- + [SHIFT K_COMMA] > '<'
+ + [K_9] > '9'
```
... and 83 more

### sil_bengali_phonetic

- Original lines: 108
- Roundtrip lines: 41
- Identical: 9
- Different: 99

#### comment_removed (4)

Line 1:
```
- ﻿c Bangla-Asamiya Keyboard for Keyman
+ c Converted from LDML keyboard: und
```
Line 97:
```
- c dk(1) + 'R' > U+09E0 c BENGALI LETTER VOCALIC RR - Sanskrit
+ 
```
Line 102:
```
- c dk(1) + '.' > U+09F7 c BENGALI CURRENCY NUMERATOR FOUR - obsolete
+ 
```
Line 106:
```
- c touch rules
+ 
```

#### store_reordered (6)

Line 3:
```
- store(&VERSION) "10.0"                
+ store(&NAME) 'Bengali-Assamese Phonetic (SIL)'
```
Line 4:
```
- store(&NAME) 'Bengali-Assamese Phonetic (SIL)'
+ store(&KEYBOARDVERSION) '1.3'
```
Line 5:
```
- store(&BITMAP) 'sil_bengali_phonetic.ico'
+ store(&COPYRIGHT) '© 2006-2021 SIL International'
```
Line 9:
```
- store(&COPYRIGHT) '© 2006-2021 SIL International'
+ store(nul) "QHLZX"
```
Line 11:
```
- store(&LAYOUTFILE) 'sil_bengali_phonetic.keyman-touch-layout'
+ begin Unicode > use(main)
```
... and 1 more

#### line_added (2)

Line 6:
```
- 
+ store(&VERSION) '10.0'
```
Line 19:
```
- 
+ group(transforms)
```

#### line_removed (65)

Line 8:
```
- store(&KEYBOARDVERSION) '1.3'
+ 
```
Line 10:
```
- store(&VISUALKEYBOARD) 'sil_bengali_phonetic.kvks'
+ 
```
Line 18:
```
- + any(nul) > nul
+ 
```
Line 20:
```
- + '`' >  U+0981
+ 
```
Line 41:
```
- + 'n' >  U+09A8
+ 
```
... and 60 more

#### group_structure (2)

Line 13:
```
- begin UNICODE > use(Main)
+ group(main) using keys
```
Line 17:
```
- group(Main) using keys
+ match > use(transforms)
```

#### rule_format (20)

Line 21:
```
- + '~' >  U+0982
+ dk(1)অ > 'অ'
```
Line 22:
```
- + 'k' >  U+0995
+ dk(1)আ > 'আ'
```
Line 23:
```
- + 'K' >  U+0996
+ dk(1)ই > 'ই'
```
Line 24:
```
- + 'g' >  U+0997
+ dk(1)ঈ > 'ঈ'
```
Line 25:
```
- + 'G' >  U+0998
+ dk(1)উ > 'উ'
```
... and 15 more

### sil_bolivia

- Original lines: 328
- Roundtrip lines: 244
- Identical: 20
- Different: 308

#### unknown (3)

Line 1:
```
- ﻿c
+ c Converted from LDML keyboard: und
```
Line 4:
```
- c
+ store(&KEYBOARDVERSION) '1.0'
```
Line 7:
```
- c
+ store(&TARGETS) 'any'
```

#### comment_removed (10)

Line 2:
```
- c Keyman keyboard generated by ImportKeyboard
+ 
```
Line 3:
```
- c Imported: 2019-08-05 13:02:35
+ store(&NAME) 'Indígenas Bolivianos'
```
Line 5:
```
- c Source Keyboard File: KBDSP.DLL
+ store(&COPYRIGHT) '(c) 2022 SIL International'
```
Line 6:
```
- c Source KeyboardID: 0000040a
+ store(&VERSION) '10.0'
```
Line 61:
```
- c cedilla
+ + [K_Z] > 'z'
```
... and 5 more

#### line_removed (67)

Line 8:
```
- c 
+ 
```
Line 19:
```
- begin Unicode > use(main)
+ 
```
Line 21:
```
- group(main) using keys
+ 
```
Line 23:
```
- + [K_SPACE] > U+0020
+ 
```
Line 210:
```
- + [SHIFT K_SLASH] > U+005f
+ 
```
... and 62 more

#### line_added (53)

Line 9:
```
- 
+ store(dkf007e) U+0020 " " U+0061 U+0041 U+006E U+004E U+006F U+004F
```
Line 18:
```
- 
+ store(dkt00a8) U+00A8 U+00E4 U+00C4 U+00EB U+00CB U+00EF U+00CF U+00F6 U+00D6 U+00FC U+00DC U+00FF U+0178
```
Line 20:
```
- 
+ begin Unicode > use(main)
```
Line 22:
```
- 
+ group(main) using keys
```
Line 24:
```
- 
+ + [K_BKQUOTE] > 'º'
```
... and 48 more

#### store_reordered (8)

Line 10:
```
- store(&VERSION) '10.0'
+ store(dkt007e) U+007E U+00E3 U+00C3 U+00F1 U+00D1 U+00F5 U+00D5
```
Line 11:
```
- store(&NAME) 'Indígenas Bolivianos'
+ store(dkf0060) U+0020 " " U+0061 U+0041 U+0065 U+0045 U+0069 U+0049 U+006F U+004F U+0075 U+0055
```
Line 12:
```
- store(&Targets) "any"
+ store(dkt0060) U+0060 U+00E0 U+00C0 U+00E8 U+00C8 U+00EC U+00CC U+00F2 U+00D2 U+00F9 U+00D9
```
Line 13:
```
- store(&VISUALKEYBOARD) 'sil_bolivia.kvks'
+ store(dkf005e) U+0020 " " U+0061 U+0041 U+0065 U+0045 U+0069 U+0049 U+006F U+004F U+0075 U+0055
```
Line 14:
```
- store(&BITMAP) 'sil_bolivia.ico'
+ store(dkt005e) U+005E U+00E2 U+00C2 U+00EA U+00CA U+00EE U+00CE U+00F4 U+00D4 U+00FB U+00DB
```
... and 3 more

#### rule_format (167)

Line 25:
```
- + [K_0] > U+0030
+ + [K_1] > '1'
```
Line 26:
```
- + [SHIFT K_0] > U+003d
+ + [K_2] > '2'
```
Line 28:
```
- + [K_1] > U+0031
+ + [K_4] > '4'
```
Line 29:
```
- + [SHIFT K_1] > U+0021
+ + [K_5] > '5'
```
Line 30:
```
- + [RALT K_1] > U+007c
+ + [K_6] > '6'
```
... and 162 more

### sil_boonkit

- Original lines: 89
- Roundtrip lines: 39
- Identical: 13
- Different: 76

#### comment_removed (17)

Line 1:
```
- ﻿c Lanna boonkit layout Keyboard in Unicode
+ c Converted from LDML keyboard: und
```
Line 3:
```
- c MJPH  0.1     23-MAY-2008     Original
+ store(&NAME) 'Boonkit (SIL)'
```
Line 4:
```
- c MJPH  0.2     23-SEP-2008     Fill out sbase, but probably still more to go
+ store(&KEYBOARDVERSION) '0.6.6'
```
Line 5:
```
- c MJPH  0.3     12-DEC-2008     Add hang numbers and U+1A5B.
+ store(&COPYRIGHT) '© SIL International'
```
Line 6:
```
- c MJPH  0.4     28-APR-2009     Make prevowels typable before following base
+ store(&VERSION) '10.0'
```
... and 12 more

#### line_removed (44)

Line 2:
```
- c 
+ 
```
Line 24:
```
- store(&KEYBOARDVERSION) '0.6.6'
+ 
```
Line 26:
```
- store(&TARGETS) 'desktop'
+ 
```
Line 31:
```
-              '234567890-=' \
+ 
```
Line 39:
```
- store(base) \
+ 
```
... and 39 more

#### line_added (2)

Line 18:
```
- 
+ store(hangk) "\\`"
```
Line 38:
```
- 
+ any(sbase) > '᩠'
```

#### store_reordered (6)

Line 19:
```
- store(&VERSION) '10.0'
+ store(sbase) U+1A20 U+1A21 U+1A23 U+1A25 U+1A26 U+1A27
```
Line 20:
```
- store(&NAME) 'Boonkit (SIL)'
+ store(preVK) "gcFw"
```
Line 21:
```
- store(&VISUALKEYBOARD) 'sil_boonkit.kvks'
+ store(preV) U+1A6E U+1A6F U+1A70 U+1A71
```
Line 23:
```
- store(&COPYRIGHT) '© SIL International'
+ begin Unicode > use(main)
```
Line 25:
```
- store(&BITMAP) 'sil_boonkit.ico'
+ group(main) using keys
```
... and 1 more

#### group_structure (1)

Line 28:
```
- begin Unicode > use(Main)
+ match > use(transforms)
```

#### unknown (6)

Line 32:
```
-              'QWERTYUIOP{' \
+ (any(hbase)) > index(hack,1)
```
Line 33:
```
-              'qrtyuiop[]' \
+ ᩠(any(dhackb)) > index(dhack,1)
```
Line 34:
```
-              'SDGJKL:'  \
+ ᩠(any(sbase)) > index(sbase,1)
```
Line 35:
```
-              "asdfhjkl;'"  \
+ 'CVBNM<' > '  \\'
```
Line 36:
```
-              'CVBNM<>?|'  \
+ any(tall)ᩤ > 'ᩤ'
```
... and 1 more

### sil_brao

- Original lines: 110
- Roundtrip lines: 107
- Identical: 4
- Different: 106

#### comment_removed (2)

Line 1:
```
- ﻿c sil_brao generated from template at 2021-03-04 10:30:10
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c with name "Brao (SIL)"
+ 
```

#### store_reordered (5)

Line 3:
```
- store(&VERSION) '10.0'
+ store(&NAME) 'Brao (SIL)'
```
Line 4:
```
- store(&NAME) 'Brao (SIL)'
+ store(&KEYBOARDVERSION) '1.0'
```
Line 6:
```
- store(&KEYBOARDVERSION) '1.0'
+ store(&VERSION) '10.0'
```
Line 9:
```
- store(&LAYOUTFILE) 'sil_brao.keyman-touch-layout'
+ begin Unicode > use(main)
```
Line 11:
```
- store(&BITMAP) 'sil_brao.ico'
+ group(main) using keys
```

#### line_removed (5)

Line 8:
```
- store(&VISUALKEYBOARD) 'sil_brao.kvks'
+ 
```
Line 10:
```
- store(&KMW_EMBEDCSS) 'sil_brao.css'
+ 
```
Line 107:
```
- + [K_2] > '២'
+ 
```
Line 108:
```
- + [K_1] > '១'
+ 
```
Line 109:
```
- + [K_BKQUOTE] > '«'
+ 
```

#### group_structure (2)

Line 13:
```
- begin Unicode > use(main)
+ + [K_BKQUOTE] > '«'
```
Line 15:
```
- group(main) using keys
+ + [K_2] > '២'
```

#### line_added (1)

Line 14:
```
- 
+ + [K_1] > '១'
```

#### rule_format (91)

Line 16:
```
- + [SHIFT K_BKSLASH] > '>'
+ + [K_3] > '៣'
```
Line 17:
```
- + [SHIFT K_RBRKT] > '<'
+ + [K_4] > '៤'
```
Line 18:
```
- + [K_BKSLASH] > '.'
+ + [K_5] > '៥'
```
Line 19:
```
- + [K_RBRKT] > ','
+ + [K_6] > '៦'
```
Line 20:
```
- + [SHIFT K_7] > '&'
+ + [K_7] > '៧'
```
... and 86 more

### sil_bru

- Original lines: 334
- Roundtrip lines: 270
- Identical: 14
- Different: 320

#### unknown (3)

Line 1:
```
- ﻿c
+ c Converted from LDML keyboard: und
```
Line 4:
```
- c
+ store(&KEYBOARDVERSION) '1.1'
```
Line 7:
```
- c
+ store(&TARGETS) 'any'
```

#### comment_removed (4)

Line 2:
```
- c Keyman keyboard generated by ImportKeyboard
+ 
```
Line 3:
```
- c Imported: 2021-01-22 15:22:50
+ store(&NAME) 'Bru'
```
Line 5:
```
- c Source Keyboard File: sil_bru.dll
+ store(&COPYRIGHT) '© 2013-2021 SIL International'
```
Line 6:
```
- c Source KeyboardID: a0000402
+ store(&VERSION) '10.0'
```

#### line_removed (54)

Line 8:
```
- c 
+ 
```
Line 10:
```
- store(&VERSION) '10.0'
+ 
```
Line 12:
```
- store(&Targets) "any"
+ 
```
Line 270:
```
- + [SHIFT RALT K_COLON] > U+003a
+ 
```
Line 272:
```
- + [K_EQUAL] > U+20ab
+ 
```
... and 49 more

#### line_added (41)

Line 9:
```
- 
+ begin Unicode > use(main)
```
Line 18:
```
- 
+ + [K_5] > '̀'
```
Line 20:
```
- 
+ + [K_7] > '̃'
```
Line 22:
```
- 
+ + [K_9] > '̣'
```
Line 24:
```
- 
+ + [K_HYPHEN] > '-'
```
... and 36 more

#### store_reordered (6)

Line 11:
```
- store(&NAME) 'Bru'
+ group(main) using keys
```
Line 13:
```
- store(&VISUALKEYBOARD) 'sil_bru.kvks'
+ + [K_BKQUOTE] > '`'
```
Line 14:
```
- store(&BITMAP) 'sil_bru.ico'
+ + [K_1] > 'ă'
```
Line 15:
```
- store(&LAYOUTFILE) 'sil_bru.keyman-touch-layout'
+ + [K_2] > 'â'
```
Line 16:
```
- store(&COPYRIGHT) '© 2013-2021 SIL International'
+ + [K_3] > 'ê'
```
... and 1 more

#### group_structure (2)

Line 19:
```
- begin Unicode > use(main)
+ + [K_6] > '̉'
```
Line 21:
```
- group(main) using keys
+ + [K_8] > '́'
```

#### rule_format (210)

Line 23:
```
- + [K_SPACE] > U+0020
+ + [K_0] > 'đ'
```
Line 25:
```
- + [NCAPS K_0] > U+0111
+ + [K_EQUAL] > '₫'
```
Line 26:
```
- + [CAPS K_0] > U+0110
+ + [K_Q] > 'q'
```
Line 27:
```
- + [NCAPS SHIFT K_0] > U+0110
+ + [K_W] > 'w'
```
Line 28:
```
- + [CAPS SHIFT K_0] > U+0111
+ + [K_E] > 'e'
```
... and 205 more

### sil_bunong

- Original lines: 197
- Roundtrip lines: 147
- Identical: 14
- Different: 183

#### store_reordered (7)

Line 1:
```
- ﻿store(&VERSION) '9.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&TARGETS) 'any'
+ store(&NAME) 'Bunong ឞូន៝ង (SIL)'
```
Line 4:
```
- store(&COPYRIGHT) '© 2021 - 2023 SIL International'
+ store(&KEYBOARDVERSION) '1.5'
```
Line 5:
```
- store(&KEYBOARDVERSION) '1.5'
+ store(&COPYRIGHT) '© 2021 - 2023 SIL International'
```
Line 6:
```
- store(&BITMAP) 'sil_bunong.ico'
+ store(&VERSION) '10.0'
```
... and 2 more

#### line_removed (33)

Line 2:
```
- store(&NAME) 'Bunong ឞូន៝ង (SIL)'
+ 
```
Line 8:
```
- store(&LAYOUTFILE) 'sil_bunong.keyman-touch-layout'
+ 
```
Line 10:
```
- store(&KMW_EMBEDCSS) 'sil_bunong.css'
+ 
```
Line 100:
```
- + [K_F] > 'ថ'
+ 
```
Line 102:
```
- + [K_H] > 'ហ'
+ 
```
... and 28 more

#### group_structure (2)

Line 11:
```
- begin Unicode > use(main)
+ group(main) using keys
```
Line 13:
```
- group(main) using keys
+ + [K_BKQUOTE] > '«'
```

#### rule_format (115)

Line 14:
```
- + [SHIFT K_A] > '@'
+ + [K_1] > '១'
```
Line 15:
```
- + [SHIFT K_8] > '*'
+ + [K_2] > '២'
```
Line 16:
```
- + [SHIFT K_4] > '៛'
+ + [K_3] > '៣'
```
Line 17:
```
- + [SHIFT K_COMMA] > '<'
+ + [K_4] > '៤'
```
Line 18:
```
- + [SHIFT K_QUOTE] > '"'
+ + [K_5] > '៥'
```
... and 110 more

#### line_added (9)

Line 109:
```
- 
+ '!។' > '?'
```
Line 112:
```
- 
+ '""' > ''''
```
Line 115:
```
- 
+ '‹«' > '«'
```
Line 123:
```
- 
+ '((' > '['
```
Line 124:
```
- 
+ '[(' > '{'
```
... and 4 more

#### comment_removed (17)

Line 116:
```
- c subscripts for phone layout
+ '»»' > '›'
```
Line 125:
```
- c Rotas
+ '{(' > '('
```
Line 127:
```
- c ។ > ៕ > ! > ? > ៗ > ។
+ '])' > '}'
```
Line 134:
```
- c " > ' > "
+ 'ូុ' > 'ួ'
```
Line 138:
```
- c « > ‹ > «  and » > › > » -- Mondolkiri font doesn't render these two pairs proportionately (April 6, 2023).
+ 'ៃេ' > 'េ'
```
... and 12 more

### sil_busa

- Original lines: 70
- Roundtrip lines: 46
- Identical: 11
- Different: 59

#### comment_removed (5)

Line 1:
```
- ﻿c Maps from busa2 designed by D Kanjahn
+ c Converted from LDML keyboard: und
```
Line 8:
```
- c store(&ethnologuecode) 'bqp bqc bus bba'
+ 
```
Line 39:
```
- c Block invalid combinations - highdia + highdia, tilde+tilde,  tilde+highdia+tilde, dia+any multi-dia combination
+ 
```
Line 46:
```
- c allow highdia + tildeK -> reorder
+ 
```
Line 51:
```
- c Vowel combinations
+ 
```

#### line_removed (19)

Line 2:
```
- store(&VERSION) '9.0'
+ 
```
Line 24:
```
- store(vowel_aiu_lo) 'aiuɛɔn'
+ 
```
Line 26:
```
- store(vowel_aiu) outs(vowel_aiu_lo) outs(vowel_aiu_up)
+ 
```
Line 28:
```
- store(other)  'ɡɑŋ' U+0323
+ 
```
Line 48:
```
- + any(vowelK) > index(vowel, 1)
+ 
```
... and 14 more

#### store_reordered (17)

Line 4:
```
- store(&COPYRIGHT) '© 2008-2021 SIL International'
+ store(&KEYBOARDVERSION) '1.4.2'
```
Line 5:
```
- store(&BITMAP) 'sil_busa.ico'
+ store(&COPYRIGHT) '© 2008-2021 SIL International'
```
Line 6:
```
- store(&VISUALKEYBOARD) 'sil_busa.kvks'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&KEYBOARDVERSION) '1.4.2'
+ store(&TARGETS) 'any'
```
Line 9:
```
- store(&TARGETS) 'web desktop'
+ store(highdia) U+0302 U+0300 U+0301 U+0304 U+0302 U+0300 U+0301 U+0304
```
... and 12 more

#### line_added (9)

Line 10:
```
- 
+ store(highdiaK) "[ALT  K_G]  [ALT  K_H]  [ALT  K_J]  [ALT  K_SLASH]  [ALT  SHIFT  K_G]  [ALT  SHIFT  K_H]  [ALT  SHIFT  K_J]  [ALT  SHIFT  K_SLASH]"
```
Line 12:
```
- 
+ store(tildeK) "[ALT  K_K]  [ALT  SHIFT  K_K]"
```
Line 15:
```
- 
+ store(vowel) "aeiouɛɔnAEIOUƐƆN"
```
Line 18:
```
- 
+ store(vowel_aiu_up) "AIUƐƆN"
```
Line 21:
```
- 
+ store(otherK) "#@^[ALT  K_2]"
```
... and 4 more

#### group_structure (2)

Line 11:
```
- begin Unicode > use(main)
+ store(tilde) U+0303 U+0303
```
Line 36:
```
- group(main) using keys
+ match > use(transforms)
```

#### modifier_format (1)

Line 33:
```
-                   [ALT K_LBRKT] [ALT K_RBRKT] [ALT SHIFT K_LBRKT] [ALT SHIFT K_RBRKT] 
+ + [SHIFT RALT K_COLON] > '̃́'
```

#### unknown (2)

Line 38:
```
- c 
+ group(transforms)
```
Line 40:
```
- c 
+ any(vowel_aiu_lo)̃̄ > '̃̄'
```

#### rule_format (4)

Line 42:
```
- any(highdia) + any(highdiaK) > context beep
+ any(vowel_aiu_lo)̃́ > '̃́'
```
Line 43:
```
- any(tilde) + any(tildeK) > context beep
+ any(vowel_aiu_lo)̃́ > '̃́'
```
Line 44:
```
- any(tilde) any(highdia) + any(tildeK) > context beep
+ any(vowel_aiu_lo)̃̀ > '̃̀'
```
Line 45:
```
- any(dia) + any(multidiaK) > context beep
+ any(vowel_aiu_lo)̃̀ > '̃̀'
```

### sil_bwe_karen

- Original lines: 110
- Roundtrip lines: 108
- Identical: 2
- Different: 108

#### store_reordered (7)

Line 1:
```
- ﻿store(&VERSION) '9.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&TARGETS) 'any'
+ store(&NAME) 'Bwe Karen (SIL)'
```
Line 4:
```
- store(&BITMAP) 'sil_bwe_karen.ico'
+ store(&KEYBOARDVERSION) '1.0.1'
```
Line 5:
```
- store(&ETHNOLOGUECODE) 'bwe'
+ store(&COPYRIGHT) '© SIL International'
```
Line 6:
```
- store(&VISUALKEYBOARD) 'sil_bwe_karen.kvks'
+ store(&VERSION) '10.0'
```
... and 2 more

#### line_removed (5)

Line 2:
```
- store(&NAME) 'Bwe Karen (SIL)'
+ 
```
Line 8:
```
- store(&KEYBOARDVERSION) '1.0.1'
+ 
```
Line 10:
```
- begin Unicode > use(main)
+ 
```
Line 108:
```
- + [K_F] > '́'
+ 
```
Line 109:
```
- + [K_Q] > '̄'
+ 
```

#### line_added (1)

Line 11:
```
- 
+ group(main) using keys
```

#### group_structure (1)

Line 13:
```
- group(main) using keys
+ + [K_BKQUOTE] > '`'
```

#### rule_format (94)

Line 14:
```
- + [K_SPACE] > ' '
+ + [K_1] > '1'
```
Line 15:
```
- + [SHIFT K_SPACE] > ' '
+ + [K_2] > '2'
```
Line 16:
```
- + [SHIFT K_SLASH] > '?'
+ + [K_3] > '3'
```
Line 17:
```
- + [SHIFT K_PERIOD] > '>'
+ + [K_4] > '4'
```
Line 18:
```
- + [SHIFT K_COMMA] > '<'
+ + [K_5] > '5'
```
... and 89 more

### sil_cameroon_azerty

- Original lines: 403
- Roundtrip lines: 316
- Identical: 15
- Different: 388

#### store_reordered (19)

Line 1:
```
- ﻿store(&NAME) 'Cameroon AZERTY'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&BITMAP) 'Cameroon.ico'
+ store(&NAME) 'Cameroon AZERTY'
```
Line 4:
```
- store(&MESSAGE) 'Use ! or AltGr to access special characters.'
+ store(&KEYBOARDVERSION) '6.1.0'
```
Line 5:
```
- store(&LAYOUTFILE) 'sil_cameroon_azerty.keyman-touch-layout'
+ store(&COPYRIGHT) '(c) 2018-2023 SIL Cameroon'
```
Line 6:
```
- store(&KEYBOARDVERSION) '6.1.0'
+ store(&VERSION) '10.0'
```
... and 14 more

#### line_removed (80)

Line 2:
```
- store(&COPYRIGHT) '(c) 2018-2023 SIL Cameroon'
+ 
```
Line 8:
```
- store(&VISUALKEYBOARD) 'sil_cameroon_azerty.kvks'
+ 
```
Line 36:
```
- + [K_SPACE] > U+0020
+ 
```
Line 38:
```
- + [RCTRL K_SPACE] > U+00A0
+ 
```
Line 262:
```
- any(diablock) + [RALT K_PERIOD] > context
+ 
```
... and 75 more

#### comment_removed (4)

Line 12:
```
- c Technically, [K_SLASH] should be in the above list, but I'm choosing not to add it to avoid confusion.  
+ store(uc) "AÆⱭƐBƁCDƊEƏFGʼꞋHIƗJKLMNŊOƆØŒPQRSTUɄVWẄXYƳZ◌"
```
Line 316:
```
- c + [T_UPPER] > layer('default')
+ 
```
Line 318:
```
- c Handle Touch Diacritics (ignoring on non-letters)
+ 
```
Line 402:
```
- c is 0308 the right diaeresis?
+ 
```

#### line_added (54)

Line 13:
```
- 
+ store(composed) "àèìǹòùẁỳÀÈÌǸÒÙẀỲὰᾺáćéǵíḱĺḿńóṕŕśúẃýźÁĆÉǴÍḰĹḾŃÓṔŔŚÚẂÝŹǽάǿǼΆǾâĉêĝĥîĵôŝûŵŷẑÂĈÊĜĤÎĴÔŜÛŴŶẐāēḡīōūȳĀĒḠĪŌŪȲǣᾱǢᾹäëḧïöẗüẍÿÄËḦÏÖÜẌŸạḅḍẹḥịḳḷṃṇọṛṣṭụṿẉỵẓẠḄḌẸḤỊḲḶṂṆỌṚṢṬỤṾẈỴẒçḑȩģḩķļņŗşţÇḐȨĢḨĶĻŅŖŞŢḛḭṵḚḬṴãẽĩñõũṽỹÃẼĨÑÕŨṼỸḉḈậệộẬỆỘẫễỗẪỄỖṻṺḹṝḸṜﬀﬃﬄﬁﬂĲĳǇǈǉǊǋǌﬆﬅ"
```
Line 15:
```
- 
+ store(nfpunct) "'',:;"
```
Line 17:
```
- 
+ store(num) "0123456789"
```
Line 29:
```
- 
+ store(dkt005e) U+005E U+00E2 U+00C2 U+00EA U+00CA U+00EE U+00CE U+00F4 U+00D4 U+00FB U+00DB U+005E
```
Line 33:
```
- 
+ store(dkt0021) U+0021 U+00B2 U+00B9 U+007B U+005B U+005D U+00B1 U+007C U+20D7 U+2018 U+2019 U+0023 U+0308 U+20D6 U+0323 U+00AB U+007D U+00BB U+00D7 U+0190 U+0181 U+00A9 U+018A U+018F U+00C6 U+A78B U+2C6D U+0197 U+2122 U+00A3 U+00B5 U+014A U+0186 U+00D8 U+2013 U+00AE U+201D U+0152 U+0244 U+A78B U+1E84 U+203A U+01B3 U+2020 U+025B U+0253 U+0327 U+0257 U+0259 U+00E6 U+02BC U+03B1 U+0268 U+00F9 U+014B U+0254 U+00F8 U+2014 U+25CC U+201C U+0153 U+0289 U+A78C U+1E85 U+2039 U+01B4 U+2026 U+0040 U+1DC5 U+005E U+1DC4 U+030D U+0304 U+00A4 U+002A U+00B3 U+00AB U+00BB U+0025 U+005C
```
... and 49 more

#### group_structure (2)

Line 14:
```
- begin Unicode > use(main)
+ store(comp-dia) "aeinouwyAEINOUWYαΑacegiklmnoprsuwyzACEGIKLMNOPRSUWYZæαøÆΑØaceghijosuwyzACEGHIJOSUWYZaegiouyAEGIOUYæαÆΑaehiotuxyAEHIOUXYabdehiklmnorstuvwyzABDEHIKLMNORSTUVWYZcdeghklnrstCDEGHKLNRSTeiuEIUaeinouvyAEINOUVYçÇạẹọẠẸỌâêôÂÊÔūŪḷṛḶṚfﬀﬀffIiLLlNNnsf"
```
Line 16:
```
- group(main) using keys
+ store(final) "!?."
```

#### rule_format (221)

Line 30:
```
- platform('touch') any(word) any(final) + [K_SPACE] > index(word,2) index(final,3) " " layer('shift')
+ store(dkf00a8) U+0020 " " U+0061 U+0041 U+0065 U+0045 U+0069 U+0049 U+006F U+004F U+0075 U+0055 U+0079
```
Line 31:
```
- platform('touch') any(word) U+0020 + [K_SPACE] > index(word,2) U+002E " " layer('shift')
+ store(dkt00a8) U+00A8 U+00E4 U+00C4 U+00EB U+00CB U+00EF U+00CF U+00F6 U+00D6 U+00FC U+00DC U+00FF U+008A
```
Line 32:
```
- any(composed) + [K_BKSP] > index(comp-dia,1)
+ store(dkf0021) U+0020 " " U+0024 "&''" U+0028 U+0029 U+002B U+002D U+0030 U+0031 U+0032 U+0035 U+0036 U+0038 U+003A "<" U+003D ">" U+003F U+0041 U+0042 U+0043 U+0044 U+0045 U+0046 U+0047 U+0048 U+0049 U+004A U+004C U+004D U+004E U+004F U+0050 U+0051 U+0052 U+0053 U+0054 U+0055 U+0056 U+0057 U+0058 U+0059 U+005A U+0061 U+0062 U+0063 U+0064 U+0065 U+0066 U+0067 U+0068 U+0069 U+006D U+006E U+006F U+0070 U+0071 U+0072 U+0073 U+0074 U+0075 U+0076 U+0077 U+0078 U+0079 U+007A U+00E0 U+0300 U+0301 U+0302 U+0303 U+0330 U+1DC7 U+1DC6 U+20AC U+0033 U+0034 """ U+005F U+00B0 U+002C
```
Line 35:
```
- + [LCTRL K_SPACE] > U+00A0
+ begin Unicode > use(main)
```
Line 37:
```
- + [SHIFT K_SPACE] > U+0020
+ group(main) using keys
```
... and 216 more

#### key_format (8)

Line 281:
```
- any(diablock) + [K_LBRKT] > context
+ any(diablock) + [SHIFT T_0330] > context
```
Line 282:
```
- any(diablock) + [SHIFT K_LBRKT] > context
+ any(diablock) + [ALTR K_RBRKT] > context
```
Line 288:
```
- any(diablock) + [K_BKSLASH] > context
+ any(diablock) + [SHIFT T_030D] > context
```
Line 289:
```
- any(diablock) + [SHIFT K_BKSLASH] > context
+ any(diablock) + [K_QUOTE] > context
```
Line 295:
```
- any(diablock) + [K_RBRKT] > context
+ any(diablock) + [T_0302] > context
```
... and 3 more

### sil_cameroon_qwerty

- Original lines: 362
- Roundtrip lines: 274
- Identical: 14
- Different: 348

#### store_reordered (17)

Line 1:
```
- ﻿store(&NAME) 'Cameroon QWERTY'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&BITMAP) 'Cameroon.ico'
+ store(&NAME) 'Cameroon QWERTY'
```
Line 4:
```
- store(&MESSAGE) 'Use ; or AltGr to access special characters.'
+ store(&KEYBOARDVERSION) '6.1.0'
```
Line 5:
```
- store(&LAYOUTFILE) 'sil_cameroon_qwerty.keyman-touch-layout'
+ store(&COPYRIGHT) '(c) 2018-2023 SIL Cameroon'
```
Line 6:
```
- store(&KEYBOARDVERSION) '6.1.0'
+ store(&VERSION) '10.0'
```
... and 12 more

#### line_removed (83)

Line 2:
```
- store(&COPYRIGHT) '(c) 2018-2023 SIL Cameroon'
+ 
```
Line 8:
```
- store(&TARGETS) 'any'
+ 
```
Line 24:
```
- store(final) ".!?"
+ 
```
Line 26:
```
- store(diablock) " 0123456789?!;:'-_=<©®>.,[]{}\|/@°#$%^&*()«»‹›‘“’”€¥£…†ʼꞌꞋ" U+0022
+ 
```
Line 224:
```
- + [SHIFT RALT K_Z] > U+2020
+ 
```
... and 78 more

#### line_added (50)

Line 11:
```
- 
+ store(lc) "aæαɛbɓcdɗeəfgʼꞌhiɨjklmnŋoɔøœpqrstuʉvwẅxyƴz◌"
```
Line 13:
```
- 
+ store(composed) "àèìǹòùẁỳÀÈÌǸÒÙẀỲὰᾺáćéǵíḱĺḿńóṕŕśúẃýźÁĆÉǴÍḰĹḾŃÓṔŔŚÚẂÝŹǽάǿǼΆǾâĉêĝĥîĵôŝûŵŷẑÂĈÊĜĤÎĴÔŜÛŴŶẐāēḡīōūȳĀĒḠĪŌŪȲǣᾱǢᾹäëḧïöẗüẍÿÄËḦÏÖÜẌŸạḅḍẹḥịḳḷṃṇọṛṣṭụṿẉỵẓẠḄḌẸḤỊḲḶṂṆỌṚṢṬỤṾẈỴẒçḑȩģḩķļņŗşţÇḐȨĢḨĶĻŅŖŞŢḛḭṵḚḬṴãẽĩñõũṽỹÃẼĨÑÕŨṼỸḉḈậệộẬỆỘẫễỗẪỄỖṻṺḹṝḸṜﬀﬃﬄﬁﬂĲĳǇǈǉǊǋǌﬆﬅ"
```
Line 15:
```
- 
+ store(nfpunct) ",:;"
```
Line 16:
```
- 
+ store(final) ".!?"
```
Line 32:
```
- 
+ + [K_3] > '3'
```
... and 45 more

#### group_structure (2)

Line 12:
```
- begin Unicode > use(main)
+ store(uc) "AÆⱭƐBƁCDƊEƏFGʼꞋHIƗJKLMNŊOƆØŒPQRSTUɄVWẄXYƳZ◌"
```
Line 14:
```
- group(main) using keys
+ store(comp-dia) "aeinouwyAEINOUWYαΑacegiklmnoprsuwyzACEGIKLMNOPRSUWYZæαøÆΑØaceghijosuwyzACEGHIJOSUWYZaegiouyAEGIOUYæαÆΑaehiotuxyAEHIOUXYabdehiklmnorstuvwyzABDEHIKLMNORSTUVWYZcdeghklnrstCDEGHKLNRSTeiuEIUaeinouvyAEINOUVYçÇạẹọẠẸỌâêôÂÊÔūŪḷṛḶṚfﬀﬀffIiLLlNNnsf"
```

#### rule_format (194)

Line 29:
```
- platform('touch') any(word) any(final) + [K_SPACE] > index(word,2) index(final,3) " " layer('shift')
+ + [K_BKQUOTE] > '̍'
```
Line 30:
```
- platform('touch') any(word) U+0020 + [K_SPACE] > index(word,2) U+002E " " layer('shift')
+ + [K_1] > '1'
```
Line 31:
```
- any(composed) + [K_BKSP] > index(comp-dia,1)
+ + [K_2] > '2'
```
Line 34:
```
- + [K_SPACE] > U+0020
+ + [K_5] > '5'
```
Line 35:
```
- + [SHIFT K_SPACE] > U+0020
+ + [K_6] > '6'
```
... and 189 more

#### key_format (1)

Line 245:
```
- any(diablock) + [RALT K_HYPHEN] > context
+ any(diablock) + [T_0304] > context
```

#### comment_removed (1)

Line 305:
```
- c Handle Touch Diacritics (ignoring on non-letters)
+ 
```

### sil_cherokee_nation

- Original lines: 109
- Roundtrip lines: 106
- Identical: 3
- Different: 106

#### comment_removed (1)

Line 1:
```
- ﻿c A Cherokee Unicode keyboard following the official Cherokee Nation layout.
+ c Converted from LDML keyboard: und
```

#### line_removed (7)

Line 2:
```
- store(&VERSION) '9.0'
+ 
```
Line 8:
```
- store(&TARGETS) 'any'
+ 
```
Line 10:
```
- store(&LAYOUTFILE) 'sil_cherokee_nation.keyman-touch-layout'
+ 
```
Line 12:
```
- begin Unicode > use(main)
+ 
```
Line 106:
```
- + [SHIFT K_2] > 'Ꮗ'
+ 
```
... and 2 more

#### store_reordered (5)

Line 4:
```
- store(&COPYRIGHT) '© 2012-2020 SIL International'
+ store(&KEYBOARDVERSION) '1.2.1'
```
Line 5:
```
- store(&ETHNOLOGUECODE) 'chr'
+ store(&COPYRIGHT) '© 2012-2020 SIL International'
```
Line 6:
```
- store(&BITMAP) 'sil_cherokee_nation.ico'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&VISUALKEYBOARD) 'sil_cherokee_nation.kvks'
+ store(&TARGETS) 'any'
```
Line 9:
```
- store(&KEYBOARDVERSION) '1.2.1'
+ begin Unicode > use(main)
```

#### line_added (2)

Line 11:
```
- 
+ group(main) using keys
```
Line 13:
```
- 
+ + [K_1] > 'ᏣᎳᎩ'
```

#### group_structure (1)

Line 14:
```
- group(main) using keys  
+ + [K_2] > 'ᎣᏏᏲ'
```

#### rule_format (90)

Line 15:
```
- + [K_BKQUOTE] > nul
+ + [K_3] > 'ᏩᏙ'
```
Line 16:
```
- + [K_SLASH] > 'Ꮒ'
+ + [K_4] > 'Ꮩ'
```
Line 17:
```
- + [K_PERIOD] > '.'
+ + [K_5] > 'Ꮶ'
```
Line 18:
```
- + [K_COMMA] > ','
+ + [K_6] > 'Ꮬ'
```
Line 19:
```
- + [K_M] > 'Ꮕ'
+ + [K_7] > 'Ꮛ'
```
... and 85 more

### sil_cheyenne

- Original lines: 82
- Roundtrip lines: 59
- Identical: 7
- Different: 75

#### comment_removed (13)

Line 1:
```
- c Based on keyboard by Wayne Leman/Cheyenne
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c based on Chey 1 SIL* True Type font
+ 
```
Line 3:
```
- c modified 2014/04/17
+ store(&NAME) 'Cheyenne'
```
Line 60:
```
- c '~' + 'A' > U+00C4 c LATIN CAPITAL LETTER A WITH DIAERESIS
+ 
```
Line 61:
```
- c '~' + 'E' > U+00CB c LATIN CAPITAL LETTER E WITH DIAERESIS
+ 
```
... and 8 more

#### line_added (6)

Line 4:
```
- 
+ store(&KEYBOARDVERSION) '1.1.1'
```
Line 24:
```
- 
+ '^Ē' > 'Ė'
```
Line 29:
```
-  
+ '`Ā' > 'À'
```
Line 36:
```
- 
+ '`í' > 'ì'
```
Line 37:
```
- 
+ '`ō' > 'ò'
```
... and 1 more

#### store_reordered (10)

Line 5:
```
- store(&version) '9.0'
+ store(&COPYRIGHT) '(c) 2014-2020 SIL International'
```
Line 6:
```
- store(&NAME) 'Cheyenne'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&BITMAP) 'sil_cheyenne.ico'
+ store(&TARGETS) 'any'
```
Line 9:
```
- store(&ETHNOLOGUECODE) 'chy'
+ store(lc_alph) "abcdefghijklmnopqrstuvwxyz"
```
Line 10:
```
- store(&COPYRIGHT) '(c) 2014-2020 SIL International'
+ store(uc_alph) "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
```
... and 5 more

#### line_removed (14)

Line 8:
```
- store(&TARGETS) 'any'
+ 
```
Line 13:
```
- store(&LAYOUTFILE) 'sil_cheyenne.keyman-touch-layout'
+ 
```
Line 18:
```
- store(lc_alph) "abcdefghijklmnopqrstuvwxyz"
+ 
```
Line 20:
```
- store(digits) "01234567890"
+ 
```
Line 66:
```
- '~' + 'A' > U+0100 c LATIN CAPITAL LETTER A WITH MACRON
+ 
```
... and 9 more

#### group_structure (2)

Line 16:
```
- begin UNICODE > use(Main)     
+ group(main) using keys
```
Line 23:
```
- group(Main) using keys
+ '^Ā' > 'Ȧ'
```

#### rule_format (30)

Line 25:
```
-  + any(lc_alph) > index(lc_alph,1)
+ '^Ō' > 'Ȯ'
```
Line 26:
```
-  + any(uc_alph) > index(uc_alph,1)
+ '^ā' > 'ȧ'
```
Line 27:
```
-  + any(digits) > index(digits,1)
+ '^ē' > 'ė'
```
Line 28:
```
-  + any(punct) > index(punct,1)
+ '^ō' > 'ȯ'
```
Line 30:
```
- '^' + 'A' > U+0226 c LATIN CAPITAL LETTER A WITH DOT ABOVE
+ '`Ē' > 'È'
```
... and 25 more

### sil_cipher_music

- Original lines: 231
- Roundtrip lines: 189
- Identical: 4
- Different: 227

#### comment_removed (23)

Line 1:
```
- ﻿c sil_cipher_music generated from template at 2019-05-22 15:40:22
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c with name "Cipher Music (SIL)"
+ 
```
Line 13:
```
- c below
+ store(DblkeyUUnder) U+0323 U+0332 U+0333 U+2198 U+D834 "�" U+20E5
```
Line 17:
```
- c above
+ 
```
Line 25:
```
- c Dot above
+ + [K_5] > '5'
```
... and 18 more

#### store_reordered (9)

Line 3:
```
- store(&VERSION) '10.0'
+ store(&NAME) 'Cipher Music (SIL)'
```
Line 4:
```
- store(&NAME) 'Cipher Music (SIL)'
+ store(&KEYBOARDVERSION) '1.1.2'
```
Line 6:
```
- store(&KEYBOARDVERSION) '1.1.2'
+ store(&VERSION) '10.0'
```
Line 9:
```
- store(&BITMAP) 'sil_cipher_music.ico'
+ store(backslashkey) "._=/\\{}>|][''*"
```
Line 14:
```
- store(backslashkey)       "."    "_"    "="    "/"    "\"    "{"     "}"     ">"    "|"     "]"     "["     "'"      "*"
+ store(digit) "0123456789"
```
... and 4 more

#### store_format (1)

Line 7:
```
- store(&TARGETS) 'web desktop'
+ store(&TARGETS) 'any'
```

#### line_removed (46)

Line 8:
```
- store(&VISUALKEYBOARD) 'sil_cipher_music.kvks'
+ 
```
Line 15:
```
- store(backslashkeyUOver)  U+0307 U+0305 U+033F U+0338 U+005C U+1D177 U+1D178 U+2197 U+1D100 U+1D102 U+1D103 U+1D112 U+0352 
+ 
```
Line 19:
```
- store(DblkeyUOver)  U+0307 U+0305 U+033F U+2197 U+1D100 U+0338
+ 
```
Line 129:
```
- + [RALT K_COMMA]  > U+0307 c overdot
+ 
```
Line 131:
```
- + [RALT K_2] > U+1D101
+ 
```
... and 41 more

#### line_added (23)

Line 10:
```
- 
+ store(backslashkeyUOver) U+0307 U+0305 U+033F U+0338 U+005C U+D834 "��" U+DD78 U+2197 U+D834 "��" U+DD02 U+D834 U+DD03 U+D834 U+DD12 U+0352
```
Line 12:
```
- 
+ store(DblkeyUOver) U+0307 U+0305 U+033F U+2197 U+D834 "�" U+0338
```
Line 16:
```
- 
+ begin Unicode > use(main)
```
Line 22:
```
- 
+ + [K_2] > '2'
```
Line 24:
```
- 
+ + [K_4] > '4'
```
... and 18 more

#### group_structure (2)

Line 11:
```
- begin Unicode > use(main)
+ store(DblKey) "._=>|/"
```
Line 23:
```
- group(main) using keys
+ + [K_3] > '3'
```

#### rule_format (123)

Line 26:
```
- "1" + "1" > U+0031 U+0307
+ + [K_6] > '6'
```
Line 27:
```
- "2" + "2" > U+0032 U+0307
+ + [K_7] > '7'
```
Line 28:
```
- "3" + "3" > U+0033 U+0307
+ + [K_8] > '8'
```
Line 29:
```
- "4" + "4" > U+0034 U+0307
+ + [K_9] > '9'
```
Line 30:
```
- "5" + "5" > U+0035 U+0307
+ + [K_0] > '0'
```
... and 118 more

### sil_devanagari_phonetic

- Original lines: 216
- Roundtrip lines: 85
- Identical: 30
- Different: 186

#### comment_removed (26)

Line 1:
```
- ﻿c    Devanagri Keyman file (Romanized Layout)
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c    version 2,  28 November 95
+ 
```
Line 3:
```
- c    version 5,  15-May 02 (converted from Annapurna to Unicode Devanagri)
+ store(&NAME) 'Devanagari Phonetic (SIL)'
```
Line 11:
```
- c see http://www.unicode.org/charts/PDF/U0900.pdf for the unicode values.
+ store(Consonants) "kKgGM"
```
Line 12:
```
- c ********************************************************************
+ store(ConsonantsU) U+0915 U+0916 U+0917 U+0918 U+0919
```
... and 21 more

#### line_added (11)

Line 4:
```
- 
+ store(&KEYBOARDVERSION) '1.4'
```
Line 9:
```
- 
+ store(Digits) "0123456"
```
Line 10:
```
- 
+ store(DigitsU) U+0966 U+0967 U+0968 U+0969 U+096A U+096B U+096C
```
Line 20:
```
- 
+ group(main) using keys
```
Line 26:
```
- 
+ + [RALT K_0] > '॰'
```
... and 6 more

#### store_reordered (13)

Line 5:
```
- store(&VERSION) "10.0"  	
+ store(&COPYRIGHT) '2002-2020 SIL International'
```
Line 6:
```
- store(&NAME) "Devanagari Phonetic (SIL)"
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&BITMAP) 'sil_devanagari_phonetic.ico'
+ store(&TARGETS) 'any'
```
Line 13:
```
- store(&VISUALKEYBOARD) 'sil_devanagari_phonetic.kvks'
+ store(MatraVsU) U+093E U+093F U+0940 U+0941 U+0942 U+0947 U+0948 U+094B U+094C
```
Line 14:
```
- store(&KEYBOARDVERSION) '1.4'
+ store(RomanCs) "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
```
... and 8 more

#### line_removed (92)

Line 8:
```
- store(&COPYRIGHT) '2002-2020 SIL International'
+ 
```
Line 45:
```
- store(RomanCs)       "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" \
+ 
```
Line 49:
```
- store(LowDotWallahs)    U+0915  U+0916  U+0917  U+091c  U+0921  U+0922  U+092b  U+092f  U+0933  U+0930 U+0928
+ 
```
Line 85:
```
- + "O"    > U+094c c aukar
+ 
```
Line 86:
```
- + "p"    > U+092a c pa
+ 
```
... and 87 more

#### group_structure (2)

Line 18:
```
- begin UNICODE > use(mainU)
+ begin Unicode > use(main)
```
Line 54:
```
- group(mainU) using keys 	c This is where you define the basic keyboard layout
+ dk(1)आ > 'अ'
```

#### unknown (13)

Line 23:
```
-                   "7"    "8"    "9"
+ + [RALT K_2] > 'ज्ञ'
```
Line 25:
```
-                   U+096D U+096E U+096F
+ + [RALT K_5] > 'ऑ'
```
Line 29:
```
-                      "c"    "C"    "j"    "J"    "V"    "q"     \
+ + [RALT K_J] > 'ज्ञ'
```
Line 30:
```
-                      "Q"    "z"    "Z"    "N"    "t"    "T"     "d"    "D"    "n"    \
+ + [RALT K_K] > 'ॽ'
```
Line 31:
```
-                      "p"    "P"    "b"    "B"    "m"    "y"     \
+ + [RALT K_L] > 'ृ'
```
... and 8 more

#### rule_format (29)

Line 56:
```
- + "a" 	 > U+093E c aakar (matra)
+ dk(1)आ > 'आ'
```
Line 57:
```
- + "A" 	 > U+093E c aakar (matra)
+ dk(1)ए > 'ए'
```
Line 58:
```
- + "b" 	 > U+092c c ba
+ dk(1)ऐ > 'ऐ'
```
Line 59:
```
- + "B" 	 > U+092d c bHa
+ dk(1)ृ > 'इ'
```
Line 60:
```
- + "c" 	 > U+091a c ca
+ dk(1)ई > 'ई'
```
... and 24 more

### sil_devanagari_romanized

- Original lines: 295
- Roundtrip lines: 151
- Identical: 31
- Different: 264

#### store_reordered (15)

Line 1:
```
- ﻿store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '© SIL International'
+ store(&NAME) 'Devanagari Romanized (SIL)'
```
Line 5:
```
- store(&TARGETS) 'any'
+ store(&COPYRIGHT) '© SIL International'
```
Line 6:
```
- store(&VISUALKEYBOARD) 'sil_devanagari_romanized.kvks'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&LAYOUTFILE) 'sil_devanagari_romanized.keyman-touch-layout'
+ store(&TARGETS) 'any'
```
... and 10 more

#### line_removed (104)

Line 2:
```
- store(&NAME) 'Devanagari Romanized (SIL)'
+ 
```
Line 8:
```
- store(&BITMAP) 'sil_devanagari_romanized.ico'
+ 
```
Line 19:
```
-                      "c"    "C"    "j"    "J"    "V"    "q"     \
+ 
```
Line 21:
```
-                      "p"    "P"    "b"    "B"    "m"    "y"     \
+ 
```
Line 23:
```
-                      "+"    "="
+ 
```
... and 99 more

#### line_added (20)

Line 9:
```
- 
+ store(Digits) "0123456"
```
Line 16:
```
- 
+ store(RomanCs) "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
```
Line 24:
```
- 
+ + [RALT K_1] > '1'
```
Line 31:
```
- 
+ + [RALT K_8] > '8'
```
Line 34:
```
- 
+ + [RALT K_Q] > 'ॽ'
```
... and 15 more

#### group_structure (2)

Line 10:
```
- begin Unicode > use(main)
+ store(DigitsU) U+0966 U+0967 U+0968 U+0969 U+096A U+096B U+096C
```
Line 46:
```
- group(main) using keys
+ + [RALT K_J] > 'ॼ'
```

#### comment_removed (33)

Line 11:
```
- c numbers
+ store(Consonants) "kKgGM"
```
Line 17:
```
- c consonants (so we can reposition the reph)
+ store(LowDotWallahs) U+0915 U+0916 U+0917 U+091C U+0921 U+0922 U+092B U+092F U+0933 U+0930 U+0928
```
Line 32:
```
- c                    aakar  ikar   iikar  ukar   uukar  ekar   aikar  okar   aukar
+ + [RALT K_9] > '9'
```
Line 35:
```
- c                           a   aa  e   ai  i   ii  o   au  u   uu
+ + [RALT K_W] > 'ॅ'
```
Line 37:
```
- c                           candra a o e
+ + [RALT K_R] > 'र्'
```
... and 28 more

#### unknown (10)

Line 13:
```
-                   "7"    "8"    "9"
+ store(MatraVsU) U+093E U+093F U+0940 U+0941 U+0942 U+0947 U+0948 U+094B U+094C
```
Line 15:
```
-                   U+096D U+096E U+096F
+ store(candraU) U+0972 U+0911 U+090D
```
Line 20:
```
-                      "Q"    "z"    "Z"    "N"    "t"    "T"     "d"    "D"    "n"    \
+ begin Unicode > use(main)
```
Line 22:
```
-                      "r"    "l"    "L"    "v"     "x"    "S"    "s"    "h" \
+ group(main) using keys
```
Line 26:
```
-                      U+091A U+091B U+091C U+091D U+091E U+091F  \
+ + [RALT K_3] > '3'
```
... and 5 more

#### rule_format (80)

Line 51:
```
- + "q"    > dk(1) c // followed by vowel will produce syllabic form
+ + [RALT K_Z] > 'ृ'
```
Line 53:
```
- + [RALT SHIFT K_A]  > U+0904  c // short a ऄ / used for short e in Awadhi /also used in Devanagari transliterations of some South Indian and Kashmiri languages by a publisher in Lucknow
+ + [RALT K_B] > 'ॿ'
```
Line 54:
```
- + [LCTRL LALT SHIFT K_A]  > U+0904  c // short a ऄ / used for short e in Awadhi /also used in Devanagari transliterations of some South Indian and Kashmiri languages by a publisher in Lucknow
+ + [RALT K_N] > 'ञ'
```
Line 55:
```
- + "A"     > U+0905 c // Devanagari Letter- A अ
+ + [RALT K_PERIOD] > '.'
```
Line 56:
```
- dk(1) + "a"     > U+0906 c // Devanagari Letter- Aa आ
+ + [RALT K_SLASH] > '‌'
```
... and 75 more

### sil_devanagari_typewriter

- Original lines: 304
- Roundtrip lines: 175
- Identical: 19
- Different: 285

#### store_reordered (14)

Line 1:
```
- ﻿store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '© SIL International'
+ store(&NAME) 'Devanagari Typewriter (SIL)'
```
Line 5:
```
- store(&TARGETS) 'any'
+ store(&COPYRIGHT) '© SIL International'
```
Line 6:
```
- store(&VISUALKEYBOARD) 'sil_devanagari_typewriter.kvks'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&LAYOUTFILE) 'sil_devanagari_typewriter.keyman-touch-layout'
+ store(&TARGETS) 'any'
```
... and 9 more

#### line_removed (111)

Line 2:
```
- store(&NAME) 'Devanagari Typewriter (SIL)'
+ 
```
Line 8:
```
- store(&BITMAP) 'sil_devanagari_typewriter.ico'
+ 
```
Line 19:
```
- store(Consonants)    "s"    "v"    "u"    "#"        \
+ 
```
Line 21:
```
-                      "&"    "*"    "("    "t"    "y"     "b"    "w"    "g"    \
+ 
```
Line 23:
```
-                      "["    "n"    "j"     ";"    "i"    "z"    "x" \
+ 
```
... and 106 more

#### line_added (25)

Line 9:
```
- 
+ store(Digits) "0123456"
```
Line 11:
```
- 
+ store(Consonants) "svu#"
```
Line 17:
```
- 
+ store(LowDotWallahs) U+0915 U+0916 U+0917 U+091C U+0921 U+0922 U+092B U+092F U+0933 U+0930 U+0928
```
Line 24:
```
-                      
+ + [K_BKQUOTE] > 'े'
```
Line 25:
```
- 
+ + [K_HYPHEN] > '़'
```
... and 20 more

#### group_structure (2)

Line 10:
```
- begin Unicode > use(main)
+ store(DigitsU) U+0966 U+0967 U+0968 U+0969 U+096A U+096B U+096C
```
Line 47:
```
- group(main) using keys
+ + [RALT K_Q] > 'ॉ'
```

#### comment_removed (30)

Line 12:
```
- c numbers
+ store(ConsonantsU) U+0915 U+0916 U+0917 U+0918
```
Line 18:
```
- c consonants (so we can reposition the reph)
+ store(LowDotOutputs) U+0958 U+0959 U+095A U+095B U+095C U+095D U+095E U+095F U+0934 U+0931 U+0929
```
Line 33:
```
- c                    aakar  ikar   iikar  ukar   uukar  ekar   aikar  okar   aukar   glottal
+ + [K_PERIOD] > '।'
```
Line 36:
```
- c                           a   aa  e   ai  i   ii  o   au  u   uu
+ + [RALT K_1] > '!'
```
Line 38:
```
- c                           candra a o e
+ + [RALT K_3] > 'घ्‍'
```
... and 25 more

#### unknown (9)

Line 14:
```
-                   "7"    "8"    "9"
+ store(MaatraU) U+0906 U+0905 U+090F U+0910 U+0907 U+0908 U+0913 U+0914 U+0909 U+090A
```
Line 16:
```
-                   U+096D U+096E U+096F
+ store(RomanCs) "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
```
Line 20:
```
-                      "r"    "%"    "h"    "^"        \
+ begin Unicode > use(main)
```
Line 22:
```
-                      "k"    "m"    "a"    "e"    "d"    "o"     \
+ group(main) using keys
```
Line 27:
```
-                      U+091A U+091B U+091C U+091F  \
+ + [K_LBRKT] > 'र'
```
... and 4 more

#### rule_format (94)

Line 51:
```
- + "c" 	        > U+0905 c // Devanagari Letter- A अ
+ + [RALT K_T] > 'क्त'
```
Line 52:
```
- + [RALT K_V]    > U+0906 c // Devanagari Letter- Aa आ
+ + [RALT K_Y] > '-'
```
Line 53:
```
- + "O"           > U+0907 c // Devanagari Letter- I इ
+ + [RALT K_U] > 'ॐ'
```
Line 54:
```
- + [RALT K_L]    > U+0908 c // Devanagari Letter- Ii II ई
+ + [RALT K_I] > '·'
```
Line 55:
```
- + "p"           > U+0909 c // Devanagari Letter- U उ 
+ + [RALT K_O] > 'य्‍'
```
... and 89 more

### sil_dzongkha

- Original lines: 82
- Roundtrip lines: 61
- Identical: 7
- Different: 75

#### store_reordered (43)

Line 1:
```
- ﻿store(&VERSION) "10.0"
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&BITMAP) 'sil_dzongkha.ico'
+ store(&NAME) 'Dzongkha (SIL)'
```
Line 4:
```
- store(&CAPSALWAYSOFF) "1"
+ store(&KEYBOARDVERSION) '1.1.1'
```
Line 9:
```
- store(&VISUALKEYBOARD) 'sil_dzongkha.kvks'
+ store(row1) "`1234567890-="
```
Line 10:
```
- store(&TARGETS) 'web desktop'
+ store(out1) U+0F09 U+0F21 U+0F22 U+0F23 U+0F24 U+0F25 U+0F26 U+0F27 U+0F28 U+0F29 U+0F20 U+0F14 U+0F0D
```
... and 38 more

#### line_removed (16)

Line 2:
```
- store(&NAME) 'Dzongkha (SIL)'
+ 
```
Line 55:
```
- store(out2sa) U+0f8d U+0f8e U+0f8f U+0f82 nul    nul    U+0f17 U+0f18 U+0f19 U+0f3f U+0f3e U+0fba
+ 
```
Line 57:
```
- store(out3sa) U+0f9a U+0f9b U+0f9c U+0f9e nul    nul    U+0f35 U+0f86 U+0f87 U+003a U+0022 c DevCommission chart gives this order on key caps, but swaps U+0f86 with U+0f87 in text description. I'm assuming visual is more likely to be correct than text string.
+ 
```
Line 59:
```
- store(out4sa) U+0f36 U+0fbf U+0fb0 U+0fbb U+0fbc nul    U+0fb5 U+0fd9 U+0fda U+003f
+ 
```
Line 61:
```
- store(out5sa) U+00a0
+ 
```
... and 11 more

#### comment_removed (9)

Line 5:
```
- c store(&ETHNOLOGUECODE) 'dzo'
+ store(&COPYRIGHT) '© SIl International'
```
Line 6:
```
- c store(&WINDOWSLANGUAGES) 'x0451'
+ store(&VERSION) '10.0'
```
Line 7:
```
- c store(&LANGUAGE) 'x0451'
+ store(&TARGETS) 'any'
```
Line 17:
```
- c ==Primary Output==
+ store(row5) ' '
```
Line 18:
```
- c 1-to-1 rules  (s = Shift, a = AltGr)
+ store(out5) '་'
```
... and 4 more

#### line_added (5)

Line 13:
```
- 
+ store(row3) "asdfghjkl;''"
```
Line 15:
```
- 
+ store(row4) "zxcvbnm,./"
```
Line 29:
```
- 
+ store(row1a) "[RALT  K_BKQUOTE]  [RALT  K_1]  [RALT  K_2]  [RALT  K_3]  [RALT  K_4]  [RALT  K_5]  [RALT  K_6]  [RALT  K_7]  [RALT  K_8]  [RALT  K_9]  [RALT  K_0]  [RALT  K_HYPHEN]  [RALT  K_EQUAL]"
```
Line 40:
```
- 
+ store(out1sa) U+0FD0 U+0FD3 U+0FD4 U+0F3A U+0F3B U+0F85 U+0F01 U+0F8A U+002A U+FFFF U+FFFF U+0FD2 U+002B
```
Line 51:
```
- 
+ store(key-altgr) "outs(row1sa)  outs(row2sa)  outs(row3sa)  outs(row4sa)  outs(row5sa)  outs(row1a)  outs(row2a)  outs(row3a)  outs(row4a)  outs(row5a)"
```

#### group_structure (2)

Line 14:
```
- begin Unicode > use(main)
+ store(out3) U+0F4F U+0F50 U+0F51 U+0F53 U+0F54 U+0F55 U+0F56 U+0F58 U+0F59 U+0F5A U+0F5B
```
Line 16:
```
- group(main) using keys
+ store(out4) U+0F5E U+0F5F U+0F60 U+0F61 U+0F62 U+0F63 U+0F64 U+0F66 U+0F67 U+0F68
```

### sil_eastern_congo

- Original lines: 344
- Roundtrip lines: 185
- Identical: 18
- Different: 326

#### unknown (30)

Line 1:
```
- ﻿c 
+ c Converted from LDML keyboard: und
```
Line 3:
```
- c 
+ store(&NAME) 'Eastern Congo'
```
Line 21:
```
-                         U+004E U+004F U+0052 U+0053 \
+ store(caron_nfc) U+01CE U+01CD U+011B U+011A U+01D0 U+01CF U+01D2 U+01D1 U+01D4 U+01D3
```
Line 22:
```
-                         U+0055 U+005A \
+ store(diaer_nfc) U+00E4 U+00C4 U+00EB U+00CB U+00EF U+00CF U+00F6 U+00D6 U+00FC U+00DC
```
Line 23:
```
-                         U+0061 U+0064 U+0065 U+0069 U+006D \
+ store(macron_nfc) U+0101 U+0100 U+0113 U+0112 U+012B U+012A U+014D U+014C U+016B U+016A
```
... and 25 more

#### comment_removed (89)

Line 2:
```
- c Eastern Congo keyboard layout
+ 
```
Line 17:
```
- c store(accent) U+02C6 U+02C7 U+02C9 U+0300 U+0301
+ store(basic) "aAeEiIoOuU"
```
Line 19:
```
- c Standard characters that can take all diacritics ADEIMNORSUZ
+ store(acute_nfc) U+00E1 U+00C1 U+00E9 U+00C9 U+00ED U+00CD U+00F3 U+00D3 U+00FA U+00DA
```
Line 27:
```
- c All characters on standard keyboard
+ 
```
Line 39:
```
- c Characters made with semi-colon
+ (any(basic)) > index(diaer_nfc,1)
```
... and 84 more

#### line_added (22)

Line 4:
```
- 
+ store(&KEYBOARDVERSION) '1.5.3'
```
Line 14:
```
- 
+ store(dia_chars_K) "ACEI"
```
Line 16:
```
- 
+ store(spc) ';'
```
Line 18:
```
- 
+ store(grave_nfc) U+00E0 U+00C0 U+00E8 U+00C8 U+00EC U+00CC U+00F2 U+00D2 U+00F9 U+00D9
```
Line 26:
```
- 
+ begin Unicode > use(main)
```
... and 17 more

#### store_reordered (15)

Line 5:
```
- store(&version) "10.0"
+ store(&COPYRIGHT) '© 2005-2021 SIL - Eastern Congo Group'
```
Line 6:
```
- store(&name) "Eastern Congo"
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&BITMAP) 'sil_eastern_congo.ico'
+ store(&TARGETS) 'any'
```
Line 9:
```
- store(&MESSAGE) 'Eastern Congo keyboard for languages of the Democratic Republic of the Congo.'
+ store(basic_diacritics) U+0041 U+0044 U+0045 U+0049 U+004D
```
Line 10:
```
- store(&TARGETS) 'any'
+ store(all_basic_chars) "ABCDEFGHIJKL"
```
... and 10 more

#### line_removed (104)

Line 8:
```
- store(&copyright) "© 2005-2021 SIL - Eastern Congo Group"
+ 
```
Line 25:
```
-                         U+0075 U+007A
+ 
```
Line 29:
```
-                        "M"    "N"    "O"    "P"    "Q"    "R"    "S"    "T"    "U"    "V"    "W" "X" \
+ 
```
Line 30:
```
-                        "Y"    "Z"    \
+ 
```
Line 32:
```
-                        "m"    "n"    "o"    "p"    "q"    "r"    "s"    "t"    "u"    "v"    "w" "x" \
+ 
```
... and 99 more

#### group_structure (2)

Line 15:
```
- begin Unicode > use(main)
+ store(dia_chars_U) U+00C4 U+00C7 U+0190 U+0197
```
Line 89:
```
- group(main) using keys
+ 'Ü' > 'Ǖ'
```

#### rule_format (64)

Line 35:
```
-                        ")"    "_"    "+"    "{"    "}"    "|"    ":"    '"'    "<"    ">"    "?" \
+ (any(basic)) > index(grave_nfc,1)
```
Line 92:
```
- + any(all_basic_chars) > index(all_basic_chars,1)
+ 'ū' > 'ṻ'
```
Line 93:
```
- + any(all_misc_chars)  > index(all_misc_chars,1)
+ 'Ū' > 'Ṻ'
```
Line 96:
```
- any(spc) + any(semi_chars_K)    > index(semi_chars_U,2)         c all special characters
+ 'm' > 'ḿ'
```
Line 99:
```
- "^" + any(basic_diacritics) > index(basic_diacritics,2) U+0302 use(nfc)       c circumflex
+ 'N' > 'Ń'
```
... and 59 more

### sil_el_ethiopian_latin

- Original lines: 454
- Roundtrip lines: 286
- Identical: 50
- Different: 404

#### store_reordered (10)

Line 1:
```
- ﻿store(&VERSION) '9.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&TARGETS) 'web desktop'
+ store(&NAME) 'SIL EL - Ethiopian Latin'
```
Line 5:
```
- store(&BITMAP) 'sil_el_ethiopian_latin.ico'
+ store(&COPYRIGHT) '© SIL Ethiopia'
```
Line 6:
```
- store(&COPYRIGHT) '© SIL Ethiopia'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&MESSAGE) 'The SIL EL - Ethiopian Latin keyboard enables typing in many Ethiopian Latin based languages.'
+ store(&TARGETS) 'any'
```
... and 5 more

#### line_removed (104)

Line 2:
```
- store(&NAME) 'SIL EL - Ethiopian Latin'
+ 
```
Line 17:
```
- store(plainvowels)      "aeiouAEIOU"
+ 
```
Line 19:
```
- store(acutevowels)       U+00E1 U+00E9 U+00ED U+00F3 U+00FA U+00C1 U+00C9 U+00CD U+00D3 U+00DA
+ 
```
Line 21:
```
- store(gravevowels)       U+00E0 U+00E8 U+00EC U+00F2 U+00F9 U+00C0 U+00C8 U+00CC U+00D2 U+00D9
+ 
```
Line 288:
```
- "n"    + "5" > U+00F1 c ñ
+ 
```
... and 99 more

#### comment_removed (50)

Line 8:
```
- c store(&LAYOUT) 'default'
+ 
```
Line 14:
```
- c ------------------------------------------------------------------------------
+ store(doublegravevowels) U+0201 U+0205 U+0209 U+020D U+0215 U+0200 U+0204 U+0208 U+020C U+0214
```
Line 15:
```
- c arrays
+ store(macronvowels) U+0101 U+0113 U+012B U+014D U+016B U+0100 U+0112 U+012A U+014C U+016A
```
Line 16:
```
- c ------------------------------------------------------------------------------
+ store(diaeresisvowels) U+00E4 U+00EB U+00EF U+00F6 U+00FC U+00C4 U+00CB U+00CF U+00D6 U+00DC
```
Line 27:
```
- c store(tildevowels)     U+00E3 U+1EBD U+0129 U+00F5 U+0169 U+00C3 U+1EBC U+0128 U+00D5 U+0168
+ (any(plainvowels))Ʋ́ > index(acutevowels,1)
```
... and 45 more

#### line_added (74)

Line 9:
```
- 
+ store(plainvowels) "aeiouAEIOU"
```
Line 11:
```
- 
+ store(gravevowels) U+00E0 U+00E8 U+00EC U+00F2 U+00F9 U+00C0 U+00C8 U+00CC U+00D2 U+00D9
```
Line 13:
```
- 
+ store(caronvowels) U+01CE U+011B U+01D0 U+01D2 U+01D4 U+01CD U+011A U+01CF U+01D1 U+01D3
```
Line 18:
```
- 
+ begin Unicode > use(main)
```
Line 20:
```
- 
+ group(main) using keys
```
... and 69 more

#### group_structure (2)

Line 10:
```
- begin Unicode > use(main)
+ store(acutevowels) U+00E1 U+00E9 U+00ED U+00F3 U+00FA U+00C1 U+00C9 U+00CD U+00D3 U+00DA
```
Line 12:
```
- group(main) using keys
+ store(circumflexvowels) U+00E2 U+00EA U+00EE U+00F4 U+00FB U+00C2 U+00CA U+00CE U+00D4 U+00DB
```

#### rule_format (164)

Line 38:
```
-        + "'"    > U+2018 c ‘
+ '”«' > '"'
```
Line 39:
```
- U+2018 + "'"    > U+2019 c ’
+ '"«' > '“'
```
Line 40:
```
- U+2019 + "'"    > U+0027 c '
+ '<ꞌ' > '‹'
```
Line 41:
```
- U+0027 + "'"    > U+2018 c ‘ (rota)
+ '<«' > '«'
```
Line 43:
```
-        + '"' > U+201C c “
+ ';ʕ' > 'ʕ'
```
... and 159 more

### sil_ethiopic

- Original lines: 320
- Roundtrip lines: 88
- Identical: 46
- Different: 274

#### store_reordered (5)

Line 1:
```
- ﻿store(&VERSION) '9.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&TARGETS) 'web desktop'
+ store(&NAME) 'SIL Ethiopic'
```
Line 5:
```
- store(&BITMAP) 'sil_ethiopic.ico'
+ store(&COPYRIGHT) '© SIL Ethiopia'
```
Line 6:
```
- store(&COPYRIGHT) '© SIL Ethiopia'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&MESSAGE) 'The SIL Ethiopic Unicode keyboard enables typing in all Ethiopic Saba Fidel scripts.'
+ store(&TARGETS) 'any'
```

#### line_removed (141)

Line 2:
```
- store(&NAME) 'SIL Ethiopic'
+ 
```
Line 20:
```
-                   "Y"     "f"     "p"                                             \
+ 
```
Line 22:
```
- store (keyU)      U+1205  U+120d  U+1215  U+121d  U+1225  U+122d  U+1235  U+123d  \
+ 
```
Line 24:
```
-                   U+1285          U+1295  U+129d  U+12a5  U+12ad          U+12bd  \
+ 
```
Line 25:
```
-                           U+12cd  U+12d5  U+12dd  U+12e5  U+12ed  U+12f5  U+12fd  \
+ 
```
... and 136 more

#### comment_removed (68)

Line 8:
```
- c store(&LANGUAGE) 'x045E'
+ 
```
Line 9:
```
- c store(&WINDOWSLANGUAGES) 'x045E'
+ store(seventh) U+1206 U+120E U+1216 U+121E U+1226 U+122E U+1236 U+123E
```
Line 10:
```
- c store(&LAYOUT) 'default'
+ store(eighth) U+1207 U+2D80 U+1210 U+2D81 U+1220 U+2D82 U+2D83 U+2D84
```
Line 12:
```
- c *********************************************************************************
+ store(DGbase) U+121D U+122D U+1245 U+1255 U+1265 U+1285 U+12AD U+12BD U+130D U+131D U+134D U+1355
```
Line 14:
```
- c ---------------------------------------------------------------------------------
+ store(DGthird) U+1381 U+122F U+124A U+125A U+1385 U+128A U+12B2 U+12C2 U+1312 U+2D94 U+1389 U+138D
```
... and 63 more

#### line_added (8)

Line 11:
```
- 
+ store(diph) U+1200 U+120F U+1217 U+121F U+1227 U+122F U+1237 U+123F
```
Line 13:
```
- 
+ store(DGsecond) U+1383 U+122F U+124D U+125D U+1387 U+128D U+12B5 U+12C5 U+1315 U+2D96 U+138B U+138F
```
Line 21:
```
- 
+ begin Unicode > use(main)
```
Line 28:
```
- 
+ group(transforms)
```
Line 40:
```
- 
+ 'ሽⷝ' > 'ⶥ'
```
... and 3 more

#### unknown (52)

Line 15:
```
- store (key)       "h"     "l"     "H"     "m"     "J"     "r"     "s"     "S"     \
+ store(DGfifth) U+1382 U+122F U+124C U+125C U+1386 U+128C U+12B4 U+12C4 U+1314 U+2D95 U+138A U+138E
```
Line 16:
```
-                   "q"             "Q"             "b"     "B"     "t"     "c"     \
+ store(DGseventh) U+1380 U+122F U+1248 U+1258 U+1384 U+1288 U+12B0 U+12C0 U+1310 U+2D93 U+1388 U+138C
```
Line 17:
```
-                   "L"             "n"     "N"     "x"     "k"             "K"     \
+ store(DGspecial) U+1359 U+1358 U+124B U+125B U+1267 U+128B U+12B3 U+12C3 U+1313 U+131F U+135A U+1357
```
Line 18:
```
-                           "w"     "X"     "z"     "Z"     "y"     "d"     "D"     \
+ store(diacKey) "1234567890''":"
```
Line 19:
```
-                   "j"     "g"             "G"     "T"     "C"     "P"     "F"     \
+ store(diacU) U+030F U+0300 U+0304 U+0301 U+030B U+0302 U+030C U+0307 U+0308 U+0303 U+135F U+135D U+135E
```
... and 47 more

### sil_ethiopic_power_g

- Original lines: 323
- Roundtrip lines: 90
- Identical: 45
- Different: 278

#### store_reordered (5)

Line 1:
```
- ﻿store(&VERSION) '9.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&TARGETS) 'web desktop'
+ store(&NAME) 'SIL Ethiopic Power-G'
```
Line 5:
```
- store(&BITMAP) 'sil_ethiopic_power_g.ico'
+ store(&COPYRIGHT) '© 2017-2020 SIL Ethiopia'
```
Line 6:
```
- store(&COPYRIGHT) '© 2017-2020 SIL Ethiopia'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&MESSAGE) 'The SIL Ethiopic Power-G keyboard enables typing in all Ethiopic Saba Fidel scripts using the keyboarding sequences found in the Power Geez (Phonetic) keyboard from Concepts Data Systems.'
+ store(&TARGETS) 'any'
```

#### line_removed (144)

Line 2:
```
- store(&NAME) 'SIL Ethiopic Power-G'
+ 
```
Line 20:
```
-                   "V"     "f"     "p"                                             \
+ 
```
Line 22:
```
- store (keyU)      U+1200  U+1208  U+1210  U+1218  U+1220  U+1228  U+1230  U+1238  \
+ 
```
Line 24:
```
-                   U+1280          U+1290  U+1298  U+12a0  U+12a8          U+12b8  \
+ 
```
Line 25:
```
-                           U+12c8  U+12d0  U+12d8  U+12e0  U+12e8  U+12f0  U+12f8  \
+ 
```
... and 139 more

#### comment_removed (69)

Line 8:
```
- c store(&LANGUAGE) 'x045E'
+ 
```
Line 9:
```
- c store(&WINDOWSLANGUAGES) 'x045E'
+ store(seventh) U+1206 U+120E U+1216 U+121E U+1226 U+122E U+1236 U+123E
```
Line 10:
```
- c store(&LAYOUT) 'default'
+ store(eighth) U+1207 U+2D80 U+1210 U+2D81 U+1220 U+2D82 U+2D83 U+2D84
```
Line 12:
```
- c *********************************************************************************
+ store(DGbase) U+121F U+122F U+124B U+125B U+1267 U+128B U+12B3 U+12C3 U+1313 U+131F U+134F U+1357
```
Line 14:
```
- c ---------------------------------------------------------------------------------
+ store(DGthird) U+1381 U+122F U+124A U+125A U+1385 U+128A U+12B2 U+12C2 U+1312 U+2D94 U+1389 U+138D
```
... and 64 more

#### line_added (9)

Line 11:
```
- 
+ store(diph) U+1200 U+120F U+1217 U+121F U+1227 U+122F U+1237 U+123F
```
Line 13:
```
- 
+ store(DGsecond) U+1383 U+122F U+124D U+125D U+1387 U+128D U+12B5 U+12C5 U+1315 U+2D96 U+138B U+138F
```
Line 21:
```
- 
+ begin Unicode > use(main)
```
Line 28:
```
- 
+ match > use(transforms)
```
Line 40:
```
- 
+ 'ተፀ' > 'ጸ'
```
... and 4 more

#### unknown (51)

Line 15:
```
- store (key)       "h"     "l"     "H"     "m"     "J"     "r"     "s"     "S"     \
+ store(DGfifth) U+1382 U+122F U+124C U+125C U+1386 U+128C U+12B4 U+12C4 U+1314 U+2D95 U+138A U+138E
```
Line 16:
```
-                   "q"             "Q"             "b"     "v"     "t"     "c"     \
+ store(DGseventh) U+1380 U+122F U+1248 U+1258 U+1384 U+1288 U+12B0 U+12C0 U+1310 U+2D93 U+1388 U+138C
```
Line 17:
```
-                   "L"             "n"     "N"     "x"     "k"             "K"     \
+ store(DGspecial) U+1359 U+1358 U+124B U+125B U+1267 U+128B U+12B3 U+12C3 U+1313 U+131F U+135A U+1357
```
Line 18:
```
-                           "w"     "X"     "z"     "Z"     "Y"     "d"     "D"     \
+ store(diacKey) "1234567890''":"
```
Line 19:
```
-                   "j"     "g"             "G"     "T"     "C"     "P"     "F"     \
+ store(diacU) U+030F U+0300 U+0304 U+0301 U+030B U+0302 U+030C U+0307 U+0308 U+0303 U+135F U+135D U+135E
```
... and 46 more

### sil_euro_latin

- Original lines: 332
- Roundtrip lines: 167
- Identical: 28
- Different: 304

#### comment_removed (61)

Line 1:
```
- ﻿c EuroLatin keyboard for Keyman
+ c Converted from LDML keyboard: und
```
Line 3:
```
- c If you make changes to this keyboard file, please consider sharing them at:
+ store(&NAME) 'EuroLatin (SIL)'
```
Line 4:
```
- c https://community.software.sil.org/c/keyman
+ store(&KEYBOARDVERSION) '2.0.4'
```
Line 13:
```
- c KeymanWeb-specific header statements
+ store(doublegraveO) "ȁȅȉȍȑȕȀȄȈȌȐȔ"
```
Line 24:
```
- c This tells Keyman which keys should have casing behavior applied
+ store(antibreveK) "AaEeIiOoRrUu"
```
... and 56 more

#### line_removed (111)

Line 2:
```
- c
+ 
```
Line 8:
```
- store(&BITMAP) 'sil_euro_latin.ico'
+ 
```
Line 53:
```
- store(doubleacuteO) 'őűŐŰ'
+ 
```
Line 57:
```
- store(circumO)   'âĉêĝĥîĵôŝûŵŷẑÂĈÊĜĤÎĴÔŜÛŴŶẐ'
+ 
```
Line 65:
```
- store(antibreveO) 'ȂȃȆȇȊȋȎȏȒȓȖȗ'
+ 
```
... and 106 more

#### line_added (33)

Line 5:
```
- 
+ store(&COPYRIGHT) 'Copyright © SIL International'
```
Line 10:
```
- 
+ store(controls) "`#''"^%&*~-_:@.|,=\\$"
```
Line 12:
```
- 
+ store(graveK) "aeinouwyAEINOUWY"
```
Line 19:
```
- 
+ store(circumO) "âĉêĝĥîĵôŝûŵŷẑÂĈÊĜĤÎĴÔŜÛŴŶẐ"
```
Line 23:
```
- 
+ store(antibreveO) "ȂȃȆȇȊȋȎȏȒȓȖȗ"
```
... and 28 more

#### store_format (1)

Line 6:
```
- store(&version) '15.0'
+ store(&VERSION) '10.0'
```

#### store_reordered (44)

Line 7:
```
- store(&NAME) 'EuroLatin (SIL)'
+ store(&TARGETS) 'any'
```
Line 9:
```
- store(&COPYRIGHT) 'Copyright © SIL International'
+ store(default-alpha) 'a'
```
Line 14:
```
- store(&KMW_HELPFILE) 'sil_euro_latin.html'
+ store(doublegraveK) "aeioruAEIORU"
```
Line 15:
```
- store(&KMW_EMBEDJS) 'sil_euro_latin_js.txt'
+ store(acuteO) "áćéǵíḱĺḿńóṕŕśúẃýźÁĆÉǴÍḰĹḾŃÓṔŔŚÚẂÝŹ"
```
Line 16:
```
- store(&LAYOUTFILE) 'sil_euro_latin.keyman-touch-layout'
+ store(acuteK) "acegiklmnoprsuwyzACEGIKLMNOPRSUWYZ"
```
... and 39 more

#### unknown (2)

Line 11:
```
- $keymanonly: store(&mnemoniclayout) '1'
+ store(graveO) "àèìǹòùẁỳÀÈÌǸÒÙẀỲ"
```
Line 25:
```
- $keymanweb: store(&CasedKeys) [K_A] .. [K_Z]
+ store(breveO) "ăĂĕĔğĞḫḪĭĬŏŎŭŬ"
```

#### group_structure (4)

Line 20:
```
- begin Unicode > use(Main)
+ store(circumK) "aceghijosuwyzACEGHIJOSUWYZ"
```
Line 21:
```
- begin NewContext > use(NewContext)
+ store(caronO) "ǎǍčČďĎěĚǧǦȟȞǐǏǰǩǨľĽňŇǒǑřŘšŠťŤǔǓǯǮžŽ"
```
Line 22:
```
- begin PostKeystroke > use(PostKeystroke)
+ store(caronK) "aAcCdDeEgGhHiIjkKlLnNoOrRsStTuUxXzZ"
```
Line 30:
```
- group(Main) using keys
+ store(macronK) "AaBbDdEeGgHhIiJjLlOoRrTtUuYyZz"
```

#### modifier_format (2)

Line 35:
```
- $keymanonly: store(controls-ralt) [RALT "`"][RALT SHIFT "#"] [RALT "'"] [RALT SHIFT '"'] [RALT SHIFT "^"] [RALT SHIFT "%"] [RALT SHIFT "&"] [RALT SHIFT "*"] [RALT SHIFT "~"] [RALT "-"] [RALT SHIFT "_"] [RALT SHIFT ":"] [RALT SHIFT "@"] [RALT "."] [RALT SHIFT "|"] [RALT ","] [RALT "="] [RALT "\"] [RALT SHIFT "$"]
+ store(ringO) "åÅůŮẘẙșȘțȚ"
```
Line 36:
```
- $keymanonly: store(controls-rctrl) [RCTRL "`"][RCTRL SHIFT "#"] [RCTRL "'"] [RCTRL SHIFT '"'] [RCTRL SHIFT "^"] [RCTRL SHIFT "%"] [RCTRL SHIFT "&"] [RCTRL SHIFT "*"] [RCTRL SHIFT "~"] [RCTRL "-"] [RCTRL SHIFT "_"] [RCTRL SHIFT ":"] [RCTRL SHIFT "@"] [RCTRL "."] [RCTRL SHIFT "|"] [RCTRL ","] [RCTRL "="] [RCTRL "\"] [RCTRL SHIFT "$"]
+ store(ringK) "aAuUwysStT"
```

#### rule_format (46)

Line 38:
```
- if(&platform = 'touch') + any(controls) > use(Touch)
+ store(dottedK) "aAbBcCdDeEfFgGhHiIjlLmMnNoOpPrRsStTwWxXyYzZ"
```
Line 75:
```
- '~' dk(1) + "g" > U+0067 U+0303    c for Guaraní
+ :dk(1)p̈ > 'p̈'
```
Line 76:
```
- '~' dk(1) + "G" > U+0047 U+0303    c for Guaraní
+ :dk(1)P̈ > 'P̈'
```
Line 89:
```
- ':' dk(1) + "n" > U+006E U+0308    c for Guinea-Bissau Creole (pov)
+ C\dk(1)þ > 'C̲h̲'
```
Line 90:
```
- ':' dk(1) + "N" > U+004E U+0308    c for Guinea-Bissau Creole (pov)
+ C\dk(1)Þ > 'C̲H̲'
```
... and 41 more

### sil_extended_urdu_np

- Original lines: 176
- Roundtrip lines: 40
- Identical: 17
- Different: 159

#### comment_removed (25)

Line 1:
```
- ﻿c A Unicode keyboard for Urdu and other Northern Pakistan languages.
+ c Converted from LDML keyboard: und
```
Line 3:
```
- c Makes available the Urdu characters in the Unicode font
+ store(&NAME) 'Extended Urdu NP (SIL)'
```
Line 4:
```
- c Scheherazade (Unicode 4.1 version), plus some characters for other NP languages.
+ store(&KEYBOARDVERSION) '6.0'
```
Line 5:
```
- c Output is Unicode (for at least Win2000 environments, or Win98 with WordLink installed)
+ store(&COPYRIGHT) '(c) 2001-2022 SIL International'
```
Line 8:
```
- c Created: 3 July 2001
+ 
```
... and 20 more

#### line_added (4)

Line 6:
```
- 
+ store(&VERSION) '10.0'
```
Line 7:
```
- 
+ store(&TARGETS) 'any'
```
Line 15:
```
- 
+ + [K_SLASH] > '‍'
```
Line 32:
```
- 
+ match > use(transforms)
```

#### unknown (11)

Line 17:
```
- c	Farsi/Urdu (06Fx) digits rather than Arabic (066x) series
+ + [RALT K_E] > 'إ'
```
Line 18:
```
- c	HAMZA keys:
+ + [RALT K_BKSLASH] > 'ٰ'
```
Line 19:
```
- c		[	yeh with hamza above (use for "linked hamza")
+ + [RALT K_QUOTE] > 'ً'
```
Line 20:
```
- c		]	waw with hamza above
+ + [RALT K_COMMA] > '«'
```
Line 21:
```
- c		\	hamza above (diacritic)
+ + [RALT K_PERIOD] > '»'
```
... and 6 more

#### modifier_format (1)

Line 30:
```
- c		CTRL-<			left-pointing single angle quote
+ + [SHIFT K_Z] > 'ڙ'
```

#### line_removed (115)

Line 31:
```
- c		CTRL-< CTRL-<	open double angle quote
+ 
```
Line 33:
```
- VERSION 10.0
+ 
```
Line 35:
```
- store(&BITMAP) 'sil_extended_urdu_np.ico'
+ 
```
Line 40:
```
- store(&VISUALKEYBOARD) 'sil_extended_urdu_np.kvks'
+ 
```
Line 41:
```
- store(&KEYBOARDVERSION) '6.0'
+ 
```
... and 110 more

#### store_reordered (3)

Line 34:
```
- store(&NAME) 'Extended Urdu NP (SIL)'
+ group(transforms)
```
Line 36:
```
- store(&MESSAGE) 'Keyboard for typing Urdu, Panjabi, and other Northern Pakistan languages'
+ '‘“' > '“'
```
Line 37:
```
- store(&COPYRIGHT) "(c) 2001-2022 SIL International"
+ '’' > ' > U+201d'
```

### sil_greek_polytonic

- Original lines: 986
- Roundtrip lines: 395
- Identical: 85
- Different: 901

#### comment_removed (143)

Line 1:
```
- ﻿c ----------------------------------------------------------------------------
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c Greek keyboard for use with Unicode Windows fonts such as Galatia SIL
+ 
```
Line 3:
```
- c and Keyman 6.x
+ store(&NAME) 'Polytonic Greek (SIL)'
```
Line 4:
```
- c ----------------------------------------------------------------------------
+ store(&KEYBOARDVERSION) '1.5'
```
Line 5:
```
- c GrkPolyComp.KMN 6.0  L A Priest - 26-May-2011 removed rule to redefine enter and tab
+ store(&COPYRIGHT) '(c) 2002-2019 SIL International'
```
... and 138 more

#### line_added (56)

Line 27:
```
- 
+ store(rRo) 'ῥ'
```
Line 34:
```
- 
+ store(K_upU) 'U'
```
Line 36:
```
- 
+ store(K_w) 'w'
```
Line 44:
```
- 
+ store(up) U+0391 U+0392 U+0393 U+0394 U+0395 U+0396 U+0397 U+0398 U+0399
```
Line 46:
```
- 
+ store(upV) U+0391 U+0395 U+0397 U+0399 U+039F U+03A5 U+03A9
```
... and 51 more

#### store_reordered (180)

Line 28:
```
- store(&version) "9.0"
+ store(upRRo) 'Ῥ'
```
Line 29:
```
- store(&name) "Polytonic Greek (SIL)"
+ store(rSm) 'ῤ'
```
Line 30:
```
- store(&BITMAP) 'sil_greek_polytonic.ico'
+ store(sMed) 'σ'
```
Line 32:
```
- store(&COPYRIGHT) '(c) 2002-2019 SIL International'
+ store(K_u) 'u'
```
Line 33:
```
- store(&message) "The Greek (polytonic precomposed) keyboard is distributed under the MIT license."
+ store(u) 'υ'
```
... and 175 more

#### group_structure (1)

Line 45:
```
- begin Unicode > use(MainU)
+ store(K_upV) "AEJIOUW"
```

#### unknown (53)

Line 85:
```
-                     "k"    "l"    "m"    "n"    "x"    "o"  \
+ store(K_Del) '*'
```
Line 86:
```
-                     "p"    xff    "r"    "s"    "t"    "u"    "f"    "c"    "y"    "w"    xff
+ store(K_Di) '"'
```
Line 89:
```
-                     U+03BA U+03BB U+03BC U+03BD U+03BE U+03BF \
+ store(Di_Di) U+03CA U+1FD2 U+1FD3 U+03CB U+1FE2 U+1FE3
```
Line 90:
```
-                     U+03C0 U+03C2 U+03C1 U+03C2 U+03C4 U+03C5 U+03C6 U+03C7 U+03C8 U+03C9 U+1FE5
+ store(Di_Ro) U+1F31 U+1F33 U+1F35 U+1F51 U+1F53 U+1F55
```
Line 99:
```
-                     U+03C0 U+03C1 U+03C3 U+03C4 U+03C6 U+03C7 U+03C8 U+1FE5 U+03C2
+ store(Di_Dilowiu) U+03CA U+03CB
```
... and 48 more

#### line_removed (468)

Line 241:
```
- store(K_DiIU)       "I"    "U"
+ 
```
Line 243:
```
- store(Di_DiIU)      U+03AA U+03AB
+ 
```
Line 245:
```
- store(Di_Dilowiu)   U+03CA U+03CB
+ 
```
Line 246:
```
- store(Di_DiCilowiu) U+1FD7 U+1FE7
+ 
```
Line 250:
```
- store(K_Gr)         "\`"
+ 
```
... and 463 more

### sil_hawaiian

- Original lines: 242
- Roundtrip lines: 184
- Identical: 18
- Different: 224

#### comment_removed (5)

Line 1:
```
- ﻿c Keyman keyboard generated by ImportKeyboard
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c Imported: 2020-09-07 09:49:08
+ 
```
Line 4:
```
- c Source Keyboard File: KBDHAW.DLL
+ store(&KEYBOARDVERSION) '2.1'
```
Line 5:
```
- c Source KeyboardID: 00000475
+ store(&COPYRIGHT) '© SIL International'
```
Line 6:
```
- c with name "Hawaiian (SIL)"
+ store(&VERSION) '10.0'
```

#### unknown (1)

Line 3:
```
- c
+ store(&NAME) 'Hawaiian (SIL)'
```

#### line_added (36)

Line 7:
```
- 
+ store(&TARGETS) 'any'
```
Line 15:
```
- 
+ + [K_2] > '2'
```
Line 17:
```
- 
+ + [K_4] > '4'
```
Line 20:
```
- 
+ + [K_7] > '7'
```
Line 23:
```
- 
+ + [K_0] > '0'
```
... and 31 more

#### line_removed (44)

Line 8:
```
- store(&VERSION) '10.0'
+ 
```
Line 10:
```
- store(&COPYRIGHT) '© SIL International'
+ 
```
Line 12:
```
- store(&TARGETS) 'web desktop'
+ 
```
Line 184:
```
- + [CAPS SHIFT K_W] > U+0077
+ 
```
Line 186:
```
- + [NCAPS K_X] > U+0078
+ 
```
... and 39 more

#### store_reordered (4)

Line 9:
```
- store(&NAME) 'Hawaiian (SIL)'
+ begin Unicode > use(main)
```
Line 11:
```
- store(&KEYBOARDVERSION) '2.1'
+ group(main) using keys
```
Line 13:
```
- store(&VISUALKEYBOARD) 'sil_hawaiian.kvks'
+ + [K_BKQUOTE] > '`'
```
Line 14:
```
- store(&BITMAP) 'sil_hawaiian.ico'
+ + [K_1] > '1'
```

#### group_structure (2)

Line 16:
```
- begin Unicode > use(main)
+ + [K_3] > '3'
```
Line 18:
```
- group(main) using keys
+ + [K_5] > '5'
```

#### rule_format (132)

Line 19:
```
- + [K_SPACE] > U+0020
+ + [K_6] > '6'
```
Line 21:
```
- + [K_0] > U+0030
+ + [K_8] > '8'
```
Line 22:
```
- + [SHIFT K_0] > U+0029
+ + [K_9] > '9'
```
Line 24:
```
- + [K_1] > U+0031
+ + [K_HYPHEN] > '-'
```
Line 25:
```
- + [SHIFT K_1] > U+0021
+ + [K_EQUAL] > '='
```
... and 127 more

### sil_hebr_grek_trans

- Original lines: 91
- Roundtrip lines: 36
- Identical: 13
- Different: 78

#### comment_removed (23)

Line 1:
```
- c ---------------------------------------------------------
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c Hebrew and Greek Transliteration Unicode keyboard for use with any 
+ 
```
Line 3:
```
- c Unicode Windows fonts (including Doulos SIL) and Keyman 6
+ store(&NAME) 'Hebrew and Greek Transliteration (SIL)'
```
Line 5:
```
- c ---------------------------------------------------------
+ store(&COPYRIGHT) 'Copyright © 2003-2018 SIL International'
```
Line 7:
```
- c Since some upper case letters are used with special definitions
+ store(&TARGETS) 'any'
```
... and 18 more

#### unknown (3)

Line 4:
```
- c
+ store(&KEYBOARDVERSION) '1.1'
```
Line 6:
```
- c
+ store(&VERSION) '10.0'
```
Line 13:
```
- VERSION 9.0
+ + [RALT K_A] > 'ᵃ'
```

#### line_added (8)

Line 11:
```
- 
+ group(main) using keys
```
Line 19:
```
- 
+ '.ḥ' > 'ḥ'
```
Line 21:
```
- 
+ '.ṣ' > 'ṣ'
```
Line 23:
```
- 
+ 's' > 'ś'
```
Line 26:
```
- 
+ 'oō' > 'ō'
```
... and 3 more

#### line_removed (39)

Line 14:
```
- store(&NAME) "Hebrew and Greek Transliteration (SIL)"
+ 
```
Line 16:
```
- store(&TARGETS) 'web desktop'
+ 
```
Line 18:
```
- store(&VISUALKEYBOARD) 'sil_hebr_grek_trans.kvks'
+ 
```
Line 36:
```
- + ">" > U+02BE
+ 
```
Line 37:
```
- + "<" > U+02BF
+ 
```
... and 34 more

#### store_reordered (3)

Line 15:
```
- store(&BITMAP) 'sil_hebr_grek_trans.ico'
+ match > use(transforms)
```
Line 17:
```
- store(&KEYBOARDVERSION) '1.1'
+ group(transforms)
```
Line 22:
```
- store( &Copyright ) "Copyright © 2003-2018 SIL International"
+ 'sệ' > 'š'
```

#### group_structure (2)

Line 20:
```
- begin UNICODE > use(Main)  
+ '.ṭ' > 'ṭ'
```
Line 28:
```
- group(Main) using keys
+ 'eệ' > 'ê'
```

### sil_hebrew

- Original lines: 365
- Roundtrip lines: 131
- Identical: 35
- Different: 330

#### comment_removed (158)

Line 1:
```
- ﻿c ----------------------------------------------------------------------------
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c Hebrew Unicode keyboard for use only with any Hebrew Unicode
+ 
```
Line 3:
```
- c Windows fonts (including Ezra SIL) and Keyman 6    9/22/03
+ store(&NAME) 'Hebrew (SIL)'
```
Line 5:
```
- c ----------------------------------------------------------------------------
+ store(&COPYRIGHT) 'Copyright © SIL International'
```
Line 8:
```
- c SILHEBD.KMN - 1.0 - Paul A. O'Rear - 20 June 1996
+ 
```
... and 153 more

#### unknown (11)

Line 4:
```
- c
+ store(&KEYBOARDVERSION) '1.9'
```
Line 6:
```
- c
+ store(&VERSION) '10.0'
```
Line 37:
```
- c
+ + [RALT K_6] > '֭'
```
Line 56:
```
- c
+ + [RALT K_SLASH] > '׳'
```
Line 93:
```
-                U+05D9 U+05DA U+05DB U+05DC U+05DD U+05DE U+05DF U+05E0 U+05E1 \
+ + [SHIFT RALT K_SLASH] > '״'
```
... and 6 more

#### line_added (13)

Line 7:
```
- 
+ store(&TARGETS) 'any'
```
Line 63:
```
- 
+ + [SHIFT K_8] > '֝'
```
Line 79:
```
- 
+ + [SHIFT RALT K_E] > 'ֱ'
```
Line 80:
```
- 
+ + [SHIFT RALT K_O] > 'ֳ'
```
Line 83:
```
- 
+ + [SHIFT RALT K_RBRKT] > '֒'
```
... and 8 more

#### line_removed (125)

Line 28:
```
- c
+ 
```
Line 111:
```
- store(aeoEqOut) U+05B8 U+05B5 U+05B9     c 12/06/01
+ 
```
Line 133:
```
- store(illegalkey) "WRTUIDFGHJLZXVB" c removed­ added ª, ¿  4/7/97 jw
+ 
```
Line 139:
```
- group(Main) using keys
+ 
```
Line 143:
```
-  + any(illegalkey) > nul
+ 
```
... and 120 more

#### store_reordered (22)

Line 64:
```
- store(&version) "10.0"
+ + [SHIFT K_Q] > '֗'
```
Line 65:
```
- store(&NAME) 'Hebrew (SIL)'
+ + [SHIFT K_Y] > '֟'
```
Line 66:
```
- store(&BITMAP) 'sil_hebrew.ico'
+ + [SHIFT K_COLON] > '״'
```
Line 70:
```
- store(&COPYRIGHT) 'Copyright © SIL International'
+ + [SHIFT RALT K_4] > '֠'
```
Line 72:
```
- store(&VISUALKEYBOARD) 'sil_hebrew.kvks'
+ + [SHIFT RALT K_6] > '֟'
```
... and 17 more

#### group_structure (1)

Line 78:
```
- begin UNICODE > use(Main)
+ + [SHIFT RALT K_EQUAL] > '◌'
```

### sil_hebrew_legacy

- Original lines: 366
- Roundtrip lines: 117
- Identical: 39
- Different: 327

#### comment_removed (171)

Line 1:
```
- ﻿c ----------------------------------------------------------------------------
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c Hebrew Unicode keyboard for use only with any Hebrew Unicode
+ 
```
Line 3:
```
- c Windows fonts (including Ezra SIL) and Keyman 6    9/22/03
+ store(&NAME) 'Hebrew Legacy (SIL)'
```
Line 5:
```
- c ----------------------------------------------------------------------------
+ store(&COPYRIGHT) 'Copyright © SIL International'
```
Line 8:
```
- c SILHEBD.KMN - 1.0 - Paul A. O'Rear - 20 June 1996
+ 
```
... and 166 more

#### unknown (10)

Line 4:
```
- c
+ store(&KEYBOARDVERSION) '1.0'
```
Line 6:
```
- c
+ store(&VERSION) '10.0'
```
Line 28:
```
- c
+ + [K_QUOTE] > '"'
```
Line 37:
```
- c
+ + [RALT K_8] > '֛'
```
Line 56:
```
- c
+ + [SHIFT K_2] > '֘'
```
... and 5 more

#### line_added (11)

Line 7:
```
- 
+ store(&TARGETS) 'any'
```
Line 63:
```
- 
+ + [SHIFT K_Y] > '֟'
```
Line 74:
```
- 
+ + [SHIFT RALT K_0] > '֯'
```
Line 75:
```
- 
+ + [SHIFT RALT K_HYPHEN] > 'ֿ'
```
Line 78:
```
- 
+ + [SHIFT RALT K_O] > 'ֳ'
```
... and 6 more

#### store_reordered (18)

Line 64:
```
- store(&version) "10.0"
+ + [SHIFT K_COLON] > '״'
```
Line 65:
```
- store(&NAME) 'Hebrew Legacy (SIL)'
+ + [SHIFT RALT K_1] > '֗'
```
Line 66:
```
- store(&BITMAP) 'sil_hebrew_legacy.ico'
+ + [SHIFT RALT K_2] > '֮'
```
Line 67:
```
- store(&COPYRIGHT) 'Copyright © SIL International'
+ + [SHIFT RALT K_3] > '֙'
```
Line 68:
```
- store(&VISUALKEYBOARD) 'sil_hebrew_legacy.kvks'
+ + [SHIFT RALT K_4] > '֠'
```
... and 13 more

#### group_structure (1)

Line 73:
```
- begin UNICODE > use(Main)
+ + [SHIFT RALT K_9] > '֓'
```

#### line_removed (116)

Line 107:
```
- store(aeoEqOut) U+05B8 U+05B5 U+05B9     c 12/06/01
+ 
```
Line 117:
```
-                    U+05A8 U+05A9 U+05AA U+05AB U+05AC U+05AD U+05AE \
+ 
```
Line 118:
```
-                    U+05BD U+05C4 U+05C5
+ 
```
Line 125:
```
- store(space)   ', '
+ 
```
Line 126:
```
- store(spaceout) U+002C U+0020
+ 
```
... and 111 more

### sil_hmd_plrd

- Original lines: 89
- Roundtrip lines: 18
- Identical: 7
- Different: 82

#### unknown (6)

Line 1:
```
- ﻿c 
+ c Converted from LDML keyboard: und
```
Line 4:
```
- c 
+ store(&KEYBOARDVERSION) '1.1.1'
```
Line 6:
```
- c              
+ store(&VERSION) '10.0'
```
Line 7:
```
- c
+ store(&TARGETS) 'any'
```
Line 9:
```
- c
+ begin Unicode > use(main)
```
... and 1 more

#### comment_removed (4)

Line 2:
```
- c Sample Keyboard: Miao
+ 
```
Line 3:
```
- c Miao of unknown flavor Calling it Ahmao
+ store(&NAME) 'Ahmao (SIL)'
```
Line 5:
```
- c Provided by: Erich Fickle
+ store(&COPYRIGHT) '(c) 2014-2020 SIL International'
```
Line 8:
```
- c Fonts: 
+ 
```

#### line_removed (67)

Line 12:
```
- store(&NAME) 'Ahmao (SIL)'
+ 
```
Line 18:
```
- store(&VISUALKEYBOARD) 'sil_hmd_plrd.kvks'
+ 
```
Line 20:
```
- begin Unicode > use(Umain)
+ 
```
Line 23:
```
- group (Umain) using keys
+ 
```
Line 24:
```
- + [SHIFT K_R]  > dk(dead)
+ 
```
... and 62 more

#### store_reordered (5)

Line 13:
```
- store(&TARGETS) 'web desktop'
+ + [K_BKQUOTE] > '`'
```
Line 14:
```
- store(&ETHNOLOGUECODE) 'hmd'
+ + [SHIFT K_R] > dk(dead)
```
Line 15:
```
- store(&COPYRIGHT) '(c) 2014-2020 SIL International'
+ + [SHIFT K_A] > dk(dead)
```
Line 16:
```
- store(&KEYBOARDVERSION) '1.1.1'
+ + [SHIFT K_X] > dk(dead)
```
Line 17:
```
- store(&BITMAP) 'sil_hmd_plrd.ico'
+ + [SHIFT K_C] > dk(dead)
```

### sil_jarai

- Original lines: 162
- Roundtrip lines: 129
- Identical: 12
- Different: 150

#### comment_removed (9)

Line 1:
```
- ﻿c sil_jarai generated from template at 2022-06-13 10:12:07
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c with name "Jarai ចារាយ (SIL)"
+ 
```
Line 16:
```
- c This tells Keyman which keys should have casing behavior applied
+ store(nulDefaultKeys) "[K_RBRKT]  [K_BKSLASH]"
```
Line 25:
```
- c We get here after every keystroke and model action is processed
+ 
```
Line 27:
```
- c Don't swap off the caps lock layer automatically (behave as ShiftLocked)
+ + [K_1] > '១'
```
... and 4 more

#### store_reordered (10)

Line 3:
```
- store(&VERSION) '10.0'
+ store(&NAME) 'Jarai ចារាយ (SIL)'
```
Line 4:
```
- store(&NAME) 'Jarai ចារាយ (SIL)'
+ store(&KEYBOARDVERSION) '1.0'
```
Line 6:
```
- store(&KEYBOARDVERSION) '1.0'
+ store(&VERSION) '10.0'
```
Line 9:
```
- store(&LAYOUTFILE) 'sil_jarai.keyman-touch-layout'
+ store(ShiftOutSingle) "!ៗ"៛«៍៝ៈ»៖ឈឺែឝទួូីៅភឿៃឌធអះញគឡ៉ឍឃជពឞណំ"
```
Line 10:
```
- store(&BITMAP) 'sil_jarai.ico'
+ store(vCombo1) "ាំ"
```
... and 5 more

#### line_removed (24)

Line 8:
```
- store(&VISUALKEYBOARD) 'sil_jarai.kvks'
+ 
```
Line 21:
```
- store(vCombo4)  'ុះ'
+ 
```
Line 129:
```
- + [SHIFT K_X] > 'ឃ'
+ 
```
Line 130:
```
- + [SHIFT K_K] > 'គ'
+ 
```
Line 131:
```
- + [K_X] > 'ខ'
+ 
```
... and 19 more

#### line_added (7)

Line 11:
```
- 
+ store(vCombo2) "ោះ"
```
Line 12:
```
- 
+ store(vCombo3) "េះ"
```
Line 15:
```
- 
+ store(nulShiftKeys) "[SHIFT  K_R]  [SHIFT  K_RBRKT]  [SHIFT  K_BKSLASH]  [SHIFT  K_PERIOD]"
```
Line 26:
```
- 
+ + [K_BKQUOTE] > '«'
```
Line 29:
```
- 
+ + [K_3] > '៣'
```
... and 2 more

#### group_structure (4)

Line 13:
```
- begin Unicode > use(main)
+ store(vCombo4) "ុះ"
```
Line 14:
```
- begin PostKeystroke > use(PostKeystroke)
+ store(ShiftOutAll) "outs(ShiftOutSingle)  outs(vCombo1)  outs(vCombo2)  outs(vCombo3)  outs(vCombo4)"
```
Line 24:
```
- group(PostKeystroke) readonly
+ group(main) using keys
```
Line 34:
```
- group(main) using keys
+ + [K_8] > '៨'
```

#### modifier_format (2)

Line 28:
```
- if(&layer = 'caps') > context
+ + [K_2] > '២'
```
Line 31:
```
- if(&newLayer = "") if(&layer = 'shift') any(ShiftOutSingle) > context layer('default')
+ + [K_5] > '៥'
```

#### rule_format (94)

Line 35:
```
- + [SHIFT K_V] > 'េះ'
+ + [K_9] > '៩'
```
Line 36:
```
- + [SHIFT K_O] > 'ៅ'
+ + [K_0] > '០'
```
Line 37:
```
- + [SHIFT K_COMMA] > 'ុះ'
+ + [K_HYPHEN] > '-'
```
Line 38:
```
- + [SHIFT K_COLON] > 'ោះ'
+ + [K_EQUAL] > '='
```
Line 39:
```
- + [SHIFT K_A] > 'ាំ'
+ + [K_Q] > 'ឆ'
```
... and 89 more

### sil_kayah_kali

- Original lines: 139
- Roundtrip lines: 56
- Identical: 14
- Different: 125

#### store_reordered (8)

Line 1:
```
- ﻿store(&VERSION) "10.0"
+ c Converted from LDML keyboard: und
```
Line 4:
```
- store(&MESSAGE) ""
+ store(&KEYBOARDVERSION) '1.2.2'
```
Line 16:
```
- store(&TARGETS) 'web desktop'
+ + [RALT K_1] > '1'
```
Line 17:
```
- store(&KEYBOARDVERSION) '1.2.2'
+ + [RALT K_2] > '2'
```
Line 18:
```
- store(&BITMAP) 'sil_kayah_kali.ico'
+ + [RALT K_3] > '3'
```
... and 3 more

#### line_removed (71)

Line 2:
```
- store(&NAME) 'Kayah [Kayah Li] (SIL)'
+ 
```
Line 56:
```
- + "'" > U+A90D
+ 
```
Line 58:
```
- + 'z' > U+A921
+ 
```
Line 59:
```
- + 'x' > U+A90C
+ 
```
Line 60:
```
- + 'c' > U+A90F
+ 
```
... and 66 more

#### comment_removed (12)

Line 3:
```
- c HOTKEY "^+K"
+ store(&NAME) 'Kayah [Kayah Li] (SIL)'
```
Line 7:
```
- c 1.0   26-MAR-2007     MJPH    Convert to true Unicode from PUA
+ store(&TARGETS) 'any'
```
Line 9:
```
- c 1.3   11-MAY-2006     MJPH    fix y key from EE2B
+ store(digitsK) "01234"
```
Line 10:
```
- c 1.2   11-Apr-2006     RDD     Added single quotes
+ store(digitsU) U+A900 U+A901 U+A902 U+A903 U+A904
```
Line 11:
```
- c 1.1   02-Dec-2005     RDD     Added the ability to type ASCII for SFMs
+ 
```
... and 7 more

#### line_added (7)

Line 6:
```
- 
+ store(&VERSION) '10.0'
```
Line 20:
```
- 
+ + [RALT K_5] > '5'
```
Line 22:
```
- 
+ + [RALT K_7] > '7'
```
Line 24:
```
- 
+ + [RALT K_9] > '9'
```
Line 29:
```
- 
+ + [RALT K_E] > 'e'
```
... and 2 more

#### group_structure (2)

Line 21:
```
- begin Unicode > use(main)
+ + [RALT K_6] > '6'
```
Line 23:
```
- group(main) using keys
+ + [RALT K_8] > '8'
```

#### unknown (2)

Line 26:
```
-                "5"    "6"    "7"    "8"    "9"
+ + [RALT K_HYPHEN] > '-'
```
Line 28:
```
-                U+A905 U+A906 U+A907 U+A908 U+A909
+ + [RALT K_W] > 'w'
```

#### rule_format (23)

Line 30:
```
- + any(digitsK) > index(digitsU,1)
+ + [RALT K_R] > 'r'
```
Line 33:
```
- + 'q' > U+A920
+ + [RALT K_U] > 'u'
```
Line 34:
```
- + 'w' > U+A90E
+ + [RALT K_I] > 'i'
```
Line 35:
```
- + 'e' > U+A919
+ + [RALT K_O] > 'o'
```
Line 36:
```
- + 'r' > U+A91A
+ + [RALT K_P] > 'p'
```
... and 18 more

### sil_kayah_latn

- Original lines: 21
- Roundtrip lines: 16
- Identical: 2
- Different: 19

#### comment_removed (2)

Line 1:
```
- ﻿c Title:    KYU Latn Unicode keyboard
+ c Converted from LDML keyboard: und
```
Line 3:
```
- c MJPH  0.1     23-SEP-2009     Original
+ store(&NAME) 'Kayah [Latin] (SIL)'
```

#### line_removed (9)

Line 2:
```
- c
+ 
```
Line 8:
```
- store(&KEYBOARDVERSION) '1.1'
+ 
```
Line 11:
```
- store(&VISUALKEYBOARD) 'sil_kayah_latn.kvks'
+ 
```
Line 13:
```
- begin Unicode > use(Main)
+ 
```
Line 15:
```
- store(baseK)    "~`&_-{[}]|\<>^"
+ 
```
... and 4 more

#### line_added (3)

Line 4:
```
- 
+ store(&KEYBOARDVERSION) '1.1'
```
Line 12:
```
- 
+ begin Unicode > use(main)
```
Line 14:
```
- 
+ group(main) using keys
```

#### store_reordered (5)

Line 5:
```
- store(&VERSION) "10.0"
+ store(&COPYRIGHT) '© 2009-2018 SIL International'
```
Line 6:
```
- store(&name) "Kayah [Latin] (SIL)"
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&COPYRIGHT) '© 2009-2018 SIL International'
+ store(&TARGETS) 'any'
```
Line 9:
```
- store(&TARGETS) 'web desktop'
+ store(baseK) "~`&_-{[}]|\\<>^"
```
Line 10:
```
- store(&BITMAP) 'sil_kayah_latn.ico'
+ store(baseU) '꤮'
```

### sil_kayah_mymr

- Original lines: 295
- Roundtrip lines: 78
- Identical: 31
- Different: 264

#### comment_removed (41)

Line 1:
```
- ﻿c Burmese Keyboard for Unicode Encoding.
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c MJPH  0.1     17-Sep-2008     Create kyu keyboard
+ 
```
Line 3:
```
- c MJPH  0.2     31-AUG-2009     Enforce good ordering for kyu
+ store(&NAME) 'Kayah [Myanmar] (SIL)'
```
Line 4:
```
- c MJPH  0.3      4-SEP-2009     adjust layout and rewrite from scratch
+ store(&KEYBOARDVERSION) '1.1'
```
Line 5:
```
- c MJPH  0.4     15-SEP-2009     Fix bugs and minor layout change
+ store(&COPYRIGHT) '© 2014-2018 SIL International'
```
... and 36 more

#### line_added (11)

Line 6:
```
- 
+ store(&VERSION) '10.0'
```
Line 15:
```
- 
+ store(sDiaK) "sjSG"
```
Line 36:
```
- 
+ store(yrDiaU) U+103B U+103C
```
Line 43:
```
- 
+ store(m1DiaK) 's'
```
Line 47:
```
- 
+ store(mDia) U+103B U+103C U+103D U+103E
```
... and 6 more

#### store_reordered (23)

Line 7:
```
- store(&VERSION) "10.0"
+ store(&TARGETS) 'any'
```
Line 9:
```
- store(&BITMAP) 'sil_kayah_mymr.ico'
+ store(baseK) "qwertyuiop\\"
```
Line 11:
```
- store(&TARGETS) 'web desktop'
+ store(numK) "1234567890"
```
Line 12:
```
- store(&KEYBOARDVERSION) '1.1'
+ store(numU) U+1041 U+1042 U+1043 U+1044 U+1045 U+1046 U+1047 U+1048 U+1049
```
Line 13:
```
- store(&VISUALKEYBOARD) 'sil_kayah_mymr.kvks'
+ store(kinziK) 'F'
```
... and 18 more

#### line_removed (174)

Line 8:
```
- store(&NAME) "Kayah [Myanmar] (SIL)"
+ 
```
Line 56:
```
- store(vowelEU)  U+1031
+ 
```
Line 58:
```
- store(uDiaK)    'dDfYUI'
+ 
```
Line 59:
```
- store(uDiaU)    U+102D U+102E U+1072 U+1073 U+1074 U+1034
+ 
```
Line 61:
```
- store(lDiaK)    'kl'
+ 
```
... and 169 more

#### group_structure (1)

Line 16:
```
- begin Unicode > use(Main)
+ store(sDiaU) U+103B U+103C U+103E U+103D
```

#### unknown (14)

Line 31:
```
-                 'QWERTOP|[]' \
+ store(diaU) "outs(sDiaU)  outs(uDiaU)  outs(lDiaU)  U+1031  outs(anuU)"
```
Line 32:
```
-                 'AKL:' \
+ store(yDiaU) 'ျ'
```
Line 33:
```
-                 'zxcvbn,' \
+ store(rDiaU) 'ြ'
```
Line 34:
```
-                 'ZXCVBN<>' \
+ store(wDiaU) 'ွ'
```
Line 35:
```
-                 '@#^&*`'
+ store(hDiaU) 'ှ'
```
... and 9 more

### sil_khamti

- Original lines: 184
- Roundtrip lines: 56
- Identical: 9
- Different: 175

#### comment_removed (16)

Line 1:
```
- ﻿c Title:    Khamti (SIL) keyboard
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c Description:
+ 
```
Line 3:
```
- c           Khamti Shan keyboard based on Shan phonetic keyboard
+ store(&NAME) 'Khamti (SIL)'
```
Line 4:
```
- c MJPH  1.00    24-OCT-2003     Original
+ store(&KEYBOARDVERSION) '1.1'
```
Line 5:
```
- c MJPH  1.01     7-NOV-2003     Add QqwJ
+ store(&COPYRIGHT) 'SIL International 2019-2023, All rights reserved'
```
... and 11 more

#### line_added (6)

Line 13:
```
- 
+ store(ldiaK) "kl"
```
Line 25:
```
- 
+ store(takesVSK) "uViwyr,vtczX"
```
Line 44:
```
- 
+ any(visarga)ႆ︀ > 'ႆ︀'
```
Line 47:
```
- 
+ any(visarga)any(tone)any(redup)ႆ︀ > 'ႆ︀'
```
Line 50:
```
- 
+ any(ldia)any(tone)ႆ︀ > 'ႆ︀'
```
... and 1 more

#### store_reordered (17)

Line 14:
```
- store(&VERSION) '10.0'
+ store(ldia) U+102F U+1030
```
Line 15:
```
- store(&NAME) 'Khamti (SIL)'
+ store(preK) "aF"
```
Line 16:
```
- store(&BITMAP) 'sil_khamti.ico'
+ store(pre) U+1031 U+1084
```
Line 20:
```
- store(&COPYRIGHT) 'SIL International 2019-2023, All rights reserved'
+ store(redup) 'ꩰ'
```
Line 21:
```
- store(&KEYBOARDVERSION) '1.1'
+ store(visargaK) ';'
```
... and 12 more

#### group_structure (1)

Line 26:
```
- begin Unicode > use(Main)
+ store(takesVS) U+1000 U+101B U+1004 U+1010 U+1015 U+1019 U+101A U+101C U+1022 U+1075 U+1078 U+1080
```

#### line_removed (125)

Line 29:
```
-                 "Q"    "W"    "E"    "R"    "T"    "Y"    "U"           "O"    "P"    "{"    "}"    "|" \
+ 
```
Line 31:
```
-                                             "g"                                               \
+ 
```
Line 32:
```
-                                             "B"           "M"           ">"    "?"      \
+ 
```
Line 34:
```
-                        "0"    "1"    "2"    "3"    "4"    "5"    "6"    "7"    "8"    "9"    "-"    "=" \
+ 
```
Line 36:
```
- store(base)                                                             U+101D        U+AA6D U+AA69 U+AA6A \
+ 
```
... and 120 more

#### unknown (10)

Line 30:
```
-                                                                                       '"'     \
+ group(main) using keys
```
Line 33:
```
-                        "x"                                "m"           "."    "/"      \
+ match > use(transforms)
```
Line 35:
```
-                 "~"    ")"    "!"    "@"    "#"    "$"    "%"    "^"    "&"    "*"    "("    "_"    "+"
+ group(transforms)
```
Line 37:
```
-                 U+107C U+107B U+201C U+201D U+AA63 U+107F U+AA71        U+1085 U+AA72 "["     "]"   U+101B \
+ any(base)(any(pre))​ > '​' index(pre,1)
```
Line 38:
```
-                                                                                       U+1079  \
+ any(takesVS)︀(any(pre))​ > '​' index(pre,1)
```
... and 5 more

### sil_khmer

- Original lines: 290
- Roundtrip lines: 193
- Identical: 4
- Different: 286

#### unknown (3)

Line 1:
```
- ﻿c
+ c Converted from LDML keyboard: und
```
Line 3:
```
- c
+ store(&NAME) 'Khmer (SIL)'
```
Line 33:
```
- store (cons0) U+1780 U+1781 U+1782 U+1783 U+1784 U+1785 U+1786 U+1787 U+1788 U+1789 U+178A U+178B U+178C U+178D U+178E U+178F U+1790 U+1791 U+1792 U+1793 U+1794 U+1795 U+1796 U+1797 U+1798 U+1799 U+179A U+179B U+179C U+179D U+179E U+179F U+17A0 U+17A1 U+17A2
+ store(miscD) "<>" U+002F U+00B0
```

#### comment_removed (56)

Line 2:
```
- c Khmer keyboard for Unicode
+ 
```
Line 4:
```
- c Jan 2003
+ store(&KEYBOARDVERSION) '1.5'
```
Line 5:
```
- c changed from ABC font encoding to Unicode
+ store(&COPYRIGHT) '(c) 2002 - 2019 SIL International'
```
Line 6:
```
- c Nov 2003 
+ store(&VERSION) '10.0'
```
Line 7:
```
- c ';' becomes 17d2   ',' becomes modifier key
+ store(&TARGETS) 'any'
```
... and 51 more

#### line_added (25)

Line 13:
```
- 
+ store(num) "0123456789"
```
Line 23:
```
- 
+ store(dia2) U+17CC U+17CF U+17D1 U+17DA U+200C U+17D5 U+002B U+005F U+17D4 U+0024
```
Line 25:
```
-                
+ store(misc1) U+201C U+201D
```
Line 27:
```
- 
+ store(misc3) U+2018 U+2019
```
Line 35:
```
- 
+ store(latin) "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
```
... and 20 more

#### store_reordered (34)

Line 14:
```
- store(&VERSION) '10.0'
+ store(num0) U+17E0 U+17E1 U+17E2 U+17E3 U+17E4 U+17E5 U+17E6 U+17E7 U+17E8 U+17E9
```
Line 15:
```
- store(&NAME) 'Khmer (SIL)'
+ store(num1) U+17F0 U+17F1 U+17F2 U+17F3 U+17F4 U+17F5 U+17F6 U+17F7 U+17F8 U+17F9
```
Line 16:
```
- store(&BITMAP) 'sil_khmer.ico'
+ store(ind) "}{|\\"
```
Line 17:
```
- store(&COPYRIGHT) '(c) 2002 - 2019 SIL International'
+ store(ind0) U+17A5 U+17AA U+17AC U+17AE
```
Line 18:
```
- store(&MESSAGE) "Created by D. Kanjahn for Unicode. Input method close to former ABC fonts."
+ store(ind1) U+17AF U+17B1 U+17AB U+17AD
```
... and 29 more

#### group_structure (2)

Line 24:
```
- begin Unicode> use(main)
+ store(misc0) U+17CA U+17C9
```
Line 95:
```
- group(main) using keys
+ + [SHIFT CTRL RALT K_9] > '᧩'
```

#### line_removed (97)

Line 38:
```
- store(vow) "aiIwWuUYROoeEAM:"
+ 
```
Line 40:
```
- store (vow0) U+17B6 U+17B7 U+17B8 U+17B9 U+17BA U+17BB U+17BC U+17BD U+17BE U+17BF U+17C0 U+17C1 U+17C2 U+17C5 U+17C6 U+17C7
+ 
```
Line 133:
```
- + any(miscA) > index(miscA1,1)
+ 
```
Line 135:
```
- any(miscB) + ',' > index(miscC,1)
+ 
```
Line 137:
```
- any(miscD) + ',' > index(miscA1,1)
+ 
```
... and 92 more

#### rule_format (69)

Line 98:
```
- + ';' > U+17D2
+ + [SHIFT CTRL RALT K_EQUAL] > '᧬'
```
Line 100:
```
- + [CTRL K_SPACE] > U+200C
+ + [SHIFT CTRL RALT K_W] > '᧮'
```
Line 102:
```
- + [SHIFT K_SPACE] > U+200D
+ + [SHIFT CTRL RALT K_R] > '៰'
```
Line 104:
```
- + [ALT K_SPACE] > U+200A
+ + [SHIFT CTRL RALT K_Y] > '៲'
```
Line 105:
```
- + [SHIFT CTRL K_SPACE] > U+2009
+ + [SHIFT CTRL RALT K_U] > '៳'
```
... and 64 more

### sil_khowar

- Original lines: 159
- Roundtrip lines: 108
- Identical: 22
- Different: 137

#### line_added (33)

Line 1:
```
- ﻿
+ c Converted from LDML keyboard: und
```
Line 14:
```
- 
+ + [K_1] > '۱'
```
Line 16:
```
- 
+ + [K_3] > '۳'
```
Line 19:
```
- 
+ + [K_6] > '۶'
```
Line 22:
```
- 
+ + [K_9] > '۹'
```
... and 28 more

#### line_removed (35)

Line 2:
```
- store(&VERSION) '10.0'
+ 
```
Line 8:
```
- store(&KEYBOARDVERSION) '1.0'
+ 
```
Line 108:
```
- + [SHIFT K_U] > U+0626
+ 
```
Line 110:
```
- + [K_V] > U+0637            c req for Khowar
+ 
```
Line 111:
```
- + [SHIFT K_V] > U+0638      c req for Khowar
+ 
```
... and 30 more

#### store_reordered (5)

Line 4:
```
- store(&Targets) "web desktop"
+ store(&KEYBOARDVERSION) '1.0'
```
Line 5:
```
- store(&VISUALKEYBOARD) 'sil_khowar.kvks'
+ store(&COPYRIGHT) '© 2020 SIL International'
```
Line 6:
```
- store(&BITMAP) 'sil_khowar.ico'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&COPYRIGHT) '© 2020 SIL International'
+ store(&TARGETS) 'any'
```
Line 9:
```
- store(&KMW_RTL) '1'
+ begin Unicode > use(main)
```

#### group_structure (2)

Line 11:
```
- begin Unicode > use(main)
+ group(main) using keys
```
Line 13:
```
- group(main) using keys
+ + [K_BKQUOTE] > '؏'
```

#### rule_format (62)

Line 15:
```
- + [K_SPACE] > U+0020
+ + [K_2] > '۲'
```
Line 17:
```
- + [K_0] > U+06f0
+ + [K_4] > '۴'
```
Line 18:
```
- + [SHIFT K_0] > U+0028
+ + [K_5] > '۵'
```
Line 20:
```
- + [K_1] > U+06f1
+ + [K_7] > '۷'
```
Line 21:
```
- + [SHIFT K_1] > U+0021
+ + [K_8] > '۸'
```
... and 57 more

### sil_kmhmu

- Original lines: 100
- Roundtrip lines: 41
- Identical: 14
- Different: 86

#### comment_removed (22)

Line 1:
```
- ﻿c Lao-script Kmhmu language keyboard for Keyman 10.0
+ c Converted from LDML keyboard: und
```
Line 4:
```
- c store(&LANGUAGE) 'x0454'
+ store(&KEYBOARDVERSION) '1.8'
```
Line 6:
```
- c store(&ETHNOLOGUECODE) 'kjg'
+ store(&VERSION) '10.0'
```
Line 8:
```
- c store(&WINDOWSLANGUAGES) 'x0454'
+ 
```
Line 19:
```
- c Define sets of characters for matching and filtering: basic consonant sets
+ store(NumeralKey) "!@#$&*()_W"
```
... and 17 more

#### store_reordered (17)

Line 3:
```
- store(&VERSION ) '10.0'
+ store(&NAME) 'Kmhmu (SIL)'
```
Line 5:
```
- store(&HOTKEY) '[CTRL SHIFT K_K]'
+ store(&COPYRIGHT) '© SIL International'
```
Line 7:
```
- store(&capsalwaysoff) "1"
+ store(&TARGETS) 'any'
```
Line 9:
```
- store(&COPYRIGHT) '© SIL International'
+ store(Consonant) "ກຂຄງຈສຊຍດຕຖທນບປຜຝພຟມຢຣລວຫອຮໝໜໞໟ" U+0EBC
```
Line 10:
```
- store(&KEYBOARDVERSION) '1.8'
+ store(ConsonantKey) "d07''9l-pf84mo[xz/r2,1i];svI<OYU^"
```
... and 12 more

#### line_added (6)

Line 16:
```
- 
+ store(Sign) "ໆຯ"
```
Line 18:
```
- 
+ store(Numeral) "1234567890/*-+."
```
Line 23:
```
- 
+ store(Punctuation) "*_+;.,:!?%="(x)$-/"
```
Line 28:
```
- 
+ group(main) using keys
```
Line 32:
```
- 
+ + [RALT K_RBRKT] > ']'
```
... and 1 more

#### group_structure (1)

Line 17:
```
- begin Unicode > use(Start)
+ store(SignKey) "MC"
```

#### line_removed (39)

Line 25:
```
- store(Vowel) "ເແໂໄໃ" "ະຽາ" U+0ECD U+0EB3 U+0EB1 U+0EBB U+0EB4 \
+ 
```
Line 27:
```
- store(VowelKey) "gc3w." "tPk" "=eaqyubn56"
+ 
```
Line 37:
```
- store(Sign)  "ໆຯ"
+ 
```
Line 41:
```
- store(NumeralKey) "!@#$&*()_W"
+ 
```
Line 42:
```
- store(NumberPadKey) [K_NP1] [K_NP2] [K_NP3] [K_NP4] [K_NP5] \
+ 
```
... and 34 more

#### unknown (1)

Line 26:
```
-          U+0EB5 U+0EB6 U+0EB7 U+0EB8 U+0EB9
+ begin Unicode > use(main)
```

### sil_kvl_kayaw

- Original lines: 115
- Roundtrip lines: 112
- Identical: 3
- Different: 112

#### store_reordered (6)

Line 1:
```
- ﻿store(&VERSION) '9.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&TARGETS) 'any'
+ store(&NAME) 'Kayaw (SIL)'
```
Line 4:
```
- store(&ETHNOLOGUECODE) 'kvl'
+ store(&KEYBOARDVERSION) '1.2.1'
```
Line 5:
```
- store(&VISUALKEYBOARD) 'sil_kvl_kayaw.kvks'
+ store(&COPYRIGHT) '© SIL International'
```
Line 6:
```
- store(&LAYOUTFILE) 'sil_kvl_kayaw.keyman-touch-layout'
+ store(&VERSION) '10.0'
```
... and 1 more

#### line_removed (6)

Line 2:
```
- store(&NAME) 'Kayaw (SIL)'
+ 
```
Line 8:
```
- store(&COPYRIGHT) '© SIL International'
+ 
```
Line 12:
```
- group(main) using keys
+ 
```
Line 112:
```
- + [T_0300_0304] > U+0300 U+0304
+ 
```
Line 113:
```
- + [T_0302_0304] >  U+0302 U+0304
+ 
```
... and 1 more

#### line_added (2)

Line 11:
```
- 
+ group(main) using keys
```
Line 109:
```
- 
+ + [T_0300_0304] > '̀̄'
```

#### rule_format (97)

Line 13:
```
- + [K_X] > '̂̌'
+ + [K_BKQUOTE] > '`'
```
Line 14:
```
- + [K_Z] > '̂̄'
+ + [K_1] > '1'
```
Line 15:
```
- + [K_Q] > '̀̌'
+ + [K_2] > '2'
```
Line 16:
```
- + [SHIFT K_7] > '7'
+ + [K_3] > '3'
```
Line 17:
```
- + [SHIFT K_6] > '6'
+ + [K_4] > '4'
```
... and 92 more

#### comment_removed (1)

Line 110:
```
- C For Touchscreen only
+ + [T_0302_0304] > '̂̄'
```

### sil_limbu_phonetic

- Original lines: 176
- Roundtrip lines: 109
- Identical: 22
- Different: 154

#### unknown (3)

Line 1:
```
- ﻿c
+ c Converted from LDML keyboard: und
```
Line 4:
```
- c
+ store(&KEYBOARDVERSION) '1.3.1'
```
Line 7:
```
- c
+ store(&TARGETS) 'any'
```

#### comment_removed (4)

Line 2:
```
- c Keyman keyboard generated by ImportKeyboard
+ 
```
Line 3:
```
- c Imported: 2019-05-20 13:47:48
+ store(&NAME) 'Limbu Phonetic (SIL)'
```
Line 5:
```
- c Source Keyboard File: Limbu11.dll
+ store(&COPYRIGHT) '© SIL International'
```
Line 6:
```
- c Source KeyboardID: a0000426
+ store(&VERSION) '10.0'
```

#### line_removed (49)

Line 8:
```
- c 
+ 
```
Line 10:
```
- store(&VERSION) '10.0'
+ 
```
Line 12:
```
- store(&Targets) "web desktop"
+ 
```
Line 109:
```
- + [K_Q] > U+1900
+ 
```
Line 110:
```
- + [SHIFT K_Q] > U+1939
+ 
```
... and 44 more

#### line_added (31)

Line 9:
```
- 
+ begin Unicode > use(main)
```
Line 17:
```
- 
+ + [K_4] > '᥊'
```
Line 19:
```
- 
+ + [K_6] > '᥌'
```
Line 21:
```
- 
+ + [K_8] > '᥎'
```
Line 23:
```
- 
+ + [K_0] > '᥆'
```
... and 26 more

#### store_reordered (5)

Line 11:
```
- store(&NAME) 'Limbu Phonetic (SIL)'
+ group(main) using keys
```
Line 13:
```
- store(&VISUALKEYBOARD) 'sil_limbu_phonetic.kvks'
+ + [K_BKQUOTE] > 'ᤲ'
```
Line 14:
```
- store(&BITMAP) 'sil_limbu_phonetic.ico'
+ + [K_1] > '᥇'
```
Line 15:
```
- store(&COPYRIGHT) '© SIL International'
+ + [K_2] > '᥈'
```
Line 16:
```
- store(&KEYBOARDVERSION) '1.3.1'
+ + [K_3] > '᥉'
```

#### group_structure (2)

Line 18:
```
- begin Unicode > use(main)
+ + [K_5] > '᥋'
```
Line 20:
```
- group(main) using keys
+ + [K_7] > '᥍'
```

#### rule_format (60)

Line 22:
```
- + [K_SPACE] > U+0020
+ + [K_9] > '᥏'
```
Line 24:
```
- + [K_0] > U+1946
+ + [K_HYPHEN] > '-'
```
Line 25:
```
- + [SHIFT K_0] > U+0029
+ + [K_EQUAL] > '='
```
Line 27:
```
- + [K_1] > U+1947
+ + [K_W] > 'ᤘ'
```
Line 28:
```
- + [SHIFT K_1] > U+1944
+ + [K_E] > 'ᤣ'
```
... and 55 more

### sil_limbu_typewriter

- Original lines: 178
- Roundtrip lines: 115
- Identical: 22
- Different: 156

#### unknown (3)

Line 1:
```
- ﻿c
+ c Converted from LDML keyboard: und
```
Line 4:
```
- c
+ store(&KEYBOARDVERSION) '1.2.1'
```
Line 7:
```
- c
+ store(&TARGETS) 'any'
```

#### comment_removed (4)

Line 2:
```
- c Keyman keyboard generated by ImportKeyboard
+ 
```
Line 3:
```
- c Imported: 2019-05-20 13:45:56
+ store(&NAME) 'Limbu Typewriter (SIL)'
```
Line 5:
```
- c Source Keyboard File: LimbuTyp.dll
+ store(&COPYRIGHT) '© SIL International'
```
Line 6:
```
- c Source KeyboardID: a0000427
+ store(&VERSION) '10.0'
```

#### line_removed (45)

Line 8:
```
- c 
+ 
```
Line 10:
```
- store(&VERSION) '10.0'
+ 
```
Line 12:
```
- store(&Targets) "web desktop"
+ 
```
Line 115:
```
- + [K_S] > U+1901
+ 
```
Line 116:
```
- + [SHIFT K_S] > U+1930
+ 
```
... and 40 more

#### line_added (33)

Line 9:
```
- 
+ begin Unicode > use(main)
```
Line 17:
```
- 
+ + [K_4] > '᥊'
```
Line 19:
```
- 
+ + [K_6] > '᥌'
```
Line 21:
```
- 
+ + [K_8] > '᥎'
```
Line 24:
```
- 
+ + [K_HYPHEN] > '_'
```
... and 28 more

#### store_reordered (5)

Line 11:
```
- store(&NAME) 'Limbu Typewriter (SIL)'
+ group(main) using keys
```
Line 13:
```
- store(&VISUALKEYBOARD) 'sil_limbu_typewriter.kvks'
+ + [K_BKQUOTE] > 'ᤲ'
```
Line 14:
```
- store(&BITMAP) 'sil_limbu_typewriter.ico'
+ + [K_1] > '᥇'
```
Line 15:
```
- store(&COPYRIGHT) '© SIL International'
+ + [K_2] > '᥈'
```
Line 16:
```
- store(&KEYBOARDVERSION) '1.2.1'
+ + [K_3] > '᥉'
```

#### group_structure (2)

Line 18:
```
- begin Unicode > use(main)
+ + [K_5] > '᥋'
```
Line 20:
```
- group(main) using keys
+ + [K_7] > '᥍'
```

#### rule_format (64)

Line 22:
```
- + [K_SPACE] > U+0020
+ + [K_9] > '᥏'
```
Line 23:
```
- + [RALT K_SPACE] > U+00a0
+ + [K_0] > '᥆'
```
Line 25:
```
- + [K_0] > U+1946
+ + [K_EQUAL] > '='
```
Line 26:
```
- + [SHIFT K_0] > U+0029
+ + [K_Q] > 'ᤪ'
```
Line 28:
```
- + [K_1] > U+1947
+ + [K_E] > 'ᤓ'
```
... and 59 more

### sil_lisu_basic

- Original lines: 48
- Roundtrip lines: 21
- Identical: 7
- Different: 41

#### store_reordered (5)

Line 1:
```
- ﻿store(&VERSION) "9.0"
+ c Converted from LDML keyboard: und
```
Line 6:
```
- store(&KEYBOARDVERSION) '1.0.0'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&BITMAP) 'sil_lisu_basic.ico'
+ store(&TARGETS) 'any'
```
Line 10:
```
- store(&TARGETS) 'web desktop'
+ store(base) U+2605 U+25AA U+A4F1 U+A4E4 U+A4D5 U+A4FB U+A4F5 U+A4FE U+02CD U+A4D2
```
Line 14:
```
- store(baseK)    [SHIFT K_Q] [SHIFT K_W] [SHIFT K_E] [SHIFT K_R] [SHIFT K_T] [SHIFT K_Y] [SHIFT K_U] [SHIFT K_I] [SHIFT K_O] [SHIFT K_P]  \
+ store(commonPunctuationK) "[K_BKQUOTE]  [SHIFT  K_BKQUOTE]  [SHIFT  K_1]  [SHIFT  K_2]  [SHIFT  K_3]  [SHIFT  K_4]  \\"
```

#### line_removed (27)

Line 2:
```
- store(&NAME) 'Lisu Basic (SIL)'
+ 
```
Line 8:
```
- store(&VISUALKEYBOARD) 'sil_lisu_basic.kvks'
+ 
```
Line 16:
```
-     	   	   	[SHIFT K_A] [SHIFT K_S] [SHIFT K_D] [SHIFT K_F] [SHIFT K_G] [SHIFT K_H] [SHIFT K_J] [SHIFT K_K] [SHIFT K_L] [SHIFT K_COLON]  \
+ 
```
Line 18:
```
-     	   	   	[SHIFT K_Z] [SHIFT K_X] [SHIFT K_C] [SHIFT K_V] [SHIFT K_B]  \
+ 
```
Line 20:
```
- store(base)     U+2605 U+25AA U+A4F1 U+A4E4 U+A4D5 U+A4FB U+A4F5 U+A4FE U+02CD U+A4D2 \
+ 
```
... and 22 more

#### comment_removed (3)

Line 3:
```
- c HOTKEY "^+L"
+ store(&NAME) 'Lisu Basic (SIL)'
```
Line 4:
```
- c store(&ETHNOLOGUECODE) 'lis atb lbc lpo nxq'
+ store(&KEYBOARDVERSION) '1.0.0'
```
Line 9:
```
- c store(&LAYOUTFILE) 'sil_lisu_basic-layout.js'
+ store(baseK) "[SHIFT  K_Q]  [SHIFT  K_W]  [SHIFT  K_E]  [SHIFT  K_R]  [SHIFT  K_T]  [SHIFT  K_Y]  [SHIFT  K_U]  [SHIFT  K_I]  [SHIFT  K_O]  [SHIFT  K_P]    \\"
```

#### line_added (2)

Line 11:
```
- 
+ store(banned) "[SHIFT  K_M]  [SHIFT  K_N]"
```
Line 13:
```
- 
+ store(digit) U+0031 U+0032 U+0033 U+0034 U+0035 U+0036 U+0037 U+0038 U+0039 U+0030
```

#### group_structure (1)

Line 12:
```
- begin Unicode > use(Main)
+ store(digitK) "[K_1]  [K_2]  [K_3]  [K_4]  [K_5]  [K_6]  [K_7]  [K_8]  [K_9]  [K_0]"
```

#### unknown (2)

Line 15:
```
-     	   	   	[K_Q] [K_W] [K_E] [K_R] [K_T] [K_Y] [K_U] [K_I] [K_O] [K_P]  \
+ store(commonPunctuation) U+0060 U+007E U+0021 U+0040 U+0023 U+0024
```
Line 17:
```
-     	   	   	[K_A] [K_S] [K_D] [K_F] [K_G] [K_H] [K_J] [K_K] [K_L] [K_COLON] [K_QUOTE]  \
+ begin Unicode > use(main)
```

#### modifier_format (1)

Line 19:
```
-     	   	   	[K_Z] [K_X] [K_C] [K_V] [K_B] [K_N] [K_M] [K_COMMA] [K_PERIOD] [K_EQUAL] [K_HYPHEN] [SHIFT K_HYPHEN]
+ group(main) using keys
```

### sil_lisu_standard

- Original lines: 34
- Roundtrip lines: 23
- Identical: 4
- Different: 30

#### line_added (4)

Line 1:
```
- ﻿
+ c Converted from LDML keyboard: und
```
Line 3:
```
- 
+ store(&NAME) 'Lisu Standard (SIL)'
```
Line 13:
```
- 
+ begin Unicode > use(main)
```
Line 15:
```
- 
+ group(main) using keys
```

#### comment_removed (4)

Line 2:
```
- c 0.2   switch to use 02CD and 02D7
+ 
```
Line 6:
```
- c HOTKEY "^+L"
+ store(&VERSION) '10.0'
```
Line 8:
```
- c store(&ETHNOLOGUECODE) 'lis atb lbc lpo nxq'
+ 
```
Line 33:
```
- c + any(banned) > index(banned, 1)
+ 
```

#### store_reordered (6)

Line 4:
```
- store(&VERSION) "9.0"
+ store(&KEYBOARDVERSION) '1.0.0'
```
Line 5:
```
- store(&NAME) "Lisu Standard (SIL)"
+ store(&COPYRIGHT) '© SIL International'
```
Line 9:
```
- store(&COPYRIGHT) '© SIL International'
+ store(baseK) "QWERTYUIOPqwertyuiopASDFHJKL:asdfghjkl;''"
```
Line 10:
```
- store(&KEYBOARDVERSION) '1.0.0'
+ store(base) "Q" U+25AA "<>" U+0023 U+A4FB U+2605 U+A4FE U+02D7 U+005E
```
Line 11:
```
- store(&BITMAP) 'sil_lisu_standard.ico'
+ store(banned) "G="
```
... and 1 more

#### store_format (1)

Line 7:
```
- store(&TARGETS) 'web desktop'
+ store(&TARGETS) 'any'
```

#### line_removed (13)

Line 12:
```
- store(&VISUALKEYBOARD) 'sil_lisu_standard.kvks'
+ 
```
Line 14:
```
- begin Unicode > use(Main)
+ 
```
Line 16:
```
- store(baseK)    "QWERTYUIOP" "qwertyuiop" "ASDFHJKL:" "asdfghjkl;'" \
+ 
```
Line 17:
```
-                 "ZXCVBNM<>" "zxcvbnm,." "!@#$%^&*()" "1234567890-"
+ 
```
Line 19:
```
-                 U+A4F1 U+A4EA U+A4F0 U+A4E3 U+A4D4 U+A4EC U+A4F4 U+A4F2 U+A4F3 U+A4D1 \
+ 
```
... and 8 more

#### unknown (2)

Line 20:
```
-                 U+0040 U+2022 U+0028 U+0029 U+A4FF U+A4FD U+A4FC U+02CD U+A4FA \
+ group(transforms)
```
Line 22:
```
-                 U+201C U+201D U+0026 U+0025 U+0024 U+002A U+0021 U+A4F9 U+A4F8 \
+ 'ZXCVBNM<' > '   '
```

### sil_lpo_plrd

- Original lines: 90
- Roundtrip lines: 13
- Identical: 3
- Different: 87

#### unknown (4)

Line 1:
```
- ﻿c 
+ c Converted from LDML keyboard: und
```
Line 3:
```
- c 
+ store(&NAME) 'Lipo (SIL)'
```
Line 5:
```
- c              
+ store(&COPYRIGHT) '© 2014-2020 SIL International'
```
Line 6:
```
- c
+ store(&VERSION) '10.0'
```

#### comment_removed (3)

Line 2:
```
- c Sample Keyboard: Lipo Unicode
+ 
```
Line 4:
```
- c Provided by: Modified from David Morse' legacy keyboard by Erich Fickle
+ store(&KEYBOARDVERSION) '1.1'
```
Line 7:
```
- c Fonts: 
+ store(&TARGETS) 'any'
```

#### line_removed (78)

Line 8:
```
- c
+ 
```
Line 10:
```
- store(&VERSION) '10.0'
+ 
```
Line 12:
```
- store(&TARGETS) 'web desktop'
+ 
```
Line 13:
```
- store(&COPYRIGHT) '© 2014-2020 SIL International'
+ 
```
Line 14:
```
- store(&KEYBOARDVERSION) '1.1'
+ 
```
... and 73 more

#### line_added (1)

Line 9:
```
- 
+ begin Unicode > use(main)
```

#### store_reordered (1)

Line 11:
```
- store(&NAME) 'Lipo (SIL)'
+ group(main) using keys
```

### sil_madi

- Original lines: 183
- Roundtrip lines: 160
- Identical: 9
- Different: 174

#### comment_removed (10)

Line 1:
```
- ﻿c sil_madi generated from template at 2021-02-22 10:37:51
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c with name "Ma'di"
+ 
```
Line 112:
```
- c touch longpress to reveal vowel with diacritics - small letters
+ + [T_O_ACUTE] > 'ó'
```
Line 131:
```
- c touch longpress to reveal vowel with diacritics - capital letters
+ + [T_I_CIRCUMFLEX_CAPS] > 'Î'
```
Line 150:
```
- c rota - press / once to get acute, twice circumflex, thrice tilde and again to go back to acute
+ ̣(any(toneMarks)).. > index(toneMarks,1) '.'
```
... and 5 more

#### store_reordered (8)

Line 3:
```
- store(&VERSION) '10.0'
+ store(&NAME) 'Ma&apos;'
```
Line 4:
```
- store(&NAME) 'Ma' U+0027 'di (SIL)'
+ store(&KEYBOARDVERSION) '1.0'
```
Line 6:
```
- store(&KEYBOARDVERSION) '1.0'
+ store(&VERSION) '10.0'
```
Line 9:
```
- store(&LAYOUTFILE) 'sil_madi.keyman-touch-layout'
+ store(vowels) "aeiouAEIOU"
```
Line 10:
```
- store(&BITMAP) 'sil_madi.ico'
+ store(xKeys) "[K_X]  [SHIFT  K_X]"
```
... and 3 more

#### line_removed (19)

Line 8:
```
- store(&VISUALKEYBOARD) 'sil_madi.kvks'
+ 
```
Line 12:
```
- store(&CasedKeys) [K_A] .. [K_Z]
+ 
```
Line 14:
```
- begin Unicode > use(main)
+ 
```
Line 16:
```
- group(main) using keys
+ 
```
Line 139:
```
- + [T_e_circumflex_caps] > U+0045 U+0302
+ 
```
... and 14 more

#### line_added (11)

Line 13:
```
- 
+ begin Unicode > use(main)
```
Line 15:
```
- 
+ group(main) using keys
```
Line 111:
```
- 
+ + [T_I_ACUTE] > 'í'
```
Line 118:
```
- 
+ + [T_U_CIRCUMFLEX] > 'û'
```
Line 124:
```
- 
+ + [T_A_ACUTE_CAPS] > 'Á'
```
... and 6 more

#### rule_format (126)

Line 17:
```
- + [SHIFT K_Q] > nul
+ + [K_BKQUOTE] > '`'
```
Line 18:
```
- + [SHIFT K_W] > 'W'
+ + [K_1] > '1'
```
Line 19:
```
- + [SHIFT K_E] > 'E'
+ + [K_2] > '2'
```
Line 20:
```
- + [SHIFT K_R] > 'R'
+ + [K_3] > '3'
```
Line 21:
```
- + [SHIFT K_T] > 'T'
+ + [K_4] > '4'
```
... and 121 more

### sil_makuri

- Original lines: 264
- Roundtrip lines: 197
- Identical: 9
- Different: 255

#### comment_removed (9)

Line 1:
```
- ﻿c Keyman keyboard generated by ImportKeyboard
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c Imported: 2020-06-19 14:39:24
+ 
```
Line 4:
```
- c Source Keyboard File: Makuri.dll
+ store(&KEYBOARDVERSION) '1.0.1'
```
Line 5:
```
- c Source KeyboardID: a0010456
+ store(&COPYRIGHT) '© 2020 SIL International'
```
Line 7:
```
- c Normal Latin Keyboard with ë/Ë available via longpressing e and
+ store(&TARGETS) 'any'
```
... and 4 more

#### unknown (3)

Line 3:
```
- c 
+ store(&NAME) 'Makuri (SIL)'
```
Line 6:
```
- c 
+ store(&VERSION) '10.0'
```
Line 9:
```
- c 
+ begin Unicode > use(main)
```

#### line_added (45)

Line 11:
```
- 
+ group(main) using keys
```
Line 20:
```
- 
+ + [K_7] > '7'
```
Line 22:
```
- 
+ + [K_9] > '9'
```
Line 24:
```
- 
+ + [K_HYPHEN] > '-'
```
Line 26:
```
- 
+ + [K_Q] > '̞'
```
... and 40 more

#### line_removed (59)

Line 12:
```
- store(&VERSION) '10.0'
+ 
```
Line 198:
```
- + [K_SLASH] > U+002f
+ 
```
Line 199:
```
- + [SHIFT K_SLASH] > U+003f
+ 
```
Line 201:
```
- + [K_BKQUOTE] > U+0060
+ 
```
Line 202:
```
- + [SHIFT K_BKQUOTE] > U+007e
+ 
```
... and 54 more

#### store_reordered (7)

Line 13:
```
- store(&NAME) 'Makuri (SIL)'
+ + [K_BKQUOTE] > '`'
```
Line 14:
```
- store(&BITMAP) 'makuri.ico'
+ + [K_1] > '1'
```
Line 15:
```
- store(&LAYOUTFILE) 'sil_makuri.keyman-touch-layout'
+ + [K_2] > '2'
```
Line 16:
```
- store(&COPYRIGHT) '© 2020 SIL International'
+ + [K_3] > '3'
```
Line 17:
```
- store(&KEYBOARDVERSION) '1.0.1'
+ + [K_4] > '4'
```
... and 2 more

#### group_structure (2)

Line 21:
```
- begin Unicode > use(main)
+ + [K_8] > '8'
```
Line 23:
```
- group(main) using keys
+ + [K_0] > '0'
```

#### rule_format (130)

Line 25:
```
- + [K_SPACE] > U+0020
+ + [K_EQUAL] > '='
```
Line 27:
```
- + [K_0] > U+0030
+ + [K_W] > 'w'
```
Line 28:
```
- + [SHIFT K_0] > U+0029
+ + [K_E] > 'e'
```
Line 30:
```
- + [K_1] > U+0031
+ + [K_T] > 't'
```
Line 31:
```
- + [SHIFT K_1] > U+0021
+ + [K_Y] > 'y'
```
... and 125 more

### sil_mali_azerty

- Original lines: 222
- Roundtrip lines: 102
- Identical: 21
- Different: 201

#### store_reordered (35)

Line 1:
```
- ﻿store(&VERSION) '9.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '© SIL Mali'
+ store(&NAME) 'Clavier du Mali (Azerty)'
```
Line 4:
```
- store(&NAME) 'Clavier du Mali (Azerty)'
+ store(&KEYBOARDVERSION) '3.3.2'
```
Line 5:
```
- store(&HotKey ) "[K_F11]"
+ store(&COPYRIGHT) '© SIL Mali'
```
Line 7:
```
- store(&VISUALKEYBOARD) 'sil_mali_azerty.kvks'
+ store(&TARGETS) 'any'
```
... and 30 more

#### line_removed (90)

Line 2:
```
- store(&BITMAP) 'sil_mali_azerty.ico'
+ 
```
Line 8:
```
- store(&KEYBOARDVERSION) '3.3.2'
+ 
```
Line 57:
```
- store(CompositeCirc)   "Â" "Ê" U+00CE U+00D4 U+00DB "â" U+00EA U+00EE U+00F4 U+00FB
+ 
```
Line 59:
```
- store(CompositeDrsis)  "Ä" "Ë" U+00CF U+00D6 U+00DC "ä" U+00EB U+00EF U+00F6 U+00FC 
+ 
```
Line 61:
```
- store(CompositeCaron)  "Ǎ" "Ě" "Ǐ" "Ǒ" "Ǔ" "ǎ" "ě" "ǐ" "ǒ" "ǔ" 
+ 
```
... and 85 more

#### comment_removed (45)

Line 6:
```
- c store(&mnemoniclayout) "0"
+ store(&VERSION) '10.0'
```
Line 13:
```
- c The basic keyboard was done by Doug Higby for Burkina Faso.
+ store(CircK) '9'
```
Line 14:
```
- c This was modified by Dan Brubaker in November 2007 and Jan, Oct 2008, Sept 2017.
+ store(DrsisK) '='
```
Line 15:
```
- c All characters are composed as much as practical i.e. one single character  instead of two.
+ store(MacronK) '8'
```
Line 16:
```
- c The following 2 stores are used with the group(angleit) near the bottom of this table.
+ store(TildeK) '2'
```
... and 40 more

#### line_added (11)

Line 10:
```
- 
+ store(greaterthan) "[SHIFT  K_oE2]  ">""
```
Line 12:
```
- 
+ store(GraveK) '4'
```
Line 19:
```
- 
+ store(toneK) "$GraveK    $AcuteK  $CircK    $DrsisK  \\"
```
Line 32:
```
- 
+ store(CompositeMacron) "ĀĒĪŌŪāēīōū"
```
Line 37:
```
- 
+ store(Uspecchar1) "»ƁÇƊƐ"
```
... and 6 more

#### group_structure (1)

Line 11:
```
- begin Unicode > use(Main)
+ store(AcuteK) '5'
```

#### unknown (19)

Line 31:
```
-              $MacronK $CaronK $DotUnderK
+ store(CompositeDrsis) "ÄË" U+00CF U+00D6 U+00DC
```
Line 74:
```
-                     U+004F U+0186 U+0055 U+01B2 U+004E U+014A \
+ '«' > ' '
```
Line 75:
```
-                     U+019D U+004D U+0061 U+0065 U+01DD U+025B \
+ 'µ' > '»'
```
Line 76:
```
-                     U+0069 U+0269 U+006F U+0254 U+0075 U+028B \
+ '»' > ' '
```
Line 77:
```
-                     "n" U+014B U+0272 "m" "S" "s" "Z" "z" "W" "w" \
+ '+' > '—'
```
... and 14 more

### sil_mali_qwerty

- Original lines: 302
- Roundtrip lines: 165
- Identical: 12
- Different: 290

#### store_reordered (43)

Line 1:
```
- ﻿store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '© SIL International'
+ store(&NAME) 'Clavier du Mali (Qwerty)'
```
Line 4:
```
- store(&NAME) 'Clavier du Mali (Qwerty)'
+ store(&KEYBOARDVERSION) '4.0.2'
```
Line 5:
```
- store(&TARGETS) 'any'
+ store(&COPYRIGHT) '© SIL International'
```
Line 6:
```
- store(&VISUALKEYBOARD) 'sil_mali_qwerty.kvks'
+ store(&VERSION) '10.0'
```
... and 38 more

#### line_removed (127)

Line 2:
```
- store(&BITMAP) 'sil_mali_qwerty.ico'
+ 
```
Line 8:
```
- store(&LAYOUTFILE) 'sil_mali_qwerty.keyman-touch-layout'
+ 
```
Line 50:
```
- store(CompositeAcute)  "Á" "É" U+00CD U+00D3 U+00DA "á" U+00E9 U+00ED U+00F3 U+00FA 
+ 
```
Line 52:
```
- store(CompositeCirc)   "Â" "Ê" U+00CE U+00D4 U+00DB "â" U+00EA U+00EE U+00F4 U+00FB
+ 
```
Line 54:
```
- store(CompositeDrsis)  "Ä" "Ë" U+00CF U+00D6 U+00DC "ä" U+00EB U+00EF U+00F6 U+00FC 
+ 
```
... and 122 more

#### line_added (23)

Line 9:
```
- 
+ store(lessthan) "[K_oE2]  "<""
```
Line 11:
```
- 
+ store(AcuteK) '/'
```
Line 17:
```
- 
+ store(CaronK) '&'
```
Line 20:
```
- 
+ store(VerticalLineUnderK) '+'
```
Line 32:
```
- 
+ store(CompositeMacron) "ĀĒĪŌŪāēīōū"
```
... and 18 more

#### group_structure (2)

Line 10:
```
- begin Unicode > use(Main)
+ store(greaterthan) "[SHIFT  K_oE2]  ">""
```
Line 119:
```
- group(Main) using keys
+ '!1⅞' > '⅛'
```

#### comment_removed (44)

Line 12:
```
- c The basic keyboard was done by Doug Higby for Burkina Faso + Tones over nasals
+ store(GraveK) '\\'
```
Line 13:
```
- c This was modified by Dan Brubaker in January 2008, Oct 2017 and Feb 2020
+ store(CircK) '^'
```
Line 14:
```
- c All characters are composed as much as practical i.e. one single character  instead of two.
+ store(DrsisK) '%'
```
Line 15:
```
- c All composed sequences were added by Dan Brubaker in November 2007
+ store(MacronK) '='
```
Line 16:
```
- c The following 2 stores are used with the group(angleit) near the bottom of this table
+ store(TildeK) '#'
```
... and 39 more

#### unknown (21)

Line 34:
```
-                 $DotUnderK $LineUnderK $VerticalLineUnderK               
+ store(CompositeDotUnder) "ẠẸỊỌỤ" U+1EA1 U+1EB9 U+1ECB U+1ECD U+1EE5
```
Line 68:
```
-                     U+004F U+0186 U+0055 U+01B2 U+004E U+014A \
+ (any(LatinVowel)) > index(CompositeDotUnder,1)
```
Line 69:
```
-                     U+019D U+004D U+0061 U+0065 U+01DD U+025B \
+ '‹' > '«'
```
Line 70:
```
-                     U+0069 U+0269 U+006F U+0254 U+0075 U+028B \
+ '«' > ' '
```
Line 71:
```
-                     U+006E U+014B U+0272 U+006D U+0053 U+0073 \
+ '›' > '»'
```
... and 16 more

#### rule_format (30)

Line 122:
```
- "," + any(specchar1K) > index(Uspecchar1,2)
+ '!7⅞' > '⅞'
```
Line 124:
```
- any(Umodifiable) + any(modifierK) > context index(Umodifier,2) use(Udiacritics) use(NFC)
+ '!g͡b' > '®'
```
Line 127:
```
- any(CompositeAcute) + [K_BKSP] > index(LatinVowel,1)
+ '!±' > '±'
```
Line 128:
```
- any(CompositeGrave) + [K_BKSP] > index(LatinVowel,1)
+ '!Ø' > 'Ø'
```
Line 129:
```
- any(CompositeDrsis) + [K_BKSP] > index(LatinVowel,1)
+ '!÷' > '÷'
```
... and 25 more

### sil_mali_qwertz

- Original lines: 262
- Roundtrip lines: 122
- Identical: 22
- Different: 240

#### store_reordered (43)

Line 1:
```
- ﻿store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '© SIL Mali'
+ store(&NAME) 'Clavier du Mali (Qwertz)'
```
Line 4:
```
- store(&NAME) 'Clavier du Mali (Qwertz)'
+ store(&KEYBOARDVERSION) '3.3.2'
```
Line 5:
```
- store(&HotKey ) "[K_F11]"
+ store(&COPYRIGHT) '© SIL Mali'
```
Line 9:
```
- store(&VISUALKEYBOARD) 'sil_mali_qwertz.kvks'
+ store(lessthan) "[K_oE2]  "<""
```
... and 38 more

#### line_removed (110)

Line 2:
```
- store(&BITMAP) 'sil_mali_qwertz.ico'
+ 
```
Line 8:
```
- store(&MESSAGE) 'Pour toutes les langues au Mali, Afrique de l’Ouest, avec clavier allemand (Deutsch).'
+ 
```
Line 48:
```
- store(German)   'z' 'Z' 'y' 'Y' '§' '&' '/' '(' ')' '=' '?' '´' '`' \
+ 
```
Line 50:
```
-                 '°' "'" "ä" 'Ä' '"'         
+ 
```
Line 52:
```
- store(LatinVowel)      "AEIOUaeiou"
+ 
```
... and 105 more

#### comment_removed (46)

Line 6:
```
- c store(&mnemoniclayout) "0"
+ store(&VERSION) '10.0'
```
Line 7:
```
- c store(&ETHNOLOGUECODE) 'bam bmq bzx bze boo boz dba dbu dtt dux ffm jow mwk myk spp khq ses snk taq kao fra fuc fuf'
+ store(&TARGETS) 'any'
```
Line 15:
```
- c The basic keyboard was done by Doug Higby for Burkina Faso
+ store(MacronK) ')'
```
Line 16:
```
- c This was modified by Dan Brubaker in 2014.
+ store(TildeK) '$'
```
Line 17:
```
- c All characters are composed as much as practical i.e. one single character instead of two.
+ store(CaronK) '('
```
... and 41 more

#### line_added (16)

Line 12:
```
- 
+ store(AcuteK) '='
```
Line 14:
```
- 
+ store(DrsisK) '%'
```
Line 22:
```
- 
+ store(German) "zZyY§&/()=?´`"
```
Line 32:
```
- 
+ store(CapSchwa) 'Ǝ'
```
Line 35:
```
- 
+ store(Composite) "outs(CompositeAcute)    outs(CompositeGrave)  \\"
```
... and 11 more

#### group_structure (2)

Line 13:
```
- begin Unicode > use(Main)
+ store(CircK) '`'
```
Line 120:
```
- group(Main) using keys             
+ '!5⅞' > '⅝'
```

#### unknown (23)

Line 46:
```
-                 '[' ']' '{' '}' ';' ':' '<' '>' '/' '?' '\' '-' '`' \
+ store(Utone) "$UAcute    $UGrave  $UCirc  $UDrsis  \\"
```
Line 47:
```
-                 '~' "|" "'" '"' '@'
+ store(Umodifier) "$UGrave  $UAcute  $UCirc  $UDrsis  $UMacron  $UTilde  $UCaron  $UDotUnder"
```
Line 49:
```
-                 'ü' '+' 'Ü' '*' 'ö' 'Ö' ';' ':' '-' '_' '#' 'ß' '^' \
+ begin Unicode > use(main)
```
Line 79:
```
-                     U+004F U+0186 U+0055 U+01B2 U+004E U+014A \
+ 'qu' > 'qu’'
```
Line 80:
```
-                     U+019D U+004D U+0061 U+0065 U+0259 U+025B \
+ 'quń' > 'qu’'
```
... and 18 more

### sil_moore

- Original lines: 116
- Roundtrip lines: 61
- Identical: 16
- Different: 100

#### comment_removed (11)

Line 1:
```
- ﻿c sil_moore generated from template at 2020-09-10 14:46:23
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c with name "Mooré - Burkina Faso"
+ 
```
Line 4:
```
- c Mooré keyboard for Burkina Faso
+ store(&KEYBOARDVERSION) '2.0.1'
```
Line 14:
```
- c store(&CAPSONONLY) '1'
+ store(outs_1u) "azertyuiopĩ$"
```
Line 21:
```
- c Details from proposed keyboard map
+ store(keys_3u) "[K_oE2]  ''zxcvbnm''  [NCAPS  K_COMMA]  [NCAPS  K_PERIOD]  [NCAPS  K_SLASH]"
```
... and 6 more

#### unknown (1)

Line 3:
```
- c 
+ store(&NAME) 'Mooré - Burkina Faso'
```

#### store_reordered (26)

Line 5:
```
- store(&VERSION) '10.0'
+ store(&COPYRIGHT) '© 2006-2021 SIL International'
```
Line 6:
```
- store(&NAME) 'Mooré - Burkina Faso'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&COPYRIGHT) '© 2006-2021 SIL International'
+ store(&TARGETS) 'any'
```
Line 9:
```
- store(&TARGETS) 'web desktop'
+ store(keys_0u) "[NCAPS  K_1]  [NCAPS  K_2]  [NCAPS  K_3]  [NCAPS  K_4]  [NCAPS  K_5]  [NCAPS  K_6]  [NCAPS  K_7]  [NCAPS  K_8]  [NCAPS  K_9]  [NCAPS  K_0]  [NCAPS  K_HYPHEN]  [NCAPS  K_EQUAL]"
```
Line 10:
```
- store(&MESSAGE) 'With thanks to Emmanuel Sawadogo for linguistic expert advice'
+ store(outs_0u) "&ẽ"''(-ɛ_çà)="
```
... and 21 more

#### line_removed (41)

Line 8:
```
- store(&KEYBOARDVERSION) '2.0.1'
+ 
```
Line 42:
```
- store(outs_3u) '<'     'wɩʋvbn,;:!'
+ 
```
Line 44:
```
- store(keys_3s) [SHIFT K_oE2] 'Z' 'X'      'C'      'VBNM' [NCAPS SHIFT K_COMMA] [NCAPS SHIFT K_PERIOD] [NCAPS SHIFT K_SLASH] [CAPS K_COMMA] [CAPS K_PERIOD] [CAPS K_SLASH]
+ 
```
Line 54:
```
- + any(keys_0u) > index(outs_0u,1)
+ 
```
Line 56:
```
- + any(keys_0a) > index(outs_0a,1)
+ 
```
... and 36 more

#### line_added (15)

Line 12:
```
- 
+ store(outs_0s) "1234567890°+1234567890°+"
```
Line 16:
```
- 
+ store(outs_1s) "AZERTYUIOP"
```
Line 18:
```
- 
+ store(outs_2u) "ãsdfghõklmũ*"
```
Line 20:
```
- 
+ store(outs_2s) "dk(none)  ''SDFGH''  dk(none)  ''KLM%µ''    ''M%µ''"
```
Line 22:
```
- 
+ store(outs_3u) "<wɩʋvbn,;:!"
```
... and 10 more

#### group_structure (2)

Line 17:
```
- begin Unicode > use(main)
+ store(keys_2u) "asdfghjkl[NCAPS  K_COLON]  [NCAPS  K_QUOTE]  [NCAPS  K_BKSLASH]"
```
Line 19:
```
- group(main) using keys
+ store(keys_2s) "ASDFGHJKL[NCAPS  SHIFT  K_COLON]  [NCAPS  SHIFT  K_QUOTE]  [NCAPS  SHIFT  K_BKSLASH]  [CAPS  K_COLON]  [CAPS  K_QUOTE]  [CAPS  K_BKSLASH]"
```

#### rule_format (4)

Line 55:
```
- + any(keys_0s) > index(outs_0s,1)
+ match > use(transforms)
```
Line 57:
```
- + any(keys_1u) > index(outs_1u,1)
+ group(transforms)
```
Line 59:
```
- + any(keys_1a) > index(outs_1a,1)
+ dk(tilde)ñ > 'ñ'
```
Line 60:
```
- + any(keys_2u) > index(outs_2u,1)
+ dk(tilde)Ñ > 'Ñ'
```

### sil_myanmar_my3

- Original lines: 173
- Roundtrip lines: 67
- Identical: 30
- Different: 143

#### store_reordered (21)

Line 1:
```
- ﻿store(&VERSION) "9.0"
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&BITMAP) 'sil_myanmar_my3.ico'
+ store(&NAME) 'Myanmar3 (SIL)'
```
Line 4:
```
- store(&VISUALKEYBOARD) 'sil_myanmar_my3.kvks'
+ store(&KEYBOARDVERSION) '1.7.3'
```
Line 5:
```
- store(&capsalwaysoff) "1"
+ store(&COPYRIGHT) '© 2015-2021 SIL International'
```
Line 6:
```
- store(&TARGETS) 'any'
+ store(&VERSION) '10.0'
```
... and 16 more

#### line_removed (80)

Line 2:
```
- store(&NAME) "Myanmar3 (SIL)"
+ 
```
Line 8:
```
- store(&ETHNOLOGUECODE) 'mya'
+ 
```
Line 47:
```
- store(aftereU)  U+102B U+102C U+1037 U+1038
+ 
```
Line 49:
```
- store (aaK)     'gm'
+ 
```
Line 52:
```
- store (lDotK)   'h'
+ 
```
... and 75 more

#### line_added (12)

Line 11:
```
- 
+ store(addK) "<>]}"
```
Line 13:
```
- 
+ store(numK) "1234567890"
```
Line 25:
```
- 
+ store(consU) U+1000 U+1001 U+1002 U+1003 U+1005 U+1006 U+1007
```
Line 37:
```
- 
+ store(vowelEK) 'a'
```
Line 38:
```
- 
+ store(vowelEU) 'ေ'
```
... and 7 more

#### group_structure (1)

Line 12:
```
- begin Unicode > use(Main)
+ store(addU) U+104A U+104B U+1029 U+102A
```

#### unknown (24)

Line 15:
```
-                 'yuiop' \
+ store(aftereK) "gmh;"
```
Line 16:
```
-                 "[zxc"  \
+ store(aftereU) U+102B U+102C U+1037 U+1038
```
Line 17:
```
-                 "vbnQ" \
+ store(udia1K) "dD"
```
Line 18:
```
-                 "OP{AKL" \
+ store(udia1U) U+102D U+102E
```
Line 19:
```
-                 "ZXCVBNM" \
+ store(udia2K) "JH"
```
... and 19 more

#### comment_removed (5)

Line 120:
```
- c + '`' > dk(backquote)
+ 
```
Line 121:
```
- c dk(backquote) + any(baseK) > U+1039 index(baseu,2)
+ 
```
Line 134:
```
- c U+1037 + any(asatK)> index(asatU,2) U+1037
+ 
```
Line 171:
```
- c any(ScottVowel) + any(consU) > index(consU, 2) index(ScottVowel,1)
+ 
```
Line 172:
```
- c any(scott) + any(consU) > context(2) context(1)
+ 
```

### sil_myanmar_mywinext

- Original lines: 320
- Roundtrip lines: 126
- Identical: 30
- Different: 290

#### comment_removed (71)

Line 1:
```
- ﻿c Burmese Keyboard for Unicode Encoding. 
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c Derived from an original by MJP Hoskens (SIL)
+ 
```
Line 4:
```
- c This Layout has been designed to resemble that used by WinMyanmar Systems, 
+ store(&KEYBOARDVERSION) '1.4.1'
```
Line 5:
```
- c however, it is much simplified because of the advantages of Unicode
+ store(&COPYRIGHT) '(c) 2004-2022 SIl International'
```
Line 6:
```
- c technology. Some keys have changed as a result.
+ store(&VERSION) '10.0'
```
... and 66 more

#### unknown (25)

Line 3:
```
- c 
+ store(&NAME) 'myWin Extended (SIL)'
```
Line 7:
```
- c 
+ store(&TARGETS) 'any'
```
Line 12:
```
- c 
+ store(numU) U+1041 U+1042 U+1043 U+1044 U+1045 U+1046 U+1047 U+1048 U+1049
```
Line 54:
```
-                 'vbn,./' \
+ begin Unicode > use(main)
```
Line 56:
```
-                 'UIOP{A"' \
+ group(main) using keys
```
... and 20 more

#### line_added (16)

Line 25:
```
- 
+ store(numOrLetK) "078"
```
Line 26:
```
- 
+ store(numOrLetU) U+1040 U+1047 U+1048
```
Line 37:
```
- 
+ store(m1DiaK) 's'
```
Line 61:
```
-                 
+ group(transforms)
```
Line 71:
```
-                 
+ (any(numU))(any(numU))ဝါ > index(numU,1) index(numU,2) 'ါ'
```
... and 11 more

#### store_reordered (34)

Line 27:
```
- store(&version) "10.0"  
+ store(numAsLetU) U+101D U+101B U+1002
```
Line 28:
```
- store(&NAME) 'myWin Extended (SIL)'
+ store(sdiaK) "sjSG$%"
```
Line 30:
```
- store(&Copyright) "(c) 2004-2022 SIl International"
+ store(diaU) "outs(sdiaU)  outs(udiaU)  outs(lodiaU)  U+1031  U+1036"
```
Line 31:
```
- store(sil_myanmar_mywinext.ico)
+ store(ttatthaK) '|'
```
Line 32:
```
- store(&VISUALKEYBOARD) 'sil_myanmar_mywinext.kvks'
+ store(yDiaU) 'ျ'
```
... and 29 more

#### group_structure (1)

Line 38:
```
- begin Unicode > use(Main)
+ store(m2DiaK) "sj"
```

#### line_removed (143)

Line 53:
```
-                 "op['zxc"  \
+ 
```
Line 55:
```
-                 'WERTY' \
+ 
```
Line 57:
```
-                 'ZXCVBNM?' \
+ 
```
Line 58:
```
-                 '-=!@#^&' \
+ 
```
Line 60:
```
-                 '\]}<>`~'
+ 
```
... and 138 more

### sil_nigeria_dot

- Original lines: 202
- Roundtrip lines: 130
- Identical: 18
- Different: 184

#### comment_removed (28)

Line 1:
```
- ﻿c Nigeria Unicode Dot Keyboard
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c modified Feb 2010 to add nasality
+ 
```
Line 3:
```
- c modified Sept 2006 script a and g removed. No longer needed because of the Literacy fonts
+ store(&NAME) 'Nigeria Dot (SIL)'
```
Line 4:
```
- c Edited December 2005 (standardized for uploading to Tavultesoft and name changed from NBTT Unicode Dots Keyboard)
+ store(&KEYBOARDVERSION) '1.5'
```
Line 5:
```
- c Literacy alpha now dot below and alphabetic turned comma added
+ store(&COPYRIGHT) '2004-2018 SIL International'
```
... and 23 more

#### line_added (13)

Line 12:
```
- 
+ store(vAcute) "áéíóúÁÉÍÓÚ"
```
Line 16:
```
- 
+ store(vCaron) "ǎěǐǒǔǍĚǏǑǓ"
```
Line 23:
```
- 
+ store(nCaron) "ňŇ"
```
Line 26:
```
- 
+ begin Unicode > use(main)
```
Line 46:
```
- 
+ (any(vowel))̃̌ > index(vDot,1) '̃̌'
```
... and 8 more

#### store_reordered (20)

Line 13:
```
- store(&VERSION) '9.0'
+ store(vMid) "āēīōūĀĒĪŌŪ"
```
Line 14:
```
- store(&NAME) 'Nigeria Dot (SIL)'
+ store(vGrave) "àèìòùÀÈÌÒÙ"
```
Line 15:
```
- store(&BITMAP) 'sil_nigeria_dot.ico'
+ store(vCircum) "âêîôûÂÊÎÔÛ"
```
Line 17:
```
- store(&COPYRIGHT) '2004-2018 SIL International'
+ store(vDot) "ạẹịọụẠẸỊỌỤ"
```
Line 18:
```
- store(&ETHNOLOGUECODE) 'anc ann atg bom bzw enn gkn ibo iby igb ige ikw jbu yaz'
+ store(vNasal) "ãẽĩõũÃẼĨÕŨ"
```
... and 15 more

#### group_structure (2)

Line 24:
```
- begin Unicode	>	use(Main)
+ store(nNasal) "ñÑ"
```
Line 45:
```
- group(main) using keys      
+ (any(vowel))̃̂ > index(vDot,1) '̃̂'
```

#### line_removed (56)

Line 27:
```
- store(Let2BMod) "bcdhkmnyzBCDGKLMNXY$?*"      
+ 
```
Line 29:
```
- store(vowel)	"aeiouAEIOU"                       
+ 
```
Line 30:
```
- store(vAcute)	"áéíóúÁÉÍÓÚ"                      
+ 
```
Line 32:
```
- store(vGrave)	"àèìòùÀÈÌÒÙ"                       
+ 
```
Line 34:
```
- store(vCaron)	"ǎěǐǒǔǍĚǏǑǓ"   
+ 
```
... and 51 more

#### rule_format (65)

Line 50:
```
- + ";"	>  deadkey(modlet)     c applies to dotted vowels and letters to be modified, applies with a second deadkey to make a combo deadkey
+ 'U' > 'Ű'
```
Line 51:
```
- + "'"	>  deadkey(acute)
+ 'u' > 'ű'
```
Line 52:
```
- + "-"	>  deadkey(mid)
+ 'õ' > 'ṍ'
```
Line 53:
```
- + "`" 	>  deadkey(grave) 
+ 'Õ' > 'Ṍ'
```
Line 54:
```
- + "^"	>  deadkey(circum)
+ 'ũ' > 'ṹ'
```
... and 60 more

### sil_nigeria_odd_vowels

- Original lines: 161
- Roundtrip lines: 105
- Identical: 9
- Different: 152

#### comment_removed (23)

Line 1:
```
- ﻿c Nigeria Unicode Odd Vowels with Nasality Keyboard
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c modified Sept 2006 script a and g removed. No longer needed because of the Literacy fonts
+ 
```
Line 3:
```
- c modified Dec 2005 (standardized for uploading to Tavultesoft)
+ store(&NAME) 'Nigeria Odd Vowels (SIL)'
```
Line 4:
```
- c This keyboard adds nasality to the standard Nigeria Odd Vowels keyboard. This 
+ store(&KEYBOARDVERSION) '1.5'
```
Line 5:
```
- c limits keystroke flexibility and is not offered unless specifically needed.                 
+ store(&COPYRIGHT) '2004-2018 SIL International'
```
... and 18 more

#### line_added (11)

Line 10:
```
-    
+ store(ModLet) "ɓçɗɦƙɲŋƴʒƁÇƊɣƘ£ƝŊƎƳ₦ʔ°"
```
Line 11:
```
- 
+ store(vowel) "aeiouAEIOU"
```
Line 15:
```
- 
+ store(vCircum) "âêîôûÂÊÎÔÛ"
```
Line 22:
```
- 
+ store(LetN) "nN"
```
Line 41:
```
-  
+ 'Õ' > 'Ṍ'
```
... and 6 more

#### store_reordered (20)

Line 12:
```
- store(&VERSION) '9.0'
+ store(vAcute) "áéíóúÁÉÍÓÚ"
```
Line 13:
```
- store(&NAME) 'Nigeria Odd Vowels (SIL)'
+ store(vMid) "āēīōūĀĒĪŌŪ"
```
Line 14:
```
- store(&BITMAP) 'sil_nigeria_odd_vowels.ico'
+ store(vGrave) "àèìòùÀÈÌÒÙ"
```
Line 16:
```
- store(&COPYRIGHT) '2004-2018 SIL International'
+ store(vCaron) "ǎěǐǒǔǍĚǏǑǓ"
```
Line 17:
```
- store(&ETHNOLOGUECODE) 'agc bqp bwr cky hbb hia hig idu jen kby kez mbu sur'
+ store(vNasal) "ãẽĩõũÃẼĨÕŨ"
```
... and 15 more

#### group_structure (2)

Line 23:
```
- begin Unicode	>	use(Main)
+ store(nGrave) "ǹǸ"
```
Line 42:
```
- group(main) using keys      
+ 'ũ' > 'ṹ'
```

#### line_removed (49)

Line 26:
```
- store(vowel)	"aeiouAEIOU"                       
+ 
```
Line 28:
```
- store(vMid)	"āēīōūĀĒĪŌŪ"                      
+ 
```
Line 30:
```
- store(vCircum)	"âêîôûÂÊÎÔÛ"                      
+ 
```
Line 31:
```
- store(vCaron)	"ǎěǐǒǔǍĚǏǑǓ"
+ 
```
Line 33:
```
- store(Vowel2BMod)	"eiouwEIOUW"
+ 
```
... and 44 more

#### rule_format (47)

Line 45:
```
- + ";"	> deadkey(modlet)     c applies to vowels and let2bmod
+ 'ʻʻ' > ''''
```
Line 46:
```
- + "'"	> deadkey(acute)
+ dk(mid)dk(oddNasalMid) > '-'
```
Line 47:
```
- + "-"	> deadkey(mid)
+ dk(grave)dk(oddNasalGrave) > '`'
```
Line 48:
```
- + "`"	> deadkey(grave) 
+ dk(circum)dk(oddNasalCircum) > '^'
```
Line 49:
```
- + "^"	> deadkey(circum)
+ dk(caron)dk(oddNasalCaron) > '&'
```
... and 42 more

### sil_nigeria_underline

- Original lines: 207
- Roundtrip lines: 132
- Identical: 18
- Different: 189

#### comment_removed (25)

Line 1:
```
- ﻿c Nigeria Unicode Underline Nasal Keyboard
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c modified Oct 2006 Nasality Added for Duya [ldb]
+ 
```
Line 3:
```
- c modified Sept 2006 script a (literacy alpha) and g removed. No longer needed because of the Literacy fonts
+ store(&NAME) 'Nigeria Underline (SIL)'
```
Line 4:
```
- c below modifications included in Nigeria Unicode Underline.kmn so this keyboard is archived
+ store(&KEYBOARDVERSION) '1.5'
```
Line 5:
```
- c modified Nov 2005 to provide underlined alpha and alphabetic turned comma
+ store(&COPYRIGHT) '2004-2018 SIL International'
```
... and 20 more

#### line_added (16)

Line 11:
```
- 
+ store(vowel) "aeiouAEIOU"
```
Line 15:
```
- 
+ store(vCircum) "âêîôûÂÊÎÔÛ"
```
Line 22:
```
- 
+ store(nCaron) "ňŇ"
```
Line 40:
```
- 
+ 'o̱' > 'ő̱'
```
Line 41:
```
- 
+ 'U̱' > 'Ű̱'
```
... and 11 more

#### store_reordered (19)

Line 12:
```
- store(&VERSION) '9.0'
+ store(vAcute) "áéíóúÁÉÍÓÚ"
```
Line 13:
```
- store(&NAME) 'Nigeria Underline (SIL)'
+ store(vMid) "āēīōūĀĒĪŌŪ"
```
Line 14:
```
- store(&BITMAP) 'sil_nigeria_underline.ico'
+ store(vGrave) "àèìòùÀÈÌÒÙ"
```
Line 16:
```
- store(&COPYRIGHT) '2004-2018 SIL International'
+ store(vCaron) "ǎěǐǒǔǍĚǏǑǓ"
```
Line 17:
```
- store(&ETHNOLOGUECODE) 'ank bys iri kad kaj kcg kdl ldb lnu tiv'
+ store(vNasal) "ãẽĩõũÃẼĨÕŨ"
```
... and 14 more

#### group_structure (2)

Line 23:
```
- begin Unicode		>	use(Main)
+ store(nNasal) "ñÑ"
```
Line 42:
```
- group(main) using keys      
+ 'u̱' > 'ű̱'
```

#### line_removed (58)

Line 26:
```
- store(ModLet)       "ɓçɗɦƙɲŋƴʒƁÇƊɣƘ£ƝŊƎƳ₦ʔ°"      
+ 
```
Line 28:
```
- store(vAcute)       "áéíóúÁÉÍÓÚ"                      
+ 
```
Line 29:
```
- store(vMid)         "āēīōūĀĒĪŌŪ"                      
+ 
```
Line 31:
```
- store(vCircum)      "âêîôûÂÊÎÔÛ"                      
+ 
```
Line 33:
```
- store(vNasal)   	"ãẽĩõũÃẼĨÕŨ"                     
+ 
```
... and 53 more

#### rule_format (69)

Line 47:
```
- + ";"	> deadkey(modlet)     c applies to vowels and let2bmod
+ 'õ' > 'ȭ'
```
Line 48:
```
- + "'"   > deadkey(acute)
+ 'Õ' > 'Ȭ'
```
Line 49:
```
- + "-"   > deadkey(mid)
+ 'õ̱' > 'ṍ̱'
```
Line 50:
```
- + "`"   > deadkey(grave) 
+ 'Õ̱' > 'Ṍ̱'
```
Line 51:
```
- + "^"   > deadkey(circum)
+ 'ũ̱' > 'ṹ̱'
```
... and 64 more

### sil_nko

- Original lines: 80
- Roundtrip lines: 32
- Identical: 16
- Different: 64

#### store_reordered (13)

Line 1:
```
- ﻿store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '© SIL International'
+ store(&NAME) 'N&apos;'
```
Line 5:
```
- store(&TARGETS) 'any'
+ store(&COPYRIGHT) '© SIL International'
```
Line 6:
```
- store(&VISUALKEYBOARD) 'sil_nko.kvks'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&LAYOUTFILE) 'sil_nko.keyman-touch-layout'
+ store(&TARGETS) 'any'
```
... and 8 more

#### line_removed (37)

Line 2:
```
- store(&NAME) 'N' U+0027 'Ko (SIL)'
+ 
```
Line 8:
```
- store(&KMW_RTL) '1'
+ 
```
Line 29:
```
- store(nkoTone) U+07EB U+07Ec U+07Ed      U+07Ee      U+07Ef      U+07f0      U+07f1      U+07F4 U+07F5 
+ 
```
Line 31:
```
- store(diacKey) [K_X]  [SHIFT K_Z]
+ 
```
Line 32:
```
- store(nkoDiac) U+07F2 U+07F3 
+ 
```
... and 32 more

#### line_added (5)

Line 10:
```
- 
+ store(nkoDigit) U+07C0 U+07C1 U+07C2 U+07C3 U+07C4 U+07C5 U+07C6 U+07C7 U+07C8 U+07C9
```
Line 12:
```
- 
+ store(nkoLetter) U+07CA U+07CB U+07CC U+07CD U+07CE U+07CF
```
Line 15:
```
- 
+ store(ToneKey) "[K_N]    [K_B]    [SHIFT  K_C]  [SHIFT  K_V]  [SHIFT  K_N]  [SHIFT  K_B]  [SHIFT  K_X]  [K_V]    [K_C]"
```
Line 24:
```
- 
+ store(nkoCurrency) U+07FE U+07FF
```
Line 30:
```
- 
+ group(main) using keys
```

#### group_structure (1)

Line 11:
```
- begin Unicode > use(main)
+ store(letterKey) "[K_H]    [K_G]    [K_F]    [K_D]    [K_S]    [K_A]  \\"
```

#### modifier_format (2)

Line 17:
```
-                   [K_Z]  [SHIFT K_M]  [K_RBRKT] [K_QUOTE] [K_Q] [K_COLON] [K_J] [K_U] [K_PERIOD] [K_Y] \
+ store(diacKey) "[K_X]    [SHIFT  K_Z]"
```
Line 18:
```
-                   [SHIFT K_G] [K_COMMA] [K_I] [K_K] [K_SLASH] [K_M] \
+ store(nkoDiac) U+07F2 U+07F3
```

#### unknown (4)

Line 19:
```
-                   [K_E]  [K_P]  [K_O]  [K_L] [K_LBRKT] [K_R] [K_T] [K_W]
+ store(ExtrasKey) "[SHIFT  K_A]  [SHIFT  K_H]  [SHIFT  K_L]"
```
Line 21:
```
-                   U+07D0 U+07D1 U+07D2 U+07D3 U+07D4 U+07D5 U+07D6 U+07D7 U+07D8 U+07D9 \ 
+ store(PunctKey) "[SHIFT  K_J]  [K_BKSLASH]  [SHIFT  K_BKSLASH]"
```
Line 22:
```
-                   U+07Da U+07Db U+07Dc U+07Dd U+07De U+07Df \
+ store(nkoPunct) U+07F7 U+07F8 U+07F9
```
Line 23:
```
-                   U+07e0 U+07e1 U+07e2 U+07e3 U+07e4 U+07e5 U+07e6 U+07e7
+ store(CurrencyKey) ":""
```

#### comment_removed (2)

Line 64:
```
- c digits
+ 
```
Line 67:
```
- c letters
+ 
```

### sil_nubian

- Original lines: 86
- Roundtrip lines: 73
- Identical: 8
- Different: 78

#### comment_removed (4)

Line 1:
```
- ﻿c sil_nubian.kmn
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c Author:   Lorna Evans
+ 
```
Line 3:
```
- c Date:     9-DEC-2016
+ store(&NAME) 'Nubian (SIL)'
```
Line 10:
```
- c store(&ETHNOLOGUECODE) 'fia dgl xnz'
+ 
```

#### store_reordered (6)

Line 4:
```
- store(&VERSION) '9.0'
+ store(&KEYBOARDVERSION) '1.2.5'
```
Line 5:
```
- store(&NAME) 'Nubian (SIL)'
+ store(&COPYRIGHT) '© SIL International'
```
Line 6:
```
- store(&BITMAP) 'sil_nubian.ico'
+ store(&VERSION) '10.0'
```
Line 9:
```
- store(&MESSAGE) "The SIL Nubian Unicode keyboard is distributed under The MIT License (MIT)."
+ begin Unicode > use(main)
```
Line 11:
```
- store(&KEYBOARDVERSION) '1.2.5'
+ group(main) using keys
```
... and 1 more

#### line_removed (12)

Line 8:
```
- store(&COPYRIGHT) '© SIL International'
+ 
```
Line 12:
```
- store(&VISUALKEYBOARD) 'sil_nubian.kvks'
+ 
```
Line 66:
```
- + [SHIFT K_V] > U+2C91
+ 
```
Line 68:
```
- + [SHIFT K_X] > U+2CAD
+ 
```
Line 73:
```
- + [SHIFT K_F] > dk(none)
+ 
```
... and 7 more

#### line_added (7)

Line 14:
```
- 
+ + [K_Q] > 'ⳣ'
```
Line 16:
```
- 
+ + [K_E] > 'ⲉ'
```
Line 17:
```
- 
+ + [K_R] > 'ⲣ'
```
Line 19:
```
- 
+ + [K_Y] > 'ⲓ̈'
```
Line 20:
```
- 
+ + [K_U] > 'ⲟⲩ'
```
... and 2 more

#### group_structure (2)

Line 15:
```
- begin Unicode > use(main)
+ + [K_W] > 'ⲱ'
```
Line 18:
```
- group(main) using keys
+ + [K_T] > 'ⲧ'
```

#### rule_format (47)

Line 21:
```
- + [K_A] > U+2C81
+ + [K_I] > 'ⲓ'
```
Line 22:
```
- + [K_B] > U+2C83
+ + [K_O] > 'ⲟ'
```
Line 23:
```
- + [K_C] > U+03ED
+ + [K_P] > 'ⲡ'
```
Line 24:
```
- + [K_D] > U+2C87
+ + [K_A] > 'ⲁ'
```
Line 25:
```
- + [K_E] > U+2C89
+ + [K_S] > 'ⲥ'
```
... and 42 more

### sil_pan_africa_positional

- Original lines: 464
- Roundtrip lines: 175
- Identical: 69
- Different: 395

#### comment_removed (68)

Line 1:
```
- c Created by Lorna A. Priest, SIL International
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c Any changes to be made should be able to be 
+ 
```
Line 3:
```
- c      made in the "stores" rather than in the rules
+ store(&NAME) 'Pan Africa Positional (SIL)'
```
Line 4:
```
- c This keyboard uses both "virtual keys" (ALT, CTRL) and deadkeys
+ store(&KEYBOARDVERSION) '1.1.1'
```
Line 5:
```
- c      and will only work on US keyboards
+ store(&COPYRIGHT) '© 2003-2019 SIL International'
```
... and 63 more

#### line_added (29)

Line 10:
```
- 
+ store(K_2) ']'
```
Line 18:
```
- 
+ store(KV_UC1) "[SHIFT  RALT  K_A]  [SHIFT  RALT  K_B]  [SHIFT  RALT  K_C]  [SHIFT  RALT  K_D]  \\"
```
Line 20:
```
- 
+ store(KV_lc2) "[LALT  K_E]              [LALT  K_R]              [LALT  K_S]  \\"
```
Line 25:
```
- 
+ store(UC2) U+018F U+2C64 U+01A9
```
Line 26:
```
- 
+ store(unused2) "abcdfghijklmnopquwxy"
```
... and 24 more

#### store_reordered (45)

Line 11:
```
- store(&VERSION) "10.0"
+ store(deadkeys_KV) "[LALT  K_SLASH]              [SHIFT  LALT  K_COMMA]      [SHIFT  LALT  K_PERIOD]  \\"
```
Line 12:
```
- store(&NAME) "Pan Africa Positional (SIL)"
+ store(deadkeys_K) "/<>"
```
Line 13:
```
- store(&BITMAP) 'sil_pan_africa_positional.ico'
+ store(deadkeys) U+002F "<>"
```
Line 14:
```
- store(&COPYRIGHT) '© 2003-2019 SIL International'
+ store(KV_lc1) "[RALT  K_A]              [RALT  K_B]              [RALT  K_C]              [RALT  K_D]  \\"
```
Line 15:
```
- store(&TARGETS) 'web desktop'
+ store(K_lc1) "abcd"
```
... and 40 more

#### group_structure (1)

Line 19:
```
- begin Unicode > use(MainU) 
+ store(UC1) U+2C6D U+0181 U+0187 U+018A
```

#### unknown (46)

Line 23:
```
-                 " If you wish to use NFD then you should go" \
+ store(KV_UC2) "[SHIFT  LALT  K_E]  [SHIFT  LALT  K_R]  [SHIFT  LALT  K_S]  \\"
```
Line 24:
```
-                 " through the keyboard and remove 'use(NFC)'"
+ store(K_UC2) "ERS"
```
Line 40:
```
-                    "@"               "["                       "]" \
+ store(DUvert) '̩'
```
Line 41:
```
-                    "^"               "_"                       "`" \
+ store(DUcircle) '̥'
```
Line 42:
```
-                    "{"               "|"                       "}" \
+ store(DUcedilla) '̧'
```
... and 41 more

#### modifier_format (18)

Line 35:
```
-                    [SHIFT LALT K_2]     [LALT K_LBRKT]         [LALT K_RBRKT] \
+ store(DAvert) '̍'
```
Line 36:
```
-                    [SHIFT LALT K_6]     [SHIFT LALT K_HYPHEN]  [LALT K_BKQUOTE] \
+ store(DAcircle) '̊'
```
Line 37:
```
-                    [SHIFT LALT K_LBRKT] [SHIFT LALT K_BKSLASH] [SHIFT LALT K_RBRKT] \
+ store(DUtilde) '̰'
```
Line 38:
```
-                    [SHIFT LALT K_BKQUOTE] 
+ store(DUmacron) '̱'
```
Line 62:
```
-                  [RALT K_E]       [RALT K_F]       [RALT K_G]       [RALT K_H] \
+ store(tildeU) U+1E1B U+1E1A U+1E2D U+1E2C U+1E75 U+1E74
```
... and 13 more

#### line_removed (188)

Line 119:
```
-                  [LALT K_T]       [LALT K_V]       [LALT K_Z]       
+ 
```
Line 175:
```
-                      outs(DAcircle) 
+ 
```
Line 181:
```
- store(K_diacritics2) "~"                    "_"                     "}" \
+ 
```
Line 182:
```
-                      "|"                    "@"                     ","  
+ 
```
Line 185:
```
- store(KV_dia2)       [SHIFT RALT K_BKQUOTE] [SHIFT RALT K_HYPHEN]   [RALT K_PERIOD] \
+ 
```
... and 183 more

### sil_senegal_bqj_azerty

- Original lines: 747
- Roundtrip lines: 401
- Identical: 27
- Different: 720

#### store_reordered (14)

Line 1:
```
- ﻿store(&VERSION) '15.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '©2023 SIL International'
+ store(&NAME) 'sil_senegal_bqj_azerty'
```
Line 4:
```
- store(&MESSAGE) 'Un clavier pour la langue «bqj:Bandial (Latin)», qui génère des caractères NFC Unicode.'
+ store(&KEYBOARDVERSION) '1.0.1'
```
Line 5:
```
- store(&VISUALKEYBOARD) 'sil_senegal_bqj_azerty.kvks'
+ store(&COPYRIGHT) '©2023 SIL International'
```
Line 6:
```
- store(&TARGETS) 'any'
+ store(&VERSION) '10.0'
```
... and 9 more

#### line_removed (197)

Line 2:
```
- store(&NAME) 'sil_senegal_bqj_azerty'
+ 
```
Line 8:
```
- store(&LAYOUTFILE) 'sil_senegal_bqj_azerty.keyman-touch-layout'
+ 
```
Line 14:
```
- store(&shiftfreescaps) "1"
+ 
```
Line 291:
```
- + [ALT CTRL K_RBRKT]	>	U+00a4
+ 
```
Line 293:
```
- + [T_currency]	>	U+00a4
+ 
```
... and 192 more

#### comment_removed (224)

Line 15:
```
- c Note three entry points, rather than the traditional single entry point
+ group(main) using keys
```
Line 21:
```
- c This tells Keyman compiler which keys should have casing behavior (CAPS/NCAPS) applied. NB only applies to default layer.
+ + [K_4] > ''''
```
Line 22:
```
- c With the following keys for azerty layout. Ctrl Alt keys need explicit caps/ncaps statements!
+ + [K_5] > '('
```
Line 26:
```
- c We'll define some useful stores here
+ + [K_9] > '« '
```
Line 27:
```
- c store(key) [K_A] .. [K_Z] [SHIFT K_A] .. [SHIFT K_Z]
+ + [K_0] > ' »'
```
... and 219 more

#### group_structure (7)

Line 17:
```
- begin Unicode > use(main)
+ + [K_BKQUOTE] > 'Ç'
```
Line 18:
```
- begin NewContext > use(NewContext)
+ + [K_1] > '&'
```
Line 19:
```
- begin PostKeystroke > use(PostKeystroke)
+ + [K_2] > 'é'
```
Line 33:
```
- group(NewContext) readonly
+ + [K_R] > 'r'
```
Line 39:
```
- group(PostKeystroke) readonly
+ + [K_P] > 'p'
```
... and 2 more

#### line_added (56)

Line 20:
```
- 
+ + [K_3] > '"'
```
Line 24:
```
- 
+ + [K_7] > '—'
```
Line 25:
```
- 
+ + [K_8] > '_'
```
Line 29:
```
- 
+ + [K_EQUAL] > '='
```
Line 32:
```
- 
+ + [K_E] > 'e'
```
... and 51 more

#### unknown (4)

Line 37:
```
-     nomatch > use(detectStartOfSentence)
+ + [K_I] > 'i'
```
Line 43:
```
-     if(&newLayer = "") if(&layer = 'numeric') any(digit) > context
+ + [K_A] > 'q'
```
Line 50:
```
-     if(&newLayer = "") > use(detectStartOfSentence)
+ + [K_K] > 'k'
```
Line 72:
```
-     nomatch > layer('default')
+ + [CTRL RALT K_4] > '{'
```

#### modifier_format (4)

Line 46:
```
-     if(&layer = 'caps') > context
+ + [K_F] > 'f'
```
Line 61:
```
-     nul > layer('shift')
+ + [K_COMMA] > ' ;'
```
Line 65:
```
-     any(sentencePunctuation) ' ' > layer('shift')
+ + [CAPS K_9] > '9'
```
Line 66:
```
-     any(sentencePunctuation) '  ' > layer('shift')
+ + [CTRL K_LBRKT] > ''
```

#### rule_format (214)

Line 79:
```
- + [K_BKQUOTE] > U+0060
+ + [CTRL RALT K_HYPHEN] > ']'
```
Line 80:
```
- + [SHIFT K_BKQUOTE]   >   U+a78c
+ + [CTRL RALT K_EQUAL] > '}'
```
Line 81:
```
- + [ALT CTRL K_BKQUOTE]   >   U+a78b
+ + [CTRL RALT K_Q] > 'ä'
```
Line 82:
```
- + [ALT CTRL SHIFT K_BKQUOTE]   >   U+a78c
+ + [CTRL RALT K_W] > 'å'
```
Line 83:
```
- + [SHIFT T_saltillo] > U+a78b
+ + [CTRL RALT K_E] > '€'
```
... and 209 more

### sil_senegal_bsc_azerty

- Original lines: 589
- Roundtrip lines: 363
- Identical: 10
- Different: 579

#### store_reordered (7)

Line 1:
```
- ﻿store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '©2021-2023 SIL International'
+ store(&NAME) 'sil_senegal_bsc_azerty'
```
Line 4:
```
- store(&MESSAGE) 'Un clavier pour la langue «bsc-sn:Oniyan-SN», qui génère des caractères NFC Unicode.'
+ store(&KEYBOARDVERSION) '1.0.2'
```
Line 5:
```
- store(&KEYBOARDVERSION) '1.0.2'
+ store(&COPYRIGHT) '©2021-2023 SIL International'
```
Line 6:
```
- store(&VISUALKEYBOARD) 'sil_senegal_bsc_azerty.kvks'
+ store(&VERSION) '10.0'
```
... and 2 more

#### line_removed (146)

Line 2:
```
- store(&NAME) 'sil_senegal_bsc_azerty'
+ 
```
Line 8:
```
- store(&LAYOUTFILE) 'sil_senegal_bsc_azerty.keyman-touch-layout'
+ 
```
Line 10:
```
- store(&kmw_helptext) '<p><a href=welcome/welcome.htm#en rel=help target=_new>in English</a>, <a href=welcome/welcome.htm#fr rel=help target=_new>en fran&#x00E7;ais</a>, <a href=welcome/welcome.htm#pt rel=help target=_new>em portugu&#x00EA;s </a></p>'
+ 
```
Line 243:
```
- + [K_QUOTE]	>	 U+00b4
+ 
```
Line 245:
```
- + [ALT CTRL K_QUOTE]	>	U+003c
+ 
```
... and 141 more

#### group_structure (2)

Line 13:
```
- begin Unicode > use(SGGBFR74)
+ + [K_BKQUOTE] > 'Ç'
```
Line 15:
```
- group(SGGBFR74) using keys
+ + [K_2] > 'é'
```

#### line_added (55)

Line 14:
```
- 
+ + [K_1] > '&'
```
Line 19:
```
- 
+ + [K_6] > '-'
```
Line 26:
```
- 
+ + [K_Q] > 'a'
```
Line 29:
```
- 
+ + [K_R] > 'r'
```
Line 35:
```
- 
+ + [K_P] > 'p'
```
... and 50 more

#### comment_removed (139)

Line 16:
```
- c setup deadkeys
+ + [K_3] > '"'
```
Line 17:
```
- c simple deadkeys
+ + [K_4] > ''''
```
Line 18:
```
- c setup 'simple' keys
+ + [K_5] > '('
```
Line 21:
```
- c + [SHIFT K_BKQUOTE]   >   U+a78c
+ + [K_8] > '_'
```
Line 22:
```
- c + [ALT CTRL K_BKQUOTE]   >   U+a78b
+ + [K_9] > '«'
```
... and 134 more

#### rule_format (230)

Line 20:
```
- + [K_BKQUOTE] > U+0060
+ + [K_7] > '—'
```
Line 27:
```
- + [K_1]	>	U+0026
+ + [K_W] > 'z'
```
Line 28:
```
- + [SHIFT K_1]	>	U+0031
+ + [K_E] > 'e'
```
Line 30:
```
- + [K_2]	>	U+00e9
+ + [K_T] > 't'
```
Line 31:
```
- + [SHIFT K_2]	>	U+0032
+ + [K_Y] > 'y'
```
... and 225 more

### sil_senegal_cou_azerty

- Original lines: 623
- Roundtrip lines: 363
- Identical: 14
- Different: 609

#### store_reordered (8)

Line 1:
```
- ﻿store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '©2021-2023 SIL International'
+ store(&NAME) 'sil_senegal_cou_azerty'
```
Line 4:
```
- store(&MESSAGE) 'Un clavier pour la langue «cou:Konyagi, Wamey (Latin)», qui génère des caractères NFC Unicode.'
+ store(&KEYBOARDVERSION) '1.0.3'
```
Line 5:
```
- store(&VISUALKEYBOARD) 'sil_senegal_cou_azerty.kvks'
+ store(&COPYRIGHT) '©2021-2023 SIL International'
```
Line 6:
```
- store(&TARGETS) 'any'
+ store(&VERSION) '10.0'
```
... and 3 more

#### line_removed (146)

Line 2:
```
- store(&NAME) 'sil_senegal_cou_azerty'
+ 
```
Line 8:
```
- store(&LAYOUTFILE) 'sil_senegal_cou_azerty.keyman-touch-layout'
+ 
```
Line 10:
```
- store(&KMW_RTL) '0'
+ 
```
Line 246:
```
- + [ALT CTRL K_K]	>	U+0153
+ 
```
Line 250:
```
- + [SHIFT K_L]	>	U+004c
+ 
```
... and 141 more

#### group_structure (2)

Line 13:
```
- begin Unicode > use(SGGBFR74)
+ + [K_BKQUOTE] > '›'
```
Line 15:
```
- group(SGGBFR74) using keys
+ + [K_2] > 'é'
```

#### line_added (53)

Line 14:
```
- 
+ + [K_1] > '&'
```
Line 19:
```
- 
+ + [K_6] > '-'
```
Line 26:
```
- 
+ + [K_Q] > 'a'
```
Line 33:
```
- 
+ + [K_I] > 'i'
```
Line 39:
```
- 
+ + [K_A] > 'q'
```
... and 48 more

#### comment_removed (172)

Line 16:
```
- c setup deadkeys
+ + [K_3] > '"'
```
Line 17:
```
- c simple deadkeys
+ + [K_4] > ''''
```
Line 18:
```
- c setup 'simple' keys
+ + [K_5] > '('
```
Line 29:
```
- c + [ALT CTRL K_1]	>	U+1d7d
+ + [K_R] > 'r'
```
Line 30:
```
- c + [ALT CTRL SHIFT K_1]	>	 U+2c63
+ + [K_T] > 't'
```
... and 167 more

#### rule_format (228)

Line 20:
```
- + [K_BKQUOTE] > U+0060
+ + [K_7] > '—'
```
Line 21:
```
- + [SHIFT K_BKQUOTE]   >   U+a78c
+ + [K_8] > '_'
```
Line 22:
```
- + [ALT CTRL K_BKQUOTE]   >   U+a78b
+ + [K_9] > '«'
```
Line 23:
```
- + [ALT CTRL SHIFT K_BKQUOTE]   >   U+a78c
+ + [K_0] > '»'
```
Line 24:
```
- + [SHIFT T_saltillo] > U+a78b
+ + [K_HYPHEN] > ')'
```
... and 223 more

### sil_senegal_cou_qwerty

- Original lines: 770
- Roundtrip lines: 420
- Identical: 31
- Different: 739

#### store_reordered (14)

Line 1:
```
- ﻿store(&NAME) 'sil_senegal_cou_qwerty'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&MESSAGE) 'Un clavier pour la langue «cou:Konyagi, Wamey (Latin)», qui génère des caractères NFC Unicode.'
+ store(&NAME) 'sil_senegal_cou_qwerty'
```
Line 4:
```
- store(&VISUALKEYBOARD) 'sil_senegal_cou_qwerty.kvks'
+ store(&KEYBOARDVERSION) '1.1.2'
```
Line 5:
```
- store(&TARGETS) 'any'
+ store(&COPYRIGHT) '©2021-2023 SIL International'
```
Line 6:
```
- store(&KEYBOARDVERSION) '1.1.2'
+ store(&VERSION) '10.0'
```
... and 9 more

#### line_removed (202)

Line 2:
```
- store(&COPYRIGHT) '©2021-2023 SIL International'
+ 
```
Line 14:
```
- store(&shiftfreescaps) "1"
+ 
```
Line 298:
```
- + [K_A]	>	U+0061
+ 
```
Line 302:
```
- + [ALT CTRL NCAPS K_A]    >   U+00e1
+ 
```
Line 422:
```
- + [ALT CTRL NCAPS K_N]	>	U+00f1
+ 
```
... and 197 more

#### comment_removed (219)

Line 15:
```
- c Note three entry points, rather than the traditional single entry point
+ group(main) using keys
```
Line 21:
```
- c This tells Keyman compiler which keys should have casing behavior (CAPS/NCAPS) applied. NB only applies to default layer.
+ + [K_4] > '4'
```
Line 22:
```
- c With the following keys for azerty layout. Ctrl Alt keys need explicit caps/ncaps statements!
+ + [K_5] > '5'
```
Line 26:
```
- c We'll define some useful stores here
+ + [K_9] > '9'
```
Line 27:
```
- c store(key) [K_A] .. [K_Z] [SHIFT K_A] .. [SHIFT K_Z]
+ + [K_0] > '0'
```
... and 214 more

#### group_structure (7)

Line 17:
```
- begin Unicode > use(main)
+ + [K_BKQUOTE] > '‘'
```
Line 18:
```
- begin NewContext > use(NewContext)
+ + [K_1] > '1'
```
Line 19:
```
- begin PostKeystroke > use(PostKeystroke)
+ + [K_2] > '2'
```
Line 33:
```
- group(NewContext) readonly
+ + [K_R] > 'r'
```
Line 39:
```
- group(PostKeystroke) readonly
+ + [K_P] > 'p'
```
... and 2 more

#### line_added (60)

Line 20:
```
- 
+ + [K_3] > '3'
```
Line 24:
```
- 
+ + [K_7] > '7'
```
Line 25:
```
- 
+ + [K_8] > '8'
```
Line 29:
```
- 
+ + [K_EQUAL] > '='
```
Line 32:
```
- 
+ + [K_E] > 'e'
```
... and 55 more

#### unknown (4)

Line 37:
```
-     nomatch > use(detectStartOfSentence)
+ + [K_I] > 'i'
```
Line 43:
```
-     if(&newLayer = "") if(&layer = 'numeric') any(digit) > context
+ + [K_A] > 'a'
```
Line 50:
```
-     if(&newLayer = "") > use(detectStartOfSentence)
+ + [K_K] > 'k'
```
Line 72:
```
-     nomatch > layer('default')
+ + [CTRL RALT K_9] > '‘'
```

#### modifier_format (4)

Line 46:
```
-     if(&layer = 'caps') > context
+ + [K_F] > 'f'
```
Line 61:
```
-     nul > layer('shift')
+ + [K_COMMA] > ','
```
Line 65:
```
-     any(sentencePunctuation) ' ' > layer('shift')
+ + [CTRL K_LBRKT] > ''
```
Line 66:
```
-     any(sentencePunctuation) '  ' > layer('shift')
+ + [CTRL K_RBRKT] > ''
```

#### rule_format (229)

Line 81:
```
- + [NCAPS K_BKQUOTE] > U+0060
+ + [CTRL RALT K_Y] > 'ü'
```
Line 82:
```
- + [SHIFT NCAPS K_BKQUOTE]   >   U+007e
+ + [CTRL RALT K_U] > 'ú'
```
Line 83:
```
- + [ALT CTRL NCAPS K_BKQUOTE]   >   U+a78c
+ + [CTRL RALT K_I] > 'í'
```
Line 84:
```
- + [ALT CTRL SHIFT CAPS K_BKQUOTE]   >   U+a78c
+ + [CTRL RALT K_O] > 'ó'
```
Line 85:
```
- + [ALT CTRL CAPS K_BKQUOTE]   >   U+a78b
+ + [CTRL RALT K_P] > 'ö'
```
... and 224 more

### sil_senegal_dyo_azerty

- Original lines: 612
- Roundtrip lines: 336
- Identical: 26
- Different: 586

#### store_reordered (8)

Line 1:
```
- ﻿store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '©2021-2023 SIL International'
+ store(&NAME) 'sil_senegal_dyo_azerty'
```
Line 4:
```
- store(&MESSAGE) 'Un clavier pour la langue «dyo:Jóola fóoñi, diola-fogny, Jola-Fonyi», qui génère des caractères NFC Unicode.'
+ store(&KEYBOARDVERSION) '1.0.1'
```
Line 5:
```
- store(&VISUALKEYBOARD) 'sil_senegal_dyo_azerty.kvks'
+ store(&COPYRIGHT) '©2021-2023 SIL International'
```
Line 6:
```
- store(&TARGETS) 'any'
+ store(&VERSION) '10.0'
```
... and 3 more

#### line_removed (140)

Line 2:
```
- store(&NAME) 'sil_senegal_dyo_azerty'
+ 
```
Line 8:
```
- store(&LAYOUTFILE) 'sil_senegal_dyo_azerty.keyman-touch-layout'
+ 
```
Line 10:
```
- store(&BITMAP) 'sil_senegal_dyo_azerty.ico'
+ 
```
Line 12:
```
- store(&kmw_helptext) '<p><a href=welcome/welcome.htm#en rel=help target=_new>in English</a>, <a href=welcome/welcome.htm#fr rel=help target=_new>en fran&#x00E7;ais</a>, <a href=welcome/welcome.htm#pt rel=help target=_new>em portugu&#x00EA;s </a></p>'
+ 
```
Line 231:
```
- + [K_G]	>	U+0067
+ 
```
... and 135 more

#### line_added (46)

Line 13:
```
- 
+ + [K_BKQUOTE] > 'Ç'
```
Line 15:
```
- 
+ + [K_2] > 'é'
```
Line 20:
```
- 
+ + [K_7] > '—'
```
Line 25:
```
- 
+ + [K_EQUAL] > '='
```
Line 32:
```
- 
+ + [K_U] > 'u'
```
... and 41 more

#### group_structure (2)

Line 14:
```
- begin Unicode > use(SGGBFR74)
+ + [K_1] > '&'
```
Line 16:
```
- group(SGGBFR74) using keys
+ + [K_3] > '"'
```

#### comment_removed (179)

Line 17:
```
- c setup deadkeys
+ + [K_4] > ''''
```
Line 18:
```
- c simple deadkeys
+ + [K_5] > '('
```
Line 19:
```
- c setup 'simple' keys
+ + [K_6] > '-'
```
Line 28:
```
- c + [ALT CTRL K_1]	>	U+1d7d
+ + [K_E] > 'e'
```
Line 29:
```
- c + [ALT CTRL SHIFT K_1]	>	 U+2c63
+ + [K_R] > 'r'
```
... and 174 more

#### rule_format (211)

Line 21:
```
- + [K_BKQUOTE] > U+0060
+ + [K_8] > '_'
```
Line 22:
```
- + [SHIFT K_BKQUOTE]   >   U+a78c
+ + [K_9] > '« '
```
Line 23:
```
- + [ALT CTRL K_BKQUOTE]   >   U+a78b
+ + [K_0] > ' »'
```
Line 24:
```
- + [ALT CTRL SHIFT K_BKQUOTE]   >   U+a78c
+ + [K_HYPHEN] > ')'
```
Line 26:
```
- + [K_1]	>	U+0026
+ + [K_Q] > 'a'
```
... and 206 more

### sil_senegal_gsl_azerty

- Original lines: 620
- Roundtrip lines: 343
- Identical: 14
- Different: 606

#### store_reordered (8)

Line 1:
```
- ﻿store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '©2021-2023 SIL International'
+ store(&NAME) 'sil_senegal_gsl_azerty'
```
Line 4:
```
- store(&MESSAGE) 'Un clavier pour la langue «gsl:Gusilay (Latin)», qui génère des caractères NFC Unicode.'
+ store(&KEYBOARDVERSION) '1.0.1'
```
Line 5:
```
- store(&VISUALKEYBOARD) 'sil_senegal_gsl_azerty.kvks'
+ store(&COPYRIGHT) '©2021-2023 SIL International'
```
Line 6:
```
- store(&TARGETS) 'any'
+ store(&VERSION) '10.0'
```
... and 3 more

#### line_removed (146)

Line 2:
```
- store(&NAME) 'sil_senegal_gsl_azerty'
+ 
```
Line 8:
```
- store(&LAYOUTFILE) 'sil_senegal_gsl_azerty.keyman-touch-layout'
+ 
```
Line 10:
```
- store(&BITMAP) 'sil_senegal_gsl_azerty.ico'
+ 
```
Line 12:
```
- store(&kmw_helptext) '<p><a href=welcome/welcome.htm#en rel=help target=_new>in English</a>, <a href=welcome/welcome.htm#fr rel=help target=_new>en fran&#x00E7;ais</a>, <a href=welcome/welcome.htm#pt rel=help target=_new>em portugu&#x00EA;s </a></p>'
+ 
```
Line 238:
```
- + [SHIFT K_H]	>	U+0048
+ 
```
... and 141 more

#### line_added (53)

Line 13:
```
- 
+ + [K_BKQUOTE] > 'Ç'
```
Line 15:
```
- 
+ + [K_2] > 'é'
```
Line 20:
```
- 
+ + [K_7] > '—'
```
Line 27:
```
- 
+ + [K_W] > 'z'
```
Line 34:
```
- 
+ + [K_O] > 'o'
```
... and 48 more

#### group_structure (2)

Line 14:
```
- begin Unicode > use(SGGBFR74)
+ + [K_1] > '&'
```
Line 16:
```
- group(SGGBFR74) using keys
+ + [K_3] > '"'
```

#### comment_removed (188)

Line 17:
```
- c setup deadkeys
+ + [K_4] > ''''
```
Line 18:
```
- c simple deadkeys
+ + [K_5] > '('
```
Line 19:
```
- c setup 'simple' keys
+ + [K_6] > '-'
```
Line 30:
```
- c + [ALT CTRL K_1]	>	U+1d7d
+ + [K_T] > 't'
```
Line 31:
```
- c + [ALT CTRL SHIFT K_1]	>	 U+2c63
+ + [K_Y] > 'y'
```
... and 183 more

#### rule_format (209)

Line 21:
```
- + [K_BKQUOTE] > U+0060
+ + [K_8] > '_'
```
Line 22:
```
- + [SHIFT K_BKQUOTE]   >   U+a78c
+ + [K_9] > '« '
```
Line 23:
```
- + [ALT CTRL K_BKQUOTE]   >   U+a78b
+ + [K_0] > ' »'
```
Line 24:
```
- + [ALT CTRL SHIFT K_BKQUOTE]   >   U+a78c
+ + [K_HYPHEN] > ')'
```
Line 25:
```
- + [SHIFT T_saltillo] > U+a78b
+ + [K_EQUAL] > '='
```
... and 204 more

### sil_senegal_knf_azerty

- Original lines: 737
- Roundtrip lines: 402
- Identical: 26
- Different: 711

#### store_reordered (14)

Line 1:
```
- ﻿store(&VERSION) '15.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '©2023 SIL International'
+ store(&NAME) 'sil_senegal_knf_azerty'
```
Line 4:
```
- store(&MESSAGE) 'Un clavier pour la langue «knf:Mankanya (Latin)», qui génère des caractères NFC Unicode.'
+ store(&KEYBOARDVERSION) '1.0.1'
```
Line 5:
```
- store(&VISUALKEYBOARD) 'sil_senegal_knf_azerty.kvks'
+ store(&COPYRIGHT) '©2023 SIL International'
```
Line 6:
```
- store(&TARGETS) 'any'
+ store(&VERSION) '10.0'
```
... and 9 more

#### line_removed (180)

Line 2:
```
- store(&NAME) 'sil_senegal_knf_azerty'
+ 
```
Line 8:
```
- store(&LAYOUTFILE) 'sil_senegal_knf_azerty.keyman-touch-layout'
+ 
```
Line 14:
```
- store(&shiftfreescaps) "1"
+ 
```
Line 294:
```
- + [ALT CTRL K_BKSLASH]	>	U+00a2
+ 
```
Line 296:
```
- + [T_cent]	>	U+00a2
+ 
```
... and 175 more

#### comment_removed (217)

Line 15:
```
- c Note three entry points, rather than the traditional single entry point
+ group(main) using keys
```
Line 21:
```
- c This tells Keyman compiler which keys should have casing behavior (CAPS/NCAPS) applied. NB only applies to default layer.
+ + [K_4] > ''''
```
Line 22:
```
- c With the following keys for azerty layout. Ctrl Alt keys need explicit caps/ncaps statements!
+ + [K_5] > '('
```
Line 26:
```
- c We'll define some useful stores here
+ + [K_9] > '« '
```
Line 27:
```
- c store(key) [K_A] .. [K_Z] [SHIFT K_A] .. [SHIFT K_Z]
+ + [K_0] > ' »'
```
... and 212 more

#### group_structure (7)

Line 17:
```
- begin Unicode > use(main)
+ + [K_BKQUOTE] > 'Ç'
```
Line 18:
```
- begin NewContext > use(NewContext)
+ + [K_1] > '&'
```
Line 19:
```
- begin PostKeystroke > use(PostKeystroke)
+ + [K_2] > 'é'
```
Line 33:
```
- group(NewContext) readonly
+ + [K_R] > 'r'
```
Line 39:
```
- group(PostKeystroke) readonly
+ + [K_P] > 'p'
```
... and 2 more

#### line_added (57)

Line 20:
```
- 
+ + [K_3] > '"'
```
Line 24:
```
- 
+ + [K_7] > '—'
```
Line 25:
```
- 
+ + [K_8] > '_'
```
Line 29:
```
- 
+ + [K_EQUAL] > '='
```
Line 32:
```
- 
+ + [K_E] > 'e'
```
... and 52 more

#### unknown (4)

Line 37:
```
-     nomatch > use(detectStartOfSentence)
+ + [K_I] > 'i'
```
Line 43:
```
-     if(&newLayer = "") if(&layer = 'numeric') any(digit) > context
+ + [K_A] > 'q'
```
Line 50:
```
-     if(&newLayer = "") > use(detectStartOfSentence)
+ + [K_K] > 'k'
```
Line 72:
```
-     nomatch > layer('default')
+ + [CTRL RALT K_4] > '{'
```

#### modifier_format (4)

Line 46:
```
-     if(&layer = 'caps') > context
+ + [K_F] > 'f'
```
Line 61:
```
-     nul > layer('shift')
+ + [K_COMMA] > ' ;'
```
Line 65:
```
-     any(sentencePunctuation) ' ' > layer('shift')
+ + [CAPS K_9] > '9'
```
Line 66:
```
-     any(sentencePunctuation) '  ' > layer('shift')
+ + [CTRL K_LBRKT] > ''
```

#### rule_format (228)

Line 79:
```
- + [K_BKQUOTE] > U+0060
+ + [CTRL RALT K_HYPHEN] > ']'
```
Line 80:
```
- + [SHIFT K_BKQUOTE]   >   U+a78c
+ + [CTRL RALT K_EQUAL] > '}'
```
Line 81:
```
- + [ALT CTRL K_BKQUOTE]   >   U+a78b
+ + [CTRL RALT K_Q] > 'ä'
```
Line 82:
```
- + [ALT CTRL SHIFT K_BKQUOTE]   >   U+a78c
+ + [CTRL RALT K_W] > 'å'
```
Line 83:
```
- + [SHIFT T_saltillo] > U+a78b
+ + [CTRL RALT K_E] > '€'
```
... and 223 more

### sil_senegal_krx_azerty

- Original lines: 599
- Roundtrip lines: 321
- Identical: 27
- Different: 572

#### store_reordered (8)

Line 1:
```
- ﻿store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '©2020-2023 SIL International'
+ store(&NAME) 'sil_senegal_krx_azerty'
```
Line 4:
```
- store(&MESSAGE) 'Un clavier pour la langue «krx:Karon (Latin)», qui génère des caractères NFC Unicode.'
+ store(&KEYBOARDVERSION) '1.0.1'
```
Line 5:
```
- store(&VISUALKEYBOARD) 'sil_senegal_krx_azerty.kvks'
+ store(&COPYRIGHT) '©2020-2023 SIL International'
```
Line 6:
```
- store(&TARGETS) 'any'
+ store(&VERSION) '10.0'
```
... and 3 more

#### line_removed (148)

Line 2:
```
- store(&NAME) 'sil_senegal_krx_azerty'
+ 
```
Line 8:
```
- store(&LAYOUTFILE) 'sil_senegal_krx_azerty.keyman-touch-layout'
+ 
```
Line 10:
```
- store(&BITMAP) 'sil_senegal_krx_azerty.ico'
+ 
```
Line 12:
```
- store(&kmw_helptext) '<p><a href=welcome/welcome.htm#en rel=help target=_new>in English</a>, <a href=welcome/welcome.htm#fr rel=help target=_new>en fran&#x00E7;ais</a>, <a href=welcome/welcome.htm#pt rel=help target=_new>em portugu&#x00EA;s </a></p>'
+ 
```
Line 216:
```
- + [T_cent]	>	U+00a2
+ 
```
... and 143 more

#### line_added (45)

Line 13:
```
- 
+ + [K_BKQUOTE] > 'Ç'
```
Line 15:
```
- 
+ + [K_2] > 'é'
```
Line 20:
```
- 
+ + [K_7] > '—'
```
Line 25:
```
- 
+ + [K_EQUAL] > '='
```
Line 32:
```
- 
+ + [K_U] > 'u'
```
... and 40 more

#### group_structure (2)

Line 14:
```
- begin Unicode > use(SGGBFR74)
+ + [K_1] > '&'
```
Line 16:
```
- group(SGGBFR74) using keys
+ + [K_3] > '"'
```

#### comment_removed (180)

Line 17:
```
- c setup deadkeys
+ + [K_4] > ''''
```
Line 18:
```
- c simple deadkeys
+ + [K_5] > '('
```
Line 19:
```
- c setup 'simple' keys
+ + [K_6] > '-'
```
Line 22:
```
- c + [SHIFT K_BKQUOTE]   >   U+a78c
+ + [K_9] > '«'
```
Line 23:
```
- c + [ALT CTRL K_BKQUOTE]   >   U+a78b
+ + [K_0] > '»'
```
... and 175 more

#### rule_format (189)

Line 21:
```
- + [K_BKQUOTE] > U+0060
+ + [K_8] > '_'
```
Line 26:
```
- + [K_1]	>	U+0026
+ + [K_Q] > 'a'
```
Line 27:
```
- + [SHIFT K_1]	>	U+0031
+ + [K_W] > 'z'
```
Line 33:
```
- + [K_2]	>	U+00e9
+ + [K_I] > 'i'
```
Line 34:
```
- + [SHIFT K_2]	>	U+0032
+ + [K_O] > 'o'
```
... and 184 more

### sil_senegal_krx_qwerty

- Original lines: 770
- Roundtrip lines: 421
- Identical: 28
- Different: 742

#### comment_removed (221)

Line 1:
```
- ﻿c Touch: 'symbol' layer added and symbols moved from 'other/others' layers. 'Eng' and 'N tilde' moved from long press to 'default/shift/caps' layers', 'right single quote' moved to 'other/others/othercaps' layers.
+ c Converted from LDML keyboard: und
```
Line 16:
```
- c Note three entry points, rather than the traditional single entry point
+ 
```
Line 22:
```
- c This tells Keyman compiler which keys should have casing behavior (CAPS/NCAPS) applied. NB only applies to default layer.
+ + [K_5] > '5'
```
Line 23:
```
- c With the following keys for azerty layout. Ctrl Alt keys need explicit caps/ncaps statements!
+ + [K_6] > '6'
```
Line 27:
```
- c We'll define some useful stores here
+ + [K_0] > '0'
```
... and 216 more

#### line_removed (204)

Line 2:
```
- store(&NAME) 'sil_senegal_krx_qwerty'
+ 
```
Line 8:
```
- store(&LAYOUTFILE) 'sil_senegal_krx_qwerty.keyman-touch-layout'
+ 
```
Line 12:
```
- store(&kmw_helptext) '<p><a href=welcome/welcome.htm#en rel=help target=_new>in English</a>, <a href=welcome/welcome.htm#fr rel=help target=_new>en fran&#x00E7;ais</a>, <a href=welcome/welcome.htm#pt rel=help target=_new>em portugu&#x00EA;s </a></p>'
+ 
```
Line 14:
```
- store(&capsononly) "1"
+ 
```
Line 301:
```
- + [ALT CTRL SHIFT CAPS K_A]    >   U+00e1
+ 
```
... and 199 more

#### store_reordered (12)

Line 3:
```
- store(&COPYRIGHT) '©2021-2023 SIL International'
+ store(&NAME) 'sil_senegal_krx_qwerty'
```
Line 4:
```
- store(&MESSAGE) 'Un clavier pour la langue «krx:Karon (Latin)», qui génère des caractères NFC Unicode.'
+ store(&KEYBOARDVERSION) '1.1.0'
```
Line 5:
```
- store(&VISUALKEYBOARD) 'sil_senegal_krx_qwerty.kvks'
+ store(&COPYRIGHT) '©2021-2023 SIL International'
```
Line 6:
```
- store(&TARGETS) 'any'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&KEYBOARDVERSION) '1.1.0'
+ store(&TARGETS) 'any'
```
... and 7 more

#### line_added (62)

Line 9:
```
- 
+ store(caps) 'A'
```
Line 13:
```
- 
+ begin Unicode > use(main)
```
Line 17:
```
- 
+ + [K_BKQUOTE] > '‘'
```
Line 21:
```
- 
+ + [K_4] > '4'
```
Line 25:
```
- 
+ + [K_8] > '8'
```
... and 57 more

#### group_structure (7)

Line 18:
```
- begin Unicode > use(main)
+ + [K_1] > '1'
```
Line 19:
```
- begin NewContext > use(NewContext)
+ + [K_2] > '2'
```
Line 20:
```
- begin PostKeystroke > use(PostKeystroke)
+ + [K_3] > '3'
```
Line 34:
```
- group(NewContext) readonly
+ + [K_T] > 't'
```
Line 40:
```
- group(PostKeystroke) readonly
+ + [K_LBRKT] > 'Ŋ'
```
... and 2 more

#### unknown (4)

Line 38:
```
-     nomatch > use(detectStartOfSentence)
+ + [K_O] > 'o'
```
Line 44:
```
-     if(&newLayer = "") if(&layer = 'numeric') any(digit) > context
+ + [K_S] > 's'
```
Line 51:
```
-     if(&newLayer = "") > use(detectStartOfSentence)
+ + [K_L] > 'l'
```
Line 73:
```
-     nomatch > layer('default')
+ + [CTRL RALT K_0] > '’'
```

#### modifier_format (4)

Line 47:
```
-     if(&layer = 'caps') > context
+ + [K_G] > 'g'
```
Line 62:
```
-     nul > layer('shift')
+ + [K_PERIOD] > '.'
```
Line 66:
```
-     any(sentencePunctuation) ' ' > layer('shift')
+ + [CTRL K_RBRKT] > ''
```
Line 67:
```
-     any(sentencePunctuation) '  ' > layer('shift')
+ + [CTRL K_BKSLASH] > ''
```

#### rule_format (228)

Line 82:
```
- + [NCAPS K_BKQUOTE] > U+0060
+ + [CTRL RALT K_U] > 'ú'
```
Line 83:
```
- + [SHIFT NCAPS K_BKQUOTE]   >   U+007e
+ + [CTRL RALT K_I] > 'í'
```
Line 84:
```
- + [ALT CTRL NCAPS K_BKQUOTE]   >   U+a78c
+ + [CTRL RALT K_O] > 'ó'
```
Line 85:
```
- + [ALT CTRL SHIFT CAPS K_BKQUOTE]   >   U+a78c
+ + [CTRL RALT K_P] > 'ö'
```
Line 86:
```
- + [ALT CTRL CAPS K_BKQUOTE]   >   U+a78b
+ + [CTRL RALT K_LBRKT] > '«'
```
... and 223 more

### sil_senegal_ndv_azerty

- Original lines: 603
- Roundtrip lines: 364
- Identical: 13
- Different: 590

#### store_reordered (7)

Line 1:
```
- ﻿store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '©2021-2023 SIL International'
+ store(&NAME) 'sil_senegal_ndv_azerty'
```
Line 4:
```
- store(&MESSAGE) 'Un clavier pour la langue «ndv:Ndút, Ndut (Latin)», qui génère des caractères NFC Unicode.'
+ store(&KEYBOARDVERSION) '1.0.1'
```
Line 5:
```
- store(&KEYBOARDVERSION) '1.0.1'
+ store(&COPYRIGHT) '©2021-2023 SIL International'
```
Line 6:
```
- store(&VISUALKEYBOARD) 'sil_senegal_ndv_azerty.kvks'
+ store(&VERSION) '10.0'
```
... and 2 more

#### line_removed (149)

Line 2:
```
- store(&NAME) 'sil_senegal_ndv_azerty'
+ 
```
Line 8:
```
- store(&LAYOUTFILE) 'sil_senegal_ndv_azerty.keyman-touch-layout'
+ 
```
Line 10:
```
- store(&kmw_helptext) '<p><a href=welcome/welcome.htm#en rel=help target=_new>in English</a>, <a href=welcome/welcome.htm#fr rel=help target=_new>en fran&#x00E7;ais</a>, <a href=welcome/welcome.htm#pt rel=help target=_new>em portugu&#x00EA;s </a></p>'
+ 
```
Line 249:
```
- + [K_QUOTE]	>	 U+00b4
+ 
```
Line 251:
```
- + [ALT CTRL K_QUOTE]	>	U+003c
+ 
```
... and 144 more

#### group_structure (2)

Line 13:
```
- begin Unicode > use(SGGBFR74)
+ + [K_BKQUOTE] > 'Ç'
```
Line 15:
```
- group(SGGBFR74) using keys
+ + [K_2] > 'é'
```

#### line_added (55)

Line 14:
```
- 
+ + [K_1] > '&'
```
Line 19:
```
- 
+ + [K_6] > '-'
```
Line 26:
```
- 
+ + [K_Q] > 'a'
```
Line 31:
```
- 
+ + [K_Y] > 'y'
```
Line 37:
```
- 
+ + [K_RBRKT] > '$'
```
... and 50 more

#### comment_removed (149)

Line 16:
```
- c setup deadkeys
+ + [K_3] > '"'
```
Line 17:
```
- c simple deadkeys
+ + [K_4] > ''''
```
Line 18:
```
- c setup 'simple' keys
+ + [K_5] > '('
```
Line 23:
```
- c + [ALT CTRL SHIFT K_BKQUOTE]   >   beep
+ + [K_0] > '»'
```
Line 29:
```
- c + [ALT CTRL K_1]	>	U+1d7d
+ + [K_R] > 'r'
```
... and 144 more

#### rule_format (228)

Line 20:
```
- + [K_BKQUOTE] > U+0060
+ + [K_7] > '—'
```
Line 21:
```
- + [SHIFT K_BKQUOTE]   >   U+a78c
+ + [K_8] > '_'
```
Line 22:
```
- + [ALT CTRL K_BKQUOTE]   >   U+a78b
+ + [K_9] > '«'
```
Line 24:
```
- + [SHIFT T_saltillo] > U+a78b
+ + [K_HYPHEN] > ')'
```
Line 25:
```
- + [T_saltillo] > U+a78c
+ + [K_EQUAL] > '='
```
... and 223 more

### sil_senegal_sav_azerty

- Original lines: 617
- Roundtrip lines: 362
- Identical: 14
- Different: 603

#### store_reordered (8)

Line 1:
```
- ﻿store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '©2022-2023 SIL International'
+ store(&NAME) 'sil_senegal_sav_azerty'
```
Line 4:
```
- store(&MESSAGE) 'Un clavier pour la langue «sav:Saaf-Saafi (Latin)», qui génère des caractères NFC Unicode.'
+ store(&KEYBOARDVERSION) '1.0.1'
```
Line 5:
```
- store(&VISUALKEYBOARD) 'sil_senegal_sav_azerty.kvks'
+ store(&COPYRIGHT) '©2022-2023 SIL International'
```
Line 6:
```
- store(&TARGETS) 'any'
+ store(&VERSION) '10.0'
```
... and 3 more

#### line_removed (145)

Line 2:
```
- store(&NAME) 'sil_senegal_sav_azerty'
+ 
```
Line 8:
```
- store(&LAYOUTFILE) 'sil_senegal_sav_azerty.keyman-touch-layout'
+ 
```
Line 10:
```
- store(&KMW_RTL) '0'
+ 
```
Line 248:
```
- + [ALT CTRL K_L]	>	U+00f8
+ 
```
Line 252:
```
- + [SHIFT K_COLON]	>	U+004d
+ 
```
... and 140 more

#### group_structure (2)

Line 13:
```
- begin Unicode > use(SGGBFR74)
+ + [K_BKQUOTE] > 'Ç'
```
Line 15:
```
- group(SGGBFR74) using keys
+ + [K_2] > 'é'
```

#### line_added (54)

Line 14:
```
- 
+ + [K_1] > '&'
```
Line 19:
```
- 
+ + [K_6] > '-'
```
Line 26:
```
- 
+ + [K_Q] > 'a'
```
Line 33:
```
- 
+ + [K_I] > 'i'
```
Line 38:
```
- 
+ + [K_BKSLASH] > '*'
```
... and 49 more

#### comment_removed (166)

Line 16:
```
- c setup deadkeys
+ + [K_3] > '"'
```
Line 17:
```
- c simple deadkeys
+ + [K_4] > ''''
```
Line 18:
```
- c setup 'simple' keys
+ + [K_5] > '('
```
Line 29:
```
- c + [ALT CTRL K_1]	>	U+1d7d
+ + [K_R] > 'r'
```
Line 30:
```
- c + [ALT CTRL SHIFT K_1]	>	 U+2c63
+ + [K_T] > 't'
```
... and 161 more

#### rule_format (228)

Line 20:
```
- + [K_BKQUOTE] > U+0060
+ + [K_7] > '—'
```
Line 21:
```
- + [SHIFT K_BKQUOTE]   >   U+a78c
+ + [K_8] > '_'
```
Line 22:
```
- + [ALT CTRL K_BKQUOTE]   >   U+a78b
+ + [K_9] > '« '
```
Line 23:
```
- + [ALT CTRL SHIFT K_BKQUOTE]   >   U+a78c
+ + [K_0] > ' »'
```
Line 24:
```
- + [SHIFT T_saltillo] > U+a78b
+ + [K_HYPHEN] > ')'
```
... and 223 more

### sil_senegal_snf_azerty

- Original lines: 608
- Roundtrip lines: 341
- Identical: 23
- Different: 585

#### store_reordered (7)

Line 1:
```
- ﻿store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '©2021-2023 SIL International'
+ store(&NAME) 'sil_senegal_snf_azerty'
```
Line 4:
```
- store(&MESSAGE) 'Un clavier pour la langue «snf:Noon (Latin)», qui génère des caractères NFC Unicode.'
+ store(&KEYBOARDVERSION) '1.0.1'
```
Line 5:
```
- store(&KEYBOARDVERSION) '1.0.1'
+ store(&COPYRIGHT) '©2021-2023 SIL International'
```
Line 6:
```
- store(&VISUALKEYBOARD) 'sil_senegal_snf_azerty.kvks'
+ store(&VERSION) '10.0'
```
... and 2 more

#### line_removed (146)

Line 2:
```
- store(&NAME) 'sil_senegal_snf_azerty'
+ 
```
Line 8:
```
- store(&LAYOUTFILE) 'sil_senegal_snf_azerty.keyman-touch-layout'
+ 
```
Line 10:
```
- store(&kmw_helptext) '<p><a href=welcome/welcome.htm#en rel=help target=_new>in English</a>, <a href=welcome/welcome.htm#fr rel=help target=_new>en fran&#x00E7;ais</a>, <a href=welcome/welcome.htm#pt rel=help target=_new>em portugu&#x00EA;s </a></p>'
+ 
```
Line 229:
```
- + [SHIFT K_J]	>	U+004a
+ 
```
Line 231:
```
- + [K_K]	>	U+006b
+ 
```
... and 141 more

#### group_structure (2)

Line 13:
```
- begin Unicode > use(SGGBFR74)
+ + [K_BKQUOTE] > 'Ç'
```
Line 15:
```
- group(SGGBFR74) using keys
+ + [K_2] > 'é'
```

#### line_added (57)

Line 14:
```
- 
+ + [K_1] > '&'
```
Line 19:
```
- 
+ + [K_6] > '-'
```
Line 26:
```
- 
+ + [K_W] > 'ë'
```
Line 29:
```
- 
+ + [K_T] > 't'
```
Line 35:
```
- 
+ + [K_LBRKT] > 'Û'
```
... and 52 more

#### comment_removed (165)

Line 16:
```
- c setup deadkeys
+ + [K_3] > '"'
```
Line 17:
```
- c simple deadkeys
+ + [K_4] > ''''
```
Line 18:
```
- c setup 'simple' keys
+ + [K_5] > '('
```
Line 21:
```
- c + [SHIFT K_BKQUOTE]   >   U+a78c
+ + [K_8] > '_'
```
Line 22:
```
- c + [ALT CTRL K_BKQUOTE]   >   U+a78b
+ + [K_9] > '«'
```
... and 160 more

#### rule_format (208)

Line 20:
```
- + [K_BKQUOTE] > U+0060
+ + [K_7] > '—'
```
Line 24:
```
- + [SHIFT T_saltillo] > U+a78b
+ + [K_EQUAL] > '='
```
Line 25:
```
- + [T_saltillo] > U+a78c
+ + [K_Q] > 'a'
```
Line 27:
```
- + [K_1]	>	U+0026
+ + [K_E] > 'e'
```
Line 28:
```
- + [SHIFT K_1]	>	U+0031
+ + [K_R] > 'r'
```
... and 203 more

### sil_senegal_srr_azerty

- Original lines: 601
- Roundtrip lines: 354
- Identical: 17
- Different: 584

#### store_reordered (7)

Line 1:
```
- ﻿store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '©2021-2023 SIL International'
+ store(&NAME) 'sil_senegal_srr_azerty'
```
Line 4:
```
- store(&MESSAGE) 'Un clavier pour la langue «srr:Seereer, sérère-sine, Serer-Sine (Latin)», qui génère des caractères NFC Unicode.'
+ store(&KEYBOARDVERSION) '1.0.1'
```
Line 5:
```
- store(&KEYBOARDVERSION) '1.0.1'
+ store(&COPYRIGHT) '©2021-2023 SIL International'
```
Line 6:
```
- store(&VISUALKEYBOARD) 'sil_senegal_srr_azerty.kvks'
+ store(&VERSION) '10.0'
```
... and 2 more

#### line_removed (155)

Line 2:
```
- store(&NAME) 'sil_senegal_srr_azerty'
+ 
```
Line 8:
```
- store(&LAYOUTFILE) 'sil_senegal_srr_azerty.keyman-touch-layout'
+ 
```
Line 10:
```
- store(&kmw_helptext) '<p><a href=welcome/welcome.htm#en rel=help target=_new>in English</a>, <a href=welcome/welcome.htm#fr rel=help target=_new>en fran&#x00E7;ais</a>, <a href=welcome/welcome.htm#pt rel=help target=_new>em portugu&#x00EA;s </a></p>'
+ 
```
Line 12:
```
- store(&KMW_RTL) '0'
+ 
```
Line 233:
```
- + [K_J]	>	U+006a
+ 
```
... and 150 more

#### line_added (60)

Line 13:
```
- 
+ + [K_BKQUOTE] > 'Ç'
```
Line 15:
```
- 
+ + [K_2] > 'é'
```
Line 20:
```
- 
+ + [K_7] > '—'
```
Line 27:
```
- 
+ + [K_W] > 'z'
```
Line 34:
```
- 
+ + [K_O] > 'o'
```
... and 55 more

#### group_structure (2)

Line 14:
```
- begin Unicode > use(SGGBFR74)
+ + [K_1] > '&'
```
Line 16:
```
- group(SGGBFR74) using keys
+ + [K_3] > '"'
```

#### comment_removed (142)

Line 17:
```
- c setup deadkeys
+ + [K_4] > ''''
```
Line 18:
```
- c simple deadkeys
+ + [K_5] > '('
```
Line 19:
```
- c setup 'simple' keys
+ + [K_6] > '-'
```
Line 24:
```
- c + [ALT CTRL SHIFT K_BKQUOTE]   >   beep
+ + [K_HYPHEN] > ')'
```
Line 30:
```
- c + [ALT CTRL K_1]	>	U+1d7d
+ + [K_T] > 't'
```
... and 137 more

#### rule_format (218)

Line 21:
```
- + [K_BKQUOTE] > U+0060
+ + [K_8] > '_'
```
Line 22:
```
- + [SHIFT K_BKQUOTE]   >   U+a78c
+ + [K_9] > '«'
```
Line 23:
```
- + [ALT CTRL K_BKQUOTE]   >   U+a78b
+ + [K_0] > '»'
```
Line 25:
```
- + [SHIFT T_saltillo] > U+a78b
+ + [K_EQUAL] > '='
```
Line 26:
```
- + [T_saltillo] > U+a78c
+ + [K_Q] > 'a'
```
... and 213 more

### sil_senegal_wo_azerty

- Original lines: 609
- Roundtrip lines: 369
- Identical: 20
- Different: 589

#### store_reordered (7)

Line 1:
```
- ﻿store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '©2020-2023 SIL International'
+ store(&NAME) 'sil_senegal_wo_azerty'
```
Line 4:
```
- store(&MESSAGE) 'Un clavier pour la langue «wo:Wolof (Latin)», qui génère des caractères NFC Unicode.'
+ store(&KEYBOARDVERSION) '1.0.1'
```
Line 5:
```
- store(&KEYBOARDVERSION) '1.0.1'
+ store(&COPYRIGHT) '©2020-2023 SIL International'
```
Line 6:
```
- store(&VISUALKEYBOARD) 'sil_senegal_wo_azerty.kvks'
+ store(&VERSION) '10.0'
```
... and 2 more

#### line_removed (152)

Line 2:
```
- store(&NAME) 'sil_senegal_wo_azerty'
+ 
```
Line 8:
```
- store(&LAYOUTFILE) 'sil_senegal_wo_azerty.keyman-touch-layout'
+ 
```
Line 10:
```
- store(&kmw_helptext) '<p><a href=welcome/welcome.htm#en rel=help target=_new>in English</a>, <a href=welcome/welcome.htm#fr rel=help target=_new>en fran&#x00E7;ais</a>, <a href=welcome/welcome.htm#pt rel=help target=_new>em portugu&#x00EA;s </a></p>'
+ 
```
Line 245:
```
- + [ALT CTRL SHIFT K_L]	>	U+00D8
+ 
```
Line 247:
```
- + [K_COLON]	>	U+006d
+ 
```
... and 147 more

#### group_structure (2)

Line 13:
```
- begin Unicode > use(SGGBFR74)
+ + [K_BKQUOTE] > 'Ç'
```
Line 15:
```
- group(SGGBFR74) using keys
+ + [K_2] > 'é'
```

#### line_added (56)

Line 14:
```
- 
+ + [K_1] > '&'
```
Line 19:
```
- 
+ + [K_6] > '-'
```
Line 26:
```
- 
+ + [K_Q] > 'a'
```
Line 33:
```
- 
+ + [K_I] > 'i'
```
Line 39:
```
- 
+ + [K_A] > 'q'
```
... and 51 more

#### comment_removed (142)

Line 16:
```
- c setup deadkeys
+ + [K_3] > '"'
```
Line 17:
```
- c simple deadkeys
+ + [K_4] > ''''
```
Line 18:
```
- c setup 'simple' keys
+ + [K_5] > '('
```
Line 21:
```
- c + [SHIFT K_BKQUOTE]   >   U+a78c
+ + [K_8] > '_'
```
Line 22:
```
- c + [ALT CTRL K_BKQUOTE]   >   U+a78b
+ + [K_9] > '«'
```
... and 137 more

#### rule_format (230)

Line 20:
```
- + [K_BKQUOTE] > U+0060
+ + [K_7] > '—'
```
Line 27:
```
- + [K_1]	>	U+0026
+ + [K_W] > 'ë'
```
Line 28:
```
- + [SHIFT K_1]	>	U+0031
+ + [K_E] > 'e'
```
Line 34:
```
- + [K_2]	>	U+00e9
+ + [K_O] > 'o'
```
Line 35:
```
- + [SHIFT K_2]	>	U+0032
+ + [K_P] > 'p'
```
... and 225 more

### sil_sgaw_karen

- Original lines: 189
- Roundtrip lines: 110
- Identical: 33
- Different: 156

#### unknown (3)

Line 1:
```
- ﻿c
+ c Converted from LDML keyboard: und
```
Line 4:
```
- c
+ store(&KEYBOARDVERSION) '1.1'
```
Line 7:
```
- c
+ store(&TARGETS) 'any'
```

#### comment_removed (8)

Line 2:
```
- c Keyman keyboard generated by ImportKeyboard
+ 
```
Line 3:
```
- c Imported: 2020-09-01 14:01:43
+ store(&NAME) 'Sgaw Karen'
```
Line 5:
```
- c Source Keyboard File: SgawKar7.dll
+ store(&COPYRIGHT) '© 2020-2022 SIL International'
```
Line 6:
```
- c Source KeyboardID: a000046a
+ store(&VERSION) '10.0'
```
Line 169:
```
- c mitigating ​ေ U+1031 issues
+ 
```
... and 3 more

#### line_removed (47)

Line 8:
```
- c 
+ 
```
Line 11:
```
- store(&NAME) 'Sgaw Karen'
+ 
```
Line 13:
```
- store(&VISUALKEYBOARD) 'sil_sgaw_karen.kvks'
+ 
```
Line 15:
```
- store(&LAYOUTFILE) 'sil_sgaw_karen.keyman-touch-layout'
+ 
```
Line 110:
```
- + [SHIFT K_S] > U+1060
+ 
```
... and 42 more

#### line_added (33)

Line 9:
```
- 
+ store(bcons) "ကခဂဃငစဆဇဈဉညဋဌဍဎဏတထဒဓနပဖဗဘမယရလဝသဟဠ"
```
Line 18:
```
- 
+ + [K_2] > '၂'
```
Line 20:
```
- 
+ + [K_4] > '၄'
```
Line 22:
```
- 
+ + [K_6] > '၆'
```
Line 24:
```
- 
+ + [K_8] > '၈'
```
... and 28 more

#### store_reordered (5)

Line 10:
```
- store(&VERSION) '10.0'
+ store(medialbcons) "ှၠြျွ"
```
Line 12:
```
- store(&TARGETS) 'any'
+ begin Unicode > use(main)
```
Line 14:
```
- store(&BITMAP) 'sil_sgaw_karen.ico'
+ group(main) using keys
```
Line 16:
```
- store(&COPYRIGHT) '© 2020-2022 SIL International'
+ + [K_BKQUOTE] > '`'
```
Line 17:
```
- store(&KEYBOARDVERSION) '1.1'
+ + [K_1] > '၁'
```

#### group_structure (2)

Line 19:
```
- begin Unicode > use(main)
+ + [K_3] > '၃'
```
Line 21:
```
- group(main) using keys
+ + [K_5] > '၅'
```

#### rule_format (58)

Line 23:
```
- + [K_SPACE] > U+0020
+ + [K_7] > '၇'
```
Line 25:
```
- + [K_0] > U+1040
+ + [K_9] > '၉'
```
Line 26:
```
- + [SHIFT K_0] > U+0029
+ + [K_0] > '၀'
```
Line 28:
```
- + [K_1] > U+1041
+ + [K_EQUAL] > '='
```
Line 29:
```
- + [SHIFT K_1] > U+0020 U+0021
+ + [K_Q] > 'ဆ'
```
... and 53 more

### sil_shan

- Original lines: 283
- Roundtrip lines: 108
- Identical: 8
- Different: 275

#### comment_removed (7)

Line 1:
```
- ﻿c Shan 'standard' keyboard layout as per Shan Institute for Information Technology layout
+ c Converted from LDML keyboard: und
```
Line 3:
```
- c MJPH  0.1     18-MAY-2012     Initial version
+ store(&NAME) 'Shan (SIL)'
```
Line 8:
```
- c store(&hotkey) [CTRL ALT K_S]
+ 
```
Line 117:
```
- c any(ydiaU) any(rdiaU) any(wdiaU) any(udiaU) any(sdiaU) any(ldiaU) any(ldotU)
+ 
```
Line 255:
```
- c move asat around either after 'G' or after 'H'
+ 
```
... and 2 more

#### line_removed (171)

Line 2:
```
- c
+ 
```
Line 46:
```
- store(wmedU)    U+103D U+1082
+ 
```
Line 48:
```
- store(udiaU)    U+102D U+102E U+1035 U+1085
+ 
```
Line 50:
```
- store(sdiaU)    U+1086
+ 
```
Line 82:
```
- + [SHIFT RALT K_6] > U+1096
+ 
```
... and 166 more

#### line_added (11)

Line 4:
```
- 
+ store(&KEYBOARDVERSION) '1.4'
```
Line 15:
```
- 
+ store(toneU) U+1089 U+1087 U+108A U+1088 U+1038 U+1062 U+1083
```
Line 25:
```
- 
+ store(w1medK) 'g'
```
Line 28:
```
- 
+ store(wmedK) "gG"
```
Line 31:
```
- 
+ store(udiaU) U+102D U+102E U+1035 U+1085
```
... and 6 more

#### store_reordered (42)

Line 5:
```
- store(&VERSION) "10.0"
+ store(&COPYRIGHT) '(c) SIL International'
```
Line 6:
```
- store(&NAME) "Shan (SIL)"
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&COPYRIGHT) '(c) SIL International'
+ store(&TARGETS) 'any'
```
Line 9:
```
- store(&BITMAP) 'sil_shan.ico'
+ store(baseK) "qwertyui"
```
Line 10:
```
- store(&VISUALKEYBOARD) 'sil_shan.kvks'
+ store(baseU) U+1078 U+1010 U+107C U+1019 U+1022 U+1015 U+1075 U+1004
```
... and 37 more

#### group_structure (2)

Line 14:
```
- begin Unicode > use(Main)
+ store(toneK) "hjL;:mM"
```
Line 65:
```
- group(Main) using keys
+ + [RALT K_H] > 'ံ'
```

#### unknown (6)

Line 17:
```
-                 'opzxcvbn' \
+ store(prevU) U+1031 U+1084
```
Line 18:
```
-                 'QWERYUIO' \
+ store(filler) '​'
```
Line 19:
```
-                 'PZXCVN'
+ store(asatK) 'f'
```
Line 21:
```
-                 U+101D U+1081 U+107D U+1011 U+1076 U+101C U+101A U+107A \
+ store(ymedK) 'B'
```
Line 22:
```
-                 U+AA61 U+107B U+A9E3 U+109E U+107F U+1077 U+101B U+101E \
+ store(ymedU) 'ျ'
```
... and 1 more

#### rule_format (36)

Line 67:
```
- + [RALT K_1] > U+1041
+ + [RALT K_X] > 'ꩧ'
```
Line 68:
```
- + [RALT K_2] > U+1042
+ + [SHIFT RALT K_1] > '႑'
```
Line 69:
```
- + [RALT K_3] > U+1043
+ + [SHIFT RALT K_2] > '႒'
```
Line 70:
```
- + [RALT K_4] > U+1044
+ + [SHIFT RALT K_3] > '႓'
```
Line 71:
```
- + [RALT K_5] > U+1045
+ + [SHIFT RALT K_4] > '႔'
```
... and 31 more

### sil_tagdal

- Original lines: 44
- Roundtrip lines: 45
- Identical: 6
- Different: 39

#### store_reordered (6)

Line 1:
```
- ﻿store(&VERSION) '15.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&TARGETS) 'any'
+ store(&NAME) 'Tagdal (SIL)'
```
Line 4:
```
- store(&COPYRIGHT) '© 2024 SIL International'
+ store(&KEYBOARDVERSION) '1.0'
```
Line 5:
```
- store(&KEYBOARDVERSION) '1.0'
+ store(&COPYRIGHT) '© 2024 SIL International'
```
Line 6:
```
- store(&VISUALKEYBOARD) 'sil_tagdal.kvks'
+ store(&VERSION) '10.0'
```
... and 1 more

#### line_removed (5)

Line 2:
```
- store(&NAME) 'Tagdal (SIL)'
+ 
```
Line 8:
```
- store(&BITMAP) 'sil_tagdal.ico'
+ 
```
Line 12:
```
- store(cons) "bcdfghjklmnŋqrstɣwxyzBCDFGHJKLMNŊQRSTƔWXYZ"
+ 
```
Line 14:
```
- group(main) using keys
+ 
```
Line 43:
```
- any(cons) + "]" > context U+0323
+ 
```

#### group_structure (1)

Line 9:
```
- begin Unicode > use(main)
+ store(cons) "bcdfghjklmnŋqrstɣwxyzBCDFGHJKLMNŊQRSTƔWXYZ"
```

#### unknown (1)

Line 11:
```
- store (vowel) "aeiuouǝAEIOUƎ"
+ begin Unicode > use(main)
```

#### line_added (2)

Line 13:
```
- 
+ group(main) using keys
```
Line 44:
```
- 
+ any(cons)̣ > '̣'
```

#### rule_format (22)

Line 18:
```
- + [SHIFT K_P] > 'Ǝ'
+ + [RALT K_BKQUOTE] > 'ˈ'
```
Line 19:
```
- + [SHIFT K_3] > '«'
+ + [RALT K_3] > '#'
```
Line 20:
```
- + [SHIFT K_6] > '»'
+ + [RALT K_6] > '^'
```
Line 21:
```
- + [SHIFT K_LBRKT] > 'Ŋ'
+ + [RALT K_R] > 'ɾ'
```
Line 22:
```
- + [SHIFT K_RBRKT] > '̌'
+ + [RALT K_I] > 'ɨ'
```
... and 17 more

#### comment_removed (2)

Line 40:
```
- c Combining dot below
+ match > use(transforms)
```
Line 41:
```
- c + [K_RBRKT] > '̣'
+ 
```

### sil_tai_dam

- Original lines: 110
- Roundtrip lines: 96
- Identical: 2
- Different: 108

#### store_reordered (5)

Line 1:
```
- ﻿store(&version) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&BITMAP) 'sil_tai_dam.ico'
+ store(&NAME) 'Tai Dam (SIL)'
```
Line 4:
```
- store(&COPYRIGHT) 'Copyright © 2007-2020 SIL International'
+ store(&KEYBOARDVERSION) '2.2.2'
```
Line 6:
```
- store(&KEYBOARDVERSION) '2.2.2'
+ store(&VERSION) '10.0'
```
Line 9:
```
- store(&VISUALKEYBOARD) 'sil_tai_dam.kvks'
+ begin Unicode > use(main)
```

#### line_removed (16)

Line 2:
```
- store(&NAME) 'Tai Dam (SIL)'
+ 
```
Line 8:
```
- store(&MESSAGE) 'The SIL Tai Dam keyboard is distributed under The MIT License (MIT).'
+ 
```
Line 76:
```
- + [SHIFT K_Z] > U+AAAF          c o high
+ 
```
Line 78:
```
- + [K_A] > U+AAB1                c aa
+ 
```
Line 80:
```
- + [K_I] > U+AAB2                c i
+ 
```
... and 11 more

#### comment_removed (16)

Line 5:
```
- c store(&ETHNOLOGUECODE) 'blt'  	c deprecated in Kmn 10.
+ store(&COPYRIGHT) 'Copyright © 2007-2020 SIL International'
```
Line 11:
```
- c This keyboard is designed for typing Tai Dam text using the Tai Viet script. It uses a
+ group(main) using keys
```
Line 12:
```
- c mnemonic layout based on the US English keyboard. That is, each Tai Viet character is assigned
+ 
```
Line 13:
```
- c to the key with the nearest equivalent US English letter.
+ + [K_BKQUOTE] > 'ꫜ'
```
Line 14:
```
- c It is also possible to key the Tai Don aspirated consonants using two-key sequences, but the keyboard
+ + [K_Q] > 'ꪖ'
```
... and 11 more

#### store_format (1)

Line 7:
```
- store(&TARGETS) 'web desktop'
+ store(&TARGETS) 'any'
```

#### line_added (5)

Line 16:
```
- 
+ + [K_E] > 'ꪵ'
```
Line 23:
```
- 
+ + [K_P] > 'ꪞ'
```
Line 24:
```
- 
+ + [K_LBRKT] > 'ꪷ'
```
Line 26:
```
- 
+ + [K_A] > 'ꪱ'
```
Line 28:
```
- 
+ + [K_D] > 'ꪒ'
```

#### group_structure (2)

Line 25:
```
- begin Unicode > use(main)
+ + [K_RBRKT] > 'ꪽ'
```
Line 27:
```
- group(main) using keys
+ + [K_S] > 'ꪎ'
```

#### rule_format (63)

Line 29:
```
- + [K_K] > U+AA80                c Ko Low
+ + [K_F] > 'ꪠ'
```
Line 30:
```
- + [SHIFT K_K] > U+AA81          c Ko High
+ + [K_G] > 'ꪈ'
```
Line 31:
```
- U+AA80 + [K_K] > U+AA82         c Kho Low
+ + [K_H] > 'ꪬ'
```
Line 32:
```
- U+AA81 + [SHIFT K_K] > U+AA83   c Kho High
+ + [K_J] > 'ꪤ'
```
Line 33:
```
- + [K_X] > U+AA84                c Khho Low
+ + [K_K] > 'ꪂ'
```
... and 58 more

### sil_tai_dam_lao

- Original lines: 103
- Roundtrip lines: 82
- Identical: 3
- Different: 100

#### comment_removed (16)

Line 1:
```
- ﻿c SIL's Tai Dam Lao keyboard is designed for typing Tai Dam text using the Lao script. 
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c The layout is mapped phonetically onto a US English keyboard. 
+ 
```
Line 4:
```
- c History:
+ store(&KEYBOARDVERSION) '2.0.4'
```
Line 5:
```
- c July 2018: Renamed Tai Dam Lao (SIL) keyboard. 
+ store(&COPYRIGHT) '© 2016-2022 SIL International'
```
Line 6:
```
- c                    Added Lao numerals
+ store(&VERSION) '10.0'
```
... and 11 more

#### line_added (5)

Line 3:
```
- 
+ store(&NAME) 'Tai Dam Lao (SIL)'
```
Line 11:
```
- 
+ group(main) using keys
```
Line 23:
```
- 
+ + [K_P] > 'ປ'
```
Line 25:
```
- 
+ + [K_RBRKT] > 'ໍ'
```
Line 38:
```
- 
+ + [K_V] > 'ຫວ'
```

#### line_removed (16)

Line 12:
```
- store(&VERSION) '10.0'
+ 
```
Line 82:
```
- + [NCAPS SHIFT K_Z] > U+0eb0  
+ 
```
Line 83:
```
- + [NCAPS K_LBRKT] > U+0ec4
+ 
```
Line 84:
```
- + [NCAPS K_RBRKT] > U+0ecd
+ 
```
Line 85:
```
- + [NCAPS K_BKQUOTE] > U+0e9c
+ 
```
... and 11 more

#### store_reordered (7)

Line 13:
```
- store(&NAME) 'Tai Dam Lao (SIL)'
+ + [K_BKQUOTE] > 'ຜ'
```
Line 14:
```
- store(&MESSAGE) 'Keyboard is optimized for typing the Tai Dam langugage with the Lao script and distributed under the MIT License (MIT).'
+ + [K_Q] > 'ຖ'
```
Line 15:
```
- store(&COPYRIGHT) '© 2016-2022 SIL International'
+ + [K_W] > 'ຳ'
```
Line 16:
```
- store(&KEYBOARDVERSION) '2.0.4'
+ + [K_E] > 'ແ'
```
Line 17:
```
- store(&BITMAP) 'sil_tai_dam_lao.ico'
+ + [K_R] > '່'
```
... and 2 more

#### group_structure (2)

Line 24:
```
- begin Unicode > use(main)
+ + [K_LBRKT] > 'ໄ'
```
Line 26:
```
- group(main) using keys
+ + [K_A] > 'າ'
```

#### rule_format (54)

Line 27:
```
- + [NCAPS SHIFT K_C] > '໌'
+ + [K_S] > 'ສ'
```
Line 28:
```
- + [NCAPS SHIFT K_D] > '໊'
+ + [K_D] > 'ດ'
```
Line 29:
```
- + [NCAPS SHIFT K_RBRKT] > 'ຯ'
+ + [K_F] > 'ຝ'
```
Line 30:
```
- + [NCAPS SHIFT K_B] > 'ໟ'
+ + [K_G] > 'ຫງ'
```
Line 31:
```
- + [NCAPS SHIFT K_P] > 'ຼ'
+ + [K_H] > 'ຫ'
```
... and 49 more

### sil_tai_dam_latin

- Original lines: 145
- Roundtrip lines: 82
- Identical: 18
- Different: 127

#### comment_removed (21)

Line 1:
```
- ﻿c The Tai Dam Latin orthography is based on the Vietnamese alphabet.
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c Layout is optimized for most frequent Tai Dam tone marks.
+ 
```
Line 3:
```
- c Keyboard produces NFD data.
+ store(&NAME) 'Tai Dam Latin (SIL)'
```
Line 5:
```
- c =====================================================================
+ store(&COPYRIGHT) 'Copyright © 2009-2020 SIL International'
```
Line 6:
```
- c Press a key twice to produce the character originally assigned to it.
+ store(&VERSION) '10.0'
```
... and 16 more

#### line_added (13)

Line 4:
```
- 
+ store(&KEYBOARDVERSION) '1.4.1'
```
Line 20:
```
- 
+ group(transforms)
```
Line 22:
```
- 
+ 'ăz' > 'z'
```
Line 26:
```
- 
+ 'êw' > 'w'
```
Line 27:
```
- 
+ 'ÊW' > 'W'
```
... and 8 more

#### store_reordered (8)

Line 9:
```
- store(&version) '10.0'
+ store(VowelBase) "aAeEiIoOuU"
```
Line 10:
```
- store(&NAME) 'Tai Dam Latin (SIL)'
+ store(VowelDiacritic) U+0302 U+0306 U+031B
```
Line 11:
```
- store(&BITMAP) 'sil_tai_dam_latin.ico'
+ store(ToneDiacritic) U+0300 U+0301 U+0303 U+0304 U+0309 U+0323
```
Line 15:
```
- store(&KEYBOARDVERSION) '1.4.1'
+ group(main) using keys
```
Line 18:
```
- store(&TARGETS) 'web desktop'
+ match > use(transforms)
```
... and 3 more

#### line_removed (49)

Line 12:
```
- store(&COPYRIGHT) 'Copyright © 2009-2020 SIL International'
+ 
```
Line 14:
```
- store(&MESSAGE) 'Latin-script keyboard for Tai Dam language'
+ 
```
Line 17:
```
- store(&VISUALKEYBOARD) 'sil_tai_dam_latin.kvks'
+ 
```
Line 19:
```
- begin Unicode > use(main)
+ 
```
Line 21:
```
- group(main) using keys
+ 
```
... and 44 more

#### rule_format (36)

Line 29:
```
- + 'z'            > 'a' U+0306   c a + combining breve
+ 'Ô{' > '{'
```
Line 30:
```
- + 'Z'            > 'A' U+0306   c A + combining breve 
+ 'ơ''' > ''''
```
Line 31:
```
- 'a' U+0306 + 'z' > 'z'
+ 'Ơ"' > '"'
```
Line 32:
```
- 'A' U+0306 + 'Z' > 'Z'
+ 'ưj' > 'j'
```
Line 34:
```
- + 'x'               > U+0111  	            c d with stroke 
+ any(VowelBase)̂ > '̂'
```
... and 31 more

### sil_tai_dam_typewriter

- Original lines: 108
- Roundtrip lines: 99
- Identical: 3
- Different: 105

#### store_reordered (5)

Line 1:
```
- ﻿store(&version) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&BITMAP) 'sil_tai_dam_typewriter.ico'
+ store(&NAME) 'Tai Dam Typewriter (SIL)'
```
Line 4:
```
- store(&COPYRIGHT) 'Copyright © 2009-2022 SIL International'
+ store(&KEYBOARDVERSION) '1.1'
```
Line 6:
```
- store(&KEYBOARDVERSION) '1.1'
+ store(&VERSION) '10.0'
```
Line 9:
```
- store(&VISUALKEYBOARD) 'sil_tai_dam_typewriter.kvks'
+ begin Unicode > use(main)
```

#### line_removed (12)

Line 2:
```
- store(&NAME) 'Tai Dam Typewriter (SIL)'
+ 
```
Line 8:
```
- store(&MESSAGE) 'The SIL Tai Dam Typewriter keyboard is distributed under The MIT License (MIT).'
+ 
```
Line 83:
```
- U+aa89 + [K_QUOTE] > u+aa87
+ 
```
Line 85:
```
- + [SHIFT K_Z] > u+aadd
+ 
```
Line 87:
```
- + [SHIFT K_C] > u+aa90
+ 
```
... and 7 more

#### comment_removed (6)

Line 5:
```
- c store(&ETHNOLOGUECODE) 'blt'    
+ store(&COPYRIGHT) 'Copyright © 2009-2022 SIL International'
```
Line 11:
```
- c This keyboard has been designed for typing the Tai Dam language with the Tai Viet 
+ group(main) using keys
```
Line 12:
```
- c script. The layout is based on two Tai Dam typewriters created by the Tai Dam 
+ 
```
Line 13:
```
- c community in the U.S. in the late 1970's. It does not include the Tai Dón aspirated
+ + [K_BKQUOTE] > ';'
```
Line 14:
```
- c consonants, and so is not suitable for the Tai Dón language.
+ + [K_Q] > 'ꪶ'
```
... and 1 more

#### store_format (1)

Line 7:
```
- store(&TARGETS) 'web desktop'
+ store(&TARGETS) 'any'
```

#### line_added (8)

Line 15:
```
- 
+ + [K_W] > 'ꪼ'
```
Line 17:
```
- 
+ + [K_R] > 'ꪟ'
```
Line 29:
```
- 
+ + [K_F] > 'ꪒ'
```
Line 41:
```
- 
+ + [K_B] > 'ꪕ'
```
Line 53:
```
- 
+ + [SHIFT K_R] > 'ꪺ'
```
... and 3 more

#### group_structure (2)

Line 16:
```
- begin Unicode > use(main)
+ + [K_E] > 'ꪾ'
```
Line 18:
```
- group(main) using keys
+ + [K_T] > 'ꪲ'
```

#### rule_format (71)

Line 19:
```
- + [K_RBRKT] > U+aadc
+ + [K_Y] > 'ꪴ'
```
Line 20:
```
- + [SHIFT K_RBRKT] > ']'
+ + [K_U] > 'ꪄ'
```
Line 21:
```
- + [K_LBRKT] > U+aab0
+ + [K_I] > 'ꪩ'
```
Line 22:
```
- + [SHIFT K_LBRKT] > '['
+ + [K_O] > 'ꪙ'
```
Line 23:
```
- + [SHIFT K_7] > '"'
+ + [K_P] > 'ꪔ'
```
... and 66 more

### sil_tawallammat

- Original lines: 155
- Roundtrip lines: 136
- Identical: 1
- Different: 154

#### comment_removed (7)

Line 1:
```
- ﻿c Follows the Moroccan Tamazight Tifinagh keyboard specification plus additional keys needed for Tamajaq
+ c Converted from LDML keyboard: und
```
Line 7:
```
- c store(&ETHNOLOGUECODE) 'ttq'
+ store(&TARGETS) 'any'
```
Line 11:
```
- c store(&WINDOWSLANGUAGES) 'x085F'
+ group(main) using keys
```
Line 16:
```
- c Additional keys for experimental SIL vowels
+ + [K_3] > '"'
```
Line 32:
```
- c Additional keys for new Unicode characters
+ + [K_U] > 'ⵓ'
```
... and 2 more

#### line_removed (23)

Line 2:
```
- store(&VERSION) '10.0'
+ 
```
Line 8:
```
- store(&BITMAP) 'sil_tawallammat.ico'
+ 
```
Line 10:
```
- store(&LAYOUTFILE) 'sil_tawallammat.keyman-touch-layout'
+ 
```
Line 12:
```
- begin Unicode > use(main)
+ 
```
Line 136:
```
- + [SHIFT K_QUOTE] > '%'
+ 
```
... and 18 more

#### store_reordered (5)

Line 3:
```
- store(&TARGETS) 'any'
+ store(&NAME) 'Tawallammat Tifinagh (SIL)'
```
Line 4:
```
- store(&COPYRIGHT) '© 2017-2020 SIL International'
+ store(&KEYBOARDVERSION) '1.1.1'
```
Line 5:
```
- store(&KEYBOARDVERSION) '1.1.1'
+ store(&COPYRIGHT) '© 2017-2020 SIL International'
```
Line 6:
```
- store(&NAME) 'Tawallammat Tifinagh (SIL)'
+ store(&VERSION) '10.0'
```
Line 9:
```
- store(&VISUALKEYBOARD) 'sil_tawallammat.kvks'
+ begin Unicode > use(main)
```

#### line_added (9)

Line 13:
```
- 
+ + [K_BKQUOTE] > '²'
```
Line 14:
```
- 
+ + [K_1] > '&'
```
Line 17:
```
- 
+ + [K_4] > ''''
```
Line 24:
```
- 
+ + [K_HYPHEN] > ')'
```
Line 31:
```
- 
+ + [K_Y] > 'ⵢ'
```
... and 4 more

#### group_structure (1)

Line 15:
```
- group(main) using keys
+ + [K_2] > 'ⵒ'
```

#### rule_format (109)

Line 18:
```
- + [RALT K_T] > 'ⴰ̂'   	c Tifinagh SIL a
+ + [K_5] > '('
```
Line 19:
```
- + [RALT K_Y] > 'ⵢ̂'   	c Tifinagh SIL e
+ + [K_6] > '-'
```
Line 20:
```
- + [RALT K_U] > 'ⵢ̣'   	c Tifinagh SIL i
+ + [K_7] > 'ⵤ'
```
Line 21:
```
- + [RALT K_G] > 'ⵧ̂'   c Tifinagh SIL o
+ + [K_8] > '_'
```
Line 22:
```
- + [RALT K_H] > 'ⵓ̂'   	c Tifinagh SIL u
+ + [K_9] > '—'
```
... and 104 more

### sil_tchad

- Original lines: 155
- Roundtrip lines: 103
- Identical: 3
- Different: 152

#### comment_removed (36)

Line 1:
```
- ﻿c Clavier du Tchad
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c pour usage avec les polices Unicode
+ 
```
Line 4:
```
- c Jeff Heath
+ store(&KEYBOARDVERSION) '4.3'
```
Line 5:
```
- c January 2023
+ store(&COPYRIGHT) '© SIL International'
```
Line 29:
```
- c Special characters (produced with ; or & key)
+ + [T_A_U_0327_shift] > 'A̧'
```
... and 31 more

#### unknown (2)

Line 3:
```
- c 
+ store(&NAME) 'Tchad'
```
Line 10:
```
- $keymanonly: store(&mnemoniclayout) "1"
+ store(aeiou-gra) "àèìòùÀÈÌÒÙ"
```

#### line_added (13)

Line 6:
```
- 
+ store(&VERSION) '10.0'
```
Line 17:
```
- 
+ store(speckey) "aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVxXyYzZ?*][=^#|~_`@%$<>:{}()''"  "
```
Line 19:
```
- 
+ store(diakey) "][=^|#~_`@%$"
```
Line 28:
```
- 
+ + [T_A_U_0327] > 'a̧'
```
Line 32:
```
- 
+ + [T_E_U_0327] > 'ȩ'
```
... and 8 more

#### store_reordered (17)

Line 7:
```
- store(&VERSION) '9.0'
+ store(&TARGETS) 'any'
```
Line 9:
```
- store(&BITMAP) 'sil_tchad.ico'
+ store(aeiou) "aeiouAEIOU"
```
Line 11:
```
- store(&copyright) '© SIL International'
+ store(aeiou-acu) "áéíóúÁÉÍÓÚ"
```
Line 12:
```
- store(&hotkey) '[CTRL ALT K_U]'  
+ store(aeiou-mcr) "āēīōūĀĒĪŌŪ"
```
Line 13:
```
- store(&TARGETS) 'any'
+ store(aeiou-cir) "âêîôûÂÊÎÔÛ"
```
... and 12 more

#### line_removed (52)

Line 8:
```
- store(&NAME) 'Tchad'
+ 
```
Line 21:
```
- store(aeiou-gra) 'àèìòùÀÈÌÒÙ'
+ 
```
Line 23:
```
- store(aeiou-mcr) 'āēīōūĀĒĪŌŪ'
+ 
```
Line 25:
```
- store(aeiou-wdg) 'ǎěǐǒǔǍĚǏǑǓ'
+ 
```
Line 103:
```
- ';' + ';' > ';' dk(1)
+ 
```
... and 47 more

#### group_structure (2)

Line 18:
```
- begin Unicode > use(Main)
+ store(spec) "æÆɓƁçÇɗƊɛƐəƏɣƎɦ" U+A7AA
```
Line 37:
```
- group(Main) using keys
+ + [T_I_U_0327_shift] > 'I̧'
```

#### rule_format (30)

Line 40:
```
- any(aeiou) + ']' > index(aeiou-gra,1)
+ + [T_O_U_0327] > 'o̧'
```
Line 41:
```
- any(aeiou) + '[' > index(aeiou-acu,1)
+ + [T_O_U_0327_shift] > 'O̧'
```
Line 42:
```
- any(aeiou) + '=' > index(aeiou-mcr,1)
+ + [T_U_U_0330] > 'ṵ'
```
Line 43:
```
- any(aeiou) + '^' > index(aeiou-cir,1)
+ + [T_U_U_0330_shift] > 'Ṵ'
```
Line 44:
```
- any(aeiou) + '|' > index(aeiou-wdg,1)
+ + [T_U_U_0327] > 'u̧'
```
... and 25 more

### sil_temiar

- Original lines: 39
- Roundtrip lines: 38
- Identical: 2
- Different: 37

#### comment_removed (4)

Line 1:
```
- ﻿c Simple Temiar Keyboard for Keyman.
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c This keyboard uses a simple set of key sequences
+ 
```
Line 3:
```
- c for typing Temiar, based on standard English
+ store(&NAME) 'Temiar (SIL)'
```
Line 4:
```
- c or Malay keyboard layouts.
+ store(&KEYBOARDVERSION) '2.0'
```

#### store_reordered (5)

Line 5:
```
- store(&VERSION) '10.0'
+ store(&COPYRIGHT) '© SIL Malaysia'
```
Line 6:
```
- store(&NAME) 'Temiar (SIL)'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&COPYRIGHT) '© SIL Malaysia' 
+ store(&TARGETS) 'any'
```
Line 9:
```
- store(&TARGETS) 'any'
+ begin Unicode > use(main)
```
Line 11:
```
- store(&LAYOUTFILE) 'sil_temiar.keyman-touch-layout'
+ group(main) using keys
```

#### line_removed (6)

Line 10:
```
- store(&VISUALKEYBOARD) 'sil_temiar.kvks'
+ 
```
Line 12:
```
- store(&MESSAGE) 'Developer: Jonathan G. Lublinkhof'
+ 
```
Line 13:
```
- store(&KEYBOARDVERSION) '2.0'
+ 
```
Line 15:
```
- begin Unicode > use(main)
+ 
```
Line 17:
```
- group(main) using keys
+ 
```
... and 1 more

#### line_added (2)

Line 14:
```
- 
+ match > use(transforms)
```
Line 16:
```
- 
+ group(transforms)
```

#### rule_format (20)

Line 18:
```
- "e" + "`" > "è"
+ 'eÒ' > 'è'
```
Line 19:
```
- "E" + "`" > "È"
+ 'EÒ' > 'È'
```
Line 20:
```
- "e" + "'" > "é"
+ 'eÉ' > 'é'
```
Line 21:
```
- "E" + "'" > "É"
+ 'EÉ' > 'É'
```
Line 22:
```
- 'e' + '=' > 'ë'
+ 'eË' > 'ë'
```
... and 15 more

### sil_tepehuan

- Original lines: 161
- Roundtrip lines: 145
- Identical: 4
- Different: 157

#### store_reordered (12)

Line 1:
```
- ﻿store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '© 2008-2020 SIL Mexico'
+ store(&NAME) 'Tepehuan (SIL)'
```
Line 5:
```
- store(&TARGETS) 'web desktop'
+ store(&COPYRIGHT) '© 2008-2020 SIL Mexico'
```
Line 6:
```
- store(&VISUALKEYBOARD) 'sil_tepehuan.kvks'
+ store(&VERSION) '10.0'
```
Line 17:
```
- store(store6) "aeiouAEIOU" 
+ store(store14) "ª©°ʰº®™ʷʸ¹²³•¨"
```
... and 7 more

#### line_removed (20)

Line 2:
```
- store(&NAME) 'Tepehuan (SIL)'
+ 
```
Line 22:
```
- store(store11) "?!" 
+ 
```
Line 24:
```
- store(store13) "acdhortɇy123.:" 
+ 
```
Line 26:
```
- store(store15) "eE0cn" 
+ 
```
Line 27:
```
- store(store16) "ɇɆ∅¢ŋ" 
+ 
```
... and 15 more

#### line_added (4)

Line 7:
```
- 
+ store(&TARGETS) 'any'
```
Line 13:
```
- 
+ store(store10) "βðɣƚȽ"
```
Line 32:
```
- 
+ (any(store9))----- > index(store10,1) '-'
```
Line 34:
```
- 
+ (any(store10))---- > index(store9,1) '-'
```

#### comment_removed (8)

Line 8:
```
- c Keyboard created by KMDECOMP
+ 
```
Line 10:
```
- c Meta details: Registered=1; Version=0
+ store(store7) "áéíóúÁÉÍÓÚ"
```
Line 11:
```
- c               Flags=0; HotKey=30055
+ store(store8) "äëïöüÄËÏÖÜ"
```
Line 14:
```
- c store(&21) "Created with Tavultesoft Keyman Developer version 8.0.355.0" 
+ store(store11) "?!"
```
Line 15:
```
- c store(&22) "0" 
+ store(store12) "¿¡"
```
... and 3 more

#### unknown (2)

Line 9:
```
- c
+ store(store6) "aeiouAEIOU"
```
Line 12:
```
- c
+ store(store9) "bdglL"
```

#### group_structure (2)

Line 33:
```
- begin Unicode > use(group1)
+ (any(store9))---- > index(store10,1)
```
Line 35:
```
- group(group1) using keys
+ (any(store13)) > index(store14,1)
```

#### rule_format (109)

Line 36:
```
-   "!"  + "!" > "¡"  c line(0)
+ (any(store17))^^ > index(store18,1) '^'
```
Line 37:
```
-   "%"  + "%" > "‰"  c line(0)
+ (any(store17))^ > index(store18,1)
```
Line 38:
```
-    + "'" > "Ꞌ"  c line(0)
+ (any(store18))^ > index(store17,1) '^'
```
Line 39:
```
-   any(store9) "-"  + "-" > index(store10, 1) "-"  c line(0)
+ (any(store15))|† > index(store16,1) '|'
```
Line 40:
```
-   any(store9)  + "-" > index(store10, 1)  c line(0)
+ (any(store15))† > index(store16,1)
```
... and 104 more

### sil_torwali

- Original lines: 115
- Roundtrip lines: 107
- Identical: 3
- Different: 112

#### comment_removed (4)

Line 1:
```
- ﻿c sil_torwali.kmn
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c Author:   Lorna Evans
+ 
```
Line 3:
```
- c Date:     8-FEB-2018
+ store(&NAME) 'Torwali (SIL)'
```
Line 4:
```
- c Original Creation Date:     7-APR-2016
+ store(&KEYBOARDVERSION) '1.0.2'
```

#### store_reordered (9)

Line 5:
```
- store(&VERSION) '9.0'
+ store(&COPYRIGHT) '© 2016-2020 SIL International'
```
Line 6:
```
- store(&NAME) 'Torwali (SIL)'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&COPYRIGHT) '© 2016-2020 SIL International'
+ store(&TARGETS) 'any'
```
Line 9:
```
- store(&ETHNOLOGUECODE) 'trw'
+ begin Unicode > use(main)
```
Line 11:
```
- store(&BITMAP) 'sil_torwali.ico'
+ group(main) using keys
```
... and 4 more

#### line_removed (11)

Line 8:
```
- store(&MESSAGE) 'The Torwali (SIL) keyboard is distributed under The MIT License (MIT).'
+ 
```
Line 10:
```
- store(&WINDOWSLANGUAGES) 'x0401'
+ 
```
Line 12:
```
- store(&VISUALKEYBOARD) 'sil_torwali.kvks'
+ 
```
Line 107:
```
- + [SHIFT K_7] > '&'
+ 
```
Line 108:
```
- + [SHIFT K_6] > '^'
+ 
```
... and 6 more

#### group_structure (2)

Line 17:
```
- begin Unicode > use(main)
+ + [K_4] > '4'
```
Line 20:
```
- group(main) using keys
+ + [K_7] > '7'
```

#### line_added (2)

Line 18:
```
- 
+ + [K_5] > '5'
```
Line 19:
```
- 
+ + [K_6] > '6'
```

#### rule_format (84)

Line 21:
```
- + [K_SLASH] > 'ࣿ'
+ + [K_8] > '8'
```
Line 22:
```
- + [K_PERIOD] > '۔'
+ + [K_9] > '9'
```
Line 23:
```
- + [K_COMMA] > '،'
+ + [K_0] > '0'
```
Line 24:
```
- + [K_M] > 'م'
+ + [K_HYPHEN] > '-'
```
Line 25:
```
- + [K_N] > 'ن'
+ + [K_EQUAL] > '='
```
... and 79 more

### sil_tunisian

- Original lines: 153
- Roundtrip lines: 128
- Identical: 3
- Different: 150

#### comment_removed (3)

Line 1:
```
- ﻿c sil_tunisian.kmn
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c Author:   Lorna Evans
+ 
```
Line 3:
```
- c Date:     6-MAY-2016
+ store(&NAME) 'Tunisian Spoken Arabic (SIL)'
```

#### store_reordered (6)

Line 4:
```
- store(&VERSION) '9.0'
+ store(&KEYBOARDVERSION) '1.0'
```
Line 5:
```
- store(&NAME) 'Tunisian Spoken Arabic (SIL)'
+ store(&COPYRIGHT) '© 2016-2018 SIL International'
```
Line 6:
```
- store(&TARGETS) 'web desktop'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&ETHNOLOGUECODE) 'aeb'
+ store(&TARGETS) 'any'
```
Line 9:
```
- store(&BITMAP) 'sil_tunisian.ico'
+ begin Unicode > use(main)
```
... and 1 more

#### line_removed (28)

Line 8:
```
- store(&COPYRIGHT) '© 2016-2018 SIL International'
+ 
```
Line 10:
```
- store(&VISUALKEYBOARD) 'sil_tunisian.kvks'
+ 
```
Line 12:
```
- store(&KMW_RTL) '1'
+ 
```
Line 128:
```
- + [K_HYPHEN] > ')'
+ 
```
Line 129:
```
- + [K_0] > 'à'
+ 
```
... and 23 more

#### group_structure (2)

Line 13:
```
- begin Unicode > use(main)
+ + [K_BKQUOTE] > '>'
```
Line 16:
```
- group(main) using keys
+ + [K_3] > '"'
```

#### line_added (2)

Line 14:
```
- 
+ + [K_1] > '&'
```
Line 15:
```
- 
+ + [K_2] > 'é'
```

#### rule_format (109)

Line 17:
```
- $keymanonly: + [RALT K_SLASH] > '/'
+ + [K_4] > ''''
```
Line 18:
```
- $keymanonly: + [RALT K_PERIOD] > '.'
+ + [K_5] > '('
```
Line 19:
```
- $keymanonly: + [RALT K_COMMA] > ','
+ + [K_6] > '-'
```
Line 20:
```
- $keymanonly: + [RALT K_QUOTE] > U+0027
+ + [K_7] > 'è'
```
Line 21:
```
- $keymanonly: + [RALT K_COLON] > ';'
+ + [K_8] > '_'
```
... and 104 more

### sil_uganda_tanzania

- Original lines: 145
- Roundtrip lines: 74
- Identical: 21
- Different: 124

#### comment_removed (27)

Line 1:
```
- ﻿c Uganda-Tanzania Bantu Unicode Keyboard
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c Adapted from jd East Africa Unicode Control File for Tavultesoft Keyman 6
+ 
```
Line 3:
```
- c by Scott Zook Nov 2004 
+ store(&NAME) 'Uganda-Tanzania Bantu (SIL)'
```
Line 4:
```
- c modified by Martin Diprose Oct 2005
+ store(&KEYBOARDVERSION) '1.1.2'
```
Line 5:
```
- c modified by Martin Diprose - to add simpler keystrokes & update for Unicode 5.0 May 2007
+ store(&COPYRIGHT) '2004-2020 SIL International'
```
... and 22 more

#### unknown (1)

Line 9:
```
- VERSION 9.0
+ store(kMod) ';'
```

#### store_reordered (22)

Line 10:
```
- store(&NAME) "Uganda-Tanzania Bantu (SIL)"
+ store(Vow) "aAeEiIoOuU"
```
Line 11:
```
- store(&BITMAP) 'sil_uganda_tanzania.ico'
+ store(ModVow) U+01DD U+018E U+025B U+0190 U+0268 U+0197 U+0254 U+0186 U+0289 U+0244
```
Line 13:
```
- store(&Copyright) "2004-2020 SIL International"
+ store(cAbove) U+0300 U+0301 U+0302 U+030C U+0304 U+0303 U+0308
```
Line 14:
```
- store(&TARGETS) 'any'
+ store(kBelow) "_.},%"
```
Line 15:
```
- store(&VISUALKEYBOARD) 'sil_uganda_tanzania.kvks'
+ store(cBelow) U+0331 U+0323 U+0330 U+032F U+0327
```
... and 17 more

#### line_added (15)

Line 18:
```
- 
+ store(kInvBreveBelow) "bB"
```
Line 20:
```
-                
+ store(NasalAbove) "nNmM"
```
Line 21:
```
- 
+ store(kModNasalAbove) "nN"
```
Line 23:
```
- 
+ store(kPunct) "@#"
```
Line 33:
```
- 
+ + [T_B_U_032F_shift] > 'B̯'
```
... and 10 more

#### group_structure (2)

Line 19:
```
- begin UNICODE > use(main)
+ store(cInvBreveBelow) '̯'
```
Line 55:
```
- group(main) using keys
+ 'BbB̯' > 'B̯'
```

#### line_removed (50)

Line 29:
```
- store(kAbove) "`'[]=~:"               c ` grave, ' acute, [ circumflex, ] caron, = macron, ~ tilde, : dieresis
+ 
```
Line 31:
```
- store(kBelow) "_.},%"   c _ underscore, . dot, } tilde, , inverted breve, % cedille
+ 
```
Line 36:
```
- store(Con) "nN" "sS" "zZ" "'" "`" c eng, glottal modifier apostrophe
+ 
```
Line 74:
```
- any(kBelow) any(kAbove) + any(Vow)  > index(Vow,3) index(cBelow,1) index(cAbove,2) c above under vowels
+ 
```
Line 75:
```
- any(kBelow) any(kAbove) any(kMod) + any(Vow)  > index(ModVow,4) index(cBelow,1) index(cAbove,2) c above under modified vowels
+ 
```
... and 45 more

#### rule_format (7)

Line 59:
```
- any(kMod) + any(Vow) > index(ModVow,2)  c modified vowels
+ 'ŋŊ' > 'ɲ'
```
Line 62:
```
- any(kBelow) + any(Vow)  > index(Vow,2) index(cBelow,1) c under normal vowels
+ 'NNƝ' > 'Ŋ'
```
Line 63:
```
- any(kBelow) any(kMod) + any(Vow)  > index(ModVow,3) index(cBelow,1) c under modified vowels
+ 'ŊƝ' > 'Ɲ'
```
Line 66:
```
- any(kAbove) + any(Vow)    > index(Vow,2) index(cAbove,1) c above normal vowels
+ 'ssŜ' > 'ŝ'
```
Line 67:
```
- any(kAbove) any(kMod) + any(Vow)    > index(ModVow,3) index(cAbove,1)   c above Modified vowels
+ 'SsŜ' > 'Ŝ'
```
... and 2 more

### sil_wayuu

- Original lines: 60
- Roundtrip lines: 30
- Identical: 9
- Different: 51

#### comment_removed (4)

Line 1:
```
- ﻿c Created by Lorna A. Priest 3-JUN-03 for the 
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c      Wayuu language of Colombia/Venezuela for Richard Mansen
+ 
```
Line 16:
```
- c glottal stop
+ store(UAcuteU) U+01D8 U+01D7
```
Line 20:
```
- c acute
+ store(puncU) U+201C U+201D U+2018 U+2019 U+00BF U+00A1
```

#### line_added (6)

Line 3:
```
- 
+ store(&NAME) 'Wayuu (SIL)'
```
Line 12:
```
- 
+ store(AU) U+00E1 U+00E9 U+00ED U+00F3 U+00FA
```
Line 14:
```
- 
+ store(UU) U+00FC U+00DC
```
Line 15:
```
- 
+ store(UAcute) "uU"
```
Line 19:
```
- 
+ store(punc) "<>`''?!"
```
... and 1 more

#### store_reordered (13)

Line 4:
```
- store(&VERSION) '10.0'
+ store(&KEYBOARDVERSION) '1.1'
```
Line 5:
```
- store(&NAME) 'Wayuu (SIL)'
+ store(&COPYRIGHT) '© SIL International'
```
Line 6:
```
- store(&COPYRIGHT) '© SIL International'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&KEYBOARDVERSION) '1.1'
+ store(&TARGETS) 'any'
```
Line 9:
```
- store(&BITMAP) 'sil_wayuu.ico'
+ store(glot) ''''
```
... and 8 more

#### line_removed (26)

Line 8:
```
- store(&TARGETS) 'any'
+ 
```
Line 24:
```
-            U+00C1 U+00C9 U+00CD U+00D3 U+00DA 
+ 
```
Line 26:
```
- store(Umlaut) [RALT K_U]    [RALT SHIFT K_U]   
+ 
```
Line 30:
```
- store(UAcuteU) U+01D8 U+01D7
+ 
```
Line 32:
```
- store(tilde)  "n"    "N"
+ 
```
... and 21 more

#### group_structure (1)

Line 13:
```
- begin UNICODE > use(main)
+ store(Umlaut) "[RALT  K_U]        [RALT  SHIFT  K_U]"
```

#### unknown (1)

Line 22:
```
-            "A"    "E"    "I"    "O"    "U"    
+ store(enya) '~'
```

### sil_ygp_plrd

- Original lines: 100
- Roundtrip lines: 13
- Identical: 5
- Different: 95

#### comment_removed (5)

Line 1:
```
- ﻿c Sample Keyboard: yclUni
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c Bai Yi keyboard
+ 
```
Line 3:
```
- c Provided by: Erich Fickle, from David Morse legacy keyboard 
+ store(&NAME) 'Bai Yi – White Yi (SIL)'
```
Line 6:
```
- c Fonts: 
+ store(&VERSION) '10.0'
```
Line 82:
```
- c + '@' > ''
+ 
```

#### unknown (3)

Line 4:
```
- c              
+ store(&KEYBOARDVERSION) '1.1'
```
Line 5:
```
- c
+ store(&COPYRIGHT) '© 2014-2020 SIL International'
```
Line 7:
```
- c
+ store(&TARGETS) 'any'
```

#### store_reordered (2)

Line 9:
```
- store(&VERSION) '10.0'
+ begin Unicode > use(main)
```
Line 11:
```
- store(&TARGETS) 'web desktop'
+ group(main) using keys
```

#### line_removed (85)

Line 10:
```
- store(&NAME) 'Bai Yi – White Yi (SIL)'
+ 
```
Line 12:
```
- store(&COPYRIGHT) '© 2014-2020 SIL International'
+ 
```
Line 13:
```
- store(&KEYBOARDVERSION) '1.1'
+ 
```
Line 14:
```
- store(&VISUALKEYBOARD) 'sil_ygp_plrd.kvks'
+ 
```
Line 16:
```
- begin Unicode > use(Umain)
+ 
```
... and 80 more

### sil_yi

- Original lines: 1426
- Roundtrip lines: 1193
- Identical: 14
- Different: 1412

#### comment_removed (158)

Line 1:
```
- ﻿c sil_yi.kmn
+ c Converted from LDML keyboard: und
```
Line 3:
```
- c Yi keyboard layout using pinyin input.
+ store(&NAME) 'SIL Yi'
```
Line 4:
```
- c Author:  Andy Eatough
+ store(&KEYBOARDVERSION) '1.3.1'
```
Line 24:
```
- c RULES
+ 'iet　' > 'ꀄ'
```
Line 49:
```
- c ------------------------------------
+ 'biep　' > 'ꀝ'
```
... and 153 more

#### line_removed (207)

Line 2:
```
- c
+ 
```
Line 8:
```
- store(&version) "10.0"
+ 
```
Line 10:
```
- store(&BITMAP) 'sil_yi.ico'
+ 
```
Line 12:
```
- store(&TARGETS) 'any'
+ 
```
Line 14:
```
- store(&KEYBOARDVERSION) '1.3.1'
+ 
```
... and 202 more

#### unknown (1)

Line 5:
```
- c
+ store(&COPYRIGHT) '© SIL International'
```

#### line_added (46)

Line 6:
```
- 
+ store(&VERSION) '10.0'
```
Line 7:
```
- 
+ store(&TARGETS) 'any'
```
Line 21:
```
- 
+ 'ix　' > 'ꀁ'
```
Line 23:
```
- 
+ 'ip　' > 'ꀃ'
```
Line 48:
```
- 
+ 'bie　' > 'ꀜ'
```
... and 41 more

#### store_reordered (5)

Line 9:
```
- store(&name) "SIL Yi"
+ store(nul) "ABCDEFGHIJKLMNOPQRSTUVWXYZ@$^&""
```
Line 11:
```
- store(&message) "Yi keyboard layout using pinyin input"
+ begin Unicode > use(main)
```
Line 13:
```
- store(&COPYRIGHT) '© SIL International'
+ group(main) using keys
```
Line 16:
```
- store(&LAYOUTFILE) 'sil_yi.keyman-touch-layout'
+ match > use(transforms)
```
Line 20:
```
- store(nul) "ABCDEFGHIJKLMNOPQRSTUVWXYZ@$^&" '"'
+ 'it　' > 'ꀀ'
```

#### group_structure (2)

Line 18:
```
- begin Unicode > use(Unicode Group)
+ group(transforms)
```
Line 22:
```
- group(Unicode Group) using keys
+ 'i　' > 'ꀂ'
```

#### rule_format (993)

Line 25:
```
- + any(nul) > nul
+ 'iex　' > 'ꀅ'
```
Line 26:
```
- 'it' + ' '          > U+a000         c Yi high tone i
+ 'ie　' > 'ꀆ'
```
Line 27:
```
- 'ix' + ' '          > U+a001         c Yi mid-high tone i
+ 'iep　' > 'ꀇ'
```
Line 28:
```
- 'i' + ' '           > U+a002         c Yi mid tone i
+ 'at　' > 'ꀈ'
```
Line 29:
```
- 'ip' + ' '          > U+a003         c Yi low tone i
+ 'ax　' > 'ꀉ'
```
... and 988 more

### sil_yna_plrd

- Original lines: 115
- Roundtrip lines: 13
- Identical: 4
- Different: 111

#### unknown (4)

Line 1:
```
- ﻿c 
+ c Converted from LDML keyboard: und
```
Line 3:
```
- c 
+ store(&NAME) 'Gan Yi (SIL)'
```
Line 5:
```
- c              
+ store(&COPYRIGHT) '© 2014-2020 SIL International'
```
Line 6:
```
- c
+ store(&VERSION) '10.0'
```

#### comment_removed (6)

Line 2:
```
- c Sample Keyboard: Gan Yi Unicode
+ 
```
Line 4:
```
- c Provided by: Modified from David Morse' legacy keyboard by Erich Fickle
+ store(&KEYBOARDVERSION) '1.1'
```
Line 7:
```
- c Fonts: 
+ store(&TARGETS) 'any'
```
Line 20:
```
- c THIS IS NOT FINISHED
+ 
```
Line 43:
```
- c Check wordlists, it should be missing. Set Comparison does not list it.
+ 
```
... and 1 more

#### line_removed (99)

Line 8:
```
- c
+ 
```
Line 10:
```
- store(&VERSION) '10.0'
+ 
```
Line 12:
```
- store(&TARGETS) 'web desktop'
+ 
```
Line 13:
```
- store(&COPYRIGHT) '© 2014-2020 SIL International'
+ 
```
Line 14:
```
- store(&KEYBOARDVERSION) '1.1'
+ 
```
... and 94 more

#### line_added (1)

Line 9:
```
- 
+ begin Unicode > use(main)
```

#### store_reordered (1)

Line 11:
```
- store(&NAME) 'Gan Yi (SIL)'
+ group(main) using keys
```

### sil_yoruba_bar

- Original lines: 296
- Roundtrip lines: 93
- Identical: 23
- Different: 273

#### store_reordered (45)

Line 1:
```
- store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&MESSAGE) 'A simple Unicode keyboard for Yorùbá, using the traditional bar under e, o, and s.'
+ store(&NAME) 'Yorùbá with Bar'
```
Line 4:
```
- store(&COPYRIGHT) '(c) 2012-2020 SIL International'
+ store(&KEYBOARDVERSION) '1.2.1'
```
Line 5:
```
- store(&KEYBOARDVERSION) '1.2.1'
+ store(&COPYRIGHT) '(c) 2012-2020 SIL International'
```
Line 6:
```
- store(&BITMAP) 'sil_yoruba_bar.ico'
+ store(&VERSION) '10.0'
```
... and 40 more

#### line_removed (165)

Line 2:
```
- store(&NAME) 'Yorùbá with Bar'
+ 
```
Line 8:
```
- store(&TARGETS) 'any'
+ 
```
Line 19:
```
- store(grv)  U+00E0 U+00E8 U+00EC U+00F2 U+00F9 U+00C0 U+00C8 U+00CC U+00D2 U+00D9  
+ 
```
Line 21:
```
- store(crc)  U+00E2 U+00EA U+00EE U+00F4 U+00FB U+00C2 U+00CA U+00CE U+00D4 U+00DB 
+ 
```
Line 67:
```
- store(key.crn) '}'
+ 
```
... and 160 more

#### line_added (12)

Line 10:
```
- 
+ store(grv) U+00E0 U+00E8 U+00EC U+00F2 U+00F9 U+00C0 U+00C8 U+00CC U+00D2 U+00D9
```
Line 12:
```
- 
+ store(crc) U+00E2 U+00EA U+00EE U+00F4 U+00FB U+00C2 U+00CA U+00CE U+00D4 U+00DB
```
Line 24:
```
- 
+ + [RALT K_RBRKT] > ']'
```
Line 30:
```
- 
+ + [SHIFT RALT K_RBRKT] > '}'
```
Line 36:
```
- 
+ + [T_006F_0329_0301] > 'ó̩'
```
... and 7 more

#### group_structure (2)

Line 11:
```
- begin Unicode > use(main)
+ store(act) U+00E1 U+00E9 U+00ED U+00F3 U+00FA U+00C1 U+00C9 U+00CD U+00D3 U+00DA
```
Line 13:
```
- group(main) using keys 
+ store(crn) U+01CE U+011B U+01D0 U+01D2 U+01D4 U+01CD U+011A U+01CF U+01D1 U+01D3
```

#### comment_removed (33)

Line 14:
```
- c ==========
+ store(mac) U+0101 U+0113 U+012B U+014D U+016B U+0100 U+0112 U+012A U+014C U+016A
```
Line 15:
```
- c ==Stores==
+ store(bar) "eosEOS"
```
Line 16:
```
- c ==========
+ store(nsl) "mnMN"
```
Line 17:
```
- c Letters
+ 
```
Line 42:
```
- c Accents
+ + [T_004F_0329_0302_shift] > 'Ô̩'
```
... and 28 more

#### rule_format (16)

Line 76:
```
- + '=' > '='
+ dk(un)v > 'v'
```
Line 77:
```
- + '-' > '-'
+ dk(un)x > 'x'
```
Line 78:
```
- + '0' > '0'
+ dk(un)z > 'z'
```
Line 79:
```
- + '9' > '9'
+ dk(un)^ > '^'
```
Line 80:
```
- + '8' > '8'
+ dk(un)| > '|'
```
... and 11 more

### sil_yoruba_dot

- Original lines: 286
- Roundtrip lines: 87
- Identical: 26
- Different: 260

#### store_reordered (42)

Line 1:
```
- store(&VERSION) '10.0'
+ c Converted from LDML keyboard: und
```
Line 3:
```
- store(&COPYRIGHT) '(c) 2012-2020 SIL International'
+ store(&NAME) 'Yorùbá with Dot'
```
Line 5:
```
- store(&BITMAP) 'sil_yoruba_dot.ico'
+ store(&COPYRIGHT) '(c) 2012-2020 SIL International'
```
Line 6:
```
- store(&VISUALKEYBOARD) 'sil_yoruba_dot.kvks'
+ store(&VERSION) '10.0'
```
Line 18:
```
- store(grv)  U+00E0 U+00E8 U+00EC U+00F2 U+00F9 U+00C0 U+00C8 U+00CC U+00D2 U+00D9  
+ begin Unicode > use(main)
```
... and 37 more

#### line_removed (160)

Line 2:
```
- store(&NAME) 'Yorùbá with Dot'
+ 
```
Line 8:
```
- store(&LAYOUTFILE) 'sil_yoruba_dot.keyman-touch-layout'
+ 
```
Line 17:
```
- store(base) 'a'    'e'    'i'    'o'    'u'    'A'    'E'    'I'    'O'    'U'    
+ 
```
Line 19:
```
- store(act)  U+00E1 U+00E9 U+00ED U+00F3 U+00FA U+00C1 U+00C9 U+00CD U+00D3 U+00DA 
+ 
```
Line 21:
```
- store(crn)  U+01CE U+011B U+01D0 U+01D2 U+01D4 U+01CD U+011A U+01CF U+01D1 U+01D3 
+ 
```
... and 155 more

#### line_added (10)

Line 9:
```
- 
+ store(base) "aeiouAEIOU"
```
Line 11:
```
- 
+ store(act) U+00E1 U+00E9 U+00ED U+00F3 U+00FA U+00C1 U+00C9 U+00CD U+00D3 U+00DA
```
Line 23:
```
- 
+ + [RALT K_LBRKT] > '['
```
Line 29:
```
- 
+ + [SHIFT RALT K_LBRKT] > '{'
```
Line 35:
```
- 
+ + [T_1ECD_0300] > 'ọ̀'
```
... and 5 more

#### group_structure (2)

Line 10:
```
- begin Unicode > use(main)
+ store(grv) U+00E0 U+00E8 U+00EC U+00F2 U+00F9 U+00C0 U+00C8 U+00CC U+00D2 U+00D9
```
Line 12:
```
- group(main) using keys 
+ store(crc) U+00E2 U+00EA U+00EE U+00F4 U+00FB U+00C2 U+00CA U+00CE U+00D4 U+00DB
```

#### comment_removed (33)

Line 13:
```
- c ==========
+ store(crn) U+01CE U+011B U+01D0 U+01D2 U+01D4 U+01CD U+011A U+01CF U+01D1 U+01D3
```
Line 14:
```
- c ==Stores==
+ store(mac) U+0101 U+0113 U+012B U+014D U+016B U+0100 U+0112 U+012A U+014C U+016A
```
Line 15:
```
- c ==========
+ store(dot) U+1EB9 U+1ECD U+1EB8 U+1ECC
```
Line 16:
```
- c Letters
+ store(nsl) "mnMN"
```
Line 40:
```
- c Accents
+ + [T_1ECC_0300_shift] > 'Ọ̀'
```
... and 28 more

#### rule_format (13)

Line 74:
```
- + '=' > '='
+ dk(un)[ > '['
```
Line 75:
```
- + '-' > '-'
+ dk(un)q > 'q'
```
Line 76:
```
- + '0' > '0'
+ dk(un)v > 'v'
```
Line 77:
```
- + '9' > '9'
+ dk(un)x > 'x'
```
Line 78:
```
- + '8' > '8'
+ dk(un)z > 'z'
```
... and 8 more

### sil_yupik_cyrillic

- Original lines: 392
- Roundtrip lines: 363
- Identical: 3
- Different: 389

#### comment_removed (12)

Line 1:
```
- ﻿c (Created by Keyman Developer 6.2.176.0)
+ c Converted from LDML keyboard: und
```
Line 2:
```
- c by Jim Brase, SIL Internatinal, March 2006
+ 
```
Line 9:
```
- c store(&ETHNOLOGUECODE) 'ess'
+ begin Unicode > use(main)
```
Line 19:
```
- c Upper case characters, single keystroke
+ + [K_R] > 'r'
```
Line 53:
```
- c Upper case characters using CAPS, single keystroke
+ + [CAPS K_Y] > 'Y'
```
... and 7 more

#### line_added (27)

Line 3:
```
- 
+ store(&NAME) 'Yupik Cyrillic (SIL)'
```
Line 4:
```
- 
+ store(&KEYBOARDVERSION) '2.0.3'
```
Line 14:
```
- 
+ + [K_HYPHEN] > '‹'
```
Line 16:
```
- 
+ + [K_Q] > 'q'
```
Line 18:
```
- 
+ + [K_E] > 'e'
```
... and 22 more

#### store_reordered (5)

Line 5:
```
- store(&version) '10.0'
+ store(&COPYRIGHT) 'Copyright © 2006-2022 SIL International'
```
Line 6:
```
- store(&NAME) 'Yupik Cyrillic (SIL)'
+ store(&VERSION) '10.0'
```
Line 7:
```
- store(&BITMAP) 'sil_yupik_cyrillic.ico'
+ store(&TARGETS) 'any'
```
Line 11:
```
- store(&TARGETS) 'web desktop'
+ group(main) using keys
```
Line 13:
```
- store(&VISUALKEYBOARD) 'sil_yupik_cyrillic.kvks'
+ + [K_BKQUOTE] > '`'
```

#### line_removed (33)

Line 8:
```
- store(&COPYRIGHT) 'Copyright © 2006-2022 SIL International'
+ 
```
Line 10:
```
- store(&KEYBOARDVERSION) '2.0.3'
+ 
```
Line 12:
```
- store(&MESSAGE) "SIL's Yupik Cyrillic keyboard is distributed under The MIT License (MIT)."
+ 
```
Line 146:
```
- + [CAPS SHIFT K_Y] > u+044b          c CYRILLIC SMALL LETTER YERU
+ 
```
Line 148:
```
- + [CAPS SHIFT K_BKQUOTE] > U+0451    c CYRILLIC SMALL LETTER IO
+ 
```
... and 28 more

#### group_structure (2)

Line 15:
```
- begin Unicode > use(main)
+ + [K_EQUAL] > '«'
```
Line 17:
```
- group(main) using keys
+ + [K_W] > 'w'
```

#### rule_format (221)

Line 20:
```
- + [NCAPS SHIFT K_A] > U+0410          c CYRILLIC CAPITAL LETTER A
+ + [K_T] > 't'
```
Line 21:
```
- + [NCAPS SHIFT K_B] > U+0411          c CYRILLIC CAPITAL LETTER BE
+ + [K_Y] > 'y'
```
Line 22:
```
- + [NCAPS SHIFT K_C] > U+0426          c CYRILLIC CAPITAL LETTER TSE
+ + [K_U] > 'u'
```
Line 23:
```
- + [NCAPS SHIFT K_D] > U+0414          c CYRILLIC CAPITAL LETTER DE
+ + [K_I] > 'i'
```
Line 24:
```
- + [NCAPS SHIFT K_E] > u+0415          c CYRILLIC CAPITAL LETTER IE
+ + [K_O] > 'o'
```
... and 216 more

#### key_format (89)

Line 271:
```
- '+' + [NCAPS SHIFT K_A] > 'A'
+ '+Y' > 'Y'
```
Line 272:
```
- '+' + [NCAPS SHIFT K_B] > 'B'
+ '+Z' > 'Z'
```
Line 273:
```
- '+' + [NCAPS SHIFT K_C] > 'C'
+ '+A' > 'A'
```
Line 274:
```
- '+' + [NCAPS SHIFT K_D] > 'D'
+ '+B' > 'B'
```
Line 275:
```
- '+' + [NCAPS SHIFT K_E] > 'E'
+ '+C' > 'C'
```
... and 84 more

### sil_yupik_cyrillic_ru

- Original lines: 350
- Roundtrip lines: 269
- Identical: 18
- Different: 332

#### comment_removed (8)

Line 1:
```
- ﻿c Keyman keyboard created from Russian Basic layout
+ c Converted from LDML keyboard: und
```
Line 3:
```
- c Original comment for Russian Basic keyboard is below
+ store(&NAME) 'SIL Yupik Cyrillic RU'
```
Line 4:
```
- c dashed line
+ store(&KEYBOARDVERSION) '1.0'
```
Line 6:
```
- c --------------------------------------------------
+ store(&VERSION) '10.0'
```
Line 8:
```
- c Keyman keyboard generated by ImportKeyboard
+ 
```
... and 3 more

#### line_removed (69)

Line 2:
```
- c 
+ 
```
Line 10:
```
- c 
+ 
```
Line 184:
```
- + [CAPS SHIFT K_Q] > U+0439
+ 
```
Line 186:
```
- + [NCAPS K_R] > U+043a
+ 
```
Line 188:
```
- + [NCAPS SHIFT K_R] > U+041a
+ 
```
... and 64 more

#### unknown (2)

Line 5:
```
- c 
+ store(&COPYRIGHT) '© 2009-2020 SIL International'
```
Line 7:
```
- c 
+ store(&TARGETS) 'any'
```

#### line_added (56)

Line 13:
```
- 
+ + [K_BKQUOTE] > 'ё'
```
Line 23:
```
- 
+ + [K_0] > '0'
```
Line 25:
```
- 
+ + [K_EQUAL] > '='
```
Line 27:
```
- 
+ + [K_W] > 'ц'
```
Line 29:
```
- 
+ + [K_R] > 'к'
```
... and 51 more

#### store_reordered (9)

Line 14:
```
- store(&VERSION) '10.0'
+ + [K_1] > '1'
```
Line 15:
```
- store(&TARGETS) 'any'
+ + [K_2] > '2'
```
Line 16:
```
- store(&VISUALKEYBOARD) 'sil_yupik_cyrillic_ru.kvks'
+ + [K_3] > '3'
```
Line 17:
```
- store(&BITMAP) 'sil_yupik_cyrillic_ru.ico'
+ + [K_4] > '4'
```
Line 18:
```
- store(&LAYOUTFILE) 'sil_yupik_cyrillic_ru.keyman-touch-layout'
+ + [K_5] > '5'
```
... and 4 more

#### group_structure (2)

Line 24:
```
- begin Unicode > use(main)
+ + [K_HYPHEN] > '-'
```
Line 26:
```
- group(main) using keys
+ + [K_Q] > 'й'
```

#### rule_format (186)

Line 28:
```
- + [K_SPACE] > U+0020
+ + [K_E] > 'у'
```
Line 30:
```
- + [K_0] > U+0030
+ + [K_T] > 'е'
```
Line 31:
```
- + [SHIFT K_0] > U+0029
+ + [K_Y] > 'н'
```
Line 33:
```
- + [K_1] > U+0031
+ + [K_I] > 'ш'
```
Line 34:
```
- + [SHIFT K_1] > U+0021
+ + [K_O] > 'щ'
```
... and 181 more

### sil_ywq_plrd

- Original lines: 87
- Roundtrip lines: 13
- Identical: 4
- Different: 83

#### unknown (4)

Line 1:
```
- ﻿c 
+ c Converted from LDML keyboard: und
```
Line 3:
```
- c 
+ store(&NAME) 'Hei Yi – Black Yi (SIL)'
```
Line 5:
```
- c              
+ store(&COPYRIGHT) '© 2014-2020 SIL International'
```
Line 6:
```
- c
+ store(&VERSION) '10.0'
```

#### comment_removed (3)

Line 2:
```
- c Sample Keyboard: Black Yi, Eastern Nasu
+ 
```
Line 4:
```
- c Provided by: Erich Fickle, from David Morse legacy keyboard
+ store(&KEYBOARDVERSION) '1.1'
```
Line 7:
```
- c Fonts: 
+ store(&TARGETS) 'any'
```

#### line_removed (74)

Line 8:
```
- c
+ 
```
Line 10:
```
- store(&VERSION) '10.0'
+ 
```
Line 12:
```
- store(&TARGETS) 'web desktop'
+ 
```
Line 13:
```
- store(&COPYRIGHT) '© 2014-2020 SIL International'
+ 
```
Line 14:
```
- store(&KEYBOARDVERSION) '1.1'
+ 
```
... and 69 more

#### line_added (1)

Line 9:
```
- 
+ begin Unicode > use(main)
```

#### store_reordered (1)

Line 11:
```
- store(&NAME) 'Hei Yi – Black Yi (SIL)'
+ group(main) using keys
```
