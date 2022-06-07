#include <napi.h>

#include <iostream>
#include <list>
#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Reverse(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    bool soos =
        obj.Has("soos") ? obj.Get("soos").As<Napi::Boolean>().Value() : false;

    VOption *options =
        VImage::option()->set("access", "sequential")->set("n", -1);

    VImage in = VImage::new_from_buffer(data.Data(), data.Length(), "", options)
                    .colourspace(VIPS_INTERPRETATION_sRGB);

    int width = in.width();
    int page_height = vips_image_get_page_height(in.get_image());
    int n_pages = vips_image_get_n_pages(in.get_image());

    vector<VImage> split;
    // todo: find a better way of getting individual frames (or at least getting the frames in reverse order)
    for (int i = 0; i < n_pages; i++) {
      VImage img_frame = in.crop(0, i * page_height, width, page_height);
      split.push_back(img_frame);
    }

    vector<int> delays = in.get_array_int("delay");
    if (soos) {
      vector<VImage> copy = split;
      vector<int> copy2 = delays;
      reverse(copy.begin(), copy.end());
      reverse(copy2.begin(), copy2.end());
      copy.pop_back();
      copy2.pop_back();
      copy.erase(copy.begin());
      copy2.erase(copy2.begin());
      split.insert(split.end(), copy.begin(), copy.end());
      delays.insert(delays.end(), copy2.begin(), copy2.end());
    } else {
      reverse(split.begin(), split.end());
      reverse(delays.begin(), delays.end());
    }

    VImage final = VImage::arrayjoin(split, VImage::option()->set("across", 1));
    final.set(VIPS_META_PAGE_HEIGHT, page_height);
    final.set("delay", delays);

    void *buf;
    size_t length;
    final.write_to_buffer(".gif", &buf, &length,
                          VImage::option()->set("dither", 0));

    vips_thread_shutdown();

    Napi::Object result = Napi::Object::New(env);
    result.Set("data", Napi::Buffer<char>::Copy(env, (char *)buf, length));
    result.Set("type", "gif");
    return result;
  } catch (std::exception const &err) {
    throw Napi::Error::New(env, err.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error");
  }
}