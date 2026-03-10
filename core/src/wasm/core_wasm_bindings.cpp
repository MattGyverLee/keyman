/*
  Copyright:    © 2026 SIL International.
  Description:  Emscripten embind bindings exposing Keyman Core C API to JavaScript.
                Provides a thin marshaling layer for WASM consumers (e.g. the web engine).
  Create Date:  10 Mar 2026
  Authors:      Keyman Development Team
*/

#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <cstring>
#include <string>
#include <vector>

#include "keyman_core.h"

using namespace emscripten;

// ---------------------------------------------------------------------------
// Helper: convert a km_core_actions struct to a JS-friendly object
// ---------------------------------------------------------------------------

static val actions_to_js(km_core_actions const *actions) {
  if (!actions) {
    return val::null();
  }

  val result = val::object();
  result.set("code_points_to_delete", actions->code_points_to_delete);
  result.set("do_alert", static_cast<bool>(actions->do_alert));
  result.set("emit_keystroke", static_cast<bool>(actions->emit_keystroke));
  result.set("new_caps_lock_state", static_cast<int>(actions->new_caps_lock_state));

  // Marshal output string (UTF-32 → JS string via UTF-16)
  if (actions->output) {
    std::u32string u32out(reinterpret_cast<const char32_t *>(actions->output));
    // Convert UTF-32 to a JS array of codepoints for lossless transfer
    val output_arr = val::array();
    for (size_t i = 0; i < u32out.size(); i++) {
      output_arr.call<void>("push", static_cast<uint32_t>(u32out[i]));
    }
    result.set("output", output_arr);
  } else {
    result.set("output", val::array());
  }

  // Marshal deleted_context similarly
  if (actions->deleted_context) {
    std::u32string u32del(reinterpret_cast<const char32_t *>(actions->deleted_context));
    val del_arr = val::array();
    for (size_t i = 0; i < u32del.size(); i++) {
      del_arr.call<void>("push", static_cast<uint32_t>(u32del[i]));
    }
    result.set("deleted_context", del_arr);
  } else {
    result.set("deleted_context", val::array());
  }

  // Marshal persist_options
  if (actions->persist_options) {
    val opts = val::array();
    for (km_core_option_item *opt = actions->persist_options; opt->key; opt++) {
      val item = val::object();
      // Convert km_core_cu (char16_t) strings to JS
      item.set("key", val(std::u16string(opt->key)));
      item.set("value", val(std::u16string(opt->value)));
      item.set("scope", static_cast<int>(opt->scope));
      opts.call<void>("push", item);
    }
    result.set("persist_options", opts);
  } else {
    result.set("persist_options", val::array());
  }

  return result;
}

// ---------------------------------------------------------------------------
// Wrapper class: manages keyboard + state lifecycle for JS consumers
// ---------------------------------------------------------------------------

class CoreKeyboardState {
public:
  CoreKeyboardState()
    : keyboard_(nullptr), state_(nullptr) {}

  ~CoreKeyboardState() {
    dispose();
  }

  // Load a keyboard from a binary blob (Uint8Array from JS)
  int loadKeyboard(val blob_val) {
    if (keyboard_) {
      km_core_keyboard_dispose(keyboard_);
      keyboard_ = nullptr;
    }
    if (state_) {
      km_core_state_dispose(state_);
      state_ = nullptr;
    }

    // Copy Uint8Array data into a C++ vector
    unsigned int length = blob_val["length"].as<unsigned int>();
    std::vector<uint8_t> buf(length);
    val memory = val::module_property("HEAPU8")["buffer"];
    val memoryView = val::global("Uint8Array").new_(memory);

    // Use a temporary heap allocation to copy JS typed array data
    uint8_t *heap_ptr = reinterpret_cast<uint8_t *>(malloc(length));
    if (!heap_ptr) {
      return KM_CORE_STATUS_NO_MEM;
    }

    // Copy from JS
    val heap_view = val::global("Uint8Array").new_(
      memory, reinterpret_cast<uintptr_t>(heap_ptr), length
    );
    heap_view.call<void>("set", blob_val);
    memcpy(buf.data(), heap_ptr, length);
    free(heap_ptr);

    km_core_status status = km_core_keyboard_load_from_blob(
      "", buf.data(), buf.size(), &keyboard_
    );

    if (status != KM_CORE_STATUS_OK) {
      return static_cast<int>(status);
    }

    // Create state with default environment options
    km_core_option_item env_opts[] = {
      KM_CORE_OPTIONS_END
    };

    status = km_core_state_create(keyboard_, env_opts, &state_);
    return static_cast<int>(status);
  }

