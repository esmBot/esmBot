#include <napi.h>
#include <list>
#include "blur.h"
#include "colors.h"
#include "caption.h"
#include "caption2.h"
#include "circle.h"
#include "crop.h"
#include "deepfry.h"
#include "explode.h"
#include "flag.h"
#include "flip.h"
#include "freeze.h"
#include "gamexplain.h"
#include "globe.h"
#include "homebrew.h"
#include "invert.h"
#include "jpeg.h"
#include "magik.h"
#include "meme.h"
#include "mirror.h"
#include "swirl.h"
#include "motivate.h"
#include "reddit.h"
#include "resize.h"
#include "retro.h"
#include "reverse.h"
#include "scott.h"
#include "snapchat.h"
#include "speed.h"
#include "sonic.h"
#include "spin.h"
#include "tile.h"
#include "uncaption.h"
#include "wall.h"
#include "watermark.h"
#include "wdt.h"
#include "whisper.h"
#include "zamn.h"

#ifdef _WIN32
#include <Magick++.h>
#endif
#include <vips/vips8>

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
#ifdef _WIN32
  Magick::InitializeMagick("");
#endif
  if (vips_init(""))
        vips_error_exit(NULL);
  exports.Set(Napi::String::New(env, "blur"), Napi::Function::New(env, Blur));
  exports.Set(Napi::String::New(env, "colors"), Napi::Function::New(env, Colors));
  exports.Set(Napi::String::New(env, "caption"), Napi::Function::New(env, Caption));
  exports.Set(Napi::String::New(env, "captionTwo"), Napi::Function::New(env, CaptionTwo));
  exports.Set(Napi::String::New(env, "circle"), Napi::Function::New(env, Circle));
  exports.Set(Napi::String::New(env, "crop"), Napi::Function::New(env, Crop));
  exports.Set(Napi::String::New(env, "deepfry"), Napi::Function::New(env, Deepfry));
  exports.Set(Napi::String::New(env, "explode"), Napi::Function::New(env, Explode));
  exports.Set(Napi::String::New(env, "flag"), Napi::Function::New(env, Flag));
  exports.Set(Napi::String::New(env, "flip"), Napi::Function::New(env, Flip));
  exports.Set(Napi::String::New(env, "freeze"), Napi::Function::New(env, Freeze));
  exports.Set(Napi::String::New(env, "gamexplain"), Napi::Function::New(env, Gamexplain));
  exports.Set(Napi::String::New(env, "globe"), Napi::Function::New(env, Globe));
  exports.Set(Napi::String::New(env, "homebrew"), Napi::Function::New(env, Homebrew));
  exports.Set(Napi::String::New(env, "invert"), Napi::Function::New(env, Invert));
  exports.Set(Napi::String::New(env, "jpeg"), Napi::Function::New(env, Jpeg));
  exports.Set(Napi::String::New(env, "magik"), Napi::Function::New(env, Magik));
  exports.Set(Napi::String::New(env, "meme"), Napi::Function::New(env, Meme));
  exports.Set(Napi::String::New(env, "mirror"), Napi::Function::New(env, Mirror));
  exports.Set(Napi::String::New(env, "motivate"), Napi::Function::New(env, Motivate));
  exports.Set(Napi::String::New(env, "reddit"), Napi::Function::New(env, Reddit));
  exports.Set(Napi::String::New(env, "resize"), Napi::Function::New(env, Resize));
  exports.Set(Napi::String::New(env, "retro"), Napi::Function::New(env, Retro));
  exports.Set(Napi::String::New(env, "reverse"), Napi::Function::New(env, Reverse));
  exports.Set(Napi::String::New(env, "scott"), Napi::Function::New(env, Scott));
  exports.Set(Napi::String::New(env, "snapchat"), Napi::Function::New(env, Snapchat));
  exports.Set(Napi::String::New(env, "speed"), Napi::Function::New(env, Speed));
  exports.Set(Napi::String::New(env, "sonic"), Napi::Function::New(env, Sonic));
  exports.Set(Napi::String::New(env, "spin"), Napi::Function::New(env, Spin));
  exports.Set(Napi::String::New(env, "swirl"), Napi::Function::New(env, Swirl));
  exports.Set(Napi::String::New(env, "tile"), Napi::Function::New(env, Tile));
  exports.Set(Napi::String::New(env, "uncaption"), Napi::Function::New(env, Uncaption));
  exports.Set(Napi::String::New(env, "wall"), Napi::Function::New(env, Wall));
  exports.Set(Napi::String::New(env, "watermark"), Napi::Function::New(env, Watermark));
  exports.Set(Napi::String::New(env, "wdt"), Napi::Function::New(env, Wdt));
  exports.Set(Napi::String::New(env, "whisper"), Napi::Function::New(env, Whisper));
  exports.Set(Napi::String::New(env, "zamn"), Napi::Function::New(env, Zamn));
  return exports;
}

NODE_API_MODULE(addon, Init)
