#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Motivate(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string top_text = obj.Get("top").As<Napi::String>().Utf8Value();
    string bottom_text = obj.Get("bottom").As<Napi::String>().Utf8Value();
    string font = obj.Get("font").As<Napi::String>().Utf8Value();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();

    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha()) in = in.bandjoin(255);

    int width = in.width();
    int size = width / 5;
    int page_height = vips_image_get_page_height(in.get_image());
    int n_pages = vips_image_get_n_pages(in.get_image());
    int textWidth = width - ((width / 25) * 2);

    string font_string = font == "roboto" ? "Roboto Condensed" : font;

    string topText = "<span foreground=\"white\" background=\"black\">" +
                     top_text + "</span>";

    VImage topImage = VImage::text(
        topText.c_str(),
        VImage::option()
            ->set("rgba", true)
            ->set("align", VIPS_ALIGN_CENTRE)
            ->set("font", (font_string + " " + to_string(size)).c_str())
            ->set("width", textWidth));

    VImage bottomImage;
    if (bottom_text != "") {
      string bottomText = "<span foreground=\"white\" background=\"black\">" +
                          bottom_text + "</span>";

      bottomImage = VImage::text(
          bottomText.c_str(),
          VImage::option()
              ->set("rgba", true)
              ->set("align", VIPS_ALIGN_CENTRE)
              ->set("font", (font_string + " " + to_string(size * 0.4)).c_str())
              ->set("width", textWidth));
    }

    vector<VImage> img;
    int height;
    for (int i = 0; i < n_pages; i++) {
      VImage img_frame =
          type == "gif" ? in.crop(0, i * page_height, width, page_height) : in;

      int borderSize = max(2, width / 66);
      int borderSize2 = borderSize * 0.5;
      VImage bordered =
          img_frame.embed(borderSize, borderSize, width + (borderSize * 2),
                          page_height + (borderSize * 2),
                          VImage::option()->set("extend", "black"));
      VImage bordered2 = bordered.embed(
          borderSize2, borderSize2, bordered.width() + (borderSize2 * 2),
          bordered.height() + (borderSize2 * 2),
          VImage::option()->set("extend", "white"));

      int addition = width / 8;
      int sideAddition = page_height * 0.4;

      VImage bordered3 = bordered2.embed(
          sideAddition / 2, addition / 2, bordered2.width() + sideAddition,
          bordered2.height() + addition,
          VImage::option()->set("extend", "black"));
      VImage frame = bordered3.join(
          topImage.gravity(VIPS_COMPASS_DIRECTION_NORTH, bordered3.width(),
                           topImage.height() + (size / 4),
                           VImage::option()->set("extend", "black")),
          VIPS_DIRECTION_VERTICAL,
          VImage::option()->set("background", 0x000000)->set("expand", true));
      if (bottom_text != "") {
        frame = frame.join(
            bottomImage.gravity(VIPS_COMPASS_DIRECTION_NORTH, bordered3.width(),
                                bottomImage.height() + (size / 4),
                                VImage::option()->set("extend", "black")),
            VIPS_DIRECTION_VERTICAL,
            VImage::option()->set("background", 0x000000)->set("expand", true));
      }
      height = frame.height();
      img.push_back(frame);
    }
    VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1))
                       .extract_band(0, VImage::option()->set("n", 3));
    final.set(VIPS_META_PAGE_HEIGHT, height);

    void *buf;
    size_t length;
    final.write_to_buffer(
        ("." + type).c_str(), &buf, &length,
        type == "gif" ? VImage::option()->set("dither", 1) : 0);

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
