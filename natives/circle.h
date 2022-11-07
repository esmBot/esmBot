#pragma once

#include <napi.h>
#include <string>
#include <map>

using std::string;
using std::map;

char* Circle(string type, char* BufferData, size_t BufferLength, map<string, string> Arguments, size_t* DataSize);