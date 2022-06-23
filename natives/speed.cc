#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

void *memset16(void *m, uint16_t val, size_t count) {
  uint16_t *buf = (uint16_t *)m;

  while (count--) *buf++ = val;
  return m;
}

void vipsRemove(Napi::Env *env, Napi::Object *result, Napi::Buffer<char> data,
                int speed) {
  VOption *options = VImage::option()->set("access", "sequential");

  VImage in = VImage::new_from_buffer(data.Data(), data.Length(), "",
                                      options->set("n", -1))
                  .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());

  vector<VImage> img;
  for (int i = 0; i < nPages; i += speed) {
    VImage img_frame = in.crop(0, i * pageHeight, width, pageHeight);
    img.push_back(img_frame);
  }
  VImage out = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  out.set(VIPS_META_PAGE_HEIGHT, pageHeight);

  void *buf;
  size_t length;
  out.write_to_buffer(".gif", &buf, &length);

  vips_thread_shutdown();

  result->Set("data", Napi::Buffer<char>::Copy(*env, (char *)buf, length));
}

Napi::Value Speed(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    bool slow =
        obj.Has("slow") ? obj.Get("slow").As<Napi::Boolean>().Value() : false;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int speed =
        obj.Has("speed") ? obj.Get("speed").As<Napi::Number>().Int32Value() : 2;

    Napi::Object result = Napi::Object::New(env);

    char *fileData = data.Data();

    char *match = (char *)"\x00\x21\xF9\x04";

    vector<uint16_t> old_delays;
    bool removeFrames = false;
    char *lastPos;

    int amount = 0;

    lastPos = (char *)memchr(fileData, '\x00', data.Length());
    while (lastPos != NULL) {
      if (memcmp(lastPos, match, 4) != 0) {
        lastPos = (char *)memchr(lastPos + 1, '\x00',
                                 (data.Length() - (lastPos - fileData)) - 1);
        continue;
      }
      ++amount;
      uint16_t old_delay;
      memcpy(&old_delay, lastPos + 5, 2);
      old_delays.push_back(old_delay);
      lastPos = (char *)memchr(lastPos + 1, '\x00',
                               (data.Length() - (lastPos - fileData)) - 1);
    }

    int currentFrame = 0;
    lastPos = (char *)memchr(fileData, '\x00', data.Length());
    while (lastPos != NULL) {
      if (memcmp(lastPos, match, 4) != 0) {
        lastPos = (char *)memchr(lastPos + 1, '\x00',
                                 (data.Length() - (lastPos - fileData)) - 1);
        continue;
      }
      uint16_t new_delay = slow ? old_delays[currentFrame] * speed
                                : old_delays[currentFrame] / speed;
      if (!slow && new_delay <= 1) {
        removeFrames = true;
        break;
      }
      memset16(lastPos + 5, new_delay, 1);
      lastPos = (char *)memchr(lastPos + 1, '\x00',
                               (data.Length() - (lastPos - fileData)) - 1);
      ++currentFrame;
    }

    result.Set("data", Napi::Buffer<char>::Copy(env, fileData, data.Length()));

    if (removeFrames) vipsRemove(&env, &result, data, speed);

    result.Set("type", type);
    return result;
  } catch (std::exception const &err) {
    throw Napi::Error::New(env, err.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error");
  }
}