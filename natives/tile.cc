#include <Magick++.h>
#include <napi.h>

#include <iostream>
#include <list>

using namespace std;
using namespace Magick;

Napi::Value Tile(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    Blob blob;

    list<Image> frames;
    list<Image> coalesced;
    list<Image> mid;
    try {
      readImages(&frames, Blob(data.Data(), data.Length()));
    } catch (Magick::WarningCoder &warning) {
      cerr << "Coder Warning: " << warning.what() << endl;
    } catch (Magick::Warning &warning) {
      cerr << "Warning: " << warning.what() << endl;
    }
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      list<Image> duplicated;
      Image appended;
      list<Image> montage;
      Image frame;
      image.magick(type);
      for (int i = 0; i < 5; ++i) {
        duplicated.push_back(image);
      }
      appendImages(&appended, duplicated.begin(), duplicated.end());
      appended.repage();
      for (int i = 0; i < 5; ++i) {
        montage.push_back(appended);
      }
      appendImages(&frame, montage.begin(), montage.end(), true);
      frame.repage();
      frame.scale(Geometry("800x800>"));
      frame.animationDelay(delay == 0 ? image.animationDelay() : delay);
      mid.push_back(frame);
    }

    optimizeTransparency(mid.begin(), mid.end());

    if (type == "gif") {
      for (Image &image : mid) {
        image.quantizeDitherMethod(FloydSteinbergDitherMethod);
        image.quantize();
      }
    }

    writeImages(mid.begin(), mid.end(), &blob);

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