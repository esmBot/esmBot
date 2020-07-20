#ifndef ESMBOT_NATIVES_LEAK_H_
#define ESMBOT_NATIVES_LEAK_H_

#include <napi.h>

Napi::Value Leak(const Napi::CallbackInfo& info);

#endif