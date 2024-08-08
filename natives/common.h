#pragma once

#include <vips/vips8>
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

void LoadFonts(string basePath);
vips::VImage NormalizeVips(vips::VImage in, string type, int *width, int *pageHeight, int nPages);
#define MapContainsKey(MAP, KEY) (MAP.find(KEY) != MAP.end())

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

const std::vector<double> zeroVec = {0, 0, 0, 0};
const std::vector<double> zeroVecOneAlpha = {0, 0, 0, 1};

const std::unordered_map<std::string, std::string> fontPaths{
    {"futura", "assets/fonts/caption.otf"},
    {"helvetica", "assets/fonts/caption2.ttf"},
    {"roboto", "assets/fonts/reddit.ttf"},
    {"ubuntu", "assets/fonts/Ubuntu.ttf"}};

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
#ifdef ZXING_ENABLED
                   {"qrread", &QrRead},
#endif
                   {"reddit", &Reddit},
                   {"resize", &Resize},
                   {"reverse", &Reverse},
                   {"scott", &Scott},
                   {"snapchat", &Snapchat},
                   {"speed", &Speed},
                   {"spin", &Spin},
                   {"spotify", &Spotify},
                   {"squish", &Squish},
                   {"swirl", &Swirl},
                   {"togif", &ToGif},
                   {"uncanny", &Uncanny},
                   {"uncaption", &Uncaption},
                   {"watermark", &Watermark},
                   {"whisper", &Whisper}};

const std::map<std::string,
               ArgumentMap (*)(const string& type, string& outType,
                               ArgumentMap arguments, size_t& dataSize)>
    NoInputFunctionMap = {{"homebrew", &Homebrew},
#if ZXING_ENABLED
    {"qrcreate", &QrCreate},
#endif
    {"sonic", &Sonic}};
