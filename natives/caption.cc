#include "common.h"
#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Caption(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string caption = obj.Get("caption").As<Napi::String>().Utf8Value();
    string font = obj.Get("font").As<Napi::String>().Utf8Value();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    string basePath = obj.Get("basePath").As<Napi::String>().Utf8Value();

    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha())
      in = in.bandjoin(255);

    int width = in.width();
    int size = width / 10;
    int pageHeight = vips_image_get_page_height(in.get_image());
    int nPages = vips_image_get_n_pages(in.get_image());
    int textWidth = width - ((width / 25) * 2);

    string font_string = "Twemoji Color Emoji, " +
                         (font == "roboto" ? "Roboto Condensed" : font) + " " +
                         (font != "impact" ? "bold" : "normal") + " " +
                         to_string(size);

    string captionText = "<span background=\"white\">" + caption + "</span>";

    VImage text;
    auto findResult = fontPaths.find(font);
    if (findResult != fontPaths.end()) {
      text = VImage::text(
          ".", VImage::option()->set("fontfile",
                                     (basePath + findResult->second).c_str()));
    }
    text = VImage::text(
        captionText.c_str(),
        VImage::option()
                                              ->set("rgba", true)
                                              ->set("align", VIPS_ALIGN_CENTRE)
                                              ->set("font", font_string.c_str())
            ->set("fontfile", (basePath + "assets/fonts/twemoji.otf").c_str())
                                              ->set("width", textWidth));
    VImage captionImage =
        ((text == (vector<double>){0, 0, 0, 0}).bandand())
            .ifthenelse(255, text)
            .gravity(VIPS_COMPASS_DIRECTION_CENTRE, width, text.height() + size,
                     VImage::option()->set("extend", "white"));

    vector<VImage> img;
    for (int i = 0; i < nPages; i++) {
      VImage img_frame =
          type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
      VImage frame = captionImage.join(
          img_frame, VIPS_DIRECTION_VERTICAL,
          VImage::option()->set("background", 0xffffff)->set("expand", true));
      img.push_back(frame);
    }
    VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
    final.set(VIPS_META_PAGE_HEIGHT, pageHeight + captionImage.height());

    void *buf;
    size_t length;
    final.write_to_buffer(
        ("." + type).c_str(), &buf, &length,
        type == "gif" ? VImage::option()->set("dither", 0)->set("reoptimise", 1)
                      : 0);

    result.Set("data", Napi::Buffer<char>::New(env, (char *)buf, length));
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
