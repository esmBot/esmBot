#include <napi.h>

#include <map>
#include <string>

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

bool isNapiValueInt(Napi::Env& env, Napi::Value& num) {
  return env.Global()
      .Get("Number")
      .ToObject()
      .Get("isInteger")
      .As<Napi::Function>()
      .Call({num})
      .ToBoolean()
      .Value();
}

Napi::Value ProcessImage(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  string command = info[0].As<Napi::String>().Utf8Value();
  Napi::Object obj = info[1].As<Napi::Object>();
  Napi::Object input = info[2].As<Napi::Object>();
  string type =
      input.Has("type") ? input.Get("type").As<Napi::String>().Utf8Value() : "png";
  Napi::Function callback = info[3].As<Napi::Function>();

  Napi::Array properties = obj.GetPropertyNames();

  ArgumentMap Arguments;

  for (unsigned int i = 0; i < properties.Length(); i++) {
    string property =
        properties.Get(uint32_t(i)).As<Napi::String>().Utf8Value();

    auto val = obj.Get(property);
    if (val.IsBoolean()) {
      Arguments[property] = val.ToBoolean().Value();
    } else if (val.IsString()) {
      Arguments[property] = val.ToString().As<Napi::String>().Utf8Value();
    } else if (val.IsNumber()) {
      auto num = val.ToNumber();
      if (isNapiValueInt(env, num) && property != "yscale" && property != "tolerance" && property != "pos") { // dumb hack
        Arguments[property] = num.Int32Value();
      } else {
        Arguments[property] = num.FloatValue();
      }
    } else {
      callback.Call({Napi::Error::New(env, "Unimplemented value type passed to image native.").Value()});
      return Napi::BigInt::New(env, (int64_t)0);
      // Arguments[property] = val;
    }
  }

  char *bufData = NULL;
  size_t bufSize = 0;
  if (input.Has("data")) {
    Napi::ArrayBuffer data = input.Get("data").As<Napi::ArrayBuffer>();
    bufData = (char *)data.Data();
    bufSize = data.ByteLength();
  }

  ImageAsyncWorker* asyncWorker = new ImageAsyncWorker(callback, command, Arguments, type, bufData, bufSize);
  asyncWorker->Queue();
  return Napi::BigInt::From<intptr_t>(env, reinterpret_cast<intptr_t>(asyncWorker));
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

Napi::Value ImgInit(const Napi::CallbackInfo& info) {
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
  exports.Set(Napi::String::New(env, "image"),
              Napi::Function::New(env, ProcessImage));
  exports.Set(Napi::String::New(env, "imageInit"), Napi::Function::New(env, ImgInit));

  Napi::Array arr = Napi::Array::New(env);
  size_t i = 0;
  for (auto const& imap : FunctionMap) {
    Napi::HandleScope scope(env);
    arr[i] = Napi::String::New(env, imap.first);
    i++;
  }
  for (auto const& imap : NoInputFunctionMap) {
    Napi::HandleScope scope(env);
    arr[i] = Napi::String::New(env, imap.first);
    i++;
  }

  exports.Set(Napi::String::New(env, "funcs"), arr);

  return exports;
}

NODE_API_MODULE(addon, Init)
