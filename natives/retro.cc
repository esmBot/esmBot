#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class RetroWorker : public Napi::AsyncWorker {
 public:
  RetroWorker(Napi::Function& callback, string line1, string line2, string line3)
      : Napi::AsyncWorker(callback), line1(line1), line2(line2), line3(line3) {}
  ~RetroWorker() {}

  void Execute() {
    Image image;
    Image line1_text;
    Image line2_text;
    Image line3_text;

    image.read("./assets/images/retro.png");

    line2_text.backgroundColor("none");
    line2_text.fontPointsize(128);
    line2_text.textGravity(Magick::CenterGravity);
    line2_text.font("Comic Sans MS");
    line2_text.read("pango:<span foreground='white'>" + (line2 == "" ? line1 : line2) + "</span>");
    line2_text.extent(Geometry("1260x859+0+0"), Magick::CenterGravity);
    Image line2_text_fill = line2_text;
    line2_text_fill.channel(Magick::AlphaChannel);
    line2_text_fill.morphology(Magick::EdgeOutMorphology, "Octagon:10");
    line2_text_fill.backgroundColor("gray");
    line2_text_fill.alphaChannel(Magick::ShapeAlphaChannel);
    line2_text.composite(line2_text_fill, Magick::CenterGravity, Magick::DstOverCompositeOp);
    image.composite(line2_text, Geometry("+0-100"), Magick::OverCompositeOp);

    if (line2 != "") {
        line1_text.backgroundColor("none");
        line1_text.fontPointsize(64);
        line1_text.textGravity(Magick::CenterGravity);
        line1_text.font("Comic Sans MS");
        line1_text.read("pango:<span foreground='white'>" + line1 + "</span>");
        line1_text.extent(Geometry("1260x859+0+0"), Magick::CenterGravity);
        Image line1_text_fill = line1_text;
        line1_text_fill.channel(Magick::AlphaChannel);
        line1_text_fill.morphology(Magick::EdgeOutMorphology, "Octagon:10");
        line1_text_fill.backgroundColor("gray");
        line1_text_fill.alphaChannel(Magick::ShapeAlphaChannel);
        line1_text.composite(line1_text_fill, Magick::CenterGravity, Magick::DstOverCompositeOp);
        image.composite(line1_text, Geometry("+0-250"), Magick::OverCompositeOp);
    }

    if (line3 != "") {
        line3_text.backgroundColor("none");
        line3_text.fontPointsize(64);
        line3_text.textGravity(Magick::CenterGravity);
        line3_text.font("Comic Sans MS");
        line3_text.read("pango:<span foreground='white'>" + line3 + "</span>");
        line3_text.extent(Geometry("1260x859+0+0"), Magick::CenterGravity);
        Image line3_text_fill = line3_text;
        line3_text_fill.channel(Magick::AlphaChannel);
        line3_text_fill.morphology(Magick::EdgeOutMorphology, "Octagon:10");
        line3_text_fill.backgroundColor("gray");
        line3_text_fill.alphaChannel(Magick::ShapeAlphaChannel);
        line3_text.composite(line3_text_fill, Magick::CenterGravity, Magick::DstOverCompositeOp);
        image.composite(line3_text, Geometry("+0+50"), Magick::OverCompositeOp);
    }
    
    image.magick("PNG");
    image.write(&blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string line1, line2, line3, type;
  int delay;
  Blob blob;
};

Napi::Value Retro(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string line1 = obj.Get("line1").As<Napi::String>().Utf8Value();
  string line2 = obj.Get("line2").As<Napi::String>().Utf8Value();
  string line3 = obj.Get("line3").As<Napi::String>().Utf8Value();

  RetroWorker* retroWorker = new RetroWorker(cb, line1, line2, line3);
  retroWorker->Queue();
  return env.Undefined();
}