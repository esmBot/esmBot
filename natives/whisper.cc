#include <Magick++.h>
#include <napi.h>

#include <iostream>
#include <list>

using namespace std;
using namespace Magick;

Napi::Value Whisper(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string caption = obj.Get("caption").As<Napi::String>().Utf8Value();
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

    int dividedWidth = width / 175;

    Image caption_image;
    caption_image.size(Geometry(to_string(width) + "x" + to_string(height)));
    caption_image.backgroundColor("none");
    caption_image.fillColor("white");
    caption_image.font("Upright");
    caption_image.fontPointsize(width / 8);
    caption_image.textGravity(Magick::CenterGravity);
    caption_image.read("pango:" + caption);
    caption_image.trim();
    caption_image.repage();
    Image caption_fill = caption_image;
    caption_fill.extent(Geometry(width, height), Magick::CenterGravity);
    caption_fill.channel(Magick::AlphaChannel);
    caption_fill.morphology(Magick::EdgeOutMorphology, "Octagon",
                            dividedWidth != 0 ? dividedWidth : 1);
    caption_fill.backgroundColor("black");
    caption_fill.alphaChannel(Magick::ShapeAlphaChannel);
    size_t fill_width = caption_fill.columns();
    size_t fill_height = caption_fill.rows();
    caption_image.extent(Geometry(fill_width, fill_height),
                         Magick::CenterGravity);
    caption_image.composite(caption_fill, Magick::CenterGravity,
                            Magick::DstOverCompositeOp);

    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      list<Image> images;
      image.composite(caption_image, Magick::CenterGravity,
                      Magick::OverCompositeOp);
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