#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Jpeg(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);

  try {
    Napi::Object obj = info[1].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    int quality = obj.Has("quality")
                      ? obj.Get("quality").As<Napi::Number>().Int32Value()
                      : 0;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();

    if (type == "gif") {
      VImage in =
          VImage::new_from_buffer(
              data.Data(), data.Length(), "",
              VImage::option()->set("access", "sequential")->set("n", -1))
              .colourspace(VIPS_INTERPRETATION_sRGB);
      if (!in.has_alpha())
        in = in.bandjoin(255);

      int width = in.width();
      int pageHeight = vips_image_get_page_height(in.get_image());
      int totalHeight = in.height();
      int nPages = vips_image_get_n_pages(in.get_image());

      VImage final;

      if (totalHeight > 65500) {
        vector<VImage> img;
        for (int i = 0; i < nPages; i++) {
          VImage img_frame = in.crop(0, i * pageHeight, width, pageHeight);
          void *jpgBuf;
          size_t jpgLength;
          img_frame.write_to_buffer(
              ".jpg", &jpgBuf, &jpgLength,
              VImage::option()->set("Q", quality)->set("strip", true));
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
        in.write_to_buffer(
            ".jpg", &jpgBuf, &jpgLength,
            VImage::option()->set("Q", quality)->set("strip", true));
        final = VImage::new_from_buffer(jpgBuf, jpgLength, "");
        final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
        final.set("delay", in.get_array_int("delay"));
      }

      void *buf;
      size_t length;
      final.write_to_buffer(("." + type).c_str(), &buf, &length,
                            type == "gif" ? VImage::option()->set("dither", 0)
                                          : 0);

      result.Set("data", Napi::Buffer<char>::Copy(env, (char *)buf, length));
      result.Set("type", type);
    } else {
      VImage in = VImage::new_from_buffer(data.Data(), data.Length(), "");
      void *buf;
      size_t length;
      in.write_to_buffer(
          ".jpg", &buf, &length,
          VImage::option()->set("Q", quality)->set("strip", true));

      result.Set("data", Napi::Buffer<char>::Copy(env, (char *)buf, length));
      result.Set("type", "jpg");
    }
  } catch (std::exception const &err) {
    Napi::Error::New(env, err.what()).ThrowAsJavaScriptException();
  } catch (...) {
    Napi::Error::New(env, "Unknown error").ThrowAsJavaScriptException();
  }

  vips_error_clear();
  vips_thread_shutdown();
  return result;
}
