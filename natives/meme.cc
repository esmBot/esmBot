#include "common.h"
#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Meme(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);

  try {
    Napi::Object obj = info[1].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string top = obj.Get("top").As<Napi::String>().Utf8Value();
    string bottom = obj.Get("bottom").As<Napi::String>().Utf8Value();
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
    int pageHeight = vips_image_get_page_height(in.get_image());
    int nPages = vips_image_get_n_pages(in.get_image());
    int size = width / 9;
    int dividedWidth = width / 1000;
    int rad = 1;
    vector<double> zeroVec = {0, 0, 0, 0};

    string font_string = (font == "roboto" ? "Roboto Condensed" : font) + ", Twemoji Color Font " +
                         (font != "impact" ? "bold" : "normal") +
                         " " + to_string(size);

    VImage mask = VImage::black(rad * 2 + 1, rad * 2 + 1) + 128;
    mask.draw_circle({255}, rad, rad, rad, VImage::option()->set("fill", true));

    VImage altMask;

    if (dividedWidth >= 1) {
      altMask = VImage::black(dividedWidth * 2 + 1, dividedWidth * 2 + 1) + 128;
      altMask.draw_circle({255}, dividedWidth, dividedWidth, dividedWidth,
                          VImage::option()->set("fill", true));
    }

    auto findResult = fontPaths.find(font);
    if (findResult != fontPaths.end()) {
      VImage::text(
          ".", VImage::option()->set("fontfile",
                                     (basePath + findResult->second).c_str()));
    }

    VImage topText;
    if (top != "") {
      VImage topIn = VImage::text(
          ("<span foreground=\"white\">" + top + "</span>").c_str(),
          VImage::option()
              ->set("rgba", true)
              ->set("align", VIPS_ALIGN_CENTRE)
              ->set("font", font_string.c_str())
              ->set("fontfile", (basePath + "assets/fonts/twemoji.otf").c_str())
              ->set("width", width));

      topIn = topIn.embed(rad + 10, rad + 10, (topIn.width() + 2 * rad) + 20,
                          (topIn.height() + 2 * rad) + 20);

      VImage topOutline =
          topIn.morph(mask, VIPS_OPERATION_MORPHOLOGY_DILATE)
              .gaussblur(0.5, VImage::option()->set("min_ampl", 0.1));
      if (dividedWidth >= 1) {
        topOutline =
            topOutline.morph(altMask, VIPS_OPERATION_MORPHOLOGY_DILATE);
      }
      topOutline = (topOutline == zeroVec);
      VImage topInvert = topOutline.extract_band(3).invert();
      topOutline =
          topOutline
              .extract_band(0,
                            VImage::option()->set("n", topOutline.bands() - 1))
              .bandjoin(topInvert);
      topText = topOutline.composite2(topIn, VIPS_BLEND_MODE_OVER);
    }

    VImage bottomText;
    if (bottom != "") {
      VImage bottomIn = VImage::text(
          ("<span foreground=\"white\">" + bottom + "</span>").c_str(),
          VImage::option()
              ->set("rgba", true)
              ->set("align", VIPS_ALIGN_CENTRE)
              ->set("font", font_string.c_str())
              ->set("fontfile", (basePath + "assets/fonts/twemoji.otf").c_str())
              ->set("width", width));
      bottomIn =
          bottomIn.embed(rad + 10, rad + 10, (bottomIn.width() + 2 * rad) + 20,
                         (bottomIn.height() + 2 * rad) + 20);
      VImage bottomOutline =
          bottomIn.morph(mask, VIPS_OPERATION_MORPHOLOGY_DILATE)
              .gaussblur(0.5, VImage::option()->set("min_ampl", 0.1));
      if (dividedWidth >= 1) {
        bottomOutline =
            bottomOutline.morph(altMask, VIPS_OPERATION_MORPHOLOGY_DILATE);
      }
      bottomOutline = (bottomOutline == zeroVec);
      VImage bottomInvert = bottomOutline.extract_band(3).invert();
      bottomOutline = bottomOutline
                          .extract_band(0, VImage::option()->set(
                                               "n", bottomOutline.bands() - 1))
                          .bandjoin(bottomInvert);
      bottomText = bottomOutline.composite2(bottomIn, VIPS_BLEND_MODE_OVER);
    }

    vector<VImage> img;
    for (int i = 0; i < nPages; i++) {
      VImage img_frame =
          type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
      if (top != "") {
        img_frame = img_frame.composite2(
            topText, VIPS_BLEND_MODE_OVER,
            VImage::option()->set("x", (width / 2) - (topText.width() / 2)));
      }
      if (bottom != "") {
        img_frame = img_frame.composite2(
            bottomText, VIPS_BLEND_MODE_OVER,
            VImage::option()
                ->set("x", (width / 2) - (bottomText.width() / 2))
                ->set("y", pageHeight - bottomText.height()));
      }
      img.push_back(img_frame);
    }
    VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
    final.set(VIPS_META_PAGE_HEIGHT, pageHeight);

    void *buf;
    size_t length;
    final.write_to_buffer(
        ("." + type).c_str(), &buf, &length,
        type == "gif" ? VImage::option()->set("dither", 0)->set("reoptimise", 1)
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