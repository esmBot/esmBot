#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Deepfry(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();

    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha())
      in = in.bandjoin(255);

    int width = in.width();
    int pageHeight = vips_image_get_page_height(in.get_image());
    int totalHeight = in.height();
    int nPages = vips_image_get_n_pages(in.get_image());

    VImage fried = (in * 1.3 - (255.0 * 1.3 - 255.0)) * 1.5;

    VImage final;
    if (totalHeight > 65500 && type == "gif") {
      vector<VImage> img;
      for (int i = 0; i < nPages; i++) {
        VImage img_frame = in.crop(0, i * pageHeight, width, pageHeight);
        void *jpgBuf;
        size_t jpgLength;
        img_frame.write_to_buffer(
            ".jpg", &jpgBuf, &jpgLength,
            VImage::option()->set("Q", 1)->set("strip", true));
        VImage jpeged = VImage::new_from_buffer(jpgBuf, jpgLength, "");
        jpeged.set(VIPS_META_PAGE_HEIGHT, pageHeight);
        jpeged.set("delay", in.get_array_int("delay"));
        img.push_back(jpeged);
      }
      final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
      final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
    } else {
      void *jpgBuf;
      size_t jpgLength;
      fried.write_to_buffer(".jpg", &jpgBuf, &jpgLength,
                            VImage::option()->set("Q", 1)->set("strip", true));
      final = VImage::new_from_buffer(jpgBuf, jpgLength, "");
      final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
      if (type == "gif")
        final.set("delay", fried.get_array_int("delay"));
    }

    void *buf;
    size_t length;
    final.write_to_buffer(("." + type).c_str(), &buf, &length,
                          type == "gif" ? VImage::option()->set("dither", 0)
                                        : 0);

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