#pragma once
#include <cstddef>
#ifdef __cplusplus
#include "../common/argmap.h"
#endif

struct esmb_media_result {
  const char *type;
  size_t length;
  void *buf;
};

#ifdef __cplusplus

esmb_media_result *esmb_media_process(const char *command, esmb::ArgumentMap args, const char *type,
                                      const char *out_ype, const char *data, size_t length);

extern "C" {
#endif

void esmb_media_init();
const char *esmb_media_version();

// wrappers for the esmb::ArgumentMap class
typedef void esmb_media_args;

esmb_media_args *esmb_media_create_args();
void esmb_media_add_string_arg(esmb_media_args *args, char *key, char *value);
void esmb_media_add_float_arg(esmb_media_args *args, char *key, float value);
void esmb_media_add_int_arg(esmb_media_args *args, char *key, int value);
void esmb_media_add_bool_arg(esmb_media_args *args, char *key, bool value);

esmb_media_result *esmb_media_process(const char *command, void *args, const char *type, const char *out_type,
                                      const char *data, size_t length);
void esmb_media_free_result(esmb_media_result *obj);

#ifdef __cplusplus
}
#endif
