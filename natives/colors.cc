#include <Magick++.h>
#include <napi.h>

#include <iostream>
#include <list>

using namespace std;
using namespace Magick;

Napi::Value Colors(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    bool old =
        obj.Has("old") ? obj.Get("old").As<Napi::Boolean>().Value() : false;
    string color = obj.Get("color").As<Napi::String>().Utf8Value();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    Blob blob;

    list<Image> frames;
    list<Image> coalesced;
    list<Image> colored;
    try {
      readImages(&frames, Blob(data.Data(), data.Length()));
    } catch (Magick::WarningCoder &warning) {
      cerr << "Coder Warning: " << warning.what() << endl;
    } catch (Magick::Warning &warning) {
      cerr << "Warning: " << warning.what() << endl;
    }
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      if (color == "blurple") {
        image.threshold(49151.25);
        image.levelColors(old ? "#7289DA" : "#5865F2", "white");
      } else if (color == "grayscale") {
        image.quantizeColorSpace(GRAYColorspace);
        image.quantizeColors(256);
      } else if (color == "sepia") {
        image.sepiaTone(49151.25);
      }
      image.magick(type);
      image.animationDelay(delay == 0 ? image.animationDelay() : delay);
      colored.push_back(image);
    }

    optimizeTransparency(colored.begin(), colored.end());

    if (type == "gif") {
      for (Image &image : colored) {
        image.quantizeDitherMethod(FloydSteinbergDitherMethod);
        image.quantize();
      }
    }

    writeImages(colored.begin(), colored.end(), &blob);

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
