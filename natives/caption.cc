#include <iostream>
#include <vips/vips8>
#include <napi.h>

using namespace std;
using namespace vips;

/*void finalizer(Napi::Env env, char* data) {
    free(data);
}*/

Napi::Value Caption(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string caption = obj.Get("caption").As<Napi::String>().Utf8Value();
    string font = obj.Get("font").As<Napi::String>().Utf8Value();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    VImage in = VImage::new_from_buffer(data.Data(), data.Length(), "", VImage::option()
            ->set("n", -1)
            ->set("access", "sequential"))
        .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha())
        in = in.bandjoin(255);

    int width = in.width();
    int size = width / 10;
    int page_height = vips_image_get_page_height(in.get_image());
    int n_pages = vips_image_get_n_pages(in.get_image());
    int textWidth = width - ((width / 25) * 2);

    //char font_string[12 + sizeof(size)];
    //sprintf(font_string, "futura bold %d", size);

    string font_string = (font == "roboto" ? "Roboto Condensed" : font) + " " + (font != "impact" ? "bold" : "normal") + " " + to_string(size);

    string captionText =
        "<span background=\"white\">" + caption + "</span>";

    VImage text =
        VImage::text(captionText.c_str(), VImage::option()
            ->set("rgba", true)
            ->set("align", VIPS_ALIGN_CENTRE)
            ->set("font", font_string.c_str())
            ->set("width", textWidth));
    VImage captionImage = ((text == (vector<double>) {0, 0, 0, 0}).bandand())
        .ifthenelse(255, text)
        .gravity(VIPS_COMPASS_DIRECTION_CENTRE,
            width, text.height() + size, VImage::option()
            ->set("extend", "white"));

    vector<VImage> img;
    for (int i = 0; i < n_pages; i++) {
        VImage img_frame = in.crop(0, i * page_height, width, page_height);
        VImage frame = captionImage.join(img_frame,
            VIPS_DIRECTION_VERTICAL, VImage::option()
            ->set("background", 0xffffff)
            ->set("expand", true));
        img.push_back(frame);
    }
    VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
    final.set(VIPS_META_PAGE_HEIGHT, page_height + captionImage.height());

    void *buf;
    size_t length;
    final.write_to_buffer(("." + type).c_str(), &buf, &length, VImage::option()
        ->set("dither", 0));

    //vips_shutdown();
    vips_thread_shutdown();

    Napi::Object result = Napi::Object::New(env);
    result.Set("data", Napi::Buffer<char>::New(env, (char *)buf,
                                                length));
    result.Set("type", type);
    return result;
  } catch (std::exception const &err) {
    cerr << "Error: " << err.what() << endl;
    throw Napi::Error::New(env, err.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error");
  }
}
