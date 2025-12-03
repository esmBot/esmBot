#pragma once

#include <cstdint>
#include <ctime>
#include <map>
#include <string>
#include <typeindex>

#include "common/argmap.h"

struct CmdOutput {
  char *buf;
  size_t length;
};

struct FunctionArg {
  std::type_index type;
  bool required;
};

typedef const std::map<std::string, FunctionArg> FunctionArgs;

#define declare_input_func(NAME)                                                                                       \
  CmdOutput NAME(const std::string &type, std::string &outType, const char *bufferData, size_t bufferLength,           \
                 esmb::ArgumentMap arguments, bool *shouldKill)
#define declare_noinput_func(NAME)                                                                                     \
  CmdOutput NAME(const std::string &type, std::string &outType, esmb::ArgumentMap arguments, bool *shouldKill)
#define declare_input_args(NAME) extern FunctionArgs NAME;

inline uint32_t readUint32LE(const unsigned char *buffer) {
  return static_cast<uint32_t>(buffer[0]) | (static_cast<uint32_t>(buffer[1]) << 8) |
         (static_cast<uint32_t>(buffer[2]) << 16) | (static_cast<uint32_t>(buffer[3]) << 24);
}