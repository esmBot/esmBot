#pragma once

#include <string>
#include <unordered_map>

#define MAP_HAS(ARRAY, KEY) (ARRAY.count(KEY) > 0)
#define MAP_GET(ARRAY, KEY) (MAP_HAS(ARRAY, KEY) ? ARRAY.at(KEY) : NULL) // C++ has forced my hand

const std::unordered_map<std::string, std::string> fontPaths {
  {"futura", "assets/fonts/caption.otf"},
  {"helvetica", "assets/fonts/caption2.ttf"},
  {"roboto", "assets/fonts/reddit.ttf"}
};