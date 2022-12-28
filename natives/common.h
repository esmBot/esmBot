#pragma once

#include <map>
#include <string>
#include <unordered_map>
#include <variant>

using std::map;
using std::string;
using std::variant;

typedef variant<string, float, bool, int> ArgumentVariant;
typedef map<string, ArgumentVariant> ArgumentMap;

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

const std::unordered_map<std::string, std::string> fontPaths{
    {"futura", "assets/fonts/caption.otf"},
    {"helvetica", "assets/fonts/caption2.ttf"},
    {"roboto", "assets/fonts/reddit.ttf"}};