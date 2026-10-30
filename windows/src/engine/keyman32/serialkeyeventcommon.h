#pragma once

#include <windows.h>

// We permit up to 256 input events in a single transaction
// This allows roughly 120 characters to be output from a single
// Keyman rule, less a bit of space for modifier shenanigans
#define MAX_KEYEVENT_INPUTS 256

// Length of the KeymanModifierVks table (keymanengine.h).
#define KEYMAN_MODIFIER_VK_COUNT 6

// We need to reserve space for up to KEYMAN_MODIFIER_VK_COUNT modifier key events + 2 prefix
// key events at the end of the buffer in order to make sure that we can reset the modifier
// state at the end of the output. This value depends on keybd_shift behaviour.
#define MAX_KEYEVENT_INPUTS_MODIFIERS (KEYMAN_MODIFIER_VK_COUNT + 2)

// #8064 A batch is the release half and the output keys, which share the first 248 slots, then the
// restore half in the last 8. Output keys that do not fit are dropped from the tail, so the release
// and restore halves always stay paired. The worst case fills all 256 slots exactly, so an
// off-by-one in the output loop bound is a heap overrun.

#define KEYEVENT_WINDOW_CLASS "Keyman_KeyEventConsumerWnd"

#define GLOBAL_FILE_MAPPING_NAME "KeymanEngine_KeyEvent_FileMapping"
#define GLOBAL_KEY_EVENT_NAME "KeymanEngine_KeyEvent"
#define GLOBAL_KEY_MUTEX_NAME "KeymanEngine_KeyMutex"

/**
WM_USER private messages -- used only for communication 
between low level keyboard hook and serial key event server
*/
#define WM_KEYMAN_KEY_EVENT (WM_USER + 1)
#define WM_KEYMAN_MODIFIER_EVENT (WM_USER + 2)

/**
  #8064 Posted by the serial key event server to itself after a batch's SendInput, when the restore
  half pressed a modifier; wParam is the restore mask. Posted rather than checked inline, so that
  every modifier event the hook posted before it, including a user release that raced the batch,
  has reached the cache first.
*/
#define WM_KEYMAN_VERIFY_MODIFIER_EVENT (WM_USER + 3)

/**
  The INPUT structure and the KEYBDINPUT structure both vary in size between x86 and x64
  because of the presence of the ULONG_PTR member dwExtraInfo. Thus we need to maintain an
  equal sized structure between the two platforms for shared memory, and copy into INPUT
  structures before sending the input.
*/
struct CSDINPUT {
  WORD      wVk;
  WORD      wScan;
  DWORD     dwFlags;
  DWORD     time;
  ULONGLONG extraInfo;
};

struct SerialKeyEventSharedData {
  DWORD nInputs;
  CSDINPUT inputs[MAX_KEYEVENT_INPUTS];
};

// Live modifier-state reader. A function pointer, not a mock: gmock is not linked into
// keyman32.tests.vcxproj, so the tests bind a file-local stub.
typedef SHORT (WINAPI *PGETASYNCKEYSTATE)(int vKey);

// Message-post seam, a function pointer for the same reason as PGETASYNCKEYSTATE.
typedef BOOL (WINAPI *PPOSTMESSAGEFN)(HWND hWnd, UINT Msg, WPARAM wParam, LPARAM lParam);

// Defined in keybd_shift.cpp, outside any _WIN64 guard so both architectures and the gtest project
// can reach it. feedIsConfigured means the hook's cache feed is configured on, not that it is
// working: flag_ShouldSerializeInput can read TRUE while the hook is not running.
int PrepareInjectedInputBatch(
  LPINPUT pInputs,
  LPBYTE const kbd,
  const SerialKeyEventSharedData *pSharedData,
  PGETASYNCKEYSTATE pfnGetAsyncKeyState,
  BOOL feedIsConfigured = TRUE,
  DWORD *pRestorePressedMask = NULL,
  int *pRestoreEventIndex = NULL);

// Defined in keybd_shift.cpp; see WM_KEYMAN_VERIFY_MODIFIER_EVENT.
int PrepareModifierVerificationCorrection(
  LPINPUT pInputs,
  LPBYTE const kbd,
  DWORD restorePressedMask,
  PGETASYNCKEYSTATE pfnGetAsyncKeyState);


