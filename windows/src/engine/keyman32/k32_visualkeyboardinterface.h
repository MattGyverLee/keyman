/*
 * Keyman is copyright (C) SIL Global. MIT License.
 *
 * Created by mcdurdin on 2025-10-08
 *
 * Interface between keyman32.dll and the visual keyboard module hosted in
 * keyman.exe
 */

 #pragma once

/**
 * #8064 Set in the flags of WM_KEYMAN_OSK_MODIFIER_EVENT when IsKeymanInjectedKeyEvent says Keyman
 * injected the event. The visual keyboard cannot decide this itself: do_keybd_event gives an
 * injected Right Shift the real scan code 0x36, and dwExtraInfo is not carried in this message.
 *
 * Clear of the KEYEVENTF_ bits that share this field (0x1-0x8) and of the 0x0FFF0000 scan code
 * mask. Read by UfrmOSKOnScreenKeyboard.pas (#16462), which redeclares the value.
 */
#define KEYMAN_OSK_MODIFIER_FLAG_KEYMAN_INJECTED 0x00000010

HWND GetVisualKeyboardWindow();
void PostVisualKeyboardModifierEvent(UINT vkCode, DWORD flags);
BOOL PostMessageToVisualKeyboardWindowIfExists(UINT msg, WPARAM wParam, LPARAM lParam);
