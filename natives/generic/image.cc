#include "../common.h"

#if defined(WIN32) && defined(MAGICK_ENABLED)
#include <Magick++.h>
#endif
#include <nlohmann/json.hpp>
#include <vips/vips8>

#ifdef __cplusplus
extern "C" {
#endif

void imageInit() {
#if defined(WIN32) && defined(MAGICK_ENABLED)
  Magick::InitializeMagick("");
#endif
  if (vips_init("")) vips_error_exit(NULL);
#if VIPS_MAJOR_VERSION >= 8 && VIPS_MINOR_VERSION >= 13
  vips_block_untrusted_set(true);
#endif
  return;
}

struct image_result {
  const char *type;
  size_t length;
  void *buf;
};

image_result *image(const char *command, const char *args, const char *data, size_t length) {
  nlohmann::json parsedArgs = nlohmann::json::parse(args);
  ArgumentMap Arguments;

  for (auto& pair : parsedArgs.items()) {
    auto key = pair.key();
    if (key == "data") {
      continue;
    }

    auto val = pair.value();
    if (val.is_boolean()) {
      Arguments[key] = val.template get<bool>();
    } else if (val.is_string()) {
      Arguments[key] = val.template get<string>();
    } else if (val.is_number_integer()) {
      Arguments[key] = val.template get<int>();
    } else if (val.is_number_float()) {
      Arguments[key] = val.template get<float>();
    } else {
      throw "Unimplemented value type passed to image native.";
    }
  }

  string type = GetArgumentWithFallback<string>(Arguments, "type", "png");
  string outType = GetArgumentWithFallback<bool>(Arguments, "togif", false) ? "gif" : type;

  size_t outLength = 0;
  ArgumentMap outMap;
  if (length != 0) {
    if (MapContainsKey(FunctionMap, command)) {
      outMap = FunctionMap.at(command)(type, outType, data, length, Arguments, outLength);
    } else { // Vultu: I don't think we will ever be here, but just in case we need a descriptive error
      string cmd(command);
      throw "Error: \"FunctionMap\" does not contain \"" + cmd + "\", which was requested because \"length\" parameter was not 0.";
    }
  } else {
    if (MapContainsKey(NoInputFunctionMap, command)) {
      outMap = NoInputFunctionMap.at(command)(type, outType, Arguments, outLength);
    } else {
      string cmd(command);
      throw "Error: \"NoInputFunctionMap\" does not contain \"" + cmd + "\", which was requested because \"length\" parameter was 0.";
    }
  }

  vips_error_clear();
  vips_thread_shutdown();

  char *buf = GetArgument<char *>(outMap, "buf");

  image_result *out = (image_result *)malloc(sizeof(image_result));
  out->buf = buf;
  out->type = type.c_str();
  out->length = outLength;
  return out;
}

void img_free(void *ptr, [[maybe_unused]] void *ctx) {
  g_free(ptr);
}

char *get_funcs() {
  nlohmann::json funcs = nlohmann::json::array();
  for (auto const& imap : FunctionMap) {
    funcs.push_back(imap.first);
  }
  for (auto const& imap : NoInputFunctionMap) {
    funcs.push_back(imap.first);
  }
  string dumped = funcs.dump();
  size_t length = dumped.length();
  char* out = new char[length + 1];
  out[length] = 0;
  dumped.copy(out, length);
  return out;
}

const char *get_type(image_result *result) { return result->type; }
void *get_data(image_result *result) { return result->buf; }
size_t get_size(image_result *result) { return result->length; }

#ifdef __cplusplus
}
#endif
