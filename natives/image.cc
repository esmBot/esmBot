#include "common.h"

#include <napi.h>
#include <map>
#include <string>

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

std::map<std::string, char* (*)(string type, char* BufferData, size_t BufferLength, map<string, string> Arguments, size_t* DataSize)> FunctionMap = {
	{"caption", &Caption},
	{"caption2", &CaptionTwo},
	{"blur", &Blur},
	{"circle", &Circle},
	{"colors", &Colors},
	{"crop", &Crop},
	{"deepfry", &Deepfry},
	{"explode", &Explode},
	{"flag", &Flag},
  {"flip", &Flip},
  {"watermark", &Watermark},
	{"uncaption", &Uncaption}
};

std::map<std::string, Napi::Value (*)(const Napi::CallbackInfo &info)> OldFunctionMap = {
  {"speed", Speed},
	{"freeze", Freeze},
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

Napi::Value NewProcessImage(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);

  try {
    string command = info[0].As<Napi::String>().Utf8Value();
    Napi::Object obj = info[1].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();

    Napi::Array properties = obj.GetPropertyNames();

    std::map<string, string> Arguments;

    for (unsigned int i = 0; i < properties.Length(); i++) {
      string property = properties.Get(uint32_t(i)).As<Napi::String>().Utf8Value();

      if (property == "data") {
        continue;
      }

      Arguments[property] = obj.Get(property).ToString().As<Napi::String>().Utf8Value();
    }

    size_t length = 0;
    char* buf = FunctionMap.at(command)(type, data.Data(), data.Length(), Arguments, &length);

    result.Set("data", Napi::Buffer<char>::New(env, buf, length));
    result.Set("type", type);
 
    free(buf);
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
  }
}

Napi::Object Init(Napi::Env env, Napi::Object exports){
#ifdef _WIN32
  Magick::InitializeMagick("");
#endif
  if (vips_init(""))
        vips_error_exit(NULL);
    exports.Set(Napi::String::New(env, "image"), Napi::Function::New(env, ProcessImage)); // new function handler

    return exports;
}

NODE_API_MODULE(addon, Init)
