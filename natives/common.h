#pragma once

#include <map>
#include <string>
#include <unordered_map>
#include <variant>
#include <vector>

using std::map;
using std::string;
using std::variant;

typedef variant<char*, string, float, bool, int> ArgumentVariant;
typedef map<string, ArgumentVariant> ArgumentMap;

#include "blur.h"
#include "bounce.h"
#include "caption.h"
#include "caption2.h"
#include "circle.h"
#include "colors.h"
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
#include "motivate.h"
#include "reddit.h"
#include "resize.h"
#include "reverse.h"
#include "scott.h"
#include "snapchat.h"
#include "sonic.h"
#include "speed.h"
#include "spin.h"
#include "squish.h"
#include "swirl.h"
#include "tile.h"
#include "togif.h"
#include "uncanny.h"
#include "uncaption.h"
#include "wall.h"
#include "watermark.h"
#include "whisper.h"
#include "zamn.h"

template <typename T>
T GetArgument(ArgumentMap map, string key) {
  try {
    return std::get<T>(map.at(key));
  } catch (std::bad_variant_access&) {
    throw "Invalid requested type from variant.";
  }
}

template <typename T>
T GetArgumentWithFallback(ArgumentMap map, string key, T fallback) {
  try {
    return std::get<T>(map.at(key));
  } catch (...) {  // this is, not great...
    return fallback;
  }
}

#define MAP_HAS(ARRAY, KEY) (ARRAY.count(KEY) > 0)
#define MAP_GET(ARRAY, KEY, TYPE)                 \
  (MAP_HAS(ARRAY, KEY) ? get<TYPE>(ARRAY.at(KEY)) \
                       : NULL)  // C++ has forced my hand
#define MAP_GET_FALLBACK(ARRAY, KEY, TYPE, FALLBACK) \
  (MAP_HAS(ARRAY, KEY) ? get<TYPE>(ARRAY.at(KEY)) : FALLBACK)

#define ARG_TYPES std::variant<string, bool, int, float>

const std::vector<double> zeroVec = {0, 0, 0, 0};
const std::vector<double> zeroVecOneAlpha = {0, 0, 0, 1};

const std::unordered_map<std::string, std::string> fontPaths{
    {"futura", "assets/fonts/caption.otf"},
    {"helvetica", "assets/fonts/caption2.ttf"},
    {"roboto", "assets/fonts/reddit.ttf"}};

const std::map<std::string,
               ArgumentMap (*)(string type, string* outType, char* BufferData,
                               size_t BufferLength, ArgumentMap Arguments,
                               size_t* DataSize)>
    FunctionMap = {{"blur", &Blur},
                   {"bounce", &Bounce},
                   {"caption", &Caption},
                   {"captionTwo", &CaptionTwo},
                   {"circle", &Circle},
                   {"colors", &Colors},
                   {"crop", &Crop},
                   {"deepfry", &Deepfry},
                   {"explode", &Explode},
                   {"flag", &Flag},
                   {"flip", &Flip},
                   {"freeze", &Freeze},
                   {"gamexplain", Gamexplain},
                   {"globe", Globe},
                   {"invert", Invert},
                   {"jpeg", Jpeg},
                   {"magik", Magik},
                   {"meme", Meme},
                   {"mirror", Mirror},
                   {"motivate", Motivate},
                   {"reddit", Reddit},
                   {"resize", Resize},
                   {"reverse", Reverse},
                   {"scott", Scott},
                   {"snapchat", Snapchat},
                   {"speed", &Speed},
                   {"spin", Spin},
                   {"squish", Squish},
                   {"swirl", Swirl},
                   {"tile", Tile},
                   {"togif", ToGif},
                   {"uncanny", Uncanny},
                   {"uncaption", &Uncaption},
                   {"wall", Wall},
                   {"watermark", &Watermark},
                   {"whisper", Whisper},
                   {"zamn", Zamn}};

const std::map<std::string,
               ArgumentMap (*)(string type, string* outType,
                               ArgumentMap Arguments, size_t* DataSize)>
    NoInputFunctionMap = {{"homebrew", Homebrew}, {"sonic", Sonic}};