#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Flip(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    bool flop =
        obj.Has("flop") ? obj.Get("flop").As<Napi::Boolean>().Value() : false;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? VImage::option()->set("n", -1)->set("access", "sequential") : 0)
            .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha()) in = in.bandjoin(255);

    VImage out;
    if (flop) {
      out = in.flip(VIPS_DIRECTION_HORIZONTAL);
    } else if (type == "gif") {
      // libvips gif handling is both a blessing and a curse
      vector<VImage> img;
      int pageHeight = vips_image_get_page_height(in.get_image());
      int nPages = vips_image_get_n_pages(in.get_image());
      for (int i = 0; i < nPages; i++) {
        VImage img_frame = in.crop(0, i * pageHeight, in.width(), pageHeight);
        VImage flipped = img_frame.flip(VIPS_DIRECTION_VERTICAL);
        img.push_back(flipped);
      }
      out = VImage::arrayjoin(img, VImage::option()->set("across", 1));
      out.set(VIPS_META_PAGE_HEIGHT, pageHeight);
    } else {
      out = in.flip(VIPS_DIRECTION_VERTICAL);
    }

    void *buf;
    size_t length;
    out.write_to_buffer(("." + type).c_str(), &buf, &length);

    result.Set("data", Napi::Buffer<char>::Copy(env, (char *)buf, length));
    result.Set("type", type);
  } catch (std::exception const &err) {
    Napi::Error::New(env, err.what()).ThrowAsJavaScriptException();
  } catch (...) {
    Napi::Error::New(env, "Unknown error").ThrowAsJavaScriptException();
  }

  vips_error_clear();
  vips_thread_shutdown();
  return result;
}