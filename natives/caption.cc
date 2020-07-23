#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class CaptionWorker : public Napi::AsyncWorker {
 public:
  CaptionWorker(Napi::Function& callback, string caption, string in_path, string type, int delay)
      : Napi::AsyncWorker(callback), caption(caption), in_path(in_path), type(type), delay(delay) {}
  ~CaptionWorker() {}

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
    caption_image.alpha(true);
    caption_image.font("./assets/caption.otf");
    caption_image.fontPointsize(width / 10);
    caption_image.textGravity(Magick::CenterGravity);
    caption_image.read("caption:" + caption);
    caption_image.extent(Geometry(width, caption_image.rows() + (width / 10)), Magick::CenterGravity);
    
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      Image appended;
      list<Image> images;
      image.backgroundColor("white");
      images.push_back(caption_image);
      images.push_back(image);
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
  int delay, wordlength, i, n;
  size_t bytes, type_size;
  Blob blob;
};

Napi::Value Caption(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  string caption = info[0].As<Napi::String>().Utf8Value();
  string in_path = info[1].As<Napi::String>().Utf8Value();
  string type = info[2].As<Napi::String>().Utf8Value();
  int delay = info[3].As<Napi::Number>().Int32Value();
  Napi::Function cb = info[4].As<Napi::Function>();

  CaptionWorker* captionWorker = new CaptionWorker(cb, caption, in_path, type, delay);
  captionWorker->Queue();
  return env.Undefined();
}