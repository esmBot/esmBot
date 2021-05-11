#include <Magick++.h>
#include <napi.h>

#include <iostream>
#include <list>

using namespace std;
using namespace Magick;

Napi::Value Watermark(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string water = obj.Get("water").As<Napi::String>().Utf8Value();
    int gravity = obj.Get("gravity").As<Napi::Number>().Int32Value();
    bool resize = obj.Has("resize")
                      ? obj.Get("resize").As<Napi::Boolean>().Value()
                      : false;
    bool append = obj.Has("append")
                      ? obj.Get("append").As<Napi::Boolean>().Value()
                      : false;
    bool mc = obj.Has("mc") ? obj.Get("mc").As<Napi::Boolean>().Value() : false;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    Blob blob;

    list<Image> frames;
    list<Image> coalesced;
    list<Image> mid;
    Image watermark;
    readImages(&frames, Blob(data.Data(), data.Length()));
    watermark.read(water);
    if (resize && append) {
      string query(to_string(frames.front().baseColumns()) + "x");
      watermark.scale(Geometry(query));
    } else if (resize) {
      string query("x" + to_string(frames.front().baseRows()));
      watermark.scale(Geometry(query));
    }
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      Image final;
      if (append) {
        list<Image> to_append;
        to_append.push_back(image);
        to_append.push_back(watermark);
        appendImages(&final, to_append.begin(), to_append.end(), true);
        final.repage();
      } else if (mc) {
        image.backgroundColor("white");
        image.extent(Geometry(image.columns(), image.rows() + 15));
        image.composite(watermark, Magick::GravityType(gravity),
                        Magick::OverCompositeOp);
        final = image;
      } else {
        image.composite(watermark, Magick::GravityType(gravity),
                        Magick::OverCompositeOp);
        final = image;
      }
      image.magick(type);
      final.animationDelay(delay == 0 ? image.animationDelay() : delay);
      mid.push_back(final);
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
  } catch (Napi::Error const &err) {
    throw err;
  } catch (std::exception const &err) {
    throw Napi::Error::New(env, err.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error");
  }
}