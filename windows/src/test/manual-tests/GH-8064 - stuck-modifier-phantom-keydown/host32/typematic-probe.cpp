/*
  GH-8064 FR-003a -- does Windows typematic-repeat a HELD MODIFIER?

  WHY THIS MEASUREMENT EXISTS. FR-003 has to state how long a hold dropped by an injected batch
  stays dropped. The engine's release half reads live OS state and its restore half reads the
  modifier cache, so where the OS reports a modifier held that the cache does not claim, the release
  releases it and the restore does not press it back. The hold is gone until the next event on that
  key re-feeds the cache.

  "Until the next event on that key" is the whole question. If Windows typematic-repeats a held
  modifier, the repeat KEYDOWN is that next event, it arrives within a second, and -- this is the
  part that matters -- it requires NO finger-versus-phantom decision, because a typematic repeat
  only ever occurs for a key that is physically down. The repeat is its own discriminator. If
  Windows does NOT repeat held modifiers, the next event is the user's own release and re-press, and
  the drop lasts as long as they keep holding.

  Those are very different cost statements, and a spec that strikes findings for lacking a recorded
  run may not rest either one on an unmeasured platform claim. Hence this probe.

  TWO CASES, and they are expected to differ:

    A. modifier held ALONE.                     Can repeat.
    B. modifier held WHILE ANOTHER KEY IS TYPED. This is the canonical #8064 trace -- the user is
                                                holding Ctrl or Shift and typing. Typing another key
                                                is expected to stop the modifier repeating, because
                                                Windows repeats only the most recently pressed key.

  Case B is the one the cost statement actually depends on, because it is the case the defect occurs
  in. Case A alone would let a reader conclude "repeats rescue it" when in the shape that matters
  they may not.

    C. injected hold, the control. SendInput a KEYDOWN and never release it. Fully automatic, no
       person required. Establishes whether Keyman's OWN restore press can be re-fed by a repeat,
       which is a separate question with the same shape.

  WHAT THIS PROBE CANNOT DO. Cases A and B need a key held down by a finger. Injection cannot
  produce a typematic repeat, so no automated run can substitute. `--physical` therefore prints
  instructions and measures fixed windows; a person has to be at the keyboard. `--injected` needs
  nobody.

  BUILD, with the harness's documented one-liner:

    cl /nologo /W4 /EHsc /MT /DUNICODE /D_UNICODE typematic-probe.cpp ^
       /link /SUBSYSTEM:CONSOLE user32.lib /OUT:typematic-probe.exe

  RUN:

    typematic-probe.exe --injected     (automatic)
    typematic-probe.exe --physical     (a person holds keys when told to)
    typematic-probe.exe                (both, injected first)
*/

#include <windows.h>
#include <stdio.h>

