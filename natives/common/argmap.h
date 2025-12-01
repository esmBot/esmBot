#pragma once

#include <map>
#include <string>
#include <variant>

namespace esmb {
  typedef std::variant<std::string, float, bool, int> ArgumentVariant;
  typedef std::map<std::string, ArgumentVariant> ArgumentMap;
} // namespace esmb

#define MapContainsKey(MAP, KEY) (MAP.find(KEY) != MAP.end())

template <typename T> T GetArgument(esmb::ArgumentMap map, std::string key) {
  if (!MapContainsKey(map, key)) throw "Invalid requested type from variant.";
  return std::get<T>(map.at(key));
}

template <typename T> T GetArgumentWithFallback(esmb::ArgumentMap map, std::string key, T fallback) {
  if (!MapContainsKey(map, key)) return fallback;
  return std::get<T>(map.at(key));
}
