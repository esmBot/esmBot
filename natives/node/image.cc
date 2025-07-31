#include <napi.h>

#include <map>
#include <string>

#ifdef __GLIBC__
#include <malloc.h>
#endif

#include "../common.h"
#include "worker.h"

#if defined(WIN32) && defined(MAGICK_ENABLED)
#include <Magick++.h>
#endif
#include <vips/vips8>

#ifdef WITH_BACKWARD
#include "backward.hpp"

namespace backward {
  backward::SignalHandling sh;
}
#endif

using namespace std;

bool isNapiValueInt(Napi::Env &env, Napi::Value &num) {
  return env.Global().Get("Number").ToObject().Get("isInteger").As<Napi::Function>().Call({num}).ToBoolean().Value();
}

Napi::Value ProcessImage(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  string command = info[0].As<Napi::String>().Utf8Value();
  Napi::Object obj = info[1].As<Napi::Object>();
  Napi::Object input = info[2].As<Napi::Object>();
  string type = input.Has("type") ? input.Get("type").As<Napi::String>().Utf8Value() : "png";
  Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);

  Napi::Array properties = obj.GetPropertyNames();

  ArgumentMap Arguments;

  for (unsigned int i = 0; i < properties.Length(); i++) {
    string property = properties.Get(uint32_t(i)).As<Napi::String>().Utf8Value();

    auto val = obj.Get(property);
    if (val.IsBoolean()) {
      Arguments[property] = val.ToBoolean().Value();
    } else if (val.IsString()) {
      Arguments[property] = val.ToString().As<Napi::String>().Utf8Value();
    } else if (val.IsNumber()) {
      auto num = val.ToNumber();
      if (isNapiValueInt(env, num) && property != "yscale" && property != "tolerance" &&
          property != "pos") { // dumb hack
        Arguments[property] = num.Int32Value();
      } else {
        Arguments[property] = num.FloatValue();
      }
    } else {
      deferred.Reject(Napi::Error::New(env, "Type of property \"" + property + "\" is unknown").Value());
      return deferred.Promise();
    }
  }

  char *bufData = NULL;
  size_t bufSize = 0;
  if (input.Has("data")) {
    Napi::ArrayBuffer data = input.Get("data").As<Napi::ArrayBuffer>();
    bufData = (char *)data.Data();
    bufSize = data.ByteLength();
  }

  ImageAsyncWorker *asyncWorker = new ImageAsyncWorker(env, deferred, command, Arguments, type, bufData, bufSize);
  asyncWorker->Queue();
  return deferred.Promise();
}

/*
  This is a workaround for an issue in some libc implementations (e.g. glibc)
  where a multithreaded application with many heaps/arenas can hold on to large
  amounts of unused memory, never returning it back to the kernel automatically.

  Without this, memory usage can balloon over time to multiple gigabytes when idle -
  despite none of it being used for anything at all, not even caching.

  See this related discussion in the glibc mailing list:
  https://sourceware.org/pipermail/libc-help/2020-September/005457.html
*/
Napi::Value Trim(const Napi::CallbackInfo &info) {
#ifdef __GLIBC__
  int res = malloc_trim(0);
  return Napi::Number::From(info.Env(), res);
#else
  return Napi::Number::From(info.Env(), 0);
#endif
}

void *checkTypes(GType type, Napi::Object *formats) {
  VipsObjectClass *c = VIPS_OBJECT_CLASS(g_type_class_ref(type));

  if (strcmp(c->nickname, "jpegload")) formats->Set("image/jpeg", true);
  if (strcmp(c->nickname, "pngload")) formats->Set("image/png", true);
  if (strcmp(c->nickname, "gifload")) formats->Set("image/gif", true);
  if (strcmp(c->nickname, "webpload")) formats->Set("image/webp", true);
  if (strcmp(c->nickname, "heifload")) formats->Set("image/avif", true);

  return NULL;
}

Napi::Value ImgInit(const Napi::CallbackInfo &info) {
#if __GLIBC__
  /*
    Set mmap threshold to 128kb to work around a similar glibc bug to the one above.
    (Or maybe the same one?)

    The following "fix" (along with malloc_trim) has been used in projects such as KWin, GIMP,
    and Nautilus for years, with COSMIC also finding and implementing this somewhat more recently.
    More info here from a COSMIC dev: https://fosstodon.org/@mmstick/113952008189644564
  */
  mallopt(M_MMAP_THRESHOLD, 131072);
#endif
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
  Napi::Object formats = Napi::Object::New(info.Env());
  vips_type_map_all(g_type_from_name("VipsForeignLoad"), (VipsTypeMapFn)checkTypes, &formats);
  return formats;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "image"), Napi::Function::New(env, ProcessImage));
  exports.Set(Napi::String::New(env, "imageInit"), Napi::Function::New(env, ImgInit));
  exports.Set(Napi::String::New(env, "trim"), Napi::Function::New(env, Trim));

  Napi::Array arr = Napi::Array::New(env);
  size_t i = 0;
  for (auto const &imap : FunctionMap) {
    Napi::HandleScope scope(env);
    arr[i] = Napi::String::New(env, imap.first);
    i++;
  }
  for (auto const &imap : NoInputFunctionMap) {
    Napi::HandleScope scope(env);
    arr[i] = Napi::String::New(env, imap.first);
    i++;
  }

  exports.Set(Napi::String::New(env, "funcs"), arr);

  return exports;
}

NODE_API_MODULE(addon, Init)
