#include <Magick++.h>
#include <napi.h>

#include <iostream>
#include <list>

using namespace std;
using namespace Magick;

Napi::Value Resize(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    bool stretch = obj.Has("stretch")
                       ? obj.Get("stretch").As<Napi::Boolean>().Value()
                       : false;
    bool wide =
        obj.Has("wide") ? obj.Get("wide").As<Napi::Boolean>().Value() : false;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    Blob blob;

    list<Image> frames;
    list<Image> coalesced;
    list<Image> blurred;
    try {
      readImages(&frames, Blob(data.Data(), data.Length()));
    } catch (Magick::WarningCoder &warning) {
      cerr << "Coder Warning: " << warning.what() << endl;
    } catch (Magick::Warning &warning) {
      cerr << "Warning: " << warning.what() << endl;
    }
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      if (stretch) {
        image.resize(Geometry("512x512!"));
      } else if (wide) {
        image.resize(Geometry(to_string((image.baseColumns() * 19) / 2) + "x" +
                              to_string(image.baseRows() / 2) + "!"));
      } else {
        image.scale(Geometry("10%"));
        image.scale(Geometry("1000%"));
      }
      image.magick(type);
      blurred.push_back(image);
    }

    optimizeTransparency(blurred.begin(), blurred.end());

    if (type == "gif") {
      for (Image &image : blurred) {
        image.quantizeDitherMethod(FloydSteinbergDitherMethod);
        image.quantize();
        if (delay != 0) image.animationDelay(delay);
      }
    }

    writeImages(blurred.begin(), blurred.end(), &blob);

    Napi::Object result = Napi::Object::New(env);
    result.Set("data", Napi::Buffer<char>::Copy(env, (char *)blob.data(),
                                                blob.length()));
    result.Set("type", type);
    return result;
  } catch (std::exception const &err) {
    throw Napi::Error::New(env, err.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error");
  }
}