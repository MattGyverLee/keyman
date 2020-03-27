
#include <Windows.h>
#include <keymansentry.h>
#include <keymanversion.h>
#include <sentry.h>

#define SENTRY_DSN_DESKTOP   "https://92eb58e6005d47daa33c9c9e39458eb7@sentry.keyman.com/5"
#define SENTRY_DSN_DEVELOPER "https://39b25a09410349a58fe12aaf721565af@sentry.keyman.com/6"

int keyman_sentry_init(bool is_keyman_developer) {
  sentry_options_t *options = sentry_options_new();

  if (is_keyman_developer) {
    sentry_options_set_dsn(options, SENTRY_DSN_DEVELOPER);
  } else {
    sentry_options_set_dsn(options, SENTRY_DSN_DESKTOP);
  }

  sentry_options_set_release(options, KEYMAN_VersionWithTag);

  //sentry_options_set_environment(options, NULL);
  //sentry_options_set_dist(options, NULL);
  //sentry_options_set_debug(options, 1);

  return sentry_init(options);
}

void keyman_sentry_shutdown() {
  sentry_shutdown();
}

//
// Capture a stack trace and include the offending crash address at the top of
// the trace. Apart from skipping frames and the inclusion of TopAddr, this is
// very similar to sentry_event_value_add_stacktrace.
//
sentry_value_t CaptureStackTrace(PVOID TopAddr, DWORD FramesToSkip) {
  PVOID walked_backtrace[256];

  WORD frameCount = RtlCaptureStackBackTrace(FramesToSkip, 256, walked_backtrace, NULL);
  if (frameCount == 0) {
    return { 0 };
  }

  sentry_value_t frames = sentry_value_new_list();

  for (int i = (int)frameCount - 1; i >= 0; i--) {
    sentry_value_t frame = sentry_value_new_object();
    char buf[24];
    wsprintfA(buf, "0x%x", DWORD_PTR(walked_backtrace[i]));
    sentry_value_set_by_key(frame, "instruction_addr", sentry_value_new_string(buf));
    sentry_value_append(frames, frame);
  }

  // Insert the except address at the top of the stack
  if (TopAddr != NULL) {
    sentry_value_t frame = sentry_value_new_object();
    char buf[24];
    wsprintfA(buf, "0x%x", DWORD_PTR(TopAddr));
    sentry_value_set_by_key(frame, "instruction_addr", sentry_value_new_string(buf));
    sentry_value_append(frames, frame);
  }

  sentry_value_t stacktrace = sentry_value_new_object();
  sentry_value_set_by_key(stacktrace, "frames", frames);

  sentry_value_t threads = sentry_value_new_list();
  sentry_value_t thread = sentry_value_new_object();
  sentry_value_set_by_key(thread, "stacktrace", stacktrace);
  sentry_value_append(threads, thread);

  return threads;
}

void keyman_sentry_report_exception(DWORD ExceptionCode, PVOID ExceptionAddress) {
  sentry_value_t event;
  const int FRAMES_TO_SKIP = 0;

  event = sentry_value_new_event();

  char message[64];
  wsprintfA(message, "Exception %x at %p", ExceptionCode, ExceptionAddress);

  /*
  When we set exception information, the report is corrupted. Not sure why. So
  for now we won't create as an exception event. We still get all the information
  we want from this.

  Investigating this further at https://forum.sentry.io/t/corrupted-display-when-exception-data-is-set-using-native-sdk/9167/2

  sentry_value_t exc = sentry_value_new_object();
  sentry_value_set_by_key(exc, "type", sentry_value_new_string("Exception"));
  sentry_value_set_by_key(exc, "value", sentry_value_new_string(message));
  sentry_value_set_by_key(event, "exception", exc);*/
  sentry_value_set_by_key(event, "message", sentry_value_new_string(message));

  //sentry_event_value_add_stacktrace(event, &ExceptionAddress, 64);
  sentry_value_t threads = CaptureStackTrace(ExceptionAddress, FRAMES_TO_SKIP);
  if (threads._bits != 0) {
    sentry_value_set_by_key(event, "threads", threads);
  }

  sentry_capture_event(event);

  perror(message);
}

void keyman_sentry_report_message(keyman_sentry_level_t level, const char *logger, const char *message, bool includeStack) {
  const int FRAMES_TO_SKIP = 0;

  sentry_value_t event;

  event = sentry_value_new_event();

  event = sentry_value_new_message_event(
    /*level  */ sentry_level_t(level),
    /*logger */ logger,
    /*message*/ message
  );

  if (includeStack) {
    sentry_value_t threads = CaptureStackTrace(NULL, FRAMES_TO_SKIP);
    if (threads._bits != 0) {
      sentry_value_set_by_key(event, "threads", threads);
    }
  }

  sentry_capture_event(event);
}

/* Wrappers for main, wmain */

LPTOP_LEVEL_EXCEPTION_FILTER LastFilter;

LONG WINAPI FilterExceptions(_In_ struct _EXCEPTION_POINTERS *ExceptionInfo) {
  keyman_sentry_report_exception(ExceptionInfo->ExceptionRecord->ExceptionCode, ExceptionInfo->ExceptionRecord->ExceptionAddress);
  keyman_sentry_shutdown();
  return EXCEPTION_EXECUTE_HANDLER;
}


int keyman_sentry_main(bool is_keyman_developer, int argc, char *argv[], int (*run)(int, char**)) {
  keyman_sentry_init(is_keyman_developer);
  LastFilter = SetUnhandledExceptionFilter(FilterExceptions);

  int res = run(argc, argv);

  keyman_sentry_shutdown();

  return res;
}

int keyman_sentry_wmain(bool is_keyman_developer, int argc, wchar_t *argv[], int(*run)(int, wchar_t**)) {
  keyman_sentry_init(is_keyman_developer);
  LastFilter = SetUnhandledExceptionFilter(FilterExceptions);

  int res = run(argc, argv);

  keyman_sentry_shutdown();

  return res;
}