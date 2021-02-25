#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class MotivateWorker : public Napi::AsyncWorker {
 public:
  MotivateWorker(Napi::Function& callback, string in_path, string top_text, string bottom_text, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), top_text(top_text), bottom_text(bottom_text), type(type), delay(delay) {}
  ~MotivateWorker() {}

  void Execute() {
    list <Image> frames;
    list <Image> coalesced;
    list <Image> mid;
    Image top;
    Image bottom;
    readImages(&frames, in_path);
    coalesceImages(&coalesced, frames.begin(), frames.end());

    top.size(Geometry("600"));
    top.backgroundColor("black");
    top.font("Times");
    top.textGravity(Magick::CenterGravity);
    top.fontPointsize(56);
    top.read("pango:<span foreground='white'>" + top_text + "</span>");
    top.extent(Geometry(bottom_text != "" ? to_string(top.columns()) + "x" + to_string(top.rows()) : to_string(top.columns()) + "x" + to_string(top.rows() + 20)), "black", Magick::NorthGravity);

    if (bottom_text != "") {
      bottom.size(Geometry("600"));
      bottom.backgroundColor("black");
      bottom.font("Times");
      bottom.textGravity(Magick::CenterGravity);
      bottom.fontPointsize(28);
      bottom.read("pango:<span foreground='white'>" + bottom_text + "</span>");
      bottom.extent(Geometry(to_string(bottom.columns()) + "x" + to_string(bottom.rows() + 20)), "black", Magick::NorthGravity);
    }

    for (Image &image : coalesced) {
      Image final;
      image.scale(Geometry(500, 500));
      image.borderColor("black");
      image.border(Geometry(5, 5));
      image.borderColor("white");
      image.border(Geometry(3, 3));
      image.backgroundColor("black");
      image.extent(Geometry(600, image.rows() + 50), Magick::CenterGravity);

      list <Image> to_append;
      to_append.push_back(image);
      to_append.push_back(top);
      if (bottom_text != "") to_append.push_back(bottom);
      appendImages(&final, to_append.begin(), to_append.end(), true);
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
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string in_path, type, top_text, bottom_text;
  int delay;
  Blob blob;
};

Napi::Value Motivate(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  string top = obj.Get("top").As<Napi::String>().Utf8Value();
  string bottom = obj.Get("bottom").As<Napi::String>().Utf8Value();
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  MotivateWorker* blurWorker = new MotivateWorker(cb, path, top, bottom, type, delay);
  blurWorker->Queue();
  return env.Undefined();
}