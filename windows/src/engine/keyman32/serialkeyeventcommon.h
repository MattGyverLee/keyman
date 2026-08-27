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
  #8064 residual gaps, Task 1. Posted by the serial key event server to itself, after a batch's
  SendInput returns, when that batch's restore half pressed at least one modifier. wParam is the
  bitmask PrepareInjectedInputBatch wrote to its pRestorePressedMask out-param: bit i set iff
  KeymanModifierVks[i] was pressed.

  This MUST be a posted message, not an inline check made right after SendInput returns. Posted
  messages are FIFO. By the time this message is dispatched, every modifier event the low level
  hook posted *before* this one was posted -- including a user's real release that raced the batch
  -- has already worked its way through WM_KEYMAN_MODIFIER_EVENT's handler and been applied to the
  cache. An inline check does not get that guarantee: at the moment SendInput returns, those
  WM_KEYMAN_MODIFIER_EVENT messages can already be sitting undispatched in this thread's own queue,
  because we are still inside DispatchMessage for the WM_USER that triggered the batch in the first
  place -- nothing pumps the queue again until that call returns. Reading the cache at that point
  would race the very events this pass exists to wait for.

  See PrepareModifierVerificationCorrection (keybd_shift.cpp) for what the handler does with the
  mask, and SerialKeyEventServer::WndProc for the handler itself.
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

// Defined in keybd_shift.cpp. Outside any _WIN64 guard on purpose, so both architectures and the
// gtest project can reach it.
//
// cacheIsFed and pRestorePressedMask are #8064 residual-gaps additions (Tasks 1 and 2). Both
// default so every existing call site -- production and the whole existing test suite -- is
// unaffected. See the function's own doc comment in keybd_shift.cpp for what each does.
int PrepareInjectedInputBatch(
  LPINPUT pInputs,
  LPBYTE const kbd,
  const SerialKeyEventSharedData *pSharedData,
  PGETASYNCKEYSTATE pfnGetAsyncKeyState,
  BOOL cacheIsFed = TRUE,
  DWORD *pRestorePressedMask = NULL);

// #8064 residual gaps, Task 1. Defined in keybd_shift.cpp; see its doc comment there and
// WM_KEYMAN_VERIFY_MODIFIER_EVENT above for the full mechanism.
int PrepareModifierVerificationCorrection(
  LPINPUT pInputs,
  LPBYTE const kbd,
  DWORD restorePressedMask,
  PGETASYNCKEYSTATE pfnGetAsyncKeyState);


