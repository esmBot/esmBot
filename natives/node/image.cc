#include <napi.h>

#include <iostream>
#include <map>
#include <string>

#include "../common.h"

#ifdef _WIN32
#include <Magick++.h>
#endif
#include <vips/vips8>

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
  Napi::Object result = Napi::Object::New(env);

  try {
    string command = info[0].As<Napi::String>().Utf8Value();
    Napi::Object obj = info[1].As<Napi::Object>();
    string type =
        obj.Has("type") ? obj.Get("type").As<Napi::String>().Utf8Value() : "png";

    Napi::Array properties = obj.GetPropertyNames();

    ArgumentMap Arguments;

    for (unsigned int i = 0; i < properties.Length(); i++) {
      string property =
          properties.Get(uint32_t(i)).As<Napi::String>().Utf8Value();

      if (property == "data") {
        continue;
      }

      auto val = obj.Get(property);
      if (val.IsBoolean()) {
        Arguments[property] = val.ToBoolean().Value();
      } else if (val.IsString()) {
        Arguments[property] = val.ToString().As<Napi::String>().Utf8Value();
      } else if (val.IsNumber()) {
        auto num = val.ToNumber();
        if (isNapiValueInt(env, num)) {
          Arguments[property] = num.Int32Value();
        } else {
          Arguments[property] = num.FloatValue();
        }
      } else {
        throw "Unimplemented value type passed to image native.";
        // Arguments[property] = val;
      }
    }

    string outType = GetArgumentWithFallback<bool>(Arguments, "togif", false) ? "gif" : type;

    size_t length = 0;
    ArgumentMap outMap;
    if (obj.Has("data")) {
      Napi::Buffer<char> data = obj.Has("data")
                                    ? obj.Get("data").As<Napi::Buffer<char>>()
                                    : Napi::Buffer<char>::New(env, 0);
      outMap = FunctionMap.at(command)(type, &outType, data.Data(), data.Length(),
                                    Arguments, &length);
    } else {
      outMap = NoInputFunctionMap.at(command)(type, &outType, Arguments, &length);
    }

    vips_error_clear();
    vips_thread_shutdown();

    char* buf = GetArgument<char*>(outMap, "buf");

    result.Set("data",
               Napi::Buffer<char>::New(env, buf, length,
                                       []([[maybe_unused]] Napi::Env env,
                                          void* data) { free(data); }));
    result.Set("type", outType);
  } catch (std::exception const& err) {
    Napi::Error::New(env, err.what()).ThrowAsJavaScriptException();
  } catch (...) {
    Napi::Error::New(env, "Unknown error").ThrowAsJavaScriptException();
  }

  return result;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
#ifdef _WIN32
  Magick::InitializeMagick("");
#endif
  if (vips_init("")) vips_error_exit(NULL);
  exports.Set(Napi::String::New(env, "image"),
              Napi::Function::New(env, ProcessImage));  // new function handler

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
