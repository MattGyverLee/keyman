/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Registry of hardware keyboard layout definitions
 */

/**
 * Hardware form types with their scancode-to-VK mappings
 */
export type HardwareForm = 'us' | 'iso' | 'jis' | 'abnt2' | 'ks';

/**
 * Scancode to virtual key mapping for different hardware forms
 * Maps row index (0-4) and column index to VK codes
 */
export interface HardwareFormLayout {
  formId: HardwareForm;
  rows: number[][]; // VK codes for each key position
}

/**
 * Registry for hardware keyboard layouts.
 *
 * Provides Virtual Key (VK) code mappings for different physical keyboard forms
 * (US/ANSI, ISO, JIS, ABNT2, KS). This enables accurate mapping between physical
 * key positions and their corresponding VK codes, which vary across keyboard layouts.
 *
 * VK codes are Windows Virtual Key codes that identify physical key positions
 * regardless of the characters they produce. For example:
 * - VK 65 is the 'A' key position
 * - VK 192 is the backtick/tilde key position
 * - VK 226 is the extra ISO key between left shift and Z
 *
 * The registry also provides conversion from VK codes to KLS (Keyboard Layer String)
 * array indices, which is the format used by KeymanWeb to store layer outputs.
 *
 * @see {@link https://docs.microsoft.com/en-us/windows/win32/inputdev/virtual-key-codes}
 */
export class HardwareLayoutRegistry {
  // Base VK codes shared across most layouts
  // Row 0: backtick, 1-9, 0, -, =
  private static readonly BASE_ROW_0 = [192, 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 189, 187];
  // Row 1: Q-P
  private static readonly BASE_ROW_1 = [81, 87, 69, 82, 84, 89, 85, 73, 79, 80];
  // Row 2: A-L
  private static readonly BASE_ROW_2 = [65, 83, 68, 70, 71, 72, 74, 75, 76];
  // Row 3: Z-M, comma, period, /
  private static readonly BASE_ROW_3 = [90, 88, 67, 86, 66, 78, 77, 188, 190, 191];
  // Row 4: space
  private static readonly BASE_ROW_4 = [32];

  /**
   * Get the hardware layout for a specific form
   * @param formId The hardware form identifier
   * @returns The layout with VK code mappings
   */
  static getLayout(formId: HardwareForm): HardwareFormLayout {
    switch (formId) {
      case 'us':
        return this.getUsLayout();
      case 'iso':
        return this.getIsoLayout();
      case 'jis':
        return this.getJisLayout();
      case 'abnt2':
        return this.getAbnt2Layout();
      case 'ks':
        return this.getKsLayout();
      default:
        return this.getUsLayout();
    }
  }

  /**
   * US keyboard layout (ANSI)
   */
  private static getUsLayout(): HardwareFormLayout {
    return {
      formId: 'us',
      rows: [
        [...this.BASE_ROW_0],                              // ` 1-9 0 - =
        [...this.BASE_ROW_1, 219, 221, 220],               // Q-P [ ] \
        [...this.BASE_ROW_2, 186, 222],                    // A-L ; '
        [...this.BASE_ROW_3],                              // Z-M , . /
        [...this.BASE_ROW_4]                               // space
      ]
    };
  }

  /**
   * ISO keyboard layout (European)
   * Adds extra key E02 (between left shift and Z, VK 226)
   * Moves backslash from row 1 to row 2
   */
  private static getIsoLayout(): HardwareFormLayout {
    return {
      formId: 'iso',
      rows: [
        [...this.BASE_ROW_0],                              // ` 1-9 0 - =
        [...this.BASE_ROW_1, 219, 221],                    // Q-P [ ] (no backslash)
        [...this.BASE_ROW_2, 186, 222, 220],               // A-L ; ' \ (backslash moved here)
        [226, ...this.BASE_ROW_3],                         // E02 + Z-M , . /
        [...this.BASE_ROW_4]                               // space
      ]
    };
  }

  /**
   * JIS keyboard layout (Japanese)
   * Adds yen key (VK 220) to row 0
   * Adds extra keys to rows 2 and 3
   */
  private static getJisLayout(): HardwareFormLayout {
    return {
      formId: 'jis',
      rows: [
        [...this.BASE_ROW_0, 220],                         // ` 1-9 0 - = yen
        [...this.BASE_ROW_1, 219, 221],                    // Q-P [ ]
        [...this.BASE_ROW_2, 186, 222, 191],               // A-L ; ' /
        [...this.BASE_ROW_3, 226, 193],                    // Z-M , . / + extra keys
        [...this.BASE_ROW_4]                               // space
      ]
    };
  }

  /**
   * ABNT2 keyboard layout (Brazilian Portuguese)
   * Similar to ISO but with additional C1 key (VK 193) in row 3
   */
  private static getAbnt2Layout(): HardwareFormLayout {
    return {
      formId: 'abnt2',
      rows: [
        [...this.BASE_ROW_0],                              // ` 1-9 0 - =
        [...this.BASE_ROW_1, 219, 221],                    // Q-P [ ]
        [...this.BASE_ROW_2, 186, 222, 220],               // A-L ; ' \
        [226, ...this.BASE_ROW_3, 193],                    // E02 + Z-M , . / + C1
        [...this.BASE_ROW_4]                               // space
      ]
    };
  }

  /**
   * KS keyboard layout (Korean)
   * Same as US layout
   */
  private static getKsLayout(): HardwareFormLayout {
    return {
      formId: 'ks',
      rows: [
        [...this.BASE_ROW_0],                              // ` 1-9 0 - =
        [...this.BASE_ROW_1, 219, 221, 220],               // Q-P [ ] \
        [...this.BASE_ROW_2, 186, 222],                    // A-L ; '
        [...this.BASE_ROW_3],                              // Z-M , . /
        [...this.BASE_ROW_4]                               // space
      ]
    };
  }

  /**
   * Convert VK code to KLS array index
   * Maps Windows Virtual Key codes to KeymanWeb's KLS array positions
   * @param vk The virtual key code
   * @returns The KLS index, or -1 if not found
   */
  static vkToKlsIndex(vk: number): number {
    // Standard mapping of VK codes to KLS indices
    // This follows KeymanWeb's expected layout
    const vkMap: Record<number, number> = {
      192: 0,   // `
      49: 1,    // 1
      50: 2,    // 2
      51: 3,    // 3
      52: 4,    // 4
      53: 5,    // 5
      54: 6,    // 6
      55: 7,    // 7
      56: 8,    // 8
      57: 9,    // 9
      48: 10,   // 0
      189: 11,  // -
      187: 12,  // =
      81: 13,   // Q
      87: 14,   // W
      69: 15,   // E
      82: 16,   // R
      84: 17,   // T
      89: 18,   // Y
      85: 19,   // U
      73: 20,   // I
      79: 21,   // O
      80: 22,   // P
      219: 23,  // [
      221: 24,  // ]
      220: 25,  // \
      65: 26,   // A
      83: 27,   // S
      68: 28,   // D
      70: 29,   // F
      71: 30,   // G
      72: 31,   // H
      74: 32,   // J
      75: 33,   // K
      76: 34,   // L
      186: 35,  // ;
      222: 36,  // '
      90: 37,   // Z
      88: 38,   // X
      67: 39,   // C
      86: 40,   // V
      66: 41,   // B
      78: 42,   // N
      77: 43,   // M
      188: 44,  // ,
      190: 45,  // .
      191: 46,  // /
      32: 47,   // space
      226: 48,  // E02 (ISO key)
      193: 49,  // C1 (ABNT2 key)
    };
    return vkMap[vk] ?? -1;
  }
}