namespace {

// One low level keyboard event, as the hook saw it.
struct Event {
  double atMs;      // milliseconds since the probe's clock started
  DWORD vkCode;
  DWORD scanCode;
  DWORD flags;      // LLKHF_UP, LLKHF_INJECTED, LLKHF_EXTENDED
  ULONG_PTR extraInfo;
};

const int kMaxEvents = 4096;

Event g_events[kMaxEvents];
int g_count = 0;
HHOOK g_hook          = NULL;
LARGE_INTEGER g_freq  = { 0 };
LARGE_INTEGER g_start = { 0 };

double
NowMs() {
  LARGE_INTEGER t;
  QueryPerformanceCounter(&t);
  return (double)(t.QuadPart - g_start.QuadPart) * 1000.0 / (double)g_freq.QuadPart;
}

LRESULT CALLBACK
ProbeHook(int nCode, WPARAM wParam, LPARAM lParam) {
  if (nCode == HC_ACTION && g_count < kMaxEvents) {
    const KBDLLHOOKSTRUCT *hs   = (const KBDLLHOOKSTRUCT *)lParam;
    g_events[g_count].atMs      = NowMs();
    g_events[g_count].vkCode    = hs->vkCode;
    g_events[g_count].scanCode  = hs->scanCode;
    g_events[g_count].flags     = hs->flags;
    g_events[g_count].extraInfo = hs->dwExtraInfo;
    g_count++;
  }
  return CallNextHookEx(g_hook, nCode, wParam, lParam);
}

// WH_KEYBOARD_LL delivers through the installing thread's message queue, so it has to be pumped.
void
PumpFor(DWORD ms) {
  const DWORD until = GetTickCount() + ms;
  MSG msg;
  while (GetTickCount() < until) {
    while (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
      TranslateMessage(&msg);
      DispatchMessage(&msg);
    }
    Sleep(1);
  }
}

void
Rewind() {
  g_count = 0;
  QueryPerformanceCounter(&g_start);
}

bool
IsShift(DWORD vk) {
  return vk == VK_LSHIFT || vk == VK_RSHIFT || vk == VK_SHIFT;
}

// Counts KEYDOWNs for the given predicate, and reports the gaps between consecutive ones, which is
// what tells a repeat apart from a person pressing the key twice.
void
ReportRepeats(const char *label, bool (*match)(DWORD), int firstIsThePress) {
  int downs = 0;
  double prev = -1.0, firstGap = -1.0, minGap = -1.0, maxGap = -1.0;

  for (int i = 0; i < g_count; i++) {
    if ((g_events[i].flags & LLKHF_UP) || !match(g_events[i].vkCode)) {
      continue;
    }
    downs++;
    if (prev >= 0.0) {
      const double gap = g_events[i].atMs - prev;
      if (firstGap < 0.0) {
        firstGap = gap;
      }
      if (minGap < 0.0 || gap < minGap) {
        minGap = gap;
      }
      if (gap > maxGap) {
        maxGap = gap;
      }
    }
    prev = g_events[i].atMs;
  }

  const int repeats = downs > firstIsThePress ? downs - firstIsThePress : 0;

  printf("  %-34s KEYDOWNs=%-4d repeats=%-4d", label, downs, repeats);
  if (repeats > 0) {
    printf("  first gap=%.0fms  min=%.0fms  max=%.0fms\n", firstGap, minGap, maxGap);
  } else {
    printf("  (no repeat observed)\n");
  }
}

bool
MatchShift(DWORD vk) {
  return IsShift(vk);
}

bool
MatchNotShift(DWORD vk) {
  return !IsShift(vk);
}

void
Countdown(const char *what, int seconds) {
  printf("\n  >>> %s\n", what);
  for (int i = seconds; i > 0; i--) {
    printf("      starting in %d...\r", i);
    fflush(stdout);
    PumpFor(1000);
  }
  printf("      MEASURING NOW                    \n");
}

// ------------------------------------------------------------------ case C, the automatic control
void
RunInjected() {
  printf("\nCASE C -- INJECTED HOLD (the control; nobody has to touch the keyboard)\n");
  printf("  SendInput a Left Shift KEYDOWN, never release it, and watch for 6 seconds.\n");

  if (GetAsyncKeyState(VK_LSHIFT) < 0) {
    printf("  ABORTED: Left Shift already reads down. Let go of every modifier and re-run.\n");
    return;
  }

  Rewind();

  INPUT down;
  memset(&down, 0, sizeof(down));
  down.type       = INPUT_KEYBOARD;
  down.ki.wVk     = VK_LSHIFT;
  down.ki.wScan   = 0x2A;
  down.ki.dwFlags = 0;

  if (SendInput(1, &down, sizeof(INPUT)) != 1) {
    printf("  ABORTED: SendInput did not accept the KEYDOWN.\n");
    return;
  }

  PumpFor(6000);

  // Release before reporting, unconditionally, so a failure never leaves Shift asserted
  // machine-wide.
  INPUT up = down;
  up.ki.dwFlags = KEYEVENTF_KEYUP;
  SendInput(1, &up, sizeof(INPUT));
  PumpFor(300);

  ReportRepeats("injected Shift held 6s", MatchShift, 1);
  printf("  VERDICT: an injected hold %s typematic-repeat on this machine.\n",
         (g_count > 2) ? "DOES" : "does NOT");
  printf("  Consequence: Keyman's own restore press %s be re-fed to the cache by a repeat.\n",
         (g_count > 2) ? "CAN" : "cannot");
}

// ------------------------------------------------------- cases A and B, a person has to be present
void
RunPhysical() {
  printf("\n=======================================================================\n");
  printf("A PERSON IS REQUIRED FOR THE NEXT TWO CASES.\n");
  printf("Injection cannot produce a typematic repeat, so there is no automatic\n");
  printf("substitute: a finger has to hold the key down.\n");
  printf("=======================================================================\n");

  // ---- case A
  printf("\nCASE A -- MODIFIER HELD ALONE\n");
  Countdown("HOLD LEFT SHIFT DOWN and keep holding it. Type nothing else.", 4);
  Rewind();
  PumpFor(6000);
  printf("      you can let go now\n");
  PumpFor(700);
  ReportRepeats("physical Shift held alone 6s", MatchShift, 1);
  const int aRepeats = g_count;

  // ---- case B
  printf("\nCASE B -- MODIFIER HELD WHILE ANOTHER KEY IS TYPED (the canonical #8064 trace)\n");
  Countdown("HOLD LEFT SHIFT DOWN and keep tapping the 'a' key throughout.", 4);
  Rewind();
  PumpFor(6000);
  printf("      you can let go now\n");
  PumpFor(700);
  ReportRepeats("physical Shift, other key typed", MatchShift, 1);
  ReportRepeats("  the other key, for contrast", MatchNotShift, 0);

  printf("\n  Read the two together. If case A repeats and case B does not, the repeat cannot be\n");
  printf("  relied on in the shape the defect actually occurs in, and FR-003's duration is the\n");
  printf("  user's own release and re-press. (A=%d events captured.)\n", aRepeats);
}

} // namespace

int
main(int argc, char **argv) {
  bool doInjected = true, doPhysical = true;

  for (int i = 1; i < argc; i++) {
    if (strcmp(argv[i], "--injected") == 0) {
      doPhysical = false;
    } else if (strcmp(argv[i], "--physical") == 0) {
      doInjected = false;
    }
  }

  setvbuf(stdout, NULL, _IONBF, 0);
  QueryPerformanceFrequency(&g_freq);
  QueryPerformanceCounter(&g_start);

  printf("GH-8064 FR-003a typematic repeat probe\n");
  printf("Does Windows typematic-repeat a held modifier, and does typing another key stop it?\n");

  g_hook = SetWindowsHookEx(WH_KEYBOARD_LL, ProbeHook, GetModuleHandle(NULL), 0);
  if (g_hook == NULL) {
    printf("FAILED: could not install WH_KEYBOARD_LL (error %lu). Nothing was measured.\n", GetLastError());
    return 1;
  }

  if (doInjected) {
    RunInjected();
  }
  if (doPhysical) {
    RunPhysical();
  }

  UnhookWindowsHookEx(g_hook);
  g_hook = NULL;

  printf("\nDone. Left Shift now reads %s.\n", GetAsyncKeyState(VK_LSHIFT) < 0 ? "DOWN -- press and release it" : "up");
  return 0;
}
