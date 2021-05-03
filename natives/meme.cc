#include <Magick++.h>
#include <napi.h>

#include <list>

using namespace std;
using namespace Magick;

Napi::Value Meme(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    string path = obj.Get("path").As<Napi::String>().Utf8Value();
    string top = obj.Get("top").As<Napi::String>().Utf8Value();
    string bottom = obj.Get("bottom").As<Napi::String>().Utf8Value();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    Blob blob;

    list<Image> frames;
    list<Image> coalesced;
    list<Image> mid;
    Image top_text;
    Image bottom_text;
    readImages(&frames, path);
    coalesceImages(&coalesced, frames.begin(), frames.end());
    for_each(coalesced.begin(), coalesced.end(),
             scaleImage(Geometry(600, 600)));

    top_text.size(Geometry(to_string(coalesced.front().columns())));
    top_text.backgroundColor("none");
    top_text.font("Impact");
    top_text.fontPointsize(40);
    top_text.textGravity(Magick::CenterGravity);
    top_text.read("pango:<span foreground='white'>" + top + "</span>");
    Image top_text_fill = top_text;
    top_text_fill.channel(Magick::AlphaChannel);
    top_text_fill.morphology(Magick::EdgeOutMorphology, "Octagon");
    top_text_fill.backgroundColor("black");
    top_text_fill.alphaChannel(Magick::ShapeAlphaChannel);
    top_text.composite(top_text_fill, Magick::CenterGravity,
                       Magick::DstOverCompositeOp);

    if (bottom != "") {
      bottom_text.size(Geometry(to_string(coalesced.front().columns())));
      bottom_text.backgroundColor("none");
      bottom_text.font("Impact");
      bottom_text.fontPointsize(40);
      bottom_text.textGravity(Magick::CenterGravity);
      bottom_text.read("pango:<span foreground='white'>" + bottom + "</span>");
      Image bottom_text_fill = bottom_text;
      bottom_text_fill.channel(Magick::AlphaChannel);
      bottom_text_fill.morphology(Magick::EdgeOutMorphology, "Octagon");
      bottom_text_fill.backgroundColor("black");
      bottom_text_fill.alphaChannel(Magick::ShapeAlphaChannel);
      bottom_text.composite(bottom_text_fill, Magick::CenterGravity,
                            Magick::DstOverCompositeOp);
    }

    for (Image &image : coalesced) {
      image.composite(top_text, Magick::NorthGravity, Magick::OverCompositeOp);
      if (bottom != "")
        image.composite(bottom_text, Magick::SouthGravity,
                        Magick::OverCompositeOp);
      image.magick(type);
      mid.push_back(image);
    }

    optimizeTransparency(mid.begin(), mid.end());

    if (type == "gif") {
      for (Image &image : mid) {
        image.quantizeDither(false);
        image.quantize();
        if (delay != 0) image.animationDelay(delay);
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