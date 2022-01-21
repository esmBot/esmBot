#include <Magick++.h>
#include <napi.h>

#include <iostream>
#include <list>

using namespace std;
using namespace Magick;

Napi::Value Jpeg(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    int quality =
        obj.Has("quality") ? obj.Get("quality").As<Napi::Number>().Int32Value() : 0;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    Blob blob;

    Napi::Object result = Napi::Object::New(env);

    if (type == "gif") {
      list<Image> frames;
      list<Image> coalesced;
      list<Image> jpeged;
      try {
        readImages(&frames, Blob(data.Data(), data.Length()));
      } catch (Magick::WarningCoder &warning) {
        cerr << "Coder Warning: " << warning.what() << endl;
      } catch (Magick::Warning &warning) {
        cerr << "Warning: " << warning.what() << endl;
      }
      coalesceImages(&coalesced, frames.begin(), frames.end());

      for (Image &image : coalesced) {
        Blob temp;
        image.quality(quality);
        image.magick("JPEG");
        image.write(&temp);
        Image newImage(temp);
        newImage.magick(type);
        newImage.animationDelay(delay == 0 ? image.animationDelay() : delay);
        jpeged.push_back(newImage);
      }

      optimizeTransparency(jpeged.begin(), jpeged.end());

      for (Image &image : jpeged) {
        image.quantizeDither(false);
        image.quantize();
      }

      writeImages(jpeged.begin(), jpeged.end(), &blob);

      result.Set("data", Napi::Buffer<char>::Copy(env, (char *)blob.data(),
                                                  blob.length()));
      result.Set("type", type);
    } else {
      Image image;
      image.read(Blob(data.Data(), data.Length()));
      image.quality(1);
      image.magick("JPEG");
      image.write(&blob);

      result.Set("data", Napi::Buffer<char>::Copy(env, (char *)blob.data(),
                                                  blob.length()));
      result.Set("type", "jpg");
    }

    return result;
  } catch (std::exception const &err) {
    throw Napi::Error::New(env, err.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error");
  }
}
