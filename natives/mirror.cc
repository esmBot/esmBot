#include <Magick++.h>
#include <napi.h>

#include <iostream>
#include <list>

using namespace std;
using namespace Magick;

Napi::Value Mirror(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    bool vertical = obj.Has("vertical")
                        ? obj.Get("vertical").As<Napi::Boolean>().Value()
                        : false;
    bool first =
        obj.Has("first") ? obj.Get("first").As<Napi::Boolean>().Value() : false;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    Blob blob;

    list<Image> frames;
    list<Image> coalesced;
    list<Image> mid;
    MagickCore::GravityType gravity;
    try {
      readImages(&frames, Blob(data.Data(), data.Length()));
    } catch (Magick::WarningCoder &warning) {
      cerr << "Coder Warning: " << warning.what() << endl;
    } catch (Magick::Warning &warning) {
      cerr << "Warning: " << warning.what() << endl;
    }
    coalesceImages(&coalesced, frames.begin(), frames.end());

    if (vertical && first) {
      gravity = Magick::NorthGravity;
    } else if (!vertical && first) {
      gravity = Magick::WestGravity;
    } else if (vertical && !first) {
      gravity = Magick::SouthGravity;
    } else {
      gravity = Magick::EastGravity;
    }

    for (Image &image : coalesced) {
      image.colorSpace(Magick::sRGBColorspace);
      list<Image> mirrored;
      Image final;
      image.extent(Geometry(to_string(vertical ? image.baseColumns()
                                               : image.baseColumns() / 2) +
                            "x" +
                            to_string(vertical ? image.baseRows() / 2
                                               : image.baseRows())),
                   gravity);
      mirrored.push_back(image);
      Image mirror = image;
      if (vertical) {
        mirror.flip();
      } else {
        mirror.flop();
      }
      if (first) {
        mirrored.push_back(mirror);
      } else {
        mirrored.push_front(mirror);
      }
      appendImages(&final, mirrored.begin(), mirrored.end(), vertical);
      final.repage();
      final.magick(type);
      final.animationDelay(delay == 0 ? image.animationDelay() : delay);
      mid.push_back(final);
    }

    optimizeTransparency(mid.begin(), mid.end());

    if (type == "gif") {
      for (Image &image : mid) {
        image.quantizeDither(false);
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
