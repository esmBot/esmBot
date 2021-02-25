#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class CaptionTwoWorker : public Napi::AsyncWorker {
 public:
  CaptionTwoWorker(Napi::Function& callback, string caption, string in_path, string type, int delay)
      : Napi::AsyncWorker(callback), caption(caption), in_path(in_path), type(type), delay(delay) {}
  ~CaptionTwoWorker() {}

  void Execute() {
    list <Image> frames;
    list <Image> coalesced;
    list <Image> captioned;
    Blob caption_blob;
    readImages(&frames, in_path);

    size_t width = frames.front().baseColumns();
    string query(to_string(width - ((width / 25) * 2)) + "x");
    Image caption_image(Geometry(query), Color("white"));
    caption_image.fillColor("black");
    caption_image.font("Helvetica Neue");
    caption_image.fontPointsize(width / 17);
    caption_image.read("pango:" + caption);
    caption_image.extent(Geometry(width, caption_image.rows() + (width / 25)), Magick::CenterGravity);
    
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      Image appended;
      list <Image> images;
      image.backgroundColor("white");
      images.push_back(image);
      images.push_back(caption_image);
      appendImages(&appended, images.begin(), images.end(), true);
      appended.repage();
      appended.magick(type);
      appended.animationDelay(delay == 0 ? image.animationDelay() : delay);
      captioned.push_back(appended);
    }

    optimizeTransparency(captioned.begin(), captioned.end());

    if (type == "gif") {
      for (Image &image : captioned) {
        image.quantizeDither(false);
        image.quantize();
      }
    }

    writeImages(captioned.begin(), captioned.end(), &blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string caption, in_path, type;
  int delay;
  Blob blob;
};

Napi::Value CaptionTwo(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  string caption = obj.Get("caption").As<Napi::String>().Utf8Value();
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  CaptionTwoWorker* captionTwoWorker = new CaptionTwoWorker(cb, caption, path, type, delay);
  captionTwoWorker->Queue();
  return env.Undefined();
}