  // Process a keystroke event
  val processEvent(uint32_t vk, uint16_t modifier_state, bool is_key_down) {
    if (!state_) {
      return val::null();
    }

    km_core_status status = km_core_process_event(
      state_, vk, modifier_state,
      is_key_down ? 1 : 0,
      0 // event_flags
    );

    if (status != KM_CORE_STATUS_OK) {
      val err = val::object();
      err.set("error", static_cast<int>(status));
      return err;
    }

    km_core_actions const *actions = km_core_state_get_actions(state_);
    return actions_to_js(actions);
  }

  // Send keyboard activated event
  int activateKeyboard() {
    if (!state_) {
      return KM_CORE_STATUS_INVALID_ARGUMENT;
    }
    return static_cast<int>(km_core_event(state_, KM_CORE_EVENT_KEYBOARD_ACTIVATED, nullptr));
  }

  // Set context from a UTF-16 string
  int setContext(std::u16string context_str) {
    if (!state_) {
      return KM_CORE_STATUS_INVALID_ARGUMENT;
    }
    km_core_context_status ctx_status = km_core_state_context_set_if_needed(
      state_,
      reinterpret_cast<km_core_cu const *>(context_str.c_str())
    );
    return static_cast<int>(ctx_status);
  }

  // Clear context
  void clearContext() {
    if (state_) {
      km_core_state_context_clear(state_);
    }
  }

  // Get keyboard attributes
  val getKeyboardAttrs() {
    if (!keyboard_) {
      return val::null();
    }
    km_core_keyboard_attrs const *attrs = nullptr;
    km_core_status status = km_core_keyboard_get_attrs(keyboard_, &attrs);
    if (status != KM_CORE_STATUS_OK || !attrs) {
      return val::null();
    }
    val result = val::object();
    result.set("version_string", std::u16string(attrs->version_string));
    result.set("id", std::u16string(attrs->id));
    return result;
  }

  // Check if keyboard is loaded
  bool isKeyboardLoaded() const {
    return keyboard_ != nullptr && state_ != nullptr;
  }

  // Release all resources
  void dispose() {
    if (state_) {
      km_core_state_dispose(state_);
      state_ = nullptr;
    }
    if (keyboard_) {
      km_core_keyboard_dispose(keyboard_);
      keyboard_ = nullptr;
    }
  }

private:
  km_core_keyboard *keyboard_;
  km_core_state *state_;
};

// ---------------------------------------------------------------------------
// Embind registration
// ---------------------------------------------------------------------------

EMSCRIPTEN_BINDINGS(keyman_core) {
  class_<CoreKeyboardState>("CoreKeyboardState")
    .constructor<>()
    .function("loadKeyboard", &CoreKeyboardState::loadKeyboard)
    .function("processEvent", &CoreKeyboardState::processEvent)
    .function("activateKeyboard", &CoreKeyboardState::activateKeyboard)
    .function("setContext", &CoreKeyboardState::setContext)
    .function("clearContext", &CoreKeyboardState::clearContext)
    .function("getKeyboardAttrs", &CoreKeyboardState::getKeyboardAttrs)
    .function("isKeyboardLoaded", &CoreKeyboardState::isKeyboardLoaded)
    .function("dispose", &CoreKeyboardState::dispose);

  // Expose status codes as constants
  constant("KM_CORE_STATUS_OK", static_cast<int>(KM_CORE_STATUS_OK));
  constant("KM_CORE_STATUS_NO_MEM", static_cast<int>(KM_CORE_STATUS_NO_MEM));
  constant("KM_CORE_STATUS_IO_ERROR", static_cast<int>(KM_CORE_STATUS_IO_ERROR));
  constant("KM_CORE_STATUS_INVALID_ARGUMENT", static_cast<int>(KM_CORE_STATUS_INVALID_ARGUMENT));
  constant("KM_CORE_STATUS_KEY_ERROR", static_cast<int>(KM_CORE_STATUS_KEY_ERROR));

  // Expose caps lock state constants
  constant("KM_CORE_CAPS_UNCHANGED", static_cast<int>(KM_CORE_CAPS_UNCHANGED));
  constant("KM_CORE_CAPS_OFF", static_cast<int>(KM_CORE_CAPS_OFF));
  constant("KM_CORE_CAPS_ON", static_cast<int>(KM_CORE_CAPS_ON));
}
