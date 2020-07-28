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
    list<Image> frames;
    list<Image> coalesced;
    list<Image> mid;
    list<Image> result;
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

      list<Image> to_append;
      to_append.push_back(image);
      to_append.push_back(top);
      if (bottom_text != "") to_append.push_back(bottom);
      appendImages(&final, to_append.begin(), to_append.end(), true);
      final.magick(type);
      mid.push_back(final);
    }

    optimizeImageLayers(&result, mid.begin(), mid.end());
    if (delay != 0) for_each(result.begin(), result.end(), animationDelayImage(delay));
    writeImages(result.begin(), result.end(), &blob);
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

  string in_path = info[0].As<Napi::String>().Utf8Value();
  string top_text = info[1].As<Napi::String>().Utf8Value();
  string bottom_text = info[2].As<Napi::String>().Utf8Value();
  string type = info[3].As<Napi::String>().Utf8Value();
  int delay = info[4].As<Napi::Number>().Int32Value();
  Napi::Function cb = info[5].As<Napi::Function>();

  MotivateWorker* blurWorker = new MotivateWorker(cb, in_path, top_text, bottom_text, type, delay);
  blurWorker->Queue();
  return env.Undefined();
}