#include "../common.h"
#include "image.h"

#if defined(WIN32) && defined(MAGICK_ENABLED)
#include <Magick++.h>
#endif
#include <simdjson.h>
#include <vips/vips8>

using namespace simdjson;

#ifdef __cplusplus
extern "C" {
#endif

void esmb_image_init() {
#if defined(WIN32) && defined(MAGICK_ENABLED)
  Magick::InitializeMagick("");
#endif
  if (VIPS_INIT("")) vips_error_exit(NULL);
  vips_cache_set_max(0);
#if VIPS_MAJOR_VERSION >= 8 && VIPS_MINOR_VERSION >= 13
  vips_block_untrusted_set(true);
  vips_operation_block_set("VipsForeignLoad", true);
  vips_operation_block_set("VipsForeignLoadJpeg", false);
  vips_operation_block_set("VipsForeignLoadPng", false);
  vips_operation_block_set("VipsForeignLoadNsgif", false);
  vips_operation_block_set("VipsForeignLoadWebp", false);
  vips_operation_block_set("VipsForeignLoadHeif", false);
#endif
  return;
}

image_result *esmb_image_process(const char *command, const char *args, size_t args_length, const char *type, const char *data, size_t length) {
  ondemand::parser parser;
  padded_string padded(args, args_length);
  ondemand::document parsedArgs = parser.iterate(padded);
  ondemand::object obj(parsedArgs);
  ArgumentMap Arguments;

  for (auto pair : obj) {
    std::string key(pair.escaped_key().value());
    auto val = pair.value();
    switch (val.type()) {
      case ondemand::json_type::boolean:
        Arguments[key] = val.get_bool();
        break;
      case ondemand::json_type::string:
        Arguments[key] = std::string(val.get_string().value());
        break;
      case ondemand::json_type::number:
        if (val.is_integer()) {
          Arguments[key] = static_cast<int>(val.get_int64());
        } else {
          Arguments[key] = static_cast<float>(val.get_double());
        }
        break;
      default:
        throw "Unimplemented value type passed to image native.";
    }
  }

  string outType = GetArgumentWithFallback<bool>(Arguments, "togif", false) ? "gif" : type;

  ArgumentMap outMap;
  if (length != 0) {
    if (MapContainsKey(FunctionMap, command)) {
      outMap = FunctionMap.at(command)(type, outType, data, length, Arguments, NULL);
    } else { // Vultu: I don't think we will ever be here, but just in case we need a descriptive error
      string cmd(command);
      throw "Error: \"FunctionMap\" does not contain \"" + cmd +
        "\", which was requested because \"length\" parameter was not 0.";
    }
  } else {
    if (MapContainsKey(NoInputFunctionMap, command)) {
      outMap = NoInputFunctionMap.at(command)(type, outType, Arguments, NULL);
    } else {
      string cmd(command);
      throw "Error: \"NoInputFunctionMap\" does not contain \"" + cmd +
        "\", which was requested because \"length\" parameter was 0.";
    }
  }

  vips_error_clear();
  vips_thread_shutdown();

  char *buf = GetArgument<char *>(outMap, "buf");

  image_result *out = (image_result *)malloc(sizeof(image_result));
  out->buf = buf;
  out->type = outType.c_str();
  out->length = GetArgument<size_t>(outMap, "size");
  return out;
}

void esmb_image_free(void *ptr, [[maybe_unused]] void *ctx) { g_free(ptr); }

#ifdef __cplusplus
}
#endif
