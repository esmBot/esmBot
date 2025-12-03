#include "media.h"
#include "../common/maps.h"

#if defined(WIN32) && defined(MAGICK_ENABLED)
#include <Magick++.h>
#endif
#include <vips/vips8>

const char *esmb_media_version() {
#ifdef ESMB_VERSION
  return ESMB_VERSION;
#else
  return "unknown";
#endif
}

esmb_media_result *esmb_media_process(const char *command, esmb::ArgumentMap args, const char *type,
                                      const char *out_type, const char *data, size_t length) {
  // std::string outType = GetArgumentWithFallback<bool>(args, "togif", false) ? "gif" : type;
  std::string outType = out_type;

  CmdOutput outData;
  if (length != 0) {
    if (MapContainsKey(esmb::Image::FunctionMap, command)) {
      outData = esmb::Image::FunctionMap.at(command)(type, outType, data, length, args, NULL);
    } else { // Vultu: I don't think we will ever be here, but just in case we need a descriptive error
      std::string cmd(command);
      throw "Error: \"FunctionMap\" does not contain \"" + cmd +
        "\", which was requested because \"length\" parameter was not 0.";
    }
  } else {
    if (MapContainsKey(esmb::Image::NoInputFunctionMap, command)) {
      outData = esmb::Image::NoInputFunctionMap.at(command)(type, outType, args, NULL);
    } else {
      std::string cmd(command);
      throw "Error: \"NoInputFunctionMap\" does not contain \"" + cmd +
        "\", which was requested because \"length\" parameter was 0.";
    }
  }

  vips_error_clear();
  vips_thread_shutdown();

  esmb_media_result *out = (esmb_media_result *)malloc(sizeof(esmb_media_result));
  out->buf = outData.buf;
  out->type = outType.c_str();
  out->length = outData.length;
  return out;
}

#ifdef __cplusplus
extern "C" {
#endif

void esmb_media_init() {
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

esmb_media_args *esmb_media_create_args() { return reinterpret_cast<esmb_media_args *>(new esmb::ArgumentMap); }

// todo: find a way to combine these
void esmb_media_add_string_arg(esmb_media_args *args, char *key, char *value) {
  reinterpret_cast<esmb::ArgumentMap *>(args)->insert(std::make_pair(key, value));
}

void esmb_media_add_float_arg(esmb_media_args *args, char *key, float value) {
  reinterpret_cast<esmb::ArgumentMap *>(args)->insert(std::make_pair(key, value));
}

void esmb_media_add_int_arg(esmb_media_args *args, char *key, int value) {
  reinterpret_cast<esmb::ArgumentMap *>(args)->insert(std::make_pair(key, value));
}

void esmb_media_add_bool_arg(esmb_media_args *args, char *key, bool value) {
  reinterpret_cast<esmb::ArgumentMap *>(args)->insert(std::make_pair(key, value));
}

esmb_media_result *esmb_media_process(const char *command, void *args, const char *type, const char *out_type,
                                      const char *data, size_t length) {
  esmb::ArgumentMap arguments = *reinterpret_cast<esmb::ArgumentMap *>(args);

  return esmb_media_process(command, arguments, type, out_type, data, length);
}

void esmb_media_free_result(esmb_media_result *obj) {
  // free(obj->type);
  // delete obj->type;
  free(obj->buf);
  free(obj);
}

#ifdef __cplusplus
}
#endif
