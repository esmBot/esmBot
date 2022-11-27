#pragma once

#include <napi.h>
#include <map>
#include <string>

using std::map;
using std::string;

char* Colors(string type, char* BufferData, size_t BufferLength, map<string, string> Arguments, size_t* DataSize);