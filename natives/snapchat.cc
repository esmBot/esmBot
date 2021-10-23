#include <Magick++.h>
#include <napi.h>

#include <iostream>
#include <list>

using namespace std;
using namespace Magick;

Napi::Value Snapchat(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string caption = obj.Get("caption").As<Napi::String>().Utf8Value();
    float pos =
        obj.Has("pos") ? obj.Get("pos").As<Napi::Number>().FloatValue() : 0.5;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    Blob blob;

    list<Image> frames;
    list<Image> coalesced;
    list<Image> captioned;
    Blob caption_blob;
    try {
      readImages(&frames, Blob(data.Data(), data.Length()));
    } catch (Magick::WarningCoder &warning) {
      cerr << "Coder Warning: " << warning.what() << endl;
    } catch (Magick::Warning &warning) {
      cerr << "Warning: " << warning.what() << endl;
    }

    size_t width = frames.front().baseColumns();
    size_t height = frames.front().baseRows();
    string query(to_string(width - ((width / 25) * 2)) + "x");
    Image caption_image(Geometry(query), Color("none"));
    caption_image.backgroundColor(Color("none"));
    caption_image.fillColor("white");
    caption_image.font("Helvetica Neue");
    caption_image.fontPointsize(width / 25);
    caption_image.textGravity(Magick::CenterGravity);
    caption_image.read("pango:" + caption);
    caption_image.backgroundColor(Color("rgba(0, 0, 0, 0.7)"));
    caption_image.extent(Geometry(width, caption_image.rows() + (width / 25)),
                         Magick::CenterGravity);

    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      list<Image> images;
      image.composite(caption_image, 0, height * pos, Magick::OverCompositeOp);
      image.magick(type);
      image.animationDelay(delay == 0 ? image.animationDelay() : delay);
      captioned.push_back(image);
    }

    optimizeTransparency(captioned.begin(), captioned.end());

    if (type == "gif") {
      for (Image &image : captioned) {
        image.quantizeDither(false);
        image.quantize();
      }
    }

    writeImages(captioned.begin(), captioned.end(), &blob);

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