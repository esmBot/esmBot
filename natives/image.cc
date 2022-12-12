#include "common.h"

#include <napi.h>
#include <map>
#include <string>
#include <iostream>

#include "blur.h"
#include "colors.h"
#include "caption.h"
#include "caption2.h"
#include "circle.h"
#include "crop.h"
#include "deepfry.h"
#include "explode.h"
#include "flag.h"
#include "flip.h"
#include "freeze.h"
#include "gamexplain.h"
#include "globe.h"
#include "homebrew.h"
#include "invert.h"
#include "jpeg.h"
#include "magik.h"
#include "meme.h"
#include "mirror.h"
#include "swirl.h"
#include "motivate.h"
#include "reddit.h"
#include "resize.h"
#include "reverse.h"
#include "scott.h"
#include "snapchat.h"
#include "sonic.h"
#include "speed.h"
#include "spin.h"
#include "squish.h"
#include "tile.h"
#include "togif.h"
#include "uncanny.h"
#include "uncaption.h"
#include "wall.h"
#include "watermark.h"
#include "whisper.h"
#include "zamn.h"

#ifdef _WIN32
#include <Magick++.h>
#endif
#include <vips/vips8>

using namespace std;

std::map<std::string, char* (*)(string type, char* BufferData, size_t BufferLength, ArgumentMap Arguments, size_t* DataSize)> FunctionMap = {
  {"blur", &Blur},
	{"caption", &Caption},
	{"captionTwo", &CaptionTwo},
	{"circle", &Circle},
	{"colors", &Colors},
	{"crop", &Crop},
	{"deepfry", &Deepfry},
	{"explode", &Explode},
	{"flag", &Flag},
  {"flip", &Flip},
  {"freeze", &Freeze},
  {"speed", &Speed},
	{"uncaption", &Uncaption},
  {"watermark", &Watermark}
};

std::map<std::string, Napi::Value (*)(const Napi::CallbackInfo &info)> OldFunctionMap = {
  {"gamexplain", Gamexplain},
  {"globe", Globe},
  {"homebrew", Homebrew},
  {"invert", Invert},
  {"jpeg", Jpeg},
  {"magik", Magik},
  {"meme", Meme},
  {"mirror", Mirror},
  {"motivate", Motivate},
  {"reddit", Reddit},
  {"resize", Resize},
  {"reverse", Reverse},
  {"scott", Scott},
  {"snapchat", Snapchat},
  {"sonic", Sonic},
  {"spin", Spin},
  {"swirl", Swirl},
  {"tile", Tile},
  {"togif", ToGif},
  {"uncanny", Uncanny},
  {"wall", Wall},
  {"whisper", Whisper},
  {"zamn", Zamn}
};

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

Napi::Value NewProcessImage(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);

  try {
    string command = info[0].As<Napi::String>().Utf8Value();
    Napi::Object obj = info[1].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();

    Napi::Array properties = obj.GetPropertyNames();

    ArgumentMap Arguments;

    for (unsigned int i = 0; i < properties.Length(); i++) {
      string property = properties.Get(uint32_t(i)).As<Napi::String>().Utf8Value();

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
        //Arguments[property] = val;
      }
    }

    size_t length = 0;
    char* buf = FunctionMap.at(command)(type, data.Data(), data.Length(), Arguments, &length);
    result.Set("data", Napi::Buffer<char>::New(env, buf, length, [](Napi::Env env, void* data) {
      free(data);
    }));
    result.Set("type", type);
  } catch (std::exception const &err) {
    Napi::Error::New(env, err.what()).ThrowAsJavaScriptException();
  } catch (...) {
    Napi::Error::New(env, "Unknown error").ThrowAsJavaScriptException();
  }

  return result;
}

Napi::Value OldProcessImage(std::string FunctionName, const Napi::CallbackInfo &info) {
  return OldFunctionMap.at(FunctionName)(info);
}

Napi::Value ProcessImage(const Napi::CallbackInfo &info) { // janky solution for gradual adoption
  Napi::Env env = info.Env();

  string command = info[0].As<Napi::String>().Utf8Value();
  
  if (MAP_HAS(FunctionMap, command)) {
    return NewProcessImage(info);
  } else if (MAP_HAS(OldFunctionMap, command)) {
    return OldProcessImage(command, info);
  } else {
    Napi::Error::New(env, "Invalid command").ThrowAsJavaScriptException();
    return env.Null();
  }
}

Napi::Object Init(Napi::Env env, Napi::Object exports){
#ifdef _WIN32
  Magick::InitializeMagick("");
#endif
  if (vips_init(""))
        vips_error_exit(NULL);
    exports.Set(Napi::String::New(env, "image"), Napi::Function::New(env, ProcessImage)); // new function handler

    Napi::Array arr = Napi::Array::New(env);
    size_t i = 0;
    for (auto const& imap: FunctionMap) {
      Napi::HandleScope scope(env);
      arr[i] = Napi::String::New(env, imap.first);
      i++;
    }
    for(auto const& imap: OldFunctionMap) {
      Napi::HandleScope scope(env);
      arr[i] = Napi::String::New(env, imap.first);
      i++;
    }

    exports.Set(Napi::String::New(env, "funcs"), arr);

    return exports;
}

NODE_API_MODULE(addon, Init)
