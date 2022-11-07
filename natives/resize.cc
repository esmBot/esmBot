#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Resize(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);

  try {
    Napi::Object obj = info[1].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    bool stretch = obj.Has("stretch")
                       ? obj.Get("stretch").As<Napi::Boolean>().Value()
                       : false;
    bool wide =
        obj.Has("wide") ? obj.Get("wide").As<Napi::Boolean>().Value() : false;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();

    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);

    VImage out;

    int width = in.width();
    int pageHeight = vips_image_get_page_height(in.get_image());
    int nPages = vips_image_get_n_pages(in.get_image());

    int finalHeight;
    if (stretch) {
      out = in.resize(
          512.0 / (double)width,
          VImage::option()->set("vscale", 512.0 / (double)pageHeight));
      finalHeight = 512;
    } else if (wide) {
      out = in.resize(9.5, VImage::option()->set("vscale", 0.5));
      finalHeight = pageHeight / 2;
    } else {
      // Pain. Pain. Pain. Pain. Pain.
      vector<VImage> img;
      for (int i = 0; i < nPages; i++) {
        VImage img_frame =
            type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
        VImage resized = img_frame.resize(0.1).resize(
            10, VImage::option()->set("kernel", VIPS_KERNEL_NEAREST));
        img.push_back(resized);
        finalHeight = resized.height();
      }
      out = VImage::arrayjoin(img, VImage::option()->set("across", 1));
    }
    out.set(VIPS_META_PAGE_HEIGHT, finalHeight);

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