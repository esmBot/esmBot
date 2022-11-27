#pragma once

#include <variant>
#include <string>
#include <unordered_map>

#define MAP_HAS(ARRAY, KEY) (ARRAY.count(KEY) > 0)
#define MAP_GET(ARRAY, KEY, TYPE) (MAP_HAS(ARRAY, KEY) ? get<TYPE>(ARRAY.at(KEY)) : NULL) // C++ has forced my hand
#define MAP_GET_FALLBACK(ARRAY, KEY, TYPE, FALLBACK) (MAP_HAS(ARRAY, KEY) ? get<TYPE>(ARRAY.at(KEY)) : FALLBACK)

#define ARG_TYPES std::variant<string, bool, int, float>

const std::unordered_map<std::string, std::string> fontPaths {
  {"futura", "assets/fonts/caption.otf"},
  {"helvetica", "assets/fonts/caption2.ttf"},
  {"roboto", "assets/fonts/reddit.ttf"}
};