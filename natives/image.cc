#include <napi.h>
#include "9gag.h"
#include "bandicam.h"
#include "blur.h"
#include "blurple.h"
//#include "caption.h"
//#include "caption2.h"
#include "circle.h"
#include "deviantart.h"
#include "explode.h"
#include "invert.h"

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
  exports.Set(Napi::String::New(env, "nineGag"), Napi::Function::New(env, NineGag));
  exports.Set(Napi::String::New(env, "bandicam"), Napi::Function::New(env, Bandicam));
  exports.Set(Napi::String::New(env, "blur"), Napi::Function::New(env, Blur));
  exports.Set(Napi::String::New(env, "blurple"), Napi::Function::New(env, Blurple));
  //exports.Set(Napi::String::New(env, "caption"), Napi::Function::New(env, Caption));
  //exports.Set(Napi::String::New(env, "captionTwo"), Napi::Function::New(env, CaptionTwo));
  exports.Set(Napi::String::New(env, "circle"), Napi::Function::New(env, Circle));
  exports.Set(Napi::String::New(env, "deviantart"), Napi::Function::New(env, Deviantart));
  exports.Set(Napi::String::New(env, "explode"), Napi::Function::New(env, Explode));
  exports.Set(Napi::String::New(env, "invert"), Napi::Function::New(env, Invert));
  return exports;
}

NODE_API_MODULE(addon, Init);