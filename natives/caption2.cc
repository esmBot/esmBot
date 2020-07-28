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
    list<Image> frames;
    list<Image> coalesced;
    list<Image> captioned;
    list<Image> result;
    Blob caption_blob;
    readImages(&frames, in_path);

    size_t width = frames.front().baseColumns();
    size_t height = frames.front().baseRows();
    string query(to_string(width - ((width / 25) * 2)) + "x");
    Image caption_image(Geometry(query), Color("white"));
    caption_image.fillColor("black");
    caption_image.font("Helvetica Neue");
    caption_image.fontPointsize(width / 17);
    caption_image.read("pango:" + caption);
    caption_image.extent(Geometry(width, caption_image.rows() + (width / 25)), Magick::CenterGravity);
    
    coalesceImages(&coalesced, frames.begin(), frames.end());

    int iterator = 0;
    for (Image &image : coalesced) {
      Image appended;
      list<Image> images;
      image.backgroundColor("white");
      images.push_back(image);
      images.push_back(caption_image);
      appendImages(&appended, images.begin(), images.end(), true);
      appended.magick(type);
      captioned.push_back(appended);
    }

    optimizeImageLayers(&result, captioned.begin(), captioned.end());
    if (delay != 0) for_each(result.begin(), result.end(), animationDelayImage(delay));
    writeImages(result.begin(), result.end(), &blob);
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

  string caption = info[0].As<Napi::String>().Utf8Value();
  string in_path = info[1].As<Napi::String>().Utf8Value();
  string type = info[2].As<Napi::String>().Utf8Value();
  int delay = info[3].As<Napi::Number>().Int32Value();
  Napi::Function cb = info[4].As<Napi::Function>();

  CaptionTwoWorker* captionTwoWorker = new CaptionTwoWorker(cb, caption, in_path, type, delay);
  captionTwoWorker->Queue();
  return env.Undefined();
}