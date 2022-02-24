#include <napi.h>

#include <iostream>
#include <list>
#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Flip(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    bool flop =
        obj.Has("flop") ? obj.Get("flop").As<Napi::Boolean>().Value() : false;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha()) in = in.bandjoin(255);

    VImage out;
    if (flop) {
      out = in.flip(VIPS_DIRECTION_HORIZONTAL);
    } else if (type == "gif") {
      // libvips gif handling is both a blessing and a curse
      vector<VImage> img;
      int page_height = vips_image_get_page_height(in.get_image());
      int n_pages = vips_image_get_n_pages(in.get_image());
      for (int i = 0; i < n_pages; i++) {
        VImage img_frame = in.crop(0, i * page_height, in.width(), page_height);
        VImage flipped = img_frame.flip(VIPS_DIRECTION_VERTICAL);
        img.push_back(flipped);
      }
      out = VImage::arrayjoin(img, VImage::option()->set("across", 1));
      out.set(VIPS_META_PAGE_HEIGHT, page_height);
    } else {
      out = in.flip(VIPS_DIRECTION_VERTICAL);
    }

    if (delay) out.set("delay", delay);

    void *buf;
    size_t length;
    out.write_to_buffer(("." + type).c_str(), &buf, &length);

    vips_thread_shutdown();

    Napi::Object result = Napi::Object::New(env);
    result.Set("data", Napi::Buffer<char>::Copy(env, (char *)buf, length));
    result.Set("type", type);
    return result;
  } catch (std::exception const &err) {
    throw Napi::Error::New(env, err.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error");
  }
}