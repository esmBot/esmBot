#pragma once

#include <fontconfig/fontconfig.h>

#include <iostream>
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

#include "commands.h"

inline bool MapContainsKey(const ArgumentMap& map, const string& key)
{
  ArgumentMap::const_iterator it = map.find(key);
  return it != map.end();
}

template <typename T>
T GetArgument(ArgumentMap map, string key) {
  if (!MapContainsKey(map, key))
    throw "Invalid requested type from variant.";
  return std::get<T>(map.at(key));
}

template <typename T>
T GetArgumentWithFallback(ArgumentMap map, string key, T fallback) {
  if (!MapContainsKey(map, key))
    return fallback;
  return std::get<T>(map.at(key));
}

inline void loadFonts(string basePath) {
  // manually loading fonts to workaround some font issues with libvips
  if (!FcConfigAppFontAddDir(
          NULL, (const FcChar8*)(basePath + "assets/fonts/").c_str())) {
    std::cerr
        << "Unable to load local font files from directory, falling back to "
           "global fonts (which may be inaccurate!)"
        << std::endl;
  }
  if (!FcConfigParseAndLoad(
          FcConfigGetCurrent(),
          (const FcChar8*)(basePath + "assets/fonts/fontconfig.xml").c_str(),
          true)) {
    std::cerr
        << "Unable to load local fontconfig, some fonts may be inaccurate!"
        << std::endl;
  }
}

const std::vector<double> zeroVec = {0, 0, 0, 0};
const std::vector<double> zeroVecOneAlpha = {0, 0, 0, 1};

const std::unordered_map<std::string, std::string> fontPaths{
    {"futura", "assets/fonts/caption.otf"},
    {"helvetica", "assets/fonts/caption2.ttf"},
    {"roboto", "assets/fonts/reddit.ttf"}};

const std::map<std::string,
               ArgumentMap (*)(const string& type, string& outType, const char* bufferData,
                               size_t bufferLength, ArgumentMap arguments,
                               size_t& dataSize)>
    FunctionMap = {{"blur", &Blur},
                   {"bounce", &Bounce},
                   {"caption", &Caption},
                   {"captionTwo", &CaptionTwo},
#ifdef MAGICK_ENABLED
                   {"circle", &Circle},
#endif
                   {"colors", &Colors},
                   {"crop", &Crop},
                   {"deepfry", &Deepfry},
                   {"distort", &Distort},
                   {"flag", &Flag},
                   {"flip", &Flip},
                   {"freeze", &Freeze},
                   {"gamexplain", &Gamexplain},
                   {"globe", &Globe},
                   {"invert", &Invert},
                   {"jpeg", &Jpeg},
#ifdef MAGICK_ENABLED
                   {"magik", &Magik},
#endif
                   {"meme", &Meme},
                   {"mirror", &Mirror},
                   {"motivate", &Motivate},
                   {"reddit", &Reddit},
                   {"resize", &Resize},
                   {"reverse", &Reverse},
                   {"scott", &Scott},
                   {"snapchat", &Snapchat},
                   {"speed", &Speed},
#ifdef MAGICK_ENABLED
                   {"spin", &Spin},
#endif
                   {"spotify", &Spotify},
                   {"squish", &Squish},
                   {"swirl", &Swirl},
                   {"tile", &Tile},
                   {"togif", &ToGif},
                   {"uncanny", &Uncanny},
                   {"uncaption", &Uncaption},
#if MAGICK_ENABLED
                   {"wall", &Wall},
#endif
                   {"watermark", &Watermark},
                   {"whisper", &Whisper}};

const std::map<std::string,
               ArgumentMap (*)(const string& type, string& outType,
                               ArgumentMap arguments, size_t& dataSize)>
    NoInputFunctionMap = {{"homebrew", &Homebrew}, {"sonic", &Sonic}};
