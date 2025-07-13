#pragma once
#include <cstddef>

#ifdef __cplusplus
extern "C" {
#endif

struct image_result {
  const char *type;
  size_t length;
  void *buf;
};

void esmb_image_init();
image_result *esmb_image_process(const char *command, const char *args, size_t args_length, const char *type, const char *data, size_t length);
void esmb_image_free(void *ptr, [[maybe_unused]] void *ctx);

inline const char *esmb_image_get_type(image_result *result) { return result->type; }
inline void *esmb_image_get_data(image_result *result) { return result->buf; }
inline size_t esmb_image_get_size(image_result *result) { return result->length; }

#ifdef __cplusplus
}
#endif
