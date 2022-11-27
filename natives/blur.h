#pragma once

#include <napi.h>

using std::string;
using std::map;

char* Blur(string type, char* BufferData, size_t BufferLength, map<string, string> Arguments, size_t* DataSize);