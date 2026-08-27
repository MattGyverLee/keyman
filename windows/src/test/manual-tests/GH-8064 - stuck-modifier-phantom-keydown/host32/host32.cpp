/*
 * Keyman is copyright (C) SIL Global. MIT License.
 *
 * A minimal 32-bit host application for the GH-8064 reproduction, per run-8064-test.ps1.
 *
 * The test needs a WOW64 process with a text field, because serialkeyeventserver.cpp is
 * #ifndef _WIN64: the modifier cache the defect lives in exists only in the 32-bit engine. On
 * Windows 11 there is no longer a stock 32-bit editor to use -- notepad.exe and
 * SysWOW64\notepad.exe both resolve to the 64-bit packaged Notepad -- so the test supplies its own.
 *
 * Deliberately minimal: one top-level window, one multiline Edit child filling it, a fixed window
 * class and title so the harness can find it, and no menus, dialogs or file handling that could
 * swallow a keystroke or hold real data.
 *
 * Build (32-bit, from a shell with the Keyman build environment sourced):
 *   cl /nologo /W4 /EHsc /MT /DUNICODE /D_UNICODE host32.cpp /link /SUBSYSTEM:WINDOWS \
 *      user32.lib gdi32.lib /OUT:host32.exe
 */
#include <windows.h>

static const wchar_t *CLASS_NAME  = L"GH8064Host";
static const wchar_t *WINDOW_NAME = L"GH-8064 host32";

static HWND g_edit = NULL;

/*
  Publishes this thread's active keyboard layout in the window title.

  The harness cannot read it from outside: GetKeyboardLayout(idThread) returns 0 for a thread in
  another process, so a cross-process check always looks like "no layout". The host knows its own
  layout, and a window title is readable cross-process, so the host reports and the harness parses.
  Without this the harness cannot tell whether a Keyman keyboard is selected, and a run with the
  base layout selected fires no rule, assembles no batch, and proves nothing.
*/
static void
PublishLayout(HWND hwnd) {
  wchar_t title[128];
  const HKL hkl = GetKeyboardLayout(0);
  wsprintf(title, L"%s [HKL=%08X]", WINDOW_NAME, (unsigned)(ULONG_PTR)hkl);
  SetWindowText(hwnd, title);
}

static LRESULT CALLBACK
WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
  switch (msg) {
  case WM_CREATE:
    // Multiline and no border: the harness reads this control's text with WM_GETTEXT to confirm
    // Keyman actually transformed the probe string.
    g_edit = CreateWindowEx(
        0, L"EDIT", L"",
        WS_CHILD | WS_VISIBLE | ES_LEFT | ES_MULTILINE | ES_AUTOVSCROLL | ES_WANTRETURN,
        0, 0, 0, 0, hwnd, NULL, NULL, NULL);
    if (g_edit == NULL) {
      return -1;
    }
    PublishLayout(hwnd);
    return 0;

  case WM_INPUTLANGCHANGE:
    PublishLayout(hwnd);
    return DefWindowProc(hwnd, msg, wParam, lParam);

  case WM_SIZE:
    if (g_edit != NULL) {
      MoveWindow(g_edit, 0, 0, LOWORD(lParam), HIWORD(lParam), TRUE);
    }
    return 0;

  case WM_SETFOCUS:
    // Keystrokes must reach the edit control, not the frame.
    if (g_edit != NULL) {
      SetFocus(g_edit);
    }
    return 0;

  case WM_ACTIVATE:
    // Also claim focus on activation. Setting it once in wWinMain is not enough: when the window is
    // raised by another process the frame can end up foreground with no focus window in this
    // thread at all, and SendInput keystrokes then go nowhere. GetFocus() reporting 0 while the
    // window is foreground is the symptom.
    if (LOWORD(wParam) != WA_INACTIVE && g_edit != NULL) {
      SetFocus(g_edit);
    }
    return 0;

  case WM_CLOSE:
    DestroyWindow(hwnd);
    return 0;

  case WM_DESTROY:
    PostQuitMessage(0);
    return 0;

  default:
    break;
  }
  return DefWindowProc(hwnd, msg, wParam, lParam);
}

int WINAPI
wWinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PWSTR pCmdLine, int nCmdShow) {
  UNREFERENCED_PARAMETER(hPrevInstance);
  UNREFERENCED_PARAMETER(pCmdLine);

  WNDCLASS wc = { 0 };
  wc.lpfnWndProc   = WndProc;
  wc.hInstance     = hInstance;
  wc.lpszClassName = CLASS_NAME;
  wc.hCursor       = LoadCursor(NULL, IDC_IBEAM);
  wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
  if (!RegisterClass(&wc)) {
    return 1;
  }

  HWND hwnd = CreateWindowEx(
      0, CLASS_NAME, WINDOW_NAME, WS_OVERLAPPEDWINDOW,
      CW_USEDEFAULT, CW_USEDEFAULT, 640, 320,
      NULL, NULL, hInstance, NULL);
  if (hwnd == NULL) {
    return 1;
  }

  ShowWindow(hwnd, nCmdShow);
  SetForegroundWindow(hwnd);
  PublishLayout(hwnd);
  if (g_edit != NULL) {
    SetFocus(g_edit);
  }

  MSG msg;
  while (GetMessage(&msg, NULL, 0, 0) > 0) {
    TranslateMessage(&msg);
    DispatchMessage(&msg);
  }
  return 0;
}
