#include "common.h"
#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Uncanny(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);

  try {
    Napi::Object obj = info[1].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string caption = obj.Get("caption").As<Napi::String>().Utf8Value();
    string caption2 = obj.Get("caption2").As<Napi::String>().Utf8Value();
    string font = obj.Get("font").As<Napi::String>().Utf8Value();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    string path = obj.Get("path").As<Napi::String>().Utf8Value();
    string basePath = obj.Get("basePath").As<Napi::String>().Utf8Value();

    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB)
            .extract_band(0, VImage::option()->set("n", 3));

    VImage base = VImage::black(1280, 720, VImage::option()->set("bands", 3));

    string font_string = (font == "roboto" ? "Roboto Condensed" : font) + ", Twemoji Color Font " +
                         (font != "impact" ? "bold" : "normal") + " 72";

    string captionText = "<span background=\"black\" foreground=\"white\">" +
                         caption + "</span>";
    string caption2Text =
        "<span background=\"black\" foreground=\"red\">" + caption2 + "</span>";

    auto findResult = fontPaths.find(font);
    if (findResult != fontPaths.end()) {
      VImage::text(
          ".", VImage::option()->set("fontfile",
                                     (basePath + findResult->second).c_str()));
    }

    VImage text = VImage::text(
        captionText.c_str(),
        VImage::option()
            ->set("rgba", true)
            ->set("align", VIPS_ALIGN_CENTRE)
            ->set("font", font_string.c_str())
            ->set("fontfile", (basePath + "assets/fonts/twemoji.otf").c_str())
            ->set("width", 588)
            ->set("height", 90));
    VImage captionImage =
        text.extract_band(0, VImage::option()->set("n", 3))
            .gravity(VIPS_COMPASS_DIRECTION_CENTRE, 640, text.height() + 40,
                     VImage::option()->set("extend", "black"));

    VImage text2 = VImage::text(
        caption2Text.c_str(),
        VImage::option()
            ->set("rgba", true)
            ->set("align", VIPS_ALIGN_CENTRE)
            ->set("font", font_string.c_str())
            ->set("fontfile", (basePath + "assets/fonts/twemoji.otf").c_str())
            ->set("width", 588)
            ->set("height", 90));
    VImage caption2Image =
        text2.extract_band(0, VImage::option()->set("n", 3))
            .gravity(VIPS_COMPASS_DIRECTION_CENTRE, 640, text.height() + 40,
                     VImage::option()->set("extend", "black"));

    base = base.insert(captionImage, 0, 0).insert(caption2Image, 640, 0);

    int width = in.width();
    int pageHeight = vips_image_get_page_height(in.get_image());
    int nPages = vips_image_get_n_pages(in.get_image());

    VImage uncanny = VImage::new_from_file((basePath + path).c_str());

    base = base.insert(uncanny, 0, 130);

    vector<VImage> img;
    for (int i = 0; i < nPages; i++) {
      VImage img_frame =
          type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
      VImage resized = img_frame.resize(690.0 / (double)width);
      if (resized.height() > 590) {
        double vscale = 590.0 / (double)resized.height();
        resized =
            resized.resize(vscale, VImage::option()->set("vscale", vscale));
      }
      VImage composited = base.insert(resized, 935 - (resized.width() / 2),
                                      425 - (resized.height() / 2));
      img.push_back(composited);
    }
    VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
    final.set(VIPS_META_PAGE_HEIGHT, 720);

    void *buf;
    size_t length;
    final.write_to_buffer(("." + type).c_str(), &buf, &length,
                          type == "gif" ? VImage::option()->set("reoptimise", 1)
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