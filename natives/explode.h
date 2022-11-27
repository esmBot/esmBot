#pragma once

#include <napi.h>
#include <string>
#include <map>

using std::map;
using std::string;

char* Explode(string type, char* BufferData, size_t BufferLength, map<string, string> Arguments, size_t* DataSize);