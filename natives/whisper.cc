#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Whisper(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);

  try {
    Napi::Object obj = info[1].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string caption = obj.Get("caption").As<Napi::String>().Utf8Value();
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
    int size = width / 6;
    int dividedWidth = width / 175;
    int rad = 1;

    string font_string = "Upright, Twemoji Color Font " + to_string(size);

    VImage mask;
    if (dividedWidth >= 1) {
      mask = VImage::black(dividedWidth * 2 + 1, dividedWidth * 2 + 1) + 128;
      mask.draw_circle({255}, dividedWidth, dividedWidth, dividedWidth,
                       VImage::option()->set("fill", true));
    } else {
      mask = VImage::black(rad * 2 + 1, rad * 2 + 1) + 128;
      mask.draw_circle({255}, rad, rad, rad,
                       VImage::option()->set("fill", true));
    }

    VImage textIn = VImage::text(
        ".", VImage::option()->set(
                 "fontfile", (basePath + "assets/fonts/whisper.otf").c_str()));
    textIn = VImage::text(
        ("<span foreground=\"white\">" + caption + "</span>").c_str(),
        VImage::option()
            ->set("rgba", true)
            ->set("align", VIPS_ALIGN_CENTRE)
            ->set("font", font_string.c_str())
            ->set("fontfile", (basePath + "assets/fonts/twemoji.otf").c_str())
            ->set("width", width));

    textIn = textIn.embed(rad + 10, rad + 10, (textIn.width() + 2 * rad) + 20,
                          (textIn.height() + 2 * rad) + 20);

    VImage outline =
        textIn.morph(mask, VIPS_OPERATION_MORPHOLOGY_DILATE)
            .gaussblur(0.5, VImage::option()->set("min_ampl", 0.1));
    outline = (outline == (vector<double>){0, 0, 0, 0});
    VImage invert = outline.extract_band(3).invert();
    outline =
        outline.extract_band(0, VImage::option()->set("n", outline.bands() - 1))
            .bandjoin(invert);
    VImage textImg = outline.composite2(textIn, VIPS_BLEND_MODE_OVER);

    vector<VImage> img;
    for (int i = 0; i < nPages; i++) {
      VImage img_frame =
          type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
      img_frame = img_frame.composite2(
          textImg, VIPS_BLEND_MODE_OVER,
          VImage::option()
              ->set("x", (width / 2) - (textImg.width() / 2))
              ->set("y", (pageHeight / 2) - (textImg.height() / 2)));
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